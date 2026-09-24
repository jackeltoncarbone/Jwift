# Apple's first-party apps: what they do

What Apple's own apps do, from Apple's user guides and support articles and from observing the apps. No Jaui, no JSS, none of our decisions: Show Studio's readings live beside the Show Studio code (`Jwift/Shared/Research/Apple.Apps.md` and `ShowStudio.Documentation/Design/`) and link here. Published HIG guidance is `HIG.md`; control sizes `Sizing.md`; apple.com `Web.md`.

Every fact carries a status:
- **[C]** Apple's own words (a user guide, a support article, a developer page), with the URL; or a value read from a live page's markup or computed style.
- **[I]** observed or measured on the apps or on Apple's figures, with the frame or method; or inferred, marked as such.

Where one of these conflicts with a decompiled value in `LiquidGlass.md` or `Sizing.md`, the decompiled value wins.

## 0. Reading the user guides

`support.apple.com` returns 403 to curl and to WebFetch. Its guides are archived and current on the Wayback Machine: [C] method, 2026-09-17

- `https://web.archive.org/web/2026id_/https://support.apple.com/guide/<book>/<topic>/<ver>/<os>/<ver>` (`id_` returns the raw page; follow redirects; the body is gzip). Books: `iphone` (`/26/ios/26`), `ipad` (`/26/ipados/26`), `mac-help` (`/26/mac/26`, or the unversioned `/<topic>/mac`).
- `.../guide/<book>/toc` lists every topic URL of that book (986 for iPhone, 915 for iPad on 2026-08-06).
- The article is the `<body class="... apd-topic ...">` block after the table of contents; iPhone pages carry a 2,000-line TOC first, Mac pages put the task in `class="Task"`.
- Wayback rate-limits bursts (429); three seconds between fetches was enough. Not every topic is archived (the Mac General and Language & Region reference pages 404 there).

## 1. App Store

### 1.1 Tabs, search, balance [C] Apple's user guides, September 2026

- The tabs, iPhone (support.apple.com/guide/iphone/get-apps-iphc90580097/ios): Today ("Browse featured stories, apps, and in-app events"), Games, Apps ("Explore new releases, see the top charts, or browse by category"), Arcade, and Search. The Apps tab is three things: what is new, ranked charts, and categories; it carries no search field and no sort control of its own. [C] words, [I] the reading
- Search is its own tab, and categories are also explorable there: "You can search by app name, category, developer, and more. You can also explore different categories or browse the suggested apps."
- The balance (support.apple.com/en-us/119902): "In the App Store, tap your photo, initials, or the My Account button" and "If you have a balance, the amount appears below your name". Mac: the bottom of the sidebar. Adding money (support.apple.com/en-us/118297): "tap your photo or initials, then tap Add Money".
- Mac App Store sidebar (support.apple.com/guide/app-store, the Categories page caption): "The sidebar on the left also includes links to other pages: Discover, Arcade, Create, Work, Play, Develop, and Updates." The items are destinations, separate pages. The account sits "at the bottom of the sidebar".
- Mac App Store account: "your name in the bottom-left corner, then Account Settings"; signing out is `Store > Sign Out` (support.apple.com/guide/app-store/fir6253293d/mac). On iPhone the same control is the photo at the top of the App Store, opening a screen of named rows (Purchased, Subscriptions, Redeem Gift Card or Code) (support.apple.com/guide/iphone/see-your-purchases-and-subscriptions-iph4e3e7324f/ios). The row order of that screen was not read.
- Nothing in the shopper guides offers listing your own work; that lives in a separate tool (App Store Connect). [I]

### 1.2 Today and the Arcade hero [I]

- Today (observed): editorial cards with full-bleed background images, large rounded corners with concentric nesting, soft shadows, long-press shrinks a card slightly; iPhone single column, iPad alternating two columns; 16 pt between cards.
- The Arcade hero, measured on a screenshot at device size:

| what | measured |
|---|---|
| hero button | 138.5 × 48.9 pt (the decompiled large button is 50, `Sizing.md` section 3) |
| button side padding | 29 pt, 0.593 of the height |
| button label cap height | 11.8 pt, so a 17 pt font |
| button brightness | additive +36 luma, constant over backdrops of luma 60 and 37 (a multiply would give +9.6 and +6.0) |
| hero artwork | standard deviation 2 to 7 top to bottom: flat, no progressive blur |
| hero fade | luma 145 to 13.6, fitted to start 0.14, width 0.65, power 3.7 (rms 0.011): the fall runs from 14% to 97% of the hero |

