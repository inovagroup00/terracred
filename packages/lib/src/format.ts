export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("pt-BR");
}

export function formatRelativeTime(
  d: string | Date | null | undefined,
  now: Date = new Date()
): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 30) return "agora";
  if (diffSec < 60) return `ha ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `ha ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `ha ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `ha ${diffD}d`;
  return date.toLocaleDateString("pt-BR");
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function calcInstallmentDates(firstDue: Date, n: number): Date[] {
  return Array.from({ length: n }, (_, i) => addMonths(firstDue, i));
}

/**
 * Calcula vencimentos das parcelas no padrao TerraCred:
 * sempre dia 10. Primeira parcela = dia 10 do proximo mes (ou do mes seguinte
 * se ja passou do dia 10 quando o pedido foi feito + 7 dias de cortesia).
 */
export function calcDueDatesDay10(today: Date, installments: number): Date[] {
  const base = new Date(today);
  const day = base.getDate();
  let firstMonthOffset = 1;
  // Se o pedido for feito ate dia 3, primeira cobranca pode ser ja o dia 10
  // do mes corrente (margem de 7 dias). Se pedido entre 4 e 10, vai pro mes seguinte.
  // Se pedido depois do dia 10, vai pro proximo mes (dia 10).
  if (day <= 3) firstMonthOffset = 0;
  const first = new Date(base.getFullYear(), base.getMonth() + firstMonthOffset, 10);
  return Array.from({ length: installments }, (_, i) => {
    const d = new Date(first);
    d.setMonth(d.getMonth() + i);
    return d;
  });
}

export async function fetchCepData(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
} | null> {
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    if (!r.ok) return null;
    const data = await r.json();
    if (data.erro) return null;
    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
