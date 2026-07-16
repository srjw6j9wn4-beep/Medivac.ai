import { useState } from "react";
import type { UserRole } from "@/lib/data";

interface Props { role: UserRole }

type Toggle = { label: string; description: string; value: boolean };

const SECTION_TOGGLES: Record<string, Toggle[]> = {
  notifications: [
    { label: "Mission Status Alerts", description: "Push alerts when mission status changes", value: true },
    { label: "Crew Hour Warnings", description: "Alert when crew within 10% of hour limits", value: true },
    { label: "NOTAM Updates", description: "Receive NOTAM updates for active airports", value: true },
    { label: "APG Release Reminders", description: "Reminder when APG release outstanding >30 min", value: true },
    { label: "Maintenance Due Alerts", description: "Alert when aircraft approaching service interval", value: false },
    { label: "Contract Expiry Warnings", description: "90-day advance warning on contract expiry", value: true },
  ],
  integrations: [
    { label: "APG Aviation Weather", description: "Live weather, METARs, TAFs, SIGMETs", value: true },
    { label: "AvPlan EFB", description: "Flight plan sync via AvPlan integration", value: true },
    { label: "Air Maestro", description: "Roster and crew duty sync", value: true },
    { label: "Veryon Tracking", description: "Aircraft maintenance and defect data", value: true },
    { label: "HealthConnect API", description: "Telehealth session management", value: true },
    { label: "Jotform", description: "Electronic form data ingestion", value: true },
  ],
  security: [
    { label: "Require MFA for all users", description: "Enforce multi-factor authentication", value: true },
    { label: "Session timeout (30 min)", description: "Auto-logout after 30 minutes inactivity", value: true },
    { label: "Audit log all actions", description: "Full activity log for compliance", value: true },
    { label: "IP allowlist enforcement", description: "Restrict login to approved IP ranges", value: false },
    { label: "Data encryption at rest", description: "AES-256 encryption for stored data", value: true },
  ],
};

const API_ENDPOINTS = [
  { label: "APG Weather API", status: "Connected", latency: "142ms", lastSync: "2 min ago" },
  { label: "Air Maestro Roster", status: "Connected", latency: "88ms", lastSync: "5 min ago" },
  { label: "AvPlan EFB", status: "Connected", latency: "210ms", lastSync: "1 min ago" },
  { label: "HealthConnect", status: "Connected", latency: "95ms", lastSync: "30 sec ago" },
  { label: "Jotform Webhook", status: "Connected", latency: "—", lastSync: "On demand" },
  { label: "Veryon Tracking", status: "Connected", latency: "142ms", lastSync: "Just now" },
];

const AUDIT_LOG = [
  { time: "16:10", user: "T. Walsh (Dispatcher)", action: "Dispatched MEDIVAC 01", type: "mission" },
  { time: "15:55", user: "admin@rfds.org.au", action: "Modified RBAC — Nurse role read access to Finance removed", type: "rbac" },
  { time: "14:30", user: "R. Hughes (Pilot)", action: "Submitted tech log entry — VH-MVW", type: "techlog" },
  { time: "13:22", user: "System", action: "APG API token refreshed automatically", type: "system" },
  { time: "12:45", user: "M. Johnson (Management)", action: "Exported Audit Report — May 2026", type: "audit" },
  { time: "11:00", user: "D. Evans (Engineer)", action: "Updated maintenance release — VH-XYR defect #4 added", type: "maintenance" },
];

const logTypeColor = (t: string) => {
  if (t === "mission") return "text-cyan-400";
  if (t === "rbac") return "text-red-400";
  if (t === "techlog") return "text-orange-400";
  if (t === "system") return "text-muted-foreground";
  if (t === "audit") return "text-purple-400";
  return "text-green-400";
};

