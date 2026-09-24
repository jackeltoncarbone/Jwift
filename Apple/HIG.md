# Apple's published guidance

What Apple publishes: the Human Interface Guidelines, the WWDC25 sessions, the API reference. No Jaui, no JSS, none of our decisions: those live beside the Show Studio code and link here. The material's internals are in `LiquidGlass.md`, control sizes in `Sizing.md`, first-party app behavior in `Apps.md`, apple.com's own pages in `Web.md`.

Every fact carries a status:
- **[C]** Apple's published words or tables, with the page or session named. Quotes are verbatim.
- **[I]** our inference from those words, marked as ours.

Where a published statement and a decompiled value in `LiquidGlass.md` or `Sizing.md` disagree, the decompiled value wins.

## 0. Reading the HIG

The HIG site renders client side, so a plain fetch returns only the title. The data behind it is readable: [C]

- Page text: `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`. DocC JSON: `primaryContentSections[].content` holds headings, paragraphs, lists and tables (tabbed tables are `tabNavigator`); `references` resolves inline links and images; the change log is the last table.
- Page figures: `https://developer.apple.com/tutorials/images/com.apple.HIG/<name>@2x.png` (and `<name>~dark@2x.png`). Image names are the `references` entries of `type: image`, each with an `alt`. These are Apple's own pixels at a stated scale, so they can be measured.
- API reference: `https://developer.apple.com/tutorials/data/documentation/<framework>/<symbol>.json` (e.g. `swiftui/groupedformstyle`, `uikit/uiview/readablecontentguide`).
- `support.apple.com/guide/...` returns 403 to a direct fetch; the Wayback Machine route is in `Apps.md` section 0.

Sources read in full for sections 1 to 7 (2026-09-14): the technology overview "Adopting Liquid Glass" and the "Liquid Glass" landing page; WWDC25 219 "Meet Liquid Glass", 356 "Get to know the new design system", 323 "Build a SwiftUI app with the new design", 284 "Build a UIKit app with the new design" (full transcripts); HIG Materials, Layout, Menus, Context menus, Pull-down buttons, Pop-up buttons, Buttons, Toolbars, Tab bars, Sheets, Popovers, Action sheets, Alerts, Sidebars, Split views, Windows, Lists and tables, Scroll views, Search fields, Sliders, Toggles, Segmented controls, Text fields, Typography, Color, Dark Mode, Icons, App icons; the API pages for `Glass`, `glassEffect`, `GlassEffectContainer`, `glassEffectID`, `glassEffectUnion`, `ConcentricRectangle`, `rect(corners:isUniform:)`, `ScrollEdgeEffectStyle`, `backgroundExtensionEffect`, `safeAreaBar`, `ButtonBorderShape`, `ControlSize`, `UIGlassEffect`, `UIGlassContainerEffect`, `UICornerConfiguration`, `UIScrollEdgeElementContainerInteraction`, `UIMenu.preferredElementSize`, `NSGlassEffectView`, `NSGlassEffectContainerView`, and the Landmarks sample.

## 1. Liquid Glass, in Apple's words

"A new digital meta-material that dynamically bends and shapes light"; the visuals and the motion "were designed as one". One floating functional layer for controls and navigation, not a content material. [C] session 219

| layer | Apple's words (session 219 unless named) | status |
|---|---|---|
| Lensing | "the primary way Liquid Glass visually defines itself"; it "dynamically bends, shapes, and concentrates light in real time" | [C] |
| Highlights | "Light sources inside of this environment shine on the material producing highlights that respond to geometry... these lights move in space, causing light to travel around the material, defining its silhouette"; they move on interaction (lock and unlock) and, on some devices, with device motion | [C] |
| Shadow | "increases the opacity of its shadow when it is over text" and "lowers the opacity of its shadow when it is over a solid light background" | [C] |
| Tint and dynamic range | "the amount of tint and the dynamic range shift to always ensure buttons remain legible, while letting as much of the content through as possible" | [C] |
| Light and dark flip | small elements "flip from light to dark based on the background"; "bigger elements, like menus or sidebars also adapt based on context, but they don't flip" | [C] |
| Interaction glow | "the material illuminates from within... starting right under your fingertips, the glow spreads throughout the element and onto any Liquid Glass elements nearby" | [C] |
| Materialize | "Liquid Glass objects materialize in and out by gradually modulating the light bending and lensing", not by fading | [C] |
| Morph | "the bubble simply pops open to reveal the content contained within"; "this lightweight, in-line transition keeps everything right where you just tapped" | [C] |
| Size | when glass "morphs to larger sizes, like when presenting a menu from a toolbar button, its material characteristics change to simulate a thicker, more substantial material. It casts deeper, richer shadows, has more pronounced lensing and refraction effects, and a softer scattering of light". UIKit (session 284): "A larger size is more opaque. A smaller size is clearer, and switches between light and dark mode automatically" | [C] |
| Ambient spill | on large elements "light from colorful content nearby can subtly spill onto its surface... the light reflects, scatters, and bleeds into the shadow as well" | [C] |
| Focus | "when a window loses focus on the Mac or iPad, Liquid Glass shifts its appearance and visually recedes" | [C] |

