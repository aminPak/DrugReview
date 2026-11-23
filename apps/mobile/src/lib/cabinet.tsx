import { type CabinetItem, itemKey, type ProfileCondition } from "@drugreview/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const LIST_KEY = "drugreview.list.v1";
const PROFILE_KEY = "drugreview.profile.v1";
const NOTICE_KEY = "drugreview.notice-accepted.v1";

/** A stable key for a profile condition, used to avoid duplicates. */
export function conditionKey(condition: ProfileCondition): string {
  return "custom" in condition ? `custom:${condition.custom.toLowerCase()}` : `id:${condition.id}`;
}

interface CabinetState {
  /** False until saved data has been read from the device. */
  ready: boolean;
  items: CabinetItem[];
  conditions: ProfileCondition[];
  noticeAccepted: boolean;
  add(item: CabinetItem): void;
  remove(item: CabinetItem): void;
  has(key: string): boolean;
  addCondition(condition: ProfileCondition): void;
  removeCondition(condition: ProfileCondition): void;
  hasCondition(condition: ProfileCondition): boolean;
  acceptNotice(): void;
}

const CabinetContext = createContext<CabinetState | null>(null);

function parse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** The person's list and health profile, stored only on this device. */
export function CabinetProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [conditions, setConditions] = useState<ProfileCondition[]>([]);
  const [noticeAccepted, setNoticeAccepted] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LIST_KEY),
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(NOTICE_KEY),
    ])
      .then(([list, profile, notice]) => {
        setItems(parse<CabinetItem[]>(list, []));
        setConditions(
          parse<{ conditions: ProfileCondition[] }>(profile, { conditions: [] }).conditions,
        );
        setNoticeAccepted(notice === "yes");
      })
      .catch(() => {
        // Storage unavailable: start empty; the app still works for this session.
      })
      .finally(() => setReady(true));
  }, []);

  const saveItems = useCallback((next: CabinetItem[]) => {
    setItems(next);
    AsyncStorage.setItem(LIST_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const saveConditions = useCallback((next: ProfileCondition[]) => {
    setConditions(next);
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ conditions: next })).catch(() => {});
  }, []);

  const value = useMemo<CabinetState>(() => {
    const keys = new Set(items.map(itemKey));
    const conditionKeys = new Set(conditions.map(conditionKey));
    return {
      ready,
      items,
      conditions,
      noticeAccepted,
      add: (item) => {
        if (!keys.has(itemKey(item))) saveItems([...items, item]);
      },
      remove: (item) => saveItems(items.filter((i) => itemKey(i) !== itemKey(item))),
      has: (key) => keys.has(key),
      addCondition: (condition) => {
        if (!conditionKeys.has(conditionKey(condition))) saveConditions([...conditions, condition]);
      },
      removeCondition: (condition) =>
        saveConditions(conditions.filter((c) => conditionKey(c) !== conditionKey(condition))),
      hasCondition: (condition) => conditionKeys.has(conditionKey(condition)),
      acceptNotice: () => {
        setNoticeAccepted(true);
        AsyncStorage.setItem(NOTICE_KEY, "yes").catch(() => {});
      },
    };
  }, [items, conditions, noticeAccepted, ready, saveItems, saveConditions]);

  return <CabinetContext value={value}>{children}</CabinetContext>;
}

export function useCabinet(): CabinetState {
  const state = use(CabinetContext);
  if (!state) throw new Error("useCabinet must be used inside CabinetProvider");
  return state;
}
