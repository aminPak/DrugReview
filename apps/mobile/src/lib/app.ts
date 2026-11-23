import { createApiClient, getMessages } from "@drugreview/core";
import Constants from "expo-constants";

/** Wording for the current language. Only English exists so far. */
export const m = getMessages("en");

/**
 * Where the API runs. Set EXPO_PUBLIC_API_URL for real deployments. In development, the phone
 * reaches the API on the same computer that runs Expo, so reuse that computer's address.
 */
function apiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:8787`;
}

export const api = createApiClient(apiUrl());
