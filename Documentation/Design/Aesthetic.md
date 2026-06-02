# Aesthetic — The Apple-Like Visual Language

The single reference for *how Jwift surfaces should look and feel*: Apple's
iOS / iPadOS 26 **Liquid Glass** design language, distilled into rules you can
build against (native or web). Consolidates the prior `Design.Guide`,
`Apple.Apps`, and `iOS18.vs.26` research, refreshed for June 2026 when Liquid
Glass is the shipped, App-Store-mandatory system language across iOS, iPadOS,
and macOS 26.

> Companion docs: [Layout.md](Layout.md) (how surfaces are arranged into an
> app) and [Components.md](Components.md) (specific recurring components).

---

## 1. Core philosophy

1. **Content is the app; chrome is glass that floats over it.** The content
   surface dominates; navigation shrinks until it nearly disappears.
2. **Glass is for chrome only — never for content.** Tab bars, toolbars,
   sheets, popovers, the transport strip: Liquid Glass. Cards, lists, media,
   the canvas: solid. This is the single most-broken rule; get it right.
3. **Hierarchy comes from weight, placement, and depth — not color.** The
   palette stays monochrome; one accent at most. Color is a highlight, never a
   coding system.
4. **Everything floats.** Bars, sheets, and toolbars sit *inset* from the
   screen edge with a visible gap and large continuous-curve corners — not
   pinned edge-to-edge.
5. **Surfaces respond to light and motion.** Specular borders, adaptive
   shadows, subtle scale on interaction. The screen reads as layers of
   translucent material at different depths, not a flat grid of rectangles.

---

## 2. Materials

Three material roles. Each is a superellipse (continuous-curve) shape with a
luminous border; they differ in translucency and depth.

### Liquid Glass — overlays only
Frosted, translucent, with backdrop blur, refraction, and a specular border.
For anything that *hovers over* scrolling content: tab bars, floating
toolbars, modals, sheets, dropdowns, popovers, mini-players, the transport
strip.

- Backdrop: saturate + contrast + blur chain
- Border: `rgba(255,255,255,0.3)`, soft-blurred
- Background: transparent (content shows through)
- Optional refraction/“bulge” displacement at the edges

### Solid Glass — page content
Opaque surface, same superellipse shape and luminous border, but **no**
backdrop blur or refraction. For anything in the scroll flow: cards, tiles,
list rows, hero banners, section containers.

- Background: `rgba(255,255,255,0.06)` (subtle fill, not transparent)
- Border: `rgba(255,255,255,0.12)`, soft-blurred

### Soft Shadow — depth
Adds a soft shadow for elevation. Apply to prominent elements (hero, featured
cards, the tab bar). **Skip** on dense repeated items (tight list rows) to
avoid noise.

### Which material, when
| Element | Material | Soft shadow |
|---|---|---|
| Tab bar / toolbar | Liquid Glass | Yes |
| Modal / sheet / popover | Liquid Glass | Yes |
| Dropdown / menu | Liquid Glass | Yes |
| Transport / playback strip | Liquid Glass | Yes |
| Hero banner | Solid Glass | Yes |
| Feature card | Solid Glass | Yes |
| Grid tile | Solid Glass | No |
| List row | Solid Glass | No |
| Thumbnail inside a row | plain fill | No |
| Canvas / media / field | opaque solid | No |

### Web / CSS translation (for the HTML prototype)
- **Liquid Glass:** `backdrop-filter: saturate(180%) contrast(105%) blur(20px)`
  on a transparent background, with a 1px inset light border
  (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.3)` or a blurred border
  layer) and an outer soft shadow.
- **Solid Glass:** `background: rgba(255,255,255,.06)` + the inset light border,
  no backdrop-filter.
- **Superellipse corners:** approximate with large `border-radius` (or a
  `paint()` / SVG squircle for fidelity). Pair with the concentric rule below.
- Honor `prefers-reduced-transparency` and `prefers-reduced-motion`: drop the
  blur to an opaque fill and disable specular/parallax.

---

## 3. Concentric radius system

Every radius is **derived from its parent**, never arbitrary:

```
child radius = parent radius − gap between parent edge and child edge
```

- Start from the outermost visible radius (the screen inset corners).
- Subtract the exact parent→child spacing at each nesting level.
- Applies at every level, no exceptions. If the result is < 0, use 0 (sharp).
- iOS 26 automates this with `ConcentricRectangle`; on web, compute it.

Worked example:
```
Screen inset corners:   4.0em
Page padding:           1.25em   → Level-1 radius = 2.75em
Level-1 padding:        1.25em   → Level-2 radius = 1.5em
```

**Optical padding for pills.** Wide, short, large-radius elements (hero
banners, list rows) read as pills; the curve eats the horizontal ends more
than the top/bottom. Give them **more horizontal than vertical padding** (e.g.
`1.25em 1.75em` for a `2.75em` pill). Square-ish cards use uniform padding.

Done right, every nested rounded rect shares one continuous curve with its
parent — concentric ripples, not mismatched corners.

---

## 4. Color & dark palette

Dark-mode first. Three-tier background hierarchy, never pure black/white.

- **Page background:** near-black `#0E0E0E` (OLED-comfortable). Secondary
  surfaces ~`#1A1A1A`, tertiary/emphasis ~`#262626`.
