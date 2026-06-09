Jwift_Card {
  Direction: Column
  Justify: End
  Align: Stretch
  BorderRadius: 48pt
  BorderWidth: 1pt
  BorderColor: rgba(255, 255, 255, 0.08)
  ShadowColor: rgba(0, 0, 0, 0.45)
  ShadowBlur: 24pt
  ShadowOffsetY: 10pt
  FlexGrow: 1
  FlexShrink: 0
  Overflow: Hidden
  Width: 260pt
  Height: 195pt
  // Card frame mounts immediately so its footer (title, badge, meta)
  // renders the moment the record is bound. The cover image rides on the
  // Background value — the Card component sets `Background: Url(src, Cover,
  // <placeholder>)` per instance from its `[src]` input. While the bitmap
  // is in flight the placeholder color paints; when ready the engine swaps
  // the resolved Background to the texture.
  Background: rgba(0, 0, 0, 0.55)
}

Jwift_Card_Compact : Jwift_Card {
  Width: 200pt
  Height: 150pt
  ShadowColor: rgba(0, 0, 0, 0.4)
  ShadowBlur: 20pt
  ShadowOffsetY: 8pt
}

Jwift_Card_Hero : Jwift_Card {
  Width: 480pt
  Height: 360pt
  BorderRadius: 56pt
  ShadowColor: rgba(0, 0, 0, 0.5)
  ShadowBlur: 32pt
  ShadowOffsetY: 14pt
}

// ── Fluid variants (opt-in via `<card fluid>`) ──
// The fixed variants above hard-pin `Width` (260/200/480pt) with `FlexShrink: 0`,
// so an oversized card overflows its row and runs off the screen. The fluid
// variants turn the row into a responsive auto-grid: the hard Width becomes a
// FlexBasis (the target column width that drives how many fit per line), with
// FlexGrow:1 (fill the line's slack on wide screens — no left-clump gap) +
// FlexShrink:1 + MaxWidth:100% (shrink to fit a narrow line — never overflow).
//
// `Width: Auto` is LOAD-BEARING: a concrete `Width` wins over `Align: Stretch`
// AND over flex grow/shrink, so without resetting it the card stayed at its
// fixed size inside a stretched/shrunk wrapper and spilled off the right edge
// (the asymmetric-gap-on-mobile bug). MinWidth:0 lets a lone card shrink below
// its basis to the narrowest phone's content width.
//
// Hover/active feedback: a slight grow + brighten on hover, slight shrink when
// pressed — same critically-damped idiom as Jwift_GlassBtn. VisualScale is
// render-only (no layout/hit-test impact) so neighbours never reflow. Scoped to
// the fluid (widget) variants so non-interactive card consumers are unaffected.
Jwift_Card_Fluid : Jwift_Card {
  Width: Auto
  FlexBasis: 260pt
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0
  MaxWidth: 100%
  Interactive: true
  Cursor: Pointer
  @Transition VisualScale { Duration: 160ms }
  @Transition Brightness { Duration: 160ms }
}
Jwift_Card_Fluid:Hover {
  VisualScale: 1.02
  Brightness: 1.12
}
Jwift_Card_Fluid:Active {
  VisualScale: 0.975
  Brightness: 1.22
}

Jwift_Card_Compact_Fluid : Jwift_Card_Compact {
  Width: Auto
  FlexBasis: 200pt
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0
  MaxWidth: 100%
  Interactive: true
  Cursor: Pointer
  @Transition VisualScale { Duration: 160ms }
  @Transition Brightness { Duration: 160ms }
}
Jwift_Card_Compact_Fluid:Hover {
  VisualScale: 1.02
  Brightness: 1.12
}
Jwift_Card_Compact_Fluid:Active {
  VisualScale: 0.975
  Brightness: 1.22
}

Jwift_Card_Hero_Fluid : Jwift_Card_Hero {
  Width: Auto
  FlexBasis: 480pt
  FlexGrow: 1
  FlexShrink: 1
  MinWidth: 0
  MaxWidth: 100%
  Interactive: true
  Cursor: Pointer
  @Transition VisualScale { Duration: 160ms }
  @Transition Brightness { Duration: 160ms }
}
Jwift_Card_Hero_Fluid:Hover {
  VisualScale: 1.015
  Brightness: 1.1
}
Jwift_Card_Hero_Fluid:Active {
  VisualScale: 0.98
  Brightness: 1.2
}

// Fill variant — card sizes to 100% of its parent so a grid cell can dictate
// the tile's size and aspect (the fixed variants hardcode Width/Height). Keeps
// the frame (radius, shadow, overflow, cover background) from Jwift_Card.
Jwift_Card_Fill : Jwift_Card {
  Width: 100%
  Height: 100%
  FlexGrow: 1
  FlexShrink: 1
}
Jwift_Card_Fill_Fluid : Jwift_Card_Fill {
  Interactive: true
  Cursor: Pointer
  @Transition VisualScale { Duration: 160ms }
  @Transition Brightness { Duration: 160ms }
}
Jwift_Card_Fill_Fluid:Hover {
  VisualScale: 1.02
  Brightness: 1.12
}
Jwift_Card_Fill_Fluid:Active {
  VisualScale: 0.975
  Brightness: 1.22
}

Jwift_CardFooter {
  Direction: Column
  Justify: Start
  Align: Start
  Padding: 18pt
  Gap: 8pt
  ProgressiveBlurDirection: ToBottom
  BackdropFrostBlur: 32pt
  Background: rgba(0, 0, 0, 0.55)
}
