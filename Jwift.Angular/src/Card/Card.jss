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
