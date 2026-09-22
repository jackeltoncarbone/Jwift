# Aave Glass: how their lens is built, and what it means for Jaui

Source: https://aave.com/design/building-glass-for-the-web (read 2026-09-22), plus the shipped JavaScript
behind it (the article's playground and components), which is where every number below comes from.
Reference frame: `ShowStudio.Documentation/Design/Reference/Aave.Glass.LensMap.jpg` (result left, map right).

Jack: "for the glass. this is the key."

## The idea in one paragraph

A glass element is a LENS FIELD: a per-pixel 2D offset computed from the shape alone (size, radius,
depth, curvature), which says where each pixel under the glass reads its color from. The content is not
copied and not frosted by default; its own pixels move. The field is rebuilt only when the SHAPE changes,
never when the glass moves, so a dragged thumb costs nothing. Everything else (color fringe, highlight)
is derived from the same field.

On the web they have to bake the field into a PNG and feed `feDisplacementMap`. Jaui does not: the panel
shader already has the SDF and the normal per fragment, so the field is a few lines of analytic math there.

## The lens field (their `generate()`, quadrant-mirrored on the CPU)

For a fragment at `(x, y)` relative to the lens center, half size `(hw, hh)`, radius `r`:

1. **Shape SDF.** Rounded rect: `q = |p| - (hw, hh) + r; sdf = length(max(q,0)) + min(max(q.x,q.y),0) - r`.
   Outside (`sdf >= 0`) the offset is zero (with `sdfBoundary`, which every preset sets).
2. **Bend direction and size, per axis.**
   - Flat lens (`domeDepth` 0): `u = clamp(x / hw, -1, 1)`, `v = clamp(y / hh, -1, 1)`. A linear ramp: zero at
     the center, full at the edge.
   - Domed lens (`domeDepth` = Curvature > 0): the slope of a spherical cap of height `d` over the half width.
     `d = clamp(domeDepth, 0.01, min(hw, hh) - 1)`, sphere radius `R = (hw^2 + d^2) / (2d)`, and
     `u = sign(x) * (|x'| / sqrt(R^2 - x'^2)) * scale` with `x' = min(|x|, 0.999 R)`. `scale` normalizes the
     field so its MEAN slope over `[0, hw]` is 0.5 (numeric, 200 steps). Same for `v` with `hh`.
     Physically: a thin convex lens, gentle in the middle, steep toward the rim.
3. **Splay** (`splayAmount`, 1 = off, which is the default in every preset). Near a straight side, the
   component ALONG that side is scaled down by `(1 - splay) * max(0, 1 - distToSide / (0.5 min(hw,hh)))`,
   then the vector is rescaled back to its original length. It turns the bend toward the side's normal.
4. **Bezel falloff** (`edgeFalloff`, set in every preset). The bend is confined to a band of width `depth`
   inside the outline: `sdfInset` = the same rounded rect inset by `depth` (radius clamped), and
   `e = 0.5 * (1 + erf(sdfInset / (depth * sqrt 2)))`, where `erf(z) ~ tanh(1.7724538509 z)`. So `e ~ 0` in the
   interior, `e ~ 1` in the bezel, with a Gaussian-CDF transition centered on the inset line.
5. **Offset.** `offset = -0.5 * (u, v) * e * scaleMax * elementSize`. The sign samples INWARD: the edge
   shows content from further in, which magnifies. There is no outward band.

## The color fringe

Three reads of the same field with the offset scaled per channel: R `x (1 + 0.2 c)`, G `x (1 + 0.1 c)`,
B `x 1`. So the fringe is proportional to the displacement: zero in the flat middle, widest where the
bend is strongest. (Ours is a fixed `ca * hump * 3` px along the normal.)

## The highlight (the map's blue channel)

Two terms, both driven by the NORMALIZED POSITION `n = (clamp(x/hw), clamp(y/hh))`, not the surface normal:

- `a = |n.x cos(theta) + n.y sin(theta)|` with `theta` = Specular Angle (45 default). The absolute value makes
  it two-sided, so the light sits on TWO OPPOSITE corners (top-left and bottom-right at 45).
- **Glow**: `glowStrength * pow(clamp((a - (1 - spread) sqrt2) / (spread sqrt2)), glowExponent) * e`.
- **Edge highlight**: `edgeStrength * max(0, 1 + sdf / edgeWidth) * pow(a, edgeExponent)`: a band `edgeWidth`
  (3px) inside the outline, brightest along the light axis.
- Sum clamped to 1, stored as `b = 0.5 + 0.5 * spec`.

Applied (WebGL path): `spec = b - 0.502`; `add = c + spec * k`, `mul = c * (1 - spec * k)`, and
`c = mix(add, mul, smoothstep(lumaLo, lumaHi, luma(c)))`: the highlight BRIGHTENS on a dark backdrop and
DARKENS on a bright one, so it always reads. Then `c += (0.5 - luma) * adaptStrength * mask`, a pull toward
mid gray. The SVG path composites white at alpha `spec` (our Lift covers the dark half of this).

## The tuned numbers

| Parameter | Playground default | Component preset | Meaning |
|---|---|---|---|
| Lens | 70 x 60, radius 28 | 60 x 60, radius 30 | |
| Scale | 0.10 | 0.08 | max offset as a fraction of the element (x 0.5) |
| Depth | 10 | 8 | bezel band width, px |
| Curvature (`domeDepth`) | 40 | 60 | spherical-cap height, px; 0 = linear ramp |
| Splay | 1 | 1 | 1 = off |
| Chroma | 0.20 | 0.30 | R +20% / G +10% of the offset per unit |
| Blur | 0 | 0 | clear glass; the lens is NOT frosted |
| Glow | 0.10 | 0.15 (spread 1, exponent 0.5) | |
| Edge Highlight | 0.25 | 0.25 (width 3, exponent 1.5) | |
| Specular Angle | 45 | 45 | |
| Brightness | | 0.10 | |
| Specular strength | | 1 | |
| Map size | 512 | 512 | |

## Structure worth taking, not just math

- **Refraction target.** A lens can bend a DIFFERENT layer from the one under it. The switch thumb bends a
  copy of the track's fill, the toggle group's indicator bends a highlighted copy of the options, so the
  selected label stays legible under the lens and the lens reads as a moving highlight. This is the
  Jwift control pattern: segmented controls, the tab bar's selection, switches, sliders.
- **Shape changes rebuild, motion does not.** Their map is regenerated on resize/squish only. In Jaui the
  analytic field has no cache to invalidate, which is strictly better.
- **Press = scale the field about its center** (their video controls): the SDF radius and the field
  sample shrink together, and the annulus a shrunk lens vacates samples empty space, not the old rim.
- **One field, many renderers.** Same map drives SVG and WebGL. For Jaui: one field function in the panel
  shader, used by every glass surface.

## How it maps onto Jaui today

| Aave | Jaui now | Gap |
|---|---|---|
| Lens field: dome slope x erf bezel | bezel bands (outward 0.4 of width, inward after) + radial `bulge` `n(1 - 0.3n)` | different field; ours has an outward band at the outline (Apple-measured), theirs does not |
| Depth | `BezelWidth` | same role |
| Curvature | `Bulge` | ours is a radial zoom, not a cap slope |
| Scale | `Thickness x Refraction` | same role, different units |
| Chroma proportional to offset | `ChromaticAberration x hump x 3` px along the normal | ours is constant-size and rim-only |
| Two-corner glow + edge highlight on normalized position | Blinn-Phong bevel catchlight + rim-spec line, one-sided on `LightAngle` | different shape; theirs is two-sided |
| Adaptive add-or-darken highlight | additive / mix | theirs never vanishes on bright content |
| Clear lens, Blur 0 | frosted by default | preset choice |
| Refraction target | none (backdrop only) | new capability |
| Splay | none | new, default off |
