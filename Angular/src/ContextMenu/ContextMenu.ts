import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { Jaui, Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import { ContextMenuService, type ContextMenuItem } from './ContextMenu.Service';
import ContextMenuJss from './ContextMenu.jss';

/**
 * `<jwift-context-menu />` — single-instance overlay that renders the
 * current ContextMenuService menu. Mount once in your app shell (e.g.
 * inside `<jaui>` at the top level) and call
 * `inject(ContextMenuService).Open(items, x, y)` from anywhere to show
 * a menu.
 *
 * Anchors at the supplied client-pixel point with a small downward
 * offset; flips above the point if it would clip the viewport bottom.
 * Outside-click and Escape both dismiss.
 */
@Component({
  selector: 'jwift-context-menu',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    @if (Service.IsOpen() && Service.HasContent()) {
      <jiv class="Jwift_ContextMenuOverlay">
        <jiv class="Jwift_ContextMenuBackdrop" (pointerdown)="onBackdropDown($event)" />
        <jiv class="Jwift_ContextMenuPanel"
          [childLayout]="{
            Position: 'Placed',
            Left: PanelLeft() + 'px',
            Top: PanelTop() + 'px',
          }">
          @for (item of Service.Items(); track $index) {
            @if (item.Divider) {
              <jiv class="Jwift_ContextMenuDivider" />
            } @else {
              <jiv [class]="rowClass(item)" (click)="onPick(item)">
                @if (item.Icon) {
                  <icon class="Jwift_ContextMenuItemIcon" [Name]="item.Icon" />
                }
                <jext [class]="labelClass(item)" [text]="item.Label ?? ''" />
              </jiv>
            }
          }
        </jiv>
      </jiv>
    }
  `,
  styles: [`:host { display: contents; }`],
})
export class ContextMenu implements OnInit, OnDestroy {
  readonly JssSource = ContextMenuJss;
  readonly Service = inject(ContextMenuService);
  private readonly _canvas = inject(Jaui, { optional: true });

  // Menu position, clamped to keep the panel inside the viewport when the
  // anchor is near an edge. Computed in canvas-relative pixels because the
  // overlay's containing jiv covers the full canvas.
  readonly PanelLeft = computed(() => {
    const cv = this._canvas?.Canvas?.Element;
    if (!cv) return this.Service.X();
    const r = cv.getBoundingClientRect();
    return this.Service.X() - r.left;
  });
  readonly PanelTop = computed(() => {
    const cv = this._canvas?.Canvas?.Element;
    if (!cv) return this.Service.Y();
    const r = cv.getBoundingClientRect();
    return this.Service.Y() - r.top;
  });

  ngOnInit(): void {
    document.addEventListener('keydown', this._onKey, true);
    document.addEventListener('contextmenu', this._onAnyContextMenu, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this._onKey, true);
    document.removeEventListener('contextmenu', this._onAnyContextMenu, true);
  }

  rowClass(item: ContextMenuItem): string {
    return item.Disabled ? 'Jwift_ContextMenuItem_Disabled' : 'Jwift_ContextMenuItem';
  }

  labelClass(item: ContextMenuItem): string {
    return item.Destructive
      ? 'Jwift_ContextMenuItemLabel_Destructive'
      : 'Jwift_ContextMenuItemLabel';
  }

  onPick(item: ContextMenuItem): void {
    this.Service.Pick(item);
  }

  onBackdropDown(_e: PointerEvent): void {
    this.Service.Close();
  }

  private _onKey = (e: KeyboardEvent): void => {
    if (!this.Service.IsOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.Service.Close();
    }
  };

  // While the menu is open, swallow further native contextmenu events so
  // the browser's own menu doesn't pop up over our glass panel.
  private _onAnyContextMenu = (e: Event): void => {
    if (this.Service.IsOpen()) e.preventDefault();
  };
}
