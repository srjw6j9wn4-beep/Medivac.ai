import { useState } from "react";
import {
  Smartphone, Bell, Apple, Play, Users, Clock, Plane, CalendarDays,
  ClipboardList, Radio as RadioIcon, CheckCircle2, Circle, XCircle, Lock,
  Send, ChevronRight, BadgeCheck,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type Tab = "preview" | "notifications";

interface NotifRow {
  key: string;
  label: string;
  detail?: string;
  locked?: boolean;
}

const NOTIF_ROWS: NotifRow[] = [
  { key: "fdp", label: "FDP Warning", detail: "3hr / 2hr / 1hr thresholds" },
  { key: "assignment", label: "New Flight Assignment" },
  { key: "roster", label: "Roster Change" },
  { key: "weather", label: "Weather Alert at Base" },
  { key: "regulatory", label: "Regulatory Change" },
  { key: "sop", label: "SOP Update Published" },
  { key: "defect", label: "Maintenance Defect on My Aircraft" },
  { key: "emergency", label: "Emergency Broadcast", locked: true },
];

const ROSTER_WEEK = [
  { day: "Mon", status: "duty" },
  { day: "Tue", status: "duty" },
  { day: "Wed", status: "today" },
  { day: "Thu", status: "off" },
  { day: "Fri", status: "off" },
  { day: "Sat", status: "duty" },
  { day: "Sun", status: "duty" },
];

const ROADMAP = [
  { label: "Roster view (offline)", status: "done" },
  { label: "FDP countdown timer", status: "done" },
  { label: "Push notifications", status: "done" },
  { label: "Duty log entry", status: "done" },
  { label: "eSignature for manifests", status: "progress", date: "Q4 2026" },
  { label: "Secure crew messaging", status: "progress", date: "Q4 2026" },
  { label: "OFP download", status: "planned", date: "Q1 2027" },
  { label: "EFB integration", status: "planned", date: "Q1 2027" },
];

function RoadmapIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 size={16} className="text-green-400" />;
  if (status === "progress") return <Circle size={16} className="text-amber-400" />;
  return <XCircle size={16} className="text-[#5A5957]" />;
}

