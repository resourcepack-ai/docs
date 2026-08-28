# What this is

The product documentation site, served at **resourcepack.ai/docs**. Next.js +
MDX on Cloudflare Workers: no auth, no database, no secrets, no bindings at
all — every page is prerendered static content.

It documents the studio, both plugins and the test server, but has **no code
dependency on any of them**. When behaviour changes in a way a user would
notice, the matching page here needs updating by hand — nothing will warn you.

# Setup

```bash
npm install
npm run dev     # http://localhost:3001
```

That's the whole thing. No `.env`, no `wrangler d1 migrations apply`, no
`cf:typegen` (there are no bindings to generate types for — if you ever add
one, add the `cf:typegen` step back to this list).

Port 3001, not 3000, so it can run alongside the app itself.

# Working on this repo

```bash
npx tsc --noEmit        # typecheck
npm run lint            # eslint — the react-hooks rules are strict
```

Both are cheap; run them before considering a change done. `npm run build` is
only worth running when you've touched the MDX pipeline or the Cloudflare
config.

## If Turbopack panics, delete `.next`

Turbopack keeps a persistent cache in `.next/dev/cache`, and it does **not**
invalidate on a `next.config.ts` change or reconcile itself after a dev server
is killed mid-write. Two ways that shows up, both as a red `FATAL` plus a
`next-panic-*.log` in your temp dir:

```
Resource path "docs/src/app/(docs)/page.mdx" needs to be on project filesystem ""
Failed to open SST file ...\.next\dev\cache\turbopack\...\00000248.sst
```

Neither is a problem with the app — pages still serve 200, but HMR is dead
until you restart. `rm -rf .next` and start again; both go away and stay away.

