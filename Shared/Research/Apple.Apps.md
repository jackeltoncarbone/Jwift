# Jwift Apple App Research (March 2026)

Research across 10 first-party Apple apps to inform Jwift component design.

## iOS 26 Liquid Glass Design System

Apple's 2025 redesign introduces Liquid Glass — translucent materials with real-time refraction, specular highlights, and dynamic blur. Inspired by visionOS.

- Real-time GPU rendering with glass-like optical properties
- Reflects and refracts surrounding content dynamically
- Specular highlights shift with device motion
- Adapts intelligently between light and dark environments
- Honors Reduced Transparency, Reduced Motion, and High Contrast
- **Exclusively for navigation elements** — never applied to content itself

### Where Liquid Glass Is Used
- Tab bars (float above content, minimize on scroll)
- Navigation bars (transparent with glass buttons)
- Sidebars (float on iPad, refract background)
- Control thumbs (switches, segmented controls)
- Dock, widgets, popup menus
- Bottom sheets (Maps-style floating cards)

### Where It Is NOT Used
- Content cards, lists, tables, media
- Content remains primary; controls are functional overlay

---

## Dark Mode Color System

Three-tier background hierarchy:
- **Primary**: Near-black (#1a1a1a region)
- **Secondary**: Medium dark gray (#262626 region)
- **Tertiary**: Lighter gray for emphasized sections

Text hierarchy: four levels of label opacity (primary, secondary, tertiary, quaternary).

Key rules:
- No pure black backgrounds — use near-black for OLED comfort
- No pure white text — use off-white to prevent glare
- Minimum 4.5:1 contrast ratio for text, aim for 7:1
- Slightly heavier font weights in dark mode (thin fonts wash out)
- Semantic colors that auto-adapt between light/dark

---

## Typography

**Font**: SF Pro (San Francisco)
- SF Pro Text for sizes ≤19pt
- SF Pro Display for sizes ≥20pt

| Role | Size | Weight |
|------|------|--------|
| Large Title (pre-scroll) | 34pt | Bold |
| Large Title (scrolled) | 17pt | Semibold |
| Section Header | 20pt+ | Semibold |
| Body / Links | 17pt | Regular |
| Secondary | 15pt | Regular |
| Caption | 13pt | Regular |
| Tab Bar (iPad) | 13pt | Regular |
| Tab Bar (iPhone) | 10pt | Regular |

Philosophy: Use **weight and placement** for hierarchy, not size alone. Titles shrink during scroll but stay distinct through heavier weight.

---

## Spacing System

8-point grid:
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 32-48px

Card spacing: 16px between cards, 24px for dense content.
Screen margins: 16-20px from edges.
Minimum tap target: 44x44 points.

### Concentric Corner Radius
Inner radius = parent radius - padding at each nesting level. Creates perfectly nested rounded corners throughout the hierarchy.

---

## Tab Bar (iOS 26)

- Floats above content (not docked to bottom edge)
- Liquid Glass material with blur
- **Minimizes on scroll down**, expands on scroll up
- Bottom accessory placement for mini-player / floating controls
- iPhone: bottom tab bar. iPad: sidebar in landscape
- Height: ~83px on iPhone

---

## App-Specific Findings

### Apple Music (Browse/Home)
- Large title at top (34pt bold, shrinks on scroll)
- Hero banner: full-width featured artwork at top
- Horizontal scroll rows for playlists/albums below
- Section headers: 20pt+ semibold, left-aligned
- Cards: glass blur (4px backdrop), 20% white bg, 10px radius, subtle shadow
- Mini-player floats above tab bar
- iOS 26.4: fullscreen album design with complementary background colors

### App Store (Today Tab)
- Editorial cards: full-bleed background images
- Large rounded corners with concentric nesting
- Soft shadows on all cards
- Long-press shrinks card slightly (tactile feedback)
- iPhone: single column. iPad: alternating 2-column layout
- 16pt spacing between cards

### App Store (Apps Tab, and where search, the balance and categories live)
Read from Apple's own user guides, September 2026. Quoted where the wording decides something.

- **The tabs, iPhone** (support.apple.com/guide/iphone/get-apps-iphc90580097/ios): Today ("Browse featured
  stories, apps, and in-app events"), Games, **Apps ("Explore new releases, see the top charts, or browse by
  category")**, Arcade, and Search. So the Apps tab is three things only: what is new, ranked charts, and
  categories. It carries no search field and no sort control of its own.
- **Search is its own tab**, and it is where categories are also explorable: "You can search by app name,
  category, developer, and more. You can also explore different categories or browse the suggested apps."
  One search for the whole store, never a second per-tab field.
- **Filtering and sorting belong to search, not to browse.** HIG Searching
  (developer.apple.com/design/human-interface-guidelines/searching): "In apps that use tab bars, like Photos
  and Apple TV, search is a dedicated tab", and "people appreciate the ability to scope a search or filter
  the results. For example, people might want to search for items by specifying attributes like creation
  date, file size, or file type." Also: "Clearly display the current scope of a search."
- **The balance is not chrome on the browse page.** Apple Account balance (support.apple.com/en-us/119902):
  "In the App Store, tap your photo, initials, or the My Account button" and "If you have a balance, the
  amount appears below your name". Mac is the same, at the bottom of the sidebar. Adding money
  (support.apple.com/en-us/118297): "tap your photo or initials, then tap Add Money". So the store surfaces
  a balance only once there is one, and the way to top up sits beside it.
- **Mac App Store sidebar** (support.apple.com/guide/app-store, the Categories page caption): "The sidebar on
  the left also includes links to other pages: Discover, Arcade, Create, Work, Play, Develop, and Updates."
  The sidebar items are DESTINATIONS, separate pages, not jump links to anchors on one long page.
- **Sellers are not served from the store front.** Nothing in the App Store's shopper guides offers listing
  your own work; that lives in a separate tool. A marketplace whose buyers are also sellers has to decide
  where Sell goes; Apple gives no in-store precedent.

Show Studio's reading (the Market lane, 2026-09-16): the Market keeps its curated blocks; filter and sort
went onto the one Search tab; the points balance sits on the Market's large-title row only for a signed-in
viewer whose balance has resolved, beside Sell, because points are the currency every rail is priced in
rather than an account detail; a section rail, if it returns, should follow the Mac sidebar and be
destinations rather than anchors.

### Apple TV+
- Hero: cinematic poster artwork (2:3 portrait or 16:9)
- Content rows: horizontal scroll below hero
- Tab bar: 68pt height, top edge 46pt from screen top
- Selected tab has drop shadow
- Poster cards shifted from 16:9 to 2:3 portrait (shows more content)

### Apple Weather
- Full-screen animated gradient backgrounds (respond to conditions)
- Vertically stacked frosted glass info cards
- Cards reorganize dynamically based on conditions (rain = precipitation first)
- Hourly forecast scrolls horizontally within its card
- 10-day forecast with colored temperature bars
- Glass cards appear as "panes hovering in space"

### Apple Photos (iOS 26)
- Three-tab system restored: Library, Collections, Search
- Main grid: ~30 images at default zoom, pinch to adjust
- Collections: Recent Days, Albums, People/Pets, Memories, Trips
- Pinned collections float above standard sections
- Section borders use subtle blur, not hard lines
- AI-powered Memory Maker creates themed chapters

### Apple Fitness+
- For You / Explore / Library tabs
- Featured content carousel at top
- Section rows: Activity Types, Trainers, Recently Completed
- Activity Rings: three concentric rings (Move, Exercise, Stand)
- Workout cards: large preview image + title + metadata row
- Cards use full-width or near-full-width with prominent images

### Apple Notes (iPad)
- Three-pane: folders | notes list | content
- Sidebar: Liquid Glass material on leading edge
- Adaptive toolbar above keyboard (contextual to selection)
- Gallery View alternative for visual browsing
- AI auto-categorization (receipts, to-dos, meeting notes)

### Apple Home
- Categories at top: Lights, Security, Climate, Speakers, Water (horizontal chips)
- Resizable device tiles in multi-column grid
- All sections reorderable via Edit mode
- No per-category colors — monochromatic treatment
- Icon-based identification instead of color coding
- Glass layering: 100% (essential), 70% (supporting), 40% (decorative), 20% (atmospheric)

### Apple Maps
- Bottom sheet with three detents: floating → middle → full
- Gap between card and edges decreases as sheet rises
- Corner radius adapts dynamically per detent
- Map always visible underneath transparent overlay
- Search relocated to bottom toolbar (thumb-friendly)
- Action buttons: circular/pill glass-styled, bottom-right
- Place cards: Call/Menu/Website buttons prominent at top

---

## Key Design Patterns for Jwift

1. **Large title at top** — 34pt bold, shrinks on scroll to 17pt semibold
2. **Content-first** — navigation minimizes during scroll, content stays primary
3. **Horizontal scroll rows** — featured content in swipeable card rows
4. **Frosted glass for controls only** — not for content cards
5. **Concentric corners** — radius = parent - gap at every level
6. **8pt grid spacing** — 16px between cards, 16-20px margins
7. **No category colors** — monochrome restraint, weight/placement for hierarchy
8. **Floating tab bar** — glass material, minimizes on scroll down
9. **Cards: subtle depth** — soft shadows, rounded corners, not heavy gradients
10. **Dark mode first** — near-black bg, off-white text, semantic colors

---

## Text over artwork on a card

Written 2026-09-17 for the surface's item card (`Surface.jss` WidgetFoot), whose title sat on a light
wordmark in its cover. The points above describe Today cards as "full-bleed background images" and say
nothing about how the words stay readable on them, which is where the card went wrong.

What Apple states, fetched from the HIG's own JSON (developer.apple.com/tutorials/data/design/...):

- **Contrast, by size and weight** (HIG Accessibility, the minimum contrast table): "Up to 17 pts | All |
  4.5:1", "18 pts | All | 3:1", "All | Bold | 3:1". "If your app supports dark mode, make sure to check the
  minimum contrast in both light and dark appearances." Text over a cover has to meet this against the
  BRIGHTEST cover it may land on, not the one in the mockup.
- **Dimming bright content** (HIG Materials, Liquid Glass clear variant): "If the underlying content is
  bright, consider adding a dark dimming layer of 35% opacity", and "If the underlying content is
  sufficiently dark ... you don't need to apply a dimming layer." So a dim is Apple's own answer to bright
  media, and it is a floor for bold, bright glyphs rather than a fixed value.
- **What a blur edge does** (HIG Scroll views): "Scroll edge effects further enhance legibility by blurring
  and reducing the opacity of background content." The SOFT style "applies a variable blur that provides a
  softer fade"; the HARD style "a more opaque blur with a defined edge", which Apple prefers for "text that
  appears outside of Liquid Glass controls". Blur and a reduced range together, never blur alone.
- **Content is not glass** (HIG Materials, carried in Apple.LiquidGlass.md): "Don't use Liquid Glass in the
  content layer." A card's legibility gutter is a grade on its own art, not a glass slab laid on it.

What Apple does NOT state anywhere we have read: the height of the ramp on a Today card, a TV tile or an
album tile. "Roughly the lower third" is observation, not documentation. The house rule below is derived,
and is labelled as ours:

- **The words sit in the settled part, never in the ramp.** The ramp's length equals the foot's lead above
  the first line, so the blur, dim and grade have all arrived by the title's top. A longer feather than lead
  puts the title where the blur has barely begun (Jaui samples LOD = ramp squared), which was the defect.
- **The settled part is the text block**, because the foot hugs its words: title alone is a short gutter,
  title, byline and two lines of description a tall one.
- **The ramp is two of the title's line boxes, down to the 4pt grid** (22pt x 1.15 x 2 = 50.6, so 48pt):
  long enough to read as the soft variable blur, short enough that the art above stays the card.
- **The settled grade is sized for a WHITE cover under white words.** Compress contrast first so dark art
  keeps its depth, then darken and dim: Contrast 0.7, Brightness 0.72, a 45% dark ground takes white to
  0.345 sRGB, 4.65:1 for 209-grey 15pt and 6.5:1 for the bold title. The dim is heavier than Apple's 35%
  because the byline is regular weight under 17pt, which the 35% (sized for bold, bright glyphs) does not
  cover. The card's ink is the same in both app themes because the ground under it is the art, not the page.

## The content shelf: a row that scrolls, at every size

Written 2026-09-17 for the surface's Rail, Grid and Spotlight blocks, which WRAPPED above a phone width, so
a row of four drew as three and an orphan. Every seeded row happened to hold a multiple of three, which is
why nobody saw it. The points above say "horizontal scroll rows" and "swipeable card rows" but say nothing
about width, the pointer or the edge, which is where the build went wrong.

- **A shelf is one row at every width, never a grid that reflows.** Apple Music, Apple TV and the App Store
  draw the same horizontal row on a phone and on a Mac; a wider window shows more of the row, not a second
  line of it. So "a rail of N" is N cards in a line whatever N is, and the page-width breakpoints only change
  how many cards a screen holds (three on a desktop, two on a tablet, one and a peek on a phone).
- **The row's title is the way to see all of it.** Apple TV app on Mac, "Start watching"
  (support.apple.com/guide/tvapp-mac/start-watching-atv7bf64f99/mac): "Click a row title to see all of the
  items in that category or view more information about the collection." Our `SectionHeadLink` with its
  chevron is that title. The row scrolling is for browsing; it is not the only way to reach the end.
- **On a pointer, arrows; on touch, the row itself.** Apple's Mac guides describe the Next button on the
  featured area and scrolling the page, but do not spell out the row arrows. The behaviour is stated plainly
  by a user in Apple Community (discussions.apple.com/thread/255089728, an Apple Community answer, NOT Apple's
  own documentation): "Most rows are scrollable horizontally, to list more shows for that row. Find the
  arrow on the right side when hovering over any row." That matches the Mac apps: arrows appear only while
  the pointer is over the row, only on a side with somewhere to go, and a press steps a page of whole cards.
  A touch device shows no arrows at all and the row is dragged directly, with the scroll view's rubber-band at
  the ends. Our build: the arrows are UNMOUNTED rather than faded when absent, because an invisible control
  still takes a tap on a canvas (see the house trap about invisible cells).
- **A page is whole cards.** The card cut off at the trailing edge becomes the first card, on the column's
  line; going back, the card cut off at the leading edge becomes the last. A page never leaves a card half
  seen at the edge it moved from. (Engine: `Jaui/src/Scroll/Scroll.Page.ts`, `PageTarget`.)
- **The row runs to the window's edge and is clipped there.** The first card sits on the page's content
  line, and the row continues past the column to the edge of the window, so the cut card reads as the row
  continuing rather than the row stopping short. Same rule as the App Store's category pills
  (`Surface/Search.jss`, `SearchFacets`).

---

## The Avatar (Contacts, Mail, Messages, the App Store account sheet)

Written 2026-09-16, because our research carried nothing about the one mark that appears on more screens
than any other, and fourteen files in the app had each invented it. Sourced from the first-party apps
rather than apple.com, per the "where they disagree, the app wins" rule.

**The shape is a TRUE circle.** Not a squircle. Apple's squircle is for a container that holds content
(an app icon, a card, a sheet); a person's face is a disc. Contacts, Mail's list rows, Messages' chat
rows, the App Store's account button and Music's profile are all circles, and Apple uses the circle
*because* it distinguishes a person from a thing: on the App Store's account sheet the person is a circle
and everything else on the same sheet is a rounded rectangle.

**The fallback ladder has exactly three rungs, and no app skips one.**

1. **The photo.**
2. **The MONOGRAM.** Contacts takes the GIVEN NAME's initial and the FAMILY NAME's initial — first and
   last, never the first two words. Mail's rows and Messages' chat list take the same two letters from the
   contact card. One letter only when there is one name.
3. **The SILHOUETTE.** `person.fill` inside the disc — what Contacts draws for a contact that is only a
   phone number, what Mail draws for an unknown sender, and what the App Store's account button is when
   nobody is signed in. The system symbol for the whole unit is `person.crop.circle.fill`.

**The material is NEUTRAL and the ink is the label colour.** Contacts draws the monogram in white on
system grey. Apple does not tint a monogram with the app's accent colour anywhere — a face is identity,
and identity is not a brand. (Messages is the one app that colours the disc, and what it colours it with
is a per-contact hue from a fixed palette, still not the app accent. That is a deliberately social
treatment; a productivity app's list stays grey.) Translated to a two-theme token system, "white on grey"
is the maximum-contrast label colour on the neutral control fill, because white on light mode's grey is
illegible — so it is `@Ink` on `@Fill`, not `rgb(255,255,255)` on `@Fill`.

**The silhouette is quieter than the monogram.** The App Store's account glyph is the secondary label
colour while a monogram is the primary one: a monogram is a fact about a person, and the silhouette is
the absence of one.

**The proportions, measured off the apps rather than published by Apple:** the monogram fills about
**40% of the diameter** and the silhouette about **55%**. Both are read off the DISC, never off an
inherited page font, so a 96pt header disc and a 24pt byline mark wear the same mark at different scales.

**The sizes Apple actually uses**, for the four places a face appears:

| Where | Apple | App analogue |
|---|---|---|
| Inside a line of text (a byline) | 20–24pt | `Byline`, 24pt |
| A list row's leading mark | **40pt** (Contacts, Mail, Messages) | `Row`, 40pt |
| A toolbar / navigation-bar account control | 28–32pt in the bar, filling its tap target | `Fill`, 100% of the cell |
| A profile or account HEADER | 100pt-ish (Contacts' card, the App Store's sheet) | `Header`, 96pt |

**Apple shows the monogram UNDER a loading photo** — Contacts and Messages both paint the monogram
immediately and cross-fade the photo over it. We deliberately do not: the disc shows its bare plate while
the photo is in flight, because a photo that lands 80ms later would otherwise flash two letters on every
first paint. That is the one place this app argues with the reference, and the reason is written at the
call site (`Jwift.Angular/src/Avatar/Avatar.ts`).

**What Apple would explicitly NOT do:** tint a monogram with the app accent; use a rounded SQUARE for a
person; derive initials from the first two words of a display name; choose the photo because a URL exists
rather than because it loaded; or show an empty disc when a photo fails.

### An ACCOUNT ROW is not a person: it wears the service's own mark

Written 2026-09-16, the day after the section above, because the ladder it describes gave a wrong answer on
a real screen and the reason was that the ladder had nothing to say about a row whose subject is a SERVICE.

**What Apple does.** An account is listed by the mark of the service it belongs to. Mail's add-account
chooser is the clearest published case: Apple's own support article says a person "might be asked to choose
from a list of email providers, such as iCloud, Google, yahoo!, and Outlook.com", under the figure caption
"List of email account providers on iPhone"
([support.apple.com/en-us/102088](https://support.apple.com/en-us/102088), read 2026-09-16). Note the
spelling **yahoo!** — lower case, with the bang. Apple is not setting those rows in its own type at all; it
is drawing each service's own wordmark, which is why the brand's own casing survives into the list. The same
holds once an account exists rather than being added: iOS Settings' account lists and macOS System Settings'
Internet Accounts identify each account by its service's mark, and Mail's sidebar groups mailboxes under it.

**What this rules out, and it is the rule we got wrong:** a monogram of a BRAND. Apple draws initials for
people, from a contact's given and family name, and nowhere in any first-party app does it take the first
letter of a company and set it in a grey disc. A service Apple has no mark for gets a generic glyph, never
its initial. So "G" in a circle is not a weaker version of Google's mark; it is a category error, a face
treatment applied to a thing that has no face. It reads as a bug, and on our own linked-accounts screen it
read as one two sections above the same brand's full-color mark.

**The brand guidelines say the same thing from the other side.** Google's, Microsoft's and Apple's
sign-in branding rules all require their own mark on a control that means "sign in with us", with Apple's
required to take the row's ink and the other two their mandated fills. A linked-account row IS a sign-in
method, so the mark is not merely preferable there, it is what the provider's own rules ask for. Our
`Authentication/SignIn.Providers.ts` already carried that reasoning for the chooser; it applies equally to
the list of methods already linked.

**What it changed here.** The avatar's ladder gained a rung the CALLER writes, because the call site can see
whether a URL is present and can never see that it failed - only the primitive knows that. So:

    photo -> what the caller projects -> monogram -> silhouette

`<avatar>` takes an `<ng-template avatarFallback>` and renders it, instead of the monogram, when the photo
is absent or FAILED; `Loading` is untouched and still shows the bare plate. The linked-accounts row projects
the provider's mark, so a throttled Google photo now falls to Google's mark at the same size the add-a-method
rows draw it. A person's monogram stays what it always was: a fact about a PERSON.

**What could not be read, said plainly.** Apple's HIG page "Managing accounts", the iPhone and Mac user
guides' account pages and the HIG's DocC data endpoints all returned no body text through the tools
available here (they render client-side; the DocC JSON 404s). The published citation above is therefore the
support article, and the Settings/Mail/System Settings behavior is recorded as first-party-app observation
in the same way the rest of this section's measurements are, not as a quotation. (Corrected 2026-09-17: the
DocC JSON does NOT 404 at the right path; see "How to read the HIG when the site renders client-side" at the end
of this file. The user guides are still blocked.)

**The rule reaches further than an account row, and it took a second lane to find out where.** Written
2026-09-17 by the account-and-settings design lane. The section above was aimed at a LINKED ACCOUNT - a
sign-in method whose provider publishes a mark - and it was read narrowly, as a rule about providers. It is
not. It is a rule about the difference between a PERSON and a THING, and two screens were still breaking it
on a subject that has no provider mark at all: an **OAuth client application**.

The consent screen drew the requesting app's first letter in a gold plate, and the connected-apps list drew
each authorized agent's first letter in a grey CIRCLE. Both were admitted to
`Design/Avatar.Conformance.spec.ts`'s monogram ledger, with a reason: "an app has no photo to fall back
from and no given/family name to take two letters from, so it wears one letter of its client name". That
reasoning stops one step early. The absence of a mark is not a licence to invent a face for something that
has none; this section's own words are "a service Apple has no mark for gets a generic glyph, NEVER its
initial", and it says why in the next breath - "it is a category error, a face treatment applied to a thing
that has no face. It reads as a bug." The circle made it worse, because the circle is the one shape this
file says Apple reserves *because* it distinguishes a person from a thing.

So the ladder's last rung reads the same for a company, a provider and an app:

    photo -> what the caller projects (the service's own mark) -> a GENERIC GLYPH -> never an initial

Both screens now draw the generic app glyph they already used for their own empty state
(`square.grid.3x3`) on a **squircle**, and the monogram ledger is EMPTY for the first time - thirteen
classes have been through it and none is left. The app is named in the headline and in the row label,
where a name belongs.

**The corner of that mark is derived, not chosen**, and it is worth recording because it is the one place
this family gets to use the concentricity law properly. A 40pt mark leads a grouped-list row at the list's
16pt comfort, uniformly inset, so it is concentric with the section when its radius is the section's minus
that inset: 31.5 - 16 = **15.5** - which is the radius of the control the list's own corner was derived
from, so the arithmetic closes.

### The DEFAULT ACCOUNT: how Apple lets a person say which account is the one

Written 2026-09-16, the same day as the account-row section above, because the row told us what an account
LOOKS like and said nothing about the one setting an account list actually carries: which of several
accounts is the one the app uses by default. Our linked-accounts screen had answered that question with a
three-way mode per account (Automatic / Ask me / Off), and a mode is not what Apple ships.

**What Apple ships is a NAMED SETTING THAT HOLDS ONE ACCOUNT, chosen from a list of the accounts.** In
Contacts the setting is called **Default Account**, it lives at the app level rather than on any one
account, and it is set by choosing an account from a list: Settings > Apps > Contacts > **Default
Account**, then the account you want
([support.apple.com/guide/iphone/add-or-remove-accounts-iph7edacccf9/ios](https://support.apple.com/guide/iphone/add-or-remove-accounts-iph7edacccf9/ios)).
Mail carries the same setting for the address a new message is sent from.

Two things follow from that shape, and both are the opposite of a per-account mode:

- **The choice belongs to the SET, not to a member of it.** There is one Default Account setting, not a
  switch on every account. A per-account control has to be read N times and reconciled by the person; a
  single-valued setting cannot contradict itself.
- **The current holder is MARKED, not described.** The list is a picker and the chosen row carries the
  system's checkmark, which is the same mark every other iOS chooser uses for the current value. Nothing
  on the other rows says what they are not.

**The one verbatim line the tools could read**, and it is from the web client rather than the phone: on
iCloud.com, "**Select the Default Send Address pop-up menu, then choose an option.**"
([support.apple.com/guide/icloud/choose-a-default-email-address-mmbffbba6600/icloud](https://support.apple.com/guide/icloud/choose-a-default-email-address-mmbffbba6600/icloud),
read 2026-09-16). Worth keeping because it shows the same setting taking the shape of its platform: a
pop-up menu on the web, a pushed list with a checkmark on the phone. The concept is "one named setting
holding one account"; the picker is whatever that platform's choosers are.

**Our inference, marked as ours rather than Apple's:** a setting whose value is one of the accounts has
exactly one possible value when there is one account, so it has nothing to ask. Apple publishes no
sentence about hiding Default Account for a single account, and this was not read off a device. It is
stated here as the reasoning our own screens follow, not as a quotation.

**How Show Studio translates it.** `/settings/accounts` now marks which linked account is PRIMARY (the
one your profile's name and picture come from) and offers a neutral-glass **Change primary** control that
turns the account list itself into the checkmark picker. The affordance appears only from two accounts up.
It needed no new server state: the API already keeps at most one identity at an auto-sync slot and demotes
the previous holder when a new one is set, so "primary" is that slot said in a word a person can read. The
three-way mode is gone from the list; the one part of it that is not a question about WHICH account
("stop offering me changes from this account") moved onto the prompt that raises it.

**What could not be read, said plainly.** The iPhone and Mac user guides render client-side, so the
Contacts page above returns navigation and no body text through the tools available here; the step wording
quoted from it is what a search of that page surfaces, not a body read. That is the same blindness
recorded in the account-row section, and it has not changed.

---

## A publisher's page (the App Store developer page, the Apple Music artist page)

Written 2026-09-16 for the public channel page (`/@handle`). Our research described Browse and Today but
never the page a PUBLISHER gets, which is the one a channel is.

**Measured, not recalled.** The public web renders of both pages were read the same day and their section
headings listed in order:

- **App Store developer page** (`apps.apple.com/us/developer/apple/id284417353`): Latest Release, Built-In
  Apps, iPad & iPhone, Mac, Apple Vision, Apple TV, Apple Watch, iMessage.
- **Apple Music artist page** (`music.apple.com/us/artist/taylor-swift/159260351`): Latest Release, Top Songs,
  Essential Albums, Albums, Music Videos, Artist Playlists, Singles & EPs, Live Albums, Compilations, Appears
  On, More To Hear, More To See, Similar Artists.

**Three rules fall out of that, and both pages obey all three.**

1. **The TIMELY thing leads.** Both open on Latest Release, directly under the identity, above the durable
   catalogue. What is happening now outranks what has always been there.
2. **A shelf exists because it holds something.** The headings are a union over what the publisher HAS. An
   artist with no music videos has no Music Videos shelf, not an empty one; a visitor is never shown a heading
   followed by nothing. (Our inference, marked as ours: the person who OWNS the page is a different reader, who
   needs to learn the shelf exists in order to fill it. Apple's own owner-side tools live in separate apps,
   App Store Connect and Apple Music for Artists, so Apple publishes no owner view of these pages to copy.)
3. **The follow control belongs to the identity.** Apple's support article: "On an artist's page, tap the
   Favorite button," which sits at the top with the name
   ([support.apple.com/en-us/111118](https://support.apple.com/en-us/111118), read 2026-09-16).

**Time-boxed campaigns are EVENTS, and the product page shows only the live ones.** Apple's in-app events
page: the product page "displays all of your currently published events", each card carrying an image or
video, the event name, a short description and a badge, and an event "can last up to 31 days"
([developer.apple.com/app-store/in-app-events](https://developer.apple.com/app-store/in-app-events/), read
2026-09-16). An ended event is not on the page.

**How Show Studio translates it.** The channel page is identity, then the channel's live FUNDRAISERS (a
time-boxed campaign, so it takes rule 1's slot and the events rule's filter: open campaigns only), then its
SERVICES, then the blocks the publisher authored. For a visitor both commerce sections are absent when empty
(rule 2); for the owner the fundraiser section offers "Start a fundraiser" and the services section states
that it is empty.

**What could not be read, said plainly.** The HIG has no page for a profile or publisher page, and the Apple
Music and iPhone user-guide pages render client-side and returned only navigation through the tools
available. The section orders above are the public WEB renders; the native apps were not observed.

---

## Settings: the shape, the row and the group, read from Apple's own pages and pixels

Written 2026-09-17 by the `settingsdesign` lane. The full design built on it is
`ShowStudio.Documentation/Design/Settings.Design.md`; this section keeps only the Apple facts, so the next
lane does not re-derive them.

### How to read the HIG when the site renders client-side

Earlier sections of this file (and `Apple.LiquidGlass.md`) record the HIG and DocC endpoints as unreadable. They
are readable; the paths were wrong:

- **Page text:** `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`
  (e.g. `settings`, `lists-and-tables`, `toggles`, `pop-up-buttons`, `sidebars`, `split-views`, `layout`,
  `color`). DocC JSON: `primaryContentSections[].content` holds headings, paragraphs and lists; `references`
  resolves inline links and images; the change log is the last table.
- **Page figures:** `https://developer.apple.com/tutorials/images/com.apple.HIG/<name>@2x.png` (and
  `<name>~dark@2x.png`). Image names are the `references` entries of `type: image`, each with an `alt` that says
  what the figure shows. These are Apple's own pixels at a stated scale, so they can be MEASURED.
- **API reference:** `https://developer.apple.com/tutorials/data/documentation/<framework>/<symbol>.json`
  (e.g. `swiftui/groupedformstyle`, `swiftui/labeledcontent`, `uikit/uiview/readablecontentguide`).
- **Still blocked:** `support.apple.com/guide/...` returns 403 to curl and to WebFetch alike.

### What the HIG says settings is (HIG "Settings", change log June 10, 2024)

- *"Minimize the number of settings you offer."*
- *"Put general, infrequently changed settings in your custom settings area ... both apps and games might offer
  options related to people's accounts."*
- *"Respect people's systemwide settings and avoid including redundant versions of them in your custom settings
  area"*, and *"an app can detect whether people are currently using Dark Mode."*
- macOS: panes switched by a toolbar; *"a settings window accommodates the size of the current pane"*; *"Include
  a settings item in the App menu"* with Command-Comma; *"Avoid adding settings buttons to a window's toolbar"*;
  *"Update the window's title to reflect the currently visible pane"*; *"Restore the most recently viewed pane."*

### The row and the group, in Apple's words

- SwiftUI `GroupedFormStyle`: *"Rows in this form style have leading aligned labels and trailing aligned controls
  within visually grouped sections."*
- SwiftUI `LabeledContent`: a subtitle is *"a view builder that creates multiple Text views where the first text
  represents the title and the second text represents the subtitle"*; read-only values are selectable.
- Toggles, iOS: *"Use the switch toggle style only in a list row."* *"Outside of a list, use a button that behaves
  like a toggle, not a switch."* macOS: *"Within a grouped form, consider using a mini switch to control the
  setting in a single row. The height of a mini switch is similar to the height of buttons and other controls,
  resulting in rows that have a consistent height."*
- Pop-up buttons: *"a flat list of mutually exclusive options"*; iPadOS: *"consider using a pop-up button instead
  of a disclosure indicator to present multiple options for a list item."*
- Lists and tables: *"the grouped style uses headers, footers, and additional space to separate groups of data"*;
  *"Use an info button only to reveal more information about a row's content"*; a disclosure indicator for
  drilling in.
- Adopting Liquid Glass (technology overview): *"lists, tables, and forms have a larger row height and padding.
  Sections have an increased corner radius"*; section headers take *"title-style capitalization ... no longer
  render entirely in capital letters."* **Note what it does not say: it does not make a section header large.**
  A title-case header is still a small header.

### Measured from Apple's figures

**iOS 26, Calendar's New Event form** (`pop-up-button-closed@2x.png`, 536×1162 px = 402pt at 4/3):
single-line row **≈53pt** (71–73 px); section inset from the screen edge **16pt**; label inset **16pt**;
separators inset **16pt at BOTH ends**; section corner **≈26pt** (circle fit); **36pt** between sections, with
no headers at all in that form; values and the up/down chooser glyph in secondary ink.

**macOS, System Settings > Appearance** (`colors-accent-colors-picker-multicolor@2x.png` on the HIG Color page,
926×222 px at 2x; the page was updated for Liquid Glass June 9, 2025): row label **13pt**, and in **sentence
case** ("Text highlight color"); a pop-up row **≈35pt**; a swatch row **≈60pt** (the row grows for its control
and stays one row); label inset **≈10pt**; section corner **≈10pt**; section fill a hair off the window with a
hairline; accent swatches **24pt at a 36pt pitch**, the selected one ringed, its name in 11pt secondary UNDER it.

**iPad sidebar** (`layout-background-extention-view@2x.png`, 1350×1012 px, ~1px per point): sidebar **≈334pt**,
rows at a **≈51pt** pitch.

**Against this repo's `Jwift_List`** (63pt minimum row, 15pt label, 31.5pt corner): our row is ~10pt taller than
Apple's TOUCH row with a smaller label, and ~28pt taller than the Mac row. The 31.5pt corner was derived from a
15.5pt control plus a 16pt inset; Apple's measured section is ≈26pt at the same 16pt inset.
