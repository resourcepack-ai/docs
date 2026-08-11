import type { ReactNode } from "react";

/**
 * Prose styling for the API Reference's written pages.
 *
 * A route group so it wraps these and not the generated endpoint pages, which
 * are tables and samples rather than prose and want the full width.
 */
export default function ApiGuideLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[46rem]">
      <article id="docs-article" className="text-prose">
        {children}
      </article>
    </div>
  );
}
