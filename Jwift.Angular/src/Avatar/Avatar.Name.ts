/**
 * THE TWO SHARED DERIVATIONS every avatar in the app runs, and the size scale it may be drawn at.
 *
 * These moved here from `ShowStudio.App/src/Design/Avatar.ts` (SS-1294/SS-1619) when the avatar became a
 * Jwift primitive: the canvas component and the DOM one both need them, and a derivation that exists twice
 * is a derivation that disagrees with itself. The app still imports them — from `Design/Avatar`, which now
 * re-exports these — so no call site changed its import and there is exactly ONE implementation.
 */

// ── The size scale ────────────────────────────────────────────────────────────────────────────────────
//
// An avatar is drawn at one of five NAMED sizes, never a free number. Each rung is a ROLE — a place this
// app actually puts a person's face — and before this every one of them was an uncoordinated number:
// 20, 24, 32, 40, 44, 48, 94 and 96pt, eight numbers for five jobs.
//
//   Byline   24pt  a mark inside a LINE OF TEXT: the publisher under a title, a card's byline.
//                  The item page's own 24pt, which is the app's quality bar, so it wins over the card's 20.
//   Row      40pt  a LIST ROW's leading mark — Apple's own number in Contacts, Mail and Messages, and
//                  already what the settings, followers, linked-account and commerce rows use.
//   Group    48pt  the lead of a row in a GROUPED CMS SURFACE list, which is taller than a Jwift list row
//                  and pairs with the 48pt SQUARE mark a work's cover wears in the same column. Its 48 is
//                  load-bearing for the group's derived corner (a 48pt lead makes the row 80pt).
//   Header   96pt  a HEADER's disc: the account surface's opener, the public profile's ring.
//   Fill      —    100% of a cell the CALLER has already sized — the avatar-only glass sink, which drops
//                  the pill's padding so the face fills the whole 40–48pt of glass.
//
// The glyph and the initials are a FRACTION OF THE DIAMETER, not an inherited font size: 40% for the
// monogram and 55% for the silhouette, which is the proportion Apple's Contacts monogram fills. Two of the
// rungs land exactly on a number the app had already chosen by eye (Byline's 10pt initials are the item
// page's, Header's 38pt are the account header's), which is the check that the fraction is right.
export type AvatarSize = 'Byline' | 'Row' | 'Group' | 'Header' | 'Fill';

/** The diameter of each rung, in points. `Fill` has none — it is 100% of its parent. */
export const AvatarDiameter: Record<Exclude<AvatarSize, 'Fill'>, number> = {
  Byline: 24,
  Row: 40,
  Group: 48,
  Header: 96,
};

/** The monogram is 40% of the diameter and the silhouette 55% — Apple's Contacts proportions. */
export const AvatarInitialsFraction = 0.4;
export const AvatarGlyphFraction = 0.55;

/** The one glyph an avatar falls back to when there is neither a photo nor a name: the filled silhouette,
 *  which is what Contacts, Mail and the App Store's account button all draw for "nobody in particular". */
export const AvatarFallbackGlyph = 'person.fill';

// ── The provider CDN crop ─────────────────────────────────────────────────────────────────────────────
//
// Google's image CDN takes its crop as a trailing OPTION BLOCK on the path — `=s96-c`, and routinely with
// further flags (`=s96-c-k-no`, `=w200-h200-c-rw`). Options REPLACE, they never stack: a URL that already
// carries a block and is handed a second one is an HTTP 400, verified live against lh3.googleusercontent.com.
// Whatever crop the provider cached at sign-in is also too small for a 3x display, so rewrite the block to
// one 256 square. Anything not on Google's CDN is passed through untouched.
const GoogleCropOption = /=[A-Za-z0-9-]+$/;

/** The avatar URL to actually request: the provider's crop rewritten to a sharp square, or the URL as given. */
export function providerAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes('googleusercontent.com')) return url;
  // Only the PATH carries the option block; a query/fragment rides along untouched so a `?sz=` style URL
  // does not get its parameter rewritten into the crop.
  const mark = url.search(/[?#]/);
  const path = mark < 0 ? url : url.slice(0, mark);
  const rest = mark < 0 ? '' : url.slice(mark);
  return `${path.replace(GoogleCropOption, '')}=s256-c${rest}`;
}

/** First + last word's leading letters (e.g. "Jack Carbone" → "JC"; single word → its first letter).
 *
 *  TWO letters when there are two words, everywhere. The app disagreed with itself about this: the item
 *  page's byline took first + last, while the widget card's byline took the FIRST TWO words, so
 *  "Riverside Marching Regiment" read RM on a card and RR under a title. Apple's Contacts takes the given
 *  name and the family name, which is first + last, so that is the one answer. */
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
}
