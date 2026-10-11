"use client";

import { usePathname } from "next/navigation";

import { pluginsGroupOf } from "@/lib/plugins-nav";

/** The group label above a Plugins page's h1. See PageEyebrow. */
export function PluginsPageEyebrow() {
  const group = pluginsGroupOf(usePathname());
  if (!group) return null;

  return (
    <p className="text-brand mb-2 text-[0.72rem] font-semibold tracking-[0.09em] uppercase">
      {group}
    </p>
  );
}
