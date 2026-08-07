/**
 * The basePath this app is served under, and the one helper that applies it.
 *
 * **Next does not prefix everything.** `next/link` hrefs and `_next/*` bundle
 * URLs get the basePath for free; a raw string does not, and neither does
 * `next/image`'s `src` — that one emits exactly what you hand it. So a bare
 * "/logo.svg" requests the *apex*, which is landing's Worker, not ours.
 *
 * That failure is close to invisible in production: landing serves a
 * byte-identical logo.svg, so the image loads and looks right while pointing
 * at the wrong app. It only shows up locally, where nothing is serving the
 * apex and the request 404s on every page load. Both the header mark and the
 * metadata favicon were doing this.
 *
 * Anything you write as a literal path — image src, metadata icons, a
 * hand-built absolute URL — goes through `asset()` or names BASE_PATH.
 * Keeping the string in one place is what stops the next one being wrong.
 */
export const BASE_PATH = "/docs";

/** A path in `public/`, addressed the way the browser has to ask for it. */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
