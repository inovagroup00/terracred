import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Badge } from "@credshow/ui";
import { formatDate } from "@credshow/lib";
import type { BureauQueryResponse } from "@credshow/types";
import type { PromoterTokenInfo } from "../hooks/usePromoterToken";
import { useSessionLog } from "../hooks/useSessionLog";
import { usePendingTransactions, type PendingTransaction } from "../hooks/usePendingTransactions";
import { useCompletedTransactions } from "../hooks/useCompletedTransactions";
import { CpfQueryForm } from "../components/CpfQueryForm";
import { ApprovalActions, type ApprovalData, type SmsSentResult } from "../components/ApprovalActions";
import { QueryLog } from "../components/QueryLog";
import { Tabs, type TabKey } from "../components/Tabs";
import { PendingList } from "../components/PendingList";
import { PendingDetail } from "../components/PendingDetail";
import { CompletedList } from "../components/CompletedList";

interface HomeProps {
  info: PromoterTokenInfo;
}

interface PendingApproval {
  logId: string;
  data: ApprovalData;
}

interface RejectionInfo {
  cpfMasked: string;
  reason: string | null;
}

export function Home({ info }: HomeProps) {
  const log = useSessionLog(info.token);
  const [pending, setPending] = useState<PendingApproval | null>(null);
  const [rejection, setRejection] = useState<RejectionInfo | null>(null);
  const [tab, setTab] = useState<TabKey>("consulta");

  // Pending and completed transactions
  const pendingTx = usePendingTransactions(info.event.id, info.id);
  const completedTx = useCompletedTransactions(info.event.id, info.id);

  // Selected pending tx for the detail modal
  const [selectedPending, setSelectedPending] = useState<PendingTransaction | null>(null);

  // Notification banner: show when new pending arrives while user is not on aguardando tab
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const lastSeenCountRef = useRef<number>(0);

  useEffect(() => {
    // Reset banner dismissed when user visits the aguardando tab and reset baseline
    if (tab === "aguardando") {
      setBannerDismissed(false);
      lastSeenCountRef.current = pendingTx.items.length;
    }
  }, [tab, pendingTx.items.length]);

  useEffect(() => {
    // If list grew while not on aguardando, undismiss banner
    if (tab !== "aguardando" && pendingTx.items.length > lastSeenCountRef.current) {
      setBannerDismissed(false);
    }
    if (tab !== "aguardando") {
      lastSeenCountRef.current = pendingTx.items.length;
    }
  }, [pendingTx.items.length, tab]);

  function handleQueryResult(cpfMasked: string, resp: BureauQueryResponse) {
    const entry = log.addEntry({
      cpf: cpfMasked,
      approved: resp.approved,
      limit: resp.approved_limit,
      reason: resp.reason,
      bureau_query_id: resp.bureau_query_id,
      sms_sent: false,
      phone: null,
      client_link: null,
    });

    if (resp.approved && resp.approved_limit !== null) {
      setRejection(null);
      setPending({
        logId: entry.id,
        data: {
          bureau_query_id: resp.bureau_query_id,
          cpfMasked,
          approvedLimit: resp.approved_limit,
        },
      });
    } else {
      setPending(null);
      setRejection({ cpfMasked, reason: resp.reason });
    }
  }

  function handleSmsSent(result: SmsSentResult) {
    if (!pending) return;
    log.updateEntry(pending.logId, {
      sms_sent: true,
      phone: result.phoneMasked,
      client_link: result.clientLink,
    });
  }

  function clearPending() {
    setPending(null);
  }

  function clearRejection() {
    setRejection(null);
  }

  function openPending(item: PendingTransaction) {
    setSelectedPending(item);
  }

  function closePendingDetail() {
    setSelectedPending(null);
  }

  function handleActivated(transactionId: string) {
    pendingTx.removeLocally(transactionId);
    setSelectedPending(null);
    void completedTx.reload();
  }

  function handleCancelled(transactionId: string) {
    pendingTx.removeLocally(transactionId);
    setSelectedPending(null);
    void completedTx.reload();
  }

  const pendingCount = pendingTx.items.length;
  const showBanner =
    pendingCount > 0 && tab !== "aguardando" && !bannerDismissed;

  const bannerLabel = useMemo(() => {
    if (pendingCount === 1) return "1 cliente aguardando ativacao";
    return `${pendingCount} clientes aguardando ativacao`;
  }, [pendingCount]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-black via-neutral-900 to-black px-5 py-7 text-white shadow-lg">
        <div className="mx-auto max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
            TerraCred Promotor
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight">
            {info.event.name}
          </h1>
          <p className="mt-1.5 text-sm text-orange-100">{info.event.venue}</p>
          <p className="text-xs text-orange-200">{formatDate(info.event.event_date)}</p>
          {info.promoter_name && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-orange-50 backdrop-blur-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Promotor: <strong className="font-semibold">{info.promoter_name}</strong>
            </p>
          )}
        </div>
      </header>

      <Tabs active={tab} onChange={setTab} pendingCount={pendingCount} />

      {showBanner && (
        <div className="sticky top-0 z-40 border-b border-amber-300 bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-2.5 shadow-sm">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setTab("aguardando")}
              className="flex flex-1 items-center gap-2.5 text-left text-sm font-semibold text-amber-900"
            >
              <span className="relative flex h-7 w-7 flex-none items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-60" />
                <svg
                  className="relative"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 truncate">
                {bannerLabel} <span className="text-amber-700">- tocar para ver</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="text-xs text-amber-800 hover:underline"
              aria-label="Dispensar"
            >
              dispensar
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
        {tab === "consulta" && (
          <>
            <CpfQueryForm
              promoterToken={info.token}
              disabled={pending !== null}
              onResult={handleQueryResult}
            />

            {pending && (
              <ApprovalActions data={pending.data} onSent={handleSmsSent} onDismiss={clearPending} />
            )}

            {rejection && (
              <Card className="border-red-200 bg-red-50">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone="danger">Nao aprovado</Badge>
                  <button
                    type="button"
                    onClick={clearRejection}
                    className="text-sm text-red-700 underline"
                  >
                    Fechar
                  </button>
                </div>
                <p className="text-sm text-red-900">CPF {rejection.cpfMasked}</p>
                {rejection.reason && (
                  <p className="mt-1 text-sm text-red-800">{rejection.reason}</p>
                )}
              </Card>
            )}

            <QueryLog entries={log.entries} />
          </>
        )}

        {tab === "aguardando" && (
          <PendingList
            loading={pendingTx.loading}
            error={pendingTx.error}
            items={pendingTx.items}
            onSelect={openPending}
          />
        )}

        {tab === "concluidos" && (
          <CompletedList
            loading={completedTx.loading}
            error={completedTx.error}
            items={completedTx.items}
            onReload={() => void completedTx.reload()}
          />
        )}
      </main>

      {selectedPending && (
        <PendingDetail
          promoterToken={info.token}
          item={selectedPending}
          onClose={closePendingDetail}
          onActivated={handleActivated}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}
