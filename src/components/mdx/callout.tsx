import { Info, Lightbulb, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const variants = {
  note: {
    icon: Info,
    box: "border-[#2b4880] bg-[#16223a]",
    accent: "text-primary-ink",
  },
  tip: {
    icon: Lightbulb,
    box: "border-[#2c4a48] bg-[#16211f]",
    accent: "text-cyan",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-[#4a3a20] bg-[#241d11]",
    accent: "text-amber",
  },
  danger: {
    icon: OctagonAlert,
    box: "border-[#5a2b2b] bg-[#251616]",
    accent: "text-destructive",
  },
} as const;

export type CalloutVariant = keyof typeof variants;

/**
 * `<Callout type="warning">…</Callout>` — the one way to make a paragraph
 * shout. Four types only; if something needs a fifth, it probably wants to
 * be body text.
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
  const Icon = variant.icon;

  return (
    <div className={cn("my-6 flex gap-3 rounded-lg border px-4 py-3.5", variant.box)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", variant.accent)} strokeWidth={2.2} />
      <div className="min-w-0 text-[0.9rem] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2">
        {title && <p className={cn("mb-1 font-semibold", variant.accent)}>{title}</p>}
        {children}
      </div>
    </div>
  );
}
