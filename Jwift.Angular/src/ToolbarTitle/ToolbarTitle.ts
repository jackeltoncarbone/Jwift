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
  /** Retained for backward-compat with existing template bindings.
   *  No longer read — the swap threshold derives from the toolbar's
   *  compact-host position vs the hero logo's, both of which are
   *  canvas-local (scroll-subtracted) so scrollY is implicit. */
  readonly scroll = input.required<Jiv>();
  /** The jiv whose first child (the hero logo) fades as it scrolls past
   *  the toolbar. Usually the HeroContent wrapper. */
  readonly target = input.required<Jiv>();

  private readonly _compactDef = contentChild(ToolbarCompactDef);
  private _rafId = 0;
  private _fade = signal(0);

  /** Scroll-fade amount, 0 (hero fully shown) → 1 (scrolled away, compact shown).
   *  The consumer binds the hero logo's Opacity to `1 - Fade()` via the `<jiv>`
   *  `[style]` input so the fade rides the node's own Apply (a bare proxy write
   *  would be reset by the worker's class-snapshot apply). */
  readonly Fade = this._fade.asReadonly();
  private _watchedFirst: JivCore | null = null;
  private _watchedCompact: JivCore | null = null;

  constructor() {
    // Mirror → toolbar compact visibility (drives the compact logo's [style] Opacity).
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
    this._watchedFirst?.WatchRect(false);
    this._watchedCompact?.WatchRect(false);
    this._watchedFirst = null;
    this._watchedCompact = null;
    // Clear our compact registration so it doesn't bleed into the next
    // page's toolbar — the toolbar instance lives in shared chrome and
    // outlives this component.
    this.toolbar().RegisterCompact(null);
  }

  /** Swap fires when the hero logo's on-screen center crosses the toolbar
   *  logo's on-screen center — i.e. the moment the hero logo, scrolling
   *  up, would visually pass through the slot where the toolbar logo sits.
   *  ±30pt smoothness on either side of that crossing.
   *
   *  Both Y values are canvas-local (the worker subtracts ancestor scroll
   *  before posting RectSnapshot), so the comparison is purely a visual
   *  one — scrollY doesn't enter the math. */
  private _recomputeFade(): void {
    const tgt = this.target();
    const tb = this.toolbar();
    if (!tgt || !tb) return;
    const first = tgt.Node.Children[0] as JivCore | undefined;
    const compact = tb.CompactHost;
    if (!first || !compact) return;

    // Subscribe lazily — rects are 0 until WatchRect(true). Calls are
    // idempotent. Re-target if the underlying jiv changes (e.g. compact
    // re-registered after a route swap).
    if (this._watchedFirst !== first) {
      this._watchedFirst?.WatchRect(false);
      first.WatchRect(true);
      this._watchedFirst = first;
    }
    if (this._watchedCompact !== compact) {
      this._watchedCompact?.WatchRect(false);
      compact.WatchRect(true);
      this._watchedCompact = compact;
    }

    // Bail until both rects have been measured at least once — otherwise
    // 0-vs-0 reads as "centers aligned" and the toolbar logo would flash
    // in at half opacity on the first frame.
    if (first.Height === 0 || compact.Height === 0) return;

    const heroCenter = first.Y + first.Height / 2;
    const toolbarCenter = compact.Y + compact.Height / 2;
    // Positive once the hero logo has scrolled up past the toolbar slot.
    const delta = toolbarCenter - heroCenter;
    const half = 30;
    const t = Math.min(1, Math.max(0, (delta + half) / (2 * half)));
    if (t !== this._fade()) this._fade.set(t);
  }
}
