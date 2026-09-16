import { signal, type Signal } from '@angular/core';

/**
 * THE AVATAR PHOTO LOADER — one fetch per photo per session, app-wide, and a verdict the fallback ladder
 * can actually read.
 *
 * WHY THIS EXISTS. Two faults, both measured on 2026-09-16:
 *
 * 1. **We hotlinked the provider's CDN on every paint.** The account surface asked
 *    `lh3.googleusercontent.com` for the signed-in person's Google photo every time a canvas mounted.
 *    A few hundred screenshots in one afternoon and Google began answering **429**, after which Chrome
 *    blocks the body under Opaque Response Blocking (`net::ERR_BLOCKED_BY_ORB`) and the avatar vanishes
 *    app-wide. A real user on a flaky network, behind a corporate proxy, or simply offline gets the same.
 * 2. **The fallback was chosen by URL PRESENCE, not by success.** Every consumer rendered the photo when
 *    a URL existed, so a URL that existed and FAILED painted an empty disc — no initials, no glyph,
 *    nothing. There was no `(error)` path anywhere on the canvas side at all.
 *
 * So this module fetches the bytes ONCE, holds them as a `blob:` URL for the session, and publishes a
 * verdict. That fixes both at once:
 *
 *   • one network request per distinct photo URL per session, no matter how many discs draw it or how
 *     many times a route is re-entered (a canvas remount re-reads the cache, it does not re-fetch);
 *   • a `blob:` URL is same-origin and already-decoded, so the engine's own `ImageCache` never issues a
 *     cross-origin request for an avatar again — which also sidesteps CORS entirely (the engine fetches
 *     every image with `mode:'cors'`, so a provider that stops sending `Access-Control-Allow-Origin`
 *     takes every avatar down with it);
 *   • a failure is a FACT — the fetch rejected or the status was not 2xx — rather than an inference from
 *     a null. That is what lets the ladder degrade on an ERROR and not only on an absence.
 *
 * This is the CLIENT half. The durable fix is that the profile's avatar is a blob WE mint (see
 * `SetProfileAvatarCommand`, whose contract already says "the service-minted avatar blob URL"), and the
 * provider's URL is only ever a suggestion. This loader is what makes the suggestion cost one request
 * instead of one per paint while that adoption is happening — and it is also where the adoption gets its
 * bytes for free (see `AvatarPhotoBlob`).
 *
 * NOT A GENERAL IMAGE CACHE. It is deliberately only for avatars: small (a 256px square is ~10–40KB),
 * few (one per person on screen), and long-lived (the same faces recur on every surface). Cover art and
 * stage renders are large, many and one-shot, and belong to the engine's own texture cache.
 */

/** Where a photo is in its one-and-only load. `Loading` is a real rung: the ladder shows the bare plate
 *  while it is in flight, so a good photo never flashes the monogram on its way in. */
export type AvatarPhotoVerdict = 'None' | 'Loading' | 'Ready' | 'Failed';

export interface AvatarPhotoState {
  readonly Verdict: AvatarPhotoVerdict;
  /** What to actually paint: our own `blob:` URL once the bytes have landed. Null unless Ready. */
  readonly Src: string | null;
}

const NONE: AvatarPhotoState = { Verdict: 'None', Src: null };
const LOADING: AvatarPhotoState = { Verdict: 'Loading', Src: null };
const FAILED: AvatarPhotoState = { Verdict: 'Failed', Src: null };

/** Per-URL state. Keyed by the REQUESTED url, so the crop rewrite (`=s256-c`) is part of the key and a
 *  differently-cropped request is a different photo. */
const _cache = new Map<string, ReturnType<typeof signal<AvatarPhotoState>>>();

/** The bytes, kept beside the state so an adoption flow can mint our own blob from the SAME fetch rather
 *  than asking the provider a second time. Cleared when the entry is evicted. */
const _blobs = new Map<string, Blob>();

/** A hard ceiling on how many object URLs we are willing to hold open. Avatars are tiny and few, so a
 *  real session never approaches this; past it we stop minting and hand back the raw URL (the old
 *  behaviour) rather than leaking object URLs forever in a pathological case. */
