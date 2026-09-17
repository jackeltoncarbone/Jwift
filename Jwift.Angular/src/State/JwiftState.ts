import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { GlassButton } from '../GlassButton/GlassButton';
import { Icon } from '../Icon/Icon';
import JwiftStateJss from './JwiftState.jss';

/** Quiet when a surface simply has nothing on it; alert when it could not load what it has. */
export type JwiftStateTone = 'empty' | 'recovery';

/**
 * `<jwift-state>` — the canvas way a surface says there is nothing here, or that it could not load.
 *
 * THE GAP THIS FILLS. `Ui/RecoveryState` and `ss-empty-state` are the house components for saying no, and
 * both are DOM. A canvas page roots in `<jiv>`/`<jext>`/`<janvas>`, and DOM nested inside a `<jiv>` gets no
 * engine layout, so dropping `<recovery-state>` into one produces a state nobody can see — worse than no
 * state. Every canvas page therefore grew its own: the camera page carries `Cam_Blank` and `Cam_DeadCard`,
 * and the Suggestions block would have made a third. The migration checklist records it as "a lane, not a
 * line", and this is the lane.
 *
 * ONE COMPONENT, TWO TONES, because Apple's is one shape: a glyph, a title, a sentence, and up to two
 * actions, centred in the space the surface could not fill. Empty and Recovery differ in intent, not in
 * geometry, so the difference is the glyph's ink and nothing else. Two components would drift, which is
 * exactly what the two DOM ones did.
 *
 * Usage:
 *   <jwift-state glyph="lightbulb" title="No requests yet"
 *                detail="Nobody has asked for anything here so far." />
 *
 *   <jwift-state tone="recovery" glyph="exclamationmark.circle" title="Couldn't load the requests"
 *                detail="We couldn't reach the server."
 *                primaryLabel="Try again" (primary)="store.reload()" />
 *
 * THE GLYPH MUST BE ONE THE FONT CARRIES. Jwift renders glyph names, and a name the subset font lacks
 * draws an INVISIBLE cell — here that would be a silent hole above the title. The set is generated at
 * build time from `src/Icons/Icon.Manifest` (`npm run generate:icons`); add the name there and regenerate
 * before using one that is not in `Icon.Data.ts`.
 */
@Component({
  selector: 'jwift-state',
  standalone: true,
  imports: [Jiv, Jext, Jyle, GlassButton, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    <jiv class="JwiftState">
      <jiv class="JwiftState_Body">
        <!-- An icon element, not a jext: the icon component maps a NAME to its codepoint, where a jext
             would paint the literal string "lightbulb". NO BACKTICKS IN THIS TEMPLATE - it is a template
             literal, and a backtick inside an HTML comment still ends it (NG1010, "template must be a
             string", plus a pile of "cannot find name" errors from the tail landing outside). -->
        @if (glyph()) {
          <icon [class]="_GlyphClass()" [Name]="glyph()" />
        }
        <jext class="JwiftState_Title" [text]="title()" />
        @if (detail()) {
          <jext class="JwiftState_Detail" [text]="detail()" />
        }
        @if (_HasActions()) {
          <jiv class="JwiftState_Actions">
            <!-- A button's label is a jext element, never interpolated text: the engine paints jext
                 nodes, and bare text projected into a canvas control renders nothing. -->
            @if (primaryLabel()) {
              <glass-button shape="pill" variant="prominent" (click)="primary.emit()">
                <jext class="JwiftState_ActionLabelProminent" [text]="primaryLabel()" />
              </glass-button>
            }
            @if (secondaryLabel()) {
              <glass-button shape="pill" (click)="secondary.emit()">
                <jext class="JwiftState_ActionLabel" [text]="secondaryLabel()" />
              </glass-button>
            }
          </jiv>
        }
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class JwiftState {
  /** Quiet (`empty`, the default) or alert (`recovery`). It changes the glyph's ink, nothing else. */
  readonly tone = input<JwiftStateTone>('empty');

  /** A JwiftIcons glyph name, or empty for none. Must exist in the generated font — see the class note. */
  readonly glyph = input<string>('');

  /** What happened, in the house voice. The one part that is never optional. */
  readonly title = input.required<string>();

  /** What to do about it, or why there is nothing. One sentence. */
  readonly detail = input<string>('');

  /** The action that resolves the state — Try again, Browse the market. Omit for a dead end that is fine. */
  readonly primaryLabel = input<string>('');

  /** The way out that is not the fix. */
  readonly secondaryLabel = input<string>('');

  readonly primary = output<void>();
  readonly secondary = output<void>();

  protected readonly JssSource = JwiftStateJss;

  protected readonly _GlyphClass = computed(() =>
    this.tone() === 'recovery' ? 'JwiftState_Glyph_Alert' : 'JwiftState_Glyph');

  protected readonly _HasActions = computed(() => !!this.primaryLabel() || !!this.secondaryLabel());
}
