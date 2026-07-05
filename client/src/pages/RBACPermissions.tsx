import { useState } from "react";
import type { UserRole } from "@/lib/data";
import { ROLES } from "@/lib/data";

interface Props { role: UserRole }

type PermLevel = "full" | "read" | "none";

interface Module {
  id: string;
  label: string;
  icon: string;
}

const MODULES: Module[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "missions", label: "Mission Board", icon: "🚁" },
  { id: "map", label: "NSW Flight Map", icon: "🗺" },
  { id: "dispatch", label: "Dispatch", icon: "📡" },
  { id: "flight-planning", label: "Flight Planning", icon: "📋" },
  { id: "special-missions", label: "Special Missions", icon: "⭐" },
  { id: "roster", label: "Roster", icon: "📅" },
  { id: "frms", label: "Duty & FRMS", icon: "⏱" },
  { id: "aircraft", label: "Aircraft Status", icon: "✈" },
  { id: "ferry", label: "Ferry Flights", icon: "🛩" },
  { id: "techlog", label: "Tech Log", icon: "🔧" },
  { id: "ai-analyst", label: "AI Mission Analyst", icon: "🧠" },
  { id: "telehealth", label: "Telehealth Portal", icon: "🏥" },
  { id: "doc-ai", label: "Document AI", icon: "📄" },
  { id: "iso", label: "ISO Compliance", icon: "🏅" },
  { id: "contracts", label: "Contract Compliance", icon: "📝" },
  { id: "finance", label: "Fuel & Finance", icon: "⛽" },
  { id: "audit", label: "Audit Reports", icon: "🔍" },
  { id: "users", label: "User Management", icon: "👥" },
  { id: "rbac", label: "RBAC Permissions", icon: "🛡" },
  { id: "settings", label: "System Settings", icon: "⚙" },
  { id: "jennifer", label: "Jennifer AI", icon: "🤖" },
];

type PermMatrix = Record<string, Record<string, PermLevel>>;

// Default permission matrix
const DEFAULT_PERMS: PermMatrix = {
  pilot: {
    dashboard: "full", missions: "read", map: "full", dispatch: "none", "flight-planning": "full",
    "special-missions": "read", roster: "read", frms: "full", aircraft: "read", ferry: "full",
    techlog: "full", "ai-analyst": "read", telehealth: "none", "doc-ai": "read", iso: "none",
    contracts: "none", finance: "read", audit: "read", users: "none", rbac: "none", settings: "none", jennifer: "read",
  },
  nurse: {
    dashboard: "full", missions: "full", map: "read", dispatch: "read", "flight-planning": "none",
    "special-missions": "full", roster: "read", frms: "none", aircraft: "none", ferry: "none",
    techlog: "none", "ai-analyst": "read", telehealth: "full", "doc-ai": "read", iso: "none",
    contracts: "none", finance: "none", audit: "none", users: "none", rbac: "none", settings: "none", jennifer: "read",
  },
  doctor: {
    dashboard: "full", missions: "full", map: "read", dispatch: "read", "flight-planning": "none",
    "special-missions": "full", roster: "read", frms: "none", aircraft: "none", ferry: "none",
    techlog: "none", "ai-analyst": "full", telehealth: "full", "doc-ai": "full", iso: "read",
    contracts: "read", finance: "none", audit: "read", users: "none", rbac: "none", settings: "none", jennifer: "full",
  },
  dispatcher: {
    dashboard: "full", missions: "full", map: "full", dispatch: "full", "flight-planning": "full",
    "special-missions": "full", roster: "full", frms: "read", aircraft: "read", ferry: "read",
    techlog: "read", "ai-analyst": "full", telehealth: "read", "doc-ai": "read", iso: "none",
    contracts: "none", finance: "read", audit: "read", users: "none", rbac: "none", settings: "none", jennifer: "full",
  },
  engineer: {
    dashboard: "full", missions: "read", map: "read", dispatch: "none", "flight-planning": "none",
    "special-missions": "none", roster: "read", frms: "none", aircraft: "full", ferry: "none",
    techlog: "full", "ai-analyst": "none", telehealth: "none", "doc-ai": "read", iso: "read",
    contracts: "none", finance: "read", audit: "read", users: "none", rbac: "none", settings: "none", jennifer: "none",
  },
  safety: {
    dashboard: "full", missions: "read", map: "read", dispatch: "none", "flight-planning": "read",
    "special-missions": "read", roster: "read", frms: "full", aircraft: "read", ferry: "read",
    techlog: "read", "ai-analyst": "full", telehealth: "none", "doc-ai": "full", iso: "full",
    contracts: "full", finance: "read", audit: "full", users: "read", rbac: "read", settings: "none", jennifer: "full",
  },
  senior_management: {
    dashboard: "full", missions: "full", map: "full", dispatch: "read", "flight-planning": "read",
    "special-missions": "full", roster: "full", frms: "full", aircraft: "full", ferry: "full",
    techlog: "read", "ai-analyst": "full", telehealth: "read", "doc-ai": "full", iso: "full",
    contracts: "full", finance: "full", audit: "full", users: "read", rbac: "read", settings: "read", jennifer: "full",
  },
  admin: {
    dashboard: "full", missions: "full", map: "full", dispatch: "full", "flight-planning": "full",
    "special-missions": "full", roster: "full", frms: "full", aircraft: "full", ferry: "full",
    techlog: "full", "ai-analyst": "full", telehealth: "full", "doc-ai": "full", iso: "full",
    contracts: "full", finance: "full", audit: "full", users: "full", rbac: "full", settings: "full", jennifer: "full",
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
          <button onClick={handleSave}
            className={`px-4 py-2 border text-xs font-semibold rounded-lg transition-colors ${saved ? "bg-green-400/20 border-green-400/30 text-green-400" : "bg-cyan-400/10 hover:bg-cyan-400/20 border-cyan-400/30 text-cyan-400"}`}>
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
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
              {MODULES.map(m => {
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
              {MODULES.map(m => (
                <tr key={m.id} className="border-b border-card-border/50 hover:bg-background/20 transition-colors">
                  <td className="p-2 pl-4 font-medium sticky left-0 bg-card z-10">
                    {m.icon} {m.label}
                  </td>
                  {ROLES.map(r => {
                    const p = (perms[r.id]?.[m.id] ?? "none") as PermLevel;
                    return (
                      <td key={r.id} className="p-2 text-center">
                        <button onClick={() => cyclePermission(r.id, m.id)}
                          className={`px-2 py-0.5 rounded border font-semibold transition-colors w-14 ${permBg(p)} ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}>
                          {p === "full" ? "Full" : p === "read" ? "Read" : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
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
