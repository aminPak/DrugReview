import { en, type Messages } from "./en";

export type { Messages };

export const LOCALES = { en } as const satisfies Record<string, Messages>;
export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "en";

export function getMessages(locale: string = DEFAULT_LOCALE): Messages {
  return LOCALES[locale as Locale] ?? LOCALES[DEFAULT_LOCALE];
}
