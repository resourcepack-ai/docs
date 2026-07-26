# What this is

The product documentation site, deployed at docs.resourcepack.ai. Next.js +
MDX on Cloudflare Workers, same shape as `../landing`: no auth, no database,
no secrets, no bindings at all — every page is prerendered static content.

It documents `studio`, both plugins and the test server, but has **no code
dependency on any of them**. Nothing here imports from a sibling directory.
When behaviour in `studio` or `user-plugin` changes in a way a user would
notice, the matching page here needs updating by hand — nothing will warn you.

# Setup

```bash
npm install
npm run dev     # http://localhost:3001
```

That's the whole thing. No `.env`, no `wrangler d1 migrations apply`, no
`cf:typegen` (there are no bindings to generate types for — if you ever add
one, add the `cf:typegen` step back to this list).

Port 3001, not 3000, so it can run alongside `studio` or `landing`.

# Working on this repo

```bash
npx tsc --noEmit        # typecheck
npm run lint            # eslint — the react-hooks rules are strict, as in studio
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

`landing` and `studio` both build with `next build --webpack`. This app
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
this automatically. If someone "fixes" the inconsistency with the sibling apps
by adding `--webpack`, every deploy breaks.

## `@opennextjs/cloudflare` is pinned exactly

`1.20.1`, not a caret range. `1.20.2` tightened its peer dependency to
`next >=16.2.11` and won't install against the `next@16.2.9` all three
Next apps in this repo are on. Bump it when studio and landing move.

# Content pipeline

A page is `src/app/(docs)/<path>/page.mdx`, routed by folder like any other
Next page. There's no CMS and no runtime markdown compilation — MDX is
compiled at build time by `@next/mdx`.

**Adding a page is two steps, and the second one is not optional:**

1. create `src/app/(docs)/<path>/page.mdx` with a `metadata` export and an `h1`
2. add an entry to `src/lib/nav.ts`

`nav.ts` is the single source of truth for the sidebar, the ⌘K search index,
the prev/next pager and the group label above each page title. A page that
exists but isn't listed is reachable by URL and invisible everywhere else.

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
  bundled Next server code. (`landing` and `studio` have the same gap.)

# Design

Dark-only, like studio (`<html>` is permanently `.dark`). There's no theme
toggle rather than a half-built one.

`src/app/globals.css` **duplicates studio's design tokens** — same warm-dark
surfaces (`#1b1b18` family), same `--primary: #4d8dff`, same
`--brand-ai-blue: #3670f8` for the `.ai` in the wordmark, same Onest +
IBM Plex Mono pairing. As with `landing`, this is a real copy and not a shared
package: if studio's palette moves, move these too, because nothing will warn
you. It's a trimmed copy — only the tokens this site uses, none of studio's
animation keyframes.

No `@tailwindcss/typography`. Prose styling lives in `mdx-components.tsx`
against our own tokens; `prose` classes are a stranger's design system and
fight them.

# Deployment

Preferred: from the repo root, `npm run deploy -- docs prod` (see
`../AGENTS.md`). Same `opennextjs-cloudflare` shape as landing and studio.

No staging environment, same reasoning as `landing`: nothing here is
auth-gated or data-touching, so there's nothing to stage. `wrangler.jsonc` has
no `env.staging` block — don't add one without a real reason.

`docs.resourcepack.ai` is a fresh subdomain that no other Worker has ever
claimed, so there's no release-then-claim deploy ordering to worry about
(unlike the landing/studio route handover).
