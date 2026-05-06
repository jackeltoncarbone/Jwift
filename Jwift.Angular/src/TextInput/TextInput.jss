// Jwift TextInput — house styling around the Jaui jinput primitive.
//
// Keep functional layout responsibilities on Jaui's JinputRoot/JinputWrap —
// this layer only adds the visual chrome (font, padding, optional surface).
// The Box currently renders without a background by default; consumers can
// place `<text-input>` inside a glass `<jiv>` if they want a contained
// surface (matches the existing picture-toolbar / drill-editor patterns).

TextInputBox {
  Direction: Column
  Justify: Start
  Align: Stretch
  Width: 100%
  Height: 100%
  FlexGrow: 1
  // Padding is a wrapper concern — apps that drop a TextInput into a tight
  // toolbar slot get crisp edges; apps that use it as a standalone field
  // can wrap it in their own padded container.
  Padding: 0pt
}

// Inter is the Show Studio + Jwift baseline. JinputSegment and JinputPlaceholder are Jaui-internal classes only emitted by jinput, so applying these rules globally is equivalent to scoping them under TextInputBox; JSS v1 doesn't support compound selectors.
JinputSegment {
  FontFamily: Inter
  FontWeight: 400
}

JinputPlaceholder {
  FontFamily: Inter
  FontWeight: 400
}
