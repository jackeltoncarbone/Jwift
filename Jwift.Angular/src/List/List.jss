// Apple's inset grouped list, the shape behind most settings, account and detail screens.
//
// The system draws ONE rounded container per section and lets it CLIP square rows, which is why only the
// outer corners are round and why a pressed first row rounds at the top but not the bottom. Building it
// that way costs no per-row corner logic: the rows have no radius of their own to keep in step.
//
// THE RADIUS IS DERIVED, NOT PICKED. It is the radius of the roundest control a row can hold, plus the
// inset that control sits at:
//
//     section radius = control radius + row inset = 15.5 + 16 = 31.5
//
// 15.5 is half a 31pt switch, which is a capsule, and 16 is the row's UNIFORM padding, its comfort. The
// padding is uniform on purpose: that is what makes the container concentric with the control rather than
// merely near it. It also makes an alone group a true pill for free, because one row is 31 + 2*16 = 63
// tall and half of 63 is 31.5, the same number. Comfort therefore decides the corner; `radius` only
// overrides it when a section nests inside another shape and must stay concentric with THAT instead.
//
// Row height is the 44pt hit floor the HIG states for every control. Ink is the measured App Store
// ladder (Design/Apple.Measured.Spec.md): primary 0.92 for the label, secondary 0.64 for the value,
// tertiary 0.40 for the chevron. The fill is opaque, as Apple's grouped background is, so page content
// can never read through the rows.

Jwift_List {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 0pt
  Width: 100%
  BorderRadius: 31.5pt
  Overflow: Hidden
  Background: rgb(28, 28, 30)
}

// A section that floats on its own over content rather than sitting on a page ground.
Jwift_List_Glass : JwiftGlass {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 0pt
  Width: 100%
  BorderRadius: 31.5pt
  Overflow: Hidden
}

Jwift_ListRow {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 12pt
  Width: 100%
  MinHeight: 63pt
  Padding: 16pt
  Background: rgba(255, 255, 255, 0)
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  @Transition Background { Duration: 140ms }
}

Jwift_ListRow:Hover {
  Background: rgba(255, 255, 255, 0.06)
}

Jwift_ListRow:Active {
  Background: rgba(255, 255, 255, 0.12)
}

// A row that only reports, so it must not light up under the pointer.
Jwift_ListRow_Static : Jwift_ListRow {
  Interactive: false
  Cursor: Default
}

Jwift_ListRow_Static:Hover {
  Background: rgba(255, 255, 255, 0)
}

Jwift_ListRow_Static:Active {
  Background: rgba(255, 255, 255, 0)
}

Jwift_ListLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 500
  Color: rgba(255, 255, 255, 0.92)
  LetterSpacing: 0.1pt
  TextAlign: Left
  MaxLines: 1
  FlexGrow: 1
}

// The trailing value on a settings row, the thing the row currently says.
Jwift_ListValue {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 400
  Color: rgba(255, 255, 255, 0.64)
  TextAlign: Right
  MaxLines: 1
  FlexShrink: 0
}

// A second line under the label, for rows that need to explain themselves.
Jwift_ListFootnote {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  Color: rgba(255, 255, 255, 0.64)
  TextAlign: Left
  MaxLines: 2
}

Jwift_ListText {
  Direction: Column
  Justify: Center
  Align: Stretch
  Gap: 2pt
  FlexGrow: 1
}

Jwift_ListIcon {
  FontFamily: JwiftIcons
  FontSize: 17pt
  FontWeight: 400
  Color: rgba(255, 255, 255, 0.92)
  Width: 24pt
  TextAlign: Center
  FlexShrink: 0
}

Jwift_ListChevron {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.4)
  Width: 12pt
  TextAlign: Center
  FlexShrink: 0
}

// The hairline between rows. Full bleed by default; the inset variant starts where the LABEL starts so
// it clears a leading icon, which is how the system draws a list whose rows carry symbols.
Jwift_ListSeparator {
  Width: 100%
  Height: 1pt
  Background: rgba(255, 255, 255, 0.1)
  FlexShrink: 0
}

Jwift_ListSeparator_Inset : Jwift_ListSeparator {
  Width: Auto
  Margin: 0pt 0pt 0pt 52pt
}

// The small uppercase caption above a section, and the explanatory line below it.
Jwift_ListSectionHeader {
  FontFamily: Inter
  FontSize: 11pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.64)
  LetterSpacing: 0.6pt
  TextAlign: Left
  Padding: 0pt 16pt 6pt 16pt
}

Jwift_ListSectionFooter {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  Color: rgba(255, 255, 255, 0.64)
  TextAlign: Left
  Padding: 6pt 16pt 0pt 16pt
  MaxLines: 4
}
