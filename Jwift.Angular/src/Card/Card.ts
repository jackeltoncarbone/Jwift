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

    // Propagate the image URL into the underlying Jiv. Initial value set
    // on first run; reactive so `[image]` bindings update the card.
    effect(() => {
      const src = this.image();
      if (src !== undefined) this.Node.ImageSrc = src;
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
