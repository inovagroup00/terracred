import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Input } from "@credshow/ui";
import { getSupabase } from "@credshow/lib";

interface LocationState {
  from?: { pathname: string };
}

// Converte usuario tipo "terra" em "terra@terra.com" pra autenticar no Supabase.
// Mantem retrocompatibilidade caso digite o email completo.
function toLoginEmail(input: string): string {
  const v = input.trim();
  if (v.includes("@")) return v.toLowerCase();
  return `${v.toLowerCase()}@terra.com`;
}

export function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as LocationState | null)?.from?.pathname ?? "/";

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const sb = getSupabase();
      const { data } = await sb.auth.getUser();
      if (cancelled || !data.user) return;
      const { data: profile } = await sb
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!cancelled && profile?.role === "admin") {
        nav(from, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav, from]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user.trim()) {
      setError("Informe o usuario.");
      return;
    }
    if (!password) {
      setError("Informe a senha.");
      return;
    }

    setLoading(true);
    try {
      const email = toLoginEmail(user);
      const sb = getSupabase();
      const { data, error: authErr } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      if (authErr || !data.user) {
        setError(authErr?.message ?? "Falha ao autenticar.");
        return;
      }

      const { data: profile, error: profErr } = await sb
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profErr) {
        setError(profErr.message);
        await sb.auth.signOut();
        return;
      }
      if (!profile || profile.role !== "admin") {
        setError("Esta conta nao tem permissao de administrador.");
        await sb.auth.signOut();
        return;
      }

      nav(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-lg font-bold text-white">
            T
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">TerraCred Admin</h1>
            <p className="text-sm text-slate-500">Entre com sua conta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuario"
            type="text"
            autoComplete="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="terra"
            required
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
