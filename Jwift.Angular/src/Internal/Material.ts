import { Directive, InjectionToken, forwardRef, input, type Signal } from '@angular/core';

/** What a subtree's content sits on: Liquid Glass (vibrant fills, HIG Materials) or the opaque elevated ground
 *  of a full-height sheet (the elevated grays). Unprovided is a page ground. */
export type JwiftMaterial = 'Glass' | 'Elevated';

export const JWIFT_MATERIAL = new InjectionToken<Signal<JwiftMaterial | null>>('JWIFT_MATERIAL');

/** States the material of a container the app draws itself, for everything inside it: `<jiv jwiftMaterial="Glass">`. */
@Directive({
  selector: '[jwiftMaterial]',
  standalone: true,
  providers: [{ provide: JWIFT_MATERIAL, useFactory: (d: JwiftMaterialScope) => d.jwiftMaterial, deps: [forwardRef(() => JwiftMaterialScope)] }],
})
export class JwiftMaterialScope {
  readonly jwiftMaterial = input.required<JwiftMaterial>();
}
