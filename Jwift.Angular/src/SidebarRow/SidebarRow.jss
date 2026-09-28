// HOUSE. Promoted from Admin.jss's `Adm_NavRow` ladder (the same row Surface's rail and the settings
// rail had each converged on separately).
Jwift_SidebarRow : JwiftPress {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 12pt
  Width: 100%
  MinHeight: 48pt
  Padding: 0pt 14pt
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 0)
}

Jwift_SidebarRow_On : Jwift_SidebarRow {
  Background: @SegOn
}
Jwift_SidebarRow_On:Hover {
  Background: @SegOnHover
}

Jwift_SidebarRowGlyph {
  FontFamily: JwiftIcons
  FontSize: 17pt
  FontWeight: 400
  Color: @InkSoft
  Width: 24pt
  TextAlign: Center
  FlexShrink: 0
}
Jwift_SidebarRowGlyph_On : Jwift_SidebarRowGlyph {
  Color: @Ink
}

Jwift_SidebarRowLabel {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  Color: @InkSoft
  FlexGrow: 1
  MaxLines: 1
}
Jwift_SidebarRowLabel_On : Jwift_SidebarRowLabel {
  FontWeight: 700
  Color: @Ink
}

Jwift_SidebarRowChevron {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 600
  Color: @InkFaint
  Width: 12pt
  TextAlign: Center
  FlexShrink: 0
}
