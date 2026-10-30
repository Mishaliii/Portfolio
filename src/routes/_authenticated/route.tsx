import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import { isLoggedIn, getUser } from "../../utils/auth";
import { TrackerStoreProvider } from "../../state/tracker-store";
import { Menu } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const authUser = getUser();
  const candidateName =
    authUser?.name || (authUser?.email ? authUser.email.split("@")[0] : "Candidate");
  const initials =
    candidateName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CL";

  // Automatically dismiss mobile drawer on route transition
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate({ to: "/login", replace: true });
    } else {
      setReady(true);
    }
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xs font-mono uppercase tracking-widest text-text-muted">
          Initializing Intelligence Workspace…
        </div>
      </div>
    );
  }

  return (
    <TrackerStoreProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:pl-64">
          {/* Mobile masthead: visible only below lg breakpoint */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-xs lg:hidden z-20">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-1.5 rounded border border-line bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-surface-2 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4 text-text-muted" />
              <span>Menu</span>
            </button>

            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-base font-semibold tracking-tight text-text">
                CareerLens
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded bg-surface-2 border border-line text-[11px] font-editorial font-semibold text-text">
              {initials}
            </div>
          </header>

          {/* Main workspace canvas */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </TrackerStoreProvider>
  );
}
