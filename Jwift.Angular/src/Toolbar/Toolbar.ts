import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import ToolbarJss from './Toolbar.jss';

/**
 * `<toolbar>` — Jwift toolbar row. Horizontal flex with SpaceBetween
 * justification; children sit at the leading and trailing edges.
 *
 *   <toolbar>
 *     <jiv class="Logo" image="ss-logo" />
 *     <glass-button shape="round">...</glass-button>
 *   </toolbar>
 */
@Component({
  selector: 'toolbar',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Toolbar) },
  ],
})
export class Toolbar extends JivHost implements OnInit, OnDestroy {
  constructor() {
    super('Toolbar', ToolbarJss, () => 'Jwift_Toolbar');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
