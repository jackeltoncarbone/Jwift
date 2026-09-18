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
 * ORIGINS WHOSE AVATARS ARE READ AS THE VIEWER — the host app's own API, named by the host app.
 *
 * WHY THIS EXISTS. A photo that belongs to a PERSON has to be authorized per viewer, and an
 * authorization needs an identity on the wire. `credentials:'omit'` sends none, so a guarded avatar
 * endpoint can only ever answer "who's asking?" with "nobody" — which is what forced the server to
 * accept a bearer ticket in the query string instead, and a ticket in a URL is read by whoever holds the
 * URL rather than by whoever the viewer is. Sending the session cookie retires the ticket outright.
 *
 * WHY IT IS A REGISTRY AND NOT A DEFAULT. `credentials:'include'` is the wrong answer for a PROVIDER's
 * CDN, and not merely impolite: a credentialed cross-origin request cannot be answered with
 * `Access-Control-Allow-Origin: *`, which is exactly what `lh3.googleusercontent.com` answers, so
 * including credentials there would fail CORS and take every provider photo down. The host names the one
 * origin it owns; everything else keeps today's anonymous fetch.
 *
 * SAME-ORIGIN NEEDS NO REGISTRATION and is always credentialed: `credentials:'same-origin'` is the
 * platform default for `fetch` precisely because a request to yourself carrying your own cookies is the
 * unsurprising case.
 */
const _credentialedOrigins = new Set<string>();

/**
 * Declare the origins whose avatar reads carry the viewer's session — REPLACING any previous set, so a
 * host that calls this twice gets the second answer rather than the union. Values may be a bare origin
 * (`https://api.example.com`) or any URL on it; anything unparseable is dropped rather than guessed at.
 */
export function SetAvatarCredentialedOrigins(origins: readonly string[]): void {
  _credentialedOrigins.clear();
  for (const candidate of origins) {
    const origin = _originOf(candidate);
    if (origin) _credentialedOrigins.add(origin);
  }
}

/** The origin of `url`, resolved against the document when it is relative, or null when it is neither. */
function _originOf(url: string): string | null {
  try {
    const base = typeof location !== 'undefined' ? location.href : undefined;
    return new URL(url, base).origin;
  } catch {
    return null;
  }
}

/**
 * Whether this photo's fetch carries the viewer's session. Exported because it is the RULE, and a rule
 * this consequential should be assertable on its own rather than only through a fetch nobody can see.
 */
export function AvatarFetchCredentials(url: string): RequestCredentials {
  const origin = _originOf(url);
  if (!origin) return 'omit';
  if (typeof location !== 'undefined' && origin === location.origin) return 'include';
  return _credentialedOrigins.has(origin) ? 'include' : 'omit';
}

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

  // WHO IS ASKING, on every read. A photo on one of the host's own origins goes out with the viewer's
  // session so the server can authorize THEM; a provider's CDN keeps the anonymous fetch, which is both
  // correct and required (a credentialed request cannot be answered with `Access-Control-Allow-Origin:
  // *`). `mode:'cors'` matches the engine's own ImageCache either way — though the engine never issues
  // this request, because what we hand back is a blob.
  fetch(trimmed, { mode: 'cors', credentials: AvatarFetchCredentials(trimmed) })
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

/**
 * DROP EVERY VERDICT AND REVOKE EVERY OBJECT URL — call this when the VIEWER changes, and at no other
 * time.
 *
 * It used to be a test seam, and it stopped being one the moment an avatar became a per-viewer
 * authorization. The cache is keyed by URL, and a guarded avatar URL is now STABLE across viewers (it
 * names a profile, and nothing else — that is the point). So a tab that changes identity without
 * reloading would keep serving the previous viewer's decoded bytes for a profile the new viewer may have
 * no rung on: a cache hit answers before the server is ever asked. The web sign-in and sign-out paths
 * both navigate, which wipes the heap anyway; the native code exchange and a re-auth after an expiry do
 * not, and those are the ones this closes.
 *
 * It is NOT a "refresh the avatar" button. Re-fetching a provider CDN on demand is the exact fault
 * this module was written to end.
 */
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

// THE FIRST TERM IS THE PLATFORM, AND IT HAS TO BE. This guard was written to mean "browser" and spelled
// it as "has fetch and has createObjectURL" -- both of which Node has had for years, so under server
// rendering it was VACUOUSLY TRUE: the fetch ran, and `state` was set to a `blob:nodedata:<uuid>` that
// names a handle inside the render process and nothing else. That string was then serialized into the
// semantic mirror as an <img src>, so the crawler and the pre-hydration browser were both handed a dead
// image for every avatar on the page. `window` is the honest question -- Angular's server platform
// installs domino's DOM types but never a `window`, which is the same signal Jaui's own host uses -- and
// the minted URL can only outlive this function in a document a browser is going to load.
const _canLoad = (): boolean =>
  typeof window !== 'undefined'
  && typeof fetch === 'function'
  && typeof URL !== 'undefined'
  && typeof URL.createObjectURL === 'function';

// Re-exported so a consumer can name a rung without importing the union twice.
export { NONE as AvatarPhotoNone, LOADING as AvatarPhotoLoading, FAILED as AvatarPhotoFailed };
