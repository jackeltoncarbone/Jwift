# Jwift Design Guide: Building iOS 26 Interfaces

Practical rules for building pages and components with Jwift that feel like native iOS 26.
See `JwiftAppleAppResearch.md` and `JwiftiOS18vs26Research.md` for the underlying research.

---

## Materials

Jwift has two glass materials. Both use Box's superellipse clip path and luminous border system. They differ only in whether they see through themselves.

### Liquid Glass (`LiquidGlass` class)
Frosted translucent material with backdrop blur, refraction, and specular border. **Overlays only.**

Use for: tab bars, floating toolbars, modals, dropdowns, bottom sheets, popups, mini-players — anything that hovers over scrolling content.

CSS properties it sets:
- `--backdrop`: saturate/contrast/blur chain
- `--border-color`: `rgba(255, 255, 255, 0.3)` with `--border-blur`
- `--refraction-thickness` / `--surface-bulge`: displacement map distortion
- `--background`: transparent (content shows through)

### Solid Glass (`SolidGlass` class)
Opaque surface with the same superellipse shape and luminous border, but no backdrop-filter, no refraction. **Page content.**

Use for: cards, tiles, list rows, hero banners, section containers — anything that sits in the scroll flow.

CSS properties it sets:
- `--background`: `rgba(255, 255, 255, 0.06)` (subtle fill, not transparent)
- `--border-color`: `rgba(255, 255, 255, 0.12)` with `--border-blur`
- No `--backdrop`, no `--refraction-thickness`, no `--surface-bulge`

### SoftShadow (`SoftShadow` class)
Adds `--shadow-color` and `--shadow-blur` for depth. Apply to prominent elements (hero, featured cards, tab bar). Skip on dense repeated items (list rows in a tight group) to avoid visual noise.

### When to use which
| Element | Material | SoftShadow |
|---------|----------|------------|
| Tab bar | LiquidGlass | Yes |
| Modal / sheet | LiquidGlass | Yes |
| Dropdown / popup | LiquidGlass | Yes |
| Floating toolbar | LiquidGlass | Yes |
| Hero banner | SolidGlass | Yes |
| Feature card | SolidGlass | Yes |
| Grid tile | SolidGlass | No |
| List row | SolidGlass | No |
| Thumbnail inside a row | Plain Box | No |

---

## Concentric Radius System

Every `--border-radius` value must be derived from its parent, never arbitrary. The rule:

```
child radius = parent radius - gap between parent edge and child edge
```

### Worked example (current defaults)

```
Screen inset corners:      4em      (set on <inset-corners>)
Page padding from edge:    1.25em
  -> Level 1 elements:     2.75em   (4 - 1.25)

Level 1 padding:           1.25em
  -> Level 2 elements:     1.5em    (2.75 - 1.25)
```

### Rules
- Start from the outermost visible radius (screen inset corners).
- Subtract the exact spacing between parent edge and child edge at each nesting depth.
- This applies at every level, no exceptions.
- If the computed radius would be < 0, use 0 (sharp corners) — this naturally happens at deep nesting.
- All radii go through Box's `--border-radius` property so they render as superellipses, not CSS `border-radius` circles.
- Never set `border-radius` in raw CSS on elements inside a Box. Box handles its own clip path.

### Optical padding for pill-shaped elements
Wide, short elements (hero banners, list rows) with large `--border-radius` are effectively pill-shaped. The superellipse curve eats into the horizontal edges more than the vertical edges. To make the content feel optically centered inside the pill:

- **Horizontal padding must be larger than vertical padding.** The curve is tighter at the left/right ends, so content needs more room there.
- Rule of thumb: if vertical padding is `1.25em`, horizontal padding should be ~`1.75em` for a `2.75em` radius pill.
- Square-ish elements (tiles, cards) can use uniform padding because the curve is even on all sides.

```
Pill-shaped (hero, list rows):   --padding: 1.25em 1.75em;
Square-ish (cards, tiles):       --padding: 1.25em;
```

The test: content at the far left/right edge of a pill should have the same *visual* breathing room as content at the top/bottom — even though the CSS values differ. If the right-side content looks squeezed against the curve, the horizontal padding is too small.

### What it looks like when done right
Every nested rounded rect appears to share a single continuous curve with its parent — like concentric ripples in water. If two adjacent edges have radii that don't visually "nest," something is wrong. Content inside pills floats with equal visual air on all sides.

---

## Page Anatomy

A typical iOS 26 Jwift page follows this structure top-to-bottom:

```
<div class="Page">            ← scrollable container, padding: 0 1.25em 9em
  <header>                     ← greeting + large title
    <span class="Greeting">    ← subtle, low opacity (0.4), small
    <span class="LargeTitle">  ← 2.25em, bold, tight letter-spacing
  </header>

  <section>                    ← hero / continue-where-you-left-off
    <box class="SolidGlass SoftShadow">
  </section>

  <section>                    ← featured cards (horizontal scroll)
    <span class="SectionTitle">
    <div class="CardRow">      ← flex, gap, overflow-x: auto
      <box class="SolidGlass SoftShadow"> per card
    </div>
  </section>

  <section>                    ← grid tiles (3-col)
    <span class="SectionTitle">
    <div class="TileGrid">     ← CSS grid, 3 columns
      <box class="SolidGlass"> per tile
    </div>
  </section>

  <section>                    ← list rows
    <span class="SectionTitle"> + <span class="SectionLink">
    <box class="SolidGlass">   per row
  </section>
</div>

<nav>                          ← floating tab bar (fixed, centered)
  <box class="LiquidGlass SoftShadow">
</nav>
```

