import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import { GlassButton } from '../GlassButton/GlassButton';
import { Icon } from '../Icon/Icon';
import { TextInput } from '../TextInput/TextInput';
import ComposerBarJss from './ComposerBar.jss';

/**
 * `<composer-bar>` — a text field with a round send button, disabled while empty. HOUSE geometry,
 * promoted from Messaging.jss's `Msg_Composer`/`Msg_Send` pair.
 *
 *   <composer-bar [(value)]="Draft" placeholder="Message" (send)="Send()" />
 */
@Component({
  selector: 'composer-bar',
  standalone: true,
  imports: [Jiv, Jyle, Icon, TextInput, GlassButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_ComposerBar">
      <text-input Class="Jwift_ComposerBarField" [Text]="value()" (TextChange)="value.set($event)"
        (Submitted)="_submit()" [Placeholder]="placeholder()" [EnterKeyHint]="'send'" [FontSizePx]="20" />
      <glass-button shape="round" variant="prominent" [disabled]="!_sendable()" (click)="_submit()">
        <icon class="Jwift_ComposerBarSendGlyph" Name="arrow.uturn.forward" />
      </glass-button>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class ComposerBar {
  protected readonly Jss = ComposerBarJss;

  readonly value = model('');
  readonly placeholder = input('Message');
  readonly disabled = input(false);

  readonly send = output<void>();

  protected readonly _sendable = computed(() => !this.disabled() && this.value().trim().length > 0);

  protected _submit(): void {
    if (this._sendable()) this.send.emit();
  }
}
