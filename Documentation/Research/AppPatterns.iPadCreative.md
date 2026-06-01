# iPad Creative App Patterns — Research for a Drill Editor

> Deep study of the iPad apps creative professionals universally love, synthesized
> into concrete UX recommendations for a marching-band drill editor that lives on
> an iPad on the sideline.

The drill editor has a fundamentally iPad-shaped problem: a band director stands
on a football field, in the sun, with no keyboard, holding a slab of glass, and
needs to **look at the field**, **tap a marcher**, **edit a list of commands**,
and **scrub through time**. That is exactly the set of problems Procreate,
LumaFusion, Notability, and friends have already solved — just for different
content. This document extracts what they do, why it works, and what we should
steal.

---

## 1. Procreate — the gold standard

Procreate has won the Apple Design Award twice and is routinely described as
"the gold standard for digital drawing and painting." It has a 4.4-star rating
across roughly 38,000 App Store ratings and is one of the most-loved iPad apps
ever shipped.

### The philosophy: "the canvas is everything"

Procreate's core design conceit is that **the canvas occupies the entire
screen, all the time**. There is no sidebar, no persistent toolbar strip, no
inspector. The chrome is reduced to two slim strips: a top bar with Gallery /
Actions / Adjustments / Selection / Transform on the left and Brush / Smudge /
Erase / Layers / Colors on the right, plus a floating vertical brush-size and
opacity slider on the left edge. Everything else is summoned and then vanishes.

From Procreate's own documentation: *"Procreate's gestures keep your focus on
the canvas and out of menus, speed up your workflow, and even enable artists
with limited movement to create more easily."* That sentence is the north star.
Menus are a failure mode; the gesture is the real interface.

### How tools appear and disappear

- **Tap** a top-bar icon (Brush, Layers, Colors) — a popover slides in from the
  icon, anchored near it, and dismisses as soon as you tap the canvas.
- **Brush-size slider** — always visible as a thin vertical rail on the left
  edge, but it is *so* thin and unobtrusive it reads as part of the bezel. Drag
  the puck to resize; tap the small + button on the puck to lock it to a
  recent value.
- **Color picker** — tap the color disc in the top-right, a floating disc
  hovers above the canvas. Tap anywhere to dismiss.
- **QuickMenu** — a radial menu of 6 user-configurable shortcuts, invoked by
  a single gesture (one-finger tap, pencil squeeze, or four-finger tap). Users
  can maintain multiple QuickMenu profiles per workflow.
- **QuickShape** — draw a rough circle / line / rectangle and hold at the end;
  Procreate snaps it to a clean vector shape. Lift and tap "Edit Shape" to
  fine-tune.
- **Eyedropper** — touch-and-hold anywhere on the canvas to pick a color from
  under your finger.

### Gestures (the part users memorize and love)

| Gesture | Action |
|---|---|
| One finger | Paint (with finger) |
| Two-finger pinch | Zoom in/out |
| Two-finger twist | Rotate canvas |
| Two-finger tap | **Undo** |
| Two-finger tap-hold | Rapid undo (steps back until released) |
| Three-finger tap | **Redo** |
| Three-finger swipe down | Cut/Copy/Paste menu |
| Four-finger tap | Toggle full-screen (hides all chrome) |
| Pencil tap on side | Switch brush / eraser (Pencil Pro) |
| Touch-and-hold | Eyedropper |

The four-finger tap is worth pausing on: Procreate already hides its chrome
down to two thin strips, and *still* gives you a gesture to hide those. That
is how seriously they take "the canvas is everything."

### What users universally praise

From App Store reviews and third-party reviews:
- *"Simple and easy to use interface"* that makes *"drawings and design 100
  times easier"* (App Store)
- *"A great amount of features and it's easy to use and understand"* (App Store)
- Reviewers call it *"the gold standard for digital drawing and painting"* and
  *"Still The Best iPad Art App"* (SlashGear, 2026)
