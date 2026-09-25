// The open panel's corner. A capped panel keeps the concentric gap from the screen's foot: the app's outer
// corner less this (Jwift.Glass.jss).
@JwiftDropdownRadius: 28pt

// Inherits the canonical Liquid-Glass look from JwiftGlass. Overrides
// only the heavier floating shadow (the dropdown lifts above content)
// and its own radius + interactive springs.
// @GlassTint is the accent fill a themed scope can set; by default the glass's own tint is the colour.
// Ink on the glass is the theme's @Ink.
@GlassTint: rgba(0, 0, 0, 0)

Jwift_GlassDropdown : JwiftGlass {
  Background: @GlassTint
  Overflow: Hidden;
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 4pt
  Gap: 2pt


  // Concentric with the 44pt pill rows at the 4pt closed padding; the open
  // state restates its own derivation below. Authored = apparent under the
  // corner compensation, so the old eyeballed 42 is retired.
  BorderRadius: 24pt

  Interactive: true
  Cursor: Pointer

  @Transition Width  { Duration: 280ms }
  @Transition Height { Duration: 280ms }
  @Transition Padding { Duration: 220ms }
  // 10ms is effectively instant, and it is deliberate FOR THE SWAP: closed and open are different
  // sizes of glass, so easing the backdrop across that change makes the panel look like it is
  // developing rather than opening. The open state overrides it for its own
  // HOVER -- see the derivation there. Nothing had written this down.
  @Transition BackdropFilter { Duration: 10ms }
  @Transition RimStrength { Duration: 10ms }
}

// Closed state sizes to its projected content so consumers can grow the
// pill into a multi-cell button group (e.g. the chrome's [points][cart]
// [avatar] cluster) without having to stamp another glass surface.
// Padding 4pt + Gap 4pt matches the iOS reference: 3 × 40pt cells inside
// a 48pt-tall pill.
Jwift_GlassDropdown_Closed : Jwift_GlassDropdown {
  Direction: Row
  Justify: Center
  Align: Center
  Padding: 4pt
  Gap: 4pt
  // Width: MaxContent — sum of all cells + gaps + padding (intended
  // pill behavior: actions + ellipsis + avatar in a row). MinContent on
  // a Row container resolves to MAX child intrinsic-min, not the sum,
  // so the pill collapsed to a single-cell circle (48pt × 48pt floor)
  // instead of expanding to fit the cluster. Height: MaxContent gives
  // the same answer as MinContent on the cross axis (tallest child),
  // kept symmetric for readability. The @Transition Width/Height rules
  // on the base class still have a numeric target to spring toward on
  // close — the resolved sum is a concrete number.
  Width: MaxContent
  Height: MaxContent
  MinWidth: 48pt
  MinHeight: 48pt
}

// Closed-state cell — flat 40pt round hit-target inside a closed dropdown.
// No own glass material (the wrapping dropdown owns the glass), so it takes the plain
// JwiftPress: a fill, no second material on top of the pill's. A cell in
// a group and a button on its own are the same control at two densities, and JwiftPress
// is why they answer a finger identically. Consumers stop click propagation when the cell
// should fire a direct action without toggling the dropdown; let it bubble when the cell
// is the open/close trigger (e.g. ellipsis). One canonical class — drill, picture,
// page-chrome all share it.
Jwift_GlassDropdownCell : JwiftPress {
  Width: 40pt
  Height: 40pt
  BorderRadius: 999pt
  Direction: Row
  Justify: Center
  Align: Center
  Background: rgba(255, 255, 255, 0)
}

