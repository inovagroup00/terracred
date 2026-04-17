import { useEffect, useState } from "react";
import { Spinner, Card, Button, Badge } from "@credshow/ui";
import { fnCreateTransaction, formatBRL, formatDate } from "@credshow/lib";
import type {
  CreateTransactionResponse,
  TransactionStatus,
} from "@credshow/types";

import { Stepper } from "../components/Stepper";
import { Welcome } from "../components/steps/Welcome";
import { PersonalData, type PersonalDataValue } from "../components/steps/PersonalData";
import { Documents, type DocumentsValue } from "../components/steps/Documents";
import { AmountSelect } from "../components/steps/AmountSelect";
import { InstallmentsSelect } from "../components/steps/InstallmentsSelect";
import { Terms } from "../components/steps/Terms";

import { getTokenFromUrl } from "../lib/env";
import { useOnboardingContext } from "../hooks/useOnboardingContext";
import { useTransactionRealtime } from "../hooks/useTransactionRealtime";
import { InvalidLink } from "./InvalidLink";
import { Expired } from "./Expired";

const TOTAL_STEPS = 7;

type FormState = {
  personal: PersonalDataValue;
  documents: DocumentsValue | null;
  amount: number | null;
  installments: 1 | 2 | 3 | null;
};

const EMPTY_FORM: FormState = {
  personal: { fullName: "", email: "" },
  documents: null,
  amount: null,
  installments: null,
};

