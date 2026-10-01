import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  type Signal,
} from '@angular/core';
import { Jiv, JSS_REGISTRY } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import PaperJss from './Paper.jss';
import { PaperRadius } from './Paper.Geometry';

/** Paper's current radius and own padding — what a row inside it reads to land its own radius
 *  concentric (`RowRadius(Radius, Padding)`, `Paper.Geometry.ts`). A scroller inside paper reads it
 *  too, because paper itself does not clip (the fog has to overflow it). */
export const JWIFT_PAPER_GEOMETRY = new InjectionToken<Signal<{ Radius: number; Padding: number }>>('JWIFT_PAPER_GEOMETRY');

/**
 * `<paper>`: the house island/sheet surface — a thick, mostly-opaque glass with a fog veil standing in
 * for a soft shadow onto the field under it. A `JivHost` frame: no clip, no fill of its own, so
 * anything placed inside projects onto the surface drawn beneath it.
 *
 *   <paper [Inset]="16" [Padding]="8">
 *     <my-row/>
 *   </paper>
 */
@Component({
  selector: 'paper',
  standalone: true,
  imports: [Jiv],
  template: `
    @if (Fog()) {
      <jiv class="Jwift_PaperFog" [style]="_FogStyle()" />
    }
    <jiv class="Jwift_PaperSurface" [style]="_SurfaceStyle()" />
    <ng-content />
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Paper) },
    { provide: JWIFT_PAPER_GEOMETRY, useFactory: () => inject(Paper).Geometry },
  ],
})
export class Paper extends JivHost implements OnInit, OnDestroy {
  /** How far in from the app's outer screen corner paper sits; its own radius is the screen corner
   *  less this (concentric). */
  readonly Inset = input(16);
  /** The frame's own content padding. */
  readonly Padding = input(8);
  /** The fog veil standing in for a drop shadow onto the field. On by default; a consumer compositing
   *  paper over something that already casts its own shadow (or wants the cheaper surface alone) can
   *  turn it off. */
  readonly Fog = input(true);
  /** App classes merged after paper's own, for a frame sized/positioned by its screen. */
  readonly Class = input('');

  private readonly _jss = inject(JSS_REGISTRY);

  private readonly _radius = computed(() => PaperRadius(this._jss.VarPoints('JwiftScreenRadius'), this.Inset()));

  /** Published through `JWIFT_PAPER_GEOMETRY` for rows and scrollers inside paper. */
  readonly Geometry = computed(() => ({ Radius: this._radius(), Padding: this.Padding() }));

  protected readonly _FogStyle = computed(() => ({ BorderRadius: `${this._radius() + 28}pt` }));
  protected readonly _SurfaceStyle = computed(() => ({ BorderRadius: `${this._radius()}pt` }));

  constructor() {
    super('Paper', PaperJss, 'Jwift_Paper', () => `Jwift_Paper ${this.Class()}`.trim());
    // The frame itself carries no fill and clips nothing, so this never paints — but it keeps the
    // node's own geometry consistent with what `Geometry` publishes, for anything that reads it
    // directly off `Node` rather than through the injection token.
    effect(() => this.SetStyleOverride({ Padding: `${this.Padding()}pt`, BorderRadius: `${this._radius()}pt` }));
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
