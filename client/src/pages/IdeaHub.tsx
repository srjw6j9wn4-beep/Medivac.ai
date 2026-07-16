import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import {
  Lightbulb, Send, Sparkles, FileText, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Clock, RefreshCw, TrendingUp, Wrench,
  Users, Shield, Zap, DollarSign, BarChart2, ArrowRight,
  AlertTriangle, Star, Filter, Plus, X, MessageSquare, Bell,
} from "lucide-react";

interface Props { role: UserRole; }

interface Idea {
  id: number;
  title: string;
  description: string;
  category: string;
  impact_area: string;
  submitted_by: string;
  submitted_at: string;
  status: string;
  gm_note: string | null;
  gm_reviewed_at: string | null;
  ai_score: number | null;
  ai_summary: string | null;
  ai_effort: string | null;
  ai_impact: string | null;
  ai_recommendation: string | null;
  ai_analysed_at: string | null;
  cluster_tag: string | null;
}

const CATEGORIES = [
  { value: "growth",     label: "Revenue Growth",  icon: TrendingUp, colour: "text-green-400"  },
  { value: "efficiency", label: "Efficiency",       icon: Zap,        colour: "text-amber-400"  },
  { value: "safety",     label: "Safety",           icon: Shield,     colour: "text-red-400"    },
  { value: "culture",    label: "Culture & People", icon: Users,      colour: "text-purple-400" },
  { value: "technology", label: "Technology",       icon: BarChart2,  colour: "text-cyan-400"   },
  { value: "cost",       label: "Cost Reduction",   icon: DollarSign, colour: "text-orange-400" },
  { value: "other",      label: "Other",            icon: Lightbulb,  colour: "text-zinc-400"   },
];
const IMPACT_AREAS = ["Operations", "Finance", "People", "Customer", "Compliance"];
const STATUSES: Record<string, { label: string; colour: string }> = {
  pending:     { label: "Pending Review", colour: "bg-zinc-500/15 border-zinc-500/40 text-zinc-400"   },
  reviewing:   { label: "AI Reviewed",    colour: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"   },
  approved:    { label: "Approved",       colour: "bg-green-500/15 border-green-500/40 text-green-300"},
  declined:    { label: "Declined",       colour: "bg-red-500/15 border-red-500/40 text-red-400"     },
  implemented: { label: "Implemented",   colour: "bg-purple-500/15 border-purple-500/40 text-purple-300"},
};

function statusBadge(status: string) {
  const s = STATUSES[status] ?? STATUSES.pending;
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${s.colour}`}>
      {s.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const colour = score >= 75 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#27272a" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={colour} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 87.96} 87.96`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold tabular-nums" style={{ color: colour }}>{score}</span>
      </div>
    </div>
  );
}

