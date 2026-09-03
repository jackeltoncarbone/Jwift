import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  input,
  output,
} from '@angular/core';
import { Jiv, Jext } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { JivHost } from '../Internal/JivHost';
import DrawerJss from './Drawer.jss';

/**
 * `<drawer>` — the app's floating-sheet CARD: one Liquid-Glass surface that owns
 * the grabber, the centered title, the top-left close, the concentric radius,
 * and the rise motion, so every bottom sheet looks and moves identically.
 *
 *   @if (Picker()) {
 *     <jiv [class]="Entered() ? 'LibScrim' : 'LibScrimEnter'" (pointerdown)="Close()" />
 *     <jiv class="SheetDock">
 *       <drawer [entered]="Entered()" sheetTitle="Pictures" [sheetFill]="true" (close)="Close()">
 *         ...body content...
 *         <jiv sheetFooter>...pinned footer...</jiv>
 *       </drawer>
 *     </jiv>
 *   }
 *
 * A jaui jiv parents by DI at its declaration site, so this shell IS the card
 * and the projected content lands directly inside it; the full-canvas scrim and
 * the centering `SheetDock` are the two shared-class siblings the consumer wraps
 * around it (a single jiv-host cannot emit siblings of itself). `[entered]`
 * drives the rise; the X and the scrim tap emit `close`.
 */
@Component({
  selector: 'drawer',
  standalone: true,
  imports: [Jiv, Jext, Icon],
  template: `
    <jiv class="Jwift_DrawerHandle" />
    @if (sheetTitle()) {
      <jext class="Jwift_DrawerTitle" [text]="sheetTitle()" />
      <jiv class="Jwift_DrawerClose" (click)="close.emit()">
        <icon class="Jwift_DrawerCloseGlyph" Name="xmark" />
      </jiv>
    }
    <ng-content></ng-content>
    <ng-content select="[sheetFooter]"></ng-content>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Drawer) },
  ],
})
export class Drawer extends JivHost implements OnInit, OnDestroy {
  /** The settled/entered pose. Flip true a frame after mount (rAF) to play the
   *  rise; the consumer owns this so the card and its scrim animate in step. */
  readonly entered   = input<boolean>(false);
  /** The header title; also gates the built-in grabber+title+close header. */
  readonly sheetTitle = input<string>('');
  /** A tall, definite-height browser card (its body scrolls, its [sheetFooter]
   *  pins) instead of the default card that sizes to its content. */
  readonly sheetFill  = input<boolean>(false);
  readonly close      = output<void>();

  constructor() {
    super('Drawer', DrawerJss, 'Jwift_DrawerCardEnter', () => {
      const base = this.entered() ? 'Jwift_DrawerCard' : 'Jwift_DrawerCardEnter';
      return this.sheetFill() ? base + ' Jwift_DrawerCardFill' : base;
    });
  }

  ngOnInit(): void {
    this._attachOnInit();
  }

  ngOnDestroy(): void {
    this._detachOnDestroy();
  }
}
