import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@credshow/lib";

export interface EventKpis {
  totalQueries: number;
  approvedQueries: number;
  approvalRate: number;
  activatedCount: number;
  averageTicket: number;
  totalReleased: number;
}

const EMPTY: EventKpis = {
  totalQueries: 0,
  approvedQueries: 0,
  approvalRate: 0,
  activatedCount: 0,
  averageTicket: 0,
  totalReleased: 0,
};

/**
 * Aggregates KPIs for a single event, or for ALL events when eventId is null.
 */
export function useEventKpis(eventId: string | null) {
  const [kpis, setKpis] = useState<EventKpis>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();

      // Total bureau queries (count only)
      let totalQueriesQ = sb
        .from("bureau_queries")
        .select("id", { count: "exact", head: true });
      if (eventId) totalQueriesQ = totalQueriesQ.eq("event_id", eventId);
      const totalQueriesRes = await totalQueriesQ;
      if (totalQueriesRes.error) throw totalQueriesRes.error;
      const totalQueries = totalQueriesRes.count ?? 0;

      // Approved queries
      let approvedQ = sb
        .from("bureau_queries")
        .select("id", { count: "exact", head: true })
        .eq("approved", true);
      if (eventId) approvedQ = approvedQ.eq("event_id", eventId);
      const approvedRes = await approvedQ;
      if (approvedRes.error) throw approvedRes.error;
      const approvedQueries = approvedRes.count ?? 0;

      // Activated transactions: need amounts to compute avg ticket and total
      let activatedQ = sb
        .from("transactions")
        .select("chosen_amount")
        .eq("status", "activated");
      if (eventId) activatedQ = activatedQ.eq("event_id", eventId);
      const activatedRes = await activatedQ;
      if (activatedRes.error) throw activatedRes.error;

      const rows = activatedRes.data ?? [];
      const activatedCount = rows.length;
      const amounts = rows
        .map((r) => Number(r.chosen_amount ?? 0))
        .filter((n) => !Number.isNaN(n));
      const totalReleased = amounts.reduce((acc, n) => acc + n, 0);
      const averageTicket =
        activatedCount > 0 ? totalReleased / activatedCount : 0;
      const approvalRate =
        totalQueries > 0 ? (approvedQueries / totalQueries) * 100 : 0;

      setKpis({
        totalQueries,
        approvedQueries,
        approvalRate,
        activatedCount,
        averageTicket,
        totalReleased,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar KPIs";
      setError(msg);
      setKpis(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchKpis();
  }, [fetchKpis]);

  return { kpis, loading, error, reload: fetchKpis };
}
