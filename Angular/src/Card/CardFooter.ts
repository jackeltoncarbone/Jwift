import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import CardJss from './Card.jss';

/**
 * `<card-footer>` — bottom content strip of a `<card>`. Progressive blur
 * to the bottom edge so text sits readable over any image. Children
 * project in order (badge, title, meta, description, etc.).
 */
@Component({
  selector: 'card-footer',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => CardFooter) },
  ],
})
export class CardFooter extends JivHost implements OnInit, OnDestroy {
  constructor() {
    super('Card', CardJss, 'Jwift_CardFooter', () => 'Jwift_CardFooter');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
