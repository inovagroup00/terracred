import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Spinner } from "@credshow/ui";
import { getSupabase, formatBRL, formatDateTime } from "@credshow/lib";
import type { Database } from "@credshow/types/database";
import { KpiCard } from "../components/KpiCard";
import { EventStatusBadge } from "../components/StatusBadge";
import { DataTable, Column } from "../components/DataTable";
import { useEventKpis } from "../hooks/useEventKpis";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function Dashboard() {
  const nav = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingEvents(true);
      const sb = getSupabase();
      const { data, error: err } = await sb
        .from("events")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setEvents([]);
      } else {
        setEvents(data ?? []);
        // Prefer active event, fallback to first
        const active = data?.find((e) => e.status === "active");
        setSelectedEventId(active?.id ?? null);
      }
      setLoadingEvents(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { kpis, loading: loadingKpis } = useEventKpis(selectedEventId);

  const columns: Column<EventRow>[] = [
    {
      key: "name",
      header: "Evento",
      render: (r) => (
        <Link
          to={`/eventos/${r.id}`}
          className="font-medium text-slate-900 hover:text-orange-600"
        >
          {r.name}
        </Link>
      ),
    },
    { key: "venue", header: "Local", render: (r) => r.venue },
    {
      key: "date",
      header: "Data",
      render: (r) => formatDateTime(r.event_date),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <EventStatusBadge status={r.status} />,
    },
  ];

  const activeLabel =
    selectedEventId === null
      ? "Todos os eventos"
      : events.find((e) => e.id === selectedEventId)?.name ?? "Evento";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Visao geral das operacoes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedEventId ?? ""}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos os eventos</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
          <Button onClick={() => nav("/eventos/novo")}>Novo evento</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section>
        <p className="mb-3 text-sm font-medium text-slate-600">
          KPIs - {activeLabel}
        </p>
        {loadingKpis ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner className="h-4 w-4" />
            Carregando KPIs...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              label="Consultas"
              value={kpis.totalQueries.toLocaleString("pt-BR")}
              tone="violet"
            />
            <KpiCard
              label="Aprovacao"
              value={`${kpis.approvalRate.toFixed(1)}%`}
              hint={`${kpis.approvedQueries} aprovadas`}
              tone="emerald"
            />
            <KpiCard
              label="Transacoes ativadas"
              value={kpis.activatedCount.toLocaleString("pt-BR")}
              tone="emerald"
            />
            <KpiCard
              label="Ticket medio"
              value={formatBRL(kpis.averageTicket)}
              tone="amber"
            />
            <KpiCard
              label="Total liberado"
              value={formatBRL(kpis.totalReleased)}
              tone="violet"
            />
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600">Eventos recentes</p>
          <Link to="/eventos" className="text-sm text-orange-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {loadingEvents ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Spinner className="h-4 w-4" />
            Carregando eventos...
          </div>
        ) : (
          <DataTable
            rows={events}
            columns={columns}
            rowKey={(r) => r.id}
            empty="Nenhum evento cadastrado ainda."
          />
        )}
      </section>
    </div>
  );
}
