import { useCallback, useEffect, useState } from "react";

export interface LogEntry {
  id: string;
  timestamp: string;
  cpf: string;
  approved: boolean;
  limit: number | null;
  reason: string | null;
  bureau_query_id: string | null;
  sms_sent: boolean;
  phone: string | null;
  client_link: string | null;
}

function storageKey(token: string): string {
  return `TerraCred_promoter_log_${token}`;
}

function readLog(token: string): LogEntry[] {
  try {
    const raw = sessionStorage.getItem(storageKey(token));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(token: string, entries: LogEntry[]): void {
  try {
    sessionStorage.setItem(storageKey(token), JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface UseSessionLogReturn {
  entries: LogEntry[];
  addEntry: (entry: Omit<LogEntry, "id" | "timestamp">) => LogEntry;
  updateEntry: (id: string, patch: Partial<Omit<LogEntry, "id">>) => void;
  clear: () => void;
}

export function useSessionLog(token: string | null): UseSessionLogReturn {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!token) {
      setEntries([]);
      return;
    }
    setEntries(readLog(token));
  }, [token]);

  const addEntry = useCallback<UseSessionLogReturn["addEntry"]>(
    (entry) => {
      const newEntry: LogEntry = {
        ...entry,
        id: makeId(),
        timestamp: new Date().toISOString(),
      };
      setEntries((prev) => {
        const next = [newEntry, ...prev];
        if (token) writeLog(token, next);
        return next;
      });
      return newEntry;
    },
    [token]
  );

  const updateEntry = useCallback<UseSessionLogReturn["updateEntry"]>(
    (id, patch) => {
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        if (token) writeLog(token, next);
        return next;
      });
    },
    [token]
  );

  const clear = useCallback(() => {
    setEntries([]);
    if (token) writeLog(token, []);
  }, [token]);

  return { entries, addEntry, updateEntry, clear };
}
