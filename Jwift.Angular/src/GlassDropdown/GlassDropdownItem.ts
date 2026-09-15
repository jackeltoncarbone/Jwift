import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  booleanAttribute,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { GlassDropdown, type GlassDropdownRow } from './GlassDropdown';
import GlassDropdownJss from './GlassDropdown.jss';

@Component({
  selector: 'glass-dropdown-item',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => GlassDropdownItem) },
  ],
  host: { '(click)': '_onClick($event)' },
})
export class GlassDropdownItem extends JivHost implements OnInit, OnDestroy, GlassDropdownRow {
  readonly keepOpen = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  // Optional — items rendered inside a <glass-dropdown> ancestor get the
  // dropdown reference via DI; standalone fixtures get null and just
  // emit the click without trying to close anything.
  private readonly _dropdown = inject(GlassDropdown, { optional: true });

  constructor() {
    super('GlassDropdownItem', GlassDropdownJss, 'Jwift_GlassDropdownItem', () => {
      return this.disabled() ? 'Jwift_GlassDropdownItem_Disabled' : 'Jwift_GlassDropdownItem';
    });
  }

  IsDisabled(): boolean { return this.disabled(); }

  ngOnInit(): void {
    this._attachOnInit();
    // The dropdown hit-tests its shared indicator against this row's rect,
    // which only reaches main while the worker is asked to report it.
    this.Node.WatchRect(true);
    this._dropdown?.RegisterRow(this);
  }

  ngOnDestroy(): void {
    this._dropdown?.UnregisterRow(this);
    this.Node.WatchRect(false);
    this._detachOnDestroy();
  }

  protected _onClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled()) return;
    if (!this.keepOpen()) this._dropdown?.Close();
  }
}
