import type { Metadata } from "next";
import { IBM_Plex_Mono, Onest } from "next/font/google";

import "./globals.css";
import { SITE_URL } from "./sitemap";
import { asset } from "@/lib/base-path";

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
  // Metadata icon paths are not basePath-prefixed by Next — see
  // lib/base-path.ts for the full trap and the other place it bit.
  icons: { icon: asset("/logo.svg") },
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
