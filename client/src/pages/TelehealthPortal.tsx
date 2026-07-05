import { useState } from "react";
import type { UserRole } from "@/lib/data";

interface Props { role: UserRole }

const CONSULTS = [
  { id: "TC001", patient: "J. Maher", age: 72, location: "Walgett ED", type: "Cardiac Consult", status: "Active", provider: "Dr. K. Patel", started: "06:22", priority: "P1", notes: "STEMI query — reviewing 12-lead ECG via secure stream" },
  { id: "TC002", patient: "A. Nguyen", age: 34, location: "Broken Hill Hospital", type: "Obs & Gynae", status: "Scheduled", provider: "Dr. L. Watts", started: "09:00", priority: "P2", notes: "28-week review, remote pregnancy monitoring" },
  { id: "TC003", patient: "T. Williams", age: 8, location: "Moree Base Hospital", type: "Paediatric Review", status: "Pending", provider: "Dr. S. O'Brien", started: "10:30", priority: "P2", notes: "Post-op check, appendectomy day 5" },
  { id: "TC004", patient: "M. Bell", age: 55, location: "Lightning Ridge", type: "Mental Health", status: "Complete", provider: "Psych. A. Chen", started: "04:15", priority: "Routine", notes: "Monthly telehealth review, stable" },
];

const STAT_CARDS = [
  { label: "Active Consults", value: "1", color: "text-green-400" },
  { label: "Scheduled Today", value: "4", color: "text-cyan-400" },
  { label: "Pending", value: "2", color: "text-yellow-400" },
  { label: "Completed (24h)", value: "7", color: "text-muted-foreground" },
];

const VITALS = [
  { label: "SpO₂", value: "96%", trend: "▲", ok: true },
  { label: "HR", value: "88 bpm", trend: "→", ok: true },
  { label: "BP", value: "142/88", trend: "▲", ok: false },
  { label: "RR", value: "18/min", trend: "→", ok: true },
  { label: "Temp", value: "37.1°C", trend: "→", ok: true },
  { label: "GCS", value: "15", trend: "→", ok: true },
];

const statusColor = (s: string) => {
  if (s === "Active") return "status-green";
  if (s === "Scheduled") return "status-blue";
  if (s === "Pending") return "status-yellow";
  return "status-gray";
};

const priorityColor = (p: string) => p === "P1" ? "text-red-400" : p === "P2" ? "text-yellow-400" : "text-muted-foreground";

