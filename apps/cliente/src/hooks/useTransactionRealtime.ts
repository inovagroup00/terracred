import { useEffect, useState } from "react";
import { getSupabase } from "@credshow/lib";
import type { TransactionStatus } from "@credshow/types";

interface TransactionRow {
  id: string;
  status: TransactionStatus;
}

export function useTransactionRealtime(
  transactionId: string | null,
  initialStatus: TransactionStatus | null
): {
  status: TransactionStatus | null;
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const [status, setStatus] = useState<TransactionStatus | null>(initialStatus);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!transactionId) return;
    const sb = getSupabase();
    const channel = sb
      .channel(`transactions:id=eq.${transactionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          const next = payload.new as Partial<TransactionRow> | undefined;
          if (next?.status) setStatus(next.status as TransactionStatus);
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [transactionId]);

  async function refresh() {
    if (!transactionId) return;
    setRefreshing(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("transactions")
        .select("status")
        .eq("id", transactionId)
        .single();
      if (!error && data?.status) {
        setStatus(data.status as TransactionStatus);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return { status, refresh, refreshing };
}
