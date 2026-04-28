# Apple First-Party App Patterns — Research for Show Studio Drill Editor

**Date:** 2026-04-06
**Context:** Show Studio is a marching band drill editor targeting macOS, iPadOS, iOS, and web. Apple is the explicit design north star. This document studies the apps Apple users love most, identifies the layout patterns behind that affection, and proposes what Apple's own design team would build if handed the drill-editor problem.

The analysis is opinionated on purpose. The goal is to commit to one clear direction, not to list every option.

---

## Framing: Why Apple Apps Feel Different

Apple's productivity apps share a handful of non-negotiable traits that keep recurring across Pages, Keynote, Numbers, Maps, Notes, and GarageBand:

1. **The content is the interface.** Chrome shrinks until the document/map/song/photo is the dominant visual. Toolbars are thin, inspectors hide, sidebars collapse.
2. **One primary surface, at most two helpers.** Never three panels fighting for attention. The canvas plus (optionally) a navigator on one edge and an inspector on the other. That's it.
3. **Inspectors are contextual, not modal.** Selecting a thing reveals the properties for that thing in the same persistent location. No dialogs popping over the canvas.
4. **The same mental model across Mac, iPad, iPhone.** The layout reflows, but the navigator/canvas/inspector triad maps to three-pane, two-pane, or single-pane respectively. Users feel at home instantly.
5. **The most-used action is always one tap from rest.** Add a slide, drop a pin, new note, new reminder — always a single visible affordance, never buried.
6. **Liquid Glass (iOS 26 / macOS 26) is used for overlays only.** Toolbars, sheets, popovers, tab bars. The document canvas itself stays opaque and calm. This is explicitly in line with our [Jwift iOS 26 design guide](../feedback_ios26_design_guide.md).

Keep this list in mind when reading each app study below. Every app rehearses the same five or six ideas.

---

## Pages — iWork Word Processor

### Default Layout
Open Pages on iPad or Mac and you see a single, centered document on a neutral gray background. No sidebar is open by default on iPad. On Mac, a collapsed thumbnail sidebar is available but hidden on first launch of a blank document. The toolbar at top is thin: undo/redo, view menu, insert, table, chart, text, shape, media, comment, share, and a circular Format (paintbrush) button on the far right that toggles the inspector.

### Panels and Sidebars
- **Left (optional):** Page thumbnails / Table of Contents navigator. Collapsible. Off by default.
- **Right (on demand):** Format inspector. Toggled by the paintbrush icon. Contextual — its tabs (Style, Text, Arrange) change based on what is selected.
- **Bottom:** Nothing persistent. A contextual keyboard-accessory bar appears on iPad when editing text.

### iPad vs Mac vs iPhone
- **Mac:** Three-pane capable (navigator / canvas / inspector), but defaults to canvas-only.
- **iPad:** Same triad. Inspector slides in from the right as a floating panel in iPadOS 17+, becomes a true Liquid Glass floating inspector in iPadOS 26.
- **iPhone:** Canvas fills the screen. Inspector becomes a bottom sheet invoked from the paintbrush. Navigator becomes a full-screen modal.

### Most-Used Actions
- **Type** — zero taps, keyboard is already there.
- **Format selection** — one tap on paintbrush, then contextual controls.
- **Insert image/table/chart** — one tap on a dedicated toolbar icon.

Reviewer sentiment worth quoting: Pages is repeatedly described on Mac forums as *"the word processor that gets out of your way"* — this is the phrase used again and again, and it is the single highest compliment the drill editor should chase.

### iOS 26 / Liquid Glass Impact
The top toolbar became a floating Liquid Glass capsule. The format inspector on iPad floats rather than docks, with a frosted background that shows the document faintly beneath. The canvas itself stayed solid white paper — Apple very deliberately did not glass-ify the document.

---

## Keynote — The Closest Analog to a Drill Editor

This is the most important app in this study. Keynote's left-slides / center-canvas / right-inspector triad is almost exactly the structure a drill editor needs: an ordered sequence of items, a canvas that renders the selected item, and contextual properties for what you are editing.

