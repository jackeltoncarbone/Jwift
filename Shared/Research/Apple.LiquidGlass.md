# Apple's Liquid Glass, from Apple's own words

Everything Apple publishes about the material, the shape system and the proportions of the native
components, read from the developer documentation and the WWDC25 sessions on 2026-09-14, and mapped
onto Jwift and Jaui. Quotes are Apple's. Numbers marked "published" are in Apple's documents. Numbers
marked "measured" come from our own pixel profiles of iOS 26 screenshots and live in
`ShowStudio.Documentation/Design/LiquidGlass.md` and `Apple.Measured.Spec.md`; Apple does not publish
them.

Sources read in full:

- Technology overview "Adopting Liquid Glass" and the "Liquid Glass" landing page.
- WWDC25 219 "Meet Liquid Glass", 356 "Get to know the new design system", 323 "Build a SwiftUI app
  with the new design", 284 "Build a UIKit app with the new design" (full transcripts).
- HIG: Materials, Layout, Menus, Context menus, Pull-down buttons, Pop-up buttons, Buttons, Toolbars,
  Tab bars, Sheets, Popovers, Action sheets, Alerts, Sidebars, Split views, Windows, Lists and tables,
  Scroll views, Search fields, Sliders, Toggles, Segmented controls, Text fields, Typography, Color,
  Dark Mode, Icons, App icons.
- API: `Glass`, `glassEffect`, `GlassEffectContainer`, `glassEffectID`, `glassEffectUnion`,
  `ConcentricRectangle`, `rect(corners:isUniform:)`, `ScrollEdgeEffectStyle`,
  `backgroundExtensionEffect`, `safeAreaBar`, `ButtonBorderShape`, `ControlSize`, `UIGlassEffect`,
  `UIGlassContainerEffect`, `UICornerConfiguration`, `UIScrollEdgeElementContainerInteraction`,
  `UIMenu.preferredElementSize`, `NSGlassEffectView`, `NSGlassEffectContainerView`, and the Landmarks
  sample.

## 1. What the material is

Apple calls it "a new digital meta-material that dynamically bends and shapes light" and says the
visuals and the motion "were designed as one". It is one floating functional layer for controls and
navigation. It is not a content material.

### The layers (session 219)

| Layer | Apple's description | Behaviour |
|---|---|---|
| Lensing | "the primary way Liquid Glass visually defines itself"; it "bends, shapes, and concentrates light" | The edge shows what lies outside the panel, then pulls the interior toward the edge. It is what separates the glass from the content, not a fill. |
| Highlights | "Light sources inside of this environment shine on the material producing highlights that respond to geometry" | The lights move on interaction (lock and unlock) and, on some devices, with device motion, "causing light to travel around the material, defining its silhouette". |
| Shadow | "increases the opacity of its shadow when it is over text" and "lowers the opacity of its shadow when it is over a solid light background" | Shadow is adaptive, not fixed. |
| Tint and dynamic range | "the amount of tint and the dynamic range shift to always ensure buttons remain legible, while letting as much of the content through as possible" | The body is a legibility layer that stays as thin as it can. |
| Light and dark flip | small elements "flip from light to dark based on the background"; "bigger elements, like menus or sidebars also adapt based on context, but they don't flip" | Bars and buttons flip. Menus and sidebars never flip; their surface is too big and a flip would distract. Symbols and text on the glass flip with it. |
| Interaction glow | "the material illuminates from within... starting right under your fingertips, the glow spreads throughout the element and onto any Liquid Glass elements nearby" | Press feedback is light, not a colour. |
| Materialize | "Liquid Glass objects materialize in and out by gradually modulating the light bending and lensing", not by fading | Appear and disappear are a lensing ramp. |
| Morph | "the bubble simply pops open to reveal the content contained within"; "this lightweight, in-line transition keeps everything right where you just tapped" | A menu is the button's own glass grown, not a new panel. |
| Size | when glass "morphs to larger sizes, like when presenting a menu from a toolbar button, its material characteristics change to simulate a thicker, more substantial material. It casts deeper, richer shadows, has more pronounced lensing and refraction effects, and a softer scattering of light" | One material, two thicknesses: thin for buttons and bars, thick for menus, popovers, sheets and sidebars. UIKit: "A larger size is more opaque. A smaller size is clearer, and switches between light and dark mode automatically". |
| Ambient spill (large elements) | "light from colorful content nearby can subtly spill onto its surface... the light reflects, scatters, and bleeds into the shadow as well" | Sidebars pick up colour from the content beside them. |
| Focus | "when a window loses focus on the Mac or iPad, Liquid Glass shifts its appearance and visually recedes" | Inactive windows recede. |

