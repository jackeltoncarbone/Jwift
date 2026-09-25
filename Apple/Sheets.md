# Sheets, grabbers and the sheet close button (iOS 26)

What Apple's iOS 26 sheet does, read from UIKit 26.1 and the HIG, then what Jwift's `<sheet>` builds from it (sections 6 to 9).

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
  - Tall browsers (`[sheetFill]`): Pictures library, Export, Versions, Messaging, Annotations, Block inspector, Changelog, Palette, Publish panel, Edit Cover. On iPhone these are either a large-detent sheet (opaque, edge attached, no side inset) or a medium + large sheet with a grabber. Section 8 maps each one to its Apple precedent.
  - Tool palettes over live work (Drill Band, Sections, Show menu, Section menu, Picture Shapes, Field/Uniform color and palette, Camera panel, Library New/Show, Stage): Apple's nonmodal sheet (Notes Format): content-sized, no grabber unless resizable, undimmed if the work behind must stay live.

## 6. What Jwift builds (the `<sheet>`)

Built 2026-09-25. Jwift's `<drawer>` and `ModalHost` are deleted; `<sheet>` (`Jwift.Angular/src/Sheet/`) is the one presentation for every size. Paths are under `ShowStudio.Libraries/Jwift/Jwift.Angular/src/`.

| part | now | Apple | where |
|---|---|---|---|
| presentation | one component owns the dimming view, the card, the bar, the grabber, the pan, the rise and the exit; a page writes `@if (open) { <sheet (close)=...> }` and nothing else | UISheetPresentationController owns all of it [C] | `Sheet/Sheet.ts` |
| grabber | shown when the sheet has more than one detent, or `[grabber]="true"`; 36 × 5 pt capsule 5 pt below the top, tertiary label vibrancy through the glass, a 44 pt hit square; tap steps one detent down and wraps, one detent dismisses; hidden when another sheet covers it; an overlay, never a flow row | section 1 [C] | `Sheet.jss` `Jwift_SheetGrabber*`, `Sheet.Geometry.ts` `GrabberTarget` |
| bar | the X leading and the checkmark trailing (`[confirmable]`, `(confirm)`), each the 44 pt bar button (`<glass-button size="bar">`) at 16 pt, so its center is the 38 pt corner's; untitled sheets keep the X; the title 17 pt semibold on the buttons' center line | section 3 [C][I] | `Jwift_SheetBar`, `GlassButton.jss` `Jwift_GlassBtnBar_*` |
| inset | 8 pt sides and bottom at partial heights, closing to 0 at the large detent, as layout (the content reflows rather than scaling, so hit testing stays exact) | a uniform scale to the same 8 pt [C] | `InsetFor`, `PercentFullHeight` |
| corners | top 38 pt; bottom `max(display - 14 v, 20)`; capped at half the height; a form sheet 32 pt all round | `sub_189108DF4` [C] | `BottomRadius`, `SHEET_METRICS.FormRadius` |
| display corner | one engine var, `@DisplayCornerRadius`: the shell's `--DisplayCornerRadius` when a native host provides it, else Apple's value for the device class by screen size (402 × 874: 62 pt; iPad: 18; desktop: 0) | `displayCornerRadius` trait [C] | Jaui.Angular `Jaui/Jaui.DisplayCorner.ts` |
| material | Liquid Glass while at most half way to full height, the opaque `@Sheet` above; a form sheet is opaque | `sub_1891102E0` [C] | `Jwift_SheetGlass`, `Jwift_SheetOpaque` |
| dimming | black at 0.2 (light) / 0.48 (dark), never blurred, at every detent unless `[largestUndimmedDetent]`; fades in between that detent and the next and as the sheet is dragged away; a tap on it dismisses | `_alertControllerDimmingViewColor` [C] | `Jwift_SheetDim*`, `SHEET_METRICS.Dim*` |
| detents | `content` (fitted, capped at large), `medium` (0.56 of large; 0.63 at 568 pt), `large` (10 pt under the top safe area); smallest is the resting one | `UISheetDetentBlockMedium` [C], `topOffset` 10 [C] | `LargeHeight`, `MediumHeight` |
| pan | a vertical pan the content cannot use goes to the card: down when the scroller under the finger rests at its top (or there is none), up too below the largest detent; drags between detents with a rubber band past the largest; release settles to the detent the momentum carries it nearest to (UIScrollView projection), or dismisses | UIKit's sheet pan [C] | Jaui `PanClaim` (engine, `Core/Jaui.ts`), `Sheet.ts` `OnPanClaim` |
| unsaved changes | `[hasUnsavedChanges]`: a swipe rubber-bands, and every dismissal asks with Apple's menu from the X: "Discard Changes" (red) or "Keep Editing" | `isModalInPresentation` + an action sheet [D] | `Jwift_SheetAsk*` |
| motion | Apple's sheet spring (damping 1, response 0.344 s: stiffness 333.3, damping 36.5) on the offset, size, corners and dim | [C] | `Sheet.jss` `Jwift_SheetMotion` |
| body | scrolls under the bar by default, so a sheet never runs past the screen; `[bodyScrolls]="false"` for a sheet that pins its own parts (a search, a footer) | | `Jwift_SheetBody*` |
| regular width | a centered form sheet: 540 × 600, 580 × 640 or 620 × 680 by the screen's longer side, a fitted sheet as tall as its content up to that; swipe down still dismisses | `defaultFormSheetSizeForScreenSize:` [C] | `FormSheetSizeFor`, `IsRegularWidth` |

