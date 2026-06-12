import { ChangeDetectionStrategy, Component, Injectable, computed, inject, signal } from '@angular/core';
import { Jiv, Jyle, TELEPORT_REGISTRY } from 'jaui-angular';
import ModalHostJss from './ModalHost.jss';

/** The well-known modal outlet id — teleport any jiv here to present it modally. */
export const JWIFT_MODAL_OUTLET = 'Jwift_Modal';

/**
 * Dismiss-intent channel for the modal outlet. The host has no idea WHAT is
 * presented (openness IS outlet occupancy); the current presenter effects on
 * `DismissTick` and decides how to leave (usually: flip its `TeleportTo` home).
 */
@Injectable({ providedIn: 'root' })
export class ModalOutletService {
  private readonly _dismissTick = signal(0);
  readonly DismissTick = this._dismissTick.asReadonly();
  RequestDismiss = (): void => this._dismissTick.update(n => n + 1);
}

/**
 * `<jwift-modal-host>` — mounted once in the app shell (inside the `<jaui>`
 * tree, like `<jwift-context-menu>`): a scrim that exists exactly while the
 * modal outlet is OCCUPIED, plus the centered outlet itself. Built entirely on
 * the ID-driven teleport system — there is no open/close API to keep in sync.
 *
 *   <jiv [TeleportTo]="presenting() ? JWIFT_MODAL_OUTLET : null"> ... </jiv>
 */
@Component({
  selector: 'jwift-modal-host',
  standalone: true,
  imports: [Jiv, Jyle],
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="JssSource" />
    @if (Occupied()) {
      <jiv class="Jwift_ModalScrim" (click)="Svc.RequestDismiss()" />
    }
    <jiv class="Jwift_ModalFrame">
      <jiv class="Jwift_ModalOutlet" [TeleportId]="ModalOutletId" />
    </jiv>
  `,
})
export class ModalHost {
  readonly JssSource = ModalHostJss;
  readonly ModalOutletId = JWIFT_MODAL_OUTLET;
  readonly Svc = inject(ModalOutletService);
  private readonly _teleports = inject(TELEPORT_REGISTRY);
  readonly Occupied = computed(() => this._teleports.OccupantCount(JWIFT_MODAL_OUTLET)() > 0);
}
