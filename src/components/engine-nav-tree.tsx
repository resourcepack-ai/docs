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
 * Thirty pages in seven groups, so **everything with children collapses and
 * starts closed**. A flat list of thirty is a wall; closed, the whole section
 * is seven lines somebody can take in at once and open the one they want.
 *
 * <p>The one thing that must never be closed is where you already are. Both
 * the group holding the current page and the parent holding it open
 * themselves, so the sidebar always shows the reader their own position —
 * that is the failure mode of every collapsing nav, and it is worth the extra
 * state to avoid.
 *
 * <p>Open state is per render rather than remembered across pages: a click
 * navigates, and arriving at the new page reopens exactly the path to it.
 * Persisting it would mean the sidebar slowly ends up entirely open, which is
 * the wall again.
 */
export function EngineNavTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const holdsCurrent = (item: EngineItem) =>
    item.href === pathname || (item.items?.some((child) => child.href === pathname) ?? false);

  return (
    <nav aria-label="RP Engine" className="flex flex-col gap-1.5">
      {engineNav.map((group) => (
        <Section
          key={group.title}
          title={group.title}
          heading
          open={group.items.some(holdsCurrent)}
        >
          <ul className="border-line mt-1 flex flex-col border-l">
            {group.items.map((item) =>
              item.items ? (
                <li key={item.href}>
                  <Section title={item.title} href={item.href} open={holdsCurrent(item)}>
                    <ul className="border-line ml-3 flex flex-col border-l">
                      {item.items.map((child) => (
                        <Row key={child.href} item={child} onNavigate={onNavigate} child />
                      ))}
                    </ul>
                  </Section>
                </li>
              ) : (
                <Row key={item.href} item={item} onNavigate={onNavigate} />
              ),
            )}
          </ul>
        </Section>
      ))}
    </nav>
  );
}

/**
 * A heading that opens and closes.
 *
 * <p>`href` turns the label itself into a link, for a parent that is a page in
 * its own right — "Items" is both a heading and something to read. The chevron
 * is then its own button, because a click on the word should go to the page
 * and a click on the arrow should not navigate at all. Rolling both into one
 * control makes one of those two behaviours impossible.
 */
function Section({
  title,
  href,
  heading,
  open: openInitially,
  children,
}: {
  title: string;
  href?: string;
  heading?: boolean;
  open: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(openInitially);
  const active = href === pathname;

  const label = cn(
    "flex-1 text-left transition-colors",
    heading
      ? "text-[0.68rem] font-semibold tracking-[0.09em] text-faint uppercase hover:text-muted-foreground"
      : "text-[0.875rem]",
    !heading && active
      ? "text-brand font-medium"
      : !heading && "text-muted-foreground hover:text-foreground",
  );

  return (
    <div className={cn(heading ? "" : "-ml-px border-l", !heading && active ? "border-brand" : "border-transparent")}>
      <div className={cn("flex items-center gap-1", heading ? "px-3 py-1.5" : "py-[0.34rem] pr-2 pl-[calc(0.75rem-1px)]")}>
        {href ? (
          <Link href={href} className={label} aria-current={active ? "page" : undefined}>
            {title}
          </Link>
        ) : (
          <button type="button" onClick={() => setOpen(!open)} className={label}>
            {title}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
          className="text-faint hover:text-foreground shrink-0 rounded p-0.5 transition-colors"
        >
          <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        </button>
      </div>
      {open && children}
    </div>
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