The reliable way to cause it is **two `next dev` servers on the same
directory** (they share `.next` and corrupt each other's cache). Next only
notices the second one late — `--port 3005` doesn't give you a second safe
instance. Kill the first.

## The build must be Turbopack — do NOT add `--webpack`

Our other two Next.js apps build with `next build --webpack`. This app
**can't**, and the failure is not obvious:

```
You are attempting to export "metadata" from a component marked with
"use client", which is disallowed.
```

Every `.mdx` page fails that check under the webpack builder on Next 16.2.9,
including one with no client components anywhere in its import graph (this was
bisected — it's not our `mdx-components.tsx`, and it's not `@mdx-js/react`).
`next build` with Turbopack compiles the identical pages without complaint,
which is why `package.json`'s `build` script is a bare `next build`.

OpenNext shells out to `npm run build`, so the Cloudflare deploy inherits
this automatically. If someone "fixes" the inconsistency with those apps by
adding `--webpack`, every deploy breaks.

## `@opennextjs/cloudflare` is patched for Windows builds

`patches/@opennextjs+cloudflare+1.20.1.patch`, applied by `patch-package` on
`postinstall`. Don't drop it, and if you bump the dependency, regenerate it
(`npx patch-package @opennextjs/cloudflare`) — the filename carries the version
and a stale patch fails loudly on install.

OpenNext's Turbopack plugin finds server chunks with
`.includes(".next/server/chunks/")` — forward slashes only. On Windows nothing
matches, so it emits **empty** `requireChunk`/`loadWasmChunk` switches. The
build passes, `wrangler deploy` reports success, and then every SSR route 500s
with `ChunkLoadError: Failed to load chunk server/chunks/ssr/[root-of-the-server]__*.js`.
The patch normalizes separators in the four places that match or emit those
paths (they end up inside `require(...)` string literals, so they must be POSIX
in the *output* too, not just for comparison).

This only bites here because `docs` is the one app that must build with
Turbopack — see below. Still unfixed in 1.20.2. To check a build before
shipping it:

```bash
grep -c 'case "server/chunks' '.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js'
```

Zero means the patch didn't apply and the deploy would be dead on arrival.
Building in WSL avoids the whole problem, if you'd rather do that.

## `@opennextjs/cloudflare` is pinned exactly

`1.20.1`, not a caret range. `1.20.2` tightened its peer dependency to
`next >=16.2.11` and won't install against `next@16.2.9`, which is what this
app is on. Bump it when the app moves.

# Content pipeline

A page is `src/app/(docs)/<path>/page.mdx`, routed by folder like any other
Next page. There's no CMS and no runtime markdown compilation — MDX is
compiled at build time by `@next/mdx`.

**Adding a page is two steps, and neither is optional:**

1. create `src/app/(docs)/<path>/page.mdx` with a `metadata` export and an `h1`
2. add an entry to `src/lib/nav.ts`

**There are three top-level sections, not one**, each with its own route group,
layout, sidebar tree and pager: `(docs)` on `lib/nav.ts`, `(engine)` on
`lib/engine-nav.ts`, and `(api)` on `lib/api-nav.ts`. Route groups do not
appear in a URL, so an RP Engine page lives at `src/app/(engine)/rp-engine/…`
and is served from `/rp-engine/…` exactly as before it moved.

Adding an RP Engine page is the same two steps against `engine-nav.ts`. What is
easy to forget is the four places that walk ALL the trees and must keep doing
so: the ⌘K palette (`docs-search.tsx`), the sitemap, the JSON-LD
(`structured-data.tsx`), and the mobile drawer in `site-header.tsx`, which
picks a tree by pathname because there is no rail beside it to correct a wrong
answer.

**`engine-nav.ts` is the only tree with two levels**, and its sidebar collapses
where the other two do not. Thirty-four pages is a wall otherwise. Three rules
worth keeping if you touch `EngineNavTree`:

- **Group headings never collapse; pages with children do.** A group is a label
  rather than a destination, and folding one hides a whole subject behind a
  word — that turns the section into a menu to navigate instead of a list to
  scan. What is worth folding is the detail hanging off a page.
- **They start closed, except the one holding the current page.** A nav that
  hides where the reader already is is the failure mode of every collapsing
  sidebar.
- **Open state is not remembered across navigations**, or it ends up entirely
  open, which is the wall again.

**One feature per page in that section.** Recipes, entities and liquids were
one page for a day and it was three unrelated things sharing a URL. A short
page is fine; a page that answers two questions is not.

**The API Reference is a different tree.** `/api-reference` and everything
under it is a separate top-level section with its own sidebar
(`src/lib/api-nav.ts`), generated from `src/openapi.json`, which the app itself
emits — endpoint pages have no MDX and adding an endpoint needs nothing here,
and a wrong description is fixed upstream rather than in this repo. The prose
pages beside them (`(api)/api-reference/(guides)/`) are ordinary MDX but list
themselves in `api-nav.ts` rather than `nav.ts`. The spec is also published at
`/docs/openapi.json`.

`nav.ts` is the single source of truth for the sidebar, the ⌘K search index,
the prev/next pager and the group label above each page title. A page that
exists but isn't listed is reachable by URL and invisible everywhere else.

A new or renamed page also has to be reflected in `/llms.txt` and
`/llms-full.txt`, the llmstxt.org files that tell an assistant which of our
URLs are worth reading. Those are served from the root of resourcepack.ai
rather than from this app, because the convention is only recognised at the
root of a host and this app sits at a path under it — the same reason there's
no `robots.ts` here. `npm run gen:llms-full` regenerates the second of them
from the MDX and the API spec. **Any change to what routes exist matters
there**: a new page, a renamed segment, a deleted one. The whole point of those
files is being trustworthy about which links resolve, and a crawler that finds
a 404 in one has no way to tell us.

The components a page can use without importing anything — `Callout`, `Card`,
`CardGroup`, `Steps`, `Step` — are registered in `src/mdx-components.tsx`;
read that file for the props. `Card`'s `icon` comes from the fixed set in
`src/components/mdx/icons.tsx`, which is deliberately small: widen it by
adding a name there, not by letting `Card` take arbitrary nodes.

There used to be a `/reference/writing-docs` page demoing all of it. It was
removed — this is a product doc site, and a page about how to write the pages
is for us, not for users.

## Things that will bite you

- **remark/rehype plugins are named as strings** in `next.config.ts`, not
  imported. Turbopack runs the MDX pipeline in Rust and can't take JS function
  references — importing them normally works for a webpack build and breaks
  `npm run dev`. Options must stay JSON-serializable for the same reason.
- **`#docs-article` is load-bearing.** `TableOfContents` scans that element's
  DOM for `h2[id]`/`h3[id]` rather than reading a build-time heading export.
  Renaming the id silently empties every "On this page".
- **Heading ids come from `rehype-slug`.** Drop it and every anchor link and
  the whole TOC go with it.
- **Code block markup is generated**, so it's styled in `globals.css` rather
  than `mdx-components.tsx` — `figure[data-rehype-pretty-code-figure]`,
  `[data-line]`, `[data-highlighted-line]`. `keepBackground: false` strips
  Shiki's own background so blocks sit on our surface colour.
- **Components must be registered** in `src/mdx-components.tsx` to be usable
  in a page without an import. That's deliberate: content files stay content.
- **`eslint.config.mjs` ignores `.open-next/**` and `.wrangler/**`**, which
  `eslint-config-next` does not. Without those two lines `npm run lint` is
  clean until the first Cloudflare build, then reports ~7000 problems in
  bundled Next server code.

# Design

Dark-only, like the app itself (`<html>` is permanently `.dark`). There's no
theme toggle rather than a half-built one.

`src/app/globals.css` **duplicates the app's design tokens** — same warm-dark
surfaces (`#1b1b18` family), same `--primary: #4d8dff`, same
`--brand-ai-blue: #3670f8` for the `.ai` in the wordmark, same Onest +
IBM Plex Mono pairing. It is a real copy rather than a shared package, and a
trimmed one: only the tokens this site uses. If the palette moves, it moves
here too, because nothing will warn you.

No `@tailwindcss/typography`. Prose styling lives in `mdx-components.tsx`
against our own tokens; `prose` classes are a stranger's design system and
fight them.

# Deployment

Cloudflare Workers via `opennextjs-cloudflare`, straight to production: nothing
here is auth-gated or data-touching, so there is nothing to stage.
`wrangler.jsonc` has no `env.staging` block — don't add one without a real
reason.

## This app lives under a basePath

`next.config.ts` sets `basePath: "/docs"`, because the public address is
resourcepack.ai/docs rather than a subdomain of its own — a subdirectory so the
docs' search authority lands on the domain that sells something. It is still a
wholly separate Worker with its own deploy, and the marketing site on the apex
has no idea it exists.

What that costs you when working here:

- **`next/link` hrefs and `_next` assets get the prefix for free**, which is
  why nothing in `nav.ts` or the `.mdx` Cards changed. Nothing else does —
  **including `next/image`'s `src`**, which is emitted verbatim. This bit
  twice, in the metadata favicon and the header mark, both of which asked
  for `/logo.svg` and so resolved against the marketing site instead. That
  site serves a byte-identical logo, so both looked correct in production
  while pointing at the wrong app; the only symptom was a 404 per page load
  in local dev, where nothing serves the apex.
  Use `asset()` from `src/lib/base-path.ts` for any literal path, and build
  absolute URLs (`sitemap.ts`, `metadataBase`) from its `BASE_PATH` rather
  than typing `/docs` again.
- **There is no `robots.ts` here, on purpose.** A robots.txt is only honoured
  at the root of a host and this app doesn't own one; the marketing site's
  `robots.ts` lists this app's sitemap. `/llms.txt` is over there for the same
  reason, and links to every page here by hand — see adding a page, above.
