import { useEffect, useState } from "react";
import { Card, Badge, Spinner } from "@credshow/ui";
import { formatBRL, formatRelativeTime, maskCpf } from "@credshow/lib";
import type { PendingTransaction } from "../hooks/usePendingTransactions";

interface PendingListProps {
  loading: boolean;
  error: string | null;
  items: PendingTransaction[];
  onSelect: (item: PendingTransaction) => void;
}

export function PendingList({ loading, error, items, onSelect }: PendingListProps) {
  // Tick every 30s so relative timestamps re-render
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

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
      </Card>
    );
  }

  if (items.length === 0) {
    return <PendingEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Aguardando ativacao ({items.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it)}
              className="block w-full rounded-2xl text-left focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <Card className="overflow-hidden border-l-4 border-l-amber-400 px-4 py-4 transition-all hover:-translate-y-px hover:border-l-violet-500 hover:bg-orange-50/40 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <Avatar url={it.document_photo_url} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-900">
                          {it.full_name ?? "Cliente"}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                          {maskCpf(it.cpf)}
                        </p>
                      </div>
                      <Badge tone="warning">Aguardando</Badge>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Valor
                        </p>
                        <p className="text-lg font-bold text-emerald-700">
                          {formatBRL(it.chosen_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {it.installments ?? 1}x de {formatBRL(it.installment_value)}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                          </span>
                          {formatRelativeTime(it.created_at, now)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AvatarProps {
  url: string | null;
}

function Avatar({ url }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className="h-12 w-12 flex-none rounded-lg object-cover ring-2 ring-amber-200"
      />
    );
  }
  return (
    <div
      className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-orange-100 text-orange-500"
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

function PendingEmptyState() {
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
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">
          Tudo em dia por aqui
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Quando um cliente terminar o cadastro, a solicitacao aparece aqui em tempo real.
        </p>
      </div>
    </Card>
  );
}