### The two variants (HIG Materials, session 219)

- **Regular**: every adaptive behaviour above; "blurs and adjusts the luminosity of background content
  to maintain legibility"; use it for anything with text (alerts, sidebars, popovers) and by default.
- **Clear**: "highly translucent"; no adaptive behaviour; only for components "that float above media
  backgrounds, such as photos and videos". It needs a dimming layer when the content is bright: "a
  dark dimming layer of 35% opacity". The SwiftUI sample uses `.background(.black.opacity(0.3))`.
  Apple's three conditions for clear: the element is over media-rich content, the content layer is not
  hurt by a dimming layer, and what sits on the glass is bold and bright. "They should never be mixed."

### Rules of use

- "Don't use Liquid Glass in the content layer." Content surfaces use the standard materials.
- "Always avoid glass on glass." Things placed on glass use "fills, transparency, and vibrancy" so they
  read as a thin overlay that is part of the material.
- "Use Liquid Glass effects sparingly", only for "the most important functional elements".
- Apply the material to the control itself, "not its inner views".
- Custom glass views go in one container (`GlassEffectContainer`, `UIGlassContainerEffect`,
  `NSGlassEffectContainerView`) so they share one sampling region: "glass can not sample other glass".
  The container's `spacing` is the distance at which two glass shapes start to merge "like small
  droplets of water"; Apple's samples use 20 and 40 points.
- Transitions inside a container: `matchedGeometry` for shapes within the container spacing,
  `materialize` for shapes further apart. Set the effect, never the alpha, so the glass materializes.

### Colour on glass (HIG Color)

- "By default, Liquid Glass has no inherent color, and instead takes on colors from the content
  directly behind it."
- Tint is stained glass: "selecting a color generates a range of tones that are mapped to content
  brightness underneath". A solid fill "is completely opaque and breaks the visual character".
- Tint only the primary action, and tint the background, not the label: "apply color to the
  background rather than to symbols or text"; "refrain from adding color to the background of multiple
  controls". One or two prominent buttons per view.
- Labels on small glass are monochrome and flip with the glass. Over colourful content, prefer the
  monochrome bar.
- Provide light and dark variants of every custom colour "even if your app ships in a single
  appearance mode", and an increased contrast variant.
- Contrast: at least 4.5:1, aim for 7:1 for custom text (Dark Mode).

### Accessibility modifiers (session 219)

- Reduce Transparency: "frostier and obscures more of the content behind it".
- Increase Contrast: "predominantly black or white" with "a contrasting border".
- Reduce Motion: "decreases the intensity of some effects and disables any elastic properties".

### Interaction (session 323, 284)

- Interactive glass "reacts to user interaction by scaling, bouncing, and shimmering".
- Sliders and toggles are content-layer controls whose knob "transforms into Liquid Glass during
  interaction"; the resting state stays quiet. Sliders "preserve momentum and stretch when they are
  moved".
- Menus, popovers, alerts, sheets and action sheets "flow smoothly out of liquid glass controls"; the
  presenting button "morphs into the overlay".

## 2. The shape system (session 356, ConcentricRectangle, UICornerConfiguration)

"Apple's hardware features a consistent bezel and that same precision now guides the UI, with
curvature, size, and proportion aligning." Three shape types build every layout:

| Shape | Rule | API |
|---|---|---|
| Fixed | constant radius | `.rect(cornerRadius:)`, `.fixed(r)` |
| Capsule | "a radius that's half the height of the container" | `Capsule`, `.capsule(maximumRadius:)` |
| Concentric | "calculate their radius by subtracting padding from the parent's" | `ConcentricRectangle`, `.concentric(minimum:)`, `.containerConcentric()` |

- Nested containers "should be concentric to allow the system to calculate the inner radii
  automatically". Pinched or flared corners "create tension and break the sense of balance".
- A concentric corner far from the container's corner resolves to zero; `concentric(minimum:)` gives a
  fallback so a component works "both inside a container and on their own".
