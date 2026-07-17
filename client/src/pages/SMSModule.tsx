import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  FileSearch,
  ListChecks,
  Send,
  FileDown,
  Plus,
  UserCircle2,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

type TabId = "report" | "register" | "investigations" | "actions";

interface Hazard {
  id: string;
  description: string;
  likelihood: number;
  severity: number;
  owner: string;
  reviewDate: string;
}

const HAZARDS: Hazard[] = [
  { id: "HZ-001", description: "Single-pilot IFR at night in IMC", likelihood: 3, severity: 5, owner: "Chief Pilot", reviewDate: "01 Sep 2026" },
  { id: "HZ-002", description: "Fatigue — extended FDP during surge periods", likelihood: 4, severity: 4, owner: "FRMS Manager", reviewDate: "15 Aug 2026" },
  { id: "HZ-003", description: "Ramp safety at Broken Hill (vehicle incursions)", likelihood: 3, severity: 3, owner: "Base Manager — BHQ", reviewDate: "20 Aug 2026" },
  { id: "HZ-004", description: "Medical equipment securing during turbulence", likelihood: 2, severity: 4, owner: "Clinical Lead", reviewDate: "10 Sep 2026" },
  { id: "HZ-005", description: "Unfamiliar ALA night landings (grass strips)", likelihood: 2, severity: 5, owner: "Chief Pilot", reviewDate: "05 Sep 2026" },
  { id: "HZ-006", description: "Dangerous goods — oxygen cylinder handling", likelihood: 2, severity: 3, owner: "Ground Ops Supervisor", reviewDate: "30 Aug 2026" },
  { id: "HZ-007", description: "Communication loss in western NSW low-coverage zones", likelihood: 3, severity: 3, owner: "Ops Duty Manager", reviewDate: "12 Aug 2026" },
  { id: "HZ-008", description: "Cabin decompression sickness risk — high altitude cruise", likelihood: 1, severity: 5, owner: "Clinical Director", reviewDate: "25 Sep 2026" },
];

function riskRating(score: number): { label: string; cls: string } {
  if (score >= 20) return { label: "Critical", cls: "bg-red-400/10 text-red-400 border-red-400/30" };
  if (score >= 12) return { label: "High", cls: "bg-orange-400/10 text-orange-400 border-orange-400/30" };
  if (score >= 6) return { label: "Medium", cls: "bg-amber-400/10 text-amber-400 border-amber-400/30" };
  return { label: "Low", cls: "bg-green-400/10 text-green-400 border-green-400/30" };
}

function matrixColor(l: number, s: number): string {
  const score = l * s;
  if (score >= 20) return "bg-red-500/70";
  if (score >= 12) return "bg-orange-500/60";
  if (score >= 6) return "bg-amber-400/50";
  return "bg-green-500/40";
}

interface Investigation {
  id: string;
  occurrence: string;
  investigator: string;
  status: string;
  dueDate: string;
  findings: string;
  rootCause: string;
}

const INVESTIGATIONS: Investigation[] = [
  {
    id: "INV-2026-011",
    occurrence: "OCC-2026-0142 — Hard landing at Dubbo, VH-MVW",
    investigator: "S. Whitfield (Safety Manager)",
    status: "In Progress",
    dueDate: "28 Jul 2026",
    findings: "Preliminary review indicates gusting crosswind (22kt, 40° off runway heading) at time of landing. Flight data recorder pulled and under analysis. Crew interview scheduled 20 Jul 2026.",
    rootCause: "Pending — awaiting FDR analysis and crew interview",
  },
  {
    id: "INV-2026-012",
    occurrence: "OCC-2026-0148 — Medical equipment dislodged in flight, VH-XYJ",
    investigator: "R. Doyle (Deputy Safety Manager)",
    status: "In Progress",
    dueDate: "02 Aug 2026",
    findings: "Portable ventilator mount bracket found with sheared bolt during post-flight check. No injury to crew or patient. Bracket sent for metallurgical failure analysis.",
    rootCause: "Suspected fatigue failure in mounting bracket bolt — awaiting lab confirmation",
  },
];

interface SafetyAction {
  id: string;
  description: string;
  responsible: string;
  dueDate: string;
  status: "Open" | "Overdue" | "Closed";
  linkedInvestigation: string;
}

const SAFETY_ACTIONS: SafetyAction[] = [
  { id: "SA-2026-021", description: "Revise crosswind landing limitations for Dubbo runway 05/23 in ops manual", responsible: "Chief Pilot", dueDate: "05 Aug 2026", status: "Open", linkedInvestigation: "INV-2026-011" },
  { id: "SA-2026-022", description: "Inspect and replace all ventilator mounting bolts fleet-wide", responsible: "Chief Engineer (LAME)", dueDate: "25 Jul 2026", status: "Overdue", linkedInvestigation: "INV-2026-012" },
  { id: "SA-2026-023", description: "Update FRMS fatigue risk triggers for surge-period rostering", responsible: "FRMS Manager", dueDate: "15 Aug 2026", status: "Open", linkedInvestigation: "—" },
  { id: "SA-2026-024", description: "Install additional ramp bollards at Broken Hill apron", responsible: "Base Manager — BHQ", dueDate: "30 Jun 2026", status: "Closed", linkedInvestigation: "—" },
  { id: "SA-2026-025", description: "Refresh dangerous goods handling training for ground crew", responsible: "Ground Ops Supervisor", dueDate: "10 Aug 2026", status: "Open", linkedInvestigation: "—" },
];

