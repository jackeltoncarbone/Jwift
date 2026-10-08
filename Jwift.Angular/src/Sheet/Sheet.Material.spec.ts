import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const COMPONENT = readFileSync(new URL('./Sheet.ts', import.meta.url), 'utf-8');
const SHEET = readFileSync(new URL('./Sheet.jss', import.meta.url), 'utf-8');

/** One class's own declaration, as authored (brace-matched, so a nested `@Spring { ... }` doesn't cut it short). */
function block(source: string, name: string): string {
  const at = source.search(new RegExp('^' + name + '\\s*(?::[^{]*)?\\{', 'm'));
  expect(at, name + ' must be declared').toBeGreaterThanOrEqual(0);
  let depth = 0;
  let end = at;
  for (let i = source.indexOf('{', at); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) { end = i; break; }
  }
  return source.slice(source.indexOf('{', at) + 1, end);
}

// GLASS AT EVERY HEIGHT (Jack's departure, 2026-09-28): Apple's own sheet turns opaque above half height
// (Sheets.md section 2), but the app's own rule is that glass tints black in dark, white in light, and never
// turns gray — an opaque `@Sheet` is exactly that gray plate. So the sheet's card stays Liquid Glass at every
// height, and a translucent white/black face (`Jwift_SheetFace`) carries the "gradually becoming opaque" read
// instead, over glass that stays glass.
describe('the large detent is Glass, with a white/black face and no @Sheet fill', () => {
  it('the compact and form-sheet glass classes never paint the opaque @Sheet background', () => {
    expect(block(SHEET, 'Jwift_SheetGlass')).not.toMatch(/@Sheet\b/);
    expect(block(SHEET, 'Jwift_SheetGlass_Form')).not.toMatch(/@Sheet\b/);
  });

  it('@Sheet stays only on the one surface that is deliberately not glass: the inspector column', () => {
    const paints = [...SHEET.matchAll(/Background:\s*@Sheet\b/g)];
    expect(paints.length).toBe(1);
    expect(block(SHEET, 'Jwift_SheetOpaque')).toMatch(/Background: @Sheet/);
  });

  it('the face is a plain literal veil (never a colour token), fully transparent at rest', () => {
    const face = block(SHEET, 'Jwift_SheetFace');
    expect(face).toMatch(/Background: rgba\(255, 255, 255, 0\)/);
    expect(face).not.toMatch(/@Sheet\b|@GroupedCell\b|@Panel\b/);
    expect(face).toMatch(/PointerEvents: None/);
  });

  it("Material reports 'Glass' at every sheet height, and 'Elevated' only for the inspector column", () => {
    expect(COMPONENT).toContain("computed<JwiftMaterial>(() => (this.Inspector() ? 'Elevated' : 'Glass'));");
  });

  it('the card at the large detent falls back to Jwift_SheetGlass, never Jwift_SheetOpaque', () => {
    expect(COMPONENT).toContain('return `${shape} Jwift_SheetGlass${motion}`;');
    // Jwift_SheetOpaque still names the inspector column's own card class -- the ONE surface left opaque.
    const opaqueUses = [...COMPONENT.matchAll(/Jwift_SheetOpaque/g)];
    expect(opaqueUses.length).toBe(1);
  });

  it('the card carries a face overlay, driven by the live percent full height', () => {
    expect(COMPONENT).toContain('[class]="FaceClass()" [jivStyle]="FaceStyle()"');
    expect(COMPONENT).toContain('const a = SheetFaceAlpha(this._percentFull());');
  });

  it('the card is the one panel glass every panel and menu wears, stating none of its optics (lane WW1, item 1)', () => {
    expect(SHEET).toMatch(/^Jwift_SheetGlass : JwiftPanelGlass \{/m);
    expect(SHEET).toMatch(/^Jwift_SheetGlass_Form : JwiftPanelGlass \{/m);
    for (const cls of ['Jwift_SheetGlass', 'Jwift_SheetGlass_Form']) {
      expect(block(SHEET, cls)).not.toMatch(/^\s*(Background|GlassBlur|GlassFrost):/m);
    }
  });
});
