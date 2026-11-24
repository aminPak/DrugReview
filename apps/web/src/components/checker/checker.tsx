"use client";

import {
  type CabinetItem,
  canRunCheck,
  displayName,
  isSupplementName,
  itemKey,
  type ProductSearchResult,
  type ProfileCondition,
  type Supplement,
  searchSupplements,
  titleCase,
} from "@drugreview/core";
import { Leaf, Loader2, Pill, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, m } from "@/lib/app";

import { ProfilePanel } from "./profile-panel";
import { type CheckSnapshot, Results } from "./results";

/**
 * A tiny store over localStorage, so the server render (empty) and the browser agree. The data
 * lives only in this browser; storage can be unavailable (private mode), so fail quietly.
 */
function createStore<T>(key: string, empty: T) {
  const listeners = new Set<() => void>();
  let current: T | null = null;
  return {
    empty,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get(): T {
      if (current === null) {
        try {
          const raw = localStorage.getItem(key);
          current = raw ? (JSON.parse(raw) as T) : empty;
        } catch {
          current = empty;
        }
      }
      return current;
    },
    set(next: T) {
      current = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Not saved; it still works for this visit.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

const listStore = createStore<CabinetItem[]>("drugreview.list.v1", []);
const profileStore = createStore<ProfileCondition[]>("drugreview.profile-conditions.v1", []);
const noticeStore = createStore<boolean>("drugreview.notice-accepted.v1", false);

/** False on the server and during hydration, so a returning visitor never sees the notice flash. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useStore<T>(store: ReturnType<typeof createStore<T>>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.empty);
}

/** The key caveats, shown once before the checker, as the mobile app does on first run. */
function Notice({ onAccept }: { onAccept: () => void }) {
  return (
    <Card className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">{m.notice.title}</h2>
      <ul className="list-disc space-y-2 ps-5 text-sm">
        {m.notice.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <Button size="lg" onClick={onAccept}>
        {m.notice.accept}
      </Button>
    </Card>
  );
}

export function Checker() {
  const hydrated = useHydrated();
  const accepted = useStore(noticeStore);
  if (!hydrated) return null;
  if (!accepted) return <Notice onAccept={() => noticeStore.set(true)} />;
  return <CheckerBody />;
}

function CheckerBody() {
  const items = useStore(listStore);
  const conditions = useStore(profileStore);
  const [result, setResult] = useState<CheckSnapshot | null>(null);
  const [checking, setChecking] = useState(false);
  const [removed, setRemoved] = useState<CabinetItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (undoTimer.current && clearTimeout(undoTimer.current)), []);

  function update(next: CabinetItem[]) {
    listStore.set(next);
    setResult(null);
  }

  function remove(item: CabinetItem) {
    update(items.filter((i) => itemKey(i) !== itemKey(item)));
    setRemoved(item);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), 8000);
  }

  function undoRemove() {
    if (removed && !items.some((i) => itemKey(i) === itemKey(removed))) update([...items, removed]);
    setRemoved(null);
  }

  function updateConditions(next: ProfileCondition[]) {
    profileStore.set(next);
    setResult(null);
  }

  async function runCheck() {
    setChecking(true);
    const snapshot = { items, conditions };
    const outcome = await api.checkInteractions(items, { conditions });
    setResult({ ...snapshot, result: outcome });
    setChecking(false);
  }

  const checkable = canRunCheck(items.length, conditions.length);

  const keys = new Set(items.map(itemKey));

  return (
    <div className="mt-8 space-y-6">
      <ProfilePanel conditions={conditions} onChange={updateConditions} />

      <AddItem existing={keys} onAdd={(item) => update([...items, item])} />

      <Card>
        <h2 className="font-semibold">{m.list.title}</h2>
        {items.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{m.list.emptyTitle}</p>
            <p className="mt-1">{m.list.emptyBody}</p>
            {conditions.length === 0 && <p className="mt-2">{m.list.profilePrompt}</p>}
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
                  onClick={() => remove(item)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {removed && (
          <div
            role="status"
            className="mt-3 flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm"
          >
            <span className="flex-1">{m.list.removed(displayName(removed.name))}</span>
            <Button variant="ghost" size="sm" onClick={undoRemove}>
              {m.list.undo}
            </Button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="lg" disabled={!checkable || checking} onClick={runCheck}>
            {checking && <Loader2 className="animate-spin" />}
            {checking ? m.results.checking : m.list.check}
          </Button>
          {!checkable && <p className="text-sm text-muted-foreground">{m.list.needMore}</p>}
        </div>
      </Card>

      {result && <Results snapshot={result} onRetry={runCheck} />}
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
  const [found, setFound] = useState<{
    query: string;
    names: string[];
    products: ProductSearchResult[];
  }>({ query: "", names: [], products: [] });
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [addedNote, setAddedNote] = useState<string | null>(null);

  const q = query.trim();
  const supplements = searchSupplements(q, 5);
  // Only show medicine results that belong to what's typed now.
  const medicines = found.query === q ? found.names : [];
  const products = found.query === q ? found.products : [];

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Canadian products and generic names are searched together; one failing doesn't hide
        // the other.
        const [names, products] = await Promise.allSettled([
          api.searchDrugs(q, controller.signal),
          api.searchProducts(q, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (names.status === "rejected" && products.status === "rejected") {
          setError(m.search.offline);
        } else {
          setFound({
            query: q,
            names:
              names.status === "fulfilled"
                ? names.value.filter((name) => !isSupplementName(name))
                : [],
            products: products.status === "fulfilled" ? products.value : [],
          });
          setError(null);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  function reset(added: string, unmatched: string[] = []) {
    setQuery("");
    setAddedNote(m.search.added(added));
    setWarning(unmatched.length ? m.search.unmatched(unmatched.join(", ")) : null);
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
      reset(displayName(name));
    } catch {
      setError(m.search.offline);
    } finally {
      setAdding(null);
    }
  }

  async function addProduct(product: ProductSearchResult) {
    setAdding(product.din);
    setError(null);
    try {
      const resolved = await api.resolveProduct(product.din);
      if (!resolved) {
        setError(m.search.couldNotAdd);
        return;
      }
      if (!existing.has(`din:${product.din}`)) {
        onAdd({ kind: "medicine", name: titleCase(product.name), din: product.din });
      }
      reset(titleCase(product.name), resolved.unmatched);
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
    reset(supplement.name);
  }

  const showResults = q.length >= 2;
  const nothing =
    showResults &&
    !searching &&
    found.query === q &&
    products.length === 0 &&
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
      {warning && <p className="mt-2 text-sm text-danger">{warning}</p>}
      {addedNote && q.length < 2 && (
        <p role="status" className="mt-2 text-sm text-primary">
          {addedNote}
        </p>
      )}

      {showResults && (
        <Card className="absolute inset-x-0 z-10 mt-2 max-h-96 overflow-y-auto p-2">
          {products.length > 0 && (
            <ResultGroup title={m.search.canadianProducts}>
              {products.map((product) => (
                <ResultRow
                  key={product.din}
                  icon={<Pill />}
                  label={titleCase(product.name)}
                  detail={`${product.ingredients
                    .map((i) => [i.name, i.strength].filter(Boolean).join(" "))
                    .join(", ")} · ${m.search.din(product.din)}`}
                  hint={existing.has(`din:${product.din}`) ? m.list.alreadyAdded : undefined}
                  busy={adding === product.din}
                  onSelect={() => addProduct(product)}
                />
              ))}
            </ResultGroup>
          )}
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
  detail,
  hint,
  busy,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
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
        <span className="flex-1">
          {label}
          {detail && <span className="block text-xs text-muted-foreground">{detail}</span>}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        {busy ? <Loader2 className="animate-spin" /> : <Plus className="!text-muted-foreground" />}
      </button>
    </li>
  );
}
