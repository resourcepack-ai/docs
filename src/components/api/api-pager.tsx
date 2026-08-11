import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { apiNavNeighbours } from "@/lib/api-nav";

/**
 * Previous/next within the API Reference only.
 *
 * Its own component rather than the docs `Pager` because it walks a different
 * tree — the reference's order is groups of endpoints, and a reader stepping
 * through it should not fall out into the documentation sidebar's next page.
 */
export function ApiPager({ href }: { href: string }) {
  const { previous, next } = apiNavNeighbours(href);
  if (!previous && !next) return null;

  return (
    <nav className="border-line mt-14 flex items-stretch justify-between gap-4 border-t pt-6">
      {previous ? (
        <Link
          href={previous.href}
          className="border-line hover:border-brand/60 group flex min-w-0 flex-1 flex-col rounded-lg border px-4 py-3 transition-colors"
        >
          <span className="text-faint mb-0.5 flex items-center gap-1 text-[0.72rem]">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="text-muted-foreground group-hover:text-foreground truncate text-[0.9rem] transition-colors">
            {previous.title}
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="border-line hover:border-brand/60 group flex min-w-0 flex-1 flex-col items-end rounded-lg border px-4 py-3 text-right transition-colors"
        >
          <span className="text-faint mb-0.5 flex items-center gap-1 text-[0.72rem]">
            Next <ArrowRight className="size-3" />
          </span>
          <span className="text-muted-foreground group-hover:text-foreground truncate text-[0.9rem] transition-colors">
            {next.title}
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </nav>
  );
}
