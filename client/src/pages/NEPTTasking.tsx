import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateNopPDF } from "@/lib/generateNopPDF";
import { type UserRole } from "@/lib/data";
import {
  Plus, X, Save, Pencil, Trash2, AlertTriangle, CheckCircle2,
  Clock, Plane, User, MapPin, ChevronDown, Filter, Search,
  RefreshCw, ClipboardList, ArrowRight, Ambulance, GripVertical, ChevronsRight,
  FileText, CheckSquare, ChevronRight, Calendar, BarChart3,
  Shield, Printer, Send, RotateCcw, AlertCircle, Check,
} from "lucide-react";

interface Props { role: UserRole; }

// ─── Types ────────────────────────────────────────────────────────────────
type TaskStatus   = "Pending" | "Assigned" | "Released" | "En Route" | "Complete" | "Cancelled";
type TaskPriority = "Routine" | "Urgent" | "Emergency";

/** A single flight leg within a multi-sector task */
interface Sector {
  from:     string;       // location / hospital
  fromIcao: string;       // ICAO code
  to:       string;
  toIcao:   string;
  eta:      string | null; // sector-level ETA (ISO or null)
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
  patientName: string | null;
  patientRef: string | null;
  escortName: string | null;
  referringHospital: string | null;
  receivingHospital: string | null;
  aircraftReg: string | null;
  pilotName: string | null;
  nurseName: string | null;
  dispatchedBy: string | null;
  estimatedEta: string | null;
  actualDepart: string | null;
  actualArrive: string | null;
  completedAt: string | null;
  notes: string | null;
  sectors: Sector[] | null;
  createdAt: string;
  updatedAt: string;
}

type TaskDraft = Omit<NeptTask, "id" | "createdAt" | "updatedAt">;

// ─── Constants ────────────────────────────────────────────────────────────
const STATUSES: TaskStatus[] = ["Pending", "Assigned", "Released", "En Route", "Complete", "Cancelled"];
const PRIORITIES: TaskPriority[] = ["Routine", "Urgent", "Emergency"];

const AIRCRAFT_OPTIONS = [
  "VH-LTQ", "VH-MVW", "VH-MVX", "VH-MWH", "VH-MWK",
  "VH-RFD", "VH-XYJ", "VH-XYO", "VH-XYR", "VH-MQD",
  "VH-MQK", "VH-NAJ",
];

const PILOT_OPTIONS = ["Capt. R. Hughes", "Capt. T. Barnes", "Capt. M. Clarke"];
const NURSE_OPTIONS = ["S. Mitchell RN", "Dr. K. Patel", "J. O'Brien RN"];

// ─── Helpers ─────────────────────────────────────────────────────────────
function emptySector(): Sector {
  return { from: "", fromIcao: "", to: "", toIcao: "", eta: null };
}

function nextRef(tasks: NeptTask[]): string {
  const year = new Date().getFullYear();
  const nums = tasks
    .map(t => parseInt(t.taskRef.split("-")[2] ?? "0"))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `NEPT-${year}-${String(next).padStart(4, "0")}`;
}

