import { useState } from "react";
import type { UserRole } from "@/lib/data";

interface Props { role: UserRole }

const CONTRACTS = [
  {
    id: "CTR001", title: "RFDS SE Pilots EBA 2025", counterparty: "RFDS SE Section", type: "Enterprise Agreement",
    effective: "01 Jan 2025", expiry: "31 Dec 2027", status: "Active", riskLevel: "low",
    keyObligations: [
      { text: "900 hr annual block hours cap", status: "monitoring", lastCheck: "Today" },
      { text: "10-hr minimum rest between shifts", status: "compliant", lastCheck: "Today" },
      { text: "P-day allocation — 1 per 4-day tour", status: "compliant", lastCheck: "Yesterday" },
      { text: "Annual leave entitlement — 5 weeks", status: "compliant", lastCheck: "1 Jun 2026" },
    ],
    daysToExpiry: 939,
  },
  {
    id: "CTR002", title: "NSWAA Aircraft Approval — B200/B350", counterparty: "NSW Ambulance Authority", type: "Operations Approval",
    effective: "01 Jul 2024", expiry: "30 Jun 2026", status: "Expiring Soon", riskLevel: "high",
    keyObligations: [
      { text: "Aircraft in approved configuration", status: "compliant", lastCheck: "Yesterday" },
      { text: "Crew currency maintained", status: "monitoring", lastCheck: "Today" },
      { text: "Annual ops review submission", status: "due", lastCheck: "—" },
    ],
    daysToExpiry: 25,
  },
  {
    id: "CTR003", title: "HealthConnect API — Telehealth SLA", counterparty: "HealthConnect Pty Ltd", type: "Service Agreement",
    effective: "15 Mar 2025", expiry: "14 Mar 2027", status: "Active", riskLevel: "low",
    keyObligations: [
      { text: "99.5% uptime SLA", status: "compliant", lastCheck: "Today" },
      { text: "Data sovereignty — AU servers", status: "compliant", lastCheck: "1 Jun 2026" },
      { text: "Incident response < 4 hrs", status: "compliant", lastCheck: "Yesterday" },
    ],
    daysToExpiry: 648,
  },
  {
    id: "CTR004", title: "APG Aviation Weather — API Licence", counterparty: "Airservices Australia", type: "Data Licence",
    effective: "01 Apr 2025", expiry: "31 Mar 2027", status: "Active", riskLevel: "low",
    keyObligations: [
      { text: "No commercial redistribution of data", status: "compliant", lastCheck: "Auto" },
      { text: "API rate limit — 10,000 req/day", status: "monitoring", lastCheck: "Today" },
    ],
    daysToExpiry: 665,
  },
];

const ALERTS = [
  { level: "high", text: "NSWAA Approval CTR002 expires in 25 days — annual ops review overdue", action: "Submit Review" },
  { level: "medium", text: "EBA pilot hours monitoring: 1 crew member at 91% of annual limit", action: "View Crew" },
  { level: "low", text: "APG API usage at 73% of daily limit — trending up", action: "View Usage" },
];

const statusColor = (s: string) => {
  if (s === "Active") return "status-green";
  if (s === "Expiring Soon") return "status-orange";
  if (s === "Expired") return "status-red";
  return "status-gray";
};
const oblStatus = (s: string) => {
  if (s === "compliant") return { dot: "bg-green-400", label: "Compliant", text: "text-green-400" };
  if (s === "monitoring") return { dot: "bg-yellow-400", label: "Monitoring", text: "text-yellow-400" };
  if (s === "due") return { dot: "bg-red-400", label: "Due", text: "text-red-400" };
  return { dot: "bg-gray-400", label: s, text: "text-muted-foreground" };
};

