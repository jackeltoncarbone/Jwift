// THE FIELD. One body for every text entry in the app, answering the pointer and the keyboard the way the
// buttons do: it extends JwiftPress, so hover and press are the same lifts (@JwiftVibrancyFill,
// @JwiftVibrancyFillPressed) on the same 140ms spring. What differs is only what a field should do with them.
//
//   rest              Vibrancy(@JwiftVibrancySecondaryFill)   +18 dark / -12 light, the secondary fill
//   hover             Vibrancy(@JwiftVibrancyFill)            +30 / -20, the button's hover
//   pressed           Vibrancy(@JwiftVibrancyFillPressed)     +50 / -29, the button's press
//   editing           Vibrancy(@JwiftVibrancyFill)            +30 / -20, the fill, and the accent ring
//   editing + hover   Vibrancy(@JwiftFieldEditingHover)       +42 / -28, the hover step taken from the editing step
//   invalid           @DangerWash, no lift; @DangerWashStrong under a hover; the ring turns @Danger
//   disabled          Vibrancy(@JwiftVibrancyTertiaryFill), no response to the pointer; the text dims
//
// A field neither swells nor squeezes: a button is a target and takes UIKit's flex, a field is a place.
//
// The ring is a stroke in @GoldInk, the accent as a line, which is the one use of gold a control makes.
// BorderWidth is paint only (it never moves layout), so it springs from 0 to 2pt with no reflow.

@JwiftFieldEditingHover: 2 * @JwiftVibrancyFill - @JwiftVibrancySecondaryFill
@JwiftFieldRing: 2pt

// The toolbar button's 48pt is the floor for anything a finger can press, and a line of text is exactly that
// tall: pinned top and bottom, because FlexGrow is for the row it sits in and a column would stretch it.
Jwift_Field : JwiftPress {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 8pt
  Height: 48pt
  MinHeight: 48pt
  MaxHeight: 48pt
  MinWidth: 120pt
  FlexGrow: 1
  FlexShrink: 1
  Padding: 0pt 18pt
  BorderRadius: 999pt
  Cursor: Text
  Background: rgba(0, 0, 0, 0)
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  BorderWidth: 0pt
  BorderColor: @GoldInk
  @Transition BorderWidth { Duration: 140ms }
  @Transition BorderColor { Duration: 140ms }
  @Transition Background { Duration: 140ms }
}

Jwift_Field:(Editing) {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
  BorderWidth: @JwiftFieldRing
}

Jwift_Field:(Editing && Hover) {
  BackdropFilter: Vibrancy(@JwiftFieldEditingHover)
}

Jwift_Field:(Invalid) {
  Background: @DangerWash
  BackdropFilter: Vibrancy(0)
  BorderColor: @Danger
}

Jwift_Field:(Invalid && Hover) {
  Background: @DangerWashStrong
  BackdropFilter: Vibrancy(0)
}

Jwift_Field:Disabled {
  Cursor: Default
  BackdropFilter: Vibrancy(@JwiftVibrancyTertiaryFill)
  BorderWidth: 0pt
}

// A sentence is not a pill: it keeps a card corner and grows with what is written in it.
Jwift_Field_Tall : Jwift_Field {
  Align: Stretch
  Height: Auto
  MinHeight: 96pt
  MaxHeight: none
  Padding: 12pt 18pt
  BorderRadius: 24pt
}

// The one field a page leads with, over its ground: the glass button's material and hover, the field's
// geometry, and no flex. Editing and an invalid value draw a hairline in the accent or the danger color at the
// rim's own width, over the rim.
Jwift_Field_Glass : JwiftGlass, JwiftPressGlass {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 8pt
  Height: 48pt
  MinHeight: 48pt
  MaxHeight: 48pt
  MinWidth: 120pt
  FlexGrow: 1
  FlexShrink: 1
  Padding: 0pt 18pt
  BorderRadius: 999pt
  Cursor: Text
  Flex: None
}

// A number or a short code, in a field of its own width so a run of them reads as a column.
// Class="Jwift_Field_Short" on any material.
Jwift_Field_Short {
  FlexGrow: 0
  Width: 132pt
  MinWidth: 132pt
}

// Text in a surface its host draws. No paint and no states: the host is the control.
Jwift_Field_Bare {
  Direction: Row
  Align: Stretch
  Width: 100%
  Height: 100%
  FlexGrow: 1
}

Jwift_Field_Glass:(Editing) {
  BorderWidth: @JwiftRimWidth
  BorderColor: @GoldInk
}

Jwift_Field_Glass:(Invalid) {
  BorderWidth: @JwiftRimWidth
  BorderColor: @Danger
}

Jwift_Field_Glass:Disabled {
  Cursor: Default
  Opacity: 0.4
}

// The text's own cell takes what the glyph and the clear button leave.
Jwift_FieldText {
  Direction: Column
  Justify: Center
  Align: Stretch
  FlexGrow: 1
  FlexShrink: 1
  FlexBasis: 0pt
  MinWidth: 0pt
  AlignSelf: Stretch
}

// Multi-line text starts at the top of its field, like a text view.
Jwift_FieldTextTop : Jwift_FieldText {
  Justify: Start
}

// A search field's magnifying glass, as the home search drew it.
Jwift_FieldGlyph {
  FontFamily: JwiftIcons
  FontSize: 17pt
  FontWeight: 400
  Color: @InkSoft
  Width: 22pt
  TextAlign: Center
  AlignSelf: Center
  FlexShrink: 0
}

// Clearing is a button, so it is a full 48pt target; the negative margin gives back the field's trailing
// padding so the disc sits where Apple's does instead of 42pt in from the edge.
Jwift_FieldClear : JwiftPressMotion {
  Direction: Row
  Justify: Center
  Align: Center
  Width: 48pt
  Height: 48pt
  Margin: 0pt -14pt 0pt 0pt
  AlignSelf: Center
  FlexShrink: 0
}

// xmark.circle.fill, drawn: a disc in the placeholder ink with the ground's colour cut through it.
Jwift_FieldClearDisc {
  Direction: Row
  Justify: Center
  Align: Center
  Width: 18pt
  Height: 18pt
  BorderRadius: 999pt
  Background: @InkFaint
}

Jwift_FieldClearGlyph {
  FontFamily: JwiftIcons
  FontSize: 9pt
  FontWeight: 700
  Color: @Ground
  TextAlign: Center
}

// Inter is the Show Studio and Jwift baseline. JinputSegment and JinputPlaceholder are only emitted by
// jinput, so these apply exactly where a field's text is.
JinputSegment {
  FontFamily: Inter
  FontWeight: 400
}

JinputPlaceholder {
  FontFamily: Inter
  FontWeight: 400
}
