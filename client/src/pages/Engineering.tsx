import { useState } from "react";
import { type UserRole } from "@/lib/data";
import {
  Wrench, CheckCircle, AlertTriangle, Clock, RefreshCw,
  FileText, Download, ExternalLink, ChevronRight, Settings,
  BarChart2, Shield, Package, Zap, AlertCircle, Plus, X
} from "lucide-react";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole; }

// ── Fleet data with full Veryon maintenance detail ──────────────────────────
const FLEET = [
  {
    rego: "VH-XYJ",
    type: "King Air B200",
    serial: "BB-1842",
    base: "Dubbo (YSDU)",
    status: "Airborne",
    statusColor: "text-cyan-400",
    statusBg: "status-blue",
    maintenanceRelease: true,
    veryonId: "VPA-2024-0041",
    totalTime: "14,822 hrs",
    totalCycles: "9,641",
    lastService: "6-Monthly — 15 May 2026",
    nextService: "120 hr check",
    nextServiceDue: "14,864 hrs (42 hrs remaining)",
    nextServiceDate: "Est. 28 Jun 2026",
    defects: [],
    components: [
      { name: "PT6A-60A Engine #1", partNo: "3034226-2", tsn: "2,140 hrs", tbo: "3,600 hrs", remaining: "1,460 hrs", status: "ok" },
      { name: "PT6A-60A Engine #2", partNo: "3034226-2", tsn: "2,140 hrs", tbo: "3,600 hrs", remaining: "1,460 hrs", status: "ok" },
      { name: "Propeller L/H", partNo: "HC-E4A-3D/E10477", tsn: "2,140 hrs", tbo: "2,400 hrs", remaining: "260 hrs", status: "warn" },
      { name: "Propeller R/H", partNo: "HC-E4A-3D/E10477", tsn: "2,140 hrs", tbo: "2,400 hrs", remaining: "260 hrs", status: "warn" },
      { name: "L/H Main Gear Tyre", partNo: "AER-6120", tsn: "312 cycles", tbo: "450 cycles", remaining: "138 cycles", status: "ok" },
      { name: "Emergency Locator Transmitter", partNo: "406HX-2", tsn: "—", tbo: "Battery: Jan 2027", remaining: "7 months", status: "ok" },
    ],
    mel: [],
  },
  {
    rego: "VH-XYR",
    type: "King Air B200",
    serial: "BB-1956",
    base: "Broken Hill (YBHI)",
    status: "Serviceable",
    statusColor: "text-green-400",
    statusBg: "status-green",
    maintenanceRelease: true,
    veryonId: "VPA-2024-0042",
    totalTime: "12,305 hrs",
    totalCycles: "8,120",
    lastService: "120 hr check — 2 May 2026",
    nextService: "6-Monthly check",
    nextServiceDue: "12,393 hrs (88 hrs remaining)",
    nextServiceDate: "Est. 18 Jul 2026",
    defects: [
      { id: "DEF-042", description: "R/H cabin door seal — minor air leak at cruise altitude", raised: "03 Jun 2026", raisedBy: "Capt. S. Nguyen", category: "Cabin", mel: "MEL 52-10-01", melDays: "10 day MEL — expires 13 Jun 2026", priority: "warn" },
    ],
    components: [
      { name: "PT6A-60A Engine #1", partNo: "3034226-2", tsn: "1,880 hrs", tbo: "3,600 hrs", remaining: "1,720 hrs", status: "ok" },
      { name: "PT6A-60A Engine #2", partNo: "3034226-2", tsn: "1,880 hrs", tbo: "3,600 hrs", remaining: "1,720 hrs", status: "ok" },
      { name: "Propeller L/H", partNo: "HC-E4A-3D/E10477", tsn: "1,880 hrs", tbo: "2,400 hrs", remaining: "520 hrs", status: "ok" },
      { name: "Propeller R/H", partNo: "HC-E4A-3D/E10477", tsn: "1,880 hrs", tbo: "2,400 hrs", remaining: "520 hrs", status: "ok" },
      { name: "L/H Main Gear Tyre", partNo: "AER-6120", tsn: "198 cycles", tbo: "450 cycles", remaining: "252 cycles", status: "ok" },
      { name: "Emergency Locator Transmitter", partNo: "406HX-2", tsn: "—", tbo: "Battery: Mar 2027", remaining: "9 months", status: "ok" },
    ],
    mel: [
      { ref: "MEL 52-10-01", item: "Cabin door seal", expiry: "13 Jun 2026", daysLeft: 8, note: "Flight authorised with captain awareness. Rectification part on order." },
    ],
  },
  {
    rego: "VH-XYU",
    type: "King Air B300",
    serial: "FL-647",
    base: "Dubbo (YSDU)",
    status: "Maintenance",
    statusColor: "text-orange-400",
    statusBg: "status-orange",
    maintenanceRelease: false,
    veryonId: "VPA-2024-0043",
    totalTime: "8,641 hrs",
    totalCycles: "5,210",
    lastService: "In progress — Annual",
    nextService: "Annual / Return to Service",
    nextServiceDue: "Maintenance hold",
    nextServiceDate: "Est. RTS: 10 Jun 2026",
    defects: [
      { id: "DEF-039", description: "Engine #1 oil consumption elevated — within limits but trending", raised: "28 May 2026", raisedBy: "Eng. D. Evans", category: "Powerplant", mel: "Monitor only", melDays: "Ops check each sector", priority: "warn" },
      { id: "DEF-040", description: "R/H brake pack wear — replacement required before RTS", raised: "01 Jun 2026", raisedBy: "Eng. D. Evans", category: "Undercarriage", mel: "AOG pending part", melDays: "Part ETA: 7 Jun 2026", priority: "high" },
      { id: "DEF-041", description: "Altimeter #2 static source check required — annual inspection finding", raised: "03 Jun 2026", raisedBy: "LAME J. Torres", category: "Avionics", mel: "Annual inspection", melDays: "Rectification in progress", priority: "warn" },
    ],
    components: [
      { name: "PT6A-60A Engine #1", partNo: "3034226-2", tsn: "1,240 hrs", tbo: "3,600 hrs", remaining: "2,360 hrs", status: "warn" },
      { name: "PT6A-60A Engine #2", partNo: "3034226-2", tsn: "1,240 hrs", tbo: "3,600 hrs", remaining: "2,360 hrs", status: "ok" },
      { name: "Propeller L/H", partNo: "HC-B4TN-3D/T10282", tsn: "1,240 hrs", tbo: "2,400 hrs", remaining: "1,160 hrs", status: "ok" },
      { name: "Propeller R/H", partNo: "HC-B4TN-3D/T10282", tsn: "1,240 hrs", tbo: "2,400 hrs", remaining: "1,160 hrs", status: "ok" },
      { name: "R/H Brake Pack", partNo: "2606014-1", tsn: "412 cycles", tbo: "400 cycles", remaining: "AOG — replace", status: "fail" },
      { name: "Emergency Locator Transmitter", partNo: "406HX-2", tsn: "—", tbo: "Battery: Jun 2027", remaining: "12 months", status: "ok" },
    ],
    mel: [
      { ref: "DEF-040", item: "R/H Brake Pack", expiry: "AOG", daysLeft: 0, note: "Aircraft grounded pending replacement. Part ETA 7 Jun 2026." },
    ],
  },
];

