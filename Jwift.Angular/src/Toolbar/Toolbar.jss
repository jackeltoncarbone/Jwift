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
// Padding: 18pt. Combined with Toolbar's own 10pt inset, glass-button
// pills land 28pt from the screen edge — the canonical @ChromePad value
// (concentric with @ScreenR: 80pt). Drill / Picture editors hardcode
// 28pt directly in their own TopBar; this matches them so consumers
// using <toolbar> + Jwift_PageHeader inherit the same concentric chrome.
Jwift_PageHeader {
  Position: Placed
  Top: 0pt
  Left: 0pt
  Width: 100%
  Direction: Column
  Justify: Start
  Align: Stretch
  Padding: 18pt
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
// Leading wrapper — pure flex row. Auto-sizes from its in-flow content
// (back-button is 48pt tall and 48pt wide, providing the cross-axis
// size; title text takes its natural width). No Height / MinHeight —
// imposing one alters Jaui's flex shrink/wrap resolution and can push
// the title text onto a second line. This mirrors the legacy
// TopBarLeading exactly.
Jwift_ToolbarLeading {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 10pt
  FlexShrink: 0
}

// Trailing wrapper uses an explicit Height (NOT MinHeight) because the
// only child is typically a `<glass-dropdown>` which is Position:Placed
// (out-of-flow). With MinHeight Jaui's flex resolves the cross-axis from
// in-flow content (zero) and the wrapper collapses to 0pt — the Placed
// dropdown's Top:0 then anchors at the toolbar mid-line, dropping the
// trailing group ~24pt below the leading group. Explicit Height locks
// the wrapper to a fixed 48pt regardless of in-flow content.
Jwift_ToolbarTrailing {
  Direction: Row
  Justify: End
  Align: Center
  Gap: 8pt
  Height: 48pt
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