### Default Layout
- **Left sidebar:** Slide navigator. Vertical list of slide thumbnails, numbered, with the selected slide highlighted. Drag to reorder. Right-click or long-press for duplicate/delete/skip/group. This sidebar is **open by default** — unlike Pages. Keynote's whole identity is the slide list.
- **Center:** The slide canvas. Huge. Letterboxed on a dark gray background (#2a2a2a-ish) that makes the slide pop. This dark surround is important — it signals "this is a stage" and it's what makes Keynote feel premium.
- **Right inspector:** Collapsed by default on iPad, open by default on Mac in most users' muscle-memory configuration. Contextual: when nothing is selected it shows slide-level properties (background, transition, slide number). When a text box is selected it shows text styling. When a shape is selected it shows fill/border/shadow/arrange.
- **Top toolbar:** Thin. Play, Add Slide (+), Insert, Table, Chart, Text, Shape, Media, Comment, Collaborate, Document, Format (inspector toggle), Animate.

### Panels and Sidebars — Specifics
The slide navigator on the left has three states on iPad: hidden, thumbnail list, outline view. On Mac you also get a light-table view and a "skipped slides" collapsed bar. The inspector on the right has **tabs at its top** that change based on selection — Style / Text / Arrange is the classic triad.

### iPad vs Mac vs iPhone
- **Mac:** True three-pane. All three visible at once on any reasonable monitor. Sidebar and inspector are resizable.
- **iPad:** Three-pane in landscape on 11"+. Inspector floats as a Liquid Glass panel in iPadOS 26 rather than docking. In portrait, the slide navigator collapses to a thin strip with thumbnails and the inspector becomes a summoned floating panel.
- **iPhone:** Single pane. Slide navigator is a horizontal strip at the bottom (filmstrip style). Inspector is a bottom sheet. Canvas dominates.

### Most-Used Actions
- **Add slide:** One tap. The `+` at bottom of the slide navigator on iPad/Mac; a big floating action on iPhone.
- **Duplicate slide:** One tap (context menu) or drag with option.
- **Reorder:** Drag in sidebar. Zero-friction on all platforms.
- **Edit text:** Double-tap text box.
- **Change transition:** Select slide, inspector → Animate tab, tap Add Effect. Two taps.

Reviewer sentiment: *"Keynote makes PowerPoint feel like a database form."* The specific thing users love is that the slide list is **always visible and always draggable** — there is no "slide sorter" mode you toggle into. Sorting is the primary view. This is the single most important lesson for Show Studio: **the command list should always be visible and always draggable, not tucked away in a tab.**

### iOS 26 / Liquid Glass Impact
The toolbar is now a floating glass capsule. The inspector on iPad detaches from the right edge and becomes a floating, drag-positionable Liquid Glass panel. The slide navigator stayed docked — Apple did not float it. The dark stage surround stayed opaque dark gray. This is a clear signal from Apple: **the navigator and the canvas stay solid; only the overlay/inspector becomes glass.** Exactly what our design guide already says.

---

## Numbers — iWork Spreadsheets

### Default Layout
Numbers is the outlier in iWork because it has a **canvas-within-canvas** model: each "sheet" is an infinite gray board, and tables/charts are free-floating objects on it rather than the sheet itself being one gigantic grid (Excel's model). When you open Numbers you see the gray board with one small, titled table in the upper-left. A tab bar at the top shows sheets. No sidebar by default.

### Panels and Sidebars
- **Top:** Sheet tabs (like Excel, but rounder and lighter).
- **Right (on demand):** Format inspector, same paintbrush pattern as Pages/Keynote.
- **Left:** None by default. A navigator-style sheet/table list exists on Mac as an optional left sidebar.

### iPad vs Mac vs iPhone
Same triad logic. On iPhone, sheet tabs become a dropdown. Editing a cell on iPhone invokes a full-height numeric/text keyboard with formula bar on top — this is one of Numbers' signature features and worth stealing conceptually: **when you focus on a specific object, the UI should rearrange to serve that object.**

### Most-Used Actions
- **Enter data:** Tap cell, type. Zero-tap once you're in the table.
- **Add row/column:** Tap the handle at the table edge. One tap.
- **Format cell:** Select, paintbrush, one tap.

### iOS 26 / Liquid Glass Impact
Top toolbar and inspector became floating glass. Sheet tabs stayed solid. The infinite-board gray background stayed opaque.

### Takeaway for Show Studio
Numbers' free-floating tables on a gray board is a useful mental model for a drill editor's **field canvas**: the field is the table, the board around it is scrollable/pannable dead space. This justifies a letterboxed field on a neutral surround rather than a field that fills every pixel.

---

## Apple Maps — The Bottom Sheet Masterclass

### Default Layout
Map fills the entire screen, edge to edge. A single persistent bottom sheet covers the lower third, containing the search field, favorites, guides, and recents. That's it. No top bar. No left sidebar. The map is the product.

### Panels and Sidebars
- **Bottom sheet:** The whole UI. It has three detents: peek (just the search field), medium (~half screen, shows favorites and guides), and full (covers the map for detailed browsing). Users drag to switch. Detents are smooth, spring-animated, and exhibit Apple's signature rubber-band overshoot.
- **Top-right floating buttons:** Compass, 3D toggle, layers. These are small circular Liquid Glass buttons floating on top of the map.
- **No left sidebar on any platform.**

### iPad vs Mac vs iPhone
- **iPhone:** Bottom sheet as described above.
- **iPad:** The bottom sheet becomes a **left-docked floating sidebar** in landscape and returns to a bottom sheet in portrait. Same content, different edge. This is one of Apple's cleverest reflows and a pattern worth copying.
- **Mac:** Left sidebar, always docked. Same content.

So: the same panel lives at the bottom on iPhone, the left on iPad landscape, the left on Mac. **The panel's content never changes; only its position and presentation change.** This is the single most important insight from Maps for a cross-platform app.

### Most-Used Actions
- **Search:** Zero taps, the field is right there in the peek state.
- **Get directions:** Search result → big blue Directions button. Two taps.
- **Drop a pin:** Long-press on map.

Reviewer sentiment: *"The bottom sheet is so good I wish every iOS app used it."* Maps basically canonized the detented bottom sheet as the modern iOS primary navigation pattern.

### iOS 26 / Liquid Glass Impact
Maps is the flagship Liquid Glass showcase. The bottom sheet is now a thick frosted glass with real-time refraction of the map beneath. The floating top-right buttons are perfect circular glass pills. The search bar glows subtly. **However**, the map tiles themselves stayed solid — again confirming that glass is overlay-only.

### Takeaway for Show Studio
Use a Maps-style docked/detented panel for the command list on iPhone (bottom sheet) and iPad portrait (bottom sheet), and reflow it to a left sidebar on iPad landscape, Mac, and web. Same content, edge changes by form factor.

---

## Apple Music — Now Playing, Library, Browse

### Default Layout
- **iPhone:** A bottom tab bar (Home, New, Radio, Library, Search) with the Now Playing mini-player docked just above it. Content fills the rest.
- **iPad:** A left sidebar replaces the tab bar. Now Playing mini-player docks at the bottom of the sidebar.
- **Mac:** Identical to iPad — left sidebar, bottom-of-sidebar mini-player. This Mac/iPad parity is intentional and users love it.

### Now Playing Expansion
Tap the mini-player and it expands into a full-screen Now Playing sheet with album art, scrubber, lyrics toggle, queue, AirPlay, and playback controls. Swipe down to dismiss. This is a **sheet-over-content** pattern rather than a navigation push.

### Most-Used Actions
- **Play a song:** Tap it. One tap.
- **Queue next:** Long-press, "Play Next." Two taps.
- **Search:** Tap Search tab, type. Two taps.

### iOS 26 / Liquid Glass Impact
The tab bar became a floating glass capsule that shrinks when you scroll (major iOS 26 pattern — tab bars that auto-minify). The mini-player sits above it also in glass. Album art behind Now Playing gets a subtle gradient bloom. The library list rows themselves stayed solid.

### Takeaway for Show Studio
The **docked-mini / expanded-sheet** pattern is gold for the drill editor's playback controls. A thin strip at the bottom of the canvas showing play/pause/scrubber/current time, which expands into a full timeline scrubber with all drill commands when tapped. This is exactly how Music handles the Now Playing → full player transition.

---

## Photos — Grid, Detail, Edit

### Default Layout
A dense grid of square thumbnails fills the screen. At the bottom on iPhone, a tab bar: Library / For You / Albums / Search. In iOS 18+ Apple collapsed all of this into a single unified timeline with a floating bottom pill of category shortcuts — controversial but important because it shows Apple pushing toward "one view, contextual pill" even at the expense of discoverability.

### Detail and Edit
Tap a thumbnail → full-screen detail view with a filmstrip scrubber at the bottom and a tiny toolbar (info, favorite, edit, share, delete). Tap Edit → the whole UI transforms into a dedicated editing mode with a tool rail at the bottom (Adjust, Filters, Crop) and contextual sliders. Done returns to detail.

This **mode transition** (browse → detail → edit) is worth studying because each mode is committed — not a bunch of panels layered on top of each other.

### iPad vs Mac vs iPhone
Same grid/detail/edit progression. On iPad and Mac the grid can be a split view with a left sidebar of albums.

### Most-Used Actions
- **Browse:** Scroll. Zero taps.
- **Favorite:** Tap heart in detail. One tap.
- **Edit crop:** Tap, Edit, Crop. Three taps.

### iOS 26 / Liquid Glass Impact
The detail-view toolbar became a floating glass strip. The filmstrip scrubber stayed solid. Edit mode stayed mostly opaque because you need color accuracy.

### Takeaway for Show Studio
Edit mode is a full-commitment context switch, not a panel overlay. When a user opens a drill command card for detailed editing, consider replacing the canvas with an edit-specific view rather than showing the edit form as a sidebar alongside the normal canvas. Or, more likely for our case: keep the canvas, but have the right inspector fully commit to that command's properties and make it clear you are in an edit context.

---

## Notes — Lists, Attachments, Drawing

### Default Layout
- **iPhone:** Folders → Notes list → Note detail. A three-level navigation stack.
- **iPad:** Three-pane split view: Folders (left) / Notes list (middle) / Note detail (right). Classic Apple three-column.
- **Mac:** Same three-pane.

### Panels
- **Left (Mac/iPad):** Folders sidebar, collapsible.
- **Middle (Mac/iPad):** Notes list with preview snippets.
- **Right (Mac/iPad) or full screen (iPhone):** The note itself.

### Most-Used Actions
- **New note:** The pencil-on-paper icon, bottom-right corner, always visible. One tap.
- **Add checklist:** Toolbar button in keyboard accessory. One tap.
- **Draw:** Toolbar button invokes PencilKit overlay.

### iOS 26 / Liquid Glass Impact
Keyboard accessory toolbar is now a glass strip. Sidebars stayed solid. The note paper stayed solid.

### Takeaway for Show Studio
Three-pane split view is the canonical Apple pattern for "browse a hierarchy → see items in that container → edit one item." It maps well to **Drill Library → Drills in that library → Commands in the selected drill** — but that's a different navigation than the **active editing** flow, so we would only use three-pane for the library browser, not the editor itself.

---

## Reminders — Lists, Smart Features

### Default Layout
- **iPhone:** A grid of smart-list tiles (Today, Scheduled, All, Flagged, Completed) at the top, followed by user lists below. Tap any tile → list view with reminders and a `+ New Reminder` row at the bottom.
- **iPad/Mac:** Left sidebar with the same smart tiles and user lists, right pane with the selected list's reminders.

### Most-Used Actions
- **New reminder:** Always visible `+ New Reminder` row at the bottom of any list. One tap, then type. This is the crown jewel — **the add affordance is embedded in the content, not in a toolbar.** You don't hunt for the `+`. It is where your eye is already going.
- **Complete:** Tap the circle. One tap.
- **Set date:** `i` info button → date row. Two taps.

### iOS 26 / Liquid Glass Impact
Smart tile grid got a subtle glass effect. Sidebar stayed solid.

### Takeaway for Show Studio
**Embed the "Add Command" affordance as the last row of the command list**, exactly like Reminders embeds `+ New Reminder` as the last row of every list. Do not put the add button only in the toolbar. This is probably the single highest-leverage UX decision in the whole app.

---

## Calendar — Different Views

### Default Layout
- **iPhone:** Year → Month → Day progressive disclosure. Tap a day, see events. Tap an event, see detail.
- **iPad:** Multi-mode view switcher at top — Day / Week / Month / Year. Left sidebar lists calendars (toggleable). Main area shows the selected view.
- **Mac:** Same. Toolbar with view switcher, left sidebar with calendar list, main content area.

### Panels
- **Left:** Calendar list (which calendars to show). Toggleable via a button. Closed by default in newer versions.
- **Top:** View switcher segmented control.
- **Right:** Inspector for the selected event (Mac only).

### Most-Used Actions
- **New event:** `+` in top-right, one tap. Or long-press a time slot in Day/Week view — zero-taps from the view.
- **View today:** "Today" button, one tap.
- **Switch view:** Segmented control, one tap.

### iOS 26 / Liquid Glass Impact
Top toolbar became glass. View switcher got the segmented-control glass treatment. The grid itself stayed solid for readability.

### Takeaway for Show Studio
The **view switcher segmented control at the top** is the right pattern for toggling between Show Studio's possible views (e.g., Field view / Timeline view / Outline view). Segmented control, glass, top-center or top-left.

---

## GarageBand — Mobile DAW

GarageBand is the most directly instructive app in this study because it solves the same structural problem the drill editor has: **an ordered sequence of time-based events on a canvas, with per-event properties, on both touch and desktop.**

### Default Layout — Song Editor Mode
- **Top toolbar:** Navigation (back to instruments), view toggles, undo, settings, play controls (rewind, play, record), master volume, loop, song section, FX, mixer toggle, settings.
- **Left track header column:** Each track shows its instrument icon, name, solo/mute buttons, and volume slider. This is a vertical list — **conceptually identical to Keynote's slide navigator, rotated 90° to become track rows.**
- **Center timeline canvas:** Horizontal ruler at top, tracks below, with clip rectangles (regions) on each track. This is where you drag, trim, and arrange clips.
- **Bottom (contextual):** When you tap a region, a contextual action bar appears with Cut / Copy / Paste / Loop / Split / Rename / Delete. This is a **summoned** toolbar, not persistent.
- **Right:** No persistent inspector. Double-tap a region to open a full-screen editor (piano roll for MIDI, waveform for audio). This is a **full-screen modal edit**, similar to Photos' edit mode.

### Panels and Sidebars
GarageBand is deliberately **two-pane only** on iPad: tracks left, timeline right. No right inspector. Properties are accessed by double-tapping into a dedicated editor mode. This is a different philosophy than Keynote — it trades inspector persistence for canvas maximization. For touch-first apps Apple clearly prefers this.

### iPad vs Mac vs iPhone
- **iPhone:** Same two-pane, scaled down. Track header column is narrower.
- **iPad:** Two-pane, glorious.
- **Mac (Logic Pro is the Mac analog):** Adds a right inspector and a bottom editor pane. More panels, because more screen.

### Most-Used Actions
- **Record:** Big red circle in top toolbar. One tap.
- **Play:** Big triangle. One tap.
- **Add track:** `+` button in track header area. One tap.
- **Edit region:** Double-tap. One gesture.

### iOS 26 / Liquid Glass Impact
Top toolbar is a big glass strip. Playhead became a glass line with a slight glow. Track headers stayed solid. The timeline ruler stayed solid. Regions themselves stayed solid colored rectangles — editing clarity wins over aesthetics.

### Takeaway for Show Studio
This is the single most structurally relevant app. GarageBand tells us:
1. **Tracks/items on the left in a vertical list** is the right pattern for an ordered sequence that is edited on a time-ish canvas.
2. **Contextual toolbars summoned by selection** beat persistent right inspectors for touch-primary apps.
3. **Full-screen edit mode on double-tap** is acceptable and even preferred for deep editing.
4. **The canvas gets the most pixels.** Always.

---

## Cross-App Synthesis: The Apple Pattern Language

Pulling common threads from all ten apps:

### The Triad (Navigator / Canvas / Inspector)
Every productivity app is some variant of:
- **Navigator** (left, sometimes bottom on phone): an ordered or hierarchical list of "things you can select."
- **Canvas** (center, always dominant): the single selected thing, rendered at maximum size.
- **Inspector** (right, sometimes bottom sheet on phone): the properties of whatever is selected.

Apple reflows this triad aggressively by form factor but **never abandons it**. The drill editor must commit to this triad.

### The Reflow Law
Same content, different edge:
- **iPhone:** navigator = bottom sheet or bottom tab strip. Inspector = summoned bottom sheet. Canvas = full screen.
- **iPad portrait:** navigator = bottom sheet or left strip. Inspector = floating glass panel summoned.
- **iPad landscape / Mac / Web:** navigator = docked left sidebar. Canvas = center. Inspector = docked or floating right panel.

### The Add Affordance Law
Every Apple app places the primary "add" action in exactly one place, always visible, always one tap. Keynote: `+` at bottom of slide navigator. Reminders: `+ New Reminder` row embedded in the list. Notes: pencil-on-paper in bottom-right. Calendar: `+` in top-right. **Pick one, commit, never hide it.**

### The Glass Law
Liquid Glass is for overlays only. Toolbars, floating panels, summoned sheets, tab bars, popovers. The canvas, the navigator rows, and the content-critical surfaces stay solid. This matches our [Jwift iOS 26 design guide](../feedback_ios26_design_guide.md) exactly.

### The Concentric Law
Every nested container has a corner radius of `parent_radius - gap`. This is already our [extreme concentric design](../feedback_concentric_design.md) rule and it's the single most-copied Apple visual trait across iOS 26.

### The Restraint Law
No per-category colors. No decorative accents. Monochrome content, single accent color for interaction state only. This matches our [no per-category colors](../feedback_no_category_colors.md) rule.

---

## What Would Apple's Design Team Build for Show Studio?

Here is the opinionated answer. Apple would build this.

### The Core Layout (iPad landscape, Mac, Web)

```
 +---------------------------------------------------------------+
 | [< Back]   Show Name / Drill Name       [Play ▶] [Inspector] |   <- glass toolbar
 +------------+------------------------------------+-------------+
 |            |                                    |             |
 |  Commands  |                                    |  Properties |
 |  ────────  |                                    |  ─────────  |
 |  1. Halt   |                                    |  Counts: 16 |
 |  2. F Mk 8 |          [FIELD CANVAS]            |  Step: 8-5  |
 |  3. MarkT. |                                    |  Dir: North |
 |  4. Block  |        (letterboxed, solid)        |             |
 |  5. Box    |                                    |             |
 |  6. Arc    |                                    |             |
 |  ─ + Add ─ |                                    |             |
 |            |                                    |             |
 +------------+------------------------------------+-------------+
 |  [◀◀]  [▶]  [▶▶]     ▬▬▬●▬▬▬▬▬▬▬▬     00:14 / 01:20          |   <- playback strip
 +---------------------------------------------------------------+
```

### The Specific Decisions

1. **Left sidebar: the command list.** Always visible on iPad landscape, Mac, Web. Vertical list of command cards, each showing command name, counts, and a tiny preview glyph. Drag to reorder. Selected command highlighted with the accent color. **Last row is always `+ Add Command`** — Reminders-style. Do not hide this affordance in a toolbar.

2. **Center: the field canvas.** Letterboxed on a neutral dark surround (Keynote's stage gray). Field is the hero. Nothing else fights for attention. The canvas shows the **current state of the drill at the selected command**, not a timeline of all commands at once.

3. **Right inspector: contextual properties.** Collapsed by default on iPad landscape and Web, open by default on Mac. Toggled by a paintbrush/inspector icon in the top toolbar. When a command is selected in the left sidebar, this panel shows that command's properties (counts, step size, direction, references). When nothing is selected, shows drill-level metadata.

4. **Top toolbar: thin Liquid Glass capsule.** Back, title (editable), view switcher (Field / Timeline / Outline), play, add, inspector toggle, share. Nothing else. If you're reaching for a sixth item you're wrong.

5. **Bottom strip: playback controls.** GarageBand + Apple Music hybrid. Thin, glass, persistent. Play/pause/scrub/current count/total counts. Tap to expand into a full-screen timeline with all commands visible as regions (GarageBand-style).

6. **No per-category colors on command cards.** Monochrome. Accent color only for selected state and for interactive feedback.

### iPad Portrait Reflow

- Left sidebar collapses into a **summoned left sheet** that slides out from the left edge. A thin strip shows the currently selected command's number and name. Tap to expand.
- Right inspector becomes a **floating Liquid Glass panel** summoned by the paintbrush button. Drag-positionable.
- Canvas takes the full width.
- Bottom playback strip stays.

### iPhone Reflow

- The command list becomes a **Maps-style bottom sheet** with three detents: peek (shows current command name + `+` button), medium (shows list of commands), full (covers most of the screen with drag-to-reorder). This is the single most important mobile decision.
- Inspector is summoned as a secondary bottom sheet from the paintbrush button. Replaces the command list sheet when open.
- Canvas fills the rest of the screen.
- Playback strip docks just above the command-list peek sheet — Apple Music mini-player style.

### Reusable Named Drills

This is the hardest-to-place feature. Apple's answer would be: **treat named drills like Pages' styles or Keynote's master slides.**

- A named drill is a **reference object** that appears in a dedicated "Library" browser reached by tapping the Show Name in the top toolbar (Pages-style "Documents" browser returning to the library).
- From the library, you can open a named drill standalone to edit it.
- Inside a show, you reference a named drill by **adding a command of type "Drill Reference"** that picks from the library. In the left sidebar the command card shows the referenced drill's name and an "open in new tab/window" icon. Tapping the icon opens the named drill in its own editor (new window on Mac, modal push on iPad/iPhone).

This is exactly how Keynote handles master slide editing — you drill into a special edit context for the master, changes propagate, you return. Users already know this pattern.

### The One-Tap Actions

- **Add command:** tap `+ Add Command` row at bottom of command list. One tap.
- **Play drill:** tap play in bottom strip. One tap.
- **Reorder:** drag in command list. One gesture.
- **Edit command properties:** tap command → inspector auto-populates. One tap.
- **New named drill:** in the library, tap `+`. One tap.

### What Apple Would Explicitly NOT Do

- Would not put the command list in a tab bar as a separate "Commands" tab. The list must be visible simultaneously with the canvas.
- Would not use per-category colors for command cards.
- Would not use a ribbon toolbar. Thin glass capsule only.
- Would not show a timeline as the default view. The field canvas is the default. Timeline is a secondary view toggle.
- Would not open command editing in a modal dialog over the canvas. Inspector on the right, always same location.
- Would not hide the `+ Add Command` in a menu. Always visible as the last row.
- Would not glass-ify the field canvas itself. The field stays solid.
- Would not have three sidebars. Two max (left navigator + right inspector), and on smaller screens only one at a time is visible.

---

## The One-Sentence Summary

**Show Studio should be Keynote for marching band drill: left sidebar of draggable command cards with an embedded `+ Add` row, center field canvas letterboxed on a dark stage surround, contextual right inspector that pops in as Liquid Glass on iPad and docks on Mac, GarageBand-style bottom playback strip, and a Maps-style bottom sheet reflow on iPhone — with reusable named drills handled as library references in the Keynote master-slide tradition.**

Commit to this. Build it. Don't add a third panel.
