import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@credshow/lib";
import type { TransactionStatus } from "@credshow/types";

export interface CompletedTransaction {
  id: string;
  cpf: string;
  full_name: string | null;
  chosen_amount: number | null;
  installments: number | null;
  status: Extract<TransactionStatus, "activated" | "cancelled">;
  activated_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  document_photo_url: string | null;
  selfie_url: string | null;
  created_at: string;
  // sort key
  finished_at: string;
}

interface UseCompletedResult {
  loading: boolean;
  error: string | null;
  items: CompletedTransaction[];
  reload: () => Promise<void>;
}

const SELECT_COLS =
  "id, cpf, full_name, chosen_amount, installments, status, activated_at, cancelled_at, cancellation_reason, document_photo_url, selfie_url, created_at, bureau_queries!inner(promoter_token_id)";

interface RawRow {
  id: string;
  cpf: string;
  full_name: string | null;
  chosen_amount: number | null;
  installments: number | null;
  status: string;
  activated_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  document_photo_url: string | null;
  selfie_url: string | null;
  created_at: string;
  bureau_queries: { promoter_token_id: string } | null;
}

function toCompleted(row: RawRow): CompletedTransaction | null {
  if (row.status !== "activated" && row.status !== "cancelled") return null;
  const finished = row.activated_at ?? row.cancelled_at ?? row.created_at;
  return {
    id: row.id,
    cpf: row.cpf,
    full_name: row.full_name,
    chosen_amount: row.chosen_amount,
    installments: row.installments,
    status: row.status as "activated" | "cancelled",
    activated_at: row.activated_at,
    cancelled_at: row.cancelled_at,
    cancellation_reason: row.cancellation_reason,
    document_photo_url: row.document_photo_url,
    selfie_url: row.selfie_url,
    created_at: row.created_at,
    finished_at: finished,
  };
}

export function useCompletedTransactions(
  eventId: string | null,
  promoterTokenId: string | null
): UseCompletedResult {
  const [items, setItems] = useState<CompletedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId || !promoterTokenId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { data, error: qErr } = await sb
        .from("transactions")
        .select(SELECT_COLS)
        .eq("event_id", eventId)
        .in("status", ["activated", "cancelled"])
        .eq("bureau_queries.promoter_token_id", promoterTokenId)
        .order("updated_at", { ascending: false })
        .limit(100);

      if (qErr) {
        setError("Falha ao carregar concluidos");
        setItems([]);
        return;
      }

      const rows = (data as unknown as RawRow[] | null) ?? [];
      const mapped = rows
        .map(toCompleted)
        .filter((r): r is CompletedTransaction => r !== null)
        .sort((a, b) => (a.finished_at < b.finished_at ? 1 : -1));
      setItems(mapped);
    } catch {
      setError("Erro inesperado ao carregar concluidos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, promoterTokenId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, items, reload: load };
}
