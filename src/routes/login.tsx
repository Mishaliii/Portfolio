import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { setToken, setUser } from "../utils/auth";
import { useToast } from "../components/Toast";
import { authApi } from "../api/endpoints";

type LoginSearch = { next?: string };

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: LoginPage,
});

function isSafeNext(next: string | undefined): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//");
}

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "Password must be 6+ characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      const token: string | undefined = data?.access_token ?? data?.token;
      if (!token) throw new Error("No token returned");
      setToken(token);
      const user = data?.user ?? {};
      const displayName: string = user.name ?? email.split("@")[0];
      setUser({
        id: user.id ?? "",
        name: displayName,
        email: user.email ?? email,
      });
      toast.success(`Welcome back, ${displayName.split(" ")[0]}`);
      if (isSafeNext(search.next)) {
        window.location.href = search.next;
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      const msg =
        (err as { data?: { detail?: string; message?: string } })?.data?.detail ||
        (err as { data?: { detail?: string; message?: string } })?.data?.message ||
        (err as Error).message ||
        "Login failed";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  const registerSearch = isSafeNext(search.next) ? { next: search.next } : {};

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-baseline justify-center gap-0.5 text-2xl">
          <span className="font-display font-semibold text-text">Career</span>
          <span className="font-display logo-gradient font-bold">Lens</span>
        </div>

        <div className="card-hairline rounded-xl border border-line bg-surface p-6">
          <h1 className="font-display text-xl font-semibold text-text">Sign in</h1>
          <p className="mt-1 text-sm text-text-muted">
            Continue to your career command center.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Field
              label="Email"
              error={errors.email}
              input={
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              }
            />
            <Field
              label="Password"
              error={errors.password}
              input={
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              }
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hi disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Don't have an account?{" "}
            <Link
              to="/register"
              search={registerSearch}
              className="font-medium text-accent hover:text-accent-hi"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">{label}</span>
      {input}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
