# App Patterns: Document & List Editors

Research on beloved single-document / list editing experiences, with the goal of informing the recursive drill editor (drills → cards → drills). Focus: **what does it feel like to add the next thing, and how does the app get out of the way while you do it?**

---

## 1. Notion — The Block as Universal Primitive

### Layout
- **Three zones:** collapsible left sidebar (workspace tree), a centered document column, and an optional right rail for comments/AI.
- The document column is **content-first**: page title at top, then blocks. Chrome is minimal — breadcrumbs in a thin top bar, page icon, cover image.
- **Toggle sidebar** is a single keystroke. Most power users keep it closed while writing.

### How Focus Is Achieved
- Sidebar collapses. Top bar shrinks to breadcrumbs only.
- No persistent formatting toolbar — formatting appears as a **floating bubble** only after you select text.
- Block handles (the `⋮⋮` drag grip and `+` add button) **only appear on hover**. While typing, the document looks like a plain page.

### How Blocks Are Added
This is Notion's crown jewel. Three overlapping mechanisms:

1. **Slash command (`/`)** — pops a command menu at the caret. Type `/todo`, `/h2`, `/page`, `/toggle`, `/code`. The menu is fuzzy-matched and keyboard-driven.
2. **Enter creates a new block.** Every new line is a block. No ceremony.
3. **Markdown shortcuts** — `#` + space becomes H1, `[]` becomes a todo, `>` becomes a toggle, `-` becomes a bullet. You never have to reach for the menu for common blocks.
4. **The `+` button on hover** — the mouse-first path. Drag handle (`⋮⋮`) lets you reorder or open a block action menu.

### Navigation
- **Breadcrumbs** at the top show the full path up the page tree. Clickable.
- **Nested pages:** a page block inside a page. Click the page block to navigate into it — full-page transition, breadcrumb grows by one.
- **Inline page refs:** `@` or `[[` to mention/link any page inline. Typing `+ New Page` in the dropdown creates a new sub-page inline (per Notion Help: *"just type + followed by the name of the sub-page you want to create"*).
- **Backlinks** are hidden by default behind a small toggle under the title. Notion chose restraint: the graph is there, but it doesn't scream.
- **Cmd+P / Cmd+K** quick-find anywhere.

### The Feel
> *"All the core things I love about Notion, like databases and dashboards."*
> *"I love this feature!"* (re: web bookmark block)

The complaint heard most often — and it matters for any slash-driven editor:
> *"Typing slash for any reason pops up the Basic Blocks selection window, even when using slash in normal contexts like '10 / 2 = 5' or 'a/b testing'."*

**Lesson:** slash commands are magic, but they must degrade gracefully when the user isn't actually commanding.

### Key Insight for a Recursive Editor
Notion's killer move is that **a page is a block, a block can become a page**. The promotion is zero-friction: type content, then later press "turn into page" and it becomes navigable. For drills-referencing-drills, this is the template — a card is a card until it becomes a sub-drill.

---

## 2. Linear — The Keyboard Is the App

### Layout
- **Left sidebar:** team/project tree, collapsible, often toggled off.
- **Center:** list view (issues as dense rows) OR board view.
- **Detail pane:** issues open in a **modal/slide-over**, not a new page. You never lose your place in the list.
- **Cmd+K command bar:** the single universal entry point.

### How Focus Is Achieved
- Detail panes overlay the list with a dim backdrop; Escape returns instantly.
- Lists use tight, uniform rows — no per-item chrome, no buttons until you hover or select.
- Colors are used sparingly (priority dots, status circles). Everything else is grayscale. It *looks* monochrome at a glance.

### How Items Are Added
- **`C`** — create issue. A modal opens, pre-focused on the title. Tab through status/assignee/priority/labels. Enter to save, Shift+Enter to save and create another.
- **`Cmd+K`** — open the command bar. Fuzzy-search any action: "Create issue", "Assign to me", "Move to backlog". The command bar is also how you **navigate** — type a project name, jump there.
- **Sub-issues** are just nested issues with a parent pointer. Added from the issue detail with a single shortcut.
- **No drag-drop-first UX.** Everything has a keyboard equivalent and the keyboard is the primary path.

### Navigation
- `G` then a letter — Go-to patterns: `G I` inbox, `G V` current cycle, `G B` backlog. Two-key chord navigation.
- Breadcrumbs in the detail modal show team → project → issue.
- Back/forward work like a browser.

