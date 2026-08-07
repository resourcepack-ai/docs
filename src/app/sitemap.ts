import type { MetadataRoute } from "next";
import { flatNav } from "@/lib/nav";
import { BASE_PATH } from "@/lib/base-path";

/**
 * Where these pages live publicly. Includes the basePath, because a sitemap
 * publishes absolute URLs and Next does not prefix strings you build yourself.
 */
export const SITE_URL = `https://resourcepack.ai${BASE_PATH}`;

/**
 * Served at /docs/sitemap.xml, derived from `lib/nav.ts` — the same list the
 * sidebar, the ⌘K index and the pager read. That's the point: adding a page
 * is already "create the .mdx, add it to nav.ts", and this makes the sitemap
 * fall out of step two instead of becoming a third step nobody remembers.
 *
 * A page missing from nav.ts is invisible to the site's own navigation, so
 * leaving it out of the sitemap too is the consistent answer, not a gap.
 *
 * There is deliberately no robots.ts beside this file. A robots.txt is only
 * honoured at the root of a host, and this app no longer owns one — so
 * landing's robots.ts is what points crawlers at this sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return flatNav.map((item) => ({
    // nav hrefs are root-relative and the index is "/" — trim it so the home
    // page doesn't come out as "https://resourcepack.ai/docs/".
    url: item.href === "/" ? SITE_URL : `${SITE_URL}${item.href}`,
    changeFrequency: "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
