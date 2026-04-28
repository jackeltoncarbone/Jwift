Jwift_Toolbar {
  Direction: Row
  Justify: SpaceBetween
  Align: Center
  Padding: 10pt
  Overflow: Visible
  Layer: 20
  PointerEvents: Auto
}

// Page-level pinning frame for a per-page header. Position:Placed at the
// top edge of the page's content area; consumers drop their `<toolbar>`
// (or a leading/trailing group pair) inside.
//
// PointerEvents: None lets clicks pass through the empty middle of the
// frame to whatever is underneath (the reality view, the page scroll);
// the toolbar's own pills set PointerEvents: Auto to receive clicks.
//
//   <jiv class="Jwift_PageHeader">
//     <toolbar #bar>
//       <jiv class="Jwift_ToolbarLeading">...</jiv>
//       <jiv class="Jwift_ToolbarTrailing">...</jiv>
//     </toolbar>
//   </jiv>
//
// Pages with a custom inset (Drill / Picture editor with 28pt symmetric
// concentric chrome) skip this and define their own pinned frame.
Jwift_PageHeader {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 8pt
  Layer: 22
  PointerEvents: None
}

// Leading / trailing group wrappers — every consumer toolbar needs to
// cluster its leading items (back-button + title) and trailing items
// (action dropdown + avatar) so they pack to opposite ends of the
// toolbar's SpaceBetween row instead of distributing across it.
// Jwift_ToolbarLeading / Jwift_ToolbarTrailing are the canonical group
// classes — consumers drop them on a `<jiv>` and nest the page-specific
// content inside.
//
// MinHeight: 48pt is critical — the trailing wrapper often holds a
// `<glass-dropdown>` whose Position:Placed parking takes it OUT of
// flex flow, leaving the wrapper with zero intrinsic height. A 0-height
// wrapper gets centered to the toolbar's vertical mid-line by Align:Center,
// and the Placed child anchors Top:0 relative to that mid-line — pushing
// the group ~half-toolbar-height down from the chrome edge. Locking the
// wrapper to 48pt (the canonical pill/cell height) gives flex something
// concrete to size against, so the wrapper aligns to the toolbar's
// padded content top and the trailing group sits at the symmetric
// chrome inset (top gap == side gap).
Jwift_ToolbarLeading {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  MinHeight: 48pt
  FlexShrink: 0
}

Jwift_ToolbarTrailing {
  Direction: Row
  Justify: End
  Align: Center
  Gap: 8pt
  MinHeight: 48pt
  FlexShrink: 0
}

// Canonical chevron-left glyph used inside `<glass-button shape="round">`
// for back buttons. Consumer toolbars apply this directly so they don't
// have to re-declare the icon font / size / color per page.
Jwift_ToolbarBackGlyph {
  FontFamily: JwiftIcons
  FontSize: 14pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.92)
  TextAlign: Center
}

// Toolbar title text. 15pt semibold matches the iOS 26 navigation-title
// scrolled state. Consumers can override per page via their own JSS.
Jwift_ToolbarTitle {
  FontFamily: Inter
  FontSize: 15pt
  FontWeight: 600
  Color: rgba(255, 255, 255, 0.96)
  LetterSpacing: -0.05pt
  TextAlign: Start
}

// Avatar — flat round 48pt cell. No glass material; the photo (or
// fallback person icon) IS the visual element. Sits in the toolbar
// alongside <glass-button> pills WITHOUT a glass shell so we don't get
// the "glass in glass" look (avatar inside glass-button → small image
// inset inside a glass ring with padding between, even when the image
// fills the button the glass rim still shows). Use directly:
//
//   <jiv class="Jwift_Avatar" [image]="avatarUrl" (click)="...">
//     @if (!avatarUrl) {
//       <icon class="ToolbarGlyph" Name="person.fill" />
//     }
//   </jiv>
Jwift_Avatar {
  Width: 48pt
  Height: 48pt
  BorderRadius: 999pt
  Overflow: Hidden
  Background: rgba(255, 255, 255, 0.12)
  Cursor: Pointer
  Interactive: true
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  FitMode: Cover
  @Transition Background { Duration: 160ms }
  @Transition VisualScale { Duration: 160ms }
}

Jwift_Avatar:Hover {
  Background: rgba(255, 255, 255, 0.2)
}

Jwift_Avatar:Active {
  VisualScale: 0.94
}

