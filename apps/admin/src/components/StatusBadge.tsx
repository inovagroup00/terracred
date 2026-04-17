import { Badge } from "@credshow/ui";
import type { TransactionStatus, EventStatus } from "@credshow/types";

const TX_TONE: Record<
  TransactionStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  pending_onboarding: "warning",
  awaiting_activation: "info",
  activated: "success",
  cancelled: "danger",
  expired: "neutral",
};

const TX_LABEL: Record<TransactionStatus, string> = {
  pending_onboarding: "Aguardando cadastro",
  awaiting_activation: "Aguardando ativacao",
  activated: "Ativada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const EVENT_TONE: Record<
  EventStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  draft: "neutral",
  active: "success",
  closed: "warning",
};

const EVENT_LABEL: Record<EventStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  closed: "Encerrado",
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge tone={TX_TONE[status]}>{TX_LABEL[status]}</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge tone={EVENT_TONE[status]}>{EVENT_LABEL[status]}</Badge>;
}
