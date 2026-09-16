// THE AVATAR, canvas-native. One disc, one ladder, five sizes.
//
// THE MATERIAL IS NEUTRAL, AND THAT IS THE APPLE ANSWER. Contacts, Mail and Messages all draw a photoless
// person as a monogram on a plain grey disc, and Apple never tints a monogram with an app's accent colour:
// a face is identity, and identity is not a brand. So the plate is @Fill — the app's one control fill, the
// same material a field or a quiet button wears — and the monogram is @Ink on top of it. That is the
// token-correct translation of Apple's "white on grey", which cannot be taken literally: white initials on
// light mode's rgb(229,229,234) plate are illegible, while @Ink is near-white in dark and near-black in
// light and reads at full contrast in both.
//
// WHAT CHANGED, so the disagreements are on the record. The app drew this five ways and they disagreed on
// every axis: the DOM component inked its monogram in the brand gold, the account header used @InkSoft on
// @Fill, the item page's byline used @Ink on @WashStrong, the widget card used white on a 22% white wash,
// and the list row used @InkSoft on @Fill. One of those is Apple's and the rest are not. @Ink on @Fill is
// now the primitive's, everywhere.
//
// THE SILHOUETTE IS QUIETER THAN THE MONOGRAM (@InkSoft, not @Ink), because it means a different thing: a
// monogram is a fact about a person, and the silhouette is the absence of one. Apple's account button in
// the App Store is drawn in the secondary label colour for the same reason.
//
// The corner is 999pt rather than half the box: the engine clamps a radius to 50% of the min dimension, so
// a saturating radius is exact at every rung, where a DERIVED radius (`calc(size / 2)`) is what left the
// old DOM disc 0.08px short of round at its default size. See Design/Avatar.ts's note on the same trap.

// ── The disc ──────────────────────────────────────────────────────────────────────────────────────────
// One base class the five rungs inherit their geometry from. Same-sheet inheritance only: JSS does not
// resolve a class reference across sheets (GlassActionGroup.jss learned that the hard way and had to
// restate its geometry verbatim), so everything the avatar is lives in this one file.
Jwift_Avatar {
  BorderRadius: 999pt
  Overflow: Hidden
  Background: @Fill
  Direction: Row
  Justify: Center
  Align: Center
  FlexShrink: 0
}

// Byline — the mark beside a publisher's name under a title. The item page's own 24pt, which is the app's
// quality bar and therefore wins over the widget card's 20pt.
//
// ITS PLATE IS A TRANSLUCENT WASH, not the opaque @Fill the other rungs wear, and that is not a lapse in
// consistency — it is the one place the CONTEXT differs. A byline lives over MEDIA: the item page's hero
// artwork, a widget card's cover. Both sites had independently reached for a translucent plate for
// exactly that reason (@WashStrong on the item page, rgba(255,255,255,0.22) on the card), and an opaque
// grey disc punched into a picture reads as a chip somebody forgot to style. Every other rung sits on a
// SURFACE, where @Fill is the app's control fill and the right answer.
Jwift_Avatar_Byline : Jwift_Avatar {
  Width: 24pt
  Height: 24pt
  Background: @WashStrong
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
Jwift_Avatar_Fill : Jwift_Avatar {
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
  Background: @Wash
}

Jwift_Avatar_RowEmpty : Jwift_Avatar_Row {
  Background: @Wash
}
Jwift_Avatar_GroupEmpty : Jwift_Avatar_Group {
  Background: @Wash
}
Jwift_Avatar_HeaderEmpty : Jwift_Avatar_Header {
  Background: @Wash
}
Jwift_Avatar_FillEmpty : Jwift_Avatar_Fill {
  Background: @Wash
}
