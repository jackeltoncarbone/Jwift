import { ChangeDetectionStrategy, Component, booleanAttribute, computed, effect, input, output, contentChildren, viewChild } from '@angular/core';
import { Jiv, JAUI_HOST_EL, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { FindSlotContent, SyncSlotParent } from './DisclosureRow.Slot';
import DisclosureRowJss from './DisclosureRow.jss';

/**
 * `<disclosure-row>` — a list row that expands its own content underneath it. HOUSE geometry (the 44pt
 * row floor every list control shares).
 *
 *   <disclosure-row [open]="IsOpen(row.Id)" (openChange)="Toggle(row.Id)">
 *     <jext disclosureHeader class="FaqQuestionText" [text]="row.Question" />
 *     <prose-block disclosureBody [markdown]="Answer(row.Id)" />
 *   </disclosure-row>
 *
 * CONVENTION: `disclosureHeader` / `disclosureBody` go on a `Jiv`-family element (`<jiv>` or `<jext>`, or
 * anything that extends/provides one) — never on a plain Angular wrapper component with no Jiv of its own
 * (`<prose-block>`), which this component cannot find a canvas node for. Wrap it: `<jiv disclosureBody>
 * <prose-block .../></jiv>`.
 *
 * SS-Support-FAQ-2: this component used to declare no `Jiv` token at all, so Angular resolved the
 * projected header/body's canvas PARENT against wherever `<disclosure-row>` was DECLARED (the consumer's
 * `<list>`, say) rather than against this component's own head/body boxes — see `DisclosureRow.Slot.ts`
 * for the full root-cause writeup. A single provided `Jiv` (the pattern every other Jwift component with
 * ONE content slot uses — Sheet, Card, List, Toolbar...) cannot fix it here: disclosure-row has TWO slots,
 * and one element's DI only ever hands out one answer for `Jiv`. Instead this component matches its own
 * projected content directly (`FindSlotContent`) and explicitly (re)parents it (`SyncSlotParent`) to its
 * head box (always) or its body box (only while `open()` — `@if` tears the box down on close, and the
 * effect below detaches the content rather than leaving it to ride the box's fade or linger as a sibling
 * of other rows'). The head/body boxes are read with `viewChild`, so a closed body's box reads `undefined`
 * reactively — no extra registration directive needed.
 */
@Component({
  selector: 'disclosure-row',
  standalone: true,
  imports: [Jiv, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_DisclosureRow">
      <jiv #headBox class="Jwift_DisclosureHead" (click)="openChange.emit(!open())">
        <ng-content select="[disclosureHeader]"></ng-content>
        <jiv class="Jwift_DisclosureChevronBox" [jivStyle]="_ChevronStyle()">
          <icon class="Jwift_DisclosureChevron" Name="chevron.down" />
        </jiv>
      </jiv>
      @if (open()) {
        <jiv #bodyBox class="Jwift_DisclosureBody">
          <ng-content select="[disclosureBody]"></ng-content>
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class DisclosureRow {
  protected readonly Jss = DisclosureRowJss;

  readonly open = input(false, { transform: booleanAttribute });
  readonly openChange = output<boolean>();

  // Chevron rotates in place rather than swapping glyphs — iOS-style, trailing the title. `rotate(N)` is
  // JSS's in-plane (Z-axis) transform (Transform.Parse.ts), authored UNITLESS — Length has no `deg` unit,
  // so `rotate(180deg)` throws inside the worker's style resolve (SS-Support-FAQ-2: that throw is why the
  // chevron box never got a StyleAnimator and rendered at the Presence-seeded Opacity of 0 — invisible on
  // every row, open or closed). It is RotateX/RotateY (pitch/yaw, 3D, needing an ancestor Perspective) that
  // remains the unverified transform path elsewhere in Jaui (Popover.jss), not this in-plane one.
  protected readonly _ChevronStyle = computed(() => ({ Transform: `rotate(${this.open() ? 180 : 0})` }));

  // The row's own internal boxes. `#bodyBox` reads `undefined` reactively whenever `@if (open())` is
  // false — no registration directive needed to know when the body has (or lacks) a box to parent into.
  private readonly _headBox = viewChild<Jiv>('headBox');
  private readonly _bodyBox = viewChild<Jiv>('bodyBox');

  // Every directly-projected Jiv (`descendants: false` — only the slot's own top-level element, never
  // content nested further inside it, e.g. the FAQ question's individual word `<jext>`s). Angular content
  // queries match a TYPE, not a raw attribute selector, so which slot each one is is read back off its
  // host element (`FindSlotContent`) — the same attribute `<ng-content select>` already requires.
  private readonly _slotContent = contentChildren(Jiv, { descendants: false });
  private readonly _headerContent = computed(() =>
    FindSlotContent(this._slotContent(), 'disclosureHeader', (node) => JAUI_HOST_EL.get(node)));
  private readonly _bodyContent = computed(() =>
    FindSlotContent(this._slotContent(), 'disclosureBody', (node) => JAUI_HOST_EL.get(node)));

  constructor() {
    // The header always has a box (it is never conditionally rendered): once both are known, parent the
    // content in and keep it the trailing-chevron's leading sibling (AddChild appends; the chevron box,
    // authored after `<ng-content>` but NOT projected, likely attached first).
    effect(() => {
      const box = this._headBox();
      const content = this._headerContent();
      if (!box || !content) return;
      SyncSlotParent(content.Node, box.Node);
      box.Node.MoveChildToIndex(content.Node, 0);
    });
    // The body's box comes and goes with `open()`; its content persists (projected content is owned by
    // the CONSUMER's template, not recreated when disclosure-row's own `@if` toggles) — so every open/
    // close re-syncs the SAME content node to whichever box exists right now, or to none.
    effect(() => {
      const content = this._bodyContent();
      if (!content) return;
      SyncSlotParent(content.Node, this._bodyBox()?.Node ?? null);
    });
  }
}