- **Text:** off-white, never `#FFF`. Four opacity tiers (primary → quaternary).
- **Contrast:** ≥ 4.5:1 for text, aim 7:1. Use slightly heavier weights in
  dark mode so thin strokes don't wash out.
- **One accent**, used sparingly. **No per-category colors.**

**Giving content identity without colored fills:**
1. **Colored glow** — an absolutely-positioned blurred blob inside a card
   (`filter: blur(3em); opacity: .4`), tinted per item; bleeds subtly through
   the glass.
2. **Tinted thumbnails** — small low-opacity color fills (e.g.
   `rgba(251,146,60,.15)`), radius via the concentric rule.
3. Surfaces themselves stay monochrome glass.

---

## 5. Typography

Apple uses **SF Pro** (Text ≤19pt, Display ≥20pt). On web, the system font
stack (`-apple-system, "SF Pro", system-ui`) gets you there.

| Role | Size | Weight | Opacity |
|---|---|---|---|
| Large title (at rest) | 2.25em / 34pt | 700 | 1.0 |
| Large title (scrolled) | 1.05em / 17pt | 600 | 1.0 |
| Section title | 1.25em / 20pt+ | 700 | 0.85 |
| Card title | 1em | 600 | 1.0 |
| Body | 0.9em / 17pt | 500 | 1.0 |
| Secondary | 0.8em / 15pt | 500 | 0.45 |
| Caption | 0.72em / 13pt | 500 | 0.35 |

- **Weight and placement carry hierarchy, not size alone.** The large title
  shrinks on scroll but stays distinct by getting heavier.
- **Sentence case, left-aligned.** No ALL-CAPS section headers; no centered
  alert text (that's the iOS-18 look).

---

## 6. Spacing

8-point grid; generous, iOS-26 breathing room.

| Between | Gap |
|---|---|
| Page edge → content | 1.25em (16–20px) |
| Sections | 0.75em top/bottom |
| Cards in a row | 0.875em |
| Tiles in a grid | 0.75em |
| List rows | 0.5em |
| Header top padding | 4em (status-bar clearance) |
| Bottom padding | ~9em (scroll clear of a floating tab bar) |

- Minimum tap target **44×44pt**.
- Featured cards ~`11em` wide × `13em` tall; tiles `aspect-ratio: 1.15`; list
  rows auto height with `0.75em 1em` padding.

---

## 7. Motion & interaction

- **Subtle scale on hover/press**, no background-color change — the glass
  border already signals state. Hero `1.01`, card `1.02`, tile `1.04`, row
  `1.01`. Transition `200–300ms cubic-bezier(.4,0,.2,1)`.
- **Specular response:** native highlights shift with device tilt; on web,
  approximate with hover/press light sweeps. Keep it whisper-quiet.
- **Adaptive shadows:** deepen over light areas, soften over dark.
- **Spring, not ease, for spatial motion** (sheets, reorders) — damped,
  no overshoot/bounce.
- Chrome **minimizes on scroll-down, expands on scroll-up**.

---

## 8. What makes it read as *26* (the iOS 18 → 26 delta)

The shorthand for "modern": if it looks like iOS 18, it looks old. The moves
that flip the read:

1. **Flat/opaque → Liquid Glass** on all chrome.
2. **Docked → floating** tab bars and toolbars (inset, rounded, gap from edge).
3. **Moderate → extreme corner radii**, automatically concentric.
4. **Compact → generous** spacing.
5. **ALL-CAPS centered → sentence-case left-aligned** headers.
6. **Solid/bordered → glass** buttons, pill toggles, glass sliders.
7. **Edge-pinned → floating** sheets with a visible mid-detent gap and
   radius that adapts per detent.
8. **Static → adaptive** shadows and motion-reactive highlights.
9. **Bottom-placed search / actions** for thumb reach; action menus anchor to
   the control that summoned them.

---

## 9. Anti-patterns (the vibe check)

If a screen looks like any of these, something's wrong:

- **"Gray-box city"** — every surface the same box/size/weight. → Vary sizes,
  add a hero, add glows, build hierarchy.
- **"2019 dark dashboard"** — opaque rectangles, no border glow. → Use Solid
  Glass with its luminous border, not a raw fill.
- **"Candy store"** — too many hues. → Color is accent only (glows,
  thumbnails); surfaces stay monochrome glass.
- **"Flat paper"** — no depth or layering. → Soft shadows on prominent
  elements, Liquid Glass on overlays, concentric radii for nesting.
- **"iOS 15"** — opaque docked tab bar, sharp corners, flat nav. → Floating
  glass tab bar, superellipse corners everywhere, concentric radii.

The goal: every surface catches light differently through its glass; the page
feels like translucent layers at different depths.
