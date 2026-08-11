"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * Copies the cURL sample. The whole point of the sample is being pasted, so
 * this is the one control on the page worth having.
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // A refused clipboard permission isn't worth an error state — the text
      // is on screen and selectable, which is the fallback anyway.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded p-1 transition-colors"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
