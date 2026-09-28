// HOUSE. Promoted from Messaging.jss's `Msg_Composer`/`Msg_Send` pair, which the Assistant and
// Support "ask" panels had each rebuilt to the same 48pt round send button.
Jwift_ComposerBar {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 8pt
  Width: 100%
  FlexShrink: 0
}

Jwift_ComposerBarField {
  FlexGrow: 1
}

// The send button is `<glass-button>` itself (round, prominent) — a JivHost component, so it registers
// the library's glass globals on its own construction. No plate is hand-rolled here.
Jwift_ComposerBarSendGlyph {
  FontFamily: JwiftIcons
  FontSize: 17pt
  Color: @OnProminent
}
