import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, X, ChevronRight, CheckCircle2, Clock, AlertTriangle,
  Layers, Target, Calendar, User, Users, ArrowRight,
  GripVertical, Circle, RefreshCw, Flag, Zap, BookOpen,
  BarChart2, ExternalLink, Trash2
} from "lucide-react";
import type { UserRole } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────
type Project = {
  id: number; project_ref: string; name: string; description?: string;
  category: string; status: string; priority: string; owner: string;
  members?: string; start_date?: string; target_date?: string;
  completed_at?: string; progress: number; notes?: string;
  created_at: string; updated_at: string;
};
type ProjectTask = {
  id: number; project_id: number; task_ref: string; title: string;
  description?: string; type: string; status: string; priority: string;
  assigned_to?: string; due_date?: string; completed_at?: string;
  story_points?: number; labels?: string; notes?: string;
  created_at: string; updated_at: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORIES = ["general","platform","compliance","infrastructure","clinical"];
const PROJ_STATUSES = ["planning","active","on_hold","completed","cancelled"];
const TASK_STATUSES = ["todo","in_progress","in_review","done","blocked"];
const TASK_TYPES    = ["task","bug","feature","improvement","risk"];
const PRIORITIES    = ["critical","high","normal","low"];

const CAT_CFG: Record<string,{label:string;color:string}> = {
  general:        { label: "General",        color: "text-[#797876]"  },
  platform:       { label: "Platform",       color: "text-[#4F98A3]"  },
  compliance:     { label: "Compliance",     color: "text-amber-400"  },
  infrastructure: { label: "Infrastructure", color: "text-blue-400"   },
  clinical:       { label: "Clinical",       color: "text-green-400"  },
};
const PSTATUS_CFG: Record<string,{label:string;cls:string}> = {
  planning:   { label: "Planning",   cls: "bg-[#393836] text-[#CDCCCA] border-[#393836]"          },
  active:     { label: "Active",     cls: "bg-[#4F98A3]/15 text-[#4F98A3] border-[#4F98A3]/30"   },
  on_hold:    { label: "On Hold",    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30"    },
  completed:  { label: "Completed",  cls: "bg-green-500/15 text-green-400 border-green-500/30"    },
  cancelled:  { label: "Cancelled",  cls: "bg-[#1C1B19] text-[#5A5957] border-[#393836]"         },
};
const TSTATUS_CFG: Record<string,{label:string;icon:React.ReactNode;cls:string}> = {
  todo:       { label: "To Do",      icon: <Circle size={11} />,         cls: "bg-[#393836] text-[#797876] border-[#393836]"         },
  in_progress:{ label: "In Progress",icon: <RefreshCw size={11} />,      cls: "bg-blue-500/15 text-blue-400 border-blue-500/30"      },
  in_review:  { label: "In Review",  icon: <BookOpen size={11} />,       cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  done:       { label: "Done",       icon: <CheckCircle2 size={11} />,   cls: "bg-green-500/15 text-green-400 border-green-500/30"   },
  blocked:    { label: "Blocked",    icon: <AlertTriangle size={11} />,  cls: "bg-red-500/15 text-red-400 border-red-500/30"         },
};
const TYPE_CFG: Record<string,{label:string;color:string}> = {
  task:        { label: "Task",        color: "text-[#797876]"  },
  bug:         { label: "Bug",         color: "text-red-400"    },
  feature:     { label: "Feature",     color: "text-[#4F98A3]"  },
  improvement: { label: "Improvement", color: "text-blue-400"   },
  risk:        { label: "Risk",        color: "text-amber-400"  },
};
const PRIO_CFG: Record<string,{label:string;cls:string}> = {
  critical: { label: "Critical", cls: "bg-red-500/15 text-red-400 border-red-500/30"       },
  high:     { label: "High",     cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  normal:   { label: "Normal",   cls: "bg-[#393836] text-[#CDCCCA] border-[#393836]"       },
  low:      { label: "Low",      cls: "bg-[#1C1B19] text-[#5A5957] border-[#393836]"       },
};

// ─── Small badges ─────────────────────────────────────────────────────────────
const PBadge = ({ s }: { s: string }) => { const c = PSTATUS_CFG[s] ?? PSTATUS_CFG.planning; return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>{c.label}</span>; };
const TBadge = ({ s }: { s: string }) => { const c = TSTATUS_CFG[s] ?? TSTATUS_CFG.todo; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>{c.icon}{c.label}</span>; };
const PrioBadge = ({ p }: { p: string }) => { const c = PRIO_CFG[p] ?? PRIO_CFG.normal; return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>{c.label}</span>; };

// ─── Kanban Board ─────────────────────────────────────────────────────────────
function KanbanBoard({ tasks, projectId, projectRef, onUpdate, onCreate, onDelete }: {
  tasks: ProjectTask[]; projectId: number; projectRef: string;
  onUpdate: (id: number, u: any) => void;
  onCreate: (d: any) => void;
  onDelete: (id: number) => void;
}) {
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const cols = TASK_STATUSES.map(s => ({ key: s, cfg: TSTATUS_CFG[s], tasks: tasks.filter(t => t.status === s) }));

  const handleQuickAdd = (status: string) => {
    if (!newTitle.trim()) return;
    onCreate({ project_id: projectId, project_ref: projectRef, title: newTitle.trim(), type: "task", status, priority: "normal" });
    setNewTitle(""); setAddingIn(null);
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {cols.map(col => (
          <div key={col.key} className="w-64 flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <TBadge s={col.key} />
                <span className="text-[10px] text-[#5A5957]">{col.tasks.length}</span>
              </div>
              <button onClick={() => { setAddingIn(col.key); setNewTitle(""); }}
                className="p-1 rounded hover:bg-white/10 text-[#5A5957] hover:text-[#CDCCCA] transition-colors">
                <Plus size={12} />
              </button>
            </div>

            {/* Quick add input */}
            {addingIn === col.key && (
              <div className="bg-[#1C1B19] border border-[#4F98A3]/30 rounded-lg p-2.5 space-y-2">
                <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleQuickAdd(col.key); if (e.key === "Escape") setAddingIn(null); }}
                  placeholder="Task title…"
                  className="w-full px-2 py-1.5 bg-[#171614] border border-[#393836] rounded text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none" />
                <div className="flex gap-1.5">
                  <button onClick={() => handleQuickAdd(col.key)}
                    className="flex-1 py-1 rounded bg-[#01696F] text-white text-[10px] font-semibold hover:bg-[#0C4E54]">Add</button>
                  <button onClick={() => setAddingIn(null)}
                    className="flex-1 py-1 rounded border border-[#393836] text-[#797876] text-[10px] hover:text-[#CDCCCA]">Cancel</button>
                </div>
              </div>
            )}

            {/* Task cards */}
            <div className="space-y-2 min-h-[60px]">
              {col.tasks.map(task => {
                const tc = TYPE_CFG[task.type] ?? TYPE_CFG.task;
                return (
                  <div key={task.id} className="bg-[#1C1B19] border border-[#393836] rounded-xl p-3 hover:border-[#4F98A3]/30 transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-semibold ${tc.color}`}>{tc.label.toUpperCase()}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onDelete(task.id)} className="p-0.5 rounded hover:bg-red-500/20 text-[#5A5957] hover:text-red-400 transition-colors">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-[#CDCCCA] leading-snug mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <PrioBadge p={task.priority} />
                      {task.assigned_to && <span className="text-[10px] text-[#5A5957]">{task.assigned_to}</span>}
                    </div>
                    {/* Status mover */}
                    <div className="mt-2 pt-2 border-t border-[#393836] flex gap-1 flex-wrap">
                      {TASK_STATUSES.filter(s => s !== task.status).map(s => (
                        <button key={s} onClick={() => onUpdate(task.id, { status: s, completed_at: s === "done" ? new Date().toISOString() : null })}
                          className="text-[9px] text-[#5A5957] hover:text-[#4F98A3] px-1.5 py-0.5 rounded hover:bg-[#4F98A3]/10 transition-colors">
                          → {TSTATUS_CFG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Project Detail ───────────────────────────────────────────────────────────
function ProjectDetail({ project, onClose, onUpdate }: { project: Project; onClose: () => void; onUpdate: (id: number, u: any) => void; }) {
  const qc = useQueryClient();
  const cat = CAT_CFG[project.category] ?? CAT_CFG.general;
  const members = project.members ? JSON.parse(project.members) as string[] : [];

  const { data: tasks = [] } = useQuery<ProjectTask[]>({
    queryKey: ["/api/projects", project.id, "tasks"],
    queryFn: () => apiRequest("GET", `/api/projects/${project.id}/tasks`).then(r => r.json()),
    refetchInterval: 15000,
  });

  const createTask = useMutation({
    mutationFn: (d: any) => apiRequest("POST", `/api/projects/${project.id}/tasks`, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects", project.id, "tasks"] }),
  });
  const updateTask = useMutation({
    mutationFn: ({ id, u }: { id: number; u: any }) => apiRequest("PATCH", `/api/project-tasks/${id}`, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects", project.id, "tasks"] }),
  });
  const deleteTask = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/project-tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects", project.id, "tasks"] }),
  });

  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const taskProgress = total > 0 ? Math.round((done / total) * 100) : project.progress;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[#1C1B19] border-l border-[#393836] flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#393836]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-semibold ${cat.color}`}>{cat.label.toUpperCase()}</span>
                <span className="text-[10px] text-[#5A5957] font-mono">{project.project_ref}</span>
                <PBadge s={project.status} />
                <PrioBadge p={project.priority} />
              </div>
              <h2 className="text-lg font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{project.name}</h2>
              {project.description && <p className="text-xs text-[#797876] mt-1">{project.description}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876]"><X size={16} /></button>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#5A5957]">Progress</span>
              <span className="text-[10px] font-bold text-[#4F98A3]">{taskProgress}%{total > 0 ? ` · ${done}/${total} tasks` : ""}</span>
            </div>
            <div className="h-1.5 bg-[#393836] rounded-full overflow-hidden">
              <div className="h-full bg-[#01696F] rounded-full transition-all" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap text-[10px] text-[#5A5957]">
            <span className="flex items-center gap-1"><User size={10} />Owner: <span className="text-[#CDCCCA]">{project.owner}</span></span>
            {project.target_date && <span className="flex items-center gap-1"><Calendar size={10} />Target: <span className="text-[#CDCCCA]">{project.target_date}</span></span>}
            {members.length > 0 && <span className="flex items-center gap-1"><Users size={10} />{members.join(", ")}</span>}
          </div>
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#CDCCCA]">Tasks</h3>
            <span className="text-[10px] text-[#5A5957]">Click + under any column to add a task</span>
          </div>
          <KanbanBoard
            tasks={tasks}
            projectId={project.id}
            projectRef={project.project_ref}
            onUpdate={(id, u) => updateTask.mutate({ id, u })}
            onCreate={d => createTask.mutate(d)}
            onDelete={id => deleteTask.mutate(id)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── New Project Form ─────────────────────────────────────────────────────────
function NewProjectForm({ onClose, onCreate }: { onClose: () => void; onCreate: (d: any) => void }) {
  const [form, setForm] = useState({
    name: "", description: "", category: "general", status: "planning",
    priority: "normal", owner: "", members: "", start_date: "", target_date: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.owner.trim()) return;
    onCreate({
      ...form,
      members: form.members ? JSON.stringify(form.members.split(",").map(s => s.trim()).filter(Boolean)) : null,
      description: form.description || null,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      progress: 0,
    });
    onClose();
  };

  const F = ({ label, k, placeholder, type = "text" }: any) => (
    <div>
      <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50" />
    </div>
  );
  const S = ({ label, k, opts }: any) => (
    <div>
      <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">{label}</label>
      <select value={(form as any)[k]} onChange={e => set(k, e.target.value)}
        className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]/50">
        {opts.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1C1B19] border border-[#393836] rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876]"><X size={15} /></button>
        </div>
        <F label="Project Name *" k="name" placeholder="e.g. Jira Integration" />
        <div>
          <label className="text-[10px] text-[#5A5957] uppercase tracking-wider block mb-1">Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="What this project achieves…"
            className="w-full px-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <S label="Category" k="category" opts={CATEGORIES.map(c => ({ v: c, l: CAT_CFG[c].label }))} />
          <S label="Priority" k="priority" opts={PRIORITIES.map(p => ({ v: p, l: PRIO_CFG[p].label }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <S label="Status" k="status" opts={PROJ_STATUSES.map(s => ({ v: s, l: PSTATUS_CFG[s].label }))} />
          <F label="Owner *" k="owner" placeholder="Your name" />
        </div>
        <F label="Team Members" k="members" placeholder="Comma-separated names" />
        <div className="grid grid-cols-2 gap-3">
          <F label="Start Date" k="start_date" type="date" />
          <F label="Target Date" k="target_date" type="date" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#393836] text-xs text-[#797876] hover:text-[#CDCCCA] transition-colors">Cancel</button>
          <button onClick={submit} disabled={!form.name.trim() || !form.owner.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#01696F] text-white text-xs font-semibold hover:bg-[#0C4E54] disabled:opacity-40 transition-colors">
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const cat = CAT_CFG[project.category] ?? CAT_CFG.general;
  const isOverdue = project.target_date && project.status === "active" && new Date(project.target_date) < new Date();
  return (
    <button onClick={onClick} className="w-full text-left bg-[#1C1B19] border border-[#393836] rounded-xl p-4 hover:border-[#4F98A3]/40 transition-all group">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-[10px] font-semibold ${cat.color}`}>{cat.label.toUpperCase()}</span>
            <span className="text-[10px] text-[#5A5957] font-mono">{project.project_ref}</span>
            <PBadge s={project.status} />
            <PrioBadge p={project.priority} />
          </div>
          <p className="text-sm font-bold text-[#CDCCCA] mb-1 group-hover:text-white transition-colors">{project.name}</p>
          {project.description && <p className="text-xs text-[#797876] line-clamp-1 mb-2">{project.description}</p>}
          <div className="flex items-center gap-3 text-[10px] text-[#5A5957] mb-2.5 flex-wrap">
            <span className="flex items-center gap-1"><User size={9} />{project.owner}</span>
            {project.target_date && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400 font-semibold" : ""}`}>
                <Calendar size={9} />{project.target_date}{isOverdue ? " · OVERDUE" : ""}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-[#5A5957]">Progress</span>
              <span className="text-[9px] font-bold text-[#4F98A3]">{project.progress}%</span>
            </div>
            <div className="h-1 bg-[#393836] rounded-full overflow-hidden">
              <div className="h-full bg-[#01696F] rounded-full transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
        <ChevronRight size={14} className="text-[#5A5957] group-hover:text-[#4F98A3] shrink-0 mt-1 transition-colors" />
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectManagement({ role }: { role: UserRole }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Project | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiRequest("GET", "/api/projects").then(r => r.json()),
    refetchInterval: 30000,
  });

  const createProject = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/projects", d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects"] }),
  });
  const updateProject = useMutation({
    mutationFn: ({ id, u }: { id: number; u: any }) => apiRequest("PATCH", `/api/projects/${id}`, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects"] }),
  });

  const filtered = projects.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (filterStatus === "active" && p.status !== "active" && p.status !== "planning") return false;
    if (filterStatus !== "all" && filterStatus !== "active" && p.status !== filterStatus) return false;
    return true;
  });

  const counts = {
    active:   projects.filter(p => p.status === "active").length,
    planning: projects.filter(p => p.status === "planning").length,
    on_hold:  projects.filter(p => p.status === "on_hold").length,
    done:     projects.filter(p => p.status === "completed").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#4F98A3]" />
            <h1 className="text-xl font-bold text-[#CDCCCA]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Project Management</h1>
          </div>
          <p className="text-sm text-[#797876] mt-0.5">Platform initiatives · Compliance programs · Feature development</p>
        </div>
        <button onClick={() => setShowNew(true)} data-testid="button-new-project"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#01696F] text-white text-xs font-semibold hover:bg-[#0C4E54] transition-colors">
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active",   val: counts.active,   color: "text-[#4F98A3]",  bg: "bg-[#4F98A3]/8"  },
          { label: "Planning", val: counts.planning,  color: "text-[#CDCCCA]", bg: "bg-[#393836]/40" },
          { label: "On Hold",  val: counts.on_hold,   color: "text-amber-400", bg: "bg-amber-500/8"  },
          { label: "Completed",val: counts.done,      color: "text-green-400", bg: "bg-green-500/8"  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-[#393836] rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.val}</div>
            <div className="text-[10px] text-[#5A5957] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-2.5 py-2 bg-[#1C1B19] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] focus:outline-none">
          <option value="active">Active & Planning</option>
          <option value="all">All statuses</option>
          {PROJ_STATUSES.map(s => <option key={s} value={s}>{PSTATUS_CFG[s].label}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {["all", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCat === c
                  ? "bg-[#01696F]/20 text-[#4F98A3] border border-[#01696F]/30"
                  : "bg-[#1C1B19] border border-[#393836] text-[#797876] hover:text-[#CDCCCA]"
              }`}>
              {c === "all" ? "All" : CAT_CFG[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="text-center py-12 text-[#5A5957] text-sm">Loading projects…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Layers size={32} className="text-[#393836] mx-auto" />
          <p className="text-sm text-[#5A5957]">No projects found.</p>
          <button onClick={() => setShowNew(true)} className="text-xs text-[#4F98A3] hover:underline">Create your first project</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />)}
        </div>
      )}

      {showNew && <NewProjectForm onClose={() => setShowNew(false)} onCreate={d => createProject.mutate(d)} />}
      {selected && (
        <ProjectDetail
          project={selected}
          onClose={() => setSelected(null)}
          onUpdate={(id, u) => updateProject.mutate({ id, u })}
        />
      )}
    </div>
  );
}
