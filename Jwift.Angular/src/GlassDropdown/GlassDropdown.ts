import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { Jaui, Jiv } from 'jaui-angular';
import { JivHost } from '../Internal/JivHost';
import GlassDropdownJss from './GlassDropdown.jss';

@Component({
  selector: 'glass-dropdown',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: Jiv, useExisting: forwardRef(() => GlassDropdown) },
  ],
  host: { '(click)': '_onHostClick($event)' },
})
export class GlassDropdown extends JivHost implements OnInit, OnDestroy {
  private readonly _open = signal(false);
  private readonly _page = signal<string | null>(null);
  readonly IsOpen = this._open.asReadonly();
  readonly Page   = this._page.asReadonly();

  private readonly _canvasRef = inject(Jaui, { optional: true });
  private _unbindDoc: (() => void) | null = null;

  constructor() {
    super('GlassDropdown', GlassDropdownJss, 'Jwift_GlassDropdown_Closed', () =>
      this._open() ? 'Jwift_GlassDropdown_Open' : 'Jwift_GlassDropdown_Closed');
  }

  ngOnInit(): void {
    this._attachOnInit();
    // Everything renders into a single <canvas>, so DOM contains() can't
    // tell if a click landed inside or outside the dropdown — target is
    // always the canvas element. Check the pointer's canvas-space coords
    // against the dropdown Jiv's rect instead.
    const onDocDown = (e: PointerEvent) => {
      if (!this._open()) return;
      const el = this._canvasRef?.Canvas?.Element;
      if (el) {
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const n = this.Node;
        if (px >= n.X && px < n.X + n.Width && py >= n.Y && py < n.Y + n.Height) return;
      }
      this.Close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!this._open()) return;
      if (e.key === 'Escape') {
        if (this._page() !== null) this._page.set(null);
        else this.Close();
      }
    };
    document.addEventListener('pointerdown', onDocDown, true);
    document.addEventListener('keydown', onKey);
    this._unbindDoc = () => {
      document.removeEventListener('pointerdown', onDocDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }

  ngOnDestroy(): void {
    this._unbindDoc?.();
    this._detachOnDestroy();
  }

  Open():   void { this._open.set(true); }
  Close():  void { this._open.set(false); this._page.set(null); }
  Toggle(): void { if (this._open()) this.Close(); else this.Open(); }

  PushPage(id: string): void { this._page.set(id); }
  PopPage():            void { this._page.set(null); }

  protected _onHostClick(_e: MouseEvent): void { this.Toggle(); }
}
