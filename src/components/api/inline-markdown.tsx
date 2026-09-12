import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Inline markdown for text that comes out of the spec.
 *
 * Endpoint and field descriptions are written as prose in `endpoints.ts` and
 * carry backticks and bold, because that's how the rest of this codebase writes
 * comments. Rendered as plain text they showed their own punctuation —
 * "Produces a `texture`" with the backticks visible.
 *
 * Handles code, bold, italic and links. Inline only, and deliberately: these
 * are sentences, not documents. Anything needing a list or a heading belongs on
 * a written page, not in a schema description, so pulling a markdown compiler
 * in here would be building for a case that shouldn't exist.
 *
 * Links earn their place because the opposite rule needs them: when a
 * description would otherwise grow a written page's worth of explanation, the
 * fix is to send the reader to the page, and a cross-reference that renders as
 * its own square brackets is not one. Internal hrefs go through `next/link`, so
 * they pick up the basePath; anything with a scheme is left as a plain anchor
 * that opens away from here.
 */
export function InlineMarkdown({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  // One pass over both forms, so `**a `b` c**` can't half-match.
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <code key={key++} className="bg-muted/60 rounded px-1 py-0.5 font-mono text-[0.85em]">
          {match[1]}
        </code>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <strong key={key++} className="text-foreground font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    } else {
      const [, , , , label, href] = match;
      const external = /^[a-z]+:/i.test(href);
      nodes.push(
        external ? (
          <a key={key++} href={href} className="text-link hover:underline" target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <Link key={key++} href={href} className="text-link hover:underline">
            {label}
          </Link>
        ),
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}
