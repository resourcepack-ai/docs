import type { ReactNode } from "react";

import { NavTree } from "@/components/nav-tree";
import { PageEyebrow } from "@/components/page-eyebrow";
import { Pager } from "@/components/pager";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { TableOfContents } from "@/components/table-of-contents";

/**
 * The docs chrome: fixed top bar, sticky sidebar, article, sticky TOC.
 *
 * Every .mdx page under (docs) renders as `children` here — pages are pure
 * content and never repeat the furniture. The three columns collapse in
 * order: the TOC goes below `xl`, the sidebar goes below `lg` (into the
 * header's drawer), leaving one readable column on a phone.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData />
      <SiteHeader />
      <div className="pt-(--topbar-h)">
        <div className="mx-auto flex max-w-[100rem] px-4 sm:px-6">
          <aside className="border-line hidden w-(--sidebar-w) shrink-0 lg:block lg:border-r">
            <div className="sticky top-(--topbar-h) max-h-[calc(100dvh-var(--topbar-h))] overflow-y-auto py-9 pr-5">
              <NavTree />
            </div>
          </aside>

          <main className="min-w-0 flex-1 py-10 lg:px-10 xl:px-12">
            <div className="mx-auto max-w-[46rem]">
              {/* #docs-article is what TableOfContents scans for headings. */}
              <article id="docs-article" className="text-prose">
                <PageEyebrow />
                {children}
              </article>
              <Pager />
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
