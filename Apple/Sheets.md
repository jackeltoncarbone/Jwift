# Sheets, grabbers and the sheet close button (iOS 26)

What Apple's iOS 26 sheet does, read from UIKit 26.1 and the HIG, then where Jwift's `<drawer>` and modal host differ from it, then a JSS mapping for the fix. No code was changed by this research.

Tags, as used in this file:
- **[C]**: read from Apple's own code: the Hex-Rays restore of iOS 26.1 (23B85, iPhone18,3) or the firmware's dyld cache, with the function or class named.
- **[D]**: Apple's published words (HIG, API reference, WWDC25 transcripts). Quotes are verbatim.
- **[I]**: measured or inferred by us, with the capture named.

(`HIG.md` uses [C] for published words. Here [D] is used instead, so that code and docs are tagged separately.)

Where [D] and [C] disagree, [C] wins.

## 0. Sources and how to re-read them

| source | where | what it gave |
|---|---|---|
| `_UIGrabber.mm`, `UIDropShadowView.mm`, `UISheetPresentationController.mm`, `SheetLayoutInfo.mm`, `SheetLayoutGraph.mm`, `_UISheetPresentationMetrics.mm`, `UISheetPresentationMetrics.mm` | `gh api -H "Accept: application/vnd.github.raw" repos/EthanArbuckle/iPhone18-3_26.1_23B85_Restore/contents/System/Library/PrivateFrameworks/UIKitCore.framework/UIKitCore/<File>.mm`; copies in `SP\AppleAlgo\sheets\` | grabber size, color, spacing, overlay, tap actions; the sheet corner radii; the inset transform; the background switch |
| `SheetLayoutInfo` Swift bodies | `SP\AppleAlgo\lens\chunks\UIKitCore_62.mm` (and `_61`, `_68`) | `sub_189107768` grabber action, `sub_18910767C` tap target, `sub_18910A5D0` grabber alpha, `sub_189108DF4` corner radii, `sub_1891102E0` background, the inset transform at lines 9460 to 9560, init defaults at 8795 to 8900 |
| `_UISheetPresentationMetrics` getters | `ipsw dyld disass "$D" --vaddr <addr>` on `D:\AppleIPSW\dyld\...\dyld_shared_cache_arm64e` (recipe: `Methods.md` 3.4); symbol list `D:\AppleIPSW\uikit_syms.txt` | `topOffset` 10, `cornerRadius` 10, `minimumSidePadding` 25, `topOffsetInCompactHeight` 8, `shadowRadius` 2, `preferredShadowOpacity` 0.5 |
| HIG Sheets, Modality, Popovers, Buttons, Toolbars, Layout | `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json` (`HIG.md` section 0); copies and `ext.py` in `SP\AppleAlgo\sheets\hig\` | the rules quoted in section 4 |
| HIG sheet figures (Apple's own pixels, 536 px wide = 402 pt at 4/3 px per pt) | `https://developer.apple.com/tutorials/images/com.apple.HIG/<name>@2x.png`: `sheets-medium-detent`, `sheets-large-detent`, `sheets-buttons-placement-cancel-done`, `sheets-nonmodal-notes-text-regular`; measured by `m2.py`, `m3.py` in `SP\AppleAlgo\sheets\hig\` | every [I] number in sections 1 to 3 |
| API reference | `https://developer.apple.com/tutorials/data/documentation/<framework>/<symbol>.json` | `prefersGrabberVisible`, `prefersEdgeAttachedInCompactHeight`, `largestUndimmedDetentIdentifier`, `ButtonRole.close`, `presentationDragIndicator(_:)` |
| WWDC25 219/356 "Get to know the new design system", 323 "Build a SwiftUI app with the new design", 284 "Build a UIKit app with the new design" | developer.apple.com/videos/play/wwdc2025/<n> | the sheet sentences in section 4 |

`SP` is the session scratchpad (`C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-...\scratchpad`).

## 1. The grabber

### When it shows

