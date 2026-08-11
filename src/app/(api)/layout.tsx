import type { ReactNode } from "react";

import { ApiNavTree } from "@/components/api-nav-tree";
import { SiteHeader } from "@/components/site-header";

/**
 * The API Reference chrome.
 *
 * Deliberately two columns rather than the docs' three: an endpoint page
 * already carries its sample in a sticky right-hand column, and a table of
 * contents over four generated headings would be a third rail competing with
 * it. The guide pages under this section are short for the same reason.
 */
export default function ApiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="pt-(--topbar-h)">
        <div className="mx-auto flex max-w-[100rem] px-4 sm:px-6">
          <aside className="border-line hidden w-(--sidebar-w) shrink-0 lg:block lg:border-r">
            <div className="sticky top-(--topbar-h) max-h-[calc(100dvh-var(--topbar-h))] overflow-y-auto py-9 pr-5">
              <ApiNavTree />
            </div>
          </aside>

          <main className="min-w-0 flex-1 py-10 lg:px-10 xl:px-12">{children}</main>
        </div>
      </div>
    </>
  );
}
