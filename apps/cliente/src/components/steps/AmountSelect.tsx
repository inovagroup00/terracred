import { Button, Card, cn } from "@credshow/ui";
import { formatBRL } from "@credshow/lib";

interface AmountSelectProps {
  approvedLimit: number;
  selected: number | null;
  onBack: () => void;
  onSubmit: (amount: number) => void;
}

function buildAmountOptions(limit: number): number[] {
  const options = new Set<number>();
  if (limit >= 200) options.add(200);
  if (limit >= 300) options.add(300);
  if (limit >= 500) options.add(500);
  // Sempre inclui o teto, exceto se ja contemplado
  options.add(Math.floor(limit / 100) * 100);
  return Array.from(options)
    .filter((v) => v > 0 && v <= limit)
    .sort((a, b) => a - b);
}

export function AmountSelect({ approvedLimit, selected, onBack, onSubmit }: AmountSelectProps) {
  const options = buildAmountOptions(approvedLimit);

  return (
    <div className="flex flex-col gap-6 px-6 pb-10 pt-2">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Quanto voce quer?</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Limite aprovado:{" "}
          <span className="font-semibold text-orange-700">{formatBRL(approvedLimit)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((amount) => {
          const isSelected = selected === amount;
          const isMax = amount === approvedLimit;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => onSubmit(amount)}
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
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {isMax ? "Limite total" : "Valor"}
                  </p>
                  <p
                    className={cn(
                      "text-3xl font-bold tracking-tight",
                      isSelected ? "text-orange-900" : "text-slate-900"
                    )}
                  >
                    {formatBRL(amount)}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
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
            </button>
          );
        })}
      </div>

      {options.length === 0 && (
        <Card className="bg-amber-50 text-amber-800">
          Nenhuma opcao disponivel para o limite aprovado.
        </Card>
      )}

      <div className="mt-2">
        <Button variant="secondary" onClick={onBack} className="w-full" size="lg">
          Voltar
        </Button>
      </div>
    </div>
  );
}
