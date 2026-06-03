# VisionOS — The Spatial Layer

Companion to [Aesthetic.md](Aesthetic.md) / [Layout.md](Layout.md) /
[Components.md](Components.md). Those define the iOS-26 Liquid-Glass language on a
**flat** screen. This doc adds the **spatial** dimension Apple Vision Pro /
visionOS brings — and which the Jaui Three renderer now makes real on a normal
screen: actual depth (z), glass that samples a 3D world, dynamic lighting,
inline interactive 3D objects.

> The flat rules still hold. visionOS doesn't replace them — it *lifts them off
> the page*. "Pixels on a page" → "objects in a room." Apple. Minimal.
> Innovative. Clean.

Sources: Apple HIG "Designing for visionOS" + Materials; think.design,
supercharge.design, SAP Fiori-for-visionOS guides (June 2026).

---

## 1. Core spatial principles

1. **Objects in a room, not pixels on a page.** Surfaces are panes of glass at
   different *depths*, lit by a shared environment — not a flat grid of rects.
2. **Depth communicates hierarchy.** Foreground = focus; recede deprioritized
   surfaces along **−z**. A modal/popover comes *toward* the viewer; the page
   behind it pushes back and dims. (We have a real depth buffer — use it.)
3. **One calm environment.** A single dark, softly-lit space. Content floats in
   it. No busy backgrounds; the room is the canvas.
4. **Glass reflects the environment.** Chrome glass samples what's behind/below
   it (our blur pyramid already does this) and catches the scene light.
5. **Respond to attention instantly.** Hover (eye/pointer) lights an element the
   moment it's targeted — a specular bloom + slight lift toward the viewer.

## 2. Material & depth (concrete)

- **Windows/cards = glass panes at depth.** Same superellipse + luminous border
  as flat, but each sits at a small **+z** off the backdrop with a soft contact
  shadow, so it reads as floating, not painted on.
- **Z-layering offsets** (device-px, our world units): backdrop 0 · content
  cards +8–16 · chrome (nav/toolbar/transport) +24–40 · popover/modal +60–90.
  These are small but real — perspective + the depth buffer do the rest.
- **Ornaments** (floating toolbars/nav) overlap their window's edge by ~**20pt**
  and sit slightly proud in z, anchoring visually.
- **Specular + contact shadow** on every floating element's upper edge / under-
  side — the depth cue that says "this is above the surface."
- **Hover = lift + bloom**: on target, scale ~1.04 AND nudge **+z toward the
  viewer** with a brighter specular sweep. (Our `:Hover` predicate + VisualScale
  + the scene light give this for free.)

## 3. Typography & legibility on glass

- **White / off-white text, bolder weights than flat iOS** — glass backgrounds
  vary in luminance, so weight buys contrast. Never pure `#FFF`; never thin.
- Keep the flat type scale (Sizing.md) but bias **+1 weight step** for anything
  sitting directly on glass over the 3D world.
- **≥4pt spacing** between interactive elements (eye-tracking / pointer drift).

## 4. Targets & comfort

- **Hit target ≥ 60×60pt** (visionOS eye-tracking; bigger than flat's 44). The
  visible control can be smaller; pad the hittable area.
- **Critical content centered** — comfortable eye-line, not the far corners.
- **Tab/nav ≤ 6 destinations.** (Show Studio: Home · Shop · Library — well under.)

## 5. How it maps to our engine

| visionOS idea | Jaui mechanism |
|---|---|
| Glass window sampling the room | `LiquidGlass` material + blur pyramid backdrop |
| Depth layering / recede on deprioritize | `Space:World` + `VisualTranslate z` + depth buffer |
| Inline 3D objects in the UI | `Model3D` / `RotationView` (drop a model in a Jiv) |
| Environment lighting on glass + models | shared scene light (`SetLight`) + atmospheric fog |
| Hover lift + bloom | `:Hover` predicate (`VisualScale` + specular) |
| Contact shadow / floating | `Shadow*` + small `+z` elevation |

## 6. For Show Studio Home (the spatial redesign)

- A **calm dark room** (deep near-black, faint depth gradient). Everything floats.
- **Floating glass nav** (sidebar ≥768 / bottom tab <768), inset with a gap,
  rounded concentric, slightly proud in z — NOT a docked flush panel.
- **Featured hero** = an inline 3D stage (the field/formation) sitting *in* the
  room at depth, the dominant object; glass caption floats over it.
- **Content rows** = Solid-Glass cards floating at a shallow +z, hover-lift,
  concentric radii derived from the screen inset.
- **One accent** (blue). Identity via colored glows + tinted thumbnails, never
  colored chrome. Crisp text, bolder weights.
- Scrolls vertically; the nav stays floating and minimizes on scroll-down.
