import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cardIcons, type CardIconName } from "@/components/mdx/icons";
import { cn } from "@/lib/utils";

/** A grid of `<Card>`s. Two columns on anything wider than a phone. */
export function CardGroup({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "my-6 grid gap-3",
        cols === 1 && "sm:grid-cols-1",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

/**
 * A link tile. `href` may be internal ("/quickstart") or external — the
 * latter opens in a new tab and gets the arrow affordance automatically,
 * so pages never have to remember `target`.
 */
export function Card({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href?: string;
  icon?: CardIconName;
  children?: ReactNode;
}) {
  const Icon = icon ? cardIcons[icon] : undefined;
  const external = Boolean(href?.startsWith("http"));

  const body = (
    <>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="text-primary size-4 shrink-0" strokeWidth={2} />}
        <span className="group-hover:text-primary-ink text-[0.92rem] font-semibold transition-colors">
          {title}
        </span>
        {external && <ArrowUpRight className="text-faint ml-auto size-3.5" />}
      </div>
      {children && (
        <div className="text-muted-foreground mt-1.5 text-[0.85rem] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      )}
    </>
  );

  const className =
    "group border-border bg-card/40 hover:border-primary/50 hover:bg-card block rounded-lg border px-4 py-3.5 transition-colors";

  if (!href) return <div className={className}>{body}</div>;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
