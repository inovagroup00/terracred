import { Button } from "@credshow/ui";
import { useAuth } from "../hooks/useAuth";

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  onMenuClick: () => void;
  title?: string;
  crumbs?: Crumb[];
}

export function Header({ onMenuClick, title, crumbs }: Props) {
  const { profile, signOut } = useAuth();
  const initials = (profile?.full_name ?? "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Abrir menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex flex-col leading-tight">
          {crumbs && crumbs.length > 0 && (
            <nav className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  {c.to ? (
                    <a href={c.to} className="hover:text-orange-600">
                      {c.label}
                    </a>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && <span>/</span>}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-base font-semibold text-slate-900">
            {title ?? "Painel administrativo"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-sm leading-tight sm:block">
          <p className="font-medium text-slate-900">
            {profile?.full_name ?? "Admin"}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Administrador
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-700">
          {initials || "A"}
        </div>
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          Sair
        </Button>
      </div>
    </header>
  );
}