- **Off by default.** `SheetLayoutInfo` init sets `wantsGrabber = 0` [C] (UIKitCore_62:8831). API: "The default value is false, which means the sheet doesn't show a grabber." [D] (`prefersGrabberVisible`)
- **It is opt in, per sheet, and not tied to the detent count.** The only switch is `prefersGrabberVisible`, stored straight into `wantsGrabber` (`-[UISheetPresentationController setPrefersGrabberVisible:]` sets `_layoutInfo._setWantsGrabber:`) [C]. `_containerViewLayoutSubviews` gives the drop shadow view `_setHasGrabber: wantsGrabber && !isHosting` [C]. So UIKit draws it on a single-detent sheet if the app asks; nothing adds it on its own.
- **When to ask for it (the rule):** "**Include a grabber in a resizable sheet.** A grabber shows people that they can drag the sheet to resize it" [D] (HIG Sheets). The API adds one more case: "Showing a grabber may be useful when it isn't apparent that a sheet can resize or when the sheet can't dismiss interactively." [D] SwiftUI's `presentationDragIndicator(_:)` repeats this: "You can show a drag indicator when it isn't apparent that a sheet can resize or when the sheet can't dismiss interactively." [D]
- SwiftUI's `.automatic` shows the indicator when a sheet has more than one detent and hides it on a single detent [I]: widely observed behavior, not read from SwiftUI's binary.
- **Where the system hides it:** "The system automatically hides the grabber at appropriate times, like when the sheet is full screen in a compact-height size class or when another sheet presents on top of it." [D] In code, `grabberAlpha = (wantsGrabber && !hosting ? (child ? 1 - childCover : 1) : 0) * (1 - percentFullScreen)` (`sub_18910A5D0`) [C]. It fades out as the sheet goes functionally full screen and as a child sheet covers it.
- **Form sheet, page sheet, full screen:** these go through the same `UISheetPresentationController` machinery, so the same opt-in applies. Nothing in the form/page sheet classes sets `wantsGrabber` (`_UIFormSheetPresentationController.mm`, `_UIPageSheetPresentationController.mm`) [C]. A plain `.fullScreen` presentation is not a sheet and has no grabber [D] (HIG Modality, full-screen style).
- **Popovers:** a popover has no grabber. In compact width, the HIG says to present "a full-screen modal view like a sheet instead" [D] (HIG Popovers). The adapted sheet follows the sheet rule above.
- **In Apple's own figures:** the resizable medium and large examples draw a grabber (`sheets-medium-detent`, `sheets-large-detent`). Notes' fixed-height nonmodal Format sheet draws none: title leading, X trailing (`sheets-nonmodal-notes-text-regular`) [I].

### Geometry and look

| property | value | tag |
|---|---|---|
| size | 36 × 5 pt (`-[_UIGrabber _intrinsicSizeWithinSize:]` returns 36.0, 5.0); overridable by the private `_grabberPreferredSize` | [C] |
| shape | capsule, `cornerRadius = height / 2` (`_UIGrabber layoutSubviews`) | [C] |
| top spacing | 5 pt from the sheet's top edge to the grabber's top (`grabberSpacing = 0x4014000000000000` = 5.0 in `SheetLayoutInfo` init; `UIDropShadowView` init `_grabberSpacing = 5.0`; placed at `center.y = spacing + h/2`, centered in x) | [C]; measured 4.5 pt on `sheets-medium-detent` [I] |
| color | `UIColor.tertiaryLabelColor` resolved against the trait collection, with the background luminance level overriding the trait when luma tracking is on. With blur enabled (the default: `isGrabberBlurEnabled = 1`), it is not a flat fill: a `UIVisualEffectView` with `UIColorEffect colorEffectMatrix` built from that color plus `UIBlurEffect effectWithBlurRadius:30`, sized to the grabber inset by -5 pt vertically. In light mode the matrix subtracts (darkens what is under it), in dark mode it adds. Luma changes animate with a 0.21 s spring | [C] |
| overlay, not layout | `insetsContentViewForGrabber = 0` by default (`SheetLayoutInfo` init). The content view keeps the full sheet frame and the grabber is a subview drawn above it. Only the private inset mode moves content down (by `2 × spacing` plus the safe area, `-[UIDropShadowView _contentViewFrame]`) | [C] |
| hit target | a `UIControl`. `_setTouchInsets` grows the hit region to at least 44 × 44 pt around the 36 × 5 bar. Pointer highlight 48 × 13 pt rounded rect (`pointerInteraction:styleForRegion:`) | [C] |

