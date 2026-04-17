import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@credshow/ui";
import { useAuth } from "../hooks/useAuth";

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
  const { loading, user, profile, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-orange-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Acesso negado</h1>
        <p className="max-w-md text-sm text-slate-600">
          {error ??
            "Esta conta nao possui perfil de administrador. Saia e entre com uma conta admin."}
        </p>
        <a
          href="/login"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Voltar para login
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
