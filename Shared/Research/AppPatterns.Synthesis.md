# App Pattern Research Synthesis — The Drill Editor Layout

Six independent research agents looked at six different categories of beloved apps. This document is the synthesis: where they agree, where they disagree, and what to actually build.

The six docs:
- `AppPatterns.AppleApps.md` — Pages, Keynote, Numbers, Maps, Music, Photos, Notes, Reminders, Calendar, GarageBand
- `AppPatterns.CreativeEditors.md` — Figma, Procreate, Final Cut, Logic, Pixelmator
- `AppPatterns.TimelineCanvas.md` — Ableton, GarageBand, Resolve, Premiere, Descript, Kapwing, CapCut
- `AppPatterns.DocumentEditors.md` — Notion, Bear, Apple Notes, Craft, Linear, iA Writer, Obsidian
- `AppPatterns.iPadCreative.md` — Procreate, Procreate Dreams, Notability, GoodNotes, Concepts, Affinity, LumaFusion, Linea, Astropad
- `AppPatterns.WebAppGold.md` — Figma, Linear, Notion, Loom, Canva, Pages vs Docs, Tldraw, Excalidraw, Cron

---

## Where every researcher agreed (the high-confidence answers)

### 1. The canvas is the app

**Every single doc said this.** Whether it's Figma's 95% canvas, Procreate's "the canvas is everything", Apple Maps' edge-to-edge map, Pages' "gets out of your way" — the universal pattern is that the content surface dominates the screen and chrome shrinks until it disappears.

For the drill editor: **the field is the canvas. It must be the dominant pixel area at all times. Nothing should box it in to a thumbnail.**

### 2. Two helpers max — never three

The Apple agent calls this the Triad: navigator, canvas, inspector. The creative editor agent calls it the four-quadrant skeleton (library + canvas + inspector + timeline) but explicitly notes the timeline is part of the canvas zone, not a separate panel. The web gold agent says "no left sidebar by default."

**The agreed-on count is two:** the canvas plus one persistent helper (a list of items) plus optionally one summoned helper (an inspector). Never three persistent panels.

### 3. The list of operations should always be visible and always draggable

Apple agent: *"The single most important lesson: the command list should always be visible and always draggable, not tucked away in a tab."* (from Keynote)

Document editor agent: every beloved doc app has a single column of items, dense, scannable, with reorder-by-drag.

Final Cut, Logic, Premiere, Resolve all show clips/regions on a permanent timeline. No one buries the list.

**For drill editor: the cards are always visible.** They are the document. The user can scan them at a glance.

### 4. Add via inline cursor, not a modal

Document editor agent: *"The user thinks 'what should happen next?' and the app responds with a blinking cursor. Zero steps between wanting-to-add and being-able-to-type."*

Apple Reminders, Notes, Notion, Linear, Bear, Craft — all have an "add row" at the bottom of the list that's always visible. Type into it. Press enter. Done.

**No modal dialogs. No type pickers before you can type. The add-card affordance is a permanent, always-visible row at the bottom of the list with a placeholder.**

### 5. Recursion = zoom, not navigation

Web gold agent: *"Recursion should be zoom, not modal — double-click a sub-drill to enter it, Esc to leave, breadcrumb shows nesting. This is Figma components + tldraw groups + Finder, and it's the correct pattern."*

Document editor agent (re Notion sub-pages): same pattern, click a reference to zoom into that drill, breadcrumbs show where you are.

**For drill editor: clicking a Drill Reference card "zooms" into that sub-drill — same UI, different content, breadcrumb in the header. Esc or back button returns.**

### 6. The most-loved interactions are direct

- Procreate: tap a marcher, drag, lift
- Procreate Dreams Perform mode: tap subject, drag while playhead rolls, keyframes record live
- Figma: tap object, drag handles, properties update
- Final Cut: tap clip, drag in timeline
- Descript: select text, hit delete, video edits

**For drill editor: tapping a marcher group on the field should select them, dragging should let you reposition them, the corresponding card should highlight in the list.** This is the bidirectional binding the Timeline+Canvas agent called "table stakes."

---

## Where the researchers disagreed (the design tensions)

### Floating vs docked panels

- **Web gold agent** (citing Figma UI3): *"Figma UI3 returned to docked panels because floating ones cramped the canvas... Figma listened and reversed course."*
- **iPad creative agent** (citing Procreate): floating tools, summoned and dismissed via gestures, are the iPad gold standard.

**Resolution:** Docked on Mac/web (Figma), floating/summoned on iPad/iPhone (Procreate). Same data, different presentation per form factor. This matches Apple's Reflow Law from the Apple agent.

### Inspector right side or popover?

- **Apple agent**: docked on Mac, floating Liquid Glass on iPad, bottom sheet on iPhone (per platform).
- **Web gold agent**: floating contextual right panel, only visible when something is selected.

**Resolution:** The right inspector is **summoned** (hidden by default) on smaller screens and **toggled** (paintbrush button) on larger ones. It is never permanently docked taking up screen real estate by default. This matches Pixelmator Pro and Pages.

### Timeline at top or bottom?

- **Timeline+canvas agent**: bottom is universal across DAWs and video editors. It's where the user expects time to live.
- **Apple agent** (re GarageBand): bottom timeline, expandable to fill screen on demand.
- **iPad creative agent** (re Dreams/LumaFusion): bottom timeline, collapsible.

