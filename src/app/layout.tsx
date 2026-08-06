import type { Metadata } from "next";
import { IBM_Plex_Mono, Onest } from "next/font/google";

import "./globals.css";
import { SITE_URL } from "./sitemap";

// Same pairing as studio and landing — the docs are the same product.
const onest = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  // The basePath is part of the public address, so it belongs here — Next
  // resolves relative metadata URLs against this and does NOT add basePath
  // for you. Shares its value with sitemap.ts rather than repeating the
  // string, since the two disagreeing is exactly the bug nobody notices.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ResourcePack AI Docs",
    // Page titles are just "Quickstart", "Introduction", … in their own
    // metadata exports; this appends the product.
    template: "%s · ResourcePack AI Docs",
  },
  description:
    "Documentation for ResourcePack AI — build Minecraft Resource Packs in the browser, test them live, and push them to your players.",
  // Written out with the basePath by hand. Next prefixes `next/link` hrefs
  // and `_next` asset URLs, but NOT metadata icon paths — so a bare
  // "/logo.svg" here emits a link to the apex, which lands on the *landing*
  // Worker. That happens to serve a byte-identical logo today, so this would
  // have looked fine while being wrong; the day landing's public/ changes,
  // the docs favicon changes with it for no visible reason.
  icons: { icon: "/docs/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `.dark` is permanent, matching studio — there is no light theme.
  return (
    <html lang="en" className={`dark ${onest.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
