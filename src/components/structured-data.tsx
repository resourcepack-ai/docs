"use client";

import { usePathname } from "next/navigation";

import { flatApiNav } from "@/lib/api-nav";
import { engineItems } from "@/lib/engine-nav";
import { BASE_PATH } from "@/lib/base-path";
import { flatNav } from "@/lib/nav";

/**
 * schema.org JSON-LD for the current page.
 *
 * **What this is honestly for.** It helps search engines classify these pages
 * as technical documentation and gives them a title, description and canonical
 * URL that don't depend on parsing the layout. Its effect on whether an
 * assistant retrieves or cites a page is unproven — the things that actually
 * matter there are the boring ones this site already does: prerendered HTML,
 * one stable URL per topic, and a machine-readable spec. Treat this as SEO
 * hygiene, not as an AI tactic.
 *
 * Derived from the nav manifests rather than written per page, so it can't
 * disagree with the sidebar and a new page gets it for free. A client component
 * only because it needs the pathname — every page here is prerendered, so the
 * script tag is in the static HTML, not injected later.
 */
const SITE = "https://resourcepack.ai";

export function StructuredData() {
  const pathname = usePathname();
  const entry = [...flatNav, ...engineItems, ...flatApiNav].find((item) => item.href === pathname);
  if (!entry) return null;

  const url = `${SITE}${BASE_PATH}${entry.href === "/" ? "" : entry.href}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: entry.title,
    ...(entry.description ? { description: entry.description } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: {
      "@type": "WebSite",
      name: "ResourcePack AI Docs",
      url: `${SITE}${BASE_PATH}`,
    },
    publisher: {
      "@type": "Organization",
      name: "ResourcePack AI",
      url: SITE,
    },
    inLanguage: "en",
  };

  return (
    <script
      type="application/ld+json"
      // The value is built from our own manifests, not from anything a reader
      // supplies, so there is no untrusted string reaching this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