### What tapping it does

`-[UISheetPresentationController _dropShadowViewGrabberDidTriggerPrimaryAction:]` switches on `SheetLayoutInfo._grabberAction` (`sub_189107768`) [C]:

| action | when | effect |
|---|---|---|
| 0 | a first responder inside is adjusting the detent (keyboard up) | `endEditing:` on the sheet's view |
| 1 | the tap target equals the current detent, which only happens with one detent | dismiss, if `_shouldDismiss` allows (`_dismissFromGrabberOrDimmingViewIfPossible`) |
| 2, 3 | otherwise | animate to the target detent (2 = larger, 3 = smaller) and send `sheetPresentationControllerDidChangeSelectedDetentIdentifier` |

The target is `(current + n - 1) mod n` over the active detents, smallest first (`sub_18910767C`) [C]. It steps down one detent and wraps from the smallest to the largest. With medium and large, tapping toggles between them. The HIG: "they can also tap it to cycle through the detents... a grabber also works with VoiceOver so people can resize the sheet without seeing the screen." [D]

## 2. Sheet geometry (iPhone, iOS 26)

### Edge attached vs floating

On iPhone in portrait, the sheet is **edge attached** (`sub_189105A94` returns true for compact width) [C]. The iOS 26 "inset" look at partial heights is not a different frame. It is the full-width frame **scaled down** by a transform, so the gap is equal on the sides and the bottom (UIKitCore_62 9460 to 9560, applied when Solarium is on, the frame spans the container, and `disableSolariumInsets` is false) [C]:

```
t        = 1 - percentFullHeight          // 1 at the medium/lower detents, 0 at large
shrink   = lerp(t, 0, 16 / width)         // normal heights
         = lerp(percentCapsular, 16 / width, 56 / width)   // very short sheets, 150 -> 76 pt tall
scale    = 1 - shrink
ty       = (shrink*H - shrink*W) / 2      // the bottom gap equals the side gap
```

- **Inset at partial heights: 8 pt each side and 8 pt at the bottom** (16 pt total across the width), going to **0 at the large detent** as the sheet is dragged up [C]. Measured on `sheets-medium-detent`: 6 pt sides, about 7 pt bottom [I] (a drawn figure, not a device capture).
- **Very short sheets** (150 down to 76 pt tall) blend toward 28 pt per side and a capsule shape (`percentCapsular = clamp(unlerp(height, 150, 76))`) [C].
- Legacy iPad/landscape floating margins come from `_UISheetPresentationMetrics`: `minimumSidePadding` 25, `topOffset` 10, `topOffsetInCompactHeight` 8, legacy `cornerRadius` 10 [C] (the 10 pt radius is the pre-26 value, used only when Solarium insets are off).
- In compact height (landscape phone), the default is full screen. `prefersEdgeAttachedInCompactHeight` makes it "only attach to the screen on its bottom edge." [D]

### Corner radii (`sub_189108DF4`) [C]

```
displayCorner = windowScene cornerRadiusConfiguration, else traitCollection.displayCornerRadius  (sub_18919A3F8)
v24           = clamp((currentOffset + offsetAdjustment - topMargin) / (maxY - topMargin))
                // 0 when the sheet top is at its highest, rising as the sheet gets shorter
bottom        = max(displayCorner - 14 * v24, 20)
top           = lerp(percentCapsular, 38, bottom)     // edge attached: 38 pt at normal heights
```