### The Feel
> *"Linear has 50ms interactions and real-time sync."*
> *"Every action in Linear has a keyboard shortcut... mastering keyboard shortcuts transforms issue tracking from a series of clicks into fluid, rapid-fire actions — you'll navigate between projects, create tickets, and update statuses without breaking your mental flow."*
> *"The keyboard-first design philosophy permeates every interaction."*

Linear's own design blog ("Invisible Details") emphasizes that the *absence* of visible chrome is deliberate — the app should feel like muscle memory, not a dashboard.

### Key Insight for a Recursive Editor
**The list IS the editor.** You don't click into a detail page to add things; you add them inline and open the detail pane only when you need more fields. For a drill = list of cards, this is the model: the list of cards is the primary surface, a card's detail is a slide-over, never a page transition.

---

## 3. iA Writer — Pure Text, No Apologies

### Layout
- **One column. That's it.** Optional library sidebar (toggle off and forget it).
- Menus live in the OS menu bar, not the window. The window itself is just a page.
- A thin, near-invisible status line at the bottom (word count, time).

### How Focus Is Achieved
- **Focus Mode** — fades everything except the current sentence (or paragraph/line, configurable). The rest of the document goes gray. You are pulled into *now*.
- **Typewriter Scrolling** — the line you're typing stays pinned at the vertical center. Your eyes never move; the page moves under you.
- **Full Screen** — no window chrome, just text.
- **Syntax highlighting** for parts of speech (nouns, verbs, adjectives) is optional — even the "fanciest" iA feature is subtractive.

### How Content Is Added
- **You just type.** There is no block menu. Markdown is the format; you write `#`, `**`, `-`.
- **Content blocks** (images, tables, CSVs, other files) are added via **`/` + filename**: `/chart.png`, `/table.csv`. The file is *transcluded* as a reference, not embedded as bytes. This is iA's one slash-command and it's for file references only.
- Per iA's docs: *"This feature allows you to embed visual content blocks into your file without having to take your fingers off the keyboard."*

### Navigation
- **Wiki-style links** — `[[Page Name]]` creates a cross-document link (added in iA Writer 6).
- No breadcrumbs. No backlinks panel. No graph view. You go back to the library and pick another file.
- The library is a flat file system. Folders are folders.

### The Feel
> *"Delightful to use."* — The New York Times
> *"The minimalist style... is kind with their eyes and the focus mode, like a typewriter, reminding them of their grandfather's."*
> *"The focus mode forces users to read sentence by sentence, meaning they are far more likely to actually read the sentence."*
> *"Devoid of extraneous features while pushing the boundaries of minimalistic apps."*

### Key Insight for a Recursive Editor
iA's restraint proves you can ship a wildly loved editor with **one command** (`/` for transclusion). The radical lesson: **typing and Enter should cover 95% of actions.** Don't build a menu for a thing a keystroke can do.

---

## 4. Bear — The Aesthetic Sanctuary

### Layout
- **Three panes** (on Mac): tag sidebar, note list, editor.
- On iPhone: drill-down from tags → notes → editor.
- Editor is a **single column of beautiful typography.** Markdown is rendered inline — you see `**bold**` become bold *without* the asterisks hiding (they stay, but styled subtly).

### How Focus Is Achieved
- Collapse both side panels → just the editor.
- Markdown syntax stays visible but fades into a muted color. You never lose your "source" but it doesn't shout.
- Every theme is hand-tuned — typography, color, line spacing. The writing surface itself *feels* curated.

### How Content Is Added
- **Type markdown.** `#` headers, `-` lists, `> ` quotes.
- A subtle shortcut bar above the keyboard on iOS for formatting.
- **Tags are inline:** `#work/projects/website` — typed anywhere in the note, they become hierarchical folders in the sidebar.

### Navigation
- **Nested tags as hierarchy** — type `#parent/child/leaf` and the sidebar grows collapsible sections. No folder management UI; the text *is* the structure.
- **Note links** — `[[Note Title]]` to cross-reference.
- No breadcrumbs — the sidebar shows location.

### The Feel
> *"Typing in Bear, with its clean Markdown syntax that hides automatically and that iconic red-and-white theme, gives the illusion that you're crafting a masterpiece."*
> *"It feels like a sanctuary — a place where you can escape messy system files and focus solely on a pristine canvas."*
> *"Bear is a joy to write in, with elegant typography where the interface stays out of your way and formatting happens with subtle animations that make the writing process pleasant."*
> *"Bear is the note-taking app for people who think Obsidian has too many buttons."*

### Key Insight for a Recursive Editor
Bear's superpower is that **structure emerges from text**, not from UI. You don't click "New Folder"; you type `#folder/sub` and the sidebar rearranges itself. For the drill editor, consider: could card types emerge from typed prefixes, rather than from a picker?

