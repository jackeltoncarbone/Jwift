/**
 * `<title-button>`'s own label/chevron classes for `onScene` (`TitleButton.ts`'s own doc comment), pulled
 * out pure — no `@angular/core`, no `jaui-angular` — the same reason `GlassActionBar.Room.ts` and
 * `FirstRunHint.ts` (ShowStudio.App) are: the ONE thing a spec needs to pin, which class joins which base,
 * is testable with no Angular weight at all.
 */

/** `TitleButton`'s own label class for `onScene`: the plain geometry class alone off a scene, or the flat,
 *  opaque `JwiftLabelOnScene` joined in beside it, geometry untouched, the second class's Color/TextFilter
 *  the one that wins (Styling.md: "merged left-to-right... last one wins"). */
export const TitleLabelClass = (onScene: boolean): string =>
  `Jwift_ToolbarTitle${onScene ? ' JwiftLabelOnScene' : ''} Jwift_TitleButtonLabel`;

/** `TitleButton`'s own chevron class for `onScene`, the same reason `TitleLabelClass` is pulled out pure. */
export const TitleChevronClass = (onScene: boolean): string =>
  `Jwift_TitleButtonChevron${onScene ? ' JwiftSecondaryLabelOnScene' : ''}`;
