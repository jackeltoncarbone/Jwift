import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import MediaTransportJss from './MediaTransport.jss';

/**
 * `<media-transport>` — skip back / play-pause / skip forward. HOUSE geometry, promoted from Drill.jss's
 * `TransportRow` ladder. An optional scrub slider goes ABOVE the buttons, projected via `<ng-content>`.
 *
 *   <media-transport [playing]="Playing()" [disabled]="PlayerLocked()"
 *                     (playPause)="TogglePlay()" (skipBack)="SkipBy(-4)" (skipForward)="SkipBy(4)" />
 */
@Component({
  selector: 'media-transport',
  standalone: true,
  imports: [Jiv, Jyle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <jyle [source]="Jss" />
    <jiv class="Jwift_MediaTransport">
      <ng-content></ng-content>
      <jiv class="Jwift_MediaTransportRow" [disabled]="disabled()">
        <jiv class="Jwift_MediaTransportBtn" (click)="skipBack.emit()">
          <icon class="Jwift_MediaTransportGlyph" Name="backward.fill" />
        </jiv>
        <jiv class="Jwift_MediaTransportBtnPrimary" (click)="playPause.emit()">
          <icon class="Jwift_MediaTransportGlyphPrimary" [Name]="playing() ? 'pause.fill' : 'play.fill'" />
        </jiv>
        <jiv class="Jwift_MediaTransportBtn" (click)="skipForward.emit()">
          <icon class="Jwift_MediaTransportGlyph" Name="forward.fill" />
        </jiv>
      </jiv>
    </jiv>
  `,
  styles: [':host { display: contents; }'],
})
export class MediaTransport {
  protected readonly Jss = MediaTransportJss;

  readonly playing = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly playPause = output<void>();
  readonly skipBack = output<void>();
  readonly skipForward = output<void>();
}
