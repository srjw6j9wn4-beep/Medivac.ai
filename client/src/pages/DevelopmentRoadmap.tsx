import { useState } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle, ChevronDown, ChevronUp, Zap, Shield, Wifi, Hospital, BarChart3, Stethoscope, Wrench, Filter } from "lucide-react";

type Priority = "P1" | "P2" | "P3";
type Status = "planned" | "in_progress" | "completed";

interface RoadmapItem {
  id: string;
  priority: Priority;
  title: string;
  timeline: string;
  impact: string;
  detail: string;
  icon: React.ReactNode;
  status: Status;
  category: string;
  closes_gap?: string;
}

const ITEMS: RoadmapItem[] = [
  {
    id: "r1",
    priority: "P1",
    title: "Hospital Referral Portal + FHIR API",
    timeline: "3–4 months",
    impact: "Critical",
    category: "Integration",
    icon: <Hospital size={18} />,
    status: "in_progress",
    closes_gap: "VectorCare, RapidSOS UNITE",
    detail:
      "A web-based portal for referring hospitals to submit transport requests directly into Medivac.ai dispatch — no phone call, no manual entry. HL7 FHIR REST endpoints for Epic/Cerner integration. Patient demographics and clinical context pre-populate the mission. Requesting hospital receives real-time mission status. Competes with VectorCare and RapidSOS UNITE, opens the hospital and NEPT tender procurement channel.",
  },
  {
    id: "r2",
    priority: "P1",
    title: "Live ADS-B Aircraft Tracking",
    timeline: "4–6 weeks",
    impact: "High",
    category: "Operations",
    icon: <Zap size={18} />,
    status: "in_progress",
    closes_gap: "HEMS Ops, Flight Vector, Honeywell",
    detail:
      "Integrate ADS-B Exchange or OzRunways API into the Mission Board and NSW Flight Map. Show live aircraft position, altitude, speed, and calculated ETA for every active mission. Alert when an aircraft deviates from its filed route. Closes the gap vs HEMS Ops, Flight Vector, and Honeywell.",
  },
  {
    id: "r3",
    priority: "P1",
    title: "Offline-First PWA for Dispatch and Crew",
    timeline: "6–8 weeks",
    impact: "High",
    category: "Mobile",
    icon: <Wifi size={18} />,
    status: "in_progress",
    closes_gap: "FL3XX, Flightman",
    detail:
      "Convert Dispatch, Pilot Handover, and Medical Equipment pages to offline-capable PWA modules using Service Workers and IndexedDB with sync on connectivity restoration. Essential for RFDS operations across remote NSW, SA, and Victoria. Reuse the architecture from the existing RFDS Journey Log PWA — significant groundwork already in place.",
  },
  {
    id: "r4",
    priority: "P2",
    title: "Advanced FTL Rolling-Window Compliance Engine",
    timeline: "4–6 weeks",
    impact: "High",
    category: "Compliance",
    icon: <Shield size={18} />,
    status: "in_progress",
    closes_gap: "Leon Software, Aviatize",
    detail:
      "Extend the FRMS/Duty module with rolling-window flight time totals — 7-day, 28-day, 90-day, 12-month — tracked per crew member against CASA Part 48 and EBA limits. Pre-assignment warnings on the Roster page. Hard block when an assignment would breach a limit. Brings Medivac.ai to parity with Leon Software and Aviatize on crew compliance.",
  },
  {
    id: "r5",
    priority: "P2",
    title: "In-Flight Patient Care Record",
    timeline: "6–8 weeks",
    impact: "High",
    category: "Clinical",
    icon: <Stethoscope size={18} />,
    status: "in_progress",
    closes_gap: "No competitor covers both dispatch and in-flight clinical record",
    detail:
      "Structured clinical documentation for flight nurses and doctors: vital signs trending, medications administered, procedures performed, Glasgow Coma Scale, pain score, and handover summary. Auto-populates from NEPT/dispatch mission data. Exports as PDF clinical handover for the receiving hospital. No competitor covers both dispatch and in-flight clinical record in a single system.",
  },
  {
    id: "r6",
    priority: "P2",
    title: "Component Life Tracking and AD/SB Management",
    timeline: "8–10 weeks",
    impact: "Medium",
    category: "Engineering",
    icon: <Wrench size={18} />,
    status: "in_progress",
    closes_gap: "Ramco Aviation, Flightdocs",
    detail:
      "Extend the Engineering module with component life tracking (hours, cycles, calendar limits per component per registration), AD/SB applicability with automatic alerts, and parts inventory with minimum stock thresholds and reorder triggers. Closes the gap with Ramco and Flightdocs.",
  },
  {
    id: "r7",
    priority: "P3",
    title: "Avinode Air Ambulance Marketplace Listing",
    timeline: "2–4 weeks",
    impact: "Medium",
    category: "Business",
    icon: <BarChart3 size={18} />,
    status: "in_progress",
    closes_gap: "Distribution gap — Avinode reaches 180+ operators, 430+ aircraft",
    detail:
      "List RFDS SE aircraft and availability on the Avinode Air Ambulance Platform (180+ vetted operators, 430+ aircraft, 765+ missions annually). Receive external charter requests directly into Medivac.ai's Charter Quote workflow. A distribution play — Avinode brings inbound demand.",
  },
  {
    id: "r8",
    priority: "P3",
    title: "Predictive Mission Demand Forecasting",
    timeline: "3–4 months",
    impact: "Strategic",
    category: "AI",
    icon: <BarChart3 size={18} />,
    status: "in_progress",
    closes_gap: "No equivalent in any aeromedical platform globally",
    detail:
      "Use historical mission data — type, origin, destination, time of day, season, referring hospital, weather — to train demand forecasting models. Show expected mission load for the next 7 days. Automatically suggest aircraft positioning and staffing based on predicted demand. A genuine AI capability with no equivalent in any aeromedical platform globally.",
  },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string; badge: string }> = {
  P1: {
    label: "Priority 1 — Critical",
    bg: "bg-red-950/40",
    text: "text-red-300",
    border: "border-red-800/50",
    badge: "bg-red-700 text-white",
  },
  P2: {
    label: "Priority 2 — High Impact",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    border: "border-amber-800/50",
    badge: "bg-amber-700 text-white",
  },
  P3: {
    label: "Priority 3 — Strategic",
    bg: "bg-cyan-950/40",
    text: "text-cyan-300",
    border: "border-cyan-800/50",
    badge: "bg-cyan-800 text-white",
  },
};

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ReactNode; color: string }> = {
  planned: { label: "Planned", icon: <Circle size={14} />, color: "text-slate-400" },
  in_progress: { label: "In Progress", icon: <Clock size={14} />, color: "text-amber-400" },
  completed: { label: "Completed", icon: <CheckCircle2 size={14} />, color: "text-emerald-400" },
};

