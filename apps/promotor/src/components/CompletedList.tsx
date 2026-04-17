import { Card, Badge, Spinner } from "@credshow/ui";
import { formatBRL, formatDateTime, maskCpf } from "@credshow/lib";
import type { CompletedTransaction } from "../hooks/useCompletedTransactions";

interface CompletedListProps {
  loading: boolean;
  error: string | null;
  items: CompletedTransaction[];
  onReload: () => void;
}

export function CompletedList({ loading, error, items, onReload }: CompletedListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12 text-orange-600">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="text-sm text-red-800">{error}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-2 text-sm text-red-700 underline"
        >
          Tentar novamente
        </button>
      </Card>
    );
  }

  if (items.length === 0) {
    return <CompletedEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Concluidos ({items.length})
        </h2>
        <button
          type="button"
          onClick={onReload}
          className="text-xs font-medium text-orange-700 hover:underline"
        >
          Atualizar
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((it) => {
          const isActivated = it.status === "activated";
          return (
            <li key={it.id}>
              <Card
                className={
                  isActivated
                    ? "overflow-hidden border-l-4 border-l-emerald-500 px-4 py-4"
                    : "overflow-hidden border-l-4 border-l-slate-300 bg-slate-50/40 px-4 py-4"
                }
              >
                <div className="flex items-start gap-3">
                  <Avatar url={it.document_photo_url} muted={!isActivated} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={
                            isActivated
                              ? "truncate text-base font-semibold text-slate-900"
                              : "truncate text-base font-semibold text-slate-500"
                          }
                        >
                          {it.full_name ?? "Cliente"}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                          {maskCpf(it.cpf)}
                        </p>
                      </div>
                      {isActivated ? (
                        <Badge tone="success">Ativado</Badge>
                      ) : (
                        <Badge tone="danger">Cancelado</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Valor
                        </p>
                        <p
                          className={
                            isActivated
                              ? "text-lg font-bold text-emerald-700"
                              : "text-lg font-bold text-slate-400 line-through"
                          }
                        >
                          {formatBRL(it.chosen_amount)}
                        </p>
                        {it.installments && (
                          <p className="text-[11px] text-slate-500">{it.installments}x</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">
                          {formatDateTime(it.finished_at)}
                        </p>
                      </div>
                    </div>
                    {!isActivated && it.cancellation_reason && (
                      <p className="mt-2 rounded-md bg-slate-100 px-2 py-1.5 text-xs text-slate-600">
                        Motivo: {it.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface AvatarProps {
  url: string | null;
  muted?: boolean;
}

function Avatar({ url, muted }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className={
          muted
            ? "h-12 w-12 flex-none rounded-lg object-cover opacity-60 grayscale"
            : "h-12 w-12 flex-none rounded-lg object-cover"
        }
      />
    );
  }
  return (
    <div
      className={
        muted
          ? "flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-slate-200 text-slate-400"
          : "flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-orange-100 text-orange-500"
      }
      aria-hidden
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function CompletedEmptyState() {
  return (
    <Card className="border-dashed bg-white/60 px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Nenhuma transacao concluida ainda
        </p>
        <p className="mt-1 text-xs text-slate-500">
          As transacoes ativadas e canceladas aparecem aqui.
        </p>
      </div>
    </Card>
  );
}
