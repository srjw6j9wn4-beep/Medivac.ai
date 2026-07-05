import { useState } from "react";
import { type UserRole } from "@/lib/data";
import {
  Brain, Plane, Wrench, Calendar, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Download, RefreshCw, Zap,
  ArrowRight, MapPin, User, Package, Shield, BarChart2,
  AlertCircle, Info, Play
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ── AI analysis engine data ──────────────────────────────────────────────────
// Mirrors Engineering.tsx fleet — in production this would be a shared store / API

const UPCOMING_EVENTS = [
  {
    id: "EVT-001",
    aircraft: "VH-XYJ",
    type: "King Air B200",
    currentBase: "Dubbo (YSDU)",
    maintenanceBase: "Dubbo (YSDU)",
    ferryRequired: false,
    serviceType: "120 hr check",
    dueDate: "28 Jun 2026",
    dueHours: "14,864 hrs",
    remainingHours: 42,
    remainingDays: 23,
    urgency: "plan",          // plan | watch | urgent | critical
    urgencyColor: "text-blue-400",
    urgencyBg: "status-blue",
    components: [
      { name: "Propeller L/H overhaul", remaining: "260 hrs", due: "est. 28 Jun 2026", status: "warn" },
      { name: "Propeller R/H overhaul", remaining: "260 hrs", due: "est. 28 Jun 2026", status: "warn" },
    ],
    aiPlan: {
      summary: "VH-XYJ is currently based at Dubbo — the maintenance base. No ferry flight is required for the upcoming 120 hr check and propeller overhauls. I recommend scheduling the check window during a low-operational-tempo period to minimise mission impact. Based on current flying rate (~1.8 hrs/day), the aircraft will reach the 120 hr interval in approximately 23 days.",
      ferryOutDate: null,
      ferryOutRoute: null,
      ferryReturnDate: null,
      ferryReturnRoute: null,
      groundTime: "3–4 days (120 hr check + prop overhauls combined)",
      pilotRequired: "Capt. R. Hughes or Capt. T. Barnes (ferry-endorsed)",
      windowRecommendation: "20–24 Jun 2026 (low NEPT demand historically — pre-school holiday window)",
      coverAircraft: "VH-XYR repositioned from Broken Hill to Dubbo to maintain operational cover",
      actions: [
        { label: "Schedule 120 hr check", owner: "Eng. D. Evans", due: "By 10 Jun 2026", status: "pending" },
        { label: "Order propeller overhaul parts", owner: "Eng. D. Evans", due: "By 12 Jun 2026", status: "pending" },
        { label: "Confirm LAME availability", owner: "Ops Manager", due: "By 12 Jun 2026", status: "pending" },
        { label: "Notify Dubbo crew schedule", owner: "Dispatcher", due: "By 15 Jun 2026", status: "pending" },
        { label: "Arrange VH-XYR cover reposition", owner: "Ops Manager", due: "By 18 Jun 2026", status: "pending" },
      ],
    },
  },
  {
    id: "EVT-002",
    aircraft: "VH-XYR",
    type: "King Air B200",
    currentBase: "Broken Hill (YBHI)",
    maintenanceBase: "Dubbo (YSDU)",
    ferryRequired: true,
    serviceType: "6-Monthly check",
    dueDate: "18 Jul 2026",
    dueHours: "12,393 hrs",
    remainingHours: 88,
    remainingDays: 43,
    urgency: "plan",
    urgencyColor: "text-blue-400",
    urgencyBg: "status-blue",
    components: [
      { name: "Cabin door seal replacement", remaining: "MEL — 13 Jun 2026", due: "13 Jun 2026", status: "warn" },
    ],
    aiPlan: {
      summary: "VH-XYR is based at Broken Hill. The 6-monthly check and active MEL item (cabin door seal) both require ferry to Dubbo — the nearest certified maintenance base. I recommend combining both defect rectification and the scheduled service in one maintenance visit to minimise total ground time and ferry movements. The MEL expiry on 13 Jun 2026 creates a hard deadline for the ferry-OUT departure.",
      ferryOutDate: "10–11 Jun 2026",
      ferryOutRoute: "YBHI → YSDU (ferry, no medical config)",
      ferryReturnDate: "est. 17 Jun 2026",
      ferryReturnRoute: "YSDU → YBHI (return to service)",
      groundTime: "5–6 days (defect + 6-monthly combined)",
      pilotRequired: "Capt. T. Barnes (Broken Hill based, ferry-endorsed)",
      windowRecommendation: "Ferry-OUT by 10 Jun 2026 — MEL hard deadline 13 Jun. Combined service window 10–16 Jun 2026.",
      coverAircraft: "VH-XYJ repositioned to Broken Hill or NEPT missions re-routed via Dubbo during ground period",
      actions: [
        { label: "Book LAME — Dubbo maintenance base", owner: "Eng. D. Evans", due: "By 7 Jun 2026", status: "urgent" },
        { label: "Order cabin door seal part", owner: "Eng. D. Evans", due: "By 7 Jun 2026", status: "urgent" },
        { label: "Plan ferry-OUT — YBHI→YSDU", owner: "Capt. T. Barnes", due: "By 9 Jun 2026", status: "urgent" },
        { label: "Notify Broken Hill crew of ground period", owner: "Dispatcher", due: "By 8 Jun 2026", status: "urgent" },
        { label: "Arrange VH-XYJ Broken Hill cover", owner: "Ops Manager", due: "By 9 Jun 2026", status: "urgent" },
        { label: "Confirm 6-monthly scope with LAME", owner: "Eng. D. Evans", due: "By 8 Jun 2026", status: "urgent" },
        { label: "Plan ferry return — YSDU→YBHI (RTS)", owner: "Capt. T. Barnes", due: "By 16 Jun 2026", status: "pending" },
      ],
    },
  },
  {
    id: "EVT-003",
    aircraft: "VH-XYU",
    type: "King Air B300",
    currentBase: "Dubbo (YSDU)",
    maintenanceBase: "Dubbo (YSDU)",
    ferryRequired: false,
    serviceType: "Annual inspection — IN PROGRESS",
    dueDate: "10 Jun 2026",
    dueHours: "Maintenance hold",
    remainingHours: 0,
    remainingDays: 5,
    urgency: "critical",
    urgencyColor: "text-red-400",
    urgencyBg: "status-red",
    components: [
      { name: "R/H Brake Pack (AOG)", remaining: "Part ETA 7 Jun 2026", due: "7 Jun 2026", status: "fail" },
      { name: "Altimeter #2 static source check", remaining: "In progress", due: "In progress", status: "warn" },
      { name: "Engine #1 oil consumption check", remaining: "Monitor only", due: "Ongoing", status: "warn" },
    ],
    aiPlan: {
      summary: "VH-XYU is currently on maintenance hold at Dubbo — annual inspection in progress. R/H brake pack is AOG with part ETA 7 Jun 2026. Estimated return to service is 10 Jun 2026. No ferry flight is required — aircraft is already at the maintenance base. The priority is tracking part arrival and LAME completion of the brake pack, altimeter check, and engine oil trending before signing the maintenance release.",
      ferryOutDate: null,
      ferryOutRoute: null,
      ferryReturnDate: "10 Jun 2026 (RTS target)",
      ferryReturnRoute: "Return to operational service at YSDU",
      groundTime: "In progress — est. 5 days total (opened 01 Jun 2026)",
      pilotRequired: "N/A — aircraft at maintenance base. First flight after RTS: Capt. R. Hughes (test flight)",
      windowRecommendation: "Brake pack part arriving 7 Jun. Altimeter check scheduled 8 Jun. Target MR sign-off 10 Jun. Notify operations by 9 Jun for morning commitment.",
      coverAircraft: "VH-XYJ covering all Dubbo commitments — Broken Hill tasking via VH-XYR",
      actions: [
        { label: "Confirm brake pack part arrival — 7 Jun", owner: "Eng. D. Evans", due: "7 Jun 2026", status: "urgent" },
        { label: "Complete altimeter static source check", owner: "LAME J. Torres", due: "8 Jun 2026", status: "urgent" },
        { label: "Engine #1 oil consumption trend sign-off", owner: "LAME J. Torres", due: "9 Jun 2026", status: "urgent" },
        { label: "Issue maintenance release", owner: "LAME J. Torres", due: "10 Jun 2026", status: "pending" },
        { label: "Test flight — Capt. R. Hughes", owner: "Capt. R. Hughes", due: "10 Jun 2026", status: "pending" },
        { label: "Return to operational schedule", owner: "Dispatcher", due: "10 Jun 2026", status: "pending" },
      ],
    },
  },
  {
    id: "EVT-004",
    aircraft: "VH-MVW",
    type: "King Air B200",
    currentBase: "Broken Hill (YBHI)",
    maintenanceBase: "Broken Hill (YBHI)",
    ferryRequired: false,
    serviceType: "Annual inspection",
    dueDate: "15 Aug 2026",
    dueHours: "est. 15,440 hrs",
    remainingHours: 310,
    remainingDays: 71,
    urgency: "watch",
    urgencyColor: "text-amber-400",
    urgencyBg: "status-orange",
    components: [],
    aiPlan: {
      summary: "VH-MVW is based at Broken Hill. The annual inspection is due in approximately 71 days. As a Broken Hill-based aircraft the inspection can be conducted at the Broken Hill maintenance base. I recommend beginning LAME and slot booking within the next 30 days to avoid peak demand conflicts. No immediate action required but planning should commence now.",
      ferryOutDate: null,
      ferryOutRoute: null,
      ferryReturnDate: null,
      ferryReturnRoute: null,
      groundTime: "est. 7–10 days (annual inspection scope)",
      pilotRequired: "Local Broken Hill crew",
      windowRecommendation: "Target window: 10–20 Aug 2026. Book LAME slot by 1 Jul 2026.",
      coverAircraft: "VH-XYR or VH-XYJ to cover Broken Hill commitments during annual",
      actions: [
        { label: "Book LAME slot — Broken Hill base", owner: "Eng. D. Evans", due: "By 1 Jul 2026", status: "pending" },
        { label: "Scope annual inspection requirements", owner: "LAME J. Torres", due: "By 15 Jul 2026", status: "pending" },
        { label: "Plan cover aircraft arrangements", owner: "Ops Manager", due: "By 1 Aug 2026", status: "pending" },
      ],
    },
  },
];

// Ferry schedule computed by AI
const FERRY_SCHEDULE = [
  {
    id: "FRY-001",
    aircraft: "VH-XYR",
    direction: "OUT",
    route: "YBHI → YSDU",
    fromICAO: "YBHI",
    toICAO: "YSDU",
    fromName: "Broken Hill",
    toName: "Dubbo",
    purpose: "Cabin door seal MEL rectification + 6-monthly check",
    pilot: "Capt. T. Barnes",
    aiRecommended: "10 Jun 2026",
    deadline: "13 Jun 2026 (MEL expiry)",
    flightTime: "1 hr 15 min",
    urgency: "urgent",
    eventId: "EVT-002",
  },
  {
    id: "FRY-002",
    aircraft: "VH-XYJ",
    direction: "REPOSITION",
    route: "YSDU → YBHI",
    fromICAO: "YSDU",
    toICAO: "YBHI",
    fromName: "Dubbo",
    toName: "Broken Hill",
    purpose: "Operational cover while VH-XYR at Dubbo maintenance",
    pilot: "Capt. R. Hughes",
    aiRecommended: "10 Jun 2026",
    deadline: "Cover required from 10 Jun",
    flightTime: "1 hr 15 min",
    urgency: "urgent",
    eventId: "EVT-002",
  },
  {
    id: "FRY-003",
    aircraft: "VH-XYR",
    direction: "RETURN",
    route: "YSDU → YBHI",
    fromICAO: "YSDU",
    toICAO: "YBHI",
    fromName: "Dubbo",
    toName: "Broken Hill",
    purpose: "Return to service — Broken Hill base",
    pilot: "Capt. T. Barnes",
    aiRecommended: "est. 17 Jun 2026",
    deadline: "Post RTS sign-off",
    flightTime: "1 hr 15 min",
    urgency: "plan",
    eventId: "EVT-002",
  },
  {
    id: "FRY-004",
    aircraft: "VH-XYJ",
    direction: "REPOSITION",
    route: "YBHI → YSDU",
    fromICAO: "YBHI",
    toICAO: "YSDU",
    fromName: "Broken Hill",
    toName: "Dubbo",
    purpose: "Return to Dubbo base after XYR RTS",
    pilot: "Capt. R. Hughes",
    aiRecommended: "est. 17 Jun 2026",
    deadline: "After VH-XYR returns to YBHI",
    flightTime: "1 hr 15 min",
    urgency: "plan",
    eventId: "EVT-002",
  },
  {
    id: "FRY-005",
    aircraft: "VH-XYJ",
    direction: "OUT",
    route: "YSDU → YSDU",
    fromICAO: "YSDU",
    toICAO: "YSDU",
    fromName: "Dubbo",
    toName: "Dubbo (maintenance)",
    purpose: "120 hr check + propeller overhauls — Dubbo base",
    pilot: "N/A — at base",
    aiRecommended: "20 Jun 2026",
    deadline: "est. 28 Jun 2026",
    flightTime: "No ferry required",
    urgency: "plan",
    eventId: "EVT-001",
  },
];

const URGENCY_ORDER = { critical: 0, urgent: 1, watch: 2, plan: 3 };

function UrgencyBadge({ urgency, label }: { urgency: string; label: string }) {
  const cls =
    urgency === "critical" ? "status-red" :
    urgency === "urgent"   ? "status-orange" :
    urgency === "watch"    ? "status-yellow" : "status-blue";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>;
}

function ActionRow({ action }: { action: { label: string; owner: string; due: string; status: string } }) {
  const isUrgent = action.status === "urgent";
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-lg border ${isUrgent ? "border-orange-400/30 bg-orange-500/5" : "border-card-border bg-background"}`}>
      <div className={`mt-0.5 shrink-0 ${isUrgent ? "text-orange-400" : "text-muted-foreground"}`}>
        {isUrgent ? <AlertTriangle size={12} /> : <Clock size={12} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold leading-snug">{action.label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{action.owner} · {action.due}</div>
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${isUrgent ? "status-orange" : "status-blue"}`}>
        {isUrgent ? "Urgent" : "Pending"}
      </span>
    </div>
  );
}

