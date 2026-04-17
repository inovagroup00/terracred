import { useEffect, useState } from "react";
import { Button, Input, Badge } from "@credshow/ui";
import {
  formatBRL,
  formatDate,
  formatDateTime,
  maskCpf,
  maskPhone,
  fnPromoterActivate,
  fnPromoterCancel,
} from "@credshow/lib";
import type { PendingTransaction } from "../hooks/usePendingTransactions";

interface PendingDetailProps {
  promoterToken: string;
  item: PendingTransaction;
  onClose: () => void;
  onActivated: (transactionId: string) => void;
  onCancelled: (transactionId: string) => void;
}

type Mode = "view" | "confirm-cancel";

export function PendingDetail({
  promoterToken,
  item,
  onClose,
  onActivated,
  onCancelled,
}: PendingDetailProps) {
  const [comanda, setComanda] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<{ url: string; label: string } | null>(null);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC handling: close zoom first, then confirm-cancel, then modal
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (zoomed) {
        setZoomed(null);
        return;
      }
      if (busy) return;
      if (mode === "confirm-cancel") {
        setMode("view");
      } else {
        onClose();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [busy, mode, zoomed, onClose]);

  async function handleActivate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const trimmed = comanda.trim();
      await fnPromoterActivate({
        promoter_token: promoterToken,
        transaction_id: item.id,
        comanda_ref: trimmed === "" ? undefined : trimmed,
      });
      onActivated(item.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao ativar";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelConfirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const trimmed = reason.trim();
      await fnPromoterCancel({
        promoter_token: promoterToken,
        transaction_id: item.id,
        reason: trimmed === "" ? undefined : trimmed,
      });
      onCancelled(item.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao cancelar";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 px-0 py-0 sm:items-center sm:px-4 sm:py-6"
        onClick={() => {
          if (!busy) onClose();
        }}
      >
        <div
          className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-orange-50 to-white px-5 py-5">
            <div className="min-w-0">
              <Badge tone="warning">Aguardando ativacao</Badge>
              <h2 className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900">
                {item.full_name ?? "Cliente"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Recebido em {formatDateTime(item.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              aria-label="Fechar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          {mode === "view" ? (
            <div className="max-h-[calc(100dvh-160px)] overflow-y-auto px-5 py-5 sm:max-h-[70vh]">
              {/* Highlighted amount */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-5 py-5 text-white shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-100">
                  Valor solicitado
                </p>
                <p className="mt-1 text-4xl font-extrabold leading-none tracking-tight">
                  {formatBRL(item.chosen_amount)}
                </p>
                <p className="mt-3 text-sm text-emerald-50">
                  {item.installments ?? 1}x de{" "}
                  <strong>{formatBRL(item.installment_value)}</strong>
                </p>
                {item.first_due_date && (
                  <p className="text-xs text-emerald-100">
                    1a parcela em {formatDate(item.first_due_date)}
                  </p>
                )}
              </div>

              {/* Customer details */}
              <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                <div className="col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    CPF
                  </dt>
                  <dd className="font-mono text-base text-slate-900">
                    {maskCpf(item.cpf)}
                  </dd>
                </div>
                {item.email && (
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </dt>
                    <dd className="break-all text-base text-slate-900">{item.email}</dd>
                  </div>
                )}
                {item.phone && (
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Celular
                    </dt>
                    <dd className="text-base text-slate-900">{maskPhone(item.phone)}</dd>
                  </div>
                )}
              </dl>

              {/* Verification photos */}
              {(item.document_photo_url || item.selfie_url) && (
                <div className="mt-5">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Verificacao
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <PhotoThumb
                      url={item.document_photo_url}
                      label="Documento"
                      onZoom={(url, label) => setZoomed({ url, label })}
                    />
                    <PhotoThumb
                      url={item.selfie_url}
                      label="Selfie"
                      onZoom={(url, label) => setZoomed({ url, label })}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Toque para ampliar e conferir.
                  </p>
                </div>
              )}

              <div className="mt-5">
                <Input
                  label="Comanda / Mesa (opcional)"
                  placeholder="Ex: 27"
                  value={comanda}
                  onChange={(e) => setComanda(e.target.value)}
                  className="h-12 text-base"
                  disabled={busy}
                  autoComplete="off"
                  maxLength={32}
                />
              </div>

              {error && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 text-base font-semibold shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300"
                  onClick={handleActivate}
                  loading={busy}
                  disabled={busy}
                >
                  Liberar credito
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("confirm-cancel");
                  }}
                  disabled={busy}
                  className="mt-1 self-center text-sm text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Cancelar transacao
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <h3 className="text-base font-semibold text-slate-900">
                Confirmar cancelamento?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                A transacao de{" "}
                <strong>{item.full_name ?? "este cliente"}</strong> no valor de{" "}
                <strong>{formatBRL(item.chosen_amount)}</strong> sera cancelada.
              </p>

              <div className="mt-4">
                <Input
                  label="Motivo (opcional)"
                  placeholder="Ex: cliente desistiu"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-12 text-base"
                  disabled={busy}
                  autoComplete="off"
                  maxLength={200}
                />
              </div>

              {error && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  size="lg"
                  variant="danger"
                  className="w-full"
                  onClick={handleCancelConfirm}
                  loading={busy}
                  disabled={busy}
                >
                  Confirmar cancelamento
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setError(null);
                    setMode("view");
                  }}
                  disabled={busy}
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {zoomed && (
        <PhotoLightbox
          url={zoomed.url}
          label={zoomed.label}
          onClose={() => setZoomed(null)}
        />
      )}
    </>
  );
}

interface PhotoThumbProps {
  url: string | null;
  label: string;
  onZoom: (url: string, label: string) => void;
}

function PhotoThumb({ url, label, onZoom }: PhotoThumbProps) {
  if (!url) {
    return (
      <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-300"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-[10px] text-slate-400">Sem foto</p>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onZoom(url, label)}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
      aria-label={`Ampliar ${label}`}
    >
      <img
        src={url}
        alt={label}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent px-2 py-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white">
          {label}
        </p>
      </div>
    </button>
  );
}

interface PhotoLightboxProps {
  url: string;
  label: string;
  onClose: () => void;
}

function PhotoLightbox({ url, label, onClose }: PhotoLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-white">
        <p className="text-sm font-semibold uppercase tracking-wider">{label}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Fechar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-6">
        <img
          src={url}
          alt={label}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
