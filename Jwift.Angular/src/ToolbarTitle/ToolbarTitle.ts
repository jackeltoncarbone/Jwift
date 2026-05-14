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
import { JivHandle as JivCore } from 'jaui';
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
    // Fade only the target's first child (the hero logo) — not the whole
    // target. Opacity cascades to descendants now, so fading the wrapper
    // would wipe out the entire hero content.
    effect(() => {
      const logo = this.target()?.Node.Children[0] as JivCore | undefined;
      if (logo) logo.Style.Opacity = (1 - this._fade()).toString();
    });
    // Mirror → toolbar compact visibility.
    effect(() => {
      this.toolbar().SetCompactVisible(this._fade() > 0.5);
    });
  }

  ngAfterContentInit(): void {
    const def = this._compactDef();
    // Always call — `null` clears any stale registration left by a
    // previous page's toolbar-title (the toolbar persists across routes
    // in the shared chrome, so a leaving page's compact would otherwise
    // pollute the new page's toolbar layout).
    this.toolbar().RegisterCompact(def?.Template ?? null);
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
    // Clear our compact registration so it doesn't bleed into the next
    // page's toolbar — the toolbar instance lives in shared chrome and
    // outlives this component.
    this.toolbar().RegisterCompact(null);
  }

  /** Fade fires when target's first child (hero logo) is halfway behind
   *  the TopBlur. Tracks first-child's absolute Y + half its height
   *  against `topBlurHeight`. ±30pt smoothness on either side.
   *
   *  The fade window is floored at scrollY = 0 — when the first child
   *  natively sits behind the TopBlur (hero content centered in a tall
   *  HeroBody whose top is under the toolbar), the raw crossover scroll
   *  is negative and the fade would otherwise read 1 before the user
   *  has scrolled at all, hiding the logo on initial render. */
  private _recomputeFade(): void {
    const scrollJiv = this.scroll();
    const tgt = this.target();
    if (!scrollJiv || !tgt) return;
    const scrollY = scrollJiv.Node.ScrollY;
    const first = tgt.Node.Children[0];
    if (!first) return;
    const firstAbsY = tgt.Node.Y + first.Y;
    const half = 30;
    const rawCross = firstAbsY + first.Height / 2 - this.topBlurHeight();
    const crossScroll = Math.max(half, rawCross);
    const t = Math.min(1, Math.max(0, (scrollY - (crossScroll - half)) / (2 * half)));
    if (t !== this._fade()) this._fade.set(t);
  }
}
