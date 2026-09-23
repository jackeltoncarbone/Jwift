import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit,
  computed, effect, forwardRef, input, model, output, signal, viewChild,
} from '@angular/core';
import { Jinput, type JinputSpan, type JinputPeerCaret, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { Icon } from '../Icon/Icon';
import TextInputJss from './TextInput.jss';

export type { JinputSpan as TextInputSpan, JinputPeerCaret as TextInputPeerCaret };

/**
 * What the field is drawn in. `Fill` is the house field, a lift of whatever it rests on. `Glass` is for
 * the one field a page leads with over its ground (a directory's search). `None` paints nothing: the
 * text sits in a surface its host already draws, like the drill sentence or a grouped card.
 */
export type TextInputMaterial = 'Fill' | 'Glass' | 'None';

/**
 * `<text-input>`: the one text field. It IS the field body, not a wrapper around one, so the body answers
 * hover, press, editing, invalid and disabled with the same 140ms spring and the same lifts the buttons use
 * (TextInput.jss). A single line is a pill at the toolbar button's height; `MultiLine` is a card that grows.
 *
 *   <text-input [Text]="Query()" (TextChange)="Query.set($event)" Placeholder="Search"
 *               InputMode="search" Label="Search users" />
 *
 * Anything marked `Leading` projects before the text; anything else after it. A search field gets its
 * magnifying glass and its clear button from the component.
 */
@Component({
  selector: 'text-input',
  standalone: true,
  imports: [Jiv, Jinput, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: Jiv, useExisting: forwardRef(() => TextInput) }],
  host: { '(click)': 'OnBodyClick($event)' },
  template: `
    @if (ShowsSearchGlyph()) { <icon class="Jwift_FieldGlyph" Name="magnifyingglass" /> }
    <ng-content select="[Leading]" />
    <jiv [class]="MultiLine() ? 'Jwift_FieldTextTop' : 'Jwift_FieldText'">
      <jinput
        #jinput
        [Text]="Text()"
        (TextChange)="Text.set($event)"
        [Spans]="Spans()"
        [PeerCarets]="PeerCarets()"
        [Placeholder]="Placeholder()"
        [ReadOnly]="Disabled()"
        [MultiLine]="MultiLine()"
        [Label]="Label()"
        [HitSurface]="Material() === 'None' ? null : Node"
        [FontFamily]="FontFamily()"
        [FontSizePx]="FontSizePx()"
        [FontWeight]="FontWeight()"
        [LineHeightRatio]="LineHeightRatio()"
        [RowGapPx]="RowGapPx()"
        [InputMode]="InputMode()"
        [Autocorrect]="Autocorrect()"
        [EnterKeyHint]="EnterKeyHint()"
        PlaceholderFontStyle="Normal"
        [Ink]="Ink()"
        [PlaceholderInk]="PlaceholderInk()"
        [CaretInk]="CaretInk()"
        (PositionClicked)="PositionClicked.emit($event)"
        (PositionHovered)="PositionHovered.emit($event)"
        (FocusChanged)="OnFocusChanged($event)"
        (ContextRequested)="ContextRequested.emit($event)"
        (Submitted)="Submitted.emit($event)"
        (Cancelled)="Cancelled.emit($event)"
        (SelectionChanged)="SelectionChanged.emit($event)" />
    </jiv>
    <ng-content />
    @if (ShowsClear()) {
      <jiv class="Jwift_FieldClear" label="Clear" (click)="Clear()">
        <jiv class="Jwift_FieldClearDisc"><icon class="Jwift_FieldClearGlyph" Name="xmark" /></jiv>
      </jiv>
    }
  `,
  styles: [':host { display: contents; }'],
})
export class TextInput extends JivHost implements OnInit, OnDestroy {
  readonly Text = model('');
  readonly Spans = input<readonly JinputSpan[]>([]);
  readonly PeerCarets = input<readonly JinputPeerCaret[]>([]);
  readonly Placeholder = input('');
  /** The accessible name. Falls back to the placeholder. */
  readonly Label = input<string | null>(null);
  readonly MultiLine = input(false);
  readonly Material = input<TextInputMaterial>('Fill');
  /** Present but not editable: no caret, no focus, no response to the pointer. */
  readonly Disabled = input(false);
  /** The value cannot be accepted as it stands. */
  readonly Invalid = input(false);
  /** A clear button while there is text. Search fields have one unless this says otherwise. */
  readonly Clearable = input<boolean | null>(null);
  /** App classes merged after the field's own, for a field sized by its screen. */
  readonly Class = input('');

