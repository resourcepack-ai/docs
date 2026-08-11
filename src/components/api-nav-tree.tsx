"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { apiNav } from "@/lib/api-nav";
import { cn } from "@/lib/utils";

/**
 * The API Reference sidebar — same rail-marker treatment as the docs tree, but
 * every endpoint entry leads with its method.
 *
 * The badge is the point: a reference is scanned, not read, and the method is
 * half of what identifies an endpoint. Reading "Create pack" and "Get pack" in
 * a list tells you less at a glance than POST and GET beside them.
 */
const METHOD_COLOURS: Record<string, string> = {
  GET: "text-cyan",
  POST: "text-brand",
};

export function ApiNavTree({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="API reference" className="flex flex-col gap-7">
      {apiNav.map((group) => (
        <div key={group.title}>
          <h2 className="text-faint mb-2.5 px-3 text-[0.68rem] font-semibold tracking-[0.09em] uppercase">
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
                      "flex items-center gap-2 border-l py-[0.34rem] pr-3 pl-[calc(0.75rem-1px)] text-[0.875rem] transition-colors",
                      active
                        ? "border-brand text-brand font-medium"
                        : "text-muted-foreground hover:text-foreground border-transparent hover:border-[#4a4a42]",
                    )}
                  >
                    {item.method && (
                      <span
                        className={cn(
                          "w-[2.4rem] shrink-0 font-mono text-[0.6rem] font-semibold tracking-[0.04em]",
                          METHOD_COLOURS[item.method] ?? "text-muted-foreground",
                        )}
                      >
                        {item.method}
                      </span>
                    )}
                    <span className={cn("min-w-0 truncate", item.available === false && "opacity-55")}>
                      {item.title}
                    </span>
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
