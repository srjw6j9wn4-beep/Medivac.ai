import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { UserRole } from "@/lib/data";
import { ROLES } from "@/lib/data";

interface Props { role: UserRole }

type PermLevel = "full" | "read" | "none";

interface Module {
  id: string;
  label: string;
  icon: string;
  section: string;
}

const MODULES: Module[] = [
  // ── Demo ──────────────────────────────────────────────────────────────────
  { id: "demo-overview",       label: "Demo Overview",              icon: "▶", section: "Demo" },
  { id: "demo-mode",           label: "Client Demo Mode",           icon: "🎬", section: "Demo" },

  // ── Mission Operations ────────────────────────────────────────────────────
  { id: "home",                label: "Operations Overview",        icon: "🏠", section: "Mission Operations" },
  { id: "ops-display",         label: "Ops Room Display",           icon: "📺", section: "Mission Operations" },
  { id: "nept-tasking",        label: "NEPT Tasking",               icon: "🚑", section: "Mission Operations" },
  { id: "morning-brief",       label: "The 8:45",                   icon: "☀️", section: "Mission Operations" },
  { id: "passenger-manifest",  label: "Passenger Manifest",         icon: "📋", section: "Mission Operations" },
  { id: "missions",            label: "Mission Board",              icon: "🚁", section: "Mission Operations" },
  { id: "map",                 label: "NSW Flight Map",             icon: "🗺️", section: "Mission Operations" },
  { id: "dispatch",            label: "Dispatch & Intake",          icon: "📡", section: "Mission Operations" },
  { id: "rest-calculator",     label: "Crew Rest Calculator",       icon: "⏱️", section: "Mission Operations" },
  { id: "charter-quote",       label: "Charter Quote",              icon: "💰", section: "Mission Operations" },
  { id: "ora",                 label: "Operational Risk Assessment",icon: "⚠️", section: "Mission Operations" },
  { id: "flight-planning",     label: "Flight Planning",            icon: "🛫", section: "Mission Operations" },
  { id: "mission-optimiser",   label: "Mission Optimiser",          icon: "⚡", section: "Mission Operations" },
  { id: "special-missions",    label: "Special Missions",           icon: "⭐", section: "Mission Operations" },
  { id: "ops-tasks",           label: "Ops Task Management",        icon: "✅", section: "Mission Operations" },
  { id: "pilot-handover",      label: "Pilot Handover Board",       icon: "🤝", section: "Mission Operations" },
  { id: "shift-fleet",          label: "Shift & Fleet Status",       icon: "📋", section: "Mission Operations" },

  // ── Tech & Journey Log ────────────────────────────────────────────────────
  { id: "tech-log",            label: "Tech & Journey Log",         icon: "📓", section: "Tech & Journey Log" },

  // ── People & Aircraft ─────────────────────────────────────────────────────
  { id: "org-chart",           label: "Org Chart & Key Contacts",   icon: "🏢", section: "People & Aircraft" },
  { id: "roster",              label: "Crew Roster",                icon: "📅", section: "People & Aircraft" },
  { id: "frms",                label: "Duty & FRMS",                icon: "⏱️", section: "People & Aircraft" },
  { id: "aircraft",            label: "Aircraft Status",            icon: "✈️", section: "People & Aircraft" },
  { id: "engineering",         label: "Engineering",                icon: "🔧", section: "People & Aircraft" },
  { id: "maint-planner",       label: "Maintenance Planner",        icon: "🗓️", section: "People & Aircraft" },
  { id: "asset-utilisation",   label: "Asset Utilisation",          icon: "📊", section: "People & Aircraft" },
  { id: "ferry",               label: "Ferry Flights",              icon: "🛩️", section: "People & Aircraft" },
  { id: "techlog",             label: "Tech Log",                   icon: "📒", section: "People & Aircraft" },
  { id: "check-training",      label: "Check & Training",           icon: "🎓", section: "People & Aircraft" },
  { id: "regulations",         label: "Regulations Reference",      icon: "📜", section: "People & Aircraft" },
  { id: "medical-equipment",   label: "Medical Equipment",          icon: "🏥", section: "People & Aircraft" },
  { id: "stock-usage",         label: "Stock Usage & Orders",       icon: "📦", section: "People & Aircraft" },
  { id: "after-hours",         label: "After-Hours AI Med Line",    icon: "🌙", section: "People & Aircraft" },
  { id: "ground-vehicles",     label: "Ground Vehicles",            icon: "🚗", section: "People & Aircraft" },

  // ── AI & Communications ───────────────────────────────────────────────────
  { id: "jennifer",            label: "Jennifer — Presenter",       icon: "🤖", section: "AI & Communications" },
  { id: "jennifer-live-qa",    label: "Jennifer — Live Q&A",        icon: "💬", section: "AI & Communications" },
  { id: "jennifer-live",       label: "Graham — Live Q&A",          icon: "🎤", section: "AI & Communications" },
  { id: "ai-analyst",          label: "AI Mission Analyst",         icon: "🧠", section: "AI & Communications" },
  { id: "telehealth",          label: "Telehealth Portal",          icon: "📹", section: "AI & Communications" },
  { id: "doc-ai",              label: "Document AI",                icon: "📄", section: "AI & Communications" },

  // ── Business & Compliance ─────────────────────────────────────────────────
  { id: "invoicing",           label: "Invoicing",                  icon: "🧾", section: "Business & Compliance" },
  { id: "cost-optimizer",      label: "Cost Optimizer",             icon: "📉", section: "Business & Compliance" },
  { id: "iso",                 label: "ISO Compliance",             icon: "🏅", section: "Business & Compliance" },
  { id: "contracts",           label: "Contract Compliance",        icon: "📝", section: "Business & Compliance" },
  { id: "finance",             label: "Fee Reconciliation",         icon: "💼", section: "Business & Compliance" },
  { id: "audit",               label: "Audit & Reports",            icon: "🔍", section: "Business & Compliance" },
  { id: "government-tenders",  label: "Government Tenders",         icon: "🏛️", section: "Business & Compliance" },
  { id: "payroll-leave",       label: "Payroll & Leave",            icon: "💳", section: "Business & Compliance" },

  // ── Administration ────────────────────────────────────────────────────────
  { id: "idea-hub",            label: "Idea Hub",                   icon: "💡", section: "Administration" },
  { id: "projects",            label: "Project Management",         icon: "📌", section: "Administration" },
  { id: "users",               label: "User Management",            icon: "👥", section: "Administration" },
  { id: "rbac",                label: "RBAC Permissions",           icon: "🛡️", section: "Administration" },
  { id: "settings",            label: "System Settings",            icon: "⚙️", section: "Administration" },
  { id: "api-integrations",    label: "API Integration Hub",        icon: "🔗", section: "Administration" },
];

