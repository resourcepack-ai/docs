import type { Metadata } from "next";
import { IBM_Plex_Mono, Onest } from "next/font/google";

import "./globals.css";

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
  metadataBase: new URL("https://docs.resourcepack.ai"),
  title: {
    default: "ResourcePack AI Docs",
    // Page titles are just "Quickstart", "Introduction", … in their own
    // metadata exports; this appends the product.
    template: "%s · ResourcePack AI Docs",
  },
  description:
    "Documentation for ResourcePack AI — build Minecraft resource packs in the browser, test them live, and push them to your players.",
  icons: { icon: "/logo.svg" },
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