const CATEGORIES = ["All", "Integration", "Operations", "Mobile", "Compliance", "Clinical", "Engineering", "Business", "AI"];

export default function DevelopmentRoadmap() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<"All" | Priority>("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState<"All" | Status>("All");
  // track local status overrides
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});

  const getStatus = (id: string, base: Status): Status => statusOverrides[id] ?? base;

  const filtered = ITEMS.filter(item => {
    if (filterPriority !== "All" && item.priority !== filterPriority) return false;
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    const st = getStatus(item.id, item.status);
    if (filterStatus !== "All" && st !== filterStatus) return false;
    return true;
  });

  const counts = {
    planned: ITEMS.filter(i => getStatus(i.id, i.status) === "planned").length,
    in_progress: ITEMS.filter(i => getStatus(i.id, i.status) === "in_progress").length,
    completed: ITEMS.filter(i => getStatus(i.id, i.status) === "completed").length,
  };

  const cycleStatus = (id: string, current: Status) => {
    const next: Record<Status, Status> = { planned: "in_progress", in_progress: "completed", completed: "planned" };
    setStatusOverrides(prev => ({ ...prev, [id]: next[current] }));
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Development Roadmap</h1>
        <p className="text-slate-400 text-sm mt-1">
          8 features to close competitor gaps and establish Medivac.ai as the world-leading aeromedical operations platform.
          Sourced from the July 2026 Global Competitive Analysis.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          { label: "Planned", count: counts.planned, color: "text-slate-400", bg: "bg-slate-800/50" },
          { label: "In Progress", count: counts.in_progress, color: "text-amber-400", bg: "bg-amber-950/40" },
          { label: "Completed", count: counts.completed, color: "text-emerald-400", bg: "bg-emerald-950/40" },
        ] as const).map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg p-4 border border-white/5`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <Filter size={14} className="text-slate-500" />

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-600"
        >
          <option value="All">All Priorities</option>
          <option value="P1">P1 — Critical</option>
          <option value="P2">P2 — High</option>
          <option value="P3">P3 — Strategic</option>
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-600"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-600"
        >
          <option value="All">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <span className="text-xs text-slate-500 ml-1">{filtered.length} of {ITEMS.length} items</span>
      </div>

      {/* Roadmap items */}
      <div className="space-y-3">
        {filtered.map(item => {
          const pc = PRIORITY_CONFIG[item.priority];
          const st = getStatus(item.id, item.status);
          const sc = STATUS_CONFIG[st];
          const isOpen = expanded === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-xl border ${pc.border} ${pc.bg} overflow-hidden transition-all`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer select-none"
                onClick={() => setExpanded(isOpen ? null : item.id)}
              >
                {/* Priority badge */}
                <span className={`${pc.badge} text-[10px] font-bold px-2 py-0.5 rounded shrink-0`}>
                  {item.priority}
                </span>

                {/* Icon */}
                <span className={`${pc.text} shrink-0`}>{item.icon}</span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm leading-tight">{item.title}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-[11px] text-slate-400">{item.timeline}</span>
                    <span className={`text-[11px] font-medium ${pc.text}`}>{item.impact}</span>
                    <span className="text-[11px] text-slate-500">{item.category}</span>
                  </div>
                </div>

                {/* Status chip — click to cycle */}
                <button
                  onClick={e => { e.stopPropagation(); cycleStatus(item.id, st); }}
                  className={`flex items-center gap-1 text-[11px] font-medium ${sc.color} bg-slate-800/60 border border-slate-700/50 rounded-full px-2.5 py-1 hover:bg-slate-700/60 transition-colors shrink-0`}
                  title="Click to update status"
                >
                  {sc.icon}
                  {sc.label}
                </button>

                {/* Expand chevron */}
                <span className="text-slate-500 shrink-0">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
                  <p className="text-sm text-slate-300 leading-relaxed">{item.detail}</p>

                  {item.closes_gap && (
                    <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      <span><span className="text-amber-400 font-medium">Closes gap vs: </span>{item.closes_gap}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <span>Update status:</span>
                    {(["planned", "in_progress", "completed"] as Status[]).map(s => {
                      const sc2 = STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          onClick={() => setStatusOverrides(prev => ({ ...prev, [item.id]: s }))}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-colors
                            ${st === s
                              ? `${sc2.color} border-current bg-slate-700/60`
                              : "text-slate-500 border-slate-700 hover:border-slate-500"
                            }`}
                        >
                          {sc2.icon}
                          {sc2.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-12 text-sm">No items match the current filters.</div>
        )}
      </div>

      {/* Source note */}
      <div className="mt-8 text-xs text-slate-600 border-t border-slate-800 pt-4">
        Source: Medivac.ai Global Competitive Analysis — July 2026 · Amendments approved by RFDS SE Product Team
      </div>
    </div>
  );
}