- The gesture system is the single most praised aspect — artists describe
  memorizing the gestures once and then "forgetting the app is there"

### Lack-of-keyboard handling

- Numeric entry: sliders, not fields. Brush size, opacity, jitter, scatter —
  everything is a continuous drag with a tiny numeric readout that you can tap
  to open a keypad if you insist.
- Naming a layer or file: tap the layer name, an inline text field expands
  with a keyboard. This is the *only* time a keyboard appears.
- Color selection: disc / classic / harmony / value / palette tabs, never RGB
  text fields by default.

---

## 2. Procreate Dreams — gesture-first animation

Dreams ships a different answer to the same question: how do you animate
without a mouse? Its answer is a **timeline you touch directly**.

### Layout
- The **Stage** (canvas) fills the top ~60% of the screen.
- The **Timeline** is a horizontal track area at the bottom, with the playhead
  as a vertical bar.
- A slim tool strip along the very top mirrors Procreate's restraint.
- The timeline itself *dynamically reveals time-scale information depending on
  zoom level* — zoomed out you see scenes, zoomed in you see frames.

### The three modes (this is the key insight)

Dreams 2 restructured around three dedicated timeline modes:

1. **Compose** — position and edit content without disrupting keyframes.
   The "safe" mode for layout.
2. **Perform** — record motion live. Tap-and-drag on the Stage and Dreams
   records your motion as keyframes in real time, as the playhead moves. Lift
   your finger to pause.
3. **Keyframe** — manually edit individual keyframes on the timeline.

*"Performing records keyframes in real-time using gestures... Tap and drag
anywhere on the stage to move your content and begin performing, and lift your
finger or Apple Pencil at any time to pause Performing."*

**This is directly relevant to drill editing.** A drill is a time-indexed set
of marcher positions. "Perform mode" for drill means: tap a marcher, drag them
across the field as the count advances, lift to stop. That is closer to how a
director thinks ("go from A to B in 16 counts") than any spreadsheet.

### Timeline gestures
- Two-finger pan → scroll timeline (and Stage)
- Two-finger pinch → zoom timeline horizontally (time scale)
- **Three-finger vertical slide → zoom timeline vertically** (track height)

Note: horizontal pinch for time, vertical three-finger for track density.
Two different axes, two different gestures, no mode switch.

---

## 3. Notability — the audio-synced notebook

### Layout
- Single-pane note, full-screen.
- A slim **floating tool ribbon** at the top center: pen, highlighter, eraser,
  lasso, text, shape, media. Taps show a secondary ribbon underneath with
  color / thickness / style.
- Library / documents sidebar slides in from the left and can be pinned or
  dismissed.

### The thing everyone loves: audio-synced notes

*"Notability can sync recordings to both handwritten and typed notes, with
playback animating your handwriting per pixel, so it looks like you're
rewriting your notes."*

You tap any word or stroke in your notes and audio jumps to the exact moment
you wrote it. For a drill editor, the analog is obvious: tap a command in the
sequence, the playhead and field jump to that count.

### Touch interactions
- Pencil draws, finger scrolls (default, toggleable).
- Two-finger pan/pinch for zoom.
- Lasso-select strokes, then drag, resize, recolor, or convert to text.

### Lack-of-keyboard handling
- Handwriting with OCR — write "Set 12", Notability indexes it as searchable
  text without ever opening a keyboard.
- Audio + AI transcription — dictation is a first-class input, not a fallback.

---

## 4. GoodNotes 6 — the prosumer notebook

### Layout
- Document with **tabs at the top** (multi-document workspace).
- A **floating compact toolbar** of pens, highlighter, eraser, lasso, shape,
  text, and image. Sidebar available for Documents / Favorites / Search /
  Share / Marketplace but hidden by default.
- The page fills the screen.

### Touch interactions
- Draw a circle around an object with the Pencil → tap to select it (smart
  lasso integrated with the Pencil).
