# Creative Editor Layout Patterns — Research for Show Studio

**Purpose.** Show Studio is a marching band drill editor that combines a **spatial canvas** (the football field with marchers) with a **temporal sequence** (an ordered list of operations over time) plus **reusable building blocks** (formations, moves, effects). This document studies five beloved creative editors to extract the layout and interaction patterns that make a creative tool "feel right," and then forms an opinionated position on what Show Studio should steal, adapt, or avoid.

The five apps studied: **Figma, Procreate, Final Cut Pro, Logic Pro, Pixelmator Pro.**

---

## 1. Figma

### Layout

Figma's UI3 (the 2024 redesign still in use in 2026) is a **three-zone layout** that hasn't fundamentally changed in a decade because the underlying shape is right:

- **Top toolbar** — thin, center-docked, tool primitives (select, frame, shape, pen, text, hand, comment). Pinned and always visible.
- **Left panel** — file/page/layer tree plus **Assets** (components/libraries). Collapsible.
- **Right panel** — **Inspector**: Design / Prototype / Inspect tabs. Context-sensitive to selection.
- **Canvas** — the infinite zoomable plane. Fills everything not claimed by the three chrome zones.

UI3 rounded the panel corners, floated them *slightly* above the canvas with a subtle gap, and added a **"Minimize UI"** mode that hides everything except the toolbar until you select something. The Actions/command bar (Cmd-/) is the escape hatch for everything that doesn't live in the visible chrome.

**Critical detail:** Figma briefly experimented with *fully* floating panels you could drag anywhere. They reversed it. The docked panels came back, because users didn't want to manage window furniture — they wanted a predictable home for every tool.

### What users love

From Figma's own UI3 retrospective and community coverage:

> "Panels are fixed, but still resizable to allow for greater flexibility. The toolbar stays handy, and the design panel appears only when needed, then disappears once deselection occurs."

> "Though floating panels were exciting for some, they hindered people who spend many hours a day in Figma, cramping the canvas especially on smaller screens. Figma listened and reversed course."

The properties panel reorg is frequently praised: "auto layout values like width and height right alongside resizing behavior, layout direction, alignment, and spacing — everything for managing an auto layout frame lives together." The lesson: **group controls by the mental model of the thing being edited, not by data type.**

### Reusable assets

Components and Libraries live in the **left panel Assets tab**. You drag from the tree to the canvas. Published libraries show up team-wide. A component instance in the canvas exposes its **variants and overrides at the top of the right inspector** — component controls outrank attribute controls, because editing a component instance is fundamentally different from editing a raw shape.

### Canvas vs controls

The canvas is **boxed** on three sides (top, left, right) but dominates ~75–80% of screen real estate at default panel widths. The infinite canvas gives Figma its "spatial thinking" feel — you can sprawl out, zoom out to see the system, zoom in to edit pixels. Nothing about the panels blocks the canvas; they frame it.

### Verdict
Figma is the **gold standard for "docked chrome around a spatial canvas"**. The inspector-on-the-right-context-sensitive-to-selection pattern is load-bearing for every creative tool that followed it.

---

## 2. Procreate

### Layout

Procreate is the **anti-Figma**. Where Figma frames the canvas with permanent chrome, Procreate eliminates almost all chrome:

- **Top-left cluster** — gallery, actions, adjustments, selection, transform (modifier icons that *summon* overlays).
- **Top-right cluster** — brush, smudge, eraser, layers, color.
- **Left edge vertical slider** — brush size (top) and opacity (bottom), with a modifier square between them.
- **Everything else** — canvas.

There is no permanent inspector. There is no permanent timeline. When you tap a layer or a brush, a floating panel animates in, and when you tap away it vanishes. Every modal is dismissible with a swipe.

### What users love

> "Procreate's UI stands out for its simplicity and aesthetic appeal, doesn't overwhelm users, avoids screen clutter, and gives the feeling of working on a real canvas."

> "They do not bombard users with all features at once, nesting features within features to create several levels — from the surface the UI seems minimal with very few features but users discover new features as they spend time with the app."

Two Apple Design Awards. 4.4 stars across ~38k ratings. The UX case study literature keeps hitting the same word: **"canvas."** Users say it *feels* like a canvas, not an app.

### Critical caveat

A design critique from Pratt's IXD program found the flip side: Procreate "prioritizes 'knowledge in the head' over discoverability, demanding users memorize functions rather than providing constant visual guidance." The empty grey square modifier is famously confusing. Sliders for brush size and opacity are visually identical. **The minimalism is paid for in learnability.**

### Reusable assets