- `isUniform: true` computes each corner, takes the largest and applies it to all four.
- A capsule that gets too tall can break out with `maximumRadius`.
- Phone edges: "use a capsule with extra margin to create space near the screen edge". iPad and Mac:
  "use a concentric shape that aligns with the window edge".
### What Apple publishes about the continuous curve, and what it does not

Checked directly on 2026-09-14. Apple ships the curve and documents the API, never the math:

- `CALayerCornerCurve.continuous` carries no discussion text at all. `RoundedCornerStyle.continuous` is
  one sentence: "Continuous curvature rounded rect corners." `UIBezierPath(roundedRect:cornerRadius:)`
  says only that it makes a closed subpath clockwise.
- The closest thing to an official number is an Apple DTS reply on the developer forums (thread 787405)
  about `CIRoundedRectangleGenerator`'s new `smoothness`: 0 "make the output use a simple radius where
  the shape goes from line to curve to line", 1 "makes the transition from line to curve smooth like
  icons do (setting to 1 should match CAs result)", and values between interpolate. So Apple confirms a
  0 to 1 smoothness axis with 1 as the continuous corner, and still publishes no curve.
- What the curve is, from outside analysis rather than from Apple: curvature continuous (G2) rather than
  the tangent continuity (G1) of a circular corner, so curvature ramps up from zero instead of jumping
  to 1/r at the join. It is a composite of cubic Beziers per corner, not a pure superellipse, because an
  isolated superellipse bows the straight sides outward. The corner begins roughly 1.52 r from the
  vertex rather than at r. Figma's iOS preset is the 60% corner-smoothing slider.

Show Studio draws a superellipse, and its corner-to-circle compensation is solved rather than fitted
(see `ShowStudio.Documentation/Design/LiquidGlass.md`). At the default smoothness 0.3 our corner begins
1.757 r from the vertex, so it is rounder than Apple's roughly 1.52 r; smoothness near 0.21 would sit on
Apple's lead-in. That is a calibration choice, not a correctness bug.

- The capsule "naturally supports concentricity", which is why it is "in the mirrored proportions of
  sliders and switches, and echoed in bars, buttons, and the rounded corners of grouped table views".
- Views are "mathematically centered when it makes sense, and subtly offset when it doesn't".
- Session 356 on menus: "a popup menu on macOS and a context menu on iOS might not look the same, but
  both include a selection indicator, icon, label, and accessory item."

## 3. Proportions of the native components

Apple publishes rules and a few sizes. The rest is measured.

### Buttons (HIG Buttons, session 323)

- Hit region "at least 44x44 pt" (visionOS 60x60). Published.
- "Bordered buttons now have a capsule shape by default." iOS: capsule at every size. macOS: mini,
  small and medium "retain a rounded-rectangle shape, which preserves horizontal density"; large and
  the new extra large are capsules. Sizes: mini, small, regular, large, extraLarge.
- "Most controls on macOS are slightly taller."
- Styles: `glass` (the material) and `glassProminent` (the material tinted with the accent). UIKit
  `.glass()`, `.prominentGlass()`, `.clearGlass()`, `.prominentClearGlass()`.
- Always include a press state. Use style, not size, to mark the preferred option. Roles: normal,
  primary (accent), cancel, destructive (system red; never primary).
- visionOS sizes, published as a reference for scale: mini 28, small 32, regular 44, large 52, extra
  large 64 pt.

### Menus (HIG Menus, Context menus, Pull-down buttons, session 356, 323, 284)

- Layouts (iOS, iPadOS): **small**, a row of four unlabeled icons above the list; **medium**, a row
  of three icons with short labels; **large**, the default, all items in a list. Items beyond the top
  row render as full rows.
- Icons sit on the leading edge "and are now used on macOS too"; the same Label produces the same
  result on both. "Use the symbol once to introduce the group, and let text do the rest" for closely
  related actions. "Provide icons for all menu items in a group, or none of them."
- Groups: "use a separator... a horizontal line or a short gap in the menu's background appearance".
  Context menus: no more than about three groups. Submenus: one level; more than about five items in a
  submenu means a new menu.
- Order: important and frequent first; destructive items last, red, confirmed by an action sheet
  (iOS) or popover (iPadOS). Show Studio keeps every option white by Jack's decision.
- Labels: title-style capitalization, verbs, no articles, an ellipsis when more input follows.
- The menu is the button's glass popped open; it stays where the finger tapped. As a large element it
  takes the thick material and never flips light or dark.
