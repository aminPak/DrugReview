"use client";

import {
  type CabinetItem,
  displayName,
  type InteractionCheckResult,
  isSupplementName,
  itemKey,
  type Supplement,
  searchSupplements,
} from "@drugreview/core";
import { Leaf, Loader2, Pill, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, m } from "@/lib/app";

import { Results } from "./results";

const STORAGE_KEY = "drugreview.list.v1";

/** The list lives only in this browser. Storage can be unavailable (private mode), so fail quietly. */
function loadList(): CabinetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CabinetItem[]) : [];
  } catch {
    return [];
  }
}

function saveList(items: CabinetItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Not saved; the list still works for this visit.
  }
}

/** A tiny store over localStorage, so the server render (empty list) and the browser agree. */
const listStore = {
  listeners: new Set<() => void>(),
  current: null as CabinetItem[] | null,
  subscribe(listener: () => void) {
    listStore.listeners.add(listener);
    return () => listStore.listeners.delete(listener);
  },
  get: () => (listStore.current ??= loadList()),
  set(next: CabinetItem[]) {
    listStore.current = next;
    saveList(next);
    listStore.listeners.forEach((listener) => listener());
  },
};
const EMPTY: CabinetItem[] = [];

export function Checker() {
  const items = useSyncExternalStore(listStore.subscribe, listStore.get, () => EMPTY);
  const [result, setResult] = useState<{
    items: CabinetItem[];
    result: InteractionCheckResult;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  function update(next: CabinetItem[]) {
    listStore.set(next);
    setResult(null);
  }

  async function runCheck() {
    setChecking(true);
    const snapshot = items;
    const outcome = await api.checkInteractions(snapshot);
    setResult({ items: snapshot, result: outcome });
    setChecking(false);
  }

  const keys = new Set(items.map(itemKey));

  return (
    <div className="mt-8 space-y-6">
      <AddItem existing={keys} onAdd={(item) => update([...items, item])} />

      <Card>
        <h2 className="font-semibold">{m.list.title}</h2>
        {items.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{m.list.emptyTitle}</p>
            <p className="mt-1">{m.list.emptyBody}</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y">
            {items.map((item) => (
              <li key={itemKey(item)} className="flex items-center gap-3 py-2.5">
                <ItemIcon item={item} />
                <span className="flex-1 font-medium">{displayName(item.name)}</span>
                <Badge tone={item.kind === "medicine" ? "primary" : "neutral"}>
                  {item.kind === "medicine" ? m.list.medicine : m.list.supplement}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${m.list.remove} ${displayName(item.name)}`}
                  onClick={() => update(items.filter((i) => itemKey(i) !== itemKey(item)))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg" disabled={items.length < 2 || checking} onClick={runCheck}>
            {checking && <Loader2 className="animate-spin" />}
            {checking ? m.results.checking : m.list.check}
          </Button>
          {items.length < 2 && <p className="text-sm text-muted-foreground">{m.list.needTwo}</p>}
        </div>
      </Card>

      {result && <Results items={result.items} result={result.result} onRetry={runCheck} />}
    </div>
  );
}

function ItemIcon({ item }: { item: CabinetItem }) {
  const Icon = item.kind === "medicine" ? Pill : Leaf;
  return (
    <span className="grid size-8 place-items-center rounded-lg bg-surface-muted text-primary">
      <Icon className="size-4" />
    </span>
  );
}

function AddItem({
  existing,
  onAdd,
}: {
  existing: Set<string>;
  onAdd: (item: CabinetItem) => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ query: string; names: string[] }>({ query: "", names: [] });
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim();
  const supplements = searchSupplements(q, 5);
  // Only show medicine results that belong to what's typed now.
  const medicines = found.query === q ? found.names : [];

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const names = await api.searchDrugs(q, controller.signal);
        setFound({ query: q, names: names.filter((name) => !isSupplementName(name)) });
        setError(null);
      } catch {
        if (!controller.signal.aborted) setError(m.search.offline);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  function reset() {
    setQuery("");
  }

  async function addMedicine(name: string) {
    setAdding(name);
    setError(null);
    try {
      const drug = await api.resolveDrug(name);
      if (!drug) {
        setError(m.search.couldNotAdd);
        return;
      }
      if (!existing.has(`medicine:${drug.rxcui}`))
        onAdd({ kind: "medicine", name: displayName(name), rxcui: drug.rxcui });
      reset();
    } catch {
      setError(m.search.offline);
    } finally {
      setAdding(null);
    }
  }

  function addSupplement(supplement: Supplement) {
    if (!existing.has(`supplement:${supplement.id}`)) {
      onAdd({ kind: "supplement", name: supplement.name, supplementId: supplement.id });
    }
    reset();
  }

  const showResults = q.length >= 2;
  const nothing =
    showResults &&
    !searching &&
    found.query === q &&
    medicines.length === 0 &&
    supplements.length === 0;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        {m.list.add}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.search.placeholder}
          autoComplete="off"
          className="ps-11"
        />
        {searching && (
          <Loader2 className="absolute end-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {showResults && (
        <Card className="absolute inset-x-0 z-10 mt-2 max-h-96 overflow-y-auto p-2">
          {medicines.length > 0 && (
            <ResultGroup title={m.search.medicines}>
              {medicines.map((name) => (
                <ResultRow
                  key={name}
                  icon={<Pill />}
                  label={displayName(name)}
                  busy={adding === name}
                  onSelect={() => addMedicine(name)}
                />
              ))}
            </ResultGroup>
          )}
          {supplements.length > 0 && (
            <ResultGroup title={m.search.supplements}>
              {supplements.map((s) => (
                <ResultRow
                  key={s.id}
                  icon={<Leaf />}
                  label={s.name}
                  hint={existing.has(`supplement:${s.id}`) ? m.list.alreadyAdded : undefined}
                  onSelect={() => addSupplement(s)}
                />
              ))}
            </ResultGroup>
          )}
          {nothing && <p className="p-3 text-sm text-muted-foreground">{m.search.noResults}</p>}
        </Card>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul>{children}</ul>
    </div>
  );
}

function ResultRow({
  icon,
  label,
  hint,
  busy,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  busy?: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={busy}
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-surface-muted disabled:opacity-60 [&_svg]:size-4 [&_svg]:text-primary"
      >
        {icon}
        <span className="flex-1">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {busy ? <Loader2 className="animate-spin" /> : <Plus className="!text-muted-foreground" />}
      </button>
    </li>
  );
}
