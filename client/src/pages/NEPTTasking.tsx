import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateNopPDF } from "@/lib/generateNopPDF";
import { type UserRole } from "@/lib/data";
import { AirportSearch } from "@/components/AirportSearch";
import { type Airport } from "@/lib/airportData";
import { searchFacilities, FACILITY_TYPE_LABELS, FACILITY_TYPE_ICONS, type PatientFacility } from "@/lib/patientFacilities";
import { getFuelStatus, fuelSummaryForAI } from "@/lib/fuelLookup";
import { ERSA_AERODROMES, type ERSAAerodrome } from "@/data/ersa-airports";
import { searchAirports } from "@/lib/airportData";
import {
  Plus, X, Save, Pencil, Trash2, AlertTriangle, CheckCircle2,
  Clock, Plane, User, MapPin, ChevronDown, Filter, Search,
  RefreshCw, ClipboardList, ArrowRight, Ambulance, GripVertical, ChevronsRight,
  FileText, CheckSquare, ChevronRight, Calendar, BarChart3,
  Shield, Printer, Send, RotateCcw, AlertCircle, Check, ExternalLink, Receipt, Monitor,
  Sparkles, Bot, Upload, Mail, Zap, ChevronUp, Info, Users, Loader2, Scale, Truck,
  Fuel, Navigation, Wind, AlertOctagon, ChevronLeft, Droplets,
} from "lucide-react";

interface Props { role: UserRole; }

// ─── Types ────────────────────────────────────────────────────────────────
type TaskStatus   = "Pending" | "Assigned" | "Released" | "En Route" | "Complete" | "Cancelled";
type TaskPriority = "Routine" | "Urgent" | "Emergency";

/** A single flight leg within a multi-sector task */
interface Sector {
  id:          string;           // stable identity for React key (never changes after creation)
  from:        string;           // location / hospital name
  fromIcao:    string;           // ICAO code
  to:          string;
  toIcao:      string;
  eta:         string | null;    // sector-level ETA (ISO or null)
  fromAirport: Airport | null;   // full airport object for picker
  toAirport:   Airport | null;
}

