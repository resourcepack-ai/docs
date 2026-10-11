"use client";

import { usePathname } from "next/navigation";

import { PagerLinks } from "@/components/pager";
import { pluginsNeighbours } from "@/lib/plugins-nav";

/** Prev/next at the foot of a Plugins page, in `lib/plugins-nav.ts` order. */
export function PluginsPager() {
  return <PagerLinks {...pluginsNeighbours(usePathname())} />;
}
