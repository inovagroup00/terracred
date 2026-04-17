import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Input, Spinner } from "@credshow/ui";
import {
  formatBRL,
  formatDateTime,
  getSupabase,
  maskCpf,
  maskPhone,
} from "@credshow/lib";
import type { Database } from "@credshow/types/database";
import { KpiCard } from "../components/KpiCard";
import {
  EventStatusBadge,
  TransactionStatusBadge,
} from "../components/StatusBadge";
import { DataTable, Column } from "../components/DataTable";
import { CopyButton } from "../components/CopyButton";
import { Modal } from "../components/Modal";
import { TransactionDetailsModal } from "../components/TransactionDetailsModal";
import { useEventKpis } from "../hooks/useEventKpis";
import {
  useRealtimeTransactions,
  type TransactionRow,
} from "../hooks/useRealtimeTransactions";
import { randomPromoterToken } from "../lib/randomToken";
import { PROMOTOR_BASE_URL } from "../lib/env";
import {
  transactionsToInstallmentsCsv,
  downloadCsv,
  buildExportFilename,
  describeExport,
  summarizeForExport,
} from "../lib/exportCsv";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type TokenRow = Database["public"]["Tables"]["event_promoter_tokens"]["Row"];
type BureauRow = Database["public"]["Tables"]["bureau_queries"]["Row"];

type Tab = "tokens" | "queries" | "transactions";

function promoterLink(token: string): string {
  return `${PROMOTOR_BASE_URL}/?t=${token}`;
}

