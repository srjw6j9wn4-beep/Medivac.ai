import { useState, useRef } from "react";
import { CheckCircle, AlertTriangle, Clock, XCircle, ChevronDown, ChevronRight, FileCheck, Shield, Activity, BarChart2, ArrowRight, Play, Pause } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "complete" | "in-progress" | "gap" | "not-started";
type RiskLevel = "Low" | "Medium" | "High" | "Critical";

interface Clause {
  id: string;
  title: string;
  status: Status;
  score: number;         // 0–100
  evidence: string[];
  notes?: string;
}

interface Standard {
  id: string;
  name: string;
  shortName: string;
  scope: string;
  overallScore: number;
  clauses: Clause[];
  color: string;
  accentColor: string;
}

interface CAPA {
  id: string;
  ref: string;
  description: string;
  standard: string;
  clause: string;
  raised: string;
  due: string;
  owner: string;
  status: "Open" | "In Progress" | "Closed" | "Overdue";
  risk: RiskLevel;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ISO_9001: Standard = {
  id: "9001",
  name: "ISO 9001:2015",
  shortName: "ISO 9001",
  scope: "Quality Management System — Aeromedical Operations & Ground Support",
  overallScore: 74,
  color: "from-cyan-900/40 to-slate-900/60",
  accentColor: "cyan",
  clauses: [
    { id: "4", title: "Context of the Organisation", status: "complete", score: 92,
      evidence: ["Stakeholder register v2.1", "Scope document signed 14 Mar 2026", "SWOT analysis Q1 2026"],
      notes: "Internal/external issues register reviewed quarterly." },
    { id: "5", title: "Leadership", status: "complete", score: 88,
      evidence: ["Quality Policy signed by CEO 1 Jan 2026", "Management review minutes Mar 2026", "Org chart v5.2"],
      notes: "Top management commitment documented. Quality objectives cascaded to department level." },
    { id: "6", title: "Planning", status: "in-progress", score: 71,
      evidence: ["Risk register v3.0", "Quality objectives tracker"],
      notes: "Opportunity register incomplete — action assigned to Operations Director." },
    { id: "7", title: "Support (Resources, Competence, Awareness)", status: "in-progress", score: 68,
      evidence: ["Training matrix v4", "Competency records (partial)", "Communication plan draft"],
      notes: "Competency records for 3 flight nurses outstanding. Document control SOP under review." },
    { id: "8", title: "Operations", status: "in-progress", score: 70,
      evidence: ["SOPs library (42 active)", "Mission acceptance checklist", "Dispatch release procedure"],
      notes: "Customer communication procedure needs update for NEPT referral pathway." },
    { id: "9", title: "Performance Evaluation", status: "gap", score: 45,
      evidence: ["KPI dashboard (draft)", "1 internal audit completed"],
      notes: "Internal audit programme incomplete — only 1 of 4 planned audits done. Customer satisfaction survey not yet deployed." },
    { id: "10", title: "Improvement (CAPA)", status: "in-progress", score: 62,
      evidence: ["CAPA register v2", "NCR log"],
      notes: "3 open CAPAs from last audit cycle. Corrective action effectiveness reviews pending." },
  ],
};

const ISO_13485: Standard = {
  id: "13485",
  name: "ISO 13485:2016",
  shortName: "ISO 13485",
  scope: "Medical Device QMS — Aeromedical Equipment, Life Support & Patient Care Devices",
  overallScore: 58,
  color: "from-purple-900/40 to-slate-900/60",
  accentColor: "purple",
  clauses: [
    { id: "4", title: "Quality Management System", status: "in-progress", score: 65,
      evidence: ["QMS manual draft v1.2", "Document control procedure"],
      notes: "Risk management file (ISO 14971) not yet linked to QMS. Product lifecycle records framework in progress." },
    { id: "5", title: "Management Responsibility", status: "in-progress", score: 72,
      evidence: ["Management review template", "Quality policy (medical device scope)"],
      notes: "Medical device-specific quality policy drafted, pending Board approval." },
    { id: "6", title: "Resource Management", status: "gap", score: 48,
      evidence: ["Maintenance records (partial)", "LAME competency register"],
      notes: "Infrastructure maintenance schedule for life-support equipment not formalised. Work environment controls for device storage need documenting." },
    { id: "7", title: "Product Realisation", status: "in-progress", score: 60,
      evidence: ["Device procurement SOP", "Supplier qualification list (partial)", "Design change control template"],
      notes: "Supplier evaluation incomplete — 4 critical suppliers awaiting qualification. Sterile barrier validation outstanding for patient contact equipment." },
    { id: "8", title: "Measurement, Analysis & Improvement", status: "gap", score: 38,
      evidence: ["NCR log (2 open)", "Feedback register started"],
      notes: "No formal device vigilance procedure. Post-market surveillance plan not started. Statistical techniques for process monitoring not defined." },
  ],
};

const CAPAS: CAPA[] = [
  { id: "CAPA-001", ref: "NCR-2026-003", description: "Internal audit programme not completed per schedule — 3 audits outstanding Q1", standard: "ISO 9001", clause: "9.2", raised: "15 Mar 2026", due: "30 Jun 2026", owner: "Operations Director", status: "In Progress", risk: "High" },
  { id: "CAPA-002", ref: "NCR-2026-004", description: "Competency records missing for 3 flight nurses — training sign-off not filed", standard: "ISO 9001", clause: "7.2", raised: "20 Mar 2026", due: "15 Jun 2026", owner: "Clinical Lead", status: "Overdue", risk: "High" },
  { id: "CAPA-003", ref: "NCR-2026-005", description: "Life-support equipment maintenance schedule not documented to ISO 13485 §6.3", standard: "ISO 13485", clause: "6.3", raised: "1 Apr 2026", due: "31 Jul 2026", owner: "Chief Engineer (LAME)", status: "Open", risk: "Critical" },
  { id: "CAPA-004", ref: "NCR-2026-006", description: "Supplier qualification incomplete for 4 critical device suppliers", standard: "ISO 13485", clause: "7.4", raised: "10 Apr 2026", due: "31 Aug 2026", owner: "Procurement", status: "In Progress", risk: "Medium" },
  { id: "CAPA-005", ref: "OBS-2026-001", description: "Customer satisfaction survey not yet deployed for NEPT referral pathway", standard: "ISO 9001", clause: "9.1.2", raised: "5 May 2026", due: "31 Jul 2026", owner: "Operations Director", status: "Open", risk: "Low" },
];

const CRITICAL_PATH = [
  { phase: "Phase 1", label: "QMS Documentation Complete", due: "30 Jun 2026", status: "in-progress", items: ["Competency records filed", "Internal audit programme completed", "Risk register finalised"] },
  { phase: "Phase 2", label: "ISO 13485 Gap Closure", due: "31 Aug 2026", status: "not-started", items: ["Life-support maintenance schedule", "Supplier qualification (4 suppliers)", "Device vigilance procedure", "Sterile barrier validation"] },
  { phase: "Phase 3", label: "Pre-Certification Audit (Stage 1)", due: "30 Sep 2026", status: "not-started", items: ["External consultant review", "Document readiness check", "Corrective action closure verified"] },
  { phase: "Phase 4", label: "Certification Audit (Stage 2)", due: "30 Nov 2026", status: "not-started", items: ["ISO 9001 certification audit", "ISO 13485 certification audit", "Surveillance audit planning"] },
];

// ─── Helper components ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status | CAPA["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    "complete":     { label: "Complete",     cls: "bg-green-400/10 text-green-400 border-green-400/30" },
    "in-progress":  { label: "In Progress",  cls: "bg-cyan-400/10 text-cyan-400 border-cyan-400/30" },
    "gap":          { label: "Gap",          cls: "bg-orange-400/10 text-orange-400 border-orange-400/30" },
    "not-started":  { label: "Not Started",  cls: "bg-muted/50 text-muted-foreground border-card-border" },
    "Open":         { label: "Open",         cls: "bg-orange-400/10 text-orange-400 border-orange-400/30" },
    "In Progress":  { label: "In Progress",  cls: "bg-cyan-400/10 text-cyan-400 border-cyan-400/30" },
    "Closed":       { label: "Closed",       cls: "bg-green-400/10 text-green-400 border-green-400/30" },
    "Overdue":      { label: "Overdue",      cls: "bg-red-400/10 text-red-400 border-red-400/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted/50 text-muted-foreground border-card-border" };
  return <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>;
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map: Record<RiskLevel, string> = {
    Low:      "bg-green-400/10 text-green-400 border-green-400/30",
    Medium:   "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    High:     "bg-orange-400/10 text-orange-400 border-orange-400/30",
    Critical: "bg-red-400/10 text-red-400 border-red-400/30",
  };
  return <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${map[risk]}`}>{risk}</span>;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const strokeColor = score >= 80 ? "#34d399" : score >= 60 ? "#22d3ee" : score >= 40 ? "#fb923c" : "#f87171";
  return (
    <svg width={72} height={72} className="shrink-0">
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={strokeColor} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 36 36)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={36} y={36} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={14} fontWeight="bold">{score}</text>
    </svg>
  );
}

function ClauseRow({ clause }: { clause: Clause }) {
  const [open, setOpen] = useState(false);
  const barColor = clause.score >= 80 ? "bg-green-400" : clause.score >= 60 ? "bg-cyan-400" : clause.score >= 40 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
        <span className="text-[10px] font-mono text-muted-foreground w-6 shrink-0">§{clause.id}</span>
        <span className="flex-1 text-xs font-medium">{clause.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${clause.score}%` }} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground w-6 text-right">{clause.score}%</span>
          <StatusBadge status={clause.status} />
          {open ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-card-border bg-white/[0.01] space-y-2">
          {clause.notes && <p className="text-[11px] text-muted-foreground leading-relaxed">{clause.notes}</p>}
          <div>
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Evidence on file</p>
            <div className="flex flex-wrap gap-1.5">
              {clause.evidence.map((e, i) => (
                <span key={i} className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-green-400/5 border border-green-400/20 text-green-400/80 rounded-full">
                  <FileCheck size={8} /> {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ISOCompliance() {
  const [activeTab, setActiveTab] = useState<"overview" | "9001" | "13485" | "capa" | "path">("overview");

  // ── ISO video player state ──
  const isoVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isoPlaying, setIsoPlaying] = useState(false);
  const [isoProgress, setIsoProgress] = useState(0);
  const [isoCurrentTime, setIsoCurrentTime] = useState("0:00");
  const [isoTotalTime, setIsoTotalTime] = useState("0:00");

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  function handleIsoPlay() {
    const v = isoVideoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  function handleIsoProgress(e: React.MouseEvent<HTMLDivElement>) {
    const v = isoVideoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "9001",     label: "ISO 9001:2015" },
    { id: "13485",    label: "ISO 13485:2016" },
    { id: "capa",     label: "CAPA Register" },
    { id: "path",     label: "Critical Path" },
  ] as const;

  const openCAPAs    = CAPAS.filter(c => c.status !== "Closed");
  const overdueCAPAs = CAPAS.filter(c => c.status === "Overdue");
  const criticalCAPAs = CAPAS.filter(c => c.risk === "Critical");

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            ISO Compliance Control Centre
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ISO 9001:2015 · ISO 13485:2016 · Certification readiness · CAPA tracking · Evidence register
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400/5 border border-cyan-400/20 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-semibold">Live readiness tracking</span>
          </div>
        </div>
      </div>

      {/* Alert banner — overdue CAPAs */}
      {overdueCAPAs.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/5 border border-red-400/30 rounded-xl">
          <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400">
              {overdueCAPAs.length} overdue CAPA{overdueCAPAs.length > 1 ? "s" : ""} — immediate action required
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {overdueCAPAs.map(c => `${c.id} (${c.ref})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* ── ISO Compliance Video ── */}
      <div className="bg-card rounded-2xl border border-amber-400/30 overflow-hidden">
        {/* Banner header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-900/40 to-slate-900/60 border-b border-amber-400/20">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
            <span className="text-lg">🏅</span>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>ISO Compliance — Jennifer Overview</h2>
            <p className="text-[10px] text-muted-foreground">ISO 9001:2015 · ISO 13485:2016 · Certification readiness walkthrough · 1:16</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-amber-400 font-semibold">Jennifer Presents</span>
          </div>
        </div>

        {/* Video player */}
        <div className="relative w-full bg-[#0a1628]" style={{ aspectRatio: '16/9', backgroundImage: 'url(/aeromedical_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Isolated layer — screen blend composites against backdrop only, not UI overlays */}
          <div className="absolute inset-0" style={{ isolation: 'isolate' }}>
          <video
            ref={isoVideoRef}
            className="w-full h-full object-cover"
            style={{ mixBlendMode: "screen" }}
            playsInline
            preload="auto"
            src="/video/07_iso.mp4"
            onTimeUpdate={() => {
              const v = isoVideoRef.current;
              if (!v || !v.duration) return;
              setIsoProgress((v.currentTime / v.duration) * 100);
              setIsoCurrentTime(fmtTime(v.currentTime));
            }}
            onLoadedMetadata={() => {
              const v = isoVideoRef.current;
              if (v) setIsoTotalTime(fmtTime(v.duration));
            }}
            onPlay={() => setIsoPlaying(true)}
            onPause={() => setIsoPlaying(false)}
            onEnded={() => { setIsoPlaying(false); setIsoProgress(100); }}
          />
          </div>{/* end isolation layer */}

          {/* Pre-play overlay */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-black/40 to-black/70 transition-opacity duration-500 ${
            isoPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}>
            <div className="text-5xl">🏅</div>
            <div className="text-lg font-bold text-white text-center px-8" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              ISO Compliance Control Centre
            </div>
            <p className="text-sm text-white/70 max-w-sm text-center px-8 leading-relaxed">
              Jennifer walks through ISO 9001 &amp; 13485 certification readiness, clause scoring, CAPA register, and the November 2026 critical path.
            </p>
            <button
              onClick={handleIsoPlay}
              className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black text-sm font-bold rounded-full transition-colors shadow-lg shadow-amber-400/30"
            >
              <Play size={16} className="ml-0.5" />
              Play — Jennifer Presents
            </button>
          </div>

          {/* Section badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 rounded-full text-[10px] font-semibold text-amber-400 border border-amber-400/20">
            Compliance
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 rounded-full text-[10px] text-white/70">
            {isoCurrentTime} / {isoTotalTime || "1:16"}
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 pt-3">
          <div
            className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-3 cursor-pointer"
            onClick={handleIsoProgress}
          >
            <div className="h-full bg-amber-400 rounded-full transition-none" style={{ width: `${isoProgress}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleIsoPlay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
            >
              {isoPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isoPlaying ? "Pause" : "Play"}
            </button>
            <span className="text-[10px] text-muted-foreground ml-auto">ISO 9001:2015 · ISO 13485:2016</span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-card border border-card-border rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === t.id
                ? "bg-cyan-400/15 text-cyan-400 border border-cyan-400/30"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-5">

          {/* Score cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "ISO 9001 Readiness", score: ISO_9001.overallScore,  sub: "QMS — 7 clauses",             icon: <Shield size={16} /> },
              { label: "ISO 13485 Readiness", score: ISO_13485.overallScore, sub: "Medical Device QMS — 5 clauses", icon: <Activity size={16} /> },
              { label: "Open CAPAs",   score: null, count: openCAPAs.length,    sub: `${overdueCAPAs.length} overdue`, icon: <AlertTriangle size={16} />, warn: overdueCAPAs.length > 0 },
              { label: "Critical Risks", score: null, count: criticalCAPAs.length, sub: "Require immediate closure", icon: <XCircle size={16} />, warn: criticalCAPAs.length > 0 },
            ].map((c, i) => (
              <div key={i} className={`bg-card border rounded-2xl p-5 flex items-center gap-4 ${c.warn ? "border-red-400/30" : "border-card-border"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.warn ? "bg-red-400/10 text-red-400" : "bg-cyan-400/10 text-cyan-400"}`}>
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    {c.score !== null && c.score !== undefined ? `${c.score}%` : c.count}
                  </p>
                  <p className={`text-[10px] ${c.warn ? "text-red-400" : "text-muted-foreground"}`}>{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Standards summary side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[ISO_9001, ISO_13485].map(std => (
              <div key={std.id} className={`bg-gradient-to-br ${std.color} border border-card-border rounded-2xl p-5`}>
                <div className="flex items-center gap-4 mb-4">
                  <ScoreRing score={std.overallScore} color={std.accentColor} />
                  <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{std.name}</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{std.scope}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {std.clauses.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-5">§{c.id}</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          c.score >= 80 ? "bg-green-400" : c.score >= 60 ? "bg-cyan-400" : c.score >= 40 ? "bg-orange-400" : "bg-red-400"
                        }`} style={{ width: `${c.score}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-6 text-right">{c.score}%</span>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab(std.id as any)}
                  className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  View full clause detail <ArrowRight size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Recent CAPAs snapshot */}
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-orange-400" />
                <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Active CAPAs</span>
              </div>
              <button onClick={() => setActiveTab("capa")} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                Full register <ArrowRight size={10} />
              </button>
            </div>
            <div className="space-y-2">
              {openCAPAs.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-background/60 border border-card-border rounded-xl">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-cyan-300">{c.id}</span>
                      <span className="text-[9px] text-muted-foreground">{c.standard} §{c.clause}</span>
                      <RiskBadge risk={c.risk} />
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-snug">{c.description}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <StatusBadge status={c.status} />
                    <p className="text-[9px] text-muted-foreground">Due {c.due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ISO 9001 / 13485 CLAUSE TAB ── */}
      {(activeTab === "9001" || activeTab === "13485") && (() => {
        const std = activeTab === "9001" ? ISO_9001 : ISO_13485;
        return (
          <div className="space-y-4">
            <div className={`bg-gradient-to-br ${std.color} border border-card-border rounded-2xl p-5 flex items-center gap-5`}>
              <ScoreRing score={std.overallScore} color={std.accentColor} />
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{std.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{std.scope}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {std.clauses.filter(c => c.status === "complete").length} complete ·{" "}
                  {std.clauses.filter(c => c.status === "in-progress").length} in progress ·{" "}
                  {std.clauses.filter(c => c.status === "gap").length} gaps identified
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {std.clauses.map(c => <ClauseRow key={c.id} clause={c} />)}
            </div>
          </div>
        );
      })()}

      {/* ── CAPA REGISTER TAB ── */}
      {activeTab === "capa" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["Open","In Progress","Overdue","Closed"] as CAPA["status"][]).map(s => {
              const count = CAPAS.filter(c => c.status === s).length;
              const colors: Record<string, string> = {
                Open: "text-orange-400", "In Progress": "text-cyan-400", Overdue: "text-red-400", Closed: "text-green-400"
              };
              return (
                <div key={s} className="bg-card border border-card-border rounded-xl px-4 py-3 text-center">
                  <p className={`text-2xl font-bold ${colors[s]}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{count}</p>
                  <p className="text-[10px] text-muted-foreground">{s}</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {CAPAS.map(c => (
              <div key={c.id} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-cyan-300">{c.id}</span>
                      <span className="text-[9px] text-muted-foreground bg-background border border-card-border px-1.5 py-px rounded-full">{c.ref}</span>
                      <span className="text-[9px] text-muted-foreground">{c.standard} §{c.clause}</span>
                      <RiskBadge risk={c.risk} />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-foreground/90 leading-snug mb-2">{c.description}</p>
                    <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
                      <span>Owner: <span className="text-foreground/70">{c.owner}</span></span>
                      <span>Raised: <span className="text-foreground/70">{c.raised}</span></span>
                      <span className={c.status === "Overdue" ? "text-red-400" : ""}>
                        Due: <span className="font-semibold">{c.due}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CRITICAL PATH TAB ── */}
      {activeTab === "path" && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Certification Critical Path</h2>
            <p className="text-[11px] text-muted-foreground mb-5">Target: ISO 9001 + ISO 13485 dual certification by 30 November 2026</p>
            <div className="space-y-3">
              {CRITICAL_PATH.map((phase, i) => {
                const isActive = phase.status === "in-progress";
                const isDone = phase.status === "complete";
                return (
                  <div key={i} className={`relative border rounded-xl p-4 ${isActive ? "border-cyan-400/40 bg-cyan-400/5" : isDone ? "border-green-400/40 bg-green-400/5" : "border-card-border"}`}>
                    {/* connector line */}
                    {i < CRITICAL_PATH.length - 1 && (
                      <div className="absolute left-7 -bottom-3 w-px h-3 bg-card-border" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isDone ? "bg-green-400/20 text-green-400 border border-green-400/30" :
                        isActive ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30" :
                        "bg-muted/30 text-muted-foreground border border-card-border"
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                          <div>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">{phase.phase}</span>
                            <h3 className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{phase.label}</h3>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Clock size={10} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Due {phase.due}</span>
                            <StatusBadge status={phase.status as Status} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {phase.items.map((item, j) => (
                            <span key={j} className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border ${
                              isDone ? "bg-green-400/5 border-green-400/20 text-green-400/80" :
                              isActive ? "bg-cyan-400/5 border-cyan-400/20 text-cyan-400/80" :
                              "bg-background border-card-border text-muted-foreground"
                            }`}>
                              {isDone ? <CheckCircle size={8} /> : isActive ? <Clock size={8} /> : <div className="w-1.5 h-1.5 rounded-full border border-current opacity-50" />}
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certification target */}
          <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-400/20 rounded-2xl p-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
              <Shield size={28} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold mb-0.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                Target: Dual Certification — November 2026
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ISO 9001:2015 (QMS) + ISO 13485:2016 (Medical Device QMS) · Certification body: TÜV SÜD / SAI Global · Surveillance audit cycle: 12 months
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
