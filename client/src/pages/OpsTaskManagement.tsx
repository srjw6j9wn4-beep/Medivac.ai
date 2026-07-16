import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, X, CheckCircle2, Clock, AlertTriangle, Zap, ChevronDown,
  Fuel, Truck, Wrench, Users, FileText, Coffee, Filter,
  MessageSquare, Send, User, Calendar, MapPin, Plane, RefreshCw,
  ClipboardList, ChevronRight, MoreHorizontal, Check, Pencil, Rabbit, Lightbulb
} from "lucide-react";
import type { UserRole } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────
type OpsTask = {
  id: number; task_ref: string; type: string; title: string; description?: string;
  requested_by: string; request_source: string; assigned_to?: string;
  aircraft_reg?: string; location_icao?: string; priority: string;
  status: string; due_date?: string; due_time?: string;
  completed_at?: string; completed_by?: string; notes?: string;
  created_at: string; updated_at: string;
};
type Comment = { id: number; task_id: number; author: string; body: string; created_at: string; };

// ─── Constants ────────────────────────────────────────────────────────────────
const TASK_TYPES = [
  { id: "admin",               label: "Admin",               icon: <FileText size={13} />,     color: "text-[#797876]"  },
  { id: "fuel_order",          label: "Fuel Order",          icon: <Fuel size={13} />,         color: "text-amber-400"  },
  { id: "roo_run",             label: "Roo Run",             icon: <Truck size={13} />,        color: "text-orange-400" },
  { id: "catering",            label: "Catering",            icon: <Coffee size={13} />,       color: "text-yellow-400" },
  { id: "transport",           label: "Ground Transport",    icon: <Truck size={13} />,        color: "text-blue-400"   },
  { id: "maintenance_request", label: "Maintenance Request", icon: <Wrench size={13} />,       color: "text-red-400"    },
  { id: "crew_request",        label: "Crew Request",        icon: <Users size={13} />,        color: "text-[#4F98A3]"  },
  { id: "other",               label: "Other",               icon: <MoreHorizontal size={13} />, color: "text-[#797876]" },
];
const PRIORITIES = ["urgent", "high", "normal", "low"];
const STATUSES   = ["open", "in_progress", "pending_approval", "completed", "cancelled"];
const SOURCES    = ["ops", "crew", "pilot", "nurse", "engineer"];

const PRIO_CFG: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgent",  cls: "bg-red-500/15 text-red-400 border-red-500/30"    },
  high:   { label: "High",    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  normal: { label: "Normal",  cls: "bg-[#393836] text-[#CDCCCA] border-[#393836]"   },
  low:    { label: "Low",     cls: "bg-[#1C1B19] text-[#5A5957] border-[#393836]"   },
};
const STATUS_CFG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  open:             { label: "Open",             icon: <Clock size={11} />,        cls: "bg-[#393836] text-[#CDCCCA] border-[#393836]"          },
  in_progress:      { label: "In Progress",      icon: <RefreshCw size={11} />,    cls: "bg-blue-500/15 text-blue-400 border-blue-500/30"         },
  pending_approval: { label: "Pending Approval", icon: <AlertTriangle size={11} />, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30"    },
  completed:        { label: "Completed",        icon: <CheckCircle2 size={11} />, cls: "bg-green-500/15 text-green-400 border-green-500/30"      },
  cancelled:        { label: "Cancelled",        icon: <X size={11} />,           cls: "bg-[#1C1B19] text-[#5A5957] border-[#393836]"            },
};

function typeInfo(id: string) { return TASK_TYPES.find(t => t.id === id) ?? TASK_TYPES[TASK_TYPES.length - 1]; }

function PriorityBadge({ p }: { p: string }) {
  const c = PRIO_CFG[p] ?? PRIO_CFG.normal;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>{c.label}</span>;
}
function StatusBadge({ s }: { s: string }) {
  const c = STATUS_CFG[s] ?? STATUS_CFG.open;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>{c.icon}{c.label}</span>;
}