export default function SystemSettings({ role }: Props) {
  const [tab, setTab] = useState<"general" | "integrations" | "security" | "audit">("general");
  const [toggles, setToggles] = useState(SECTION_TOGGLES);

  const isAdmin = role === "admin";

  const tabs = [
    { id: "general", label: "General & Notifications" },
    { id: "integrations", label: "API Integrations" },
    { id: "security", label: "Security" },
    { id: "audit", label: "Audit Log" },
  ] as const;

  function toggle(section: string, idx: number) {
    if (!isAdmin) return;
    setToggles(prev => ({
      ...prev,
      [section]: prev[section].map((t, i) => i === idx ? { ...t, value: !t.value } : t),
    }));
  }

  function ToggleSection({ section }: { section: string }) {
    return (
      <div className="space-y-2">
        {toggles[section].map((item, i) => (
          <div key={item.label} className="flex items-center justify-between p-3 bg-card border border-card-border rounded-xl">
            <div>
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
            </div>
            <button onClick={() => toggle(section, i)}
              className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ml-4 ${item.value ? "bg-cyan-400" : "bg-background border border-card-border"} ${!isAdmin ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>System Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Application configuration, API integrations, security, and audit log</p>
        </div>
        {!isAdmin && (
          <div className="px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-xs font-semibold text-yellow-400">
            Read-only — Admin access required to modify settings
          </div>
        )}
      </div>

      {/* System health bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "System Status", value: "Operational", color: "text-green-400" },
          { label: "API Connections", value: `${API_ENDPOINTS.filter(a => a.status === "Connected").length}/${API_ENDPOINTS.length}`, color: "text-cyan-400" },
          { label: "Active Sessions", value: "8", color: "text-yellow-400" },
          { label: "Uptime (30d)", value: "99.92%", color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* General / Notifications */}
      {tab === "general" && (
        <div className="space-y-6">
          {/* App info */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
            <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Application Information</div>
            {[
              { label: "Platform", value: "Medivac.ai" },
              { label: "Version", value: "1.0.0-beta" },
              { label: "Environment", value: "Production" },
              { label: "Organisation", value: "RFDS South Eastern Section" },
              { label: "Data Region", value: "ap-southeast-2 (Sydney, AU)" },
              { label: "Build Date", value: "05 Jun 2026" },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs p-2 bg-background/40 rounded-lg">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notification Settings</div>
            <ToggleSection section="notifications" />
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === "integrations" && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connected APIs</div>
          {API_ENDPOINTS.map(api => (
            <div key={api.label} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${api.status === "Connected" ? "bg-green-400" : "bg-red-400"}`} />
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{api.label}</div>
                <div className="text-xs text-muted-foreground">Last sync: {api.lastSync} · Latency: {api.latency}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${api.status === "Connected" ? "status-green" : "status-red"}`}>{api.status}</span>
                {isAdmin && (
                  <button onClick={() => alert(`${api.status === "Connected" ? "Configure" : "Connect"}: ${api.label}\nStatus: ${api.status}${api.status === "Connected" ? "\nLatency: " + api.latency + "\nLast sync: " + api.lastSync : ""}\n\nIn production this would open the API configuration panel.`)} className="px-3 py-1 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
                    {api.status === "Connected" ? "Configure" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-4">Integration Settings</div>
            <ToggleSection section="integrations" />
          </div>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="space-y-6">
          <ToggleSection section="security" />

          <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
            <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Session & Token Configuration</div>
            {[
              { label: "Session Timeout", value: "30 minutes" },
              { label: "JWT Token Expiry", value: "8 hours" },
              { label: "Refresh Token Expiry", value: "7 days" },
              { label: "Password Policy", value: "12 char min, complexity required" },
              { label: "Failed Login Lockout", value: "5 attempts → 15 min lockout" },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-xs p-2 bg-background/40 rounded-lg">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-medium">{r.value}</span>
              </div>
            ))}
            {isAdmin && (
              <button onClick={() => alert("Opening Security Policy editor...\n\nIn production this would allow editing session timeouts, JWT expiry, password policy, and lockout settings.")} className="mt-2 w-full py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
                Edit Security Policy
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === "audit" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</div>
            <button onClick={() => { const rows = [["Time","User","Action","Type"],...AUDIT_LOG.map(l=>[l.time,l.user,l.action,l.type])]; const csv = rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); const a = document.createElement("a"); a.href=url; a.download="audit-log.csv"; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1.5 bg-card border border-card-border hover:bg-background text-xs font-semibold rounded-lg transition-colors">
              Export Full Log
            </button>
          </div>
          {AUDIT_LOG.map((log, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-4">
              <div className="text-xs text-muted-foreground w-10 shrink-0 pt-0.5">{log.time}</div>
              <div className="flex-1">
                <div className="text-sm">{log.action}</div>
                <div className={`text-xs font-semibold mt-0.5 ${logTypeColor(log.type)}`}>{log.user}</div>
              </div>
              <span className={`text-[10px] font-bold uppercase ${logTypeColor(log.type)} px-2 py-0.5 rounded`}>{log.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
