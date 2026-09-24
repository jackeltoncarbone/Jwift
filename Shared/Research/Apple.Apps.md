# Show Studio's readings of Apple's apps

What Show Studio decided on top of Apple's first-party apps, and the house rules derived from them. Apple's facts (user guides, support articles, observed app behavior, measurements) are not repeated here: they are `Jwift/Apple/Apps.md`, with the published HIG in `Jwift/Apple/HIG.md` and apple.com in `Jwift/Apple/Web.md`. Section names below match the Apple sections they read.

## App Store: the Market (Market lane, 2026-09-16; `scrollto` lane, 2026-09-18)

Apple facts: `Jwift/Apple/Apps.md` section 1.1, `HIG.md` sections 8 and 13.

- The Market keeps its curated blocks; filter and sort went onto the one Search tab.
- The points balance sits on the Market's large-title row only for a signed-in viewer whose balance has resolved, beside Sell, because points are the currency every rail is priced in rather than an account detail.
- A marketplace whose buyers are also sellers has to decide where Sell goes; Apple gives no in-store precedent.
- **The rail is destinations** (Jack, 2026-09-17). HIG Sidebars: a sidebar navigates "areas of your app or top-level collections of content". A section of one scrolling page is a position, so a jump-to-a-section rail was a table of contents wearing a sidebar's clothes. The Market's rail is the store's categories, one group titled "Categories", each row a page at `/explore?type=<kind>`, derived from the live catalog so it cannot advertise an empty category. `?type=` lives in the URL beside `?q=` (`Search.Store.ts`), so a row is a link, a share, a crawl and a back step, and the SSR pass fetches the scoped answer. The reading column is inset by the rail's width rather than sliding under it (Apple extends artwork beneath a sidebar, not text).
- **Open, for Jack**: the app keeps a five-tab dock at every width, and Apple's `sidebarAdaptable` sidebar replaces the tab bar rather than sitting beside it. The rail is a second-level browse control (categories) that never repeats the dock's destinations, the shape App Store web has. The Apple-native morph (the dock becomes the sidebar at a regular width) is a navigation decision above this rail.

## Text over artwork on a card (2026-09-17, `Surface.jss` WidgetFoot)

Apple facts: contrast minimums and the clear-glass dimming layer are `HIG.md` sections 1.1 and 2; scroll edge blur `HIG.md` section 12; Apple does not publish a ramp height (`Apps.md` section 2). The house rule, derived and labeled as ours:

- **The words sit in the settled part, never in the ramp.** The ramp's length equals the foot's lead above the first line, so blur, dim and grade have arrived by the title's top (Jaui samples LOD = ramp squared, so a longer feather leaves the title where the blur has barely begun).
- **The settled part is the text block**, because the foot hugs its words.
- **The ramp is two of the title's line boxes, down to the 4pt grid** (22pt × 1.15 × 2 = 50.6, so 48pt).
- **The settled grade is sized for a white cover under white words**: Contrast 0.7, Brightness 0.72, a 45% dark ground takes white to 0.345 sRGB, 4.65:1 for 209-grey 15pt and 6.5:1 for the bold title. The dim is heavier than Apple's 35% because the byline is regular weight under 17pt, which the 35% (sized for bold, bright glyphs) does not cover. The card's ink is the same in both themes because the ground under it is the art.
- A card's legibility gutter is a grade on its own art, not a glass slab ("Don't use Liquid Glass in the content layer").

## The content shelf (2026-09-17, the Rail, Grid and Spotlight blocks)

Apple facts: `Apps.md` section 2. What we built:

- A rail of N is N cards in a line whatever N is; the page-width breakpoints change only how many a screen holds (three on a desktop, two on a tablet, one and a peek on a phone).
- `SectionHeadLink` with its chevron is the row title that opens all of it.
- Arrows are unmounted rather than faded when absent, because an invisible control still takes a tap on a canvas.
- A page is whole cards (`Jaui/src/Scroll/Scroll.Page.ts`, `PageTarget`): the card cut off at the trailing edge becomes the first card on the column's line, and back the other way.
- The row runs to the window's edge; the same rule as the category pills (`Surface/Search.jss`, `SearchFacets`).

## The Avatar

Apple facts: `Apps.md` section 4. Translated to our tokens, "white on grey" is the maximum-contrast label on the neutral control fill, `@Ink` on `@Fill`, because white on light mode's grey is illegible.

- The mark is read off the disc, never off an inherited page font, so a 96pt header and a 24pt byline wear the same mark at different scales.
- Sizes: `Byline` 24pt, `Row` 40pt, `Fill` 100% of a toolbar cell, `Header` 96pt.
- **We deliberately do not show the monogram under a loading photo.** The disc shows its bare plate while the photo is in flight, because a photo landing 80ms later would otherwise flash two letters on every first paint. The one place this app argues with the reference; the reason is at the call site (`Jwift.Angular/src/Avatar/Avatar.ts`).
- Ruled out: an accent-tinted monogram; a rounded square for a person; initials from the first two words of a display name; choosing the photo because a URL exists rather than because it loaded; an empty disc when a photo fails.

