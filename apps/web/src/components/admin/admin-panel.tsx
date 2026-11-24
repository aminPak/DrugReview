"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminError, createAdminClient } from "@/lib/admin";

import { AiTab } from "./ai-tab";

const TOKEN_KEY = "drugreview.admin-token";

/** The token lives in this tab's session only, so closing the tab signs out. */
function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

const TABS = [{ id: "ai", label: "AI assistant" }] as const;

export function AdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ai");

  // Read the saved token after hydration; sessionStorage doesn't exist on the server.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(readToken());
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing was saved.
    }
    setToken("");
  }, []);

  if (token === null) return null;
  if (!token) {
    return (
      <SignIn
        onSignIn={(next) => {
          try {
            sessionStorage.setItem(TOKEN_KEY, next);
          } catch {
            // It still works until the page is reloaded.
          }
          setToken(next);
        }}
      />
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between border-b">
        <div role="tablist" aria-label="Admin sections" className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === "ai" && <AiTab token={token} onSignedOut={signOut} />}
      </div>
    </div>
  );
}

function SignIn({ onSignIn }: { onSignIn: (token: string) => void }) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const token = value.trim();
    if (!token) return;
    setChecking(true);
    setError(null);
    try {
      await createAdminClient(token).getAi();
      onSignIn(token);
    } catch (e) {
      setError(e instanceof AdminError ? e.message : "Something went wrong.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <Card className="mt-6 max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="admin-token" className="text-sm font-medium">
            Admin token
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            The value of <code>ADMIN_TOKEN</code> on the API server.
          </p>
          <Input
            id="admin-token"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={checking || !value.trim()}>
          {checking && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>
    </Card>
  );
}
