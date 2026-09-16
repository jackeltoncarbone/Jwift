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
in the same way the rest of this section's measurements are, not as a quotation.

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
