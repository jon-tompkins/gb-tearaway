import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const DESCRIPTION =
  "A fresh, screen-free puzzle page for your kid every morning: real kid-safe news, mazes, crosswords, a word of the day. Age-tuned and ready to print at breakfast.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.backofthebox.xyz"),
  title: "Back of the Box — a printed morning puzzle page for kids",
  description: DESCRIPTION,
  openGraph: {
    title: "Back of the Box",
    description: DESCRIPTION,
    url: "/",
    siteName: "Back of the Box",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Back of the Box — a smarter breakfast, printed on paper" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Back of the Box",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4eee3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
