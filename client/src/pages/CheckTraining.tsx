import { useState, useEffect, useRef } from "react";
import { type UserRole } from "@/lib/data";
import {
  ClipboardCheck, ExternalLink, CheckCircle, Clock, AlertTriangle,
  User, Calendar, FileText, RefreshCw, Download, ChevronRight,
  Plane, TrendingUp, BookOpen, Star, BarChart3, Sparkles,
  Shield, Target, Award, ChevronDown, Plus, Zap, Activity,
  GraduationCap, Eye, Lock, UserCheck, AlertCircle, CheckSquare,
  XCircle, ClipboardList, X, Copy, BookMarked, Brain, Trophy,
  ChevronLeft, RotateCcw, CheckCircle2, Timer
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";
import { EXAMS, PASS_MARK, EXAM_DURATION_MINUTES, type Exam, type ExamQuestion } from "@/data/theoryExams";
import { EXAMS_B350 } from "@/data/theoryExamsB350";
import { EXAMS_OPS } from "@/data/theoryExamsOps";
import { EXAMS_B200_SYSTEMS } from "@/data/theoryExamsB200Systems";
import { EXAMS_B350_SYSTEMS } from "@/data/theoryExamsB350Systems";
import { EXAMS_IFR } from "@/data/theoryExamsIFR";

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

// ─── Ops Staff Training Matrix ─────────────────────────────────────────────────
interface OpsStaffMember {
  id: string;
  name: string;
  role: string;
  base: string;
  startDate: string;
  completedDate?: string;   // ISO date when all modules signed off
  renewalDue?: string;      // ISO date — completedDate + 24 months
}

type CellStatus = "not-started" | "in-progress" | "complete" | "gap";

interface TrainingModule {
  id: string;
  title: string;
}

interface TrainingWeek {
  id: string;
  label: string;
  modules: TrainingModule[];
}

interface GapNote {
  moduleId: string;
  notes: string;
}

interface WeekSignOff {
  weekId: string;
  assessor: string;
  date: string;             // ISO date of sign-off
}

// ─── 24-month renewal helpers ─────────────────────────────────────────────────
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function renewalStatus(renewalDue?: string): "current" | "due-soon" | "overdue" | "none" {
  if (!renewalDue) return "none";
  const today = new Date();
  const due   = new Date(renewalDue);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0)   return "overdue";
  if (diffDays <= 90) return "due-soon";
  return "current";
}
function formatRenewalDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

const OPS_STAFF_DEFAULT: OpsStaffMember[] = [
  { id: "s1", name: "Sarah Mitchell", role: "Team Lead",   base: "Dubbo",       startDate: "2026-06-02" },
  { id: "s2", name: "James Okafor",   role: "Dispatcher",  base: "Broken Hill", startDate: "2026-06-02" },
  { id: "s3", name: "Priya Sharma",   role: "Dispatcher",  base: "Bankstown",   startDate: "2026-06-09" },
  { id: "s4", name: "Tom Harding",    role: "Coordinator", base: "Essendon",    startDate: "2026-06-16" },
  { id: "s5", name: "Chloe Nguyen",   role: "Coordinator", base: "Launceston",  startDate: "2026-06-16" },
];

const TRAINING_PROGRAM: TrainingWeek[] = [
  {
    id: "w1",
    label: "Week 1 — Foundations & Reporting",
    modules: [
      { id: "w1m1", title: "Introduction to RFDS SE Operations" },
      { id: "w1m2", title: "Medivac.ai Platform Overview" },
      { id: "w1m3", title: "Mission Reporting Fundamentals" },
      { id: "w1m4", title: "Incident & ASR Reporting Procedures" },
      { id: "w1m5", title: "Documentation Standards & Compliance" },
    ],
  },
  {
    id: "w2",
    label: "Week 2 — Invoicing & Finance",
    modules: [
      { id: "w2m1", title: "Mission Cost Capture" },
      { id: "w2m2", title: "NEPT Invoice Processing" },
      { id: "w2m3", title: "Private Charter Billing" },
      { id: "w2m4", title: "Medicare/DVA Claim Procedures" },
      { id: "w2m5", title: "Financial Reconciliation Basics" },
    ],
  },
  {
    id: "w3",
    label: "Week 3 — Team Lead Skills",
    modules: [
      { id: "w3m1", title: "Crew Briefing Protocols" },
      { id: "w3m2", title: "Shift Handover Procedures" },
      { id: "w3m3", title: "Conflict Resolution & Escalation" },
      { id: "w3m4", title: "Performance Monitoring Basics" },
      { id: "w3m5", title: "Fatigue Risk Management Overview" },
    ],
  },
  {
    id: "w4",
    label: "Week 4 — Competency & Integration",
    modules: [
      { id: "w4m1", title: "End-to-End Mission Coordination" },
      { id: "w4m2", title: "Multi-Base Communication" },
      { id: "w4m3", title: "Emergency Protocols & Decision Making" },
      { id: "w4m4", title: "System Integration Assessment" },
      { id: "w4m5", title: "Final Competency Sign-Off" },
    ],
  },
  {
    id: "w5",
    label: "Week 5 — Special Missions Training & Checks",
    modules: [
      { id: "w5m1",  title: "Neonatal & Paediatric Transport Protocols" },
      { id: "w5m2",  title: "Mental Health & Psychiatric Transfer Procedures" },
      { id: "w5m3",  title: "Bariatric Patient Handling & Equipment" },
      { id: "w5m4",  title: "Organ Retrieval Mission Coordination" },
      { id: "w5m5",  title: "Remote Area & Aeromedical Retrieval" },
      { id: "w5m6",  title: "Search & Rescue (SAR) Support Operations" },
      { id: "w5m7",  title: "Infectious Disease / Isolation Transport" },
      { id: "w5m8",  title: "Disaster & Mass Casualty Response" },
      { id: "w5m9",  title: "Repatriation & International Transfer" },
      { id: "w5m10", title: "Special Mission Sign-Off & Competency Check" },
    ],
  },
];

const ALL_MODULES: TrainingModule[] = TRAINING_PROGRAM.flatMap(w => w.modules);
const TOTAL_MODULES = ALL_MODULES.length; // 30
const WEEK5_MODULE_IDS = TRAINING_PROGRAM.find(w => w.id === "w5")!.modules.map(m => m.id);

// ─── High-Risk Task Competency — Infrequent Emergency Procedures ───────────────
const HIGH_RISK_MODULES: TrainingModule[] = [
  { id: 'hr01', title: 'Mass Casualty Incident (MCI) — Ops Role & Responsibilities' },
  { id: 'hr02', title: 'Aircraft Emergency — Crash/Fire/Rescue Notification Procedures' },
  { id: 'hr03', title: 'Medical Emergency on Ground — Crew Incapacitation' },
  { id: 'hr04', title: 'Bomb Threat & Security Threat — Ops Response' },
  { id: 'hr05', title: 'Dangerous Goods Incident — Reportable Event Procedures' },
  { id: 'hr06', title: 'CBRN / Hazmat Transport Protocols' },
  { id: 'hr07', title: 'Kidnap & Extortion — Notification Chain' },
  { id: 'hr08', title: 'Overdue Aircraft — SAR Initiation & JRCC Notification' },
  { id: 'hr09', title: 'Major Disruption — Alternate Base Activation' },
  { id: 'hr10', title: 'Emergency Event Review & Debrief Procedures' },
];
const TOTAL_HIGH_RISK_MODULES = HIGH_RISK_MODULES.length; // 10

