import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROW = readFileSync(new URL('./SortableRow.ts', import.meta.url), 'utf-8');
const SORTABLE = readFileSync(new URL('./SortableList.jss', import.meta.url), 'utf-8');
const GLASS = readFileSync(new URL('../Glass/Jwift.Glass.jss', import.meta.url), 'utf-8');

/** One class's own declaration, as authored (brace-matched, so a nested `@Transition { ... }` doesn't cut it short). */
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

// Drill Sentences lane AB3, round 27 item 1 (blind phone tester, 08-after-done.png): a selected or just-edited
// line row wore the house gold as a full-strength vibrant fill, a second prominent tinted element competing with
// the drill's one real primary action (checklist 12). Apple's own selected-row figure (Jwift.Glass.jss, THE FILLS:
// "iPad sidebar, selected row ... +16 +17 +17") is the neutral secondary fill level, and its own edit confirmation
// is brief and quiet, not a held paint.
describe('a selected row wears Apple\'s own neutral fill, and an edit flashes gold briefly, not a held paint', () => {
  it('the retired house-gold selection tint is gone: no JwiftSelectionTint class or @JwiftSelectionGold token declared (a comment may still name it for history)', () => {
    expect(GLASS).not.toMatch(/^JwiftSelectionTint\s*\{/m);
    expect(GLASS).not.toMatch(/^@JwiftSelectionGold\b/m);
  });

  it('the selected row extends the neutral secondary-fill class, never a colour', () => {
    expect(SORTABLE).toMatch(/^Jwift_SortableRow_Selected : JwiftSelectedRowFill \{/m);
    const fill = block(GLASS, 'JwiftSelectedRowFill');
    expect(fill).toMatch(/BackdropFilter:\s*Vibrancy\(@JwiftVibrancySecondaryFill\)/);
    expect(fill).not.toMatch(/rgb\(/);
  });

  it('the edit pulse is the house gold at half the retired tint\'s cover, and fades on its own transition', () => {
    expect(SORTABLE).toMatch(/^Jwift_SortableRow_EditPulse : JwiftEditPulse \{/m);
    const pulse = block(GLASS, 'JwiftEditPulse');
    expect(pulse).toMatch(/BackdropFilter:\s*Vibrancy\(rgb\(255, 182, 0\), @JwiftEditPulseGold, @JwiftEditPulseGoldCover\)/);
    expect(pulse).toMatch(/@Transition BackdropFilter \{ Duration: 500ms \}/);
    expect(GLASS).toMatch(/@JwiftEditPulseGoldCover:\s*0\.275 \* @Dark \+ 0\.14 \* @Light/);
  });

  it('SortableRow carries an Edited input, false by default, and wears the pulse class only while true', () => {
    expect(ROW).toContain('readonly Edited = input(false);');
    expect(ROW).toContain("if (this.Edited()) parts.push('Jwift_SortableRow_EditPulse');");
  });

  it('a row edited while selected still gets the pulse: Edited is checked after Selected in the class list', () => {
    const selectedAt = ROW.indexOf("parts.push('Jwift_SortableRow_Selected')");
    const editedAt = ROW.indexOf("parts.push('Jwift_SortableRow_EditPulse')");
    expect(selectedAt).toBeGreaterThan(0);
    expect(editedAt).toBeGreaterThan(selectedAt);
  });
});
