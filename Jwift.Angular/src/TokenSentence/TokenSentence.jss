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
// The highlight's corner, read by `TokenSentence.PillRadiusOf` too: the corner a word's menu grows out of.
// Drill Sentences lane TK1 (the token sweep): 7pt had no Apple token at all (TOKENS.md); @RadiusSegmented
// (8) is the nearest named corner, Δ1.
@JwiftTokenPillRadius: @RadiusSegmented
Jwift_TokenSentencePill {
  Position: Placed
  BorderRadius: @JwiftTokenPillRadius
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
// Drill Sentences U1, item 9 (a gentle first-run hint) used to paint the target word as its own pill here
// (`Jwift_TokenSentencePill_Glow`, `Background: @GoldWash`) -- retired, Drill Sentences lane AE1, item 3
// (blind testers, both devices: "mark time" wore a solid gold chip while every other editable word was
// underlined, "same affordance, two looks"). The hint now brings that word's own UNDERLINE to full
// strength instead (`TokenSentence.ts`'s own `_underlines`), the same underline every other word wears,
// never a second visual language for "look here."

// The badge pill — Kind: Badge's permanent small chip (not state-driven; it is always drawn).
// Drill Sentences lane TK1 (the token sweep): 9pt had no Apple token (TOKENS.md); @RadiusSegmented (8), Δ1.
Jwift_TokenSentenceBadgePill {
  Position: Placed
  BorderRadius: @RadiusSegmented
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
  PointerEvents: None
}

// Word/Problem's underline — a 1pt hairline under the ink, hidden while the token is open (the pill
// says "active" instead). It goes the way its word goes (Jwift_TokenSentenceWord, below).
Jwift_TokenSentenceUnderline {
  Position: Placed
  Height: 1pt
  PointerEvents: None
  Opacity: Presence * (1 - Exiting)
  @Transition Opacity { Duration: 0ms }
}

// Drill Sentences lane PP2, item 5 (a round 20 blind desktop tester: nearly every word underlined, nothing stood out): a
// sentence at rest underlines its values, its who and its move word faintly (TokenSentence.ts's UnderlineOf), and its
// row's hover brings them to full strength, the hover reveal the "+" already uses.
Jwift_TokenSentenceUnderline_Faint {
  Background: @AccentInkLineFaint
  @If (Ancestor(Jwift_HoverGroup):Hover) { Background: @AccentInkLine }
}

// Every word of the sentence. Drill Sentences lane BB2, item 4 (blind testers: "outs8 counts" after a
// grouping, "theright face" after an undo): a word the sentence no longer has used to fade out where it
// stood for the presence spring's ~400ms, under the words now standing there. It goes at once; a word that
// arrives still fades in, in its own place (`LandPieces`, TokenSentence.Layout.ts, keeps any word from
// sliding through another).
Jwift_TokenSentenceWord {
  Opacity: Presence * (1 - Exiting)
  @Transition Opacity { Duration: 0ms }
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

// The trailing "+" add button: a small round glyph glued to the sentence's last token. One the words
// pushed elsewhere goes at once, as a word does (lane BB2, item 4).
Jwift_TokenSentenceAdd {
  Position: Placed
  Width: 28pt
  Height: 26pt
  BorderRadius: 13pt
  PointerEvents: None
  Opacity: Presence * (1 - Exiting)
  @Transition Opacity { Duration: 0ms }
}
Jwift_TokenSentenceAdd_Hover {
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_TokenSentenceAdd_Open {
  Background: @GoldWash
}
// Drill Sentences U1, item 8 (two first-time testers): a caller's own `AddVisible` input fades the "+"
// on a row that is neither current nor hovered — the box stays exactly where `ShowAdd`'s own layout
// reservation already puts it (TokenSentence.ts's own doc comment on `AddVisible`: toggling THAT would
// reflow the sentence, so only the paint fades here), it just has nothing to look at. Revealed again by
// `Ancestor(Jwift_HoverGroup):Hover` — the generic half of item 8: a caller wraps its own row in THIS
// class (Jaui's own ancestor-chain Hover already bubbles up from any descendant, and is pointer-type
// gated at the engine, never latching on a touch tap) and every `<token-sentence>` inside it gets the
// reveal for free, no app-specific class name baked into this kit file.
Jwift_TokenSentenceAdd_Faded {
  Opacity: 0
  @If (Ancestor(Jwift_HoverGroup):Hover) { Opacity: 1 }
  // The hover reveal still eases in (the "+" class above lands its own exit at once).
  @Transition Opacity { Duration: 200ms }
}
// Drill Sentences lane QQ2, item 5: a caller's `AddRest: Faint` leaves the "+" it does not show whole drawn quietly, so a
// desktop row says it has one before the mouse comes to it; the caller shows it whole on the hovered row (`AddVisible`).
Jwift_TokenSentenceAdd_Faint {
  Opacity: 0.3
  @Transition Opacity { Duration: 200ms }
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
