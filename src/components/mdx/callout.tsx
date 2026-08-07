import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const variants = {
  note: {
    box: "border-[#2b4880] bg-[#16223a]",
    accent: "text-primary-ink",
  },
  tip: {
    box: "border-[#2c4a48] bg-[#16211f]",
    accent: "text-cyan",
  },
  warning: {
    box: "border-[#4a3a20] bg-[#241d11]",
    accent: "text-amber",
  },
  danger: {
    box: "border-[#5a2b2b] bg-[#251616]",
    accent: "text-destructive",
  },
} as const;

export type CalloutVariant = keyof typeof variants;

/**
 * `<Callout type="warning">…</Callout>` — the one way to make a paragraph
 * shout. Four types only; if something needs a fifth, it probably wants to
 * be body text.
 *
 * **No icon.** Each type used to lead with a lucide glyph beside the title;
 * they were dropped deliberately. The tint and the accent colour already say
 * which kind of aside this is, and a row of little symbols down the left of a
 * page reads as decoration rather than meaning. Don't add one back here or to
 * anything else that titles a block of prose.
 */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const variant = variants[type];

  return (
    <div className={cn("my-6 rounded-lg border px-4 py-3.5", variant.box)}>
      <div className="min-w-0 text-[0.9rem] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2">
        {title && <p className={cn("mb-1 font-semibold", variant.accent)}>{title}</p>}
        {children}
      </div>
    </div>
  );
}
