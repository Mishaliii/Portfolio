import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  Github,
  Globe,
  Plus,
  X,
  Save,
  Check,
  Pencil,
} from "lucide-react";
import { TopBar } from "../../components/TopBar";
import { Skeleton } from "../../components/Skeleton";
import { ErrorState } from "../../components/ErrorState";
import { useApi } from "../../hooks/useApi";
import { apiClient } from "../../api/client";
import { useToast } from "../../components/Toast";
import { initials } from "../../utils/format";
import type { UserProfile } from "../../data/fixtures";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data, loading, error, refetch } = useApi<UserProfile>("/profile");
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await apiClient.put("/profile", form);
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <>
      <TopBar
        title="Profile"
        subtitle="Used to auto-fill applications and tailor recommendations"
        right={
          editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm(data ?? null);
                  setEditing(false);
                }}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hi disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface-2"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )
        }
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-6">
          {loading && <Skeleton className="h-96 w-full" />}
          {error && (
            <ErrorState message="Could not load profile." onRetry={refetch} />
          )}

          {form && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Header card */}
              <div className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-white">
                    {initials(form.name)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {editing ? (
                      <>
                        <input
                          value={form.name}
                          onChange={(e) => update("name", e.target.value)}
                          className="w-full rounded-lg border border-line bg-background px-2.5 py-1 font-display text-lg font-semibold text-text focus:border-accent focus:outline-none"
                        />
                        <input
                          value={form.headline}
                          onChange={(e) => update("headline", e.target.value)}
                          className="w-full rounded-lg border border-line bg-background px-2.5 py-1 text-sm text-text focus:border-accent focus:outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="font-display text-xl font-semibold text-text">
                          {form.name}
                        </h2>
                        <p className="text-sm text-text-muted">{form.headline}</p>
                      </>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-text-muted">
                      <IconField
                        icon={Mail}
                        value={form.email}
                        editing={editing}
                        onChange={(v) => update("email", v)}
                      />
                      <IconField
                        icon={Phone}
                        value={form.phone}
                        editing={editing}
                        onChange={(v) => update("phone", v)}
                      />
                      <IconField
                        icon={MapPin}
                        value={form.location}
                        editing={editing}
                        onChange={(v) => update("location", v)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-line pt-4">
                  <div className="mb-1.5 text-xs font-medium text-text-muted">About</div>
                  {editing ? (
                    <textarea
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-line bg-background px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-text">{form.bio}</p>
                  )}
                </div>
              </div>

              {/* Two-column details */}
              <div className="grid gap-5 md:grid-cols-2">
                <Card title="Career">
                  <Row label="Current role">
                    {editing ? (
                      <input
                        value={form.currentRole}
                        onChange={(e) => update("currentRole", e.target.value)}
                        className="w-full rounded-lg border border-line bg-background px-2.5 py-1 text-sm text-text focus:border-accent focus:outline-none"
                      />
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-sm text-text">
                        <Briefcase className="h-3.5 w-3.5 text-text-muted" />
                        {form.currentRole}
                      </div>
                    )}
                  </Row>
                  <Row label="Years of experience">
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        value={form.yearsOfExperience}
                        onChange={(e) => update("yearsOfExperience", Number(e.target.value))}
                        className="w-24 rounded-lg border border-line bg-background px-2.5 py-1 text-sm text-text focus:border-accent focus:outline-none"
                      />
                    ) : (
                      <div className="text-sm text-text">{form.yearsOfExperience} years</div>
                    )}
                  </Row>
                  <Row label="Target roles">
                    <ChipEditor
                      values={form.targetRoles}
                      onChange={(v) => update("targetRoles", v)}
                      editing={editing}
                      placeholder="Add a role"
                    />
                  </Row>
                </Card>

                <Card title="Preferences">
                  <Row label="Desired salary">
                    {editing ? (
                      <input
                        value={form.desiredSalary}
                        onChange={(e) => update("desiredSalary", e.target.value)}
                        className="w-full rounded-lg border border-line bg-background px-2.5 py-1 text-sm text-text focus:border-accent focus:outline-none"
                      />
                    ) : (
                      <div className="text-sm text-text">{form.desiredSalary}</div>
                    )}
                  </Row>
                  <Row label="Work authorization">
                    {editing ? (
                      <input
                        value={form.workAuthorization}
                        onChange={(e) => update("workAuthorization", e.target.value)}
                        className="w-full rounded-lg border border-line bg-background px-2.5 py-1 text-sm text-text focus:border-accent focus:outline-none"
                      />
                    ) : (
                      <div className="text-sm text-text">{form.workAuthorization}</div>
                    )}
                  </Row>
                  <Row label="Flexibility">
                    <div className="flex flex-wrap gap-2">
                      <Toggle
                        label="Open to remote"
                        checked={form.openToRemote}
                        editing={editing}
                        onChange={(v) => update("openToRemote", v)}
                      />
                      <Toggle
                        label="Open to relocation"
                        checked={form.openToRelocation}
                        editing={editing}
                        onChange={(v) => update("openToRelocation", v)}
                      />
                    </div>
                  </Row>
                </Card>
              </div>

              <Card title="Skills">
                <ChipEditor
                  values={form.skills}
                  onChange={(v) => update("skills", v)}
                  editing={editing}
                  placeholder="Add a skill"
                />
              </Card>

              <Card title="Links">
                <div className="space-y-2">
                  <LinkRow
                    icon={Linkedin}
                    label="LinkedIn"
                    value={form.links.linkedin}
                    editing={editing}
                    onChange={(v) =>
                      update("links", { ...form.links, linkedin: v })
                    }
                  />
                  <LinkRow
                    icon={Github}
                    label="GitHub"
                    value={form.links.github}
                    editing={editing}
                    onChange={(v) =>
                      update("links", { ...form.links, github: v })
                    }
                  />
                  <LinkRow
                    icon={Globe}
                    label="Portfolio"
                    value={form.links.portfolio}
                    editing={editing}
                    onChange={(v) =>
                      update("links", { ...form.links, portfolio: v })
                    }
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-text-muted">{label}</div>
      {children}
    </div>
  );
}