- Measured, not published: the iOS 26 pull-down menu is 250 pt wide, its rows are 44 pt.

### Toolbars and navigation bars (HIG Toolbars, session 356, 284)

- Bars are transparent; items sit on glass. "Remove any background customization."
- Grouping: items "automatically separated into visual groups"; each group shares one glass
  background. Image buttons share; "text buttons, the system Done and Close buttons, and prominent
  style buttons have separate glass backgrounds". A fixed spacer splits a group; a flexible spacer
  splits backgrounds unless `hidesSharedBackground` is false.
- "Don't mix text and icons across items that share a background." Aim for at most three groups.
- Symbols over text, monochrome, no borders (the group is the container).
- Exactly one prominent (tinted) primary action, on the trailing edge, "often as a blue checkmark".
- "By default, standard buttons, text fields, headers, and footers have corner radii that are
  concentric with bar corners." Custom items must be too.
- Large titles scroll with the content; a subtitle can sit under the title.
- Leading edge: back, sidebar, title, document menu. Center: common controls. Trailing: important
  items, inspectors, search, More, Done.

### Tab bars (HIG Tab bars, session 323, 284)

- Floats above content at the bottom on iPhone; near the top on iPad, convertible to a sidebar.
- Minimizes on scroll (`tabBarMinimizeBehavior`), re-expands on the opposite scroll or a tap.
- Search is a separate tab at the trailing end (`Tab(role: .search)`); tapping it turns the tab into
  a search field and the other tabs collapse.
- An accessory view (the mini player) sits above the bar and drops inline when the bar minimizes.
- Labels under icons in compact width, beside them in regular width. Filled symbols. Badges red.
- Measured, not published: the iPhone bar is 64 px tall at 3x with 20 px insets (see
  `Apple.Measured.Spec.md`).

### Sheets, popovers, action sheets, alerts

- Sheets: "an increased corner radius"; half sheets "are inset from the edge of the display", their
  bottom corners "nesting in the curved edges of the display"; at full height the glass "becomes
  opaque and anchoring to the edge of the screen". Detents: medium (about half) and large; custom
  heights allowed; grabber for resizable sheets. Cancel leading, Done trailing, never all three of
  Cancel, Done and Back.
- A sheet can morph out of its button (zoom transition with the toolbar item as source).
- Popovers: only in regular width; the arrow points at the source; one at a time; nothing on top of a
  popover except an alert.
- Action sheets "spring from the action itself" on iPhone too; anchored sheets have no Cancel button
  because tapping elsewhere cancels. Destructive choices at the top.
- Alerts: title, optional message, up to three buttons; default on the trailing side; Cancel leading;
  "typography... now bolder and left-aligned" in alerts and onboarding. visionOS accessory view: 154
  pt tall, 16 pt radius (published).

### Lists, forms and sidebars

- "Lists, tables, and forms have a larger row height and padding. Sections have an increased corner
  radius to match the curvature of controls across the system." Section headers are title-style, no
  longer all capitals.
- Sidebars are inset, float on glass, and content extends beneath them: the background extension
  effect "mirrors the adjacent content" and blurs it. Scroll views extend under sidebars by default.
- Inspectors get "a more subtle layering".

### Scroll edge effects (HIG Scroll views, ScrollEdgeEffectStyle, session 219)

- Purpose: "maintain that crucial separation between the UI and content layers". "Scroll edge effects
  are not decorative. They don't block or darken like overlays."
- **Soft** (default on iOS, iPadOS): a blur and fade that "gently dissolves the content into the
  background, lifting the glass visually above the moving content". When dark content scrolls under and
  the glass goes dark, the effect "switches to apply a subtle dimming instead".
- **Hard** (mostly macOS, pinned headers, text outside glass): applied "uniformly across the height
  of the toolbar and the pinned accessory view", a clearly defined linear boundary.
- One effect per view; never stacked or mixed; only where a scroll view sits behind floating elements.
  Custom bars register with `safeAreaBar` or `UIScrollEdgeElementContainerInteraction`.

### Search (HIG Search fields, session 323, 284)

- iPhone: in the bottom toolbar (expanded field or a button that expands above the keyboard), in the
  top bar when the bottom must stay clear, or as the trailing search tab. Focusing the field slides it
  up with the keyboard.
- iPad and Mac: the trailing edge of the top toolbar; centered above suggestions in a dedicated
  search page.

### Sliders, toggles, segmented controls, steppers

