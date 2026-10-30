import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  FileText,
  Map,
  CheckSquare,
  BarChart2,
  Mic,
  MessageCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Bell,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { removeToken } from "../utils/auth";
import { smartNotifications } from "../data/candidate-profile";

type Item = { to: string; label: string; icon: LucideIcon };

const primary: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Find Jobs", icon: Search },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/tracker", label: "Tracker", icon: CheckSquare },
];

const more: Item[] = [
  { to: "/ats", label: "ATS Checker", icon: BarChart2 },
  { to: "/interview", label: "Interview Coach", icon: Mic },
  { to: "/copilot", label: "Co-pilot", icon: MessageCircle },
];

function useIsActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/dashboard" ? pathname === to : pathname.startsWith(to));
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors ${
        active
          ? "bg-accent/10 font-semibold text-accent-hi"
          : "text-text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, close]);
  return ref;
}

export function TopNav() {
  const navigate = useNavigate();
  const isActive = useIsActive();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const menuRef = useOutside<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const moreRef = useOutside<HTMLDivElement>(moreOpen, () => setMoreOpen(false));
  const notifRef = useOutside<HTMLDivElement>(notifOpen, () =>
    setNotifOpen(false),
  );

  const logout = () => {
    removeToken();
    navigate({ to: "/login", replace: true });
  };

  const moreActive = more.some((m) => isActive(m.to));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-6 px-6">
        <Link to="/dashboard" className="flex items-baseline gap-0.5 text-lg">
          <span className="font-display font-medium text-text">Career</span>
          <span className="font-display logo-gradient font-semibold">Lens</span>
        </Link>

        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {primary.map((it) => (
            <NavLink key={it.to} item={it} active={isActive(it.to)} />
          ))}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
                moreActive
                  ? "bg-accent/10 font-semibold text-accent-hi"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Sparkles className="h-4 w-4 text-gold-hi" />
              <span>AI Features</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute left-1/2 top-12 w-56 -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5">
                {more.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm ${
                        isActive(it.to)
                          ? "bg-accent/10 font-medium text-accent-hi"
                          : "text-text hover:bg-surface-2"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-text-muted" />
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md border border-line bg-surface p-1.5 text-text-muted hover:text-text lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              className="relative rounded-full border border-line bg-surface p-2 text-text-muted transition-colors hover:text-text"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5">
                <div className="border-b border-line px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Smart notifications
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {smartNotifications.map((n) => {
                    const positive = n.tone === "positive";
                    const Icon = positive ? CheckCircle2 : AlertTriangle;
                    return (
                      <li
                        key={n.id}
                        className="flex items-start gap-2.5 border-b border-line/60 px-3.5 py-2.5 last:border-0"
                      >
                        <Icon
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                            positive ? "text-success" : "text-warning"
                          }`}
                        />
                        <span className="text-xs leading-snug text-text">
                          {n.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>


          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-sm text-text hover:bg-surface-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                AS
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-text hover:bg-surface-2"
                >
                  <User className="h-4 w-4 text-text-muted" /> Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-text hover:bg-surface-2"
                >
                  <Settings className="h-4 w-4 text-text-muted" /> Settings
                </Link>
                <div className="border-t border-line" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-text hover:bg-surface-2"
                >
                  <LogOut className="h-4 w-4 text-text-muted" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-surface px-4 py-3 lg:hidden">
          <div className="flex flex-wrap gap-1.5">
            {[...primary, ...more].map((it) => (
              <NavLink key={it.to} item={it} active={isActive(it.to)} />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
