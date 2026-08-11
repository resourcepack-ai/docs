/**
 * Builds llms-full.txt — the whole documentation as one plain-text file.
 *
 *   npm run gen:llms-full
 *
 * **Why this is a second file and not llms.txt.** The llmstxt.org convention
 * has two: `llms.txt` is a short, hand-written map of what exists and which
 * links are worth fetching, and `llms-full.txt` is the content itself, so an
 * assistant can read the lot in one request instead of crawling twenty pages.
 * landing's `llms.txt` must stay short — its own comment is emphatic about not
 * becoming a dump — and this is where the dump belongs.
 *
 * **Why it's written into ../landing/public.** The convention is only
 * recognised at the root of a host, and landing owns that root; this app is a
 * path route under it and cannot serve `/llms-full.txt`. Same reason robots.txt
 * and llms.txt live over there. Generated and committed, so landing gains no
 * build-time dependency on this app — the coupling is a file in a diff, exactly
 * as with openapi.json.
 *
 * The MDX is flattened rather than rendered: component tags become their inner
 * text, since `<Callout title="…">` around a paragraph is presentation, and a
 * reader that wants the sentence shouldn't have to parse JSX to reach it.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = join(docsDir, "src", "app");
const OUT = join(docsDir, "..", "landing", "public", "llms-full.txt");
const SITE = "https://resourcepack.ai/docs";

/** Every page.mdx under src/app, with the URL it serves at. */
async function findPages(dir, segments = []) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // `_parked` folders aren't routed; `(groups)` don't affect the URL.
      if (entry.name.startsWith("_")) continue;
      const isGroup = entry.name.startsWith("(") && entry.name.endsWith(")");
      // A dynamic segment has no single URL — endpoint pages are covered by
      // the spec section below instead.
      if (entry.name.startsWith("[")) continue;
      found.push(...(await findPages(join(dir, entry.name), isGroup ? segments : [...segments, entry.name])));
    } else if (entry.name === "page.mdx") {
      found.push({ file: join(dir, entry.name), href: `/${segments.join("/")}` });
    }
  }
  return found;
}

/** MDX -> readable text. */
function flatten(mdx) {
  return (
    mdx
      // The metadata export is front matter, not content.
      .replace(/^export const metadata = \{[\s\S]*?\};\s*/m, "")
      // Commented-out held-back sections.
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      // Self-closing components carry no prose.
      .replace(/<[A-Z][A-Za-z]*\b[^>]*\/>/g, "")
      // A component's title attribute IS content — keep it as a lead-in.
      .replace(/<([A-Z][A-Za-z]*)\b[^>]*\btitle="([^"]*)"[^>]*>/g, "\n$2\n")
      // Any remaining open/close tag: drop the tag, keep what it wrapped.
      .replace(/<\/?[A-Z][A-Za-z]*\b[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

const pages = (await findPages(APP_DIR)).sort((a, b) => a.href.localeCompare(b.href));

const parts = [
  "# ResourcePack AI — full documentation",
  "",
  "The complete text of the documentation at https://resourcepack.ai/docs, as one file.",
  "The machine-readable API description is at https://resourcepack.ai/docs/openapi.json.",
  "",
];

for (const page of pages) {
  const raw = await readFile(page.file, "utf8");
  const body = flatten(raw);
  if (!body) continue;
  parts.push("---", "", `Source: ${SITE}${page.href === "/" ? "" : page.href}`, "", body, "");
}

// The endpoints have no MDX of their own — they're generated from the spec, so
// they're summarised from the same place rather than being absent.
const spec = JSON.parse(await readFile(join(docsDir, "src", "openapi.json"), "utf8"));
parts.push("---", "", "# API endpoints", "");
parts.push(`Base URL: ${spec.servers[0].url}`, "");
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    parts.push(`## ${operation.summary} — ${method.toUpperCase()} ${path}`);
    parts.push(`Reference: ${SITE}/api-reference/${operation.operationId.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`);
    if (operation["x-available"] === false) {
      parts.push("Currently unavailable: this endpoint answers 503 while the feature is switched off.");
    }
    parts.push("", operation.description, "");
  }
}

await writeFile(OUT, `${parts.join("\n").replace(/\n{3,}/g, "\n\n")}\n`);
console.log(`[llms-full] wrote ${OUT} (${pages.length} pages + ${Object.keys(spec.paths).length} paths)`);