How each layer is actually built (the filter, its laws and values) is `LiquidGlass.md`.

### 1.1 The two variants [C] HIG Materials, session 219

- **Regular**: every adaptive behavior above; "blurs and adjusts the luminosity of background content to maintain legibility"; for anything with text (alerts, sidebars, popovers) and by default. "Provides legibility regardless of context."
- **Clear**: "highly translucent", "permanently more transparent"; no adaptive behavior; only for components "that float above media backgrounds, such as photos and videos". "If the underlying content is bright, consider adding a dark dimming layer of 35% opacity"; "If the underlying content is sufficiently dark ... you don't need to apply a dimming layer." The SwiftUI sample uses `.background(.black.opacity(0.3))`. Three conditions for clear: the element is over media-rich content, the content layer is not hurt by a dimming layer, and what sits on the glass is bold and bright. "They should never be mixed."

### 1.2 Rules of use [C] HIG Materials, session 219, 323

- "Don't use Liquid Glass in the content layer." "Including it in the content layer can result in unnecessary complexity and a confusing visual hierarchy." Content surfaces use the standard materials.
- "Always avoid glass on glass." Things placed on glass use "fills, transparency, and vibrancy" so they read as a thin overlay that is part of the material.
- "Use Liquid Glass effects sparingly", only for "the most important functional elements". "Overusing this material in multiple custom controls can provide a subpar user experience by distracting from that content."
- Apply the material to the control itself, "not its inner views".
- Custom glass views go in one container (`GlassEffectContainer`, `UIGlassContainerEffect`, `NSGlassEffectContainerView`) so they share one sampling region: "glass can not sample other glass". The container's `spacing` is the distance at which two shapes start to merge "like small droplets of water"; Apple's samples use 20 and 40 points.
- Transitions in a container: `matchedGeometry` for shapes within the container spacing, `materialize` for shapes further apart. Set the effect, never the alpha, so the glass materializes.
- Background extension view: "use a background extension view to provide the appearance of content behind the control layer on either side of the screen, such as beneath the sidebar or inspector." (HIG Materials)

### 1.3 Interaction [C] session 323, 284

- Interactive glass "reacts to user interaction by scaling, bouncing, and shimmering".
- Sliders and toggles are content-layer controls whose knob "transforms into Liquid Glass during interaction"; the resting state stays quiet. Sliders "preserve momentum and stretch when they are moved".
- Menus, popovers, alerts, sheets and action sheets "flow smoothly out of liquid glass controls"; the presenting button "morphs into the overlay".

### 1.4 Accessibility modifiers [C] session 219

- Reduce Transparency: "frostier and obscures more of the content behind it".
- Increase Contrast: "predominantly black or white" with "a contrasting border".
- Reduce Motion: "decreases the intensity of some effects and disables any elastic properties".

## 2. Color [C] HIG Color, Dark Mode, Accessibility

- "By default, Liquid Glass has no inherent color, and instead takes on colors from the content directly behind it."
- Tint is stained glass: "selecting a color generates a range of tones that are mapped to content brightness underneath". A solid fill "is completely opaque and breaks the visual character".
- Tint only the primary action, and the background rather than the label: "apply color to the background rather than to symbols or text"; "refrain from adding color to the background of multiple controls"; one or two prominent buttons per view.
- Labels on small glass are monochrome and flip with the glass. Over colorful content, prefer the monochrome bar.
- Provide light and dark variants of every custom color "even if your app ships in a single appearance mode", and an increased contrast variant.
- Dark Mode: contrast at least 4.5:1, aim for 7:1 for custom text.
- Minimum contrast by size and weight (HIG Accessibility): "Up to 17 pts | All | 4.5:1", "18 pts | All | 3:1", "All | Bold | 3:1". "If your app supports dark mode, make sure to check the minimum contrast in both light and dark appearances."
- System colors, dark: Red 255 66 69, Orange 255 146 48, Yellow 255 214 0, Green 48 209 88, Mint 0 218 195, Teal 0 210 224, Cyan 60 211 254, Blue 0 145 255, Indigo 109 124 255, Purple 219 52 242, Pink 255 55 95, Brown 183 138 102. Grays: gray 142 142 147, gray2 99 99 102, gray3 72 72 74, gray4 58 58 60, gray5 44 44 46, gray6 28 28 30. Labels have four levels (label, secondary, tertiary, quaternary), separators one; Dark Mode has base and elevated backgrounds.
- Stale on macOS: HIG Color says "General > Accent color settings" and HIG Dark Mode "the graphite accent color in General settings", which is pre-Ventura. macOS 26 has it at Appearance > Color (`Apps.md` 6.3). [C] both sides

