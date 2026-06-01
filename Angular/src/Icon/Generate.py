"""
Jwift Icon Font Generator

Subsets Icon.Source.otf (the full variable icon font, LFS tracked) to only
the icons Show Studio asks for in src/Icons/Icon.Manifest. The manifest is
Show Studio's icon shopping list — Jwift owns the source font and the
build script; Show Studio decides which icons it ships and serves them.

Outputs:
  - Show Studio:  public/fonts/JwiftIcons/Icon.Font.woff2
  - Jwift:        Jwift.Angular/src/Icon/Icon.Data.ts (codepoint map)

Usage (from ShowStudio.Web/):
    python Jwift/Jwift.Angular/src/Icon/Generate.py           # build from manifest
    python Jwift/Jwift.Angular/src/Icon/Generate.py --check   # inspect font axes
    python Jwift/Jwift.Angular/src/Icon/Generate.py --list    # list all available icons
    python Jwift/Jwift.Angular/src/Icon/Generate.py --list house  # search icons

Requires: pip install fonttools brotli
"""

import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen

ICON_DIR      = Path(__file__).parent  # ShowStudio.Web/Jwift/Jwift.Angular/src/Icon
SHOWSTUDIO    = (ICON_DIR / ".." / ".." / ".." / "..").resolve()
SOURCE_FONT   = ICON_DIR / "Icon.Source.otf"
DATA_FILE     = ICON_DIR / "Icon.Data.ts"
MANIFEST_FILE = SHOWSTUDIO / "src" / "Icons" / "Icon.Manifest"
FONT_OUT      = SHOWSTUDIO / "public" / "fonts" / "JwiftIcons" / "Icon.Font.woff2"
FONT_FAMILY   = "JwiftIcons"


def load_codepoints(font: TTFont) -> dict[str, int]:
    """Read all icon name → codepoint mappings from the font's cmap table."""
    cmap = font.getBestCmap() or {}
    return {glyph.replace('_', '.'): cp for cp, glyph in cmap.items()}


def check_axes():
    font = TTFont(str(SOURCE_FONT))
    if 'fvar' not in font:
        print("Static font — no variable axes.")
    else:
        print("Variable axes:")
        for a in font['fvar'].axes:
            print(f"  {a.axisTag}: {a.minValue} -> {a.defaultValue} -> {a.maxValue}")
    codepoints = load_codepoints(font)
    print(f"Total icons: {len(codepoints)}")
    font.close()


def read_manifest() -> list[str]:
    if not MANIFEST_FILE.exists():
        print(f"No manifest at {MANIFEST_FILE}")
        sys.exit(1)
    return [
        l.strip().lower()
        for l in MANIFEST_FILE.read_text().splitlines()
        if l.strip() and not l.startswith('#')
    ]


def list_icons(pattern=None):
    font = TTFont(str(SOURCE_FONT))
    codepoints = load_codepoints(font)
    font.close()
    matches = sorted(codepoints.keys())
    if pattern:
        matches = [n for n in matches if pattern.lower() in n.lower()]
    for name in matches[:200]:
        print(f"  {name}")
    total = len(matches)
    if total > 200:
        print(f"  ... ({total - 200} more)")
    print(f"\n{total} icons" + (f" matching '{pattern}'" if pattern else " available"))