export default function CrewMobileApp() {
  const [tab, setTab] = useState<Tab>("preview");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    fdp: true, assignment: true, roster: true, weather: true,
    regulatory: true, sop: true, defect: true, emergency: true,
  });

  const toggle = (key: string) => {
    if (key === "emergency") return;
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "preview", label: "App Preview" },
    { key: "notifications", label: "Push Notification Config" },
  ];

  return (
    <div className="p-6 space-y-5 min-h-screen bg-[#0f1117] text-[#CDCCCA]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={HF}>Crew Mobile App</h1>
        <p className="text-xs text-[#797876] mt-0.5">
          iOS & Android · Push Alerts · Offline Roster · FDP Timer
        </p>
      </div>

      {/* App store badges */}
      <div className="flex flex-wrap gap-3">
        <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#393836] text-[#5A5957] text-sm cursor-not-allowed opacity-60">
          <Apple size={16} /> App Store — Coming Q3 2026
        </button>
        <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#393836] text-[#5A5957] text-sm cursor-not-allowed opacity-60">
          <Play size={16} /> Google Play — Coming Q3 2026
        </button>
      </div>

      {/* Beta banner */}
      <div className="flex items-start gap-3 bg-[#4F98A3]/10 border border-[#4F98A3]/30 rounded-xl p-4">
        <Users size={18} className="text-[#4F98A3] mt-0.5 shrink-0" />
        <div className="text-sm text-[#4F98A3]">
          <span className="font-semibold">Beta Programme</span> — Beta testing open for 15 crew. Contact IT to join.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#393836] pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#4F98A3] text-[#4F98A3]"
                : "border-transparent text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: App Preview */}
      {tab === "preview" && (
        <div className="flex flex-col items-center">
          <div className="max-w-xs mx-auto border-2 border-[#393836] rounded-3xl bg-[#0f1117] p-4 h-[600px] overflow-y-auto relative">
            {/* Status bar / logo */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#4F98A3] flex items-center justify-center">
                  <Plane size={13} className="text-[#0f1117]" />
                </div>
                <span className="text-xs font-bold" style={HF}>Medivac.ai</span>
              </div>
              <div className="relative">
                <Bell size={16} className="text-[#797876]" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-[9px] font-bold text-[#0f1117] rounded-full w-4 h-4 flex items-center justify-center">2</span>
              </div>
            </div>

            <p className="text-sm text-[#CDCCCA] mb-4">Good morning, Capt. Mitchell</p>

            {/* Today */}
            <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#797876] uppercase tracking-wide">Today</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/30 text-green-400">ON DUTY</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={12} className="text-[#4F98A3]" />
                <span className="text-xs text-[#CDCCCA] font-medium">FDP: 8h 24m remaining</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: "70%" }} />
              </div>
            </div>

            {/* Next flight */}
            <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Plane size={12} className="text-[#4F98A3]" />
                <span className="text-[11px] text-[#797876] uppercase tracking-wide">Next Flight</span>
              </div>
              <div className="text-xs font-semibold text-[#CDCCCA]">RFD214 · YSDU → YWCA</div>
              <div className="text-[11px] text-[#797876] mt-0.5">ETD 09:15 · VH-MVW</div>
            </div>

            {/* Roster week */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarDays size={12} className="text-[#797876]" />
                <span className="text-[11px] text-[#797876] uppercase tracking-wide">Roster — This Week</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {ROSTER_WEEK.map(d => (
                  <div
                    key={d.day}
                    className={`flex flex-col items-center py-2 rounded-lg text-[10px] ${
                      d.status === "today"
                        ? "bg-[#4F98A3] text-[#0f1117] font-semibold"
                        : d.status === "duty"
                        ? "bg-[#1C1B19] border border-[#393836] text-[#CDCCCA]"
                        : "bg-[#1C1B19] border border-[#393836] text-[#5A5957]"
                    }`}
                  >
                    <span>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              {["My Roster", "FDP Timer", "Duty Log", "Alert Ops"].map(a => (
                <button key={a} className="bg-[#1C1B19] border border-[#393836] rounded-lg py-2.5 text-[11px] text-[#CDCCCA] hover:border-[#4F98A3]/50">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Push Notification Config */}
      {tab === "notifications" && (
        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#393836] text-left text-xs text-[#797876]">
                <th className="px-5 py-3 font-medium">Notification Type</th>
                <th className="px-5 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {NOTIF_ROWS.map(row => (
                <tr key={row.key} className="border-b border-[#393836] last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="text-[#CDCCCA] font-medium">{row.label}</div>
                    {row.detail && <div className="text-[11px] text-[#797876]">{row.detail}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {row.locked ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#4F98A3]">
                        <Lock size={12} /> Always ON
                      </span>
                    ) : (
                      <button
                        onClick={() => toggle(row.key)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${toggles[row.key] ? "bg-[#4F98A3]" : "bg-[#393836]"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${toggles[row.key] ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-5 border-t border-[#393836]">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4F98A3] text-[#0f1117] text-sm font-semibold hover:bg-[#4F98A3]/90">
              <Send size={14} /> Test Push Notification
            </button>
          </div>
        </div>
      )}

      {/* Feature roadmap */}
      <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4" style={HF}>App Feature Roadmap</h3>
        <div className="space-y-2.5">
          {ROADMAP.map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <RoadmapIcon status={item.status} />
                <span className={`text-sm ${item.status === "done" ? "text-[#CDCCCA]" : item.status === "progress" ? "text-[#CDCCCA]" : "text-[#797876]"}`}>
                  {item.label}
                </span>
              </div>
              {item.date && <span className="text-xs text-[#797876]">{item.date}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
