import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { m } from "@/lib/app";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://envext.health"),
  title: { default: m.appName, template: `%s · ${m.appName}` },
  description: m.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b bg-surface/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground"
              >
                Rx
              </span>
              {m.appName}
            </Link>
            <nav>
              <Link href="/check" className="text-sm font-medium text-primary hover:underline">
                {m.home.cta}
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t">
          <div className="mx-auto w-full max-w-5xl space-y-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
            <p>{m.disclaimer}</p>
            <p>
              Sources: RxNorm (US National Library of Medicine) and drug labels from openFDA /
              DailyMed.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