def center_glyphs(font: TTFont):
    """Vertically center each glyph's ink within the em-square.

    SF Symbol glyphs paint below the baseline (y=0 to y=-H). Glyphs that
    don't fill the full em-square (e.g. backward.fill = 1144/2048) sit
    at the top of the em-square with empty space below. CSS flex centering
    then shows them off-center.

    Fix: shift each glyph's outline so its ink center sits at y = -UPM/2
    (the em-square center). For CFF2 charstrings, we adjust the initial
    rmoveto y-coordinate by the required delta.
    """
    upm = font['head'].unitsPerEm
    # Target: glyph ink centered ON the baseline (y=0).
    # With metrics ascender=UPM/2, descender=-UPM/2, the baseline IS
    # the em-square center. Centering ink on y=0 means half the glyph
    # paints above the baseline, half below — true optical centering.
    target_center = 0

    glyph_set = font.getGlyphSet()
    cff2 = font['CFF2']
    td = cff2.cff.topDictIndex[0]
    charstrings = td.CharStrings

    # First, decompile all charstrings so we can read programs
    td.decompileAllCharStrings()

    centered = 0
    for glyph_name in list(charstrings.keys()):
        if glyph_name == '.notdef':
            continue

        # Measure ink bounds
        pen = BoundsPen(glyph_set)
        try:
            glyph_set[glyph_name].draw(pen)
        except Exception:
            continue
        bounds = pen.bounds
        if not bounds:
            continue

        _, ymin, _, ymax = bounds
        ink_center = (ymin + ymax) / 2
        dy = round(target_center - ink_center)

        if abs(dy) < 2:
            continue

        # Shift the CFF2 charstring by modifying the initial rmoveto y-coord.
        # CFF2 charstring program: [dx, dy, ..., 'blend'?, 'rmoveto', ...]
        # We need to add dy to the y component of the first moveto.
        cs = charstrings[glyph_name]
        cs.decompile()
        program = list(cs.program)  # copy to ensure clean reassignment

        # Find the first rmoveto and adjust its y operand
        _shift_cff2_program_y(program, dy)

        # Reassign program and clear bytecode to force recompilation
        cs.program = program
        cs.bytecode = None

        centered += 1
        print(f"  centered {glyph_name}: shift {dy:+d} (ink {ymin:.0f}..{ymax:.0f})")

    # Also fix font metrics so ascender/descender are symmetric
    os2 = font['OS/2']
    hhea = font['hhea']
    half = upm // 2
    os2.sTypoAscender = half
    os2.sTypoDescender = -half
    os2.sTypoLineGap = 0
    os2.usWinAscent = upm
    os2.usWinDescent = upm
    hhea.ascent = half
    hhea.descent = -half
    hhea.lineGap = 0

    print(f"  Centered {centered} glyphs, metrics: ascender={half} descender={-half}")


def _shift_cff2_program_y(program: list, dy: int):
    """Shift all y-coordinates in a CFF2 charstring program by dy.

    CFF2 programs use relative coordinates. The first rmoveto sets the pen
    position. All subsequent drawing ops are relative to that. So shifting
    only the initial rmoveto y is sufficient to move the entire glyph.

    For variable fonts with blend operators, the rmoveto args may look like:
      [dx, dy, n_deltas..., n, 'blend', 'rmoveto']
    We need to add dy to the base y value (the second numeric operand).
    """
    # Find the first moveto operator
    for i, op in enumerate(program):
        if op in ('rmoveto', 'vmoveto', 'hmoveto'):
            if op == 'rmoveto':
                # rmoveto consumes dx and dy. Patterns:
                #
                # A) Simple: [dx, dy, 'rmoveto']
                #    → program[i-1] is dy (numeric)
                #
                # B) Blended both: [dx, dy, deltas..., 2, 'blend', 'rmoveto']
                #    → program[i-1] is 'blend' (string)
                #    → base dy is the 2nd numeric from the start of the group
                #
                # C) Mixed: [dx, xdeltas..., 1, 'blend', dy, 'rmoveto']
                #    → program[i-1] is dy (numeric), after a blend
                #

                if i >= 1 and isinstance(program[i - 1], (int, float)):
                    # Pattern A or C: plain y right before rmoveto
                    program[i - 1] = program[i - 1] + dy
                elif i >= 1 and program[i - 1] == 'blend':
                    # Pattern B: blend produces both dx and dy
                    # Find the start of this blend group (skip past 'blend')
                    start = 0
                    for j in range(i - 1, -1, -1):
                        if isinstance(program[j], str) and program[j] != 'blend':
                            start = j + 1
                            break
                    # base values are: program[start] = dx, program[start+1] = dy
                    if start + 1 < i and isinstance(program[start + 1], (int, float)):
                        program[start + 1] = program[start + 1] + dy

            elif op == 'vmoveto':
                # vmoveto consumes dy only.
                # Simple:  [dy, 'vmoveto']
                # Blended: [dy, deltas..., n, 'blend', 'vmoveto']
                # The base dy is always the first numeric in the sequence.
                # Search backward past 'blend' to find the operand group start.
                start = 0
                for j in range(i - 1, -1, -1):
                    if isinstance(program[j], str) and program[j] != 'blend':
                        start = j + 1
                        break
                if start < i and isinstance(program[start], (int, float)):
                    program[start] = program[start] + dy

            elif op == 'hmoveto':
                # No y component — skip
                pass

            break


