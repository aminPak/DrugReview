import { APP_NAME, APP_TAGLINE, MEDICAL_DISCLAIMER } from "@drugreview/core";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-24 sm:px-8">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {APP_NAME}
      </h1>
      <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">{APP_TAGLINE}</p>
      <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-500">{MEDICAL_DISCLAIMER}</p>
    </main>
  );
}
