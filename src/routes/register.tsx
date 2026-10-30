import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { setToken, setUser } from "../utils/auth";
import { useToast } from "../components/Toast";
import { authApi } from "../api/endpoints";

type RegisterSearch = { next?: string };

export const Route = createFileRoute("/register")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): RegisterSearch => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: RegisterPage,
});

function isSafeNext(next: string | undefined): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//");
}

function RegisterPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" });
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "6+ characters";
    if (confirm !== password) errs.confirm = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const data = await authApi.register({
        name,
        email,
        password,
      });
      const token: string | undefined = data?.access_token ?? data?.token;
      if (!token) throw new Error("No token returned");
      setToken(token);
      const user = data?.user ?? {};
      setUser({
        id: user.id ?? "",
        name: user.name ?? name,
        email: user.email ?? email,
      });
      toast.success("Account created");
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
        "Sign up failed";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  const loginSearch = isSafeNext(search.next) ? { next: search.next } : {};

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-baseline justify-center gap-0.5 text-2xl">
          <span className="font-display font-semibold text-text">Career</span>
          <span className="font-display logo-gradient font-bold">Lens</span>
        </div>

        <div className="card-hairline rounded-xl border border-line bg-surface p-6">
          <h1 className="font-display text-xl font-semibold text-text">Create your account</h1>
          <p className="mt-1 text-sm text-text-muted">
            Start matching to jobs in under a minute.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <Field
              label="Full name"
              error={errors.name}
              input={
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  autoComplete="name"
                />
              }
            />
            <Field
              label="Email"
              error={errors.email}
              input={
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
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
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  autoComplete="new-password"
                />
              }
            />
            <Field
              label="Confirm password"
              error={errors.confirm}
              input={
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  autoComplete="new-password"
                />
              }
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hi disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Already have an account?{" "}
            <Link to="/login" search={loginSearch} className="font-medium text-accent hover:text-accent-hi">
              Sign in
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