Brushes are the asset system. The brush library is a two-column overlay summoned from the brush icon — **categories left, brushes right, preview at top**. Long-press to duplicate, swipe to share. Brush sets are user-reorderable. Presets aren't a separate concept — everything is a brush.

### Canvas vs controls

Canvas is **100% of the screen**. Controls float *on top* as needed and dismiss themselves. The only permanent chrome is the modifier cluster in each corner and the left-edge slider — maybe 8% of pixels at most.

### Verdict
Procreate proves you can run a serious creative tool with almost no permanent chrome **if you nail gestures and summoning**. But it only works because the input device is a pressure-sensitive stylus on a tablet held in your hands — the cost of summoning a panel is one tap. On a desktop with a mouse, summoning panels is friction. **Don't copy Procreate wholesale unless your input model justifies it.**

---

## 3. Final Cut Pro

### Layout

Final Cut Pro is a **four-quadrant layout**:

- **Top-left — Browser/Library.** Clip bin. Thumbnails or list.
- **Top-right — Inspector.** Context-sensitive panel for whatever is selected. Three tabs (Video/Audio/Info).
- **Top-center — Viewer.** The video preview.
- **Bottom, full width — Magnetic Timeline.** The temporal workspace.

This is the classic NLE shape: **assets top-left, preview top-center, inspector top-right, timeline bottom.** FCP's twist is the **magnetic timeline**: instead of track-based lanes where you manage collisions yourself, clips snap and reflow. There's a **primary storyline** (darker gray strip) and clips "connect" to it above and below.

FCP also has **Workspaces** — saved layouts named for tasks (Default, Organize, Color & Effects). Switch with one click when the task changes.

### What users love (and hate)

This is the most polarized app in the study. Direct quotes:

> "Edit a documentary in FCP. Then you will LOVE the magnetic timeline."

> "If you take the time to learn how to wield the magnetic timeline you'll find that it is brilliantly thought out, efficient and allows your work to be done much faster than a track based NLE."

> "In my opinion, there is no more fluid and rewarding operation in the world of software than skimming across a massive timeline and hitting 'option + ]' and seeing the entire story ripple down in obedience."

Against:

> "During the first few days of trialing Final Cut Pro X the magnetic timeline drove me nuts."

> "I've been a FCP editor since day one and a professional editor for 15 years, I see how the magnetic timeline can be useful, but if I have to have it constantly engaged I have a feeling I'll be jumping off a bridge very soon!"

The frame.io piece nails the argument *for*: the magnetic timeline "helps you focus on story in a way no other NLE does" because it removes the constant overhead of managing track collisions, sync, and gap cleanup. You think about narrative, not track bookkeeping.

### Reusable assets

The **Browser** on the top-left is the reusable-asset zone. Clips, generators, titles, transitions, effects, and Compound Clips (FCP's "component" concept — a group of clips you can reuse as a single unit) all live in browser panels. You drag from browser to timeline. **Compound Clips are the killer feature for us to learn from** — they let you author a reusable chunk of timeline, drop it into a show, and edit it in place or open it for editing as its own timeline.

### Canvas vs controls

FCP has **two focal surfaces**, not one: the viewer (spatial) and the timeline (temporal). Both are "the canvas" depending on what you're doing. The inspector and browser are heavily used but small relative to the two focal surfaces. This is the **closest structural analogue to Show Studio** in the whole study — a spatial preview plus a temporal sequence, with inspectors and an asset browser around them.

### Verdict
FCP's layout is the direct template for drill editing. **Steal the four-quadrant shape.** Steal Compound Clips as the model for reusable drill fragments. The magnetic timeline is the interesting question: do you want ripple-by-default (pushing later counts when you insert earlier ones, which is FCP's magnetic model) or absolute count alignment? The answer is probably **magnetic with an explicit opt-out**, because marching drill *is* story-on-a-count-line and fighting count bookkeeping is the same pain video editors fight.

---

## 4. Logic Pro

### Layout

Logic Pro is the **most chrome-dense** app in the study and the one most worth studying for temporal-sequence UI:

- **Top — Control Bar.** Transport, LCD (counter/tempo/key), mode switches for showing/hiding each panel. This is mission control.
- **Left — Library.** Patches, presets, sound categories. Dockable, toggleable.
- **Left of tracks — Inspector.** Region/track parameter inspector. Two-stack: region params on top, track params below.
- **Center — Tracks area.** Track headers on the left, timeline ruler on top, region lanes filling the rest. This is the temporal canvas.
- **Bottom — Smart Controls / Mixer / Editors.** A bottom pane that you cycle between piano roll, score, audio editor, step sequencer, smart controls, or mixer.
- **Right — Apple Loops browser / list editor / notes.** Another context pane.

