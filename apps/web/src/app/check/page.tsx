import type { Metadata } from "next";

import { Checker } from "@/components/checker/checker";
import { m } from "@/lib/app";

export const metadata: Metadata = {
  title: m.results.title,
  description: m.home.heroBody,
};

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{m.results.title}</h1>
      <p className="mt-2 text-muted-foreground">{m.home.heroBody}</p>
      <Checker />
    </main>
  );
}
