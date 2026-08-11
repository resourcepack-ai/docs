import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EndpointPage } from "@/components/api/endpoint-page";
import { InlineMarkdown } from "@/components/api/inline-markdown";
import { ApiPager } from "@/components/api/api-pager";
import { hrefFor, slugFor } from "@/lib/api-nav";
import { operations } from "@/lib/openapi";

/**
 * One page per endpoint, generated from the spec.
 *
 * There is no MDX here on purpose. An endpoint page is entirely derived — its
 * title, its fields, its sample — so a hand-written file per endpoint would be
 * thirteen files whose only content is a component call, and one more thing to
 * forget when an endpoint is added.
 */

export function generateStaticParams() {
  return operations.map((operation) => ({ operation: slugFor(operation.id) }));
}

function find(slug: string) {
  return operations.find((operation) => slugFor(operation.id) === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ operation: string }>;
}): Promise<Metadata> {
  const { operation: slug } = await params;
  const operation = find(slug);
  if (!operation) return {};
  return {
    title: `${operation.summary} (API)`,
    // The first paragraph only: descriptions carry the cross-field rules too,
    // and a search result wants the sentence that says what this is.
    description: operation.description.split("\n\n")[0],
  };
}

export default async function ApiEndpointPage({ params }: { params: Promise<{ operation: string }> }) {
  const { operation: slug } = await params;
  const operation = find(slug);
  if (!operation) notFound();

  return (
    <div className="mx-auto max-w-[76rem]">
      <p className="text-faint mb-2 font-mono text-[0.7rem] tracking-[0.09em] uppercase">{operation.group}</p>
      <h1 className="mb-3 text-[2.15rem] leading-[1.15] font-semibold tracking-[-0.025em]">
        {operation.summary}
      </h1>

      {/* Paragraph-split rather than a markdown renderer: these descriptions
          are prose with inline code, and pulling MDX in for that would mean
          compiling a string at request time in an app that prerenders. */}
      <div className="text-prose mb-8">
        {operation.description.split("\n\n").map((paragraph, index) => (
          <p key={index} className="text-muted-foreground my-3 leading-[1.75]">
            <InlineMarkdown text={paragraph} />
          </p>
        ))}
      </div>

      <EndpointPage operation={operation} />
      <ApiPager href={hrefFor(operation)} />
    </div>
  );
}
