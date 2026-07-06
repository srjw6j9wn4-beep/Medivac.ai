import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import {
  Plus, X, Save, Pencil, Trash2, AlertTriangle, CheckCircle2,
  Clock, Plane, User, MapPin, ChevronDown, Filter, Search,
  RefreshCw, ClipboardList, ArrowRight, Ambulance
} from "lucide-react";

interface Props { role: UserRole; }

// ─── Types ────────────────────────────────────────────────────────────────
type TaskStatus   = "Pending" | "Assigned" | "En Route" | "Complete" | "Cancelled";
type TaskPriority = "Routine" | "Urgent" | "Emergency";

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
  actualDepart: string | null;
  actualArrive: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

type TaskDraft = Omit<NeptTask, "id" | "createdAt" | "updatedAt">;

// ─── Constants ────────────────────────────────────────────────────────────
const STATUSES: TaskStatus[] = ["Pending", "Assigned", "En Route", "Complete", "Cancelled"];
const PRIORITIES: TaskPriority[] = ["Routine", "Urgent", "Emergency"];

const AIRCRAFT_OPTIONS = [
  "VH-LTQ", "VH-MVW", "VH-MVX", "VH-MWH", "VH-MWK",
  "VH-RFD", "VH-XYJ", "VH-XYO", "VH-XYR", "VH-MQD",
  "VH-MQK", "VH-NAJ",
];

const PILOT_OPTIONS = ["Capt. R. Hughes", "Capt. T. Barnes", "Capt. M. Clarke"];
const NURSE_OPTIONS = ["S. Mitchell RN", "Dr. K. Patel", "J. O'Brien RN"];

const BASES = ["Bankstown (YSBK)", "Dubbo (YSDU)", "Broken Hill (YBHI)"];

