"use client";

import { conditionName, type ProfileCondition, searchConditions } from "@drugreview/core";
import { HeartPulse, Plus, Search, X } from "lucide-react";
import { useId, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { m } from "@/lib/app";

function conditionKey(condition: ProfileCondition): string {
  return "custom" in condition ? `custom:${condition.custom.toLowerCase()}` : `id:${condition.id}`;
}

/** The person's health conditions. Every item is checked against them. */
export function ProfilePanel({
  conditions,
  onChange,
}: {
  conditions: ProfileCondition[];
  onChange: (next: ProfileCondition[]) => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const keys = new Set(conditions.map(conditionKey));

  const q = query.trim();
  const matches = searchConditions(q, 6);
  const custom: ProfileCondition = { custom: q };
  const canAddCustom =
    q.length >= 3 &&
    !matches.some((c) => c.name.toLowerCase() === q.toLowerCase()) &&
    !keys.has(conditionKey(custom));

  function add(condition: ProfileCondition) {
    if (!keys.has(conditionKey(condition))) onChange([...conditions, condition]);
    setQuery("");
  }

  return (
    <Card className="border-primary/30">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-5 text-primary" />
        <h2 className="font-semibold">{m.profile.title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{m.profile.intro}</p>

      {conditions.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {conditions.map((condition) => (
            <li key={conditionKey(condition)}>
              <button
                type="button"
                onClick={() =>
                  onChange(conditions.filter((c) => conditionKey(c) !== conditionKey(condition)))
                }
                aria-label={`${m.list.remove} ${conditionName(condition)}`}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary hover:bg-primary-soft/70"
              >
                {conditionName(condition)}
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-4">
        <label htmlFor={inputId} className="sr-only">
          {m.profile.searchTitle}
        </label>
        <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.profile.placeholder}
          autoComplete="off"
          className="ps-11"
        />
        {(matches.length > 0 || canAddCustom) && (
          <Card className="absolute inset-x-0 z-20 mt-2 p-2">
            <ul>
              {matches.map((condition) => {
                const already = keys.has(conditionKey({ id: condition.id }));
                return (
                  <li key={condition.id}>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => add({ id: condition.id })}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-surface-muted disabled:cursor-default disabled:opacity-60"
                    >
                      <span className="flex-1">{condition.name}</span>
                      {already ? (
                        <span className="text-xs text-muted-foreground">{m.list.alreadyAdded}</span>
                      ) : (
                        <Plus className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
              {canAddCustom && (
                <li>
                  <button
                    type="button"
                    onClick={() => add(custom)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-surface-muted"
                  >
                    <span className="flex-1">{m.profile.addCustom(q)}</span>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                  <p className="px-3 pb-1 text-xs text-muted-foreground">{m.profile.customHint}</p>
                </li>
              )}
            </ul>
          </Card>
        )}
      </div>
    </Card>
  );
}