// The SELECTED cell wears the press LIFT at rest — the same value JwiftPress:Active sets, so a
// held-open cell and a pressed one read as the same state. It was @PressFill, a white at 0.22 over the
// dropdown's glass; +50 of 255 is the same step in level with the glass's color left whole.
//
// The :Hover override is not noise. Filters merge by function, so without it the inherited
// JwiftPress:Hover (Lift 29) would REPLACE this rule's resting 50 and a selected cell would go DIMMER
// under the pointer. The paint version never showed that: the inherited hover fill stacked ON the
// resting fill. A lift does not stack with itself, so the strongest state has to be restated.
Jwift_GlassDropdownCell_Active : Jwift_GlassDropdownCell {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

Jwift_GlassDropdownCell_Active:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

// Disabled inline cell — dimmed + inert (e.g. Undo with nothing to undo). The
// click is also gated in the consumer; this is the VISUAL half so a cell that
// can't be used reads as unavailable instead of identical to an active one.
// Hover/active are flattened so it doesn't light up under the pointer — and since JwiftPress lifts
// rather than paints, flattening it means Vibrancy(0). Zeroing Background stopped working the moment the
// press became a lift, and a disabled cell has been lighting up under the pointer since.
Jwift_GlassDropdownCell_Disabled : Jwift_GlassDropdownCell {
  Opacity: @JwiftDisabledOpacity
  Cursor: Default
}
Jwift_GlassDropdownCell_Disabled:Hover {
  BackdropFilter: Vibrancy(0)
}
Jwift_GlassDropdownCell_Disabled:Active {
  BackdropFilter: Vibrancy(0)
}

// Round avatar-style cell — like the cell above but clips its inner
// image to a circle. Used for cells that contain a profile photo or
// other rounded artwork. Order: 200 pins it to the trailing end of the
// closed-state row regardless of when its sibling cells get inserted
// (signal-driven @for can populate later than static avatar cells,
// which would otherwise leave the avatar at index 0).
Jwift_GlassDropdownCell_Avatar : Jwift_GlassDropdownCell {
  Overflow: Hidden
  Order: 200
}

// The June special case, restored: a sink holding ONLY the avatar drops the
// pill's padding so the avatar fills the whole glass — a true circle, not a
// ring around a smaller circle — and the PILL takes the button's flex while
// the cell inside stays still (two nested squeezes read as a flinch).
// The pill is glass, so it takes the glass press, and its rim paints above the avatar
// (BorderLayer), which is what keeps the press legible when a photo fills the circle.
//
Jwift_GlassDropdown_ClosedAvatarOnly : Jwift_GlassDropdown_Closed, JwiftPressGlass {
  Padding: 0pt
}
Jwift_GlassDropdownCell_Avatar_Fill : Jwift_GlassDropdownCell_Avatar {
  Width: 48pt
  Height: 48pt
}

// Ellipsis "open the dropdown" trigger cell — sits between the action
// cells and the avatar. Order: 100 puts it after default-Order action
// cells but before the avatar (Order: 200).
Jwift_GlassDropdownCell_Ellipsis : Jwift_GlassDropdownCell {
  Order: 100
}

// The photo inside an avatar cell belongs to `<avatar Size="Fill">` (Avatar.jss's Jwift_AvatarPhoto),
// which fills the cell the same way and additionally knows whether the photo actually arrived.

// Open state pops out of flow so the expanded menu doesn't reflow siblings —
// anchors top-right against the nearest Placed ancestor (typically
// Jwift_PageHeader for toolbar consumers, or a consumer-side wrapper).
//
// Concentric chain — the glass corner nests around the ROWS inside it, not the
// app shell. Each item row is 44pt tall (→ 22pt pill radius), and the open
// glass sits 6pt outside the rows (the Padding below), so the concentric glass
// radius is 22 + 6 = 28pt. This is also the radius at which a single-row menu
// (6 + 44 + 6 = 56pt tall) is an exact pill (radius = height/2): one row reads
// as a capsule, and any taller menu (≥2 rows) is a rounded rectangle. The old
// 52pt was app-shell-concentric (80 − 28pt chrome inset) but exceeded half the
// height of short menus, so 2-option / few-warning dropdowns clamped to a pill.
// Direction/Justify/Align re-stated explicitly: when the resolver swaps
// from _Closed to _Open it rebuilds Layout from defaults, so anything not
// declared on _Open falls back to default (Direction: Row), not the base.
// The open menu is the same glass at a menu's size (later base wins).
Jwift_GlassDropdown_Open : Jwift_GlassDropdown, JwiftGlass {
  // Inert under the finger too: the closed avatar pill's flex stays with the closed pill.
  Flex: None
  // The open menu is UIKit's platter, outside the header's pocket: Automatic frost, where the closed pill takes None.
  GlassFrost: Automatic
  Position: Placed
  Top: 0pt
  Right: 0pt
  // A menu floats above ALL app content, the tab bar and scroll edges included, as on iOS. The dropdown sits
  // in a page's header, and Layer is sibling-local, so only the engine's top layer gets it over the dock.
  Layer: Top
  // 260pt, not 220pt. The rows carry leading icons now, and at 220 the icon plus its 12pt gap took enough
  // of the line that "Marching Arts Collective" truncated to "Marching Arts" - a persona switcher that
  // cannot say which persona. Apple's menus are content-width up to a max rather than a fixed narrow box;
  // this is the same idea at one number, and it is the width the longest real row needs.
  Width: 260pt
  Height: MinContent
  // A LONG MENU SCROLLS; IT DOES NOT RUN OFF THE SCREEN AND IT DOES NOT SQUASH ITS ROWS.
  //
  // `Height: MinContent` alone means the panel is exactly as tall as its rows, whatever the screen has
  // to say about it. At a 620pt-tall window the account menu's fourteen rows solve to 706pt from a top
  // at 20 — 106pt of options laid out past the bottom of the screen, opaque and unreachable. The cap
  // that stops that is NOT written here, because a number written here would be a guess: the room is
  // whatever is left under THIS dropdown's own top edge, which only the open dropdown can measure.
  // `GlassDropdown._fitToRoom()` measures it and writes `MaxHeight`, and the cap is cleared on close so
  // the next open measures again.
  //
  // `Overflow: Scroll` is the half that has to live in the sheet, and it is load-bearing twice over.
  // The rows are flex children, so a capped panel with `Hidden` SHRINKS them — measured: fourteen 44pt
  // rows in a 520pt box come out 30.7pt tall, which is a menu nobody asked for. A scroll container's
  // children get the scroll axis unbounded instead, so the rows keep their 44 and the surplus becomes
  // travel. Apple's own rule for the case, HIG > Menus: a long menu is fine for "user-defined or
  // dynamically generated content ... and scrolling is acceptable" — which is exactly the account
  // menu, whose length depends on how many personas you belong to and whether you can reach admin.
  // `Clip: Auto` already clips on Scroll as it did on Hidden, so the glass corner still cuts the rows.
  Overflow: Scroll
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 6pt
  // Rows sit 6pt apart, the same 6pt the glass keeps around them, so the
  // shared hover pill never touches a neighbour or a divider hairline.
  Gap: 6pt
  BorderRadius: @JwiftDropdownRadius

  // THE OPEN PANEL EASES ITS OWN HOVER, and this is the fix for a defect Jack found by using it:
  // "all of our glass, like our dropdowns, have this weird issue where when I'm hovering over it, it
  // gets deep really like basically instantly on hover and then when I go off it's instantly not,
  // there's no animation."
  //
  // He was describing the base's 10ms, which predates this sheet's current shape and was never
  // commented. It is right for the closed-to-open SWAP and wrong for a hover: :Hover and :Active both
  // move only Brightness (1.085 and 1.15 below), and a brightness step with no ramp reads as a glitch
  // rather than a response. One duration was serving two different events.
  //
  // 140ms is the house press duration -- JwiftPressMotion's spring, JwiftPress's fill, the dropdown
  // indicator's own Opacity and BackdropFilter all use it -- so the panel now answers a pointer on the
  // same clock as every other control instead of on its own.
  @Transition BackdropFilter { Duration: 140ms }
  @Transition RimStrength { Duration: 140ms }
}

// AN OPEN MENU IS INERT UNDER THE POINTER. ITS ROWS ARE NOT.
//
// Jack has now said this three times, each time closer to the principle. First: "just from hovering
// over the expanded drop-down, it has the same scaling effects that the collapse button does, and it's
// very large for that ... It's closed when it's a button or a button group and it's open when it's a
// menu." Then: "Can we maybe do like 10% of the effect ... Because it felt good, it was just very
// large." And finally, the question that settles it: "Why is the deepness even changing on hover? For
// an expanded dropdown."
//
// It should not. An open menu highlights the ROW under the pointer -- one shared indicator springs
// between rows -- and that is the whole feedback. A panel that also brightens is saying the same thing
// twice, in a way that reads as a glitch because the panel is large and the change is global.
//
// THESE RULES EXIST TO CANCEL AN INHERITANCE, NOT TO ADD AN EFFECT, and deleting them would make the
// problem worse. The open sink probes as `Jwift_GlassDropdown_Open.Jwift_GlassDropdown_Closed.
// Jwift_GlassDropdown_ClosedAvatarOnly` -- it still wears both closed classes, and _ClosedAvatarOnly
// composes JwiftPressGlass -> JwiftPress -> JwiftPressMotion. So with no rules here a 220x621 menu
// takes a 48pt control's physics whole: VisualScale 1.06 and the press's backdrop fill. The previous answer scaled that to a tenth (1.006 / 1.085). A tenth
// of a thing that should not happen is still the thing happening.
//
// So both states now restate the panel's RESTING appearance. The pointer changes nothing; the
// indicator does all of it.
//
// :Active was also declared TWICE -- a second block already held these resting values, so someone had
// started this fix and left both declarations standing, with merge order deciding which won. One now.
Jwift_GlassDropdown_Open:Hover {
  Flex: None
  Background: @GlassTint
  BackdropFilter: None
  RimStrength: @JwiftRimStrength
}
Jwift_GlassDropdown_Open:Active {
  Background: @GlassTint
  BackdropFilter: None
  RimStrength: @JwiftRimStrength
}

// Item geometry follows iOS 26 popover-menu proportions: 44pt-tall pill
// rows with generous side padding and a comfortable icon→label gap.
// BorderRadius is declared at full Height so the item is always a pill
// regardless of how Height is later retuned — the renderer clamps to
// half-Height (22pt visible). The concentric chain still treats the
// effective radius as Height/2 = 22pt, and the open glass adds 6pt
// padding on top of that to land at 28pt.
// Rows draw nothing of their own: the hover / press highlight is ONE
// shared Jwift_GlassDropdownIndicator owned by the dropdown that springs
// between rows, so a row is only a hit target and a layout slot.
Jwift_GlassDropdownItem {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 12pt
  Padding: 0pt 14pt
  Width: 100%
  Height: 44pt
  BorderRadius: 44pt
  Background: rgba(255, 255, 255, 0)
  Interactive: true
  Cursor: Pointer
  UserSelect: None
}

Jwift_GlassDropdownItem_Disabled : Jwift_GlassDropdownItem {
  Opacity: @JwiftDisabledOpacity
  Cursor: Default
}

// Icon size matches label FontSize so both glyphs share the same line-
// height box and center identically along the row's cross axis. JwiftIcons
// glyphs sit low in their font box; matching the label size keeps the
// visual icon center aligned with the label baseline.
Jwift_GlassDropdownItemIcon {
  FontFamily: JwiftIcons
  FontSize: 15pt
  FontWeight: 500
  Color: @Ink
  TextAlign: Center
  Width: 22pt
}

// A consequential row reads as consequential BEFORE it is pressed, so the glyph
// takes the same red as the label below: the theme's @Danger.
// ONE INK INSIDE A MENU. RED BELONGS WHERE YOU CONFIRM, NOT WHERE YOU CHOOSE.
//
// Jack, settling this: "if delete a pic is in a drop down keep it the same color otherwise it stands out.
// if delete this section is a modal/dialog then it can stay in that one."
//
// So a menu row is a row - Delete reads like every other option until you pick it - and the red arrives
// in the CONFIRM that follows, where it is about to mean something. That keeps Apple's pairing intact
// ("destructive items last, red, CONFIRMED by an action sheet or popover") while refusing to shout at
// somebody who is still reading the list.
//
// WHAT `Destructive` STILL DOES, because it is not decoration: it orders the row last, and it is what
// raises the confirm with the danger plate (`JwiftDangerProminent` / `JwiftDangerInk`, untouched). So
// Delete a picture and Delete this section keep the flag and keep their confirm; what they lose is the
// red in the row itself. Sign Out never had a confirm to raise and is reversible anyway, so it no longer
// claims the flag at all.
//
// Held by `ShowStudio.App/src/Design/MenuInk.Conformance.spec.ts`: menu rows uniform, confirm plate red.
Jwift_GlassDropdownItemIcon_Destructive : Jwift_GlassDropdownItemIcon {
  Color: @Ink
}

// Fed by `[image]`, which is Cover-fit: the sugar in Jaui's Jiv.ts writes
// `Url("<src>", Cover)` and takes no fit argument, so this image is cropped to
// fill its 22pt box. A dead `FitMode: Contain` line sat here asking for the
// opposite and never did anything; stating Contain properly needs a fit option
// on `[image]` in Jaui, which does not exist yet.
Jwift_GlassDropdownItemImage {
  Width: 22pt
  Height: 22pt
}

Jwift_GlassDropdownItemLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 500
  Color: @Ink
  LetterSpacing: 0.1pt
  TextAlign: Left
  MaxLines: 1
}