- **Top corners: 38 pt** at every normal height, blending to the bottom value only for the capsule-short sheets [C]. (Before the scale transform, so about 37.4 pt on screen at the 8 pt inset on a 402 pt phone [I].)
- **Bottom corners follow the display corner** and pull in as the sheet gets shorter: `max(displayCorner - 14 v24, 20)` [C]. This is what WWDC calls "At smaller heights, the bottom edges pull in, nesting in the curved edges of the display." [D]
- If the sheet is shorter than two radii, the radius is capped at `height / 2` [C].
- At the large detent, full width and at rest, the corners on the attached edge are left to the environment (the display's own radius), so the sheet meets the screen corners [C].
- `preferredCornerRadius` overrides both when set (the default is `DBL_MAX` = automatic) [C]. `prefersSymmetricCorners` makes the top equal the bottom [C].
- The curve is continuous (`UIDropShadowView` sets `cornerCurve` continuous) [C].

### Background and dimming

- **Glass below the halfway point, opaque above.** `sub_1891102E0` picks `nonLargeBackground` while `percentFullHeight <= 0.5` and `largeBackground` above it. The iPhone default for the non-large background is a `_UIViewGlass` marked flexible, with a subvariant (the variant argument was not recovered) [C]. WWDC: "partial height sheets are inset by default with a Liquid Glass background... When transitioning to a full height sheet, the glass background gradually transitions, becoming opaque and anchoring to the edge of the screen." [D] (323) "when focus shifts, like dragging a sheet upward, Liquid Glass subtly recedes, becoming more opaque and gently growing in size" [D] (356).
- **Dimming:** by default "the system adds a noninteractive dimming view underneath the sheet at all detents." Set `largestUndimmedDetentIdentifier` for a nonmodal sheet over live content [D]. "When a task interrupts the main flow, pair Liquid Glass with a dimming layer... when a task happens in parallel, Liquid Glass creates a natural separation" [D] (356).
- **Motion:** spring damping ratio 1.0, response 0.344144233 s; 0.8 damping on a high-speed flick (`transitionSpringParametersHighSpeed:`) [C].
- **iPad form sheet default size** (`defaultFormSheetSizeForScreenSize:`) [C]: longest screen side ≤ 1024: 540 × 600; ≤ 1590: 580 × 640; larger: 620 × 680; wide-margin screens: 414 × 394.

## 3. The close (X) and confirm (checkmark) buttons

- **Where:** a single-view sheet on iOS puts "the Cancel button... on the leading edge of the top toolbar. When present, the Done button belongs on the trailing edge." [D] (HIG Sheets, updated March 24, 2026). In the figures, Cancel is the `xmark` glyph in a glass circle and Done is a blue `checkmark` in a tinted glass circle [I] (`sheets-buttons-placement-cancel-done`). A nonmodal tool sheet with no Done can put the X trailing with a leading title (Notes Format) [I].
- **What it is:** `UIBarButtonItem(systemItem: .close)` in UIKit, `Button(role: .close)` in a SwiftUI `.toolbar` [D]. "Unlike a cancel operation, a close operation doesn't lose progress for a user." [D] "The system Done and Close buttons, and prominent style buttons have separate glass backgrounds" [D] (HIG Toolbars, `HIG.md` section 8), so the X never shares a capsule with other items. "Use the `.prominent` style for key actions such as Done or Submit... put it on the trailing side" [D] (HIG Toolbars). "A primary action, like Done, stays separate and appears tinted, often as a blue checkmark on iOS" [D] (356). "Use the standard Back and Close buttons... don't use a text label that says Back or Close" [D] (HIG Toolbars).
- **Size:** a **44 pt glass circle** [I]: 43.5 pt in all four HIG sheet figures (58 px at 4/3). The confirm checkmark is the same 44 pt circle, tinted [I]. This is the standard iOS 26 bar button platter size. The HIG's floor is "a hit region of at least 44x44 pt" [D].
- **Glyph:** the `xmark` ink measures 16.5 × 16.5 pt in the 44 pt circle, a regular-weight symbol at the bar's symbol size [I]. The glyph is label ink (monochrome), not a secondary vibrancy fill [I].
- **Inset: 16 pt from the sheet's top edge and 16 pt from its side**, on both the medium and large figures [I] (16.5 and 15.75 pt measured). **This is exactly concentric with the 38 pt top corner [C]: 22 (the button radius) + 16 = 38.** The button's center sits 38 pt below and 38 pt in from the corner [I]. WWDC: "a button that is positioned at the bottom of a sheet should share the same corner center with the corners of the sheet" [D] (323). "Concentric shapes calculate their radius by subtracting padding from the parent's" [D] (356).
- **The grabber does not move the bar.** The X top is at 16 pt with the grabber (drawn at 5 to 10 pt) and would be at 16 pt without it. The grabber overlays the bar's top padding [C] (overlay above) [I] (figures).
- **Title:** the inline navigation title, 17 pt semibold [I] (12.75 pt ink height for "Title" on the figure), centered horizontally, and vertically centered on the buttons' center line (ink center 1.5 pt below the button center, the optical position of a cap-and-ascender word) [I].
- **Buttons to avoid:** "Avoid showing all three buttons, Cancel, Done, and Back, together." "The Back button... isn't intended to dismiss a sheet." "If you provide a Done button, always pair it with a Cancel button" [D] (HIG Sheets).

## 4. HIG and WWDC, quoted

HIG Sheets [D]:
- "A sheet is useful for requesting specific information from people or presenting a simple task that they can complete before returning to the parent view."
- "In iOS and iPadOS, a sheet can be either modal or nonmodal. When a nonmodal sheet is onscreen, people use its functionality to affect the parent view without dismissing the sheet."
- "A resizable sheet expands when people scroll its contents or drag the grabber, which is a small horizontal indicator that can appear at the top edge of a sheet. Sheets resize according to their detents... The system defines two detents: large is the height of a fully expanded sheet and medium is about half of the fully expanded height."
- "Sheets automatically support the large detent. Adding the medium detent allows the sheet to rest at both heights, whereas specifying only medium prevents the sheet from expanding to full height."
- "**In an iPhone app, consider supporting the medium detent to allow progressive disclosure of the sheet's content.**... you might not want to support the medium detent if a sheet's content is more useful when it displays at full height. For example, the compose sheets in Messages and Mail display only at full height."
- "**Include a grabber in a resizable sheet.**"
- "**Support swiping to dismiss a sheet.** People expect to swipe vertically to dismiss a sheet instead of tapping a dismiss button. If people have unsaved changes... use an action sheet to let them confirm their action."
- "**Display only one sheet at a time from the main interface.**"
- "**For complex or prolonged user flows, consider alternatives to sheets.** For example, iOS and iPadOS offer a full-screen style of modal view."

HIG Modality [D]:
- "**Always give people an obvious way to dismiss a modal view.**... in iOS, iPadOS, and watchOS apps, people typically expect to find a button in the top toolbar or swipe down."
- "**Make it easy to identify a modal view's task.**... provide a title that names the modal view's task."
- "**Consider using a full-screen modal style for in-depth content or a complex task.**"

HIG Popovers [D]:
- "**Avoid displaying popovers in compact views.**... for compact views, use all available screen space by presenting information in a full-screen modal view like a sheet instead."
- "**Use a Close button for confirmation and guidance only.**... Otherwise, a popover generally closes when people click or tap outside its bounds."

HIG Toolbars and Layout [D]:
- "By default, standard buttons, text fields, headers, and footers have corner radii that are concentric with bar corners."
- "**Group navigation controls and critical actions like Done, Close, or Save in dedicated, familiar, and visually distinct sections.**"

WWDC25 [D]:
- 284: "Sheets have an updated design in iOS 26. They adapt their appearance from smaller to larger heights. To take advantage of their new glass appearance, remove any custom backgrounds."
- 323: "On iOS 26, partial height sheets are inset by default with a Liquid Glass background." "Sheets can also directly morph out of buttons that present them."
- 356: "For phone layouts, use a capsule with extra margin to create space near the screen edge."

## 5. Drawer vs sheet

- **iPhone has no "drawer."** There is no drawer component in UIKit or SwiftUI, and the HIG has no drawer page [D]. Apple's closest shapes are the **sheet with detents** (Maps, Find My, Weather: resizable, often nonmodal via `largestUndimmedDetentIdentifier`, grabber on) and the **fixed sheet** (a form or a choice, dimmed, no grabber, dismissed by the X or a swipe).
- **iPad and Mac:** a docked side panel is a sidebar or inspector (HIG Sidebars, Split views). A centered modal is a form sheet at the sizes in section 2 [C]. A popover only in regular width [D].
- **How our uses map** (the list is in section 6):
  - Fixed task sheets with a title and X, content-sized, dimmed, no grabber: Rename, Delete, Confirm Purchase, Report, Add user, Manage user, Checkout, Donate, Points, Seats, Plan, Deliver, Post a request, Edit Profile, Create/Edit fundraiser, Sign in, Owner chooser, Prompt host, Publish composer, Delete account. These are Apple's modal form sheet: X leading, the confirm checkmark trailing when there is one, **no grabber**.
  - Tall browsers (`[sheetFill]`): Pictures library, Export, Versions, Messaging, Annotations, Block inspector, Changelog, Palette, Publish panel, Edit Cover. On iPhone these are either a large-detent sheet (opaque, edge attached, no side inset) or a medium + large sheet with a grabber. Which one is a product call (section 8).
  - Tool palettes over live work (Drill Band, Sections, Show menu, Section menu, Picture Shapes, Field/Uniform color and palette, Camera panel, Library New/Show, Stage): Apple's nonmodal sheet (Notes Format): content-sized, no grabber unless resizable, undimmed if the work behind must stay live.

## 6. Gap table

Paths are under `ShowStudio.Libraries/Jwift/Jwift.Angular/src/`.

| component | what we do | what Apple does | file:line |
|---|---|---|---|
| grabber visibility | `<jiv class="Jwift_DrawerHandle" />` is unconditional: every drawer draws a grabber, including single-height sheets that cannot be dragged at all (the drawer has no drag or detents) | off by default; only on a resizable sheet, or when it is not apparent it can resize or it cannot be swiped away [C][D] | `Drawer/Drawer.ts:52` |
| grabber in layout | a flow child: 12 pt card padding + 2 pt margin + 5 pt bar + 14 pt gap before the title. It pushes the title and (by the hand-computed `Top: 30pt`) the X down | an overlay at 5 pt from the top edge; content and the nav bar do not move [C] | `Drawer/Drawer.jss:26-27, 47-55, 80-81` |
| grabber look | 38 × 5 pt, radius 5 pt (not a capsule), `@InkFaint` flat fill | 36 × 5 pt capsule, `tertiaryLabelColor` through a color-matrix + 30 pt blur effect, 44 × 44 hit region, tap cycles detents or dismisses [C] | `Drawer/Drawer.jss:47-55` |
| close button size | 32 × 32 pt, a `JwiftPress` circle with a secondary-fill vibrancy backdrop, not a glass button | a 44 pt Liquid Glass circle with its own glass background (bar button platter), `xmark` in label ink [D][I] | `Drawer/Drawer.jss:77-90` |
| close button inset | `Top: 30pt; Left: 20pt`, so its center is at (36, 46) against a 38 pt corner: not concentric (a concentric 32 pt button would sit at 22, 22) | 16 pt from the top and side: center (38, 38), concentric with the 38 pt corner [C][I] | `Drawer/Drawer.jss:81-82` |
| close glyph | 12 pt `JwiftIcons` weight 600 with secondary-label vibrancy | about 16.5 pt ink, regular weight, label ink [I] | `Drawer/Drawer.jss:92-97` |
| close shown only with a title | the X (and title) render only when `sheetTitle` is set; an untitled drawer has a grabber and no way to close but the scrim | every modal sheet has an obvious dismiss: the X in the top bar or a swipe [D] | `Drawer/Drawer.ts:53-58` |
| confirm button | none built in; each sheet draws its own primary action in its body | Done is a tinted 44 pt checkmark circle, trailing, mirroring the X [D][I] | `Drawer/Drawer.ts:51-61` |
| title | 22 pt / 700 Inter, centered, 40 pt side margins, on its own row below the grabber | inline nav title 17 pt semibold, centered on the buttons' center line (38 pt below the top) [I] | `Drawer/Drawer.jss:59-70` |
| card inset | a constant `@JwiftSheetInset` = 52 - 38 = 14 pt on the sides and bottom at every height | 8 pt at partial heights (a uniform scale), 0 at the large detent [C] | `Drawer/Drawer.jss:21-22`, `Glass/Jwift.Glass.jss:105-107` |
| corner radii | 38 pt on all four corners | top 38 pt; bottom `max(displayCorner - 14 v24, 20)` following the display; environment corners at large [C] | `Drawer/Drawer.jss:28`, `Glass/Jwift.Glass.jss:106` |
| screen corner | a constant 52 pt | the device's `displayCornerRadius` trait [C] | `Glass/Jwift.Glass.jss:105` |
| tall sheet (`[sheetFill]`) | 82vh, still glass, still inset 14 pt, still 38 pt everywhere | the large detent: edge attached (no inset), opaque background above halfway, bottom corners are the screen's [C][D] | `Drawer/Drawer.jss:43-45` |
| material | always `JwiftGlass` | glass while `percentFullHeight <= 0.5`, the opaque large background above [C] | `Drawer/Drawer.jss:15` |
| gestures | none on the drawer: no swipe to dismiss, no drag between heights (the old HTML `ss-drawer` in `ShowStudio.App/src/Design/Drawer.ts:148-153` had them) | swipe down to dismiss (with an action sheet if there are unsaved changes); drag or tap the grabber between detents [D][C] | `Drawer/Drawer.ts` (whole file) |
| rise motion | `VisualTranslate` 380 ms, `Opacity` 240 ms, a timed transition from 900 pt below | spring, damping 1.0, response 0.344 s [C] | `Drawer/Drawer.jss:30-31, 36-38` |
| width | 660 pt, centered, on every size class | iPhone: full width (minus the 8 pt inset). iPad: a form sheet, 540 × 600 up to 620 × 680 by screen size [C] | `Drawer/Drawer.jss:18` |
| modal host | a 520 pt centered outlet over a scrim blurred 24 pt; no chrome of its own | on iPhone a modal is a sheet. On iPad, a form sheet on a dimmed (not blurred) background [D][C] | `Modal/ModalHost.jss:8-41` |
| glass button size | the round glass button is 48 pt | the sheet bar's buttons are 44 pt [I]. 48 stays right where it is copying another Apple control; the sheet close should not reuse it as is | `GlassButton/GlassButton.jss:20-27` |

## 7. Proposed JSS mapping

A sketch for the fix lane. Names follow Jwift's conventions; values are Apple's defaults with their tags. Our @JwiftScreenRadius stays as the stand-in for `displayCornerRadius` until Jaui can read the real device value.

```
// ── THE SHEET (Jwift.Glass.jss) ─────────────────────────────────────
@JwiftSheetTopRadius:    38pt   // [C] edge-attached top corners, every normal height
@JwiftSheetInsetPartial: 8pt    // [C] side and bottom gap below the large detent (16 / width as a scale)
@JwiftSheetMinRadius:    20pt   // [C] floor for the bottom corners
// bottom radius: max(@JwiftScreenRadius - 14 * t, @JwiftSheetMinRadius), t = how far down the top edge sits [C]

// ── THE GRABBER (Drawer.jss) ────────────────────────────────────────
Jwift_SheetGrabber {
  Position: Placed           // overlay: never a flow row [C]
  Top: 5pt                   // [C] grabberSpacing
  Width: 36pt                // [C]
  Height: 5pt                // [C]
  BorderRadius: 2.5pt        // capsule [C]
  // tertiaryLabel through a color matrix over a 30 pt blur [C]; closest Jwift token: tertiary-label vibrancy
  // hit region 44 x 44 [C]; tap = next detent down, wrapping; with one detent, tap = dismiss [C]
}
// Rendered only when the sheet is resizable (more than one detent) or [grabber]="true" is asked for [C][D].

// ── THE SHEET BAR (Drawer.jss) ──────────────────────────────────────
Jwift_SheetClose : Jwift_GlassBtn_Round {   // a real glass bar button, its own glass background [D]
  Position: Placed
  Top: 16pt                  // [I] 38 (corner) - 22 (radius): concentric [C]
  Left: 16pt                 // leading edge [D]
  Width: 44pt                // [I]
  Height: 44pt
  BorderRadius: 22pt
}
Jwift_SheetConfirm : Jwift_GlassBtn_Prominent_Round {   // the tinted checkmark, trailing [D]
  Position: Placed
  Top: 16pt
  Right: 16pt
  Width: 44pt
  Height: 44pt
  BorderRadius: 22pt
}
Jwift_SheetCloseGlyph { FontSize: 17pt  FontWeight: 400 }   // xmark ink about 16.5 pt, label ink [I]
Jwift_SheetTitle {
  // centered between the two 44 pt buttons, its line centered on y = 38pt [I]
  FontSize: 17pt  FontWeight: 600  TextAlign: Center
  Margin: 0pt 68pt           // 16 + 44 + 8 each side, so a long title never runs under a button
}
Jwift_SheetBody { Padding: 76pt 16pt 0pt 16pt }   // content starts below the bar (16 + 44 + 16) [I]

// ── HEIGHTS ────────────────────────────────────────────────────────
// Fixed (default): content-sized, glass, inset 8pt, top radius 38pt, bottom radius from the screen.
// Large ([sheetFill] on iPhone): edge attached, inset 0, opaque background, the screen's bottom corners.
// Medium + large (opt in): grabber on, drag and tap between them, glass below halfway and opaque above.
```

Rules the mapping encodes:
1. Grabber visibility = resizable (more than one detent) OR an explicit opt in. Never for a fixed sheet, a centered modal, or a popover.
2. The grabber never takes layout space. The bar sits at the same place with or without it.
3. The X is the standard 44 pt glass close button, 16 pt from the corner, concentric with the 38 pt top radius. The same rule gives the checkmark trailing.
4. The inset is a function of height: 8 pt at partial heights, 0 at large. It is not a constant derived from a guessed screen radius.
5. Every modal sheet can be closed: the X shows even without a title, and a vertical swipe dismisses.

## 8. Open questions (product calls for Jack)

1. **Which tall sheets get detents?** Pictures library, Messaging, Annotations, Notifications and Export read like Maps-style medium + large sheets (grabber on). Block inspector, Palette, Changelog, Publish and Edit Cover read like large-only form sheets (no grabber, like Mail compose). Apple permits both; the HIG leans toward medium for progressive disclosure on iPhone.
2. **Nonmodal tool sheets on the drill and picture editors** (Band, Sections, Shapes, color palettes, Camera panel): dimmed like a modal (today's scrim), or undimmed so the field stays live, like Notes Format with `largestUndimmedDetentIdentifier`?
3. **Swipe to dismiss:** the HIG expects it on every sheet. Adding it to `<drawer>` is a gesture lane of its own. It also needs the "unsaved changes" confirmation on the form sheets (Edit Profile, Create fundraiser, Post a request).
4. **The desktop and iPad presentation:** today a 660 pt centered card. Apple's iPad answer is a form sheet (540 × 600 up to 620 × 680, centered, dimmed). The `ModalHost` 520 pt outlet with a 24 pt blurred scrim is closer to that than the drawer is. Do both become one "form sheet" at regular width?
5. **Screen corner:** Apple reads the device's real corner radius. We assume 52 pt. On a phone with a different corner, the bottom corners won't nest. Is the web shell able to provide the device's corner radius (a Capacitor bridge value), or does 52 stay?
