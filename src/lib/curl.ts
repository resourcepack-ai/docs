import { BASE_URL, type Operation, type ParameterRow, type SchemaNode } from "@/lib/openapi";

// The cURL sample beside each endpoint.
//
// Generated rather than written, for the same reason the parameter tables are:
// a hand-written sample goes stale the moment a required field is added, and a
// sample that doesn't work is worse than none — somebody pastes it, gets a 400,
// and stops trusting the page.

/** A stand-in value for a field, preferring anything the spec already says. */
function sampleFor(schema: SchemaNode): unknown {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];

  switch (schema.type) {
    case "integer":
    case "number":
      // A bounded field's minimum is a value that definitely validates, which
      // matters more here than a value that looks realistic.
      return schema.minimum ?? 1;
    case "boolean":
      return true;
    case "array":
      // One item, not an empty array. A required array field sampled as `[]`
      // gives a sample that 400s on the shortest possible call, which is
      // exactly the "paste it, get a 400, stop trusting the page" this file
      // exists to prevent.
      return schema.items ? [sampleFor(schema.items)] : [];
    case "object": {
      const nested: Record<string, unknown> = {};
      for (const [name, child] of Object.entries(schema.properties ?? {})) {
        if (schema.required?.includes(name)) nested[name] = sampleFor(child);
      }
      return nested;
    }
    default:
      return "…";
  }
}

/**
 * The request body, with every required field and nothing else.
 *
 * Required-only on purpose: the sample is meant to be the shortest call that
 * works, so somebody can paste it and see something happen. The full field
 * list is right beside it on the page.
 */
function bodyFor(rows: ParameterRow[]): Record<string, unknown> | null {
  const required = rows.filter((row) => row.required);
  if (required.length === 0) return null;
  return Object.fromEntries(required.map((row) => [row.name, sampleFor(row.schema)]));
}

function fillPath(operation: Operation): string {
  let path = operation.path;
  for (const param of operation.pathParams) {
    path = path.replace(`{${param.name}}`, String(sampleFor(param.schema)));
  }
  return path;
}

export function curlFor(operation: Operation): string {
  const url = `${BASE_URL}${fillPath(operation)}`;
  // Built WITHOUT line continuations, which are joined on at the end. Appending
  // a trailing backslash to whichever line happened to be last broke the moment
  // one of them became conditional: the URL line would carry the backslash it
  // already had, plus another.
  const lines = [`curl --request ${operation.method}`, `  --url ${url}`];

  // A public endpoint gets no Authorization line. Printing one on the
  // origin-check lookups would contradict the sentence above them saying no key
  // is needed, and somebody pasting it would send `Bearer $RPAI_KEY`
  // unexpanded and wonder why it changed nothing.
  if (operation.authenticated) lines.push(`  --header 'Authorization: Bearer $RPAI_KEY'`);

  const body = operation.method === "POST" ? bodyFor(operation.bodyParams) : null;
  if (body) {
    lines.push(`  --header 'Content-Type: application/json'`);
    lines.push(`  --data '${JSON.stringify(body)}'`);
  }

  return lines.join(" \\\n");
}

/** The response shown beside the sample — the first success the spec lists. */
export function sampleResponseFor(operation: Operation): { status: string; body: string } | null {
  const success = operation.responses.find((response) => response.status.startsWith("2"));
  if (!success) return null;
  if (success.example !== undefined) {
    return { status: success.status, body: JSON.stringify(success.example, null, 2) };
  }
  // A byte response (a file, a zip) has no JSON to show; say so rather than
  // printing an empty object, which would read as a bug.
  return { status: success.status, body: success.description };
}