// Sign out, Delete, Remove. Colour only: the row still wears the one shared
// indicator for hover and press, because a second press treatment per variant is
// exactly what the single-press rewrite retired. Same red as the context menu's
// destructive label, so the two menus say danger with one voice.
Jwift_GlassDropdownItemLabel_Destructive : Jwift_GlassDropdownItemLabel {
  Color: @Ink
}

// A section title in a menu, as UIKit's `_UIContextMenuHeaderView` draws it (Apple/Sizing.md section 4):
// Footnote medium, case as written, 12pt above the text and 16pt from its baseline to the rows, lined up
// with the rows' content. The 6pt row gaps on either side are part of both.
// Its ink is plain secondaryLabelColor with no compositing filter: the shared secondary level.
Jwift_GlassDropdownSectionHeader : JwiftSecondaryLabelVibrancy {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 500
  Padding: 6pt 14pt 7pt 14pt
  MaxLines: 1
}

// Hairline between large sections of a menu. It lives inside the 6pt row
// gap (6pt clear above and below), so no row pill can ever touch it.
Jwift_GlassDropdownDivider : JwiftSeparatorVibrancy {
  Width: 100%
  Height: 1pt
}

// The one shared highlight for every row of an open menu. Placed inside the
// open glass; the dropdown springs its Top/Height onto whichever row the
// pointer is over and fades it out when the pointer is on no row.
// A fill, not a material: Apple puts no glass on glass, and things on the glass are "fills,
// transparency, and vibrancy". A backdrop filter here would re-brighten the thick menu under it.
// THE HIGHLIGHT IS A THIN FILL WITH THE COLOUR BEHIND IT AMPLIFIED - all three of Apple's terms.
//
// `Apple/HIG.md`: "Always avoid glass on glass." Things placed on glass use
// "fills, transparency, and vibrancy" so they read as "a thin overlay that is part of the material".
// Three terms, not one. Vibrancy is specifically what "amplifies and adjusts the color of the content
// layered behind", which is the half a flat fill can never do.
//
// This started as `Background: @HoverFill` alone - a white wash painted OVER the menu's glass, which
// hides what is behind instead of lifting it. Jack: "Apple never does a background color. They always
// bring the color forward ... we bring color through, not overlay with a tint." I then took the fill out
// entirely, which drops a term Apple names: "We still have to honor the background color ... still that
// slight tint but we need to bring more saturation through."
//
// That is where the previous pass stopped: a thin fill (@HoverFill, 0.14 white in dark) beside a small
// brightness, "the two together what the single 0.14 wash was trying to be". THIS IS THE COMPLETION OF
// THAT, NOT A REVERSAL. The wash law (Jwift.Glass.jss, THE WASH) measured what Apple actually does in
// place of the fill: it ADDS a constant. So the honored background color is still honored -- it is
// just stated as the +29 / -19 Apple's own hover measures instead of as a veil that takes 14% of the
// menu's color away on its way past. Three terms, all three intact: the lift is the fill, Saturate is
// the vibrancy, and the element's own transparency is unchanged.
//
// The brightness is NOT re-tuned. It stayed small because the fill supplied part of the step, and the
// lift supplies that same part -- 29 of 255 where 0.14 over the menu's own floor was about 32. Changing
// a measured constant and a multiply in one diff would make neither attributable.
//
// NOT the pressed-glass lens: no Thickness and no Refraction. A menu row is not a tab pill,
// and "avoid glass on glass" is the rule that says so. A lift is not a second material either; it is
// the absence of one.
Jwift_GlassDropdownIndicator {
  Position: Placed
  Layer: 0
  BorderRadius: 100pt
  BackdropFilter: Vibrancy(@JwiftVibrancyFill) Saturate(@JwiftSelectionSaturate) Brightness(1.06 * @Dark + 0.97 * @Light)
  Opacity: 0

  @Transition Y { Duration: 220ms }
  @Transition X { Duration: 220ms }
  @Transition Width { Duration: 220ms }
  @Transition Height { Duration: 220ms }
  @Transition Opacity { Duration: 140ms }
  // Lift and grade deepen together on press, and they are now one property, so the 140ms that used to
  // be stated twice (Background beside BackdropFilter) is stated once. Nothing here sets a Background.
  @Transition BackdropFilter { Duration: 140ms }
}

Jwift_GlassDropdownIndicator_On : Jwift_GlassDropdownIndicator {
  Opacity: 1
}

// Pressed is the same grade, deeper: the press lift against the hover lift (50 against 29 in dark,
// -29 against -19 in light -- @JwiftVibrancyFillPressed, the one DERIVED number in the law, from @PressFill's
// own 0.22 / 0.12), and a touch more brightness behind it. Still no lens - a menu row is not a tab pill.
// Restating Lift here is required, not decorative: filters merge by function, so naming only Saturate
// and Brightness would leave the hover's 29 in place and the press would not deepen at all.
Jwift_GlassDropdownIndicator_Pressed : Jwift_GlassDropdownIndicator_On {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed) Saturate(@JwiftSelectionSaturate) Brightness(1.1 * @Dark + 0.94 * @Light)
}