**Resolution: Bottom is the answer.** Universal across every reference app.

### Show the field at all times?

- **Apple agent** (re Keynote): canvas is huge, letterboxed on dark surround.
- **Timeline+canvas agent** (re Descript): the canvas can become secondary if the editing surface is text-based. *"Steal the count sheet and make it the primary editing surface with the field as a preview."*

**This is the most interesting disagreement.** Two valid answers:
1. **Field-primary**: Keynote/Final Cut style. Field is the hero. Cards are a list on the side.
2. **Document-primary**: Descript/Notion style. The drill text/cards are the hero. Field is a preview.

The recursive drill model (everything is a drill, everything composes) leans toward document-primary because the editing happens at the *card level*, not the *field level*. You're not dragging dots — you're writing instructions. The field shows what your instructions produce.

**But** band directors are visual thinkers. They need to *see* the formation more than they need to *read* the instructions. Field-primary wins on the user side.

**Resolution: Field-primary, but the cards are the source of truth.** The field is dominant, the cards are the document. Tapping a card scrubs the field to that moment. Editing a card immediately updates the field. The relationship is bidirectional but the visual hierarchy is field-first.

---

## The opinionated answer

Combining all the research, the layout is:

```
+----------------------------------------------------------+
| ◁ Halftime Show 2026          ▶  ⊞   ●  |  <- glass top bar
+--------------+-------------------------------------------+
| Cards        |                                           |
| (always      |                                           |
|  visible,    |                                           |
|  draggable,  |              FIELD CANVAS                 |
|  scrollable) |          (letterboxed, dominant)          |
|              |                                           |
|  1 ●━━━      |                                           |
|  2 ━●━━      |                                           |
|  3 ━━●━      |                                           |
|  4 ━━━●      |                                           |
|              |                                           |
|  + Add card  |                                           |
+--------------+-------------------------------------------+
|        ▶  ━━━━━●━━━━━━━━━━━━━━  0:14 / 1:20             |  <- bottom timeline (collapsed → expandable)
+----------------------------------------------------------+
```

**Two persistent regions:**
1. **Left card list** (Keynote slide navigator pattern) — always visible, scrollable, draggable, dense like Linear, Reminders-style add-row at the bottom. Solid dark surface (content, not glass).
2. **Center field canvas** — full bleed inside the right area, letterboxed on a dark stage surround, opaque solid (Apple law: glass is for chrome only).

**One contextual helper:**
3. **Right inspector** — summoned via a paintbrush in the top bar. Floating Liquid Glass on iPad/web, docked on Mac, bottom sheet on iPhone. Only present when explicitly toggled.

**One bottom strip:**
4. **Playback timeline** — thin glass bar at the bottom showing scrubber, transport, count display. Tap to expand into a full-screen timeline view (GarageBand style, Resolve dual-timeline pattern).

**Top bar:**
5. **Liquid Glass capsule** with back, drill name, view switcher, play, inspector toggle, account.

**Library:**
6. **Summoned via the grid icon** in the top bar. Opens as a glass popover sheet. Drag any saved drill into the card list. Closes on outside click. Pinnable on wide screens (becomes a third column only when explicitly pinned).

---

## Reflow per platform

### Mac / iPad landscape / Web wide

```
[ glass top bar                             ]
[  cards   |        field        | inspector ]   <- inspector docked when toggled
[ glass bottom timeline strip               ]
```

### iPad portrait / Web narrow / tablet

```
[ glass top bar                             ]
[                                            ]
[              field                         ]
[                                            ]
[ ━ thin pull-tab ━━━━━━━━━━━━━━━━━━━━━━━ ]   <- card list pulls up from bottom (Maps detents)
[ glass bottom timeline strip               ]
```

### iPhone

```
[ glass top bar                             ]
[                                            ]
[              field                         ]
[                                            ]
[ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ]
[ Card list bottom sheet (Maps 3 detents)   ]
```

The card list lives in different places per platform, but it's **always there** — never tabbed away or hidden in a menu.

---

## The non-negotiables (drawn from cross-doc agreement)

1. **Field always dominant** — never boxed into a thumbnail
2. **Card list always visible** (or peek-visible on phone)
3. **Add row at the end of the list** — always visible, type to add, smart-detect type
4. **Tap card → field updates, field selection → card highlights** (bidirectional)
5. **Drag to reorder cards** (every Apple list does this)
6. **Recursion is zoom** — clicking a Drill ref enters it in place, breadcrumb shows where, esc returns
7. **No modal dialogs** for editing — inspector slides in
8. **Glass for chrome only** — top bar, inspector, timeline strip, library popover; field and cards stay solid
9. **One accent color** — no per-category colors
10. **`Cmd+K` command palette** — every beloved app has one, escape hatch for power users
11. **60fps scrubbing** — Timeline agent: "the smoothness of scrub is the smoothness of the product"
12. **Library is summoned, not docked** — by default. Pinnable on wide screens.

---

## The TL;DR commit

**Build Keynote for marching band drill.** Left card list always visible. Field canvas always dominant in the center. Right inspector summoned, never persistent. Bottom playback strip always there. Liquid Glass for top bar, inspector, timeline, library — never for the field or cards. Add row at the bottom of the card list with smart input. Library is a glass popover from the top bar, pinnable on wide screens. Sub-drills navigate in place with breadcrumbs. Cmd+K for everything. 60fps scrub.

Stop redesigning. Build this.
