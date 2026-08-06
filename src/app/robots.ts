import type { MetadataRoute } from "next";
import { SITE_URL } from "./sitemap";

/**
 * Served at /robots.txt, mainly to advertise the sitemap. Everything on this
 * site is public prerendered content and there are no API routes, so there is
 * genuinely nothing to disallow — don't invent a rule to make it look busier.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
