import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@credshow/lib";

export interface PendingTransaction {
  id: string;
  bureau_query_id: string;
  cpf: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  chosen_amount: number | null;
  installments: number | null;
  installment_value: number | null;
  first_due_date: string | null;
  document_photo_url: string | null;
  selfie_url: string | null;
  status: "awaiting_activation";
  created_at: string;
}

interface UsePendingResult {
  loading: boolean;
  error: string | null;
  items: PendingTransaction[];
  reload: () => Promise<void>;
  removeLocally: (transactionId: string) => void;
}

const SELECT_COLS =
  "id, bureau_query_id, cpf, full_name, email, phone, chosen_amount, installments, installment_value, first_due_date, document_photo_url, selfie_url, status, created_at, bureau_queries!inner(promoter_token_id)";

interface RawRow {
  id: string;
  bureau_query_id: string;
  cpf: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  chosen_amount: number | null;
  installments: number | null;
  installment_value: number | null;
  first_due_date: string | null;
  document_photo_url: string | null;
  selfie_url: string | null;
  status: string;
  created_at: string;
  bureau_queries: { promoter_token_id: string } | null;
}

function toPending(row: RawRow): PendingTransaction {
  return {
    id: row.id,
    bureau_query_id: row.bureau_query_id,
    cpf: row.cpf,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    chosen_amount: row.chosen_amount,
    installments: row.installments,
    installment_value: row.installment_value,
    first_due_date: row.first_due_date,
    document_photo_url: row.document_photo_url,
    selfie_url: row.selfie_url,
    status: "awaiting_activation",
    created_at: row.created_at,
  };
}

export function usePendingTransactions(
  eventId: string | null,
  promoterTokenId: string | null
): UsePendingResult {
  const [items, setItems] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<PendingTransaction[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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
        .eq("status", "awaiting_activation")
        .eq("bureau_queries.promoter_token_id", promoterTokenId)
        .order("created_at", { ascending: false });

      if (qErr) {
        setError("Falha ao carregar pendentes");
        setItems([]);
        return;
      }

      const rows = (data as unknown as RawRow[] | null) ?? [];
      setItems(rows.map(toPending));
    } catch {
      setError("Erro inesperado ao carregar pendentes");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, promoterTokenId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime
  useEffect(() => {
    if (!eventId || !promoterTokenId) return;
    const sb = getSupabase();
    const channel = sb
      .channel(`promoter-pending-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Determine the row id
          const newRow = (payload.new ?? null) as { id?: string; status?: string } | null;
          const oldRow = (payload.old ?? null) as { id?: string } | null;
          const rowId = newRow?.id ?? oldRow?.id;
          if (!rowId) return;

          // DELETE - just remove locally
          if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((t) => t.id !== rowId));
            return;
          }

          // For INSERT/UPDATE: fetch the row joined with bureau_queries to confirm ownership
          try {
            const { data, error: fetchErr } = await sb
              .from("transactions")
              .select(SELECT_COLS)
              .eq("id", rowId)
              .maybeSingle();

            if (fetchErr || !data) return;
            const row = data as unknown as RawRow;

            const belongsToPromoter =
              row.bureau_queries?.promoter_token_id === promoterTokenId;

            if (!belongsToPromoter) {
              // not ours - if was previously in list (e.g. update changing ownership? unlikely), drop
              setItems((prev) => prev.filter((t) => t.id !== rowId));
              return;
            }

            if (row.status === "awaiting_activation") {
              const pending = toPending(row);
              setItems((prev) => {
                const existing = prev.find((t) => t.id === rowId);
                if (existing) {
                  return prev.map((t) => (t.id === rowId ? pending : t));
                }
                return [pending, ...prev];
              });
            } else {
              // Status changed away from awaiting_activation - remove
              setItems((prev) => prev.filter((t) => t.id !== rowId));
            }
          } catch {
            // ignore network errors during realtime updates
          }
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [eventId, promoterTokenId]);

  const removeLocally = useCallback((transactionId: string) => {
    setItems((prev) => prev.filter((t) => t.id !== transactionId));
  }, []);

  return { loading, error, items, reload: load, removeLocally };
}
