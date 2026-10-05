// TOKEN-SENTENCE: a cue rendered as tappable prose. Geometry is computed by TokenSentence.Layout.ts
// and written per-piece through childLayout/style bindings; everything that never varies by piece
// lives here. Every child is PointerEvents: None — the host alone hit-tests (GlassDropdown's pattern),
// because overlapping pills and underlines would otherwise fight the host for the pointer.

Jwift_TokenSentence {
  Width: 100%
  Interactive: true
  UserSelect: None
}

// A tappable token's pill — rendered only while its state is not at rest, so mount/unmount carries
// the Presence fade. Hover and press are LIFTS (WashLaw), never paint; Open is the one state that
// paints a flat tint, because it marks a token whose control is actually showing.
Jwift_TokenSentencePill {
  Position: Placed
  BorderRadius: 7pt
  PointerEvents: None
}
Jwift_TokenSentencePill_Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_TokenSentencePill_Press {
  BackdropFilter: Vibrancy(@JwiftVibrancyFill)
}
Jwift_TokenSentencePill_Open {
  Background: @GoldWash
}
Jwift_TokenSentencePill_OpenProblem {
  Background: @DangerWash
}

// The badge pill — Kind: Badge's permanent small chip (not state-driven; it is always drawn).
Jwift_TokenSentenceBadgePill {
  Position: Placed
  BorderRadius: 9pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  PointerEvents: None
}

// Word/Problem's underline — a 1pt hairline under the ink, hidden while the token is open (the pill
// says "active" instead).
Jwift_TokenSentenceUnderline {
  Position: Placed
  Height: 1pt
  PointerEvents: None
}

// A tappable token's own TEXT glyph. Round 14, live: a direct hit on the glyph itself (not its
// surrounding margin) fired TWICE per tap — once from this jext's own `(click)` (needed only for the
// SEO/accessibility mirror's synthetic activation, TokenSentence.ts's own doc comment on
// `_onMirrorActivate`) winning the engine's hit-test over the host (nothing else here declared
// PointerEvents:None, unlike every other overlay piece), and a second time from the REAL click bubbling
// up through the DOM to the host's own `(click)="_onHostClick"`. Two `TokenTap`s for one tap reads as
// open-then-close to `ControlToggle.ts`'s own `NextControlAction` (the second call's key matches the
// first's, so it answers `Close`) — the control never visibly opens. Worse for a bold, wide Value atom
// ("16 counts") than a short Word ("march"): more of its own box is covered by glyph ink rather than
// hit-margin, so a center tap is far more likely to land ON the glyph and double-fire. `PointerEvents:
// None` here, matching every other piece in this file, makes a real pointer tap pass straight through to
// the host (the only path meant to ever see one) while leaving the mirror's own synthetic `.click()` (an
// assistive-tech activation, never hit-tested) unaffected.
Jwift_TokenSentenceTextHit {
  PointerEvents: None
}

// The trailing "+" add button: a small round glyph glued to the sentence's last token.
Jwift_TokenSentenceAdd {
  Position: Placed
  Width: 28pt
  Height: 26pt
  BorderRadius: 13pt
  PointerEvents: None
}
Jwift_TokenSentenceAdd_Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_TokenSentenceAdd_Open {
  Background: @GoldWash
}
Jwift_TokenSentenceAddGlyph {
  FontFamily: JwiftIcons
  FontSize: 17pt
  FontWeight: 400
  Color: @GoldInk
  TextAlign: Center
  // Same double-fire this file's own Jwift_TokenSentenceTextHit guards against: the "+" jiv it sits
  // inside already carries PointerEvents:None through `Jwift_TokenSentenceAdd` (above), but a CHILD node
  // is hit-tested before its parent (`_hitTopmost` descends first) — this glyph, with no override of its
  // own, was the deepest node under a tap dead-center on "+", real on touch (round 14, live: "'+' only
  // selects the row" — the SAME tap also bubbled to the host's own `_onHostClick`, so AddTap fired twice,
  // opening the family menu and closing it again in the same gesture — never visibly opening at all).
  PointerEvents: None
}