---

## 5. Apple Notes — Ruthless Simplicity, Quiet Depth

### Layout
- **Three panes** (Mac/iPad): folders, note list, editor. On iPhone, drill down.
- Editor is mostly chromeless — a thin toolbar that 99% of users ignore.
- Notes list supports **Gallery view** (visual thumbnails) or **List view**.

### How Focus Is Achieved
- Hide folders pane. Hide notes list. You're left with just the page.
- No styling by default — it *looks* like ruled paper.
- **Pinned notes** float in a small "Pinned" section above the main list, visually separated.

### How Content Is Added
- **Tap and type.** That's the whole interaction model.
- Format bar (Aa) is buried one tap away.
- **Quick Note** (iPadOS 15 / iOS 16) — swipe up from a corner from anywhere in the OS and capture a note instantly, without opening the app. This is the fastest capture gesture on any platform.
- **Checklists, tables, attachments** via the format bar.

### Navigation
- **Folders and subfolders** via drag.
- **#tags** (added later) for cross-cutting views.
- **Smart Folders** — saved searches.
- **Links between notes** exist but are deeply de-emphasized.

### The Feel
Apple Notes is *loved* precisely because it doesn't try hard. It's the note app you recommend to your parents — and then catch yourself using because the friction is *zero*. The lesson is not "be feature-poor," it's **"make the default path so fast that users never have to think about the app at all."**

### Key Insight for a Recursive Editor
**Pinned** is a powerful primitive — a lightweight "this matters right now" separate from structural hierarchy. Consider it for drills.

---

## 6. Craft — Blocks With Soul

### Layout
- **Sidebar + document.** Document column is wider than Notion's, with larger typography.
- **Cards/subpages display as styled blocks** inline — they're not just a text link, they're a mini preview card you click to enter.
- Animations are native iOS/Mac — spring transitions, real physics.

### How Focus Is Achieved
- Sidebar hides.
- On iPad/iPhone, navigation into a subpage is a native push transition, not a fade. It *feels* like traveling into a document.

### How Blocks Are Added
- **Every paragraph is a block.** Per Craft docs: *"Every paragraph in Craft is a Block, and each block can contain its own content and serve a dual purpose as both text on a page and as the title/entry point to a deeper page with its own nested content."*
- **Drag and drop is first-class.** Reviewers call it *"the first notes app that was clearly built from the ground up with drag and drop in mind."*
- **Slash menu** for block types, similar to Notion but with richer visual previews.
- **Turn any block into a subpage** with one command — promotion without ceremony.

### Navigation
- **Subpages nest arbitrarily deep** — *"pages within pages within pages."*
- Breadcrumbs at top.
- **Backlinks** panel available but opt-in.

### The Feel
> *"Craft stands out for its clean UI and polished experience with drag-and-drop block handling, smooth navigation, and responsive layouts — the app feels 'native' and carefully thought-out, appearing more elegant than heavier tools like Notion."*
> *"Craft perfectly combines the aesthetics of writing with document structure, making it one of the best interactive experiences in the Apple ecosystem today."*

The honest critique:
> *"The learning curve was noticeable... initially it can be confusing to remember where things were, especially when nesting subpages."*

**Lesson:** arbitrary nesting needs *wayfinding* (breadcrumbs, back button, visual affordances) or users get lost. This is directly relevant to recursive drills.

### Key Insight for a Recursive Editor
Craft nails the **"a block can become a page" promotion** with native animation. The spatial feeling of "traveling into" a sub-drill is what you want. Don't fade — *push*.

---

## 7. Obsidian — The Graph Is the Point

### Layout
- **Highly configurable multi-pane.** Typical: file tree left, editor center, backlinks/outline right.
- Power users tile 4+ panes. Beginners collapse to just the editor.
- Plugin-driven — the layout *is* the product.

### How Focus Is Achieved
- **Zen mode** hides all panels.
- **Focus mode** (via plugin) dims non-current paragraph, iA-Writer-style.
- Markdown with live preview — you can toggle between source and rendered.

### How Content Is Added
- **Type markdown.** Everything is a `.md` file on disk.
- **`[[` wiki-link** — autocomplete pops up. Type the name of a note; if it doesn't exist, it creates a **placeholder link** you can click later to create the note on demand.
- Per user reports: *"When journaling in a Daily Note and mentioning 'project X,' you can type [[Project X]] — that note is now connected, even if it doesn't exist yet, as Obsidian creates a placeholder until you fill it in later."*
- **Command palette** (Cmd+P) for everything else.

