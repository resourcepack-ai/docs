import type { ReactNode } from "react";

/**
 * Inline markdown for text that comes out of the spec.
 *
 * Endpoint and field descriptions are written as prose in `endpoints.ts` and
 * carry backticks and bold, because that's how the rest of this codebase writes
 * comments. Rendered as plain text they showed their own punctuation —
 * "Produces a `texture`" with the backticks visible.
 *
 * Handles code, bold and italic. Inline only, and deliberately: these are sentences, not documents. Anything
 * needing a list or a heading belongs on a written page, not in a schema
 * description, so pulling a markdown compiler in here would be building for a
 * case that shouldn't exist.
 */
export function InlineMarkdown({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  // One pass over both forms, so `**a `b` c**` can't half-match.
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
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
    } else {
      nodes.push(<em key={key++}>{match[3]}</em>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}
