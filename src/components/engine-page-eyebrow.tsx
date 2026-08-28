"use client";

import { usePathname } from "next/navigation";

import { engineGroupOf } from "@/lib/engine-nav";

/** The group label above an RP Engine page's h1. See PageEyebrow. */
export function EnginePageEyebrow() {
  const group = engineGroupOf(usePathname());
  if (!group) return null;

  return (
    <p className="text-brand mb-2 text-[0.72rem] font-semibold tracking-[0.09em] uppercase">
      {group}
    </p>
  );
}
