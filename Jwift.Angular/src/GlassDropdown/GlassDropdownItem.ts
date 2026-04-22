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
import { GlassDropdown } from './GlassDropdown';
import GlassDropdownJss from './GlassDropdown.jss';

export type GlassDropdownItemVariant = 'default' | 'danger';

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
export class GlassDropdownItem extends JivHost implements OnInit, OnDestroy {
  readonly variant = input<GlassDropdownItemVariant>('default');
  readonly keepOpen = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  private _dropdown = inject(GlassDropdown);

  constructor() {
    super('GlassDropdownItem', GlassDropdownJss, 'Jwift_GlassDropdownItem', () => {
      if (this.disabled()) return 'Jwift_GlassDropdownItem_Disabled';
      return this.variant() === 'danger'
        ? 'Jwift_GlassDropdownItem_Danger'
        : 'Jwift_GlassDropdownItem';
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }

  protected _onClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled()) return;
    if (!this.keepOpen()) this._dropdown.Close();
  }
}
