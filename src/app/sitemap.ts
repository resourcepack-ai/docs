import type { MetadataRoute } from "next";
import { flatNav } from "@/lib/nav";

export const SITE_URL = "https://docs.resourcepack.ai";

/**
 * Served at /sitemap.xml, derived from `lib/nav.ts` — the same list the
 * sidebar, the ⌘K index and the pager read. That's the point: adding a page
 * is already "create the .mdx, add it to nav.ts", and this makes the sitemap
 * fall out of step two instead of becoming a third step nobody remembers.
 *
 * A page missing from nav.ts is invisible to the site's own navigation, so
 * leaving it out of the sitemap too is the consistent answer, not a gap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return flatNav.map((item) => ({
    // nav hrefs are root-relative and the index is "/" — trim it so the home
    // page doesn't come out as "https://docs.resourcepack.ai/".
    url: item.href === "/" ? SITE_URL : `${SITE_URL}${item.href}`,
    changeFrequency: "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
