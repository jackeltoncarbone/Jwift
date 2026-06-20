// Jwift design-system base sheet. Registered globally at App boot via
// `<jyle [source]="JwiftGlassJss" global />` so any page-scoped sheet
// can extend these classes via `MyThing : JwiftGlass {...}` (or
// JwiftSolidGlass / JwiftNavGroup / JwiftSectionTitle).
//
// LOOK / pattern only — these classes never set Width or Height (those
// belong to the consumer per the concentric-radius rule). Layout-bearing
// classes (NavGroup) DO set Direction/Padding/BorderRadius because
// they're shape-defining patterns, not just visuals.
//
// Calibration matches the Drill page's SectionNavGroup pill — the
// canonical Liquid Glass surface in the app. Same border luminosity,
// same shadow, same backdrop blur, same refraction across every
// floating glass surface in the app.

// ── JwiftGlass ──────────────────────────────────────────────────────
// Universal Liquid-Glass look. Background is transparent so the glass
// refraction shows through; consumers that want a tinted glass can
// override Background after this class.
JwiftGlass {
  Background: rgba(255, 255, 255, 0)

  BorderWidth: 1pt
  BorderBlur: 1pt
  BorderColor: rgba(255, 255, 255, 0.15)
  BorderFilter: Brightness(1.25) Saturate(1.25)
  BorderLayer: 10

  ShadowColor: rgba(0, 0, 0, 0.18)
  ShadowBlur: 22pt
  ShadowOffsetY: 6pt

  BackdropFilter: Contrast(0.65) Blur(5pt) Brightness(1.5) Saturate(1.5) 

  Thickness: 6
  Fillet: 0.25
  BezelWidth: 6
  BezelScale: 0.5
  Refraction: 20

  LightAngle: 135
  LightIntensity: 1
  FresnelStrength: 0.5
  ChromaticAberration: 0.3
  EdgeLightBottom: 0.2
}

// ── JwiftSolidGlass ─────────────────────────────────────────────────
// Opaque content surface — list rows, cards, tiles. Subtle white fill
// + luminous border with NO backdrop blur (it's not an overlay, it's
// content sitting in the scroll flow). Use for things that should
// read as "page content with edge", not "floating glass on top of
// content". Matches the Apple Mail / Notes list-row aesthetic.
JwiftSolidGlass {
  Background: rgba(255, 255, 255, 0.04)
  BorderWidth: 1pt
  BorderColor: rgba(255, 255, 255, 0.08)
  BorderBlur: 0.25pt
  BorderFilter: Brightness(1.05)
}

// ── JwiftGlassOutline ───────────────────────────────────────────────
// A SOLID surface that carries the iOS-26 glass RIM — beveled, fresnel-lit,
// SATURATING the host's own content at the edge — with NO refraction, NO
// backdrop frost, and a SOLID fill. The successor to the old JwiftSolidOutline
// overlay element: instead of a separate top-layer jiv, the rim is THIS node's
// own border, floated over its content via BorderLayer. Works because Jaui
// decouples the glass border from the glass fill — a glass slab (Thickness > 0)
// with Refraction 0 and no backdrop renders a solid fill but still paints its
// glass bevel border. Drop onto any clipped (Overflow: Hidden) card/banner/tile;
// the consumer owns Background / BorderRadius / Width / Height. A jiv is a jiv —
// it can have a glass outline no matter what its fill is.
JwiftGlassOutline {
  // Glass slab geometry — drives the bevel/fresnel RIM only (Refraction 0 = no
  // distortion of the content under the edge; the fill stays solid).
  Thickness: 4
  Fillet: 0.25
  BezelWidth: 11
  BezelScale: 0.5
  Refraction: 0
  ChromaticAberration: 0
  LightAngle: 135
  LightIntensity: 1
  FresnelStrength: 0.55
  EdgeLightBottom: 0.03
  // The lit stroke that rides the bevel, floated ABOVE content so the footer
  // blur / art never eats the frame.
  BorderWidth: 1pt
  BorderBlur: 1pt
  BorderColor: rgba(255, 255, 255, 0.1)
  BorderFilter: Blur(3pt) Brightness(2) Saturate(4)
  BorderLayer: 10
}

// ── JwiftNavGroup ───────────────────────────────────────────────────
// Floating pill-shaped cluster of buttons (the canonical Drill
// section-nav pattern). Wraps glass cells in a JwiftGlass surface so
// they read as a single unit. Inner padding 4pt + Gap 4pt assumes 40pt
// circular cells inside — the standard Jwift_GlassDropdownCell scale —
// concentric with the pill's full-radius outer edge.
JwiftNavGroup : JwiftGlass {
  Direction: Row
  Justify: Start
  Align: Center
  Gap: 4pt
  Padding: 4pt
  BorderRadius: 999pt
  FlexShrink: 0
}

// ── JwiftSectionTitle ───────────────────────────────────────────────
// Section title typography per the Jwift design guide. "Present but
// not shouting." Pair with consumer-set bottom padding for the gap
// between title and section content.
JwiftSectionTitle {
  FontFamily: Inter
  FontSize: 17pt
  FontWeight: 700
  Color: rgba(255, 255, 255, 0.85)
  LetterSpacing: -0.3pt
}

// ── JwiftHeroGlass ──────────────────────────────────────────────────
// Hero / CTA variant of JwiftGlass — heavier shadow + tinted fill so
// the surface reads as the page's primary action button against in-
// flow content. Inherits everything else (border luminosity, backdrop
// blur, refraction, etc.) so it stays in the design-system family —
// just with more visual weight than the standard floating glass.
JwiftHeroGlass : JwiftGlass {
  Background: rgba(255, 255, 255, 0.1)
  ShadowColor: rgba(0, 0, 0, 0.2)
  ShadowBlur: 28pt
  ShadowOffsetY: 8pt
}