- Two-finger scroll, pinch to zoom.
- Handwriting recognition everywhere — search across all notebooks in your
  own handwriting.

### Universally praised
- Best-in-class handwriting feel: *"Writing in GoodNotes 6 seems the best it
  has ever been in the app."*
- Handwriting math → typed equations.
- AI can replace words in your own handwritten font — a detail that signals
  obsessive attention to the core interaction.

---

## 5. Concepts — infinite vector canvas

### Layout
- **Infinite canvas** at the core. No page boundary, no artboard by default.
- **Tool Wheel** — a radial palette floating at the edge of the canvas holding
  8 tools + undo + redo. Each slice is user-configurable. Drag it to any edge;
  if you prefer, drag it off and it converts to a linear Tool Bar.
- **Color wheels** instead of swatches — HSL, RGB, COPIC, all circular.

### Key insight
Concepts is the clearest example of **letting the user customize the tool
layout**. The Tool Wheel is a user-owned palette, not a vendor-owned toolbar.
For a drill editor, this matches how different directors want different
"default commands" a tap away (one wants FM/BM/BT, another wants Follow The
Leader / Pinwheel / Countermarch).

### Touch interactions
- Pencil draws vectors; every stroke remains editable forever.
- Tap-hold on a stroke → Select; drag to move, pinch to scale, twist to rotate.
- **Slice** tool cuts strokes at a gesture.
- **Nudge** moves selection by fractional amounts via tiny drags.

### Lack-of-keyboard handling
- Numeric parameters are all sliders and wheels.
- Layer names get a keyboard; everything else is direct manipulation.

---

## 6. Affinity Designer 2 — the desktop-class outlier

### Layout
- More traditional than Procreate: persistent left tool column, right studio
  panels (layers, color, stroke, transform). This is the one app in the list
  that brings the desktop layout to the iPad.
- **Personas** — workspace presets that swap the entire tool and panel layout
  (Vector Persona vs. Pixel Persona vs. Export Persona). A tap switches the
  whole environment.

### Touch interactions
- Two-finger tap → **Undo**
- Three-finger tap → **Redo**
- One or two fingers held on the screen act as **Shift / Alt modifiers** —
  you hold a finger down to constrain a drag. This is the iPad answer to
  modifier keys.
- Pinch to zoom, two-finger pan.

### Why it's in the list despite being "desktop-like"
The *persona* concept is directly useful: a drill editor has fundamentally
different modes (draw formation, choreograph transition, rehearse playback,
print charts). Personas say "mode switch is fine as long as it's big and
obvious and the UI is completely honest about which mode you're in."

### Criticism
Reviewers consistently note that Affinity's sheer density is the price it
pays for desktop parity. Procreate hides 99% of itself; Affinity shows it
all. Directors on a field will prefer Procreate's answer.

---

## 7. LumaFusion — the touch-timeline gold standard

LumaFusion is *"built from the ground up for a touch-first interface,
defining the gold standard for editing usability."* It is to video timelines
what Procreate is to canvas.

### Layout
- **Preview** top-left (the viewer).
- **Media library / effects / titles** top-right (tabbed panel).
- **Timeline** across the full bottom half — up to 6 video + 6 audio tracks.
- Timeline is **magnetic on track 1** (delete a clip, neighbors snap to
  close the gap) but **track-based above** (you can stack B-roll, audio,
  titles on their own rows).

### Touch interactions
- **Drag and drop is everywhere.** Drag from media library to timeline, drag
  clips to reorder, drag edges to trim, drag playhead to scrub.
- Tap a clip to select; secondary tap opens an inspector panel *over* the
  preview area with tabs for Audio, Color, Effects, Speed, Frame &amp; Fit.
- Pinch the timeline to change time scale.

### Universally praised
- *"The timeline is best-in-class with the ease of a magnetic timeline and
  the control of a track-based timeline, all in one experience."*
