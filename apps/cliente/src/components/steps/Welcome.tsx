import { Button, Card, Badge } from "@credshow/ui";
import { formatBRL, formatDate } from "@credshow/lib";
import type { OnboardingContext } from "@credshow/types";

interface WelcomeProps {
  context: OnboardingContext;
  onContinue: () => void;
}

export function Welcome({ context, onContinue }: WelcomeProps) {
  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-2">
      <div className="flex flex-col items-center gap-3 text-center">
        <Badge tone="info" className="px-3 py-1 text-sm">
          Pre-aprovado
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo!</h1>
        <p className="text-sm text-slate-600">CPF {context.cpf_masked}</p>
      </div>

      <Card className="flex flex-col items-center gap-2 rounded-2xl border-orange-200 bg-gradient-to-b from-orange-50 to-white py-6 text-center">
        <p className="text-xs uppercase tracking-wide text-orange-700">
          Voce foi pre-aprovado para
        </p>
        <p className="text-5xl font-bold text-orange-600">
          {formatBRL(context.approved_limit)}
        </p>
        <p className="text-sm text-orange-700">em credito para usar no evento</p>
      </Card>

      <Card className="flex flex-col gap-1.5 rounded-2xl">
        <p className="text-xs uppercase tracking-wide text-slate-500">Evento</p>
        <p className="text-lg font-semibold text-slate-900">{context.event.name}</p>
        <p className="text-sm text-slate-600">{context.event.venue}</p>
        <p className="text-sm text-slate-600">{formatDate(context.event.event_date)}</p>
      </Card>

      <Button onClick={onContinue} size="lg" className="mt-2">
        Continuar
      </Button>
    </div>
  );
}
