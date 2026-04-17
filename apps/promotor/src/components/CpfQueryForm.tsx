import { useState, useMemo } from "react";
import { Button, Input, Card } from "@credshow/ui";
import { cleanCpf, isValidCpf, maskCpf, fnBureauMock } from "@credshow/lib";
import type { BureauQueryResponse } from "@credshow/types";

interface CpfQueryFormProps {
  promoterToken: string;
  disabled?: boolean;
  onResult: (cpfMasked: string, response: BureauQueryResponse) => void;
}

export function CpfQueryForm({ promoterToken, disabled, onResult }: CpfQueryFormProps) {
  const [cpfInput, setCpfInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cleaned = useMemo(() => cleanCpf(cpfInput), [cpfInput]);
  const valid = isValidCpf(cleaned);
  const showFormatError = cleaned.length === 11 && !valid;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setCpfInput(onlyDigits.length === 11 ? maskCpf(onlyDigits) : formatPartial(onlyDigits));
    if (submitError) setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const resp = await fnBureauMock(promoterToken, cleaned);
      onResult(maskCpf(cleaned), resp);
      setCpfInput("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao consultar CPF";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="CPF do cliente"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={cpfInput}
          onChange={handleChange}
          className="h-12 text-lg"
          disabled={disabled || loading}
          error={showFormatError ? "CPF invalido" : undefined}
        />
        {submitError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={disabled || !valid}
          loading={loading}
        >
          Consultar
        </Button>
      </form>
    </Card>
  );
}

function formatPartial(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
