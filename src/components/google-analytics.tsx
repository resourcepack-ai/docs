import Script from "next/script";

/**
 * The GA4 measurement id, shared by every web app in the product.
 *
 * ONE property for landing (resourcepack.ai), the docs (resourcepack.ai/docs)
 * and studio (studio.resourcepack.ai) on purpose: GA4 parks its `_ga` cookie on
 * the registrable domain, so a visitor who reads the landing page and then
 * signs up in studio is one user with one session and one acquisition source,
 * rather than a "referral from resourcepack.ai" that hides where they really
 * came from. Which app they're in is the hostname on every hit — filter by it
 * in GA rather than splitting properties. (Add `resourcepack.ai` to the
 * property's unwanted-referrals list so the hop between apps is never counted
 * as a source.)
 *
 * A literal, not an env var: NEXT_PUBLIC_* is inlined at build time anyway,
 * and the id is public — it's in the HTML of every page. Empty means "off",
 * which is how a checkout without the id and every local dev server behave.
 *
 * **One of three copies** — landing, docs and studio each hold this file,
 * because they are separate Workers with no shared package (see the root
 * AGENTS.md list of duplicated files). Change the id here, change all three.
 */
export const GA_MEASUREMENT_ID = "G-LYPEZ2KR6E";

/**
 * Hostnames that report. A Worker preview, `localhost` and studio's staging
 * would otherwise pollute the numbers with the owner's own testing — checked
 * in the browser, since these apps' HTML is edge-cached and one build serves
 * every host.
 */
const REPORTING_HOSTS = ["resourcepack.ai", "www.resourcepack.ai", "studio.resourcepack.ai"];

/**
 * The gtag snippet, GA4's standard one. Renders nothing without an id.
 *
 * `page_view` fires on load, and Enhanced Measurement (on by default in a GA4
 * web stream) fires it again on every `history.pushState`, which is how the
 * Next router navigates — so client-side page changes are counted with no
 * router hook here. Origins are automatic too: the referrer and any
 * `utm_*` on the landing URL become the session's source/medium. The one
 * thing GA can't see on its own is the affiliate `?ref=` code, so it rides
 * along on every hit as `affiliate_ref` (register it as a custom dimension
 * in the property to report on it).
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  const id = JSON.stringify(GA_MEASUREMENT_ID);
  const hosts = JSON.stringify(REPORTING_HOSTS);
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`
        if (${hosts}.includes(location.hostname)) {
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          var ref = new URLSearchParams(location.search).get('ref');
          gtag('config', ${id}, ref ? { affiliate_ref: ref } : {});
        }
      `}</Script>
    </>
  );
}
