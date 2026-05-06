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
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { Jiv } from 'jaui-angular';
import { Jiv as JivCore } from 'jaui';
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

  /** `Node` proxy for the compact slot's own Jiv — so the ToolbarTitle
   *  can drive Opacity on it while scroll-fading. Set lazily when the
   *  compact template registers and creates its content. */
  private _compactHost: JivCore | null = null;

  /** Extra class(es) appended to `Jwift_Toolbar` so consumers can override
   *  toolbar fields (Padding, Layer, etc.) from outside without forking
   *  or wrapping. JssRegistry.Resolve merges classes left-to-right, so
   *  whatever the consumer passes wins on field conflicts. Example:
   *  `<toolbar Class="EditorToolbarFlush">` zeroes horizontal padding
   *  when the toolbar is nested in an already-chrome-padded container. */
  readonly Class = input<string>('');

  constructor() {
    super('Toolbar', ToolbarJss, 'Jwift_Toolbar', () => `Jwift_Toolbar ${this.Class()}`.trim());

    // Drive the compact slot's jiv opacity from the visibility signal.
    // The style animator will spring the transition smooth.
    effect(() => {
      const visible = this._compactVisible();
      const host = this._compactHost;
      if (host) host.Style.Opacity = visible ? '1' : '0';
    });
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
    this._compactView = this._compactVcr.createEmbeddedView(tpl, {}, { injector });
    // The compact template's jivs attach to this.Node in tree order —
    // but ToolbarTitle calls RegisterCompact in ngAfterContentInit, which
    // fires AFTER Toolbar's own projected children have attached. So the
    // compact node ends up at the END of Children, making it the trailing
    // slot under Justify: SpaceBetween (avatar ends up leading — wrong).
    // Wait a microtask for the embedded view's jivs to attach, then pluck
    // them off the end and splice them back in at index 0 so they become
    // the leading slot. Marks layout dirty so the flex reflow picks up.
    queueMicrotask(() => {
      const children = this.Node.Children;
      if (children.length === 0) return;
      const compact = children.pop() as JivCore;
      children.unshift(compact);
      this._compactHost = compact;
      this._compactHost.Style.Opacity = this._compactVisible() ? '1' : '0';
      this.Node.MarkLayoutDirty();
    });
  }

  /** Called by the paired ToolbarTitle each frame as the hero title
   *  crosses the scroll threshold. Drives compact-slot opacity. */
  SetCompactVisible(visible: boolean): void {
    this._compactVisible.set(visible);
  }
}