// ─── Helpers ─────────────────────────────────────────────────────────────
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
    Pending:   { bg: "bg-slate-500/15",  text: "text-slate-300",  border: "border-slate-500/30",  dot: "bg-slate-400"  },
    Assigned:  { bg: "bg-blue-500/15",   text: "text-blue-300",   border: "border-blue-500/30",   dot: "bg-blue-400"   },
    "En Route":{ bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/30",  dot: "bg-amber-400"  },
    Complete:  { bg: "bg-green-500/15",  text: "text-green-300",  border: "border-green-500/30",  dot: "bg-green-400"  },
    Cancelled: { bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/30",    dot: "bg-red-400"    },
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
    actualDepart: null,
    actualArrive: null,
    notes: null,
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

// ─── Task Form Modal ──────────────────────────────────────────────────────
function TaskModal({
  task, onClose, onSave, isNew,
}: {
  task: TaskDraft | NeptTask;
  onClose: () => void;
  onSave: (d: TaskDraft) => void;
  isNew: boolean;
}) {
  const [d, setD] = useState<TaskDraft>({ ...task } as TaskDraft);
  const set = (k: keyof TaskDraft, v: string | null) =>
    setD(prev => ({ ...prev, [k]: v || null }));

  const fieldCls = "w-full bg-background/50 border border-card-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50";
  const labelCls = "block text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1";

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
              <input type="datetime-local" className={fieldCls} value={d.requiredBy?.slice(0,16) ?? ""} onChange={e => set("requiredBy", e.target.value)} />
            </div>
          </div>

          {/* Row 3 — pickup */}
          <div>
            <div className="text-xs font-semibold text-cyan-400/80 mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <MapPin size={12} /> Pickup
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Location / Address</label>
                <input className={fieldCls} placeholder="e.g. Dubbo Base Hospital" value={d.pickupLocation} onChange={e => set("pickupLocation", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Airport (ICAO)</label>
                <input className={fieldCls} placeholder="YSDU" value={d.pickupIcao ?? ""} onChange={e => set("pickupIcao", e.target.value)} />
              </div>
            </div>
            <div className="mt-2">
              <label className={labelCls}>Referring Hospital</label>
              <input className={fieldCls} placeholder="Referring facility" value={d.referringHospital ?? ""} onChange={e => set("referringHospital", e.target.value)} />
            </div>
          </div>

          {/* Row 4 — destination */}
          <div>
            <div className="text-xs font-semibold text-cyan-400/80 mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              <ArrowRight size={12} /> Destination
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Location / Address</label>
                <input className={fieldCls} placeholder="e.g. Royal Prince Alfred Hospital" value={d.destLocation} onChange={e => set("destLocation", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Airport (ICAO)</label>
                <input className={fieldCls} placeholder="YSSY" value={d.destIcao ?? ""} onChange={e => set("destIcao", e.target.value)} />
              </div>
            </div>
            <div className="mt-2">
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

          {/* Row 7 — actual times (for completion) */}
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
            onClick={() => { if (!d.pickupLocation || !d.destLocation) { alert("Pickup and destination are required."); return; } onSave(d); }}
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

// ─── Main Page ────────────────────────────────────────────────────────────
export default function NEPTTasking({ role }: Props) {
  const qc = useQueryClient();
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("Pending");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "All">("All");
  const [showModal, setShowModal]     = useState(false);
  const [editTask, setEditTask]       = useState<NeptTask | null>(null);
  const [expandedId, setExpandedId]   = useState<number | null>(null);

  const canDispatch = !["pilot", "nurse", "engineer"].includes(role);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery<NeptTask[]>({
    queryKey: ["/api/nept-tasks"],
    refetchInterval: 30_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (d: TaskDraft) => apiRequest("POST", "/api/nept-tasks", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NeptTask> }) =>
      apiRequest("PATCH", `/api/nept-tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/nept-tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/nept-tasks"] }),
  });

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => tasks.filter(t => {
    if (filterStatus !== "All" && t.status !== filterStatus) return false;
    if (filterPriority !== "All" && t.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.taskRef.toLowerCase().includes(q) ||
        t.pickupLocation.toLowerCase().includes(q) ||
        t.destLocation.toLowerCase().includes(q) ||
        (t.patientName ?? "").toLowerCase().includes(q) ||
        (t.aircraftReg ?? "").toLowerCase().includes(q) ||
        (t.referringHospital ?? "").toLowerCase().includes(q) ||
        (t.receivingHospital ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  }), [tasks, filterStatus, filterPriority, search]);

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
            <Ambulance size={18} className="text-cyan-400" /> NEPT Tasking Board
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Non-Emergency Patient Transfer — dispatch &amp; tracking</p>
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
        {/* Quick-filter pills */}
        <div className="flex flex-wrap gap-2">
          {(["All", ...STATUSES] as (TaskStatus | "All")[]).map(s => {
            const active = filterStatus === s;
            const count  = s === "All" ? counts["All"] : (counts[s] ?? 0);
            const accent: Record<string, string> = {
              All:        active ? "bg-white/10 text-foreground border-white/20"  : "border-card-border text-muted-foreground hover:border-white/20 hover:text-foreground",
              Pending:    active ? "bg-amber-500/20 text-amber-300 border-amber-400/40"   : "border-card-border text-muted-foreground hover:border-amber-400/30 hover:text-amber-300",
              Assigned:   active ? "bg-blue-500/20 text-blue-300 border-blue-400/40"     : "border-card-border text-muted-foreground hover:border-blue-400/30 hover:text-blue-300",
              "En Route": active ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"     : "border-card-border text-muted-foreground hover:border-cyan-400/30 hover:text-cyan-300",
              Complete:   active ? "bg-green-500/20 text-green-300 border-green-400/40"  : "border-card-border text-muted-foreground hover:border-green-400/30 hover:text-green-300",
              Cancelled:  active ? "bg-zinc-500/20 text-zinc-300 border-zinc-400/40"     : "border-card-border text-muted-foreground hover:border-zinc-400/30 hover:text-zinc-300",
            };
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${accent[s]}`}
              >
                {s}
                <span className={`text-[10px] font-semibold tabular-nums ${
                  active ? "opacity-100" : "opacity-60"
                }`}>{count}</span>
              </button>
            );
          })}
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
                {["Task Ref", "Priority", "Status", "Pickup → Destination", "Patient / Ref", "Aircraft & Crew", "Required By", "Actions"].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
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
                    <td className="px-3 py-3 max-w-[220px]">
                      <div className="font-medium text-foreground truncate">{t.pickupLocation}</div>
                      <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                        <ArrowRight size={10} />
                        <span className="truncate">{t.destLocation}</span>
                      </div>
                      {(t.pickupIcao || t.destIcao) && (
                        <div className="text-[10px] text-cyan-400/70 font-mono mt-0.5">
                          {t.pickupIcao ?? "—"} → {t.destIcao ?? "—"}
                        </div>
                      )}
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
                      <span className={t.requiredBy && new Date(t.requiredBy) < new Date() && t.status !== "Complete" ? "text-red-400 font-semibold" : "text-foreground"}>
                        {fmtDT(t.requiredBy)}
                      </span>
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
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px] mb-2">Route Detail</div>
                            <div><span className="text-muted-foreground">Pickup: </span>{t.pickupLocation}</div>
                            {t.referringHospital && <div><span className="text-muted-foreground">Referring: </span>{t.referringHospital}</div>}
                            <div><span className="text-muted-foreground">Destination: </span>{t.destLocation}</div>
                            {t.receivingHospital && <div><span className="text-muted-foreground">Receiving: </span>{t.receivingHospital}</div>}
                          </div>
                          <div className="space-y-1.5">
                            <div className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px] mb-2">Times</div>
                            <div><span className="text-muted-foreground">Requested: </span>{fmtDT(t.requestTime)}</div>
                            <div><span className="text-muted-foreground">Required by: </span>{fmtDT(t.requiredBy)}</div>
                            <div><span className="text-muted-foreground">Actual depart: </span>{fmtDT(t.actualDepart)}</div>
                            <div><span className="text-muted-foreground">Actual arrive: </span>{fmtDT(t.actualArrive)}</div>
                            {t.dispatchedBy && <div><span className="text-muted-foreground">Dispatched by: </span>{t.dispatchedBy}</div>}
                          </div>
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
              {/* Route */}
              <div className="bg-muted/10 rounded-lg p-2.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className="text-cyan-400 shrink-0" />
                  <span className="text-foreground font-medium">{t.pickupLocation}</span>
                </div>
                <div className="flex items-center gap-1.5 pl-1">
                  <ArrowRight size={10} className="text-muted-foreground shrink-0" />
                  <span className="text-foreground">{t.destLocation}</span>
                </div>
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
    </div>
  );
}
