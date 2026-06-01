import { Injectable, computed, signal } from '@angular/core';

/**
 * One row in a context menu. `OnPick` fires when the user clicks the row;
 * the menu auto-closes after.
 *
 *   - Label    — visible text
 *   - Icon     — optional Jwift icon glyph name (Name="copy" etc.)
 *   - Disabled — greys out the row, suppresses OnPick
 *   - Divider  — true means render a hairline divider instead of a row;
 *                Label/Icon/OnPick ignored when set
 *   - Destructive — paints the row text in the system red (matches macOS)
 */
export interface ContextMenuItem {
  Label?: string;
  Icon?: string;
  Disabled?: boolean;
  Divider?: boolean;
  Destructive?: boolean;
  OnPick?: () => void;
}

/**
 * App-wide service that drives a single mounted `<jwift-context-menu />`
 * overlay. Any component can call `Open(items, x, y)` to show a menu at
 * client-pixel coordinates; the overlay auto-positions itself, traps the
 * next outside-click / Escape to dismiss, and calls `item.OnPick()` then
 * `Close()` when a row is picked.
 *
 *   import { ContextMenuService } from '@Jwift.Angular';
 *
 *   onMyContextMenu(e: MouseEvent) {
 *     this._menu.Open([
 *       { Label: 'Cut',    OnPick: () => doCut() },
 *       { Label: 'Copy',   OnPick: () => doCopy() },
 *       { Divider: true },
 *       { Label: 'Delete', Destructive: true, OnPick: () => doDelete() },
 *     ], e.clientX, e.clientY);
 *     e.preventDefault();
 *   }
 */
@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  private readonly _items = signal<readonly ContextMenuItem[]>([]);
  private readonly _x = signal(0);
  private readonly _y = signal(0);
  private readonly _open = signal(false);

  readonly Items = this._items.asReadonly();
  readonly X = this._x.asReadonly();
  readonly Y = this._y.asReadonly();
  readonly IsOpen = this._open.asReadonly();
  readonly HasContent = computed(() => this._items().length > 0);

  Open = (items: readonly ContextMenuItem[], clientX: number, clientY: number): void => {
    this._items.set(items);
    this._x.set(clientX);
    this._y.set(clientY);
    this._open.set(true);
  };

  Close = (): void => {
    this._open.set(false);
  };

  /** Fire a row's action then close. Treats Disabled / Divider as no-ops. */
  Pick = (item: ContextMenuItem): void => {
    if (item.Divider || item.Disabled) return;
    item.OnPick?.();
    this.Close();
  };
}
