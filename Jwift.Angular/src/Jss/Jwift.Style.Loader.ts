import { Injectable } from '@angular/core';
import type { JssRegistry } from 'jaui-angular';

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
    if (ids.has(sourceId)) return;
    ids.add(sourceId);
    registry.MergeSource(source);
  }
}
