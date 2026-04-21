import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  contentChild,
  effect,
  input,
  signal,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { Toolbar } from '../Toolbar/Toolbar';
import { ToolbarCompactDef } from './ToolbarCompactDef';

/**
 * `<toolbar-title>` — scroll-aware title that promotes a compact version
 * into a linked toolbar when scrolled out of view.
 *
 * Purely behavioral — does NOT wrap its content in its own Jiv, so
 * projected children attach to the surrounding layout jiv (e.g.
 * HeroContent) and the parent's `Gap` / flex rules apply as expected.
 * Measures the `[target]` jiv's position every frame and drives its
 * `Opacity` to fade out as the compact version fades into the toolbar.
 *
 *   <jiv class="HeroContent" #heroContent>
 *     <toolbar-title [toolbar]="bar" [scroll]="scrollRef" [target]="heroContent">
 *       <jiv class="HeroLogo" image="ss-logo" />
 *       <jext class="HeroTitle" text="..." />
 *       <ng-template toolbarCompact>
 *         <jiv class="ToolbarLogo" image="ss-logo" />
 *       </ng-template>
 *     </toolbar-title>
 *   </jiv>
 */
@Component({
  selector: 'toolbar-title',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarTitle implements OnInit, OnDestroy, AfterContentInit {
  readonly toolbar = input.required<Toolbar>();
  readonly scroll = input.required<Jiv>();
  /** The jiv whose Opacity fades as the hero title scrolls out. Usually
   *  the HeroContent wrapper. Also used to measure the hero title's
   *  position vs the TopBlur overlay for the swap trigger. */
  readonly target = input.required<Jiv>();

  /** The TopBlur overlay height in pt. Swap fires when the target's first
   *  child (the logo) is halfway behind this zone. */
  readonly topBlurHeight = input(200);

  private readonly _compactDef = contentChild(ToolbarCompactDef);
  private _rafId = 0;
  private _fade = signal(0);

  constructor() {
    // Drive target's opacity from the fade signal. Jaui animator springs.
    effect(() => {
      const tgt = this.target();
      if (tgt) tgt.Node.Style.Opacity = (1 - this._fade()).toString();
    });
    // Mirror → toolbar compact visibility.
    effect(() => {
      this.toolbar().SetCompactVisible(this._fade() > 0.5);
    });
  }

  ngAfterContentInit(): void {
    const def = this._compactDef();
    if (def) this.toolbar().RegisterCompact(def.Template);
  }

  ngOnInit(): void {
    const tick = (): void => {
      this._recomputeFade();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  /** Fade fires when target's first child (hero logo) is halfway behind
   *  the TopBlur. Tracks first-child's absolute Y + half its height
   *  against `topBlurHeight`. ±30pt smoothness on either side. */
  private _recomputeFade(): void {
    const scrollJiv = this.scroll();
    const tgt = this.target();
    if (!scrollJiv || !tgt) return;
    const scrollY = scrollJiv.Node.ScrollY;
    const first = tgt.Node.Children[0];
    if (!first) return;
    const firstAbsY = tgt.Node.Y + first.Y;
    const crossScroll = firstAbsY + first.Height / 2 - this.topBlurHeight();
    const half = 30;
    const t = Math.min(1, Math.max(0, (scrollY - (crossScroll - half)) / (2 * half)));
    if (t !== this._fade()) this._fade.set(t);
  }
}