const CONTRIBUTING_FACTORS = ["Weather", "Human Factors", "Equipment", "Procedures", "Environment", "Communication"];

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[#797876] text-xs uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-[#CDCCCA]" style={HF}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: SafetyAction["status"] }) {
  const map: Record<SafetyAction["status"], string> = {
    Open: "bg-amber-400/10 text-amber-400 border-amber-400/30",
    Overdue: "bg-red-400/10 text-red-400 border-red-400/30",
    Closed: "bg-green-400/10 text-green-400 border-green-400/30",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[status]}`}>{status}</span>;
}

export default function SMSModule() {
  const [tab, setTab] = useState<TabId>("report");
  const [occurrenceType, setOccurrenceType] = useState("Hazard");
  const [location, setLocation] = useState("Dubbo");
  const [aircraft, setAircraft] = useState("");
  const [description, setDescription] = useState("");
  const [immediateActions, setImmediateActions] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [factors, setFactors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [findingsText, setFindingsText] = useState(INVESTIGATIONS.map((i) => i.findings));

  const toggleFactor = (f: string) => {
    setFactors((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-6 min-h-screen bg-[#0f1117]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#CDCCCA]" style={HF}>Safety Management System</h1>
        <p className="text-[#797876] text-sm mt-1">CASA Part 121.765 · ICAO Annex 19 · Just Culture Policy</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Open Reports" value="7" />
        <KPICard label="Investigations Active" value="2" />
        <KPICard label="Safety Actions Due" value="3" />
        <KPICard label="System Safety Score" value="94/100" />
      </div>

      <div className="flex gap-2 mb-6 border-b border-[#393836] overflow-x-auto">
        {[
          { id: "report", label: "Report Hazard", icon: AlertTriangle },
          { id: "register", label: "Risk Register", icon: ListChecks },
          { id: "investigations", label: "Investigations", icon: FileSearch },
          { id: "actions", label: "Safety Actions", icon: ShieldCheck },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.id ? "border-[#4F98A3] text-[#CDCCCA]" : "border-transparent text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "report" && (
        <div className="flex flex-col gap-5 max-w-3xl">
          <div className="flex items-start gap-3 bg-[#4F98A3]/10 border border-[#4F98A3]/30 rounded-xl p-4">
            <ShieldAlert className="w-5 h-5 text-[#4F98A3] shrink-0 mt-0.5" />
            <p className="text-[#CDCCCA] text-sm">
              This system operates under a Just Culture policy. Anonymous reporting is encouraged and protected under
              CASA CAO 82.3.
            </p>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 flex flex-col gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#797876] text-xs">Occurrence Type</label>
                <select
                  value={occurrenceType}
                  onChange={(e) => setOccurrenceType(e.target.value)}
                  className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                >
                  {["Incident", "Hazard", "Near Miss", "Accident", "Dangerous Goods"].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#797876] text-xs">Date/Time of Occurrence</label>
                <input
                  type="datetime-local"
                  defaultValue="2026-07-17T14:35"
                  className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#797876] text-xs">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                >
                  {["Dubbo", "Broken Hill", "Bankstown", "Essendon", "Launceston", "En Route"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#797876] text-xs">Aircraft</label>
                <input
                  type="text"
                  value={aircraft}
                  onChange={(e) => setAircraft(e.target.value)}
                  placeholder="e.g. VH-MVW"
                  className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#797876] text-xs">Brief Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what happened..."
                className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3] resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#797876] text-xs">Contributing Factors</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CONTRIBUTING_FACTORS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm text-[#CDCCCA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={factors.includes(f)}
                      onChange={() => toggleFactor(f)}
                      className="accent-[#4F98A3] w-4 h-4"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#797876] text-xs">Immediate Actions Taken</label>
              <textarea
                value={immediateActions}
                onChange={(e) => setImmediateActions(e.target.value)}
                rows={2}
                placeholder="Describe immediate actions taken..."
                className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3] resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#797876] text-xs">Reporter Name (optional — anonymous reporting available)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Leave blank to report anonymously"
                className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="self-start flex items-center gap-2 bg-[#4F98A3] text-[#0f1117] rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#4F98A3]/90 transition"
            >
              <Send className="w-4 h-4" />
              Submit Report
            </button>

            {submitted && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Report submitted successfully and logged in the Risk Register.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "register" && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#797876] text-xs uppercase border-b border-[#393836]">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Hazard Description</th>
                  <th className="px-4 py-3">Likelihood</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Review Date</th>
                </tr>
              </thead>
              <tbody>
                {HAZARDS.map((h) => {
                  const score = h.likelihood * h.severity;
                  const rating = riskRating(score);
                  return (
                    <tr key={h.id} className="border-b border-[#393836] last:border-0">
                      <td className="px-4 py-3 text-[#797876]">{h.id}</td>
                      <td className="px-4 py-3 text-[#CDCCCA]">{h.description}</td>
                      <td className="px-4 py-3 text-[#CDCCCA]">{h.likelihood}</td>
                      <td className="px-4 py-3 text-[#CDCCCA]">{h.severity}</td>
                      <td className="px-4 py-3 text-[#CDCCCA]">{score}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rating.cls}`}>
                          {rating.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#797876]">{h.owner}</td>
                      <td className="px-4 py-3 text-[#797876]">{h.reviewDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5">
            <h2 className="text-[#CDCCCA] font-semibold text-base mb-4" style={HF}>Risk Matrix</h2>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map((s) =>
                    [1, 2, 3, 4, 5].map((l) => {
                      const cellHazards = HAZARDS.filter((h) => h.likelihood === l && h.severity === s);
                      return (
                        <div
                          key={`${s}-${l}`}
                          className={`w-16 h-16 rounded-md flex items-center justify-center relative ${matrixColor(l, s)}`}
                          title={`Likelihood ${l} × Severity ${s}`}
                        >
                          {cellHazards.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center justify-center">
                              {cellHazards.map((h) => (
                                <span
                                  key={h.id}
                                  className="w-2.5 h-2.5 rounded-full bg-[#0f1117] border border-white/60"
                                  title={h.id}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((l) => (
                    <span key={l} className="w-16 text-center text-[#797876] text-xs">L{l}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between text-[#797876] text-xs py-1">
                <span>S5</span><span>S4</span><span>S3</span><span>S2</span><span>S1</span>
              </div>
              <div className="flex flex-col gap-2 justify-center ml-4 text-xs">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500/40" /> Low</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-400/50" /> Medium</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-orange-500/60" /> High</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500/70" /> Critical</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "investigations" && (
        <div className="flex flex-col gap-5">
          {INVESTIGATIONS.map((inv, idx) => (
            <div key={inv.id} className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[#CDCCCA] font-semibold text-sm flex items-center gap-2" style={HF}>
                    <FileSearch className="w-4 h-4 text-[#4F98A3]" />
                    {inv.id}
                  </h3>
                  <p className="text-[#797876] text-xs mt-1">{inv.occurrence}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-400/10 text-amber-400 border-amber-400/30">
                  {inv.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-[#797876]">
                  <UserCircle2 className="w-4 h-4 text-[#4F98A3]" /> {inv.investigator}
                </div>
                <div className="flex items-center gap-2 text-[#797876]">
                  <Clock className="w-4 h-4 text-[#4F98A3]" /> Due {inv.dueDate}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#797876] text-xs">Findings So Far</label>
                <textarea
                  value={findingsText[idx]}
                  onChange={(e) =>
                    setFindingsText((prev) => prev.map((f, i) => (i === idx ? e.target.value : f)))
                  }
                  rows={3}
                  className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#797876] text-xs">Root Cause</label>
                <input
                  type="text"
                  defaultValue={inv.rootCause}
                  className="bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
                />
              </div>

              <button className="self-start flex items-center gap-2 border border-[#4F98A3]/40 text-[#4F98A3] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#4F98A3]/10 transition">
                <FileDown className="w-4 h-4" />
                Generate Investigation Report
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "actions" && (
        <div className="flex flex-col gap-4">
          <button className="self-start flex items-center gap-2 bg-[#4F98A3] text-[#0f1117] rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#4F98A3]/90 transition">
            <Plus className="w-4 h-4" />
            Add Safety Action
          </button>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#797876] text-xs uppercase border-b border-[#393836]">
                  <th className="px-4 py-3">SA Number</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Responsible</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Linked Investigation</th>
                </tr>
              </thead>
              <tbody>
                {SAFETY_ACTIONS.map((sa) => (
                  <tr key={sa.id} className="border-b border-[#393836] last:border-0">
                    <td className="px-4 py-3 text-[#797876]">{sa.id}</td>
                    <td className="px-4 py-3 text-[#CDCCCA]">{sa.description}</td>
                    <td className="px-4 py-3 text-[#797876]">{sa.responsible}</td>
                    <td className="px-4 py-3 text-[#797876]">{sa.dueDate}</td>
                    <td className="px-4 py-3"><StatusBadge status={sa.status} /></td>
                    <td className="px-4 py-3 text-[#797876]">{sa.linkedInvestigation}</td>
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
