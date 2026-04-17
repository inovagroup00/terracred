import { cn } from "@credshow/ui";

export type TabKey = "consulta" | "aguardando" | "concluidos";

interface TabsProps {
  active: TabKey;
  onChange: (next: TabKey) => void;
  pendingCount?: number;
}

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: "consulta", label: "Consulta" },
  { key: "aguardando", label: "Aguardando" },
  { key: "concluidos", label: "Concluidos" },
];

export function Tabs({ active, onChange, pendingCount = 0 }: TabsProps) {
  const activeIndex = TABS.findIndex((t) => t.key === active);
  const tabCount = TABS.length;
  // Sliding indicator: width is 1/N of the container, translate by activeIndex * 100% of its own width
  const indicatorWidthPct = 100 / tabCount;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="relative mx-auto max-w-md">
        <div className="flex">
          {TABS.map((t) => {
            const isActive = t.key === active;
            const showBadge = t.key === "aguardando" && pendingCount > 0;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange(t.key)}
                className={cn(
                  "relative flex-1 px-2 py-3.5 text-sm font-semibold transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500",
                  isActive
                    ? "text-orange-700"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {t.label}
                  {showBadge && (
                    <span
                      className={cn(
                        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-tight shadow-sm",
                        isActive
                          ? "bg-orange-600 text-white"
                          : "animate-pulse bg-amber-500 text-white"
                      )}
                    >
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {/* Animated sliding indicator */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-orange-600 transition-transform duration-300 ease-out"
          style={{
            width: `${indicatorWidthPct}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      </div>
    </nav>
  );
}
