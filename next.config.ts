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