interface TabCounts {
  tokens: number;
  queries: number;
  transactions: number;
}

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("tokens");
  const [counts, setCounts] = useState<TabCounts>({
    tokens: 0,
    queries: 0,
    transactions: 0,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoadingEvent(true);
      const sb = getSupabase();
      const { data, error } = await sb
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) setEventError(error.message);
      setEvent(data ?? null);
      setLoadingEvent(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { kpis, loading: loadingKpis } = useEventKpis(id ?? null);

  if (!id) {
    return <p className="text-slate-500">Evento invalido.</p>;
  }

  if (loadingEvent) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner className="h-4 w-4" />
        Carregando evento...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {eventError ?? "Evento nao encontrado."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/eventos"
            className="text-xs text-orange-600 hover:underline"
          >
            &larr; Voltar para eventos
          </Link>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {event.name}
          </h2>
          <p className="text-sm text-slate-500">
            {event.venue} &middot; {formatDateTime(event.event_date)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EventStatusBadge status={event.status} />
          <Link
            to={`/eventos/${event.id}/editar`}
            className="text-sm text-orange-600 hover:underline"
          >
            Editar
          </Link>
        </div>
      </div>

      <section>
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

      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          <TabButton
            active={tab === "tokens"}
            onClick={() => setTab("tokens")}
            count={counts.tokens}
          >
            Tokens de Promotor
          </TabButton>
          <TabButton
            active={tab === "queries"}
            onClick={() => setTab("queries")}
            count={counts.queries}
          >
            Consultas
          </TabButton>
          <TabButton
            active={tab === "transactions"}
            onClick={() => setTab("transactions")}
            count={counts.transactions}
          >
            Transacoes
          </TabButton>
        </nav>
      </div>

      {tab === "tokens" && (
        <TokensTab
          eventId={event.id}
          onCount={(n) => setCounts((c) => ({ ...c, tokens: n }))}
        />
      )}
      {tab === "queries" && (
        <QueriesTab
          eventId={event.id}
          onCount={(n) => setCounts((c) => ({ ...c, queries: n }))}
        />
      )}
      {tab === "transactions" && (
        <TransactionsTab
          eventId={event.id}
          onCount={(n) => setCounts((c) => ({ ...c, transactions: n }))}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "border-orange-600 text-orange-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <span>{children}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
            active
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ---------- Empty state ---------- */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Tokens tab ---------- */

function TokensTab({
  eventId,
  onCount,
}: {
  eventId: string;
  onCount: (n: number) => void;
}) {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [promoterName, setPromoterName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const sb = getSupabase();
    const { data, error: err } = await sb
      .from("event_promoter_tokens")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setTokens([]);
      onCount(0);
    } else {
      const rows = data ?? [];
      setTokens(rows);
      setError(null);
      onCount(rows.length);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!promoterName.trim()) {
      setError("Informe o nome do promotor.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { error: err } = await sb.from("event_promoter_tokens").insert({
        event_id: eventId,
        token: randomPromoterToken(),
        promoter_name: promoterName.trim(),
        active: true,
      });
      if (err) throw err;
      setPromoterName("");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar token.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: TokenRow) {
    const sb = getSupabase();
    const { error: err } = await sb
      .from("event_promoter_tokens")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (err) {
      setError(err.message);
    } else {
      await load();
    }
  }

  const columns: Column<TokenRow>[] = [
    {
      key: "token",
      header: "Token",
      render: (r) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
            {r.token}
          </code>
          <CopyButton value={r.token} label="Token" />
        </div>
      ),
    },
    {
      key: "name",
      header: "Promotor",
      render: (r) => r.promoter_name ?? "-",
    },
    {
      key: "active",
      header: "Status",
      render: (r) =>
        r.active ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="neutral">Inativo</Badge>
        ),
    },
    {
      key: "created",
      header: "Criado",
      render: (r) => formatDateTime(r.created_at),
    },
    {
      key: "link",
      header: "Link",
      render: (r) => (
        <div className="flex items-center gap-2">
          <a
            href={promoterLink(r.token)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-orange-600 hover:underline truncate max-w-xs"
          >
            {promoterLink(r.token)}
          </a>
          <CopyButton value={promoterLink(r.token)} label="Link" />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Acoes",
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => void toggleActive(r)}>
          {r.active ? "Desativar" : "Ativar"}
        </Button>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Tokens permitem que promotores consultem CPFs durante o evento.
        </p>
        <Button onClick={() => setModalOpen(true)}>Gerar token</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner className="h-4 w-4" />
          Carregando tokens...
        </div>
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          }
          title="Nenhum token gerado ainda"
          description="Gere um token para cada promotor que vai operar neste evento."
        />
      ) : (
        <DataTable
          rows={tokens}
          columns={columns}
          rowKey={(r) => r.id}
          empty="Nenhum token gerado ainda."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Gerar token de promotor"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={(e) => void handleCreate(e as unknown as FormEvent)}
              loading={saving}
            >
              Gerar token
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleCreate}
          className="space-y-3"
          id="create-token-form"
        >
          <Input
            label="Nome do promotor"
            value={promoterName}
            onChange={(e) => setPromoterName(e.target.value)}
            placeholder="Ex: Joao Silva"
            autoFocus
            required
          />
          <p className="text-xs text-slate-500">
            Um token aleatorio sera gerado automaticamente no formato{" "}
            <code>tok_xxxxxxxxxxxxxxxx</code>.
          </p>
        </form>
      </Modal>
    </section>
  );
}

/* ---------- Queries tab ---------- */

function QueriesTab({
  eventId,
  onCount,
}: {
  eventId: string;
  onCount: (n: number) => void;
}) {
  const [rows, setRows] = useState<BureauRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const sb = getSupabase();
      const { data, error: err } = await sb
        .from("bureau_queries")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setRows([]);
        onCount(0);
      } else {
        const list = data ?? [];
        setRows(list);
        setError(null);
        onCount(list.length);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const columns: Column<BureauRow>[] = [
    {
      key: "created",
      header: "Hora",
      render: (r) => formatDateTime(r.created_at),
    },
    { key: "cpf", header: "CPF", render: (r) => maskCpf(r.cpf) },
    {
      key: "approved",
      header: "Aprovado",
      render: (r) =>
        r.approved ? (
          <Badge tone="success">Sim</Badge>
        ) : (
          <Badge tone="danger">Nao</Badge>
        ),
    },
    {
      key: "limit",
      header: "Limite",
      render: (r) => (r.approved_limit ? formatBRL(r.approved_limit) : "-"),
    },
    {
      key: "phone",
      header: "Telefone",
      render: (r) => (r.phone ? maskPhone(r.phone) : "-"),
    },
    {
      key: "sms",
      header: "SMS",
      render: (r) =>
        r.sms_sent_at ? (
          <span className="text-xs text-slate-600">
            {formatDateTime(r.sms_sent_at)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        ),
    },
  ];

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner className="h-4 w-4" />
          Carregando consultas...
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          }
          title="Nenhuma consulta registrada"
          description="As consultas de CPF aparecerao aqui em tempo real."
        />
      ) : (
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />
      )}
    </section>
  );
}

