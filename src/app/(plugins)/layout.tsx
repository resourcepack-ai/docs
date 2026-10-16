import type { ReactNode } from "react";

import { NavTree } from "@/components/nav-tree";
import { PluginsPageEyebrow } from "@/components/plugins-page-eyebrow";
import { PluginsPager } from "@/components/plugins-pager";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { TableOfContents } from "@/components/table-of-contents";
import { pluginsNav } from "@/lib/plugins-nav";

/**
 * The Plugins section's chrome.
 *
 * The docs' three columns, like RP Engine's: one long page per plugin, with
 * commands, permissions and YAML under a dozen headings, which is what a table
 * of contents is for. Only the tree and the pager differ, because they walk
 * `lib/plugins-nav.ts`.
 */
export default function PluginsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData />
      <SiteHeader />
      <div className="pt-(--topbar-h)">
        <div className="mx-auto flex max-w-[100rem] px-4 sm:px-6">
          <aside data-nav-rail className="border-line hidden w-(--sidebar-w) shrink-0 lg:block lg:border-r">
            <div className="sticky top-(--topbar-h) max-h-[calc(100dvh-var(--topbar-h))] overflow-y-auto py-9 pr-5">
              <NavTree groups={pluginsNav} label="Plugins" />
            </div>
          </aside>

          <main className="min-w-0 flex-1 py-10 lg:px-10 xl:px-12">
            <div className="mx-auto max-w-[46rem]">
              {/* #docs-article is what TableOfContents scans for headings. */}
              <article id="docs-article" className="text-prose">
                <PluginsPageEyebrow />
                {children}
              </article>
              <PluginsPager />
            </div>
          </main>

          <aside data-toc className="hidden w-(--toc-w) shrink-0 xl:block">
            <div className="sticky top-(--topbar-h) max-h-[calc(100dvh-var(--topbar-h))] overflow-y-auto py-10 pl-2">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