### An ACCOUNT ROW is not a person

Apple facts: `Apps.md` section 5.1. A monogram of a BRAND is a category error: a face treatment on a thing with no face. What it changed here:

- The avatar's ladder gained a rung the caller writes, because the call site can see whether a URL is present and never that it failed: `photo -> what the caller projects -> monogram -> silhouette`. `<avatar>` takes an `<ng-template avatarFallback>` and renders it when the photo is absent or failed; `Loading` still shows the bare plate. The linked-accounts row projects the provider's mark, so a throttled Google photo falls to Google's mark. `Authentication/SignIn.Providers.ts` carries the same reasoning for the chooser.
- **It reaches OAuth client apps too** (2026-09-17). The consent screen drew the requesting app's first letter in a gold plate and the connected-apps list each agent's first letter in a grey circle. The ladder's last rung reads the same for a company, a provider and an app: `photo -> the service's own mark -> a GENERIC GLYPH -> never an initial`. Both screens draw the generic app glyph (`square.grid.3x3`) on a squircle, the app is named in the headline and row label, and `Design/Avatar.Conformance.spec.ts`'s monogram ledger is empty.
- The mark's corner is derived: a 40pt mark leading a grouped-list row at the list's 16pt comfort is concentric with the section when its radius is the section's minus that inset, 31.5 − 16 = 15.5.

### The DEFAULT ACCOUNT

Apple facts: `Apps.md` section 5.2. Two things follow from Apple's shape: the choice belongs to the set, not to a member (one setting, not a switch per account), and the current holder is marked with the checkmark, not described.

- Our inference: a setting whose value is one of the accounts has nothing to ask when there is one account.
- `/settings/accounts` marks which linked account is PRIMARY (the one your profile's name and picture come from) and offers a neutral-glass **Change primary** control that turns the list into the checkmark picker, from two accounts up. No new server state: the API keeps at most one identity at an auto-sync slot. The three-way mode (Automatic / Ask me / Off) is gone; "stop offering me changes from this account" moved onto the prompt that raises it.

## A publisher's page (2026-09-16, the public channel page `/@handle`)

Apple facts: `Apps.md` sections 1.3 and 2. The channel page is identity, then the channel's live FUNDRAISERS (a time-boxed campaign takes Latest Release's slot and the in-app events filter: open campaigns only), then its SERVICES, then the blocks the publisher authored. For a visitor both commerce sections are absent when empty; for the owner the fundraiser section offers "Start a fundraiser" and the services section states that it is empty (our inference: the owner needs to learn the shelf exists; Apple's owner tools live in separate apps).

## Settings (the `settingsdesign` lane, 2026-09-17)

Apple facts: `HIG.md` section 11, `Apps.md` section 6. The full design is `ShowStudio.Documentation/Design/Settings.Design.md`.

Against this repo's `Jwift_List` (63pt minimum row, 15pt label, 31.5pt corner) as measured then: our row was about 10pt taller than Apple's touch row with a smaller label and about 28pt taller than the Mac row; the 31.5pt corner was derived from a 15.5pt control plus a 16pt inset, where Apple's measured section is about 26pt at the same 16pt inset. Under the one rule the Apple values in `Apps.md` section 6.1 are the target.

## A directory of many things (the admin console lane, 2026-09-17)

Apple facts: `Apps.md` section 7. Jack, pointing at Files' iCloud Drive list: "is this not similar to users but for other stuff. we are just doing a user one."

- An attribute every row has is a column under a heading that can order by it, not a pill, a chip or a clause in the subtitle.
- The trailing edge is one control, and a row that opens nothing wears no chevron.
- Title plus ONE quiet secondary line; a real icon or thumbnail per item, never a stand-in derived from the item's text.
- No standing selection affordance: selection is an edit mode, and the verbs appear at the top.
- Search is a small trailing control, not the furniture.
- A list pane centered inside a reading measure leaves a gutter that reads as more sidebar; the detail takes whatever is left (`AppPatterns.AppleApps.md`).
- What this does not license: a pane that is a settings form (grouped rows, one trailing control each) is not a table.

### A Hide My Email relay is not a name

Apple facts: `Apps.md` section 5.3. Random is the point of the string, so `5rn964njy7@privaterelay.appleid.com` in a title slot asks a reader to tell two people apart by a value designed to carry no information. Say what the row IS in Apple's own name for the thing, keep the address on the quiet line where it can be read and copied, and let the avatar fall through to its glyph.