/* ---------- Transactions tab ---------- */

function TransactionsTab({
  eventId,
  onCount,
}: {
  eventId: string;
  onCount: (n: number) => void;
}) {
  const { transactions, loading, error } = useRealtimeTransactions(eventId);
  const [selected, setSelected] = useState<TransactionRow | null>(null);

  useEffect(() => {
    onCount(transactions.length);
  }, [transactions.length, onCount]);

  // Keep selected in sync with realtime updates so audit log etc. stay fresh
  useEffect(() => {
    if (!selected) return;
    const updated = transactions.find((t) => t.id === selected.id);
    if (updated && updated !== selected) setSelected(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const columns: Column<TransactionRow>[] = [
    {
      key: "created",
      header: "Hora",
      render: (r) => formatDateTime(r.created_at),
    },
    { key: "cpf", header: "CPF", render: (r) => maskCpf(r.cpf) },
    {
      key: "name",
      header: "Nome",
      render: (r) => r.full_name ?? "-",
    },
    {
      key: "amount",
      header: "Valor",
      render: (r) => (r.chosen_amount ? formatBRL(r.chosen_amount) : "-"),
    },
    {
      key: "installments",
      header: "Parcelas",
      render: (r) =>
        r.installments
          ? `${r.installments}x ${r.installment_value ? formatBRL(r.installment_value) : ""}`
          : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <TransactionStatusBadge status={r.status} />,
    },
    {
      key: "verif",
      header: "Verif.",
      render: (r) => (
        <div className="flex items-center gap-1">
          {r.document_photo_url ? (
            <span
              title="Documento enviado"
              className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-3 w-3"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
          ) : (
            <span className="inline-block h-5 w-5 rounded bg-slate-100" />
          )}
          {r.selfie_url ? (
            <span
              title="Selfie enviada"
              className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-3 w-3"
              >
                <circle cx="12" cy="9" r="3" />
                <path d="M5 20a7 7 0 0114 0" />
              </svg>
            </span>
          ) : (
            <span className="inline-block h-5 w-5 rounded bg-slate-100" />
          )}
        </div>
      ),
    },
  ];

  const exportSummary = summarizeForExport(transactions);
  const canExport = exportSummary.activatedCount > 0;

  function handleExport() {
    const csv = transactionsToInstallmentsCsv(transactions, { onlyActivated: true });
    const eventName = transactions[0]?.event_id ?? "evento";
    const filename = buildExportFilename(eventName);
    downloadCsv(filename, csv);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Realtime ativo - transacoes atualizam automaticamente. Clique em uma
          linha para ver detalhes.
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {canExport ? describeExport(transactions) : "Sem pedidos ativados"}
          </span>
          <Button
            size="sm"
            variant={canExport ? "primary" : "secondary"}
            disabled={!canExport}
            onClick={handleExport}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1.5 h-4 w-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </Button>
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
          Carregando transacoes...
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
            </svg>
          }
          title="Nenhuma transacao registrada"
          description="Quando um cliente concluir o cadastro, a transacao aparecera aqui."
        />
      ) : (
        <DataTable
          rows={transactions}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelected(r)}
        />
      )}

      <TransactionDetailsModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        transaction={selected}
      />
    </section>
  );
}
