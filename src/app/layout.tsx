import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Onest } from "next/font/google";

import "./globals.css";
import { SITE_URL } from "./sitemap";
import { asset } from "@/lib/base-path";
import { GoogleAnalytics } from "@/components/google-analytics";

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

/**
 * The stripe down the left of a Discord embed, and the mobile address bar.
 * Copied from landing's layout, which has the full note — same `#3670f8` as
 * the `.ai` in the wordmark, and one of three copies (here, landing, studio's
 * gallery layout) because these are separate Workers with no shared package.
 */
export const viewport: Viewport = { themeColor: "#3670f8" };

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
  // Link previews, and the reason they're declared once here rather than per
  // page: Next fills og:title and og:description from each page's own resolved
  // `title`/`description` (template included), so a page that sets those two —
  // which every page here does, it's step 1 of adding one — gets a preview
  // about itself for free. Setting them literally in this block would instead
  // stamp the same title on all 21.
  //
  // No image, matching landing: there is no OG card artwork anywhere in the
  // repo yet, and a URL pointing at one that doesn't exist is worse than the
  // text-only preview every platform falls back to. `summary_large_image`
  // degrades to a plain summary card until one exists, which is also landing's
  // current state — add the artwork in both apps at once.
  openGraph: {
    siteName: "ResourcePack AI Docs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
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
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
