import { Injectable } from '@angular/core';
import type { JssRegistry } from 'jaui-angular';
import JwiftGlassJss from '../Glass/Jwift.Glass.jss';

/** Sentinel key for the one-time glass-base global registration. */
const _GLASS_GLOBAL_ID = '__JwiftGlassGlobal__';

/**
 * Registers Jwift library styles into a consumer's JssRegistry exactly
 * once. Jwift components call `Ensure(registry, source)` on construction;
 * subsequent calls for the same registry are no-ops — so N mounted
 * components produce one merge, not N.
 *
 * Without this, every `<glass-button>` instance would re-merge the same
 * JSS source and bump the registry's Version signal, which every `<jiv>`
 * in the tree subscribes to — causing a tree-wide re-apply on every new
 * button.
 *
 * The first `Ensure` for a registry also registers the design-system
 * glass base (`JwiftGlass`) into the registry's GLOBALS tier, BEFORE any
 * component sheet merges. This lets every Jwift component sheet extend
 * `: JwiftGlass` (cross-sheet inheritance) regardless of whether the host
 * app registered the base itself — the library owns its own base so the
 * outline / backdrop / refraction calibration lives in exactly one place.
 */
@Injectable({ providedIn: 'root' })
export class JwiftStyleLoader {
  private _registered = new WeakMap<JssRegistry, Set<string>>();

  Ensure(registry: JssRegistry, sourceId: string, source: string): void {
    let ids = this._registered.get(registry);
    if (!ids) {
      ids = new Set();
      this._registered.set(registry, ids);
    }
    // Glass base must land in the globals tier before any component sheet
    // is parsed, so `Jwift_X : JwiftGlass {...}` resolves its base. Once
    // per registry; RegisterGlobal is idempotent on identical content.
    if (!ids.has(_GLASS_GLOBAL_ID)) {
      ids.add(_GLASS_GLOBAL_ID);
      registry.RegisterGlobal(JwiftGlassJss);
    }
    if (ids.has(sourceId)) return;
    ids.add(sourceId);
    registry.MergeSource(source);
  }
}
