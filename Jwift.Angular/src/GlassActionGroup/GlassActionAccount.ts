import { InjectionToken, type Signal } from '@angular/core';
import type { GlassAction } from './GlassActionGroup';

/**
 * The ACCOUNT contract the avatar sink optionally consumes, so every `<glass-action-bar>` and every
 * avatar-bearing `<glass-action-group>` carries the same account menu and the same monogram WITHOUT
 * each page wiring one. A page that draws a bar and forgets the menu is a page with no route to
 * support, which is a hole nobody notices until somebody is stuck.
 *
 * Jwift is a library and knows only this shape: the host app provides the implementation, so nothing
 * here reaches for an auth store, a router or a string catalog. The token is OPTIONAL, so a bar used
 * with no provider behaves exactly as it did before.
 *
 * An explicit `[Menu]` on a caller WINS over the ambient rows, and `[Menu]="[]"` opts out of them.
 */
export interface GlassActionAccount {
  /** The rows appended to the sink menu when a caller states no `[Menu]` of its own. */
  readonly Menu: Signal<readonly GlassAction[]>;
  /** The monogram the avatar wears with no photo. Null (signed out) falls through to the person
   *  glyph rather than inventing initials for nobody. */
  readonly Initials: Signal<string | null>;
  /** The signed-in photo, or null to fall back to the monogram and then the glyph. */
  readonly AvatarUrl: Signal<string | null>;
  /** Sub-pages the account rows push with `Page` (Help › and its rows). A caller's own `[Pages]` wins. */
  readonly Pages?: Signal<Readonly<Record<string, readonly GlassAction[]>>>;
  /** Consume an account action id. True when it was handled, so it never reaches the caller. */
  Handle(id: string): boolean;
}

export const GLASS_ACTION_ACCOUNT = new InjectionToken<GlassActionAccount>('GLASS_ACTION_ACCOUNT');
