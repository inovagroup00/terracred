import { useState } from "react";
import { Button, Card } from "@credshow/ui";
import { formatBRL } from "@credshow/lib";

interface TermsProps {
  amount: number;
  installments: 1 | 2 | 3;
  onBack: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  extraError?: string | null;
}

export function Terms({
  amount,
  installments,
  onBack,
  onSubmit,
  submitLabel = "Aceitar e concluir",
  submitDisabled = false,
  extraError = null,
}: TermsProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Termos e confirmacao</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Leia com atencao antes de prosseguir.
        </p>
      </div>

      <Card className="flex flex-col gap-3 text-sm leading-relaxed text-slate-700">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <InfoIcon />
          </div>
          <p className="font-semibold text-slate-900">Resumo da contratacao</p>
        </div>
        <p>
          Ao confirmar, autorizo a contratacao do credito de{" "}
          <span className="font-semibold">{formatBRL(amount)}</span> em{" "}
          <span className="font-semibold">{installments}x</span>, mediante envio do meu
          documento e selfie.
        </p>
        <p>Cobranca via boleto bancario.</p>
        <p>O credito sera liberado pelo promotor apos sua confirmacao aqui.</p>
      </Card>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
        />
        <span className="text-sm text-slate-700">Li e aceito os termos acima.</span>
      </label>

      {extraError && (
        <Card className="border-red-200 bg-red-50 text-sm text-red-800">{extraError}</Card>
      )}

      <div className="mt-2 flex gap-3">
        <Button
          variant="secondary"
          onClick={onBack}
          className="flex-1"
          size="lg"
          disabled={submitDisabled}
        >
          Voltar
        </Button>
        <Button
          className="flex-[2]"
          size="lg"
          disabled={!accepted || submitDisabled}
          loading={submitDisabled}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.01" />
      <path d="M11 12h1v4h1" />
    </svg>
  );
}
