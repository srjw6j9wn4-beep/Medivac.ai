import { useState } from "react";
import type { UserRole } from "@/lib/data";
import { ROLES } from "@/lib/data";

interface Props { role: UserRole }

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  base: string;
  status: "Active" | "Inactive" | "Pending";
  lastLogin: string;
  mfa: boolean;
  avatar: string;
}

const USERS: AppUser[] = [
  { id: "U001", name: "R. Hughes", email: "r.hughes@rfds.org.au", role: "pilot", base: "Dubbo", status: "Active", lastLogin: "Today 06:15", mfa: true, avatar: "RH" },
  { id: "U002", name: "T. Barnes", email: "t.barnes@rfds.org.au", role: "pilot", base: "Broken Hill", status: "Active", lastLogin: "Today 07:00", mfa: true, avatar: "TB" },
  { id: "U003", name: "M. Clarke", email: "m.clarke@rfds.org.au", role: "pilot", base: "Dubbo", status: "Active", lastLogin: "Yesterday", mfa: false, avatar: "MC" },
  { id: "U004", name: "S. Mitchell", email: "s.mitchell@rfds.org.au", role: "nurse", base: "Dubbo", status: "Active", lastLogin: "Today 06:20", mfa: true, avatar: "SM" },
  { id: "U005", name: "Dr. K. Patel", email: "k.patel@rfds.org.au", role: "doctor", base: "Dubbo", status: "Active", lastLogin: "Today 06:22", mfa: true, avatar: "KP" },
  { id: "U006", name: "J. O'Brien", email: "j.obrien@rfds.org.au", role: "nurse", base: "Broken Hill", status: "Active", lastLogin: "2 days ago", mfa: true, avatar: "JO" },
  { id: "U007", name: "T. Walsh", email: "t.walsh@rfds.org.au", role: "dispatcher", base: "Dubbo", status: "Active", lastLogin: "Today 05:45", mfa: true, avatar: "TW" },
  { id: "U008", name: "D. Evans", email: "d.evans@rfds.org.au", role: "engineer", base: "Dubbo", status: "Active", lastLogin: "Today 08:00", mfa: false, avatar: "DE" },
  { id: "U009", name: "A. Singh", email: "a.singh@rfds.org.au", role: "safety", base: "Sydney", status: "Active", lastLogin: "Yesterday", mfa: true, avatar: "AS" },
  { id: "U010", name: "M. Johnson", email: "m.johnson@rfds.org.au", role: "senior_management", base: "Sydney", status: "Active", lastLogin: "Today 09:15", mfa: true, avatar: "MJ" },
  { id: "U011", name: "System Admin", email: "admin@rfds.org.au", role: "admin", base: "—", status: "Active", lastLogin: "Today 04:00", mfa: true, avatar: "SA" },
  { id: "U012", name: "P. Nguyen", email: "p.nguyen@rfds.org.au", role: "pilot", base: "Dubbo", status: "Pending", lastLogin: "Never", mfa: false, avatar: "PN" },
];

const statusColor = (s: string) => s === "Active" ? "status-green" : s === "Pending" ? "status-yellow" : "status-gray";

export default function UserManagement({ role }: Props) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [tab, setTab] = useState<"list" | "invite">("list");

  const tabs = [
    { id: "list", label: "All Users" },
    { id: "invite", label: "Invite User" },
  ] as const;

  const filtered = USERS.filter(u => {
    const matchSearch = search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleConfig = (r: UserRole) => ROLES.find(x => x.id === r)!;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team accounts, roles, and access</p>
        </div>
        <button onClick={() => setTab("invite")}
          className="px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors self-start">
          + Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: String(USERS.length), color: "text-cyan-400" },
          { label: "Active", value: String(USERS.filter(u => u.status === "Active").length), color: "text-green-400" },
          { label: "Pending", value: String(USERS.filter(u => u.status === "Pending").length), color: "text-yellow-400" },
          { label: "MFA Enabled", value: String(USERS.filter(u => u.mfa).length), color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters + list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-background border border-card-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400/50 flex-1 min-w-0" />
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className="bg-background border border-card-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400/50">
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              {filtered.map(u => {
                const rc = getRoleConfig(u.role);
                return (
                  <button key={u.id} onClick={() => setSelected(u)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${selected?.id === u.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-card-border bg-card hover:border-cyan-400/30"}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-background border border-card-border flex items-center justify-center text-xs font-bold shrink-0">
                      {u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-semibold ${rc.color}`}>{rc.icon} {rc.label}</span>
                      <span className={`badge ${statusColor(u.status)}`}>{u.status}</span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">No users match your search.</div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-background border border-card-border flex items-center justify-center text-lg font-bold">
                  {selected.avatar}
                </div>
                <div>
                  <div className="text-base font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.email}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { label: "Role", value: getRoleConfig(selected.role).label },
                  { label: "Base", value: selected.base },
                  { label: "Status", value: selected.status },
                  { label: "Last Login", value: selected.lastLogin },
                  { label: "MFA", value: selected.mfa ? "✅ Enabled" : "⚠️ Disabled" },
                  { label: "User ID", value: selected.id },
                ].map(r => (
                  <div key={r.label} className="flex justify-between p-2 bg-background/40 rounded-lg">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>

              {role === "admin" && (
                <div className="space-y-2 pt-2 border-t border-card-border">
                  <div className="text-xs font-semibold text-muted-foreground">Admin Actions</div>
                  <button className="w-full py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
                    Edit Role
                  </button>
                  <button className="w-full py-2 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
                    Reset Password
                  </button>
                  <button className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors">
                    Deactivate Account
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-xl p-5 flex items-center justify-center text-sm text-muted-foreground">
              Select a user to view details
            </div>
          )}
        </div>
      )}

      {tab === "invite" && (
        <div className="max-w-md bg-card border border-card-border rounded-xl p-6 space-y-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Invite New User</div>
          {[
            { label: "Full Name", type: "text", placeholder: "e.g. J. Smith" },
            { label: "Email Address", type: "email", placeholder: "name@rfds.org.au" },
          ].map(f => (
            <div key={f.label} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Role</label>
            <select className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Base</label>
            <select className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
              {["Dubbo", "Broken Hill", "Sydney", "Orange", "Bankstown", "Launceston"].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <button className="w-full py-2.5 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/30 text-cyan-400 text-sm font-semibold rounded-lg transition-colors">
            Send Invitation
          </button>
        </div>
      )}
    </div>
  );
}
