// HOUSE. Promoted from Admin.jss's `Adm_RowList`/`Adm_Held`/`Adm_Pill2`/`Adm_Picker` ladder, which
// `CapabilityPicker` and `PickList` had each built to the same shape. Self-contained (no `: JwiftPress`):
// this sheet registers via a plain `<jyle>`, not JivHost, so the library's global glass base is not
// guaranteed registered first.
Jwift_SearchPickerRoot {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 8pt
  Width: 100%
}

Jwift_SearchPickerHeld {
  Direction: Row
  Justify: Start
  Align: Center
  Wrap: Wrap
  Gap: 8pt
  Width: 100%
}

// A held pill ends in its verbs, so it carries no trailing inset: the last 44pt verb circle IS the
// pill's rounded end, concentric by construction (22 = 22 + 0).
Jwift_SearchPickerPill {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 6pt
  MinHeight: 44pt
  Padding: 0pt 0pt 0pt 14pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  FlexShrink: 0
  MaxWidth: 100%
}
Jwift_SearchPickerPill_Retired : Jwift_SearchPickerPill {
  Background: @WarningWash
  BackdropFilter: Vibrancy(0)
}

Jwift_SearchPickerPillText {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 650
  Color: @Ink
  MaxLines: 1
  FlexShrink: 1
}
Jwift_SearchPickerPillText_Retired : Jwift_SearchPickerPillText {
  Color: @Warning
}

Jwift_SearchPickerPillGroup {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 600
  Color: @InkFaint
  MaxLines: 1
  FlexShrink: 0
}
Jwift_SearchPickerPillOrd {
  FontFamily: Inter
  FontSize: 12pt
  FontWeight: 700
  Color: @InkFaint
  MinWidth: 16pt
  TextAlign: Center
  FlexShrink: 0
}
Jwift_SearchPickerPillMark {
  FontFamily: Inter
  FontSize: 10pt
  FontWeight: 800
  LetterSpacing: 0.4pt
  Color: @Warning
  UserSelect: None
  FlexShrink: 0
  MaxLines: 1
}

// The pill's own verbs: remove, nudge earlier, nudge later. The TARGET is the full 44pt hit floor
// (Apple HIG), not a smaller circle inside it — the glyph stays small, only the hit region grows.
Jwift_SearchPickerMini {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Width: 44pt
  Height: 44pt
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 0)
  FlexShrink: 0
  @Transition Background { Duration: 140ms }
}
Jwift_SearchPickerMini:Hover {
  Background: @Wash
}
Jwift_SearchPickerMini_Off : Jwift_SearchPickerMini {
  Interactive: false
  Cursor: Default
  Opacity: 0.3
}
Jwift_SearchPickerMini_Off:Hover {
  Background: rgba(255, 255, 255, 0)
}
Jwift_SearchPickerMiniGlyph {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: @InkFaint
  TextAlign: Center
}

Jwift_SearchPickerNone {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  LineHeight: 1.45
  Color: @InkFaint
  MaxLines: 4
}

// The add/done chip. A CHIP is a filter or a toggle-in-place, floored at 44pt.
Jwift_SearchPickerChip {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 6pt
  MinHeight: 44pt
  Padding: 0pt 16pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  FlexShrink: 0
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_SearchPickerChip:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_SearchPickerChip_Off : Jwift_SearchPickerChip {
  Interactive: false
  Cursor: Default
  Opacity: 0.4
}
Jwift_SearchPickerChipOn : Jwift_SearchPickerChip {
  Background: @SegOn
}
Jwift_SearchPickerChipLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 650
  Color: @InkSoft
  UserSelect: None
  MaxLines: 1
}
Jwift_SearchPickerChipLabelOn : Jwift_SearchPickerChipLabel {
  FontWeight: 700
  Color: @Ink
}
Jwift_SearchPickerChipGlyph {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: @InkSoft
  TextAlign: Center
}
Jwift_SearchPickerChipGlyphOn : Jwift_SearchPickerChipGlyph {
  Color: @Ink
}

// The picker appears only while the operator is adding, and even then it is searched and grouped.
Jwift_SearchPickerPanel {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 10pt
  Width: 100%
  MaxHeight: 320pt
  Overflow: Scroll
  Padding: 14pt
  BorderRadius: 24pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_SearchPickerField {
  Width: 100%
}
Jwift_SearchPickerNote {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  LineHeight: 1.45
  Color: @InkFaint
  MaxLines: 5
}
Jwift_SearchPickerGroupHead {
  FontFamily: Inter
  FontSize: 11pt
  FontWeight: 800
  LetterSpacing: 0.6pt
  Color: @InkFaint
  Margin: 4pt 0pt 0pt 0pt
  MaxLines: 1
}
Jwift_SearchPickerOptions {
  Direction: Row
  Justify: Start
  Align: Stretch
  Wrap: Wrap
  Gap: 8pt
}
Jwift_SearchPickerOpt {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Column
  Justify: Center
  Align: Start
  Gap: 1pt
  MinHeight: 44pt
  Padding: 6pt 14pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  MaxWidth: 100%
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_SearchPickerOpt:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_SearchPickerOptLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 650
  Color: @Ink
  UserSelect: None
  MaxLines: 1
  TextOverflow: Ellipsis
}
Jwift_SearchPickerOptHint {
  FontFamily: Inter
  FontSize: 11pt
  FontWeight: 500
  Color: @InkFaint
  UserSelect: None
  MaxLines: 1
  TextOverflow: Ellipsis
}
