// HOUSE. Promoted from Admin.jss's `Adm_Ring`/`Adm_RingMark` pair. The ring is 22pt drawn inside a 44pt
// target: Apple's mark at Apple's size, on the house tap floor. Empty is an outline (the ABSENCE of a
// mark, a hairline circle); the moment it means something it becomes a fill — state is a tone via a fill,
// never an outline, everywhere else in the app, and this is the one case an outline is correct because
// nothing has been decided yet.
//
// DRAWN, NOT AN ICON: `circle` is not in the generated icon font (see Admin.jss's own note where this was
// first solved), so a 22pt node with a full radius IS the circle; a hairline border is the empty state,
// the checkmark glyph (which the font does carry) is the filled one.
Jwift_SelectMarkHit {
  Interactive: true
  Cursor: Pointer
  UserSelect: None
  Direction: Row
  Justify: Center
  Align: Center
  Width: 44pt
  Height: 44pt
  MinHeight: 44pt
  BorderRadius: 999pt
  Background: rgba(255, 255, 255, 0)
  FlexShrink: 0
}

Jwift_SelectMark {
  Direction: Row
  Justify: Center
  Align: Center
  Width: 22pt
  Height: 22pt
  BorderRadius: 999pt
  BorderColor: @InkFaint
  BorderWidth: 1.5
}
// The fill is @Ink over @Ground, the app's neutral inversion — deliberately not @Prominent (which means
// "the one action that is the point of the screen") and not a hue (which would fight the per-item accents
// the app derives from artwork). A selection mark is small enough that its fill IS its colour.
Jwift_SelectMark_On : Jwift_SelectMark {
  Background: @Ink
  BorderColor: @Ink
}

Jwift_SelectMarkGlyph {
  FontFamily: JwiftIcons
  FontSize: 12pt
  FontWeight: 700
  Color: @Ground
  TextAlign: Center
}
