"use client";

import { ArrowUp, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * "Ask AI": a chat panel that answers questions from these docs.
 *
 * The answering happens on help.resourcepack.ai, which reads the same docs
 * (as llms-full.txt) and the public download list, and nothing else: it has
 * no access to accounts, packs or any private data, so it cannot tell you
 * anything about yours. The same service answers `/ask` in our Discord.
 *
 * Everything in an answer is treated as untrusted text: it is rendered by the
 * small Markdown reader below into React elements (never as HTML), and links
 * are only made for https URLs. The service already strips links to sites
 * other than ours and a short list of stores; this is the second fence.
 *
 * Every question and answer is logged by the service, to improve answers and
 * to catch abuse; the privacy policy says so. In the browser, the
 * conversation lives in this tab's sessionStorage and nowhere else. Each
 * answer comes back with a signature, and only signed turns are accepted as
 * context for the next question, so the history a browser sends cannot put
 * words in the assistant's mouth.
 */

const HELP_URL =
  process.env.NEXT_PUBLIC_HELP_URL ?? "https://help.resourcepack.ai";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const STORAGE_KEY = "rpai-ask-ai";
const MAX_QUESTION = 1000;
const DOCS_ORIGIN = "https://resourcepack.ai/docs";

interface Turn {
  question: string;
  answer?: string;
  sources?: { title: string; url: string }[];
  notice?: string;
  error?: string;
  /** The conversation the service filed this under; sent back so follow-ups join it. */
  threadId?: string;
  /** What the service signed, sent back as context with the next question. */
  signed?: { question: string; answer: string; sig: string } | null;
}

const EXAMPLES = [
  "How do I test my pack on a real server?",
  "What's the latest RP Engine and where do I get it?",
  "How do I export a pack for Bedrock?",
];

function loadTurns(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Turn[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((t) => t && typeof t.question === "string").slice(-20)
      : [];
  } catch {
    return [];
  }
}

function saveTurns(turns: Turn[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-20)));
  } catch {
    // Private mode or storage off: the conversation just won't survive a reload.
  }
}

// --- Turnstile, only when a site key was built in -----------------------------

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  execute(id: string): void;
  reset(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("turnstile"));
    script.onerror = () => {
      turnstileScript = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return turnstileScript;
}

/**
 * A fresh Turnstile token per question (each is single-use). The widget lives
 * inside the panel, which unmounts when closed, so it is rendered again
 * whenever the element it was rendered into has gone.
 */
function useTurnstile(container: React.RefObject<HTMLDivElement | null>) {
  const widget = useRef<{ id: string; el: HTMLElement } | null>(null);
  const pending = useRef<((token: string | undefined) => void) | null>(null);

  return async (): Promise<string | undefined> => {
    const el = container.current;
    if (!TURNSTILE_SITE_KEY || !el) return undefined;
    const api = await loadTurnstile();
    return new Promise((resolve) => {
      pending.current = resolve;
      const done = (token: string | undefined) => {
        pending.current?.(token);
        pending.current = null;
      };
      if (!widget.current || widget.current.el !== el) {
        const id = api.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          execution: "execute",
          appearance: "interaction-only",
          theme: "dark",
          callback: (token: string) => done(token),
          "error-callback": () => done(undefined),
          "expired-callback": () => done(undefined),
        });
        widget.current = { id, el };
      } else {
        api.reset(widget.current.id);
      }
      api.execute(widget.current.id);
    });
  };
}

// --- The small Markdown reader ----------------------------------------------

function AnswerLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  onNavigate: () => void;
}) {
  if (
    href === DOCS_ORIGIN ||
    href.startsWith(`${DOCS_ORIGIN}/`) ||
    href.startsWith(`${DOCS_ORIGIN}#`)
  ) {
    const path = href.slice(DOCS_ORIGIN.length) || "/";
    return (
      <Link
        href={path.startsWith("#") ? `/${path}` : path}
        onClick={onNavigate}
        className="text-primary-ink underline underline-offset-2"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-primary-ink underline underline-offset-2"
    >
      {children}
    </a>
  );
}

function inline(text: string, onNavigate: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern =
    /(`[^`\n]+`)|\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\((https:\/\/[^)\s]+)\)|(https:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[1]) {
      out.push(
        <code
          key={key++}
          className="bg-muted rounded px-1 py-px font-mono text-[0.8em]"
        >
          {match[1].slice(1, -1)}
        </code>,
      );
    } else if (match[2]) {
      out.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] && match[4]) {
      out.push(
        <AnswerLink key={key++} href={match[4]} onNavigate={onNavigate}>
          {match[3]}
        </AnswerLink>,
      );
    } else if (match[5]) {
      out.push(
        <AnswerLink key={key++} href={match[5]} onNavigate={onNavigate}>
          {match[5].replace(/^https:\/\//, "")}
        </AnswerLink>,
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({
  text,
  onNavigate,
}: {
  text: string;
  onNavigate: () => void;
}) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```"))
        body.push(lines[i++]);
      i++;
      blocks.push(
        <pre
          key={key++}
          className="bg-background border-border overflow-x-auto rounded-lg border p-3 font-mono text-[0.78rem] leading-relaxed"
        >
          {body.join("\n")}
        </pre>,
      );
      continue;
    }
    const listKind = /^\s*\d+[.)]\s/.test(line)
      ? "ol"
      : /^\s*[-*•]\s/.test(line)
        ? "ul"
        : null;
    if (listKind) {
      const items: string[] = [];
      const itemPattern = listKind === "ol" ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/;
      while (i < lines.length && itemPattern.test(lines[i]))
        items.push(lines[i++].replace(itemPattern, ""));
      const List = listKind;
      blocks.push(
        <List
          key={key++}
          className={`${listKind === "ol" ? "list-decimal" : "list-disc"} space-y-1 pl-5`}
        >
          {items.map((item, n) => (
            <li key={n}>{inline(item, onNavigate)}</li>
          ))}
        </List>,
      );
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("```") &&
      !/^\s*(\d+[.)]|[-*•])\s/.test(lines[i])
    ) {
      para.push(lines[i++].replace(/^#{1,6}\s+/, ""));
    }
    blocks.push(
      <p key={key++}>
        {para.map((p, n) => (
          <Fragment key={n}>
            {n > 0 && <br />}
            {inline(p, onNavigate)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className="space-y-2.5">{blocks}</div>;
}

// --- The panel ---------------------------------------------------------------

export function AskAi() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileToken = useTurnstile(turnstileBox);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_QUESTION);
    if (!question || busy) return;
    const history = turns
      .flatMap((t) => (t.signed ? [t.signed] : []))
      .slice(-3);
    const threadId = [...turns].reverse().find((t) => t.threadId)?.threadId;
    const next = [...turns, { question }];
    setTurns(next);
    setDraft("");
    setBusy(true);

    let turn: Turn = { question };
    try {
      const token = await turnstileToken();
      const res = await fetch(`${HELP_URL}/v1/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, history, threadId, turnstileToken: token }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        answer?: string;
        sources?: Turn["sources"];
        notice?: string;
        message?: string;
        turn?: Turn["signed"];
        threadId?: string;
      };
      turn =
        res.ok && typeof body.answer === "string"
          ? {
              question,
              answer: body.answer,
              sources: body.sources ?? [],
              notice: body.notice,
              signed: body.turn ?? null,
              threadId: body.threadId,
            }
          : {
              question,
              error:
                body.message ?? "Something went wrong. Try again in a moment.",
            };
    } catch {
      turn = {
        question,
        error:
          "Couldn't reach the help service. Check your connection and try again.",
      };
    }
    const done = [...next.slice(0, -1), turn];
    setTurns(done);
    saveTurns(done);
    setBusy(false);
    inputRef.current?.focus();
  }

  function reset() {
    setTurns([]);
    saveTurns([]);
    inputRef.current?.focus();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTurns(loadTurns());
          setOpen(true);
        }}
        className="border-border bg-card/60 text-muted-foreground hover:border-[#45453d] hover:text-foreground flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] transition-colors"
      >
        <Sparkles className="text-brand size-3.5 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      {/* Portalled for the same reason the search palette is: the header's
          backdrop-filter would otherwise be this panel's containing block. */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex justify-end"
            onMouseDown={close}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] sm:bg-black/25" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Ask AI"
              className="border-border bg-card relative flex h-dvh w-full flex-col border-l shadow-[0_16px_40px_rgba(0,0,0,0.4)] [animation:rpin_.22s_ease] sm:w-[26rem]"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="border-border flex items-center gap-2 border-b px-4 py-3">
                <Sparkles className="text-brand size-4" strokeWidth={2} />
                <span className="text-[0.9rem] font-semibold">Ask AI</span>
                <span className="text-faint ml-1 text-[0.72rem]">
                  answers from these docs
                </span>
                <div className="ml-auto flex items-center gap-1">
                  {turns.length > 0 && (
                    <button
                      type="button"
                      onClick={reset}
                      aria-label="New conversation"
                      title="New conversation"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md p-1.5 transition-colors"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md p-1.5 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-[0.86rem] leading-relaxed"
              >
                {turns.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      Ask anything about Studio, RP Engine, Dialog Engine or 3D
                      Engine. Answers come from these docs and our download
                      pages.
                    </p>
                    <div className="flex flex-col items-start gap-2">
                      {EXAMPLES.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => send(example)}
                          className="border-border hover:border-[#45453d] hover:text-foreground text-muted-foreground rounded-lg border px-3 py-1.5 text-left text-[0.8rem] transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {turns.map((turn, n) => (
                  <div key={n} className="space-y-2.5">
                    <div className="bg-primary-tint text-primary-ink ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm px-3 py-2 break-words whitespace-pre-wrap">
                      {turn.question}
                    </div>
                    {turn.notice && (
                      <p className="text-amber text-[0.78rem]">{turn.notice}</p>
                    )}
                    {turn.answer !== undefined && (
                      <div className="text-prose break-words">
                        {/* The answer links the pages it used inline; a row of
                            source chips under it only repeated them. */}
                        <Markdown text={turn.answer} onNavigate={close} />
                      </div>
                    )}
                    {turn.error && (
                      <p className="text-destructive text-[0.82rem]">
                        {turn.error}
                      </p>
                    )}
                    {turn.answer === undefined &&
                      !turn.error &&
                      busy &&
                      n === turns.length - 1 && (
                        <p className="text-faint animate-pulse">
                          Reading the docs…
                        </p>
                      )}
                  </div>
                ))}
              </div>

              <form
                className="border-border border-t p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  send(draft);
                }}
              >
                <div className="border-border bg-background focus-within:border-[#45453d] flex items-end gap-2 rounded-xl border p-2">
                  <textarea
                    ref={inputRef}
                    autoFocus
                    value={draft}
                    maxLength={MAX_QUESTION}
                    rows={1}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        send(draft);
                      }
                    }}
                    placeholder="Ask a question"
                    aria-label="Ask a question"
                    className="placeholder:text-faint max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent px-1 text-[0.86rem] outline-none [field-sizing:content]"
                  />
                  <button
                    type="submit"
                    disabled={busy || !draft.trim()}
                    aria-label="Send"
                    className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-lg transition-opacity disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" strokeWidth={2.25} />
                  </button>
                </div>
                <div ref={turnstileBox} />
                <p className="text-faint mt-2 px-1 text-[0.7rem] leading-snug">
                  AI answers can be wrong; the linked pages are the source of
                  truth. It can&apos;t see your account, so don&apos;t share
                  personal details. Account or billing problems: open a ticket
                  in our{" "}
                  <a
                    href="https://resourcepack.ai/discord"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Discord
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