function defaultHighRiskStatusMap(): Record<string, CellStatus> {
  const map: Record<string, CellStatus> = {};
  HIGH_RISK_MODULES.forEach(m => { map[m.id] = "not-started"; });
  return map;
}

// Seed some realistic demo progress for the high-risk matrix
function seedHighRiskStatusMap(seedIndex: number): Record<string, CellStatus> {
  const map = defaultHighRiskStatusMap();
  const patterns: CellStatus[][] = [
    ["complete","complete","complete","complete","in-progress","not-started","not-started","not-started","not-started","not-started"],
    ["complete","complete","gap","complete","not-started","not-started","not-started","not-started","not-started","not-started"],
    ["complete","in-progress","not-started","not-started","not-started","not-started","not-started","not-started","not-started","not-started"],
    ["in-progress","not-started","not-started","not-started","not-started","not-started","not-started","not-started","not-started","not-started"],
    ["not-started","not-started","not-started","not-started","not-started","not-started","not-started","not-started","not-started","not-started"],
  ];
  const pattern = patterns[seedIndex % patterns.length];
  HIGH_RISK_MODULES.forEach((m, i) => { map[m.id] = pattern[i] ?? "not-started"; });
  return map;
}

function highRiskCellStatusMeta(status: CellStatus) {
  switch (status) {
    case "complete":
      return { label: "\u2713", icon: <CheckSquare size={13} className="text-green-400" />, bg: "bg-green-500/15", border: "border-green-500/40" };
    case "in-progress":
      return { label: "", icon: <div className="w-2 h-2 rounded-full bg-yellow-400" />, bg: "bg-yellow-500/15", border: "border-yellow-500/40" };
    case "gap":
      return { label: "GAP", icon: <XCircle size={13} className="text-red-400" />, bg: "bg-red-500/20", border: "border-red-500/50" };
    default:
      return { label: "\u2014", icon: null, bg: "bg-background/60", border: "border-card-border" };
  }
}

function defaultStatusMap(): Record<string, CellStatus> {
  const map: Record<string, CellStatus> = {};
  ALL_MODULES.forEach(m => { map[m.id] = "not-started"; });
  return map;
}

// Seed some realistic demo progress so the matrix isn't all blank
function seedStatusMap(seedIndex: number): Record<string, CellStatus> {
  const map = defaultStatusMap();
  const patterns: CellStatus[][] = [
    // Sarah Mitchell — Team Lead, ahead of schedule
    ["complete","complete","complete","complete","complete",
     "complete","complete","complete","complete","complete",
     "complete","complete","in-progress","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started"],
    // James Okafor — Dispatcher, one gap identified
    ["complete","complete","complete","gap","complete",
     "complete","in-progress","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started"],
    // Priya Sharma — Dispatcher, on track
    ["complete","complete","complete","complete","in-progress",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started"],
    // Tom Harding — Coordinator, behind / needs support
    ["complete","in-progress","gap","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started"],
    // Chloe Nguyen — Coordinator, just started
    ["complete","in-progress","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started",
     "not-started","not-started","not-started","not-started","not-started"],
  ];
  const pattern = patterns[seedIndex % patterns.length];
  ALL_MODULES.forEach((m, i) => { map[m.id] = pattern[i] ?? "not-started"; });
  return map;
}

const CELL_CYCLE: CellStatus[] = ["not-started", "in-progress", "complete", "gap"];

function nextStatus(s: CellStatus): CellStatus {
  const idx = CELL_CYCLE.indexOf(s);
  return CELL_CYCLE[(idx + 1) % CELL_CYCLE.length];
}

function countByStatus(map: Record<string, CellStatus>, status: CellStatus): number {
  return Object.values(map).filter(s => s === status).length;
}

function completionPct(map: Record<string, CellStatus>): number {
  return Math.round((countByStatus(map, "complete") / TOTAL_MODULES) * 100);
}

function weeksIntoProgram(startDate: string): number {
  const start = new Date(startDate).getTime();
  const now = new Date("2026-07-06").getTime(); // fixed "current" date per app context
  const diffWeeks = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, diffWeeks + 1);
}

type OverallStatus = "On Track" | "Behind Schedule" | "Completed" | "Needs Support";

function calcOverallStatus(map: Record<string, CellStatus>, startDate: string): OverallStatus {
  const complete = countByStatus(map, "complete");
  const gaps = countByStatus(map, "gap");
  if (complete === TOTAL_MODULES) return "Completed";
  const weeksIn = weeksIntoProgram(startDate);
  const expectedModules = Math.min(TOTAL_MODULES, weeksIn * 5); // ~5 modules/week pace (weeks 1-4); week5 has 10, but pace baseline still 5/wk minimum
  if (gaps >= 2) return "Needs Support";
  if (complete < expectedModules * 0.6) return "Behind Schedule";
  return "On Track";
}

const OVERALL_STATUS_COLOR: Record<OverallStatus, string> = {
  "On Track": "status-green",
  "Behind Schedule": "status-orange",
  "Completed": "status-blue",
  "Needs Support": "status-red",
};

function cellStatusMeta(status: CellStatus) {
  switch (status) {
    case "complete":
      return { icon: <CheckSquare size={13} className="text-green-400" />, bg: "bg-green-500/10", border: "border-green-500/30" };
    case "in-progress":
      return { icon: <div className="w-2 h-2 rounded-full bg-amber-400" />, bg: "bg-amber-500/10", border: "border-amber-500/30" };
    case "gap":
      return { icon: <XCircle size={13} className="text-red-400" />, bg: "bg-red-500/10", border: "border-red-500/30" };
    default:
      return { icon: null, bg: "bg-background/50", border: "border-card-border" };
  }
}

function moduleTitleById(id: string): string {
  return ALL_MODULES.find(m => m.id === id)?.title ?? id;
}

