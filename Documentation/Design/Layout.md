# Layout — How Surfaces Become an App

How to arrange the visual language from [Aesthetic.md](Aesthetic.md) into a
working app, and specifically into the **drill editor**. Distilled from six
independent app-pattern studies (Apple apps, creative editors, timeline/canvas
editors, document editors, iPad creative apps, web gold-standards) — the full
studies are archived in `../Research/Sources/`.

---

## The universal rules (every study agreed)

1. **The canvas is the app.** The content surface dominates the screen; chrome
   shrinks until it nearly disappears. → *The field is the canvas. It is the
   dominant pixel area at all times — never boxed into a thumbnail.*
2. **Two helpers max, never three.** Canvas + one persistent helper (a list)
   + optionally one *summoned* helper (an inspector). Never three persistent
   panels.
3. **The list of operations is always visible and always draggable.** Don't
   bury it in a tab. → *The cards are always visible; they are the document.*
4. **Add via an inline cursor, not a modal.** A permanent "add" row at the end
   of the list — type, press enter, done. No type-pickers, no dialogs.
5. **Recursion is zoom, not navigation.** Double-click a sub-item to enter it
   in place; breadcrumb shows nesting; Esc returns. (Figma components, tldraw
   groups, Finder.) → *Tapping a Drill Reference zooms into that sub-drill —
   same UI, different content.*
6. **The loved interactions are direct.** Tap an object, drag it, properties
   update; the list highlights in sync. → *Tap a marcher group → selects +
   highlights its card; drag → repositions.* Bidirectional binding is table
   stakes.

---

## The resolved tensions

- **Floating vs docked panels:** docked on Mac/web (Figma UI3 reversed course
  on floating), floating/summoned on iPad/iPhone (Procreate). Same data,
  per-form-factor presentation.
- **Inspector:** never permanently docked by default. **Summoned** (toggle /
  on-selection) — floating glass on iPad, docked when toggled on Mac, bottom
  sheet on iPhone.
- **Timeline position:** **bottom**, universally (every DAW and video editor).
- **Field-primary vs document-primary:** **field-primary, but the cards are the
  source of truth.** The field is the hero; the cards are the document. Tap a
  card → scrub the field to that moment; edit a card → field updates. Visual
  hierarchy is field-first; data authority is card-first.

---

## The layout

```
+----------------------------------------------------------+
| ◁  Halftime Show 2026        ▶  ⊞   ●        | ← glass top bar
+--------------+-------------------------------------------+
| Cards        |                                           |
| (always      |                                           |
|  visible,    |              FIELD CANVAS                  |
|  draggable)  |          (letterboxed, dominant)          |
|  1 ●━━━      |                                           |
|  2 ━●━━      |                                           |
|  3 ━━●━      |                                           |
|  + Add card  |                                           |
+--------------+-------------------------------------------+
|     ▶  ━━━━━●━━━━━━━━━━━━━  0:14 / 1:20      | ← glass transport (expandable)
+----------------------------------------------------------+
```

**Two persistent regions**
1. **Left card list** — Keynote slide-navigator pattern. Always visible,
   scrollable, drag-to-reorder, dense (Linear-style), with a Reminders-style
   add-row at the bottom. *Solid* dark surface (content, not glass).
2. **Center field canvas** — full-bleed in the right area, letterboxed on a
   dark stage surround. *Opaque solid* (glass is for chrome only).

**One contextual helper**
3. **Right inspector** — summoned via a toolbar button. Floating glass on
   iPad/web, docked when toggled on Mac, bottom sheet on iPhone. Present only
   when toggled.

**One bottom strip**
4. **Transport / timeline** — thin glass bar: scrubber, transport, count.
   Tap to expand into a full-screen timeline (GarageBand / Resolve dual-view).

**Top bar**
5. **Liquid Glass capsule** — back, drill name, view switcher, play, inspector
   toggle, account.

**Library**
6. **Summoned via the grid icon** — opens as a glass popover; drag saved drills
   into the card list; closes on outside click. Pinnable into a third column
   only when explicitly pinned on wide screens.

---

## Reflow per platform

**Mac / iPad landscape / wide web**
```
[ glass top bar                              ]
[  cards  |         field        | inspector ]   ← inspector docked when toggled
[ glass transport strip                      ]
```

**iPad portrait / narrow web**
```
[ glass top bar ]      field fills
[ ━ pull-tab ━ ]       ← card list pulls up from bottom (Maps detents)
[ glass transport strip ]
```

**iPhone**
```
[ glass top bar ]      field fills
[ card list bottom sheet — 3 Maps detents ]
[ glass transport strip ]
```

The card list moves per platform but is **always there** — never tabbed away.

---

## Non-negotiables

1. Field always dominant — never a thumbnail.
2. Card list always visible (peek-visible on phone).
3. Add-row at the end of the list — always visible, type to add.
4. Tap card → field updates; field selection → card highlights (bidirectional).
5. Drag to reorder cards.
6. Recursion is zoom — enter a Drill ref in place, breadcrumb, Esc returns.
7. No modal dialogs for editing — the inspector slides in.
8. Glass for chrome only — top bar, inspector, transport, library; field and
   cards stay solid.
9. One accent color — no per-category colors.
10. `Cmd/Ctrl-K` command palette — the power-user escape hatch.
11. 60fps scrubbing — "the smoothness of scrub is the smoothness of the product."
12. Library is summoned, not docked (pinnable on wide screens).

---

## TL;DR

**Build Keynote for marching-band drill.** Left card list always visible.
Field canvas always dominant in the center. Right inspector summoned, never
persistent. Bottom transport strip always there. Glass for chrome, solid for
field and cards. Add-row at the bottom with smart input. Library as a glass
popover, pinnable when wide. Sub-drills zoom in place with breadcrumbs. Cmd-K
for everything. 60fps scrub.
