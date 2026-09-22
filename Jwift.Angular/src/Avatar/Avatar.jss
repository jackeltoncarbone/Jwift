// THE AVATAR, canvas-native. One disc, one ladder, five sizes.
//
// THE MATERIAL IS NEUTRAL, AND THAT IS THE APPLE ANSWER. Contacts, Mail and Messages all draw a photoless
// person as a monogram on a plain grey disc, and Apple never tints a monogram with an app's accent colour:
// a face is identity, and identity is not a brand. So the plate carries no colour of its own: it is the
// control glass, which "has no inherent color, and instead takes on colors from the content directly behind
// it", and the monogram is @Ink on top of it. @Ink rather than Apple's literal "white on grey" because
// white initials are illegible over light content, while @Ink is near-white in dark and near-black in light.
//
// WHAT CHANGED, so the disagreements are on the record. The app drew this five ways and they disagreed on
// every axis: the DOM component inked its monogram in the brand gold, the account header used @InkSoft on
// @Fill, the item page's byline used @Ink on @WashStrong, the widget card used white on a 22% white wash,
// and the list row used @InkSoft on @Fill. @Ink on the neutral plate is now the primitive's, everywhere.
//
// THE SILHOUETTE IS QUIETER THAN THE MONOGRAM (@InkSoft, not @Ink), because it means a different thing: a
// monogram is a fact about a person, and the silhouette is the absence of one. Apple's account button in
// the App Store is drawn in the secondary label colour for the same reason.
//
// The corner is 999pt rather than half the box: the engine clamps a radius to 50% of the min dimension, so
// a saturating radius is exact at every rung, where a DERIVED radius (`calc(size / 2)`) is what left the
// old DOM disc 0.08px short of round at its default size. See Design/Avatar.ts's note on the same trap.

// ── The disc ──────────────────────────────────────────────────────────────────────────────────────────
// The geometry every rung shares, with no material. Same-sheet inheritance only: a `: Base` is flattened
// when THIS sheet is parsed, against this sheet and the globals tier, so everything the avatar is lives in
// this one file and no other sheet can reach into a rung.
Jwift_AvatarDisc {
  BorderRadius: 999pt
  Overflow: Hidden
  Direction: Row
  Justify: Center
  Align: Center
  FlexShrink: 0
}

// ITS RIM ADDS WHAT IT RIDES, and it hand-rolls nothing. A 48pt disc shows its whole ring at once, so the
// house rim's light-following modulation (width 0.5x-1.5x, brightness 0.25x-1) reads as a gradient rather
// than a highlight -- Jack: "the color is really weird and gradient-y. Solid color, so it should be pretty
// solid and consistent." A rim that ADDS is solid and consistent by construction: `out = in + k` keeps hue
// and chroma exactly and moves only luma, so the ring is the disc's own color at a higher value, all the
// way round, and there is no longer a hued target for the light angle to swing it toward. The amount, the
// clipping bound and the measurement behind them live on JwiftGlassAdditiveRim in Jwift.Glass.jss, because
// the rim grade has exactly one owner and this class is not it.
//
// The rim still shows through a photo: the border draws at BorderLayer 10, above the content, so the
// bezel survives `Overflow: Hidden` clipping the image to the disc. Jack on that: "the border has a
// layer just like anything else -- if it's over the contents children, it uses that."
Jwift_Avatar : JwiftGlassAdditiveRim, Jwift_AvatarDisc {
}

// Byline — the mark beside a publisher's name under a title. The item page's own 24pt, which is the app's
// quality bar and therefore wins over the widget card's 20pt. It lives over MEDIA (the item page's hero
// artwork, a widget card's cover), which is exactly where Apple says glass belongs: a control floating
// over media-rich content, taking its colour from what is behind it.
Jwift_Avatar_Byline : Jwift_Avatar {
  Width: 24pt
  Height: 24pt
}

// Row — the mark that leads a list row, and a chrome control's face. 40pt is Apple's own list-row avatar
// (Contacts, Mail, Messages) and it is already what the settings, followers and linked-account rows use.
Jwift_Avatar_Row : Jwift_Avatar {
  Width: 40pt
  Height: 40pt
}

// Group — the lead of a row in a GROUPED CMS surface list, which is a taller row than a Jwift list row and
// pairs with the 48pt square mark a work's cover wears in the same column. Its 48 is load-bearing: a 48pt
// lead makes the row 80pt and the group's derived corner is half of that, so shrinking it here would
// silently reshape every grouped list on the Profile surface, which is not the avatar's business.
Jwift_Avatar_Group : Jwift_Avatar {
  Width: 48pt
  Height: 48pt
}

// Header — the account surface's opener, the App Store account sheet's big circle.
Jwift_Avatar_Header : Jwift_Avatar {
  Width: 96pt
  Height: 96pt
}

