import { useState } from "react";
import { type UserRole } from "@/lib/data";
import {
  ClipboardCheck, ExternalLink, CheckCircle, Clock, AlertTriangle,
  User, Calendar, FileText, RefreshCw, Download, ChevronRight,
  Plane, TrendingUp, BookOpen, Star, BarChart3, Sparkles,
  Shield, Target, Award, ChevronDown, Plus, Zap, Activity,
  GraduationCap, Eye, Lock
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ─── Jotform forms ────────────────────────────────────────────────────────────
const JOTFORM_FORMS = [
  { id: "jf_precheck",   title: "Pre-Flight Check",            description: "Standardised pre-departure aircraft serviceability check",           formId: "242820000000000", category: "Operations",       frequency: "Every departure",            color: "border-cyan-400/30",   accent: "text-cyan-400",   bg: "bg-cyan-500/10",   icon: <ClipboardCheck size={16} className="text-cyan-400" /> },
  { id: "jf_postflight", title: "Post-Flight Check",           description: "Aircraft condition, defects, and fuel state on arrival",            formId: "242820000000001", category: "Operations",       frequency: "Every arrival",              color: "border-blue-400/30",   accent: "text-blue-400",   bg: "bg-blue-500/10",   icon: <ClipboardCheck size={16} className="text-blue-400" /> },
  { id: "jf_linecheck",  title: "Line Check",                  description: "Captain route & procedural competency assessment in-service",        formId: "242820000000002", category: "Check & Training", frequency: "Annual (per pilot)",         color: "border-green-400/30",  accent: "text-green-400",  bg: "bg-green-500/10",  icon: <CheckCircle size={16} className="text-green-400" /> },
  { id: "jf_profcheck",  title: "Proficiency Check",           description: "Simulator or aircraft IFR, emergency, and abnormal procedures",     formId: "242820000000003", category: "Check & Training", frequency: "6-monthly (CAR 5.99)",       color: "border-purple-400/30", accent: "text-purple-400", bg: "bg-purple-500/10", icon: <CheckCircle size={16} className="text-purple-400" /> },
  { id: "jf_crm",        title: "CRM Training Record",         description: "Crew resource management training completion and assessment",        formId: "242820000000004", category: "Check & Training", frequency: "Annual",                     color: "border-amber-400/30",  accent: "text-amber-400",  bg: "bg-amber-500/10",  icon: <User size={16} className="text-amber-400" /> },
  { id: "jf_medical",    title: "Medical Declaration",         description: "Crew fitness for duty and medical self-declaration",                formId: "242820000000005", category: "Medical",          frequency: "Every duty period",          color: "border-red-400/30",    accent: "text-red-400",    bg: "bg-red-500/10",    icon: <User size={16} className="text-red-400" /> },
  { id: "jf_danger",     title: "Dangerous Goods Declaration", description: "Patient oxygen, medical devices and DG acceptance check",           formId: "242820000000006", category: "Safety",           frequency: "Per mission (as required)",  color: "border-orange-400/30", accent: "text-orange-400", bg: "bg-orange-500/10", icon: <AlertTriangle size={16} className="text-orange-400" /> },
  { id: "jf_ferry",      title: "Ferry Equipment OUT/IN",      description: "Medical equipment removed and reinstated for ferry operations",     formId: "242820000000007", category: "Operations",       frequency: "Every ferry flight",         color: "border-teal-400/30",   accent: "text-teal-400",   bg: "bg-teal-500/10",   icon: <RefreshCw size={16} className="text-teal-400" /> },
];

const RECENT_SUBMISSIONS = [
  { form: "Pre-Flight Check",    pilot: "Capt. R. Hughes",  aircraft: "VH-XYJ",  time: "06:10 today",       status: "ok" },
  { form: "Medical Declaration", pilot: "Capt. R. Hughes",  aircraft: "—",       time: "06:08 today",       status: "ok" },
  { form: "Post-Flight Check",   pilot: "FO M. Carter",     aircraft: "VH-XYR",  time: "05:55 today",       status: "ok" },
  { form: "Pre-Flight Check",    pilot: "Capt. S. Nguyen",  aircraft: "VH-XYU",  time: "05:20 today",       status: "ok" },
  { form: "Proficiency Check",   pilot: "FO J. Walsh",      aircraft: "Sim B200", time: "Yesterday 14:30",  status: "ok" },
  { form: "Dangerous Goods",     pilot: "Dispatcher",       aircraft: "VH-MVX",  time: "Yesterday 09:00",   status: "warn" },
];

const DUE_CHECKS = [
  { pilot: "Capt. R. Hughes",  check: "Proficiency Check (IFR)",  due: "30 Jun 2026", daysLeft: 25, warn: false },
  { pilot: "FO M. Carter",     check: "Line Check",               due: "15 Jun 2026", daysLeft: 10, warn: true  },
  { pilot: "Capt. S. Nguyen",  check: "Medical Class 1 Renewal",  due: "30 Jun 2026", daysLeft: 25, warn: false },
  { pilot: "FO J. Walsh",      check: "CRM Training",             due: "1 Jul 2026",  daysLeft: 26, warn: false },
  { pilot: "Capt. R. Hughes",  check: "NVG Currency",             due: "20 Jun 2026", daysLeft: 15, warn: true  },
];

const CATEGORIES = ["All", "Operations", "Check & Training", "Medical", "Safety"];

// ─── Trainee data ─────────────────────────────────────────────────────────────
interface ApproachEntry {
  date: string;
  aircraft: string;
  airport: string;
  type: string;          // ILS / RNAV / NDB / VOR / Visual / Circling
  conditions: string;    // Day / Night / IMC / VMC
  result: string;        // Full Stop / Touch & Go / Missed / Go Around
  supervisor: string;
  notes: string;
}

interface TraineeRecord {
  id: string;
  name: string;
  rank: string;
  base: string;
  aircraft: string[];
  supervisor: string;
  startDate: string;
  targetDate: string;

  // Hours
  totalHours: number;
  targetHours: number;
  picHours: number;
  dualHours: number;
  instrumentHours: number;
  nightHours: number;
  crossCountryHours: number;

  // Approaches
  totalApproaches: number;
  targetApproaches: number;
  ilsApproaches: number;
  rnavApproaches: number;
  ndbApproaches: number;
  visualApproaches: number;
  nightApproaches: number;

  // Milestones
  milestones: { label: string; done: boolean; date?: string }[];

  // AI assessment
  aiStatus: "On Track" | "Ahead" | "Behind" | "Attention Required";
  aiSummary: string;
  aiRecommendations: string[];

  approachLog: ApproachEntry[];
  status: "Active" | "Pre-Solo" | "Line Training" | "Completed";
  progress: number; // 0–100
}

const TRAINEES: TraineeRecord[] = [
  {
    id: "TR-001",
    name: "F/O Jack Reynolds",
    rank: "First Officer — Trainee",
    base: "Dubbo",
    aircraft: ["B200"],
    supervisor: "Capt. Sarah Mitchell",
    startDate: "3 Feb 2026",
    targetDate: "30 Aug 2026",

    totalHours: 187,
    targetHours: 300,
    picHours: 12,
    dualHours: 175,
    instrumentHours: 41,
    nightHours: 22,
    crossCountryHours: 98,

    totalApproaches: 34,
    targetApproaches: 60,
    ilsApproaches: 14,
    rnavApproaches: 12,
    ndbApproaches: 4,
    visualApproaches: 4,
    nightApproaches: 8,

    milestones: [
      { label: "Aircraft type endorsement completed", done: true,  date: "14 Feb 2026" },
      { label: "First solo B200",                     done: true,  date: "5 Mar 2026"  },
      { label: "IFR rating issued",                   done: true,  date: "1 Apr 2026"  },
      { label: "NVG ground school",                   done: true,  date: "20 Apr 2026" },
      { label: "50 instrument approaches",            done: false },
      { label: "Night currency — 10 night sectors",   done: false },
      { label: "300 total hours reached",             done: false },
      { label: "Line check — final assessment",       done: false },
    ],

    aiStatus: "On Track",
    aiSummary: "F/O Reynolds is progressing at a consistent pace. Instrument hours are tracking well and simulator scores are above average. Night sectors need to increase slightly to meet the target hours before August.",
    aiRecommendations: [
      "Prioritise 3–4 night sectors over the next 4 weeks to meet the 30-night-hour target.",
      "Schedule NDB approach practice — only 4 completed vs 10 recommended.",
      "Recommend a mid-program proficiency check with Capt. Mitchell by end of June.",
    ],

    approachLog: [
      { date: "4 Jun 2026",  aircraft: "VH-XYU", airport: "YSDU", type: "ILS",   conditions: "IMC Night",  result: "Full Stop",   supervisor: "Capt. Mitchell", notes: "Stable approach, good intercept" },
      { date: "4 Jun 2026",  aircraft: "VH-XYU", airport: "YSDU", type: "RNAV",  conditions: "IMC Night",  result: "Full Stop",   supervisor: "Capt. Mitchell", notes: "Minor deviation at FAF — corrected" },
      { date: "1 Jun 2026",  aircraft: "VH-XYJ", airport: "YBHI", type: "ILS",   conditions: "VMC Day",    result: "Touch & Go",  supervisor: "Capt. Clarke",   notes: "Good CRM, comm clear" },
      { date: "28 May 2026", aircraft: "VH-XYJ", airport: "YCBA", type: "RNAV",  conditions: "VMC Day",    result: "Full Stop",   supervisor: "Capt. Clarke",   notes: "Overhead join, traffic conflict resolved well" },
      { date: "25 May 2026", aircraft: "VH-XYU", airport: "YSDU", type: "NDB",   conditions: "IMC Night",  result: "Go Around",   supervisor: "Capt. Mitchell", notes: "Go-around at minima — correct decision, re-briefed" },
      { date: "20 May 2026", aircraft: "VH-XYJ", airport: "YHAY", type: "Visual",conditions: "VMC Night",  result: "Full Stop",   supervisor: "Capt. Clarke",   notes: "Smooth circuit, good lookout" },
    ],

    status: "Line Training",
    progress: 62,
  },
  {
    id: "TR-002",
    name: "F/O Mia Kowalski",
    rank: "First Officer — Trainee",
    base: "Broken Hill",
    aircraft: ["B200", "B350"],
    supervisor: "Capt. Liam Nguyen",
    startDate: "15 Mar 2026",
    targetDate: "15 Nov 2026",

    totalHours: 104,
    targetHours: 300,
    picHours: 6,
    dualHours: 98,
    instrumentHours: 18,
    nightHours: 9,
    crossCountryHours: 54,

    totalApproaches: 19,
    targetApproaches: 60,
    ilsApproaches: 8,
    rnavApproaches: 7,
    ndbApproaches: 2,
    visualApproaches: 2,
    nightApproaches: 3,

    milestones: [
      { label: "Aircraft type endorsement completed", done: true,  date: "28 Mar 2026" },
      { label: "First solo B200",                     done: true,  date: "18 Apr 2026" },
      { label: "IFR rating issued",                   done: false },
      { label: "NVG ground school",                   done: false },
      { label: "50 instrument approaches",            done: false },
      { label: "Night currency — 10 night sectors",   done: false },
      { label: "300 total hours reached",             done: false },
      { label: "Line check — final assessment",       done: false },
    ],

    aiStatus: "Behind",
    aiSummary: "F/O Kowalski's instrument hours are slightly below the projected pace for a November completion. IFR rating is not yet issued — this is the primary blocker. Recommend accelerating simulator sessions.",
    aiRecommendations: [
      "IFR rating is the critical path item — schedule simulator sessions within the next 2 weeks.",
      "Increase instrument flight time — currently 18 hrs, should be ~25 hrs by this point in the program.",
      "Book NVG ground school before end of July to stay on schedule.",
    ],

    approachLog: [
      { date: "3 Jun 2026",  aircraft: "VH-XYR", airport: "YBHI", type: "ILS",  conditions: "VMC Day",   result: "Full Stop",  supervisor: "Capt. Nguyen", notes: "Good briefing, solid ILS" },
      { date: "31 May 2026", aircraft: "VH-XYR", airport: "YBHI", type: "RNAV", conditions: "VMC Day",   result: "Touch & Go", supervisor: "Capt. Nguyen", notes: "Slight high at FAF — corrected well" },
      { date: "28 May 2026", aircraft: "VH-XYR", airport: "YLRD", type: "ILS",  conditions: "IMC Day",   result: "Full Stop",  supervisor: "Capt. Nguyen", notes: "First IMC ILS — excellent for stage" },
      { date: "22 May 2026", aircraft: "VH-XYR", airport: "YBHI", type: "RNAV", conditions: "VMC Night", result: "Full Stop",  supervisor: "Capt. Clarke",  notes: "Night RNAV solid" },
    ],

    status: "Pre-Solo",
    progress: 35,
  },
];

// ─── Approach type colours ────────────────────────────────────────────────────
const APPROACH_COLOR: Record<string, string> = {
  ILS:     "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  RNAV:    "bg-purple-500/20 text-purple-300 border-purple-500/30",
  NDB:     "bg-amber-500/20 text-amber-300 border-amber-500/30",
  VOR:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Visual:  "bg-green-500/20 text-green-300 border-green-500/30",
  Circling:"bg-orange-500/20 text-orange-300 border-orange-500/30",
};

const AI_STATUS_COLOR: Record<string, string> = {
  "On Track": "status-green",
  "Ahead":    "status-blue",
  "Behind":   "status-orange",
  "Attention Required": "status-red",
};

// Supervisor-visible roles
const SUPERVISOR_ROLES: UserRole[] = ["admin", "senior_management", "safety"];
// Check pilots also see this — in demo we treat all as having access for now
function canViewTrainees(role: UserRole) {
  return true; // all roles can view in demo — in production scope to supervisory/check pilots
}

function openJotform(formId: string) {
  window.open(`https://form.jotform.com/${formId}`, "_blank", "noopener");
}

// ─── Mini progress bar ────────────────────────────────────────────────────────
function HoursBar({ value, max, color = "bg-cyan-400" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-14 text-right">{value} / {max}</span>
    </div>
  );
}

// ─── AI assessment card ───────────────────────────────────────────────────────
function AIAssessmentCard({ trainee }: { trainee: TraineeRecord }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card rounded-xl border border-cyan-500/20 overflow-hidden" style={{ background: "rgba(6,182,212,0.03)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <Sparkles size={14} className="text-cyan-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400">AI Assessment</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${AI_STATUS_COLOR[trainee.aiStatus]}`}>
              {trainee.aiStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{trainee.aiSummary}</p>
        </div>
        <ChevronDown size={13} className={`shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-cyan-500/15 pt-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{trainee.aiSummary}</p>
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Recommendations</div>
            {trainee.aiRecommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight size={11} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CheckTraining({ role }: Props) {
  const [activeTab, setActiveTab]               = useState<"forms" | "trainees">("forms");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTrainee, setSelectedTrainee]   = useState<TraineeRecord>(TRAINEES[0]);
  const [traineeTab, setTraineeTab]             = useState<"overview" | "approaches" | "milestones">("overview");
  const [aiGenerating, setAiGenerating]         = useState(false);

  const filtered = selectedCategory === "All"
    ? JOTFORM_FORMS
    : JOTFORM_FORMS.filter(f => f.category === selectedCategory);

  function runAIAnalysis() {
    setAiGenerating(true);
    setTimeout(() => setAiGenerating(false), 2200);
  }

  function downloadTrainingRegister() {
    generatePDF({
      title: "Check & Training Register",
      subtitle: "Crew Currency · Upcoming Checks · Trainee Progress",
      date: new Date().toLocaleDateString("en-AU"),
      reference: "TRAINING-REG-2026",
      sections: [
        {
          heading: "Trainee Progress Summary",
          rows: TRAINEES.map(t => ({
            label: `${t.name} — ${t.status}`,
            value: `${t.totalHours}/${t.targetHours} hrs · ${t.totalApproaches}/${t.targetApproaches} approaches · AI: ${t.aiStatus}`,
          })),
        },
        {
          heading: "Upcoming Due Checks",
          rows: DUE_CHECKS.map(d => ({
            label: `${d.pilot} — ${d.check}`,
            value: `Due ${d.due} (${d.daysLeft} days)${d.warn ? " ⚠ ACTION REQUIRED" : ""}`,
          })),
        },
        {
          heading: "Recent Form Submissions",
          rows: RECENT_SUBMISSIONS.map(s => ({
            label: `${s.form} — ${s.pilot}`,
            value: `${s.aircraft} · ${s.time} · ${s.status === "ok" ? "✓ Complete" : "⚠ Review"}`,
          })),
        },
      ],
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Check &amp; Training
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Jotform integration · Crew currency · AI trainee tracker
          </p>
        </div>
        <button
          onClick={downloadTrainingRegister}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold shrink-0"
        >
          <Download size={12} /> Export PDF
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Forms Today",       value: "6",  sub: "3 pre-flight, 3 post-flight", color: "text-cyan-400"   },
          { label: "Checks This Month", value: "14", sub: "All via Jotform",             color: "text-green-400"  },
          { label: "Trainees Active",   value: `${TRAINEES.length}`, sub: "AI-monitored progress", color: "text-purple-400" },
          { label: "Overdue",           value: "0",  sub: "All crew current",            color: "text-green-400"  },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-card-border p-3 sm:p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5">{s.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab("forms")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "forms"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardCheck size={14} /> Forms &amp; Checks
        </button>
        <button
          onClick={() => setActiveTab("trainees")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "trainees"
              ? "border-purple-400 text-purple-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap size={14} />
          AI Trainee Tracker
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">Supervisory</span>
        </button>
      </div>

      {/* ═══════════════ FORMS TAB ═══════════════ */}
      {activeTab === "forms" && (
        <div className="grid xl:grid-cols-3 gap-6">

          {/* Left/Main: Jotform panels */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-400/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-green-400">Jotform Connected</span>
                <span className="text-muted-foreground ml-1.5">— Forms sync automatically on submission.</span>
              </div>
              <a href="https://www.jotform.com/myaccount/forms" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 shrink-0">
                Open Portal <ExternalLink size={10} />
              </a>
            </div>

            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    selectedCategory === c
                      ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-400"
                      : "bg-card border-card-border text-muted-foreground hover:border-cyan-400/30"
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map(form => (
                <div key={form.id}
                  className={`bg-card rounded-xl border ${form.color} p-4 flex flex-col gap-3 hover:bg-muted/10 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${form.bg} shrink-0`}>{form.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-snug">{form.title}</div>
                      <div className={`text-[10px] font-medium mt-0.5 ${form.accent}`}>{form.category}</div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{form.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-card-border pt-3">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock size={10} /> {form.frequency}
                    </div>
                    <button onClick={() => openJotform(form.formId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 ${form.bg} border ${form.color} ${form.accent} rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity`}>
                      Open Form <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Due checks + recent */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-card-border overflow-hidden">
              <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Upcoming Checks</h2>
                <span className="text-[10px] text-muted-foreground">Next 30 days</span>
              </div>
              <div className="divide-y divide-border">
                {DUE_CHECKS.map((d, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${d.warn ? "text-amber-400" : "text-muted-foreground"}`}>
                      {d.warn ? <AlertTriangle size={13} /> : <Calendar size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{d.pilot}</div>
                      <div className="text-[11px] text-muted-foreground">{d.check}</div>
                      <div className={`text-[10px] font-mono mt-0.5 ${d.warn ? "text-amber-400" : "text-muted-foreground"}`}>
                        Due {d.due} · {d.daysLeft}d
                      </div>
                    </div>
                    {d.warn && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-400/30 text-amber-400 rounded-full shrink-0">Action</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-card-border overflow-hidden">
              <div className="px-4 py-3 border-b border-card-border">
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Recent Submissions</h2>
              </div>
              <div className="divide-y divide-border">
                {RECENT_SUBMISSIONS.map((s, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-2.5">
                    {s.status === "ok"
                      ? <CheckCircle size={13} className="text-green-400 shrink-0" />
                      : <AlertTriangle size={13} className="text-amber-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{s.form}</div>
                      <div className="text-[10px] text-muted-foreground">{s.pilot} · {s.aircraft}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right shrink-0">{s.time}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-card-border">
                <a href="https://www.jotform.com/myaccount/submissions" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  View all in Jotform <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TRAINEE TRACKER TAB ═══════════════ */}
      {activeTab === "trainees" && (
        <div className="space-y-5">

          {/* Supervisory access banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/20" style={{ background: "rgba(168,85,247,0.05)" }}>
            <Eye size={14} className="text-purple-400 shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-purple-400">Supervisory &amp; Check Pilot View</span>
              <span className="text-muted-foreground ml-1.5">— Real-time approach logs, hour progress, and AI analysis. Visible to all Check Pilots and Supervisors.</span>
            </div>
            <button
              onClick={runAIAnalysis}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 text-xs font-semibold transition-all shrink-0 ${
                aiGenerating
                  ? "bg-purple-500/20 text-purple-300 animate-pulse"
                  : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
              }`}
            >
              <Sparkles size={12} />
              {aiGenerating ? "Analysing…" : "Run AI Analysis"}
            </button>
          </div>

          {/* Trainee selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRAINEES.map(t => {
              const pct = Math.round((t.totalHours / t.targetHours) * 100);
              const isSelected = selectedTrainee.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrainee(t)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-purple-500/10 border-purple-400/40"
                      : "bg-card border-card-border hover:border-purple-400/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.rank} · {t.base}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Supervisor: {t.supervisor}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${AI_STATUS_COLOR[t.aiStatus]}`}>{t.aiStatus}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{t.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Hours</span>
                      <span className="font-semibold">{t.totalHours} / {t.targetHours} hrs ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-cyan-400" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Approaches</span>
                      <span className="font-semibold">{t.totalApproaches} / {t.targetApproaches}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-400 transition-all"
                        style={{ width: `${Math.min(100, Math.round((t.totalApproaches / t.targetApproaches) * 100))}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Selected trainee detail ── */}
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            {/* Trainee header */}
            <div className="px-5 py-4 border-b border-card-border flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{selectedTrainee.name}</div>
                <div className="text-xs text-muted-foreground">{selectedTrainee.rank} · {selectedTrainee.base} · Supervisor: {selectedTrainee.supervisor}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>Started {selectedTrainee.startDate}</span>
                <span className="text-muted-foreground">→</span>
                <span>Target {selectedTrainee.targetDate}</span>
              </div>
            </div>

            {/* Sub tabs */}
            <div className="flex border-b border-card-border px-4">
              {(["overview", "approaches", "milestones"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTraineeTab(t)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px capitalize ${
                    traineeTab === t
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "overview" ? "Hours & Progress" : t === "approaches" ? "Approach Log" : "Milestones"}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-5">

              {/* ── OVERVIEW ── */}
              {traineeTab === "overview" && (
                <>
                  {/* AI assessment */}
                  <AIAssessmentCard trainee={selectedTrainee} />

                  {/* Hours grid */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock size={12} /> Flight Hours Breakdown
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Left col */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">Total Hours</span>
                            <span className={`font-bold ${selectedTrainee.totalHours / selectedTrainee.targetHours >= 0.8 ? "text-green-400" : "text-cyan-400"}`}>
                              {selectedTrainee.totalHours} / {selectedTrainee.targetHours}
                            </span>
                          </div>
                          <HoursBar value={selectedTrainee.totalHours} max={selectedTrainee.targetHours} color="bg-cyan-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">PIC Hours</span>
                          </div>
                          <HoursBar value={selectedTrainee.picHours} max={50} color="bg-green-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Dual Hours</span>
                          </div>
                          <HoursBar value={selectedTrainee.dualHours} max={250} color="bg-blue-400" />
                        </div>
                      </div>
                      {/* Right col */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Instrument (IFR)</span>
                          </div>
                          <HoursBar value={selectedTrainee.instrumentHours} max={80} color="bg-purple-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Night Hours</span>
                          </div>
                          <HoursBar value={selectedTrainee.nightHours} max={30} color="bg-indigo-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Cross Country</span>
                          </div>
                          <HoursBar value={selectedTrainee.crossCountryHours} max={150} color="bg-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approaches summary */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <Target size={12} /> Approach Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: "ILS",           value: selectedTrainee.ilsApproaches,   target: 20, color: "text-cyan-400"   },
                        { label: "RNAV",          value: selectedTrainee.rnavApproaches,  target: 20, color: "text-purple-400" },
                        { label: "NDB",           value: selectedTrainee.ndbApproaches,   target: 10, color: "text-amber-400"  },
                        { label: "Visual",        value: selectedTrainee.visualApproaches,target: 5,  color: "text-green-400"  },
                        { label: "Night",         value: selectedTrainee.nightApproaches, target: 10, color: "text-indigo-400" },
                        { label: "Total",         value: selectedTrainee.totalApproaches, target: selectedTrainee.targetApproaches, color: "text-foreground" },
                      ].map(a => (
                        <div key={a.label} className="bg-muted/20 rounded-xl p-3 border border-card-border">
                          <div className={`text-xl font-bold ${a.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{a.value}</div>
                          <div className="text-[10px] text-muted-foreground">{a.label}</div>
                          <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${a.color.replace("text-", "bg-").replace("/400", "/40")}`}
                              style={{ width: `${Math.min(100, Math.round((a.value / a.target) * 100))}%`, background: "currentColor" }}
                            />
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">of {a.target} target</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── APPROACH LOG ── */}
              {traineeTab === "approaches" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Plane size={12} /> Approach Log — {selectedTrainee.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">{selectedTrainee.approachLog.length} entries shown</span>
                  </div>

                  {/* Mobile cards / Desktop table */}
                  <div className="sm:hidden space-y-2">
                    {selectedTrainee.approachLog.map((a, i) => (
                      <div key={i} className="bg-muted/20 rounded-xl border border-card-border p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="text-xs font-bold">{a.airport} <span className="text-cyan-400 font-mono">{a.aircraft}</span></div>
                            <div className="text-[10px] text-muted-foreground">{a.date} · {a.supervisor}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${APPROACH_COLOR[a.type] || "bg-muted text-muted-foreground border-border"}`}>{a.type}</span>
                            <span className="text-[9px] text-muted-foreground">{a.conditions}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${a.result === "Full Stop" ? "status-green" : a.result === "Touch & Go" ? "status-blue" : "status-orange"}`}>{a.result}</span>
                          <span className="text-[10px] text-muted-foreground italic">{a.notes}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-card-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Aircraft</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Airport</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Conditions</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Result</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Supervisor</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrainee.approachLog.map((a, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
                            <td className="px-4 py-3 font-bold text-cyan-400 font-mono">{a.aircraft}</td>
                            <td className="px-4 py-3 font-semibold">{a.airport}</td>
                            <td className="px-4 py-3">
                              <span className={`px-1.5 py-0.5 rounded-full border font-semibold text-[9px] ${APPROACH_COLOR[a.type] || "bg-muted text-muted-foreground border-border"}`}>{a.type}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{a.conditions}</td>
                            <td className="px-4 py-3">
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${a.result === "Full Stop" ? "status-green" : a.result === "Touch & Go" ? "status-blue" : "status-orange"}`}>{a.result}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{a.supervisor}</td>
                            <td className="px-4 py-3 text-muted-foreground italic max-w-[200px] truncate">{a.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── MILESTONES ── */}
              {traineeTab === "milestones" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Award size={12} /> Training Milestones
                  </h3>
                  <div className="space-y-2">
                    {selectedTrainee.milestones.map((m, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          m.done
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-card border-card-border"
                        }`}
                      >
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${m.done ? "bg-green-500" : "bg-muted border border-border"}`}>
                          {m.done
                            ? <CheckCircle size={13} className="text-white" />
                            : <span className="text-[10px] text-muted-foreground font-bold">{i + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold ${m.done ? "text-muted-foreground line-through" : ""}`}>{m.label}</span>
                        </div>
                        {m.done && m.date && (
                          <span className="text-[10px] text-green-400 font-mono shrink-0">{m.date} ✓</span>
                        )}
                        {!m.done && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground border border-border shrink-0">Pending</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Overall milestone progress */}
                  <div className="pt-2 border-t border-card-border flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Milestone completion</span>
                        <span className="font-semibold">{selectedTrainee.milestones.filter(m => m.done).length} / {selectedTrainee.milestones.length}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-400 transition-all"
                          style={{ width: `${Math.round((selectedTrainee.milestones.filter(m => m.done).length / selectedTrainee.milestones.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                      {Math.round((selectedTrainee.milestones.filter(m => m.done).length / selectedTrainee.milestones.length) * 100)}%
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
