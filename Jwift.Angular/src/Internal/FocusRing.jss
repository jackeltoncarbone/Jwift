// Apple's keyboard focus ring (HIG Full Keyboard Access): an accent-colour ring, concentric with the
// focused control, shown only while that control holds KEYBOARD focus — never on a pointer or touch
// press. `JivHost` creates one of these per focusable control and positions it with `Position: Attach`
// against the control's own node (`FocusRing.Geometry.ts` works out the attach inset and the radius,
// "the control's radius plus the gap"); this class carries only what every ring shares — the stroke
// itself, and that it never takes a hit of its own, so it can never sit between a tap and the control
// it rings.
Jwift_FocusRing {
  BorderWidth: 3.5pt
  BorderColor: @Prominent
  Interactive: false
  PointerEvents: None
}
