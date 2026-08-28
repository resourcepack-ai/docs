"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { engineNav, type EngineItem } from "@/lib/engine-nav";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * RP Engine's sidebar, driven by `lib/engine-nav.ts`.
 *
 * **The group headings never collapse; the pages with children do.** A group
 * is a label rather than a destination — collapsing one hides a whole subject
 * behind a word and makes the section a menu to navigate instead of a list to
 * scan. What is worth folding away is the detail hanging off a page: Armour
 * and Stats are things you read *while* reading Items, and thirty-four flat
 * entries is a wall.
 *
 * <p>They start closed, except the one holding the page you are on, which
 * opens itself. A nav that hides where the reader already is is the failure
 * mode of every collapsing sidebar, and it is worth the extra state to avoid.
 *
 * <p>Open state is per render rather than remembered across pages: a click
 * navigates, and arriving at the new page reopens exactly the path to it.
 * Persisting it would leave the sidebar slowly entirely open, which is the
 * wall again.
 */
export function EngineNavTree({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="RP Engine" className="flex flex-col gap-7">
      {engineNav.map((group) => (
        <div key={group.title}>
          <h2 className="mb-2.5 px-3 text-[0.68rem] font-semibold tracking-[0.09em] text-faint uppercase">
            {group.title}
          </h2>
          <ul className="border-line flex flex-col border-l">
            {group.items.map((item) =>
              item.items ? (
                <Parent key={item.href} item={item} onNavigate={onNavigate} />
              ) : (
                <Row key={item.href} item={item} onNavigate={onNavigate} />
              ),
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * A page with pages under it.
 *
 * <p>The title links and the chevron is its own button, because a click on the
 * word should open the page and a click on the arrow should not navigate at
 * all. One control doing both makes one of those two impossible.
 */
function Parent({ item, onNavigate }: { item: EngineItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const holdsCurrent =
    active || (item.items?.some((child) => child.href === pathname) ?? false);
  const [open, setOpen] = useState(holdsCurrent);

  return (
    <li className="-ml-px">
      <div
        className={cn(
          "flex items-center gap-1 border-l pr-2",
          active ? "border-brand" : "border-transparent",
        )}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex-1 py-[0.34rem] pl-[calc(0.75rem-1px)] text-[0.875rem] transition-colors",
            active ? "text-brand font-medium" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.title}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${item.title}`}
          className="text-faint hover:text-foreground shrink-0 rounded p-0.5 transition-colors"
        >
          <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        </button>
      </div>
      {open && (
        <ul className="border-line ml-3 flex flex-col border-l">
          {item.items?.map((child) => (
            <Row key={child.href} item={child} onNavigate={onNavigate} child />
          ))}
        </ul>
      )}
    </li>
  );
}

function Row({
  item,
  onNavigate,
  child,
}: {
  item: NavItem;
  onNavigate?: () => void;
  child?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === item.href;

  return (
    <li className="-ml-px">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "block border-l py-[0.34rem] pr-3 pl-[calc(0.75rem-1px)] transition-colors",
          child ? "text-[0.83rem]" : "text-[0.875rem]",
          active
            ? "border-brand text-brand font-medium"
            : "text-muted-foreground hover:text-foreground border-transparent hover:border-[#4a4a42]",
        )}
      >
        {item.title}
      </Link>
    </li>
  );
}
