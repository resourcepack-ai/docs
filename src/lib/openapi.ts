import spec from "@/openapi.json";

// Reading the generated API spec.
//
// `src/openapi.json` is written by studio's `npm run gen:openapi` and committed
// here — this app has no code dependency on any sibling and isn't gaining one.
// The coupling is a file in a diff, and studio's `check:openapi` is what stops
// it going stale.

export interface SchemaNode {
  type?: string;
  description?: string;
  enum?: (string | number)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  default?: unknown;
  items?: SchemaNode;
  properties?: Record<string, SchemaNode>;
  required?: string[];
  example?: unknown;
}

export interface ParameterRow {
  name: string;
  schema: SchemaNode;
  required: boolean;
  /** Nested object/array fields, flattened one level with a dotted name. */
  children?: ParameterRow[];
}

export interface Operation {
  id: string;
  /** False when a feature flag has this endpoint switched off (x-available). */
  available: boolean;
  method: string;
  path: string;
  summary: string;
  description: string;
  pathParams: ParameterRow[];
  queryParams: ParameterRow[];
  bodyParams: ParameterRow[];
  responses: { status: string; description: string; example?: unknown }[];
}

interface RawParameter {
  name: string;
  in: string;
  required?: boolean;
  schema: SchemaNode;
}

interface RawOperation {
  "x-available"?: boolean;
  operationId: string;
  summary: string;
  description: string;
  parameters?: RawParameter[];
  requestBody?: { content: { "application/json": { schema: SchemaNode } } };
  responses: Record<string, { description: string; content?: { "application/json"?: { example?: unknown } } }>;
}

export const BASE_URL: string = spec.servers[0].url;

/**
 * Turns a JSON Schema object into rows, descending one level into arrays of
 * objects and nested objects.
 *
 * One level, not arbitrary depth: the deepest thing in this API is a GUI
 * element inside the `elements` array, and a renderer that recursed without
 * limit would be building for a shape that doesn't exist yet.
 */
function rowsFrom(schema: SchemaNode | undefined): ParameterRow[] {
  if (!schema?.properties) return [];
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties).map(([name, child]) => {
    const row: ParameterRow = { name, schema: child, required: required.has(name) };
    // An array of objects documents its item's fields; a bare object its own.
    const nested = child.type === "array" ? child.items : child;
    if (nested?.properties) {
      row.children = rowsFrom(nested);
    }
    return row;
  });
}

function toOperation(method: string, path: string, raw: RawOperation): Operation {
  const parameters = raw.parameters ?? [];
  return {
    id: raw.operationId,
    // Absent means available — only a switched-off endpoint carries the flag.
    available: raw["x-available"] !== false,
    method: method.toUpperCase(),
    path,
    summary: raw.summary,
    description: raw.description,
    pathParams: parameters
      .filter((p) => p.in === "path")
      .map((p) => ({ name: p.name, schema: p.schema, required: true })),
    queryParams: parameters
      .filter((p) => p.in === "query")
      .map((p) => ({ name: p.name, schema: p.schema, required: Boolean(p.required) })),
    bodyParams: rowsFrom(raw.requestBody?.content["application/json"].schema),
    responses: Object.entries(raw.responses)
      // `default` is the error envelope — rendered separately, not as a status.
      .filter(([status]) => status !== "default")
      .map(([status, response]) => ({
        status,
        description: response.description,
        example: response.content?.["application/json"]?.example,
      })),
  };
}

const operations: Operation[] = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods as Record<string, RawOperation>).map(([method, raw]) =>
    toOperation(method, path, raw)
  )
);

export function operationById(id: string): Operation | undefined {
  return operations.find((operation) => operation.id === id);
}

/** Every error code this endpoint can answer, read off the `default` response. */
export function errorCodesFor(id: string): string[] {
  for (const methods of Object.values(spec.paths)) {
    for (const raw of Object.values(methods as Record<string, RawOperation>)) {
      if (raw.operationId !== id) continue;
      const description = raw.responses.default?.description ?? "";
      return [...description.matchAll(/`([a-z_]+)`/g)].map((match) => match[1]);
    }
  }
  return [];
}

/** A one-line type label: `integer`, `string`, `array of object`. */
export function typeLabel(schema: SchemaNode): string {
  if (schema.type === "array") return `array of ${schema.items?.type ?? "value"}`;
  return schema.type ?? "value";
}

/**
 * The constraints worth printing beside a field — the part most likely to be
 * wrong when these were written by hand, and the reason the spec is generated.
 */
export function constraintsFor(schema: SchemaNode): string[] {
  const out: string[] = [];
  const min = schema.minimum ?? schema.minLength ?? schema.minItems;
  const max = schema.maximum ?? schema.maxLength ?? schema.maxItems;
  const unit = schema.type === "string" ? " characters" : schema.type === "array" ? " entries" : "";

  if (min !== undefined && max !== undefined) out.push(`${min}–${max}${unit}`);
  else if (min !== undefined) out.push(`min ${min}${unit}`);
  else if (max !== undefined) out.push(`max ${max}${unit}`);

  if (schema.default !== undefined) out.push(`default ${JSON.stringify(schema.default)}`);
  return out;
}