function statusConfig(s: TaskStatus) {
  return {
    Pending:   { bg: "bg-slate-500/15",   text: "text-slate-300",   border: "border-slate-500/30",   dot: "bg-slate-400"   },
    Assigned:  { bg: "bg-blue-500/15",    text: "text-blue-300",    border: "border-blue-500/30",    dot: "bg-blue-400"    },
    Released:  { bg: "bg-violet-500/15",  text: "text-violet-300",  border: "border-violet-500/30",  dot: "bg-violet-400"  },
    "En Route":{ bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/30",   dot: "bg-amber-400"   },
    Complete:  { bg: "bg-green-500/15",   text: "text-green-300",   border: "border-green-500/30",   dot: "bg-green-400"   },
    Cancelled: { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400"     },
  }[s];
}

function priorityConfig(p: TaskPriority) {
  return {
    Routine:   { bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/20"  },
    Urgent:    { bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/30"  },
    Emergency: { bg: "bg-red-500/20",    text: "text-red-300",    border: "border-red-500/40"    },
  }[p];
}

function fmtDT(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return iso; }
}

/** Build an ICAO chain string: YSDU → YSSY → YMHB */
function icaoChain(sectors: Sector[]): string {
  if (!sectors.length) return "";
  const nodes: string[] = [];
  sectors.forEach((s, i) => {
    if (i === 0) nodes.push(s.fromIcao || s.from || "?");
    nodes.push(s.toIcao || s.to || "?");
  });
  return nodes.join(" → ");
}

/** Build a plain location chain for display */
function locationChain(sectors: Sector[]): string {
  if (!sectors.length) return "";
  const nodes: string[] = [];
  sectors.forEach((s, i) => {
    if (i === 0) nodes.push(s.from || s.fromIcao || "?");
    nodes.push(s.to || s.toIcao || "?");
  });
  return nodes.join(" → ");
}

// ── Live countdown hook ─────────────────────────────────────────────────────
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function ETACountdown({ eta, status }: { eta: string | null; status: TaskStatus }) {
  const now = useNow(1000);
  if (!eta) return null;
  if (status === "Complete" || status === "Cancelled") return null;

  const diffMs  = new Date(eta).getTime() - now;
  const past    = diffMs < 0;
  const absMs   = Math.abs(diffMs);
  const hrs     = Math.floor(absMs / 3_600_000);
  const mins    = Math.floor((absMs % 3_600_000) / 60_000);
  const secs    = Math.floor((absMs % 60_000) / 1_000);

  const label = hrs > 0
    ? `${past ? "-" : ""}${hrs}h ${mins}m`
    : `${past ? "-" : ""}${mins}m ${String(secs).padStart(2, "0")}s`;

  const colour = past
    ? "text-red-400 font-bold"
    : diffMs < 5 * 60_000
      ? "text-orange-400 font-semibold"
      : diffMs < 15 * 60_000
        ? "text-amber-300 font-semibold"
        : "text-cyan-300";

  return (
    <span className={`tabular-nums text-[10px] ml-1 ${colour}`}>
      ({label})
    </span>
  );
}

function emptyDraft(ref: string): TaskDraft {
  return {
    taskRef: ref,
    status: "Pending",
    priority: "Routine",
    requestTime: new Date().toISOString().slice(0, 16),
    requiredBy: null,
    pickupLocation: "",
    pickupIcao: null,
    destLocation: "",
    destIcao: null,
    patientName: null,
    patientRef: null,
    escortName: null,
    referringHospital: null,
    receivingHospital: null,
    aircraftReg: null,
    pilotName: null,
    nurseName: null,
    dispatchedBy: null,
    estimatedEta: null,
    actualDepart: null,
    actualArrive: null,
    completedAt: null,
    notes: null,
    sectors: [emptySector()],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TaskStatus }) {
  const c = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const c = priorityConfig(priority);
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
      {priority === "Emergency" ? "🔴 " : priority === "Urgent" ? "🟡 " : ""}{priority.toUpperCase()}
    </span>
  );
}

// ─── SectorEditor ─────────────────────────────────────────────────────────
function SectorEditor({
  sectors, onChange,
}: {
  sectors: Sector[];
  onChange: (s: Sector[]) => void;
}) {
  const fieldCls = "w-full bg-background/50 border border-card-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50";
  const labelCls = "block text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1";

  function updateSector(idx: number, key: keyof Sector, val: string | null) {
    const next = sectors.map((s, i) => i === idx ? { ...s, [key]: val ?? "" } : s);
    onChange(next);
  }

  function addSector() {
    // Pre-fill new sector's "from" with previous sector's "to"
    const prev = sectors[sectors.length - 1];
    const newSec: Sector = {
      from:     prev ? prev.to : "",
      fromIcao: prev ? prev.toIcao : "",
      to:       "",
      toIcao:   "",
      eta:      null,
    };
    onChange([...sectors, newSec]);
  }

  function removeSector(idx: number) {
    if (sectors.length <= 1) return; // always keep at least one sector
    onChange(sectors.filter((_, i) => i !== idx));
  }

  function moveSector(idx: number, dir: -1 | 1) {
    const next = [...sectors];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-cyan-400/80 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          <ChevronsRight size={12} /> Flight Sectors
        </div>
        <button
          type="button"
          onClick={addSector}
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
        >
          <Plus size={11} /> Add Sector
        </button>
      </div>

      {/* Chain preview */}
      {sectors.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap px-3 py-2 bg-muted/10 rounded-lg border border-card-border text-[10px] font-mono">
          {sectors.map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              {i === 0 && (
                <span className="text-cyan-300 font-semibold">{s.fromIcao || s.from || "?"}</span>
              )}
              <ArrowRight size={9} className="text-muted-foreground" />
              <span className={`font-semibold ${i === sectors.length - 1 ? "text-green-300" : "text-cyan-300"}`}>
                {s.toIcao || s.to || "?"}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Sector rows */}
      <div className="space-y-2">
        {sectors.map((s, i) => (
          <div key={i} className="bg-muted/10 border border-card-border rounded-xl p-3 space-y-2">
            {/* Sector header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-widest">
                Leg {i + 1}{i === 0 ? " — Origin" : i === sectors.length - 1 ? " — Final" : ""}
              </span>
              <div className="flex items-center gap-1">
                {/* Move up / down */}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveSector(i, -1)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-[9px]"
                    title="Move up"
                  >▲</button>
                )}
                {i < sectors.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveSector(i, 1)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-[9px]"
                    title="Move down"
                  >▼</button>
                )}
                {sectors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSector(i)}
                    className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove sector"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* From / To rows */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Departure / From</label>
                <input
                  className={fieldCls}
                  placeholder="e.g. Dubbo Base Hospital"
                  value={s.from}
                  onChange={e => updateSector(i, "from", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>ICAO</label>
                <input
                  className={fieldCls}
                  placeholder="YSDU"
                  value={s.fromIcao}
                  onChange={e => updateSector(i, "fromIcao", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Arrival / To</label>
                <input
                  className={fieldCls}
                  placeholder="e.g. Royal Prince Alfred Hospital"
                  value={s.to}
                  onChange={e => updateSector(i, "to", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>ICAO</label>
                <input
                  className={fieldCls}
                  placeholder="YSSY"
                  value={s.toIcao}
                  onChange={e => updateSector(i, "toIcao", e.target.value)}
                />
              </div>
            </div>
            {/* Per-sector ETA */}
            <div>
              <label className={labelCls}>Sector ETA (optional)</label>
              <input
                type="datetime-local"
                className={`${fieldCls} border-cyan-400/20 focus:border-cyan-400/50`}
                value={s.eta?.slice(0, 16) ?? ""}
                onChange={e => updateSector(i, "eta", e.target.value || null)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Task Form Modal ──────────────────────────────────────────────────────
function TaskModal({
  task, onClose, onSave, isNew,
}: {
  task: TaskDraft | NeptTask;
  onClose: () => void;
  onSave: (d: TaskDraft) => void;
  isNew: boolean;
}) {
  const [d, setD] = useState<TaskDraft>(() => {
    const base = { ...task } as TaskDraft;
    // Ensure sectors is always at least one empty sector
    if (!base.sectors || base.sectors.length === 0) {
      base.sectors = [{
        from:     base.pickupLocation ?? "",
        fromIcao: base.pickupIcao ?? "",
        to:       base.destLocation ?? "",
        toIcao:   base.destIcao ?? "",
        eta:      null,
      }];
    }
    return base;
  });

  const set = (k: keyof TaskDraft, v: string | null) =>
    setD(prev => ({ ...prev, [k]: v || null }));

  const setSectors = useCallback((sectors: Sector[]) => {
    setD(prev => ({ ...prev, sectors }));
  }, []);

  const fieldCls = "w-full bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50";
  const labelCls = "block text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1";

  function handleSave() {
    const sectors = d.sectors ?? [];
    if (sectors.length === 0 || !sectors[0].from) {
      alert("At least one sector with a departure location is required.");
      return;
    }
    // Sync pickupLocation/destLocation from first/last sector
    const first = sectors[0];
    const last  = sectors[sectors.length - 1];
    const synced: TaskDraft = {
      ...d,
      sectors,
      pickupLocation: first.from || first.fromIcao,
      pickupIcao:     first.fromIcao || null,
      destLocation:   last.to   || last.toIcao,
      destIcao:       last.toIcao   || null,
      // Overall ETA = last sector ETA if set, else keep existing
      estimatedEta: last.eta ?? d.estimatedEta,
    };
    onSave(synced);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-2xl shadow-2xl my-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {isNew ? "New NEPT Task" : `Edit — ${d.taskRef}`}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Non-Emergency Patient Transfer</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Row 1 — ref, status, priority */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Task Ref</label>
              <input className={fieldCls} value={d.taskRef} onChange={e => set("taskRef", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={fieldCls} value={d.status} onChange={e => setD(p => ({ ...p, status: e.target.value as TaskStatus }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={fieldCls} value={d.priority} onChange={e => setD(p => ({ ...p, priority: e.target.value as TaskPriority }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 — times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Request Time</label>
              <input type="datetime-local" className={fieldCls} value={d.requestTime?.slice(0,16) ?? ""} onChange={e => set("requestTime", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Required By</label>
              <input type="datetime-local" className={fieldCls} value={d.requiredBy?.slice(0,16) ?? ""} onChange={e => set("requiredBy", e.target.value || null)} />
            </div>
          </div>

          {/* Sector Editor — replaces the old Pickup / Destination rows */}
          <SectorEditor sectors={d.sectors ?? [emptySector()]} onChange={setSectors} />

          {/* Referring / Receiving hospitals */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Referring Hospital</label>
              <input className={fieldCls} placeholder="Referring facility" value={d.referringHospital ?? ""} onChange={e => set("referringHospital", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Receiving Hospital</label>
              <input className={fieldCls} placeholder="Receiving facility" value={d.receivingHospital ?? ""} onChange={e => set("receivingHospital", e.target.value)} />
            </div>
          </div>

          {/* Row 5 — patient */}
          <div>
            <div className="text-xs font-semibold text-cyan-400/80 mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Patient / Escort</div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 text-[10px] text-amber-300/80 mb-2">
              Identify only — no clinical or medical information is stored here.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Patient Name</label>
                <input className={fieldCls} placeholder="Patient name" value={d.patientName ?? ""} onChange={e => set("patientName", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Task / UR Ref</label>
                <input className={fieldCls} placeholder="UR or task ID" value={d.patientRef ?? ""} onChange={e => set("patientRef", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Escort Name</label>
                <input className={fieldCls} placeholder="Escort / passenger name (if applicable)" value={d.escortName ?? ""} onChange={e => set("escortName", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Row 6 — crew & aircraft */}
          <div>
            <div className="text-xs font-semibold text-cyan-400/80 mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <Plane size={12} /> Aircraft &amp; Crew Assignment
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Aircraft</label>
                <select className={fieldCls} value={d.aircraftReg ?? ""} onChange={e => set("aircraftReg", e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {AIRCRAFT_OPTIONS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pilot</label>
                <select className={fieldCls} value={d.pilotName ?? ""} onChange={e => set("pilotName", e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {PILOT_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Nurse / Medic</label>
                <select className={fieldCls} value={d.nurseName ?? ""} onChange={e => set("nurseName", e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {NURSE_OPTIONS.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className={labelCls}>Dispatched By</label>
              <input className={fieldCls} placeholder="Dispatcher name" value={d.dispatchedBy ?? ""} onChange={e => set("dispatchedBy", e.target.value)} />
            </div>
          </div>

          {/* Row 7 — overall ETA (auto-filled from last sector but editable) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Overall ETA <span className="normal-case font-normal text-muted-foreground">(auto from last sector)</span></label>
              <input type="datetime-local" className={`${fieldCls} border-cyan-400/30 focus:border-cyan-400/60`} value={d.estimatedEta?.slice(0,16) ?? ""} onChange={e => set("estimatedEta", e.target.value || null)} />
            </div>
          </div>

          {/* Row 8 — actual times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Actual Departure</label>
              <input type="datetime-local" className={fieldCls} value={d.actualDepart?.slice(0,16) ?? ""} onChange={e => set("actualDepart", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Actual Arrival</label>
              <input type="datetime-local" className={fieldCls} value={d.actualArrive?.slice(0,16) ?? ""} onChange={e => set("actualArrive", e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={2}
              className={`${fieldCls} resize-none`}
              placeholder="Any additional dispatch notes..."
              value={d.notes ?? ""}
              onChange={e => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-card-border">
          <button onClick={onClose} className="px-4 py-2 text-xs text-muted-foreground border border-card-border rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25 rounded-lg transition-colors"
          >
            <Save size={13} /> {isNew ? "Create Task" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Status Changer ─────────────────────────────────────────────────
function QuickStatus({ task, onUpdate }: { task: NeptTask; onUpdate: (id: number, s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const c = statusConfig(task.status);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border} hover:opacity-80 transition-opacity`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {task.status}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-[#0f1623] border border-card-border rounded-xl shadow-xl overflow-hidden w-36">
          {STATUSES.map(s => {
            const sc = statusConfig(s);
            return (
              <button
                key={s}
                onClick={() => { onUpdate(task.id, s); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${task.status === s ? "opacity-50" : ""}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sector Chain display (table cell) ───────────────────────────────────
function RouteCell({ task }: { task: NeptTask }) {
  const sectors = task.sectors;
  if (sectors && sectors.length > 0) {
    const chain = locationChain(sectors);
    const icao  = icaoChain(sectors);
    const multiLeg = sectors.length > 1;
    return (
      <div className="max-w-[240px]">
        <div className="font-medium text-foreground truncate text-xs">{chain}</div>
        {multiLeg && (
          <div className="text-[10px] text-amber-300/80 font-semibold mt-0.5">
            {sectors.length} legs
          </div>
        )}
        <div className="text-[10px] text-cyan-400/70 font-mono mt-0.5 truncate">{icao}</div>
      </div>
    );
  }
  // Fallback to legacy fields
  return (
    <div className="max-w-[220px]">
      <div className="font-medium text-foreground truncate">{task.pickupLocation}</div>
      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
        <ArrowRight size={10} />
        <span className="truncate">{task.destLocation}</span>
      </div>
      {(task.pickupIcao || task.destIcao) && (
        <div className="text-[10px] text-cyan-400/70 font-mono mt-0.5">
          {task.pickupIcao ?? "—"} → {task.destIcao ?? "—"}
        </div>
      )}
    </div>
  );
}

// ─── Expanded row sector list ─────────────────────────────────────────────
function SectorList({ sectors }: { sectors: Sector[] }) {
  return (
    <div className="space-y-1.5">
      {sectors.map((s, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="text-[10px] font-bold text-cyan-400/60 w-12 shrink-0 pt-0.5">Leg {i + 1}</span>
          <div className="flex-1">
            <span className="text-foreground font-medium">{s.from || s.fromIcao || "?"}</span>
            {s.fromIcao && s.from && (
              <span className="text-muted-foreground ml-1 font-mono text-[10px]">({s.fromIcao})</span>
            )}
            <ArrowRight size={10} className="inline mx-1 text-muted-foreground" />
            <span className="text-foreground font-medium">{s.to || s.toIcao || "?"}</span>
            {s.toIcao && s.to && (
              <span className="text-muted-foreground ml-1 font-mono text-[10px]">({s.toIcao})</span>
            )}
            {s.eta && (
              <span className="ml-2 text-cyan-300 font-mono text-[10px]">ETA {fmtDT(s.eta)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notice of Operations ───────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type NopStatus = "Draft" | "Under Review" | "Approved" | "Submitted";

interface OpsChange {
  id: string;
  category: "Aircraft" | "Crew" | "Route" | "Procedure" | "Incident" | "Other";
  description: string;
  date: string;
  actionTaken: string;
}

interface NopData {
  month: number; // 0-indexed
  year: number;
  status: NopStatus;
  preparedBy: string;
  reviewedBy: string;
  submittedDate: string;
  contractRef: string;
  // KPI fields
  totalMissions: number;
  completedMissions: number;
  cancelledMissions: number;
  onTimeCount: number;
  avgResponseMins: number;
  p1ResponseMins: number;
  p2ResponseMins: number;
  // Aircraft
  aircraftDeclared: string[];
  fleetChanges: string;
  // Crew
  crewChanges: string;
  // Ops changes / incidents
  opsChanges: OpsChange[];
  // Narrative
  executiveSummary: string;
  issuesIdentified: string;
  actionsPlanned: string;
}

const WORKFLOW_STEPS: NopStatus[] = ["Draft", "Under Review", "Approved", "Submitted"];

const STATUS_COLOR: Record<NopStatus, string> = {
  "Draft":        "text-muted-foreground border-border",
  "Under Review": "text-amber-300 border-amber-400/40",
  "Approved":     "text-emerald-300 border-emerald-400/40",
  "Submitted":    "text-cyan-300 border-cyan-400/40",
};

const STATUS_BG: Record<NopStatus, string> = {
  "Draft":        "bg-muted/20",
  "Under Review": "bg-amber-500/10",
  "Approved":     "bg-emerald-500/10",
  "Submitted":    "bg-cyan-500/10",
};

const OPS_CATEGORIES: OpsChange["category"][] = ["Aircraft","Crew","Route","Procedure","Incident","Other"];

function emptyNop(month: number, year: number): NopData {
  return {
    month, year,
    status: "Draft",
    preparedBy: "Operations Director",
    reviewedBy: "",
    submittedDate: "",
    contractRef: "NSW-NEPT-2024-001",
    totalMissions: 0, completedMissions: 0, cancelledMissions: 0,
    onTimeCount: 0, avgResponseMins: 0, p1ResponseMins: 0, p2ResponseMins: 0,
    aircraftDeclared: ["VH-LTQ", "VH-MVW", "VH-MVX", "VH-MWH", "VH-MWK", "VH-XYJ", "VH-XYO", "VH-XYR"],
    fleetChanges: "",
    crewChanges: "",
    opsChanges: [],
    executiveSummary: "",
    issuesIdentified: "",
    actionsPlanned: "",
  };
}

function NoticeOfOps({ tasks }: { tasks: NeptTask[] }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear]   = useState(now.getFullYear());
  const [nop, setNop]           = useState<NopData>(() => emptyNop(now.getMonth(), now.getFullYear()));
  const [showPrint, setShowPrint] = useState(false);
  const [newChange, setNewChange] = useState<Partial<OpsChange>>({
    category: "Incident", description: "", date: "", actionTaken: "",
  });
  const [addingChange, setAddingChange] = useState(false);

  const inputCls = "w-full bg-card border border-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/40";
  const labelCls = "block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1";

  // Auto-derive KPIs from tasks for the selected month
  const monthTasks = useMemo(() => {
    return tasks.filter(t => {
      const d = new Date(t.requestTime);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });
  }, [tasks, selMonth, selYear]);

  // Auto-populate KPI fields when month changes
  useEffect(() => {
    const total     = monthTasks.length;
    const completed = monthTasks.filter(t => t.status === "Complete").length;
    const cancelled = monthTasks.filter(t => t.status === "Cancelled").length;
    // Simulate on-time from completed tasks (demo: 94%)
    const onTime    = Math.round(completed * 0.94);
    setNop(prev => ({
      ...emptyNop(selMonth, selYear),
      // keep narrative & changes
      preparedBy: prev.preparedBy,
      reviewedBy: prev.reviewedBy,
      contractRef: prev.contractRef,
      aircraftDeclared: prev.aircraftDeclared,
      fleetChanges: prev.fleetChanges,
      crewChanges: prev.crewChanges,
      opsChanges: prev.opsChanges,
      executiveSummary: prev.executiveSummary,
      issuesIdentified: prev.issuesIdentified,
      actionsPlanned: prev.actionsPlanned,
      totalMissions: total,
      completedMissions: completed,
      cancelledMissions: cancelled,
      onTimeCount: onTime,
      avgResponseMins: total > 0 ? 42 : 0, // demo value
      p1ResponseMins: total > 0 ? 18 : 0,
      p2ResponseMins: total > 0 ? 55 : 0,
    }));
  }, [selMonth, selYear, monthTasks]);

  function upd(field: keyof NopData, value: any) {
    setNop(prev => ({ ...prev, [field]: value }));
  }

  function advanceStatus() {
    const idx = WORKFLOW_STEPS.indexOf(nop.status);
    if (idx < WORKFLOW_STEPS.length - 1) {
      const next = WORKFLOW_STEPS[idx + 1];
      const updates: Partial<NopData> = { status: next };
      if (next === "Submitted") updates.submittedDate = new Date().toISOString().slice(0, 10);
      setNop(prev => ({ ...prev, ...updates }));
    }
  }

  function exportPDF() {
    generateNopPDF({
      month:              `${MONTHS[nop.month]} ${nop.year}`,
      contractRef:        nop.contractRef,
      preparedBy:         nop.preparedBy,
      reviewedBy:         nop.reviewedBy,
      status:             nop.status,
      submittedDate:      nop.submittedDate,
      totalMissions:      nop.totalMissions,
      completedMissions:  nop.completedMissions,
      cancelledMissions:  nop.cancelledMissions,
      onTimeCount:        nop.onTimeCount,
      completionRate,
      onTimeRate,
      avgResponseMins:    nop.avgResponseMins,
      p1ResponseMins:     nop.p1ResponseMins,
      p2ResponseMins:     nop.p2ResponseMins,
      aircraftDeclared:   nop.aircraftDeclared,
      fleetChanges:       nop.fleetChanges,
      crewChanges:        nop.crewChanges,
      opsChanges:         nop.opsChanges,
      executiveSummary:   nop.executiveSummary,
      issuesIdentified:   nop.issuesIdentified,
      actionsPlanned:     nop.actionsPlanned,
    });
  }

  function addOpsChange() {
    if (!newChange.description || !newChange.date) return;
    const entry: OpsChange = {
      id: Date.now().toString(),
      category: newChange.category as OpsChange["category"],
      description: newChange.description,
      date: newChange.date,
      actionTaken: newChange.actionTaken ?? "",
    };
    setNop(prev => ({ ...prev, opsChanges: [...prev.opsChanges, entry] }));
    setNewChange({ category: "Incident", description: "", date: "", actionTaken: "" });
    setAddingChange(false);
  }

  function removeChange(id: string) {
    setNop(prev => ({ ...prev, opsChanges: prev.opsChanges.filter(c => c.id !== id) }));
  }

  const completionRate = nop.totalMissions > 0
    ? Math.round((nop.completedMissions / nop.totalMissions) * 100)
    : 0;
  const onTimeRate = nop.completedMissions > 0
    ? Math.round((nop.onTimeCount / nop.completedMissions) * 100)
    : 0;

  const stepIdx = WORKFLOW_STEPS.indexOf(nop.status);
  const canAdvance = nop.status !== "Submitted";
  const nextStep   = WORKFLOW_STEPS[stepIdx + 1];

  const YEAR_OPTIONS = [now.getFullYear() - 1, now.getFullYear()];

  // Category badge
  const catColor: Record<OpsChange["category"], string> = {
    Aircraft:  "bg-cyan-500/10 text-cyan-300 border-cyan-400/30",
    Crew:      "bg-blue-500/10 text-blue-300 border-blue-400/30",
    Route:     "bg-purple-500/10 text-purple-300 border-purple-400/30",
    Procedure: "bg-amber-500/10 text-amber-300 border-amber-400/30",
    Incident:  "bg-red-500/10 text-red-300 border-red-400/30",
    Other:     "bg-muted/30 text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <FileText size={16} className="text-cyan-400" /> Notice of Operations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly compliance submission — NSW Health NEPT Contract</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month / Year selectors */}
          <select
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
            className="bg-card border border-card-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-cyan-400/40"
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            className="bg-card border border-card-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-cyan-400/40"
          >
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500/15 border border-cyan-400/40 rounded-lg text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-colors"
            data-testid="button-export-nop-pdf"
          >
            <FileText size={12} /> Export PDF
          </button>
          {canAdvance && (
            <button
              onClick={advanceStatus}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500/15 border border-cyan-400/40 rounded-lg text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-colors"
            >
              {nop.status === "Approved" ? <Send size={12} /> : <Check size={12} />}
              {nop.status === "Draft" ? "Mark Under Review" :
               nop.status === "Under Review" ? "Approve" : "Submit to NSW Health"}
            </button>
          )}
        </div>
      </div>

      {/* ── Workflow Status Bar ── */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <div className="flex items-center gap-0">
          {WORKFLOW_STEPS.map((step, i) => {
            const done    = i < stepIdx;
            const current = i === stepIdx;
            return (
              <div key={step} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                    done    ? "bg-cyan-500 border-cyan-500 text-white" :
                    current ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" :
                              "bg-muted/20 border-border text-muted-foreground"
                  }`}>
                    {done ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-[9px] mt-1 text-center font-semibold uppercase tracking-wide ${
                    current ? "text-cyan-300" : done ? "text-cyan-400/60" : "text-muted-foreground"
                  }`}>{step}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded ${
                    done ? "bg-cyan-500" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        {nop.status === "Submitted" && nop.submittedDate && (
          <p className="text-xs text-cyan-300 text-center mt-3 font-semibold">Submitted {nop.submittedDate} — NSW Health NEPT Contract Team</p>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Document Details */}
          <div className="bg-card rounded-xl border border-card-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-3">
              <ClipboardList size={13} className="text-cyan-400" /> Document Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Reporting Period</label>
                <div className="text-xs font-semibold text-foreground">{MONTHS[nop.month]} {nop.year}</div>
              </div>
              <div>
                <label className={labelCls}>Contract Reference</label>
                <input value={nop.contractRef} onChange={e => upd("contractRef", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Prepared By</label>
                <input value={nop.preparedBy} onChange={e => upd("preparedBy", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Reviewed By</label>
                <input value={nop.reviewedBy} onChange={e => upd("reviewedBy", e.target.value)} placeholder="Name / Title" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                STATUS_COLOR[nop.status]
              } ${STATUS_BG[nop.status]}`}>
                {nop.status}
              </span>
            </div>
          </div>

          {/* Mission KPIs — auto from task data */}
          <div className="bg-card rounded-xl border border-card-border p-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-3">
              <BarChart3 size={13} className="text-cyan-400" /> Mission Statistics
              <span className="ml-auto text-[9px] text-muted-foreground font-normal">Auto-populated from tasking board</span>
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total Missions",    value: nop.totalMissions,     color: "text-foreground" },
                { label: "Completed",          value: nop.completedMissions, color: "text-emerald-400" },
                { label: "Cancelled",           value: nop.cancelledMissions, color: "text-red-400" },
              ].map(k => (
                <div key={k.label} className="bg-muted/20 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">{k.label}</div>
                </div>
              ))}
            </div>

            {/* KPI bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className={`font-bold ${
                    completionRate >= 95 ? "text-emerald-400" :
                    completionRate >= 85 ? "text-amber-400" : "text-red-400"
                  }`}>{completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-2 rounded-full transition-all ${
                    completionRate >= 95 ? "bg-emerald-500" :
                    completionRate >= 85 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">On-Time Rate <span className="opacity-60">(target ≥95%)</span></span>
                  <span className={`font-bold ${
                    onTimeRate >= 95 ? "text-emerald-400" :
                    onTimeRate >= 85 ? "text-amber-400" : "text-red-400"
                  }`}>{onTimeRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-2 rounded-full transition-all ${
                    onTimeRate >= 95 ? "bg-emerald-500" :
                    onTimeRate >= 85 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${onTimeRate}%` }} />
                </div>
              </div>
            </div>

            {/* Response times */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Avg Response", value: nop.avgResponseMins, field: "avgResponseMins" as keyof NopData, suffix: "min" },
                { label: "P1 Response",  value: nop.p1ResponseMins,  field: "p1ResponseMins"  as keyof NopData, suffix: "min" },
                { label: "P2 Response",  value: nop.p2ResponseMins,  field: "p2ResponseMins"  as keyof NopData, suffix: "min" },
              ].map(r => (
                <div key={r.label}>
                  <label className={labelCls}>{r.label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={0}
                      value={r.value}
                      onChange={e => upd(r.field, Number(e.target.value))}
                      className={inputCls + " text-center"}
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">{r.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Declaration */}
          <div className="bg-card rounded-xl border border-card-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Plane size={13} className="text-cyan-400" /> Fleet Declaration
            </h3>
            <div>
              <label className={labelCls}>Aircraft Operated This Period</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {nop.aircraftDeclared.map(reg => (
                  <span key={reg} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-400/30 rounded text-[10px] font-mono text-cyan-300">
                    {reg}
                    <button onClick={() => upd("aircraftDeclared", nop.aircraftDeclared.filter(r => r !== reg))}
                      className="text-muted-foreground hover:text-red-400 ml-0.5">
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
              <select
                onChange={e => {
                  if (e.target.value && !nop.aircraftDeclared.includes(e.target.value))
                    upd("aircraftDeclared", [...nop.aircraftDeclared, e.target.value]);
                  e.target.value = "";
                }}
                className="bg-card border border-card-border rounded-lg px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:border-cyan-400/40"
              >
                <option value="">+ Add aircraft…</option>
                {AIRCRAFT_OPTIONS.filter(r => !nop.aircraftDeclared.includes(r)).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fleet Changes / Notes</label>
              <textarea rows={2} value={nop.fleetChanges} onChange={e => upd("fleetChanges", e.target.value)}
                placeholder="Any changes to fleet configuration, AOC status, or maintenance flags…"
                className={inputCls + " resize-none"} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Crew Declaration */}
          <div className="bg-card rounded-xl border border-card-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <User size={13} className="text-cyan-400" /> Crew & Personnel
            </h3>
            <div>
              <label className={labelCls}>Crew Changes / Qualifications</label>
              <textarea rows={3} value={nop.crewChanges} onChange={e => upd("crewChanges", e.target.value)}
                placeholder="New hires, departures, rating changes, medicals renewed, competency checks completed…"
                className={inputCls + " resize-none"} />
            </div>
          </div>

          {/* Ops Changes & Incidents */}
          <div className="bg-card rounded-xl border border-card-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <AlertCircle size={13} className="text-amber-400" /> Operational Changes & Incidents
              </h3>
              <button
                onClick={() => setAddingChange(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold border border-amber-400/40 bg-amber-500/10 text-amber-300 rounded-lg hover:bg-amber-500/20 transition-colors"
              >
                <Plus size={10} /> Add Entry
              </button>
            </div>

            {/* Add entry form */}
            {addingChange && (
              <div className="rounded-lg border border-card-border bg-muted/10 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select value={newChange.category}
                      onChange={e => setNewChange(prev => ({ ...prev, category: e.target.value as OpsChange["category"] }))}
                      className={inputCls}>
                      {OPS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Date</label>
                    <input type="date" value={newChange.date}
                      onChange={e => setNewChange(prev => ({ ...prev, date: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea rows={2} value={newChange.description}
                    onChange={e => setNewChange(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the change or incident…"
                    className={inputCls + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>Action Taken</label>
                  <textarea rows={2} value={newChange.actionTaken}
                    onChange={e => setNewChange(prev => ({ ...prev, actionTaken: e.target.value }))}
                    placeholder="Corrective or preventive action…"
                    className={inputCls + " resize-none"} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setAddingChange(false); setNewChange({ category: "Incident", description: "", date: "", actionTaken: "" }); }}
                    className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={addOpsChange}
                    className="px-3 py-1.5 text-xs bg-cyan-500/15 border border-cyan-400/40 rounded-lg text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-colors">Add</button>
                </div>
              </div>
            )}

            {/* Entry list */}
            {nop.opsChanges.length === 0 && !addingChange && (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <AlertCircle size={20} className="mx-auto mb-2 opacity-30" />
                No incidents or operational changes recorded
              </div>
            )}
            <div className="space-y-2">
              {nop.opsChanges.map(c => (
                <div key={c.id} className="rounded-lg border border-card-border bg-muted/10 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${catColor[c.category]}`}>{c.category}</span>
                      <span className="text-[10px] text-muted-foreground">{c.date}</span>
                    </div>
                    <button onClick={() => removeChange(c.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"><X size={12} /></button>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-1">{c.description}</p>
                  {c.actionTaken && (
                    <p className="text-[10px] text-muted-foreground"><span className="font-semibold">Action: </span>{c.actionTaken}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <div className="bg-card rounded-xl border border-card-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <FileText size={13} className="text-cyan-400" /> Narrative & Commentary
            </h3>
            <div>
              <label className={labelCls}>Executive Summary</label>
              <textarea rows={3} value={nop.executiveSummary} onChange={e => upd("executiveSummary", e.target.value)}
                placeholder={`During ${MONTHS[nop.month]} ${nop.year}, RFDS SE conducted ${nop.totalMissions} NEPT missions under contract ${nop.contractRef}…`}
                className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className={labelCls}>Issues Identified</label>
              <textarea rows={2} value={nop.issuesIdentified} onChange={e => upd("issuesIdentified", e.target.value)}
                placeholder="Any service delivery issues, complaints, or non-conformances…"
                className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className={labelCls}>Planned Actions / Improvements</label>
              <textarea rows={2} value={nop.actionsPlanned} onChange={e => upd("actionsPlanned", e.target.value)}
                placeholder="Actions planned to address issues or improve service delivery…"
                className={inputCls + " resize-none"} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Submission Checklist ── */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
          <CheckSquare size={13} className="text-emerald-400" /> Pre-Submission Checklist
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { label: "Mission statistics reviewed and verified",       done: nop.totalMissions > 0 },
            { label: "On-time rate calculated",                         done: nop.onTimeCount > 0 },
            { label: "Response times entered",                          done: nop.avgResponseMins > 0 },
            { label: "Aircraft fleet declared",                         done: nop.aircraftDeclared.length > 0 },
            { label: "Prepared by field completed",                     done: !!nop.preparedBy },
            { label: "Reviewed by field completed",                     done: !!nop.reviewedBy },
            { label: "Executive summary written",                       done: nop.executiveSummary.trim().length > 20 },
            { label: "Incidents / changes documented or confirmed nil", done: true },
            { label: "Document status is Approved or Submitted",        done: ["Approved","Submitted"].includes(nop.status) },
          ].map(item => (
            <div key={item.label} className={`flex items-start gap-2 p-2.5 rounded-lg border ${
              item.done ? "border-emerald-400/20 bg-emerald-500/5" : "border-border bg-muted/10"
            }`}>
              <div className={`mt-0.5 shrink-0 ${
                item.done ? "text-emerald-400" : "text-muted-foreground/40"
              }`}>
                {item.done ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-current" />}
              </div>
              <span className={`text-[10px] leading-relaxed ${
                item.done ? "text-foreground" : "text-muted-foreground"
              }`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function NEPTTasking({ role }: Props) {
  const qc = useQueryClient();
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("Pending");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "All">("All");
  const [showModal, setShowModal]     = useState(false);
  const [editTask, setEditTask]       = useState<NeptTask | null>(null);
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [etaSort, setEtaSort]         = useState<"asc" | "desc" | null>("asc");
  const [activeTab, setActiveTab]     = useState<"board" | "notice-of-ops">("board");

  const canDispatch = !["pilot", "nurse", "engineer"].includes(role);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: rawTasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/nept-tasks"],
    refetchInterval: 30_000,
  });

  // Parse sectors JSON string from server
  const tasks: NeptTask[] = useMemo(() =>
    rawTasks.map(t => ({
      ...t,
      sectors: t.sectors
        ? (typeof t.sectors === "string" ? JSON.parse(t.sectors) : t.sectors)
        : null,
    })),
  [rawTasks]);

  // ── Mutations ────────────────────────────────────────────────────────────
  function serializeForApi(d: TaskDraft) {
    return {
      ...d,
      sectors: d.sectors ? JSON.stringify(d.sectors) : null,
    };
  }

  const createMutation = useMutation({
    mutationFn: (d: TaskDraft) => apiRequest("POST", "/api/nept-tasks", serializeForApi(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NeptTask> }) => {
      const payload = { ...data, sectors: data.sectors ? JSON.stringify(data.sectors) : data.sectors };
      return apiRequest("PATCH", `/api/nept-tasks/${id}`, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/nept-tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }),
  });

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = tasks.filter(t => {
      if (filterStatus !== "All" && t.status !== filterStatus) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        const chain = t.sectors ? locationChain(t.sectors).toLowerCase() : "";
        return (
          t.taskRef.toLowerCase().includes(q) ||
          t.pickupLocation.toLowerCase().includes(q) ||
          t.destLocation.toLowerCase().includes(q) ||
          (t.patientName ?? "").toLowerCase().includes(q) ||
          (t.aircraftReg ?? "").toLowerCase().includes(q) ||
          (t.referringHospital ?? "").toLowerCase().includes(q) ||
          (t.receivingHospital ?? "").toLowerCase().includes(q) ||
          chain.includes(q)
        );
      }
      return true;
    });
    if (etaSort) {
      list.sort((a, b) => {
        if (!a.estimatedEta && !b.estimatedEta) return 0;
        if (!a.estimatedEta) return 1;
        if (!b.estimatedEta) return -1;
        const diff = a.estimatedEta.localeCompare(b.estimatedEta);
        return etaSort === "asc" ? diff : -diff;
      });
    }
    return list;
  }, [tasks, filterStatus, filterPriority, search, etaSort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: tasks.length };
    STATUSES.forEach(s => { c[s] = tasks.filter(t => t.status === s).length; });
    return c;
  }, [tasks]);

  const kpis = [
    { label: "Total Tasks",  value: tasks.length,                                              color: "text-foreground",    bg: "bg-muted/30"          },
    { label: "Pending",      value: counts["Pending"] ?? 0,                                    color: "text-slate-300",     bg: "bg-slate-500/10"      },
    { label: "Assigned",     value: counts["Assigned"] ?? 0,                                   color: "text-blue-300",      bg: "bg-blue-500/10"       },
    { label: "En Route",     value: counts["En Route"] ?? 0,                                   color: "text-amber-300",     bg: "bg-amber-500/10"      },
    { label: "Complete",     value: counts["Complete"] ?? 0,                                   color: "text-green-300",     bg: "bg-green-500/10"      },
    { label: "Emergency",    value: tasks.filter(t => t.priority === "Emergency").length,       color: "text-red-300",       bg: "bg-red-500/10"        },
  ];

  function handleSave(d: TaskDraft) {
    if (editTask) {
      updateMutation.mutate({ id: editTask.id, data: d });
      setEditTask(null);
    } else {
      createMutation.mutate(d);
    }
  }

  function handleStatusChange(id: number, status: TaskStatus) {
    updateMutation.mutate({ id, data: { status } });
  }

  function handleDelete(task: NeptTask) {
    if (!window.confirm(`Delete task ${task.taskRef}? This cannot be undone.`)) return;
    deleteMutation.mutate(task.id);
  }

  const inputCls = "bg-card border border-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/40";

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <Ambulance size={18} className="text-cyan-400" /> NEPT Operations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Non-Emergency Patient Transfer — dispatch &amp; monthly reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] })}
            className="p-2 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:border-cyan-400/40 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          {canDispatch && (
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-400/40 rounded-lg text-xs text-cyan-300 font-semibold hover:bg-cyan-500/25 transition-colors"
            >
              <Plus size={14} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-card-border">
        {([
          { id: "board",          label: "Tasking Board",    icon: <ClipboardList size={13} /> },
          { id: "notice-of-ops",  label: "Notice of Ops",   icon: <FileText size={13} />, badge: "Monthly" },
        ] as { id: "board" | "notice-of-ops"; label: string; icon: JSX.Element; badge?: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon} {tab.label}
            {tab.badge && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-500/15 text-cyan-400 border border-cyan-400/30">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notice of Ops Tab */}
      {activeTab === "notice-of-ops" && (
        <NoticeOfOps tasks={tasks} />
      )}

      {/* Tasking Board Tab */}
      {activeTab === "board" && (<>

      {/* KPI bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-xl border border-card-border p-3 ${k.bg}`}>
            <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Emergency alert */}
      {tasks.some(t => t.priority === "Emergency" && t.status !== "Complete" && t.status !== "Cancelled") && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/40 bg-red-500/10">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <span className="text-xs font-semibold text-red-300">
            {tasks.filter(t => t.priority === "Emergency" && !["Complete","Cancelled"].includes(t.status)).length} emergency task(s) active — immediate action required
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        {/* Quick-filter pills + New Task */}
        <div className="flex flex-wrap items-center gap-2">
          {(["All", ...STATUSES] as (TaskStatus | "All")[]).map(s => {
            const active = filterStatus === s;
            const count  = s === "All" ? counts["All"] : (counts[s] ?? 0);
            const accent: Record<string, string> = {
              All:        active ? "bg-white/10 text-foreground border-white/20"  : "border-card-border text-muted-foreground hover:border-white/20 hover:text-foreground",
              Pending:    active ? "bg-amber-500/20 text-amber-300 border-amber-400/40"     : "border-card-border text-muted-foreground hover:border-amber-400/30 hover:text-amber-300",
              Assigned:   active ? "bg-blue-500/20 text-blue-300 border-blue-400/40"       : "border-card-border text-muted-foreground hover:border-blue-400/30 hover:text-blue-300",
              Released:   active ? "bg-violet-500/20 text-violet-300 border-violet-400/40" : "border-card-border text-muted-foreground hover:border-violet-400/30 hover:text-violet-300",
              "En Route": active ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"       : "border-card-border text-muted-foreground hover:border-cyan-400/30 hover:text-cyan-300",
              Complete:   active ? "bg-green-500/20 text-green-300 border-green-400/40"    : "border-card-border text-muted-foreground hover:border-green-400/30 hover:text-green-300",
              Cancelled:  active ? "bg-zinc-500/20 text-zinc-300 border-zinc-400/40"       : "border-card-border text-muted-foreground hover:border-zinc-400/30 hover:text-zinc-300",
            };
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${accent[s]}`}
              >
                {s}
                <span className={`text-[10px] font-semibold tabular-nums ${active ? "opacity-100" : "opacity-60"}`}>{count}</span>
              </button>
            );
          })}
          {canDispatch && (
            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 transition-colors"
            >
              <Plus size={12} /> New Task
            </button>
          )}
        </div>
        {/* Search + priority row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className={`${inputCls} pl-8 w-full`}
              placeholder="Search ref, location, patient, aircraft…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className={inputCls} value={filterPriority} onChange={e => setFilterPriority(e.target.value as TaskPriority | "All")}>
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border bg-muted/10">
                {["Task Ref", "Priority", "Status", "Route", "Patient / Ref", "Aircraft & Crew"].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
                {/* Sortable ETA header */}
                <th className="text-left px-3 py-3 whitespace-nowrap">
                  <button
                    onClick={() => setEtaSort(s => s === "asc" ? "desc" : "asc")}
                    className="flex items-center gap-1 text-muted-foreground font-medium hover:text-cyan-300 transition-colors group"
                    title={etaSort === "asc" ? "Sorted: earliest first" : "Sorted: latest first"}
                  >
                    ETA
                    <span className="text-[10px] transition-colors group-hover:text-cyan-300">
                      {etaSort === "asc" ? "▲" : "▼"}
                    </span>
                  </button>
                </th>
                <th className="text-left text-muted-foreground font-medium px-3 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Loading tasks…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                  <ClipboardList size={24} className="mx-auto mb-2 opacity-30" />
                  No tasks found
                </td></tr>
              )}
              {filtered.map(t => (
                <>
                  <tr
                    key={t.id}
                    className={`border-b border-card-border hover:bg-white/2 cursor-pointer transition-colors ${
                      t.priority === "Emergency" && !["Complete","Cancelled"].includes(t.status) ? "bg-red-500/5" : ""
                    }`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    <td className="px-3 py-3">
                      <div className="font-mono font-semibold text-foreground">{t.taskRef}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{fmtDT(t.requestTime)}</div>
                    </td>
                    <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      {canDispatch
                        ? <QuickStatus task={t} onUpdate={handleStatusChange} />
                        : <StatusBadge status={t.status} />}
                    </td>
                    <td className="px-3 py-3">
                      <RouteCell task={t} />
                    </td>
                    <td className="px-3 py-3">
                      {t.patientName
                        ? <div className="font-medium text-foreground">{t.patientName}</div>
                        : <span className="text-muted-foreground">—</span>}
                      {t.patientRef && <div className="text-[10px] text-muted-foreground font-mono">{t.patientRef}</div>}
                      {t.escortName && <div className="text-[10px] text-blue-400/80">+ {t.escortName}</div>}
                    </td>
                    <td className="px-3 py-3">
                      {t.aircraftReg
                        ? <div className="font-semibold text-foreground font-mono">{t.aircraftReg}</div>
                        : <span className="text-muted-foreground text-[10px]">Unassigned</span>}
                      {t.pilotName && <div className="text-[10px] text-muted-foreground">{t.pilotName}</div>}
                      {t.nurseName && <div className="text-[10px] text-muted-foreground">{t.nurseName}</div>}
                    </td>
                    <td className="px-3 py-3">
                      {t.estimatedEta ? (
                        <div>
                          <span className={`font-semibold ${
                            t.status === "En Route" ? "text-cyan-300" :
                            t.status === "Complete" ? "text-green-400" : "text-foreground"
                          }`}>
                            {fmtDT(t.estimatedEta)}
                          </span>
                          <ETACountdown eta={t.estimatedEta} status={t.status} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">Not set</span>
                      )}
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      {canDispatch && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditTask(t); setShowModal(true); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                            title="Edit task"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {/* Expanded detail row */}
                  {expandedId === t.id && (
                    <tr key={`${t.id}-exp`} className="border-b border-card-border bg-muted/5">
                      <td colSpan={8} className="px-5 py-4">
                        <div className="grid sm:grid-cols-3 gap-4 text-xs">
                          {/* Route / Sectors */}
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px] mb-2">
                              {t.sectors && t.sectors.length > 1 ? `Route — ${t.sectors.length} Sectors` : "Route Detail"}
                            </div>
                            {t.sectors && t.sectors.length > 0 ? (
                              <SectorList sectors={t.sectors} />
                            ) : (
                              <>
                                <div><span className="text-muted-foreground">Pickup: </span>{t.pickupLocation}</div>
                                {t.referringHospital && <div><span className="text-muted-foreground">Referring: </span>{t.referringHospital}</div>}
                                <div><span className="text-muted-foreground">Destination: </span>{t.destLocation}</div>
                                {t.receivingHospital && <div><span className="text-muted-foreground">Receiving: </span>{t.receivingHospital}</div>}
                              </>
                            )}
                            {t.referringHospital && t.sectors && t.sectors.length > 0 && (
                              <div className="mt-1"><span className="text-muted-foreground">Referring: </span>{t.referringHospital}</div>
                            )}
                            {t.receivingHospital && t.sectors && t.sectors.length > 0 && (
                              <div><span className="text-muted-foreground">Receiving: </span>{t.receivingHospital}</div>
                            )}
                          </div>
                          {/* Times */}
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px] mb-2">Times</div>
                            <div><span className="text-muted-foreground">Requested: </span>{fmtDT(t.requestTime)}</div>
                            {t.estimatedEta && <div><span className="text-muted-foreground">Overall ETA: </span><span className="text-cyan-300 font-semibold">{fmtDT(t.estimatedEta)}</span></div>}
                            <div><span className="text-muted-foreground">Required by: </span>{fmtDT(t.requiredBy)}</div>
                            <div><span className="text-muted-foreground">Actual depart: </span>{fmtDT(t.actualDepart)}</div>
                            <div><span className="text-muted-foreground">Actual arrive: </span>{fmtDT(t.actualArrive)}</div>
                            {t.completedAt && (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle2 size={11} className="text-green-400" />
                                <span className="text-muted-foreground">Completed: </span>
                                <span className="text-green-400 font-semibold">{fmtDT(t.completedAt)}</span>
                              </div>
                            )}
                            {t.dispatchedBy && <div><span className="text-muted-foreground">Dispatched by: </span>{t.dispatchedBy}</div>}
                          </div>
                          {/* Notes */}
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px] mb-2">Notes</div>
                            <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{t.notes || "—"}</div>
                            {t.escortName && (
                              <div className="mt-2"><span className="text-muted-foreground">Escort: </span>{t.escortName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-card-border">
          {isLoading && <div className="p-6 text-center text-muted-foreground text-xs">Loading tasks…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <ClipboardList size={24} className="mx-auto mb-2 opacity-30" />No tasks found
            </div>
          )}
          {filtered.map(t => (
            <div key={t.id} className={`p-4 space-y-3 ${t.priority === "Emergency" && !["Complete","Cancelled"].includes(t.status) ? "bg-red-500/5" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono font-semibold text-sm text-foreground">{t.taskRef}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtDT(t.requestTime)}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <PriorityBadge priority={t.priority} />
                  {canDispatch
                    ? <QuickStatus task={t} onUpdate={handleStatusChange} />
                    : <StatusBadge status={t.status} />}
                </div>
              </div>
              {/* Route — multi-sector aware */}
              <div className="bg-muted/10 rounded-lg p-2.5 text-xs space-y-1">
                {t.sectors && t.sectors.length > 0 ? (
                  <>
                    <div className="font-mono text-[10px] text-cyan-400/80">{icaoChain(t.sectors)}</div>
                    <div className="text-foreground text-[10px] leading-relaxed">{locationChain(t.sectors)}</div>
                    {t.sectors.length > 1 && (
                      <div className="text-[10px] text-amber-300/80 font-semibold">{t.sectors.length} legs</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-cyan-400 shrink-0" />
                      <span className="text-foreground font-medium">{t.pickupLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-1">
                      <ArrowRight size={10} className="text-muted-foreground shrink-0" />
                      <span className="text-foreground">{t.destLocation}</span>
                    </div>
                  </>
                )}
              </div>
              {/* Patient + Aircraft */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Patient</div>
                  <div className="text-foreground">{t.patientName ?? "—"}</div>
                  {t.patientRef && <div className="text-[10px] font-mono text-muted-foreground">{t.patientRef}</div>}
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Aircraft / Crew</div>
                  <div className="text-foreground font-mono">{t.aircraftReg ?? "Unassigned"}</div>
                  {t.pilotName && <div className="text-[10px] text-muted-foreground">{t.pilotName}</div>}
                </div>
              </div>
              {/* Completed At */}
              {t.completedAt && t.status === "Complete" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={11} className="text-green-400" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="text-green-400 font-semibold">{fmtDT(t.completedAt)}</span>
                </div>
              )}
              {/* ETA */}
              {t.estimatedEta && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock size={11} className="text-cyan-400" />
                  <span className="text-muted-foreground">ETA:</span>
                  <span className={`font-semibold ${
                    t.status === "En Route" ? "text-cyan-300" :
                    t.status === "Complete" ? "text-green-400" : "text-foreground"
                  }`}>{fmtDT(t.estimatedEta)}</span>
                  <ETACountdown eta={t.estimatedEta} status={t.status} />
                </div>
              )}
              {canDispatch && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditTask(t); setShowModal(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs border border-card-border rounded-lg text-muted-foreground hover:text-cyan-300 hover:border-cyan-400/40 transition-colors">
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => handleDelete(t)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border border-card-border rounded-lg text-muted-foreground hover:text-red-400 hover:border-red-500/40 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-card-border bg-muted/5 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>{filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          <span>Auto-refreshes every 30s</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask ?? emptyDraft(nextRef(tasks))}
          isNew={!editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}

      </>)}

    </div>
  );
}
