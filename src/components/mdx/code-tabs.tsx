"use client";

import { Children, useCallback, useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One snippet, written twice — `<CodeTabs>` with a fenced block per language.
 *
 * ```mdx
 * <CodeTabs labels={["Java", "Kotlin"]}>
 * ```java
 * rpai.models().place(spot, "statue", PlaceOptions.defaults());
 * ```
 * ```kotlin
 * rpai.models().place(spot, "statue", PlaceOptions.defaults())
 * ```
 * </CodeTabs>
 * ```
 *
 * **The choice is shared and it sticks.** Picking Kotlin switches every block
 * on the page and every block on the next one, and survives a reload. A
 * developer's language is a fact about them, not about the paragraph they
 * happen to be reading, and making them re-pick it at each snippet is the
 * thing that makes tabbed docs annoying.
 *
 * Inactive panels stay mounted and are hidden with `hidden`, so the copy
 * button on each keeps working and in-page search still finds both.
 */

const STORAGE_KEY = "rpai-docs-lang";

/** Fallback when nothing has been chosen: the first label a group offers. */
let chosen: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): string | null {
  if (!hydrated) {
    hydrated = true;
    try {
      chosen = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode, or site data blocked. A per-session choice still works.
    }
  }
  return chosen;
}

function choose(label: string) {
  chosen = label;
  try {
    window.localStorage.setItem(STORAGE_KEY, label);
  } catch {
    // As above — the choice just doesn't outlive the tab.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useChosenLanguage(): string | null {
  return useSyncExternalStore(
    subscribe,
    read,
    // Server render: nobody has chosen anything, so every group shows its
    // first tab. That matches the first client paint, so there's no flash.
    () => null,
  );
}

export function CodeTabs({ labels, children }: { labels: string[]; children: ReactNode }) {
  const preferred = useChosenLanguage();
  const panels = Children.toArray(children);
  const onPick = useCallback((label: string) => choose(label), []);

  // A group that doesn't offer the preferred language falls back to its own
  // first tab rather than showing nothing — a page can document one language
  // for something the other has no equivalent of.
  const activeIndex = Math.max(0, preferred ? labels.indexOf(preferred) : 0);

  return (
    <div className="my-6">
      <div
        role="tablist"
        aria-label="Code language"
        className="border-border flex gap-1 border-b"
      >
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`tab-${label}`}
            aria-selected={index === activeIndex}
            aria-controls={`panel-${label}`}
            onClick={() => onPick(label)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3 py-1.5 text-[0.8rem] font-medium transition-colors",
              index === activeIndex
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {panels.map((panel, index) => (
        <div
          key={labels[index] ?? index}
          role="tabpanel"
          id={`panel-${labels[index]}`}
          aria-labelledby={`tab-${labels[index]}`}
          hidden={index !== activeIndex}
          // The figure inside carries its own top margin; the tab strip is
          // already the top edge, so take it back.
          className="[&>figure]:mt-0 [&>figure]:rounded-t-none"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
