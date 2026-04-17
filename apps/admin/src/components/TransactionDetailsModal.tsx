import { useEffect, useState } from "react";
import { Badge, Spinner } from "@credshow/ui";
import {
  formatBRL,
  formatDate,
  formatDateTime,
  getSupabase,
  maskCpf,
  maskPhone,
} from "@credshow/lib";
import type { Database, Json } from "@credshow/types/database";
import { Modal } from "./Modal";
import { TransactionStatusBadge } from "./StatusBadge";
import type { TransactionRow } from "../hooks/useRealtimeTransactions";

type TransactionEvent =
  Database["public"]["Tables"]["transaction_events"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PromoterTokenRow =
  Database["public"]["Tables"]["event_promoter_tokens"]["Row"];

interface Props {
  open: boolean;
  onClose: () => void;
  transaction: TransactionRow | null;
}

interface MetadataRecord {
  [key: string]: Json | undefined;
}

function isRecord(v: Json | null | undefined): v is MetadataRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function getStr(meta: Json | null, key: string): string | null {
  if (!isRecord(meta)) return null;
  const val = meta[key];
  return typeof val === "string" ? val : null;
}

export function TransactionDetailsModal({ open, onClose, transaction }: Props) {
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [actorProfiles, setActorProfiles] = useState<
    Record<string, ProfileRow>
  >({});
  const [promoterToken, setPromoterToken] = useState<PromoterTokenRow | null>(
    null
  );
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState<{
    url: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!open || !transaction) {
      setEvents([]);
      setActorProfiles({});
      setPromoterToken(null);
      setError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingEvents(true);
      setError(null);
      const sb = getSupabase();
      const { data: evRows, error: evErr } = await sb
        .from("transaction_events")
        .select("*")
        .eq("transaction_id", transaction.id)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (evErr) {
        setError(evErr.message);
        setEvents([]);
        setLoadingEvents(false);
        return;
      }
      const evList = evRows ?? [];
      setEvents(evList);

      // Fetch profiles for actors (cashiers/admins)
      const actorIds = Array.from(
        new Set(evList.map((e) => e.actor_id).filter((x): x is string => !!x))
      );
      if (actorIds.length > 0) {
        const { data: profs } = await sb
          .from("profiles")
          .select("*")
          .in("id", actorIds);
        if (!cancelled && profs) {
          const map: Record<string, ProfileRow> = {};
          for (const p of profs) map[p.id] = p;
          setActorProfiles(map);
        }
      }

      // Fetch promoter token if activated
      if (transaction.activated_by_promoter_token_id) {
        const { data: tok } = await sb
          .from("event_promoter_tokens")
          .select("*")
          .eq("id", transaction.activated_by_promoter_token_id)
          .maybeSingle();
        if (!cancelled) setPromoterToken(tok ?? null);
      }
      setLoadingEvents(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, transaction]);

  if (!transaction) return null;

  // Find specific events
  const activatedEvent = events.find((e) => e.event_type === "activated");
  const cancelledEvent = events.find((e) => e.event_type === "cancelled");

  const activatedActor = activatedEvent?.actor_id
    ? actorProfiles[activatedEvent.actor_id]
    : null;
  const activatedComanda = activatedEvent
    ? getStr(activatedEvent.metadata, "comanda_ref") ??
      getStr(activatedEvent.metadata, "comanda")
    : null;
  const activatedPromoterName =
    promoterToken?.promoter_name ??
    (activatedEvent ? getStr(activatedEvent.metadata, "promoter_name") : null);

  const cancelledActor = cancelledEvent?.actor_id
    ? actorProfiles[cancelledEvent.actor_id]
    : null;
  const cancelReason =
    transaction.cancellation_reason ??
    (cancelledEvent ? getStr(cancelledEvent.metadata, "reason") : null);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Detalhes da transacao"
        size="xl"
      >
        <div className="space-y-6">
          {/* Header summary */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Cliente</p>
              <p className="text-xl font-semibold text-slate-900">
                {transaction.full_name ?? "(sem nome)"}
              </p>
              <p className="font-mono text-sm text-slate-600">
                {maskCpf(transaction.cpf)}
              </p>
            </div>
            <TransactionStatusBadge status={transaction.status} />
          </div>

          {/* Datas */}
          <Section title="Datas">
            <DefList>
              <DefItem
                label="Criado em"
                value={formatDateTime(transaction.created_at)}
              />
              <DefItem
                label="Atualizado em"
                value={formatDateTime(transaction.updated_at)}
              />
              {transaction.activated_at && (
                <DefItem
                  label="Ativada em"
                  value={formatDateTime(transaction.activated_at)}
                  tone="success"
                />
              )}
              {transaction.cancelled_at && (
                <DefItem
                  label="Cancelada em"
                  value={formatDateTime(transaction.cancelled_at)}
                  tone="danger"
                />
              )}
              {transaction.terms_accepted_at && (
                <DefItem
                  label="Termos aceitos em"
                  value={formatDateTime(transaction.terms_accepted_at)}
                />
              )}
            </DefList>
          </Section>

          {/* Dados pessoais */}
          <Section title="Dados pessoais">
            <DefList>
              <DefItem label="Nome" value={transaction.full_name ?? "-"} />
              <DefItem label="CPF" value={maskCpf(transaction.cpf)} />
              <DefItem label="Email" value={transaction.email ?? "-"} />
              <DefItem
                label="Celular"
                value={transaction.phone ? maskPhone(transaction.phone) : "-"}
              />
            </DefList>
            {(transaction.cep ||
              transaction.street ||
              transaction.city ||
              transaction.state) && (
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {transaction.street ? `${transaction.street}, ` : ""}
                {transaction.number ?? ""}
                {transaction.complement ? ` - ${transaction.complement}` : ""}
                {transaction.neighborhood ? ` - ${transaction.neighborhood}` : ""}
                {transaction.city ? `, ${transaction.city}` : ""}
                {transaction.state ? `/${transaction.state}` : ""}
                {transaction.cep ? ` - CEP ${transaction.cep}` : ""}
              </div>
            )}
          </Section>

          {/* Credito */}
          <Section title="Credito">
            <DefList>
              <DefItem
                label="Valor"
                value={
                  transaction.chosen_amount
                    ? formatBRL(transaction.chosen_amount)
                    : "-"
                }
                emphasis
              />
              <DefItem
                label="Parcelas"
                value={transaction.installments ?? "-"}
              />
              <DefItem
                label="Valor parcela"
                value={
                  transaction.installment_value
                    ? formatBRL(transaction.installment_value)
                    : "-"
                }
              />
              <DefItem
                label="Primeira parcela"
                value={
                  transaction.first_due_date
                    ? formatDate(transaction.first_due_date)
                    : "-"
                }
              />
            </DefList>
          </Section>

          {/* Verificacao */}
          <Section title="Verificacao">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PhotoThumb
                label="Documento"
                url={transaction.document_photo_url}
                onOpen={(url) =>
                  setPhotoOpen({ url, label: "Documento" })
                }
              />
              <PhotoThumb
                label="Selfie"
                url={transaction.selfie_url}
                onOpen={(url) => setPhotoOpen({ url, label: "Selfie" })}
              />
            </div>
          </Section>

          {/* Quem ativou */}
          {transaction.status === "activated" && (
            <Section title="Ativacao">
              <DefList>
                <DefItem
                  label="Promotor"
                  value={activatedPromoterName ?? "-"}
                />
                <DefItem
                  label="Comanda"
                  value={
                    activatedComanda ? (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
                        {activatedComanda}
                      </code>
                    ) : (
                      "-"
                    )
                  }
                />
                <DefItem
                  label="Caixa"
                  value={activatedActor?.full_name ?? "-"}
                />
                <DefItem
                  label="Token promotor"
                  value={
                    promoterToken?.token ? (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
                        {promoterToken.token}
                      </code>
                    ) : (
                      "-"
                    )
                  }
                />
              </DefList>
            </Section>
          )}

          {/* Quem cancelou */}
          {transaction.status === "cancelled" && (
            <Section title="Cancelamento">
              <DefList>
                <DefItem
                  label="Cancelado por"
                  value={cancelledActor?.full_name ?? "Sistema"}
                />
                <DefItem
                  label="Papel"
                  value={cancelledEvent?.actor_role ?? "-"}
                />
              </DefList>
              {cancelReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                    Motivo
                  </p>
                  <p className="mt-1">{cancelReason}</p>
                </div>
              )}
            </Section>
          )}

          {/* Audit log */}
          <Section title="Historico de eventos">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {loadingEvents ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Spinner className="h-4 w-4" />
                Carregando historico...
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                Sem eventos registrados.
              </div>
            ) : (
              <ol className="relative ml-2 space-y-3 border-l-2 border-slate-200 pl-5">
                {events.map((ev) => (
                  <AuditEntry
                    key={ev.id}
                    event={ev}
                    actor={
                      ev.actor_id ? actorProfiles[ev.actor_id] : undefined
                    }
                  />
                ))}
              </ol>
            )}
          </Section>
        </div>
      </Modal>

      {/* Fullscreen photo viewer */}
      {photoOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur"
          onClick={() => setPhotoOpen(null)}
        >
          <div className="absolute right-4 top-4 flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {photoOpen.label}
            </span>
            <button
              type="button"
              onClick={() => setPhotoOpen(null)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Fechar foto"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
          <img
            src={photoOpen.url}
            alt={photoOpen.label}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

/* ---------- helpers ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DefList({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {children}
    </dl>
  );
}

function DefItem({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
  tone?: "success" | "danger";
}) {
  const valClass = emphasis
    ? "text-base font-semibold text-slate-900"
    : tone === "success"
      ? "text-sm text-emerald-700"
      : tone === "danger"
        ? "text-sm text-red-700"
        : "text-sm text-slate-800";
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className={`mt-0.5 ${valClass}`}>{value}</dd>
    </div>
  );
}

function PhotoThumb({
  label,
  url,
  onOpen,
}: {
  label: string;
  url: string | null;
  onOpen: (url: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-600">{label}</p>
      {url ? (
        <button
          type="button"
          onClick={() => onOpen(url)}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition hover:border-orange-400 hover:shadow-md"
        >
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute bottom-2 right-2 rounded-md bg-slate-900/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            Ver em tela cheia
          </span>
        </button>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
          Sem foto
        </div>
      )}
    </div>
  );
}

const EVENT_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  created: { label: "Criada", tone: "neutral" },
  pending_onboarding: { label: "Aguardando cadastro", tone: "warning" },
  awaiting_activation: { label: "Aguardando ativacao", tone: "info" },
  activated: { label: "Ativada", tone: "success" },
  cancelled: { label: "Cancelada", tone: "danger" },
  expired: { label: "Expirada", tone: "neutral" },
  pin_set: { label: "PIN definido", tone: "neutral" },
  terms_accepted: { label: "Termos aceitos", tone: "neutral" },
  photo_uploaded: { label: "Foto enviada", tone: "neutral" },
  sms_sent: { label: "SMS enviado", tone: "info" },
};

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

function AuditEntry({
  event,
  actor,
}: {
  event: TransactionEvent;
  actor?: ProfileRow;
}) {
  const meta = EVENT_LABELS[event.event_type] ?? {
    label: event.event_type,
    tone: "neutral" as BadgeTone,
  };
  const reason = getStr(event.metadata, "reason");
  const comanda =
    getStr(event.metadata, "comanda_ref") ?? getStr(event.metadata, "comanda");

  return (
    <li className="relative">
      <span
        className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
          meta.tone === "success"
            ? "bg-emerald-500"
            : meta.tone === "danger"
              ? "bg-red-500"
              : meta.tone === "warning"
                ? "bg-amber-500"
                : meta.tone === "info"
                  ? "bg-orange-500"
                  : "bg-slate-400"
        }`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span className="text-xs text-slate-500">
          {formatDateTime(event.created_at)}
        </span>
        <span className="text-xs text-slate-400">
          - {actor?.full_name ?? event.actor_role}
        </span>
      </div>
      {(reason || comanda) && (
        <div className="mt-1 text-xs text-slate-600">
          {comanda && (
            <span className="mr-2">
              comanda:{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
                {comanda}
              </code>
            </span>
          )}
          {reason && <span>motivo: {reason}</span>}
        </div>
      )}
    </li>
  );
}