- The Arcade tab label is the Apple logo followed by "Arcade": the tab label carries the Apple mark because the tab is the brand. [I]

### 1.3 Developer page and in-app events

- apps.apple.com/us/developer/apple/id284417353, section headings in order: Latest Release, Built-In Apps, iPad & iPhone, Mac, Apple Vision, Apple TV, Apple Watch, iMessage. [C] public web render, 2026-09-16
- In-app events (developer.apple.com/app-store/in-app-events): the product page "displays all of your currently published events", each card an image or video, the event name, a short description and a badge; an event "can last up to 31 days". An ended event is not on the page. [C]

## 2. Apple Music, Apple TV: shelves and publisher pages

- Artist page (music.apple.com/us/artist/taylor-swift/159260351), headings in order: Latest Release, Top Songs, Essential Albums, Albums, Music Videos, Artist Playlists, Singles & EPs, Live Albums, Compilations, Appears On, More To Hear, More To See, Similar Artists. [C] public web render, 2026-09-16
- On both the developer page and the artist page: the timely item (Latest Release) leads, directly under the identity; the headings are a union over what the publisher has, so an artist with no music videos has no Music Videos shelf; the follow control belongs to the identity: "On an artist's page, tap the Favorite button" (support.apple.com/en-us/111118). [C] quote, [I] the pattern. The native apps were not observed.
- A shelf is one row at every width, never a grid that reflows: Music, TV and the App Store draw the same horizontal row on a phone and a Mac; a wider window shows more of the row. [I] observed
- The row's title opens all of it. Apple TV app on Mac (support.apple.com/guide/tvapp-mac/start-watching-atv7bf64f99/mac): "Click a row title to see all of the items in that category or view more information about the collection." [C]
- On a pointer, arrows appear only while the pointer is over the row and only on a side with somewhere to go; a press steps a page of whole cards. A touch device shows no arrows and the row is dragged, with rubber-band at the ends. The only written statement is a user in Apple Community (discussions.apple.com/thread/255089728, not Apple's documentation): "Most rows are scrollable horizontally, to list more shows for that row. Find the arrow on the right side when hovering over any row." [I]
- The row runs to the window's edge and is clipped there; the first card sits on the content line. [I] observed
- Apple does not publish the height of the legibility ramp on a Today card, a TV tile or an album tile; "roughly the lower third" is observation. [I]
- Apple TV: hero poster art (2:3 or 16:9); poster cards moved from 16:9 to 2:3; tab bar 68 pt tall, top edge 46 pt from the screen top; selected tab has a drop shadow. [I] March 2026 research, method not recorded
- Apple Music: large title, hero banner, horizontal rows, mini player floating above the tab bar; iOS 26.4 full-screen album design with complementary background colors. [I] March 2026 research

## 3. Sidebars as the apps draw them [I] observed 2026-09-17

- No first-party native sidebar seen (Mail and Siri on macOS 27, Music on macOS 26, Music in the iPad HIG art) carries a logo or app name at its top: it is a control row. Identity lives in the menu bar's app menu, the window name and the Dock.
- macOS 27 Mail draws the sidebar toggle as a round glass button at the trailing end of the sidebar's top row, beside the traffic lights (the HIG says "far leading edge", `HIG.md` section 6). iPad `sidebarAdaptable`: the toggle is the first item of the top tab bar capsule, and top trailing in the sidebar (HIG Tab bars art, Music). It hides the sidebar entirely or morphs it into the tab bar; there is no icons-only rail on iPad or Mac.
- macOS 27 Mail shows blue (accent) sidebar icons.
- Apple's web apps lead the sidebar with identity: music.apple.com with the "Apple Music" wordmark (83 × 20 SVG, a 72 px row, linking Home); apps.apple.com with the App Store glyph and "App Store" (a platform menu at wide widths). Both are 260 px wide, edge to edge and fixed, with no desktop toggle; below 484 px they become a top bar (hamburger "Open navigation" leading, wordmark centered). [C] read from the live CSS
- iPad sidebar (`layout-background-extention-view@2x.png`, 1350 × 1012 px, about 1 px per point): about 334 pt wide, rows at about a 51 pt pitch. [I]
- Notes on iPad: three panes (folders, notes list, content), the sidebar on Liquid Glass at the leading edge. [I] March 2026 research

## 4. The avatar [I] observed on Contacts, Mail, Messages, the App Store, Music (2026-09-16)

- The shape is a true circle, not a squircle. The squircle is for a container that holds content (an app icon, a card, a sheet); a person is a disc. On the App Store's account sheet the person is a circle and everything else is a rounded rectangle.
- The fallback ladder has three rungs: the photo; the monogram (Contacts takes the given name's initial and the family name's initial, never the first two words; Mail's rows and Messages' chat list take the same two letters; one letter only when there is one name); the silhouette, `person.fill` in the disc (a contact that is only a phone number, an unknown sender in Mail, the App Store account button when signed out). The system symbol for the whole unit is `person.crop.circle.fill`.
- The monogram is white on system grey in Contacts. No app tints a monogram with its accent. Messages colors the disc with a per-contact hue from a fixed palette, still not the accent.
- The silhouette is quieter than the monogram: the App Store's account glyph is the secondary label color, a monogram the primary.
- Proportions: the monogram fills about 40% of the diameter, the silhouette about 55%.
- Sizes: inside a line of text 20 to 24 pt; a list row's leading mark 40 pt (Contacts, Mail, Messages); a toolbar account control 28 to 32 pt, filling its tap target; a profile or account header about 100 pt (Contacts' card, the App Store's sheet).
- Contacts and Messages paint the monogram immediately and cross-fade the photo over it.

## 5. Accounts

### 5.1 An account row wears the service's mark

- Mail's add-account chooser (support.apple.com/en-us/102088, read 2026-09-16): a person "might be asked to choose from a list of email providers, such as iCloud, Google, yahoo!, and Outlook.com", captioned "List of email account providers on iPhone". The spelling "yahoo!" shows each row draws the service's own wordmark. [C]
- iOS Settings' account lists, macOS System Settings' Internet Accounts and Mail's sidebar identify each account by its service's mark. [I] observed
- Apple draws initials only for people, from a contact's given and family name; no first-party app sets a company's initial in a disc. A service with no mark gets a generic glyph. [I] observed
- Google's, Microsoft's and Apple's sign-in branding rules each require their own mark on a control that means "sign in with us", Apple's taking the row's ink and the other two their mandated fills. [C] the providers' published branding guidelines

### 5.2 The Default Account

- Contacts: Settings > Apps > Contacts > **Default Account**, then the account you want (support.apple.com/guide/iphone/add-or-remove-accounts-iph7edacccf9/ios). One named app-level setting holding one account, chosen from a list. [C] (the step wording is what a search of that page surfaces; the page body did not render)
- The chosen row carries the system checkmark, the mark every iOS chooser uses for the current value; nothing on the other rows says what they are not. [I] observed
- Mail carries the same setting for the sending address. iCloud.com: "**Select the Default Send Address pop-up menu, then choose an option.**" (support.apple.com/guide/icloud/choose-a-default-email-address-mmbffbba6600/icloud, read 2026-09-16): a pop-up menu on the web, a pushed list with a checkmark on the phone. [C]
- Apple publishes nothing about hiding Default Account when there is one account. [C] for the absence

### 5.3 Hide My Email

Hide My Email generates "unique, random email addresses" that forward to your real inbox, and "when you select this option in Sign in with Apple, the Hide My Email addresses created use the address domain @privaterelay.appleid.com" (support.apple.com/en-us/105078; support.apple.com/guide/icloud, mme38e1602db). [C]

## 6. Settings

### 6.1 Measured from the HIG's own figures [I] (settingsdesign lane, 2026-09-17; method: pixel measurement of the named figure at its stated scale)

- iOS 26, Calendar's New Event form (`pop-up-button-closed@2x.png`, 536 × 1162 px = 402 pt at 4/3): single-line row about 53 pt (71 to 73 px); section inset from the screen edge 16 pt; label inset 16 pt; separators inset 16 pt at both ends; section corner about 26 pt (circle fit); 36 pt between sections, with no headers in that form; values and the up/down chooser glyph in secondary ink.
- macOS, System Settings > Appearance (`colors-accent-colors-picker-multicolor@2x.png` on HIG Color, 926 × 222 px at 2x; page updated for Liquid Glass June 9, 2025): row label 13 pt in sentence case ("Text highlight color"); a pop-up row about 35 pt; a swatch row about 60 pt (the row grows for its control); label inset about 10 pt; section corner about 10 pt; section fill a hair off the window with a hairline; accent swatches 24 pt at a 36 pt pitch, the selected one ringed, its name in 11 pt secondary under it.

### 6.2 Settings taxonomy, as the 26 guides document it [C] the iPhone, iPad and Mac user guides via the Wayback route

- Appearance is in different places per platform. iPhone and iPad: **Display & Brightness** > Light / Dark, "Turn on Automatic, then tap Options", alongside Liquid Glass (Clear / Tinted), Text Size, Bold Text, True Tone, Night Shift, Display Zoom. Mac: a top-level **Appearance** area: Auto / Light / Dark, Liquid Glass, Color (the accent), Text highlight color, Icon & widget style, Folder color. Neither platform puts it in General.
- Language is in General > Language & Region on all three. iPhone lists language, region, calendar, temperature unit, measurement system, first day of week, date and number format, Live Text; iPad adds "preferred form of address"; the Mac adds **Applications**, a per-app language list in the same pane.
- Apple Account, Mac, in order: picture; Personal Information (name, birthday); Sign-In & Security; Payment & Shipping; iCloud; Family; Media & Purchases; Sign in with Apple ("appears only after you use Sign in with Apple"); Devices; Contact Key Verification; Sign Out. iPhone adds a **Subscriptions** row (Cancel, Share with Family, Renewal Receipt Emails) and puts Personal Information's "preferences for communication from Apple, and see how your data is managed" in the same row.
- macOS System Settings is entered by clicking "your name at the top of the sidebar", after which "you can use Apple Account settings to change your personal information, sign-in and security settings, payment and shipping information, and more" (support.apple.com/guide/mac-help/mchl3f671010/mac).
- Family is a top-level row under the name on iPhone ("Tap Family ... If you don't see Family, set up Family Sharing"); "Don't let others use your Apple Account, even family members. To share purchases, subscriptions ... without sharing Apple Accounts, set up Family Sharing." A group is membership, never a shared or switched identity. [C] words, [I] the last sentence
- Sign in with Apple's settings (Apple Account > Sign in with Apple) are a list of the apps using your account, each with "Stop Using".
- Mac System Settings has Back / Forward history and search suggestions "based on settings you access most often".

### 6.3 Where absence is the practice [I] observed

Safari's Develop menu does not appear until the web developer features are switched on; System Settings' Developer pane does not appear until a device is paired. A feature a person will never hold is absent, not dimmed.

## 7. Files and Finder: a directory of many things

- Files on iPad, List view, heads the list `Name | Date Modified | Kind | Size | Tags` with a small overflow at the trailing end. The active sort column is marked (brighter, with a direction chevron); headings are pressable to re-sort. [I] observed
- Finder: "Sort items, group icons and resize columns in the Finder on Mac" (support.apple.com/guide/mac-help, mchlp1745): click a column heading to sort by it, click again to reverse. [C]
- The trailing edge is one control, the disclosure chevron, and only on a row that expands: "To look deeper into a file hierarchy in List view, tap next to a folder to expand it" (support.apple.com/guide/ipad, Files basics). [C]
- Title plus one quiet secondary line ("Modified by Me"); a real icon or thumbnail per item. [I] observed
- Selection is an edit mode: "To modify multiple files or folders at the same time, tap Select, tap to select the files or folders you want to modify, then tap an option at the top of the screen (Share, Duplicate, Move, Delete, and so on)" (support.apple.com/guide/ipad, "Modify files and folders in Files on iPad"). Select reveals an empty ring per row that fills as you tap it; the verbs appear at the top; Done puts both away. [C] words, [I] the rings
- Search is a small trailing control in the bar and filters as you type. [I]
- The sidebar carries grouped destinations with small title-style group labels (Favorites, Locations, Tags); the detail area takes whatever is left. Files offers Icon, List and Column views. [I]

## 8. Documents: comments, notes, names, versions, slides

Apple publishes no HIG page on comments or document management; these are the Pages, Preview and Keynote user guides, verbatim, fetched 2026-09-16 and 2026-09-18. [C]

### 8.1 Pages comments (support.apple.com/guide/pages/add-and-print-comments)

- The subject is selected first: "Select text, or click a table cell or an object you want to add a comment to", then Comment in the toolbar or the review toolbar. No affordance makes a comment with nothing selected.
- "A small square appears in the left margin of a document to indicate a comment is attached to text". Text also gets a highlight; a shape gets a small square in the margin; a table cell gets a triangle in its corner.
- Two presentations at once: the in-place mark, and the **Comments & Changes pane** opened from the View menu.
- "Anyone you share the document with... can reply to a comment", and multiple replies "create conversation threads."
- Deleting a comment "deletes the entire conversation," while an individual reply can be removed by its author or the document owner.
- The review toolbar: "Go to the next or previous comment (or highlight)."

### 8.2 Preview notes (support.apple.com/guide/preview/add-notes-and-speech-bubbles-to-a-pdf)

- One press of the Note button, then you "type text".
- "Click a note to view it, then type new text." "To close the note, click anywhere on the PDF page."
- "You can drag the note to a different location."
- "Select the note in the sidebar, then press the Delete key."

### 8.3 Pages: naming and versions

- support.apple.com/guide/pages/save-and-name-a-document-tan95caaa4ff/mac: "Click the document name at the top of the Pages window, then type a new name." The name in the chrome is the rename control, typed in place.
- support.apple.com/guide/pages/restore-an-earlier-version-of-a-document-tan7f1de6ec5/mac: "File > Revert To (from the File menu at the top of your screen), then choose Browse All Versions"; "a thumbnail of your current version on the left and a _stack_ of thumbnails of the previous versions on the right. A vertical timeline appears on the right side of the screen."; "A restored version replaces the current version." Option-clicking gives **Restore a Copy**, which "opens the earlier version in a separate window for independent editing and saving".

### 8.4 Keynote slides (support.apple.com/guide/keynote/add-or-delete-slides-tan7223571d/mac)

- Add: "Click the Add Slide button in the toolbar, then select a slide layout", or "select the slide with the layout you want, then press Return." The new slide arrives directly after the selected one.
- Duplicate: "Select a slide or select multiple slides, then press Command-D on your keyboard."
- Delete: "Select a slide or select multiple slides, then press Delete on your keyboard."
- Keynote will not delete the only slide in a presentation. [I] observed; not on the page. The page describes no Control-click menu for the slide navigator.

## 9. Notification Center [I] observed on iOS 26 and macOS 26 (the user guides could not be read on 2026-09-17)

- The list groups by app and by time. Per-row actions sit behind a swipe. Clear All clears the pile.
- Mail's and Messages' lists head their rows with a day ladder: Today, Yesterday, weekday, date.
- Mail marks unread with a dot and weight.

## 10. The reading measure [C] UIKit, [I] measured

UIKit's `readableContentGuide` (developer.apple.com/documentation/uikit/uiview/readablecontentguide) is the app-side line length. Measured on iPad landscape at the default text size: 672 pt wide, inset 176 pt from each edge; 560 pt at the smallest text size and 896 pt at the largest standard size (useyourloaf.com/blog/readable-content-guides, which measured it). On a phone the guide is the layout margins. The large title sits on the same guide as the text. [I]

## 11. Other apps, March 2026 research [I] (secondary research across ten apps; method not recorded, unverified against the decompile)

- Weather: full-screen animated gradient backgrounds that respond to conditions; vertically stacked frosted info cards reordered by conditions (rain puts precipitation first); hourly forecast scrolls horizontally in its card; 10-day forecast with colored temperature bars.
- Photos (iOS 26): three tabs, Library, Collections, Search; about 30 images at default zoom, pinch to adjust; pinned collections above standard sections.
- Fitness+: For You, Explore, Library tabs; featured carousel; section rows; workout cards with a large image, title and metadata row.
- Home: category chips at the top (Lights, Security, Climate, Speakers, Water); resizable device tiles in a grid; sections reorderable in Edit mode; monochrome, icon-based identification rather than per-category colors.
- Maps: bottom sheet with three detents (floating, middle, full); the gap to the edges and the corner radius change per detent; search in the bottom toolbar; circular and pill glass action buttons bottom right; place cards lead with Call, Menu, Website.
- Large title 34 pt bold that becomes a 17 pt semibold inline title on scroll (`HIG.md` section 15 has the published styles).

Dropped from this research because they conflict with the decompile or with Apple's published words: the iPhone tab bar "about 83 px tall" (the bar is 54 pt of content, 62 pt outer, `Sizing.md` section 1); tab labels "10 pt Regular" (10 pt is right, the weight is heavier, `Sizing.md` section 1); Music cards as glass "4 px blur, 20% white" and a Home "glass layering 100 / 70 / 40 / 20%" (glass is not a content material, `HIG.md` section 1.2); "no pure black backgrounds" and an "8-point grid" as Apple rules (no Apple page we have read states either).
