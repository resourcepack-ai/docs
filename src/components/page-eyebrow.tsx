"use client";

import { usePathname } from "next/navigation";

import { navGroupOf } from "@/lib/nav";

/**
 * The small group label above each page's h1 ("Guides", "Reference", …).
 *
 * Derived from `lib/nav.ts` rather than written into the MDX, so a page
 * moving between groups can't leave a stale label behind.
 */
export function PageEyebrow() {
  const group = navGroupOf(usePathname());
  if (!group) return null;

  return (
    <p className="text-brand mb-2 text-[0.72rem] font-semibold tracking-[0.09em] uppercase">
      {group}
    </p>
  );
}