### Navigation
- **Backlinks pane** shows every note that references the current one. *"A backlink shows you where a note is being referenced from — when you open a note and scroll to the backlink pane, you'll see every note that references it, creating a network of thought."*
- **Graph view** — the full knowledge network as a force-directed graph.
- **Daily notes** as a navigation spine — jump to today, yesterday, tomorrow.

### The Feel
> *"Users report benefits including serendipity of rediscovering forgotten notes by browsing backlinks, clarity from seeing how everything fits together, and creativity emerging when linking old ideas together."*
> *"Linking is the core mechanic that transforms Obsidian from a note storage tool into a personal knowledge system."*
> *"The passionate endorsements often highlight the empowerment users feel when tailoring Obsidian to their specific needs."*

### Key Insight for a Recursive Editor
**Forward-creation from links.** In Obsidian, the act of *referencing* a not-yet-existing thing creates a placeholder. For drills: typing `@some-drill-that-doesnt-exist` should create a stub drill on the spot, click-to-fill-in-later. This turns writing into structure-building.

---

## Synthesis — What a Beloved Document/List Editor Looks Like

### The Universal Traits

**1. One column of content. Everything else hides.**
Every app above collapses to a single editing column when the user wants to focus. Sidebars, toolbars, metadata — all optional, all keyboard-toggleable. The default answer to "where should this chrome go?" is **"not visible right now."**

**2. Chrome appears on hover or on selection, never persistently.**
Notion's drag handles, Linear's row actions, Bear's format bar on iOS — all materialize when needed and vanish otherwise. A resting document should look like a document, not a cockpit.

**3. Typing and Enter are the primary primitives.**
Writing text and pressing Enter should cover 80%+ of actions. Every "add a thing" flow terminates in a pre-focused text input — no modal fields to fill before you can type.

**4. Slash (`/`) is the escape hatch, not the front door.**
Slash commands are powerful *because* they're rarely needed. When every block insertion requires slash, the editor feels like a CLI. When slash is there for the rare case, it feels like a superpower. **Markdown shortcuts beat slash menus** for the common 6 block types (heading, list, todo, quote, code, divider).

**5. Cmd+K is the universal verb dispatcher.**
Linear, Notion, Obsidian, Craft all have a command palette. It is the one consistent "how do I do anything" affordance. If you only build one shortcut, build this.

**6. Navigation is spatial and reversible.**
Breadcrumbs (Notion, Craft), back button (everyone), push transitions (Craft), slide-over panes (Linear). Users must always know *where they are* and be able to *go back*. Arbitrary nesting without wayfinding breeds anxiety — this is Craft's explicit critique.

**7. Structure emerges from text, not from UI.**
- Bear: `#tag/sub` → sidebar hierarchy
- Obsidian: `[[link]]` → placeholder note
- Notion: `+ page name` → inline sub-page creation
- iA Writer: `/filename` → transclusion
The user never opens a "New Folder" dialog. They type, and the organizational structure follows.

**8. Promotion without ceremony.**
A block can become a page. A note can become a folder. An item can become a list. The *same content* can be inline today and nested tomorrow with one command. This is what "recursive" feels like when it's done right.

### How Users Add New Items — The Common Shapes

| Shape | Where | When to use |
|---|---|---|
| **Enter at end of line** | Notion, Bear, iA, Apple Notes, Obsidian | The new item is the same type as the previous. 80% case. |
| **Slash command** | Notion, Craft, iA (for files) | New item is a different type. Pops a menu. |
| **Markdown shortcut** | Bear, Obsidian, iA, Notion | Fast type coercion — `#`, `-`, `[]`, `>`. |
| **Hover `+` button** | Notion, Craft | Mouse users; fallback for discoverability. |
| **Global hotkey `C`** | Linear | Create from anywhere in the app. Modal opens pre-focused. |
| **Command bar (Cmd+K)** | Linear, Notion, Obsidian, Craft | The "I forgot the shortcut" safety net. |
| **Reference-as-creation** | Obsidian, Notion | Typing `[[X]]` or `@X` creates X as a stub if it doesn't exist. |

### What to Steal for the Recursive Drill Editor

You're building a list of cards where a card can become a drill. Here's the synthesis, opinionated:

1. **The drill view is a Linear-style list**, not a Notion-style document. Dense rows. Every row is a card. Uniform height, minimal per-row chrome. The list is the editor.

2. **Enter adds a card below the current one.** Pre-focused, ready to type. This is the 80% action and it must be one key.

3. **Markdown-style type coercion beats a picker.** If the user types a recognizable syntax (`>` for a conditional, `@` for a reference, `#` for a marker), coerce the card type automatically. Reserve slash for the *rare* case.