The brilliant thing is **you can hide any of them**. Logic's toolbar has explicit toggles for every panel. You compose your own layout.

### Screensets

This is Logic's superpower nobody talks about enough. A **screenset** is a named saved window layout — panel positions, zoom levels, which editor is open, which tracks are selected. You bind screensets to number keys 1–9. Hit **2** to flip to "Mix mode." Hit **1** to go back to "Arrange." It's like tmux for DAWs, and it's been there since the 90s.

### What users love

> "Users love how intuitive the design of Logic Pro is... the clean, modern and futuristic design sets it apart from competitors."

> "Smart Controls let you adjust parameters in Logic without having to clutter your workspace with open plug-in windows."

Smart Controls are the under-appreciated gem: rather than exposing every knob of every plugin, you curate a **simplified control surface** for a track — 8 knobs, 4 buttons, each mapped to whichever underlying parameter matters. This is the same "expose the few controls that matter for this thing, not all of them" lesson Figma learned with its grouped inspector.

### Reusable assets

**The Library (far left)** is where patches live. A patch bundles instrument + effects + routing into a single drag-and-drop unit. Click a track, click a library entry, and the whole signal chain reconfigures. This is the single cleanest "drag from a library of opinionated building blocks onto the thing you're editing" pattern in the study.

Apple Loops (right panel) are another library — prerecorded reusable audio chunks. **Two libraries in two different places** because they serve different mental models (a patch is about *how a track sounds*, a loop is about *content you insert into time*).

### Canvas vs controls

Tracks area is the focal element but it's genuinely crowded — inspector left, library further left, bottom editor pane, transport top, loops right. On a 13" screen it's suffocating. On a 27" it sings. **Logic's layout scales with screen size by giving you the toggles to turn off what you don't need.**

### Verdict
The patterns to steal from Logic:
- **Screensets.** Task-specific layouts bound to number keys. Huge for an app where "designing a formation" and "cleaning timing" and "previewing the show" are fundamentally different modes.
- **The Library on the left as a source of opinionated drag-in building blocks.** For drill: formations, stock moves, effect templates.
- **Smart Controls as a curated control surface.** For drill: when you select a formation, show a handful of parameters (rotation, size, orientation, spread) rather than all the raw marcher coordinates.

What to avoid: **don't default to Logic's density.** Default to something closer to FCP, and let power users unhide panels.

---

## 5. Pixelmator Pro

### Layout

Pixelmator Pro is the **modern minimalist reimagining** of the Photoshop layout:

- **Top — toolbar.** Thin, icons only, tool primitives.
- **Left — tools sidebar** (thin strip).
- **Right — unified inspector.** Layers live here. Effects, adjustments, color properties, and *everything else* about the selected object collapse into sections in this one panel.
- **Center — canvas.** Dark chrome. Image dominates.

The single-window redesign in 2017 was the whole point of the product. Every tool that used to live in its own floating palette was moved into the right sidebar. **No floating windows.** The panels are slightly translucent and float a couple of pixels above the canvas, so the canvas feels like it extends underneath.

### What users love

> "The image you are editing is in the spotlight and dominates the app's window thanks to the dark interface, monochrome icons, sparse chrome."

> "The redesign gives Pixelmator Pro an expansive feel and image-centric emphasis that its predecessor didn't have."

> "The Pro version is simply easier to use. There's less clutter, I know where my tools are at all times, and it looks better, which for a tool that I will use many times each week, is worth the price."

That last quote is the whole thesis. **"I know where my tools are at all times."** Predictability beats power.

### Reusable assets

Pixelmator Pro's asset model is lighter: styles (reusable visual property bundles), presets (for adjustments and effects), and templates (for documents). Styles are the closest thing to Figma components — pick a styled layer, save its style, apply that style to another layer later. Presets live inline in each effect/adjustment section, not in a separate library panel.

### Canvas vs controls

Canvas takes **the whole window minus a thin left strip and a right sidebar**. The translucent panels reinforce the sense that the canvas is the whole app. Dark chrome means controls visually recede; the image is the only bright thing on screen.

### Verdict
Pixelmator Pro is the **ergonomic lesson**: a single unified right-side inspector that collapses everything context-sensitive into one scrollable column beats scattering tool palettes. Dark chrome + bright canvas is a cheap, proven trick for focus. Translucent, slightly-floating panels over a dark background make the whole app feel larger than it is.

---

## Universal Patterns Across All Five

After staring at these for a while, a small number of patterns repeat hard enough to be treated as universal laws:

