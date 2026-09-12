import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Building2, CheckCircle2, FileText, Loader2, Radio, Search, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createOrganization, getMyOrganization, listRankedCandidates,
  uploadInterviewPattern, listInterviewPatterns,
} from "@/lib/org.functions";
import { validEmail, validUrlOptional, required } from "@/lib/validation";

const violetButton = "rounded-none bg-brand px-5 font-semibold text-white shadow-[4px_4px_0_#16121d] hover:bg-brand/90";
const outlineButton = "rounded-none border-foreground/30 bg-transparent shadow-none hover:bg-foreground hover:text-background";
const panel = "border border-foreground/15 bg-card shadow-[6px_6px_0_rgba(25,18,35,.09)]";

function OrgHeader() {
  return <header className="flex h-16 items-center justify-between border-b border-foreground/15 bg-background px-5 md:px-9">
    <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="grid size-8 place-items-center bg-brand text-white shadow-[3px_3px_0_#f2dc47]"><Radio className="size-4" /></span>
      EchoSphere <span className="text-sm font-medium text-muted-foreground">for organizations</span>
    </Link>
    <Link to="/dashboard"><Button variant="outline" size="sm" className={outlineButton}>Candidate view</Button></Link>
  </header>;
}

function Field({ label, value, onChange, error, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; error?: string | undefined; placeholder?: string; type?: string }) {
  return <label className="block">
    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
      className={cn("mt-2 w-full border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand", error ? "border-destructive" : "border-foreground/20")} />
    {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
  </label>;
}

/** Organization sign-up + workspace. Everything shown comes from real records. */
export function OrganizationPage() {
  const navigate = useNavigate();
  const create = useServerFn(createOrganization);
  const getOrg = useServerFn(getMyOrganization);
  const rank = useServerFn(listRankedCandidates);
  const upload = useServerFn(uploadInterviewPattern);
  const patternsFn = useServerFn(listInterviewPatterns);

  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [patterns, setPatterns] = useState<any[]>([]);
  const [patternTitle, setPatternTitle] = useState("");
  const [patternText, setPatternText] = useState("");
  const [patternError, setPatternError] = useState<string | null>(null);
  const [patternSaving, setPatternSaving] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const [rows, pats] = await Promise.all([rank({ data: undefined }), patternsFn({ data: undefined })]);
      setCandidates(rows as any[]);
      setPatterns(pats as any[]);
    } catch (e: any) { setServerError(e?.message ?? "Could not load the organization workspace."); }
  }, [rank, patternsFn]);

  useEffect(() => {
    getOrg({ data: undefined })
      .then(async o => { setOrg(o); if (o) await loadWorkspace(); })
      .catch(e => setServerError(e?.message ?? null))
      .finally(() => setLoading(false));
  }, [getOrg, loadWorkspace]);

  async function submit() {
    const next: Record<string, string> = {};
    const n = required("Organization name")(form.name); if (n) next['name'] = n;
    const em = validEmail(form.email); if (em) next['email'] = em;
    const w = validUrlOptional(form.website); if (w) next['website'] = w;
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true); setServerError(null);
    try {
      await create({ data: { name: form.name.trim(), email: form.email.trim(), website: form.website.trim() } });
      const o = await getOrg({ data: undefined });
      setOrg(o);
      await loadWorkspace();
    } catch (e: any) { setServerError(e?.message ?? "Could not create the organization."); }
    setSubmitting(false);
  }

  async function savePattern() {
    setPatternError(null);
    if (!patternTitle.trim() || !patternText.trim()) { setPatternError("Add a title and the pattern content."); return; }
    setPatternSaving(true);
    try {
      await upload({ data: { title: patternTitle.trim(), content: patternText.trim() } });
      setPatternTitle(""); setPatternText("");
      setPatterns(await patternsFn({ data: undefined }) as any[]);
    } catch (e: any) { setPatternError(e?.message ?? "Could not save the pattern."); }
    setPatternSaving(false);
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setPatternText(text.slice(0, 200000));
    if (!patternTitle) setPatternTitle(file.name.replace(/\.[^.]+$/, ""));
  }

  const filtered = candidates.filter(c => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.email, c.institution, c.degree, c.department, c.lastRole].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(q));
  });

  if (loading) return <main className="min-h-screen bg-[#f5f1f8]"><OrgHeader /><div className="grid h-64 place-items-center text-sm text-muted-foreground">Loading…</div></main>;

  if (!org) return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><OrgHeader />
    <div className="mx-auto max-w-xl px-5 py-16">
      <p className="font-mono text-[10px] uppercase tracking-widest text-brand">For hiring teams</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Create your organization</h1>
      <p className="mt-3 text-sm text-muted-foreground">See real candidate results, ranked by interview performance, and upload your own interview patterns.</p>
      <section className={cn(panel, "mt-8 space-y-5 p-6")}>
        <Field label="Organization name" value={form.name} onChange={v => setForm({ ...form, name: v })} error={errors['name']} placeholder="Acme Technologies" />
        <Field label="Work email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} error={errors['email']} placeholder="hiring@acme.com" />
        <Field label="Website (optional)" value={form.website} onChange={v => setForm({ ...form, website: v })} error={errors['website']} placeholder="https://acme.com" />
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        <Button disabled={submitting} onClick={() => void submit()} className={violetButton}>{submitting ? <Loader2 className="animate-spin" /> : <Building2 />} Create organization</Button>
      </section>
      <Button variant="outline" className={cn(outlineButton, "mt-6")} onClick={() => navigate({ to: "/dashboard" })}>Back to candidate dashboard</Button>
    </div>
  </main>;

  return <main className="min-h-screen bg-[#f5f1f8] text-foreground"><OrgHeader />
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Organization workspace</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-[-.04em]">{org.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{org.email}{org.website ? ` · ${org.website}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 border border-foreground/20 bg-card px-4 py-2 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search candidates" className="w-56 bg-transparent outline-none" />
        </div>
      </div>

      {serverError && <p className="mt-6 text-sm text-destructive">{serverError}</p>}

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Users className="size-5 text-brand" /> Ranked candidates</h2>
        {filtered.length === 0
          ? <p className={cn(panel, "mt-5 p-8 text-center text-sm text-muted-foreground")}>No candidate results yet. Rankings appear once candidates complete scored interviews.</p>
          : <div className="mt-5 border-t border-foreground/20">
              {filtered.map((c, i) => <article key={c.userId} className="grid items-center gap-4 border-b border-foreground/15 bg-card px-5 py-5 md:grid-cols-[48px_1fr_repeat(4,72px)_100px]">
                <span className="grid size-10 place-items-center bg-brand font-mono text-sm text-white">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{[c.degree, c.department, c.institution, c.graduationYear].filter(Boolean).join(" · ") || "Profile incomplete"}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{c.interviews} interview{c.interviews === 1 ? "" : "s"}{c.lastRole ? ` · latest: ${c.lastRole}` : ""}{c.terminated ? " · ended early" : ""}</p>
                </div>
                {[["Tech", c.technical], ["Behav", c.behavioral], ["PM", c.productManager], ["HM", c.hiringManager]].map(([l, v]: any) =>
                  <div key={l} className="text-center"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p><b className="text-lg">{v == null ? "—" : Math.round(v)}</b></div>)}
                <div className="text-right"><p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Best</p><b className="text-3xl text-brand">{c.bestScore == null ? "—" : Math.round(c.bestScore)}</b></div>
              </article>)}
            </div>}
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className={cn(panel, "p-6")}>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Upload className="size-5 text-brand" /> Upload an interview pattern</h2>
          <p className="mt-2 text-sm text-muted-foreground">Share the structure your interviews follow. Patterns guide how candidates are questioned.</p>
          <div className="mt-5 space-y-4">
            <Field label="Title" value={patternTitle} onChange={setPatternTitle} placeholder="Backend engineer loop" />
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pattern content</span>
              <textarea value={patternText} onChange={e => setPatternText(e.target.value)} rows={7} placeholder="Round 1: fundamentals…" className="mt-2 w-full resize-none border border-foreground/20 bg-background p-3 text-sm outline-none focus:border-brand" />
            </label>
            <label className="flex w-fit cursor-pointer items-center gap-2 border border-foreground/25 px-3 py-2 text-xs">
              <FileText className="size-4" /> Load from a text file
              <input type="file" accept=".txt,.md,.json,.csv" className="hidden" onChange={e => void onFile(e.target.files?.[0] ?? null)} />
            </label>
            {patternError && <p className="text-sm text-destructive">{patternError}</p>}
            <Button disabled={patternSaving} onClick={() => void savePattern()} className={violetButton}>{patternSaving ? <Loader2 className="animate-spin" /> : <Upload />} Save pattern</Button>
          </div>
        </div>
        <div className={cn(panel, "p-6")}>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><FileText className="size-5 text-brand" /> Saved patterns</h2>
          {patterns.length === 0
            ? <p className="mt-5 text-sm text-muted-foreground">No patterns uploaded yet.</p>
            : <ul className="mt-5 space-y-3">{patterns.map(p => <li key={p.id} className="flex items-center justify-between border-b border-foreground/10 pb-3 text-sm">
                <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> {p.title}</span>
                <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
              </li>)}</ul>}
        </div>
      </section>
    </div>
  </main>;
}