- Slider thumb becomes glass on touch; tick marks with `step` or a `ticks` closure; a `neutralValue`
  anchors the fill away from the leading end; a thumbless style reads as a progress bar during playback.
- Switch and segmented control knobs take glass during interaction. Switches slightly resized.
- Segmented controls: equal widths; about five segments on iPhone, five to seven wide; text or images,
  not both.

### Typography (HIG Typography)

Published, iOS Large (the default) text styles, points of size and leading:

| Style | Weight | Size | Leading | Emphasized |
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

macOS: Large Title 26/32, Title 1 22/26, Title 2 17/22, Title 3 15/20, Headline 13/16 bold, Body
13/16, Callout 12/15, Subheadline 11/14, Footnote 10/13, Caption 1 10/13, Caption 2 10/13 medium.

Defaults and minimums: iOS 17 default, 11 minimum; macOS 13 and 10. Avoid the light weights. SF Pro
tracking at text sizes: 13 pt is -6 (1/1000 em), 15 is -16, 17 is -26, 20 is -23, 22 is -12, 24 is
+3, 28 is +14, 34 is +12. Show Studio sets Inter, whose own optical tracking differs; the sizes and
the hierarchy carry over, the tracking table does not.

### Colour (HIG Color, dark values, published)

Red 255 66 69, Orange 255 146 48, Yellow 255 214 0, Green 48 209 88, Mint 0 218 195, Teal 0 210
224, Cyan 60 211 254, Blue 0 145 255, Indigo 109 124 255, Purple 219 52 242, Pink 255 55 95, Brown
183 138 102. Dark grays: gray 142 142 147, gray2 99 99 102, gray3 72 72 74, gray4 58 58 60, gray5 44
44 46, gray6 28 28 30. Labels have four levels (label, secondary, tertiary, quaternary), separators
one; Dark Mode has base and elevated backgrounds.

### Icons (HIG Icons)

Standard action glyphs, as SF Symbol names: Cut `scissors`, Copy `document.on.document`, Paste
`document.on.clipboard`, Done `checkmark`, Cancel or Close `xmark`, Delete `trash`, Undo
`arrow.uturn.backward`, Redo `arrow.uturn.forward`, Compose `square.and.pencil`, Duplicate
`plus.square.on.square`, Rename `pencil`, Move to `folder`, Attach `paperclip`, Add `plus`, More
`ellipsis`, Select `checkmark.circle`, Search `magnifyingglass`, Filter
`line.3.horizontal.decrease`, Share `square.and.arrow.up`, Print `printer`, Account
`person.crop.circle`, Like `hand.thumbsup`, Dislike `hand.thumbsdown`. Show Studio ships Framework7
glyphs under these names (`Icon/Icon.Data.ts`); SF Symbols are reference only.

### App icons

Layered, "solid, filled, overlapping semi-transparent shapes"; the system applies masking, blur,
highlights; six variants (default, dark, clear light and dark, tinted light and dark); rounded
rectangle on iOS, iPadOS and macOS, circle on watchOS, built in Icon Composer.

## 4. Where Jwift stands