## 3. Shapes [C] session 356, `ConcentricRectangle`, `UICornerConfiguration`

"Apple's hardware features a consistent bezel and that same precision now guides the UI, with curvature, size, and proportion aligning."

| shape | rule | API |
|---|---|---|
| Fixed | constant radius | `.rect(cornerRadius:)`, `.fixed(r)` |
| Capsule | "a radius that's half the height of the container" | `Capsule`, `.capsule(maximumRadius:)` |
| Concentric | "calculate their radius by subtracting padding from the parent's" | `ConcentricRectangle`, `.concentric(minimum:)`, `.containerConcentric()` |

- Nested containers "should be concentric to allow the system to calculate the inner radii automatically". Pinched or flared corners "create tension and break the sense of balance".
- A concentric corner far from the container's corner resolves to zero; `concentric(minimum:)` gives a fallback so a component works "both inside a container and on their own".
- `isUniform: true` computes each corner, takes the largest and applies it to all four. A capsule that gets too tall can break out with `maximumRadius`.
- Phone edges: "use a capsule with extra margin to create space near the screen edge". iPad and Mac: "use a concentric shape that aligns with the window edge".
- The capsule "naturally supports concentricity", which is why it is "in the mirrored proportions of sliders and switches, and echoed in bars, buttons, and the rounded corners of grouped table views".
- Views are "mathematically centered when it makes sense, and subtly offset when it doesn't".
- Menus: "a popup menu on macOS and a context menu on iOS might not look the same, but both include a selection indicator, icon, label, and accessory item."

**The continuous curve, as published.** `CALayerCornerCurve.continuous` carries no discussion text; `RoundedCornerStyle.continuous` is "Continuous curvature rounded rect corners."; `UIBezierPath(roundedRect:cornerRadius:)` says only that it makes a closed subpath clockwise. Apple DTS (developer forums thread 787405) on `CIRoundedRectangleGenerator.smoothness`: 0 "make the output use a simple radius where the shape goes from line to curve to line", 1 "makes the transition from line to curve smooth like icons do (setting to 1 should match CAs result)". [C] Apple publishes no curve; the curve itself, read from QuartzCore and CoreGraphics, is `LiquidGlass.md` section 10.

## 4. Buttons [C] HIG Buttons, session 323

- Hit region "at least 44x44 pt" (visionOS 60x60).
- "Bordered buttons now have a capsule shape by default." iOS: capsule at every size. macOS: mini, small and medium "retain a rounded-rectangle shape, which preserves horizontal density"; large and the new extra large are capsules. Sizes: mini, small, regular, large, extraLarge. "Most controls on macOS are slightly taller."
- Styles: `glass` and `glassProminent` (the material tinted with the accent). UIKit `.glass()`, `.prominentGlass()`, `.clearGlass()`, `.prominentClearGlass()`.
- Always include a press state. Use style, not size, to mark the preferred option. Roles: normal, primary (accent), cancel, destructive (system red; never primary).
- visionOS sizes, published: mini 28, small 32, regular 44, large 52, extra large 64 pt. These are visionOS only; the iOS heights are `Sizing.md` section 3.
- One prominent action per view: HIG Color ("refrain from adding color to the background of multiple controls", one or two prominent buttons per view) and HIG Toolbars (one prominent primary action on the trailing edge).

## 5. Menus [C] HIG Menus (updated June 8, 2026, "Updated guidance for menu item icons"), Context menus, Pull-down buttons, session 356, 323, 284

