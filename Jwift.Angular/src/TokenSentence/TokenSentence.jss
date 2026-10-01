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
}
