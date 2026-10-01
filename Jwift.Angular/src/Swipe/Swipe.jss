// SWIPE: the strip of actions a swiped row reveals. Geometry is per-instance (SwipeStrip.ts writes
// Position/Left/Right/Width/Top/Height through childLayout); everything that never varies lives here.

// Multi-class ADDITIONS onto Jwift_ListRow (List.jss) — ListRow itself stays untouched. The row
// claims a sideways pan (J1's PanClaim: Horizontal) and springs its own VisualTranslate back to rest;
// r = 0.35 -> Stiffness 322, Damping 36 (FlexMovement.TuneSpring). The Tracking variant drops the
// spring while a finger drives the translate directly.
Jwift_SwipeRowClaim {
  PanClaim: Horizontal
  @Spring VisualTranslate { Stiffness: 322, Damping: 36, Mass: 1 }
}
Jwift_SwipeRowClaim_Tracking {
  PanClaim: Horizontal
}

Jwift_SwipeStrip {
  Overflow: Hidden
  Direction: Row
  Justify: Start
  Align: Stretch
}

Jwift_SwipeAction {
  Direction: Column
  Justify: Center
  Align: Center
  Gap: 4pt
  PointerEvents: None
}

// The swipe IS the confirmation — a held press, not a menu row someone might brush past — so Danger
// is a flag against the house DangerRole law (ink only, never a fill) on purpose here.
Jwift_SwipeAction_Danger {
  Background: @Danger
}
Jwift_SwipeAction_Neutral {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_SwipeAction_Accent {
  Background: @Prominent
}

Jwift_SwipeActionGlyph {
  FontFamily: JwiftIcons
  FontSize: 20pt
  FontWeight: 400
  Color: @Ink
  TextAlign: Center
}
Jwift_SwipeActionGlyph_OnDanger : Jwift_SwipeActionGlyph {
  Color: @OnDanger
}
Jwift_SwipeActionGlyph_OnProminent : Jwift_SwipeActionGlyph {
  Color: @OnProminent
}

Jwift_SwipeActionLabel {
  FontFamily: Inter
  FontSize: 13pt
  FontWeight: 600
  Color: @Ink
  MaxLines: 1
}
Jwift_SwipeActionLabel_OnDanger : Jwift_SwipeActionLabel {
  Color: @OnDanger
}
Jwift_SwipeActionLabel_OnProminent : Jwift_SwipeActionLabel {
  Color: @OnProminent
}
