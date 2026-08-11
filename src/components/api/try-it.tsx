"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { BASE_URL, type Operation, type ParameterRow } from "@/lib/openapi";
import { cn } from "@/lib/utils";

/**
 * "Try it" — runs the endpoint from the page, against the real API.
 *
 * **It really runs.** There is no sandbox behind this: a generation started
 * here creates an asset in a real pack and spends real credits. That is the
 * only honest way to build it — a simulator would answer from the spec's
 * examples and tell you nothing about whether your key, your plan, your pack
 * and your prompt actually work together, which is the entire question
 * somebody presses this button to answer. So the panel says so, plainly, above
 * the button rather than in small print under it.
 *
 * **The key is kept in sessionStorage, not localStorage.** It survives moving
 * between endpoint pages, which is the whole convenience, and is gone when the
 * tab closes. A key is the whole account, and leaving one in localStorage
 * indefinitely on a docs site is a worse trade than retyping it tomorrow.
 */

const KEY_STORAGE = "rpai-try-it-key";

interface FieldValue {
  name: string;
  row: ParameterRow;
  value: string;
}

function initialValue(row: ParameterRow): string {
  const { example, default: fallback, enum: options } = row.schema;
  if (example !== undefined) return String(example);
  if (fallback !== undefined) return String(fallback);
  if (options?.length) return String(options[0]);
  return "";
}

/** Text back into the type the field declares, so the API gets real JSON. */
function coerce(row: ParameterRow, raw: string): unknown {
  const text = raw.trim();
  if (text === "") return undefined;
  if (row.schema.type === "integer" || row.schema.type === "number") {
    const n = Number(text);
    return Number.isFinite(n) ? n : text;
  }
  if (row.schema.type === "boolean") return text === "true";
  if (row.schema.type === "array" || row.schema.type === "object") {
    try {
      return JSON.parse(text);
    } catch {
      // Left as typed: the API's own validation gives a better message than
      // anything guessed here, and swallowing it would hide the typo.
      return text;
    }
  }
  return text;
}

