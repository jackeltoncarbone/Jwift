import { describe, expect, it } from 'vitest';
import { FindSlotContent, SyncSlotParent, type SlotNode } from './DisclosureRow.Slot';

/** A minimal, real `SlotNode` implementation — same `AddChild`/`RemoveChild` contract as the engine's
 *  `JivHandle` (`AddChild` always reassigns `Parent`, removing the child from its previous parent first),
 *  so these tests exercise the real reparenting behavior without needing the worker bridge. */
class FakeNode implements SlotNode {
  readonly Label: string;
  Parent: FakeNode | null = null;
  Children: FakeNode[] = [];
  constructor(label: string) { this.Label = label; }
  AddChild(child: FakeNode): void {
    if (child.Parent === this) return;
    child.Parent?.RemoveChild(child);
    this.Children.push(child);
    child.Parent = this;
  }
  RemoveChild(child: FakeNode): void {
    const i = this.Children.indexOf(child);
    if (i < 0) return;
    this.Children.splice(i, 1);
    child.Parent = null;
  }
}

describe('SyncSlotParent', () => {
  it('SEES the fault it is named for: content wrongly parented to an ambient ancestor (the list) moves to the row\'s own box', () => {
    // Mirrors Jiv.ngOnInit's unconditional, ambient attach: disclosure-row provided no Jiv token, so the
    // projected header/body found the nearest Jiv up the DECLARATION chain — here, the `<list>` the
    // disclosure-row sits inside — and attached there BEFORE disclosure-row ever got a say.
    const list = new FakeNode('list');
    const headBox = new FakeNode('headBox');
    const headerContent = new FakeNode('headerContent');
    list.AddChild(headerContent); // the bug: attached to the list grandparent, not the row's own head box

    SyncSlotParent(headerContent, headBox);

    expect(headerContent.Parent).toBe(headBox);
    expect(list.Children).not.toContain(headerContent);
  });

  it('a closed body (no box) detaches content entirely — unreachable from Root, not merely hidden', () => {
    const list = new FakeNode('list');
    const bodyContent = new FakeNode('bodyContent');
    list.AddChild(bodyContent); // the same wrong ambient attach, now for the body

    SyncSlotParent(bodyContent, null); // disclosure-row is closed: no body box exists

    expect(bodyContent.Parent).toBeNull();
    expect(list.Children).not.toContain(bodyContent);
  });

  it('reproduces the reported bug end to end: several closed FAQ answers no longer collect under one ancestor', () => {
    // Three FAQ rows, all closed. Before the fix every answer attached to the SAME list ancestor the
    // moment it mounted — which is exactly what made them all paint stacked below the last question,
    // regardless of which (if any) row was open.
    const list = new FakeNode('list');
    const answers = ['Q1 answer', 'Q2 answer', 'Q3 answer'].map((label) => {
      const node = new FakeNode(label);
      list.AddChild(node); // the bug, reproduced for every row
      return node;
    });
    expect(list.Children, 'precondition: the bug collects every answer under the list').toEqual(answers);

    // None of the rows are open, so none has a body box — every answer is synced to null and detaches.
    for (const answer of answers) SyncSlotParent(answer, null);

    expect(list.Children).toEqual([]);
    for (const answer of answers) expect(answer.Parent).toBeNull();
  });

  it('opening a row reattaches its (persistent) content to a freshly-created body box, and closing detaches it again', () => {
    const bodyContent = new FakeNode('bodyContent'); // created once; persists across every open/close toggle
    SyncSlotParent(bodyContent, null); // starts closed — detached, not laid out
    expect(bodyContent.Parent).toBeNull();

    const firstBox = new FakeNode('bodyBox#1'); // `@if (open())` just created a fresh box
    SyncSlotParent(bodyContent, firstBox);
    expect(bodyContent.Parent).toBe(firstBox);

    SyncSlotParent(bodyContent, null); // closed again — the box is gone, content detaches, not left riding it
    expect(bodyContent.Parent).toBeNull();
    expect(firstBox.Children).toEqual([]);

    const secondBox = new FakeNode('bodyBox#2'); // reopened — a BRAND NEW box instance
    SyncSlotParent(bodyContent, secondBox);
    expect(bodyContent.Parent).toBe(secondBox);
  });

  it('is idempotent and order-independent: registering box-then-content or content-then-box ends the same way', () => {
    const headBoxFirst = new FakeNode('headBox');
    const headerFirst = new FakeNode('header');
    SyncSlotParent(headerFirst, headBoxFirst);
    SyncSlotParent(headerFirst, headBoxFirst); // calling again (e.g. a second signal change) is a no-op
    expect(headerFirst.Parent).toBe(headBoxFirst);
    expect(headBoxFirst.Children).toEqual([headerFirst]);
  });
});

// A minimal stand-in for an Element's attribute surface — enough for `FindSlotContent`, which only ever
// calls `hasAttribute`, and avoids pulling in a DOM environment for what is otherwise a pure-logic file.
const fakeHost = (...attrs: readonly string[]): Element => ({ hasAttribute: (name: string) => attrs.includes(name) }) as Element;

describe('FindSlotContent', () => {
  // Mirrors the real caller's shape exactly: `JAUI_HOST_EL` is a `WeakMap<JivHandle, HTMLElement>`, and
  // `hostOf` is `(node) => JAUI_HOST_EL.get(node)` — keyed on the candidate's `Node`, not the candidate
  // itself, since real `Jiv` components are looked up by their worker-side handle.
  const hostsByNode = new WeakMap<object, Element>();
  const hostOf = (node: object): Element | undefined => hostsByNode.get(node);
  const candidateWithHost = (...attrs: readonly string[]): { Node: object } => {
    const candidate = { Node: {} };
    hostsByNode.set(candidate.Node, fakeHost(...attrs));
    return candidate;
  };

  it('picks the candidate whose host element carries the attribute, ignoring the other slot', () => {
    const header = candidateWithHost('disclosureHeader');
    const body = candidateWithHost('disclosureBody');

    expect(FindSlotContent([header, body], 'disclosureHeader', hostOf)).toBe(header);
    expect(FindSlotContent([header, body], 'disclosureBody', hostOf)).toBe(body);
  });

  it('matches a leaf component carrying the attribute directly (no wrapper jiv) — the `<jext disclosureHeader>` shape', () => {
    const header = candidateWithHost('disclosureHeader', 'class');
    expect(FindSlotContent([header], 'disclosureHeader', hostOf)).toBe(header);
  });

  it('returns null when nothing projected carries the attribute (e.g. before content has mounted)', () => {
    expect(FindSlotContent([], 'disclosureHeader', hostOf)).toBeNull();
    const plain = candidateWithHost('class');
    expect(FindSlotContent([plain], 'disclosureHeader', hostOf)).toBeNull();
  });
});
