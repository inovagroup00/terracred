import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "violet" | "emerald" | "amber";
}

const TONE_BG: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "from-white to-slate-50",
  violet: "from-orange-50 to-white",
  emerald: "from-emerald-50 to-white",
  amber: "from-amber-50 to-white",
};

const TONE_ACCENT: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "text-slate-400",
  violet: "text-orange-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
};

export function KpiCard({ label, value, hint, tone = "neutral" }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br ${TONE_BG[tone]} p-5 shadow-sm transition-shadow hover:shadow-md`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${TONE_ACCENT[tone]}`}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