def build():
    if not SOURCE_FONT.exists():
        print(f"Source font not found: {SOURCE_FONT}")
        print("Run: git lfs pull")
        sys.exit(1)

    font = TTFont(str(SOURCE_FONT))
    codepoints = load_codepoints(font)

    # Variable weight info
    if 'fvar' in font:
        wght = next((a for a in font['fvar'].axes if a.axisTag == 'wght'), None)
        weight_range = f"{int(wght.minValue)} {int(wght.maxValue)}" if wght else "100 900"
        print(f"Variable font — wght: {weight_range}")
    else:
        weight_range = "400"
        print("Static font")

    icon_names = read_manifest()

    # Resolve manifest icons to codepoints
    resolved = {}
    for name in icon_names:
        cp = codepoints.get(name)
        if cp is None:
            print(f"  {name}: NOT FOUND — try --list {name.split('.')[0]}")
            continue
        resolved[name] = cp
        print(f"  {name}  U+{cp:04X}")

    if not resolved:
        print("No icons resolved.")
        font.close()
        return

    # Subset by codepoints
    options = Options()
    options.flavor = 'woff2'
    options.desubroutinize = True
    options.name_IDs = ['*']
    options.layout_features = ['*']
    options.notdef_outline = True

    subsetter = Subsetter(options)
    subsetter.populate(unicodes=list(resolved.values()))
    subsetter.subset(font)

    # Vertically center every glyph's ink within the em-square.
    # Many SF Symbol glyphs are top-aligned (ymax=0) and don't fill
    # the full UPM height, causing them to render off-center in CSS
    # when using line-height: 0 + flex centering.
    center_glyphs(font)

    FONT_OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(str(FONT_OUT))

    size_kb = FONT_OUT.stat().st_size / 1024
    print(f"\nWrote {FONT_OUT} ({size_kb:.1f} KB, {len(resolved)} glyphs)")

    # Icon.Data.ts — codepoint map consumed by Jwift.Angular's <icon> component.
    lines = [f"  '{n}': 0x{cp:04X}," for n, cp in sorted(resolved.items())]
    DATA_FILE.write_text(
        "/**\n"
        " * Jwift icon codepoint map. Generated — do not edit.\n"
        " * Rebuild: python Jwift/Jwift.Angular/src/Icon/Generate.py\n"
        " */\n"
        "export const IconData: Record<string, number> = {\n"
        + "\n".join(lines) + "\n"
        "};\n"
    )
    print(f"Wrote Icon.Data.ts ({len(resolved)} icons)")

    # Note: @font-face is declared in ShowStudio.Web/src/Styles.scss with weight {weight_range}.
    # If you change variable axis range here, update Styles.scss accordingly.

    font.close()
    print("\nDone.")


def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == "--check":
            check_axes()
            return
        if sys.argv[1] == "--list":
            list_icons(sys.argv[2] if len(sys.argv) > 2 else None)
            return

    build()


if __name__ == "__main__":
    main()