- Layouts (iOS, iPadOS): **small**, a row of four unlabeled icons above the list; **medium**, a row of three icons with short labels; **large**, the default, all items in a list. Items beyond the top row render as full rows.
- Icons sit on the leading edge "and are now used on macOS too". "Use the symbol once to introduce the group, and let text do the rest" for closely related actions.
- "**Use menu item icons sparingly and with purpose.** Icons allow people to find menu items more quickly, and help clarify what selecting an item does. Use an icon to highlight the most common actions and key features of your app, file system locations, connected devices, visual concepts like rotating or flipping an image, and user-generated content like folders and documents. **Don't display an icon if you can't find one that clearly represents the menu item.**"
- "**Apply a uniform visual treatment across menu items in the same group.** For visual consistency and balance, **provide icons for all menu items in a group, or none of them**."
- "**Represent common actions consistently.** The system provides standard icons to represent common actions like Share, Print, and Search."
- "**Be mindful of menu length.** People need more time and attention to read a long menu, which means they may miss the command they want. If a menu is too long, consider dividing it into separate menus. Alternatively, you might be able to use a submenu to shorten the list, such as listing difficulty levels in a submenu of a New Game menu item. The exception is when a menu contains user-defined or dynamically generated content, like the History and Bookmarks menus in Safari. People expect such a menu to accommodate all the items they add to it, so a long menu is fine, and scrolling is acceptable."
- "**Consider grouping logically related items.**" "To help people visually distinguish such groups, use a **separator**. Depending on the platform and type of menu, a separator appears between groups of items as a horizontal line or a short gap in the menu's background appearance." "**Prefer keeping all logically related commands in the same group**, even if the commands don't all have the same importance." Context menus: no more than about three groups.
- "**Prefer listing important or frequently used menu items first.**" Destructive items last, red, confirmed by an action sheet (iOS) or popover (iPadOS).
- "**Use submenus sparingly.**" "**Limit the depth and length of submenus.** ... it's generally best to restrict them to a single level. Also, **if a submenu contains more than about five items, consider creating a new menu**." "**Make sure a submenu remains available even when its nested menu items are unavailable.**" "**Prefer using a submenu to indenting menu items.**"
- "**Show people when a menu item is unavailable.** An unavailable menu item often appears dimmed and doesn't respond to interactions. If all of a menu's items are unavailable, the menu itself needs to remain available so people can open it and learn about the commands it contains."
- Labels: title-style capitalization, verbs, no articles, an ellipsis when more input follows.
- The menu is the button's glass popped open; it stays where the finger tapped. As a large element it takes the thick material and never flips light or dark (section 1).

Menu sizes are `Sizing.md` section 4.

## 6. Toolbars and navigation bars [C] HIG Toolbars, session 356, 284

- Bars are transparent; items sit on glass. "Remove any background customization." "Reduce the use of toolbar backgrounds and tinted controls." "Use the content layer to inform the color and appearance of the toolbar."
- Items are "automatically separated into visual groups"; each group shares one glass background. Image buttons share; "text buttons, the system Done and Close buttons, and prominent style buttons have separate glass backgrounds". A fixed spacer splits a group; a flexible spacer splits backgrounds unless `hidesSharedBackground` is false.
- "Don't mix text and icons across items that share a background." "Minimize the number of groups... aim for a maximum of three."
- "Prefer system-provided symbols without borders." "Borders (like outlined circle symbols) aren't necessary because the section provides a visible container." Monochrome.
- Exactly one prominent (tinted) primary action, on the trailing edge, "often as a blue checkmark".
- "By default, standard buttons, text fields, headers, and footers have corner radii that are concentric with bar corners." Custom items must be too.
- Large titles scroll with the content; a subtitle can sit under the title. "Keep the title under 15 characters." "Don't title windows with your app name."
- Leading edge: back, sidebar, title, document menu. Center: common controls. Trailing: important items, inspectors, search, More, Done. The sidebar toggle: "far leading edge".

## 7. Tab bars [C] HIG Tab bars, session 323, 284

- Floats above content at the bottom on iPhone; near the top on iPad, convertible to a sidebar (`sidebarAdaptable`: "Both variations include a button that people can use to switch between them").
- Minimizes on scroll (`tabBarMinimizeBehavior`), re-expands on the opposite scroll or a tap.
- Search is a separate tab at the trailing end (`Tab(role: .search)`); tapping it turns the tab into a search field and the other tabs collapse.
- An accessory view (the mini player) sits above the bar and drops inline when the bar minimizes.
- Labels under icons in compact width, beside them in regular width. "Prefer filled symbols or icons for consistency with the platform." Badges red. "Prefer a monochromatic appearance for tab bars" over bright, colorful content.

Tab bar sizes and springs, from the decompile, are `Sizing.md` section 1.

## 8. Sidebars [C] HIG Sidebars (change log June 8, 2026: "Updated guidance for sidebar icon colors, and clarified guidance for the adaptable sidebar style")

