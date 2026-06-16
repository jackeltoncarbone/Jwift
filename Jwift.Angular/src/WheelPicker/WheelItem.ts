import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { Jiv, Jext } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import { WheelPicker } from './WheelPicker';
import { ProjectSlot, DegreesPerItem } from './WheelPicker.Logic';
import WheelPickerJss from './WheelPicker.jss';

/**
 * `<wheel-item>` — one row inside a `<wheel-picker>`. Either projects
 * arbitrary canvas content or, for the common case, renders a `label`:
 *
 *   <wheel-picker [selectedValue]="squad()" (valueChange)="setSquad($event)">
 *     @for (n of squads(); track n) {
 *       <wheel-item [value]="n" [label]="n + ''" />
 *     }
 *   </wheel-picker>
 *
 *   <wheel-picker [selectedValue]="uniformId()" (valueChange)="pick($event)">
 *     @for (u of uniforms(); track u.Id) {
 *       <wheel-item [value]="u.Id"><uniform-card [Uniform]="u" /></wheel-item>
 *     }
 *   </wheel-picker>
 *
 * The row owns NO gesture state — the picker owns the pointer. The row only
 * positions ITSELF: it reads the picker's live `ScrollPosition` + its own
 * projection index and writes its drum transform (VisualTranslate /
 * VisualScale / Opacity) via the JivHost style override. Same single-source
 * pattern as `<tab-item>` reading the parent `<tab-bar>`.
 */
@Component({
  selector: 'wheel-item',
  standalone: true,
  imports: [Jext],
  template: `
    <ng-content></ng-content>
    @if (label()) {
      <jext class="Jwift_WheelItemLabel" [text]="label()" />
    }
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => WheelItem) },
  ],
})
export class WheelItem extends JivHost implements OnInit, OnDestroy {
  /** The value emitted by the picker when this row is selected. */
  readonly value = input<unknown>(null);
  /** Convenience text rendering. Omit when projecting custom content. */
  readonly label = input<string>('');

  private _picker = inject(WheelPicker);

  /** This row's index in projection order — drives its drum angle. */
  readonly Index = computed(() => this._picker.Items().indexOf(this));

  // Skip style writes once a row has parked fully off-drum (opacity 0) and
  // stays there, so a long list doesn't post an apply op per hidden row every
  // momentum frame. Resumes the moment it scrolls back toward the window.
  private _lastOpacity = -1;

  constructor() {
    super('WheelPicker', WheelPickerJss, 'Jwift_WheelItem', () => 'Jwift_WheelItem');

    effect(() => {
      const pos = this._picker.ScrollPosition();
      const geo = this._picker.Geometry();
      const idx = this.Index();
      if (idx < 0) return;

      const distance = idx - pos;
      const proj = ProjectSlot(distance, geo);
      if (proj.Opacity === 0 && this._lastOpacity === 0) return;
      this._lastOpacity = proj.Opacity;

      // True 3D drum: each row tilts on a cylinder of radius `geo.Radius` about
      // the shared viewport center, viewed through the picker's Perspective.
      // rotateX(angle) translateZ(radius) is the canonical iOS-picker transform;
      // the engine projects + foreshortens it for real (Mat3x3, no 2D fake).
      // toFixed keeps near-zero floats out of scientific notation (e.g. mid-snap
      // a distance of -7.7e-14 would stringify as "...e-14", which the Length
      // parser rejects). 4 decimals is sub-pixel-exact for an angle/depth.
      const angle = -distance * DegreesPerItem(geo);
      this.SetStyleOverride({
        Transform: `rotateX(${angle.toFixed(4)}) translateZ(${geo.Radius.toFixed(2)}px)`,
        Opacity: proj.Opacity.toFixed(4),
      });
    });
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
