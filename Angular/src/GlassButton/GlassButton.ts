import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
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

  constructor() {
    super('GlassButton', GlassButtonJss, 'Jwift_GlassBtn_Round', () => {
      // Called lazily from the reactive effect — by then `this` is real.
      switch (this.shape()) {
        case 'pill':   return 'Jwift_GlassBtn_Pill';
        case 'square': return 'Jwift_GlassBtn_Square';
        default:       return 'Jwift_GlassBtn_Round';
      }
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
