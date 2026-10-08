import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Jext, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { Icon } from '../Icon/Icon';
import { SORTABLE_ENTRY, SORTABLE_LIST, type SortableEntryHandle } from './SortableList';
import SortableListJss from './SortableList.jss';

/**
 * `<sortable-section>`: a quiet disclosure group inside a `<sortable-list>` — a header (glyph swaps
 * rather than rotating, `DisclosureRow`'s own reason) and a leading hairline rule. The consumer
 * renders its rows only `@if (Open())`; a folded section still registers as ONE entry (its header) a
 * drag can target, landing the dropped row INSIDE it.
 */
@Component({
  selector: 'sortable-section',
  standalone: true,
  imports: [Jiv, Jext, Icon],
  template: `
    <jiv [class]="_headerClass()" [style]="_headerStyle()" semantics="Button" [label]="HeaderLabel() || Title()" (click)="_toggle()">
      <icon class="Jwift_SortableSectionHeaderGlyph" [Name]="Open() ? 'chevron.down' : 'chevron.right'" />
      <jext class="Jwift_SortableSectionHeaderTitle" [text]="Title()" />
      <jext class="Jwift_SortableSectionHeaderCount" [text]="Count()" />
    </jiv>
    <jiv class="Jwift_SortableSectionRule" />
    <ng-content />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => SortableSection) },
    { provide: SORTABLE_ENTRY, useExisting: forwardRef(() => SortableSection) },
  ],
})
export class SortableSection extends JivHost implements OnInit, OnDestroy, SortableEntryHandle {
  readonly Key = input.required<string>();
  readonly Title = input('');
  readonly Count = input('');
  readonly Open = input(true);
  readonly OpenChange = output<boolean>();
  readonly HeaderLabel = input('');

  private readonly _list = inject(SORTABLE_LIST, { optional: true });
  private readonly _dropTarget = signal(false);

  readonly Id = computed(() => this.Key());
  readonly Kind = 'SectionHeader' as const;
  get SectionId(): string | null { return this.Key(); }
  IsSectionOpen(): boolean { return this.Open(); }

  protected readonly _headerClass = computed(() =>
    this._dropTarget() ? 'Jwift_SortableSectionHeader Jwift_SortableSectionHeader_Drop' : 'Jwift_SortableSectionHeader');
  protected readonly _headerStyle = computed(() => ({ BorderRadius: `${this._list?.EffectiveRadius() ?? 0}pt` }));

  constructor() {
    super('SortableList', SortableListJss, 'Jwift_SortableSection', () => 'Jwift_SortableSection');
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);
    this._list?.RegisterEntry(this);
  }
  ngOnDestroy(): void {
    this._list?.UnregisterEntry(this);
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  // ── SortableEntryHandle ── (driven by the LIST during a drag) ──
  SetShift(y: number | null, tracking: boolean): void {
    void tracking;
    this.SetStyleOverride({ VisualTranslate: y === null ? '0 0' : `0 ${y}px` });
  }
  SetLifted(lifted: boolean): void {
    this.SetStyleOverride(lifted ? { Layer: '60', VisualScale: '1.03' } : { Layer: '0', VisualScale: '1' });
  }
  /** The list calls this while a drag hovers this (folded) section's header as a drop-into target. */
  SetDropTarget(over: boolean): void { this._dropTarget.set(over); }

  protected _toggle(): void {
    this.OpenChange.emit(!this.Open());
  }
}