const WORK_ORDERS = [
  { id: "WO-2026-0088", aircraft: "VH-XYU", type: "Annual Inspection", status: "In Progress", lame: "J. Torres (LAME)", opened: "01 Jun 2026", eta: "10 Jun 2026", priority: "high" },
  { id: "WO-2026-0089", aircraft: "VH-XYU", type: "R/H Brake Pack Replacement", status: "Parts Awaited", lame: "D. Evans", opened: "01 Jun 2026", eta: "07 Jun 2026", priority: "high" },
  { id: "WO-2026-0090", aircraft: "VH-XYR", type: "Cabin Door Seal Replacement", status: "Parts Ordered", lame: "D. Evans", opened: "03 Jun 2026", eta: "12 Jun 2026", priority: "medium" },
  { id: "WO-2026-0091", aircraft: "VH-XYJ", type: "Propeller 2,400 hr Overhaul (both)", status: "Scheduled", lame: "TBA", opened: "05 Jun 2026", eta: "Est. 28 Jun 2026", priority: "medium" },
  { id: "WO-2026-0085", aircraft: "VH-XYR", type: "120 hr Check — Complete", status: "Closed", lame: "J. Torres (LAME)", opened: "28 Apr 2026", eta: "02 May 2026", priority: "low" },
];

// Format hour values to always show one decimal place (e.g. "14,822 hrs" → "14,822.0 hrs")
function formatHrs(val: string): string {
  // Only transform values ending in " hrs" that don't already have a decimal
  return val.replace(/(\d[\d,]*) hrs/g, (_, n) => {
    const num = parseFloat(n.replace(/,/g, ''));
    if (!isNaN(num)) return `${n}.0 hrs`;
    return _ ;
  });
}

function priorityBadge(p: string) {
  if (p === "high") return "status-red";
  if (p === "medium") return "status-orange";
  if (p === "low") return "status-green";
  return "status-blue";
}

function woStatusColor(s: string) {
  if (s === "In Progress") return "text-cyan-400";
  if (s === "Parts Awaited") return "text-amber-400";
  if (s === "Parts Ordered") return "text-amber-400";
  if (s === "Scheduled") return "text-blue-400";
  if (s === "Closed") return "text-green-400";
  return "text-muted-foreground";
}

