import { Card } from "@credshow/ui";

interface InvalidTokenProps {
  message?: string;
}

export function InvalidToken({ message }: InvalidTokenProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-6">
      <Card className="border-red-200 bg-red-50">
        <h1 className="mb-2 text-xl font-bold text-red-900">Token invalido ou evento encerrado</h1>
        <p className="text-sm text-red-800">
          {message ?? "O token informado nao esta ativo ou o evento ja foi encerrado. Solicite ao admin uma nova URL."}
        </p>
      </Card>
    </div>
  );
}