Read for this build, beyond sections 1 to 3 [C]:
- A centered floating (form) sheet's corner is `qword_1EA93D070`, set once by `0x1890FBAC0` to `0x4040000000000000` = 32.0 (`ipsw dyld disass` at the `swift_once` call in `sub_189108DF4`, `D:\AppleIPSW\sub_189108DF4.s`).
- `+[UIColor _dimmingViewColor]` is `_alertControllerDimmingViewColor`: white 0 at alpha `0x3FC999999999999A` = 0.2 (light) and `0x3FDEB851EB851EB8` = 0.48 (dark), read at `0x18a64c4d0` and `0x18a6788c0`.
- The medium detent is `maximumDetentValue × dbl_18A682B20[height > 568]`: 0.63 at 568 pt and under, 0.56 above (`0x18A682B20`).

## 7. The JSS levers

Every lever has Apple's value as its default; a page sets only what differs.

```
<sheet
  sheetTitle="..."                        // the inline title; untitled sheets still get the X
  [detents]="['medium', 'large']"         // default ['content']: fitted, dimmed, no grabber
  [largestUndimmedDetent]="'medium'"      // default null: dimmed at every detent
  [grabber]="true"                        // default: shown only when resizable
  [confirmable]="true" (confirm)="..."    // the tinted checkmark, trailing
  [hasUnsavedChanges]="Dirty()"           // Apple's discard ask on every dismissal
  [bodyScrolls]="false"                   // the content pins its own parts
  [TeleportTo]="JWIFT_SHEET_OUTLET"       // present over the tab bar from inside a page
  Class="Jwift_SheetLayer_Over"           // over a full-screen presentation
  (presented)="..."                       // the rise has settled: a DOM embed may mount
  (close)="open.set(false)">
```

```
Jwift_SheetGrabber   { Width: 36pt  Height: 5pt  BorderRadius: 2.5pt  Margin-top 5pt, tertiary label vibrancy }
Jwift_SheetBar       { Height: 76pt  Padding: 16pt  Gap: 8pt }          // 16 + 44 + 16
Jwift_GlassBtnBar_Round { Width: 44pt  Height: 44pt  BorderRadius: 22pt }
Jwift_SheetTitle     { FontSize: 17pt  FontWeight: 600 }
Jwift_SheetDim       { Background: black }  opacity 0.2 / 0.48 × the detent's dim
Jwift_SheetMotion    { @Spring X / Y / Width / Height / BorderRadius { Stiffness: 333.3, Damping: 36.5 } }
Jwift_SheetCard      { PanClaim: Down }     Jwift_SheetCard_Grows { PanClaim: Vertical }
@DisplayCornerRadius  // Jaui engine var
```

## 8. Every sheet in the app, and its Apple precedent

Jack's rule: "whatever Apple does, we do." Each use takes its closest first-party equivalent's detents and dimming. Default where not listed otherwise: a fitted (`content`) detent, dimmed, no grabber, the X leading.