- *"Dragging and dropping is pretty much ubiquitous throughout the interface,
  which isn't surprising since it's designed for touch, and it works
  exceedingly well."* (TechRadar / ProVideo Coalition)

### Honest criticism
- *"Some things like precise trimming don't translate well to touch as it's
  just a bit too imprecise."* This is the one universal iPad weakness: frame-
  accurate or count-accurate editing needs a **nudge affordance** (± buttons,
  a jog wheel, or an "enter value" tap-target) alongside the drag.

---

## 8. Linea Sketch — the minimalist

### Layout
- Tool panels sit **at screen edges** — left column = tools, right column =
  colors, top = layers. Each panel is a slim strip you reach for.
- Canvas fills the middle.
- ZipShapes (draw + hold to snap to a clean shape) mirror Procreate's
  QuickShape.

### Philosophy
From MacStories: *"Every control is designed to stay out of your way until
you need it, putting the focus on your creations."*

Linea's contribution to this document is the principle of **deliberately
small tool counts**. They shipped fewer brushes than Procreate on purpose.
For a drill editor this maps to: don't expose 40 commands; expose 8 and let
everything else live in a search / picker.

### Reviews
*"For newcomers wanting an elegant, uncomplicated sketching tool, there's
very little else on iPad or iPhone that gets the balance right to the same
degree as Linea Sketch."* (Cult of Mac)

---

## 9. Astropad Studio — the Mac bridge

Not a creative app per se — it mirrors a Mac onto an iPad so you can Pencil
into Photoshop, Illustrator, Blender, etc.

### Relevance to us
- Reports a **2 ms wired response time**, 4–5 ms over Wi-Fi. This sets the
  bar for "does it feel native": under 10 ms pencil latency.
- **Quick Keys** — a floating, customizable palette of keyboard shortcuts
  that hovers over the Mac display. This is Astropad's answer to the
  "no keyboard" problem: they built a visual keyboard shortcut bar.
- **Custom pressure curves and gesture remapping** per app.

The takeaway: even when the underlying app assumes a keyboard, the iPad
layer ships a **floating shortcut palette** so you never type. A drill
editor should ship the same — a floating "command strip" of the 8 most-used
drill commands, draggable to any edge, like Concepts' Tool Wheel.

---

## Synthesis — what makes an iPad creative app feel right

Across nine apps a consistent set of principles emerges:

### 1. The canvas is sovereign
Every app that is universally loved treats the canvas / stage / page as the
entire screen and treats chrome as a failure. Procreate reduces chrome to two
thin strips. Linea hides panels at the edges. Notability floats a tiny
ribbon. LumaFusion commits half the screen to the timeline because the
timeline *is* the canvas for video. **Never take canvas space for anything
that could be summoned.**

### 2. Summoning > housing
Tools are summoned with a tap, a touch-hold, a pencil squeeze, or a radial
gesture, and dismissed by tapping the canvas. Popovers anchor near the
summoning icon. Nothing is modal; nothing blocks the canvas for long.

### 3. Gestures are the real interface
The apps users love have 6–15 gestures that users *memorize once and then
stop seeing*. The canonical set:
- Pinch = zoom
- Two-finger tap = undo
- Three-finger tap = redo
- Two-finger drag = pan
- Touch-hold = eyedropper / context
- Four-finger tap = hide chrome
- Three-finger swipe = clipboard

**Copy this set exactly.** Users arrive with it already installed.

### 4. Pencil and finger do different jobs
Procreate convention: **Pencil draws, finger navigates.** Notability,
GoodNotes, Concepts, Linea all default to the same. This is a huge
simplification — it means a director holding an Apple Pencil can drag
marchers with the pencil and pan/zoom the field with fingers, never fighting
for a mode.

