import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, output } from '@angular/core';
import { Jiv, Jyle } from 'jaui-angular';
import { Icon } from '../Icon/Icon';
import MediaTransportJss from './MediaTransport.jss';

/** `regular` (56pt side / 76pt primary, Gap 36pt in a fixed 260pt row) — the original geometry, every
 *  existing call site's default, untouched. `compact` (round 16, Drill's own redesigned player): Apple's
 *  own now-playing size, all three buttons sharing one 44pt hit (28pt play/pause glyph, 20pt side glyphs),
 *  row sized to its own content rather than a fixed 260pt so it composes inside a centered 3-slot row
 *  (where-pill / transport / mute) without pushing the sides off-balance. */
export type MediaTransportSize = 'regular' | 'compact';

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
      <jiv [class]="RowClass()" [disabled]="disabled()">
        <jiv [class]="BtnClass()" [disabled]="skipBackDisabled()" [attr.aria-label]="skipBackLabel()" (click)="_skipBack()">
          <icon [class]="GlyphClass()" Name="backward.fill" />
        </jiv>
        <jiv [class]="BtnPrimaryClass()" [attr.aria-label]="playing() ? pauseLabel() : playLabel()" (click)="playPause.emit()">
          <icon [class]="GlyphPrimaryClass()" [Name]="playing() ? 'pause.fill' : 'play.fill'" />
        </jiv>
        <jiv [class]="BtnClass()" [disabled]="skipForwardDisabled()" [attr.aria-label]="skipForwardLabel()" (click)="_skipForward()">
          <icon [class]="GlyphClass()" Name="forward.fill" />
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
  /** One skip button with nowhere to go (a player already at its first or last item): dimmed, and a press
   *  does nothing, while play/pause and the other skip stay live. `disabled` above still greys the row. */
  readonly skipBackDisabled = input(false, { transform: booleanAttribute });
  readonly skipForwardDisabled = input(false, { transform: booleanAttribute });
  readonly size = input<MediaTransportSize>('regular');

  /** Plain English defaults so every call site has SOME accessible name out of the box; a localized app
   *  passes its own strings through `T(...)` (EditorPlayer.ts does). Jwift has no i18n of its own to draw
   *  on (Shared/ ships no `T`), so a default here is the only way this house control doesn't ship silent. */
  readonly skipBackLabel = input('Previous');
  readonly skipForwardLabel = input('Next');
  readonly playLabel = input('Play');
  readonly pauseLabel = input('Pause');

  readonly playPause = output<void>();
  readonly skipBack = output<void>();
  readonly skipForward = output<void>();

  protected _skipBack(): void {
    if (!this.skipBackDisabled()) this.skipBack.emit();
  }

  protected _skipForward(): void {
    if (!this.skipForwardDisabled()) this.skipForward.emit();
  }

  private readonly _compact = computed(() => this.size() === 'compact');
  /** REPLACES, not merges onto the base `Jwift_MediaTransportRow` -- that class pins a fixed 260pt Width,
   *  and JSS has no "auto" to text-author back over it (MediaTransport.jss's own comment on the compact
   *  class). `Jwift_MediaTransportRow_Compact` states every property the row needs on its own instead. */
  protected readonly RowClass = computed(() => this._compact() ? 'Jwift_MediaTransportRow_Compact' : 'Jwift_MediaTransportRow');
  protected readonly BtnClass = computed(() => this._compact() ? 'Jwift_MediaTransportBtn Jwift_MediaTransportBtn_Compact' : 'Jwift_MediaTransportBtn');
  protected readonly BtnPrimaryClass = computed(() => this._compact() ? 'Jwift_MediaTransportBtnPrimary Jwift_MediaTransportBtnPrimary_Compact' : 'Jwift_MediaTransportBtnPrimary');
  protected readonly GlyphClass = computed(() => this._compact() ? 'Jwift_MediaTransportGlyph Jwift_MediaTransportGlyph_Compact' : 'Jwift_MediaTransportGlyph');
  protected readonly GlyphPrimaryClass = computed(() => this._compact() ? 'Jwift_MediaTransportGlyphPrimary Jwift_MediaTransportGlyphPrimary_Compact' : 'Jwift_MediaTransportGlyphPrimary');
}
