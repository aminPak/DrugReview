"use client";

import {
  AI_PROVIDERS,
  type AiProvider,
  type AiSettingsView,
  type AiTestResult,
} from "@drugreview/core";
import { CheckCircle2, CircleAlert, KeyRound, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminError, createAdminClient } from "@/lib/admin";

type Notice = { tone: "ok" | "error"; text: string };

/** Choose an AI provider, add its key, check it works. The key is write-only: never shown again. */
export function AiTab({ token, onSignedOut }: { token: string; onSignedOut: () => void }) {
  const client = createAdminClient(token);
  const ids = { model: useId(), baseUrl: useId(), key: useId(), enabled: useId() };

  const [saved, setSaved] = useState<AiSettingsView | null>(null);
  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [test, setTest] = useState<AiTestResult | null>(null);

  const apply = useCallback((view: AiSettingsView) => {
    setSaved(view);
    setProvider(view.provider);
    setModel(view.model);
    setBaseUrl(view.baseUrl);
    setEnabled(view.enabled);
    setApiKey("");
  }, []);

  const fail = useCallback(
    (error: unknown) => {
      if (error instanceof AdminError && error.kind === "unauthorized") return onSignedOut();
      setNotice({
        tone: "error",
        text: error instanceof AdminError ? error.message : "Something went wrong.",
      });
    },
    [onSignedOut],
  );

  useEffect(() => {
    createAdminClient(token)
      .getAi()
      .then(apply)
      .catch((error) => {
        if (error instanceof AdminError && error.kind === "unauthorized") onSignedOut();
        else {
          setNotice({
            tone: "error",
            text: error instanceof AdminError ? error.message : "Something went wrong.",
          });
        }
      });
  }, [token, apply, onSignedOut]);

  if (!saved) {
    return notice ? (
      <p role="alert" className="text-sm text-danger">
        {notice.text}
      </p>
    ) : (
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
    );
  }

  const info = AI_PROVIDERS[provider];
  // A key saved for another provider can't be reused, and nor can the old status line.
  const sameProvider = provider === saved.provider;
  const hasKey = apiKey.length > 0 || (sameProvider && saved.keySource !== "none");

  function changeProvider(next: AiProvider) {
    setProvider(next);
    setModel(AI_PROVIDERS[next].defaultModel);
    setBaseUrl("");
    setApiKey("");
    setTest(null);
    setNotice(null);
  }

  async function save(): Promise<boolean> {
    setBusy("save");
    setNotice(null);
    try {
      apply(
        await client.saveAi({
          provider,
          model,
          baseUrl,
          enabled,
          ...(apiKey ? { apiKey } : {}),
        }),
      );
      setNotice({ tone: "ok", text: "Saved." });
      return true;
    } catch (error) {
      fail(error);
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveAndTest() {
    setTest(null);
    if (!(await save())) return;
    setBusy("test");
    try {
      setTest(await client.testAi());
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  }

  async function clear() {
    setBusy("clear");
    setNotice(null);
    setTest(null);
    try {
      apply(await client.clearAi());
      setNotice({ tone: "ok", text: "The saved key and settings were removed." });
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  }

  const keyStatus =
    sameProvider && saved.keySource === "saved"
      ? `A key is saved (${saved.keyHint}). Paste a new one to replace it.`
      : sameProvider && saved.keySource === "env"
        ? `Using ${info.envKey ?? "an environment variable"} from the server (${saved.keyHint}). Paste a key here to use a different one.`
        : "No key yet.";

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="font-semibold">AI assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect an AI provider for plain-language explanations of findings. The explanations
          aren&apos;t in the apps yet. This saves the connection so it is ready, and the apps work
          exactly as before while it is off. The AI only ever explains text from official sources;
          it never decides whether a combination is safe.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Provider</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(AI_PROVIDERS) as AiProvider[]).map((id) => (
            <label
              key={id}
              className={`cursor-pointer rounded-lg border p-3 text-sm ${
                provider === id ? "border-primary bg-primary-soft" : "hover:bg-surface-muted"
              }`}
            >
              <input
                type="radio"
                name="ai-provider"
                value={id}
                checked={provider === id}
                onChange={() => changeProvider(id)}
                className="sr-only"
              />
              <span className="font-medium">{AI_PROVIDERS[id].label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{info.hint}</p>
      </fieldset>

      {info.needsBaseUrl && (
        <div>
          <label htmlFor={ids.baseUrl} className="text-sm font-medium">
            Address
          </label>
          <Input
            id={ids.baseUrl}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://openrouter.ai/api/v1"
            autoComplete="off"
            className="mt-2"
          />
        </div>
      )}

      <div>
        <label htmlFor={ids.model} className="text-sm font-medium">
          Model
        </label>
        <Input
          id={ids.model}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={info.defaultModel || "The model name from your provider"}
          autoComplete="off"
          className="mt-2"
        />
      </div>

      <div>
        <label htmlFor={ids.key} className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="size-4" />
          API key
        </label>
        <Input
          id={ids.key}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste a key"
          autoComplete="off"
          disabled={!saved.canSaveKey}
          className="mt-2"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {keyStatus} The key is stored encrypted on the server and is never shown again.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id={ids.enabled}
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-1 size-4 accent-primary"
        />
        <label htmlFor={ids.enabled} className="text-sm">
          <span className="font-medium">Turn on AI explanations</span>
          <span className="block text-muted-foreground">
            Needs a key. Nothing is sent to the provider until explanations are added to the apps.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={saveAndTest} disabled={busy !== null || !hasKey || !model.trim()}>
          {(busy === "save" || busy === "test") && <Loader2 className="animate-spin" />}
          Save and test connection
        </Button>
        <Button variant="outline" onClick={save} disabled={busy !== null || (enabled && !hasKey)}>
          {busy === "save" && <Loader2 className="animate-spin" />}
          Save
        </Button>
        <Button
          variant="ghost"
          onClick={clear}
          disabled={busy !== null || (saved.keySource === "none" && !saved.enabled)}
        >
          Remove key and turn off
        </Button>
      </div>

      <div aria-live="polite" className="space-y-2">
        {notice && (
          <p
            className={`text-sm ${notice.tone === "error" ? "text-danger" : "text-muted-foreground"}`}
          >
            {notice.text}
          </p>
        )}
        {test && (
          <p
            className={`flex items-start gap-2 text-sm font-medium ${test.ok ? "text-primary" : "text-danger"}`}
          >
            {test.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
            )}
            {test.message}
          </p>
        )}
      </div>
    </Card>
  );
}
