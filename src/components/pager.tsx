"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navNeighbours } from "@/lib/nav";

/** Prev/next links at the foot of a page, in `lib/nav.ts` order. */
export function Pager() {
  const pathname = usePathname();
  const { previous, next } = navNeighbours(pathname);

  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Pagination"
      className="border-line mt-14 grid gap-3 border-t pt-6 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={previous.href}
          className="border-border hover:border-primary/50 hover:bg-card group flex flex-col gap-1 rounded-lg border px-4 py-3 transition-colors"
        >
          <span className="text-faint flex items-center gap-1.5 text-[0.72rem] tracking-wide uppercase">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="group-hover:text-primary-ink text-[0.9rem] font-medium transition-colors">
            {previous.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={next.href}
          className="border-border hover:border-primary/50 hover:bg-card group flex flex-col items-end gap-1 rounded-lg border px-4 py-3 text-right transition-colors sm:col-start-2"
        >
          <span className="text-faint flex items-center gap-1.5 text-[0.72rem] tracking-wide uppercase">
            Next <ArrowRight className="size-3" />
          </span>
          <span className="group-hover:text-primary-ink text-[0.9rem] font-medium transition-colors">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