type PermMatrix = Record<string, Record<string, PermLevel>>;

const DEFAULT_PERMS: PermMatrix = {
  pilot: {
    // Demo
    "demo-overview": "read", "demo-mode": "none",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "none",
    // Mission Operations
    "nept-tasking": "read", "morning-brief": "full", "passenger-manifest": "full",
    "missions": "read", "map": "full", "dispatch": "none", "rest-calculator": "full",
    "charter-quote": "none", "ora": "full", "flight-planning": "full",
    "mission-optimiser": "read", "special-missions": "read", "ops-tasks": "read", "pilot-handover": "full", "shift-fleet": "full",
    // Tech & Journey Log
    "tech-log": "full",
    // People & Aircraft
    "org-chart": "read", "roster": "read", "frms": "full", "aircraft": "read",
    "engineering": "none", "maint-planner": "none", "asset-utilisation": "none",
    "ferry": "full", "techlog": "full", "check-training": "read", "regulations": "full",
    "medical-equipment": "none", "stock-usage": "none", "after-hours": "none", "ground-vehicles": "read",
    // AI & Communications
    "jennifer": "read", "jennifer-live-qa": "read", "jennifer-live": "read",
    "ai-analyst": "read", "telehealth": "none", "doc-ai": "read",
    // Business & Compliance
    "invoicing": "none", "cost-optimizer": "none", "iso": "none", "contracts": "none",
    "finance": "none", "audit": "read", "government-tenders": "none", "payroll-leave": "none",
    // Administration
    "idea-hub": "full", "projects": "none", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  nurse: {
    "demo-overview": "read", "demo-mode": "none",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "none",
    "nept-tasking": "full", "morning-brief": "full", "passenger-manifest": "full",
    "missions": "full", "map": "read", "dispatch": "read", "rest-calculator": "read",
    "charter-quote": "none", "ora": "read", "flight-planning": "none",
    "mission-optimiser": "read", "special-missions": "full", "ops-tasks": "read", "pilot-handover": "read", "shift-fleet": "full",
    "tech-log": "none",
    "org-chart": "read", "roster": "read", "frms": "none", "aircraft": "none",
    "engineering": "none", "maint-planner": "none", "asset-utilisation": "none",
    "ferry": "none", "techlog": "none", "check-training": "none", "regulations": "read",
    "medical-equipment": "read", "stock-usage": "read", "after-hours": "full", "ground-vehicles": "none",
    "jennifer": "read", "jennifer-live-qa": "read", "jennifer-live": "none",
    "ai-analyst": "read", "telehealth": "full", "doc-ai": "read",
    "invoicing": "none", "cost-optimizer": "none", "iso": "none", "contracts": "none",
    "finance": "none", "audit": "none", "government-tenders": "none", "payroll-leave": "none",
    "idea-hub": "full", "projects": "none", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  senior_flight_nurse: {
    "demo-overview": "read", "demo-mode": "none",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "none",
    "nept-tasking": "full", "morning-brief": "full", "passenger-manifest": "full",
    "missions": "full", "map": "read", "dispatch": "read", "rest-calculator": "read",
    "charter-quote": "none", "ora": "read", "flight-planning": "none",
    "mission-optimiser": "read", "special-missions": "full", "ops-tasks": "read", "pilot-handover": "read", "shift-fleet": "full",
    "tech-log": "none",
    "org-chart": "read", "roster": "read", "frms": "read", "aircraft": "none",
    "engineering": "none", "maint-planner": "none", "asset-utilisation": "none",
    "ferry": "none", "techlog": "none", "check-training": "read", "regulations": "read",
    "medical-equipment": "full", "stock-usage": "full", "after-hours": "full", "ground-vehicles": "none",
    "jennifer": "read", "jennifer-live-qa": "read", "jennifer-live": "none",
    "ai-analyst": "read", "telehealth": "full", "doc-ai": "read",
    "invoicing": "none", "cost-optimizer": "none", "iso": "none", "contracts": "none",
    "finance": "none", "audit": "read", "government-tenders": "none", "payroll-leave": "none",
    "idea-hub": "full", "projects": "none", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  ordering_nurse: {
    "demo-overview": "read", "demo-mode": "none",
    // Mission Operations — home + ops display
    "home": "read", "ops-display": "none",
    "nept-tasking": "full", "morning-brief": "read", "passenger-manifest": "full",
    "missions": "read", "map": "read", "dispatch": "read", "rest-calculator": "none",
    "charter-quote": "none", "ora": "none", "flight-planning": "none",
    "mission-optimiser": "none", "special-missions": "read", "ops-tasks": "read", "pilot-handover": "none", "shift-fleet": "read",
    "tech-log": "none",
    "org-chart": "read", "roster": "none", "frms": "none", "aircraft": "none",
    "engineering": "none", "maint-planner": "none", "asset-utilisation": "none",
    "ferry": "none", "techlog": "none", "check-training": "none", "regulations": "read",
    "medical-equipment": "full", "stock-usage": "full", "after-hours": "full", "ground-vehicles": "none",
    "jennifer": "read", "jennifer-live-qa": "read", "jennifer-live": "none",
    "ai-analyst": "none", "telehealth": "read", "doc-ai": "read",
    "invoicing": "none", "cost-optimizer": "none", "iso": "none", "contracts": "none",
    "finance": "none", "audit": "none", "government-tenders": "none", "payroll-leave": "none",
    "idea-hub": "full", "projects": "none", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  doctor: {
    "demo-overview": "read", "demo-mode": "none",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "none",
    "nept-tasking": "full", "morning-brief": "full", "passenger-manifest": "full",
    "missions": "full", "map": "read", "dispatch": "read", "rest-calculator": "none",
    "charter-quote": "none", "ora": "read", "flight-planning": "none",
    "mission-optimiser": "read", "special-missions": "full", "ops-tasks": "read", "pilot-handover": "none", "shift-fleet": "read",
    "tech-log": "none",
    "org-chart": "read", "roster": "read", "frms": "none", "aircraft": "none",
    "engineering": "none", "maint-planner": "none", "asset-utilisation": "none",
    "ferry": "none", "techlog": "none", "check-training": "none", "regulations": "read",
    "medical-equipment": "full", "stock-usage": "read", "after-hours": "full", "ground-vehicles": "none",
    "jennifer": "full", "jennifer-live-qa": "full", "jennifer-live": "none",
    "ai-analyst": "full", "telehealth": "full", "doc-ai": "full",
    "invoicing": "none", "cost-optimizer": "none", "iso": "read", "contracts": "none",
    "finance": "none", "audit": "read", "government-tenders": "none", "payroll-leave": "none",
    "idea-hub": "full", "projects": "none", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  dispatcher: {
    "demo-overview": "full", "demo-mode": "full",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "full",
    "nept-tasking": "full", "morning-brief": "full", "passenger-manifest": "full",
    "missions": "full", "map": "full", "dispatch": "full", "rest-calculator": "full",
    "charter-quote": "full", "ora": "full", "flight-planning": "full",
    "mission-optimiser": "full", "special-missions": "full", "ops-tasks": "full", "pilot-handover": "full", "shift-fleet": "full",
    "tech-log": "read",
    "org-chart": "full", "roster": "full", "frms": "read", "aircraft": "read",
    "engineering": "read", "maint-planner": "read", "asset-utilisation": "read",
    "ferry": "full", "techlog": "read", "check-training": "read", "regulations": "full",
    "medical-equipment": "read", "stock-usage": "read", "after-hours": "none", "ground-vehicles": "read",
    "jennifer": "full", "jennifer-live-qa": "full", "jennifer-live": "full",
    "ai-analyst": "full", "telehealth": "read", "doc-ai": "read",
    "invoicing": "read", "cost-optimizer": "read", "iso": "none", "contracts": "none",
    "finance": "read", "audit": "read", "government-tenders": "none", "payroll-leave": "none",
    "idea-hub": "full", "projects": "read", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  engineer: {
    "demo-overview": "read", "demo-mode": "none",
    // Mission Operations — home + ops display
    "home": "read", "ops-display": "none",
    "nept-tasking": "none", "morning-brief": "read", "passenger-manifest": "none",
    "missions": "read", "map": "read", "dispatch": "none", "rest-calculator": "none",
    "charter-quote": "none", "ora": "none", "flight-planning": "none",
    "mission-optimiser": "none", "special-missions": "none", "ops-tasks": "read", "pilot-handover": "read", "shift-fleet": "read",
    "tech-log": "full",
    "org-chart": "read", "roster": "read", "frms": "none", "aircraft": "full",
    "engineering": "full", "maint-planner": "full", "asset-utilisation": "full",
    "ferry": "read", "techlog": "full", "check-training": "read", "regulations": "full",
    "medical-equipment": "none", "stock-usage": "none", "after-hours": "none", "ground-vehicles": "full",
    "jennifer": "none", "jennifer-live-qa": "none", "jennifer-live": "none",
    "ai-analyst": "none", "telehealth": "none", "doc-ai": "read",
    "invoicing": "none", "cost-optimizer": "none", "iso": "read", "contracts": "none",
    "finance": "read", "audit": "read", "government-tenders": "none", "payroll-leave": "none",
    "idea-hub": "full", "projects": "none", "users": "none", "rbac": "none", "settings": "none", "api-integrations": "none",
  },
  safety: {
    "demo-overview": "full", "demo-mode": "read",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "full",
    "nept-tasking": "read", "morning-brief": "full", "passenger-manifest": "read",
    "missions": "read", "map": "read", "dispatch": "none", "rest-calculator": "read",
    "charter-quote": "none", "ora": "full", "flight-planning": "read",
    "mission-optimiser": "read", "special-missions": "read", "ops-tasks": "read", "pilot-handover": "read", "shift-fleet": "full",
    "tech-log": "read",
    "org-chart": "full", "roster": "read", "frms": "full", "aircraft": "read",
    "engineering": "read", "maint-planner": "read", "asset-utilisation": "read",
    "ferry": "read", "techlog": "read", "check-training": "full", "regulations": "full",
    "medical-equipment": "read", "stock-usage": "read", "after-hours": "none", "ground-vehicles": "read",
    "jennifer": "full", "jennifer-live-qa": "full", "jennifer-live": "full",
    "ai-analyst": "full", "telehealth": "none", "doc-ai": "full",
    "invoicing": "read", "cost-optimizer": "read", "iso": "full", "contracts": "full",
    "finance": "read", "audit": "full", "government-tenders": "read", "payroll-leave": "read",
    "idea-hub": "full", "projects": "read", "users": "read", "rbac": "read", "settings": "none", "api-integrations": "none",
  },
  senior_management: {
    "demo-overview": "full", "demo-mode": "full",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "full",
    "nept-tasking": "full", "morning-brief": "full", "passenger-manifest": "read",
    "missions": "full", "map": "full", "dispatch": "read", "rest-calculator": "read",
    "charter-quote": "full", "ora": "full", "flight-planning": "read",
    "mission-optimiser": "full", "special-missions": "full", "ops-tasks": "full", "pilot-handover": "read", "shift-fleet": "full",
    "tech-log": "read",
    "org-chart": "full", "roster": "full", "frms": "full", "aircraft": "full",
    "engineering": "read", "maint-planner": "read", "asset-utilisation": "full",
    "ferry": "full", "techlog": "read", "check-training": "full", "regulations": "full",
    "medical-equipment": "read", "stock-usage": "read", "after-hours": "none", "ground-vehicles": "read",
    "jennifer": "full", "jennifer-live-qa": "full", "jennifer-live": "full",
    "ai-analyst": "full", "telehealth": "read", "doc-ai": "full",
    "invoicing": "full", "cost-optimizer": "full", "iso": "full", "contracts": "full",
    "finance": "full", "audit": "full", "government-tenders": "full", "payroll-leave": "full",
    "idea-hub": "full", "projects": "full", "users": "read", "rbac": "read", "settings": "read", "api-integrations": "none",
  },
  admin: {
    "demo-overview": "full", "demo-mode": "full",
    // Mission Operations — home + ops display
    "home": "full", "ops-display": "full",
    "nept-tasking": "full", "morning-brief": "full", "passenger-manifest": "full",
    "missions": "full", "map": "full", "dispatch": "full", "rest-calculator": "full",
    "charter-quote": "full", "ora": "full", "flight-planning": "full",
    "mission-optimiser": "full", "special-missions": "full", "ops-tasks": "full", "pilot-handover": "full", "shift-fleet": "full",
    "tech-log": "full",
    "org-chart": "full", "roster": "full", "frms": "full", "aircraft": "full",
    "engineering": "full", "maint-planner": "full", "asset-utilisation": "full",
    "ferry": "full", "techlog": "full", "check-training": "full", "regulations": "full",
    "medical-equipment": "full", "stock-usage": "full", "after-hours": "full", "ground-vehicles": "full",
    "jennifer": "full", "jennifer-live-qa": "full", "jennifer-live": "full",
    "ai-analyst": "full", "telehealth": "full", "doc-ai": "full",
    "invoicing": "full", "cost-optimizer": "full", "iso": "full", "contracts": "full",
    "finance": "full", "audit": "full", "government-tenders": "full", "payroll-leave": "full",
    "idea-hub": "full", "projects": "full", "users": "full", "rbac": "full", "settings": "full", "api-integrations": "full",
  },
};

const permBg = (p: PermLevel) => {
  if (p === "full") return "bg-cyan-400/20 text-cyan-400 border-cyan-400/30";
  if (p === "read") return "bg-green-400/10 text-green-400 border-green-400/30";
  return "bg-background text-muted-foreground border-card-border";
};

const PERM_CYCLE: PermLevel[] = ["none", "read", "full"];

export default function RBACPermissions({ role }: Props) {
  const [perms, setPerms] = useState<PermMatrix>(DEFAULT_PERMS);
  const [selectedRole, setSelectedRole] = useState<UserRole>("pilot");
  const [view, setView] = useState<"role" | "matrix">("role");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const qc = useQueryClient();

  // Load saved matrix from backend on mount
  const { data: savedData } = useQuery<{ matrix: PermMatrix | null }>({
    queryKey: ["/api/rbac-permissions"],
    staleTime: 0,
  });

  // When backend data arrives, replace local state (unless it's null — use defaults)
  useEffect(() => {
    if (savedData?.matrix) {
      setPerms(savedData.matrix);
    }
  }, [savedData]);

  const saveMutation = useMutation({
    mutationFn: (matrix: PermMatrix) =>
      apiRequest("PUT", "/api/rbac-permissions", { matrix, updatedBy: role }),
    onSuccess: () => {
      setSaved(true);
      setSaveError(null);
      qc.invalidateQueries({ queryKey: ["/api/rbac-permissions"] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err: any) => {
      setSaveError(err?.message ?? "Save failed — check connection");
      setTimeout(() => setSaveError(null), 4000);
    },
  });

  const isAdmin = role === "admin";

  function cyclePermission(roleId: string, moduleId: string) {
    if (!isAdmin) return;
    setPerms(prev => {
      const cur = prev[roleId]?.[moduleId] as PermLevel ?? "none";
      const next = PERM_CYCLE[(PERM_CYCLE.indexOf(cur) + 1) % PERM_CYCLE.length];
      return { ...prev, [roleId]: { ...prev[roleId], [moduleId]: next } };
    });
    setSaved(false);
  }

  function handleSave() {
    saveMutation.mutate(perms);
  }

  const tabs = [
    { id: "role", label: "By Role" },
    { id: "matrix", label: "Full Matrix" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>RBAC Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Role-based access control — module-level permissions per role</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col items-end gap-1">
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className={`px-4 py-2 border text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${saved ? "bg-green-400/20 border-green-400/30 text-green-400" : "bg-cyan-400/10 hover:bg-cyan-400/20 border-cyan-400/30 text-cyan-400"}`}>
              {saveMutation.isPending ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
            </button>
            {saveError && <span className="text-[10px] text-red-400">{saveError}</span>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground font-semibold">Access levels:</span>
        {[{ label: "Full Access", p: "full" as PermLevel }, { label: "Read Only", p: "read" as PermLevel }, { label: "No Access", p: "none" as PermLevel }].map(l => (
          <span key={l.label} className={`px-2 py-0.5 rounded-md border font-semibold ${permBg(l.p)}`}>{l.label}</span>
        ))}
        {isAdmin && <span className="text-muted-foreground italic">Click cells to cycle</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* By Role view */}
      {view === "role" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role picker */}
          <div className="space-y-1.5">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setSelectedRole(r.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-2 ${selectedRole === r.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-card-border bg-card hover:border-cyan-400/30"}`}>
                <span>{r.icon}</span>
                <span className={`text-sm font-semibold ${r.color}`}>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Module perms for selected role */}
          <div className="lg:col-span-3 bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {ROLES.find(r => r.id === selectedRole)?.icon} {ROLES.find(r => r.id === selectedRole)?.label} — Module Permissions
              </div>
            </div>
            <div className="divide-y divide-card-border">
              {(() => {
                const sections = Array.from(new Set(MODULES.map(m => m.section)));
                return sections.map(section => {
                  const mods = MODULES.filter(m => m.section === section);
                  return (
                    <div key={section}>
                      <div className="px-4 py-1.5 bg-background/40 border-b border-card-border">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{section}</span>
                      </div>
                      {mods.map(m => {
                        const p = (perms[selectedRole]?.[m.id] ?? "none") as PermLevel;
                        return (
                          <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2 text-sm">
                              <span>{m.icon}</span>
                              <span>{m.label}</span>
                            </div>
                            <button onClick={() => cyclePermission(selectedRole, m.id)}
                              className={`px-3 py-1 rounded-md border text-xs font-semibold transition-colors ${permBg(p)} ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}>
                              {p === "full" ? "Full" : p === "read" ? "Read" : "None"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Full matrix view */}
      {view === "matrix" && (
        <div className="bg-card border border-card-border rounded-xl overflow-auto">
          <table className="text-[10px] w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left p-2 pl-4 font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-32">Module</th>
                {ROLES.map(r => (
                  <th key={r.id} className="p-2 text-center font-semibold min-w-20">
                    <span className={r.color}>{r.icon}</span>
                    <div className="text-muted-foreground">{r.label.split(' ')[0]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const sections = Array.from(new Set(MODULES.map(m => m.section)));
                return sections.flatMap(section => {
                  const mods = MODULES.filter(m => m.section === section);
                  const totalCols = ROLES.length + 1;
                  return [
                    <tr key={`section-${section}`} className="bg-background/60">
                      <td colSpan={totalCols} className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-card-border sticky left-0 bg-background/60">
                        {section}
                      </td>
                    </tr>,
                    ...mods.map(m => (
                      <tr key={m.id} className="border-b border-card-border/50 hover:bg-background/20 transition-colors">
                        <td className="p-2 pl-4 font-medium sticky left-0 bg-card z-10 text-[10px]">
                          {m.icon} {m.label}
                        </td>
                        {ROLES.map(r => {
                          const p = (perms[r.id]?.[m.id] ?? "none") as PermLevel;
                          return (
                            <td key={r.id} className="p-2 text-center">
                              <button onClick={() => cyclePermission(r.id, m.id)}
                                className={`px-2 py-0.5 rounded border font-semibold transition-colors w-14 ${permBg(p)} ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}>
                                {p === "full" ? "F" : p === "read" ? "R" : "—"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    )),
                  ];
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

      {!isAdmin && (
        <div className="text-xs text-muted-foreground italic">Permissions are read-only for your role. Contact System Admin to request changes.</div>
      )}
    </div>
  );
}
