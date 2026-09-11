import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  forwardRef,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import GlassButtonJss from './GlassButton.jss';

export type GlassButtonShape = 'round' | 'pill' | 'square';

/**
 * `<glass-button>` — Jwift liquid-glass button.
 *
 * IS a jiv (via JivHost) and self-provides the Jiv DI token so projected
 * `<jext>`/`<jiv>` children walk up to the button when resolving their
 * Jaui parent (without this, Angular's declaration-position DI would
 * attach children to the grandparent — the "icon lands in page center"
 * bug).
 *
 *   <glass-button shape="round">
 *     <jext class="ToolbarAvatarGlyph" [text]="AvatarIcon" />
 *   </glass-button>
 *
 * Shapes: `round` (default, 48×48 circle), `pill` (auto + pad), `square`.
 */
@Component({
  selector: 'glass-button',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => GlassButton) },
  ],
})
export class GlassButton extends JivHost implements OnInit, OnDestroy {
  readonly shape = input<GlassButtonShape>('round');
  /** Greys the button out and blocks every hit (no click, and no hover/active glass bloom). The pill
   *  stays in layout — for "nothing to do yet" affordances that should read as present-but-unavailable
   *  rather than disappear. */
  readonly disabled = input<boolean>(false);
  /** App classes merged after the shape class, for a consumer-sized button. */
  readonly Class = input<string>('');

  constructor() {
    super('GlassButton', GlassButtonJss, 'Jwift_GlassBtn_Round', () => {
      // Called lazily from the reactive effect — by then `this` is real.
      const shape = this.shape() === 'pill' ? 'Jwift_GlassBtn_Pill' : this.shape() === 'square' ? 'Jwift_GlassBtn_Square' : 'Jwift_GlassBtn_Round';
      return `${shape} ${this.Class()}`.trim();
    });
    // Disabled = dimmed + inert. Routed through the JivHost style-override channel (not a JSS pseudo) so
    // it layers over whichever shape class is active. Interactive:false is the important half — it stops
    // the engine hit-testing the pill, so neither the click nor the :Hover/:Active brightness springs
    // fire on a disabled button.
    effect(() => {
      if (this.disabled()) {
        this.SetStyleOverride({ Opacity: '0.4', Interactive: false, Cursor: 'Default' });
      } else {
        this.ClearStyleOverride('Opacity');
        this.ClearStyleOverride('Interactive');
        this.ClearStyleOverride('Cursor');
      }
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
