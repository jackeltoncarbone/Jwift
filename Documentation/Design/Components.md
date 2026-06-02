# Components — Recurring Apple-Like Patterns

Specific component behaviors that recur across Apple's apps, distilled for
Jwift. Builds on the materials and rules in [Aesthetic.md](Aesthetic.md). Deep
source research (the `Apple.MediaPlayer.*` and `Apple.Wizards` studies) is in
`../Research/Sources/`.

---

## 1. Chrome bars — tab bar & toolbar

- **Float, don't dock.** Inset from the screen edge with a gap, rounded
  (concentric) corners, Liquid Glass material, soft shadow.
- **Minimize on scroll-down, expand on scroll-up.** The bar shrinks to give
  content room, returns when the user scrolls back.
- **Tab bar in portrait/compact; sidebar in landscape/wide.** Breakpoint
  ≈ 768px. Same destinations, reflowed.
- Toolbar buttons float on the glass layer (rounded, padded from edges).
  "Done" → checkmark, "Close" → X (icon, not text).
- Height ≈ 68px (iOS-26 floating bar). Page reserves ~9em bottom padding so
  content clears it.

## 2. Buttons & controls

- **Glass buttons** — translucent, rounded; the border carries the affordance.
  No background-color change on press; use a subtle scale + specular sweep.
- **Toggles** — elongated pill, glass material, dynamic accent when on.
- **Sliders** — rounded track with Liquid Glass knob and rounded end caps.
- **Segmented controls** — glass thumb that slides between segments.
- Min tap target **44×44pt**. Action menus **anchor to the control that
  summoned them** (not always bottom); no Cancel button on phone — tap-away
  dismisses.

## 3. Sheets & detents (Maps pattern)

- **Bottom sheet with three detents:** floating (peek) → middle → full.
- **Floats with a visible gap** at the peek/middle detents; the gap closes as
  it rises to full. **Corner radius adapts per detent** (rounder when floating,
  squarer at full).
- The surface beneath stays visible through the lower detents.
- Spring expand/collapse. Swipe down or a chevron dismisses.
- Use for: the card list on phone/portrait, place/detail cards, pickers.

## 4. Popovers & menus

- Liquid Glass, soft shadow, concentric corners.
- **Anchor to the source** of the interaction; appear with a quick spring.
- Dismiss on outside tap. Pinnable into a column only when explicitly pinned
  on wide screens (e.g. the drill Library).

## 5. Transport / playback & mini-player

Directly relevant to the drill editor's **transport strip** and playback.

- **Mini transport = a pill-shaped Liquid Glass bar** that floats above the
  tab bar / bottom edge. Shows compact state (title/scrubber/play) and is the
  collapsed form of a fuller view.
  - **Window-relative, not viewport-relative** — anchor it to the app frame.
  - Swipe gestures for prev/next with haptic + a glass ripple; tap to expand.
- **Controls are horizontally centered with a max-width** (~500pt) — they do
  **not** stretch across a wide screen.
- **Scrubber/progress** is a rounded track with a glass knob and rounded end
  caps; scrubbing happens on the bar itself.
- **Full "now-playing"/expanded view:** the dominant visual (artwork → for us,
  the field) fills the surface; controls float over it as Liquid Glass and
  pick up its colors. The expanded background is a **solid color-extracted
  fill, not glass** (glass is the floating controls, not the backdrop).
- Spring transition between mini and expanded; the thumbnail grows into the
  full visual.
- **Video/canvas controls** are transparent glass that **auto-hide** after a
  few seconds of no interaction and fade back on touch — maximizing the
  content area.

*Web notes:* `backdrop-filter: blur()` for the floating bars; centered,
max-width-constrained clusters; spring-animated expand/collapse; haptics via
`navigator.vibrate()` where available.

## 6. Multimodal text input

Any long-form text input supports **three modes** in one component, and its
*value* is always plain text — the rest of the app never cares which produced
it.

1. **Type** — keyboard, default, no chrome at rest.
2. **Voice** — dictation (Web Speech API); tap-to-toggle, pulsing waveform
   while listening.
3. **Handwrite** — Pencil/stylus; ink overlays the field, recognition runs
   continuously, a concentric convert button (bottom-right) commits the text
   and clears the ink.

Mode toggles are a small, low-emphasis 3-icon cluster (keyboard / mic /
pencil) at the input's bottom-right. Affordances, not chrome. Mirrors Apple
Notes / iPadOS Scribble.

## 7. Multi-step flows — no progress chrome

Apple's HIG separates two things people conflate:

- **Progress indicators** (bar/spinner) are for *processing tasks* with a
  duration — loading, syncing, exporting. **Not** for "step 3 of 7."
- **Page-control dots** are for **short flat carousels** (3–5 equivalent
  intro screens).

So:
- **Long guided wizard** (Setup-Assistant shape — branching, 5+ steps, each
  doing something different): **no progress bar, no step counter, no dots.**
  The title and content orient the user. (iOS Setup Assistant, Watch pairing,
  iCloud/Family Sharing, Photos shared-library setup — none show progress
  chrome.) If orientation is needed, offer a table of contents from the
  step's title.
- **Short flat carousel** of equivalent screens: **page dots** are correct.

Putting a progress bar atop each wizard step misuses the pattern.
