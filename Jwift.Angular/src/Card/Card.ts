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
import CardJss from './Card.jss';

export type CardSize = 'default' | 'compact' | 'hero';

const _CARD_PLACEHOLDER = 'rgba(0, 0, 0, 0.55)';

/**
 * `<card>` — a fixed-size image card with a rounded overflow clip and
 * shadow. Size variants follow the Home.ts Variant conventions.
 *
 *   <card size="hero" [image]="item.CoverUrl">
 *     <card-footer>
 *       <jext class="CardTitle" [text]="item.Title" />
 *     </card-footer>
 *   </card>
 */
@Component({
  selector: 'card',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Card) },
  ],
})
export class Card extends JivHost implements OnInit, OnDestroy {
  readonly size = input<CardSize>('default');
  readonly image = input<string | null | undefined>(undefined);

  constructor() {
    super('Card', CardJss, 'Jwift_Card', () => {
      switch (this.size()) {
        case 'compact': return 'Jwift_Card_Compact';
        case 'hero':    return 'Jwift_Card_Hero';
        default:        return 'Jwift_Card';
      }
    });

    // Map the `[image]` input to the underlying Jiv's Background style. The
    // engine resolves `Url(...)` to an Image-kind BackgroundValue, kicks
    // ImageCache.LoadUrl, and the placeholder color baked into the
    // `Url(...)` form is what the panel paints while the bitmap is in
    // flight — card frame + footer render immediately at their
    // JSS-styled positions. We route through SetStyleOverride (not the
    // JivHandle.Style proxy) so JivHost re-applies the full class state
    // alongside the override — proxy writes ship a bare apply op that
    // resets ChildLayout/Layout/Style to defaults, collapsing the card.
    effect(() => {
      const v = this.image();
      if (v === undefined) return;
      if (v === null || v === '') {
        this.SetStyleOverride({ Background: _CARD_PLACEHOLDER });
      } else {
        this.SetStyleOverride({ Background: `Url("${v}", Cover, ${_CARD_PLACEHOLDER})` });
      }
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
