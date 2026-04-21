import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import TabBarJss from './TabBar.jss';

/**
 * `<tab-bar>` — a glass-pill horizontal container for tab items.
 * Place inside a centering wrapper (parent decides layout).
 *
 *   <jiv class="TabBarCenter">
 *     <tab-bar>
 *       @for (t of Tabs(); track t.Label; let i = $index) {
 *         <jiv [class]="i === Selected() ? 'TabItemActive' : 'TabItem'"
 *              (click)="Select(i)">...</jiv>
 *       }
 *     </tab-bar>
 *   </jiv>
 *
 * Tab-item layout + active styling stays app-authored for now (icons
 * and copy are app-specific); the glass pill is the reusable piece.
 */
@Component({
  selector: 'tab-bar',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => TabBar) },
  ],
})
export class TabBar extends JivHost implements OnInit, OnDestroy {
  constructor() {
    super('TabBar', TabBarJss, 'Jwift_TabBar', () => 'Jwift_TabBar');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
