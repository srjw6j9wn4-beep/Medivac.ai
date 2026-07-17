import { useState } from "react";
import {
  Activity,
  HeartPulse,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RefreshCw,
  Link2,
  CheckCircle2,
  XCircle,
  Bluetooth,
  Radio,
  Thermometer,
  Wind,
  Gauge,
  ClipboardList,
  Settings2,
  ShieldCheck,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type Trend = "up" | "down" | "flat";

interface VitalReading {
  label: string;
  value: string;
  unit: string;
  trend: Trend;
  icon: React.ElementType;
}

interface Monitor {
  id: string;
  name: string;
  online: boolean;
  lastSync: string;
  missionRef: string | null;
  vitals: VitalReading[];
}

const MONITORS: Monitor[] = [
  {
    id: "mon-1",
    name: "Propaq MD — VH-MVW",
    online: true,
    lastSync: "12s ago",
    missionRef: "MRQ-2026-4891",
    vitals: [
      { label: "HR", value: "88", unit: "bpm", trend: "flat", icon: HeartPulse },
      { label: "SpO2", value: "98", unit: "%", trend: "up", icon: Activity },
      { label: "BP", value: "122/78", unit: "mmHg", trend: "down", icon: Gauge },
      { label: "RR", value: "16", unit: "/min", trend: "flat", icon: Wind },
      { label: "Temp", value: "36.8", unit: "°C", trend: "flat", icon: Thermometer },
      { label: "EtCO2", value: "38", unit: "mmHg", trend: "up", icon: Activity },
    ],
  },
  {
    id: "mon-2",
    name: "Propaq MD — VH-XYJ",
    online: true,
    lastSync: "8s ago",
    missionRef: null,
    vitals: [
      { label: "HR", value: "76", unit: "bpm", trend: "down", icon: HeartPulse },
      { label: "SpO2", value: "99", unit: "%", trend: "flat", icon: Activity },
      { label: "BP", value: "118/74", unit: "mmHg", trend: "flat", icon: Gauge },
      { label: "RR", value: "14", unit: "/min", trend: "down", icon: Wind },
      { label: "Temp", value: "36.6", unit: "°C", trend: "flat", icon: Thermometer },
      { label: "EtCO2", value: "36", unit: "mmHg", trend: "flat", icon: Activity },
    ],
  },
  {
    id: "mon-3",
    name: "Philips IntelliVue — VH-MQK",
    online: false,
    lastSync: "14 min ago",
    missionRef: null,
    vitals: [
      { label: "HR", value: "—", unit: "bpm", trend: "flat", icon: HeartPulse },
      { label: "SpO2", value: "—", unit: "%", trend: "flat", icon: Activity },
      { label: "BP", value: "—", unit: "mmHg", trend: "flat", icon: Gauge },
      { label: "RR", value: "—", unit: "/min", trend: "flat", icon: Wind },
      { label: "Temp", value: "—", unit: "°C", trend: "flat", icon: Thermometer },
      { label: "EtCO2", value: "—", unit: "mmHg", trend: "flat", icon: Activity },
    ],
  },
];

interface ImportLogRow {
  timestamp: string;
  monitor: string;
  missionRef: string;
  hr: string;
  spo2: string;
  bp: string;
  importedBy: "Auto" | "Manual";
  status: "Success" | "Error";
}

const IMPORT_LOG: ImportLogRow[] = [
  { timestamp: "16:08:42", monitor: "Propaq MD — VH-MVW", missionRef: "MRQ-2026-4891", hr: "88", spo2: "98%", bp: "122/78", importedBy: "Auto", status: "Success" },
  { timestamp: "16:03:19", monitor: "Propaq MD — VH-MVW", missionRef: "MRQ-2026-4891", hr: "90", spo2: "97%", bp: "124/80", importedBy: "Auto", status: "Success" },
  { timestamp: "15:58:07", monitor: "Propaq MD — VH-XYJ", missionRef: "MRQ-2026-4877", hr: "76", spo2: "99%", bp: "118/74", importedBy: "Auto", status: "Success" },
  { timestamp: "15:52:55", monitor: "Propaq MD — VH-XYJ", missionRef: "MRQ-2026-4877", hr: "78", spo2: "98%", bp: "120/76", importedBy: "Auto", status: "Success" },
  { timestamp: "15:47:31", monitor: "Philips IntelliVue — VH-MQK", missionRef: "MRQ-2026-4860", hr: "102", spo2: "95%", bp: "134/86", importedBy: "Manual", status: "Success" },
  { timestamp: "15:41:12", monitor: "Propaq MD — VH-MVW", missionRef: "MRQ-2026-4891", hr: "91", spo2: "97%", bp: "126/82", importedBy: "Auto", status: "Error" },
  { timestamp: "15:36:48", monitor: "Propaq MD — VH-XYJ", missionRef: "MRQ-2026-4877", hr: "80", spo2: "98%", bp: "121/77", importedBy: "Auto", status: "Success" },
  { timestamp: "15:30:02", monitor: "Philips IntelliVue — VH-MQK", missionRef: "MRQ-2026-4860", hr: "104", spo2: "94%", bp: "136/88", importedBy: "Auto", status: "Success" },
  { timestamp: "15:24:37", monitor: "Propaq MD — VH-MVW", missionRef: "MRQ-2026-4891", hr: "89", spo2: "98%", bp: "123/79", importedBy: "Auto", status: "Success" },
  { timestamp: "15:18:56", monitor: "Propaq MD — VH-XYJ", missionRef: "MRQ-2026-4877", hr: "82", spo2: "97%", bp: "122/78", importedBy: "Auto", status: "Success" },
];

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <ArrowUp className="w-3 h-3 text-green-400 inline" />;
  if (trend === "down") return <ArrowDown className="w-3 h-3 text-amber-400 inline" />;
  return <ArrowRight className="w-3 h-3 text-[#5A5957] inline" />;
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[#797876] text-xs uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-[#CDCCCA]" style={HF}>{value}</span>
    </div>
  );
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const [linkedMission, setLinkedMission] = useState(monitor.missionRef ?? "");
  const canImport = !!linkedMission && monitor.online;

  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 flex flex-col gap-4 flex-1 min-w-[280px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[#CDCCCA] font-semibold text-sm" style={HF}>{monitor.name}</h3>
          <p className="text-[#5A5957] text-xs mt-1">Last sync: {monitor.lastSync}</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap ${
            monitor.online
              ? "bg-green-400/10 text-green-400 border-green-400/30"
              : "bg-red-400/10 text-red-400 border-red-400/30"
          }`}
        >
          {monitor.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {monitor.online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {monitor.vitals.map((v) => (
          <div key={v.label} className="bg-[#0f1117] border border-[#393836] rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#797876] text-[11px]">
              <v.icon className="w-3.5 h-3.5 text-[#4F98A3]" />
              {v.label}
            </div>
            <div className="text-[#CDCCCA] text-lg font-semibold" style={HF}>
              {v.value} <span className="text-xs text-[#797876] font-normal">{v.unit}</span> <TrendIcon trend={v.trend} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[#797876] text-xs">Link to Mission</label>
        <select
          value={linkedMission}
          onChange={(e) => setLinkedMission(e.target.value)}
          className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
        >
          <option value="">— No mission linked —</option>
          <option value="MRQ-2026-4891">MRQ-2026-4891</option>
          <option value="MRQ-2026-4877">MRQ-2026-4877</option>
          <option value="MRQ-2026-4860">MRQ-2026-4860</option>
        </select>
      </div>

      <button
        disabled={!canImport}
        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
          canImport
            ? "bg-[#4F98A3] text-[#0f1117] hover:bg-[#4F98A3]/90"
            : "bg-[#393836] text-[#5A5957] cursor-not-allowed"
        }`}
      >
        <Link2 className="w-4 h-4" />
        Auto-import to Care Record
      </button>
    </div>
  );
}

