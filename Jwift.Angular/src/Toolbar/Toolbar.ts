import {
  ChangeDetectionStrategy,
  Component,
  EmbeddedViewRef,
  Injector,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { JivHandle as JivCore } from 'jaui';
import { JivHost } from '../Internal/JivHost';
import ToolbarJss from './Toolbar.jss';

/**
 * `<toolbar>` — Jwift toolbar row. Horizontal flex with SpaceBetween
 * justification; children sit at the leading and trailing edges.
 *
 * Accepts a "compact" TemplateRef via RegisterCompact(tpl) — typically
 * called by a paired <toolbar-title> scrolling in the content body.
 * The compact template renders in a leading slot as a child of the
 * toolbar's own JivCore (custom injector overrides the Jiv DI token so
 * the template's jivs attach to THIS toolbar instead of the declaration
 * site, which would otherwise be wherever `<ng-template toolbarCompact>`
 * lives in the consumer template).
 */
@Component({
  selector: 'toolbar',
  standalone: true,
  template: `
    <ng-container #compactSlot></ng-container>
    <ng-content></ng-content>
  `,
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => Toolbar) },
  ],
})
export class Toolbar extends JivHost implements OnInit, OnDestroy {
  @ViewChild('compactSlot', { read: ViewContainerRef, static: true })
  private _compactVcr!: ViewContainerRef;

  private _compactView: EmbeddedViewRef<unknown> | null = null;
  private _compactVisible = signal(false);

  /** Whether the compact slot (e.g. the scrolled-in logo) should be visible.
   *  The consumer binds the compact node's Opacity to this via the `<jiv>`
   *  `[style]` input — NOT a back-door `host.Style.Opacity` write. A bare proxy
   *  write loses to the compact node's own full-class Apply (the worker resets
   *  Style to defaults on each class-snapshot apply, wiping the override); routing
   *  Opacity through `[style]` makes it ride that same Apply so it survives. */
  readonly CompactVisible = this._compactVisible.asReadonly();

  /** `Node` proxy for the compact slot's own Jiv — so the ToolbarTitle
   *  can drive Opacity on it while scroll-fading. Set lazily when the
   *  compact template registers and creates its content. */
  private _compactHost: JivCore | null = null;

  /** Public accessor for the compact slot's JivCore so ToolbarTitle can
   *  measure its on-screen position for the scroll-swap threshold (we
   *  want the swap fired when the hero logo crosses THIS jiv, not a
   *  fixed proxy like TopBlur height). Null until the compact template
   *  registers and its embedded view attaches its first jiv to us. */
  get CompactHost(): JivCore | null { return this._compactHost; }

  /** Extra class(es) appended to `Jwift_Toolbar` so consumers can override
   *  toolbar fields (Padding, Layer, etc.) from outside without forking
   *  or wrapping. JssRegistry.Resolve merges classes left-to-right, so
   *  whatever the consumer passes wins on field conflicts. Example:
   *  `<toolbar Class="EditorToolbarFlush">` zeroes horizontal padding
   *  when the toolbar is nested in an already-chrome-padded container. */
  readonly Class = input<string>('');

  constructor() {
    super('Toolbar', ToolbarJss, 'Jwift_Toolbar', () => `Jwift_Toolbar ${this.Class()}`.trim());
    // NOTE: compact-slot opacity is NOT driven here by writing host.Style.Opacity.
    // A bare JivHandle.Style proxy write is clobbered by the compact node's own
    // full-class Apply (worker resets Style to defaults per class-snapshot). The
    // consumer instead binds the compact node's `[style]` Opacity to CompactVisible
    // (see Toolbar/ToolbarTitle usage), so Opacity rides the node's own Apply.
  }

  ngOnInit(): void { this._attachOnInit(); }
  ngOnDestroy(): void {
    this._compactView?.destroy();
    this._compactView = null;
    this._compactHost = null;
    this._detachOnDestroy();
  }

  /** Mount a compact template into the toolbar's leading slot. Pass null
   *  to clear (used by ToolbarTitle.ngOnDestroy so a template registered
   *  by a leaving page doesn't persist into the next one's toolbar). */
  RegisterCompact(tpl: TemplateRef<unknown> | null): void {
    if (this._compactView) {
      // Detach the compact's jiv from THIS toolbar before destroying the
      // embedded view — the JivCore stays in Children otherwise (the
      // embedded view doesn't know about the canvas tree).
      if (this._compactHost) {
        this.Node.RemoveChild(this._compactHost);
        this._compactHost = null;
      }
      this._compactView.destroy();
      this._compactView = null;
    }
    if (!tpl) return;
    // Custom injector: overrides Jiv DI so template's children attach to
    // THIS toolbar, not to the declaration-site Jiv ancestor.
    const injector = Injector.create({
      providers: [{ provide: Jiv, useValue: this }],
      parent: this._compactVcr.injector,
    });
    // Snapshot the current children so we can identify the compact node as the
    // one the embedded view ADDS — not "the last child". The bridge now inserts
    // each child at its DOM-authored position (Jiv reorders on attach), and
    // <ng-container #compactSlot> precedes <ng-content>, so the compact node
    // lands at the FRONT, not the end. Grabbing children[last] would pick the
    // trailing group (the avatar) and wrongly move IT to leading.
    const before = new Set(this.Node.Children);
    this._compactView = this._compactVcr.createEmbeddedView(tpl, {}, { injector });
    // Wait a microtask for the embedded view's jivs to attach, then pin the
    // compact node to index 0 (the leading slot under Justify: SpaceBetween).
    // `MoveChildToIndex` updates the main-side handle's Children AND posts a
    // `move-child` op so the worker's JivCore tree matches.
    queueMicrotask(() => {
      const compact = this.Node.Children.find(c => !before.has(c));
      if (!compact) return;
      this.Node.MoveChildToIndex(compact, 0);
      this._compactHost = compact;
      // Opacity is bound via the consumer's `[style]` input (CompactVisible), not
      // written here — a bare proxy write would be reset by the node's own Apply.
    });
  }

  /** Called by the paired ToolbarTitle each frame as the hero title
   *  crosses the scroll threshold. Drives compact-slot opacity. */
  SetCompactVisible(visible: boolean): void {
    this._compactVisible.set(visible);
  }
}
