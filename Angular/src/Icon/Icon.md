# Jwift Icon System

Variable-weight icon font built from SF Symbols, rendered inline via `<icon>`.

---

## Files

```
Icon/
  .gitattributes   — LFS tracking for Icon.Source.otf
  .gitignore       — Excludes generated artifacts (Icon.Font.woff2, Icon.Data.ts)
  Generate.py      — Subsets Icon.Source.otf to manifest icons → woff2 + TS
  Icon.Data.ts     — GENERATED: codepoint map for manifest icons only
  Icon.Demo.ts     — Demo page at /demo/icon
  Icon.Font.css    — @font-face declaration (imported in Styles.scss)
  Icon.Font.woff2  — GENERATED: subset variable web font
  Icon.Manifest    — Which icons to include (one name per line)
  Icon.md          — This file
  Icon.Options.md  — All 8,302 available icon names (reference)
  Icon.Source.otf  — Full variable icon font, all 8,302 icons (LFS tracked)
  Icon.ts          — The <icon> Angular component
```

### Committed vs generated

| File | Git | Notes |
|------|-----|-------|
| Icon.Source.otf | LFS | 22MB master font, rebuilt on Mac when SF Symbols updates |
| Icon.Options.md | Yes | 8,302 names, reference for choosing icons |
| Icon.Manifest | Yes | Your selections, drives the build |
| Icon.Font.woff2 | **No** | Generated, ~700 bytes per icon |
| Icon.Data.ts | **No** | Generated, tiny TS codepoint map |
| Everything else | Yes | Component, CSS, docs, demo |

---

## Usage

```html
<icon Name="house.fill" />
<icon Name="person" />
```

Size and weight via CSS custom properties:

```css
icon {
  --icon-size: 1.5em;
  --icon-weight: 400;
}
icon:hover { --icon-weight: 700; }
```

Weight is fully variable (100–900) and CSS-animatable.

Legacy inputs `Size`, `Color`, `Variant` accepted but deprecated — use CSS.

---

## Adding Icons

1. Find the icon name in `Icon.Options.md` or search:

```bash
python src/Libraries/Jwift/Icon/Generate.py --list house
python src/Libraries/Jwift/Icon/Generate.py --list bag
```

2. Add to `Icon.Manifest`:

```
house.fill
bag.fill
```

3. Rebuild:

```bash
python src/Libraries/Jwift/Icon/Generate.py
```

Requires: `pip install fonttools brotli`

---

## How It Works

1. `Icon.Source.otf` is a variable font (wght 100–900) with all 8,302 SF Symbol icons as standalone glyphs. Built on macOS from Apple's SF Symbols system.

2. `Generate.py` reads `Icon.Manifest`, looks up codepoints from the font's cmap table (glyph names use underscores internally, converted to dots for SF Symbols naming), subsets to only those glyphs, outputs a compact woff2. 10 icons = 6.7 KB.

3. `Icon.ts` renders each icon as a font character via `String.fromCodePoint()`. The browser's font engine handles variable weight interpolation.

---

## Updating the Master Font

`Icon.Source.otf` was built on macOS using the SF Symbols pipeline. The pipeline source and SVG exports are stored in OneDrive (`sf-symbols-pipeline`). This only needs to be re-run when Apple releases new SF Symbols versions.

### Prerequisites (Mac)

- Xcode or Command Line Tools: `xcode-select --install`
- Python 3: `pip3 install fonttools brotli`
- SF Symbols app installed (download from https://developer.apple.com/sf-symbols/)

### Steps

```bash
# 1. Clone or open the pipeline
cd ~/Desktop
# If first time:
git clone <onedrive-path-or-copy> sf-symbols-pipeline
cd sf-symbols-pipeline

# 2. Build the Swift CLI
swiftc batch_export.swift -o batch-export -framework AppKit -framework CoreText

# 3. Export all symbols as SVGs at all weights
mkdir -p output svgs
./batch-export

# This produces:
#   output/JwiftIcons-Variable.otf  — the variable font
#   output/JwiftIcons-Variable.woff2
#   output/codepoint_map.json
#   svgs/  — individual SVGs at each weight (reference only)

# 4. Copy the font to the project
cp output/JwiftIcons-Variable.otf /path/to/ShowStudio.Web/src/Libraries/Jwift/Icon/Icon.Source.otf

# 5. Rebuild the subset on Windows/any platform
cd ShowStudio.Web/
python src/Libraries/Jwift/Icon/Generate.py
```

The `Icon.Options.md` file can also be regenerated — Generate.py reads available icons directly from the font's cmap table.
