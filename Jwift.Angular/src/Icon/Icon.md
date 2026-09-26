# Jwift Icon System

A variable weight icon font built from open source icon packs, drawn by `<icon>` on the Jaui canvas.
Call sites use SF style names (`house.fill`, `chevron.right`) as a vocabulary; every glyph behind a
name comes from a permissively licensed pack. SF Symbols are never shipped and never a source.

---

## Files

```
Icon/
  Generate.Icons.node.mjs  Builds the font and Icon.Data.ts from the app's manifest (pure Node)
  Icon.Names.json          The vocabulary: name -> pack + glyph (APPEND ONLY, order sets codepoints)
  Icon.Data.ts             GENERATED: name -> codepoint for the manifest's icons
  Icon.ts                  The <icon> component
  Icon.jss                 Default icon style
  NOTICE                   Packs used and their licenses
  Source/MaterialSymbolsRounded/  The Material Symbols glyphs we use, with the Apache-2.0 LICENSE
```

The app owns `src/Icons/Icon.Manifest` (which names ship) and the output
`public/fonts/JwiftIcons/Icon.Font.woff2` plus `NOTICE.txt` beside it.

## Packs

| Pack | License | Where |
|------|---------|-------|
| Framework7 Icons | MIT | `framework7-icons` npm package (`svg/`) |
| Material Symbols Rounded, weight 400 | Apache-2.0 | `Source/MaterialSymbolsRounded/` (copied from `@material-symbols/svg-400`) |

Framework7 comes first: it follows SF naming for most symbols and matches their look. Material
Symbols Rounded fills the gaps Framework7 lacks. A pack is added only by listing it with its license
in `PACKS` in the generator; the build refuses anything else.

---

## Usage

```html
<icon Name="house.fill" />
<icon class="RowChevron" Name="chevron.right" />
```

Size, weight and color come from the JSS class (`FontSize`, `FontWeight`, `Color`). Weight is fully
variable from 100 to 900.

## Adding an icon

1. Find the glyph: Framework7 first (`node_modules/framework7-icons/svg`, names use `_`), else a
   Material Symbols Rounded weight 400 SVG copied into `Source/MaterialSymbolsRounded/`.
2. Append the name to the END of `Icon.Names.json`:
   `"cart.fill": { "Pack": "Framework7", "Glyph": "cart_fill" }`.
   Options: `"Rotate": -90` (degrees, counterclockwise positive) and
   `"Ring": { "Pack": "Framework7", "Glyph": "circle", "Scale": 0.5 }` for a `.circle` symbol.
3. Add the name to the app's `src/Icons/Icon.Manifest` and run `npm run generate:icons` in the app.

A manifest name missing from `Icon.Names.json` fails the build.

```bash
node ../ShowStudio.Libraries/Jwift/Jwift.Angular/src/Icon/Generate.Icons.node.mjs --list chevron
node ../ShowStudio.Libraries/Jwift/Jwift.Angular/src/Icon/Generate.Icons.node.mjs --check
```

---

## How it works

1. Each glyph's SVG path is parsed (M L H V C S Q T Z, `translate` transforms), flipped to y-up, and
   rewound when the source is even-odd, so rings stay rings under the font's nonzero fill.
2. The ink is scaled so its longer side is one em, centered on the baseline (ascender and descender
   are half an em each), and set with lsb 0 and advance equal to the ink width. `<icon>` centers the
   glyph with this, so nothing sits high or low.
3. Cubics become quadratics within half a font unit, and the glyphs are written as TrueType.
4. Weight is a `wght` axis (`gvar`): each master offsets the outline along its corner bisectors and is
   scaled back to one em, so strokes thicken without the symbol growing. Counters close by at most a
   fifth of their width; knocked-out strokes in `.fill` symbols widen like ink.
5. The font is compressed to woff2, then re-read and verified: only U+E000 to U+F8FF are mapped
   (never the SF private use planes at U+100000 and up), and the license notice is in the name table.
   `Icon.Conformance.spec.ts` in the app checks the committed font the same way.
