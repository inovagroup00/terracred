import { Button, cn } from "@credshow/ui";
import { calcDueDatesDay10, formatBRL, formatDate } from "@credshow/lib";

interface InstallmentsSelectProps {
  amount: number;
  selected: 1 | 2 | 3 | null;
  onBack: () => void;
  onSubmit: (n: 1 | 2 | 3) => void;
}

const OPTIONS: Array<1 | 2 | 3> = [1, 2, 3];

function calcInstallmentValue(amount: number, n: number): number {
  return Math.round((amount / n) * 100) / 100;
}

export function InstallmentsSelect({
  amount,
  selected,
  onBack,
  onSubmit,
}: InstallmentsSelectProps) {
  const today = new Date();

  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Como pagar?</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Valor escolhido:{" "}
          <span className="font-semibold text-orange-700">{formatBRL(amount)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((n) => {
          const value = calcInstallmentValue(amount, n);
          const isSelected = selected === n;
          const dates = calcDueDatesDay10(today, n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSubmit(n)}
              className={cn(
                "group rounded-2xl border p-5 text-left transition-all duration-200",
                "hover:scale-[1.01] hover:shadow-md active:scale-[0.99]",
                isSelected
                  ? "border-orange-600 bg-gradient-to-br from-orange-50 to-orange-100/50 ring-2 ring-orange-200"
                  : "border-slate-200 bg-white hover:border-orange-300 hover:bg-gradient-to-br hover:from-orange-50/40 hover:to-white"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      "text-xl font-bold tracking-tight",
                      isSelected ? "text-orange-900" : "text-slate-900"
                    )}
                  >
                    {n}x de {formatBRL(value)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {n === 1 ? "Pagamento unico" : `Vencimento dia 10, mensal`}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-orange-600 bg-orange-600 text-white"
                      : "border-slate-300 group-hover:border-orange-400"
                  )}
                >
                  {isSelected ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  ) : null}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dates.map((d, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      isSelected
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {idx + 1}/{n} {formatDate(d)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        <Button variant="secondary" onClick={onBack} className="w-full" size="lg">
          Voltar
        </Button>
      </div>
    </div>
  );
}