function Row({ field, onChange }: { field: FieldValue; onChange: (value: string) => void }) {
  const { row } = field;
  const isLong = row.schema.type === "array" || row.schema.type === "object";

  return (
    <label className="block">
      <span className="mb-1 flex flex-wrap items-baseline gap-x-2">
        <code className="text-foreground font-mono text-[0.78rem]">{row.name}</code>
        <span className="text-muted-foreground font-mono text-[0.68rem]">{row.schema.type}</span>
        {row.required && (
          <span className="text-amber font-mono text-[0.64rem] tracking-[0.06em] uppercase">required</span>
        )}
      </span>

      {row.schema.enum ? (
        <select
          value={field.value}
          onChange={(event) => onChange(event.target.value)}
          className="border-line bg-background text-foreground w-full rounded-md border px-2.5 py-1.5 text-[0.82rem] outline-none focus:border-[#757567]"
        >
          {!row.required && <option value="">(omit)</option>}
          {row.schema.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      ) : isLong ? (
        <textarea
          value={field.value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder="JSON"
          className="border-line bg-background text-foreground w-full rounded-md border px-2.5 py-1.5 font-mono text-[0.78rem] outline-none focus:border-[#757567]"
        />
      ) : (
        <input
          value={field.value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={row.required ? "" : "(optional)"}
          className="border-line bg-background text-foreground w-full rounded-md border px-2.5 py-1.5 text-[0.82rem] outline-none focus:border-[#757567]"
        />
      )}
    </label>
  );
}

export function TryIt({ operation }: { operation: Operation }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ status: number; body: string; ms: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const [fields, setFields] = useState<FieldValue[]>(() =>
    [...operation.pathParams, ...operation.queryParams, ...operation.bodyParams].map((row) => ({
      name: row.name,
      row,
      value: initialValue(row),
    })),
  );

  // Read on open rather than in an effect: sessionStorage isn't available
  // during the prerender, so it can't be initial state, and setting state from
  // an effect paints the field empty first and then fills it.
  function openPanel() {
    const stored = sessionStorage.getItem(KEY_STORAGE);
    if (stored) setApiKey(stored);
    setOpen(true);
  }

  // The page scrolls behind a modal otherwise.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function set(name: string, value: string) {
    setFields((current) => current.map((field) => (field.name === name ? { ...field, value } : field)));
  }

  function valueOf(name: string) {
    return fields.find((field) => field.name === name)?.value.trim() ?? "";
  }

  function buildUrl(): string {
    let path = operation.path;
    for (const param of operation.pathParams) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(valueOf(param.name)));
    }
    const query = new URLSearchParams();
    for (const param of operation.queryParams) {
      const value = valueOf(param.name);
      if (value) query.set(param.name, value);
    }
    const search = query.toString();
    return `${BASE_URL}${path}${search ? `?${search}` : ""}`;
  }

  async function send() {
    setSending(true);
    setResult(null);
    setFailure(null);
    if (remember) sessionStorage.setItem(KEY_STORAGE, apiKey);
    else sessionStorage.removeItem(KEY_STORAGE);

    const startedAt = Date.now();
    try {
      const body =
        operation.method === "POST"
          ? Object.fromEntries(
              operation.bodyParams
                .map((row) => [row.name, coerce(row, valueOf(row.name))])
                .filter(([, value]) => value !== undefined),
            )
          : undefined;

      const response = await fetch(buildUrl(), {
        method: operation.method,
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const type = response.headers.get("content-type") ?? "";
      let text: string;
      if (type.includes("application/json")) {
        text = JSON.stringify(await response.json(), null, 2);
      } else {
        // A file or a zip — printing the bytes helps nobody.
        const size = (await response.arrayBuffer()).byteLength;
        text = `(${type || "binary"}, ${size.toLocaleString()} bytes — not shown)`;
      }
      setResult({ status: response.status, body: text, ms: Date.now() - startedAt });
    } catch (error) {
      // fetch only rejects on a network/CORS failure; every HTTP status above
      // resolves. Saying so saves somebody debugging a 500 that never happened.
      setFailure(
        error instanceof Error
          ? `The request didn't reach the API: ${error.message}`
          : "The request didn't reach the API.",
      );
    } finally {
      setSending(false);
    }
  }

  const missing = fields.filter((field) => field.row.required && !field.value.trim()).map((f) => f.name);
  const canSend = apiKey.trim().length > 0 && missing.length === 0 && !sending;

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="border-brand/50 bg-brand/10 text-brand hover:bg-brand/20 ml-auto shrink-0 rounded-md border px-3 py-1 text-[0.78rem] font-semibold transition-colors"
      >
        Try it
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Scrim and entrance both lifted from studio's modals (bg-black/55,
              blur 4, rpin) — see the keyframe note in globals.css. The scrim is
              its own absolutely-positioned layer rather than a background on
              the flex container, which is what lets the panel sit above it with
              its own shadow instead of inside a blurred box. */}
          <div onMouseDown={() => setOpen(false)} className="absolute inset-0 bg-black/55 backdrop-blur-[4px]" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Try ${operation.summary}`}
            className="border-border bg-card relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border shadow-2xl shadow-black/50 [animation:rpin_.22s_ease]"
          >
            <div className="border-border flex items-center gap-3 border-b px-4 py-3">
              <span className="text-foreground font-mono text-[0.74rem] font-semibold">{operation.method}</span>
              <code className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-[0.8rem]">
                {operation.path}
              </code>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* gap, not a margin on each child. Every block in here used to
                carry its own mb-4, so the last one added its margin to the
                container's own bottom padding and the body sat visibly lower
                than it started — worst with no response, where the fields were
                the last block. A gap can't do that: the padding is the padding
                whatever is or isn't rendered. */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {!operation.available && (
                <p className="border-amber/40 bg-amber/10 text-amber rounded-md border px-3 py-2 text-[0.8rem]">
                  This endpoint is switched off and will answer 503. You can still send it.
                </p>
              )}

              {/* ONE line, and short enough to still be one at the dialog's
                  narrowest. There's no sandbox behind this button, so the
                  warning has to be here — but it was a bordered callout with a
                  bold lead and three lines of prose, which made the first thing
                  in the dialog a block of chrome. Everything it explained is
                  carried by "real", said of both the pack and the credits. The
                  line has ~640px at 0.78rem, which is about 100 characters —
                  this is 87, so it fills the width without wrapping. Rewrite
                  past 100 and it's two lines again. */}
              <p className="text-muted-foreground text-[0.78rem] leading-relaxed">
                This sends a real request — it writes into a real pack and spends your real AI Credits.
              </p>

              <label className="block">
                <span className="text-foreground mb-1 block text-[0.8rem] font-medium">API key</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="rpai_…"
                  autoComplete="off"
                  spellCheck={false}
                  className="border-line bg-background text-foreground w-full rounded-md border px-2.5 py-1.5 font-mono text-[0.8rem] outline-none focus:border-[#757567]"
                />
                <span className="mt-1.5 flex items-center gap-1.5">
                  <input
                    id="try-it-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="accent-brand size-3"
                  />
                  <label htmlFor="try-it-remember" className="text-muted-foreground text-[0.75rem]">
                    Keep it for this tab only — cleared when you close it
                  </label>
                </span>
              </label>

              {fields.length > 0 && (
                <div className="flex flex-col gap-3">
                  {fields.map((field) => (
                    <Row key={field.name} field={field} onChange={(value) => set(field.name, value)} />
                  ))}
                </div>
              )}

              {failure && (
                <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-[0.8rem]">
                  {failure}
                </p>
              )}

              {result && (
                <div className="border-line overflow-hidden rounded-md border">
                  <div className="border-line bg-muted/40 flex items-center gap-2 border-b px-3 py-1.5">
                    <span
                      className={cn(
                        "font-mono text-[0.75rem] font-semibold",
                        result.status < 300 ? "text-cyan" : result.status < 500 ? "text-amber" : "text-destructive",
                      )}
                    >
                      {result.status}
                    </span>
                    <span className="text-muted-foreground font-mono text-[0.7rem]">{result.ms} ms</span>
                  </div>
                  <pre className="max-h-64 overflow-auto px-3 py-2.5 font-mono text-[0.74rem] leading-[1.6] text-[#c9c6b8]">
                    {result.body}
                  </pre>
                </div>
              )}
            </div>

            <div className="border-border flex items-center gap-3 border-t px-4 py-3">
              {/* "Needs your API key" was a dead end: it named the one thing
                  standing between somebody and a working request, on a site
                  that can't mint one, and left them to go and find the page
                  themselves. It's a link now — the account page is where keys
                  are created, and it opens in a new tab so a half-filled form
                  here survives the trip. The other two states stay plain text:
                  a missing field is fixed in this dialog, and the URL isn't
                  somewhere to go. */}
              {missing.length === 0 && !apiKey.trim() ? (
                <a
                  href="https://studio.resourcepack.ai/account"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:text-brand/80 min-w-0 flex-1 truncate text-[0.75rem] font-medium underline decoration-dotted underline-offset-2 transition-colors"
                >
                  Needs your API key — create one
                </a>
              ) : (
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-[0.75rem]">
                  {missing.length > 0 ? `Needs ${missing.join(", ")}` : buildUrl()}
                </span>
              )}
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className="bg-brand shrink-0 rounded-md px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
