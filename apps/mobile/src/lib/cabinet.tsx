import { type CabinetItem, itemKey } from "@drugreview/core";
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
const NOTICE_KEY = "drugreview.notice-accepted.v1";

interface CabinetState {
  /** False until saved data has been read from the device. */
  ready: boolean;
  items: CabinetItem[];
  noticeAccepted: boolean;
  add(item: CabinetItem): void;
  remove(item: CabinetItem): void;
  has(key: string): boolean;
  acceptNotice(): void;
}

const CabinetContext = createContext<CabinetState | null>(null);

/** The person's list, stored only on this device. */
export function CabinetProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [noticeAccepted, setNoticeAccepted] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(LIST_KEY), AsyncStorage.getItem(NOTICE_KEY)])
      .then(([list, notice]) => {
        if (list) setItems(JSON.parse(list) as CabinetItem[]);
        setNoticeAccepted(notice === "yes");
      })
      .catch(() => {
        // Storage unavailable: start empty; the app still works for this session.
      })
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((next: CabinetItem[]) => {
    setItems(next);
    AsyncStorage.setItem(LIST_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const value = useMemo<CabinetState>(() => {
    const keys = new Set(items.map(itemKey));
    return {
      ready,
      items,
      noticeAccepted,
      add: (item) => {
        if (!keys.has(itemKey(item))) save([...items, item]);
      },
      remove: (item) => save(items.filter((i) => itemKey(i) !== itemKey(item))),
      has: (key) => keys.has(key),
      acceptNotice: () => {
        setNoticeAccepted(true);
        AsyncStorage.setItem(NOTICE_KEY, "yes").catch(() => {});
      },
    };
  }, [items, noticeAccepted, ready, save]);

  return <CabinetContext value={value}>{children}</CabinetContext>;
}

export function useCabinet(): CabinetState {
  const state = use(CabinetContext);
  if (!state) throw new Error("useCabinet must be used inside CabinetProvider");
  return state;
}
