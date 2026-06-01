# Web App Gold: What "Best-In-Class" Actually Looks Like

> Research for the Show Studio drill editor. The question: what do web apps
> that users describe as "feeling like a real app" have in common, and which
> of those patterns survive the jump to a canvas-centric, spatial/temporal,
> recursive tool like a marching band drill editor?

This is opinionated. The TL;DR is at the bottom. The synthesis section is
the part you actually build from.

---

## 1. Figma — The Gold Standard

Figma is the reference point for "web app that feels native." Every other
creative web tool gets compared to it. The UI3 redesign (2024) doubled down
on a philosophy that is worth stealing wholesale.

### Layout

- **Canvas is ~95% of the screen.** The tool barely exists visually.
- **Floating panels**, not docked rails. Left panel (layers), right panel
  (properties), and — new in UI3 — a **centered floating toolbar at the
  bottom of the canvas**, not pinned to a top chrome bar.
- **The toolbar only shows tools that apply right now.** Select nothing and
  you get move/frame/shape/pen/text/comment. Select a frame and the toolbar
  contextualizes.
- **Properties panel is ruthlessly contextual.** Nothing selected: file +
  page properties. Something selected: only the properties of that thing.
  No "grayed out everything."
- **Zero modal dialogs** in the main flow. Everything is an inline popover
  or a right-panel reveal.

### What makes it feel native

- **Trackpad panning, pinch zoom, and two-finger scroll** behave exactly
  like macOS Preview. Muscle memory from the OS transfers directly.
- **WebGL canvas** (now partly WebGPU) — so selection marquees, handles,
  and dragging are sub-frame responsive. The canvas never "chugs."
- **Keyboard shortcuts for tool switching** (`V`, `F`, `R`, `T`, `P`) and
  a **Quick Actions bar** (`Cmd+/`) that is a fuzzy-searchable command
  palette for literally every menu item in the app.
- **Smart guides** that snap and then animate a pink tick line on contact.
  Feedback is immediate and physical-feeling.

### Creating new items

- **Tool-then-drag.** Press `F`, drag a frame. Press `R`, drag a rect.
- **Drag from left panel** for components (library assets).
- **Paste images/SVGs/Figma URLs** straight onto the canvas. Paste is a
  first-class creation gesture.
- **Never a "New Shape" modal.** Ever.

### Default view

New file opens with an **empty canvas, faint dot grid, centered viewport**.
No templates shoved in your face. No welcome tour overlay blocking the
canvas. An optional left-rail "assets" section you can ignore.

### What users say

> "The redesign introduced resizable panels and a slim new toolbar at the
> bottom of the canvas, which frees up the top and creates a roomier feel
> overall." — [Figma Blog, UI3 announcement](https://www.figma.com/blog/behind-our-redesign-ui3/)