function IconField({
  icon: Icon,
  value,
  editing,
  onChange,
}: {
  icon: typeof Mail;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  if (editing) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-48 rounded border border-line bg-background px-1.5 py-0.5 text-xs text-text focus:border-accent focus:outline-none"
        />
      </div>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" /> {value}
    </span>
  );
}

function Toggle({
  label,
  checked,
  editing,
  onChange,
}: {
  label: string;
  checked: boolean;
  editing: boolean;
  onChange: (v: boolean) => void;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition";
  if (!editing) {
    return (
      <span
        className={`${base} ${
          checked
            ? "bg-success/10 text-success"
            : "border border-line bg-surface-2 text-text-muted"
        }`}
      >
        {checked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {label}
      </span>
    );
  }
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`${base} ${
        checked
          ? "bg-accent text-white"
          : "border border-line bg-surface text-text hover:bg-surface-2"
      }`}
    >
      {checked ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      {label}
    </button>
  );
}

function ChipEditor({
  values,
  onChange,
  editing,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  editing: boolean;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (!t) return;
    if (!values.includes(t)) onChange([...values, t]);
    setInput("");
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-text"
        >
          {v}
          {editing && (
            <button
              onClick={() => remove(v)}
              className="rounded-full p-0.5 text-text-muted hover:bg-line hover:text-danger"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}
      {editing && (
        <div className="inline-flex items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className="w-32 rounded-full border border-line bg-background px-2.5 py-0.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={add}
            className="rounded-full bg-accent p-1 text-white hover:bg-accent-hi"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
      {values.length === 0 && !editing && (
        <span className="text-xs text-text-muted">None added</span>
      )}
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  editing,
  onChange,
}: {
  icon: typeof Linkedin;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-muted">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-text-muted">{label}</div>
        {editing ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded border border-line bg-background px-2 py-0.5 text-sm text-text focus:border-accent focus:outline-none"
          />
        ) : value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="truncate text-sm text-accent hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-text-muted">Not set</span>
        )}
      </div>
    </div>
  );
}