// ─── Task Detail Panel ────────────────────────────────────────────────────────
function TaskDetail({ task, role, onClose, onUpdate }: {
  task: OpsTask; role: UserRole; onClose: () => void; onUpdate: (id: number, u: any) => void;
}) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description ?? "");
  const ti = typeInfo(task.type);

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/ops-tasks", task.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/ops-tasks/${task.id}/comments`).then(r => r.json()),
  });

  const addComment = useMutation({
    mutationFn: (body: string) => apiRequest("POST", `/api/ops-tasks/${task.id}/comments`, { body, author: role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/ops-tasks", task.id, "comments"] }); setComment(""); },
  });

  const updateStatus = (status: string) => {
    const u: any = { status };
    if (status === "completed") { u.completed_at = new Date().toISOString(); u.completed_by = role; }
    onUpdate(task.id, u);
  };

  const saveEdit = () => {
    onUpdate(task.id, { title: editTitle.trim(), description: editDesc.trim() || null });
    setEditing(false);
  };
  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description ?? "");
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1C1B19] border-l border-[#393836] flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#393836]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`${ti.color}`}>{ti.icon}</span>
              <span className="text-[10px] text-[#5A5957] font-mono">{task.task_ref}</span>
              <PriorityBadge p={task.priority} />
              <StatusBadge s={task.status} />
            </div>
            {editing ? (
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#171614] border border-[#393836] rounded-lg text-sm font-bold text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{task.title}</h2>
                <button onClick={() => setEditing(true)} className="p-1 rounded-md hover:bg-white/10 text-[#797876] hover:text-[#4F98A3]" data-testid="button-edit-task">
                  <Pencil size={12} />
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876] hover:text-[#CDCCCA]"><X size={15} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <User size={11} />,     label: "Requested by", val: task.requested_by },
              { icon: <Users size={11} />,    label: "Assigned to",  val: task.assigned_to ?? "Unassigned" },
              { icon: <Plane size={11} />,    label: "Aircraft",     val: task.aircraft_reg ?? "—" },
              { icon: <MapPin size={11} />,   label: "Location",     val: task.location_icao ?? "—" },
              { icon: <Calendar size={11} />, label: "Due",          val: task.due_date ? `${task.due_date}${task.due_time ? ` ${task.due_time}` : ""}` : "—" },
              { icon: <User size={11} />,     label: "Source",       val: task.request_source },
            ].map(m => (
              <div key={m.label} className="bg-[#171614] rounded-lg px-3 py-2">
                <div className="flex items-center gap-1 text-[10px] text-[#5A5957] mb-0.5">{m.icon}{m.label}</div>
                <div className="text-xs text-[#CDCCCA] font-medium">{m.val}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {editing ? (
            <div>
              <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-1.5">Description</div>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} placeholder="Detailed instructions or context…"
                className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50 resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={cancelEdit} className="flex-1 py-2 rounded-lg border border-[#393836] text-xs text-[#797876] hover:text-[#CDCCCA] transition-colors" data-testid="button-cancel-edit-task">Cancel</button>
                <button onClick={saveEdit} disabled={!editTitle.trim()}
                  className="flex-1 py-2 rounded-lg bg-[#01696F] text-white text-xs font-semibold hover:bg-[#0C4E54] disabled:opacity-40 transition-colors" data-testid="button-save-edit-task">Save</button>
              </div>
            </div>
          ) : task.description && (
            <div>
              <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-1.5">Description</div>
              <p className="text-xs text-[#CDCCCA] leading-relaxed bg-[#171614] rounded-lg px-3 py-2.5">{task.description}</p>
            </div>
          )}

          {/* Status actions */}
          {task.status !== "completed" && task.status !== "cancelled" && (
            <div>
              <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-2">Update Status</div>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.filter(s => s !== task.status && s !== "open").map(s => {
                  const c = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={() => updateStatus(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors hover:opacity-80 ${c.cls}`}>
                      {c.icon}{c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div className="text-[10px] text-[#5A5957] uppercase tracking-wider mb-2">
              Updates & Comments ({comments.length})
            </div>
            <div className="space-y-2 mb-3">
              {comments.length === 0 && <p className="text-xs text-[#5A5957] italic">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} className="bg-[#171614] rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-[#4F98A3]">{c.author}</span>
                    <span className="text-[10px] text-[#5A5957]">{new Date(c.created_at).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                  <p className="text-xs text-[#CDCCCA] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && comment.trim()) addComment.mutate(comment.trim()); }}
                placeholder="Add an update…"
                className="flex-1 px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
              <button onClick={() => comment.trim() && addComment.mutate(comment.trim())}
                disabled={!comment.trim() || addComment.isPending}
                className="px-3 py-2 rounded-lg bg-[#01696F]/20 border border-[#01696F]/30 text-[#4F98A3] hover:bg-[#01696F]/30 disabled:opacity-40 transition-colors">
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form Field Components (top-level, stable identity) ───────────────────────
const Field = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
  </div>
);
const SelectField = ({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: { v: string; l: string }[] }) => (
  <div>
    <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50">
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

// ─── Quick Templates (used inside NewTaskForm) ──────────────────────────────────
const TEMPLATES = [
  {
    key: "fuel_order",
    label: "Fuel Order",
    icon: <Fuel size={12} />,
    cls: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
    data: {
      title: "Fuel Order",
      description: "Fuel order required. Please confirm quantity (lb) and uplift location.",
      type: "fuel_order",
      priority: "normal",
    },
  },
  {
    key: "roo_run",
    label: "Roo Run",
    icon: <Rabbit size={12} />,
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
    data: {
      title: "Roo Run",
      description: "Kangaroo carcass removal required from runway/taxiway. Contact tower and coordinate with base wildlife officer.",
      type: "roo_run",
      priority: "high",
    },
  },
  {
    key: "portable_lighting",
    label: "Portable Lighting",
    icon: <Lightbulb size={12} />,
    cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20",
    data: {
      title: "Portable Lighting Required",
      description: "Portable lighting setup requested. Confirm location, duration, and power source availability.",
      type: "other",
      priority: "normal",
    },
  },
];

// ─── New Task Form ────────────────────────────────────────────────────────────
function NewTaskForm({ role, onClose, onCreate }: { role: UserRole; onClose: () => void; onCreate: (d: any) => void; }) {
  const [form, setForm] = useState({
    type: "admin", title: "", description: "", requested_by: role as string,
    request_source: "ops", assigned_to: "", aircraft_reg: "", location_icao: "",
    priority: "normal", due_date: "", due_time: "", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setForm(f => ({
      ...f,
      title: t.data.title,
      description: t.data.description,
      type: t.data.type,
      priority: t.data.priority,
    }));
  };

  const submit = () => {
    if (!form.title.trim()) return;
    onCreate({
      ...form,
      assigned_to: form.assigned_to || null,
      aircraft_reg: form.aircraft_reg || null,
      location_icao: form.location_icao || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      notes: form.notes || null,
      description: form.description || null,
      status: "open",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1C1B19] border border-[#393836] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>New Ops Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876]"><X size={15} /></button>
        </div>

        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1.5">Quick Templates</label>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map(t => (
              <button key={t.key} type="button" onClick={() => applyTemplate(t)} data-testid={`button-template-${t.key}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${t.cls}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Type" value={form.type} onChange={v => set("type", v)} opts={TASK_TYPES.map(t => ({ v: t.id, l: t.label }))} />
          <SelectField label="Priority" value={form.priority} onChange={v => set("priority", v)} opts={PRIORITIES.map(p => ({ v: p, l: PRIO_CFG[p].label }))} />
        </div>
        <Field label="Title *" value={form.title} onChange={v => set("title", v)} placeholder="Brief task description" />
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Detailed instructions or context…"
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Request Source" value={form.request_source} onChange={v => set("request_source", v)} opts={SOURCES.map(s => ({ v: s, l: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          <Field label="Requested By" value={form.requested_by} onChange={v => set("requested_by", v)} placeholder="Name or role" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assign To" value={form.assigned_to} onChange={v => set("assigned_to", v)} placeholder="Ops staff name" />
          <Field label="Aircraft Reg" value={form.aircraft_reg} onChange={v => set("aircraft_reg", v)} placeholder="e.g. VH-ABC" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location ICAO" value={form.location_icao} onChange={v => set("location_icao", v)} placeholder="e.g. YWLG" />
          <Field label="Due Date" value={form.due_date} onChange={v => set("due_date", v)} type="date" />
        </div>
        <Field label="Due Time (local)" value={form.due_time} onChange={v => set("due_time", v)} placeholder="HH:MM" />

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#393836] text-xs text-[#797876] hover:text-[#CDCCCA] transition-colors">Cancel</button>
          <button onClick={submit} disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#01696F] text-white text-xs font-semibold hover:bg-[#0C4E54] disabled:opacity-40 transition-colors">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }: { task: OpsTask; onClick: () => void }) {
  const ti = typeInfo(task.type);
  const isOverdue = task.due_date && task.status !== "completed" && task.status !== "cancelled"
    && new Date(task.due_date) < new Date();

  return (
    <button onClick={onClick} className="w-full text-left bg-[#1C1B19] border border-[#393836] rounded-xl p-4 hover:border-[#4F98A3]/40 transition-all group">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${ti.color}`}>{ti.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] text-[#5A5957] font-mono">{task.task_ref}</span>
            <PriorityBadge p={task.priority} />
            <StatusBadge s={task.status} />
          </div>
          <p className="text-sm font-semibold text-[#CDCCCA] leading-snug mb-1.5 group-hover:text-white transition-colors">{task.title}</p>
          <div className="flex items-center gap-3 flex-wrap text-[10px] text-[#5A5957]">
            {task.requested_by && <span>From: {task.requested_by}</span>}
            {task.assigned_to && <span>→ {task.assigned_to}</span>}
            {task.aircraft_reg && <span className="flex items-center gap-0.5"><Plane size={9} />{task.aircraft_reg}</span>}
            {task.location_icao && <span className="flex items-center gap-0.5"><MapPin size={9} />{task.location_icao}</span>}
            {task.due_date && (
              <span className={`flex items-center gap-0.5 ${isOverdue ? "text-red-400 font-semibold" : ""}`}>
                <Clock size={9} />{task.due_date}{task.due_time ? ` ${task.due_time}` : ""}
                {isOverdue && " · OVERDUE"}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={14} className="text-[#5A5957] group-hover:text-[#4F98A3] shrink-0 mt-1 transition-colors" />
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpsTaskManagement({ role }: { role: UserRole }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<OpsTask | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterPrio, setFilterPrio] = useState("all");
  const [search, setSearch] = useState("");

  const { data: tasks = [], isLoading } = useQuery<OpsTask[]>({
    queryKey: ["/api/ops-tasks"],
    queryFn: () => apiRequest("GET", "/api/ops-tasks").then(r => r.json()),
    refetchInterval: 30000,
  });

  const createTask = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/ops-tasks", d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/ops-tasks"] }),
  });
  const updateTask = useMutation({
    mutationFn: ({ id, u }: { id: number; u: any }) => apiRequest("PATCH", `/api/ops-tasks/${id}`, u),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/ops-tasks"] });
      if (selected) setSelected(prev => prev ? { ...prev, ...selected } : null);
    },
  });

  const handleUpdate = (id: number, u: any) => {
    updateTask.mutate({ id, u });
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...u } : null);
  };

  const filtered = tasks.filter(t => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterStatus === "active" && (t.status === "completed" || t.status === "cancelled")) return false;
    if (filterStatus !== "all" && filterStatus !== "active" && t.status !== filterStatus) return false;
    if (filterPrio !== "all" && t.priority !== filterPrio) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.task_ref.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    open: tasks.filter(t => t.status === "open").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    urgent: tasks.filter(t => t.priority === "urgent" && t.status !== "completed" && t.status !== "cancelled").length,
    overdue: tasks.filter(t => t.due_date && t.status !== "completed" && t.status !== "cancelled" && new Date(t.due_date) < new Date()).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-[#4F98A3]" />
            <h1 className="text-xl font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Ops Task Management</h1>
          </div>
          <p className="text-sm text-[#797876] mt-0.5">Admin tasks · Crew requests · Fuel orders · Roo runs</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => { setShowNew(true); }} data-testid="button-crew-request"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#4F98A3]/30 bg-[#4F98A3]/10 text-[#4F98A3] text-xs font-semibold hover:bg-[#4F98A3]/20 transition-colors">
            <Users size={13} /> Crew Request
          </button>
          <button onClick={() => setShowNew(true)} data-testid="button-new-task"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#01696F] text-white text-xs font-semibold hover:bg-[#0C4E54] transition-colors">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Open",       val: counts.open,        color: "text-[#CDCCCA]", bg: "bg-[#393836]/40"      },
          { label: "In Progress", val: counts.in_progress, color: "text-blue-400",  bg: "bg-blue-500/8"        },
          { label: "Urgent",     val: counts.urgent,      color: "text-red-400",   bg: "bg-red-500/8"         },
          { label: "Overdue",    val: counts.overdue,     color: "text-amber-400", bg: "bg-amber-500/8"       },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#393836] rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.val}</div>
            <div className="text-[10px] text-[#5A5957] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
          className="flex-1 min-w-[160px] px-3 py-2 bg-[#1C1B19] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-2 bg-[#1C1B19] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none">
          <option value="active">Active only</option>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-2.5 py-2 bg-[#1C1B19] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none">
          <option value="all">All types</option>
          {TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)}
          className="px-2.5 py-2 bg-[#1C1B19] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none">
          <option value="all">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIO_CFG[p].label}</option>)}
        </select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="text-center py-12 text-[#5A5957] text-sm">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <CheckCircle2 size={32} className="text-[#393836] mx-auto" />
          <p className="text-sm text-[#5A5957]">No tasks found.</p>
          <button onClick={() => setShowNew(true)} className="text-xs text-[#4F98A3] hover:underline">Create one</button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Urgent first */}
          {["urgent", "high", "normal", "low"].map(prio =>
            filtered.filter(t => t.priority === prio).map(t => (
              <TaskCard key={t.id} task={t} onClick={() => setSelected(t)} />
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <NewTaskForm role={role} onClose={() => setShowNew(false)}
          onCreate={d => createTask.mutate(d)} />
      )}
      {selected && (
        <TaskDetail task={selected} role={role} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
      )}
    </div>
  );
}
