// HOUSE. Promoted from Drill.jss's `PinHint` (a transient glass capsule: a glyph, a sentence, and the
// same 44pt round dismiss every "stop this mode" affordance in the app wears). Positioning (Placed, Top,
// Layer) is the CALLER'S: a hint means something different pinned under a header than docked at a pane's
// foot, so this sheet only states the capsule's own shape. Self-contained (no `: JwiftGlass`): this sheet
// registers via a plain `<jyle>`, not JivHost, so the library's global glass base is not guaranteed
// registered first.
// Its corner is the 44pt dismiss's (22) plus the 10pt it stands in (Drill Sentences lane WW2, item 2: at 24pt the round
// dismiss stood rounder than the corner around it). One line is a true capsule, 64pt tall.
Jwift_DismissibleHint {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  Padding: 10pt 10pt 10pt 14pt
  BorderRadius: 32pt
  BackdropFilter: Vibrancy(@JwiftVibrancySecondaryFill)
}
Jwift_DismissibleHintGlyph {
  FontFamily: JwiftIcons
  FontSize: 15pt
  Color: @GoldInk
  FlexShrink: 0
}
Jwift_DismissibleHintLabel : JwiftLabelVibrancy {
  UserSelect: None
  FontFamily: Inter
  FontSize: 14pt
  FontWeight: 600
  FlexGrow: 1
  FlexShrink: 1
  Overflow: Hidden
  MaxLines: 1
}
Jwift_DismissibleHintDrop {
  Interactive: true
  Cursor: Pointer
  Width: 44pt
  Height: 44pt
  BorderRadius: 22pt
  Direction: Row
  Justify: Center
  Align: Center
  AlignSelf: Center
  FlexShrink: 0
}
Jwift_DismissibleHintDropGlyph : JwiftSecondaryLabelVibrancy {
  FontFamily: JwiftIcons
  FontSize: 13pt
  FontWeight: 700
}

// THE INLINE TIP (`Variant="Inline"`, Drill Sentences lane R35, item 7; the owner, live: "why is the tooltip so thick and
// not taking up the full thickness of the panel inside the drill editor?"). Apple's TipKit inline tip, a TipView in a
// list: a rounded rectangle across the list's content width, its corner the caller's (`Corner`, concentric with the row
// it stands in), never a capsule; 12pt above and below the message and the row's own 12pt beside it; the message in the
// tip's own Subheadline, regular, secondary, wrapping as it needs (3 lines at most, this house's stated number for more
// than one line, never an unlimited sentinel the JSS grammar has no syntax for); the close a small secondary glyph at
// the top trailing corner. Its 44pt hit stands from the tip's top edge, past the 12pt the message stands in, so the
// glyph centers on the message's first line, and the hit takes no height of the tip's own (its -12pt margins).
Jwift_DismissibleHint_Inline {
  Align: Start
  Gap: @Gap4
  Padding: @Gap12 0pt @Gap12 @Gap12
}
Jwift_DismissibleHintLabel_Inline : JwiftSecondaryLabelVibrancy {
  FontSize: @TextSubhead
  FontWeight: 400
  LineHeight: @LeadRatioSubhead
  Overflow: Visible
  MaxLines: 3
}
Jwift_DismissibleHintDrop_Inline {
  AlignSelf: Start
  Margin: -12pt 0pt -12pt 0pt
}
Jwift_DismissibleHintDropGlyph_Inline {
  FontSize: @TextCaption2
  FontWeight: 600
}
