"use client";

import { useEffect, useState } from "react";
import type { HighlighterCore, ThemedToken } from "shiki/core";

/**
 * A code block in an Ask AI answer, coloured like the code blocks on the
 * pages: Shiki, with the same `github-dark-default` theme rehype-pretty-code
 * uses at build time.
 *
 * The pages are highlighted at build; an answer arrives at runtime, so this
 * loads a highlighter in the browser — only the core, the JavaScript regex
 * engine (no WebAssembly) and the handful of languages answers actually
 * contain, and only the first time an answer has a code block. Until then,
 * and for any other language, the block is plain text.
 *
 * Tokens become React spans with a colour, never HTML: the answer is model
 * output and the panel never puts it into the page as markup.
 */

const LANGS: Record<string, () => Promise<unknown>> = {
  java: () => import("shiki/langs/java.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  properties: () => import("shiki/langs/properties.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
};

const ALIASES: Record<string, string> = {
  yml: "yaml",
  sh: "shellscript",
  bash: "shellscript",
  shell: "shellscript",
  console: "shellscript",
  zsh: "shellscript",
  js: "javascript",
  ts: "typescript",
  jsonc: "json",
  mcmeta: "json",
};

const THEME = "github-dark-default";

let highlighter: Promise<HighlighterCore> | null = null;

function loadHighlighter(): Promise<HighlighterCore> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, theme, ...langs] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      import("shiki/themes/github-dark-default.mjs"),
      ...Object.values(LANGS).map((load) => load()),
    ]);
    return createHighlighterCore({
      themes: [(theme as { default: never }).default],
      langs: langs.map((l) => (l as { default: never }).default),
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  })().catch((err) => {
    highlighter = null;
    throw err;
  });
  return highlighter;
}

export function languageOf(fence: string): string | null {
  const name = fence.trim().toLowerCase().split(/\s/)[0] ?? "";
  const lang = ALIASES[name] ?? name;
  return lang in LANGS ? lang : null;
}

export function CodeBlock({ code, lang }: { code: string; lang: string | null }) {
  const [lines, setLines] = useState<ThemedToken[][] | null>(null);

  useEffect(() => {
    if (!lang) return;
    let live = true;
    loadHighlighter()
      .then((h) => {
        if (live) setLines(h.codeToTokens(code, { lang, theme: THEME }).tokens);
      })
      .catch(() => {
        // Plain text is a fine answer to a highlighter that would not load.
      });
    return () => {
      live = false;
    };
  }, [code, lang]);

  return (
    <pre className="bg-background border-border overflow-x-auto rounded-lg border p-3 font-mono text-[0.78rem] leading-relaxed">
      <code>
        {lines
          ? lines.map((line, i) => (
              <span key={i} className="block min-h-[1lh]">
                {line.map((token, j) => (
                  <span key={j} style={{ color: token.color }}>
                    {token.content}
                  </span>
                ))}
              </span>
            ))
          : code}
      </code>
    </pre>
  );
}
