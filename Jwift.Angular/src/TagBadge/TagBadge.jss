// HOUSE. A read-only status capsule, promoted from Services/Commerce.jss's `Cm_Tag*` ladder (four tones
// converged on independently by Services, Fundraiser, Classroom and Admin before this existed).
Jwift_TagBadge {
  Direction: Row
  Justify: Center
  Align: Center
  Height: 26pt
  Padding: 0pt 11pt
  BorderRadius: 999pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  FlexShrink: 0
}

Jwift_TagBadge_Accent : Jwift_TagBadge {
  Background: @GoldWash
  BackdropFilter: Vibrancy(0)
}
Jwift_TagBadge_Success : Jwift_TagBadge {
  Background: @PositiveWash
  BackdropFilter: Vibrancy(0)
}
Jwift_TagBadge_Warning : Jwift_TagBadge {
  Background: @WarningWash
  BackdropFilter: Vibrancy(0)
}
Jwift_TagBadge_Danger : Jwift_TagBadge {
  Background: @DangerWash
  BackdropFilter: Vibrancy(0)
}

Jwift_TagBadgeLabel {
  FontFamily: Inter
  FontSize: 11pt
  FontWeight: 700
  LetterSpacing: 0.3pt
  Color: @InkSoft
  UserSelect: None
  MaxLines: 1
}
Jwift_TagBadgeLabel_Accent : Jwift_TagBadgeLabel {
  Color: @GoldInk
}
Jwift_TagBadgeLabel_Success : Jwift_TagBadgeLabel {
  Color: @Positive
}
Jwift_TagBadgeLabel_Warning : Jwift_TagBadgeLabel {
  Color: @Warning
}
Jwift_TagBadgeLabel_Danger : Jwift_TagBadgeLabel {
  Color: @Danger
}
