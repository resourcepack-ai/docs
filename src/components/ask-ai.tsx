"use client";

import {
  ArrowUp,
  Boxes,
  Download,
  MessageCircle,
  Monitor,
  Package,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react";
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

import { CodeBlock, languageOf } from "@/components/ask-ai-code";
import { cn } from "@/lib/utils";

/**
 * "Ask the docs": a side panel that answers questions from these docs, each
 * answer set like a docs page of its own (an eyebrow, the question as its
 * heading, a callout for the catch, Read next cards). On a wide screen it sits
 * beside the page rather than over it (globals.css), so a page an answer links
 * to opens with the conversation still there.
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

/** A page an answer used: a docs page, or one section of one (`section`). */
interface Source {
  title: string;
  section?: string;
  url: string;
}

interface Turn {
  question: string;
  answer?: string;
  sources?: Source[];
  notice?: string;
  error?: string;
  /** The conversation the service filed this under; sent back so follow-ups join it. */
  threadId?: string;
  /** What the service signed, sent back as context with the next question. */
  signed?: { question: string; answer: string; sig: string } | null;
}

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

const LINK = "text-primary-ink underline underline-offset-2";

function AnswerLink({
  href,
  children,
  onNavigate,
  className = LINK,
}: {
  href: string;
  children: ReactNode;
  onNavigate: () => void;
  className?: string;
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
        className={className}
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
      className={className}
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

/**
 * The one catch in an answer, set as the docs' own callout. The help bot is
 * asked to write it as a blockquote whose first words are bold (the title),
 * so any other reader of the same answer, Discord included, just sees a quote.
 */
function Callout({
  text,
  onNavigate,
}: {
  text: string;
  onNavigate: () => void;
}) {
  const title = /^\*\*([^*]+?)\*\*\s*/.exec(text);
  return (
    <div className="text-prose flex gap-2.5 rounded-[10px] border border-[#4a3d1f] bg-[#2a2416] px-3.5 py-[0.7rem] text-[0.845rem] leading-[1.6]">
      <TriangleAlert className="text-amber mt-[3px] size-[15px] shrink-0" />
      <div className="min-w-0">
        {title && (
          <b className="text-foreground mb-px block font-semibold">
            {title[1].replace(/[.:]$/, "")}
          </b>
        )}
        {inline(title ? text.slice(title[0].length) : text, onNavigate)}
      </div>
    </div>
  );
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
  const starts = /^\s*(\d+[.)]|[-*•]|>)\s?/;
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = languageOf(line.slice(3));
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```"))
        body.push(lines[i++]);
      i++;
      blocks.push(<CodeBlock key={key++} code={body.join("\n")} lang={lang} />);
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i]))
        quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(
        <Callout
          key={key++}
          text={quote.join(" ").trim()}
          onNavigate={onNavigate}
        />,
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
      const itemPattern =
        listKind === "ol" ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/;
      while (i < lines.length && itemPattern.test(lines[i]))
        items.push(lines[i++].replace(itemPattern, ""));
      const List = listKind;
      blocks.push(
        <List
          key={key++}
          className={`${listKind === "ol" ? "list-decimal" : "list-disc"} space-y-1 pl-[1.125rem]`}
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
      !starts.test(lines[i])
    ) {
      para.push(lines[i++].replace(/^#{1,6}\s+/, ""));
    }
    if (para.length === 0) {
      // A line the rules above did not take (a lone ">" or "-"): show it as text.
      para.push(lines[i++]);
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
  return (
    <div className="flex flex-col gap-2.5 [&_strong]:text-foreground [&_strong]:font-semibold">
      {blocks}
    </div>
  );
}

// --- The panel ---------------------------------------------------------------

/** Starting points for an empty panel, as the docs' own cards. */
const EXAMPLES: {
  Icon: typeof Download;
  title: string;
  detail: string;
  question: string;
}[] = [
  {
    Icon: Download,
    title: "Export a pack for Bedrock",
    detail: "What converts, and what needs a server",
    question: "How do I export a pack for Bedrock?",
  },
  {
    Icon: Monitor,
    title: "Test a pack on a real server",
    detail: "Join the test server, or sync to your own",
    question: "How do I test my pack on a real server?",
  },
  {
    Icon: Package,
    title: "Get the latest RP Engine",
    detail: "Version, download and where to find it",
    question: "What's the latest RP Engine, and where do I get it?",
  },
  {
    Icon: Boxes,
    title: "Import a Blockbench model",
    detail: "Bring a .bbmodel into a pack",
    question: "Can I import a Blockbench model?",
  },
];

/** Wide enough that the panel sits beside the page (see globals.css) rather than over it. */
const BESIDE_THE_PAGE = "(min-width: 64rem)";

const EYEBROW =
  "text-brand font-mono text-[0.69rem] tracking-[0.1em] uppercase";

/** What a page without a section is, for the small line above its title. */
function sourceKind(url: string): string {
  if (url.startsWith(DOCS_ORIGIN)) return "Docs";
  if (url.endsWith(".pdf")) return "PDF";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

/** "Read next": the pages the answer used, as the cards at the foot of a docs page. */
function ReadNext({
  sources,
  onNavigate,
}: {
  sources: Source[];
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-faint font-mono text-[0.66rem] tracking-[0.1em] uppercase">
        Read next
      </span>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {sources.map((source) => (
          <AnswerLink
            key={source.url}
            href={source.url}
            onNavigate={onNavigate}
            className="border-border text-foreground flex flex-col gap-0.5 rounded-[10px] border px-3.5 py-[0.7rem] text-[0.875rem] font-medium no-underline transition-colors hover:border-[#45453d]"
          >
            <span className="text-faint text-[0.72rem] font-normal">
              {source.section ? source.title : sourceKind(source.url)}
            </span>
            <span className="leading-snug">
              {source.section ?? source.title}
            </span>
          </AnswerLink>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex flex-col gap-2" aria-label="Writing an answer">
      <div className="bg-muted h-2.5 w-[92%] animate-pulse rounded-full" />
      <div className="bg-muted h-2.5 w-[78%] animate-pulse rounded-full" />
      <div className="bg-muted h-2.5 w-[40%] animate-pulse rounded-full" />
    </div>
  );
}

export function AskAi() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileToken = useTurnstile(turnstileBox);

  // A new turn is read from its heading down, like a page, not from the bottom.
  useEffect(() => {
    latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [turns.length]);

  // While open, the page makes room for the panel (globals.css). Escape closes.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.askAi = "open";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete root.dataset.askAi;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  // Following a link keeps the conversation open beside the page it opened.
  // Only where the panel covers the page (a phone) does it get out of the way.
  const onNavigate = useCallback(() => {
    if (!window.matchMedia(BESIDE_THE_PAGE).matches) setOpen(false);
  }, []);

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
        body: JSON.stringify({
          question,
          history,
          threadId,
          turnstileToken: token,
        }),
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
          if (open) {
            setOpen(false);
            return;
          }
          setTurns(loadTurns());
          setOpen(true);
        }}
        aria-pressed={open}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] transition-colors",
          open
            ? "border-primary bg-primary-tint text-foreground"
            : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-[#45453d]",
        )}
      >
        <MessageCircle className="size-3.5 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">Ask</span>
      </button>

      {/* Portalled for the same reason the search palette is: the header's
          backdrop-filter would otherwise be this panel's containing block.
          No scrim: on a wide screen the page moves over to make room, and on
          a phone the panel is the whole screen. */}
      {open &&
        createPortal(
          <section
            aria-label="Ask the docs"
            className="border-border bg-background fixed inset-y-0 right-0 z-50 flex w-full flex-col [animation:rpin_.22s_ease] lg:w-(--ask-w) lg:border-l lg:shadow-[-24px_0_48px_rgba(0,0,0,0.25)]"
          >
            <div className="border-line text-muted-foreground flex h-[2.875rem] shrink-0 items-center gap-2 border-b pr-2.5 pl-5 text-[0.8rem] sm:pl-7">
              <MessageCircle
                className="text-primary-ink size-[15px]"
                strokeWidth={2}
              />
              <span>Ask the docs</span>
              <div className="ml-auto flex items-center gap-0.5">
                {turns.length > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="New conversation"
                    title="New conversation"
                    className="hover:text-foreground hover:bg-muted grid size-[30px] place-items-center rounded-[7px] transition-colors"
                  >
                    <Plus className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="hover:text-foreground hover:bg-muted grid size-[30px] place-items-center rounded-[7px] transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex flex-1 flex-col overflow-y-auto px-5 py-[1.625rem] sm:px-7"
            >
              {turns.length === 0 && (
                <div className="flex flex-col gap-4">
                  <span className={EYEBROW}>Ask the docs</span>
                  <h2 className="-mt-2 text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-balance">
                    What are you trying to do?
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Ask in your own words. You get an answer written from these
                    pages, with the pages to read next.
                  </p>
                  <div className="grid gap-2.5">
                    {EXAMPLES.map(({ Icon, title, detail, question }) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => send(question)}
                        className="border-border bg-card flex items-start gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors hover:border-[#45453d]"
                      >
                        <Icon className="text-brand mt-0.5 size-4 shrink-0" />
                        <span>
                          <b className="mb-0.5 block text-[0.875rem] font-medium">
                            {title}
                          </b>
                          <span className="text-muted-foreground text-[0.78rem]">
                            {detail}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((turn, n) => (
                <article
                  key={n}
                  ref={n === turns.length - 1 ? latestRef : undefined}
                  className={cn(
                    "flex scroll-mt-4 flex-col gap-4",
                    n > 0 && "border-line mt-8 border-t pt-8",
                  )}
                >
                  <span className={EYEBROW}>
                    {turn.error ? "No answer" : "Answer"}
                  </span>
                  <h2 className="-mt-2 text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] break-words text-balance">
                    {turn.question}
                  </h2>
                  {turn.notice && (
                    <p className="text-amber text-[0.78rem] leading-snug">
                      {turn.notice}
                    </p>
                  )}
                  {turn.answer !== undefined && (
                    <div className="text-prose text-[0.906rem] leading-[1.7] break-words">
                      <Markdown text={turn.answer} onNavigate={onNavigate} />
                    </div>
                  )}
                  {/* Sections only, two at most: the service already picks them
                      that way, and a conversation saved before it did is held
                      to the same rule. */}
                  {(turn.sources ?? []).some((s) => s.section) && (
                    <ReadNext
                      sources={(turn.sources ?? [])
                        .filter((s) => s.section)
                        .slice(0, 2)}
                      onNavigate={onNavigate}
                    />
                  )}
                  {turn.error && (
                    <p className="text-destructive text-[0.875rem]">
                      {turn.error}
                    </p>
                  )}
                  {turn.answer === undefined &&
                    !turn.error &&
                    busy &&
                    n === turns.length - 1 && <Thinking />}
                </article>
              ))}
            </div>

            <form
              className="shrink-0 px-5 pt-3.5 pb-4 sm:px-7"
              onSubmit={(event) => {
                event.preventDefault();
                send(draft);
              }}
            >
              <div className="bg-card flex min-h-11 items-end gap-2.5 rounded-[22px] border border-[#45453d] py-[7px] pr-[7px] pl-[18px] focus-within:border-[#5b5b51]">
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
                  placeholder={
                    turns.length ? "Ask a follow-up" : "Ask a question"
                  }
                  aria-label="Ask a question"
                  className="placeholder:text-faint max-h-32 min-h-[1.375rem] flex-1 resize-none self-center bg-transparent text-[0.875rem] outline-none [field-sizing:content]"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  aria-label="Send"
                  className="bg-primary grid size-[30px] shrink-0 place-items-center rounded-full text-white transition-opacity disabled:opacity-35"
                >
                  <ArrowUp className="size-4" strokeWidth={2.4} />
                </button>
              </div>
              <div ref={turnstileBox} />
              <p className="text-faint mt-2 text-center text-[0.72rem]">
                Can be wrong; the pages are right. Account help is in{" "}
                <a
                  href="https://resourcepack.ai/discord"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-ink underline underline-offset-2"
                >
                  Discord
                </a>
                .
              </p>
            </form>
          </section>,
          document.body,
        )}
    </>
  );
}
