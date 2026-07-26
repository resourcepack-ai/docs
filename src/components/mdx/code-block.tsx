"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState, type ComponentProps } from "react";

/**
 * Wraps every `<pre>` MDX emits so code blocks get a copy button.
 *
 * The highlighted markup inside is Shiki's, generated at build time — this
 * only adds the button and reads `textContent` off the real element, so
 * what gets copied is exactly what's rendered (line numbers are CSS
 * counters and prompts are part of the code, neither ends up in the
 * clipboard by accident).
 */
export function CodeBlock(props: ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = preRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied (insecure origin, permissions).
      // Nothing to recover — leave the button un-ticked so it's obvious
      // it didn't take, and let the user select the text by hand.
    }
  }

  return (
    <div className="group relative">
      <pre ref={preRef} {...props} />
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="border-border bg-card text-muted-foreground hover:text-foreground hover:border-[#45453d] absolute top-2 right-2 rounded-md border p-1.5 opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? (
          <Check className="text-cyan size-3.5" strokeWidth={2.4} />
        ) : (
          <Copy className="size-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
