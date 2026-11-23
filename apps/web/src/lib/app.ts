import { createApiClient, getMessages } from "@drugreview/core";

/** Wording for the current language. Only English exists so far. */
export const m = getMessages("en");

export const api = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787");
