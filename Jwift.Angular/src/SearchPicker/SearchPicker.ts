import {
  ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output, signal,
} from '@angular/core';
import { Jext, Jiv, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { TextInput } from '../TextInput/TextInput';
import { heldPills, pickerGroups, type PickOption } from './SearchPicker.Model';
import SearchPickerJss from './SearchPicker.jss';

export type { HeldPill, PickGroup, PickOption } from './SearchPicker.Model';
export { heldPills, pickerGroups } from './SearchPicker.Model';

/**
 * `<search-picker>` — "which of these does this row hold": the held members as removable pills, plus a
 * search field and a grouped, multi-select results list over the catalog. HOUSE geometry, promoted from
 * Admin's `CapabilityPicker` and `PickList`, which had each rebuilt this independently.
 *
 * `held` is a list of KEYS, so the caller keeps owning the model; the labels come from `catalog`, and a
 * key the catalog does not carry is shown as retired rather than dropped.
 *
 *   <search-picker [held]="TargetKeys(l)" [catalog]="TargetCatalog()"
 *                  addLabel="Add target" (add)="addTarget($index, $event)" (remove)="removeTarget($event)" />
 */
@Component({
  selector: 'search-picker',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon, TextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_SearchPickerRoot">
      <jiv class="Jwift_SearchPickerHeld">
        @for (h of Held(); track h.key; let i = $index, last = $last) {
          <jiv [class]="h.retired ? 'Jwift_SearchPickerPill_Retired' : 'Jwift_SearchPickerPill'">
            @if (ordered()) { <jext class="Jwift_SearchPickerPillOrd" [text]="(i + 1) + ''" /> }
            @if (h.group) { <jext class="Jwift_SearchPickerPillGroup" [text]="h.group" /> }
            <jext [class]="h.retired ? 'Jwift_SearchPickerPillText_Retired' : 'Jwift_SearchPickerPillText'" [text]="h.label" />
            @if (h.retired) { <jext class="Jwift_SearchPickerPillMark" text="Retired" /> }
            <!-- Order is meaning here (a stack, a sequence): each pill gets its index and two nudges. -->
            @if (ordered()) {
              <jiv [class]="i === 0 ? 'Jwift_SearchPickerMini_Off' : 'Jwift_SearchPickerMini'" [disabled]="i === 0"
                   [label]="'Move ' + h.label + ' earlier'" (click)="_nudge(h.key, i - 1, i === 0)">
                <icon class="Jwift_SearchPickerMiniGlyph" Name="chevron.left" />
              </jiv>
              <jiv [class]="last ? 'Jwift_SearchPickerMini_Off' : 'Jwift_SearchPickerMini'" [disabled]="last"
                   [label]="'Move ' + h.label + ' later'" (click)="_nudge(h.key, i + 1, last)">
                <icon class="Jwift_SearchPickerMiniGlyph" Name="chevron.right" />
              </jiv>
            }
            <jiv [class]="disabled() ? 'Jwift_SearchPickerMini_Off' : 'Jwift_SearchPickerMini'" [disabled]="disabled()"
                 [label]="'Remove ' + h.label" (click)="_drop(h.key)">
              <icon class="Jwift_SearchPickerMiniGlyph" Name="xmark" />
            </jiv>
          </jiv>
        } @empty {
          @if (!Open()) { <jext class="Jwift_SearchPickerNone" [text]="emptyText()" /> }
        }

        @if (!disabled()) {
          <jiv [class]="Open() ? 'Jwift_SearchPickerChipOn' : 'Jwift_SearchPickerChip'" (click)="_toggle()">
            <icon [class]="Open() ? 'Jwift_SearchPickerChipGlyphOn' : 'Jwift_SearchPickerChipGlyph'" [Name]="Open() ? 'xmark' : 'plus'" />
            <jext [class]="Open() ? 'Jwift_SearchPickerChipLabelOn' : 'Jwift_SearchPickerChipLabel'" [text]="Open() ? 'Done' : addLabel()" />
          </jiv>
        }
      </jiv>

      @if (Open()) {
        <jiv class="Jwift_SearchPickerPanel">
          <text-input Material="Glass" Class="Jwift_SearchPickerField" InputMode="search" [Text]="Query()"
            (TextChange)="Query.set($event)" [Placeholder]="searchPlaceholder()" />
          @for (g of Groups(); track g.group) {
            @if (g.group) { <jext class="Jwift_SearchPickerGroupHead" [text]="g.group" /> }
            <jiv class="Jwift_SearchPickerOptions">
              @for (o of g.options; track o.key) {
                <jiv class="Jwift_SearchPickerOpt" (click)="_pick(o.key)">
                  <jext class="Jwift_SearchPickerOptLabel" [text]="o.label" />
                  @if (o.hint) { <jext class="Jwift_SearchPickerOptHint" [text]="o.hint" /> }
                </jiv>
              }
            </jiv>
          } @empty {
            <jext class="Jwift_SearchPickerNote" [text]="_nothingHeading()" />
            <jext class="Jwift_SearchPickerNote"
              [text]="Query() ? 'Nothing in the catalog matches that.' : 'Everything available is already on this row.'" />
          }
        </jiv>
      }
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class SearchPicker {
  protected readonly Jss = SearchPickerJss;

  /** The keys this row holds, in the row's own order. */
  readonly held = input<readonly string[]>([]);
  /** Everything that could be held. An empty catalog reads as "not loaded yet", never as "nothing held". */
  readonly catalog = input<readonly PickOption[]>([]);
  readonly addLabel = input<string>('Add');
  readonly searchPlaceholder = input<string>('Search');
  readonly emptyText = input<string>('Nothing yet.');
  /** What the picker calls the things it holds, for its own empty state ("capabilities", "targets"). */
  readonly noun = input<string>('options');
  /** The held order carries meaning (a stack, a sequence), so each pill gets its index and two nudges. */
  readonly ordered = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly add = output<string>();
  readonly remove = output<string>();
  /** A held key asked to move to `to` (already clamped to the held range by the pill's disabled state). */
  readonly move = output<{ key: string; to: number }>();

  protected readonly Open = signal(false);
  protected readonly Query = signal('');

  protected readonly Held = computed(() => heldPills(this.held(), this.catalog()));
  protected readonly Groups = computed(() => pickerGroups(this.held(), this.catalog(), this.Query()));

  protected readonly _nothingHeading = computed(() =>
    this.Query() ? `No ${this.noun()} match` : 'Nothing left to add');

  protected _toggle(): void {
    if (this.disabled()) return;
    this.Open.update((v) => !v);
    if (!this.Open()) this.Query.set('');
  }

  protected _nudge(key: string, to: number, blocked: boolean): void {
    if (blocked || this.disabled()) return;
    this.move.emit({ key, to });
  }

  protected _drop(key: string): void {
    if (this.disabled()) return;
    this.remove.emit(key);
  }

  // The picker STAYS OPEN on a pick: adding several entries should not be several trips through the button.
  protected _pick(key: string): void {
    this.add.emit(key);
  }
}
