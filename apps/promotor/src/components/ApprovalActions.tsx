import { useState, useMemo } from "react";
import { Button, Input, Card, Badge } from "@credshow/ui";
import { cleanPhone, isValidPhone, maskPhone, formatBRL, fnSendSms } from "@credshow/lib";
import { CLIENT_BASE_URL } from "../lib/env";

export interface ApprovalData {
  bureau_query_id: string;
  cpfMasked: string;
  approvedLimit: number;
}

export interface SmsSentResult {
  phoneMasked: string;
  clientLink: string;
}

interface ApprovalActionsProps {
  data: ApprovalData;
  onSent: (result: SmsSentResult) => void;
  onDismiss: () => void;
}

export function ApprovalActions({ data, onSent, onDismiss }: ApprovalActionsProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<SmsSentResult | null>(null);

  const cleaned = useMemo(() => cleanPhone(phoneInput), [phoneInput]);
  const valid = isValidPhone(cleaned);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhoneInput(formatPartialPhone(digits));
    if (error) setError(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    setError(null);
    try {
      const resp = await fnSendSms(data.bureau_query_id, cleaned, CLIENT_BASE_URL || undefined);
      const result: SmsSentResult = {
        phoneMasked: maskPhone(cleaned),
        clientLink: resp.client_link,
      };
      setSentResult(result);
      onSent(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar SMS";
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  if (sentResult) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <div className="mb-3 flex items-center justify-between">
          <Badge tone="success">SMS enviado</Badge>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-emerald-700 underline"
          >
            Nova consulta
          </button>
        </div>
        <p className="text-sm text-emerald-900">
          SMS enviado para <strong>{sentResult.phoneMasked}</strong>
        </p>
        <p className="mt-2 break-all rounded-md bg-white px-3 py-2 text-xs text-slate-700">
          Link: <a className="text-orange-700 underline" href={sentResult.clientLink} target="_blank" rel="noreferrer">{sentResult.clientLink}</a>
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="success">Aprovado</Badge>
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-slate-600 underline"
        >
          Cancelar
        </button>
      </div>
      <p className="text-sm text-emerald-900">CPF {data.cpfMasked}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">Limite aprovado</p>
      <p className="text-3xl font-bold text-emerald-900">{formatBRL(data.approvedLimit)}</p>

      <form onSubmit={handleSend} className="mt-5 flex flex-col gap-3">
        <Input
          label="Celular do cliente"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={phoneInput}
          onChange={handlePhoneChange}
          className="h-12 text-lg"
          disabled={sending}
          hint={!valid && cleaned.length > 0 ? "Pelo menos 10 digitos" : undefined}
        />
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!valid}
          loading={sending}
        >
          Enviar SMS
        </Button>
      </form>
    </Card>
  );
}

function formatPartialPhone(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
