"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The sidebar link list, driven entirely by `lib/nav.ts`.
 *
 * Rendered twice — once in the fixed desktop rail, once inside the mobile
 * drawer — so it takes an `onNavigate` to let the drawer close itself on a
 * click. Active state is a left rail marker rather than a filled pill:
 * quieter, and it keeps the group's vertical line unbroken.
 */
export function NavTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="flex flex-col gap-7">
      {nav.map((group) => (
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