### 1. Panels dock. They do not float.
Figma tried floating and reversed it. Pixelmator's whole redesign was killing floating palettes. Logic Pro lets you float but no one does. Procreate's overlays *dismiss themselves* instead of staying open. **Permanent chrome is docked chrome.** Users do not want to manage window furniture.

### 2. There is one context-sensitive inspector, and it is on the right.
Figma, Pixelmator, FCP all put the inspector on the right. Logic puts it on the left but it's the only outlier, and Logic is the densest UI in the study. **The inspector is always about the current selection. One selection, one inspector, on the right.** Do not split editable properties of a selection across multiple panels.

### 3. The inspector groups by mental model, not by data type.
Figma's auto-layout section groups "width, height, direction, alignment, spacing" together because they're all "how this frame does layout." Logic's Smart Controls expose only the knobs that matter for this track. Pixelmator collapses effects into contextual sections. **Do not build an inspector that's a flat list of every property; build it as a stack of *purposes*.**

### 4. The asset library is a separate panel, usually left.
FCP Browser, Logic Library, Figma Assets, Pixelmator templates. Left side, drag-to-canvas. Procreate is the outlier — its brush library is a summoned overlay — but Procreate only has one asset type. **If you have more than one kind of reusable thing, give them a permanent home, and put it on the left.**

### 5. The canvas is the largest pixel region at every zoom level.
Every app, without exception. Even Logic Pro, the densest, still gives the tracks area the majority of pixels. Chrome can steal 20–25% of the screen but no more. **Never let panels crowd the canvas below 60% of width.**

### 6. Dark chrome, bright canvas.
Every app in this study ships a dark UI and expects the canvas content to be the only bright thing. This is not aesthetic preference — it's attention management. The eye goes to the brightest region. Make that region be the work.

### 7. There is always a command palette or action bar as an escape hatch.
Figma's Cmd-/. Logic's key commands window. FCP's command editor. Procreate's QuickMenu. **You cannot put every feature in visible chrome. Accept this and ship a great command palette.** Power users live in it.

### 8. Beloved tools have one opinionated default flow and an off-ramp for power users.
FCP's magnetic timeline ripples by default — you can override with the Position tool. Figma's auto layout is opinionated — you can turn it off per frame. Procreate's gestures are the default input — the Actions menu exists for when you need the explicit path. **Being opinionated is what makes a tool "feel" like something.** Neutrality is the enemy of love. Every beloved tool in this study is controversial because it takes a stance. The haters exist *because* the lovers love it.

### 9. Saved layouts for different tasks.
Logic has Screensets. FCP has Workspaces. Figma has the Minimize UI mode. Pixelmator has a full-screen mode. **A creative editor is really N different apps depending on what stage of the work you're in. Let users save their layout per stage.**

### 10. The hierarchy of controls in the inspector matches the hierarchy of abstraction in the asset.
Figma: component controls (variants, overrides) *above* raw attribute controls. Logic: patch-level controls *above* individual plugin parameters via Smart Controls. Compound Clips in FCP: the clip as a whole is editable before you drill into its contents. **When the user has a reusable thing selected, show the reusable-thing controls first and the raw controls underneath.** Never make the user drill past the abstraction to edit it.

---

## What This Means for Show Studio

Show Studio is structurally closest to Final Cut Pro: a spatial preview (the field, like the Viewer) plus a temporal sequence (the count timeline, like the Magnetic Timeline) plus reusable building blocks (formations, stock moves — like Compound Clips or Patches).

My opinionated recommendations:

