import Script from "next/script";

/**
 * Cloudflare Web Analytics, shared by every web app in the product.
 *
 * ONE site token for landing (resourcepack.ai), the docs (resourcepack.ai/docs)
 * and studio (studio.resourcepack.ai): the Cloudflare dashboard's site is the
 * zone, and it splits by hostname and path on its own. Cookie-less by design,
 * and it sets no identifier at all, which is what lets the privacy policy keep
 * saying there are no tracking cookies. Referrers, countries, paths, devices
 * and Core Web Vitals; no user journeys and no custom events. It replaced a
 * GA4 tag that Brave and every ad blocker swallowed whole — the beacon is
 * blocked far less, which for this audience was the whole decision.
 *
 * A literal, not an env var: NEXT_PUBLIC_* is inlined at build time anyway,
 * and the token is public — it's in the HTML of every page. Empty means "off",
 * which is how a checkout without the token and every local dev server behave.
 *
 * **One of three copies** — landing, docs and studio each hold this file,
 * because they are separate Workers with no shared package (see the root
 * AGENTS.md list of duplicated files). Change the token here, change all three.
 */
export const CF_BEACON_TOKEN = "e1d6205f080340d784158ab953a3bec8";

export function CloudflareAnalytics() {
  if (!CF_BEACON_TOKEN) return null;
  // The beacon only reports for the hostnames registered on the site in the
  // dashboard, so localhost and studio's staging stay out of the numbers
  // without a check here.
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
    />
  );
}
