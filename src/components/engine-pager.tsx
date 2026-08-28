"use client";

import { usePathname } from "next/navigation";

import { PagerLinks } from "@/components/pager";
import { engineNeighbours } from "@/lib/engine-nav";

/** Prev/next at the foot of an RP Engine page, in `lib/engine-nav.ts` order. */
export function EnginePager() {
  return <PagerLinks {...engineNeighbours(usePathname())} />;
}
