"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { API_ROOT } from "@/lib/api-nav";
import { ENGINE_ROOT, inEngine } from "@/lib/engine-nav";
import { PLUGINS_ROOT, inPlugins } from "@/lib/plugins-nav";
import { cn } from "@/lib/utils";

/**
 * `Documentation | API | RP Engine | Plugins` — the four top-level
 * modes.
 *
 * Separate sections rather than groups in one sidebar, because they are read
 * by different people at different times. The docs are read in order by
 * somebody learning the web app. RP Engine is read by somebody with a server
 * console open and no browser tab of ours signed in. The reference is jumped
 * into by somebody who already knows what they want and needs the field list
 * for one endpoint. One sidebar holding all of them makes every list harder to
 * scan and buries the shortest under a heading.
 *
 * Plugins sits beside RP Engine rather than inside it: it holds our other
 * server plugins, none of which needs RP Engine installed, so filing them
 * under it would say something false about what a reader has to install.
 */
const TABS = [
  { title: "Documentation", href: "/" },
  { title: "API", href: API_ROOT },
  { title: "RP Engine", href: ENGINE_ROOT },
  { title: "Plugins", href: PLUGINS_ROOT },
];

export function SectionTabs() {
  const pathname = usePathname();
  // basePath ("/docs") is stripped from usePathname, so these compare bare.
  const inApi = pathname === API_ROOT || pathname.startsWith(`${API_ROOT}/`);
  const engine = inEngine(pathname);
  const plugins = inPlugins(pathname);

  return (
    <nav aria-label="Sections" className="flex items-center gap-6">
      {TABS.map((tab) => {
        const active =
          tab.href === API_ROOT
            ? inApi
            : tab.href === ENGINE_ROOT
              ? engine
              : tab.href === PLUGINS_ROOT
                ? plugins
                : !inApi && !engine && !plugins;
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