export default function MaintenancePlanner({ role }: Props) {
  const [selectedEvent, setSelectedEvent] = useState(UPCOMING_EVENTS[1]); // default XYR (ferry required, urgent)
  const [runningAI, setRunningAI] = useState(false);
  const [aiRun, setAIRun] = useState(true); // already run on load

  const sorted = [...UPCOMING_EVENTS].sort(
    (a, b) => URGENCY_ORDER[a.urgency as keyof typeof URGENCY_ORDER] - URGENCY_ORDER[b.urgency as keyof typeof URGENCY_ORDER]
  );

  function runAIAnalysis() {
    setRunningAI(true);
    setTimeout(() => { setRunningAI(false); setAIRun(true); }, 2200);
  }

  function downloadPlan() {
    generatePDF({
      title: "AI Maintenance Ferry Planner — Structured Plan",
      subtitle: "Proactive ferry scheduling · Component life · Operational continuity",
      date: new Date().toLocaleDateString("en-AU"),
      reference: "MAINT-PLAN-" + new Date().toISOString().slice(0, 10),
      sections: [
        {
          heading: "Executive Summary",
          rows: [
            { label: "Analysis Generated", value: new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" }) + " AEST" },
            { label: "Aircraft Analysed", value: "VH-XYJ, VH-XYR, VH-XYU, VH-MVW" },
            { label: "Critical Events", value: UPCOMING_EVENTS.filter(e => e.urgency === "critical").length + " — requires immediate action" },
            { label: "Urgent Events", value: UPCOMING_EVENTS.filter(e => e.urgency === "urgent").length + " — action within 7 days" },
            { label: "Ferry Movements Required", value: FERRY_SCHEDULE.filter(f => f.direction !== "REPOSITION" && f.fromName !== f.toName).length.toString() },
            { label: "Maintenance Bases", value: "Dubbo (YSDU) — primary | Broken Hill (YBHI) — secondary" },
          ],
        },
        ...UPCOMING_EVENTS.map(e => ({
          heading: `${e.aircraft} — ${e.serviceType}`,
          rows: [
            { label: "Aircraft", value: `${e.aircraft} (${e.type})` },
            { label: "Current Base", value: e.currentBase },
            { label: "Maintenance Base", value: e.maintenanceBase },
            { label: "Ferry Required", value: e.ferryRequired ? "YES — see ferry schedule below" : "No — aircraft at maintenance base" },
            { label: "Service Due", value: `${e.dueDate} (${e.remainingDays} days)` },
            { label: "Urgency", value: e.urgency.toUpperCase() },
            { label: "Ferry OUT", value: e.aiPlan.ferryOutDate || "Not required" },
            { label: "Ferry Route OUT", value: e.aiPlan.ferryOutRoute || "N/A" },
            { label: "Ground Time", value: e.aiPlan.groundTime },
            { label: "Ferry Return", value: e.aiPlan.ferryReturnDate || "N/A" },
            { label: "Cover Aircraft", value: e.aiPlan.coverAircraft },
            { label: "AI Summary", value: e.aiPlan.summary },
          ],
        })),
        {
          heading: "Ferry Movement Schedule",
          rows: FERRY_SCHEDULE.map(f => ({
            label: `${f.id} — ${f.aircraft} (${f.direction})`,
            value: `${f.route} · ${f.aiRecommended} · ${f.purpose} · Pilot: ${f.pilot}`,
          })),
        },
        {
          heading: "All Action Items — Priority Order",
          rows: UPCOMING_EVENTS.flatMap(e =>
            e.aiPlan.actions.map(a => ({
              label: `${e.aircraft} — ${a.label}`,
              value: `${a.owner} · Due: ${a.due} · ${a.status.toUpperCase()}`,
            }))
          ),
        },
      ],
    });
  }

  const ev = selectedEvent;
  const plan = ev.aiPlan;
  const relatedFerry = FERRY_SCHEDULE.filter(f => f.eventId === ev.id);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            AI Maintenance Planner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Proactive scheduling · Ferry flight optimisation · Operational continuity · Veryon data
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={runAIAnalysis}
            disabled={runningAI}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-400/30 rounded-lg text-xs text-purple-400 hover:bg-purple-500/20 transition-colors font-semibold disabled:opacity-50"
          >
            {runningAI
              ? <><RefreshCw size={12} className="animate-spin" /> Analysing...</>
              : <><Brain size={12} /> Re-run AI</>
            }
          </button>
          <button
            onClick={downloadPlan}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold"
          >
            <Download size={12} /> Export Plan
          </button>
        </div>
      </div>

      {/* AI status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${aiRun ? "bg-purple-500/10 border-purple-400/20" : "bg-muted/30 border-card-border"}`}>
        <Brain size={15} className={aiRun ? "text-purple-400 shrink-0" : "text-muted-foreground shrink-0"} />
        <div className="flex-1 text-xs">
          {runningAI ? (
            <span className="text-purple-400 font-semibold">AI is analysing fleet maintenance schedule, component lives, crew availability, and operational tempo...</span>
          ) : aiRun ? (
            <>
              <span className="text-purple-400 font-semibold">AI analysis complete</span>
              <span className="text-muted-foreground ml-1.5">—{" "}
                <span className="text-red-400 font-semibold">1 critical</span>,{" "}
                <span className="text-orange-400 font-semibold">1 urgent</span>,{" "}
                <span className="text-amber-400 font-semibold">1 watch</span>,{" "}
                <span className="text-blue-400 font-semibold">1 plan</span>{" "}
                across 4 aircraft · {FERRY_SCHEDULE.length} ferry movements scheduled · Dubbo & Broken Hill bases optimised
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Click Re-run AI to analyse current fleet maintenance requirements and generate a structured ferry plan.</span>
          )}
        </div>
        {aiRun && !runningAI && (
          <span className="text-[10px] text-purple-400 font-mono shrink-0">
            {new Date().toLocaleTimeString("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit" })} AEST
          </span>
        )}
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Critical", value: UPCOMING_EVENTS.filter(e => e.urgency === "critical").length, sub: "Immediate action", color: "text-red-400", bg: "border-red-400/20" },
          { label: "Urgent", value: UPCOMING_EVENTS.filter(e => e.urgency === "urgent").length, sub: "Action within 7 days", color: "text-orange-400", bg: "border-orange-400/20" },
          { label: "Ferry Movements", value: FERRY_SCHEDULE.length, sub: "Scheduled by AI", color: "text-cyan-400", bg: "border-cyan-400/20" },
          { label: "Days Coverage", value: "43+", sub: "Proactive horizon", color: "text-green-400", bg: "border-green-400/20" },
        ].map((s, i) => (
          <div key={i} className={`bg-card rounded-xl border ${s.bg} p-4`}>
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs font-semibold mt-0.5">{s.label}</div>
            <div className="text-[10px] text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">

        {/* ── Left: Event list ── */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Upcoming Maintenance Events
          </div>

          {sorted.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEvent(e)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedEvent.id === e.id
                  ? "bg-cyan-400/10 border-cyan-400/40"
                  : "bg-card border-card-border hover:border-cyan-400/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{e.aircraft}</span>
                <UrgencyBadge urgency={e.urgency} label={
                  e.urgency === "critical" ? "Critical" :
                  e.urgency === "urgent" ? "Urgent" :
                  e.urgency === "watch" ? "Watch" : "Plan"
                } />
              </div>
              <div className="text-xs text-muted-foreground mb-1">{e.serviceType}</div>
              <div className="flex items-center gap-2 text-[11px]">
                <Calendar size={10} className="text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="font-semibold">{e.dueDate}</span>
                <span className="text-muted-foreground ml-auto">{e.remainingDays}d</span>
              </div>
              {e.ferryRequired && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-card-border">
                  <Plane size={10} className="text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-semibold">Ferry required — {e.currentBase.split(" ")[0]} → {e.maintenanceBase.split(" ")[0]}</span>
                </div>
              )}
              {e.components.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.components.map((c, i) => (
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                      c.status === "fail" ? "border-red-400/40 text-red-400 bg-red-500/5" :
                      c.status === "warn" ? "border-amber-400/40 text-amber-400 bg-amber-500/5" :
                      "border-card-border text-muted-foreground"
                    }`}>{c.name.split(" ").slice(0, 3).join(" ")}</span>
                  ))}
                </div>
              )}
            </button>
          ))}

          {/* Ferry movement timeline */}
          <div className="mt-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ferry Schedule</div>
            <div className="bg-card rounded-xl border border-card-border overflow-hidden">
              <div className="divide-y divide-border">
                {FERRY_SCHEDULE.map((f, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Plane size={11} className={
                          f.direction === "OUT" ? "text-amber-400" :
                          f.direction === "RETURN" ? "text-green-400" : "text-cyan-400"
                        } />
                        <span className="text-xs font-bold">{f.aircraft}</span>
                        <span className="text-[10px] text-muted-foreground">{f.direction}</span>
                      </div>
                      <UrgencyBadge urgency={f.urgency} label={f.urgency === "urgent" ? "Urgent" : "Plan"} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span className="text-cyan-400">{f.fromName}</span>
                      <ArrowRight size={10} className="text-muted-foreground" />
                      <span className="text-cyan-400">{f.toName}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{f.aiRecommended} · {f.flightTime}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: AI plan detail ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Aircraft card */}
          <div className="bg-card rounded-xl border border-card-border p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{ev.aircraft}</h2>
                  <UrgencyBadge urgency={ev.urgency} label={
                    ev.urgency === "critical" ? "Critical — Immediate Action" :
                    ev.urgency === "urgent" ? "Urgent — Action This Week" :
                    ev.urgency === "watch" ? "Watch — Plan in 30 Days" : "Plan — 60+ Days"
                  } />
                </div>
                <div className="text-sm text-muted-foreground">{ev.type} · {ev.serviceType}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Due: <span className="text-foreground font-semibold">{ev.dueDate}</span> · {ev.remainingDays} days · {ev.remainingHours > 0 ? `${ev.remainingHours} hrs remaining` : "Maintenance hold"}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">Current base</div>
                <div className="text-sm font-semibold">{ev.currentBase}</div>
                <div className="text-xs text-muted-foreground mt-1">Maintenance base</div>
                <div className="text-sm font-semibold">{ev.maintenanceBase}</div>
              </div>
            </div>

            {/* Component warnings */}
            {ev.components.length > 0 && (
              <div className="space-y-2 mb-4">
                {ev.components.map((c, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${
                    c.status === "fail" ? "border-red-400/30 bg-red-500/5" :
                    "border-amber-400/30 bg-amber-500/5"
                  }`}>
                    <AlertTriangle size={12} className={c.status === "fail" ? "text-red-400" : "text-amber-400"} />
                    <span className="font-semibold flex-1">{c.name}</span>
                    <span className={`font-mono text-[11px] ${c.status === "fail" ? "text-red-400" : "text-amber-400"}`}>{c.remaining}</span>
                    <span className="text-muted-foreground">{c.due}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI summary */}
            <div className="p-4 bg-purple-500/5 border border-purple-400/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={13} className="text-purple-400" />
                <span className="text-xs font-bold text-purple-400">Jennifer AI — Maintenance Assessment</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{plan.summary}</p>
            </div>
          </div>

          {/* Ferry plan */}
          {ev.ferryRequired || plan.ferryReturnDate ? (
            <div className="bg-card rounded-xl border border-card-border p-5">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                <Plane size={14} className="text-cyan-400" /> Ferry Movement Plan
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Ferry OUT", value: plan.ferryOutDate || "Not required", sub: plan.ferryOutRoute || "Aircraft at maintenance base", icon: <Plane size={12} className="text-amber-400" />, highlight: !!plan.ferryOutDate },
                  { label: "Ferry RETURN", value: plan.ferryReturnDate || "TBD", sub: plan.ferryReturnRoute || "Post maintenance release", icon: <Plane size={12} className="text-green-400" />, highlight: false },
                  { label: "Ground Time", value: plan.groundTime, sub: "Estimated maintenance window", icon: <Wrench size={12} className="text-orange-400" />, highlight: false },
                  { label: "Pilot Required", value: plan.pilotRequired, sub: "Ferry-endorsed, current currency", icon: <User size={12} className="text-blue-400" />, highlight: false },
                ].map((c, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${c.highlight ? "border-amber-400/30 bg-amber-500/5" : "border-card-border bg-background"}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">{c.icon} {c.label}</div>
                    <div className="text-sm font-semibold leading-snug">{c.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</div>
                  </div>
                ))}
              </div>

              {relatedFerry.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Movements</div>
                  {relatedFerry.map((f, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                      f.urgency === "urgent" ? "border-orange-400/30 bg-orange-500/5" : "border-card-border bg-background"
                    }`}>
                      <div className={`shrink-0 p-1.5 rounded-lg ${
                        f.direction === "OUT" ? "bg-amber-500/10" :
                        f.direction === "RETURN" ? "bg-green-500/10" : "bg-cyan-500/10"
                      }`}>
                        <Plane size={12} className={
                          f.direction === "OUT" ? "text-amber-400" :
                          f.direction === "RETURN" ? "text-green-400" : "text-cyan-400"
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold">{f.aircraft}</span>
                          <span className="text-[10px] text-muted-foreground">{f.direction}</span>
                          <span className="font-mono text-xs text-cyan-400">{f.fromName}</span>
                          <ArrowRight size={10} className="text-muted-foreground" />
                          <span className="font-mono text-xs text-cyan-400">{f.toName}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{f.purpose}</div>
                        <div className="text-[10px] text-muted-foreground">Pilot: {f.pilot} · {f.flightTime}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold">{f.aiRecommended}</div>
                        <div className="text-[10px] text-muted-foreground">{f.deadline}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <Shield size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="text-cyan-400 font-semibold">Operational cover: </span>
                    <span className="text-muted-foreground">{plan.coverAircraft}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Recommended window */}
          <div className="bg-card rounded-xl border border-card-border p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <Calendar size={14} className="text-cyan-400" /> AI Recommended Window
            </h3>
            <div className="p-3 bg-cyan-500/5 border border-cyan-400/20 rounded-xl text-sm leading-relaxed mb-4">
              {plan.windowRecommendation}
            </div>

            {/* Action list */}
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Structured Action Plan — {ev.aiPlan.actions.length} items
            </div>
            <div className="space-y-2">
              {plan.actions.map((a, i) => (
                <ActionRow key={i} action={a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
