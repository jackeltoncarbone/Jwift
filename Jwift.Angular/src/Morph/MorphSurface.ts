import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import MorphJss from './Morph.jss';

/**
 * `<morph-surface>` — a Jwift convenience preset over the ID-driven teleport
 * system: ONE element that is a collapsed tile (its `<morph-face>`) in one
 * outlet and an expanded panel (its `<morph-content>`) in another. The flight
 * is the inherited `TeleportTo` (every JivHost teleports); the face⇄content
 * cross-fade is pure JSS `@Transition` class swaps riding `Expanded`.
 *
 *   <morph-surface [TeleportTo]="staged ? 'Stage' : 'slot-' + id"
 *                  Class="CueCard" ExpandedClass="CueCardStaged"
 *                  [Expanded]="staged">
 *     <morph-face>   ...the tile look...     </morph-face>
 *     <morph-content> ...the panel content... </morph-content>
 *   </morph-surface>
 *
 * Sizing is ordinary child layout, not a mode: the collapsed look typically
 * fills its slot outlet (Width/Height 100%); the expanded class hugs content
 * (the content child is in-flow and IS the intrinsic sizer — the face is a
 * Placed overlay and contributes nothing).
 */
@Component({
  selector: 'morph-surface',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => MorphSurface) },
  ],
})
export class MorphSurface extends JivHost implements OnInit, OnDestroy {
  /** Collapsed/expanded content state — drives the face⇄content cross-fade. */
  readonly Expanded = input<boolean>(false);
  /** The surface's base look (e.g. `CueCard`). */
  readonly Class = input<string>('');
  /** Appended while expanded (e.g. `CueCardStaged` — material/radius/sizing). */
  readonly ExpandedClass = input<string>('');

  constructor() {
    super('Morph', MorphJss, 'Jwift_MorphSurface', () =>
      `Jwift_MorphSurface ${this.Class()} ${this.Expanded() ? this.ExpandedClass() : ''}`.trim());
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}

/** `<morph-face>` — the collapsed look's content group (a Placed overlay that
 *  fades out as the surface expands). Children attach here via the Jiv token. */
@Component({
  selector: 'morph-face',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => MorphFace) },
  ],
})
export class MorphFace extends JivHost implements OnInit, OnDestroy {
  private readonly _surface = inject(MorphSurface);

  constructor() {
    super('Morph', MorphJss, 'Jwift_MorphFace', () =>
      this._surface.Expanded() ? 'Jwift_MorphFace Jwift_MorphFaceHidden' : 'Jwift_MorphFace');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}

/** `<morph-content>` — the expanded content group: IN-FLOW (it is the surface's
 *  intrinsic sizer for content-hugging outlets), faded/scaled in while expanded,
 *  interactive only then. */
@Component({
  selector: 'morph-content',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => MorphContent) },
  ],
})
export class MorphContent extends JivHost implements OnInit, OnDestroy {
  private readonly _surface = inject(MorphSurface);

  constructor() {
    super('Morph', MorphJss, 'Jwift_MorphContent', () =>
      this._surface.Expanded() ? 'Jwift_MorphContent Jwift_MorphContentShown' : 'Jwift_MorphContent');
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void { this._detachOnDestroy(); }
}
