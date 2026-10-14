"use client";

import { useEffect, useState } from "react";
import type { HighlighterCore, ThemedToken } from "shiki/core";

/**
 * A code block in an Ask AI answer, coloured like the code blocks on the
 * pages: Shiki, with the same `github-dark-default` theme rehype-pretty-code
 * uses at build time.
 *
 * The pages are highlighted at build; an answer arrives at runtime, so this
 * loads a highlighter in the browser: the core and the JavaScript regex engine
 * (no WebAssembly) the first time an answer has a code block, and each
 * language the first time an answer uses it. Until then,
 * and for any other language, the block is plain text.
 *
 * Tokens become React spans with a colour, never HTML: the answer is model
 * output and the panel never puts it into the page as markup.
 */

const LANGS: Record<string, () => Promise<{ default: unknown }>> = {
  java: () => import("shiki/langs/java.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  groovy: () => import("shiki/langs/groovy.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  properties: () => import("shiki/langs/properties.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
};

const ALIASES: Record<string, string> = {
  kt: "kotlin",
  kts: "kotlin",
  gradle: "groovy",
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
  cfg: "ini",
  conf: "ini",
  py: "python",
};

const THEME = "github-dark-default";

let highlighter: Promise<HighlighterCore> | null = null;
/** Languages already in the highlighter, or on their way. Each is its own chunk, fetched the first time an answer uses it. */
const loading = new Map<string, Promise<void>>();

function loadHighlighter(): Promise<HighlighterCore> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, theme] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
      import("shiki/themes/github-dark-default.mjs"),
    ]);
    return createHighlighterCore({
      themes: [(theme as { default: never }).default],
      langs: [],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  })().catch((err) => {
    highlighter = null;
    throw err;
  });
  return highlighter;
}

async function highlighterFor(lang: string): Promise<HighlighterCore> {
  const h = await loadHighlighter();
  let ready = loading.get(lang);
  if (!ready) {
    ready = LANGS[lang]()
      .then((mod) => h.loadLanguage(mod.default as never))
      .catch((err) => {
        loading.delete(lang);
        throw err;
      });
    loading.set(lang, ready);
  }
  await ready;
  return h;
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
    highlighterFor(lang)
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
