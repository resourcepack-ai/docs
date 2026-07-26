"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Heading = { id: string; text: string; level: number };

/**
 * "On this page", read out of the rendered DOM rather than from a build-time
 * heading export.
 *
 * The trade-off: it costs one pass over the article on mount instead of
 * nothing, but it can never disagree with what's actually on screen, and
 * it needs no remark plugin, no `export const toc`, and no discipline from
 * whoever writes the MDX. Heading ids come from rehype-slug (see
 * next.config.ts) — headings without one are skipped rather than linked to
 * a dead anchor.
 */
export function TableOfContents() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | undefined;

    // Scanned on the frame after the effect fires: the new page's article
    // is committed by then whichever way it arrived (fresh load or client
    // navigation), and reading layout off the critical path keeps a route
    // change from paying for it.
    const frame = requestAnimationFrame(() => {
      const article = document.getElementById("docs-article");
      if (!article) return;

      const found = Array.from(article.querySelectorAll<HTMLElement>("h2[id], h3[id]")).map(
        (element) => ({
          id: element.id,
          text: element.textContent ?? "",
          level: Number(element.tagName[1]),
        }),
      );
      setHeadings(found);
      setActiveId(found[0]?.id ?? null);

      if (found.length === 0) return;

      // Highlight the topmost heading that's scrolled past the header. The
      // bottom margin keeps the last section from flickering active and
      // inactive at the end of a short page.
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActiveId(visible[0].target.id);
        },
        { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
      );

      for (const heading of found) {
        const element = document.getElementById(heading.id);
        if (element) observer.observe(element);
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-[0.82rem]">
      <h2 className="text-faint mb-2.5 text-[0.68rem] font-semibold tracking-[0.09em] uppercase">
        On this page
      </h2>
      <ul className="border-line flex flex-col border-l">
        {headings.map((heading) => (
          <li key={heading.id} className="-ml-px">
            <a
              href={`#${heading.id}`}
              className={cn(
                "block border-l py-[0.28rem] leading-snug transition-colors",
                heading.level === 3 ? "pl-6" : "pl-3",
                heading.id === activeId
                  ? "border-primary text-primary-ink"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
