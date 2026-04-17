import { Card } from "@credshow/ui";

export function InvalidUrl() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-6">
      <Card className="border-amber-200 bg-amber-50">
        <h1 className="mb-2 text-xl font-bold text-amber-900">URL invalida</h1>
        <p className="text-sm text-amber-800">
          Esta URL nao contem o parametro do evento. Peca ao admin a URL completa do evento.
        </p>
        <p className="mt-3 text-xs text-amber-700">
          Formato esperado: <code className="rounded bg-white px-1 py-0.5">/?t=SEU_TOKEN</code>
        </p>
      </Card>
    </div>
  );
}