| sheet | file | detents | dim | Apple precedent |
|---|---|---|---|---|
| Pictures (drill library) | `App/Drill/Drill.Page.ts` | medium, large (grabber) | dimmed | Photos picker (PHPicker): medium and large, dimmed |
| Export | `App/Drill/Export/DrillExportSheet.ts` | medium, large (grabber) | dimmed | the share sheet (UIActivityViewController): medium and large |
| Versions | `App/Drill/Versions/DrillVersionsSheet.ts` | large | dimmed | Pages / Numbers "Browse All Versions": full height |
| Band, Sections | `App/Drill/Drill.Page.ts` | content | undimmed (the field stays live) | Notes' Format sheet: a nonmodal tool sheet, `largestUndimmedDetentIdentifier` |
| Show menu, Section menu | `App/Drill/Drill.Page.ts` | content | dimmed | an action list presented as a sheet (Files' "…" on iPhone) |
| Notes (Annotations) | `Annotations/AnnotationsPane.ts` | medium, large (grabber) | undimmed at medium | Maps / Photos info sheets: resizable, the work live behind at medium |
| Messaging | `Messaging/MessagingSheet.ts` | large | dimmed | Messages and Mail compose "display only at full height" (HIG) |
| Notifications | `Notifications/NotificationsSheet.ts` | large | dimmed | the App Store account sheet |
| Block inspector | `Content/Editor/BlockInspector.ts` | medium, large (grabber) | undimmed at medium | Keynote / Pages Format inspector on iPhone |
| Palette (CMS) | `Content/Editor/PaletteSheet.ts` | medium, large (grabber) | undimmed at medium | the same Format inspector |
| What's New (changelog editor) | `Content/Editor/ChangelogEditor.ts` | large | dimmed | Mail compose: a long form, full height |
| Publish (CMS) | `Content/Editor/PublishPanel.ts` | large | dimmed | Mail compose |
| Edit Cover | `Item/Item.CoverEditor.ts` | large | dimmed | Photos "Edit" as a full-height sheet |
| Shapes (picture) | `App/Picture/Picture.Page.ts` | content | undimmed (the picture stays live) | Notes' Format sheet |
| Field / Uniform color, Environment and Uniform palette | `Field/Designer/*`, `Uniform/*` | medium, large (grabber) | undimmed at medium | the system color picker (UIColorPickerViewController) |
| Camera panels | `Reality/Camera/CameraPage.ts` | content | dimmed | modal by Jack's standing call ("make it a modal"), `Camera.PanelPlacement.spec.ts` |
| New (library), Show filter | `Library/Library.ts` | content, scrolls past the screen | dimmed | a chooser sheet (Reminders "New List"): fitted, capped at large |
| Sign in | `Authentication/SignInChooser.ts` | content | dimmed | the Sign in with Apple sheet |
| Owner chooser | `Profile/OwnerChooser.ts` | content | dimmed | an account chooser (Settings "Choose account") |
| Prompt host | `Design/Prompt/PromptHost.ts` | content | dimmed | a modal form sheet |
| Edit Profile | `Profile/EditProfileFlow.ts` | content | dimmed, asks before discarding | Contacts "Edit": Cancel asks "Discard Changes" |
| Start a fundraiser | `Fundraiser/CreateFundraiserFlow.ts` | content | dimmed, asks before discarding | the same |
| Post a request | `Services/ServiceRequestComposer.ts` | content | dimmed, asks before discarding | Mail compose's discard ask |
| Manage user (admin) | `Admin/Users/AdminUserSettings.ts` | content | dimmed, asks before discarding | the same |
| Rename, Delete (picture, animation), Delete account, Report, Purchase, Points, Checkout, Donate, Share, Deliver, Seats, Plan, Publish composer, Service reason, Stage, Create Profile, Edit fundraiser, admin Packages / Users | many | content | dimmed | modal form sheets |

### The sheet's glass, read

`sub_1891102E0`'s iPhone non-large background is the once-built `qword_1EA93D080`, whose initializer (`0x18910A6F4`) is `[[_UIViewGlass alloc] initWithVariant:0]`, `setFlexible:1`, `setSubvariant:@"sheet"` [C]; the large background is `systemBackgroundColor` [C]. DesignLibrary maps the string to `GlassMaterialProvider.Subvariant` 28 (`Subvariant.init`, DesignLibrary_08.mm 7832) and stores it at `Configuration +9`; no read of that byte branches on 28 anywhere in the decompiled DesignLibrary [C, by absence], so the sheet is plain regular glass at its size, with no tint and no legibility layer of its own. Measured through our medium Pictures sheet over the drill sentence (light): the page's luma contrast is kept at 0.248 of itself, against Apple's 0.8 dim × 0.318 face = 0.254 before blur [I]. What remains between ours and Apple's is the body blur (Apple's 4 pt at S ≥ 160; LiquidGlass.md 3.2), which the glass lane owns.

### The sheet's blur, read

No source path gives a presented sheet a softer blur than regular glass at default settings [C]. The sheet keeps regular glass's blur ramp; what its subvariant changes is two exterior layers.

- **The sheet's glass.** iPhone: `_UIViewGlass initWithVariant:0`, `setFlexible:1`, `setSubvariant:@"sheet"` (UIKit `sub_18910A6F4`); iPad: the same without the subvariant (`sub_18910A6A0`). `SheetLayoutInfo` picks it at or below half height (`sub_1891102E0`), and the sheet glass joins the sheet's backdrop group (`setBackdropGroupName:`). A detent's own `backgroundEffect` wins when set; none is by default.
- **Subvariant 28 (`sheet`) does branch** (correcting the earlier read). DesignLibrary `sub_18AE83CAC` returns Layers to remove, applied as `layers & ~mask` in `sub_18AE834E4`. For base `regular`, subvariants 27, 28 and 29 (mapsSign, sheet, messagesTapback) remove `0x50`. `0x10` is outer refraction: the `SolariumDisableOuterRefraction` default removes the same bit on every other glass. `0x40` is another exterior layer: the keyboard's "no exterior effects" path clears `0x1 | 0x10 | 0x40 | 0x2000`, and `0x1` / `0x2000` are the two drop-shadow forms (switched by `SolariumForcesDarkShadow`). `0x40` is the edge bleed: `sub_18AE88C0C` zeroes `Refraction.outerHeight` / `outerAmount` (bytes 272 to 287) when 0x10 is absent and `EdgeBleed.amount` / `height` (bytes 392 to 407, keeping its blur radius and opacity) when 0x40 is absent [C]. The drop shadow stays. Ported: `Jwift_SheetGlass` sets `GlassOuterRefraction: None` and `GlassBleed: None`.
- **Recipe option `0x20` (ramp ×4, 5.3 to 8 pt) is Reduce Motion.** `sub_18AFA8DFC` sets it from `Environment.accessibilityReduceMotion` (metadata field offset `0x48`). The environment is built in declaration order: appearsActive, windowAppearsActive, glassMaterialForeground, hasTintedElements, reduceTransparency, reduceMotion, showButtonShapes, lowPower, frost (`0x18AE7D314` to `0x18AE7D3FC`).
- **Option `0x10` (10 pt, denser face) is Reduce Transparency** (`0x44`) or the caller's input option `0x800`. Increased contrast adds `0x1000008`, and Show Button Shapes adds `0x800000`.
- **Not the Clear / Tinted setting.** `sub_18AFA46B0` is the internal `SolariumDisableOuterRefraction` default: `GlassMaterialProvider.Defaults.Storage` byte 29, lock-guarded at +32 and initial copy at +72, with key strings `Solarium*` in the DesignLibrary cstrings. It is not the Liquid Glass Clear / Tinted choice, so the earlier inference was wrong. The environment's `diffusion` (automatic / increased) comes from SwiftUI's `glassDiffusion` and `SolariumIncreasedDiffusion`. Which of those the Tinted setting drives is unread.
- **The frost trait comes from scroll-edge pockets, not sheets.** `GlassFrostTrait` is written only by the pocket container code (UIKit `sub_188AF8544`, `sub_1891DBB68`, `sub_1891DCD64`). `_UITraitGlassElevationLevel` is a Bool fed into SwiftUI's environment (`UITraitCollection.coreResolvedGlassMaterialEnvironment`). No sheet code sets either one in the dumps read.
- **The sheet's own trait is layout only.** The sheet writes trait token 20 (`_presentationSemanticContext`) = 2 (`_containerViewLayoutSubviews`). Its readers are navigation bar sizing and split view picker behavior.

The soft frames in Evidence are not UIKit sheets:
- The Customize sheet is SpringBoard's own `customizeSheet` subvariant (14).
- The Find My frame is a Newsroom render.

On a real UIKit medium sheet (Maps directions, `G\Apple\Crops
ewsroom-ios26-maps-preferred-routes-sheet-edge-over-map.png`), thin streets vanish under regular glass's roughly 4 pt blur plus its light face [I].

## 9. Open (product calls for Jack)

1. **The screen corner is the display's.** `@JwiftScreenRadius` is the engine's `@DisplayCornerRadius` (62 pt on a 402 pt phone, 18 on an iPad, 26 in a desktop window: macOS 26's unified-toolbar window, `Sizing.md` 10). The tab bar no longer derives its inset from it: UIKit's floating bar sits 21 pt in on every iPhone (`Sizing.md` 1) [C].
2. **The confirm checkmark is the app's prominent plate** (white in dark, black in light), not Apple's blue tint: the app's rule is that prominence is the inverted solid and gold is never a fill. No sheet uses the checkmark yet; forms keep their in-body primary action.
3. **Unsaved-change asks** are wired where a form already knew its draft (Edit Profile, Start a fundraiser, Post a request, admin Manage user). Edit fundraiser and the CMS editors have no dirty state to read yet.
4. **A programmatic close fades** (the engine's leave) rather than sliding down; every dismissal a person makes slides.
