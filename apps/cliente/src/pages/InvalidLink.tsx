import { Card } from "@credshow/ui";

export function InvalidLink() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600 shadow-sm">
        !
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Link invalido</h1>
      <Card className="w-full text-sm leading-relaxed text-slate-700">
        O link que voce acessou nao e valido. Procure o promotor no evento para gerar
        um novo.
      </Card>
    </div>
  );
}
