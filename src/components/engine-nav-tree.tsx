"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { engineNav } from "@/lib/engine-nav";
import { cn } from "@/lib/utils";

/**
 * RP Engine's sidebar, driven by `lib/engine-nav.ts`.
 *
 * A copy of {@link import("./nav-tree").NavTree} in markup and deliberately
 * not a shared component taking a tree as a prop: the two sections are free to
 * diverge, and a single component with a `tree` prop is one that grows a
 * `variant` prop the first time either of them wants something the other does
 * not. The markup is twenty lines.
 */
export function EngineNavTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="RP Engine" className="flex flex-col gap-7">
      {engineNav.map((group) => (
        <div key={group.title}>
          <h2 className="mb-2.5 px-3 text-[0.68rem] font-semibold tracking-[0.09em] text-faint uppercase">
            {group.title}
          </h2>
          <ul className="border-line flex flex-col border-l">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="-ml-px">
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block border-l py-[0.34rem] pr-3 pl-[calc(0.75rem-1px)] text-[0.875rem] transition-colors",
                      active
                        ? "border-brand text-brand font-medium"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:border-[#4a4a42]",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
