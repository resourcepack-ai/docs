import { curlFor, sampleResponseFor } from "@/lib/curl";
import { constraintsFor, errorCodesFor, typeLabel, type Operation, type ParameterRow } from "@/lib/openapi";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/api/copy-button";
import { InlineMarkdown } from "@/components/api/inline-markdown";

/**
 * One endpoint, as its own page.
 *
 * Two columns on a wide screen: what the endpoint takes and gives on the left,
 * a runnable sample on the right, sticky so it stays beside the field you're
 * reading. Below `xl` they stack, sample first — on a phone the thing you
 * actually want is the call, not the table.
 */

const METHOD_STYLES: Record<string, string> = {
  GET: "border-[#2c4a48] bg-[#16211f] text-cyan",
  POST: "border-[#2b4880] bg-[#16223a] text-primary-ink",
};

function Field({ row, depth = 0 }: { row: ParameterRow; depth?: number }) {
  const constraints = constraintsFor(row.schema);
  return (
    <div className={cn("border-line border-t py-3", depth === 0 && "first:border-t-0")}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <code className="text-foreground font-mono text-[0.82rem]">{row.name}</code>
        <span className="text-muted-foreground font-mono text-[0.72rem]">{typeLabel(row.schema)}</span>
        {row.required ? (
          <span className="text-amber font-mono text-[0.68rem] tracking-[0.06em] uppercase">required</span>
        ) : null}
        {constraints.map((constraint) => (
          <span
            key={constraint}
            className="bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[0.68rem]"
          >
            {constraint}
          </span>
        ))}
      </div>

      {row.schema.description && (
        <p className="text-muted-foreground mt-1.5 text-[0.875rem] leading-relaxed">
          <InlineMarkdown text={row.schema.description} />
        </p>
      )}

      {row.schema.enum && (
        <p className="text-muted-foreground mt-1.5 text-[0.8rem]">
          <span className="text-faint">Options: </span>
          {row.schema.enum.map((value, index) => (
            <span key={String(value)}>
              {index > 0 && ", "}
              <code className="font-mono text-[0.76rem]">{String(value)}</code>
            </span>
          ))}
        </p>
      )}

      {row.children && (
        <div className="border-line mt-2.5 ml-1 border-l pl-4">
          {row.children.map((child) => (
            <Field key={child.name} row={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-foreground mb-1 text-[1.15rem] font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </section>
  );
}

export function EndpointPage({ operation }: { operation: Operation }) {
  const curl = curlFor(operation);
  const sample = sampleResponseFor(operation);
  const errors = errorCodesFor(operation.id);

  return (
    <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
      {/* Sample first in the DOM so it lands above the tables when stacked. */}
      <aside className="order-1 w-full shrink-0 xl:sticky xl:top-[calc(var(--topbar-h)+2rem)] xl:order-2 xl:w-[24rem]">
        <div className="border-line bg-surface overflow-hidden rounded-lg border">
          <div className="border-line bg-muted/40 flex items-center justify-between border-b px-3 py-2">
            <span className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.06em] uppercase">
              cURL
            </span>
            <CopyButton text={curl} />
          </div>
          {/* Wraps rather than scrolling: the whole value of this block is being
              read and copied, and a URL that runs off the right edge is the one
              part somebody needs to see in full. */}
          <pre className="px-3 py-3 font-mono text-[0.74rem] leading-[1.7] break-all whitespace-pre-wrap text-[#c9c6b8]">
            {curl}
          </pre>
        </div>

        {sample && (
          <div className="border-line bg-surface mt-3 overflow-hidden rounded-lg border">
            <div className="border-line bg-muted/40 border-b px-3 py-2">
              <span className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.06em] uppercase">
                Response · {sample.status}
              </span>
            </div>
            <pre className="overflow-x-auto px-3 py-3 font-mono text-[0.74rem] leading-[1.7] text-[#c9c6b8]">
              {sample.body}
            </pre>
          </div>
        )}
      </aside>

      <div className="order-2 min-w-0 flex-1 xl:order-1">
        <div className="border-line bg-surface mb-7 flex flex-wrap items-center gap-2.5 rounded-lg border px-3.5 py-3">
          <span
            className={cn(
              "shrink-0 rounded border px-2 py-0.5 font-mono text-[0.72rem] font-semibold",
              METHOD_STYLES[operation.method] ?? "border-line bg-muted text-muted-foreground",
            )}
          >
            {operation.method}
          </span>
          <code className="text-foreground min-w-0 overflow-x-auto font-mono text-[0.875rem] whitespace-nowrap">
            {operation.path}
          </code>
        </div>

        {!operation.available && (
          <div className="border-amber/40 bg-amber/10 text-amber mb-7 rounded-lg border px-4 py-3 text-[0.875rem]">
            <span className="font-semibold">Currently unavailable.</span> This endpoint answers{" "}
            <code className="font-mono text-[0.82rem]">503 unavailable</code> while the feature is switched
            off. Everything below still describes it for when it&apos;s back.
          </div>
        )}

        {operation.pathParams.length > 0 && (
          <Section title="Path parameters">
            <div>
              {operation.pathParams.map((row) => (
                <Field key={row.name} row={row} />
              ))}
            </div>
          </Section>
        )}

        {operation.queryParams.length > 0 && (
          <Section title="Query parameters">
            <div>
              {operation.queryParams.map((row) => (
                <Field key={row.name} row={row} />
              ))}
            </div>
          </Section>
        )}

        {operation.bodyParams.length > 0 && (
          <Section title="Body">
            <div>
              {operation.bodyParams.map((row) => (
                <Field key={row.name} row={row} />
              ))}
            </div>
          </Section>
        )}

        {operation.responses.map((response) => (
          <Section key={response.status} title={`Response · ${response.status}`}>
            <p className="text-muted-foreground mb-1 text-[0.875rem] leading-relaxed">
              <InlineMarkdown text={response.description} />
            </p>
            <div>
              {response.fields.map((row) => (
                <Field key={row.name} row={row} />
              ))}
            </div>
          </Section>
        ))}

        {errors.length > 0 && (
          <Section title="Error codes">
            <p className="text-muted-foreground mb-2 text-[0.875rem] leading-relaxed">
              Branch on <code className="font-mono text-[0.82rem]">error.code</code>, never on the message.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {errors.map((code) => (
                <code
                  key={code}
                  className="bg-muted/60 text-muted-foreground rounded px-2 py-1 font-mono text-[0.76rem]"
                >
                  {code}
                </code>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
