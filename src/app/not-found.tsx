import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[70dvh] flex-col items-center justify-center px-6 pt-(--topbar-h) text-center">
        <p className="text-primary-ink mb-3 text-[0.72rem] font-semibold tracking-[0.09em] uppercase">
          404
        </p>
        <h1 className="mb-3 text-[1.75rem] font-semibold tracking-[-0.02em]">
          That page isn&apos;t in the docs
        </h1>
        <p className="text-muted-foreground max-w-md text-[0.95rem] leading-relaxed">
          It may have been renamed or never existed. Try the sidebar, or hit{" "}
          <kbd className="border-border text-foreground rounded border px-1.5 py-px text-[0.8rem]">
            ⌘K
          </kbd>{" "}
          to search.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground mt-7 rounded-lg px-4 py-2 text-[0.875rem] font-medium transition-colors hover:bg-[#66a0ff]"
        >
          Back to the introduction
        </Link>
      </main>
    </>
  );
}