export function Onboarding() {
  const token = getTokenFromUrl();
  const ctxState = useOnboardingContext(token);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<CreateTransactionResponse | null>(null);

  const [existingTx, setExistingTx] = useState<{
    transaction_id: string;
    status: TransactionStatus;
  } | null>(null);

  useEffect(() => {
    if (ctxState.status !== "ready") return;
    const existing = ctxState.data.existing_transaction;
    if (!existing) return;
    setExistingTx({ transaction_id: existing.id, status: existing.status });
    setStep(TOTAL_STEPS);
  }, [ctxState]);

  const txnIdForRealtime = transaction?.transaction_id ?? existingTx?.transaction_id ?? null;
  const initialStatus = transaction?.status ?? existingTx?.status ?? null;
  const realtime = useTransactionRealtime(txnIdForRealtime, initialStatus);

  if (ctxState.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-orange-600" />
      </div>
    );
  }
  if (ctxState.status === "invalid") return <InvalidLink />;
  if (ctxState.status === "expired") return <Expired />;
  if (ctxState.status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Nao foi possivel continuar</h1>
        <Card className="w-full text-sm text-slate-700">{ctxState.message}</Card>
      </div>
    );
  }

  const ctx = ctxState.data;

  async function submitOnboarding() {
    if (!token) return;
    if (!form.amount || !form.installments || !form.documents) return;
    setCreateError(null);
    setCreating(true);
    try {
      const resp = await fnCreateTransaction({
        sms_link_token: token,
        full_name: form.personal.fullName,
        email: form.personal.email,
        document_photo_url: form.documents.document_photo_url,
        selfie_url: form.documents.selfie_url,
        chosen_amount: form.amount,
        installments: form.installments,
        terms_accepted: true,
      });
      setTransaction(resp);
      setStep(TOTAL_STEPS);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Erro ao concluir. Tente novamente.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  // estado da tela final
  const finalStatus: TransactionStatus | null = realtime.status ?? initialStatus;
  const finalAmount = transaction?.chosen_amount ?? form.amount ?? 0;
  const finalInstallments = transaction?.installments ?? form.installments ?? 1;
  const finalInstallmentValue = transaction?.installment_value ??
    (form.amount && form.installments ? Math.round((form.amount / form.installments) * 100) / 100 : 0);
  const finalFirstDue = transaction?.first_due_date ?? null;

  return (
    <>
      <Stepper total={TOTAL_STEPS} current={step} />

      <StepShell stepKey={step}>
        {step === 1 && <Welcome context={ctx} onContinue={() => setStep(2)} />}

        {step === 2 && (
          <PersonalData
            initial={form.personal}
            onBack={() => setStep(1)}
            onSubmit={(personal) => {
              setForm((f) => ({ ...f, personal }));
              setStep(3);
            }}
          />
        )}

        {step === 3 && token && (
          <Documents
            smsLinkToken={token}
            initial={form.documents}
            onBack={() => setStep(2)}
            onSubmit={(documents) => {
              setForm((f) => ({ ...f, documents }));
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <AmountSelect
            approvedLimit={ctx.approved_limit}
            selected={form.amount}
            onBack={() => setStep(3)}
            onSubmit={(amount) => {
              setForm((f) => ({ ...f, amount }));
              setStep(5);
            }}
          />
        )}

        {step === 5 && form.amount && (
          <InstallmentsSelect
            amount={form.amount}
            selected={form.installments}
            onBack={() => setStep(4)}
            onSubmit={(installments) => {
              setForm((f) => ({ ...f, installments }));
              setStep(6);
            }}
          />
        )}

        {step === 6 && form.amount && form.installments && (
          <Terms
            amount={form.amount}
            installments={form.installments}
            onBack={() => setStep(5)}
            onSubmit={() => void submitOnboarding()}
            submitLabel={creating ? "Enviando..." : "Aceitar e concluir"}
            submitDisabled={creating}
            extraError={createError}
          />
        )}

        {step === TOTAL_STEPS && (transaction || existingTx) && (
          <FinalScreen
            status={finalStatus}
            amount={finalAmount}
            installments={finalInstallments}
            installmentValue={finalInstallmentValue}
            firstDueDate={finalFirstDue}
            onRefresh={() => void realtime.refresh()}
            refreshing={realtime.refreshing}
          />
        )}
      </StepShell>
    </>
  );
}

// Wrapper que dispara animacao suave (opacity + translate) cada vez que o step muda
function StepShell({ stepKey, children }: { stepKey: number; children: React.ReactNode }) {
  return (
    <div key={stepKey} className="cs-step-enter">
      {children}
    </div>
  );
}

function FinalScreen({
  status,
  amount,
  installments,
  installmentValue,
  firstDueDate,
  onRefresh,
  refreshing,
}: {
  status: TransactionStatus | null;
  amount: number;
  installments: number;
  installmentValue: number;
  firstDueDate: string | null;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  if (status === "activated") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="cs-pop flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-emerald-900">Credito ativo!</h1>
        <Card className="w-full">
          <p className="text-sm leading-relaxed text-slate-700">
            Seu credito de <strong>{formatBRL(amount)}</strong> ja esta na sua comanda.
            Aproveite o evento.
          </p>
        </Card>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-red-900">Credito cancelado</h1>
        <Card className="w-full text-sm leading-relaxed text-slate-700">
          A tomada de credito foi cancelada. Procure o promotor se foi engano.
        </Card>
      </div>
    );
  }

  // awaiting_activation
  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-10">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inline-block h-full w-full animate-ping rounded-full bg-orange-300 opacity-60" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
      </div>
      <h1 className="text-center text-2xl font-bold text-slate-900">Pedido concluido</h1>
      <Card className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-500">Resumo</span>
          <Badge tone="warning">Aguardando promotor</Badge>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Valor</dt>
            <dd className="font-semibold text-slate-900">{formatBRL(amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Parcelamento</dt>
            <dd className="font-semibold text-slate-900">
              {installments}x de {formatBRL(installmentValue)}
            </dd>
          </div>
          {firstDueDate && (
            <div className="flex justify-between">
              <dt className="text-slate-600">1a parcela</dt>
              <dd className="font-semibold text-slate-900">{formatDate(firstDueDate)}</dd>
            </div>
          )}
        </dl>
      </Card>
      <Card className="w-full border-orange-200 bg-orange-50">
        <p className="text-sm leading-relaxed text-orange-900">
          <strong>Volte ao promotor</strong> para liberar o credito na sua comanda.
          Esta tela vai atualizar sozinha quando ele confirmar.
        </p>
      </Card>
      <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? "Atualizando..." : "Atualizar agora"}
      </Button>
    </div>
  );
}
