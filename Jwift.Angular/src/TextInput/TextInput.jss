// THE FIELD. One body for every text entry in the app, answering the pointer and the keyboard the way the
// buttons do: it extends JwiftPress, so hover and press are the same lifts (@JwiftVibrancyFill,
// @JwiftVibrancyFillPressed) on the same 140ms spring. What differs is only what a field should do with them.
//
//   rest              Vibrancy(@JwiftVibrancySecondaryFill)   +18 dark / -12 light, the secondary fill
//   hover             Vibrancy(@JwiftVibrancyFill)            +30 / -20, the button's hover
//   pressed           Vibrancy(@JwiftVibrancyFillPressed)     +50 / -29, the button's press
//   editing           Vibrancy(@JwiftVibrancyFillPressed)     +50 / -29, brighter while the caret is in it; no ring;
//                     the glass field also holds its flex lift and glow (FlexHold), the same swell and
//                     brightening a pressed glass button shows, with no stretch toward a finger
//   editing + hover   Vibrancy(@JwiftFieldEditingHover)       +42 / -28, the hover step taken from the editing step
//   invalid           @DangerWash, no lift; @DangerWashStrong under a hover; a @Danger ring
//   disabled          Vibrancy(@JwiftVibrancyTertiaryFill), no response to the pointer; the text dims
//
// A field neither swells nor squeezes toward the pointer: a button is a target and takes UIKit's flex stretch
// on press, a field is a place. The glass field is the one exception, and only for the held lift and glow.
//
// Apple draws no focus ring on a field: the active one comes forward by brightening. Only an invalid value
// draws a ring, and BorderWidth is paint only, so it springs from 0 to 2pt with no reflow.

@JwiftFieldEditingHover: 2 * @JwiftVibrancyFillPressed - @JwiftVibrancyFill
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
  BorderColor: @Danger
  @Transition BorderWidth { Duration: 140ms }
  @Transition BorderColor { Duration: 140ms }
  @Transition Background { Duration: 140ms }
}

Jwift_Field:(Editing) {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
}

Jwift_Field:(Editing && Hover) {
  BackdropFilter: Vibrancy(@JwiftFieldEditingHover)
}

Jwift_Field:(Invalid) {
  Background: @DangerWash
  BackdropFilter: Vibrancy(0)
  BorderWidth: @JwiftFieldRing
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

// A field on glass, over its ground: the glass button's material and hover, the field's geometry, and the
// flex held rather than pressed. Editing brightens it with the held lift and big glow; an invalid value
// draws the danger color at the rim's width.
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
  Flex: Auto
  // A field is a place, not a target: no stretch toward the finger, only the held lift and glow.
  FlexStretch: 0
  FlexHold: 0
  @Spring FlexHold { Stiffness: 900, Damping: 60, Mass: 1 }
  BorderWidth: 0pt
  BorderColor: @Danger
  @Transition BorderWidth { Duration: 140ms }
}

// A glass sentence: the same glass, the tall field's card corner, growing with what is written.
Jwift_Field_Glass_Tall : Jwift_Field_Glass {
  Align: Stretch
  Height: Auto
  MinHeight: 96pt
  MaxHeight: none
  Padding: 12pt 18pt
  BorderRadius: 24pt
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

// Editing lights the glass: the flex's lift and big glow, held while the caret is in it. Apple's active
// field comes forward by brightening; it draws no ring.
Jwift_Field_Glass:(Editing) {
  BackdropFilter: Vibrancy(@JwiftVibrancyFillPressed)
  FlexHold: 1
}

Jwift_Field_Glass:(Editing && Hover) {
  BackdropFilter: Vibrancy(@JwiftFieldEditingHover)
}

Jwift_Field_Glass:(Invalid) {
  BorderWidth: @JwiftFieldRing
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