| Apple rule | Jwift and Jaui today | State |
|---|---|---|
| One material, regular variant | `JwiftGlass` in `Glass/Jwift.Glass.jss`, calibrated to iPhone measurements | done |
| Thick material for large elements | `JwiftGlassThick`: heavier body, wider blur, more lens, deeper shadow; `Jwift_GlassDropdown_Open` and `Jwift_ContextMenuPanel` extend it | done 2026-09-14 |
| Clear variant with a dimming layer | not a class; the hero line is a white frost over video and the page is dark, so no dim is needed | not needed yet |
| Lensing, highlights, rim, chromatic edge | Jaui panel shader; the mapping table is in `Design/LiquidGlass.md` | done |
| Shadow that reacts to text | fixed faint shadow | open, shader |
| Interaction glow from the touch point | press brightens the backdrop filter and squeezes (`VisualScale` 0.92) | open, shader |
| Materialize by lensing, not fade | Jaui's `PresenceManager` fades Opacity | open, animator: drive Refraction and Blur from Presence |
| Morph from the button | `GlassDropdown` springs its closed pill into the open panel (Width, Height, Padding transitions) | done |
| Glass never on glass | menu rows and cells are transparent fills over the panel; the shared indicator is a fill, not a material | done |
| Container spacing and droplet merge | no shared sampling region; each glass jiv samples the backdrop alone | open |
| Light and dark flip | Show Studio is dark only | not applicable |
| Reduce Transparency, Increase Contrast, Reduce Motion | not read | open |
| Fixed, capsule, concentric shapes | authored by hand: `28 = 22 + 6` in the dropdown, `999pt` capsules. The superellipse-to-circle compensation is solved in closed form, and saturation keys to the authored radius, so an authored radius reads as that circular radius at every smoothness | done 2026-09-14 |
| `Concentric(minimum)` as a JSS value | not in the parser | open, Jaui |
| 44 pt hit region | Jwift buttons are 48; the app's surface pills are 40 by the concept; Jaui has no hit slop | open, product call |
| Capsule buttons by default | `Jwift_GlassBtn_Pill`, `_Round`; `_Square` is the rounded rectangle | done |
| Control sizes mini to extra large | one size | open |
| Prominent tinted primary action | `PillTint` at 0.75 accent | done |
| Menu rows 44 pt, icons leading, groups by gap or hairline | 44 pt rows, 6 pt gap, hairline divider inside the gap, one shared indicator | done |
| Menu small and medium layouts | large only | open |
| Toolbar grouping, text apart from symbols, one prominent | `GlassActionGroup` and `GlassActionBar` group cells in one pill; text items are not yet forced into their own container | partly |
| Tab bar floats, search tab trailing, minimizes on scroll, accessory | floats with a selection indicator; search is a tab; no minimize, no accessory | partly |
| Tab bar ink: unselected monochrome secondary, selected primary or accent | unselected `rgba(255,255,255,0.64)`, selected `0.92` or the accent, from the measured App Store ladder | done 2026-09-14 |
| Tab bar symbols filled ("prefer filled symbols or icons for consistency with the platform") | every tab uses its fill variant; Search keeps the plain glass, as Apple's does | done 2026-09-14 |
| Dock selection indicator is a material, not a brand fill | the wide dock painted an opaque `rgb(184,145,46)` pill, which the session names as the thing that "breaks the visual character"; both widths now carry the accent on the symbol and label over a frosted pill | done 2026-09-14 |
| "Always avoid glass on glass"; things on glass use "fills, transparency, and vibrancy" | the selection indicator asked for `Blur(6pt)` on top of the bar's own glass. Dropped; Brightness and Saturate stay, which is the vibrancy that "amplifies and adjusts the color of the content layered behind". Also one fewer blur pyramid sample per frame on an always-visible node | done 2026-09-14 |
| Pressed indicator magnifies its label rather than frosting it | before, a held tab's label kept 19% of its resting edge sharpness; after, 186% | done 2026-09-14 |
| Pressed indicator stays inside its bar | it overflows the bar's left edge by 17.6 css px, from `reach` plus the press boost in SelectionIndicator's physics | open |
| "Prefer a monochromatic appearance for tab bars" when the content layer is bright and colourful | the accent is gold and the content layer is field video full of gold and yellow, which is the case Apple warns about; kept as the brand colour, Jack's call | open, product |
| Soft scroll edge under floating bars | `JwiftScrollEdge`, `JwiftScrollEdgeBottom`: a progressive blur strip; the app's dock sits in one | done 2026-09-14 |
| Hard scroll edge | none | open |
| Sheets inset and concentric with the display, opaque at full height | `Modal`, `Drawer` are their own materials | open |
| Background extension under sidebars | none | open |
| Sliders: glass thumb on touch, ticks, neutral value | `Slider` has a plain thumb | open |
| Typography scale | Inter at the iOS sizes on the home surface | done |

## 5. Changes made in this pass (2026-09-14)

- `Glass/Jwift.Glass.jss`: `JwiftGlassThick` and the `JwiftScrollEdge` strips.
- `GlassDropdown/GlassDropdown.jss`: the open menu extends `JwiftGlassThick`; rows 44 pt with a 6 pt
  gap; the divider is a hairline inside the gap; one shared `Jwift_GlassDropdownIndicator`; no per-row
  hover; every option white.
- `ContextMenu/ContextMenu.jss`: the panel extends `JwiftGlassThick` instead of carrying its own
  heavier numbers.
- App `Navigation`: the dock sits in a `JwiftScrollEdgeBottom` strip so content dissolves under it.
- App account menu: no icon on a group where only one row had one; "Sign Out" in title style.
