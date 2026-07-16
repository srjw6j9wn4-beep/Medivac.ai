/**
 * OpsRoomDisplay — Full-screen ops room board for large monitors
 * Opens standalone (no Layout wrapper), auto-refreshes every 30s.
 * Designed for 1080p–4K displays in the RFDS SE operations room.
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Aircraft reg → base
const REG_BASE: Record<string, string> = {
  "VH-MVW": "Dubbo",  "VH-XYJ": "Dubbo",  "VH-XYU": "Dubbo",  "VH-MVX": "Dubbo",
  "VH-LTQ": "Bankstown", "VH-MWH": "Bankstown", "VH-MWK": "Bankstown", "VH-RFD": "Bankstown",
  "VH-VPQ": "Bankstown",
};
function taskBase(t: { aircraftReg: string | null; pickupIcao: string | null }): string {
  if (t.aircraftReg && REG_BASE[t.aircraftReg]) return REG_BASE[t.aircraftReg];
  if (t.pickupIcao) {
    const icao = t.pickupIcao.toUpperCase();
    if (["YWDB","YWLG","YWCA","YNRM","YWOL"].some(x => icao.includes(x))) return "Dubbo";
    if (["YSBK","YSSY","YSCB"].some(x => icao.includes(x))) return "Bankstown";
    if (["YBHI"].some(x => icao.includes(x))) return "Broken Hill";
  }
  return "Dubbo";
}
const BASES = ["Dubbo", "Bankstown", "Broken Hill"] as const;
import { apiRequest } from "@/lib/queryClient";
import {
  Ambulance, Clock, Plane, MapPin, User, ArrowRight,
  AlertTriangle, CheckCircle2, RefreshCw, Maximize2, Minimize2,
  Wifi, WifiOff, Radio,
} from "lucide-react";

// ─── Types (mirrored from NEPTTasking) ─────────────────────────────────────
type TaskStatus   = "Pending" | "Assigned" | "Released" | "En Route" | "Complete" | "Cancelled";
type TaskPriority = "Routine" | "Urgent" | "Emergency";

interface Sector {
  from: string; fromIcao: string;
  to: string;   toIcao: string;
  eta: string | null;
}

interface NeptTask {
  id: number;
  taskRef: string;
  status: TaskStatus;
  priority: TaskPriority;
  requestTime: string;
  requiredBy: string | null;
  pickupLocation: string;
  pickupIcao: string | null;
  destLocation: string;
  destIcao: string | null;
  patientRef: string | null;
  patientName: string | null;
  escortName: string | null;
  referringHospital: string | null;
  receivingHospital: string | null;
  aircraftReg: string | null;
  pilotName: string | null;
  nurseName: string | null;
  estimatedEta: string | null;
  actualDepart: string | null;
  completedAt: string | null;
  notes: string | null;
  patients: string | null;               // JSON array
  specialConsiderations: string | null;  // comma-separated
  pickupTimeNote: string | null;
  dropoffTimeNote: string | null;
  sectors: Sector[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function statusCfg(s: TaskStatus) {
  return {
    Pending:    { bg: "bg-slate-800/80",   border: "border-slate-600/50",   dot: "bg-slate-400",   text: "text-slate-300",   label: "PENDING"    },
    Assigned:   { bg: "bg-blue-950/80",    border: "border-blue-600/50",    dot: "bg-blue-400",    text: "text-blue-300",    label: "ASSIGNED"   },
    Released:   { bg: "bg-violet-950/80",  border: "border-violet-600/50",  dot: "bg-violet-400",  text: "text-violet-300",  label: "RELEASED"   },
    "En Route": { bg: "bg-amber-950/80",   border: "border-amber-500/60",   dot: "bg-amber-400",   text: "text-amber-300",   label: "EN ROUTE"   },
    Complete:   { bg: "bg-green-950/70",   border: "border-green-600/40",   dot: "bg-green-400",   text: "text-green-300",   label: "COMPLETE"   },
    Cancelled:  { bg: "bg-zinc-900/60",    border: "border-zinc-700/40",    dot: "bg-zinc-500",    text: "text-zinc-400",    label: "CANCELLED"  },
  }[s];
}

function priorityCfg(p: TaskPriority) {
  return {
    Routine:   { ring: "",                             badge: "text-slate-400 bg-slate-700/60 border-slate-600/40",   icon: "" },
    Urgent:    { ring: "ring-2 ring-amber-500/40",     badge: "text-amber-300 bg-amber-900/60 border-amber-500/40",   icon: "⚠" },
    Emergency: { ring: "ring-2 ring-red-500/60",       badge: "text-red-300 bg-red-900/60 border-red-500/50",         icon: "🔴" },
  }[p];
}

function locationChain(sectors: Sector[]): string {
  if (!sectors.length) return "";
  const nodes: string[] = [];
  sectors.forEach((s, i) => {
    if (i === 0) nodes.push(s.from || s.fromIcao || "?");
    nodes.push(s.to || s.toIcao || "?");
  });
  return nodes.join(" → ");
}

function icaoChain(sectors: Sector[]): string {
  if (!sectors.length) return "";
  const nodes: string[] = [];
  sectors.forEach((s, i) => {
    if (i === 0) nodes.push(s.fromIcao || s.from || "?");
    nodes.push(s.toIcao || s.to || "?");
  });
  return nodes.join(" → ");
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return iso; }
}

function fmtDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
  } catch { return ""; }
}

// ─── Live clock ──────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── ETA countdown ────────────────────────────────────────────────────────
function ETACountdown({ eta, status, large }: { eta: string | null; status: TaskStatus; large?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!eta || status === "Complete" || status === "Cancelled") return null;
  const diffMs = new Date(eta).getTime() - now;
  const past   = diffMs < 0;
  const absMs  = Math.abs(diffMs);
  const hrs    = Math.floor(absMs / 3_600_000);
  const mins   = Math.floor((absMs % 3_600_000) / 60_000);
  const secs   = Math.floor((absMs % 60_000) / 1_000);
  const label  = hrs > 0
    ? `${past ? "-" : ""}${hrs}h ${mins}m`
    : `${past ? "-" : ""}${mins}m ${String(secs).padStart(2, "0")}s`;
  const colour = past
    ? "text-red-400"
    : diffMs < 5 * 60_000  ? "text-orange-400"
    : diffMs < 15 * 60_000 ? "text-amber-300"
    : "text-cyan-300";
  return (
    <span className={`tabular-nums font-bold ${colour} ${large ? "text-lg" : "text-sm"}`}>
      {past ? "OVERDUE " : ""}{label}
    </span>
  );
}

// ─── Status order for display ─────────────────────────────────────────────
const STATUS_ORDER: TaskStatus[] = ["Emergency" as any, "En Route", "Released", "Assigned", "Pending", "Complete", "Cancelled"];

function sortTasks(tasks: NeptTask[]): NeptTask[] {
  return [...tasks].sort((a, b) => {
    // Emergency always first
    if (a.priority === "Emergency" && b.priority !== "Emergency") return -1;
    if (b.priority === "Emergency" && a.priority !== "Emergency") return 1;
    // Then by status order
    const ao = STATUS_ORDER.indexOf(a.status as any);
    const bo = STATUS_ORDER.indexOf(b.status as any);
    if (ao !== bo) return ao - bo;
    // Then by ETA ascending
    if (a.estimatedEta && b.estimatedEta) return a.estimatedEta.localeCompare(b.estimatedEta);
    if (a.estimatedEta) return -1;
    if (b.estimatedEta) return 1;
    return 0;
  });
}

// ─── Task card ────────────────────────────────────────────────────────────
function TaskCard({ task }: { task: NeptTask }) {
  const sc = statusCfg(task.status);
  const pc = priorityCfg(task.priority);
  const route = task.sectors?.length
    ? { loc: locationChain(task.sectors), icao: icaoChain(task.sectors) }
    : { loc: `${task.pickupLocation} → ${task.destLocation}`, icao: `${task.pickupIcao ?? ""} → ${task.destIcao ?? ""}` };

  const isDimmed = task.status === "Complete" || task.status === "Cancelled";

  return (
    <div className={`
      rounded-2xl border p-5 flex flex-col gap-3 transition-all
      ${sc.bg} ${sc.border} ${pc.ring}
      ${isDimmed ? "opacity-50" : ""}
    `}>
      {/* Row 1: ref + priority + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {task.priority === "Emergency" && (
            <span className="animate-pulse text-red-400 text-lg font-black">⚠</span>
          )}
          <span className="font-black text-xl text-white tabular-nums" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {task.taskRef}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${pc.badge}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${sc.dot} ${task.status === "En Route" ? "animate-pulse" : ""}`} />
          <span className={`text-sm font-bold tracking-widest ${sc.text}`}>{sc.label}</span>
        </div>
      </div>

      {/* Row 2: Route */}
      <div className="flex items-start gap-2">
        <MapPin size={14} className="text-cyan-400/70 mt-0.5 shrink-0" />
        <div>
          <div className="text-white font-semibold text-base leading-snug">{route.loc}</div>
          {route.icao.trim().replace(/→/g, "").trim() && (
            <div className="text-cyan-400/70 font-mono text-xs mt-0.5">{route.icao}</div>
          )}
        </div>
      </div>

      {/* Row 3: Aircraft + Crew */}
      {(task.aircraftReg || task.pilotName || task.nurseName) && (
        <div className="flex flex-wrap gap-3 text-sm">
          {task.aircraftReg && (
            <div className="flex items-center gap-1.5">
              <Plane size={13} className="text-cyan-400/80" />
              <span className="font-mono font-bold text-white">{task.aircraftReg}</span>
            </div>
          )}
          {task.pilotName && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <User size={12} className="text-slate-400" />
              <span>{task.pilotName}</span>
            </div>
          )}
          {task.nurseName && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-xs text-slate-500">RN</span>
              <span>{task.nurseName}</span>
            </div>
          )}
        </div>
      )}

      {/* Row 4: Patients — multi-patient with special considerations + time notes */}
      {(() => {
        // Parse patients JSON if present
        let patients: Array<{ id: string; name: string; ref: string; mobility: string; specialConsiderations: string[] }> = [];
        if (task.patients) {
          try { patients = JSON.parse(task.patients); } catch {}
        }
        // Fall back to legacy single-patient fields
        if (patients.length === 0 && (task.patientRef || task.patientName)) {
          const cons = task.specialConsiderations ? task.specialConsiderations.split(",").map(s => s.trim()).filter(Boolean) : [];
          patients = [{ id: "legacy", name: task.patientName ?? "", ref: task.patientRef ?? "", mobility: "ambulant", specialConsiderations: cons }];
        }
        if (patients.length === 0) return null;
        return (
          <div className="space-y-1.5">
            {patients.map((pt, i) => (
              <div key={pt.id ?? i} className="text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-slate-300 font-semibold">{pt.ref || pt.name || `Pt ${i + 1}`}</span>
                  {pt.name && pt.ref && <span className="text-slate-500">{pt.name}</span>}
                  {pt.mobility === "stretcher"
                    ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">Stretcher</span>
                    : <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-green-500/15 text-green-400 border border-green-500/20">Ambulant</span>
                  }
                </div>
                {pt.specialConsiderations && pt.specialConsiderations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide mr-0.5">Special:</span>
                    {pt.specialConsiderations.map(f => (
                      <span key={f} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {task.escortName && (
              <div className="text-xs text-slate-500">+ escort {task.escortName}</div>
            )}
            {(task.pickupTimeNote || task.dropoffTimeNote) && (
              <div className="flex flex-col gap-0.5 pt-0.5">
                {task.pickupTimeNote && (
                  <div className="flex items-center gap-1 text-[10px] text-cyan-300/80">
                    <span className="text-cyan-500/60">↑</span> {task.pickupTimeNote}
                  </div>
                )}
                {task.dropoffTimeNote && (
                  <div className="flex items-center gap-1 text-[10px] text-green-300/80">
                    <span className="text-green-500/60">↓</span> {task.dropoffTimeNote}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Row 5: Hospitals */}
      {(task.referringHospital || task.receivingHospital) && (
        <div className="text-xs text-slate-400">
          {task.referringHospital && <span>{task.referringHospital}</span>}
          {task.referringHospital && task.receivingHospital && (
            <ArrowRight size={10} className="inline mx-1.5 opacity-50" />
          )}
          {task.receivingHospital && <span>{task.receivingHospital}</span>}
        </div>
      )}

      {/* Row 6: ETA */}
      {task.estimatedEta && task.status !== "Complete" && task.status !== "Cancelled" && (
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-cyan-400/70" />
            <span className="text-slate-400 text-xs">ETA</span>
            <span className="text-white font-mono text-sm font-semibold">
              {fmtTime(task.estimatedEta)}
              {fmtDate(task.estimatedEta) !== fmtDate(new Date().toISOString()) && (
                <span className="text-xs text-slate-500 ml-1">{fmtDate(task.estimatedEta)}</span>
              )}
            </span>
          </div>
          <ETACountdown eta={task.estimatedEta} status={task.status} />
        </div>
      )}

      {/* Complete time */}
      {task.status === "Complete" && task.completedAt && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <CheckCircle2 size={13} className="text-green-400/70" />
          <span className="text-slate-500 text-xs">Completed {fmtTime(task.completedAt)}</span>
        </div>
      )}
    </div>
  );
}

// ─── KPI tile ─────────────────────────────────────────────────────────────
function KpiTile({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col">
      <div className={`text-4xl font-black tabular-nums ${color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        {value}
      </div>
      <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{label}</div>
      {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export default function OpsRoomDisplay() {
  const clock   = useClock();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter: show active + recent complete (last 2h)
  const [showCompleted, setShowCompleted] = useState(true);

  const { data: rawTasks = [], isLoading, isError, refetch } = useQuery<any[]>({
    queryKey: ["/api/nept-tasks"],
    refetchInterval: 30_000,
  });

  const { data: breaks = [] } = useQuery<any[]>({
    queryKey: ["/api/nept-breaks"],
    refetchInterval: 30_000,
  });

  const tasks: NeptTask[] = useMemo(() =>
    rawTasks.map(t => ({
      ...t,
      sectors: t.sectors
        ? (typeof t.sectors === "string" ? JSON.parse(t.sectors) : t.sectors)
        : null,
    })),
  [rawTasks]);

  // Track refresh time
  useEffect(() => {
    setLastRefresh(new Date());
  }, [rawTasks]);

  // KPI counts
  const counts = useMemo(() => ({
    total:     tasks.length,
    pending:   tasks.filter(t => t.status === "Pending").length,
    assigned:  tasks.filter(t => t.status === "Assigned").length,
    released:  tasks.filter(t => t.status === "Released").length,
    enRoute:   tasks.filter(t => t.status === "En Route").length,
    complete:  tasks.filter(t => t.status === "Complete").length,
    emergency: tasks.filter(t => t.priority === "Emergency" && !["Complete","Cancelled"].includes(t.status)).length,
  }), [tasks]);

  // Active tasks for display
  const displayTasks = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 3_600_000;
    return sortTasks(tasks.filter(t => {
      if (t.status === "Cancelled") return false;
      if (t.status === "Complete") {
        if (!showCompleted) return false;
        // Only show recently completed (last 2h)
        const completedAt = t.completedAt ? new Date(t.completedAt).getTime() : 0;
        return completedAt > twoHoursAgo;
      }
      return true;
    }));
  }, [tasks, showCompleted]);

  // Fullscreen toggle
  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      try { await document.documentElement.requestFullscreen?.(); } catch {}
      setIsFullscreen(true);
    } else {
      try { await document.exitFullscreen?.(); } catch {}
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Today's date string
  const dateStr = clock.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = clock.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const hasEmergency = counts.emergency > 0;

  return (
    <div className={`min-h-screen bg-[#080b10] text-white flex flex-col select-none ${hasEmergency ? "ring-4 ring-inset ring-red-600/30" : ""}`}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/8 bg-[#0b0f17]/80 backdrop-blur-sm">
        <div className="flex items-center gap-5">
          {/* Logo wordmark */}
          <div className="flex items-center gap-2.5">
            <Ambulance size={22} className="text-cyan-400" />
            <span className="text-lg font-black tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Medivac<span className="text-cyan-400">.ai</span>
            </span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">RFDS South Eastern Section</div>
            <div className="text-xs font-semibold text-slate-300">Operations Room — Live Tasking Display</div>
          </div>
        </div>

        {/* Clock */}
        <div className="text-center">
          <div className="text-4xl font-black tabular-nums text-white" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {timeStr}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{dateStr}</div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isError
              ? <><WifiOff size={12} className="text-red-400" /><span className="text-red-400">Offline</span></>
              : <><Wifi size={12} className="text-green-400" /><span className="text-green-400/80">Live</span></>
            }
          </div>
          <div className="text-[10px] text-slate-600 tabular-nums">
            Updated {fmtTime(lastRefresh.toISOString())}
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowCompleted(v => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${showCompleted ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-white/10 text-slate-400"}`}
          >
            {showCompleted ? "Hide" : "Show"} Completed
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* ── KPI BAR ─────────────────────────────────────────────────────── */}
      <div className="px-8 py-4 grid grid-cols-7 gap-3 border-b border-white/6">
        <KpiTile label="Today's Tasks"  value={counts.total}    color="text-white" />
        <KpiTile label="Pending"        value={counts.pending}   color="text-slate-300" />
        <KpiTile label="Assigned"       value={counts.assigned}  color="text-blue-300" />
        <KpiTile label="Released"       value={counts.released}  color="text-violet-300" />
        <KpiTile label="En Route"       value={counts.enRoute}   color="text-amber-300" sub={counts.enRoute > 0 ? "AIRBORNE" : ""} />
        <KpiTile label="Complete"       value={counts.complete}  color="text-green-300" />
        <KpiTile
          label="Emergency"
          value={counts.emergency}
          color={counts.emergency > 0 ? "text-red-400" : "text-slate-600"}
          sub={counts.emergency > 0 ? "ACTIVE" : ""}
        />
      </div>

      {/* ── EMERGENCY ALERT BANNER ────────────────────────────────────────── */}
      {hasEmergency && (
        <div className="mx-8 mt-4 flex items-center gap-4 px-6 py-3 bg-red-950/60 border border-red-500/50 rounded-2xl animate-pulse">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <span className="text-red-300 font-bold tracking-wide text-sm">
            {counts.emergency} EMERGENCY TASK{counts.emergency > 1 ? "S" : ""} ACTIVE — IMMEDIATE ACTION REQUIRED
          </span>
          <Radio size={16} className="ml-auto text-red-400/60 animate-ping" />
        </div>
      )}

      {/* ── TASK GRID ────────────────────────────────────────────────────── */}
      <main className="flex-1 px-8 py-6 overflow-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <RefreshCw size={28} className="text-cyan-400/50 animate-spin" />
            <span className="text-slate-500">Loading tasks…</span>
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-3 gap-6 h-full">
            {BASES.map(base => {
              const baseTasks  = displayTasks.filter(t => taskBase(t) === base);
              const baseBreaks = breaks.filter((b: any) => b.base === base);
              const hasItems   = baseTasks.length > 0 || baseBreaks.length > 0;
              return (
                <div key={base} className="flex flex-col gap-3">
                  {/* Base header */}
                  <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{base}</span>
                    {baseTasks.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-[10px] font-bold">{baseTasks.length}</span>}
                    {baseBreaks.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">{baseBreaks.length} break{baseBreaks.length > 1 ? "s" : ""}</span>}
                  </div>

                  {!hasItems && (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-center opacity-30">
                      <CheckCircle2 size={24} className="text-green-400" />
                      <span className="text-slate-500 text-xs">Clear</span>
                    </div>
                  )}

                  {/* Task cards */}
                  {baseTasks.map(t => <TaskCard key={t.id} task={t} />)}

                  {/* Break cards */}
                  {baseBreaks.map((b: any) => {
                    const isMeal = b.category === "Meal Break";
                    const start  = b.startTime ? new Date(b.startTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
                    const end    = b.endTime   ? new Date(b.endTime).toLocaleTimeString("en-AU",   { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
                    return (
                      <div key={b.id} className={`rounded-xl border p-3 space-y-1.5 ${
                        isMeal
                          ? "bg-orange-950/60 border-orange-500/40"
                          : "bg-purple-950/60 border-purple-500/40"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
                            isMeal ? "text-orange-300" : "text-purple-300"
                          }`}>
                            <Clock size={11} />
                            {b.category}
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">{start} – {end}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <User size={10} className="text-slate-500 shrink-0" />
                          <span className="truncate">{b.crewNames}</span>
                        </div>
                        {b.notes && <div className="text-[10px] text-slate-500 truncate">{b.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="px-8 py-3 border-t border-white/6 flex items-center justify-between text-[11px] text-slate-600">
        <span>RFDS South Eastern Section · NSW Health NEPT Contract · CONFIDENTIAL — OPERATIONS USE ONLY</span>
        <span className="tabular-nums">Auto-refresh every 30s · CASA AOC {new Date().getFullYear()}</span>
      </footer>

    </div>
  );
}
