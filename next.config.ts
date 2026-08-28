import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app serves at resourcepack.ai/docs, not on its own domain — a
  // subdirectory so its search authority accrues to the domain that sells
  // something, instead of pooling on a hostname that never will. It's still
  // its own Worker and its own deploy; a Cloudflare route
  // (`resourcepack.ai/docs*`, see wrangler.jsonc) runs in front of landing's
  // custom domain and hands those paths here.
  //
  // Every internal href in `nav.ts` and the .mdx Cards stays root-relative —
  // next/link prepends this, so none of them changed.
  basePath: "/docs",
  // .mdx files under src/app are real pages — that's the whole content
  // pipeline here, no CMS and no runtime markdown compilation.
  pageExtensions: ["ts", "tsx", "mdx"],
  // This app is its own workspace. Without this, Turbopack can see a
  // package-lock.json in a directory above ours, pick that as the root, and
  // warn on every `npm run dev`.
  turbopack: { root: import.meta.dirname },

  /**
   * Security response headers.
   *
   * The same set studio sends from its Worker (see
   * ../studio/src/lib/security-headers.ts, which has the reasoning) — this app
   * has no custom worker branch to hang them off, so they go through Next's own
   * `headers()`.
   *
   * `frame-ancestors 'none'` is the one that matters most here: the docs sit on the apex
   * under /docs, sharing an origin with the marketing site.
   *
   * **A strict `script-src` is deliberately absent.** It needs per-request
   * nonces, which need middleware, which the Cloudflare adapter can't run —
   * adding `'unsafe-inline'` instead would be a policy that looks like
   * protection and blocks nothing. What is here are the directives that work
   * without a nonce and still constrain what injected script could reach.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next's App Router streams its RSC payload in an inline script,
              // so this is not a constraint on script — see studio's file. It
              // is written out because OMITTING it is what silently bound it
              // to `default-src 'self'` and left every page an unhydrated
              // shell. Every fetch directive below is named for that reason.
              // static.cloudflareinsights.com is the Web Analytics beacon (components/cloudflare-analytics.tsx);
              // its report to cloudflareinsights.com is already inside `connect-src https:`.
              "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https:",
              "media-src 'self' data: blob: https:",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'none'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          // No `preload` — see studio's note. That is a browser-vendor list
          // submission, and it is slow to leave.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    // Plugins are named as STRINGS on purpose: Turbopack (the `next dev`
    // default) runs the MDX pipeline in Rust and can't accept JS function
    // references, only serializable options. Importing these normally
    // would work for `next build --webpack` and break `npm run dev`.
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      // Heading ids — the "On this page" rail and every #anchor link
      // depend on these existing.
      "rehype-slug",
      // Build-time syntax highlighting (Shiki). Zero client JS; we
      // override the theme's background in globals.css so code blocks sit
      // on our own surface colour instead of the theme's near-black.
      // defaultLang catches bare ``` fences (the join address, /permlink,
      // /link, /sound): without it rehype-pretty-code skips them, they render
      // as a bare <pre> with none of the figure styling, and the difference
      // reads as a broken block rather than a choice. It MUST stay scoped to
      // block — a bare string applies to inline code too, which restyled
      // every `backtick` snippet on the site.
      ["rehype-pretty-code", { theme: "github-dark-default", keepBackground: false, defaultLang: { block: "text" } }],
    ],
  },
});

export default withMDX(nextConfig);

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev({
  remoteBindings: false,
});