  /** Text, placeholder and caret inks; any colour or `@Var`. */
  readonly Ink = input('@Ink');
  readonly PlaceholderInk = input('@InkFaint');
  readonly CaretInk = input('@Ink');
  readonly FontFamily = input('Inter, system-ui, sans-serif');
  readonly FontSizePx = input(15);
  readonly FontWeight = input(400);
  readonly LineHeightRatio = input(1.6);
  readonly RowGapPx = input(5);
  readonly InputMode = input<'text' | 'search' | 'none'>('text');
  /** Opt in to native QuickType suggestions and autocorrect (see Jinput.Autocorrect). */
  readonly Autocorrect = input(false);
  readonly EnterKeyHint = input<'enter' | 'done' | 'go' | 'search' | 'send'>('enter');

  readonly PositionClicked = output<{ index: number; event: PointerEvent; summonedFocus?: boolean }>();
  readonly PositionHovered = output<{ index: number | null }>();
  readonly FocusChanged = output<boolean>();
  /** A context-class gesture (right-click or touch long-press); see Jinput. */
  readonly ContextRequested = output<{
    source: 'mouse' | 'touch';
    caretIndex: number;
    selStart: number;
    selEnd: number;
    value: string;
    anchorRect: { x: number; y: number; width: number; height: number };
  }>();
  readonly Submitted = output<KeyboardEvent>();
  readonly Cancelled = output<KeyboardEvent>();
  readonly SelectionChanged = output<{ start: number; end: number }>();
  /** The clear button emptied the field. */
  readonly Cleared = output<void>();

  private readonly _jinput = viewChild<Jinput>('jinput');
  private readonly _jinputHost = viewChild('jinput', { read: ElementRef });
  private readonly _editing = signal(false);

  protected readonly ShowsSearchGlyph = computed(() => this.InputMode() === 'search' && this.Material() !== 'None');
  protected readonly ShowsClear = computed(() =>
    (this.Clearable() ?? this.InputMode() === 'search') && !this.Disabled() && this.Text().length > 0);

  constructor() {
    super('TextInput', TextInputJss, 'Jwift_Field', () => {
      const material = this.Material();
      const base = material === 'None' ? 'Jwift_Field_Bare'
        : material === 'Glass' ? 'Jwift_Field_Glass'
        : this.MultiLine() ? 'Jwift_Field_Tall' : 'Jwift_Field';
      return `${base} ${this.Class()}`.trim();
    });
    effect(() => this.Node.SetState('Editing', this._editing()));
    effect(() => this.Node.SetState('Invalid', this.Invalid()));
    effect(() => this.Node.SetState('Disabled', this.Disabled()));
  }

  ngOnInit(): void {
    this._attachOnInit();
    this.Node.WatchRect(true);
  }
  ngOnDestroy(): void { this._detachOnDestroy(); }

  Focus = (): void => { this._jinput()?.Focus(); };
  Blur = (): void => { this._jinput()?.Blur(); };

  Clear = (): void => {
    this._jinput()?.SetText('');
    this.Cleared.emit();
  };

  protected OnFocusChanged(focused: boolean): void {
    this._editing.set(focused);
    this.FocusChanged.emit(focused);
  }

  /** A press on the body outside the text (its padding, the glyph, the clear button) edits the field. */
  protected OnBodyClick(event: Event): void {
    if (this.Disabled() || this.Material() === 'None' || this._editing()) return;
    const text = this._jinputHost()?.nativeElement as HTMLElement | undefined;
    if (text && event.target instanceof Node && text.contains(event.target)) return;
    this.Focus();
  }
}