// ── King Air B200 MEL Knowledge Base ────────────────────────────────────────────────
// keywords match against user-typed remarks/defect description (case insensitive)
const MEL_DB: { ref: string; ata: string; item: string; category: string; limitations: string; keywords: string[] }[] = [
  // ATA 21 — Air Conditioning / Pressurisation
  { ref: "MEL 21-31-01", ata: "21-31", item: "Cabin Altitude Warning Horn",        category: "Cat B — 3 days",   limitations: "Do not operate above 10,000 ft unless cabin pressurised and monitored.",                     keywords: ["cabin altitude","pressure horn","cabin warning","pressurisation horn"] },
  { ref: "MEL 21-50-01", ata: "21-50", item: "Recirculation Fan Inoperative",      category: "Cat C — 10 days",  limitations: "Comfort affected; ensure main flow adequate.",                                             keywords: ["recirculation fan","recirc fan","cabin fan","air circulation"] },
  // ATA 22 — Autopilot
  { ref: "MEL 22-10-01", ata: "22-10", item: "Autopilot Inoperative",              category: "Cat C — 10 days",  limitations: "IFR ops require two-pilot crew. Manual flight only.",                                       keywords: ["autopilot","auto pilot","ap inop","coupler","ap fail"] },
  { ref: "MEL 22-10-02", ata: "22-10", item: "Yaw Damper Inoperative",             category: "Cat C — 10 days",  limitations: "Manual rudder coordination required.",                                                    keywords: ["yaw damper","dutch roll","yaw"] },
  // ATA 23 — Communications
  { ref: "MEL 23-11-01", ata: "23-11", item: "VHF Comm #2 Inoperative",            category: "Cat C — 10 days",  limitations: "VHF #1 must be serviceable. #2 may be deferred.",                                          keywords: ["vhf 2","vhf comm 2","radio 2","comm 2","second radio"] },
  { ref: "MEL 23-50-01", ata: "23-50", item: "Interphone System Inoperative",      category: "Cat C — 10 days",  limitations: "Visual signals between crew required.",                                                   keywords: ["interphone","intercom","cabin interphone","crew intercom"] },
  // ATA 24 — Electrical
  { ref: "MEL 24-30-01", ata: "24-30", item: "DC Generator #1 Inoperative",        category: "Cat B — 3 days",   limitations: "Operate on GPU or single generator. Load shed non-essentials.",                             keywords: ["generator 1","gen 1","dc gen","generator fail","gen fail","electrical gen"] },
  { ref: "MEL 24-60-01", ata: "24-60", item: "External Power Receptacle Inop",    category: "Cat D — 120 days", limitations: "Engine start without GPU required.",                                                       keywords: ["gpu","external power","ground power","external receptacle"] },
  // ATA 25 — Equipment / Furnishings
  { ref: "MEL 25-20-01", ata: "25-20", item: "Passenger Seat Inoperative",         category: "Cat D — 120 days", limitations: "Seat must be placarded inop and not occupied.",                                             keywords: ["seat","passenger seat","pax seat","cabin seat","seat inop"] },
  { ref: "MEL 25-60-01", ata: "25-60", item: "Emergency Lighting Inoperative",     category: "Cat A — as specified",limitations: "Operations limited to daytime VMC only until rectified.",                               keywords: ["emergency light","emerg light","exit light","emergency lighting"] },
  // ATA 26 — Fire Protection
  { ref: "MEL 26-10-01", ata: "26-10", item: "Engine Fire Detection Loop B",       category: "Cat B — 3 days",   limitations: "Loop A must be confirmed serviceable. Crew to monitor EGT closely.",                         keywords: ["fire detect","fire loop","fire detection","engine fire","fire warning"] },
  { ref: "MEL 26-20-01", ata: "26-20", item: "Fire Extinguisher Bottle Low",       category: "Cat B — 3 days",   limitations: "Inspect for leak. Rectify before next dispatch if sole agent.",                              keywords: ["extinguisher","fire bottle","extinguish","fire agent"] },
  // ATA 27 — Flight Controls
  { ref: "MEL 27-60-01", ata: "27-60", item: "Elevator Trim Actuator Slow",        category: "Cat C — 10 days",  limitations: "Manual trim technique required. No single-pilot IFR.",                                       keywords: ["elevator trim","pitch trim","trim actuator","trim slow","trim run"] },
  { ref: "MEL 27-80-01", ata: "27-80", item: "Speed Brake Inoperative",            category: "Cat C — 10 days",  limitations: "Increase stabilised approach speed by 5 kt.",                                               keywords: ["speed brake","speedbrake","spoiler","ground spoiler"] },
  // ATA 28 — Fuel
  { ref: "MEL 28-10-01", ata: "28-10", item: "Fuel Quantity Indicator (one tank)", category: "Cat B — 3 days",   limitations: "Use fuel flow and time to calculate remaining fuel. Ops check each sector.",                  keywords: ["fuel quantity","fuel gauge","fuel indicator","fuel qty","fuel level"] },
  { ref: "MEL 28-40-01", ata: "28-40", item: "Fuel Boost Pump Inoperative",        category: "Cat C — 10 days",  limitations: "Engine-driven pump must be confirmed serviceable. No flight into known icing.",              keywords: ["boost pump","fuel pump","fuel boost","electric pump"] },
  // ATA 29 — Hydraulic
  { ref: "MEL 29-10-01", ata: "29-10", item: "Hydraulic Pressure Low",             category: "Cat B — 3 days",   limitations: "Check for leak. Manual extension of gear required if fluid loss confirmed.",                  keywords: ["hydraulic","hyd pressure","hydraulic pressure","hyd pump","hydraulic fluid"] },
  // ATA 30 — Ice & Rain Protection
  { ref: "MEL 30-10-01", ata: "30-10", item: "Wing De-ice Boot Inoperative",       category: "Cat C — 10 days",  limitations: "No flight into known or forecast icing conditions.",                                          keywords: ["de-ice","deice","wing boot","ice boot","anti-ice boot","icing"] },
  { ref: "MEL 30-21-01", ata: "30-21", item: "Engine Inlet Anti-ice Inoperative",  category: "Cat B — 3 days",   limitations: "No flight into known or forecast icing. Dispatch in VMC only.",                               keywords: ["engine anti-ice","inlet anti-ice","engine heat","inlet heat","bleed anti-ice"] },
  { ref: "MEL 30-40-01", ata: "30-40", item: "Windshield Heat — One Side",         category: "Cat C — 10 days",  limitations: "Affected side to be non-handling pilot side where possible.",                                 keywords: ["windshield heat","window heat","windscreen heat","front heat","glass heat"] },
  // ATA 31 — Instruments
  { ref: "MEL 31-10-01", ata: "31-10", item: "Clock Inoperative",                  category: "Cat D — 120 days", limitations: "Ensure alternate accurate time source available in cockpit.",                               keywords: ["clock","cockpit clock","time piece","elapsed time"] },
  // ATA 32 — Landing Gear
  { ref: "MEL 32-60-01", ata: "32-60", item: "Brake System — One Wheel Inop",      category: "Cat B — 3 days",   limitations: "Ground ops at reduced speed. Anti-skid must be functional on remaining.",                   keywords: ["brake","brakes","brake fail","wheel brake","anti-skid","brake wear","brake pack"] },
  { ref: "MEL 32-41-01", ata: "32-41", item: "Gear Position Indicator — One",      category: "Cat C — 10 days",  limitations: "Visual confirmation of gear position via alternate means.",                                  keywords: ["gear light","gear indicator","gear position","green light","gear down"] },
  // ATA 33 — Lights
  { ref: "MEL 33-10-01", ata: "33-10", item: "Landing Light Inoperative",          category: "Cat C — 10 days",  limitations: "Day operations only unless taxi light serviceable as alternate.",                             keywords: ["landing light","ldg light","nose light","taxi light"] },
  { ref: "MEL 33-40-01", ata: "33-40", item: "Cabin Reading Light Inoperative",    category: "Cat D — 120 days", limitations: "Placard seat below affected light.",                                                       keywords: ["reading light","cabin light","overhead light","cabin reading"] },
  // ATA 34 — Navigation
  { ref: "MEL 34-10-01", ata: "34-10", item: "Pitot Heat — One System",            category: "Cat B — 3 days",   limitations: "No flight into known or forecast icing. VMC only.",                                          keywords: ["pitot heat","pitot","pitot tube","static heat"] },
  { ref: "MEL 34-20-01", ata: "34-20", item: "Radio Altimeter Inoperative",        category: "Cat C — 10 days",  limitations: "Cat I ILS approaches only. No Cat II/III. No LPV DA below 200 ft.",                          keywords: ["radio alt","rad alt","radio altimeter","ra inop","radar altimeter"] },
  { ref: "MEL 34-50-01", ata: "34-50", item: "DME #2 Inoperative",                 category: "Cat C — 10 days",  limitations: "DME #1 must be serviceable.",                                                               keywords: ["dme 2","dme #2","second dme","distance measuring"] },
  { ref: "MEL 34-55-01", ata: "34-55", item: "TCAS Inoperative",                   category: "Cat C — 10 days",  limitations: "Enhanced ATC separation services must be requested. Crew to maintain visual scan.",           keywords: ["tcas","traffic alert","collision avoidance","acas","traffic advisory"] },
  // ATA 35 — Oxygen
  { ref: "MEL 35-10-01", ata: "35-10", item: "Crew Oxygen Pressure Low",           category: "Cat A — as specified",limitations: "Do not operate above 10,000 ft until replenished.",                                      keywords: ["oxygen","o2","crew oxygen","oxygen pressure","oxy","ox system"] },
  // ATA 38 — Water / Waste
  { ref: "MEL 38-30-01", ata: "38-30", item: "Lavatory Water System Inop",         category: "Cat D — 120 days", limitations: "Placard lav out of service. Ensure alternate arrangements for extended sectors.",            keywords: ["lav","lavatory","toilet","water system","waste"] },
  // ATA 52 — Doors
  { ref: "MEL 52-10-01", ata: "52-10", item: "Cabin Door Seal Degraded",           category: "Cat C — 10 days",  limitations: "Captain awareness required. Monitor pressurisation differential at all times.",                keywords: ["door seal","cabin door","door leak","air leak","door sealing","door pressur"] },
  { ref: "MEL 52-40-01", ata: "52-40", item: "Emergency Exit Light Fault",         category: "Cat B — 3 days",   limitations: "Exit must be placarded and passenger briefing reinforced.",                                  keywords: ["emergency exit","exit sign","exit light","emergency door"] },
  // ATA 61 — Propellers
  { ref: "MEL 61-10-01", ata: "61-10", item: "Propeller Sync/Synchrophaser Inop",  category: "Cat C — 10 days",  limitations: "Expect increased vibration. Crew to monitor manually.",                                      keywords: ["prop sync","synchrophaser","propeller sync","synchronizer","prop vibration"] },
  // ATA 71 — Powerplant
  { ref: "MEL 71-00-01", ata: "71-00", item: "Engine #1 Oil Consumption Elevated", category: "Cat C — 10 days",  limitations: "Ops check before each sector. Do not depart if trend exceeds limits.",                       keywords: ["oil consumption","oil trend","oil usage","engine oil","oil pressure","oil level","oil qty"] },
  { ref: "MEL 71-00-02", ata: "71-00", item: "ITT Indicator #1 Unserviceable",     category: "Cat B — 3 days",   limitations: "Cross-check with EGT via EFIS/secondary instrument.",                                       keywords: ["itt","egt","turbine temp","engine temp","turbine indicator","egt gauge"] },
  // ATA 77 — Engine Indicating
  { ref: "MEL 77-10-01", ata: "77-10", item: "Torque Indicator — One Engine",      category: "Cat B — 3 days",   limitations: "Cross-check torque via fuel flow and airspeed reference.",                                   keywords: ["torque","tq indicator","torquemeter","torque gauge","engine torque"] },
  // ATA 79 — Oil
  { ref: "MEL 79-30-01", ata: "79-30", item: "Oil Temp Indicator Inoperative",     category: "Cat B — 3 days",   limitations: "Monitor via secondary engine instrument. Limit power during warm-up.",                        keywords: ["oil temp","oil temperature","oil gauge","temp indicator"] },
];