function weekLabelForModuleId(moduleId: string): string {
  const week = TRAINING_PROGRAM.find(w => w.modules.some(m => m.id === moduleId));
  return week ? week.label : "";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CheckTraining({ role }: Props) {
  const [activeTab, setActiveTab]               = useState<"forms" | "trainees" | "ops-staff" | "theory">("forms");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTrainee, setSelectedTrainee]   = useState<TraineeRecord>(TRAINEES[0]);
  const [traineeTab, setTraineeTab]             = useState<"overview" | "approaches" | "milestones">("overview");
  const [aiGenerating, setAiGenerating]         = useState(false);

  // ── Ops Staff Training Matrix state ──
  const [opsStaff, setOpsStaff] = useState<OpsStaffMember[]>(OPS_STAFF_DEFAULT);
  const [opsStatus, setOpsStatus] = useState<Record<string, Record<string, CellStatus>>>(() => {
    const init: Record<string, Record<string, CellStatus>> = {};
    OPS_STAFF_DEFAULT.forEach((s, i) => { init[s.id] = seedStatusMap(i); });
    return init;
  });
  const [highRiskStatus, setHighRiskStatus] = useState<Record<string, Record<string, CellStatus>>>(() => {
    const init: Record<string, Record<string, CellStatus>> = {};
    OPS_STAFF_DEFAULT.forEach((s, i) => { init[s.id] = seedHighRiskStatusMap(i); });
    return init;
  });
  const [opsGapNotes, setOpsGapNotes] = useState<Record<string, GapNote[]>>({});
  const [opsSignOffs, setOpsSignOffs] = useState<Record<string, WeekSignOff[]>>({});
  const [selectedOpsStaffId, setSelectedOpsStaffId] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "", base: "", startDate: "" });
  const [showGapReport, setShowGapReport] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

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

  // ── Ops Staff Training Matrix handlers ──
  function cycleHighRiskCell(staffId: string, moduleId: string) {
    setHighRiskStatus(prev => {
      const staffMap = { ...(prev[staffId] ?? defaultHighRiskStatusMap()) };
      const current = staffMap[moduleId] ?? "not-started";
      staffMap[moduleId] = nextStatus(current);
      return { ...prev, [staffId]: staffMap };
    });
  }

  function cycleOpsCell(staffId: string, moduleId: string) {
    setOpsStatus(prev => {
      const staffMap = { ...(prev[staffId] ?? defaultStatusMap()) };
      const current = staffMap[moduleId] ?? "not-started";
      const next = nextStatus(current);
      staffMap[moduleId] = next;

      // If all 30 modules are now complete, record completedDate + renewalDue
      const allComplete = ALL_MODULES.every(m => staffMap[m.id] === "complete");
      if (allComplete) {
        const today = new Date().toISOString().split("T")[0];
        setOpsStaff(staffPrev => staffPrev.map(s =>
          s.id === staffId && !s.completedDate
            ? { ...s, completedDate: today, renewalDue: addMonths(today, 24) }
            : s
        ));
      }

      return { ...prev, [staffId]: staffMap };
    });
  }

  function updateGapNote(staffId: string, moduleId: string, notes: string) {
    setOpsGapNotes(prev => {
      const existing = prev[staffId] ?? [];
      const idx = existing.findIndex(g => g.moduleId === moduleId);
      const updated = [...existing];
      if (idx >= 0) {
        updated[idx] = { moduleId, notes };
      } else {
        updated.push({ moduleId, notes });
      }
      return { ...prev, [staffId]: updated };
    });
  }

  function updateSignOff(staffId: string, weekId: string, field: "assessor" | "date", value: string) {
    setOpsSignOffs(prev => {
      const existing = prev[staffId] ?? [];
      const idx = existing.findIndex(s => s.weekId === weekId);
      const updated = [...existing];
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], [field]: value };
      } else {
        updated.push({ weekId, assessor: field === "assessor" ? value : "", date: field === "date" ? value : "" });
      }
      return { ...prev, [staffId]: updated };
    });
  }

  function addOpsStaffMember() {
    if (!newStaff.name.trim() || !newStaff.role.trim() || !newStaff.base.trim() || !newStaff.startDate.trim()) return;
    const id = `s${Date.now()}`;
    const member: OpsStaffMember = { id, ...newStaff };
    setOpsStaff(prev => [...prev, member]);
    setOpsStatus(prev => ({ ...prev, [id]: defaultStatusMap() }));
    setNewStaff({ name: "", role: "", base: "", startDate: "" });
    setShowAddStaff(false);
  }

  function allOpsGaps(): { staffName: string; moduleId: string; notes: string }[] {
    const gaps: { staffName: string; moduleId: string; notes: string }[] = [];
    opsStaff.forEach(s => {
      const map = opsStatus[s.id] ?? {};
      ALL_MODULES.forEach(m => {
        if (map[m.id] === "gap") {
          const note = (opsGapNotes[s.id] ?? []).find(g => g.moduleId === m.id)?.notes ?? "";
          gaps.push({ staffName: s.name, moduleId: m.id, notes: note });
        }
      });
    });
    return gaps;
  }

  function exportOpsSummary() {
    const lines: string[] = [];
    lines.push("OPS STAFF TRAINING MATRIX — SUMMARY");
    lines.push(`Generated: ${new Date().toLocaleDateString("en-AU")}`);
    lines.push("");
    opsStaff.forEach(s => {
      const map = opsStatus[s.id] ?? {};
      const pct = completionPct(map);
      const status = calcOverallStatus(map, s.startDate);
      const complete = countByStatus(map, "complete");
      const gaps = countByStatus(map, "gap");
      lines.push(`${s.name} (${s.role}, ${s.base})`);
      lines.push(`  Started: ${s.startDate} · Progress: ${complete}/${TOTAL_MODULES} modules (${pct}%) · Status: ${status}`);
      if (gaps > 0) {
        lines.push(`  Gaps identified: ${gaps}`);
        ALL_MODULES.forEach(m => {
          if (map[m.id] === "gap") {
            const note = (opsGapNotes[s.id] ?? []).find(g => g.moduleId === m.id)?.notes;
            lines.push(`    - ${m.title}${note ? ` (${note})` : ""}`);
          }
        });
      }
      const week5Map = map;
      const week5Complete = WEEK5_MODULE_IDS.every(id => week5Map[id] === "complete");
      if (week5Complete) {
        lines.push(`  ★ Special Missions Certified`);
      }
      // 24-month renewal
      if (s.completedDate) {
        const rs = renewalStatus(s.renewalDue);
        const renewalLabel = rs === "overdue" ? "OVERDUE" : rs === "due-soon" ? "DUE SOON" : "Current";
        lines.push(`  24-Month Review: ${renewalLabel} — Due ${formatRenewalDate(s.renewalDue)} (Completed ${formatRenewalDate(s.completedDate)})`);
      }
      lines.push("");
    });
    const totalGaps = allOpsGaps().length;
    const avgPct = Math.round(opsStaff.reduce((acc, s) => acc + completionPct(opsStatus[s.id] ?? {}), 0) / (opsStaff.length || 1));
    const completedStaff = opsStaff.filter(s => countByStatus(opsStatus[s.id] ?? {}, "complete") === TOTAL_MODULES).length;
    const renewalDueCount = opsStaff.filter(s => { const rs = renewalStatus(s.renewalDue); return rs === "overdue" || rs === "due-soon"; }).length;
    lines.push("---");
    lines.push(`Total staff in program: ${opsStaff.length}`);
    lines.push(`Average completion: ${avgPct}%`);
    lines.push(`Gaps identified: ${totalGaps}`);
    lines.push(`Staff completed: ${completedStaff}`);
    if (renewalDueCount > 0) lines.push(`24-month reviews due: ${renewalDueCount}`);

    const text = lines.join("\n");
    navigator.clipboard?.writeText(text).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    }).catch(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    });
  }

  const selectedOpsStaff = opsStaff.find(s => s.id === selectedOpsStaffId) ?? null;
  const opsAvgPct = Math.round(opsStaff.reduce((acc, s) => acc + completionPct(opsStatus[s.id] ?? {}), 0) / (opsStaff.length || 1));
  const opsTotalGaps = allOpsGaps().length;
  const opsCompletedStaff = opsStaff.filter(s => countByStatus(opsStatus[s.id] ?? {}, "complete") === TOTAL_MODULES).length;
  // Renewal tracking
  const opsRenewalDue = opsStaff.filter(s => {
    const rs = renewalStatus(s.renewalDue);
    return rs === "overdue" || rs === "due-soon";
  });
  const opsRenewalOverdue = opsStaff.filter(s => renewalStatus(s.renewalDue) === "overdue");


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
        <button
          onClick={() => setActiveTab("ops-staff")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "ops-staff"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap size={14} />
          Ops Staff
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">Training Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab("theory")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "theory"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain size={14} />
          Theory Knowledge Testing
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">12 Exams</span>
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

      {/* ═══════════════ OPS STAFF TRAINING MATRIX TAB ═══════════════ */}
      {activeTab === "ops-staff" && (
        <div className="space-y-5">

          {/* Banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20" style={{ background: "rgba(245,158,11,0.05)" }}>
            <UserCheck size={14} className="text-amber-400 shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-amber-400">Ops Staff Training Matrix</span>
              <span className="text-muted-foreground ml-1.5">— 5-week onboarding program covering foundations, finance, team lead skills, competency integration, and special missions.</span>
            </div>
          </div>

          {/* Summary KPI dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-card rounded-xl border border-card-border p-3 sm:p-4">
              <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{opsStaff.length}</div>
              <div className="text-xs font-semibold mt-0.5">Total Staff</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">In training program</div>
            </div>
            <div className="bg-card rounded-xl border border-card-border p-3 sm:p-4">
              <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{opsAvgPct}%</div>
              <div className="text-xs font-semibold mt-0.5">Avg Completion</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Across {TOTAL_MODULES} modules</div>
            </div>
            <div className="bg-card rounded-xl border border-card-border p-3 sm:p-4">
              <div className={`text-2xl font-bold ${opsTotalGaps > 0 ? "text-red-400" : "text-green-400"}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{opsTotalGaps}</div>
              <div className="text-xs font-semibold mt-0.5">Gaps Identified</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Requires review</div>
            </div>
            <div className="bg-card rounded-xl border border-card-border p-3 sm:p-4">
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{opsCompletedStaff}</div>
              <div className="text-xs font-semibold mt-0.5">Staff Completed</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">All {TOTAL_MODULES} modules</div>
            </div>
            <div className={`bg-card rounded-xl border p-3 sm:p-4 ${
              opsRenewalOverdue.length > 0 ? "border-red-500/30" :
              opsRenewalDue.length > 0 ? "border-amber-500/30" :
              "border-card-border"
            }`}>
              <div className={`text-2xl font-bold ${
                opsRenewalOverdue.length > 0 ? "text-red-400" :
                opsRenewalDue.length > 0 ? "text-amber-400" :
                "text-green-400"
              }`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {opsRenewalDue.length}
              </div>
              <div className="text-xs font-semibold mt-0.5">Review Due</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">24-month cycle</div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddStaff(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 hover:bg-amber-500/20 transition-colors font-semibold"
            >
              <Plus size={12} /> Add Staff Member
            </button>
            <button
              onClick={exportOpsSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold"
            >
              <Copy size={12} /> {exportCopied ? "Copied!" : "Export Summary"}
            </button>
            <button
              onClick={() => setShowGapReport(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors font-semibold"
            >
              <ClipboardList size={12} /> Gap Report {opsTotalGaps > 0 && `(${opsTotalGaps})`}
            </button>
          </div>

          {/* Add staff inline form */}
          {showAddStaff && (
            <div className="bg-card rounded-xl border border-amber-500/30 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Plus size={12} /> Add Staff Member
              </h3>
              <div className="grid sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newStaff.name}
                  onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400/50"
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={newStaff.role}
                  onChange={e => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  className="bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400/50"
                />
                <input
                  type="text"
                  placeholder="Base"
                  value={newStaff.base}
                  onChange={e => setNewStaff(prev => ({ ...prev, base: e.target.value }))}
                  className="bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400/50"
                />
                <input
                  type="date"
                  placeholder="Start date"
                  value={newStaff.startDate}
                  onChange={e => setNewStaff(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addOpsStaffMember}
                  className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-xs text-amber-400 hover:bg-amber-500/30 transition-colors font-semibold"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddStaff(false)}
                  className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted/70 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 24-Month Renewal Due section — only shown when staff have renewal dates */}
          {opsRenewalDue.length > 0 && (
            <div className="bg-card rounded-xl border border-amber-500/30 overflow-hidden" style={{ background: "rgba(245,158,11,0.03)" }}>
              <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
                <RefreshCw size={14} className={opsRenewalOverdue.length > 0 ? "text-red-400" : "text-amber-400"} />
                <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  24-Month Review Schedule
                </h2>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  opsRenewalOverdue.length > 0 ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                }`}>
                  {opsRenewalOverdue.length > 0 ? `${opsRenewalOverdue.length} Overdue` : `${opsRenewalDue.length} Due Soon`}
                </span>
              </div>
              <div className="divide-y divide-card-border">
                {opsRenewalDue.map(s => {
                  const rs = renewalStatus(s.renewalDue);
                  const isOverdue = rs === "overdue";
                  return (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? "bg-red-400" : "bg-amber-400"}`} />
                        <div>
                          <div className="text-xs font-semibold">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground">{s.role} · {s.base}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        {s.completedDate && (
                          <span className="text-muted-foreground">Completed {formatRenewalDate(s.completedDate)}</span>
                        )}
                        <span className={`font-semibold ${isOverdue ? "text-red-400" : "text-amber-400"}`}>
                          {isOverdue ? "Overdue — " : "Due "}{formatRenewalDate(s.renewalDue)}
                        </span>
                        <button
                          onClick={() => setSelectedOpsStaffId(s.id)}
                          className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors font-semibold"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matrix view */}
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                <ClipboardList size={14} className="text-amber-400" /> Training Competency Matrix
              </h2>
              <span className="text-[10px] text-muted-foreground">Click a cell to cycle status</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: "1140px", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-card text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-card-border" style={{ width: "180px", minWidth: "180px" }}>
                      Staff
                    </th>
                    {TRAINING_PROGRAM.map(week => (
                      <th
                        key={week.id}
                        colSpan={week.modules.length}
                        className="text-center px-2 py-2 font-semibold text-[10px] uppercase tracking-wider border-b border-l border-card-border bg-muted/20"
                      >
                        {week.label}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="sticky left-0 z-10 bg-card px-4 py-1 border-b border-card-border" style={{ width: "180px", minWidth: "180px" }} />
                    {TRAINING_PROGRAM.map(week => (
                      week.modules.map((m, i) => (
                        <th
                          key={m.id}
                          title={m.title}
                          className={`px-0 py-1.5 border-b border-card-border font-normal text-[9px] text-muted-foreground text-center align-bottom ${i === 0 ? "border-l" : ""}`}
                          style={{ writingMode: "vertical-rl", width: "32px", minWidth: "32px", maxWidth: "32px" }}
                        >
                          <span style={{ display: "inline-block", height: "100px", overflow: "hidden", lineHeight: 1.2 }}>{m.title}</span>
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {opsStaff.map(staff => {
                    const map = opsStatus[staff.id] ?? defaultStatusMap();
                    return (
                      <tr key={staff.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-4 py-2 border-r border-card-border">
                          <button
                            onClick={() => setSelectedOpsStaffId(staff.id)}
                            className="text-left hover:text-amber-400 transition-colors"
                          >
                            <div className="text-xs font-semibold">{staff.name}</div>
                            <div className="text-[10px] text-muted-foreground">{staff.role} · {staff.base}</div>
                          </button>
                        </td>
                        {TRAINING_PROGRAM.map(week => (
                          week.modules.map((m, i) => {
                            const status = map[m.id] ?? "not-started";
                            const meta = cellStatusMeta(status);
                            return (
                              <td key={m.id} className={`p-0.5 ${i === 0 ? "border-l border-card-border" : ""}`} style={{ width: "32px", minWidth: "32px", maxWidth: "32px" }}>
                                <button
                                  onClick={() => cycleOpsCell(staff.id, m.id)}
                                  title={`${m.title} — ${status}`}
                                  className={`w-full h-7 flex items-center justify-center rounded border ${meta.bg} ${meta.border} hover:opacity-70 transition-opacity`}
                                >
                                  {meta.icon}
                                </button>
                              </td>
                            );
                          })
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-card-border text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-background/50 border border-card-border" /> Not Started</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /></div> In Progress</div>
              <div className="flex items-center gap-1.5"><CheckSquare size={12} className="text-green-400" /> Complete</div>
              <div className="flex items-center gap-1.5"><XCircle size={12} className="text-red-400" /> Gap</div>
            </div>
          </div>


          {/* ═══════════ HIGH-RISK TASK COMPETENCY — Infrequent Emergency Procedures ═══════════ */}
          <div className="bg-card rounded-xl border border-red-500/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-red-500/20 flex items-center justify-between flex-wrap gap-2" style={{ background: "rgba(239,68,68,0.06)" }}>
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2 text-red-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  <AlertTriangle size={14} /> ⚠️ HIGH-RISK TASK COMPETENCY — Infrequent Emergency Procedures
                </h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Annual review required · Refresher triggered by any activation
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">Click a cell to cycle status</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: "900px", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-card text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-card-border" style={{ width: "180px", minWidth: "180px" }}>
                      Staff
                    </th>
                    {HIGH_RISK_MODULES.map(m => (
                      <th
                        key={m.id}
                        title={m.title}
                        className="px-0 py-1.5 border-b border-l border-card-border font-normal text-[9px] text-muted-foreground text-center align-bottom"
                        style={{ writingMode: "vertical-rl", width: "48px", minWidth: "48px", maxWidth: "48px" }}
                      >
                        <span style={{ display: "inline-block", height: "140px", overflow: "hidden", lineHeight: 1.2 }}>{m.title}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {opsStaff.map(staff => {
                    const map = highRiskStatus[staff.id] ?? defaultHighRiskStatusMap();
                    return (
                      <tr key={staff.id} className="border-b border-border last:border-0 hover:bg-red-500/5 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-4 py-2 border-r border-card-border">
                          <div className="text-xs font-semibold">{staff.name}</div>
                          <div className="text-[10px] text-muted-foreground">{staff.role} · {staff.base}</div>
                        </td>
                        {HIGH_RISK_MODULES.map(m => {
                          const status = map[m.id] ?? "not-started";
                          const meta = highRiskCellStatusMeta(status);
                          return (
                            <td key={m.id} className="p-0.5 border-l border-card-border" style={{ width: "48px", minWidth: "48px", maxWidth: "48px" }}>
                              <button
                                onClick={() => cycleHighRiskCell(staff.id, m.id)}
                                title={`${m.title} — ${status} · Last activation review: — (click to record)`}
                                className={`w-full h-8 flex items-center justify-center gap-1 rounded border text-[10px] font-bold ${meta.bg} ${meta.border} hover:opacity-70 transition-opacity`}
                              >
                                {meta.icon}
                                {status === "gap" && <span className="text-red-400 text-[9px]">GAP</span>}
                                {status === "not-started" && <span className="text-muted-foreground text-[10px]">—</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-red-500/20 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-background/60 border border-card-border flex items-center justify-center text-[8px]">—</div> Not Started</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /></div> In Progress</div>
              <div className="flex items-center gap-1.5"><CheckSquare size={12} className="text-green-400" /> Complete</div>
              <div className="flex items-center gap-1.5"><XCircle size={12} className="text-red-400" /> GAP</div>
              <span className="ml-auto italic">Last activation review: — (click to record)</span>
            </div>
          </div>

          {/* Individual staff card / panel */}
          {selectedOpsStaff && (() => {
            const staff = selectedOpsStaff;
            const map = opsStatus[staff.id] ?? defaultStatusMap();
            const complete = countByStatus(map, "complete");
            const pct = completionPct(map);
            const overall = calcOverallStatus(map, staff.startDate);
            const weeksIn = weeksIntoProgram(staff.startDate);
            const gapEntries = ALL_MODULES.filter(m => map[m.id] === "gap");
            const staffGapNotes = opsGapNotes[staff.id] ?? [];
            const staffSignOffs = opsSignOffs[staff.id] ?? [];
            const week5Complete = WEEK5_MODULE_IDS.every(id => map[id] === "complete");

            return (
              <div className="bg-card rounded-xl border border-amber-500/30 overflow-hidden">
                <div className="px-5 py-4 border-b border-card-border flex items-center justify-between flex-wrap gap-3" style={{ background: "rgba(245,158,11,0.04)" }}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{staff.name}</div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${OVERALL_STATUS_COLOR[overall]}`}>{overall}</span>
                      {week5Complete && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1">
                          <Award size={10} /> Special Missions Certified
                        </span>
                      )}
                      {/* 24-month renewal badge */}
                      {(() => {
                        const rs = renewalStatus(staff.renewalDue);
                        if (rs === "none") return null;
                        const badgeStyle =
                          rs === "overdue" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                          rs === "due-soon" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                          "bg-green-500/20 text-green-300 border-green-500/40";
                        const label =
                          rs === "overdue" ? "Review Overdue" :
                          rs === "due-soon" ? "Review Due Soon" :
                          "Review Current";
                        return (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${badgeStyle}`}>
                            <RefreshCw size={9} /> {label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {staff.role} · {staff.base} · Started {staff.startDate} · Week {weeksIn} of program
                      {staff.renewalDue && (
                        <span className="ml-2 text-[10px]">
                          · <span className={renewalStatus(staff.renewalDue) === "overdue" ? "text-red-400" : renewalStatus(staff.renewalDue) === "due-soon" ? "text-amber-400" : "text-green-400"}>
                            24-Month Review due {formatRenewalDate(staff.renewalDue)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {staff.renewalDue && (
                      <button
                        onClick={() => {
                          if (!window.confirm(`Reset the 24-month review cycle for ${staff.name}?\n\nThis will record today as the review completion date and set the next review due in 24 months. This cannot be undone.`))
                            return;
                          const today = new Date().toISOString().split("T")[0];
                          setOpsStaff(prev => prev.map(s =>
                            s.id === staff.id
                              ? { ...s, completedDate: today, renewalDue: addMonths(today, 24) }
                              : s
                          ));
                        }}
                        title="Reset 24-month review cycle from today"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-[11px] text-green-400 hover:bg-green-500/20 transition-colors font-semibold"
                      >
                        <RefreshCw size={11} /> Reset Review
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOpsStaffId(null)}
                      className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Overall Progress</span>
                      <span className="font-bold text-amber-400">{complete} of {TOTAL_MODULES} modules ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-400" : pct >= 50 ? "bg-cyan-400" : "bg-amber-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Week-by-week breakdown */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <BookOpen size={12} /> Week-by-Week Breakdown
                    </h3>
                    <div className="space-y-3">
                      {TRAINING_PROGRAM.map(week => {
                        const weekComplete = week.modules.filter(m => map[m.id] === "complete").length;
                        const signOff = staffSignOffs.find(s => s.weekId === week.id);
                        return (
                          <div key={week.id} className="bg-background/50 rounded-xl border border-card-border p-3">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <span className="text-xs font-semibold">{week.label}</span>
                              <span className="text-[10px] text-muted-foreground">{weekComplete} / {week.modules.length} complete</span>
                            </div>
                            <div className="space-y-1.5">
                              {week.modules.map(m => {
                                const status = map[m.id] ?? "not-started";
                                const meta = cellStatusMeta(status);
                                return (
                                  <div key={m.id} className="flex items-center gap-2 text-[11px]">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${meta.bg} ${meta.border}`}>
                                      {meta.icon}
                                    </div>
                                    <span className={status === "complete" ? "text-muted-foreground line-through" : ""}>{m.title}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Assessor sign-off */}
                            <div className="mt-3 pt-3 border-t border-card-border grid sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Assessor name"
                                value={signOff?.assessor ?? ""}
                                onChange={e => updateSignOff(staff.id, week.id, "assessor", e.target.value)}
                                className="bg-card border border-card-border rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-amber-400/50"
                              />
                              <input
                                type="date"
                                value={signOff?.date ?? ""}
                                onChange={e => updateSignOff(staff.id, week.id, "date", e.target.value)}
                                className="bg-card border border-card-border rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-amber-400/50"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gap analysis */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                      <AlertCircle size={12} /> Gap Analysis
                    </h3>
                    {gapEntries.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No knowledge gaps identified.</p>
                    ) : (
                      <div className="space-y-2">
                        {gapEntries.map(m => {
                          const note = staffGapNotes.find(g => g.moduleId === m.id)?.notes ?? "";
                          return (
                            <div key={m.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                              <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
                                <XCircle size={12} className="text-red-400" /> {m.title}
                                <span className="text-[10px] text-muted-foreground font-normal ml-auto">{weekLabelForModuleId(m.id)}</span>
                              </div>
                              <textarea
                                placeholder="Notes on the identified gap and remediation plan…"
                                value={note}
                                onChange={e => updateGapNote(staff.id, m.id, e.target.value)}
                                className="w-full bg-background/50 border border-card-border rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-red-400/50 resize-none"
                                rows={2}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Gap report modal */}
          {showGapReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowGapReport(false)}>
              <div
                className="bg-card rounded-2xl border border-card-border max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
                  <h2 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    <ClipboardList size={14} className="text-red-400" /> Gap Report — Manager Review
                  </h2>
                  <button onClick={() => setShowGapReport(false)} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {allOpsGaps().length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">No gaps currently identified across any staff member.</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 sticky top-0">
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Staff Name</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Module</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Week</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOpsGaps().map((g, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-semibold">{g.staffName}</td>
                            <td className="px-4 py-3">{moduleTitleById(g.moduleId)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{weekLabelForModuleId(g.moduleId)}</td>
                            <td className="px-4 py-3 text-muted-foreground italic">{g.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═══════════════ THEORY KNOWLEDGE TESTING TAB ═══════════════ */}
      {activeTab === "theory" && <TheoryKnowledgeSection />}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEORY KNOWLEDGE TESTING — Self-contained component
// ─────────────────────────────────────────────────────────────────────────────
type ExamPhase = "select" | "in-progress" | "results";

interface ExamResult {
  examId: string;
  score: number;
  total: number;
  passed: boolean;
  answers: (number | null)[];
  date: string;
}

// Best result keyed by examId
type BestScores = Record<string, { score: number; total: number; passed: boolean; date: string }>;

type ExamMode = "b200" | "b350" | "ops-staff" | "ifr-sim" | "b200-systems" | "b350-systems";

const EXAM_MODE_CONFIG: Record<ExamMode, {
  label: string;
  description: string;
  accent: string;        // tailwind text colour
  accentBg: string;      // tailwind bg colour
  accentBorder: string;  // tailwind border colour
  accentBar: string;     // tailwind bg for progress bar
  accentCard: string;    // hover card border+bg
  exams: Exam[];
  dedicatedLabel: string;
  mixedLabel: string;
}> = {
  b200: {
    label: "King Air B200",
    description: "B200 POH, QRH, Flash Cards & Training Manual",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/5",
    accentBorder: "border-emerald-500/20",
    accentBar: "bg-emerald-500",
    accentCard: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
    exams: EXAMS,
    dedicatedLabel: "Dedicated Exams — One Manual Per Exam",
    mixedLabel: "Combined Exams — Mixed Across All Manuals",
  },
  b350: {
    label: "King Air B350",
    description: "B350 POH, QRH & Differences Training",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/5",
    accentBorder: "border-blue-500/20",
    accentBar: "bg-blue-500",
    accentCard: "hover:border-blue-500/40 hover:bg-blue-500/5",
    exams: EXAMS_B350,
    dedicatedLabel: "B350 Dedicated Exams — One Subject Per Exam",
    mixedLabel: "B350 Combined Exams — Mixed Across All Subject Areas",
  },
  "ops-staff": {
    label: "Ops Staff",
    description: "Emergency, NEPT & Invoicing — 3 tiers",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/5",
    accentBorder: "border-amber-500/20",
    accentBar: "bg-amber-500",
    accentCard: "hover:border-amber-500/40 hover:bg-amber-500/5",
    exams: EXAMS_OPS,
    dedicatedLabel: "Ops Staff Exams by Tier",
    mixedLabel: "Mixed Ops Exams",
  },
  "ifr-sim": {
    label: "IFR / Sim (CASA)",
    description: "CASA Form 61-1503 — 17 ground theory topics",
    accent: "text-sky-400",
    accentBg: "bg-sky-500/5",
    accentBorder: "border-sky-500/20",
    accentBar: "bg-sky-500",
    accentCard: "hover:border-sky-500/40 hover:bg-sky-500/5",
    exams: EXAMS_IFR,
    dedicatedLabel: "CASA Form 61-1503 — Ground Theory Topics (a)–(q)",
    mixedLabel: "Mixed IFR Topics",
  },
  "b200-systems": {
    label: "B200 Systems",
    description: "Flight Controls, Powerplant, Electrical, Pressurisation, Fuel",
    accent: "text-teal-400",
    accentBg: "bg-teal-500/5",
    accentBorder: "border-teal-500/20",
    accentBar: "bg-teal-500",
    accentCard: "hover:border-teal-500/40 hover:bg-teal-500/5",
    exams: EXAMS_B200_SYSTEMS,
    dedicatedLabel: "B200 System Exams — One System Per Exam",
    mixedLabel: "B200 Systems Mixed",
  },
  "b350-systems": {
    label: "B350 Systems",
    description: "PT6A-60A, Hydraulics, Electrical, Pressurisation, Avionics",
    accent: "text-violet-400",
    accentBg: "bg-violet-500/5",
    accentBorder: "border-violet-500/20",
    accentBar: "bg-violet-500",
    accentCard: "hover:border-violet-500/40 hover:bg-violet-500/5",
    exams: EXAMS_B350_SYSTEMS,
    dedicatedLabel: "B350 System Exams — One System Per Exam",
    mixedLabel: "B350 Systems Mixed",
  },
};

function TheoryKnowledgeSection() {
  const [examMode, setExamMode]         = useState<ExamMode>("b200");
  const [phase, setPhase]               = useState<ExamPhase>("select");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions]       = useState<ExamQuestion[]>([]);
  const [currentQ, setCurrentQ]         = useState(0);
  const [answers, setAnswers]           = useState<(number | null)[]>([]);
  const [showAnswer, setShowAnswer]     = useState(false);
  const [result, setResult]             = useState<ExamResult | null>(null);
  const [timeLeft, setTimeLeft]         = useState(EXAM_DURATION_MINUTES * 60);
  const [results, setResults]           = useState<ExamResult[]>([]);
  const [bestScores, setBestScores]     = useState<BestScores>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef                      = useRef<(number | null)[]>([]);

  const cfg = EXAM_MODE_CONFIG[examMode];
  // Active exam bank — driven by mode config
  const ACTIVE_EXAMS = cfg.exams;
  const questionsRef                    = useRef<ExamQuestion[]>([]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  useEffect(() => {
    if (phase !== "in-progress") { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishExamRef.current(answersRef.current, questionsRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startExam(exam: Exam) {
    const shuffled = shuffleArray(exam.questions);
    setSelectedExam(exam);
    setQuestions(shuffled);
    setCurrentQ(0);
    const initAnswers = new Array(shuffled.length).fill(null);
    setAnswers(initAnswers);
    setShowAnswer(false);
    setTimeLeft(EXAM_DURATION_MINUTES * 60);
    setPhase("in-progress");
  }

  function handleAnswer(optionIndex: number) {
    if (showAnswer) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    setShowAnswer(true);
  }

  function nextQuestion() {
    setShowAnswer(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      finishExam(answers, questions);
    }
  }

  function finishExam(finalAnswers: (number | null)[], qs: ExamQuestion[]) {
    if (timerRef.current) clearInterval(timerRef.current);
    let score = 0;
    finalAnswers.forEach((ans, i) => { if (ans === qs[i]?.correctIndex) score++; });
    const res: ExamResult = {
      examId: selectedExam!.id,
      score,
      total: qs.length,
      passed: (score / qs.length) * 100 >= PASS_MARK,
      answers: finalAnswers,
      date: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
    };
    setResult(res);
    setResults(prev => [res, ...prev.slice(0, 19)]);
    setBestScores(prev => {
      const existing = prev[res.examId];
      if (!existing || res.score > existing.score) {
        return { ...prev, [res.examId]: { score: res.score, total: res.total, passed: res.passed, date: res.date } };
      }
      return prev;
    });
    setPhase("results");
  }

  const finishExamRef = useRef(finishExam);
  useEffect(() => { finishExamRef.current = finishExam; });

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const pct = (n: number, d: number) => Math.round((n / d) * 100);
  const OPTION_LABELS = ["A", "B", "C", "D"];

  // ─── SELECT SCREEN ───────────────────────────────────────────────────────────
  if (phase === "select") {
    const totalExams      = ACTIVE_EXAMS.length;
    const passedCount     = ACTIVE_EXAMS.filter(e => bestScores[e.id]?.passed).length;
    const attemptedCount  = ACTIVE_EXAMS.filter(e => bestScores[e.id]).length;
    const overallPct      = Math.round((passedCount / totalExams) * 100);
    const dedicatedExams  = ACTIVE_EXAMS.filter(e => !e.title.includes("Mixed"));
    const mixedExams      = ACTIVE_EXAMS.filter(e => e.title.includes("Mixed"));

    return (
      <div className="p-4 space-y-6">

        {/* ── EXAM MODE SWITCHER ── */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Exam Category:</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(EXAM_MODE_CONFIG) as [ExamMode, typeof EXAM_MODE_CONFIG[ExamMode]][]).map(([mode, c]) => (
              <button
                key={mode}
                onClick={() => { setExamMode(mode); }}
                data-testid={`button-exam-mode-${mode}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  examMode === mode
                    ? `${c.accentBg} border-opacity-60 ${c.accent} border-current`
                    : "bg-muted/30 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{cfg.description}</p>
        </div>

        {/* ── PROGRESS TRACKER CARD ── */}
        <div className={`rounded-xl border p-5 ${cfg.accentBorder} ${cfg.accentBg}`}>

          {/* Reset confirmation overlay */}
          {showResetConfirm && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-300">Reset all progress?</p>
                <p className="text-xs text-muted-foreground mt-0.5">This will clear all best scores and start counts. This cannot be undone.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 text-xs rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                >Cancel</button>
                <button
                  onClick={() => { setBestScores({}); setShowResetConfirm(false); }}
                  className="px-3 py-1.5 text-xs rounded-md bg-red-500/80 hover:bg-red-500 text-white font-semibold transition-colors"
                >Yes, reset</button>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Trophy size={22} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-emerald-300 text-base">Theory Knowledge Testing</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  20 questions · 30-min timer · Pass mark {PASS_MARK}% · Best score tracked per exam
                </p>
              </div>
            </div>
            {/* Summary stats + reset */}
            <div className="flex items-start gap-4 shrink-0">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">{passedCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{attemptedCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attempted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground tabular-nums">{totalExams}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                </div>
              </div>
              {/* Reset button — only shown when there is progress to clear */}
              {attemptedCount > 0 && (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  title="Reset all progress"
                  className="mt-1 p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  data-testid="button-reset-progress"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{passedCount} of {totalExams} exams passed</span>
              <span className={`font-bold ${
                overallPct === 100 ? cfg.accent :
                overallPct >= 50  ? "text-amber-400"   : "text-muted-foreground"
              }`}>{overallPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${cfg.accentBar}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
            {overallPct === 100 && (
              <p className={`text-xs font-semibold text-center pt-1 ${cfg.accent}`}>🏖 All {cfg.label} exams passed — well done!</p>
            )}
          </div>

          {/* Per-exam mini grid */}
          {attemptedCount > 0 && (
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
              {ACTIVE_EXAMS.map((exam, i) => {
                const best = bestScores[exam.id];
                const isMixed = exam.title.includes("Mixed");
                let bg = "bg-border/50"; // not attempted
                if (best?.passed)       bg = cfg.accentBar;
                else if (best)          bg = "bg-red-500/70";
                return (
                  <div
                    key={exam.id}
                    title={`${exam.title}${best ? ` — Best: ${pct(best.score, best.total)}% (${best.passed ? "PASS" : "FAIL"})` : " — Not attempted"}`}
                    className={`relative h-7 rounded flex items-center justify-center text-[10px] font-bold text-white cursor-default transition-all ${
                      bg
                    } ${isMixed ? "ring-1 ring-purple-400/40" : ""}`}
                  >
                    {i + 1}
                    {best?.passed && (
                      <span className="absolute -top-1 -right-1 text-[8px]">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── DEDICATED EXAMS ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cfg.dedicatedLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dedicatedExams.map(exam => {
              const best = bestScores[exam.id];
              const scorePct = best ? pct(best.score, best.total) : null;
              return (
                <button
                  key={exam.id}
                  onClick={() => startExam(exam)}
                  className={`text-left rounded-xl border border-border bg-card transition-all p-4 group ${cfg.accentCard}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <BookMarked size={16} className={`shrink-0 mt-0.5 ${cfg.accent}`} />
                    {best ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        best.passed ? `${cfg.accentBg} ${cfg.accent}` : "bg-red-500/20 text-red-300"
                      }`}>
                        {best.passed ? "PASS" : "FAIL"} · {scorePct}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40">Not attempted</span>
                    )}
                  </div>
                  <p className={`font-semibold text-sm mt-2 transition-colors ${cfg.accent}`}>{exam.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{exam.subtitle}</p>

                  {/* Score bar */}
                  {best && (
                    <div className="mt-3 space-y-1">
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            best.passed ? cfg.accentBar : "bg-red-500/70"
                          }`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Best: {best.score}/{best.total}</span>
                        <span>{best.date}</span>
                      </div>
                    </div>
                  )}

                  {!best && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckSquare size={11} /> <span>20 questions</span>
                      <Timer size={11} className="ml-1" /> <span>30 min</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MIXED EXAMS ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cfg.mixedLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mixedExams.map(exam => {
              const best = bestScores[exam.id];
              const scorePct = best ? pct(best.score, best.total) : null;
              return (
                <button
                  key={exam.id}
                  onClick={() => startExam(exam)}
                  className="text-left rounded-xl border border-border bg-card hover:border-purple-500/40 hover:bg-purple-500/5 transition-all p-4 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Brain size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    {best ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        best.passed ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      }`}>
                        {best.passed ? "PASS" : "FAIL"} · {scorePct}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/40">Not attempted</span>
                    )}
                  </div>
                  <p className="font-semibold text-sm mt-2 group-hover:text-purple-300 transition-colors">{exam.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{exam.subtitle}</p>

                  {/* Score bar */}
                  {best && (
                    <div className="mt-3 space-y-1">
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            best.passed ? "bg-emerald-500" : "bg-red-500/70"
                          }`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Best: {best.score}/{best.total}</span>
                        <span>{best.date}</span>
                      </div>
                    </div>
                  )}

                  {!best && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckSquare size={11} /> <span>20 questions</span>
                      <Timer size={11} className="ml-1" /> <span>30 min</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    );
  }

  // ─── IN-PROGRESS SCREEN ──────────────────────────────────────────────────────
  if (phase === "in-progress" && selectedExam) {
    const q = questions[currentQ];
    const chosen = answers[currentQ];
    const isCorrect = chosen === q.correctIndex;
    const progressPct = Math.round(((currentQ + (showAnswer ? 1 : 0)) / questions.length) * 100);
    const timerWarn = timeLeft < 300;

    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">{selectedExam.title}</p>
            <p className="text-xs text-muted-foreground">{selectedExam.subtitle}</p>
          </div>
          <div className={`flex items-center gap-2 font-bold text-lg tabular-nums ${
            timerWarn ? "text-red-400 animate-pulse" : "text-emerald-400"
          }`}>
            <Timer size={16} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-border">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="font-semibold text-sm leading-relaxed mb-4">{q.question}</p>

          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              let cls = "flex items-start gap-3 w-full rounded-lg border px-4 py-3 text-sm text-left transition-all ";
              if (!showAnswer) {
                cls += chosen === idx
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                  : "border-border bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50 cursor-pointer";
              } else {
                if (idx === q.correctIndex) {
                  cls += "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
                } else if (idx === chosen && chosen !== q.correctIndex) {
                  cls += "border-red-500/60 bg-red-500/10 text-red-300";
                } else {
                  cls += "border-border bg-muted/20 text-muted-foreground";
                }
              }
              return (
                <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={showAnswer}>
                  <span className="font-bold text-xs w-5 shrink-0 mt-0.5">{OPTION_LABELS[idx]}</span>
                  <span className="flex-1">{opt}</span>
                  {showAnswer && idx === q.correctIndex && <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />}
                  {showAnswer && idx === chosen && chosen !== q.correctIndex && <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Answer explanation */}
          {showAnswer && (
            <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
              <span className={`font-bold text-sm ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {isCorrect ? "✓ Correct" : "✗ Incorrect"}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
              <div className="flex items-start gap-2 pt-1">
                <BookMarked size={11} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground italic">{q.source}</p>
              </div>
              <button
                onClick={nextQuestion}
                className="mt-2 w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-2.5 transition-colors"
              >
                {currentQ < questions.length - 1 ? "Next Question →" : "Finish Exam"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULTS SCREEN ──────────────────────────────────────────────────────────
  if (phase === "results" && result && selectedExam) {
    const scorePct = pct(result.score, result.total);

    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Score card */}
        <div className={`rounded-xl border p-6 text-center ${
          result.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className={`text-5xl font-bold mb-1 ${result.passed ? "text-emerald-400" : "text-red-400"}`}>
            {scorePct}%
          </div>
          <div className={`font-semibold text-lg mb-1 ${result.passed ? "text-emerald-300" : "text-red-300"}`}>
            {result.passed ? "PASS" : "NOT YET COMPETENT"}
          </div>
          <p className="text-sm text-muted-foreground">
            {result.score} of {result.total} correct · Pass mark {PASS_MARK}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">{selectedExam.title} · {result.date}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => startExam(selectedExam)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-semibold text-sm py-2.5 transition-colors"
          >
            <RotateCcw size={14} /> Retry Exam
          </button>
          <button
            onClick={() => { setPhase("select"); setSelectedExam(null); setResult(null); }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 text-foreground hover:bg-muted/50 font-semibold text-sm py-2.5 transition-colors"
          >
            <ChevronLeft size={14} /> All Exams
          </button>
        </div>

        {/* Question review */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review — All Questions</p>
          {questions.map((q, idx) => {
            const chosen = result.answers[idx];
            const correct = chosen === q.correctIndex;
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 ${
                  correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className={`text-xs font-bold shrink-0 ${correct ? "text-emerald-400" : "text-red-400"}`}>
                    Q{idx + 1} {correct ? "✓" : "✗"}
                  </span>
                  <p className="text-sm font-semibold leading-snug">{q.question}</p>
                </div>
                <div className="space-y-1 mb-3">
                  {q.options.map((opt, oi) => {
                    let cls = "flex items-center gap-2 text-xs px-3 py-1.5 rounded ";
                    if (oi === q.correctIndex) cls += "bg-emerald-500/10 text-emerald-300 font-semibold";
                    else if (oi === chosen && !correct) cls += "bg-red-500/10 text-red-300 line-through";
                    else cls += "text-muted-foreground";
                    return (
                      <div key={oi} className={cls}>
                        <span className="font-bold w-4">{OPTION_LABELS[oi]}</span>
                        {opt}
                        {oi === q.correctIndex && <CheckCircle2 size={11} className="text-emerald-400 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                <div className="flex items-start gap-1.5 mt-1.5">
                  <BookMarked size={10} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground italic">{q.source}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}