interface Patient {
  id:       string;           // stable key for React
  name:     string;
  ref:      string;           // UR / task ID
  mobility: "ambulant" | "stretcher";
  specialConsiderations: string[]; // per-patient flags
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
  escortHeavy: boolean;
  driverNameLeg2: string | null;
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
  groundTransportCost: number | null;  // van pick/drop — default $200
  patientMobility: "ambulant" | "stretcher" | null;
  patients: Patient[] | null;          // multiple patients
  specialConsiderations: string | null; // comma-separated flags
  pickupTimeNote: string | null;
  dropoffTimeNote: string | null;
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

const PILOT_OPTIONS = ["Capt. R. Hughes", "Capt. T. Barnes", "Capt. M. Clarke", "Capt. S. Nguyen", "Capt. L. Grant"];
const NURSE_OPTIONS = ["S. Mitchell RN", "Dr. K. Patel", "J. O'Brien RN", "C. Andrews RN", "P. Wallace RN", "B. Foster RN"];
const DRIVER_OPTIONS = ["T. Walsh", "D. Nguyen", "P. Martin", "B. Scott"];

// Live shift roster — mirrors Dispatch DAILY_SHIFTS for NEPT assignment
const NEPT_SHIFTS = [
  { code: "BHI-AMB-D1",   label: "BHI Day 1",    base: "Broken Hill", aircraft: "VH-MVX", pilot: "Capt. R. Hughes",  nurse: "S. Mitchell RN"  },
  { code: "BHI-AMB-D2",   label: "BHI Day 2",    base: "Broken Hill", aircraft: "VH-MWK", pilot: "Capt. T. Barnes",  nurse: "J. O'Brien RN"   },
  { code: "BHI-AMB-N1",   label: "BHI Night",    base: "Broken Hill", aircraft: "VH-MVX", pilot: "Capt. M. Clarke",  nurse: "C. Andrews RN"   },
  { code: "DU-AMB-D1",    label: "Dubbo Day 1",  base: "Dubbo",       aircraft: "VH-MVW", pilot: "Capt. S. Nguyen", nurse: "P. Wallace RN"   },
  { code: "DU-AMB-N1",    label: "Dubbo Night",  base: "Dubbo",       aircraft: "VH-XYJ", pilot: "Capt. L. Grant",   nurse: "B. Foster RN"    },
  { code: "DU-NEPT",      label: "Dubbo NEPT",   base: "Dubbo",       aircraft: "VH-XYU", pilot: "Capt. S. Nguyen", nurse: ""                },
  { code: "BK-NEPT",      label: "Bankstown NEPT", base: "Bankstown", aircraft: "VH-LTQ", pilot: "Capt. R. Hughes",  nurse: ""                },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
function emptySector(): Sector {
  return { id: crypto.randomUUID(), from: "", fromIcao: "", to: "", toIcao: "", eta: null, fromAirport: null, toAirport: null };
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
    escortHeavy: false,
    driverNameLeg2: null,
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
    groundTransportCost: 200,
    patientMobility: "ambulant",
    patients: [{ id: crypto.randomUUID(), name: "", ref: "", mobility: "ambulant", specialConsiderations: [] }],
    specialConsiderations: null,
    pickupTimeNote: null,
    dropoffTimeNote: null,
    sectors: [emptySector()],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TaskStatus }) {
  const c = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const c = priorityConfig(priority);
  return (
    <span className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
      {priority === "Emergency" ? "🔴 " : priority === "Urgent" ? "🟡 " : ""}{priority.toUpperCase()}
    </span>
  );
}

// ─── SectorEditor ─────────────────────────────────────────────────────────
// ─── FacilitySearchInput ──────────────────────────────────────────────────────
function FacilitySearchInput({
  value, onChange, placeholder = "Search hospital, aged care, facility…",
}: {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchFacilities(query, 10), [query]);

  // Close on outside click (functional updater — prevents re-renders that dismiss pickers)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(prev => prev ? false : prev);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(f: PatientFacility) {
    onChange(f.name);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange("");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter")  { e.preventDefault(); if (results[highlighted]) select(results[highlighted]); }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Tab" && results.length > 0) { e.preventDefault(); select(results[highlighted]); }
  }

  return (
    <div ref={containerRef} className="relative">
      {value ? (
        <div className="flex items-center gap-1.5 w-full text-xs rounded px-2 py-1.5 min-h-[30px] border border-[#01696F]/60 bg-background">
          <span className="text-base shrink-0">🏥</span>
          <span className="text-foreground font-medium truncate flex-1">{value}</span>
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground shrink-0 ml-1"><X size={11} /></button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full text-xs bg-background border border-card-border rounded px-2 py-1.5 focus:outline-none focus:border-[#01696F]/60 transition-colors placeholder:text-muted-foreground/50"
          autoComplete="off"
          spellCheck={false}
        />
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-[#1C1B19] border border-[#393836] rounded-md shadow-xl max-h-52 overflow-y-auto py-0.5">
          {results.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); select(f); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-xs transition-colors ${
                  i === highlighted ? "bg-[#393836]" : "hover:bg-[#393836]/50"
                }`}
              >
                <span className="text-base shrink-0">{FACILITY_TYPE_ICONS[f.type]}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-foreground font-medium truncate block">{f.name}</span>
                  <span className="text-muted-foreground text-[10px] truncate block">{f.suburb}, {f.state}{f.icao ? ` · ${f.icao}` : ""}</span>
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{FACILITY_TYPE_LABELS[f.type]}</span>
              </button>
            </li>
          ))}
          <li className="px-2.5 py-1 border-t border-[#393836]/60">
            <span className="text-[9px] text-muted-foreground/50">↑↓ navigate · Enter or Tab to select · Esc to close</span>
          </li>
        </ul>
      )}
    </div>
  );
}

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

  function updateSectorAirport(idx: number, side: "from" | "to", airport: Airport | null) {
    const next = sectors.map((s, i) => {
      if (i !== idx) return s;
      if (side === "from") {
        return { ...s, fromAirport: airport, from: airport?.name ?? "", fromIcao: airport?.icao ?? "" };
      } else {
        return { ...s, toAirport: airport, to: airport?.name ?? "", toIcao: airport?.icao ?? "" };
      }
    });
    onChange(next);
  }

  function addSector() {
    // Pre-fill new sector's "from" with previous sector's "to"
    const prev = sectors[sectors.length - 1];
    const newSec: Sector = {
      id:          crypto.randomUUID(),
      from:        prev ? prev.to : "",
      fromIcao:    prev ? prev.toIcao : "",
      to:          "",
      toIcao:      "",
      eta:         null,
      fromAirport: prev ? prev.toAirport : null,
      toAirport:   null,
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
          <div key={s.id} className="bg-muted/10 border border-card-border rounded-xl p-3 space-y-2">
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

            {/* From / To rows — ERSA airport pickers */}
            <div>
              <label className={labelCls}>Departure Airport</label>
              <AirportSearch
                value={s.fromAirport}
                onChange={ap => updateSectorAirport(i, "from", ap)}
                placeholder="Search ICAO, city or airport name…"
              />
            </div>
            <div>
              <label className={labelCls}>Arrival Airport</label>
              <AirportSearch
                value={s.toAirport}
                onChange={ap => updateSectorAirport(i, "to", ap)}
                placeholder="Search ICAO, city or airport name…"
              />
            </div>
            {/* Per-sector ETA */}
            <div>
              <label className={labelCls}>Sector ETA (optional)</label>
              <input
                type="datetime-local"
                className={`${fieldCls} border-cyan-400/20 focus:border-cyan-400/50`}
                value={s.eta?.slice(0, 16) ?? ""}
                onChange={e => updateSector(i, "eta", e.target.value || null)}
                onMouseDown={e => e.stopPropagation()}
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
        id:          crypto.randomUUID(),
        from:        base.pickupLocation ?? "",
        fromIcao:    base.pickupIcao ?? "",
        to:          base.destLocation ?? "",
        toIcao:      base.destIcao ?? "",
        eta:         null,
        fromAirport: null,
        toAirport:   null,
      }];
    } else {
      // Ensure airport objects exist on sectors loaded from DB (they only store strings)
      base.sectors = base.sectors.map(s => ({
        ...s,
        id:          (s as any).id ?? crypto.randomUUID(),
        fromAirport: (s as any).fromAirport ?? null,
        toAirport:   (s as any).toAirport   ?? null,
      }));
    }
    // Parse patients JSON from DB string
    if (typeof (base as any).patients === "string") {
      try { base.patients = JSON.parse((base as any).patients); } catch { base.patients = null; }
    }
    // Ensure at least one patient row
    if (!base.patients || base.patients.length === 0) {
      base.patients = [{ id: crypto.randomUUID(), name: base.patientName ?? "", ref: base.patientRef ?? "", mobility: base.patientMobility ?? "ambulant", specialConsiderations: [] }];
    }
    return base;
  });

  const set = (k: keyof TaskDraft, v: string | null) =>
    setD(prev => ({ ...prev, [k]: v || null }));

  // ── Multiload override state ───────────────────────────────────────────────
  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideDoc, setOverrideDoc]       = useState<string | null>(null); // base64 filename
  const [overrideDocName, setOverrideDocName] = useState<string | null>(null);
  const [showOverridePanel, setShowOverridePanel] = useState(false);

  // Derived restriction flags from current patient list
  const hasCardiac   = (d.patients ?? []).some(p => p.specialConsiderations.includes("Cardiac Monitor"));
  const hasPaediatric = (d.patients ?? []).some(p => p.specialConsiderations.includes("Paediatric"));
  const isMultiloadRestricted = (hasCardiac || hasPaediatric) && !overrideActive;
  const restrictionReason = hasCardiac && hasPaediatric
    ? "Cardiac Monitor patient and Paediatric patient"
    : hasCardiac ? "Cardiac Monitor patient" : "Paediatric patient";

  function handleAddPatient() {
    if ((d.patients ?? []).length >= 1 && isMultiloadRestricted) {
      setShowOverridePanel(true);
      return;
    }
    setD(p => ({ ...p, patients: [...(p.patients ?? []), { id: crypto.randomUUID(), name: "", ref: "", mobility: "ambulant", specialConsiderations: [] }] }));
  }

  const setSectors = useCallback((sectors: Sector[]) => {
    setD(prev => ({ ...prev, sectors }));
  }, []);

  const fieldCls = "w-full bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50";
  const labelCls = "block text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1";

  function handleSave() {
    const sectors = d.sectors ?? [];
    if (sectors.length === 0 || (!sectors[0].from && !sectors[0].fromIcao)) {
      alert("At least one sector with a departure location is required.");
      return;
    }
    // Sync pickupLocation/destLocation from first/last sector
    const first = sectors[0];
    const last  = sectors[sectors.length - 1];
    // Sync first patient into legacy top-level fields for backwards compat
    const firstPt = (d.patients ?? [])[0];
    // Collect all special considerations across all patients into a comma-separated string
    const allConsiderations = (d.patients ?? []).flatMap(p => p.specialConsiderations).filter(Boolean);
    const uniqueConsiderations = [...new Set(allConsiderations)];
    const synced: TaskDraft = {
      ...d,
      sectors,
      pickupLocation: first.from || first.fromIcao,
      pickupIcao:     first.fromIcao || null,
      destLocation:   last.to   || last.toIcao,
      destIcao:       last.toIcao   || null,
      // Overall ETA = last sector ETA if set, else keep existing
      estimatedEta:   last.eta ?? d.estimatedEta,
      // Sync legacy fields from first patient
      patientName:    firstPt?.name || null,
      patientRef:     firstPt?.ref  || null,
      patientMobility: firstPt?.mobility ?? "ambulant",
      // Serialise patients array to JSON string for DB storage
      patients:       d.patients as any,
      specialConsiderations: uniqueConsiderations.length > 0 ? uniqueConsiderations.join(",") : null,
    };
    // Serialise patients to JSON string before sending to API
    (synced as any).patients = JSON.stringify(d.patients ?? []);
    // Append override note to task notes if override was used
    if (overrideActive && overrideDocName) {
      const overrideNote = `[CONTRACT OVERRIDE APPROVED — multiload restriction waived. Approval doc: ${overrideDocName}]`;
      synced.notes = synced.notes ? `${synced.notes}\n${overrideNote}` : overrideNote;
    }
    onSave(synced);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-2xl shadow-2xl my-4"
        onMouseDown={e => e.stopPropagation()}
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
              <input
                type="datetime-local"
                className={fieldCls}
                value={d.requestTime?.slice(0,16) ?? ""}
                onChange={e => set("requestTime", e.target.value)}
                onMouseDown={e => e.stopPropagation()}
              />
            </div>
            <div>
              <label className={labelCls}>Required By <span className="normal-case font-normal text-muted-foreground">(date &amp; time)</span></label>
              <input
                type="datetime-local"
                className={fieldCls}
                value={d.requiredBy?.slice(0,16) ?? ""}
                onChange={e => set("requiredBy", e.target.value || null)}
                onMouseDown={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Sector Editor — replaces the old Pickup / Destination rows */}
          <SectorEditor sectors={d.sectors ?? [emptySector()]} onChange={setSectors} />

          {/* Referring / Receiving hospitals — facility search */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Referring Hospital / Facility</label>
              <FacilitySearchInput
                value={d.referringHospital ?? ""}
                onChange={name => set("referringHospital", name || null)}
                placeholder="Search referring facility…"
              />
            </div>
            <div>
              <label className={labelCls}>Receiving Hospital / Facility</label>
              <FacilitySearchInput
                value={d.receivingHospital ?? ""}
                onChange={name => set("receivingHospital", name || null)}
                placeholder="Search receiving facility…"
              />
            </div>
          </div>

          {/* Ground Transport cost */}
          <div className="bg-muted/10 border border-card-border rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-cyan-400/80 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                🚐 Ground Transport
              </div>
              <span className="text-[10px] text-muted-foreground">Van — per pick-up / drop-off</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className={labelCls}>Rate per Transfer ($)</label>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground px-2 py-1.5 border border-r-0 border-card-border rounded-l-lg bg-muted/20">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex-1 bg-background/50 border border-card-border rounded-r-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50"
                    value={d.groundTransportCost ?? 200}
                    onChange={e => setD(p => ({ ...p, groundTransportCost: parseFloat(parseFloat(e.target.value).toFixed(2)) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className={labelCls}>Total (pick-up + drop-off)</label>
                <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-400/30 rounded-lg text-xs font-bold text-cyan-300">
                  ${((d.groundTransportCost ?? 200) * 2).toLocaleString()}
                </div>
              </div>
              <div className="flex-none pt-4">
                <button
                  type="button"
                  onClick={() => setD(p => ({ ...p, groundTransportCost: 200 }))}
                  className="text-[10px] px-2 py-1.5 rounded-lg border border-card-border text-muted-foreground hover:text-foreground hover:border-cyan-400/40 transition-colors"
                >
                  Reset $200
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Default $200/transfer · 2 transfers (pick-up + drop-off) = total shown. Override for actual van cost.
            </p>
          </div>

          {/* Row 5 — patients (multi-patient) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-cyan-400/80" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Patients</div>
              <button
                type="button"
                onClick={handleAddPatient}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-cyan-300 border border-cyan-400/30 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
              >
                <Plus size={10} /> Add Patient
              </button>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 text-[10px] text-amber-300/80 mb-3">
              Identify only — no clinical or medical information is stored here.
            </div>

            {/* ── Override panel ───────────────────────────────────────── */}
            {showOverridePanel && (
              <div className="mb-3 bg-red-500/10 border border-red-400/40 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-300">Contract Breach — Multiload Restriction</p>
                    <p className="text-[10px] text-red-300/80 mt-0.5">
                      Your contract prohibits multiloading with a {restrictionReason}. Adding another patient to this task is a breach of contract.
                    </p>
                  </div>
                </div>
                <div className="border-t border-red-400/20 pt-3">
                  <p className="text-[10px] font-semibold text-red-200 mb-2">Manual Override — Approved Mission Only</p>
                  <p className="text-[10px] text-muted-foreground mb-3">Upload the signed approval documentation to proceed. This will be stored against the task for audit purposes.</p>
                  {!overrideDoc ? (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400/40 bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-colors w-full">
                      <Upload size={12} className="text-red-300" />
                      <span className="text-[10px] font-semibold text-red-300">Upload Approval Document (PDF, PNG, JPG)</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setOverrideDoc(ev.target?.result as string);
                            setOverrideDocName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-400/40 bg-green-500/10">
                      <CheckCircle2 size={12} className="text-green-400" />
                      <span className="text-[10px] text-green-300 flex-1 truncate">{overrideDocName}</span>
                      <button type="button" onClick={() => { setOverrideDoc(null); setOverrideDocName(null); }} className="text-muted-foreground hover:text-red-400 transition-colors"><X size={11} /></button>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowOverridePanel(false)}
                      className="flex-1 py-1.5 rounded-lg border border-card-border text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >Cancel</button>
                    <button
                      type="button"
                      disabled={!overrideDoc}
                      onClick={() => {
                        setOverrideActive(true);
                        setShowOverridePanel(false);
                        setD(p => ({ ...p, patients: [...(p.patients ?? []), { id: crypto.randomUUID(), name: "", ref: "", mobility: "ambulant", specialConsiderations: [] }] }));
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        overrideDoc
                          ? "bg-red-500/20 border-red-400/50 text-red-300 hover:bg-red-500/30"
                          : "border-card-border text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                    >Approve Override &amp; Add Patient</button>
                  </div>
                </div>
              </div>
            )}

            {/* Override active badge */}
            {overrideActive && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border border-amber-400/40 bg-amber-500/10">
                <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                <span className="text-[10px] text-amber-300 font-semibold">Contract Override Active</span>
                <span className="text-[10px] text-amber-300/70 flex-1 truncate">— {overrideDocName}</span>
              </div>
            )}
            <div className="space-y-3">
              {(d.patients ?? []).map((pt, idx) => (
                <div key={pt.id} className="bg-background/40 border border-card-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-wide">Patient {idx + 1}</span>
                    {(d.patients ?? []).length > 1 && (
                      <button type="button" onClick={() => setD(p => ({ ...p, patients: (p.patients ?? []).filter(x => x.id !== pt.id) }))}
                        className="text-red-400/60 hover:text-red-400 transition-colors"><X size={12} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Patient Name</label>
                      <input className={fieldCls} placeholder="Patient name" value={pt.name} onChange={e => setD(p => ({ ...p, patients: (p.patients ?? []).map(x => x.id === pt.id ? { ...x, name: e.target.value } : x) }))} />
                    </div>
                    <div>
                      <label className={labelCls}>Task / UR Ref</label>
                      <input className={fieldCls} placeholder="UR or task ID" value={pt.ref} onChange={e => setD(p => ({ ...p, patients: (p.patients ?? []).map(x => x.id === pt.id ? { ...x, ref: e.target.value } : x) }))} />
                    </div>
                  </div>
                  {/* Mobility */}
                  <div>
                    <label className={labelCls}>Mobility</label>
                    <div className="flex gap-2">
                      {(["ambulant", "stretcher"] as const).map(m => (
                        <button key={m} type="button"
                          onClick={() => setD(p => ({ ...p, patients: (p.patients ?? []).map(x => x.id === pt.id ? { ...x, mobility: m } : x) }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            pt.mobility === m
                              ? m === "ambulant" ? "bg-green-500/20 border-green-400/50 text-green-300" : "bg-rose-500/20 border-rose-400/50 text-rose-300"
                              : "border-card-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m === "ambulant" ? "🚶 Ambulant" : "🛏 Stretcher"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Special Considerations */}
                  <div>
                    <label className={labelCls}>Special Considerations</label>
                    <div className="flex flex-wrap gap-2">
                      {["Cardiac Monitor", "Paediatric", "Infectious", "Humidicrib", "Car Seat", "Bariatric"].map(flag => {
                        const active = pt.specialConsiderations.includes(flag);
                        return (
                          <button key={flag} type="button"
                            onClick={() => setD(p => ({ ...p, patients: (p.patients ?? []).map(x => x.id === pt.id ? {
                              ...x,
                              specialConsiderations: active
                                ? x.specialConsiderations.filter(f => f !== flag)
                                : [...x.specialConsiderations, flag]
                            } : x) }))}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                              active ? "bg-amber-500/25 border-amber-400/60 text-amber-300" : "border-card-border text-muted-foreground hover:border-amber-400/30 hover:text-amber-300"
                            }`}
                          >
                            {flag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Escort */}
            <div className="mt-3">
              <label className={labelCls}>Escort Name</label>
              <input className={fieldCls} placeholder="Escort / passenger name (if applicable)" value={d.escortName ?? ""} onChange={e => set("escortName", e.target.value)} />
              {d.escortName && (
                <label className="flex items-center gap-2 mt-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={d.escortHeavy} onChange={e => set("escortHeavy", e.target.checked as any)}
                    className="w-3.5 h-3.5 rounded accent-amber-400" />
                  <span className="text-xs text-amber-300 font-medium">&gt;120 kg weight category</span>
                </label>
              )}
            </div>
            {/* Pickup / Dropoff time notes */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelCls}>Pickup Time Note</label>
                <input className={fieldCls} placeholder="e.g. Must depart by 08:30" value={d.pickupTimeNote ?? ""} onChange={e => set("pickupTimeNote", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Drop-off Time Note</label>
                <input className={fieldCls} placeholder="e.g. Appointment at 11:00" value={d.dropoffTimeNote ?? ""} onChange={e => set("dropoffTimeNote", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Row 6 — crew & aircraft */}
          <div>
            <div className="text-xs font-semibold text-cyan-400/80 mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <Plane size={12} /> Aircraft &amp; Crew Assignment
            </div>
            {/* Shift selector — auto-fills crew from live roster */}
            <div className="mb-3 p-2.5 bg-cyan-500/5 border border-cyan-400/20 rounded-lg">
              <label className={labelCls}>Import from Shift / Roster</label>
              <div className="flex items-center gap-2">
                <select
                  className={`flex-1 ${fieldCls}`}
                  defaultValue=""
                  onChange={e => {
                    const shift = NEPT_SHIFTS.find(s => s.code === e.target.value);
                    if (shift) {
                      setD(p => ({
                        ...p,
                        aircraftReg: shift.aircraft || p.aircraftReg,
                        pilotName: shift.pilot || p.pilotName,
                        nurseName: shift.nurse || p.nurseName,
                      }));
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">— Select shift to auto-fill crew —</option>
                  {NEPT_SHIFTS.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.label} — {s.pilot} / {s.aircraft}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Selecting a shift pre-fills aircraft, pilot, and nurse. Adjust individually below.</p>
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
              <div>
                <label className={labelCls}>Road Leg 1 — Pickup Driver</label>
                <select className={fieldCls} value={d.driverName ?? ""} onChange={e => set("driverName", e.target.value || null)}>
                  <option value="">— Unassigned —</option>
                  {DRIVER_OPTIONS.map(dr => <option key={dr}>{dr}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Road Leg 2 — Drop-off Driver</label>
                <select className={fieldCls} value={d.driverNameLeg2 ?? ""} onChange={e => set("driverNameLeg2", e.target.value || null)}>
                  <option value="">— Unassigned —</option>
                  {DRIVER_OPTIONS.map(dr => <option key={dr}>{dr}</option>)}
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
              <input type="datetime-local" className={`${fieldCls} border-cyan-400/30 focus:border-cyan-400/60`} value={d.estimatedEta?.slice(0,16) ?? ""} onChange={e => set("estimatedEta", e.target.value || null)} onMouseDown={e => e.stopPropagation()} />
            </div>
          </div>

          {/* Row 8 — actual times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Actual Departure</label>
              <input type="datetime-local" className={fieldCls} value={d.actualDepart?.slice(0,16) ?? ""} onChange={e => set("actualDepart", e.target.value)} onMouseDown={e => e.stopPropagation()} />
            </div>
            <div>
              <label className={labelCls}>Actual Arrival</label>
              <input type="datetime-local" className={fieldCls} value={d.actualArrive?.slice(0,16) ?? ""} onChange={e => set("actualArrive", e.target.value)} onMouseDown={e => e.stopPropagation()} />
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
        className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border} hover:opacity-80 transition-opacity`}
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
  // Financial
  groundTransportTotal: number;   // sum of all task ground transport costs for the period
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
    groundTransportTotal: 0,
  };
}

function NoticeOfOps({ tasks, month, year, setMonth, setYear }: {
  tasks: NeptTask[];
  month?: number;
  year?: number;
  setMonth?: (m: number) => void;
  setYear?: (y: number) => void;
}) {
  const now = new Date();
  const [_selMonth, _setSelMonth] = useState(now.getMonth());
  const [_selYear, _setSelYear]   = useState(now.getFullYear());
  const selMonth   = month    !== undefined ? month    : _selMonth;
  const selYear    = year     !== undefined ? year     : _selYear;
  const setSelMonth = setMonth !== undefined ? setMonth : _setSelMonth;
  const setSelYear  = setYear  !== undefined ? setYear  : _setSelYear;
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
    // Ground transport: sum each task's cost × 2 (pick-up + drop-off)
    const groundTransportTotal = monthTasks.reduce((sum, t) => {
      const rate = (t as any).groundTransportCost ?? 200;
      return sum + rate * 2;
    }, 0);
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
      groundTransportTotal,
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
      groundTransportTotal: nop.groundTransportTotal,
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

  // ── Contract Performance KPI derivations ──────────────────────────────
  const contractKpis = [
    {
      label: "On-Time Performance",
      target: "95%",
      actual: `${onTimeRate}%`,
      status: onTimeRate >= 95 ? "met" : onTimeRate >= 88 ? "close" : "missed",
    },
    {
      label: "Average Response Time",
      target: "<2hr",
      actual: `${nop.avgResponseMins} min`,
      status: nop.avgResponseMins > 0 && nop.avgResponseMins <= 120 ? "met" : nop.avgResponseMins <= 140 ? "close" : "missed",
    },
    {
      label: "Clinical Handover Compliance",
      target: "100%",
      actual: "97%",
      status: "close" as const,
    },
    {
      label: "Patient Satisfaction Score",
      target: "4.5/5",
      actual: "4.3/5",
      status: "close" as const,
    },
  ] as { label: string; target: string; actual: string; status: "met" | "close" | "missed" }[];

  const kpiStatusStyle: Record<string, string> = {
    met:    "border-emerald-400/40 bg-emerald-500/8",
    close:  "border-amber-400/40 bg-amber-500/8",
    missed: "border-red-400/40 bg-red-500/8",
  };
  const kpiStatusText: Record<string, string> = {
    met:    "text-emerald-300",
    close:  "text-amber-300",
    missed: "text-red-300",
  };

  // ── Availability & Shift Coverage by base ─────────────────────────────
  const BASE_COVERAGE = [
    { base: "Dubbo",       aircraft: 3, pilots: 5, nurses: 6, shiftsCovered: 98, gap: "" },
    { base: "Broken Hill", aircraft: 2, pilots: 3, nurses: 3, shiftsCovered: 94, gap: "Single nurse cover on weekends" },
    { base: "Bankstown",   aircraft: 3, pilots: 4, nurses: 5, shiftsCovered: 100, gap: "" },
    { base: "Launceston",  aircraft: 1, pilots: 2, nurses: 2, shiftsCovered: 89, gap: "Limited backup pilot for late shift" },
    { base: "Essendon",    aircraft: 2, pilots: 3, nurses: 4, shiftsCovered: 96, gap: "" },
  ];

  // ── Declined & Cancelled Transfers breakdown ───────────────────────────
  const DECLINED_TRANSFERS = [
    { reason: "Aircraft Unserviceable",     count: 3, pct: 18, revenue: 24000, color: "text-red-300 border-red-400/30 bg-red-500/5" },
    { reason: "Crew Unavailable",            count: 4, pct: 24, revenue: 32000, color: "text-red-300 border-red-400/30 bg-red-500/5" },
    { reason: "Weather",                     count: 5, pct: 29, revenue: 40000, color: "text-amber-300 border-amber-400/30 bg-amber-500/5" },
    { reason: "Patient Condition Changed",   count: 2, pct: 12, revenue: 0,     color: "text-cyan-300 border-cyan-400/30 bg-cyan-500/5" },
    { reason: "Scope of Service",            count: 3, pct: 18, revenue: 24000, color: "text-muted-foreground border-border bg-muted/10" },
  ];
  const declinedTotals = DECLINED_TRANSFERS.reduce((acc, d) => ({
    count: acc.count + d.count,
    pct: acc.pct + d.pct,
    revenue: acc.revenue + d.revenue,
  }), { count: 0, pct: 0, revenue: 0 });

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
            <FileText size={16} className="text-cyan-400" /> Monthly Report
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

      {/* ── Section A: Contract Performance KPIs ── */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
          <BarChart3 size={13} className="text-cyan-400" /> Contract Performance KPIs
          <span className="ml-auto text-[9px] text-muted-foreground font-normal">Target vs Actual</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {contractKpis.map(k => (
            <div key={k.label} className={`rounded-lg border p-3 ${kpiStatusStyle[k.status]}`}>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-2">{k.label}</div>
              <div className={`text-xl font-bold tabular-nums ${kpiStatusText[k.status]}`}>{k.actual}</div>
              <div className="text-[10px] text-muted-foreground mt-1">Target: {k.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section B: Availability & Shift Coverage ── */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
          <Users size={13} className="text-cyan-400" /> Availability & Shift Coverage
          <span className="ml-auto text-[9px] text-muted-foreground font-normal">By base</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-wide text-muted-foreground border-b border-card-border">
                <th className="py-2 pr-3 font-semibold">Base</th>
                <th className="py-2 pr-3 font-semibold">Aircraft Available</th>
                <th className="py-2 pr-3 font-semibold">Crew Available</th>
                <th className="py-2 pr-3 font-semibold">Shifts Covered</th>
                <th className="py-2 pr-3 font-semibold">Coverage Gaps</th>
              </tr>
            </thead>
            <tbody>
              {BASE_COVERAGE.map(b => (
                <tr key={b.base} className="border-b border-card-border/50 last:border-0">
                  <td className="py-2 pr-3 font-semibold text-foreground whitespace-nowrap">{b.base}</td>
                  <td className="py-2 pr-3 text-foreground">{b.aircraft}</td>
                  <td className="py-2 pr-3 text-foreground">{b.pilots + b.nurses} <span className="text-muted-foreground">({b.pilots} pilots, {b.nurses} nurses)</span></td>
                  <td className="py-2 pr-3">
                    <span className={`font-bold ${
                      b.shiftsCovered >= 95 ? "text-emerald-400" :
                      b.shiftsCovered >= 90 ? "text-amber-400" : "text-red-400"
                    }`}>{b.shiftsCovered}%</span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {b.gap ? (
                      <span className="inline-flex items-center gap-1 text-amber-300"><AlertTriangle size={10} /> {b.gap}</span>
                    ) : (
                      <span className="text-emerald-400/80">No gaps reported</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section C: Declined & Cancelled Transfers ── */}
      <div className="bg-card rounded-xl border border-card-border p-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
          <AlertOctagon size={13} className="text-amber-400" /> Declined & Cancelled Transfers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-wide text-muted-foreground border-b border-card-border">
                <th className="py-2 pr-3 font-semibold">Declined Reason</th>
                <th className="py-2 pr-3 font-semibold">Count</th>
                <th className="py-2 pr-3 font-semibold">% of Total</th>
                <th className="py-2 pr-3 font-semibold">Est. Missed Revenue</th>
              </tr>
            </thead>
            <tbody>
              {DECLINED_TRANSFERS.map(d => (
                <tr key={d.reason} className={`border-b border-card-border/50 last:border-0 ${d.color}`}>
                  <td className="py-2 pr-3 font-semibold whitespace-nowrap">{d.reason}</td>
                  <td className="py-2 pr-3 tabular-nums">{d.count}</td>
                  <td className="py-2 pr-3 tabular-nums">{d.pct}%</td>
                  <td className="py-2 pr-3 tabular-nums">${d.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-card-border font-bold text-foreground">
                <td className="py-2 pr-3">Total</td>
                <td className="py-2 pr-3 tabular-nums">{declinedTotals.count}</td>
                <td className="py-2 pr-3 tabular-nums">{declinedTotals.pct}%</td>
                <td className="py-2 pr-3 tabular-nums">${declinedTotals.revenue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg border border-amber-400/30 bg-amber-500/8">
          <Info size={12} className="text-amber-300 mt-0.5 shrink-0" />
          <span className="text-[10px] text-amber-200 leading-relaxed">
            Revenue at risk from controllable factors (Aircraft + Crew): <span className="font-bold">$56,000/month</span>
          </span>
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


// ─── Auto Tasking Modal ──────────────────────────────────────────────────

// ── Ground transport resources ──────────────────────────────────────────────
interface PtvLocation {
  location: string;        // Town / city name
  icao: string;            // Nearest aerodrome ICAO
  vehicleId: string;       // PTV call-sign / plate
  drivers: string[];       // Driver names at this location
  driverAvailability: Record<string, boolean>; // name → available
  vehicleAvailable: boolean;
}

const BASE_PTV_LOCATIONS: PtvLocation[] = [
  { location: "Wagga Wagga",  icao: "YSWG", vehicleId: "PTV-WAG",  drivers: ["Wagga Driver 1", "Wagga Driver 2"],  driverAvailability: { "Wagga Driver 1": true, "Wagga Driver 2": true }, vehicleAvailable: true },
  { location: "Griffith",     icao: "YGTH", vehicleId: "PTV-GTH",  drivers: ["Griffith Driver"],                    driverAvailability: { "Griffith Driver": true },                    vehicleAvailable: true },
  { location: "Broken Hill",  icao: "YBHI", vehicleId: "PTV-BHI",  drivers: ["BHI Driver 1", "BHI Driver 2"],     driverAvailability: { "BHI Driver 1": true, "BHI Driver 2": true }, vehicleAvailable: true },
  { location: "Dubbo",        icao: "YSDU", vehicleId: "PTV-DBO",  drivers: ["Dubbo Driver 1", "Dubbo Driver 2"],  driverAvailability: { "Dubbo Driver 1": true, "Dubbo Driver 2": true }, vehicleAvailable: true },
  { location: "Bankstown",    icao: "YSBK", vehicleId: "PTV-BKT",  drivers: ["BKT Driver 1", "BKT Driver 2"],     driverAvailability: { "BKT Driver 1": true, "BKT Driver 2": true },  vehicleAvailable: true },
  { location: "Narrandera",   icao: "YNAR", vehicleId: "PTV-NAR",  drivers: ["Narrandera Driver"],                 driverAvailability: { "Narrandera Driver": true },                  vehicleAvailable: true },
  { location: "Deniliquin",   icao: "YDNI", vehicleId: "PTV-DNQ",  drivers: ["Deni Driver"],                       driverAvailability: { "Deni Driver": true },                        vehicleAvailable: true },
  { location: "Albury",       icao: "YMAY", vehicleId: "PTV-ALB",  drivers: ["Albury Driver"],                     driverAvailability: { "Albury Driver": true },                      vehicleAvailable: true },
  { location: "Orange",       icao: "YORG", vehicleId: "PTV-OAG",  drivers: ["Orange Driver"],                     driverAvailability: { "Orange Driver": true },                      vehicleAvailable: true },
  { location: "Parkes",       icao: "YPKS", vehicleId: "PTV-PKE",  drivers: ["Parkes Driver"],                     driverAvailability: { "Parkes Driver": true },                      vehicleAvailable: true },
];
// ─────────────────────────────────────────────────────────────────────────────

const BASE_AIRCRAFT: { base: string; reg: string; type: string; available: boolean }[] = [
  { base: "Dubbo",      reg: "VH-LTQ", type: "B200", available: true },
  { base: "Dubbo",      reg: "VH-MVW", type: "B200", available: true },
  { base: "Dubbo",      reg: "VH-MVX", type: "B200", available: false },
  { base: "Bankstown",  reg: "VH-MWH", type: "B200", available: true },
  { base: "Bankstown",  reg: "VH-MWK", type: "B200", available: true },
  { base: "Bankstown",  reg: "VH-RFD", type: "B200", available: false },
];

interface GroundTransportLeg {
  location: string;
  vehicleId: string;
  leg: "pickup" | "dropoff" | "transfer";
  driver: string;
  solution: "local" | "borrowed" | "flown-in" | "shared" | "nil";
  solutionDetail: string;
}

interface AutoTaskResult {
  summary: string;
  tasks: Array<{
    aircraft: string;
    base: string;
    pilot: string;
    nurse: string;
    sectors: Array<{ from: string; fromIcao: string; to: string; toIcao: string; etd: string; eta: string; groundTime: string }>;
    groundTransport?: GroundTransportLeg[];
    dutyStart: string;
    dutyEnd: string;
    totalFlightTime: string;
    notes: string;
  }>;
  warnings: string[];
}

// Sub-component so useState hooks don't violate rules-of-hooks inside map()
function PtvRow({ ptv, onToggleVehicle, onToggleDriver, onAddDriver }: {
  ptv: PtvLocation;
  onToggleVehicle: () => void;
  onToggleDriver: (d: string) => void;
  onAddDriver: (d: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const availCount = ptv.drivers.filter(d => ptv.driverAvailability[d]).length;
  const hasIssue = ptv.vehicleAvailable && availCount === 0;
  return (
    <div className={`rounded-xl border p-3 ${ hasIssue ? "bg-amber-500/8 border-amber-500/40" : "bg-muted/10 border-card-border" }`}>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onToggleVehicle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
            ptv.vehicleAvailable ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300" : "bg-muted/20 border-card-border text-muted-foreground line-through"
          }`}>
          <Truck size={10} />{ptv.vehicleId}
        </button>
        <span className="text-xs font-semibold text-foreground">{ptv.location}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{ptv.icao}</span>
        {hasIssue && <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-400"><AlertTriangle size={9} /> No driver</span>}
        {!ptv.vehicleAvailable && <span className="ml-auto text-[10px] text-red-400/70">Vehicle unavailable</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {ptv.drivers.map(driver => (
          <button key={driver} onClick={() => onToggleDriver(driver)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold transition-colors ${
              ptv.driverAvailability[driver]
                ? "bg-green-500/15 border-green-500/40 text-green-300"
                : "bg-muted/20 border-card-border text-muted-foreground line-through opacity-60"
            }`}>
            <Users size={8} />{driver}
          </button>
        ))}
        {showAdd ? (
          <div className="flex items-center gap-1">
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { onAddDriver(newName); setNewName(""); setShowAdd(false); } if (e.key === "Escape") setShowAdd(false); }}
              placeholder="Driver name" className="text-[10px] px-2 py-0.5 rounded border border-cyan-500/40 bg-muted/20 text-foreground w-28 focus:outline-none" />
            <button onClick={() => { onAddDriver(newName); setNewName(""); setShowAdd(false); }} className="text-[9px] text-cyan-400 hover:text-cyan-300">Add</button>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="text-[9px] text-muted-foreground hover:text-cyan-400 transition-colors px-1.5 py-0.5 rounded border border-dashed border-card-border">+ driver</button>
        )}
      </div>
    </div>
  );
}

function AutoTaskingModal({ onClose, onSaveTasks, existingTasks }: {
  onClose: () => void;
  onSaveTasks: (tasks: TaskDraft[]) => void;
  existingTasks: NeptTask[];
}) {
  const [step, setStep]               = useState<"input" | "assets" | "result">("input");
  const [inputMode, setInputMode]     = useState<"paste" | "email">("paste");
  const [jobSheet, setJobSheet]       = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [opDate, setOpDate]           = useState(() => new Date().toISOString().slice(0, 10));
  const [aircraft, setAircraft]       = useState(BASE_AIRCRAFT.map(a => ({ ...a })));
  const [ptvLocations, setPtvLocations] = useState<PtvLocation[]>(BASE_PTV_LOCATIONS.map(p => ({ ...p, driverAvailability: { ...p.driverAvailability } })));
  const [crewNotes, setCrewNotes]     = useState("Vic crew available at Bankstown for both aircraft.");
  const [nurseEba, setNurseEba]       = useState("30 min lunch break between 12:00–14:00. No split permitted.");
  const [dutyStart, setDutyStart]     = useState("07:00");
  const [maxDuty, setMaxDuty]         = useState("10");
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("Optimising — AI is working...");
  const [error, setError]             = useState("");
  const [result, setResult]           = useState<AutoTaskResult | null>(null);

  // Route planning — ICAO waypoints with fuel + NOTAM data
  type Waypoint = { airport: Airport | null; notams: any[]; notamLoading: boolean; };
  const [waypoints, setWaypoints]     = useState<Waypoint[]>([
    { airport: null, notams: [], notamLoading: false },
    { airport: null, notams: [], notamLoading: false },
  ]);
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);

  async function fetchNotamsForWaypoint(idx: number, icao: string) {
    setWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, notamLoading: true } : w));
    try {
      const res = await fetch(`/api/notams/${icao}`);
      const json = await res.json() as { notams: any[] };
      setWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, notams: json.notams ?? [], notamLoading: false } : w));
    } catch {
      setWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, notams: [], notamLoading: false } : w));
    }
  }

  function setWaypointAirport(idx: number, airport: Airport | null) {
    setWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, airport, notams: [], notamLoading: false } : w));
    if (airport?.icao) fetchNotamsForWaypoint(idx, airport.icao);
  }

  function addWaypoint() {
    setWaypoints(prev => [...prev, { airport: null, notams: [], notamLoading: false }]);
  }

  function removeWaypoint(idx: number) {
    if (waypoints.length <= 2) return;
    setWaypoints(prev => prev.filter((_, i) => i !== idx));
  }

  // ERSA aerodrome lookup
  const ersaMap = new Map<string, ERSAAerodrome>(ERSA_AERODROMES.map(a => [a.icao, a]));

  // Parse wildlife hazard and after-hours info from nswaaNote
  function parseErsaNote(note: string | undefined): { wildlife: string | null; rooRun: boolean; afterHours: string | null; ctaf: string | null } {
    if (!note) return { wildlife: null, rooRun: false, afterHours: null, ctaf: null };
    const rooRun = /roo.?run.*(required|mandatory)|mandatory.*roo.?run/i.test(note);
    const wildlifeMatch = note.match(/^([^.]*(?:kangaroo|emu|wildlife|bird|deer|wombat|livestock)[^.]*\.)/i);
    const wildlife = wildlifeMatch ? wildlifeMatch[1].trim() : null;
    const afterHoursMatch = note.match(/(?:after.?hours|after hours)[^.]*contact[^.]*?([+\d\s\-()]{7,})/i) ||
                            note.match(/contact[^.]*?([+\d\s\-()]{7,})/i);
    const afterHours = afterHoursMatch ? afterHoursMatch[0].replace(/^.*?(?:contact:|contact)\s*/i, '').trim() : null;
    const ctafMatch = note.match(/CTAF\s+([\d.]+)/i);
    const ctaf = ctafMatch ? ctafMatch[1] : null;
    return { wildlife, rooRun, afterHours, ctaf };
  }

  // Build a route context string to append to job sheet for AI
  // ── PTV helpers ─────────────────────────────────────────────
  function togglePtvVehicle(idx: number) {
    setPtvLocations(prev => prev.map((p, i) => i === idx ? { ...p, vehicleAvailable: !p.vehicleAvailable } : p));
  }
  function togglePtvDriver(locIdx: number, driverName: string) {
    setPtvLocations(prev => prev.map((p, i) => i === locIdx
      ? { ...p, driverAvailability: { ...p.driverAvailability, [driverName]: !p.driverAvailability[driverName] } }
      : p
    ));
  }
  function addPtvDriver(locIdx: number, name: string) {
    if (!name.trim()) return;
    setPtvLocations(prev => prev.map((p, i) => i === locIdx
      ? { ...p, drivers: [...p.drivers, name.trim()], driverAvailability: { ...p.driverAvailability, [name.trim()]: true } }
      : p
    ));
  }

  function buildGroundTransportContext(): string {
    const lines: string[] = ["\n--- GROUND TRANSPORT RESOURCES ---"];
    lines.push("Each location has a Patient Transfer Vehicle (PTV). The following table shows vehicle and driver availability for today.");
    lines.push("");
    ptvLocations.forEach(p => {
      const availDrivers = p.drivers.filter(d => p.driverAvailability[d]);
      const nilDrivers   = p.drivers.filter(d => !p.driverAvailability[d]);
      const vStatus = p.vehicleAvailable ? "AVAILABLE" : "UNAVAILABLE";
      lines.push(`${p.location} (${p.icao}) — ${p.vehicleId}: Vehicle ${vStatus}`);
      if (availDrivers.length) lines.push(`  Available drivers: ${availDrivers.join(", ")}`);
      if (nilDrivers.length)   lines.push(`  UNAVAILABLE drivers: ${nilDrivers.join(", ")}`);
      if (!availDrivers.length && p.vehicleAvailable) lines.push(`  ⚠ NO drivers available at this location — vehicle cannot operate without a driver`);
    });
    lines.push("");
    lines.push("GROUND TRANSPORT OPTIMISATION RULES:");
    lines.push("- If a location has its vehicle available but no driver, consider: (1) borrowing a driver from a nearby town if they have spare capacity, (2) repositioning a driver from base (Dubbo/Bankstown) on the aircraft as a passenger, or (3) using a driver from an adjacent location if they have nil or low tasking that day.");
    lines.push("- If multiple patients need road transfer from the same location on the same day, sequence them efficiently to minimise vehicle waiting time.");
    lines.push("- If a location has NO vehicle and NO driver, note 'nil ground transport available' and suggest the nearest available alternative.");
    lines.push("- A driver travelling as an aircraft passenger to staff a remote PTV is a valid and preferred solution — include this as an explicit sector in the task.");
    lines.push("- Always specify which driver performs each road leg in the groundTransport field.");
    lines.push("---");
    return lines.join("\n");
  }

  function buildRouteContext(): string {
    const filled = waypoints.filter(w => w.airport);
    if (!filled.length) return "";
    const lines: string[] = ["\n--- ROUTE CONTEXT (pre-planned by dispatcher) ---"];
    const chain = filled.map(w => w.airport!.icao).join(" → ");
    lines.push(`Route: ${chain}`);
    lines.push("\nFuel availability:");
    filled.forEach(w => {
      const ap = w.airport!;
      lines.push(`  ${fuelSummaryForAI(ap.icao, ap.city || ap.name)}`);
    });
    const critical = filled.flatMap(w =>
      w.notams.filter((n: any) => n.severity === "CRITICAL" || n.severity === "HIGH").map((n: any) => `  [${n.severity}] ${n.icao}: ${n.plain}`)
    );
    if (critical.length) {
      lines.push("\nActive NOTAMs — planning impact:");
      lines.push(...critical);
    }
    lines.push("---");
    return lines.join("\n");
  }

  async function runOptimiser() {
    setLoading(true);
    setLoadingMsg("Optimising — AI is working...");
    setError("");
    // After 8s show a reassuring message in case of cold-start delay
    const msgTimer = setTimeout(() => setLoadingMsg("Waking server — first request after idle can take 20–30s..."), 8000);
    try {
      const availableAircraft = aircraft.filter(a => a.available);
      const routeCtx = buildRouteContext();
      const gtCtx    = buildGroundTransportContext();
      const payload = {
        jobSheet: (inputMode === "paste" ? jobSheet : `[Email inbox source: ${emailAddress}]`) + routeCtx + gtCtx,
        opDate,
        availableAircraft,
        crewNotes,
        nurseEbaRule: nurseEba,
        dutyStart,
        maxDutyHours: Number(maxDuty),
      };
      const res  = await apiRequest("POST", "/api/nept/auto-task", payload);
      const json = await res.json() as AutoTaskResult & { error?: string };
      if (json.error) throw new Error(json.error);
      setResult(json);
      setStep("result");
    } catch (e: any) {
      setError(e.message ?? "Optimisation failed — please try again.");
    } finally {
      clearTimeout(msgTimer);
      setLoading(false);
      setLoadingMsg("Optimising — AI is working...");
    }
  }

  function buildDrafts(): TaskDraft[] {
    if (!result) return [];
    const ref = nextRef(existingTasks);
    const year = new Date().getFullYear();
    let counter = existingTasks.length + 1;
    return result.tasks.map(t => {
      const taskRef = `NEPT-${year}-${String(counter++).padStart(4, "0")}`;
      const sectors: Sector[] = t.sectors.map(s => ({
        id: crypto.randomUUID(),
        from: s.from,
        fromIcao: s.fromIcao,
        to: s.to,
        toIcao: s.toIcao,
        eta: `${opDate}T${s.eta}`,
        fromAirport: null,
        toAirport: null,
      }));
      return {
        taskRef,
        status: "Pending" as TaskStatus,
        priority: "Routine" as TaskPriority,
        requestTime: new Date().toISOString(),
        requiredBy: null,
        pickupLocation: sectors[0]?.from ?? "",
        pickupIcao: sectors[0]?.fromIcao ?? null,
        destLocation: sectors[sectors.length - 1]?.to ?? "",
        destIcao: sectors[sectors.length - 1]?.toIcao ?? null,
        patientName: null,
        patientRef: null,
        escortName: null,
        escortHeavy: false,
        driverNameLeg2: null,
        referringHospital: null,
        receivingHospital: null,
        aircraftReg: t.aircraft,
        pilotName: t.pilot,
        nurseName: t.nurse,
        dispatchedBy: null,
        estimatedEta: null,
        actualDepart: null,
        actualArrive: null,
        completedAt: null,
        notes: t.notes,
        groundTransportCost: null,
        sectors,
      };
    });
  }

  const toggleAircraft = (i: number) =>
    setAircraft(prev => prev.map((a, idx) => idx === i ? { ...a, available: !a.available } : a));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-5 border-b border-card-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30">
              <Sparkles size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                AI Auto Tasking
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Optimise the day's NEPT run across Dubbo & Bankstown
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-5 pt-4 pb-2">
          {(["input","assets","result"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                step === s ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40" :
                (["input","assets","result"].indexOf(step) > i) ? "bg-green-500/15 text-green-400 border border-green-500/30" :
                "bg-muted/20 text-muted-foreground border border-transparent"
              }`}>
                {(["input","assets","result"].indexOf(step) > i) ? <Check size={10} /> : <span>{i+1}</span>}
                {s === "input" ? "Job Sheet" : s === "assets" ? "Assets & Rules" : "Optimised Plan"}
              </div>
              {i < 2 && <div className="w-6 h-px bg-card-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="p-5 space-y-5">

          {/* ── STEP 1: Job Sheet Input ── */}
          {step === "input" && (<>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operations Date</label>
              <input type="date" value={opDate} onChange={e => setOpDate(e.target.value)}
                className="bg-muted/20 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground w-full focus:outline-none focus:border-cyan-400/60" />
            </div>

            {/* ── Route Builder — ICAO waypoints, fuel & NOTAMs ── */}
            <div>
              <button
                type="button"
                onClick={() => setShowRouteBuilder(r => !r)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/20 border border-card-border hover:border-cyan-400/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Navigation size={13} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-foreground">Route Planner — ICAO / Fuel / NOTAMs</span>
                  {waypoints.some(w => w.airport) && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {waypoints.filter(w => w.airport).length} waypts
                    </span>
                  )}
                  {waypoints.some(w => w.notams.some((n: any) => n.severity === "CRITICAL" || n.severity === "HIGH")) && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse">
                      NOTAM
                    </span>
                  )}
                </div>
                {showRouteBuilder ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
              </button>

              {showRouteBuilder && (
                <div className="mt-2 space-y-2 p-3 rounded-xl bg-muted/10 border border-card-border">
                  <p className="text-[10px] text-muted-foreground">Search ERSA/ICAO — type city, ICAO code or aerodrome name. Fuel availability and live NOTAMs load automatically.</p>

                  {waypoints.map((wp, idx) => {
                    const fuel = wp.airport ? getFuelStatus(wp.airport.icao) : null;
                    const critNotams = wp.notams.filter((n: any) => n.severity === "CRITICAL");
                    const highNotams = wp.notams.filter((n: any) => n.severity === "HIGH");
                    const medNotams  = wp.notams.filter((n: any) => n.severity === "MEDIUM");

                    return (
                      <div key={idx} className="rounded-lg border border-card-border bg-card overflow-hidden">
                        {/* Waypoint header */}
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-card-border bg-muted/10">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            idx === 0 ? "bg-cyan-500/20 text-cyan-300" :
                            idx === waypoints.length - 1 ? "bg-green-500/20 text-green-300" :
                            "bg-amber-500/20 text-amber-300"
                          }`}>
                            {idx === 0 ? "DEP" : idx === waypoints.length - 1 ? "ARR" : idx}
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {idx === 0 ? "Departure" : idx === waypoints.length - 1 ? "Arrival" : `Waypoint ${idx}`}
                          </span>
                          {waypoints.length > 2 && (
                            <button type="button" onClick={() => removeWaypoint(idx)} className="ml-auto text-muted-foreground hover:text-red-400 transition-colors">
                              <X size={11} />
                            </button>
                          )}
                        </div>

                        {/* Airport search */}
                        <div className="p-2.5 space-y-2">
                          <AirportSearch
                            value={wp.airport}
                            onChange={ap => setWaypointAirport(idx, ap)}
                            placeholder="Search ICAO, city or aerodrome name…"
                          />

                          {/* Fuel badge */}
                          {wp.airport && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {wp.notamLoading ? (
                                <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><Loader2 size={9} className="animate-spin" /> Loading NOTAMs…</span>
                              ) : null}
                              {fuel?.jetA1 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                                  <Droplets size={8} /> Jet-A1{fuel.hours ? ` · ${fuel.hours}` : ""}
                                </span>
                              )}
                            </div>
                          )}

                          {/* NOTAMs */}
                          {wp.airport && !wp.notamLoading && wp.notams.length > 0 && (
                            <div className="space-y-1">
                              {critNotams.map((n: any, ni: number) => (
                                <div key={ni} className="flex items-start gap-1.5 p-2 rounded bg-red-500/10 border border-red-500/30">
                                  <AlertOctagon size={10} className="text-red-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[9px] font-bold text-red-400 uppercase mr-1">CRITICAL</span>
                                    <span className="text-[10px] text-red-200">{n.plain}</span>
                                  </div>
                                </div>
                              ))}
                              {highNotams.map((n: any, ni: number) => (
                                <div key={ni} className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                                  <AlertTriangle size={10} className="text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[9px] font-bold text-amber-400 uppercase mr-1">HIGH</span>
                                    <span className="text-[10px] text-amber-200">{n.plain}</span>
                                  </div>
                                </div>
                              ))}
                              {medNotams.map((n: any, ni: number) => (
                                <div key={ni} className="flex items-start gap-1.5 p-2 rounded bg-blue-500/10 border border-blue-500/30">
                                  <Info size={10} className="text-blue-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[9px] font-bold text-blue-400 uppercase mr-1">MEDIUM</span>
                                    <span className="text-[10px] text-blue-200">{n.plain}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {wp.airport && !wp.notamLoading && wp.notams.length === 0 && (
                            <div className="flex items-center gap-1.5 text-[9px] text-green-400/70">
                              <CheckCircle2 size={9} /> No active NOTAMs
                            </div>
                          )}

                          {/* ERSA wildlife hazard + after-hours */}
                          {wp.airport && (() => {
                            const ersa = ersaMap.get(wp.airport!.icao);
                            if (!ersa?.nswaaNote) return null;
                            const { wildlife, rooRun, afterHours, ctaf } = parseErsaNote(ersa.nswaaNote);
                            if (!wildlife && !rooRun && !afterHours) return null;
                            return (
                              <div className="space-y-1 pt-1 border-t border-card-border">
                                {rooRun && (
                                  <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                                    <AlertTriangle size={10} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wide mr-1">Roo Run Required</span>
                                      {wildlife && <p className="text-[10px] text-amber-200 leading-snug mt-0.5">{wildlife}</p>}
                                    </div>
                                  </div>
                                )}
                                {!rooRun && wildlife && (
                                  <div className="flex items-start gap-1.5 p-2 rounded bg-yellow-500/8 border border-yellow-500/20">
                                    <Wind size={10} className="text-yellow-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-yellow-200 leading-snug">{wildlife}</p>
                                  </div>
                                )}
                                {afterHours && (
                                  <div className="flex items-start gap-1.5 px-2 py-1.5 rounded bg-muted/10 border border-card-border">
                                    <Clock size={9} className="text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide block mb-0.5">After-hours</span>
                                      <span className="text-[10px] text-foreground">{afterHours}</span>
                                    </div>
                                  </div>
                                )}
                                {ctaf && (
                                  <div className="flex items-center gap-1.5 px-2 py-1">
                                    <span className="text-[9px] font-semibold text-muted-foreground uppercase">CTAF</span>
                                    <span className="text-[10px] font-mono font-bold text-cyan-300">{ctaf} MHz</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={addWaypoint}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-card-border text-muted-foreground hover:text-cyan-300 hover:border-cyan-400/40 transition-colors">
                      <Plus size={10} /> Add Waypoint
                    </button>
                    {waypoints.some(w => w.airport) && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                        <CheckCircle2 size={9} className="text-cyan-400" /> Route context will be included in the AI briefing
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Job Sheet Source</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setInputMode("paste")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    inputMode === "paste" ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300" : "bg-muted/20 border-card-border text-muted-foreground hover:text-foreground"
                  }`}>
                  <Upload size={13} /> Paste / Type
                </button>
                <button onClick={() => setInputMode("email")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    inputMode === "email" ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300" : "bg-muted/20 border-card-border text-muted-foreground hover:text-foreground"
                  }`}>
                  <Mail size={13} /> Email Inbox
                </button>
              </div>

              {inputMode === "paste" ? (
                <div>
                  <textarea
                    value={jobSheet}
                    onChange={e => setJobSheet(e.target.value)}
                    placeholder={"Paste job sheet here — any format works.\n\nExample:\nJob 1: Patient transport YSDU → YSCB, pickup 08:00\nJob 2: YSCB → YSSY return, 13:00\nJob 3: YSDU → YSBK, patient + escort, 15:00\n..."}
                    rows={12}
                    className="w-full bg-muted/20 border border-card-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-400/60 font-mono resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Paste the job list in any format — plain text, table, or copied from email. AI will extract and parse all tasks automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                    <Info size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-300">
                      Email access requires your inbox to be connected. Enter the sender address the job sheets arrive from and AI will pull the latest unread sheet for today.
                    </p>
                  </div>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                    placeholder="e.g. nept-jobs@rfds.org.au"
                    className="w-full bg-muted/20 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setStep("assets")}
              disabled={inputMode === "paste" ? !jobSheet.trim() : !emailAddress.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl text-sm font-semibold text-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next — Set Available Assets <ChevronRight size={15} />
            </button>
          </>)}

          {/* ── STEP 2: Assets & Rules ── */}
          {step === "assets" && (<>

            {/* Aircraft availability */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aircraft Availability</label>
              <div className="space-y-2">
                {["Dubbo", "Bankstown"].map(base => (
                  <div key={base}>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-2">
                      <MapPin size={10} /> {base}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {aircraft.filter(a => a.base === base).map((a, i) => {
                        const idx = aircraft.indexOf(a);
                        return (
                          <button key={a.reg} onClick={() => toggleAircraft(idx)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                              a.available
                                ? "bg-green-500/15 border-green-500/40 text-green-300"
                                : "bg-muted/20 border-card-border text-muted-foreground line-through"
                            }`}>
                            <Plane size={11} />
                            {a.reg}
                            <span className="text-[9px] opacity-60">{a.type}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Click to toggle aircraft on/off for today's operations.</p>
            </div>

            {/* Crew notes */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Users size={11} className="inline mr-1" /> Crew Availability Notes
              </label>
              <textarea
                value={crewNotes}
                onChange={e => setCrewNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Vic crew available at Bankstown. Matt Williams unavailable today. Extra nurse on standby at Dubbo."
                className="w-full bg-muted/20 border border-card-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-cyan-400/60 resize-none"
              />
            </div>

            {/* Duty rules */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Clock size={11} className="inline mr-1" /> Duty Start
                </label>
                <input type="time" value={dutyStart} onChange={e => setDutyStart(e.target.value)}
                  className="w-full bg-muted/20 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-400/60" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Clock size={11} className="inline mr-1" /> Max Duty (hrs)
                </label>
                <input type="number" value={maxDuty} onChange={e => setMaxDuty(e.target.value)}
                  min="6" max="14" step="0.5"
                  className="w-full bg-muted/20 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-400/60" />
              </div>
            </div>

            {/* Nurse lunch break — editable window used by the AI; EBA limits are only surfaced in the results if a task hits or risks one */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Clock size={11} className="inline mr-1" /> Nurse Lunch Break Window
              </label>
              <input
                value={nurseEba}
                onChange={e => setNurseEba(e.target.value)}
                className="w-full bg-muted/20 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-cyan-400/60"
              />
              <p className="text-[10px] text-muted-foreground mt-1">AI will protect this window — no patient legs scheduled during lunch.</p>
            </div>

            {/* Ground Transport Resources */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ground Transport — PTV &amp; Driver Availability</label>
              <p className="text-[10px] text-muted-foreground mb-3">Mark vehicles or drivers unavailable. The optimiser will suggest solutions — shared drivers, repositioning via aircraft, or nearest alternate.</p>
              <div className="space-y-2">
                {ptvLocations.map((ptv, locIdx) => (
                  <PtvRow
                    key={ptv.location}
                    ptv={ptv}
                    onToggleVehicle={() => togglePtvVehicle(locIdx)}
                    onToggleDriver={(d) => togglePtvDriver(locIdx, d)}
                    onAddDriver={(d) => addPtvDriver(locIdx, d)}
                  />
                ))}
              </div>
            </div>

            {/* Ground time */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
              <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-300">
                <strong>Ground time:</strong> AI allocates a minimum 60 min turnaround at each airport for patient handling, boarding, and documentation — built in automatically.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("input")}
                className="flex items-center gap-2 px-4 py-3 bg-muted/20 hover:bg-muted/30 border border-card-border rounded-xl text-sm font-semibold text-muted-foreground transition-colors">
                <ChevronDown size={14} className="rotate-90" /> Back
              </button>
              <button
                onClick={runOptimiser}
                disabled={loading || aircraft.filter(a => a.available).length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 rounded-xl text-sm font-semibold text-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> {loadingMsg}</>
                ) : (
                  <><Zap size={15} /> Run AI Optimiser</>
                )}
              </button>
            </div>
          </>)}

          {/* ── STEP 3: Optimised Plan ── */}
          {step === "result" && result && (<>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                <p className="text-sm text-cyan-200">{result.summary}</p>
              </div>
            </div>

            {/* EBA limit alerts — only shown when a task actually hits or risks breaching a limit */}
            {(() => {
              const ebaKeywords = /eba|duty limit|rest period|shift.*hour|nurse.*hour|pilot.*hour|100.*hr|12.*hr|10.*hr.*rest|fatigue|breach/i;
              const ebaWarnings   = result.warnings.filter(w => ebaKeywords.test(w));
              const otherWarnings = result.warnings.filter(w => !ebaKeywords.test(w));
              return (<>
                {ebaWarnings.length > 0 && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/8 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-rose-500/20 flex items-center gap-2">
                      <Scale size={12} className="text-rose-400" />
                      <span className="text-xs font-bold text-rose-300">EBA Limit Alert</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold ml-auto">ACTION REQUIRED</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {ebaWarnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <AlertTriangle size={11} className="text-rose-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-rose-200">{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General warnings */}
                {otherWarnings.length > 0 && (
                  <div className="space-y-1.5">
                    {otherWarnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-300">{w}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>);
            })()}

            {/* Tasks */}
            <div className="space-y-4">
              {result.tasks.map((t, i) => (
                <div key={i} className="border border-card-border rounded-xl overflow-hidden">
                  {/* Aircraft header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-card-border">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30">
                        <Plane size={13} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{t.aircraft}</div>
                        <div className="text-[10px] text-muted-foreground">{t.base} base</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">Pilot: <span className="text-foreground font-semibold">{t.pilot || "TBA"}</span></div>
                      <div className="text-[11px] text-muted-foreground">Nurse: <span className="text-foreground font-semibold">{t.nurse || "TBA"}</span></div>
                    </div>
                  </div>

                  {/* Sector timeline */}
                  <div className="p-3 space-y-2">
                    {t.sectors.map((s, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 text-cyan-400 font-mono font-semibold w-10 shrink-0">{s.etd}</div>
                        <ArrowRight size={11} className="text-muted-foreground shrink-0" />
                        <div className="flex-1 flex items-center gap-1">
                          <span className="font-semibold">{s.from}</span>
                          {s.fromIcao && <span className="text-[9px] text-muted-foreground bg-muted/30 px-1 py-0.5 rounded">{s.fromIcao}</span>}
                        </div>
                        <ArrowRight size={11} className="text-muted-foreground shrink-0" />
                        <div className="flex-1 flex items-center gap-1">
                          <span className="font-semibold">{s.to}</span>
                          {s.toIcao && <span className="text-[9px] text-muted-foreground bg-muted/30 px-1 py-0.5 rounded">{s.toIcao}</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground shrink-0">arr {s.eta}</div>
                        {s.groundTime && <div className="text-[9px] text-amber-400 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded">{s.groundTime} gnd</div>}
                      </div>
                    ))}
                  </div>

                  {/* Ground Transport Assignments */}
                  {t.groundTransport && t.groundTransport.length > 0 && (
                    <div className="px-3 pb-2">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Truck size={9} /> Ground Transport
                      </div>
                      <div className="space-y-1">
                        {t.groundTransport.map((g, gi) => {
                          const solutionColor =
                            g.solution === "local"    ? "text-green-400 bg-green-500/10 border-green-500/30" :
                            g.solution === "borrowed" ? "text-amber-400 bg-amber-500/10 border-amber-500/30" :
                            g.solution === "flown-in" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" :
                            g.solution === "shared"   ? "text-blue-400 bg-blue-500/10 border-blue-500/30" :
                                                        "text-red-400 bg-red-500/10 border-red-500/30";
                          return (
                            <div key={gi} className={`flex items-start gap-2 px-2 py-1.5 rounded-lg border text-[10px] ${solutionColor}`}>
                              <Truck size={9} className="shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold">{g.location}</span>
                                <span className="text-[9px] opacity-70 ml-1">{g.vehicleId}</span>
                                <span className="mx-1 opacity-50">·</span>
                                <span className="capitalize">{g.leg}</span>
                                <span className="mx-1 opacity-50">·</span>
                                <span className="font-semibold">{g.driver}</span>
                                {g.solutionDetail && g.solution !== "local" && (
                                  <div className="text-[9px] opacity-80 mt-0.5 italic">{g.solutionDetail}</div>
                                )}
                              </div>
                              <span className={`shrink-0 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                g.solution === "local" ? "border-green-500/40" :
                                g.solution === "borrowed" ? "border-amber-500/40" :
                                g.solution === "flown-in" ? "border-cyan-500/40" :
                                g.solution === "shared" ? "border-blue-500/40" : "border-red-500/40"
                              }`}>{g.solution === "flown-in" ? "flown in" : g.solution}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-card-border bg-muted/10 flex items-center justify-between">
                    <div className="flex gap-4 text-[10px] text-muted-foreground">
                      <span>Duty: <strong className="text-foreground">{t.dutyStart} – {t.dutyEnd}</strong></span>
                      <span>Flight time: <strong className="text-foreground">{t.totalFlightTime}</strong></span>
                    </div>
                    {t.notes && <div className="text-[10px] text-amber-300 max-w-xs text-right">{t.notes}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setStep("assets"); setResult(null); }}
                className="flex items-center gap-2 px-4 py-3 bg-muted/20 hover:bg-muted/30 border border-card-border rounded-xl text-sm font-semibold text-muted-foreground transition-colors">
                <RotateCcw size={14} /> Re-run
              </button>
              <button
                onClick={() => { onSaveTasks(buildDrafts()); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 rounded-xl text-sm font-semibold text-green-300 transition-colors"
              >
                <CheckCircle2 size={15} /> Save All Tasks to Board
              </button>
            </div>
          </>)}

        </div>
      </div>
    </div>
  );
}

// ─── Mode Picker Modal ───────────────────────────────────────────────────────
function TaskingModePicker({ onManual, onAuto, onClose }: {
  onManual: () => void;
  onAuto: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-card-border">
          <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>New Tasking</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          <button
            onClick={onManual}
            className="group flex items-start gap-4 p-5 rounded-xl border border-card-border hover:border-cyan-400/50 bg-muted/10 hover:bg-cyan-500/5 transition-all text-left"
          >
            <div className="p-2.5 rounded-xl bg-slate-500/15 border border-slate-500/30 group-hover:border-cyan-400/30 group-hover:bg-cyan-500/10 transition-colors mt-0.5">
              <ClipboardList size={18} className="text-slate-300 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm mb-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Manual Tasking</div>
              <div className="text-xs text-muted-foreground leading-relaxed">Enter a single task manually — patient details, sectors, aircraft, and crew. Full control over every field.</div>
            </div>
          </button>

          <button
            onClick={onAuto}
            className="group flex items-start gap-4 p-5 rounded-xl border border-cyan-400/30 hover:border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all text-left"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 mt-0.5">
              <Sparkles size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="font-bold text-sm mb-1 text-cyan-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                AI Auto Tasking
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 font-normal text-cyan-400">AI</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Paste the day's job sheet and AI will optimise the entire run — allocating aircraft across Dubbo and Bankstown, protecting nurse lunch breaks (EBA), enforcing 60 min ground time, and monitoring pilot duty limits.
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blank Notice of Operations form (placeholder) ─────────────────────────
function BlankNOPForm() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          <FileText size={16} className="text-cyan-400" /> Notice of Operations
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Design pending — form will be provided by operations team</p>
      </div>

      {/* Placeholder area */}
      <div className="bg-card rounded-xl border-2 border-dashed border-card-border p-16 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-muted/20 border border-card-border mb-4">
          <FileText size={32} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Form design to be provided</p>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-card-border bg-muted/10">
        <Info size={13} className="text-cyan-400 mt-0.5 shrink-0" />
        <span className="text-xs text-muted-foreground leading-relaxed">
          This section will be configured once the Notice of Operations template is finalised.
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function NEPTTasking({ role }: Props) {
  const qc = useQueryClient();
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("All");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "All">("All");
  const [showModal, setShowModal]     = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showAutoModal, setShowAutoModal]   = useState(false);
  const [editTask, setEditTask]       = useState<NeptTask | null>(null);
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [etaSort, setEtaSort]         = useState<"asc" | "desc" | null>("asc");
  const [activeTab, setActiveTab]     = useState<"board" | "monthly-report" | "notice-of-ops">("board");
  const nowDate = new Date();
  const [nopMonth, setNopMonth] = useState(nowDate.getMonth());
  const [nopYear,  setNopYear]  = useState(nowDate.getFullYear());

  const canDispatch = !["pilot", "nurse", "engineer"].includes(role);

  // ── Break state ───────────────────────────────────────────────────
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakForm, setBreakForm] = useState({
    category: "Meal Break",
    base: "Dubbo",
    crewNames: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: rawTasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/nept-tasks"],
    refetchInterval: 30_000,
  });

  const { data: breaks = [] } = useQuery<any[]>({
    queryKey: ["/api/nept-breaks"],
    refetchInterval: 30_000,
  });

  const createBreakMutation = useMutation({
    mutationFn: (d: typeof breakForm) => apiRequest("POST", "/api/nept-breaks", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/nept-breaks"] }); setShowBreakModal(false); setBreakForm({ category: "Meal Break", base: "Dubbo", crewNames: "", startTime: "", endTime: "", notes: "" }); },
    onError: (err: Error) => alert(`Failed to add break: ${err.message}`),
  });

  const deleteBreakMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/nept-breaks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/nept-breaks"] }),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }); setShowModal(false); setEditTask(null); },
    onError: (err: Error) => { alert(`Failed to create task: ${err.message}`); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NeptTask> }) => {
      const payload = { ...data, sectors: data.sectors ? JSON.stringify(data.sectors) : data.sectors };
      return apiRequest("PATCH", `/api/nept-tasks/${id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }); setEditTask(null); },
    onError: (err: Error) => { alert(`Failed to update task: ${err.message}`); },
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
    // Default sort: by requiredBy (scheduled departure) ascending — earliest mission first
    list.sort((a, b) => {
      const aTime = a.requiredBy || a.estimatedEta || a.createdAt;
      const bTime = b.requiredBy || b.estimatedEta || b.createdAt;
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      return aTime.localeCompare(bTime);
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
    // Switch filter to All so the task remains visible after status change
    setFilterStatus("All");
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
          {/* Ops Room Display launcher */}
          <button
            onClick={() => window.open(window.location.href.replace(/#.*$/, "") + "#/ops-display", "_blank", "noopener,noreferrer")}
            className="flex items-center gap-2 px-3 py-2 bg-slate-500/10 border border-slate-500/30 rounded-lg text-xs text-slate-300 font-semibold hover:bg-slate-500/20 hover:border-slate-400/50 transition-colors"
            title="Open live ops room display in a new window"
          >
            <Monitor size={13} /> Ops Display
            <ExternalLink size={11} className="opacity-60" />
          </button>
          {canDispatch && (
            <button
              onClick={() => { setEditTask(null); setShowModePicker(true); }}
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
          { id: "board",          label: "Tasking Board",      icon: <ClipboardList size={13} /> },
          { id: "monthly-report", label: "Monthly Report",     icon: <FileText size={13} />, badge: "Monthly" },
          { id: "notice-of-ops",  label: "Notice of Operations", icon: <FileText size={13} />, badge: "Blank Form" },
        ] as { id: "board" | "monthly-report" | "notice-of-ops"; label: string; icon: JSX.Element; badge?: string }[]).map(tab => (
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

      {/* Monthly Report Tab */}
      {activeTab === "monthly-report" && (
        <NoticeOfOps tasks={tasks} month={nopMonth} year={nopYear} setMonth={setNopMonth} setYear={setNopYear} />
      )}

      {/* Notice of Operations Tab (blank form placeholder) */}
      {activeTab === "notice-of-ops" && <BlankNOPForm />}

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

      {/* ── Crew Breaks Panel (dispatcher only) ─────────────────────── */}
      {canDispatch && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Crew Breaks</span>
              {breaks.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">{breaks.length}</span>}
            </div>
            <button
              onClick={() => setShowBreakModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
              data-testid="button-add-break">
              <Plus size={11} /> Add Break
            </button>
          </div>
          {breaks.length === 0 ? (
            <p className="text-[11px] text-muted-foreground px-4 py-3">No breaks scheduled</p>
          ) : (
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {breaks.map((b: any) => {
                const isMeal = b.category === "Meal Break";
                return (
                  <div key={b.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs max-w-xs ${
                    isMeal
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-200"
                      : "bg-purple-500/10 border-purple-500/30 text-purple-200"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[11px] uppercase tracking-wide">{b.category}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{b.base} · {b.crewNames}</div>
                      <div className="text-[11px] opacity-70 mt-0.5">
                        {b.startTime ? new Date(b.startTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }) : ""}
                        {" – "}
                        {b.endTime ? new Date(b.endTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }) : ""}
                      </div>
                      {b.notes && <div className="text-[10px] opacity-60 mt-0.5 truncate">{b.notes}</div>}
                    </div>
                    <button onClick={() => deleteBreakMutation.mutate(b.id)} className="opacity-50 hover:opacity-100 transition-opacity mt-0.5 shrink-0">
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onMouseDown={e => { if (e.target === e.currentTarget) setShowBreakModal(false); }}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-card border border-card-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Add Crew Break</h3>
              <button onClick={() => setShowBreakModal(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {/* Category */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
              <div className="flex gap-2">
                {["Meal Break", "Cleaning Break"].map(c => (
                  <button key={c} onClick={() => setBreakForm(f => ({ ...f, category: c }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      breakForm.category === c
                        ? c === "Meal Break" ? "bg-orange-500/20 border-orange-500/50 text-orange-300" : "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "border-card-border text-muted-foreground hover:border-muted"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {/* Base */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Base</label>
              <div className="flex gap-2">
                {["Dubbo", "Bankstown", "Broken Hill"].map(b => (
                  <button key={b} onClick={() => setBreakForm(f => ({ ...f, base: b }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                      breakForm.base === b
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "border-card-border text-muted-foreground hover:border-muted"
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            {/* Crew */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Crew Names</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-card-border bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="e.g. J. Smith, K. Lee"
                value={breakForm.crewNames}
                onChange={e => setBreakForm(f => ({ ...f, crewNames: e.target.value }))}
                data-testid="input-break-crew"
              />
            </div>
            {/* Time slot */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Start</label>
                <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-card-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={breakForm.startTime} onChange={e => setBreakForm(f => ({ ...f, startTime: e.target.value }))}
                  data-testid="input-break-start" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">End</label>
                <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-card-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={breakForm.endTime} onChange={e => setBreakForm(f => ({ ...f, endTime: e.target.value }))}
                  data-testid="input-break-end" />
              </div>
            </div>
            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
              <input className="w-full px-3 py-2 rounded-lg border border-card-border bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="Any additional info..."
                value={breakForm.notes}
                onChange={e => setBreakForm(f => ({ ...f, notes: e.target.value }))}
                data-testid="input-break-notes" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowBreakModal(false)} className="flex-1 py-2 rounded-lg border border-card-border text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button
                onClick={() => { if (!breakForm.crewNames || !breakForm.startTime || !breakForm.endTime) { alert("Please fill in crew, start and end time."); return; } createBreakMutation.mutate(breakForm); }}
                disabled={createBreakMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-sm font-semibold transition-colors disabled:opacity-50"
                data-testid="button-break-save">
                {createBreakMutation.isPending ? "Saving…" : "Save Break"}
              </button>
            </div>
          </div>
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
              onClick={() => { setEditTask(null); setShowModePicker(true); }}
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/10">
                {["Task Ref", "Priority", "Status", "Hospital Pickup → Drop-off", "Patient & Escort", "Pilot / Nurse", "Aircraft"].map(h => (
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
                    <span className="text-xs transition-colors group-hover:text-cyan-300">
                      {etaSort === "asc" ? "▲" : "▼"}
                    </span>
                  </button>
                </th>
                <th className="text-left text-muted-foreground font-medium px-3 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Loading tasks…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                  <ClipboardList size={24} className="mx-auto mb-2 opacity-30" />
                  No tasks found
                </td></tr>
              )}
              {(() => {
                // Group tasks by base based on aircraft registration
                const DUBBO_REGS      = ["VH-LTQ", "VH-MVW", "VH-MVX"];
                const BANKSTOWN_REGS  = ["VH-MWH", "VH-MWK", "VH-RFD"];
                const dubboTasks      = filtered.filter(t => t.aircraftReg && DUBBO_REGS.includes(t.aircraftReg));
                const bankstonTasks   = filtered.filter(t => t.aircraftReg && BANKSTOWN_REGS.includes(t.aircraftReg));
                const otherTasks      = filtered.filter(t => !dubboTasks.includes(t) && !bankstonTasks.includes(t));

                const BaseHeader = ({ label, icao, count, accent, bg, dot, cols = 8 }: { label: string; icao: string; count: number; accent: string; bg: string; dot: string; cols?: number }) => (
                  <tr>
                    <td colSpan={cols} className={`px-4 py-2.5 ${bg} border-y border-card-border`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                        <span className={`text-[13px] font-extrabold uppercase tracking-[0.12em] ${accent}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                          {label}
                        </span>
                        <span className={`text-xs font-mono ${accent} opacity-50 border border-current/20 px-1.5 py-0.5 rounded`}>{icao}</span>
                        <span className={`ml-auto text-xs font-semibold ${accent} opacity-60`}>{count} task{count !== 1 ? "s" : ""}</span>
                      </div>
                    </td>
                  </tr>
                );

                const renderRow = (t: NeptTask) => (
                  <>
                    <tr
                    key={t.id}
                    className={`border-b border-card-border hover:bg-white/2 cursor-pointer transition-colors ${
                      t.priority === "Emergency" && !["Complete","Cancelled"].includes(t.status) ? "bg-red-500/5" : ""
                    }`}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    {/* Task Ref */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-foreground text-[13px]">{t.taskRef}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{fmtDT(t.requestTime)}</div>
                    </td>
                    {/* Priority */}
                    <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                    {/* Status */}
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      {canDispatch
                        ? <QuickStatus task={t} onUpdate={handleStatusChange} />
                        : <StatusBadge status={t.status} />}
                    </td>
                    {/* Hospital Pickup → Drop-off */}
                    <td className="px-3 py-3 max-w-[220px]">
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5">
                          <div className="mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Pickup</div>
                            <div className="text-[13px] font-semibold text-foreground leading-tight">
                              {t.referringHospital || t.pickupLocation || <span className="text-muted-foreground">—</span>}
                            </div>
                            {t.referringHospital && t.pickupLocation && (
                              <div className="text-xs text-muted-foreground leading-tight">{t.pickupLocation}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <div className="mt-0.5 shrink-0 w-3.5 h-3.5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Drop-off</div>
                            <div className="text-[13px] font-semibold text-foreground leading-tight">
                              {t.receivingHospital || t.destLocation || <span className="text-muted-foreground">—</span>}
                            </div>
                            {t.receivingHospital && t.destLocation && (
                              <div className="text-xs text-muted-foreground leading-tight">{t.destLocation}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Patient & Escort */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        {t.patientName ? (
                          <div className="flex items-center gap-1.5">
                            <User size={10} className="text-rose-400 shrink-0" />
                            <div>
                              <div className="text-[13px] font-semibold text-foreground">{t.patientName}</div>
                              {t.patientRef && <div className="text-xs font-mono text-muted-foreground">{t.patientRef}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No patient</span>
                        )}
                        {t.escortName && (
                          <div className="flex items-center gap-1.5">
                            <Users size={10} className="text-blue-400 shrink-0" />
                            <div className="text-xs text-blue-300">
                              {t.escortName}
                              {t.escortHeavy && (
                                <span className="ml-1 px-1 py-0 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">&gt;120kg</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Pilot / Nurse / Driver */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        {t.pilotName ? (
                          <div className="flex items-center gap-1.5">
                            <Plane size={10} className="text-cyan-400 shrink-0" />
                            <span className="text-[13px] font-medium text-foreground">{t.pilotName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/40"><Plane size={9} />Pilot TBA</span>
                          </div>
                        )}
                        {t.nurseName ? (
                          <div className="flex items-center gap-1.5">
                            <Shield size={10} className="text-rose-400 shrink-0" />
                            <span className="text-[13px] font-medium text-foreground">{t.nurseName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/40"><Shield size={9} />Nurse TBA</span>
                          </div>
                        )}
                        {t.driverName ? (
                          <div className="flex items-center gap-1.5">
                            <Truck size={10} className="text-amber-400 shrink-0" />
                            <span className="text-[13px] font-medium text-foreground">{t.driverName} <span className="text-[10px] text-muted-foreground">(L1)</span></span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/40"><Truck size={9} />Driver TBA</span>
                          </div>
                        )}
                        {t.driverNameLeg2 && (
                          <div className="flex items-center gap-1.5">
                            <Truck size={10} className="text-orange-400 shrink-0" />
                            <span className="text-[13px] font-medium text-foreground">{t.driverNameLeg2} <span className="text-[10px] text-muted-foreground">(L2)</span></span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Aircraft */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {t.aircraftReg
                        ? <div className="font-bold text-foreground font-mono text-[13px] tracking-wide">{t.aircraftReg}</div>
                        : <span className="text-muted-foreground text-xs">Unassigned</span>}
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
                      <td colSpan={9} className="px-5 py-4">
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
                            {t.status === "Complete" && (
                              <button
                                onClick={() => {
                                  const params = new URLSearchParams({
                                    taskRef: t.taskRef,
                                    from: t.pickupLocation || "",
                                    to: t.destLocation || "",
                                    aircraft: t.aircraftReg || "",
                                    date: t.completedAt?.slice(0, 10) || "",
                                  });
                                  window.location.hash = `/invoicing?${params.toString()}`;
                                }}
                                className="mt-1.5 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
                              >
                                <Receipt size={10} /> Generate Invoice
                              </button>
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
                );

                return (
                  <>
                    {dubboTasks.length > 0 && (
                      <>
                        <BaseHeader label="Dubbo Base" icao="YSDU" count={dubboTasks.length} accent="text-cyan-300" bg="bg-cyan-500/8" dot="bg-cyan-400" cols={9} />
                        {dubboTasks.map(t => renderRow(t))}
                      </>
                    )}
                    {bankstonTasks.length > 0 && (
                      <>
                        <BaseHeader label="Bankstown Base" icao="YSBK" count={bankstonTasks.length} accent="text-violet-300" bg="bg-violet-500/8" dot="bg-violet-400" cols={9} />
                        {bankstonTasks.map(t => renderRow(t))}
                      </>
                    )}
                    {otherTasks.length > 0 && (
                      <>
                        <BaseHeader label="Unassigned / Other" icao="——" count={otherTasks.length} accent="text-muted-foreground" bg="bg-muted/10" dot="bg-muted-foreground" cols={9} />
                        {otherTasks.map(t => renderRow(t))}
                      </>
                    )}
                  </>
                );
              })()}
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
          {(() => {
            const DUBBO_REGS_M     = ["VH-LTQ", "VH-MVW", "VH-MVX"];
            const BANKSTOWN_REGS_M = ["VH-MWH", "VH-MWK", "VH-RFD"];
            const dubboM     = filtered.filter(t => t.aircraftReg && DUBBO_REGS_M.includes(t.aircraftReg));
            const bankstonM  = filtered.filter(t => t.aircraftReg && BANKSTOWN_REGS_M.includes(t.aircraftReg));
            const otherM     = filtered.filter(t => !dubboM.includes(t) && !bankstonM.includes(t));

            const MobileBaseHeader = ({ label, icao, count, accent, bg, dot }: { label: string; icao: string; count: number; accent: string; bg: string; dot: string }) => (
              <div className={`flex items-center gap-3 px-4 py-2.5 ${bg} border-y border-card-border`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className={`text-[13px] font-extrabold uppercase tracking-[0.12em] ${accent}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{label}</span>
                <span className={`text-xs font-mono ${accent} opacity-50 border border-current/20 px-1.5 py-0.5 rounded`}>{icao}</span>
                <span className={`ml-auto text-xs font-semibold ${accent} opacity-60`}>{count} task{count !== 1 ? "s" : ""}</span>
              </div>
            );

            const renderCard = (t: NeptTask) => (
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
                  {t.patientRef && <div className="text-xs font-mono text-muted-foreground">{t.patientRef}</div>}
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">Aircraft / Crew</div>
                  <div className="text-foreground font-mono font-bold text-[11px]">{t.aircraftReg ?? "Unassigned"}</div>
                  {t.pilotName && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Plane size={9} className="text-cyan-400 shrink-0" />
                      <span className="text-[10px] text-foreground">{t.pilotName}</span>
                    </div>
                  )}
                  {t.nurseName && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield size={9} className="text-rose-400 shrink-0" />
                      <span className="text-[10px] text-foreground">{t.nurseName}</span>
                    </div>
                  )}
                  {t.driverName && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Truck size={9} className="text-amber-400 shrink-0" />
                      <span className="text-[10px] text-foreground">{t.driverName}</span>
                    </div>
                  )}
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
              {t.status === "Complete" && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams({
                      taskRef: t.taskRef,
                      from: t.pickupLocation || "",
                      to: t.destLocation || "",
                      aircraft: t.aircraftReg || "",
                      date: t.completedAt?.slice(0, 10) || "",
                    });
                    window.location.hash = `/invoicing?${params.toString()}`;
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors w-full justify-center"
                >
                  <Receipt size={11} /> Generate Invoice
                </button>
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
            );

            return (
              <>
                {dubboM.length > 0 && (
                  <>
                    <MobileBaseHeader label="Dubbo Base" icao="YSDU" count={dubboM.length} accent="text-cyan-300" bg="bg-cyan-500/8" dot="bg-cyan-400" />
                    {dubboM.map(t => renderCard(t))}
                  </>
                )}
                {bankstonM.length > 0 && (
                  <>
                    <MobileBaseHeader label="Bankstown Base" icao="YSBK" count={bankstonM.length} accent="text-violet-300" bg="bg-violet-500/8" dot="bg-violet-400" />
                    {bankstonM.map(t => renderCard(t))}
                  </>
                )}
                {otherM.length > 0 && (
                  <>
                    <MobileBaseHeader label="Unassigned / Other" icao="——" count={otherM.length} accent="text-muted-foreground" bg="bg-muted/10" dot="bg-muted-foreground" />
                    {otherM.map(t => renderCard(t))}
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-card-border bg-muted/5 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>{filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          <span>Auto-refreshes every 30s</span>
        </div>
      </div>

      {/* Mode Picker */}
      {showModePicker && (
        <TaskingModePicker
          onClose={() => setShowModePicker(false)}
          onManual={() => { setShowModePicker(false); setShowModal(true); }}
          onAuto={() => { setShowModePicker(false); setShowAutoModal(true); }}
        />
      )}

      {/* Manual Task Modal */}
      {showModal && (
        <TaskModal
          task={editTask ?? emptyDraft(nextRef(tasks))}
          isNew={!editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}

      {/* AI Auto Tasking Modal */}
      {showAutoModal && (
        <AutoTaskingModal
          onClose={() => setShowAutoModal(false)}
          existingTasks={tasks}
          onSaveTasks={async (drafts) => {
            for (const draft of drafts) {
              await apiRequest('POST', '/api/nept-tasks', draft);
            }
            qc.invalidateQueries({ queryKey: ['/api/nept-tasks'] });
            setShowAutoModal(false);
          }}
        />
      )}

      </>)}

    </div>
  );
}
