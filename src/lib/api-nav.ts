import { operations, type Operation } from "@/lib/openapi";

// The API Reference's own navigation, built from the spec.
//
// Deliberately NOT part of `lib/nav.ts`. That file is the Documentation
// sidebar's single source of truth and is hand-written because prose pages are
// hand-written; this one is derived, because an endpoint that exists should
// appear without anybody remembering to list it. The two are separate trees
// behind separate top-level tabs, which is the whole point of the split.

export interface ApiNavItem {
  title: string;
  href: string;
  method?: string;
  /** False when a feature flag has the endpoint switched off. */
  available?: boolean;
  description?: string;
  keywords?: string[];
}

export interface ApiNavGroup {
  title: string;
  items: ApiNavItem[];
}

export const API_ROOT = "/api-reference";

/** `generateTexture` -> `generate-texture`, which is the URL segment. */
export function slugFor(operationId: string): string {
  return operationId.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function hrefFor(operation: Operation): string {
  return `${API_ROOT}/${slugFor(operation.id)}`;
}

/**
 * The prose pages that open the section, before the generated endpoints.
 *
 * Hand-listed because they're hand-written — authentication, errors and the
 * asynchronous model are decisions somebody made, not facts derivable from a
 * schema.
 */
const GUIDES: ApiNavItem[] = [
  {
    title: "Overview",
    href: API_ROOT,
    description: "Base URL, getting a key, and how a call is authenticated.",
    keywords: ["api", "rest", "http", "bearer", "auth", "base url", "curl"],
  },
  {
    title: "Jobs and polling",
    href: `${API_ROOT}/jobs`,
    description: "Why generation is asynchronous, and how to wait for a result.",
    keywords: ["job", "poll", "async", "status", "generating", "ready", "timeout"],
  },
  {
    title: "Errors",
    href: `${API_ROOT}/errors`,
    description: "The error envelope, and every code you can branch on.",
    keywords: ["error", "code", "401", "402", "403", "404", "409", "envelope"],
  },
  {
    title: "Key history",
    href: `${API_ROOT}/history`,
    description: "What each key records, and what it deliberately doesn't.",
    keywords: ["history", "audit", "log", "usage", "credits", "revoke"],
  },
];

// Group order is fixed rather than taken from the spec's key order: a reader
// wants packs before the things that write into them, and jobs last because
// nothing sends you there until something has been generated.
const GROUP_ORDER = ["Packs", "Generating", "Jobs"];

export const apiNav: ApiNavGroup[] = [
  { title: "Get started", items: GUIDES },
  ...GROUP_ORDER.map((title) => ({
    title,
    items: operations
      .filter((operation) => operation.group === title)
      .map((operation) => ({
        title: operation.summary,
        href: hrefFor(operation),
        method: operation.method,
        available: operation.available,
        description: operation.summary,
        keywords: [operation.path, operation.id, operation.method.toLowerCase()],
      })),
  })).filter((group) => group.items.length > 0),
];

/** Every entry in sidebar order — what the pager and the search index walk. */
export const flatApiNav: ApiNavItem[] = apiNav.flatMap((group) => group.items);

export function apiNavNeighbours(href: string): { previous?: ApiNavItem; next?: ApiNavItem } {
  const index = flatApiNav.findIndex((item) => item.href === href);
  if (index === -1) return {};
  return {
    previous: index > 0 ? flatApiNav[index - 1] : undefined,
    next: index < flatApiNav.length - 1 ? flatApiNav[index + 1] : undefined,
  };
}

export function apiNavGroupOf(href: string): string | undefined {
  return apiNav.find((group) => group.items.some((item) => item.href === href))?.title;
}
