import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  forwardRef,
  input,
  output,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import DrawerJss from './Drawer.jss';

/**
 * `<drawer>` — Jwift bottom-anchored sliding drawer.
 *
 *   <drawer [open]="cart.IsOpen()" (close)="cart.Close()">
 *     <!-- projected content: body of the drawer -->
 *   </drawer>
 *
 * Spawns a full-canvas backdrop and a bottom-anchored panel; tapping the
 * backdrop or pressing Escape emits `close`. The panel renders projected
 * children via `<ng-content>` — consumers describe only the body.
 */
@Component({
  selector: 'drawer',
  standalone: true,
  imports: [Jiv],
  template: `
    <jiv [class]="BackdropClass()" (click)="close.emit()" />
    <jiv [class]="PanelClass()">
      <jiv class="Jwift_DrawerHandle" />
      <ng-content></ng-content>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Drawer) },
  ],
})
export class Drawer extends JivHost implements OnInit, OnDestroy {
  readonly open  = input<boolean>(false);
  readonly close = output<void>();

  protected BackdropClass = computed(() =>
    this.open() ? 'Jwift_DrawerBackdrop_Open' : 'Jwift_DrawerBackdrop');
  protected PanelClass = computed(() =>
    this.open() ? 'Jwift_DrawerPanel_Open' : 'Jwift_DrawerPanel');

  private _onKey = (e: KeyboardEvent): void => {
    if (this.open() && e.key === 'Escape') this.close.emit();
  };

  constructor() {
    super('Drawer', DrawerJss, 'Jwift_DrawerRoot', () =>
      this.open() ? 'Jwift_DrawerRoot_Open' : 'Jwift_DrawerRoot');
  }

  ngOnInit(): void {
    this._attachOnInit();
    document.addEventListener('keydown', this._onKey);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this._onKey);
    this._detachOnDestroy();
  }
}
