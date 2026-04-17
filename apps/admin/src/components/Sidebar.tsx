import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-5 w-5 shrink-0",
};

const ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 12l2-2 7-7 7 7 2 2" />
        <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
      </svg>
    ),
  },
  {
    to: "/eventos",
    label: "Eventos",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    ),
  },
  {
    to: "/operadores",
    label: "Operadores",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white font-bold shadow-sm shadow-orange-200">
            C
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              TerraCred
            </p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Admin
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-orange-600" />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-[11px] text-slate-400">v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
