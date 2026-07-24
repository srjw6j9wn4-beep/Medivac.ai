import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Telescope, Zap, Users2, FlaskConical, FileText,
  Plus, RefreshCw, ChevronDown, ChevronUp, X, Check,
  AlertTriangle, Loader2, Bookmark, BookmarkCheck, EyeOff,
  Globe, Plane, Cpu, Truck, Heart, Filter, Star, ExternalLink,
  Building2, Phone, Mail, Calendar, MapPin, Award, Send, Sparkles,
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────
type ScoutItem = {
  id: number; title: string; category: string; source: string; source_url?: string;
  summary: string; aeromedical_fit_score: number; fit_rationale: string;
  manufacturer: string; manufacturer_country: string; status: string;
  added_at: string; notes?: string;
};
type Demand = {
  id: number; title: string; category: string; clinical_need: string;
  operational_context: string; constraints?: Record<string,any>;
  current_workaround?: string; solution_requirements?: string;
  nice_to_have?: string; priority: string; status: string;
  created_by?: string; created_at: string;
};
type Partner = {
  id: number; organisation: string; contact_name?: string; contact_email?: string;
  contact_phone?: string; country?: string; category: string;
  products_of_interest?: string; co_development_interest: boolean;
  trial_at_own_cost: boolean; status: string; eoi_received_at?: string;
  mou_signed_at?: string; notes?: string; created_at: string;
};
type Trial = {
  id: number; partner_id?: number; title: string; description?: string;
  trial_type: string; location?: string; aircraft_type?: string;
  planned_start?: string; planned_end?: string; evaluator?: string;
  status: string; outcome?: string; outcome_score?: number;
  outcome_notes?: string; recommendation?: string; created_at: string;
};
type Briefing = {
  id: number; title: string; period_label?: string;
  ai_commentary?: string; generated_at: string; status: string;
};

// ── constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "scout",    icon: Telescope,    label: "Innovation Scout",        color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/30" },
  { id: "demands",  icon: Zap,          label: "Capability Demands",       color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  { id: "partners", icon: Users2,       label: "Partner Register",         color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30" },
  { id: "trials",   icon: FlaskConical, label: "Trial & Demo Pipeline",    color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/30" },
  { id: "briefings",icon: FileText,     label: "Innovation Briefings",     color: "text-sky-400",    bg: "bg-sky-400/10 border-sky-400/30" },
] as const;

const CAT_ICONS: Record<string, any> = {
  medical_device: Heart, aircraft: Plane, ground_vehicle: Truck,
  digital_health: Cpu, other: Globe,
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "text-red-300 bg-red-500/15 border-red-500/30" },
  high:     { label: "High",     cls: "text-orange-300 bg-orange-500/15 border-orange-500/30" },
  medium:   { label: "Medium",   cls: "text-yellow-300 bg-yellow-500/15 border-yellow-500/30" },
  low:      { label: "Low",      cls: "text-slate-300 bg-slate-500/15 border-slate-500/30" },
};

const PARTNER_STATUS_META: Record<string, { label: string; cls: string }> = {
  prospect:     { label: "Prospect",       cls: "text-slate-300 bg-slate-500/15 border-slate-500/30" },
  eoi_received: { label: "EOI Received",   cls: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30" },
  mou:          { label: "MOU Signed",     cls: "text-violet-300 bg-violet-500/15 border-violet-500/30" },
  active:       { label: "Active Partner", cls: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  trial:        { label: "In Trial",       cls: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  completed:    { label: "Completed",      cls: "text-green-300 bg-green-500/15 border-green-500/30" },
  declined:     { label: "Declined",       cls: "text-red-300 bg-red-500/15 border-red-500/30" },
};

const TRIAL_STATUS_META: Record<string, { label: string; cls: string }> = {
  proposed:  { label: "Proposed",  cls: "text-slate-300 bg-slate-500/15 border-slate-500/30" },
  approved:  { label: "Approved",  cls: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30" },
  active:    { label: "Active",    cls: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  completed: { label: "Completed", cls: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  cancelled: { label: "Cancelled", cls: "text-red-300 bg-red-500/15 border-red-500/30" },
};

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-400 bg-emerald-400/15 border-emerald-400/30";
  if (s >= 60) return "text-amber-400 bg-amber-400/15 border-amber-400/30";
  return "text-red-400 bg-red-400/15 border-red-400/30";
}

function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// ── reusable chip ──────────────────────────────────────────────────────────────
function Chip({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}>{label}</span>;
}

// ── collapsible card shell ─────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-sidebar-border bg-sidebar p-4 ${className}`}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SCOUT TAB
// ════════════════════════════════════════════════════════════════════════════════
function ScoutTab() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery<ScoutItem[]>({ queryKey: ["/api/innovation/scout"] });
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("new");
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const updateMut = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      apiRequest("PATCH", `/api/innovation/scout/${id}`, { status, notes }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/innovation/scout"] }),
  });

  const runAI = async () => {
    setRunning(true);
    try {
      await apiRequest("POST", "/api/innovation/scout/run-ai", {});
      qc.invalidateQueries({ queryKey: ["/api/innovation/scout"] });
    } finally { setRunning(false); }
  };

  const filtered = useMemo(() => items.filter(i => {
    if (catFilter !== "all" && i.category !== catFilter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  }), [items, catFilter, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string,number> = { new: 0, bookmarked: 0, briefed: 0, dismissed: 0 };
    for (const i of items) c[i.status] = (c[i.status] || 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Global Innovation Radar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">AI-monitored breakthroughs in medical technology, aircraft, and remote operations equipment</p>
        </div>
        <button
          onClick={runAI}
          disabled={running}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 px-4 py-2 text-xs font-bold text-white transition-colors"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {running ? "Scanning globe…" : "Run AI Scout"}
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {[["all","All",items.length],["new","New",counts.new],["bookmarked","Bookmarked",counts.bookmarked],["briefed","Briefed",counts.briefed],["dismissed","Dismissed",counts.dismissed]].map(([v,l,n]) => (
          <button key={v} onClick={() => setStatusFilter(String(v))}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${statusFilter===v ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "border-sidebar-border text-muted-foreground hover:text-white"}`}>
            {l} ({n})
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {[["all","All"],["medical_device","Medical Devices"],["aircraft","Aircraft"],["ground_vehicle","Ground Vehicles"],["digital_health","Digital Health"],["other","Other"]].map(([v,l]) => (
          <button key={v} onClick={() => setCatFilter(String(v))}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${catFilter===v ? "bg-sidebar-accent text-white border-sidebar-border" : "border-transparent text-muted-foreground hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading && <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Telescope className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No items found. Click "Run AI Scout" to scan for global innovations.</p>
        </div>
      )}
      <div className="space-y-3">
        {filtered.map(item => {
          const CatIcon = CAT_ICONS[item.category] || Globe;
          const isExpanded = expanded === item.id;
          return (
            <Card key={item.id}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-sidebar-accent border border-sidebar-border flex items-center justify-center">
                  <CatIcon className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    {item.aeromedical_fit_score != null && (
                      <span className={`text-[11px] font-bold border rounded px-1.5 py-0.5 ${scoreColor(item.aeromedical_fit_score)}`}>
                        Fit {item.aeromedical_fit_score}/100
                      </span>
                    )}
                    <Chip label={item.category.replace("_"," ")} cls="text-slate-300 bg-slate-500/10 border-slate-500/20" />
                    {item.status === "bookmarked" && <Chip label="Bookmarked" cls="text-cyan-300 bg-cyan-500/10 border-cyan-500/20" />}
                    {item.status === "briefed" && <Chip label="Briefed" cls="text-emerald-300 bg-emerald-500/10 border-emerald-500/20" />}
                    {item.status === "dismissed" && <Chip label="Dismissed" cls="text-slate-400 bg-slate-500/10 border-slate-500/20" />}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {item.manufacturer && <span className="font-medium text-white/70">{item.manufacturer}</span>}
                    {item.manufacturer_country && <span> · {item.manufacturer_country}</span>}
                    {item.source && <span> · {item.source}</span>}
                    <span> · {fmtDate(item.added_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>

                  {isExpanded && item.fit_rationale && (
                    <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-1">Aeromedical Relevance</div>
                      <p className="text-xs text-cyan-100/80 leading-relaxed">{item.fit_rationale}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              {item.status === "new" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sidebar-border">
                  <button onClick={() => updateMut.mutate({ id: item.id, status: "bookmarked" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors">
                    <Bookmark className="h-3 w-3" /> Bookmark
                  </button>
                  <button onClick={() => updateMut.mutate({ id: item.id, status: "briefed" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                    <Check className="h-3 w-3" /> Add to Briefing
                  </button>
                  <button onClick={() => updateMut.mutate({ id: item.id, status: "dismissed" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-sidebar-border text-xs text-muted-foreground hover:text-white transition-colors ml-auto">
                    <EyeOff className="h-3 w-3" /> Dismiss
                  </button>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-400 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {item.status === "bookmarked" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sidebar-border">
                  <button onClick={() => updateMut.mutate({ id: item.id, status: "briefed" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                    <Check className="h-3 w-3" /> Add to Briefing
                  </button>
                  <button onClick={() => updateMut.mutate({ id: item.id, status: "dismissed" })}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-sidebar-border text-xs text-muted-foreground hover:text-white transition-colors">
                    <EyeOff className="h-3 w-3" /> Dismiss
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// DEMANDS TAB
// ════════════════════════════════════════════════════════════════════════════════
const EMPTY_DEMAND = {
  title: "", category: "medical_device", clinical_need: "", operational_context: "",
  current_workaround: "", solution_requirements: "", nice_to_have: "",
  priority: "high", status: "open", created_by: "", published: true,
};

function DemandForm({ initial, onSave, onCancel }: { initial: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const f = (k: string) => ({ value: form[k] || "", onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })) });
  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest text-orange-400">
        {initial.id ? "Edit Capability Demand" : "New Capability Demand"}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Title *</label>
          <input {...f("title")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/40" placeholder="e.g. Portable Ventilator — 58°C rated, aircraft cabin" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <select {...f("category")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            {["medical_device","aircraft","ground_vehicle","digital","support"].map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Priority</label>
          <select {...f("priority")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            {["critical","high","medium","low"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Clinical / Operational Need *</label>
          <textarea {...f("clinical_need")} rows={2} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/40 resize-none" placeholder="What clinical or operational problem does this solve?" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Operating Environment & Constraints</label>
          <textarea {...f("operational_context")} rows={2} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500/40 resize-none" placeholder="e.g. 58°C ambient, 800m gravel strip, 800nm sector, dust/UV/vibration, nurse-only crew, B200 cabin 1.3m width" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Current Workaround</label>
          <input {...f("current_workaround")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" placeholder="How do we manage this gap today?" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Solution Must Achieve</label>
          <textarea {...f("solution_requirements")} rows={2} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none resize-none" placeholder="Non-negotiable technical requirements…" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Nice to Have</label>
          <input {...f("nice_to_have")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Raised By</label>
          <input {...f("created_by")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" placeholder="Role / name" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 rounded-md bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-bold text-white transition-colors">
          <Check className="h-3.5 w-3.5" /> Save Demand
        </button>
        <button onClick={onCancel} className="rounded-md border border-sidebar-border px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function DemandsTab() {
  const qc = useQueryClient();
  const { data: demands = [], isLoading } = useQuery<Demand[]>({ queryKey: ["/api/innovation/demands"] });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Demand | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("all");

  const createMut = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/innovation/demands", d).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/innovation/demands"] }); setAdding(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => apiRequest("PATCH", `/api/innovation/demands/${id}`, d).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/innovation/demands"] }); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/innovation/demands/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/innovation/demands"] }),
  });

  const filtered = demands.filter(d => priorityFilter === "all" || d.priority === priorityFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Capability Demand Register</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Publish what we need. Manufacturers come to us with solutions — not just products.</p>
        </div>
        <button onClick={() => setAdding(true)} disabled={adding}
          className="flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60">
          <Plus className="h-3.5 w-3.5" /> Add Demand
        </button>
      </div>

      {adding && <DemandForm initial={EMPTY_DEMAND} onSave={d => createMut.mutate(d)} onCancel={() => setAdding(false)} />}

      {/* Priority filter */}
      <div className="flex flex-wrap gap-2">
        {[["all","All"],["critical","Critical"],["high","High"],["medium","Medium"],["low","Low"]].map(([v,l]) => (
          <button key={v} onClick={() => setPriorityFilter(String(v))}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${priorityFilter===v ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : "border-sidebar-border text-muted-foreground hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
      {!isLoading && filtered.length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No capability demands registered yet.</p>
          <p className="text-xs mt-1">Add what we need — this becomes the document manufacturers respond to.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(d => {
          const pm = PRIORITY_META[d.priority] || PRIORITY_META.medium;
          const isExp = expanded === d.id;
          if (editing?.id === d.id) return (
            <DemandForm key={d.id} initial={editing}
              onSave={upd => updateMut.mutate(upd)}
              onCancel={() => setEditing(null)} />
          );
          return (
            <Card key={d.id}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Chip label={pm.label} cls={pm.cls} />
                    <Chip label={d.category.replace("_"," ")} cls="text-slate-300 bg-slate-500/10 border-slate-500/20" />
                    <span className="text-sm font-bold text-white">{d.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1 leading-relaxed">{d.clinical_need}</p>
                  {d.operational_context && (
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                      <span className="text-orange-400/70 font-medium">Environment: </span>{d.operational_context}
                    </p>
                  )}
                  {isExp && (
                    <div className="mt-3 space-y-2">
                      {d.current_workaround && (
                        <div className="text-xs"><span className="text-muted-foreground font-medium">Workaround: </span><span className="text-foreground/80">{d.current_workaround}</span></div>
                      )}
                      {d.solution_requirements && (
                        <div className="text-xs"><span className="text-muted-foreground font-medium">Must achieve: </span><span className="text-foreground/80">{d.solution_requirements}</span></div>
                      )}
                      {d.nice_to_have && (
                        <div className="text-xs"><span className="text-muted-foreground font-medium">Nice to have: </span><span className="text-foreground/80">{d.nice_to_have}</span></div>
                      )}
                      {d.created_by && (
                        <div className="text-[11px] text-muted-foreground">Raised by: {d.created_by} · {fmtDate(d.created_at)}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpanded(isExp ? null : d.id)} className="p-1.5 rounded text-muted-foreground hover:text-white">
                    {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditing(d)} className="p-1.5 rounded text-muted-foreground hover:text-white text-xs">Edit</button>
                  <button onClick={() => deleteMut.mutate(d.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PARTNERS TAB
// ════════════════════════════════════════════════════════════════════════════════
const EMPTY_PARTNER = {
  organisation: "", contact_name: "", contact_email: "", contact_phone: "",
  country: "", category: "medical_device", products_of_interest: "",
  co_development_interest: false, trial_at_own_cost: false,
  status: "prospect", notes: "",
};

function PartnerForm({ initial, onSave, onCancel }: { initial: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const f = (k: string) => ({ value: form[k] || "", onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })) });
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest text-violet-400">
        {initial.id ? "Edit Partner" : "Register New Partner / EOI"}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Organisation *</label>
          <input {...f("organisation")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Contact Name</label>
          <input {...f("contact_name")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Country</label>
          <input {...f("country")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <input type="email" {...f("contact_email")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Phone</label>
          <input {...f("contact_phone")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <select {...f("category")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            {["medical_device","aircraft","ground_vehicle","digital","research"].map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select {...f("status")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            {Object.entries(PARTNER_STATUS_META).map(([v,m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Products / Technology of Interest</label>
          <textarea {...f("products_of_interest")} rows={2} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none resize-none" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea {...f("notes")} rows={2} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none resize-none" />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={!!form.co_development_interest}
              onChange={e => setForm((p: any) => ({ ...p, co_development_interest: e.target.checked }))}
              className="h-4 w-4 rounded accent-violet-500" />
            Co-development interest
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={!!form.trial_at_own_cost}
              onChange={e => setForm((p: any) => ({ ...p, trial_at_own_cost: e.target.checked }))}
              className="h-4 w-4 rounded accent-violet-500" />
            Willing to trial at own cost
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 rounded-md bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-colors">
          <Check className="h-3.5 w-3.5" /> Save Partner
        </button>
        <button onClick={onCancel} className="rounded-md border border-sidebar-border px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function PartnersTab() {
  const qc = useQueryClient();
  const { data: partners = [], isLoading } = useQuery<Partner[]>({ queryKey: ["/api/innovation/partners"] });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const createMut = useMutation({
    mutationFn: (p: any) => apiRequest("POST", "/api/innovation/partners", p).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/innovation/partners"] }); setAdding(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...p }: any) => apiRequest("PATCH", `/api/innovation/partners/${id}`, p).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/innovation/partners"] }); setEditing(null); },
  });

  const filtered = partners.filter(p => statusFilter === "all" || p.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Partner Register</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manufacturers and research bodies who want to co-develop — not just sell</p>
        </div>
        <button onClick={() => setAdding(true)} disabled={adding}
          className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60">
          <Plus className="h-3.5 w-3.5" /> Register Partner
        </button>
      </div>

      {adding && <PartnerForm initial={EMPTY_PARTNER} onSave={d => createMut.mutate(d)} onCancel={() => setAdding(false)} />}

      <div className="flex flex-wrap gap-2">
        {[["all","All"],...Object.entries(PARTNER_STATUS_META).map(([v,m]) => [v,m.label])].map(([v,l]) => (
          <button key={v} onClick={() => setStatusFilter(String(v))}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${statusFilter===v ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "border-sidebar-border text-muted-foreground hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}
      {!isLoading && filtered.length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <Users2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No partners registered yet.</p>
          <p className="text-xs mt-1">Register manufacturers who've expressed interest in co-developing with aeromedical operators.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(p => {
          const sm = PARTNER_STATUS_META[p.status] || PARTNER_STATUS_META.prospect;
          if (editing?.id === p.id) return (
            <PartnerForm key={p.id} initial={editing}
              onSave={upd => updateMut.mutate(upd)} onCancel={() => setEditing(null)} />
          );
          return (
            <Card key={p.id}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{p.organisation}</span>
                    <Chip label={sm.label} cls={sm.cls} />
                    <Chip label={p.category.replace("_"," ")} cls="text-slate-300 bg-slate-500/10 border-slate-500/20" />
                    {p.co_development_interest && <Chip label="Co-dev" cls="text-violet-300 bg-violet-500/10 border-violet-500/20" />}
                    {p.trial_at_own_cost && <Chip label="Trial at own cost" cls="text-emerald-300 bg-emerald-500/10 border-emerald-500/20" />}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.country && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.country}</span>}
                    {p.contact_name && <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />{p.contact_name}</span>}
                    {p.contact_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.contact_email}</span>}
                    {p.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.contact_phone}</span>}
                  </div>
                  {p.products_of_interest && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.products_of_interest}</p>
                  )}
                  {p.notes && <p className="text-xs text-muted-foreground/70 mt-1 italic">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(p)} className="p-1.5 rounded text-muted-foreground hover:text-white text-xs">Edit</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// TRIALS TAB
// ════════════════════════════════════════════════════════════════════════════════
const EMPTY_TRIAL = {
  title: "", description: "", trial_type: "demo", location: "",
  aircraft_type: "", planned_start: "", planned_end: "", evaluator: "",
  status: "proposed", outcome: "", outcome_score: "", outcome_notes: "",
  recommendation: "", cost_to_operator: "", cost_to_manufacturer: "",
};

function TrialForm({ initial, onSave, onCancel }: { initial: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const f = (k: string) => ({ value: form[k] ?? "", onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })) });
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-4">
      <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">
        {initial.id ? "Edit Trial" : "Log New Trial / Demo"}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Title *</label>
          <input {...f("title")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Trial Type</label>
          <select {...f("trial_type")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            {["demo","field_trial","aircraft_trial","clinical_evaluation"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select {...f("status")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            {Object.entries(TRIAL_STATUS_META).map(([v,m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Location (Base)</label>
          <input {...f("location")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" placeholder="e.g. Dubbo" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Aircraft Type</label>
          <input {...f("aircraft_type")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" placeholder="e.g. B200, PC12" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Planned Start</label>
          <input type="date" {...f("planned_start")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Planned End</label>
          <input type="date" {...f("planned_end")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Clinical Evaluator</label>
          <input {...f("evaluator")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Outcome</label>
          <select {...f("outcome")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            <option value="">Pending</option>
            <option value="positive">Positive</option>
            <option value="conditional">Conditional</option>
            <option value="negative">Negative</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Outcome Score (0-100)</label>
          <input type="number" min={0} max={100} {...f("outcome_score")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Outcome Notes</label>
          <textarea {...f("outcome_notes")} rows={2} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none resize-none" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-muted-foreground">Recommendation</label>
          <select {...f("recommendation")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none">
            <option value="">Select…</option>
            {["proceed","modify","reject","refer_clinical_governance"].map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cost to Operator (AUD)</label>
          <input type="number" {...f("cost_to_operator")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cost to Manufacturer (AUD)</label>
          <input type="number" {...f("cost_to_manufacturer")} className="w-full rounded-md border border-sidebar-border bg-background px-3 py-2 text-sm outline-none" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} className="flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors">
          <Check className="h-3.5 w-3.5" /> Save Trial
        </button>
        <button onClick={onCancel} className="rounded-md border border-sidebar-border px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function TrialsTab() {
  const qc = useQueryClient();
  const { data: trials = [], isLoading } = useQuery<Trial[]>({ queryKey: ["/api/innovation/trials"] });
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Trial | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const createMut = useMutation({
    mutationFn: (t: any) => apiRequest("POST", "/api/innovation/trials", t).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/innovation/trials"] }); setAdding(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...t }: any) => apiRequest("PATCH", `/api/innovation/trials/${id}`, t).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/innovation/trials"] }); setEditing(null); },
  });

  const filtered = trials.filter(t => statusFilter === "all" || t.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Trial & Demo Pipeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Structured evaluation — manufacturers demonstrate at their cost, we evaluate against our criteria</p>
        </div>
        <button onClick={() => setAdding(true)} disabled={adding}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60">
          <Plus className="h-3.5 w-3.5" /> Log Trial
        </button>
      </div>

      {adding && <TrialForm initial={EMPTY_TRIAL} onSave={d => createMut.mutate(d)} onCancel={() => setAdding(false)} />}

      <div className="flex flex-wrap gap-2">
        {[["all","All"],...Object.entries(TRIAL_STATUS_META).map(([v,m]) => [v,m.label])].map(([v,l]) => (
          <button key={v} onClick={() => setStatusFilter(String(v))}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${statusFilter===v ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "border-sidebar-border text-muted-foreground hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}
      {!isLoading && filtered.length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No trials or demos logged yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(t => {
          const sm = TRIAL_STATUS_META[t.status] || TRIAL_STATUS_META.proposed;
          if (editing?.id === t.id) return (
            <TrialForm key={t.id} initial={editing} onSave={upd => updateMut.mutate(upd)} onCancel={() => setEditing(null)} />
          );
          return (
            <Card key={t.id}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FlaskConical className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{t.title}</span>
                    <Chip label={sm.label} cls={sm.cls} />
                    <Chip label={t.trial_type.replace("_"," ")} cls="text-slate-300 bg-slate-500/10 border-slate-500/20" />
                    {t.outcome && (
                      <Chip label={t.outcome}
                        cls={t.outcome === "positive" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
                          : t.outcome === "conditional" ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
                          : "text-red-300 bg-red-500/10 border-red-500/20"} />
                    )}
                    {t.outcome_score != null && (
                      <span className={`text-[11px] font-bold border rounded px-1.5 py-0.5 ${scoreColor(t.outcome_score)}`}>
                        {t.outcome_score}/100
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {t.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location}</span>}
                    {t.aircraft_type && <span className="flex items-center gap-1"><Plane className="h-3 w-3" />{t.aircraft_type}</span>}
                    {t.planned_start && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(t.planned_start)}{t.planned_end ? ` → ${fmtDate(t.planned_end)}` : ""}</span>}
                    {t.evaluator && <span className="flex items-center gap-1"><Award className="h-3 w-3" />{t.evaluator}</span>}
                  </div>
                  {t.outcome_notes && <p className="text-xs text-muted-foreground mt-1">{t.outcome_notes}</p>}
                  {t.recommendation && (
                    <div className="mt-1 text-xs font-medium text-emerald-400">Recommendation: {t.recommendation.replace("_"," ")}</div>
                  )}
                  {(t.cost_to_manufacturer != null && t.cost_to_manufacturer > 0) && (
                    <div className="text-[11px] text-muted-foreground mt-1">Manufacturer cost: ${Number(t.cost_to_manufacturer).toLocaleString()} AUD ex GST</div>
                  )}
                </div>
                <button onClick={() => setEditing(t)} className="p-1.5 rounded text-muted-foreground hover:text-white text-xs flex-shrink-0">Edit</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// BRIEFINGS TAB
// ════════════════════════════════════════════════════════════════════════════════
function BriefingsTab() {
  const qc = useQueryClient();
  const { data: briefings = [], isLoading } = useQuery<Briefing[]>({ queryKey: ["/api/innovation/briefings"] });
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const generate = async () => {
    setGenerating(true);
    try {
      await apiRequest("POST", "/api/innovation/briefings/generate", {});
      qc.invalidateQueries({ queryKey: ["/api/innovation/briefings"] });
    } finally { setGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Innovation Briefings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">AI-compiled executive digests — Scout highlights, partner updates, trial outcomes, critical demands</p>
        </div>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 px-4 py-2 text-xs font-bold text-white transition-colors">
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? "Generating…" : "Generate Briefing"}
        </button>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}
      {!isLoading && briefings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No briefings generated yet.</p>
          <p className="text-xs mt-1">After running the AI Scout and adding demands/partners, generate a briefing for the GM.</p>
        </div>
      )}

      <div className="space-y-3">
        {briefings.map(b => (
          <Card key={b.id}>
            <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.period_label || fmtDate(b.generated_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip label={b.status} cls={b.status === "sent" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : "text-slate-300 bg-slate-500/10 border-slate-500/20"} />
                {expanded === b.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>
            {expanded === b.id && b.ai_commentary && (
              <div className="mt-4 pt-4 border-t border-sidebar-border">
                <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-2">Executive Summary</div>
                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{b.ai_commentary}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function InnovationHub() {
  const [activeTab, setActiveTab] = useState<string>("scout");
  const activeTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Telescope className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white">Innovation Hub</h1>
            <p className="text-[11px] text-muted-foreground">Global R&D radar · Capability demands · Co-development partnerships · Trial pipeline</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  active ? `${tab.bg} ${tab.color}` : "border-transparent text-muted-foreground hover:text-white hover:bg-sidebar-accent/40"
                }`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "scout"    && <ScoutTab />}
        {activeTab === "demands"  && <DemandsTab />}
        {activeTab === "partners" && <PartnersTab />}
        {activeTab === "trials"   && <TrialsTab />}
        {activeTab === "briefings"&& <BriefingsTab />}
      </div>
    </div>
  );
}