function EffortImpactBadge({ label, value }: { label: string; value: string }) {
  const colour = value === "high"
    ? (label === "Effort" ? "text-red-400 border-red-500/40 bg-red-500/10" : "text-green-400 border-green-500/40 bg-green-500/10")
    : value === "medium"
      ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
      : "text-zinc-400 border-zinc-500/40 bg-zinc-800/40";
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${colour}`}>
      {label}: {value}
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function IdeaHub({ role }: Props) {
  const qc = useQueryClient();
  const isGM = role === "gm" || role === "admin";

  const [tab, setTab] = useState<"submit" | "mine" | "queue" | "brief">("submit");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [gmReviewId, setGmReviewId] = useState<number | null>(null);
  const [gmStatus, setGmStatus] = useState("approved");
  const [gmNote, setGmNote] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [briefCount, setBriefCount] = useState(0);

  const [form, setForm] = useState({
    title: "", description: "", category: "", impactArea: "", submittedBy: "",
  });
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/ideas"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ideas?limit=200");
      return res.json() as Promise<{ ideas: Idea[] }>;
    },
    refetchInterval: 30000,
  });
  const ideas = data?.ideas ?? [];

  // "My Ideas" — match by submittedBy name stored in form (persisted in state)
  const myIdeas = useMemo(() => {
    if (!form.submittedBy.trim()) return [];
    return ideas.filter(i =>
      i.submitted_by.toLowerCase().includes(form.submittedBy.toLowerCase()) ||
      form.submittedBy.toLowerCase().includes(i.submitted_by.toLowerCase())
    );
  }, [ideas, form.submittedBy]);

  // Count of my ideas with GM feedback I haven't expanded yet
  const myFeedbackCount = myIdeas.filter(i => i.gm_note && (i.status === "approved" || i.status === "declined" || i.status === "implemented")).length;

  const filtered = useMemo(() => {
    return ideas.filter(i => {
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      return true;
    });
  }, [ideas, filterStatus, filterCategory]);

  const clustered = useMemo(() => {
    const groups: Record<string, Idea[]> = {};
    for (const idea of filtered) {
      const key = idea.cluster_tag ?? "Uncategorised";
      if (!groups[key]) groups[key] = [];
      groups[key].push(idea);
    }
    return Object.entries(groups).sort(([, a], [, b]) => {
      const avgA = a.reduce((s, i) => s + (i.ai_score ?? 0), 0) / a.length;
      const avgB = b.reduce((s, i) => s + (i.ai_score ?? 0), 0) / b.length;
      return avgB - avgA;
    });
  }, [filtered]);

  const pendingCount = ideas.filter(i => !i.ai_analysed_at && i.status !== "declined").length;
  const reviewingCount = ideas.filter(i => i.status === "reviewing").length;

  const submitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/ideas", {
        title: data.title, description: data.description,
        category: data.category, impactArea: data.impactArea, submittedBy: data.submittedBy,
      });
    },
    onSuccess: () => {
      setForm(f => ({ ...f, title: "", description: "", category: "", impactArea: "" }));
      qc.invalidateQueries({ queryKey: ["/api/ideas"] });
      setSubmitted(true);
      setTab("mine");
    },
  });

  const analyseMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/ideas/analyse", {}); return r.json(); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ideas"] }),
  });

  const briefMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/ideas/brief", {}); return r.json(); },
    onSuccess: (data: any) => { setBrief(data.brief); setBriefCount(data.count); },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, gmNote }: { id: number; status: string; gmNote: string }) =>
      apiRequest("PATCH", `/api/ideas/${id}`, { status, gmNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ideas"] });
      setGmReviewId(null); setGmNote(""); setGmStatus("approved");
    },
  });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim() || !form.category || !form.impactArea || !form.submittedBy.trim()) {
      setFormError("Please complete all fields before submitting."); return;
    }
    setFormError("");
    submitMutation.mutate(form);
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <Lightbulb size={20} className="text-amber-400" /> Idea Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Staff innovation pipeline — submit ideas, AI analyses viability, GM reviews and feeds back
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-700/50">
            <Clock size={11} className="text-zinc-400" />
            <span className="text-zinc-400">{pendingCount} awaiting AI</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Sparkles size={11} className="text-cyan-400" />
            <span className="text-cyan-300">{reviewingCount} AI reviewed</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-700/50">
            <Lightbulb size={11} className="text-amber-400" />
            <span className="text-zinc-400">{ideas.length} total</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        {([
          { key: "submit", label: "Submit Idea", icon: Plus },
          { key: "mine",   label: myFeedbackCount > 0 ? `My Ideas (${myFeedbackCount} new)` : `My Ideas (${myIdeas.length})`, icon: MessageSquare, highlight: myFeedbackCount > 0 },
          { key: "queue",  label: `All Ideas (${ideas.length})`, icon: Lightbulb },
          ...(isGM ? [{ key: "brief", label: "GM Brief", icon: FileText }] : []),
        ] as Array<{key:string;label:string;icon:any;highlight?:boolean}>).map(({ key, label, icon: Icon, highlight }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-cyan-400 text-cyan-300"
                : highlight
                  ? "border-transparent text-amber-400 hover:text-amber-300 animate-pulse"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon size={12} /> {label}
            {highlight && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />}
          </button>
        ))}
      </div>

      {/* ─── SUBMIT TAB ─────────────────────────────────────────────── */}
      {tab === "submit" && (
        <div className="max-w-2xl space-y-4">
          {submitted && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-xs text-green-300 flex items-center gap-2">
              <CheckCircle size={12} /> Idea submitted! Check the My Ideas tab to track its status and GM feedback.
            </div>
          )}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
            <Lightbulb size={12} className="shrink-0 mt-0.5 text-amber-400" />
            <span>Your idea goes into the innovation queue. AI will analyse it for viability and the GM will review and feed back. Track everything — including GM responses — in the <strong>My Ideas</strong> tab.</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Your Name / Role <span className="text-red-400">*</span></label>
              <input value={form.submittedBy} onChange={e => setForm({ ...form, submittedBy: e.target.value })}
                placeholder="e.g. John Smith — Pilot, Dubbo"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600" />
              <p className="text-[10px] text-zinc-600 mt-1">This is how your ideas will be grouped in My Ideas — use the same name each time.</p>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Idea Title <span className="text-red-400">*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Give your idea a clear, descriptive title…"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600" />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={5} placeholder="Describe the idea in detail — what problem does it solve? How would it work? What outcome do you expect?"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600 resize-none" />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Category <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const sel = form.category === cat.value;
                  return (
                    <button key={cat.value} onClick={() => setForm({ ...form, category: cat.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        sel ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-200" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                      }`}>
                      <Icon size={12} className={sel ? "text-cyan-400" : cat.colour} /> {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Primary Impact Area <span className="text-red-400">*</span></label>
              <div className="flex gap-2 flex-wrap">
                {IMPACT_AREAS.map(area => {
                  const sel = form.impactArea === area.toLowerCase();
                  return (
                    <button key={area} onClick={() => setForm({ ...form, impactArea: area.toLowerCase() })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        sel ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-200" : "bg-zinc-800/40 border-zinc-700/50 text-zinc-500 hover:text-zinc-300"
                      }`}>{area}</button>
                  );
                })}
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle size={11} /> {formError}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {submitMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              {submitMutation.isPending ? "Submitting…" : "Submit Idea"}
            </button>
          </div>
        </div>
      )}

      {/* ─── MY IDEAS TAB ───────────────────────────────────────────── */}
      {tab === "mine" && (
        <div className="space-y-4 max-w-2xl">

          {/* Name lookup prompt if no name set */}
          {!form.submittedBy.trim() && (
            <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-3">
              <p className="text-xs text-zinc-400">Enter your name to see your submitted ideas and GM feedback:</p>
              <input value={form.submittedBy} onChange={e => setForm({ ...form, submittedBy: e.target.value })}
                placeholder="Your name / role…"
                className="w-full bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600" />
            </div>
          )}

          {form.submittedBy.trim() && myIdeas.length === 0 && (
            <div className="text-xs text-zinc-500 text-center py-12">
              No ideas found for "{form.submittedBy}" yet.
              <br /><button onClick={() => setTab("submit")} className="text-cyan-400 hover:underline mt-1 block mx-auto">Submit your first idea</button>
            </div>
          )}

          {myIdeas.length > 0 && (
            <>
              <p className="text-xs text-zinc-500">{myIdeas.length} idea{myIdeas.length !== 1 ? "s" : ""} submitted by <span className="text-zinc-300 font-medium">{form.submittedBy}</span></p>
              <div className="space-y-3">
                {myIdeas.map(idea => {
                  const hasGMFeedback = !!idea.gm_note;
                  const isDecision = idea.status === "approved" || idea.status === "declined" || idea.status === "implemented";
                  const cat = CATEGORIES.find(c => c.value === idea.category) ?? CATEGORIES[CATEGORIES.length - 1];
                  const CatIcon = cat.icon;
                  const isOpen = expanded.has(idea.id);
                  const date = new Date(idea.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

                  return (
                    <div key={idea.id} className={`rounded-xl border transition-all ${
                      hasGMFeedback && isDecision
                        ? "bg-zinc-900/60 border-cyan-500/30 shadow-[0_0_0_1px_rgba(6,182,212,0.1)]"
                        : "bg-zinc-900/40 border-zinc-800"
                    }`}>
                      <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => toggleExpand(idea.id)}>
                        <div className="w-9 h-9 shrink-0 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                          <CatIcon size={13} className={cat.colour} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-zinc-200">{idea.title}</span>
                            {statusBadge(idea.status)}
                            {hasGMFeedback && isDecision && (
                              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-amber-500/10 border-amber-500/40 text-amber-300">
                                <MessageSquare size={8} /> GM feedback
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{date}</p>

                          {/* GM feedback preview — always visible without expanding */}
                          {hasGMFeedback && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                              <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold uppercase mb-1">
                                <MessageSquare size={8} /> GM Response
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{idea.gm_note}</p>
                              {idea.gm_reviewed_at && (
                                <p className="text-[9px] text-zinc-600 mt-1">
                                  {new Date(idea.gm_reviewed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {isOpen ? <ChevronUp size={14} className="shrink-0 text-zinc-500 mt-1" /> : <ChevronDown size={14} className="shrink-0 text-zinc-500 mt-1" />}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-zinc-800/60 pt-3 space-y-3">
                          <div>
                            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Your Submission</div>
                            <p className="text-xs text-zinc-300 leading-relaxed">{idea.description}</p>
                          </div>
                          {idea.ai_recommendation && (
                            <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 uppercase tracking-wider font-bold">
                                <Sparkles size={9} /> AI Assessment
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {idea.ai_score !== null && <ScoreRing score={idea.ai_score} />}
                                <div className="flex flex-col gap-1">
                                  {idea.ai_effort && <EffortImpactBadge label="Effort" value={idea.ai_effort} />}
                                  {idea.ai_impact && <EffortImpactBadge label="Impact" value={idea.ai_impact} />}
                                </div>
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{idea.ai_recommendation}</p>
                            </div>
                          )}
                          {!idea.ai_analysed_at && (
                            <p className="text-xs text-zinc-600 italic">AI analysis pending — check back soon.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── ALL IDEAS TAB (GM + Admin) ──────────────────────────────── */}
      {tab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isGM && pendingCount > 0 && (
              <button onClick={() => analyseMutation.mutate()} disabled={analyseMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                {analyseMutation.isPending
                  ? <><RefreshCw size={11} className="animate-spin" /> Analysing {pendingCount} ideas…</>
                  : <><Sparkles size={11} /> Run AI Analysis ({pendingCount} pending)</>}
              </button>
            )}
            {isGM && pendingCount === 0 && ideas.length > 0 && (
              <button onClick={() => analyseMutation.mutate()} disabled={analyseMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50">
                <RefreshCw size={11} className={analyseMutation.isPending ? "animate-spin" : ""} /> Re-analyse All
              </button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Filter size={11} className="text-zinc-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none">
                <option value="all">All Statuses</option>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none">
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="text-xs text-zinc-500 flex items-center gap-2 py-8 justify-center">
              <RefreshCw size={12} className="animate-spin" /> Loading…
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-xs text-zinc-500 text-center py-12">No ideas yet.</div>
          )}

          {!isLoading && filtered.some(i => i.cluster_tag) ? (
            <div className="space-y-5">
              {clustered.map(([cluster, clusterIdeas]) => {
                const avgScore = Math.round(clusterIdeas.reduce((s, i) => s + (i.ai_score ?? 0), 0) / clusterIdeas.length);
                return (
                  <div key={cluster}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-zinc-300">{cluster}</span>
                      <span className="text-[9px] text-zinc-500">{clusterIdeas.length} idea{clusterIdeas.length !== 1 ? "s" : ""}</span>
                      {avgScore > 0 && <span className="text-[9px] font-bold text-cyan-400 ml-auto">avg {avgScore}/100</span>}
                    </div>
                    <div className="space-y-2">
                      {clusterIdeas.sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0)).map(idea => (
                        <IdeaCard key={idea.id} idea={idea} isOpen={expanded.has(idea.id)}
                          onToggle={() => toggleExpand(idea.id)} isGM={isGM}
                          onReview={() => { setGmReviewId(idea.id); setGmStatus(idea.status === "reviewing" ? "approved" : idea.status); setGmNote(idea.gm_note ?? ""); }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(idea => (
                <IdeaCard key={idea.id} idea={idea} isOpen={expanded.has(idea.id)}
                  onToggle={() => toggleExpand(idea.id)} isGM={isGM}
                  onReview={() => { setGmReviewId(idea.id); setGmStatus("approved"); setGmNote(idea.gm_note ?? ""); }} />
              ))}
            </div>
          )}

          {/* GM Review Modal */}
          {isGM && gmReviewId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>GM Review</h3>
                  <button onClick={() => setGmReviewId(null)} className="text-zinc-500 hover:text-zinc-200 p-1"><X size={14} /></button>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Decision</label>
                  <div className="flex gap-2 flex-wrap">
                    {["approved", "declined", "implemented", "reviewing"].map(s => (
                      <button key={s} onClick={() => setGmStatus(s)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          gmStatus === s ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200" : "bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300"
                        }`}>{STATUSES[s]?.label ?? s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">Feedback to staff member</label>
                  <textarea value={gmNote} onChange={e => setGmNote(e.target.value)} rows={4}
                    placeholder="Explain your decision, what happens next, or how the idea could be developed further…"
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 resize-none placeholder:text-zinc-600" />
                  <p className="text-[10px] text-zinc-600 mt-1">Staff will see this note in their My Ideas tab.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reviewMutation.mutate({ id: gmReviewId!, status: gmStatus, gmNote })}
                    disabled={reviewMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold disabled:opacity-50">
                    {reviewMutation.isPending ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                    {reviewMutation.isPending ? "Saving…" : "Save & Send Feedback"}
                  </button>
                  <button onClick={() => setGmReviewId(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 text-xs hover:text-zinc-200">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── GM BRIEF TAB ────────────────────────────────────────────── */}
      {tab === "brief" && isGM && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground flex-1">
              AI generates an executive summary grouped by theme with effort-to-impact rankings and a Top 3 Actions section.
            </p>
            <button onClick={() => briefMutation.mutate()} disabled={briefMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
              {briefMutation.isPending ? <><RefreshCw size={12} className="animate-spin" /> Generating…</> : <><Sparkles size={12} /> Generate GM Brief</>}
            </button>
          </div>

          {briefMutation.isPending && (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
              <RefreshCw size={20} className="animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-xs text-zinc-400">Claude is composing your brief…</p>
            </div>
          )}

          {brief && !briefMutation.isPending && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
                <FileText size={13} className="text-cyan-400" />
                <span className="text-xs font-semibold text-zinc-300">GM Innovation Brief</span>
                <span className="text-[9px] text-zinc-500 ml-auto">{briefCount} ideas · {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="p-5">
                <div className="text-xs text-zinc-300 leading-relaxed space-y-1">
                  {brief.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h2 key={i} className="text-sm font-bold text-zinc-200 mt-4 mb-1">{line.replace("## ", "")}</h2>;
                    if (line.startsWith("### ")) return <h3 key={i} className="text-xs font-semibold text-cyan-300 mt-3 mb-1">{line.replace("### ", "")}</h3>;
                    if (line.startsWith("- ")) return <p key={i} className="pl-3 border-l border-zinc-700 text-zinc-300 my-0.5">{line.replace("- ", "")}</p>;
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="text-zinc-300">{line.replace(/\*\*/g, "")}</p>;
                  })}
                </div>
              </div>
            </div>
          )}

          {!brief && !briefMutation.isPending && (
            <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
              <Sparkles size={20} className="text-zinc-600 mx-auto mb-3" />
              Click Generate to produce an AI-curated executive summary.
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── All-Ideas Card (queue view) ────────────────────────────────────────────
function IdeaCard({ idea, isOpen, onToggle, isGM, onReview }: {
  idea: Idea; isOpen: boolean; onToggle: () => void; isGM: boolean; onReview: () => void;
}) {
  const cat = CATEGORIES.find(c => c.value === idea.category) ?? CATEGORIES[CATEGORIES.length - 1];
  const CatIcon = cat.icon;
  const hasAI = !!idea.ai_analysed_at;
  const date = new Date(idea.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" });

  return (
    <div className="rounded-xl border bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <button className="w-full text-left p-4 flex items-start gap-3" onClick={onToggle}>
        {hasAI && idea.ai_score !== null
          ? <ScoreRing score={idea.ai_score} />
          : <div className="w-10 h-10 shrink-0 rounded-lg bg-zinc-800/50 flex items-center justify-center"><CatIcon size={14} className={cat.colour} /></div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-200 truncate">{idea.title}</span>
            {statusBadge(idea.status)}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{idea.ai_summary ?? idea.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[9px] text-zinc-600">{idea.submitted_by} · {date}</span>
            {hasAI && idea.ai_effort && <EffortImpactBadge label="Effort" value={idea.ai_effort} />}
            {hasAI && idea.ai_impact && <EffortImpactBadge label="Impact" value={idea.ai_impact} />}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {isGM && hasAI && (
            <button onClick={e => { e.stopPropagation(); onReview(); }}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20">
              Review
            </button>
          )}
          {isOpen ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-zinc-800/60 pt-3 space-y-3">
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Original Submission</div>
            <p className="text-xs text-zinc-300 leading-relaxed">{idea.description}</p>
          </div>
          {hasAI && idea.ai_recommendation && (
            <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 uppercase tracking-wider font-bold">
                <Sparkles size={9} /> AI Analysis
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{idea.ai_recommendation}</p>
            </div>
          )}
          {idea.gm_note && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <div className="text-[9px] text-amber-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                <MessageSquare size={8} /> GM Feedback
              </div>
              <p className="text-xs text-zinc-300">{idea.gm_note}</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] flex items-center gap-1 ${cat.colour}`}><CatIcon size={10} /> {cat.label}</span>
            <span className="text-[10px] text-zinc-500">→ {idea.impact_area}</span>
          </div>
        </div>
      )}
    </div>
  );
}
