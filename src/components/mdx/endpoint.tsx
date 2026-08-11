import {
  BASE_URL,
  constraintsFor,
  errorCodesFor,
  operationById,
  typeLabel,
  type ParameterRow,
} from "@/lib/openapi";
import { cn } from "@/lib/utils";

/**
 * `<Endpoint id="generateTexture" />` — one endpoint, rendered from the
 * generated spec.
 *
 * The prose around it stays in the MDX page, which is the split that matters:
 * anything a person had to decide (why this endpoint exists, what the
 * cross-field rules are) is written by hand, and everything a machine already
 * knows (types, bounds, enums, defaults, which fields are required) comes from
 * the code. Those were hand-written tables until the day `MAX_TEXT_SCALE` moved
 * and the page didn't.
 */

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-[#16223a] text-primary-ink border-[#2b4880]",
  POST: "bg-[#16211f] text-cyan border-[#2c4a48]",
};

function ParameterList({ rows, depth = 0 }: { rows: ParameterRow[]; depth?: number }) {
  return (
    <div className={cn(depth > 0 && "mt-2 ml-3 border-l border-[#2c2c27] pl-3.5")}>
      {rows.map((row) => {
        const constraints = constraintsFor(row.schema);
        return (
          <div key={row.name} className="border-t border-[#2c2c27] py-2.5 first:border-t-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <code className="font-mono text-[0.82rem] text-[#eceadf]">{row.name}</code>
              <span className="font-mono text-[0.72rem] text-[#807d6c]">{typeLabel(row.schema)}</span>
              {row.required && (
                <span className="font-mono text-[0.68rem] tracking-[0.06em] text-amber uppercase">required</span>
              )}
              {constraints.map((constraint) => (
                <span
                  key={constraint}
                  className="rounded bg-[#232320] px-1.5 py-0.5 font-mono text-[0.68rem] text-[#807d6c]"
                >
                  {constraint}
                </span>
              ))}
            </div>

            {row.schema.description && (
              <p className="mt-1 text-[0.85rem] leading-relaxed text-[#94917f]">{row.schema.description}</p>
            )}

            {row.schema.enum && (
              // Wraps rather than truncating: the sound categories are ten
              // values and a clipped list is worse than a tall one.
              <div className="mt-1.5 flex flex-wrap gap-1">
                {row.schema.enum.map((value) => (
                  <code
                    key={String(value)}
                    className="rounded bg-[#232320] px-1.5 py-0.5 font-mono text-[0.72rem] text-[#c9c6b8]"
                  >
                    {String(value)}
                  </code>
                ))}
              </div>
            )}

            {row.children && <ParameterList rows={row.children} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-1 font-mono text-[0.7rem] tracking-[0.09em] text-[#66665c] uppercase">{title}</div>
      {children}
    </div>
  );
}

export function Endpoint({ id }: { id: string }) {
  const operation = operationById(id);
  if (!operation) {
    // Loud rather than silent: a renamed operationId should be obvious on the
    // page, not an endpoint that quietly stopped being documented.
    return (
      <div className="my-6 rounded-lg border border-[#5a2b2b] bg-[#251616] px-4 py-3 text-[0.85rem] text-destructive">
        Unknown endpoint <code className="font-mono">{id}</code> — it isn&apos;t in openapi.json.
      </div>
    );
  }

  const errors = errorCodesFor(id);

  return (
    <div id={id} className="my-7 scroll-mt-24 overflow-hidden rounded-lg border border-[#34342e] bg-[#1f1f1c]">
      {/* The method and path, which is what somebody scanning the page is
          looking for. Scrolls on its own rather than wrapping mid-path. */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#34342e] bg-[#232320] px-4 py-3">
        <span
          className={cn(
            "shrink-0 rounded border px-2 py-0.5 font-mono text-[0.72rem] font-semibold",
            METHOD_STYLES[operation.method] ?? "border-[#45453d] bg-[#2b2b27] text-[#c9c6b8]"
          )}
        >
          {operation.method}
        </span>
        <code className="min-w-0 overflow-x-auto font-mono text-[0.85rem] whitespace-nowrap text-[#eceadf]">
          {operation.path}
        </code>
      </div>

      <div className="px-4 py-3.5">
        {operation.pathParams.length > 0 && (
          <Section title="Path parameters">
            <ParameterList rows={operation.pathParams} />
          </Section>
        )}
        {operation.queryParams.length > 0 && (
          <Section title="Query parameters">
            <ParameterList rows={operation.queryParams} />
          </Section>
        )}
        {operation.bodyParams.length > 0 && (
          <Section title="Body">
            <ParameterList rows={operation.bodyParams} />
          </Section>
        )}

        <Section title="Responses">
          <div>
            {operation.responses.map((response) => (
              <div key={response.status} className="border-t border-[#2c2c27] py-2.5 first:border-t-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <code className="font-mono text-[0.82rem] text-[#eceadf]">{response.status}</code>
                  <span className="text-[0.85rem] text-[#94917f]">{response.description}</span>
                </div>
                {response.example !== undefined && (
                  <pre className="mt-2 overflow-x-auto rounded-md border border-[#2c2c27] bg-[#161614] px-3 py-2.5 font-mono text-[0.76rem] leading-relaxed text-[#c9c6b8]">
                    {JSON.stringify(response.example, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Section>

        {errors.length > 0 && (
          <Section title="Error codes">
            <div className="flex flex-wrap gap-1">
              {errors.map((code) => (
                <code
                  key={code}
                  className="rounded bg-[#232320] px-1.5 py-0.5 font-mono text-[0.72rem] text-[#c9c6b8]"
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

/** The base URL, so a page can state it without a second copy in the prose. */
export function ApiBaseUrl() {
  return <code className="font-mono text-[0.85rem] text-[#c9c6b8]">{BASE_URL}</code>;
}