export default function ContractCompliance({ role }: Props) {
  const [tab, setTab] = useState<"contracts" | "alerts" | "calendar">("contracts");
  const [selected, setSelected] = useState(CONTRACTS[0]);

  const tabs = [
    { id: "contracts", label: "Contracts" },
    { id: "alerts", label: "Compliance Alerts" },
    { id: "calendar", label: "Renewal Calendar" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Contract Compliance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agreement monitoring, obligation tracking, and renewal management</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 bg-red-400/10 border border-red-400/30 rounded-lg text-xs font-semibold text-red-400">1 High Alert</div>
          <div className="px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-xs font-semibold text-yellow-400">1 Medium</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Contracts", value: "4", color: "text-cyan-400" },
          { label: "Expiring <90 days", value: "1", color: "text-orange-400" },
          { label: "Obligations Tracked", value: "13", color: "text-green-400" },
          { label: "Due Actions", value: "1", color: "text-red-400" },
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

      {/* Contracts tab */}
      {tab === "contracts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract list */}
          <div className="space-y-2">
            {CONTRACTS.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${selected.id === c.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-card-border bg-card hover:border-cyan-400/30"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-bold leading-snug" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{c.title}</span>
                  <span className={`badge shrink-0 ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">{c.type}</div>
                <div className={`text-xs font-semibold mt-1 ${c.daysToExpiry < 60 ? "text-orange-400" : "text-muted-foreground"}`}>
                  Expires {c.expiry} ({c.daysToExpiry}d)
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{selected.title}</div>
                <div className="text-xs text-muted-foreground">{selected.counterparty} · {selected.type}</div>
              </div>
              <span className={`badge ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-background/40 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Effective</div>
                <div className="font-semibold">{selected.effective}</div>
              </div>
              <div className="bg-background/40 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Expiry</div>
                <div className={`font-semibold ${selected.daysToExpiry < 60 ? "text-orange-400" : ""}`}>{selected.expiry}</div>
              </div>
            </div>

            {/* Expiry bar */}
            {selected.daysToExpiry < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Days to expiry</span>
                  <span className={selected.daysToExpiry < 60 ? "text-orange-400 font-bold" : ""}>{selected.daysToExpiry} days</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${selected.daysToExpiry < 30 ? "bg-red-400" : "bg-orange-400"}`}
                    style={{ width: `${Math.min(100, (1 - selected.daysToExpiry / 365) * 100)}%` }} />
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Obligations</div>
              <div className="space-y-2">
                {selected.keyObligations.map((o, i) => {
                  const st = oblStatus(o.status);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 bg-background/40 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span className="text-xs">{o.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{o.lastCheck}</span>
                        <span className={`text-[10px] font-semibold ${st.text}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => alert(`Opening ${selected.title}\n\nIn production this would open the full contract document for ${selected.counterparty}.`)} className="flex-1 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
                View Full Contract
              </button>
              <button onClick={() => {
                const d = prompt(`Set reminder for "${selected.title}"\nEnter days before expiry (current: ${selected.daysToExpiry} days):`, '30');
                if (d) alert(`Reminder set — ${d} days before expiry of ${selected.title}.\n(In production this would create a calendar notification.)`);
              }} className="flex-1 py-2 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts tab */}
      {tab === "alerts" && (
        <div className="space-y-3">
          {ALERTS.map((a, i) => (
            <div key={i} className={`bg-card border rounded-xl p-4 flex items-start gap-4 ${a.level === "high" ? "border-red-400/30" : a.level === "medium" ? "border-yellow-400/30" : "border-card-border"}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.level === "high" ? "bg-red-400" : a.level === "medium" ? "bg-yellow-400" : "bg-green-400"}`} />
              <div className="flex-1 text-sm">{a.text}</div>
              <button onClick={() => alert(`Action: ${a.action}\n\n"${a.text}"\n\nIn production this would navigate to the relevant screen.`)} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap">{a.action} →</button>
            </div>
          ))}
        </div>
      )}

      {/* Calendar tab */}
      {tab === "calendar" && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Renewals & Milestones</div>
          {[...CONTRACTS]
            .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
            .map(c => (
              <div key={c.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold border ${c.daysToExpiry < 60 ? "border-orange-400/40 bg-orange-400/10 text-orange-400" : "border-card-border bg-background text-muted-foreground"}`}
                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                  {c.daysToExpiry}d
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.counterparty}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Expires {c.expiry}</div>
                </div>
                <span className={`badge ${statusColor(c.status)}`}>{c.status}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
