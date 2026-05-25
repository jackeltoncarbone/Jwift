import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
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
 *
 * Add `fluid` to opt the card into responsive sizing: it shrinks to fit its
 * row (so it never overflows on narrow screens) and the row becomes an
 * auto-grid that fills the available width. Without `fluid` the card keeps
 * its original fixed size.
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
  readonly fluid = input(false, { transform: booleanAttribute });

  constructor() {
    super('Card', CardJss, 'Jwift_Card', () => {
      const fluid = this.fluid();
      switch (this.size()) {
        case 'compact': return fluid ? 'Jwift_Card_Compact_Fluid' : 'Jwift_Card_Compact';
        case 'hero':    return fluid ? 'Jwift_Card_Hero_Fluid'    : 'Jwift_Card_Hero';
        default:        return fluid ? 'Jwift_Card_Fluid'         : 'Jwift_Card';
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