### Section titles
- `font-size: 1.25em`, `font-weight: 700`, `letter-spacing: -0.02em`
- `opacity: 0.85` — present but not shouting
- Padding below title: `0.75em`

### Bottom padding
- Page needs `9em` bottom padding so content scrolls above the floating tab bar.

---

## Color and Identity

### Background
- Page background: `#0E0E0E` (near-black, set on `<body>`)
- Never pure black. Never pure white text.

### How cards get identity without colored backgrounds
Cards stay on Solid Glass (subtle white fill). To give individual cards personality:

1. **Colored glow** — a `<div>` positioned absolute inside the card, large border-radius, `filter: blur(3em)`, `opacity: 0.4`. Color is per-card (warm orange for drill, indigo for music, green for fields). The glow bleeds through the glass subtly.

```html
<box class="Card SolidGlass SoftShadow">
    <div class="CardGlow" [style.background]="card.Glow"></div>
    <span class="CardIcon">{{ card.Icon }}</span>
    ...
</box>
```

```css
.CardGlow {
    position: absolute;
    top: -2em;
    right: -2em;
    width: 8em;
    height: 8em;
    border-radius: 50%;
    filter: blur(3em);
    opacity: 0.4;
    pointer-events: none;
}
```

2. **Tinted thumbnails** — small colored squares inside list rows. Use low-opacity color fills (e.g. `rgba(251, 146, 60, 0.15)`), radius follows concentric rule.

3. **No per-category color coding** — keep the overall palette monochrome. Color is accent, not system.

### Text hierarchy
| Role | Size | Weight | Opacity |
|------|------|--------|---------|
| Large title | 2.25em | 700 | 1.0 |
| Section title | 1.25em | 700 | 0.85 |
| Card title | 1em | 600 | 1.0 |
| Body | 0.9em | 500 | 1.0 |
| Caption / secondary | 0.72-0.8em | 500 | 0.35-0.45 |
| Section link ("See all") | 0.85em | 500 | 0.4 |

---

## Spacing

### Gaps between elements
| Between | Gap |
|---------|-----|
| Sections | `0.75em` padding top/bottom |
| Cards in a row | `0.875em` |
| Tiles in grid | `0.75em` |
| List rows | `0.5em` |
| Page edge to content | `1.25em` |
| Header top padding | `4em` (status bar clearance) |

### Card sizing
- Featured cards: `min-width: 11em`, `height: 13em`, `flex-shrink: 0`
- Tiles: `aspect-ratio: 1.15`, fill grid column
- List rows: auto height, `--padding: 0.75em 1em`

---

## Hover / Interaction

All interactive glass elements scale slightly on hover. Keep it subtle:

| Element | Hover scale |
|---------|------------|
| Hero | `1.01` |
| Card | `1.02` |
| Tile | `1.04` |
| List row | `1.01` |

Transition: `200-300ms cubic-bezier(0.4, 0, 0.2, 1)` — set via `--transition` on the Box.

No background color changes on hover. The scale is enough. The glass border already provides visual feedback.

---

## Multimodal text input

Any long-form text input in Jwift apps supports **three input modes** in
one component:

1. **Type** — keyboard. Default. No extra chrome at rest.
2. **Voice** — dictation via Web Speech API. Tap-to-toggle, pulsing
   waveform indicator while listening.
3. **Handwrite** — Apple Pencil / stylus. Ink overlays the input;
   recognition runs continuously under the covers so the input's
   *value* is always text. A convert button appears bottom-right of the
   input (concentric with it) when ink is present — tap it to commit
   the recognized text and clear the ink layer.

Mode toggles live as a small cluster (3 icons: keyboard / mic / pencil)
at the bottom-right corner of the input. Subtle, low-emphasis. Never
distracts from typing — they're affordances, not chrome.

The input's *value* is always plain text. The rest of the app never has
to care which mode produced it.

This pattern matches how Apple Notes / iPadOS Scribble work natively,
extended to web with the equivalent JS APIs.

---

## Multi-step wizards: no progress chrome

For guided multi-step setup flows (Setup-Assistant-shape: 5+ steps,
branching, each step doing something different) **do not show a
progress bar, step counter, or page dots**. The title and content
orient the user. Apple's own setup flows (iOS Setup Assistant, Apple
Watch pairing, iCloud, Family Sharing, Photos shared library) have
no orientation chrome at all.

Page dots are only correct for **short flat carousels of equivalent
intro screens** (3-5 swipeable pages). Progress bars, per HIG, are
strictly for tasks with a duration that's processing (loading,
syncing, exporting) — not for "you are 3 of 7 questions in." Putting
one on a wizard step is misusing the pattern.

If users need orientation, surface a Table of Contents reachable from
the step's title — not a chrome indicator.

See `Apple.Wizards.md` for the underlying research and sources.

---

## Anti-Patterns (The Vibe Check)

If the page looks like any of these, something is wrong:

- **"Open world city game with no NPCs"** — every surface is the same gray box, same size, same weight. Fix: vary card sizes, add glows, use a hero element, create hierarchy.
- **"2019 dark-mode dashboard"** — solid opaque rectangles with no border glow. Fix: use SolidGlass with its luminous border, not raw `--background`.
- **"Candy store"** — too many colors, every card a different hue. Fix: color is accent only (glows, thumbnails). Surfaces stay monochrome glass.
- **"Flat paper"** — no depth, no shadow, no layering. Fix: SoftShadow on prominent elements, Liquid Glass on overlays, concentric radii creating visual nesting.
- **"iOS 15"** — opaque tab bar, flat navigation, sharp corners. Fix: floating LiquidGlass tab bar, superellipse corners everywhere, concentric radii.

The goal: every surface catches light differently through its glass. The page feels like layers of translucent material at different depths, not a flat grid of rectangles.
