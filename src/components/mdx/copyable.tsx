"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * An inline string you can click to copy — the server address, a command, an
 * id. Looks like inline `code` (the `:not(pre) > code` rule in globals.css
 * still applies, since that's what this renders) with a copy affordance that
 * only appears on hover, so a page full of them doesn't read as a page full
 * of buttons.
 *
 * `<ServerAddress />` below is the one that matters in practice: the test
 * server's address appears on six pages and every one of them is somewhere a
 * reader is about to paste it into Minecraft.
 */
export function Copyable({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Denied (insecure origin, permissions). Leave the tick off so it's
      // obvious it didn't take and the text can be selected by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `Copied ${children}` : `Copy ${children}`}
      className="group/copy cursor-pointer border-none bg-transparent p-0 align-baseline font-[inherit]"
    >
      <code className="group-hover/copy:border-primary/50 transition-colors">
        {children}
        <span className="text-faint group-hover/copy:text-primary ml-1.5 inline-flex translate-y-[1.5px] transition-colors">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </span>
      </code>
    </button>
  );
}

/**
 * The test server's address, copyable. One component so the string lives in
 * one place rather than in nine .mdx files.
 */
export function ServerAddress() {
  return <Copyable>play.resourcepack.ai</Copyable>;
}
