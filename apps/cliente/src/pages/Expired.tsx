import { Card } from "@credshow/ui";

export function Expired() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600 shadow-sm">
        ⏱
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Link expirado</h1>
      <Card className="w-full text-sm leading-relaxed text-slate-700">
        Este link nao esta mais valido. Peca uma nova consulta ao promotor no evento
        para receber um novo SMS.
      </Card>
    </div>
  );
}