4. **`Cmd+K` is the universal command bar.** Fuzzy-search every action: create card, jump to drill, convert to sub-drill, duplicate. One surface to rule them all.

5. **A card can be promoted to a sub-drill with one command** (`Cmd+Shift+→` or a slash command). The card stays in place, but becomes an entry point. This is Craft's and Notion's shared superpower.

6. **Sub-drills open as a slide-over or a push transition**, never a full page replacement that loses list context. Linear's slide-over is the safer default; Craft's push is prettier but riskier for wayfinding.

7. **Breadcrumbs at the top of every drill**, always. Arbitrary recursion without wayfinding is where Craft users get lost — don't repeat their mistake.

8. **Reference-as-creation.** Typing `@OtherDrill` where `OtherDrill` doesn't exist should create a placeholder drill on the spot. Obsidian's move — it turns authoring into structure-building and removes the ceremony of "first go create the thing, then come back and reference it."

9. **Focus mode hides everything except the current drill's card list.** Sidebar gone, breadcrumb collapsed to a single back chevron, no properties panel. iA Writer and Bear both prove this is what users actually want 80% of the time.

10. **The resting state looks like content, not a form.** No button, no icon, no chrome visible on a card until the user hovers or selects it. The user should feel like they're looking at *the drill*, not at *the drill editor*.

### The Single Most Important Rule

> **The user thinks "what should happen next?" and the app responds with a blinking cursor.**

Every beloved editor above shares this trait: the act of wanting to add the next thing and the act of being able to type it are **separated by zero steps**. No modal. No picker. No "click here to add." Just Enter, then type.

Build for that, and everything else is commentary.

---

## Sources

- [Notion — Using slash commands](https://www.notion.com/help/guides/using-slash-commands)
- [Notion — Links & backlinks](https://www.notion.com/help/create-links-and-backlinks)
- [Notion — Transforming content blocks](https://www.notion.com/help/guides/transforming-content-blocks-in-notion)
- [HN discussion — on Notion usage](https://news.ycombinator.com/item?id=25521854)
- [iA Writer — product page](https://ia.net/writer)
- [iA Writer — Focus Mode docs](https://ia.net/writer/support/editor/focus-mode?tab=mac)
- [iA Writer — Content Blocks docs](https://ia.net/writer/support/library/content-blocks)
- [MacStories — iA Writer 4 Content Blocks](https://www.macstories.net/ios/ia-writer-4-adds-markdown-content-blocks/)
- [MacStories — iA Writer 6 Cross-Document Linking](https://www.macstories.net/reviews/ia-writer-6-adds-cross-document-linking-metadata-and-more/)
- [Bear — How to use tags](https://bear.app/faq/how-to-use-tags-in-bear/)
- [TapSmart — The classic app: how Bear made note-taking fast and beautiful](https://www.tapsmart.com/features/classics-bear/)
- [Robert Breen — Bear 2 for Writing and Thinking](https://robertbreen.com/2024/02/23/bear-2-for-writing-and-thinking/)
- [Medium — Why Bear App Is My Favourite Notes App](https://medium.com/productivity-matters/why-bear-app-is-my-favourite-notes-app-83d2377abde9)
- [Craft — Documents, Pages and Blocks](https://support.craft.do/hc/en-us/articles/360019555537-Documents-Pages-and-Blocks)
- [MacStories — Craft Review](https://www.macstories.net/reviews/craft-review-a-powerful-native-notes-and-collaboration-app/)
- [The Sweet Setup — A Beginner's Guide to Craft](https://thesweetsetup.com/a-beginners-guide-to-craft-documents-pages-and-blocks/)
- [Obsibrain — Obsidian Linking Guide](https://www.obsibrain.com/blog/obsidian-linking-the-complete-guide-to-connecting-your-notes)
- [SitePoint — A Guide to Obsidian](https://www.sitepoint.com/obsidian-beginner-guide/)
- [Linear — Conceptual model docs](https://linear.app/docs/conceptual-model)
- [Linear — Creating issues](https://linear.app/docs/creating-issues)
- [Linear on Medium — Invisible Details](https://medium.com/linear-app/invisible-details-2ca718b41a44)
- [Maggie Appleton — Command K Bars](https://maggieappleton.com/command-bar)
- [Apple — Organize notes in folders](https://support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios)
- [MacRumors — iOS 16 Notes changes](https://www.macrumors.com/guide/notes-reminders-ios-16/)
- [HN — Ask HN: Is there a note taking app you're 100% happy with?](https://news.ycombinator.com/item?id=25561398)
