import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Spinner } from "@credshow/ui";
import { getSupabase, formatDateTime } from "@credshow/lib";
import type { Database } from "@credshow/types/database";
import type { EventStatus } from "@credshow/types";
import { EventStatusBadge } from "../components/StatusBadge";
import { DataTable, Column } from "../components/DataTable";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type StatusFilter = "all" | EventStatus;

export function EventsList() {
  const nav = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const sb = getSupabase();
    const { data, error: err } = await sb
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });
    if (err) {
      setError(err.message);
      setEvents([]);
    } else {
      setEvents(data ?? []);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.status === filter);
  }, [events, filter]);

  async function setStatus(id: string, status: EventStatus) {
    setWorking(id);
    const sb = getSupabase();
    const { error: err } = await sb
      .from("events")
      .update({ status })
      .eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      await load();
    }
    setWorking(null);
  }

  const columns: Column<EventRow>[] = [
    {
      key: "name",
      header: "Nome",
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
    { key: "date", header: "Data", render: (r) => formatDateTime(r.event_date) },
    {
      key: "status",
      header: "Status",
      render: (r) => <EventStatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Acoes",
      className: "whitespace-nowrap",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => nav(`/eventos/${r.id}`)}
          >
            Detalhes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => nav(`/eventos/${r.id}/editar`)}
          >
            Editar
          </Button>
          {r.status !== "active" && (
            <Button
              size="sm"
              variant="secondary"
              loading={working === r.id}
              onClick={() => void setStatus(r.id, "active")}
            >
              Ativar
            </Button>
          )}
          {r.status === "active" && (
            <Button
              size="sm"
              variant="secondary"
              loading={working === r.id}
              onClick={() => void setStatus(r.id, "closed")}
            >
              Encerrar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Eventos</h2>
          <p className="text-sm text-slate-500">Gerencie os eventos do catalogo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="active">Ativo</option>
            <option value="closed">Encerrado</option>
          </select>
          <Button onClick={() => nav("/eventos/novo")}>Novo evento</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner className="h-4 w-4" />
          Carregando eventos...
        </div>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          empty="Nenhum evento cadastrado."
        />
      )}
    </div>
  );
}