**Adopt the FCP four-quadrant shape as the skeleton:**
- Top-left: Library of reusable things. Formations, stock moves, effect presets, drill fragments. Tabbed or category-stacked.
- Top-center-right: The Field (spatial canvas). This is the largest pixel region.
- Right sidebar: Single context-sensitive inspector. Selection-driven. Group by mental model (a formation has: center, rotation, scale, spacing, orientation — group those together; don't scatter marcher coordinates).
- Bottom, full-width: The Count Timeline (temporal canvas). Operations, moves, formation changes, ordered by count.

**Steal Compound Clips.** A drill fragment — say, an 8-count company front move — should be a first-class reusable unit you can drag from the library onto the timeline, edit in place on the field, or open as its own mini-drill.

**Steal Smart Controls.** When the user selects "company front" on the field, the inspector should show a curated set of meaningful knobs (center point, angle, interval, tilt) — not 64 marcher XY coordinates. Raw marcher edits should be one drill-down deeper.

**Steal Screensets.** At minimum, three named layouts bound to keys: **Design** (big field, inspector right, library left), **Sequence** (big timeline, field smaller), **Clean** (minimal chrome, field dominates, for run-throughs).

**Be Figma-docked, not Procreate-summoned.** Show Studio is a desktop web app used for hours. Summoning panels is friction you can't afford. Docked chrome that the user can resize and hide is the right answer.

**Be Pixelmator-minimal in chrome aesthetics.** Dark chrome. Thin monochrome icons. Translucent panels over the dark field background so the field feels like it extends underneath. One bright thing on screen: the work.

**Be opinionated about the timeline.** Make it magnetic by default. Moves snap to counts. Inserting a move pushes later moves. Provide an explicit "pin to count N" off-ramp for the user who needs absolute placement. Do not ship a neutral timeline — users will not love a tool that has no opinion.

**Ship the command palette on day one.** Cmd-K / Ctrl-K. Every action discoverable by search. This is the escape hatch that lets you ship a minimal visible chrome without locking out power users.

**The concentric design rule (per your memory) applies at panel level too:** the field canvas has a radius, and the floating right inspector panel should have a radius equal to (field radius − inspector gap). The library panel should nest inside the top-left quadrant with the same relationship. Panels nested in panels follow the same rule all the way down. This is a literal structural thing you can encode in the layout engine.

---

## Sources

### Figma
- [Figma on Figma: Our Approach to Designing UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/)
- [Inside the Redesigned Figma, Where Your Work Takes Center Stage](https://www.figma.com/blog/behind-our-redesign-ui3/)
- [Why Designers Love Figma in 2025 (Arvshitech)](https://www.arvshitech.in/blog/why-designers-love-figma-in-2025/)
- [Making the Move to UI3 (Figma Blog)](https://www.figma.com/blog/making-the-move-to-ui3-a-guide-to-figmas-next-chapter/)

### Procreate
- [Procreate Handbook: Interface and Gestures](https://help.procreate.com/procreate/handbook/interface-gestures)
- [Design Critique: Procreate App (Pratt IXD)](https://ixd.prattsi.org/2024/09/design-critique-procreate-app/)
- [Procreate — A UX Case Study (Medium)](https://medium.com/@ayush0128/procreate-a-ux-case-study-ad68fbd40a10)
- [Procreate Is Still The Best iPad Art App — SlashGear](https://www.slashgear.com/1427117/why-procreate-is-still-the-best-ipad-art-app/)

### Final Cut Pro
- [Final Cut Pro for Mac interface — Apple Support](https://support.apple.com/guide/final-cut-pro/final-cut-pro-interface-ver92bd100a/mac)
- [How The Magnetic Timeline Keeps You Focused on The Story — Frame.io](https://blog.frame.io/2017/10/16/fcpx-magnetic-timeline/)
- [The Final Cut Pro Timeline: Magnetic, Chaotic, and Totally Useful — MotionVFX](https://www.motionvfx.com/know-how/final-cut-pro-magnetic-timeline/)
- [Embrace the Magnetic Timeline of Final Cut Pro X — Fstoppers](https://fstoppers.com/video-editing/embrace-magnetic-timeline-final-cut-pro-x-515990)
- [FCP Interface: What's Where and Why It Matters — MotionVFX](https://www.motionvfx.com/know-how/fcp-interface/)

### Logic Pro
- [Logic Pro Inspector interface — Apple Support](https://support.apple.com/guide/logicpro/inspector-interface-lgcpe9cc3b1d/mac)
- [Smart Controls Overview — Apple Support](https://support.apple.com/guide/logicpro/smart-controls-overview-lgcp7e59f24b/mac)
- [Create and recall screensets — Apple Support](https://support.apple.com/guide/logicpro/create-recall-and-switch-screensets-lgcp9bbbcb23/mac)
- [Logic Pro X review — 9to5Mac](https://9to5mac.com/2013/07/26/logic-pro-x-review-powerful-new-features-a-simplified-ui-with-no-compromises-for-pros/)
- [Logic Pro Reviews — Capterra](https://www.capterra.com/p/214597/Logic-Pro/reviews/)

### Pixelmator Pro
- [Pixelmator Pro First Impressions — MacStories](https://www.macstories.net/reviews/pixelmator-pro-first-impressions-a-beautiful-modern-interface-with-advanced-image-editing-tools/)
- [Pixelmator Pro 3.4 Camelot review — DPReview](https://www.dpreview.com/reviews/pixelmator-pro-3-4-camelot-review-2023)
- [Pixelmator Pro Review — SoftwareHow](https://www.softwarehow.com/pixelmator-review/)
- [Pixelmator Pro announced with single window UI — 9to5Mac](https://9to5mac.com/2017/09/05/pixelmator-pro-announced/)
