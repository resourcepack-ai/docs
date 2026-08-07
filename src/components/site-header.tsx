"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { DocsSearch } from "@/components/docs-search";
import { NavTree } from "@/components/nav-tree";
import { externalLinks } from "@/lib/nav";
import { asset } from "@/lib/base-path";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // A route change means the drawer's job is done. Adjusting during render
  // rather than in an effect: React re-runs this pass immediately, so the
  // drawer never paints over the page it already navigated away from. This
  // also covers back/forward, which no click handler would catch.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMenuOpen(false);
  }

  // The drawer scrolls itself; the page behind it shouldn't.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className="border-border bg-background/85 fixed inset-x-0 top-0 z-40 h-(--topbar-h) border-b backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[100rem] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 -ml-1.5 rounded-md p-1.5 transition-colors lg:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Lifted wholesale from studio's sidebar mark (app-sidebar.tsx) —
            same 22px logo, same 14.5px bold wordmark with the ".ai" in
            --brand-ai-blue, same mono micro-label stacked underneath naming
            the surface. Only the label word and the href differ. The two
            apps sit one click apart, so the mark reading as one product
            matters more than either header's own internal logic.

            The label is what changed shape: it used to be an inline
            "| docs" divider, which read as a breadcrumb — a second thing
            after the brand rather than part of it. */}
        <Link href="/" className="flex items-center gap-2.5">
          {/* asset(), not "/logo.svg": next/image emits src verbatim without
              the basePath, so the bare path asks the apex — landing's Worker,
              which serves an identical logo and hides the mistake in prod
              while 404ing on every local page load. See lib/base-path.ts. */}
          <Image
            src={asset("/logo.svg")}
            alt=""
            width={22}
            height={22}
            className="mt-0.5 shrink-0"
            priority
          />
          <div className="leading-[1.2]">
            <div className="text-[14.5px] font-bold tracking-[-0.2px]">
              resourcepack<span className="text-brand">.ai</span>
            </div>
            {/* text-faint rather than studio's literal #7c7c70: same role in
                each palette, and docs has a token for it. */}
            <div className="text-faint font-mono text-[8.5px] tracking-[2px]">DOCS</div>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <DocsSearch />
          <nav className="hidden items-center gap-1 sm:flex">
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 rounded-md px-2 py-1 text-[0.83rem] transition-colors"
              >
                {link.title}
                <ArrowUpRight className="size-3.5 opacity-60" />
              </a>
            ))}
          </nav>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 top-(--topbar-h) z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="bg-sidebar border-border absolute inset-y-0 left-0 w-(--sidebar-w) max-w-[85vw] overflow-y-auto border-r px-4 py-6">
            <div className="mb-5 flex items-center justify-between px-3 sm:hidden">
              <span className="text-faint text-[0.7rem] font-semibold tracking-[0.09em] uppercase">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavTree onNavigate={() => setMenuOpen(false)} />
            <div className="border-line mt-7 flex flex-col gap-1 border-t pt-5 sm:hidden">
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-1 text-[0.875rem]"
                >
                  {link.title}
                  <ArrowUpRight className="size-3.5 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
