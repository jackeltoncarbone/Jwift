// HOUSE. Promoted from Surface/Editor.jss's `Ed_Entry`/`Ed_EntryHead`/`Ed_Add` ladder — a repeatable list
// an author adds to, reorders and removes, which the block editor, the changelog and several Admin asset
// editors had each rebuilt to the same shape.
Jwift_EntryListEditor {
  Direction: Column
  Align: Stretch
  Gap: 8pt
  Width: 100%
}
Jwift_EntryListEditorNote {
  FontFamily: Inter
  FontSize: 12pt
  FontWeight: 400
  LineHeight: 1.45
  Color: @InkSoft
  Padding: 0pt 4pt
}
Jwift_EntryListEditorRow {
  Direction: Column
  Align: Stretch
  Gap: 4pt
  Padding: 12pt
  BorderRadius: 14pt
  Background: @Recess
}
Jwift_EntryListEditorRowHead {
  Direction: Row
  Align: Center
  Gap: 6pt
}
Jwift_EntryListEditorRowTitle {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 700
  Color: @Ink
  MaxLines: 1
  FlexGrow: 1
}
// Self-contained (no `: JwiftPress`): this sheet registers via a plain `<jyle>`, not JivHost.
Jwift_EntryListEditorBtn {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Width: 32pt
  Height: 32pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  FlexShrink: 0
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_EntryListEditorBtn:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_EntryListEditorBtn_Off : Jwift_EntryListEditorBtn {
  Opacity: 0.3
  Interactive: false
  Cursor: Default
}
Jwift_EntryListEditorBtn_Off:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_EntryListEditorGlyph {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 400
  Color: @InkSoft
  TextAlign: Center
}
Jwift_EntryListEditorAdd {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Gap: 6pt
  MinHeight: 44pt
  Padding: 0pt 18pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  @Transition BackdropFilter { Duration: 140ms }
}
Jwift_EntryListEditorAdd:Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_EntryListEditorAddText {
  FontFamily: Inter
  FontSize: 14pt
  FontWeight: 600
  Color: @Ink
  UserSelect: None
}