export default function TelehealthPortal({ role }: Props) {
  const [tab, setTab] = useState<"consults" | "session" | "records">("consults");
  const [selected, setSelected] = useState(CONSULTS[0]);
  const [sessionActive, setSessionActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const tabs = [
    { id: "consults", label: "Consult Queue" },
    { id: "session", label: "Live Session" },
    { id: "records", label: "Patient Records" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Telehealth Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Secure remote consultation — integrated patient monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-400/10 border border-green-400/30 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">HealthConnect Secure — Encrypted E2E</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(s => (
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

      {/* Consult Queue */}
      {tab === "consults" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="space-y-2">
            {CONSULTS.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${selected.id === c.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-card-border bg-card hover:border-cyan-400/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{c.patient}</span>
                  <span className={`badge ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">{c.type}</div>
                <div className={`text-xs font-semibold mt-1 ${priorityColor(c.priority)}`}>{c.priority} · {c.started}</div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{selected.patient}, {selected.age}</div>
                <div className="text-xs text-muted-foreground">{selected.location} · {selected.type}</div>
              </div>
              <span className={`badge ${statusColor(selected.status)}`}>{selected.status}</span>
            </div>

            <div className="bg-background/40 rounded-lg p-3 text-sm">{selected.notes}</div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground text-xs">Provider</span><div className="font-medium">{selected.provider}</div></div>
              <div><span className="text-muted-foreground text-xs">Start Time</span><div className="font-medium">{selected.started}</div></div>
              <div><span className="text-muted-foreground text-xs">Priority</span><div className={`font-bold ${priorityColor(selected.priority)}`}>{selected.priority}</div></div>
              <div><span className="text-muted-foreground text-xs">Consult ID</span><div className="font-medium font-mono text-xs">{selected.id}</div></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setTab("session"); setSessionActive(true); }}
                className="flex-1 py-2 bg-green-400/10 hover:bg-green-400/20 border border-green-400/30 text-green-400 text-xs font-semibold rounded-lg transition-colors">
                Join Session
              </button>
              <button className="flex-1 py-2 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
                View Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Session */}
      {tab === "session" && (
        <div className="space-y-4">
          {/* Video area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main video */}
            <div className="lg:col-span-2 bg-card border border-card-border rounded-xl overflow-hidden" style={{ minHeight: 320 }}>
              <div className="relative w-full h-full flex items-center justify-center bg-black/60" style={{ minHeight: 320 }}>
                {sessionActive ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">🏥</div>
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-red-500/80 rounded-full text-xs font-bold text-white">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                    </div>
                    <div className="absolute top-3 right-3 text-xs text-white/60 bg-black/40 px-2 py-1 rounded">{selected.patient} — {selected.location}</div>
                    <div className="absolute bottom-3 right-3 w-28 h-20 bg-card border border-card-border rounded-lg flex items-center justify-center text-3xl">👨‍⚕️</div>
                  </>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-4xl opacity-40">📹</div>
                    <div className="text-sm text-muted-foreground">No active session</div>
                    <button onClick={() => setSessionActive(true)} className="px-4 py-2 bg-green-400/20 border border-green-400/30 text-green-400 text-xs font-semibold rounded-lg">Start Session</button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 p-3 border-t border-card-border">
                <button onClick={() => setMuted(!muted)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${muted ? "bg-red-400/20 border-red-400/30 text-red-400" : "bg-card border-card-border"}`}>
                  {muted ? "🔇 Muted" : "🎙 Mic"}
                </button>
                <button onClick={() => setVideoOff(!videoOff)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${videoOff ? "bg-red-400/20 border-red-400/30 text-red-400" : "bg-card border-card-border"}`}>
                  {videoOff ? "📵 Cam Off" : "📹 Cam"}
                </button>
                <button onClick={() => { setSessionActive(false); setTab("consults"); }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-colors">
                  End Call
                </button>
              </div>
            </div>

            {/* Vitals panel */}
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Patient Vitals</div>
              {VITALS.map(v => (
                <div key={v.label} className={`flex items-center justify-between p-2 rounded-lg ${v.ok ? "bg-background/40" : "bg-red-500/10 border border-red-500/20"}`}>
                  <span className="text-xs text-muted-foreground">{v.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${v.ok ? "text-foreground" : "text-red-400"}`}>{v.value}</span>
                    <span className={`text-xs ${v.ok ? "text-muted-foreground" : "text-red-400"}`}>{v.trend}</span>
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground pt-1 text-center">Updated every 30s via HealthConnect</div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Clinical Notes</div>
            <textarea className="w-full bg-background border border-card-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-cyan-400/50 text-muted-foreground"
              rows={3} placeholder="Enter clinical notes, observations, or management plan during the consult..." defaultValue="" />
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1.5 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">Save Notes</button>
              <button className="px-3 py-1.5 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">Add to Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Records tab */}
      {tab === "records" && (
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Patient Records</div>
            <input type="text" placeholder="Search patient name or ID..." className="bg-background border border-card-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400/50 w-48" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border text-muted-foreground">
                  <th className="text-left py-2 pr-4">Patient</th>
                  <th className="text-left py-2 pr-4">Age</th>
                  <th className="text-left py-2 pr-4">Last Consult</th>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2">Provider</th>
                </tr>
              </thead>
              <tbody>
                {CONSULTS.map(c => (
                  <tr key={c.id} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                    <td className="py-2 pr-4 font-medium">{c.patient}</td>
                    <td className="py-2 pr-4">{c.age}</td>
                    <td className="py-2 pr-4">{c.started}</td>
                    <td className="py-2 pr-4">{c.type}</td>
                    <td className="py-2">{c.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