// ── MEL lookup ─────────────────────────────────────────────────────────────
function searchMEL(text: string) {
  if (text.trim().length < 3) return [];
  const lower = text.toLowerCase();
  return MEL_DB.filter(m =>
    m.keywords.some(kw => lower.includes(kw)) ||
    lower.includes(m.ata) ||
    lower.includes(m.ref.toLowerCase())
  ).slice(0, 5); // max 5 suggestions
}

// ── Defect form blank ──────────────────────────────────────────────────────────
const BLANK_DEFECT = {
  description: "", raisedBy: "", category: "Avionics",
};

// ── MEL form blank ────────────────────────────────────────────────────────────
const BLANK_MEL = {
  ref: "", ata: "", item: "", category: "Cat B — 3 days",
  expiry: "", daysLeft: 90, lame: "", limitations: "", note: "",
};

export default function Engineering({ role }: Props) {
  const [selectedAircraft, setSelectedAircraft] = useState(FLEET[0]);
  const [activeTab, setActiveTab] = useState<"defects" | "components" | "mel">("defects");
  const [melFleet, setMelFleet] = useState<Record<string, any[]>>(
    Object.fromEntries(FLEET.map(f => [f.rego, [...f.mel]]))
  );
  const [showMelModal, setShowMelModal] = useState(false);
  const [melForm, setMelForm] = useState({ ...BLANK_MEL });
  const [melError, setMelError] = useState("");
  const [melSaved, setMelSaved] = useState(false);

  // ── Defect / Remarks modal state ───────────────────────────────────────────
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [defectForm, setDefectForm]   = useState({ ...BLANK_DEFECT });
  const [defectFleet, setDefectFleet] = useState<Record<string, any[]>>(
    Object.fromEntries(FLEET.map(f => [f.rego, [...f.defects]]))
  );
  const [melSuggestions, setMelSuggestions] = useState<typeof MEL_DB>([]);
  const [selectedMelSug, setSelectedMelSug] = useState<typeof MEL_DB[0] | null>(null);
  const [defectError, setDefectError]   = useState("");
  const [defectSaved, setDefectSaved]   = useState(false);
  const defectIdCounter = 100 + Object.values(defectFleet).reduce((s, a) => s + a.length, 0);

  function openDefectModal() {
    setDefectForm({ ...BLANK_DEFECT });
    setMelSuggestions([]);
    setSelectedMelSug(null);
    setDefectError("");
    setDefectSaved(false);
    setShowDefectModal(true);
  }

  function onDescriptionChange(val: string) {
    setDefectForm(p => ({ ...p, description: val }));
    setSelectedMelSug(null);
    setMelSuggestions(searchMEL(val));
  }

  function applyMelSuggestion(m: typeof MEL_DB[0]) {
    setSelectedMelSug(m);
    setMelSuggestions([]);
  }

  function saveDefectEntry() {
    if (!defectForm.description.trim()) return setDefectError("Remarks / defect description is required");
    if (!defectForm.raisedBy.trim())    return setDefectError("Raised by is required");
    const now = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
    const melRef  = selectedMelSug ? selectedMelSug.ref : "Pending assessment";
    const melDays = selectedMelSug ? `${selectedMelSug.category} — check expiry` : "LAME assessment required";
    const entry = {
      id: `DEF-${String(defectIdCounter).padStart(3, "0")}`,
      description: defectForm.description.trim(),
      raised: now,
      raisedBy: defectForm.raisedBy.trim(),
      category: defectForm.category,
      mel: melRef,
      melDays,
      priority: selectedMelSug?.category?.startsWith("Cat A") || selectedMelSug?.category?.startsWith("Cat B") ? "high" : "warn",
    };
    setDefectFleet(prev => ({
      ...prev,
      [selectedAircraft.rego]: [...(prev[selectedAircraft.rego] ?? []), entry],
    }));
    // If MEL suggestion selected, pre-fill MEL form and auto-open MEL tab
    if (selectedMelSug) {
      setMelForm(p => ({
        ...p,
        ref: selectedMelSug.ref,
        ata: selectedMelSug.ata,
        item: selectedMelSug.item,
        category: selectedMelSug.category,
        limitations: selectedMelSug.limitations,
      }));
    }
    setDefectSaved(true);
    setTimeout(() => {
      setShowDefectModal(false);
      if (selectedMelSug) {
        setActiveTab("mel");
        setTimeout(() => setShowMelModal(true), 200);
      }
    }, 900);
  }

  function openMelModal() {
    setMelForm({ ...BLANK_MEL });
    setMelError("");
    setMelSaved(false);
    setShowMelModal(true);
  }

  function saveMelEntry() {
    if (!melForm.ref.trim())   return setMelError("MEL reference is required (e.g. MEL 52-10-01)");
    if (!melForm.ata.trim())   return setMelError("ATA chapter is required (e.g. 52-10)");
    if (!melForm.item.trim())  return setMelError("Item description is required");
    if (!melForm.expiry.trim()) return setMelError("Expiry date is required");
    if (!melForm.lame.trim())  return setMelError("Authorising LAME is required");
    const entry = {
      ref: melForm.ref.trim(),
      item: `${melForm.item.trim()} [ATA ${melForm.ata.trim()}]`,
      expiry: melForm.expiry,
      daysLeft: (() => {
        const d = new Date(melForm.expiry);
        const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
        return diff < 0 ? 0 : diff;
      })(),
      note: `${melForm.category} · Auth: ${melForm.lame.trim()}${melForm.limitations ? " · Limitations: " + melForm.limitations : ""}${melForm.note ? " · " + melForm.note : ""}`,
    };
    setMelFleet(prev => ({
      ...prev,
      [selectedAircraft.rego]: [...(prev[selectedAircraft.rego] ?? []), entry],
    }));
    setMelSaved(true);
    setTimeout(() => setShowMelModal(false), 800);
  }

  function downloadMaintenanceStatus() {
    generatePDF({
      title: "Engineering — Maintenance Status Report",
      subtitle: "Fleet Defects · Work Orders · Component Times · MEL",
      date: new Date().toLocaleDateString("en-AU"),
      reference: "ENG-STATUS-" + new Date().toISOString().slice(0, 10),
      sections: [
        {
          heading: "Fleet Airworthiness Summary",
          rows: FLEET.map(ac => ({
            label: `${ac.rego} (${ac.type})`,
            value: `${ac.status} · MR: ${ac.maintenanceRelease ? "✓ Released" : "✗ Not Released"} · Defects: ${ac.defects.length} · ${ac.nextService}`,
          })),
        },
        {
          heading: "Open Work Orders",
          rows: WORK_ORDERS.filter(w => w.status !== "Closed").map(w => ({
            label: `${w.id} — ${w.aircraft}`,
            value: `${w.type} · ${w.status} · ETA: ${w.eta} · ${w.lame}`,
          })),
        },
        {
          heading: "Active Defects",
          rows: FLEET.flatMap(ac => ac.defects.map((d: any) => ({
            label: `${ac.rego} — ${d.id}`,
            value: `${d.description} · ${d.mel} · ${d.melDays}`,
          }))),
        },
        {
          heading: "Component Life Warnings",
          rows: FLEET.flatMap(ac =>
            ac.components
              .filter((c: any) => c.status !== "ok")
              .map((c: any) => ({
                label: `${ac.rego} — ${c.name}`,
                value: `${formatHrs(c.tsn)} TSN · Remaining: ${formatHrs(c.remaining)} · Status: ${c.status.toUpperCase()}`,
              }))
          ),
        },
        {
          heading: "Veryon Integration",
          rows: [
            { label: "Connection Status", value: "Connected — Veryon Tracking" },
            { label: "Last Sync", value: new Date().toLocaleString("en-AU") },
            { label: "Aircraft Tracked", value: "VH-XYJ, VH-XYR, VH-XYU" },
            { label: "Work Orders Synced", value: `${WORK_ORDERS.length} total, ${WORK_ORDERS.filter(w => w.status !== "Closed").length} open` },
          ],
        },
      ],
    });
  }

  const ac = selectedAircraft;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Engineering
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Veryon Tracking integration · Fleet maintenance · Defects · Work orders · Component life
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Veryon connection badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-400/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-semibold">Veryon Connected</span>
          </div>
          <button
            onClick={downloadMaintenanceStatus}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors font-semibold"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Fleet summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FLEET.map(f => (
          <button
            key={f.rego}
            onClick={() => { setSelectedAircraft(f); setActiveTab("defects"); }}
            className={`text-left p-4 rounded-xl border transition-all ${
              selectedAircraft.rego === f.rego
                ? "bg-cyan-400/10 border-cyan-400/40"
                : "bg-card border-card-border hover:border-cyan-400/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  f.status === "Airborne" ? "bg-cyan-400" :
                  f.status === "Serviceable" ? "bg-green-400" :
                  f.status === "Maintenance" ? "bg-orange-400 animate-pulse" : "bg-red-400"
                }`} />
                <span className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{f.rego}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.statusBg}`}>{f.status}</span>
            </div>
            <div className="text-xs text-muted-foreground">{f.type}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{f.base}</div>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-card-border">
              <span className={`text-[10px] ${f.maintenanceRelease ? "text-green-400" : "text-red-400"} font-semibold`}>
                {f.maintenanceRelease ? "✓ MR" : "✗ MR"}
              </span>
              {f.defects.length > 0 && (
                <span className="text-[10px] text-amber-400 font-semibold">{f.defects.length} defect{f.defects.length > 1 ? "s" : ""}</span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{formatHrs(f.totalTime)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main detail grid */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* ── Left: Aircraft detail ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Aircraft header card */}
          <div className="bg-card rounded-xl border border-card-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{ac.rego}</h2>
                <div className="text-sm text-muted-foreground">{ac.type} · S/N {ac.serial} · {ac.base}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">Veryon ID: {ac.veryonId}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs px-2.5 py-1 rounded-full ${ac.statusBg}`}>{ac.status}</span>
                <span className={`text-xs font-semibold ${ac.maintenanceRelease ? "text-green-400" : "text-red-400"}`}>
                  {ac.maintenanceRelease ? "✓ Maintenance Release Valid" : "✗ No Maintenance Release"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Time", value: formatHrs(ac.totalTime), icon: <Clock size={13} className="text-cyan-400" /> },
                { label: "Total Cycles", value: ac.totalCycles, icon: <RefreshCw size={13} className="text-blue-400" /> },
                { label: "Last Service", value: ac.lastService, icon: <Wrench size={13} className="text-green-400" /> },
                { label: "Next Service Due", value: formatHrs(ac.nextServiceDue), icon: <AlertCircle size={13} className={ac.status === "Maintenance" ? "text-orange-400" : "text-amber-400"} /> },
              ].map((c, i) => (
                <div key={i} className="p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">{c.icon} {c.label}</div>
                  <div className="text-xs font-semibold leading-snug">{c.value}</div>
                </div>
              ))}
            </div>

            {ac.status === "Maintenance" && (
              <div className="mt-4 flex items-center gap-2.5 p-3 bg-orange-500/10 border border-orange-400/20 rounded-lg text-xs text-orange-400">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Aircraft is on maintenance hold — <strong>maintenance release not valid</strong>. Estimated return to service: <strong>{ac.nextServiceDate}</strong>.</span>
              </div>
            )}
          </div>

          {/* Tabs — Defects / Components / MEL */}
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div className="flex border-b border-card-border">
              {(["defects", "components", "mel"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                    activeTab === t
                      ? "border-b-2 border-cyan-400 text-cyan-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "mel" ? "MEL / Deferred" : t.charAt(0).toUpperCase() + t.slice(1)}
                  {t === "defects" && (defectFleet[ac.rego] ?? []).length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[9px]">{(defectFleet[ac.rego] ?? []).length}</span>
                  )}
                  {t === "mel" && ac.mel.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px]">{ac.mel.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Defects tab */}
            {activeTab === "defects" && (
              <div className="p-4">
                {/* Raise Defect button */}
                <div className="mb-4">
                  <button
                    onClick={openDefectModal}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-400/30 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus size={13} /> Raise Defect / Remark
                  </button>
                </div>
                {(defectFleet[ac.rego] ?? []).length === 0 ? (
                  <div className="flex items-center gap-2.5 p-4 text-green-400 text-sm">
                    <CheckCircle size={16} /> No open defects — aircraft fully serviceable
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(defectFleet[ac.rego] ?? []).map((d: any, i: number) => (
                      <div key={i} className={`p-4 rounded-xl border ${d.priority === "high" ? "border-red-400/30 bg-red-500/5" : "border-amber-400/30 bg-amber-500/5"}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={13} className={d.priority === "high" ? "text-red-400" : "text-amber-400"} />
                            <span className="text-xs font-mono font-bold text-muted-foreground">{d.id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${d.priority === "high" ? "status-red" : "status-orange"}`}>{d.category}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{d.raised}</span>
                        </div>
                        <p className="text-sm font-medium mb-2">{d.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                          <span>Raised by: <span className="text-foreground">{d.raisedBy}</span></span>
                          <span>MEL Ref: <span className="text-foreground font-mono">{d.mel}</span></span>
                          <span className="col-span-2 text-amber-400 font-medium">{d.melDays}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Components tab */}
            {activeTab === "components" && (
              <div className="divide-y divide-border">
                {ac.components.map((c: any, i: number) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      c.status === "ok" ? "bg-green-400" :
                      c.status === "warn" ? "bg-amber-400" : "bg-red-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{c.partNo}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-muted-foreground">TSN: {formatHrs(c.tsn)}</div>
                      <div className={`text-[11px] font-semibold ${
                        c.status === "ok" ? "text-green-400" :
                        c.status === "warn" ? "text-amber-400" : "text-red-400"
                      }`}>{formatHrs(c.remaining)} remaining</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MEL tab */}
            {activeTab === "mel" && (
              <div className="p-4">
                {/* Raise MEL button — LAME / engineer / admin only */}
                {(["engineer", "admin", "safety", "senior_management"] as string[]).includes(role) && (
                  <div className="mb-4">
                    <button
                      onClick={openMelModal}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-400/30 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus size={13} /> Raise MEL Item
                    </button>
                  </div>
                )}
                {(melFleet[ac.rego] ?? []).length === 0 ? (
                  <div className="flex items-center gap-2.5 p-4 text-green-400 text-sm">
                    <CheckCircle size={16} /> No deferred items — no active MEL entries
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(melFleet[ac.rego] ?? []).map((m: any, i: number) => (
                      <div key={i} className={`p-4 rounded-xl border ${m.daysLeft === 0 ? "border-red-400/40 bg-red-500/5" : m.daysLeft <= 10 ? "border-amber-400/30 bg-amber-500/5" : "border-card-border"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-cyan-400">{m.ref}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${m.daysLeft === 0 ? "status-red" : m.daysLeft <= 10 ? "status-orange" : "status-green"}`}>
                            {m.daysLeft === 0 ? "AOG" : `Exp: ${m.expiry}`}
                          </span>
                        </div>
                        <div className="text-sm font-medium mb-1">{m.item}</div>
                        <div className="text-xs text-muted-foreground">{m.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Work Orders + Veryon sync ── */}
        <div className="space-y-4">

          {/* Veryon sync panel */}
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Veryon Tracking</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-semibold">Live</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Connection", value: "Connected", color: "text-green-400" },
                { label: "Organisation", value: "RFDS SE Section", color: "text-foreground" },
                { label: "Aircraft Tracked", value: "3 of 3", color: "text-cyan-400" },
                { label: "Open Work Orders", value: `${WORK_ORDERS.filter(w => w.status !== "Closed").length}`, color: "text-amber-400" },
                { label: "Last Sync", value: "Just now", color: "text-green-400" },
                { label: "Defects Synced", value: FLEET.reduce((a, f) => a + f.defects.length, 0).toString(), color: "text-amber-400" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-semibold ${r.color}`}>{r.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-card-border">
                <a
                  href="https://veryontracking.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/5 border border-cyan-500/20 rounded-lg"
                >
                  Open Veryon Portal <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* Work orders */}
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border">
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Work Orders</h2>
            </div>
            <div className="divide-y divide-border">
              {WORK_ORDERS.map((w, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{w.id}</span>
                    <span className={`text-[10px] font-semibold ${woStatusColor(w.status)}`}>{w.status}</span>
                  </div>
                  <div className="text-xs font-semibold leading-snug">{w.type}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{w.aircraft} · ETA: {w.eta}</div>
                  <div className="text-[10px] text-muted-foreground">{w.lame}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet airworthiness quick-view */}
          <div className="bg-card rounded-xl border border-card-border p-4">
            <h2 className="text-sm font-bold mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Fleet Airworthiness</h2>
            <div className="space-y-2.5">
              {FLEET.map(f => (
                <div key={f.rego} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    f.status === "Airborne" ? "bg-cyan-400" :
                    f.status === "Serviceable" ? "bg-green-400" :
                    "bg-orange-400 animate-pulse"
                  }`} />
                  <span className="text-xs font-semibold w-14 shrink-0">{f.rego}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.maintenanceRelease ? "bg-green-400" : "bg-orange-400"}`}
                      style={{ width: f.maintenanceRelease ? "100%" : "40%" }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold shrink-0 ${f.maintenanceRelease ? "text-green-400" : "text-red-400"}`}>
                    {f.maintenanceRelease ? "MR ✓" : "No MR"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── Raise Defect / Remark Modal ────────────────────────────────────────── */}
      {showDefectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Raise Defect / Remark</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedAircraft.rego} · {selectedAircraft.type} · MEL auto-matched as you type</p>
              </div>
              <button onClick={() => setShowDefectModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Remarks & Defect description — MEL auto-search triggers here */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">
                  Remarks / Defect Description *
                  <span className="ml-2 text-cyan-400 normal-case">MEL auto-matched as you type</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the defect or remark e.g. R/H brake pack worn, oil consumption elevated on engine 1, windshield heat L/H inop..."
                  value={defectForm.description}
                  onChange={e => onDescriptionChange(e.target.value)}
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Live MEL Suggestions */}
              {melSuggestions.length > 0 && !selectedMelSug && (
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 overflow-hidden">
                  <div className="px-3 py-2 border-b border-cyan-400/20 flex items-center gap-2">
                    <Zap size={11} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">MEL Matches Found — select to apply</span>
                  </div>
                  <div className="divide-y divide-cyan-400/10">
                    {melSuggestions.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => applyMelSuggestion(m)}
                        className="w-full text-left px-3 py-3 hover:bg-cyan-500/10 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-mono font-bold text-cyan-400">{m.ref}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            m.category.startsWith("Cat A") ? "status-red" :
                            m.category.startsWith("Cat B") ? "status-orange" :
                            m.category.startsWith("Cat C") ? "status-blue" : "status-green"
                          }`}>{m.category}</span>
                        </div>
                        <div className="text-xs font-medium">{m.item}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{m.limitations}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected MEL confirmation */}
              {selectedMelSug && (
                <div className="rounded-xl border border-green-400/30 bg-green-500/5 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-green-400" />
                      <span className="text-xs font-bold text-green-400">MEL Applied</span>
                    </div>
                    <button
                      onClick={() => { setSelectedMelSug(null); setMelSuggestions(searchMEL(defectForm.description)); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >clear</button>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-400 mb-0.5">{selectedMelSug.ref} · ATA {selectedMelSug.ata}</div>
                  <div className="text-xs font-medium mb-1">{selectedMelSug.item}</div>
                  <div className="text-[11px] text-amber-400">{selectedMelSug.category}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">⚠️ {selectedMelSug.limitations}</div>
                  <div className="mt-2 text-[10px] text-cyan-400/80">MEL tab will open automatically to complete the entry after saving.</div>
                </div>
              )}

              {/* Row — Raised By + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Raised By *</label>
                  <input
                    type="text"
                    placeholder="e.g. Capt. J. Smith"
                    value={defectForm.raisedBy}
                    onChange={e => setDefectForm(p => ({ ...p, raisedBy: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">ATA Category</label>
                  <select
                    value={defectForm.category}
                    onChange={e => setDefectForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  >
                    {["Avionics","Powerplant","Airframe","Cabin","Undercarriage","Electrical","Hydraulic","Fuel","Ice Protection","Flight Controls","Other"].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error / Success */}
              {defectError && (
                <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={13} /> {defectError}
                </div>
              )}
              {defectSaved && (
                <div className="flex items-center gap-2 text-green-400 text-xs p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle size={13} /> Defect raised on {selectedAircraft.rego}{selectedMelSug ? " — opening MEL tab…" : ""}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-card-border">
              <button
                onClick={() => setShowDefectModal(false)}
                className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground border border-card-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDefectEntry}
                className="px-5 py-2 text-xs font-bold bg-red-500/20 border border-red-400/40 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                Raise Defect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Raise MEL Modal ─────────────────────────────────────────────────── */}
      {showMelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1623] border border-card-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Raise MEL Item</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedAircraft.rego} · {selectedAircraft.type}</p>
              </div>
              <button onClick={() => setShowMelModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Row 1 — MEL ref + ATA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">MEL Reference *</label>
                  <input
                    type="text"
                    placeholder="e.g. MEL 52-10-01"
                    value={melForm.ref}
                    onChange={e => setMelForm(p => ({ ...p, ref: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">ATA Chapter *</label>
                  <input
                    type="text"
                    placeholder="e.g. 52-10"
                    value={melForm.ata}
                    onChange={e => setMelForm(p => ({ ...p, ata: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Item description */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Item / Defect Description *</label>
                <input
                  type="text"
                  placeholder="Describe the deferred defect"
                  value={melForm.item}
                  onChange={e => setMelForm(p => ({ ...p, item: e.target.value }))}
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Row 2 — Category + Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">MEL Category *</label>
                  <select
                    value={melForm.category}
                    onChange={e => setMelForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option>Cat A — As specified</option>
                    <option>Cat B — 3 days</option>
                    <option>Cat C — 10 days</option>
                    <option>Cat D — 120 days</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Expiry Date *</label>
                  <input
                    type="date"
                    value={melForm.expiry}
                    onChange={e => setMelForm(p => ({ ...p, expiry: e.target.value }))}
                    className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Authorising LAME */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Authorising LAME *</label>
                <input
                  type="text"
                  placeholder="e.g. J. Torres LAME #12345"
                  value={melForm.lame}
                  onChange={e => setMelForm(p => ({ ...p, lame: e.target.value }))}
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Operational limitations */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Operational Limitations / Procedures</label>
                <input
                  type="text"
                  placeholder="e.g. Captain awareness required. No pax in cabin row 2."
                  value={melForm.limitations}
                  onChange={e => setMelForm(p => ({ ...p, limitations: e.target.value }))}
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Additional Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Part on order, rectification expected 10 Jun 2026"
                  value={melForm.note}
                  onChange={e => setMelForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Error */}
              {melError && (
                <div className="flex items-center gap-2 text-red-400 text-xs p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={13} /> {melError}
                </div>
              )}

              {/* Success */}
              {melSaved && (
                <div className="flex items-center gap-2 text-green-400 text-xs p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle size={13} /> MEL entry raised and added to {selectedAircraft.rego}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-card-border">
              <button
                onClick={() => setShowMelModal(false)}
                className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground border border-card-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveMelEntry}
                className="px-5 py-2 text-xs font-bold bg-amber-500/20 border border-amber-400/40 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors"
              >
                Raise MEL Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
