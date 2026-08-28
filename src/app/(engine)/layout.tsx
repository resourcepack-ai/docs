import type { ReactNode } from "react";

import { EngineNavTree } from "@/components/engine-nav-tree";
import { EnginePageEyebrow } from "@/components/engine-page-eyebrow";
import { EnginePager } from "@/components/engine-pager";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { TableOfContents } from "@/components/table-of-contents";

/**
 * RP Engine's chrome.
 *
 * The same three columns as the docs rather than the API Reference's two:
 * these are long prose pages full of YAML with a dozen headings each, which
 * is exactly what a table of contents is for. Only the sidebar's tree and the
 * pager differ, because they walk a different list.
 */
export default function EngineLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData />
      <SiteHeader />
      <div className="pt-(--topbar-h)">
        <div className="mx-auto flex max-w-[100rem] px-4 sm:px-6">
          <aside className="border-line hidden w-(--sidebar-w) shrink-0 lg:block lg:border-r">
            <div className="sticky top-(--topbar-h) max-h-[calc(100dvh-var(--topbar-h))] overflow-y-auto py-9 pr-5">
              <EngineNavTree />
            </div>
          </aside>

          <main className="min-w-0 flex-1 py-10 lg:px-10 xl:px-12">
            <div className="mx-auto max-w-[46rem]">
              {/* #docs-article is what TableOfContents scans for headings. */}
              <article id="docs-article" className="text-prose">
                <EnginePageEyebrow />
                {children}
              </article>
              <EnginePager />
            </div>
          </main>

          <aside className="hidden w-(--toc-w) shrink-0 xl:block">
            <div className="sticky top-(--topbar-h) max-h-[calc(100dvh-var(--topbar-h))] overflow-y-auto py-10 pl-2">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
