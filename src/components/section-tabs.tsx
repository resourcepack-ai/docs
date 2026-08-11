"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { API_ROOT } from "@/lib/api-nav";
import { cn } from "@/lib/utils";

/**
 * `Documentation | API Reference` — the two top-level modes.
 *
 * They are separate sections rather than a group in one sidebar, because they
 * are read differently: the docs are read in order by somebody learning the
 * product, and the reference is jumped into by somebody who already knows what
 * they want and needs the field list for one endpoint. One sidebar holding
 * both makes the shorter list harder to scan and buries thirteen endpoints
 * under a heading.
 */
const TABS = [
  { title: "Documentation", href: "/" },
  { title: "API Reference", href: API_ROOT },
];

export function SectionTabs() {
  const pathname = usePathname();
  // basePath ("/docs") is stripped from usePathname, so these compare bare.
  const inApi = pathname === API_ROOT || pathname.startsWith(`${API_ROOT}/`);

  return (
    <nav aria-label="Sections" className="flex items-center gap-6">
      {TABS.map((tab) => {
        const active = tab.href === API_ROOT ? inApi : !inApi;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px border-b-2 py-2.5 text-[0.875rem] transition-colors",
              active
                ? "text-foreground border-brand font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.title}
          </Link>
        );
      })}
    </nav>
  );
}
