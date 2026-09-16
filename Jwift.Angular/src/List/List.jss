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
// Row height is the 44pt hit floor the HIG states for every control. Ink is the theme's ladder: @Ink for
// the label, @InkSoft for the value, @InkFaint for the chevron. The default fill is opaque, as Apple's grouped background is, so page
// content can never read through the rows; a section on glass takes the translucent variant below.

Jwift_List {
  Direction: Column
  Justify: Start
  Align: Stretch
  Gap: 0pt
  Width: 100%
  BorderRadius: 31.5pt
  Overflow: Hidden
  Background: @Panel
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

// A section that sits ON a glass surface (a sheet, a panel). The opaque grouped fill would block every
// colour the glass lets through, and a second material would be glass on glass, so it is a translucent
// FILL: a veil toward the theme's ground over a backdrop that is enriched (and in dark, sunk). The section
// reads as recessed into the glass and keeps the colour behind it.
Jwift_List_Translucent : Jwift_List {
  Background: @Recess
  BackdropFilter: Saturate(2) Brightness(0.75 * @Dark + 1 * @Light)
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
  Background: @Wash
}

Jwift_ListRow:Active {
  Background: @WashStrong
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

// A label longer than its row TRUNCATES. MaxLines alone only stops the second line being painted, so a
// long name laid out two lines tall lost its tail with nothing to say it had been cut — the system draws
// an ellipsis there, and a row is the one place a name is routinely too long for the space it has.
Jwift_ListLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 500
  Color: @Ink
  LetterSpacing: 0.1pt
  TextAlign: Left
  MaxLines: 1
  TextOverflow: Ellipsis
  FlexGrow: 1
}

// The trailing value on a settings row, the thing the row currently says.
Jwift_ListValue {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 400
  Color: @InkSoft
  TextAlign: Right
  MaxLines: 1
  TextOverflow: Ellipsis
  FlexShrink: 0
}

// A second line under the label, for rows that need to explain themselves.
Jwift_ListFootnote {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  Color: @InkSoft
  TextAlign: Left
  MaxLines: 2
  TextOverflow: Ellipsis
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
  Color: @Ink
  Width: 24pt
  TextAlign: Center
  FlexShrink: 0
}

Jwift_ListChevron {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: @InkFaint
  Width: 12pt
  TextAlign: Center
  FlexShrink: 0
}

// The hairline between rows. Full bleed by default; the inset variant starts where the LABEL starts so
// it clears a leading icon, which is how the system draws a list whose rows carry symbols.
Jwift_ListSeparator {
  Width: 100%
  Height: 1pt
  Background: @Line
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
  Color: @InkSoft
  LetterSpacing: 0.6pt
  TextAlign: Left
  Padding: 0pt 16pt 6pt 16pt
}

Jwift_ListSectionFooter {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 400
  Color: @InkSoft
  TextAlign: Left
  Padding: 6pt 16pt 0pt 16pt
  MaxLines: 4
}
