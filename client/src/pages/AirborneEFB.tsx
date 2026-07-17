import { useState } from "react";
import {
  Plane, AlertTriangle, CheckCircle2, MapPin, Gauge, Wind, Thermometer,
  Fuel, Clock, FileText, Radio, ChevronDown, ChevronUp, Square, CheckSquare,
  CloudSun, Navigation, Send, PhoneCall, Wrench, ShieldAlert,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type Tab = "flight" | "ofp" | "checklists";

interface Waypoint {
  name: string;
  status: "passed" | "current" | "upcoming";
  time: string;
}

const WAYPOINTS: Waypoint[] = [
  { name: "YSDU — Dubbo (Departure)", status: "passed", time: "09:15" },
  { name: "DUBBO VOR", status: "passed", time: "09:22" },
  { name: "COBAR NDB", status: "current", time: "09:58" },
  { name: "YWCA — Wilcannia (Arrival)", status: "upcoming", time: "10:42" },
];

interface Notam {
  id: string;
  location: string;
  text: string;
  validity: string;
  severity: "high" | "medium" | "low";
}

const NOTAMS: Notam[] = [
  {
    id: "C1234/26",
    location: "YWCA",
    text: "RWY 04/22 threshold displaced 180m from northern end due to pavement works. Landing distance available reduced. TORA/LDA amended — refer AIP SUP.",
    validity: "01 Jul 2026 – 31 Aug 2026",
    severity: "high",
  },
  {
    id: "C1189/26",
    location: "DUBBO VOR",
    text: "DBO VOR (112.3) UNRELIABLE beyond 25NM sector 270-320 due scheduled ground equipment calibration. Use GNSS primary means.",
    validity: "05 Jul 2026 – 20 Jul 2026",
    severity: "medium",
  },
  {
    id: "C1201/26",
    location: "COBAR",
    text: "Temporary restricted airspace 15NM radius COBAR NDB SFC-8500FT for aerial firefighting ops. Avoid or contact Cobar Fire Control on 128.1.",
    validity: "10 Jul 2026 – 25 Jul 2026",
    severity: "high",
  },
];

interface ChecklistItem {
  challenge: string;
  response: string;
}

interface ChecklistPhase {
  key: string;
  name: string;
  items: ChecklistItem[];
}

const CHECKLISTS: ChecklistPhase[] = [
  {
    key: "beforeStart",
    name: "Before Start",
    items: [
      { challenge: "Parking Brake", response: "SET" },
      { challenge: "Circuit Breakers", response: "IN / CHECKED" },
      { challenge: "Battery Switch", response: "ON" },
      { challenge: "Avionics Master", response: "OFF" },
      { challenge: "Fuel Quantity", response: "CHECKED — 2,840 LB" },
      { challenge: "Flight Controls", response: "FREE AND CORRECT" },
      { challenge: "Altimeters", response: "SET — QNH 1018" },
      { challenge: "Doors and Hatches", response: "CLOSED AND LOCKED" },
    ],
  },
  {
    key: "afterStart",
    name: "After Start",
    items: [
      { challenge: "Generators", response: "ON — CHECK LOAD" },
      { challenge: "Engine Instruments", response: "CHECKED, WITHIN LIMITS" },
      { challenge: "Avionics Master", response: "ON" },
      { challenge: "Flaps", response: "SET FOR TAKEOFF" },
    ],
  },
  {
    key: "cruise",
    name: "Cruise",
    items: [
      { challenge: "Power", response: "SET — CRUISE CLIMB" },
      { challenge: "Pressurization", response: "CHECKED" },
      { challenge: "Fuel Balance", response: "CHECKED / CROSSFEED AS REQD" },
      { challenge: "Autopilot", response: "ENGAGED, MODES CONFIRMED" },
    ],
  },
  {
    key: "descent",
    name: "Descent",
    items: [
      { challenge: "Altimeters", response: "SET — DESTINATION QNH" },
      { challenge: "Pressurization", response: "SET FOR LANDING" },
      { challenge: "Landing Data", response: "REVIEWED" },
    ],
  },
  {
    key: "approach",
    name: "Approach",
    items: [
      { challenge: "Approach Briefing", response: "COMPLETE" },
      { challenge: "Landing Gear", response: "ARMED / DOWN AT FAF" },
      { challenge: "Flaps", response: "APPROACH SETTING" },
    ],
  },
  {
    key: "landing",
    name: "Landing",
    items: [
      { challenge: "Landing Gear", response: "DOWN, 3 GREEN" },
      { challenge: "Flaps", response: "FULL" },
      { challenge: "Landing Checklist", response: "COMPLETE" },
    ],
  },
];

function StatusPill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${bg} ${color}`}>
      {children}
    </span>
  );
}

function DataCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
      <div className="flex items-center gap-2 text-[#797876] text-xs mb-1.5">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-[#CDCCCA]" style={HF}>{value}</div>
      {sub && <div className="text-[11px] text-[#5A5957] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AirborneEFB() {
  const [tab, setTab] = useState<Tab>("flight");
  const [chartSel, setChartSel] = useState<"enroute" | "approach" | "airport">("enroute");
  const [expanded, setExpanded] = useState<string | null>("beforeStart");
  const [checked, setChecked] = useState<Record<string, boolean>>({
    "beforeStart-0": true, "beforeStart-1": true, "beforeStart-2": true,
    "beforeStart-3": true, "beforeStart-4": true, "beforeStart-5": true,
    "beforeStart-6": false, "beforeStart-7": false,
  });

  const toggleCheck = (key: string) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const beforeStartDone = CHECKLISTS[0].items.filter((_, i) => checked[`beforeStart-${i}`]).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "flight", label: "Active Flight" },
    { key: "ofp", label: "OFP & Charts" },
    { key: "checklists", label: "Checklists" },
  ];

  return (
    <div className="p-6 space-y-5 min-h-screen bg-[#0f1117] text-[#CDCCCA]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={HF}>Airborne EFB</h1>
          <p className="text-xs text-[#797876] mt-0.5">
            Electronic Flight Bag · CASA TSO-C165a · OFP Integration · Offline-Capable
          </p>
        </div>
      </div>

      {/* Certification banner */}
      <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
        <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-400">
          <span className="font-semibold">Certification in progress</span> — CASA TSO-C165a application submitted 1 Jul 2026. Estimated approval: Q1 2027.
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

      {/* TAB 1: Active Flight */}
      {tab === "flight" && (
        <div className="space-y-5">
          {/* Top bar */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex flex-wrap items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <Plane size={15} className="text-[#4F98A3]" />
              <span className="text-[#797876]">Flight</span>
              <span className="font-semibold">RFD214</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#797876]">Aircraft</span>
              <span className="font-semibold">VH-MVW</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation size={14} className="text-[#797876]" />
              <span className="font-semibold">YSDU → YWCA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#797876]">ETD</span>
              <span className="font-semibold">09:15</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#797876]">Captain</span>
              <span className="font-semibold">Mitchell</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Flight progress track */}
            <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4" style={HF}>Flight Progress</h3>
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#393836]" />
                {WAYPOINTS.map((wp, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div
                      className={`absolute -left-[1px] top-0.5 w-4 h-4 rounded-full border-2 ${
                        wp.status === "current"
                          ? "bg-[#4F98A3] border-[#4F98A3] shadow-[0_0_8px_2px_rgba(79,152,163,0.5)]"
                          : wp.status === "passed"
                          ? "bg-[#393836] border-[#5A5957]"
                          : "bg-[#0f1117] border-[#393836]"
                      }`}
                    />
                    <div className="ml-6">
                      <div className={`text-sm font-medium ${wp.status === "current" ? "text-[#4F98A3]" : wp.status === "passed" ? "text-[#797876]" : "text-[#5A5957]"}`}>
                        {wp.name}
                      </div>
                      <div className="text-[11px] text-[#5A5957] mt-0.5">
                        {wp.status === "passed" && `Passed ${wp.time}`}
                        {wp.status === "current" && `Overhead ~${wp.time}`}
                        {wp.status === "upcoming" && `ETA ${wp.time}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time data */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <DataCard icon={<Gauge size={13} />} label="Altitude" value="FL120" />
                <DataCard icon={<Gauge size={13} />} label="Ground Speed" value="243 kt" />
                <DataCard icon={<Wind size={13} />} label="Wind" value="270/18kt" />
                <DataCard icon={<Thermometer size={13} />} label="OAT" value="-8°C" />
                <DataCard icon={<Fuel size={13} />} label="Fuel Remaining" value="2,840 lb" />
                <DataCard icon={<Clock size={13} />} label="ETA YWCA" value="10:42" />
              </div>

              {/* Weather */}
              <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CloudSun size={15} className="text-[#4F98A3]" />
                  <h3 className="text-sm font-semibold" style={HF}>YWCA METAR</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-[#797876]">Conditions</div>
                  <div className="text-right font-medium">CAVOK</div>
                  <div className="text-[#797876]">Temperature</div>
                  <div className="text-right font-medium">14°C</div>
                  <div className="text-[#797876]">Wind</div>
                  <div className="text-right font-medium">220/08kt</div>
                  <div className="text-[#797876]">QNH</div>
                  <div className="text-right font-medium">1018</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFP & Charts */}
      {tab === "ofp" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* OFP summary */}
            <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={15} className="text-[#4F98A3]" />
                <h3 className="text-sm font-semibold" style={HF}>Operational Flight Plan — RFD214</h3>
              </div>
              <div className="space-y-2 text-xs font-mono bg-[#0f1117] border border-[#393836] rounded-lg p-3 text-[#CDCCCA]">
                <div>ROUTE: YSDU DBO COBAR YWCA</div>
                <div>ALTN 1: YSSY — Sydney (168NM)</div>
                <div>ALTN 2: YBHI — Broken Hill (142NM)</div>
                <div>CRUISE ALT: FL120</div>
                <div>BLOCK FUEL: 3,420 LB</div>
                <div>TRIP FUEL: 2,180 LB</div>
                <div>RESERVE FUEL: 660 LB (45 MIN)</div>
                <div>ETE: 1H27M</div>
                <div>NOTAM COUNT: 3</div>
              </div>
            </div>

            {/* NOTAMs */}
            <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={15} className="text-amber-400" />
                <h3 className="text-sm font-semibold" style={HF}>NOTAMs — Route</h3>
              </div>
              <div className="space-y-3">
                {NOTAMS.map(n => (
                  <div key={n.id} className="border border-[#393836] rounded-lg p-3 bg-[#0f1117]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#4F98A3]">{n.id} · {n.location}</span>
                      <StatusPill
                        color={n.severity === "high" ? "text-red-400" : "text-amber-400"}
                        bg={n.severity === "high" ? "bg-red-400/10 border-red-400/30" : "bg-amber-400/10 border-amber-400/30"}
                      >
                        {n.severity === "high" ? "Critical" : "Caution"}
                      </StatusPill>
                    </div>
                    <p className="text-xs text-[#797876] leading-relaxed">{n.text}</p>
                    <p className="text-[11px] text-[#5A5957] mt-1.5">Valid: {n.validity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart selector */}
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-sm font-semibold" style={HF}>Charts</h3>
              <StatusPill color="text-green-400" bg="bg-green-400/10 border-green-400/30">
                <CheckCircle2 size={12} /> Charts loaded offline
              </StatusPill>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setChartSel("enroute")}
                className={`px-4 py-2 text-xs rounded-lg border ${chartSel === "enroute" ? "bg-[#4F98A3]/15 border-[#4F98A3] text-[#4F98A3]" : "border-[#393836] text-[#797876] hover:text-[#CDCCCA]"}`}
              >
                Enroute
              </button>
              <button
                onClick={() => setChartSel("approach")}
                className={`px-4 py-2 text-xs rounded-lg border ${chartSel === "approach" ? "bg-[#4F98A3]/15 border-[#4F98A3] text-[#4F98A3]" : "border-[#393836] text-[#797876] hover:text-[#CDCCCA]"}`}
              >
                Approach — YWCA VOR/DME RWY 04
              </button>
              <button
                onClick={() => setChartSel("airport")}
                className={`px-4 py-2 text-xs rounded-lg border ${chartSel === "airport" ? "bg-[#4F98A3]/15 border-[#4F98A3] text-[#4F98A3]" : "border-[#393836] text-[#797876] hover:text-[#CDCCCA]"}`}
              >
                Airport — YWCA Ground
              </button>
            </div>
            <div className="bg-[#0f1117] border border-[#393836] rounded-lg h-64 flex flex-col items-center justify-center text-[#5A5957]">
              <MapPin size={28} className="mb-2" />
              <p className="text-sm">
                {chartSel === "enroute" && "Enroute Chart — YSDU to YWCA"}
                {chartSel === "approach" && "YWCA VOR/DME RWY 04 Approach Plate"}
                {chartSel === "airport" && "YWCA Airport Ground Chart"}
              </p>
              <p className="text-xs mt-1">Rendered from offline chart cache</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Checklists */}
      {tab === "checklists" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
            <h3 className="text-sm font-semibold" style={HF}>B200 Checklists</h3>
            <span className="text-xs text-[#797876]">
              Before Start: <span className="text-[#4F98A3] font-semibold">{beforeStartDone}/{CHECKLISTS[0].items.length} complete</span>
            </span>
          </div>

          {CHECKLISTS.map(phase => (
            <div key={phase.key} className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === phase.key ? null : phase.key)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02]"
              >
                <span className="text-sm font-semibold">{phase.name}</span>
                {expanded === phase.key ? <ChevronUp size={16} className="text-[#797876]" /> : <ChevronDown size={16} className="text-[#797876]" />}
              </button>
              {expanded === phase.key && (
                <div className="px-5 pb-4 space-y-2 border-t border-[#393836] pt-3">
                  {phase.items.map((item, i) => {
                    const key = `${phase.key}-${i}`;
                    const isChecked = !!checked[key];
                    return (
                      <div
                        key={key}
                        onClick={() => toggleCheck(key)}
                        className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-[#4F98A3] shrink-0" />
                          ) : (
                            <Square size={16} className="text-[#5A5957] shrink-0" />
                          )}
                          <span className={`text-sm ${isChecked ? "text-[#5A5957] line-through" : "text-[#CDCCCA]"}`}>
                            {item.challenge}
                          </span>
                        </div>
                        <span className={`text-xs font-mono ${isChecked ? "text-[#5A5957]" : "text-[#797876]"}`}>
                          {item.response}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom quick-access */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#4F98A3] text-[#0f1117] text-sm font-semibold hover:bg-[#4F98A3]/90">
          <Send size={14} /> Send PIREP
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-400/10 border border-red-400/40 text-red-400 text-sm font-semibold hover:bg-red-400/20">
          <AlertTriangle size={14} /> Declare Emergency
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#393836] text-[#CDCCCA] text-sm font-semibold hover:bg-white/[0.03]">
          <PhoneCall size={14} /> Contact Ops
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#393836] text-[#CDCCCA] text-sm font-semibold hover:bg-white/[0.03]">
          <Wrench size={14} /> Log Defect
        </button>
      </div>
    </div>
  );
}