> "The core goal was to center your ideas rather than Figma's UI, aiming
> to focus the canvas less on the interface and more on your work."
> — [Figma on Figma](https://www.figma.com/blog/our-approach-to-designing-ui3/)

Designers consistently describe UI3 as feeling "natural" and "like home"
within a session or two. The reason: **the canvas got bigger and quieter.**

### The Figma lesson

> **The canvas is not a view. The canvas is the app. Panels are waiters
> at a restaurant — they appear when you gesture, they go away when you
> don't.**

---

## 2. Linear — The Most Beautiful Productivity App

Linear ships no 3D, no canvas, no spatial anything. It is a list of bugs.
And yet it is universally cited as "the most beautiful productivity app."
Why?

### Layout

- **Thin left sidebar** (workspaces, views, inbox). Collapses on `[`.
- **Main pane is a list** — either table rows or a Kanban board. No
  secondary toolbars, no breadcrumb trails, no ribbon.
- **Right-side detail panel slides in** when you click an issue. It does
  not modal over the list — the list stays visible and scrollable.
- **Everything else lives in `Cmd+K`.** There is no Settings gear in the
  top right. Settings is `G` then `S`. Or type "settings" in Cmd+K.

### What makes it feel native

This is the interesting part. Linear is a React web app but it feels like
a native Mac app. The tricks:

1. **Instant everything.** Every interaction is optimistic. Click a
   status, it updates *before* the server responds. If the server rejects
   it, it rolls back silently. Users never see a spinner.
2. **60fps animations on state changes.** New issue? It slides in. Deleted?
   Row collapses with a height animation. No content popping.
3. **Keyboard-first.** `C` creates an issue. `A` assigns. `S` sets status.
   `L` sets label. `P` sets priority. Every single noun in the app has a
   single-letter verb.
4. **Sub-100ms page transitions** via local cache. Linear preloads and
   caches aggressively, so navigating views feels like switching tabs in
   a native app, not loading a new URL.
5. **A single, consistent font stack** (Inter) and a tight monochrome
   palette. Color is used *only* for semantic signals (priority, status),
   never for decoration.

### Creating new items

- **Press `C`.** A thin modal (really a centered input card) appears,
  focused. Type title, press Enter. Done.
- **No multi-step wizard.** Status, assignee, labels are all inline
  popovers inside that same card, each triggered by keyboard.
- **The modal is non-blocking** — Esc dismisses and does not ask "are
  you sure?"

### Default view

Your inbox (things assigned to you or that mention you), with zero-state
art that isn't cute — it's a clean empty state with one CTA: "Create
issue." No product tour.

### What users say

> "Linear is everything that I ever dreamed a development tracking tool
> could be and MORE." — [Product Hunt review](https://www.producthunt.com/products/linear/reviews)

> "The real game-changer is the speed: updating tasks, switching views,
> or collaborating with teammates feels instant."
> — [Findstack Linear review](https://findstack.com/products/linear/reviews)

> "Every pixel is intentional with no visual clutter and clear information
> hierarchy."

### The Linear lesson

> **Beauty in a productivity app is not art direction. It is latency,
> consistency, and ruthless removal. Linear feels beautiful because every
> frame is on time, every action has one way to do it, and nothing is
> decorative.**

Also: Linear's command palette (`Cmd+K`) is the single most important
idea in the last decade of productivity UX. Steal it.

---

## 3. Notion — The Universal Canvas For Text

### Layout

- **Left sidebar** with a tree of pages. Collapsible.
- **Main content area is a document.** No right panel. No properties
  panel. No toolbar — formatting appears as a **floating bubble when you
  select text**, and block actions appear on a `+` and `::` handle in
  the left gutter on hover.
- **Databases embed inline** as blocks. A "table" in Notion is just a
  block inside a page.

### What makes it feel native

- **The slash command (`/`).** Type `/` anywhere and get an inline,
  searchable menu of every block type. This is the other most important
  idea in modern web UX (tied with `Cmd+K`).
- **Drag handles in the gutter** to reorder anything. Blocks are
  physical things you grab.
- **No save button.** Ever. Trust is implicit.

### Creating new items

- **Press Enter** for a new paragraph.
- **Type `/`** for anything else.
- **Drag-drop images, files, URLs** — Notion embeds them as blocks.
- Pages are created by clicking `+` in the sidebar or `+ New` at the
  bottom of a database.

### Default view

A blank page with a faint "Press `/` for commands" placeholder and
optionally a templates button. The emptiness is the feature.

### The Notion lesson

> **A palette of primitives plus a slash command is more powerful than
> a toolbar with 40 buttons. The user types what they want; they don't
> hunt for it.**

For the drill editor: `/` could insert a form, a gesture, a sub-drill,
a label, a comment — without ever opening a panel.

---

## 4. Loom — Zero Friction Creation

Loom's entire UX is organized around one question: **how fast can you
go from intent to recording?** The answer: two clicks.

### Layout

- The web app is barely a layout at all. The core surface is a **small
  floating control bubble** that docks in the corner of whatever you're
  recording.
- The library (where recordings live) is a grid of video thumbnails,
  Figma-file-browser style.

### What makes it feel native

- **No countdown timer, no setup wizard.** Click record, talk. The
  decision to cut the countdown is the single most Loom-feels-native
  thing about it.
- **Instant share link on stop.** Clicking stop copies the URL to your
  clipboard before the upload finishes. You paste before you've thought
  about it.
- **Webcam bubble over screen share** — a circular floating video of
  your face. It's a physical, playful object that gives the recording
  warmth.

### What users say

> "The instant availability after recording is a crucial UX decision —
> there's no rendering time or upload progress bar, and clicking stop
> puts the shareable link on your clipboard."
> — [Loom review](https://workflowautomation.net/reviews/loom)

### The Loom lesson

> **Don't ask the user to confirm the thing they already asked for.
> Countdowns, "Are you ready?", and upload progress are friction masquerading
> as politeness.**

For the drill editor: "New drill" should land you on a field, cursor
ready, no template picker in the way.

---

## 5. Canva — Beloved By Non-Designers

Canva is the counter-example to Figma. Figma is for professionals who
know what they want. Canva is for people who don't. The lessons are
different.

### Layout

- **Four-pane layout**: thin left rail of categories (Templates, Elements,
  Uploads, Text, Brand, etc.), a wider second pane that's the *gallery*
  for whatever category is selected, the canvas in the middle, and a
  top bar with contextual properties for the selected element.
- The second pane (the gallery) is the heart of Canva. It is always a
  scrollable, visual palette.

### What makes it feel native

- **Drag-from-palette is the only creation gesture.** You never draw a
  rectangle by dragging on the canvas like in Figma. You find a shape in
  the Elements pane and drag it onto the canvas.
- **Templates are first class.** The "new document" experience is a
  gallery of thousands of templates, and every one of them is a valid
  starting point, not a tutorial.
- **Every element snaps, aligns, and shows smart guides.** Canva's
  snapping is even more aggressive than Figma's because the target user
  is not a designer and needs the app to be opinionated.

### What users say

> "Canva templates solve the cold-start problem that non-designers face
> when needing help creating high-quality assets."
> — [Growth Case Studies: Canva](https://growthcasestudies.com/p/canva-templates)

> "Canva's interface is incredibly intuitive with a quick learning curve
> [...] the drag-and-drop approach allows you to create, edit, and share
> visually engaging designs even if you are a beginner."
> — [Bring Your Own Laptop: What is Canva?](https://bringyourownlaptop.com/blog/what-is-canva-guide)

### The Canva lesson

> **For domain-specific tools, a visual palette of pre-made, draggable
> primitives beats a blank canvas with drawing tools. Drill designers are
> closer to Canva users than Figma users — they want to drop a "company
> front" formation and tweak it, not draw 128 dots by hand.**

This is a *critical* observation for the drill editor. More below in the
synthesis.

---

## 6. Google Docs vs Apple Pages — The Minimalism Trap

Everyone assumes minimalism wins. The Docs-vs-Pages comparison is the
cleanest counter-evidence in modern software.

Pages has a gorgeous minimalist interface. Docs has an old-fashioned
toolbar that looks like Word.

Users pick Docs. Overwhelmingly.

### What users say

> "Pages suffers from an opacity problem, hiding its power behind a
> minimal interface that ends up confusing the user rather than helping
> them." — [Medium: I Wanted to Love Apple Pages](https://medium.com/@John_Spratt/i-wanted-to-love-apple-pages-heres-why-i-m-going-back-to-google-docs-0c52ce623f4e)

> "In Apple's quest for minimalism, powerful style tools are buried,
> with users constantly hunting through the Inspector sidebar [...]
> In Word or Google Docs, your toolkit is exposed."

> "Pages is lovely to look at, but for a fluid writing process, it
> simply makes you work too hard to find the tools you need."

### The Docs lesson

> **Minimalism is not the same as "hide everything." Linear and Figma
> are minimalist and also have everything one keystroke away. Pages is
> minimalist and buries everything in Inspector tabs. The difference is
> whether hidden tools are keyboard-accessible or mouse-hunt-accessible.**

If you hide it, `Cmd+K` or `/` must find it. Otherwise you are building
Apple Pages and you will be abandoned for Google Docs.

---

## 7. Tldraw — Pure Canvas Done Right

Tldraw is the most interesting reference for Show Studio because it's
a pure canvas app, open-source, React, and the founder (Steve Ruiz) has
written extensively about the philosophy.

### Layout

- **One canvas.** That's it. No left sidebar, no right sidebar.
- A **floating toolbar** at the bottom center (like Figma UI3 — tldraw
  did it first, actually).
- A **style panel** that appears only when something is selected, docked
  on the right, showing only the properties that apply to the selection.
- **Minimap top-right**, optional.

### What makes it feel native

- **The canvas is pure React components**, not `<canvas>`. Every shape
  is a React tree. This is heresy from a perf standpoint, but it enables
  a thing no other whiteboard can do: **interactive widgets inside the
  canvas.** A shape can be a video player, an iframe, a counter.
- **Undo/redo is rock solid** (this is a tldraw signature — their SDK
  exposes a fully-typed command history).
- **Camera is first class.** Zooming, panning, and fit-to-content are
  animated with easing, so navigation feels physical.

### Creating new items

- **Tool-then-click or tool-then-drag**, Figma-style.
- But also: **copy-paste any URL** and tldraw embeds it as a live widget.

### What users say

> "tldraw uses normal React components all the way down for its canvas,
> allowing interactive widgets to participate in the space of the canvas
> in a way not possible in Excalidraw."
> — [Ritza: Whiteboard comparison](https://ritza.co/articles/gen-articles/excalidraw-vs-drawio-vs-tldraw-vs-miro-vs-lucidchart-vs-figma/)

### The Tldraw lesson

> **If your canvas content is compositional and wants to contain
> interactive things (and a drill with nested sub-drills wants exactly
> this), render it as components, not as immediate-mode pixels. You pay
> a perf cost. You get recursion, accessibility, and debuggability for
> free.**

For Show Studio this is a huge deal. A drill that contains other drills
wants to be a tree of components, not a flattened list of dots.

---

## 8. Excalidraw — The Sketchpad Aesthetic

Excalidraw is tldraw's spiritual sibling. Same shape (canvas + floating
toolbar), different philosophy.

### Layout

- Canvas, floating top toolbar, floating left shape palette, floating
  right style panel. All three auto-hide in presentation mode.

### What makes it feel native

- **The hand-drawn aesthetic is the killer feature.** Everything looks
  like a marker sketch — wiggly lines, imperfect circles. This makes the
  app feel *low-stakes*. People draft in Excalidraw because it doesn't
  feel like they're making something final.
- **Libraries** — community-shared palettes of draggable shapes. This is
  the Canva trick applied to a pro canvas tool.

### The Excalidraw lesson

> **Visual language sets the emotional register of the tool. A clinical,
> CAD-like drill editor invites precision anxiety. A warm, sketchy,
> forgiving editor invites iteration. Pick deliberately.**

For drill design, you want something closer to Excalidraw's emotional
register — drill writing is iterative, you throw away 80% of what you
try, and the tool should feel cheap to experiment in.

---

## 9. Notion Calendar (née Cron) — Keyboard-First Calendar

### Layout

- **Left sidebar**: mini-month, calendar list.
- **Main pane**: week/day view.
- **Right pane** (optional): upcoming events, meeting details.
- That's it. No top toolbar to speak of.

### What makes it feel native

- **Every action has a keystroke.** 69+ shortcuts. `C` to create, `T` for
  today, `W/D/M` for views, `Cmd+K` for the command palette. The creators
  came from a philosophy that clicking is a failure mode.
- **Cmd+K command menu** is the master key, inherited from Cron and
  preserved through the Notion acquisition because nobody dared touch it.
- **Animations are chef's kiss** — dragging events feels physical, the
  time-grid scrubs smoothly, and view transitions cross-fade.

### What users say

> "Unlike other calendar apps, Notion Calendar comes with powerful
> keyboard shortcuts and a Command Menu. You can navigate, add/edit
> events, and do all other tasks without touching the mouse."
> — [Tooliphy: Notion Calendar vs Cron](https://www.tooliphy.com/post/notion-calendar-vs-cron-which-ai-enhanced-productivity-calendar-wins-in-2025)

But also a cautionary tale:

> "The developer said: 'You can press C… and then start typing.' That's
> Notion calendar still. Use a keyboard shortcut that no other popular
> calendar application uses."
> — [Medium: Love Notion, Hate Notion Calendar](https://medium.com/@iampariah/love-notion-hate-notion-calendar-c78c76ecf2ad)

### The Cron lesson

> **Keyboard shortcuts are only beloved if they match muscle memory users
> already have, OR if you reveal them aggressively. Linear wins because
> every button has its shortcut printed on it. Cron lost some users
> because its shortcuts were invented from scratch with no hints.**

Whatever you do, **show the shortcut next to the action.** Linear's
tooltips always include the key. Steal that.

---

## Common Threads — What These Apps All Do

Every single app above, despite being in different categories, shares
this list. If your app does these, it will feel native. If it doesn't,
it won't.

1. **The primary workspace is 90%+ of the viewport.** Chrome shrinks.
2. **Panels are contextual and thin.** They show only what applies.
3. **`Cmd+K` command palette** with fuzzy search over every action.
   (Linear, Figma via Quick Actions, Notion Calendar, Notion, Loom.)
4. **A "slash" or "tool-key" quick-create.** Notion's `/`, Figma's
   `F/R/T/P`, Linear's `C`, Cron's `C`.
5. **Optimistic UI.** State changes before the server confirms. No
   spinners for user-initiated actions.
6. **Animations on state, not on pages.** Things slide, grow, shrink in
   place. Pages don't fade.
7. **No modal dialogs for common actions.** Creation is inline or a
   floating card that doesn't block the canvas.
8. **Keyboard shortcuts visible on hover.** Every button has its key
   printed in its tooltip. Users learn by osmosis.
9. **Zero-state is clean.** No feature tour. One prompt: create the
   primary thing.
10. **Consistent monochrome palette + one accent.** Color is semantic,
    never decorative.

---

## Synthesis — The Drill Editor Layout

Show Studio has three irreducible things:

- A **spatial canvas** (the field — 2D, bounded, with reference lines).
- A **temporal sequence** (commands in time — like a video timeline or
  a DAW track).
- **Recursive composition** (a drill contains sub-drills, which contain
  sub-drills, etc).

No single reference app has all three. Figma has spatial + composition
but no time. Linear has neither spatial nor time. A DAW has time and
composition but not spatial. **The drill editor is a genuinely novel
UX shape**, and the layout has to reflect that.

Here is the pattern I recommend, synthesized from the above.

### The Layout

```
+-------------------------------------------------------------+
|                                                             |
|                                                             |
|                                                             |
|                       THE FIELD                             |
|                   (the canvas, ~75%)                        |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
|     +-----------------------------------------------+       |
|     |   floating bottom toolbar (tools + Cmd+K)     |       |
|     +-----------------------------------------------+       |
+-------------------------------------------------------------+
|                      THE TIMELINE                           |
|          (commands in sequence, ~20% height)                |
+-------------------------------------------------------------+
```

**Notes:**

- **No left sidebar by default.** A drill is the document. There is no
  "files" tree in the way. If you need a drill picker, it lives in
  `Cmd+K` and in a top-left hamburger that slides out.
- **No right properties panel by default.** When a performer, form, or
  command is selected, a **floating contextual inspector** docks to the
  right side of the field (not the viewport). It is thin. It shows only
  the properties of the selection. Deselect and it's gone.
- **Floating bottom toolbar**, Figma-UI3-style, tldraw-style. Tools:
  select, draw form, place performer, add command, add sub-drill. Each
  has a single-letter keystroke and the key is printed in the tooltip.
- **The timeline is always visible.** A drill without time is not a
  drill. The timeline is a thin horizontal strip — 20% of screen height,
  resizable — showing commands as blocks you can drag, trim, and nest.
- **Recursion in the timeline, not in modal.** A sub-drill is a command
  block on the timeline that, when double-clicked, **zooms you into it**
  (like entering a Figma component or a tldraw group). Breadcrumb at
  the top-left shows the nesting path. Escape zooms back out. This is
  the single most important interaction in the app and it should feel
  like stepping into a room.

### Creating New Things

Apply the Notion/Linear rule: **a single key creates the primary thing,
slash commands create everything else, drag-from-palette creates
structured things.**

- **`P`**: place performer (then click on field).
- **`F`**: draw form (then drag on field).
- **`C`**: new command (inline card on timeline).
- **`/`** inside a command: insert sub-drill, gesture, label.
- **Drag from a collapsible "Formations" palette** (Canva lesson) for
  pre-built forms (company front, block, arc, diagonal). This palette
  is hidden by default — `Shift+F` reveals it as a thin left column.
- **`Cmd+K`** is the master key for anything not covered above.

**Never** a "New Drill" modal with a name field and a template picker.
New drill = blank field, cursor ready, name lives in the top breadcrumb
as an inline-editable text.

### Default View

First load: **empty field, faint yard lines, centered camera, a single
hint at the bottom toolbar: "Press P to place a performer."** No tour.
No template gallery. No "Welcome to Show Studio." If they want a
template they can `Cmd+K` → "template."

### The Feel

Pick one emotional register and commit. I recommend **Excalidraw-warm,
Linear-fast** — forgiving visual language (soft shadows, slightly
imperfect hand-placed dots, friendly motion), underpinned by Linear-grade
responsiveness (60fps, optimistic everything, no spinners on user
actions).

The drill writer is iterating. They will throw away most of what they
make. The tool must feel **cheap to experiment in and expensive to lose
work in** — which means forgiving visuals plus rock-solid undo.

### What To Actively Avoid

- **Ribbons.** Office-style tabbed toolbars. This is what Pyware, EnVision,
  and every legacy drill editor did. It's what makes them feel like
  Windows 95. Do not.
- **Docked four-panel layouts with nothing resizable.** The moment you
  freeze the layout, the canvas gets small and the app feels like Visual
  Studio in 2008.
- **"Are you sure?" dialogs.** Undo exists. Trust it.
- **Spinners on user actions.** Optimistic or nothing.
- **A "New Drill" wizard.** Open the field.
- **Per-category colors on commands.** (See your own `feedback_no_category_colors`
  memory — you've already decided this. Keep it monochrome. Linear does.
  Figma does. The apps that don't — Notion with its emoji-per-block and
  Trello with its colored labels — are the *less* respected ones.)
- **Hiding powerful things behind "Inspector" tabs with no shortcuts.**
  Apple Pages's mistake. Every hidden thing must be `Cmd+K` reachable.

---

## The TL;DR

If I had to compress 5000 words into five sentences:

1. **The canvas is the app.** Panels are contextual, thin, and get out
   of the way. Figma proved this. Tldraw proved it harder.
2. **Every action must have a key, and the key must be visible.** Linear
   is beautiful because of this, not despite it.
3. **Creation should be one keystroke, never a modal.** Loom's no-countdown
   rule applies to everything: do not ask the user to confirm what they
   already asked for.
4. **Optimistic UI at 60fps or it doesn't feel native, full stop.** This
   is the single biggest gap between "web app" and "real app" in users'
   minds. Latency is the enemy.
5. **Recursion is a zoom, not a modal.** When a drill contains a drill,
   double-click enters it, Escape leaves it, breadcrumb shows where you
   are. Figma components, tldraw groups, and Apple Finder all do this,
   and it is the correct answer.

Build those five things and Show Studio will be the first drill editor
that anyone describes as "beautiful."

---

## Sources

- [Figma Blog — Behind our redesign: UI3](https://www.figma.com/blog/behind-our-redesign-ui3/)
- [Figma Blog — Our approach to designing UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/)
- [Figma Help — Navigating UI3](https://help.figma.com/hc/en-us/articles/23954856027159-Navigating-UI3-Figma-s-new-UI)
- [Findstack — Linear Reviews](https://findstack.com/products/linear/reviews)
- [Product Hunt — Linear Reviews](https://www.producthunt.com/products/linear/reviews)
- [Medium — I Finally Tried Linear and Now I Get the Hype](https://medium.com/@ananyavhegde2001/i-finally-tried-linear-and-now-i-get-the-hype-c5d488840278)
- [Superhuman Blog — How to build a remarkable command palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)
- [Maggie Appleton — Command K Bars](https://maggieappleton.com/command-bar)
- [Medium — Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)
- [Notion Blog — Introducing Notion Calendar](https://www.notion.com/blog/introducing-notion-calendar)
- [Notion Help — Calendar keyboard shortcuts](https://www.notion.com/help/notion-calendar-keyboard-shortcuts)
- [Tooliphy — Notion Calendar vs Cron](https://www.tooliphy.com/post/notion-calendar-vs-cron-which-ai-enhanced-productivity-calendar-wins-in-2025)
- [Medium — Love Notion, Hate Notion Calendar](https://medium.com/@iampariah/love-notion-hate-notion-calendar-c78c76ecf2ad)
- [Loom Blog — Building Loom for Desktop](https://www.loom.com/blog/behind-the-scenes-building-loom-for-desktop)
- [Workflow Automation — Loom Review](https://workflowautomation.net/reviews/loom)
- [Canva — Ultimate design tool for non-designers](https://www.canva.com/learn/ultimate-design-tool/)
- [Canva Newsroom — Empowering non-designers](https://www.canva.com/newsroom/news/empowering-non-designers/)
- [Growth Case Studies — How Canva's templates drive growth](https://growthcasestudies.com/p/canva-templates)
- [G2 Learn — How non-designers are taking over Canva](https://learn.g2.com/how-non-designers-are-taking-over-canva)
- [Medium — I Wanted to Love Apple Pages](https://medium.com/@John_Spratt/i-wanted-to-love-apple-pages-heres-why-i-m-going-back-to-google-docs-0c52ce623f4e)
- [How-To Geek — Apple Pages vs Google Docs](https://www.howtogeek.com/apple-pages-vs-google-docs-which-is-best-for-you/)
- [Oreate AI — Tldraw vs Excalidraw](https://www.oreateai.com/blog/tldraw-vs-excalidraw-finding-your-digital-sketchpad-sweet-spot/60b6daa05d25787c2db0675d5f7d9471)
- [Ritza — Whiteboard tools compared](https://ritza.co/articles/gen-articles/excalidraw-vs-drawio-vs-tldraw-vs-miro-vs-lucidchart-vs-figma/)
- [Latent Space — The Accidental AI Canvas (Steve Ruiz, tldraw)](https://www.latent.space/p/tldraw)
- [Tldraw Blog — Stay away from my trash](https://tldraw.dev/blog/stay-away-from-my-trash)