export default function VitalSignsMonitor() {
  const [tab, setTab] = useState<"live" | "log">("live");

  return (
    <div className="p-6 min-h-screen bg-[#0f1117]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#CDCCCA]" style={HF}>Vital Signs Monitor Integration</h1>
        <p className="text-[#797876] text-sm mt-1">
          Propaq MD · Philips IntelliVue · Auto-import to Patient Care Records
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Monitors Online" value="3" />
        <KPICard label="Auto-imports Today" value="12" />
        <KPICard label="Manual Overrides" value="1" />
        <KPICard label="Sync Lag" value="0.8s avg" />
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#393836]">
        {[
          { id: "live", label: "Live Monitor Feed" },
          { id: "log", label: "Import Log" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "live" | "log")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.id
                ? "border-[#4F98A3] text-[#CDCCCA]"
                : "border-transparent text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {MONITORS.map((m) => (
            <MonitorCard key={m.id} monitor={m} />
          ))}
        </div>
      )}

      {tab === "log" && (
        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#797876] text-xs uppercase border-b border-[#393836]">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Monitor</th>
                <th className="px-4 py-3">Mission Ref</th>
                <th className="px-4 py-3">HR</th>
                <th className="px-4 py-3">SpO2</th>
                <th className="px-4 py-3">BP</th>
                <th className="px-4 py-3">Imported By</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {IMPORT_LOG.map((row, i) => (
                <tr key={i} className="border-b border-[#393836] last:border-0">
                  <td className="px-4 py-3 text-[#CDCCCA]">{row.timestamp}</td>
                  <td className="px-4 py-3 text-[#CDCCCA]">{row.monitor}</td>
                  <td className="px-4 py-3 text-[#797876]">{row.missionRef}</td>
                  <td className="px-4 py-3 text-[#CDCCCA]">{row.hr}</td>
                  <td className="px-4 py-3 text-[#CDCCCA]">{row.spo2}</td>
                  <td className="px-4 py-3 text-[#CDCCCA]">{row.bp}</td>
                  <td className="px-4 py-3 text-[#797876]">{row.importedBy}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        row.status === "Success"
                          ? "bg-green-400/10 text-green-400 border-green-400/30"
                          : "bg-red-400/10 text-red-400 border-red-400/30"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
        <h2 className="text-[#CDCCCA] font-semibold text-base mb-4 flex items-center gap-2" style={HF}>
          <Settings2 className="w-4 h-4 text-[#4F98A3]" />
          Integration Setup
        </h2>

        <div className="flex flex-col gap-3">
          {[
            { name: "Propaq MD", protocol: "Bluetooth LE", icon: Bluetooth, pairing: "Paired — 2 devices", calibration: "Calibrated 10 Jul 2026" },
            { name: "Philips IntelliVue", protocol: "Wi-Fi", icon: Radio, pairing: "Paired — 1 device", calibration: "Calibrated 2 Jul 2026" },
          ].map((row) => (
            <div
              key={row.name}
              className="flex flex-wrap items-center justify-between gap-4 bg-[#0f1117] border border-[#393836] rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <row.icon className="w-5 h-5 text-[#4F98A3]" />
                <div>
                  <p className="text-[#CDCCCA] text-sm font-medium">{row.name}</p>
                  <p className="text-[#797876] text-xs">{row.protocol} · {row.pairing}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#5A5957] text-xs">{row.calibration}</span>
                <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
                <button className="flex items-center gap-1.5 text-xs font-medium text-[#4F98A3] border border-[#4F98A3]/40 rounded-lg px-3 py-1.5 hover:bg-[#4F98A3]/10 transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Test Connection
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 text-[#797876] text-xs bg-[#0f1117] border border-[#393836] rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-[#4F98A3] shrink-0 mt-0.5" />
          <p>
            Propaq vital signs transmitted via Bluetooth LE to the Medivac.ai tablet agent. Data mapped to HL7 FHIR
            Observation resources before writing to the active care record.
          </p>
        </div>
      </div>
    </div>
  );
}
