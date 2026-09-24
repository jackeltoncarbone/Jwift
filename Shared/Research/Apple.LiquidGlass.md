# Show Studio against Apple's Liquid Glass

Show Studio's readings of Apple's published guidance, and the calls Jack made on top of it. Apple's own words, sizes and values are not repeated here; they live in `Jwift/Apple/`:

- `Jwift/Apple/HIG.md`: the HIG and WWDC25 sessions (material, shapes, buttons, menus, toolbars, tab bars, sidebars, sheets, alerts, lists, scroll edges, search, typography, color, icons).
- `Jwift/Apple/LiquidGlass.md`: how the material is built, from the decompile.
- `Jwift/Apple/Sizing.md`: control sizes, from the decompile and native captures.

The one rule (`ShowStudio.Documentation/Design/AppleConformance.md`): match Apple 1:1 at the same device size.

## Destructive actions, and the one place red is a fill

Apple never states this as one rule; it is what four HIG pages imply together (the quotes are `HIG.md` sections 4, 5 and 10).

- **In a list, a menu, a toolbar or an action sheet, a destructive action is a red LABEL on the ordinary control.** HIG Buttons lists the roles as alternatives ("destructive (system red; never primary)"), so a destructive action cannot be the accent-tinted plate. HIG Menus puts destructive items last and red, and a menu row has no plate. HIG Action sheets puts destructive choices at the top, again as a row of red text. The plate stays plain or glass; the ink carries the meaning.
- **The one place a destructive action is a FILLED red button is the confirming action of the ask it raised.** The red menu row is "confirmed by an action sheet", and inside that sheet or alert the confirm is the default, filled button (HIG Alerts). The filled red exists exactly once per ask, at the end of a two-step.
- **They are two moments, not a style choice.** Red ink says "this is the destructive option among several"; a red plate says "this is the press that does it".
- **"Never primary" and "a filled red confirm" do not contradict.** `primary` is the accent-tinted plate, the recommended path; the filled red is the system's destructive color as a plate, drawn only where the surface exists to take that one press.

**What Apple does not publish**: the contrast of the ink on the filled red plate. macOS draws its destructive default as white on system red, and iOS's `.borderedProminent` with `role: .destructive` does the same, which computes at about 3.4:1 in dark mode, below WCAG AA. Show Studio keeps Apple's shape and derives the two inks per theme so both clear AA: `ShowStudio.App/src/Ui/Theme.Tokens.ts` (`DangerProminent` / `OnDangerProminent`). The role is enforced by `ShowStudio.App/src/Design/DangerRole.Conformance.spec.ts` and the one-prominent-action count by `Design/PrimaryAction.Conformance.spec.ts`.

## One ink inside a menu; red where you confirm (Jack, 2026-09-17)

Jack: "if delete a pic is in a drop down keep it the same color otherwise it stands out. if delete this section is a modal/dialog then it can stay in that one."

A menu row wears the house ink whatever it does, and the red arrives in the confirm that follows. That keeps Apple's pairing (red coupled to a confirmation) while not shouting at someone still reading the list. `Destructive` keeps both jobs: it orders the row last, and it raises the confirm on the danger plate (`JwiftDangerProminent` / `JwiftDangerInk`).

A reversible row does not claim the flag at all: signing out is reversible, Apple never reds it, and both Sign Out rows are off the flag. Held by two halves, deliberately: `ShowStudio.App/src/Design/MenuInk.Conformance.spec.ts` keeps menu rows uniform and the confirm plate red, and `Authentication/AccountMenu.spec.ts` keeps every account row off the flag. Either half alone invites the wrong fix. Sign out is still ordered last.

## Scroll edge effects: the choosing rule

Apple's sentences (`HIG.md` section 12) imply three things none of them states, and each was read the other way in this repo once.

1. **Soft has no plateau.** Soft "gently dissolves"; it is HARD that is "applied uniformly across the height of the toolbar and the pinned accessory view". A soft edge ramps across its whole strip, so the strip has to be longer than the bar it protects, or the dissolve hands the content back sharp on the line the effect exists to hide.
2. **The dimming is part of soft, not a third form.** A bar over live imagery still gets one soft edge; it grades rather than only blurring. It is not a license for a per-page brightness.
3. **"One per view" is one per EDGE of one view.** A page with a floating top bar and a floating bottom dock takes an edge at each; stacking is two effects on one edge.

Held by `ShowStudio.App/src/Design/ScrollEdge.Conformance.spec.ts`. The top strip is derived from the bar in `Glass/Jwift.Glass.jss` (`JwiftScrollEdgeTop`, and `JwiftScrollEdgeTopScene` for the dimming form) rather than picked per page.

## Section headers: title style is a case, not a size

Apple: section headers are "title-style, no longer all capitals" (`HIG.md` section 11). That governs CASE. The settings family had set its group headers in capitals at 13pt / 700 with +0.6pt tracking, the iOS 12 caption; apple.com tracks negative at every rung of 17 px and below (`Jwift/Apple/Web.md` RULE T3). The family's headers and `ShowStudio.App/src/Design/SectionHeaderCase.Conformance.spec.ts` are recorded in `ShowStudio.Documentation/Design/HIG/Accounts.md`; the Apple row and section sizes to match are `Jwift/Apple/Apps.md` section 6.1.

`Jwift.Angular/src/List/List.jss` still declares `Jwift_ListSectionHeader` as "the small uppercase caption above a section", the shape Apple retired; the settings family does not use it. The replacement is the title-style rung.

## Identity in the sidebar (Jack, 2026-09-22)

Apple's native sidebars open on a control row, never identity; Apple's web apps lead the sidebar with the wordmark (`Jwift/Apple/Apps.md` section 3). Settled: the HOME surface's header carries the lifted wordmark where every other surface carries its own name; the sidebar starts at Home with no wordmark. The header is the Arcade case (`Apps.md` section 1.2): the tab is the brand, and Home is our front door. Identity appears exactly once, and the hero carries no mark.

## Tab bar color (Jack, 2026-09-14)

Apple: "Prefer a monochromatic appearance for tab bars" over bright, colorful content (`HIG.md` section 7). The accent is gold and the field video is full of gold, which is the case Apple warns about; the accent was kept as the brand color by Jack's call. Open, product.

## Icons

Show Studio ships Framework7 glyphs under Apple's standard action names (`HIG.md` section 16); SF Symbols are reference only.
