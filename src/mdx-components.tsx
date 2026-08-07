import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps } from "react";

import { Callout } from "@/components/mdx/callout";
import { Card, CardGroup } from "@/components/mdx/card";
import { CodeBlock } from "@/components/mdx/code-block";
import { Copyable, ServerAddress } from "@/components/mdx/copyable";
import { Step, Steps } from "@/components/mdx/steps";

/**
 * Global MDX mapping — required by @next/mdx under the App Router.
 *
 * Two jobs:
 *   1. give plain markdown its typography (there's no @tailwindcss/typography
 *      here on purpose; `prose` classes are a stranger's design system and
 *      fight the tokens in globals.css)
 *   2. expose our own components to every .mdx page WITHOUT an import, so
 *      content files stay content
 *
 * Anything added to `components` below is instantly usable in any page, with
 * no import — so keep the set small and give each one an obvious job.
 */

/** Heading with a hover `#` that copies as a link to that section. */
function heading(level: 2 | 3 | 4) {
  const sizes = {
    2: "mt-12 mb-4 text-[1.4rem] font-semibold tracking-[-0.015em]",
    3: "mt-9 mb-3 text-[1.1rem] font-semibold tracking-[-0.01em]",
    4: "mt-7 mb-2 text-[0.95rem] font-semibold",
  } as const;

  const Tag = `h${level}` as const;

  function Heading({ id, children, ...props }: ComponentProps<"h2">) {
    return (
      <Tag id={id} className={`group scroll-mt-24 ${sizes[level]}`} {...props}>
        {children}
        {id && (
          <a
            href={`#${id}`}
            aria-label="Link to this section"
            // Read by TableOfContents, which has to leave this out of the
            // heading's text — see the comment there before renaming it.
            data-heading-anchor=""
            className="text-faint hover:text-primary ml-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </a>
        )}
      </Tag>
    );
  }

  Heading.displayName = `H${level}`;
  return Heading;
}

const components: MDXComponents = {
  h1: (props) => (
    <h1
      className="mb-4 text-[2.15rem] leading-[1.15] font-semibold tracking-[-0.025em]"
      {...props}
    />
  ),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),

  p: (props) => <p className="my-4 leading-[1.75]" {...props} />,

  a: ({ href = "", children, ...props }: ComponentProps<"a">) => {
    // Same-site links go through next/link so navigation stays client-side;
    // everything else opens away from the docs.
    if (href.startsWith("/")) {
      return (
        <Link
          href={href}
          className="text-primary-ink decoration-primary/40 hover:decoration-primary underline underline-offset-[3px] transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target={href.startsWith("#") ? undefined : "_blank"}
        rel={href.startsWith("#") ? undefined : "noreferrer"}
        className="text-primary-ink decoration-primary/40 hover:decoration-primary underline underline-offset-[3px] transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },

  ul: (props) => <ul className="marker:text-faint my-4 list-disc space-y-2 pl-5" {...props} />,
  ol: (props) => <ol className="marker:text-faint my-4 list-decimal space-y-2 pl-5" {...props} />,
  li: (props) => <li className="leading-[1.7] pl-1" {...props} />,

  blockquote: (props) => (
    <blockquote
      className="border-primary/40 text-muted-foreground my-6 border-l-2 pl-4 italic"
      {...props}
    />
  ),

  hr: (props) => <hr className="border-line my-10" {...props} />,

  strong: (props) => <strong className="text-foreground font-semibold" {...props} />,

  // GFM tables. The wrapper is what scrolls — the page body must never
  // scroll sideways because a table is wide.
  table: (props) => (
    <div className="border-border my-6 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-[0.875rem]" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-card/60" {...props} />,
  th: (props) => (
    <th
      className="border-border text-muted-foreground border-b px-4 py-2.5 text-left font-semibold"
      {...props}
    />
  ),
  td: (props) => <td className="border-line border-b px-4 py-2.5 align-top" {...props} />,

  pre: CodeBlock,

  // Available in every .mdx page without an import.
  Callout,
  Card,
  CardGroup,
  Copyable,
  ServerAddress,
  Steps,
  Step,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
