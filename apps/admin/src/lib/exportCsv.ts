// Gera CSV de transacoes ativadas, uma linha por parcela, pronto pra importar no Asaas.
// Vencimentos calculados pela regra TerraCred: sempre dia 10, 1a parcela = mes seguinte.

import { calcDueDatesDay10, formatBRL, maskCpf } from "@credshow/lib";
import type { TransactionRow } from "../hooks/useRealtimeTransactions";

const CSV_HEADERS = [
  "transaction_id",
  "cliente",
  "cpf",
  "email",
  "telefone",
  "parcela_num",
  "total_parcelas",
  "valor_parcela",
  "vencimento",
  "valor_total",
  "status_transacao",
  "evento_id",
  "criado_em",
  "ativado_em",
];

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function transactionsToInstallmentsCsv(
  rows: TransactionRow[],
  opts: { onlyActivated?: boolean } = {}
): string {
  const onlyActivated = opts.onlyActivated ?? true;
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const tx of rows) {
    if (onlyActivated && tx.status !== "activated") continue;
    if (!tx.installments || !tx.installment_value || !tx.chosen_amount) continue;

    const baseDate = tx.activated_at ? new Date(tx.activated_at) : new Date(tx.created_at);
    const dates = calcDueDatesDay10(baseDate, tx.installments);

    for (let i = 0; i < tx.installments; i++) {
      const cells = [
        tx.id,
        tx.full_name ?? "",
        maskCpf(tx.cpf),
        tx.email ?? "",
        tx.phone ?? "",
        String(i + 1),
        String(tx.installments),
        Number(tx.installment_value).toFixed(2).replace(".", ","),
        isoDate(dates[i]),
        Number(tx.chosen_amount).toFixed(2).replace(".", ","),
        tx.status,
        tx.event_id,
        tx.created_at,
        tx.activated_at ?? "",
      ];
      lines.push(cells.map(csvEscape).join(","));
    }
  }

  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM UTF-8 pra Excel reconhecer acentos
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildExportFilename(eventName: string | null | undefined): string {
  const safe = (eventName ?? "evento")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  return `terracred-cobrancas-${safe}-${stamp}.csv`;
}

// re-exporta pra UI mostrar resumo sem reimplementar
export function summarizeForExport(rows: TransactionRow[]): {
  activatedCount: number;
  totalRows: number;
  totalAmount: number;
} {
  let activatedCount = 0;
  let totalRows = 0;
  let totalAmount = 0;
  for (const tx of rows) {
    if (tx.status !== "activated") continue;
    if (!tx.installments || !tx.installment_value || !tx.chosen_amount) continue;
    activatedCount++;
    totalRows += tx.installments;
    totalAmount += Number(tx.chosen_amount);
  }
  return { activatedCount, totalRows, totalAmount };
}

// Helper de label pra mostrar no UI
export function describeExport(rows: TransactionRow[]): string {
  const s = summarizeForExport(rows);
  return `${s.activatedCount} pedido(s), ${s.totalRows} parcela(s), ${formatBRL(s.totalAmount)}`;
}