- "A sidebar appears on the leading side of a view and lets people navigate between **areas of your app or top-level collections of content**, like folders and playlists."
- "In general, show no more than two levels of hierarchy in a sidebar"; "If you need to include two levels of hierarchy in a sidebar, use succinct, descriptive labels to title each group"; "Consider using familiar symbols to represent items in the sidebar"; "Extend visually rich content beneath the sidebar".
- "By default, sidebar icons use your app's accent colors", with fixed colors allowed "sparingly" (Mail's yellow VIP). The monochrome rule is a tab bar rule.
- Sidebars "can float above content in the Liquid Glass layer"; the background extension effect "mirrors the adjacent content" and blurs it; scroll views extend under sidebars by default. Inspectors get "a more subtle layering".
- **OS 27: edge to edge again.** apple.com/os/macos and support.apple.com/en-us/127257: "Uniform toolbars, edge-to-edge sidebars, and updated window shapes and menu bar icons deliver a more refined design." iPadOS 27 says the same. The HIG page (June 8, 2026) has not restated it. macOS 26 Music shows the inset floating panel; macOS 27 Mail runs the sidebar to the window edges.
- The toggle: `sidebarToggle` (SwiftUI, "added by default" by `NavigationSplitView`), `NSToolbarItem.Identifier.toggleSidebar` (AppKit), "Show/Hide Sidebar" (the View menu), "show/hide sidebar toolbar buttons" (macOS 27 release notes).
- Named slots (SwiftUI): `tabViewSidebarHeader` ("appears at the top of the sidebar before any tab labels"), `tabViewSidebarFooter`, `tabViewSidebarBottomBar` ("pinned at the bottom"; Apple's example is "an account button").

What first-party sidebars actually show is `Apps.md` section 3.

## 9. Sheets [C] HIG Sheets (updated March 24, 2026)

- "A sheet helps people perform a **scoped task that's closely related to their current context**."
- "**For complex or prolonged user flows, consider alternatives to sheets.**" iOS and iPadOS offer a full-screen modal style for multistep tasks like document or photo editing; on macOS, "a self-contained task like editing a document tends to work well in a **separate window**."
- "**Display only one sheet at a time from the main interface.** When people close a sheet, they expect to return to the parent view or window. If closing a sheet takes people back to another sheet, they can lose track of where they are."
- "**Provide an alternative to the Done button.** If you provide a Done button, always pair it with a Cancel button... **Relying solely on the Done button implies that completing the task is the only way to exit the sheet, which can feel restrictive or misleading.**"
- "**Avoid showing all three buttons — Cancel, Done, and Back — together.**"
- macOS, tvOS, visionOS, watchOS: a sheet is always modal. iOS and iPadOS: a sheet can be nonmodal, where "people use its functionality to affect the parent view without dismissing the sheet" (Notes' text formatting). "Use a **nonmodal** view when you want to present supplementary items that affect the main task in the parent view."
- Detents: **large** (fully expanded) and **medium** (about half); custom heights allowed. "In an iPhone app, consider supporting the **medium detent** to allow progressive disclosure of the sheet's content." "**Include a grabber in a resizable sheet.** A grabber shows people that they can drag the sheet to resize it; they can also **tap it to cycle through the detents**." "**Support swiping to dismiss a sheet.**" With unsaved changes, confirm with an action sheet.
- Buttons, iOS and iPadOS single view: Cancel on the leading edge of the top toolbar, Done on the trailing. Multi-step: on the first step Cancel leads and Done trails in an inactive state. The Back button "**isn't intended to dismiss a sheet**."
- iPadOS: "**Prefer using the page or form sheet presentation styles**," each centering content on a dimmed background at a default size.
- macOS: a card over its parent, which dims; "**let people interact with other app windows without first dismissing a sheet**," and use a **panel** instead "if people need to repeatedly provide input and observe results" (find and replace).
- Liquid Glass (session 323, 284): "an increased corner radius"; half sheets "are inset from the edge of the display", their bottom corners "nesting in the curved edges of the display"; at full height the glass "becomes opaque and anchoring to the edge of the screen". A sheet can morph out of its button (zoom transition with the toolbar item as source).

## 10. Popovers, action sheets, alerts [C] HIG Popovers, Action sheets, Alerts, session 323

- Popovers: only in regular width; the arrow points at the source; one at a time; nothing on top of a popover except an alert.
- Action sheets "spring from the action itself" on iPhone too; anchored sheets have no Cancel button because tapping elsewhere cancels. Destructive choices at the top.
- Alerts: title, optional message, up to three buttons; default on the trailing side; Cancel leading; "typography... now bolder and left-aligned" in alerts and onboarding. visionOS accessory view: 154 pt tall, 16 pt radius.

## 11. Lists, forms and settings [C]

- Adopting Liquid Glass: "lists, tables, and forms have a larger row height and padding. Sections have an increased corner radius to match the curvature of controls across the system." Section headers take "title-style capitalization ... no longer render entirely in capital letters." It does not make a section header large. [C] words, [I] the last sentence
- Lists and tables: "the grouped style uses headers, footers, and additional space to separate groups of data"; "Use an info button only to reveal more information about a row's content"; a disclosure indicator for drilling in.
- SwiftUI `GroupedFormStyle`: "Rows in this form style have leading aligned labels and trailing aligned controls within visually grouped sections."
- SwiftUI `LabeledContent`: a subtitle is "a view builder that creates multiple Text views where the first text represents the title and the second text represents the subtitle"; read-only values are selectable.
- Toggles, iOS: "Use the switch toggle style only in a list row." "Outside of a list, use a button that behaves like a toggle, not a switch." macOS: "Within a grouped form, consider using a mini switch to control the setting in a single row. The height of a mini switch is similar to the height of buttons and other controls, resulting in rows that have a consistent height."
- Pop-up buttons: "a flat list of mutually exclusive options"; iPadOS: "consider using a pop-up button instead of a disclosure indicator to present multiple options for a list item."
- HIG Settings (change log June 10, 2024): "**Minimize the number of settings you offer.** Although people appreciate having control over an app or game, too many settings can make the experience feel less approachable, while also making it hard to find a particular setting." "**Put general, infrequently changed settings in your custom settings area.** People must suspend what they're doing to open an app's or game's settings area, so you want to include options that people don't need to change all the time." "When possible, **prefer letting people modify task-specific options without going to your settings area**... Putting this type of option in a separate settings area disconnects it from its context, requiring people to suspend their task to make adjustments." "**Respect people's systemwide settings and avoid including redundant versions of them in your custom settings area**", and "an app can detect whether people are currently using Dark Mode." Both apps and games "might offer options related to people's accounts."
- Settings, macOS: panes switched by a toolbar; "a settings window accommodates the size of the current pane"; "Include a settings item in the App menu" with Command-Comma; "Avoid adding settings buttons to a window's toolbar"; "Update the window's title to reflect the currently visible pane"; "Restore the most recently viewed pane."

Row heights and section corners measured on the HIG's own figures are `Apps.md` section 6.1.

## 12. Scroll edge effects [C] HIG Scroll views, `ScrollEdgeEffectStyle`, session 219

- Purpose: "maintain that crucial separation between the UI and content layers". "Scroll edge effects are not decorative. They don't block or darken like overlays." "Scroll edge effects further enhance legibility by blurring and reducing the opacity of background content."
- **Soft** (default on iOS, iPadOS): "applies a variable blur that provides a softer fade"; it "gently dissolves the content into the background, lifting the glass visually above the moving content". When dark content scrolls under and the glass goes dark, the effect "switches to apply a subtle dimming instead".
- **Hard** (mostly macOS, pinned headers): "a more opaque blur with a defined edge", preferred for "text that appears outside of Liquid Glass controls"; applied "uniformly across the height of the toolbar and the pinned accessory view".
- One effect per view; never stacked or mixed; only where a scroll view sits behind floating elements. Custom bars register with `safeAreaBar` or `UIScrollEdgeElementContainerInteraction`.

## 13. Search [C] HIG Searching, Search fields, session 323, 284

- "In apps that use tab bars, like Photos and Apple TV, search is a dedicated tab."
- "People appreciate the ability to scope a search or filter the results. For example, people might want to search for items by specifying attributes like creation date, file size, or file type." "Clearly display the current scope of a search."
- iPhone: in the bottom toolbar (an expanded field or a button that expands above the keyboard), in the top bar when the bottom must stay clear, or as the trailing search tab. Focusing the field slides it up with the keyboard. iOS 26 Settings has search in the bottom toolbar.
- iPad and Mac: the trailing edge of the top toolbar; centered above suggestions in a dedicated search page.

Search field sizes are `Sizing.md` section 5.

## 14. Sliders, toggles, segmented controls [C] HIG Sliders, Toggles, Segmented controls, session 284

- Slider thumb becomes glass on touch; tick marks with `step` or a `ticks` closure; a `neutralValue` anchors the fill away from the leading end; a thumbless style reads as a progress bar during playback.
- Switch and segmented control knobs take glass during interaction. Switches are "updated slightly" in size (session 284 names UISwitch); the sizes themselves are unpublished (`Sizing.md` section 6).
- Segmented controls: equal widths; about five segments on iPhone, five to seven wide; text or images, not both.

## 15. Typography [C] HIG Typography (change log December 16, 2025: "Added emphasized weights to the Dynamic Type style specifications for each platform"), read from the DocC JSON 2026-09-24

| platform | default | minimum |
|---|---|---|
| iOS, iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| tvOS | 29 pt | 23 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

"In general, avoid light font weights... prefer Regular, Medium, Semibold, or Bold, and avoid Ultralight, Thin, and Light, which can be difficult to see, especially when text is small."

iOS and iPadOS, Large (the default):

| style | weight | size | leading | emphasized |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

Caption 1's emphasized weight is Semibold on iOS; Medium is the macOS value (a copy of this table once had Medium on iOS). Other sizes, from the same page: xSmall Body 14/19, Large Title 31/38; xLarge Body 19/24; xxxLarge Body 23/29; AX1 Body 28/34, Large Title 44/52; AX5 Body 53/62, Large Title 60/70.

macOS, a different scale rather than a shrunken one:

| style | weight | size | line height | emphasized |
|---|---|---|---|---|
| Large Title | Regular | 26 | 32 | Bold |
| Title 1 | Regular | 22 | 26 | Bold |
| Title 2 | Regular | 17 | 22 | Bold |
| Title 3 | Regular | 15 | 20 | Semibold |
| Headline | Bold | 13 | 16 | Heavy |
| Body | Regular | 13 | 16 | Semibold |
| Callout | Regular | 12 | 15 | Semibold |
| Subheadline | Regular | 11 | 14 | Semibold |
| Footnote | Regular | 10 | 13 | Semibold |
| Caption 1 | Regular | 10 | 13 | Medium |
| Caption 2 | Medium | 10 | 13 | Semibold |

SF Pro tracking at text sizes (1/1000 em): 13 pt -6, 15 pt -16, 17 pt -26, 20 pt -23, 22 pt -12, 24 pt +3, 28 pt +14, 34 pt +12. SF Symbols use equivalent weights to the system font.

Dynamic Type:
- "Make sure your app's layout adapts to all font sizes."
- "Consider adjusting your layout at large font sizes. When font size increases in a horizontally constrained context, inline items (like glyphs and timestamps) and container boundaries can crowd text and cause truncation or overlapping. To improve readability, consider using a **stacked layout** where text appears above secondary items. Multicolumn text can also be less readable at large sizes... **Reduce the number of columns when the font size increases.**"
- "**Prioritize important content when responding to text-size changes.** Not all content is equally important... when people increase text size to read the content in a tabbed window, they don't expect the tab titles to increase in size."
- "**Maintain a consistent information hierarchy regardless of the current font size.**"
- "Increase the size of meaningful interface icons as font size increases."
- "**Minimize the number of typefaces you use**, even in a highly customized interface." "Adjust font weight, size, and color as needed to emphasize important information... Be sure to maintain the relative hierarchy and visual distinction of text elements when people adjust text sizes."

Truncation: UIKit and TextKit `NSLineBreakMode.byTruncatingTail`, with any `numberOfLines`, packs the last laid-out line to the width and the ellipsis replaces its tail, at a character rather than a word, so an iOS two-line label's second line reaches the edge. [C] API behavior; CSS `text-overflow: ellipsis` does the same on one line, and `-webkit-line-clamp` (ellipsis on the last visible line box) has no native Apple equivalent. [I]

## 16. Icons [C] HIG Icons, App icons

Standard action glyphs, as SF Symbol names: Cut `scissors`, Copy `document.on.document`, Paste `document.on.clipboard`, Done `checkmark`, Cancel or Close `xmark`, Delete `trash`, Undo `arrow.uturn.backward`, Redo `arrow.uturn.forward`, Compose `square.and.pencil`, Duplicate `plus.square.on.square`, Rename `pencil`, Move to `folder`, Attach `paperclip`, Add `plus`, More `ellipsis`, Select `checkmark.circle`, Search `magnifyingglass`, Filter `line.3.horizontal.decrease`, Share `square.and.arrow.up`, Print `printer`, Account `person.crop.circle`, Like `hand.thumbsup`, Dislike `hand.thumbsdown`.

App icons: layered, "solid, filled, overlapping semi-transparent shapes"; the system applies masking, blur, highlights; six variants (default, dark, clear light and dark, tinted light and dark); rounded rectangle on iOS, iPadOS and macOS, circle on watchOS, built in Icon Composer.

## 17. Managing accounts, Ratings and reviews [C] (last change September 12, 2023; fetched 2026-09-16)

- "Ask people to create an account only if your core functionality requires it; otherwise, let people enjoy your app or game without one."
- "**Delay sign-in for as long as possible.** People often abandon apps when they're forced to sign in before they can do anything useful. To help avoid this situation, give people a chance to get a sense of what your app or game does before asking them to make a commitment to it. For example, a shopping app might let people browse as much as they want, requiring sign-in only when they're ready to make a purchase."
- "**Explain the benefits of creating an account and how to sign up.** If your app or game requires an account, write a brief, friendly description of the reasons for the requirement and its benefits. Display this message in your sign-in view."
- "**Always identify the authentication method you offer.** For example, if you display a button for signing in to your app with Face ID, title it using a phrase like 'Sign In with Face ID' instead of a generic phrase like 'Sign In.'"
- "**Ask for a rating only after people have demonstrated engagement with your app or game.** ... Avoid asking for a rating on first launch or during onboarding." "**Avoid interrupting people while they're performing a task or playing a game.**" "People can always rate your app within the App Store."

## 18. Entering data, Onboarding [C] (Entering data, last change June 21, 2023; Onboarding, June 10, 2024; fetched 2026-09-16)

- "When data entry is necessary, make sure people understand that they must provide the required data before they can proceed. For example, if you include a Next or Continue button after a set of text fields, **make the button available only after people enter the data you require**."
- "**Dynamically validate field values.** People can get frustrated when they have to go back and correct mistakes after filling out a lengthy form. When you verify values as soon as people enter them — and provide feedback as soon as you detect a problem — you give them the opportunity to correct errors right away."
- "**Get information from the system whenever possible.** Don't ask people to enter information that you can gather automatically." "You can also **prefill fields with reasonable default values**, which can minimize decision making and speed data entry." "**When possible, offer choices instead of requiring text entry.**"
- Onboarding: "**Postpone nonessential setup flows or customization steps.** Provide reasonable default settings so most people can immediately start interacting with your app or game without performing additional configuration."

## 19. Drag and drop [C] HIG Drag and drop (fetched 2026-08-22)

- "As a general rule, **dropping selected content within the same container moves it**, whereas **dropping content in a different container copies it**. Dragging and dropping content between apps always results in a copy." "Before you change these defaults, consider the behavior that most people expect and prefer the one that is **least likely to result in frustration or data loss**."
- Spring loading: "**Spring loading lets people activate certain controls, like buttons and segmented controls, by dragging selected content over them.** For example, Calendar lets people drag a selected event over the day, week, month, or year segments in the toolbar." "On a Mac equipped with a Magic Trackpad, a button or segmented control can activate when people **force-click** it while continuing to hold the content; on iPad, these components can activate when people **hover over them** while holding the content."
- "**Display a drag image as soon as people drag a selection about three points.**" "It works well to create a **translucent** representation of the content people are dragging. Translucency helps distinguish the representation from the original content **and lets people see destinations as they pass over them**."
- "**Show people whether a destination can accept dragged content.** ... display an insertion point or highlight a containing view **only when the destination can accept** a dragged item, and show no visual feedback, or an explicit 'not allowed' image, like the `circle.slash` from SF Symbols, when it can't."
- "Display highlighting or other visual cues **only while the content is positioned above the destination**... **When there are multiple possible destinations, provide visual cues that help people identify one at a time.**"
- "If it adds clarity, **modify the drag image to help people predict the result**", but "**avoid creating a distracting experience in which the drag image is constantly and radically changing.**"
- Invalid drop: "the item can move back from its current location to its source... or it can scale up and fade out to give the impression of the item **evaporating** instead of landing."
- "In iPadOS, people can select an item, **start dragging it, and add other items to the group without stopping the drag operation**." "**Support multi-item drag and drop when it makes sense.**" Drag flocking groups multiple items, ungrouped on drop; macOS: a count badge, updated if the destination accepts only a subset.
- "**Prefer letting people undo a drag-and-drop operation.**" "**Offer alternative ways to accomplish drag-and-drop actions.**" (`accessibilityDragSourceDescriptors`, `accessibilityDropPointDescriptors`.)
- "**Scroll the contents of a destination when necessary.**" "**After a drop, maintain the content's selection state in the destination.**"

## 20. Notifications [C] HIG Notifications (fetched 2026-09-17; no dated change log in the JSON)

The page is about DELIVERING a notification: the banner, the badge, the detail view. For iOS, iPadOS and macOS it reads, in full, "No additional considerations." The Notification Center list is not documented here; what it does is `Apps.md` section 9.

- Styles: "A banner or view on a Lock Screen, Home Screen, Home View, or desktop", "A badge on an app icon", "An item in Notification Center". Communication notifications feature "prominent contact images (or avatars) and group names instead of the app icon."
- "When a notification includes a title, **the system displays it at the top where it's most visible**." "**Avoid including your app name or icon.** The system automatically displays a large version of your app icon **at the leading edge** of each notification." So the order is mark, title, body. [C] words, [I] the order as stated
- "**Create a short title if it provides context for the notification content.** ... Use title-style capitalization and no ending punctuation." "**Write succinct, easy-to-read notification content.** Use complete sentences, sentence case, and proper punctuation, and **don't truncate your message — the system does this automatically when necessary**." "**Provide generically descriptive text to display when notification previews aren't available**", like "Friend request," "New comment," "Reminder," or "Shipment".
- A detail view "that contains **up to four buttons**". "**Avoid providing an action that merely opens your app.**" "**Prefer nondestructive actions.** ... **The system gives a distinct appearance to the actions you identify as destructive.**" An interface icon per action, on the **trailing** side of its title; "a short, **title-case** term". watchOS: "a double tap runs the first nondestructive action, consider placing the action that people use most frequently at the top."
- Badges: "a small, filled oval containing a number"; "**Use a badge only to show people how many unread notifications they have.**" "**Make sure badging isn't the only method you use to communicate essential information.**" "**Keep badges up to date.** ... reducing a badge's count to zero **removes all related notifications from Notification Center**." "**Avoid creating a custom image or component that mimics the appearance or behavior of a badge.**"
- "**Avoid sending multiple notifications for the same thing, even if someone hasn't responded.**" "**Use an alert — not a notification — to display an error message.**" "**Handle notifications gracefully when your app is in the foreground.** ... **Mail simply adds it to the list of unread messages**." "**Avoid including sensitive, personal, or confidential information in a notification.**"
