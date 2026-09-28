import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { Jiv, Jext, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import TokenChipJss from './TokenChip.jss';

/**
 * `<token-chip>` — a removable chip: a label ending in its own 44pt remove circle. HOUSE geometry,
 * promoted from Admin.jss's `Adm_Pill2`/`Adm_PillMini` pair.
 *
 *   <token-chip [label]="g.RoleKey" [removeLabel]="'Revoke ' + g.RoleKey" [disabled]="Busy()"
 *               (removeClick)="revokeRole(d, g.RoleKey)" />
 */
@Component({
  selector: 'token-chip',
  standalone: true,
  imports: [Jiv, Jext, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_TokenChip">
      <jext class="Jwift_TokenChipLabel" [text]="label()" />
      <jiv [class]="disabled() ? 'Jwift_TokenChipRemove_Off' : 'Jwift_TokenChipRemove'" [disabled]="disabled()"
           [label]="removeLabel() || ('Remove ' + label())" (click)="_remove()">
        <icon class="Jwift_TokenChipRemoveGlyph" Name="xmark" />
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class TokenChip {
  protected readonly Jss = TokenChipJss;

  readonly label = input.required<string>();
  /** Accessible name for the remove control. Falls back to "Remove {label}". */
  readonly removeLabel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly removeClick = output<void>();

  protected _remove(): void {
    if (this.disabled()) return;
    this.removeClick.emit();
  }
}
