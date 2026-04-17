import { FormEvent, useEffect, useState } from "react";
import { Button, Input, Spinner } from "@credshow/ui";
import { getSupabase } from "@credshow/lib";
import type { Database } from "@credshow/types/database";
import { DataTable, Column } from "../components/DataTable";
import { Modal } from "../components/Modal";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

interface OperatorRow extends ProfileRow {
  event_name?: string | null;
}

export function OperatorsList() {
  const [rows, setRows] = useState<OperatorRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const sb = getSupabase();
    const [profilesRes, eventsRes] = await Promise.all([
      sb
        .from("profiles")
        .select("*")
        .eq("role", "cashier")
        .order("created_at", { ascending: false }),
      sb.from("events").select("*").order("event_date", { ascending: false }),
    ]);

    if (profilesRes.error) {
      setError(profilesRes.error.message);
      setRows([]);
      setLoading(false);
      return;
    }
    if (eventsRes.error) {
      setError(eventsRes.error.message);
    }

    const evs = eventsRes.data ?? [];
    setEvents(evs);
    const evMap = new Map(evs.map((e) => [e.id, e.name]));

    setRows(
      (profilesRes.data ?? []).map((p) => ({
        ...p,
        event_name: p.event_id ? (evMap.get(p.event_id) ?? null) : null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const columns: Column<OperatorRow>[] = [
    {
      key: "name",
      header: "Nome",
      render: (r) => r.full_name ?? "-",
    },
    {
      key: "event",
      header: "Evento",
      render: (r) => r.event_name ?? "-",
    },
    {
      key: "id",
      header: "UID",
      render: (r) => (
        <code className="text-xs text-slate-600">{r.id.slice(0, 8)}...</code>
      ),
    },
    {
      key: "created",
      header: "Criado",
      render: (r) => new Date(r.created_at).toLocaleDateString("pt-BR"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Operadores</h2>
          <p className="text-sm text-slate-500">
            Caixas que operam a ativacao nas casas de show.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Vincular operador</Button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="flex items-start gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <div className="space-y-1">
            <p className="font-medium">Como criar um operador (caixa)</p>
            <ol className="ml-4 list-decimal space-y-0.5 text-xs">
              <li>
                No <b>Supabase Dashboard</b>, va em{" "}
                <i>Authentication &rarr; Users &rarr; Add user</i> e crie o
                login (email + senha).
              </li>
              <li>
                Copie o <b>UID</b> do usuario recem-criado.
              </li>
              <li>
                Clique em <b>Vincular operador</b> abaixo, cole o UID e escolha
                o evento.
              </li>
            </ol>
            <p className="text-xs">
              Criar usuarios direto pelo client requer service-role e nao funciona
              em produca o.
            </p>
          </div>
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
          Carregando operadores...
        </div>
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          empty="Nenhum operador cadastrado."
        />
      )}

      <LinkOperatorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        events={events}
        onCreated={() => {
          setModalOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function LinkOperatorModal({
  open,
  onClose,
  events,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  events: EventRow[];
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [linkUid, setLinkUid] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFullName("");
      setEventId("");
      setLinkUid("");
      setError(null);
      setInfo(null);
    }
  }, [open]);

  async function handleLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = linkUid.trim();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        trimmed
      )
    ) {
      setError("UID invalido. Use o formato UUID do auth.users (Supabase Dashboard).");
      return;
    }
    if (!fullName.trim()) {
      setError("Informe o nome completo.");
      return;
    }

    setSaving(true);
    try {
      const sb = getSupabase();
      const { error: profErr } = await sb.from("profiles").upsert({
        id: trimmed,
        full_name: fullName.trim(),
        role: "cashier",
        event_id: eventId || null,
      });
      if (profErr) {
        setError(profErr.message);
        return;
      }
      setInfo("Operador vinculado com sucesso.");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Vincular operador (caixa)">
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Primeiro crie o usuario no <b>Supabase Dashboard</b> (Authentication
        &rarr; Users &rarr; Add user). Depois copie o UID e cole aqui para
        criar o profile com <code>role=cashier</code>.
      </div>

      <form onSubmit={handleLink} className="space-y-3">
        <Input
          label="UID do auth.users"
          value={linkUid}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLinkUid(e.target.value)
          }
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          required
        />
        <Input
          label="Nome completo"
          value={fullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFullName(e.target.value)
          }
          required
        />
        <EventSelect events={events} value={eventId} onChange={setEventId} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {info}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Vincular
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EventSelect({
  events,
  value,
  onChange,
}: {
  events: EventRow[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Evento vinculado
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <option value="">Sem evento</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name}
          </option>
        ))}
      </select>
    </div>
  );
}
