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
  BorderBlur: 0.25pt
  BorderBrightness: 1.25
  BorderSaturation: 1.5
  BorderColor: rgba(255, 255, 255, 0.15)

  ShadowColor: rgba(0, 0, 0, 0.18)
  ShadowBlur: 22pt
  ShadowOffsetY: 6pt

  BackdropFrostBlur: 8pt
  BackdropBrightness: 1.25
  BackdropSaturation: 1.25
  BackdropContrast: 0.75

  Thickness: 2
  Fillet: 0.25
  BezelWidth: 11
  BezelScale: 0.5
  Refraction: 20

  LightAngle: 135
  LightIntensity: 1
  FresnelStrength: 0.55
  ChromaticAberration: 0.3
  EdgeLightBottom: 0.03
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
  BorderBrightness: 1.05
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
