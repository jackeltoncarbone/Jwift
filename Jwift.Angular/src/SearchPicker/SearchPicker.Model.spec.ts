import { describe, it, expect } from 'vitest';
// The MODEL, not the component: a component that binds signal inputs cannot be rendered under vitest
// (JIT cannot see input(), so setInput throws NG0303), and merely importing SearchPicker.ts drags the
// Angular compiler facade in. The pure seam is where the logic lives, and it is the seam that gets tested.
import { heldPills, pickerGroups, type PickOption } from './SearchPicker.Model';

// A LIST SHOWS WHAT IS HELD, NOT WHAT EXISTS.
//
// The widget this replaces rendered every member of a code registry, on every card. A role card carried
// the entire app-plus-resource capability set; a set with five zone links drew 180 target chips, because
// six worn pieces at six zones each is 36 pairs PER LINK — and a zone link exists precisely to be a small
// selection over that space, so it was at its largest exactly when the data was at its most typical.

const CAPS: PickOption[] = [
  { key: 'drill.read', label: 'Read drills', group: 'drill' },
  { key: 'drill.write', label: 'Write drills', group: 'drill' },
  { key: 'shop.buy', label: 'Buy', group: 'shop' },
  { key: 'picture.render', label: 'Render', group: 'picture' },
];

describe('heldPills', () => {
  it('labels the held keys from the catalog, in the row\'s own order', () => {
    expect(heldPills(['shop.buy', 'drill.read'], CAPS)).toEqual([
      { key: 'shop.buy', label: 'Buy', group: 'shop', retired: false },
      { key: 'drill.read', label: 'Read drills', group: 'drill', retired: false },
    ]);
  });

  it('keeps a held key the catalog no longer declares, and marks it', () => {
    // A stored value that has been retired is still ON the row, still what the row means, and this
    // control is the ONLY way to clear it — so dropping it from the render would make it permanent and
    // invisible at once.
    const pills = heldPills(['drill.export.batch'], CAPS);
    expect(pills).toEqual([
      { key: 'drill.export.batch', label: 'drill.export.batch', group: '', retired: true },
    ]);
  });

  it('renders nothing at all for a row that holds nothing', () => {
    expect(heldPills([], CAPS)).toEqual([]);
  });

  it('accuses nothing while the catalog has not loaded (an empty catalog is not a catalog that knows nothing)', () => {
    expect(heldPills(['drill.read', 'anything.at.all'], []).every((p) => !p.retired)).toBe(true);
  });
});

describe('pickerGroups', () => {
  it('offers only what is not already held', () => {
    const groups = pickerGroups(['drill.read', 'shop.buy'], CAPS, '');
    expect(groups.flatMap((g) => g.options.map((o) => o.key))).toEqual(['drill.write', 'picture.render']);
  });

  it('groups in catalog order, not lexically', () => {
    // Lexical order is what interleaved unrelated keys in the wall this replaces, and a piece's zones
    // belong under that piece in the order the piece declares them.
    expect(pickerGroups([], CAPS, '').map((g) => g.group)).toEqual(['drill', 'shop', 'picture']);
  });

  it('searches the label, the key and the group alike', () => {
    expect(pickerGroups([], CAPS, 'write').flatMap((g) => g.options.map((o) => o.key))).toEqual(['drill.write']);
    expect(pickerGroups([], CAPS, 'shop').flatMap((g) => g.options.map((o) => o.key))).toEqual(['shop.buy']);
    expect(pickerGroups([], CAPS, 'picture.').flatMap((g) => g.options.map((o) => o.key))).toEqual(['picture.render']);
  });

  it('ignores case and surrounding space in the query', () => {
    expect(pickerGroups([], CAPS, '  READ ').flatMap((g) => g.options.map((o) => o.key))).toEqual(['drill.read']);
  });

  it('drops a group entirely once nothing in it is left to add', () => {
    const groups = pickerGroups(['drill.read', 'drill.write'], CAPS, '');
    expect(groups.map((g) => g.group)).toEqual(['shop', 'picture']);
  });

  it('returns nothing when everything is held, so the picker can say so', () => {
    expect(pickerGroups(CAPS.map((c) => c.key), CAPS, '')).toEqual([]);
  });

  it('puts an ungrouped catalog in one unnamed group rather than one group each', () => {
    const flat: PickOption[] = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    expect(pickerGroups([], flat, '')).toEqual([{ group: '', options: flat }]);
  });
});