### 5. No keyboard, ever (almost)
The keyboard is the modal failure of iPad apps. The loved apps avoid it by:
- **Sliders** for numeric values (brush size, opacity, beat count)
- **Pickers and wheels** for discrete values (color, font, transition type)
- **Direct manipulation** for positions (drag the marcher, don't type X,Y)
- **Handwriting recognition** for short text (Notability, GoodNotes)
- **Voice dictation** as a first-class alternative
- Keyboard only appears when **naming** something (layer, file, set)

### 6. Timeline is a touchable terrain
LumaFusion and Procreate Dreams both treat the timeline as a **2D surface you
scroll, pinch, and drop onto** — not a scrubber with a text field. Two-finger
pinch zooms time scale. Drag the playhead to scrub. Drag content directly
onto the timeline.

### 7. Ship a radial / floating shortcut palette
Procreate's QuickMenu, Concepts' Tool Wheel, Astropad's Quick Keys. Users
love that they can put their 6–8 most-used actions one gesture away, and
they love that they can customize it. Ship this.

### 8. Sync time and content
Notability syncs handwriting to audio. Dreams syncs keyframes to the
timeline. The cross-modal link — tap any artifact, jump to its time — is
what makes these apps feel alive rather than like documents.

### 9. Desktop-class power is fine *if* you accept Personas
Affinity ships desktop density and gets away with it because **Personas
split the kitchen sink into three clean workspaces**. If a drill editor needs
a lot of controls, split into modes rather than cramming.

### 10. Sub-10-ms latency is table stakes
Astropad's 2 ms wired, 4–5 ms Wi-Fi is the expectation. If tapping a marcher
doesn't feel *physical* — instant selection, instant drag — the app fails
the "feels native" test no matter how pretty it is.

---

## The perfect layout for a drill editor on iPad

Given the above, here is the proposed layout. Think of it as
"Procreate + LumaFusion's timeline + Dreams' Perform mode + Concepts'
Tool Wheel."

```
+---------------------------------------------------------------+
|  [≡]                 FIELD (full width)                  [⚙]  |  <- slim top strip
|                                                               |     (Show | Director | Playback | Export)
|                                                               |
|                                                               |
|                                                               |
|                   [marchers, yardlines, forms]                |
|                         • • • • • • •                         |
|                        • • • • • • •                          |
|                                                               |
|                                                               |
|                                                               |
|  (Tool Wheel — floating, user-draggable to any edge)          |
|     (Add | Select | Move | Line | Arc | Shape | Undo | ?)     |
|                                                               |
+---------------------------------------------------------------+
|  [Compose | Perform | Keyframe]                   0:00 / 2:30 |  <- mode strip
|  |──────●──────────────────────|    Set 3 • Count 12         |
|   (timeline: counts/measures, pinch to zoom horizontally,     |
|    three-finger vertical drag to expand command tracks)      |
+---------------------------------------------------------------+
```

### Anatomy

**Field (canvas):** ~70% of the screen. Always dominant. Pencil taps select a
marcher; pencil drag moves a marcher. Fingers pan and zoom the field. Two-
finger twist rotates the viewing angle (director's POV vs. audience POV).

**Top strip:** Procreate-thin. Left: menu (shows, files). Right: settings,
director info, playback output (speaker selection), export. That's it.
Everything else lives elsewhere.

**Tool Wheel (Concepts-style, floating):** A radial palette of 8 user-
configurable tools, draggable to any edge. Default: Add Marcher, Select,
Move, Line Form, Arc Form, Shape Form, Undo, Redo. Directors can reassign.
One-finger tap (or four-finger tap) to open the wheel anywhere.

**Timeline (LumaFusion + Dreams hybrid):** Bottom ~25%, collapsible. Three
modes at the leading edge, mirroring Dreams:
- **Compose** — arrange formations / sets without touching timing
- **Perform** — drag marchers in real time as the playhead rolls; records
  keyframes live (this is the killer feature for directors who think in
  motion, not spreadsheets)
- **Keyframe** — edit the command list precisely, count-by-count

Pinch horizontally on the timeline to change the count-scale (beats → measures
→ sets). Three-finger vertical drag to expand rows (marcher tracks,
music bar, annotations). Drag the playhead to scrub; the field updates in
real time.

**Command list** lives *inside* the timeline as a track (like LumaFusion
stacks audio/title tracks). Each command is a draggable pill pinned to its
count. Tap a command → inspector slides *up* from the timeline, covering the
timeline only, leaving the field visible and live. This is the Notability
audio-sync principle applied: **tap command → field and playhead jump to
that moment.**

### Gesture contract (copy from Procreate verbatim where possible)

| Gesture | Action |
|---|---|
| Pencil tap on marcher | Select marcher |
| Pencil drag on marcher | Move marcher (in Compose) / perform motion (in Perform) |
| Finger pan | Scroll field |
| Two-finger pinch | Zoom field |
| Two-finger twist | Rotate field (director ↔ audience POV) |
| Two-finger tap | **Undo** |
| Three-finger tap | **Redo** |
| Two-finger tap-hold | Rapid undo |
| Three-finger swipe down | Copy/Paste marchers / commands |
| Four-finger tap | Hide all chrome — field only |
| Touch-and-hold on timeline | Drop a new command at that count |
| Pinch on timeline | Zoom time scale |
| Three-finger vertical drag on timeline | Expand/collapse tracks |
| One-finger tap (configurable) | Open Tool Wheel |

### Handling the lack of a keyboard

**Command entry** is the hardest iPad problem for this app. Options in order
of preference:

1. **Tap to pick from Tool Wheel** — 8 most-used commands always one gesture
   away. Works for 80% of the job.
2. **Searchable command picker** — a slim command palette that slides from
   the top when you touch-hold on the timeline. Handwriting-search (GoodNotes
   style): scribble "FM" with the Pencil and it filters to Forward March.
   No on-screen keyboard appears.
3. **Voice dictation** — a mic button on the command picker. "Forward march,
   16 counts, 8 to 5." Parses into a command. This matches how directors
   actually talk on a field.
4. **On-screen keyboard** — only as a last-resort fallback for free-text
   annotations and naming shows/sets.

**Numeric parameters** (counts, step sizes, yardline offsets) are sliders
with a small numeric readout. Tap the readout to get a compact number pad
pop-over (not a full keyboard). Procreate does this for brush jitter.

**Picking a marcher / subset** — direct manipulation. Tap-drag a lasso on
the field. Two-finger tap extends selection. Touch-hold on a selection to
get "select similar" (all trumpets, all of drill block).

### The "sovereign canvas" test

At every design decision, ask: *does this take space from the field?* If
yes, can it be summoned instead? If it must be persistent, is it as thin as
Procreate's brush-size rail? If a director in sunlight holding an iPad at
arm's length can't see the whole formation, the design has failed.

### The Perform-mode insight (from Dreams) — the biggest unlock

Traditional drill editors are spreadsheet-shaped: "at count 16, marcher 12 is
at (40, 22)." This is how drill is **stored**, but it is not how directors
**think**. Directors think: "from set 3 to set 4, over 16 counts, Alice walks
from here to here."

Procreate Dreams' Perform mode is the solution: **enter Perform mode, tap a
marcher, drag her across the field while the playhead rolls, lift to stop.**
The app records the resulting motion as keyframes. The director never touches
a number. The spreadsheet exists — but it's the output of the performance,
not the input to it.

This alone could be the reason a director picks our editor over every
existing drill tool.

---

## Sources

- [Procreate Handbook — Gestures](https://help.procreate.com/procreate/handbook/interface-gestures/gestures)
- [Procreate Handbook — QuickMenu](https://help.procreate.com/procreate/handbook/interface-gestures/quickmenu)
- [Procreate Insight — Master these gestures](https://procreate.com/insight/2022/gestures)
- [Procreate on the App Store](https://apps.apple.com/us/app/procreate/id425073498)
- [SlashGear — Procreate Is Still The Best iPad Art App](https://www.slashgear.com/1427117/why-procreate-is-still-the-best-ipad-art-app/)
- [Astropad — How I Customize My Quick Menu in Procreate](https://astropad.com/blog/how-i-customize-my-quick-menu-in-procreate/)
- [Procreate Dreams Handbook — Timeline and Modes](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline)
- [Procreate Dreams Handbook — Performing](https://help.procreate.com/dreams/handbook/keyframes-and-performing/performing)
- [Procreate Dreams Handbook — Gestures](https://help.procreate.com/dreams/handbook/interface-and-gestures/gestures)
- [Creative Bloq — Procreate Dreams 2 review](https://www.creativebloq.com/art/animation/procreate-dreams-2-makes-the-ipad-animation-app-even-more-powerful-and-versatile)
- [Paperlike — Procreate Dreams Deep Dive](https://paperlike.com/blogs/paperlikers-insights/procreate-dreams)
- [Notability on the App Store](https://apps.apple.com/us/app/notability-smarter-ai-notes/id360593530)
- [Paperless X — Notability complete review](https://beingpaperless.com/notability-2/)
- [Paperlike — Goodnotes vs Notability 2026](https://paperlike.com/blogs/paperlikers-insights/app-review-goodnotes-vs-notability)
- [iPhone J.D. — Goodnotes 6 review](https://www.iphonejd.com/iphone_jd/2023/08/goodnotes-6.html)
- [Goodnotes Blog — Introducing Goodnotes 6](https://www.goodnotes.com/blog/introducing-goodnotes-6)
- [Concepts App](https://concepts.app/en/)
- [Parka Blogs — Concepts app review](https://www.parkablogs.com/picture/concepts-app-review-sketching-vector-and-infinite-canvas)
- [Concepts — Working with Your Infinite Canvas](https://concepts.app/en/tutorials/working-with-your-infinite-canvas/)
- [Creative Bloq — Affinity Designer for iPad review](https://www.creativebloq.com/reviews/affinity-designer-for-ipad-review)
- [Affinity Help — Gestures](https://affinity.help/designer/en-US.lproj/pages/GetStarted/gestures.html)
- [Projector Sewing — 30+ Touch Gestures in Affinity Designer iPad](https://projectorsewing.com/touch-gestures-affinity-designer-ipad/)
- [LumaFusion on the App Store](https://apps.apple.com/us/app/lumafusion/id1062022008)
- [TechRadar — LumaFusion review](https://www.techradar.com/pro/software-services/lumafusion-review)
- [ProVideo Coalition — LumaFusion review](https://www.provideocoalition.com/review-lumafusion/)
- [Digital Camera World — LumaFusion review](https://www.digitalcameraworld.com/reviews/lumafusion-review-the-best-video-editing-app-for-ipad)
- [MacStories — Linea Sketch 2.0 review](https://www.macstories.net/reviews/linea-sketch-20-elegant-approachable-sketching-for-the-ipad/)
- [Cult of Mac — Linea Sketch](https://www.cultofmac.com/news/linea-the-best-ipad-drawing-app-just-got-better)
- [Linea Sketch](https://linea-app.com/)
- [Macworld — Astropad Studio review](https://www.macworld.com/article/230707/astropad-studio-review.html)
- [KelbyOne — Astropad Studio review](https://insider.kelbyone.com/review-astropad-studio/)
- [Apple HIG — Selection and input](https://developer.apple.com/design/human-interface-guidelines/selection-and-input)
- [Apple HIG — Inputs](https://developer.apple.com/design/human-interface-guidelines/inputs)
- [WWDC20 — Designed for iPad](https://developer.apple.com/videos/play/wwdc2020/10206/)
