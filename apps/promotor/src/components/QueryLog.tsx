import { Card, Badge } from "@credshow/ui";
import { formatBRL, formatDateTime } from "@credshow/lib";
import type { LogEntry } from "../hooks/useSessionLog";

interface QueryLogProps {
  entries: LogEntry[];
}

export function QueryLog({ entries }: QueryLogProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-dashed bg-white/60">
        <p className="text-center text-sm text-slate-500">
          Nenhuma consulta nesta sessao ainda.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Historico da sessao ({entries.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.id}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-base font-semibold text-slate-900">{e.cpf}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(e.timestamp)}</p>
                </div>
                {e.approved ? (
                  <Badge tone="success">Aprovado</Badge>
                ) : (
                  <Badge tone="danger">Reprovado</Badge>
                )}
              </div>

              {e.approved && (
                <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3">
                  <p className="text-sm">
                    <span className="text-slate-500">Limite: </span>
                    <span className="font-semibold text-emerald-700">{formatBRL(e.limit)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-500">SMS: </span>
                    {e.sms_sent ? (
                      <span className="font-medium text-emerald-700">
                        enviado{e.phone ? ` para ${e.phone}` : ""}
                      </span>
                    ) : (
                      <span className="font-medium text-amber-700">pendente</span>
                    )}
                  </p>
                  {e.client_link && (
                    <p className="break-all text-xs text-slate-500">
                      <a
                        className="text-orange-700 underline"
                        href={e.client_link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {e.client_link}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {!e.approved && e.reason && (
                <p className="mt-2 text-sm text-red-700">{e.reason}</p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
