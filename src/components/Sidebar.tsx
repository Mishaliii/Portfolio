import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  FileText,
  BarChart2,
  Map,
  Mic,
  MessageCircle,
  CheckSquare,
  User,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { removeToken, getUser } from "../utils/auth";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Find Jobs", icon: Search, badge: "3" },
  { to: "/resume", label: "Resume Center", icon: FileText },
  { to: "/tracker", label: "Job Tracker", icon: CheckSquare, badge: "13" },
];

const intelligenceNav: NavItem[] = [
  { to: "/ats", label: "ATS Diagnostic", icon: BarChart2 },
  { to: "/roadmap", label: "Career Roadmap", icon: Map, badge: "W3" },
  { to: "/interview", label: "Interview Coach", icon: Mic },
  { to: "/copilot", label: "Career Co-pilot", icon: MessageCircle },
];

const accountNav: NavItem[] = [
  { to: "/profile", label: "Candidate Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const authUser = getUser();
  const candidateName =
    authUser?.name || (authUser?.email ? authUser.email.split("@")[0] : "Candidate");
  const targetRole = authUser?.targetRole || "Career Workspace";
  const initials =
    candidateName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CL";

  const isActive = (to: string) =>
    to === "/dashboard" ? pathname === to : pathname.startsWith(to);

  const logout = () => {
    removeToken();
    onMobileClose?.();
    navigate({ to: "/login", replace: true });
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto bg-surface px-4 py-5 font-sans">
      <div className="space-y-6">
        {/* Editorial Brand Masthead */}
        <div className="flex items-center justify-between border-b border-line pb-4 px-2">
          <Link
            to="/dashboard"
            onClick={onMobileClose}
            className="group flex flex-col focus:outline-none"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-editorial text-xl font-semibold tracking-tight text-text">
                CareerLens
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-dim">
              Career Intelligence
            </span>
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="rounded p-1 text-text-muted hover:bg-surface-2 hover:text-text lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
            Core Workspace
          </div>
          <nav className="space-y-0.5">
            {primaryNav.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onMobileClose}
                  className={`group relative flex items-center justify-between rounded px-2.5 py-2 text-xs transition-colors duration-150 ${
                    active
                      ? "bg-surface-2 font-medium text-text shadow-[inset_2px_0_0_0_var(--color-accent)]"
                      : "text-text-muted hover:bg-surface-2/60 hover:text-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-accent"
                          : "text-text-dim group-hover:text-text"
                      }`}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                        active
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-text-dim group-hover:text-text"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation: Intelligence & Preparation */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-dim">
            Intelligence & Prep
          </div>
          <nav className="space-y-0.5">
            {intelligenceNav.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onMobileClose}
                  className={`group relative flex items-center justify-between rounded px-2.5 py-2 text-xs transition-colors duration-150 ${
                    active
                      ? "bg-surface-2 font-medium text-text shadow-[inset_2px_0_0_0_var(--color-accent)]"
                      : "text-text-muted hover:bg-surface-2/60 hover:text-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-accent"
                          : "text-text-dim group-hover:text-text"
                      }`}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                        active
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-text-dim group-hover:text-text"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Account & Session Section */}
      <div className="border-t border-line pt-4 space-y-3">
        {/* Candidate Context Pill */}
        <div className="rounded border border-line bg-surface-2/70 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface font-editorial text-xs font-semibold text-text border border-line">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-text">
                {candidateName}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <span className="truncate">{targetRole}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-0.5">
          {accountNav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onMobileClose}
                className={`group flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs transition-colors duration-150 ${
                  active
                    ? "bg-surface-2 font-medium text-text"
                    : "text-text-muted hover:bg-surface-2/60 hover:text-text"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-text-dim group-hover:text-text" strokeWidth={1.75} />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="group flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-xs text-text-muted transition-colors duration-150 hover:bg-surface-2/60 hover:text-danger"
          >
            <LogOut className="h-4 w-4 shrink-0 text-text-dim group-hover:text-danger" strokeWidth={1.75} />
            <span className="tracking-tight">Sign out</span>
          </button>
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col border-r border-line">
        {navContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-text/30 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="relative flex w-72 max-w-[85vw] flex-1 flex-col border-r border-line bg-surface shadow-lg">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
