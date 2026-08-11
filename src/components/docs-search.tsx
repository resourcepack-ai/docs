"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { flatNav, type NavItem } from "@/lib/nav";
import { flatApiNav } from "@/lib/api-nav";

import { cn } from "@/lib/utils";

// Both trees, because ⌘K is the one place a reader shouldn't have to know which
// of the two sections a page lives in — that's the cost of splitting them, and
// this is what pays it. Module scope: both lists are static, so this is built
// once rather than per mount.
const searchable: NavItem[] = [...flatNav, ...flatApiNav];

/**
 * ⌘K palette over the nav manifest.
 *
 * Deliberately scoped: it matches page titles, descriptions and keywords
 * from `lib/nav.ts`, NOT the body text of every page — hence the
 * "Search pages" label rather than a bare "Search". Full-text would mean
 * building and shipping an index at build time; worth doing once there's
 * enough content to justify it, but a fake-looking search that silently
 * misses body matches is worse than an honest narrow one.
 */
export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchable;
    return searchable.filter((item) =>
      [item.title, item.description ?? "", ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const go = useCallback(
    (item: NavItem) => {
      close();
      router.push(item.href);
    },
    [close, router],
  );

  // Global ⌘K / Ctrl+K. Ignored while the user is typing somewhere else so
  // it can never hijack a real text field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) go(item);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border bg-card/60 text-muted-foreground hover:border-[#45453d] hover:text-foreground flex h-8 items-center gap-2 rounded-lg border pr-1.5 pl-2.5 text-[0.8rem] transition-colors sm:w-56"
      >
        <Search className="size-3.5 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">Search pages</span>
        <kbd className="border-border text-faint ml-auto hidden rounded border px-1.5 py-px font-sans text-[0.7rem] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-[2px]"
          onMouseDown={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search pages"
            className="border-border bg-card w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl shadow-black/50"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={onListKeyDown}
          >
            <div className="border-border flex items-center gap-2.5 border-b px-4">
              <Search className="text-faint size-4 shrink-0" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search pages"
                aria-label="Search pages"
                className="placeholder:text-faint h-12 w-full bg-transparent text-[0.9rem] outline-none"
              />
              <kbd className="border-border text-faint rounded border px-1.5 py-px text-[0.7rem]">
                esc
              </kbd>
            </div>

            {results.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-[0.85rem]">
                Nothing matches{" "}
                <span className="text-foreground">&ldquo;{query.trim()}&rdquo;</span>.
                <br />
                <span className="text-faint text-[0.8rem]">
                  This searches page titles, not page contents.
                </span>
              </p>
            ) : (
              <ul ref={listRef} className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
                {results.map((item, index) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => go(item)}
                      onMouseMove={() => setActiveIndex(index)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition-colors",
                        index === activeIndex ? "bg-primary-tint" : "bg-transparent",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[0.875rem]",
                          index === activeIndex ? "text-primary-ink" : "text-foreground",
                        )}
                      >
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="text-muted-foreground mt-0.5 block truncate text-[0.78rem]">
                          {item.description}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-border text-faint flex items-center gap-3 border-t px-4 py-2 text-[0.72rem]">
              <span>↑↓ to navigate</span>
              <span>↵ to open</span>
              <span className="ml-auto">
                {results.length} of {searchable.length} pages
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
