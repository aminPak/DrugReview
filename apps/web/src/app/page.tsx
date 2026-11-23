import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { m } from "@/lib/app";

export default function Home() {
  return (
    <main>
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <p className="mb-4 text-sm font-medium text-primary">{m.appName}</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {m.home.heroTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{m.home.heroBody}</p>
        <Link href="/check" className={buttonVariants({ size: "lg", className: "mt-8" })}>
          {m.home.cta}
          <ArrowRight />
        </Link>
      </section>

      <section className="border-y bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">{m.home.stepsTitle}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {m.home.steps.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full bg-background shadow-none">
                  <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <CardTitle className="mt-4">{step.title}</CardTitle>
                  <CardDescription className="mt-1">{step.body}</CardDescription>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <Card className="border-info/30 bg-info-soft/60 shadow-none">
          <div className="flex items-center gap-2 text-info">
            <Info className="size-5" />
            <h2 className="font-semibold">{m.home.honestyTitle}</h2>
          </div>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-6">
            {m.home.honesty.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      </section>
    </main>
  );
}