// Fill — 100% of a cell the CALLER has already sized. The glass account sink is the case: a pill holding
// only the avatar drops its padding so the face fills the whole glass, and the cell is 40pt or 48pt
// depending on whether anything else is inline with it. Its type is sized for that 40–48pt range.
//
// SO FILL IS THE ONE RUNG WITH NO GLASS OF ITS OWN. Its cell is already glass (the sink pill composes
// JwiftPressGlass), and a second glass disc exactly covering the first is glass on glass, which Apple says
// to "always avoid": things on glass use "fills, transparency, and vibrancy" and the material goes on "the
// control itself, not its inner views". The pill is the plate. What sits on it is transparent, the pill's
// own saturate and contrast are the vibrancy, and the @Ink monogram or photo is the only thing drawn.
Jwift_Avatar_Fill : Jwift_AvatarDisc {
  Width: 100%
  Height: 100%
}

// ── The photo ─────────────────────────────────────────────────────────────────────────────────────────
// Fills the disc exactly, so the circle clip IS the photo's edge and no plate shows as a ring around a
// smaller picture. A PLAIN 100% child, not `Position: Placed`: the ladder renders exactly one rung at a
// time, so there is nothing to stack over, and Placed anchors against the nearest Placed ANCESTOR — which
// on a disc that does not declare Placed itself is some container further up the page, and a photo that
// escapes its own circle is a worse failure than the one this is replacing. Every disc in the app that
// worked (PersonPhoto, Set_Photo, Cm_Photo, RowMarkPhoto) was a plain 100% child; this is that.
Jwift_AvatarPhoto {
  Width: 100%
  Height: 100%
}

// ── The monogram: 40% of the diameter at every rung ───────────────────────────────────────────────────
// Sized off the DISC and never off an inherited page font. Two of these land exactly on a number the app
// had already chosen by eye — Byline's 10pt is the item page's, Header's 38pt is the account header's —
// which is the evidence that 40% is the right fraction rather than a guess.
Jwift_AvatarInitials {
  FontFamily: Inter
  FontWeight: 700
  LetterSpacing: 0.2pt
  Color: @Ink
  TextAlign: Center
}
Jwift_AvatarInitials_Byline : Jwift_AvatarInitials {
  FontSize: 10pt
}
Jwift_AvatarInitials_Row : Jwift_AvatarInitials {
  FontSize: 16pt
}
Jwift_AvatarInitials_Group : Jwift_AvatarInitials {
  FontSize: 19pt
}
Jwift_AvatarInitials_Header : Jwift_AvatarInitials {
  FontSize: 38pt
  LetterSpacing: 0.4pt
}
Jwift_AvatarInitials_Fill : Jwift_AvatarInitials {
  FontSize: 17pt
}

// ── The silhouette: 55% of the diameter ───────────────────────────────────────────────────────────────
Jwift_AvatarGlyph {
  FontFamily: JwiftIcons
  FontWeight: 400
  Color: @InkSoft
  TextAlign: Center
}
Jwift_AvatarGlyph_Byline : Jwift_AvatarGlyph {
  FontSize: 13pt
}
Jwift_AvatarGlyph_Row : Jwift_AvatarGlyph {
  FontSize: 22pt
}
Jwift_AvatarGlyph_Group : Jwift_AvatarGlyph {
  FontSize: 26pt
}
Jwift_AvatarGlyph_Header : Jwift_AvatarGlyph {
  FontSize: 53pt
}
Jwift_AvatarGlyph_Fill : Jwift_AvatarGlyph {
  FontSize: 24pt
}

// ── The empty disc ────────────────────────────────────────────────────────────────────────────────────
// A disc with nobody in it at all — the signed-out account header — is quieter than one with a person in
// it: the same circle, emptier, because there is no one there yet. The account surface had this already
// and it is right; it becomes the primitive's `Empty` flag rather than a second class in a page's sheet.
Jwift_Avatar_BylineEmpty : Jwift_Avatar_Byline {
  Tint: 0.28 * @Dark + 0.32 * @Light
}

Jwift_Avatar_RowEmpty : Jwift_Avatar_Row {
  Tint: 0.28 * @Dark + 0.32 * @Light
}
Jwift_Avatar_GroupEmpty : Jwift_Avatar_Group {
  Tint: 0.28 * @Dark + 0.32 * @Light
}
Jwift_Avatar_HeaderEmpty : Jwift_Avatar_Header {
  Tint: 0.28 * @Dark + 0.32 * @Light
}
// Fill has no glass to tint (see Fill above), so its empty plate is the pill's own and the class only has
// to exist for the component to resolve.
Jwift_Avatar_FillEmpty : Jwift_Avatar_Fill {
}
