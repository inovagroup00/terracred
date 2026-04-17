import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@credshow/lib";
import type { Database } from "@credshow/types/database";

export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export function useRealtimeTransactions(eventId: string | null) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!eventId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sb = getSupabase();
    const { data, error: err } = await sb
      .from("transactions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
      setTransactions([]);
    } else {
      setTransactions(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!eventId) return;
    const sb = getSupabase();
    const channel = sb
      .channel(`tx-event-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setTransactions((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as TransactionRow;
              if (prev.some((p) => p.id === row.id)) return prev;
              return [row, ...prev].slice(0, 200);
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as TransactionRow;
              return prev.map((p) => (p.id === row.id ? row : p));
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Partial<TransactionRow>;
              return prev.filter((p) => p.id !== row.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [eventId]);

  return { transactions, loading, error, reload };
}