const MAX_MINTED = 256;
let _minted = 0;

/** A scheme whose bytes are already in hand — nothing to fetch, nothing that can 429. */
const _INLINE = /^(data|blob):/i;

/**
 * The state of one avatar photo, as a signal. Idempotent: the first call for a URL kicks the single fetch,
 * every later call — including from another component, another surface, or the same disc re-rendering —
 * gets the same signal and no extra request.
 *
 * Safe to call from inside a `computed`: the returned signal is created with its initial value and is
 * never written synchronously, so this does not write a signal in a reactive context.
 */
export function AvatarPhoto(url: string | null | undefined): Signal<AvatarPhotoState> {
  const trimmed = url?.trim();
  if (!trimmed) return _none;

  const hit = _cache.get(trimmed);
  if (hit) return hit;

  // Already-decoded or already-ours: no request, no verdict to wait for.
  if (_INLINE.test(trimmed)) {
    const inline = signal<AvatarPhotoState>({ Verdict: 'Ready', Src: trimmed });
    _cache.set(trimmed, inline);
    return inline;
  }

  // No fetch or no object URLs (SSR, or a host that has neither): pass the URL straight through and say
  // Ready. That is exactly today's behaviour — the DOM mirror's own <img> still renders it — and it is
  // honest about what we can and cannot verify off the browser.
  if (!_canLoad() || _minted >= MAX_MINTED) {
    const passthrough = signal<AvatarPhotoState>({ Verdict: 'Ready', Src: trimmed });
    _cache.set(trimmed, passthrough);
    return passthrough;
  }

  const state = signal<AvatarPhotoState>(LOADING);
  _cache.set(trimmed, state);

  // `credentials:'omit'` + `mode:'cors'` match the engine's own ImageCache exactly, so on the one host
  // that does serve CORS headers this request and the engine's are the same request — except the engine
  // never makes it, because what we hand back is a blob.
  fetch(trimmed, { mode: 'cors', credentials: 'omit' })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.blob();
    })
    .then((blob) => {
      // A 429 body blocked by ORB arrives as an opaque zero-byte response rather than a rejection, so an
      // empty or non-image blob is a FAILURE and not a photo. This is the exact shape the Google 429
      // took, and without this check the ladder would paint a blob URL that decodes to nothing.
      if (blob.size === 0 || !blob.type.startsWith('image/')) throw new Error(`not an image (${blob.type || 'empty'})`);
      _blobs.set(trimmed, blob);
      _minted++;
      state.set({ Verdict: 'Ready', Src: URL.createObjectURL(blob) });
    })
    .catch((err: unknown) => {
      // Said once, at warn, with the reason. A silently-empty disc cost this app its avatar app-wide for
      // an afternoon; the console line is how the next person finds it in a minute.
      console.warn(`[Jwift] avatar photo failed: ${trimmed.slice(0, 96)} (${(err as Error).message})`);
      state.set(FAILED);
    });

  return state;
}

/** The bytes of an already-loaded photo, for a flow that needs to POST them somewhere (the adoption that
 *  turns a provider suggestion into our own minted blob). Null unless that URL is loaded and Ready. */
export function AvatarPhotoBlob(url: string | null | undefined): Blob | null {
  const trimmed = url?.trim();
  return trimmed ? _blobs.get(trimmed) ?? null : null;
}

/** TEST SEAM ONLY — drop every verdict and revoke every object URL. Never called by the app: the cache is
 *  session-scoped on purpose, and a "refresh the avatar" that re-fetches a CDN is the fault this fixes. */
export function ResetAvatarPhotos(): void {
  for (const s of _cache.values()) {
    const src = s().Src;
    if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
  }
  _cache.clear();
  _blobs.clear();
  _minted = 0;
}

const _none = signal<AvatarPhotoState>(NONE).asReadonly();

const _canLoad = (): boolean =>
  typeof fetch === 'function'
  && typeof URL !== 'undefined'
  && typeof URL.createObjectURL === 'function';

// Re-exported so a consumer can name a rung without importing the union twice.
export { NONE as AvatarPhotoNone, LOADING as AvatarPhotoLoading, FAILED as AvatarPhotoFailed };
