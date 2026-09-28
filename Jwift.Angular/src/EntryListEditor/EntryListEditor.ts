import { ChangeDetectionStrategy, Component, TemplateRef, contentChild, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import EntryListEditorJss from './EntryListEditor.jss';

/** The template context `*entryListEditorRow` gets: the entry, its index, and whether it is first/last. */
export interface EntryListEditorRowContext<T> {
  $implicit: T;
  index: number;
  first: boolean;
  last: boolean;
}

/**
 * `<entry-list-editor>` — a repeatable list editor: rows with up/down/copy/remove verbs, plus an Add row.
 * HOUSE geometry, promoted from Surface/Editor.jss's `Ed_Entry`/`Ed_Add` ladder (the block editor's own
 * `<ed-entries>`, which several Admin asset editors and the changelog editor had each rebuilt).
 *
 * The per-entry FIELDS are the caller's own — projected via a template, since what a "row" shows (a
 * name field, an image picker, a set of toggles) is different at every call site. The verbs, the order
 * and the geometry are not.
 *
 *   <entry-list-editor [entries]="Slides()" addLabel="Add a slide" [title]="(e, i) => e.Heading || ('Slide ' + (i + 1))"
 *                       [newEntry]="() => blankSlide()" (entriesChange)="Slides.set($event)">
 *     <ng-template #row let-entry let-i="index">
 *       <ed-field [def]="headingField" [host]="entry" (patch)="..." />
 *     </ng-template>
 *   </entry-list-editor>
 */
@Component({
  selector: 'entry-list-editor',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_EntryListEditor">
      @if (note()) { <jext class="Jwift_EntryListEditorNote" [text]="note()" /> }
      @for (entry of entries(); track $index; let i = $index; let first = $first; let last = $last) {
        <jiv class="Jwift_EntryListEditorRow">
          <jiv class="Jwift_EntryListEditorRowHead">
            <jext class="Jwift_EntryListEditorRowTitle" [text]="title()(entry, i)" />
            <jiv [class]="first ? 'Jwift_EntryListEditorBtn_Off' : 'Jwift_EntryListEditorBtn'" [disabled]="first"
                 label="Move earlier" (click)="_move(i, -1)">
              <icon class="Jwift_EntryListEditorGlyph" Name="chevron.up" />
            </jiv>
            <jiv [class]="last ? 'Jwift_EntryListEditorBtn_Off' : 'Jwift_EntryListEditorBtn'" [disabled]="last"
                 label="Move later" (click)="_move(i, 1)">
              <icon class="Jwift_EntryListEditorGlyph" Name="chevron.down" />
            </jiv>
            @if (duplicable()) {
              <jiv class="Jwift_EntryListEditorBtn" label="Duplicate" (click)="_copy(i)">
                <icon class="Jwift_EntryListEditorGlyph" Name="document.on.document" />
              </jiv>
            }
            <jiv class="Jwift_EntryListEditorBtn" label="Remove" (click)="_drop(i)">
              <icon class="Jwift_EntryListEditorGlyph" Name="trash" />
            </jiv>
          </jiv>
          <ng-container
            [ngTemplateOutlet]="rowTemplate() ?? null"
            [ngTemplateOutletContext]="{ $implicit: entry, index: i, first, last }" />
        </jiv>
      }
      <jiv class="Jwift_EntryListEditorAdd" [label]="addLabel()" (click)="_add()">
        <icon class="Jwift_EntryListEditorGlyph" Name="plus" />
        <jext class="Jwift_EntryListEditorAddText" [text]="addLabel()" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class EntryListEditor<T> {
  protected readonly Jss = EntryListEditorJss;

  readonly entries = input.required<readonly T[]>();
  readonly title = input.required<(entry: T, index: number) => string>();
  readonly newEntry = input.required<() => T>();
  readonly addLabel = input('Add');
  readonly note = input('');
  /** Off for a list where an entry cannot be meaningfully copied (a stack whose order is a hierarchy). */
  readonly duplicable = input(true);

  readonly entriesChange = output<readonly T[]>();

  protected readonly rowTemplate = contentChild<TemplateRef<EntryListEditorRowContext<T>>>('row');

  protected _add(): void {
    this.entriesChange.emit([...this.entries(), this.newEntry()()]);
  }
  protected _drop(index: number): void {
    this.entriesChange.emit(this.entries().filter((_, i) => i !== index));
  }
  protected _copy(index: number): void {
    const list = this.entries();
    const copy = structuredClone(list[index]) as T;
    const next = [...list];
    next.splice(index + 1, 0, copy);
    this.entriesChange.emit(next);
  }
  protected _move(index: number, delta: -1 | 1): void {
    const list = this.entries();
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    this.entriesChange.emit(next);
  }
}
