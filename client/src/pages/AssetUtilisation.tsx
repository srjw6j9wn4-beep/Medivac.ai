import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import {
  Plane, TrendingUp, Wrench, DollarSign, Calendar, BarChart2,
  AlertTriangle, ChevronDown, ChevronUp, Info, Zap, Clock,
  CheckCircle, XCircle, MinusCircle, RefreshCw, Filter,
  ArrowRight, Repeat, Users, Shield, Lightbulb, Lock, Unlock, Settings,
  Plus, Pencil, Trash2, X, Save, ChevronRight, GripVertical
} from "lucide-react";

interface Props { role: UserRole; }

// ── Aircraft hourly rates (AUD excl. GST) ────────────────────────────────
const AIRCRAFT_RATES: Record<string, number> = {
  B200: 4000, B200C: 4000, B350: 4800, PC24: 6000,
  HELO: 8500, CL60: 9500, PC12: 3200,
};
const AIRCRAFT_TYPES: Record<string, string> = {
  "VH-LTQ": "B200C", "VH-MQD": "B350",  "VH-MQK": "B350",
  "VH-MVW": "B200",  "VH-MVX": "B200C", "VH-MWH": "B200",
  "VH-MWK": "B200C", "VH-NAJ": "B350",  "VH-RFD": "B200C",
  "VH-XYJ": "B200C", "VH-XYO": "B200C", "VH-XYR": "B200",
  "VH-VPQ": "B350",  "VH-XYU": "B200",
};
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ──────────────────────────────────────────────────────────────────
// CONTRACT COVERAGE OPTIMISER
// ──────────────────────────────────────────────────────────────────

// Clinical qualification tiers (higher = more capable, can cover lower tiers)
// CRITICAL: tiers are NOT interchangeable — a lower-tier crew cannot cover a higher-tier contract.
// Base clinical capabilities are hardcoded from operational knowledge and cannot be auto-detected.
type ClinicalTier = "NEPT" | "EMERGENCY_BASIC" | "EMERGENCY_ADVANCED" | "MICA" | "INTENSIVE_CARE";

const CLINICAL_TIER_ORDER: ClinicalTier[] = [
  "NEPT", "EMERGENCY_BASIC", "EMERGENCY_ADVANCED", "MICA", "INTENSIVE_CARE"
];
function tierCanCover(assetTier: ClinicalTier, contractTier: ClinicalTier): boolean {
  return CLINICAL_TIER_ORDER.indexOf(assetTier) >= CLINICAL_TIER_ORDER.indexOf(contractTier);
}

const TIER_LABELS: Record<ClinicalTier, string> = {
  NEPT: "NEPT",
  EMERGENCY_BASIC: "Emergency",
  EMERGENCY_ADVANCED: "Emergency+",
  MICA: "MICA",
  INTENSIVE_CARE: "ICU",
};
const TIER_COLOURS: Record<ClinicalTier, string> = {
  NEPT:               "bg-blue-500/15 border-blue-500/40 text-blue-300",
  EMERGENCY_BASIC:    "bg-amber-500/15 border-amber-500/40 text-amber-300",
  EMERGENCY_ADVANCED: "bg-orange-500/15 border-orange-500/40 text-orange-300",
  MICA:               "bg-red-500/15 border-red-500/40 text-red-300",
  INTENSIVE_CARE:     "bg-purple-500/15 border-purple-500/40 text-purple-300",
};

// ── Contract definitions ────────────────────────────────────────────────
interface Contract {
  id: string;
  name: string;                   // e.g. "NEPT Standing Contract"
  client: string;                 // e.g. "NSW Health"
  serviceCode: string;            // matches morning brief service code
  currentBase: string;            // base currently serving this
  currentAircraft: string;        // rego currently assigned
  requiredDows: number[];         // days contract MUST be covered (0=Sun)
  minDaysPerWeek: number;         // contractual minimum
  clinicalTierRequired: ClinicalTier;
  annualContractValue: number;    // AUD excl. GST (0 if unknown)
  notes?: string;
}

interface FleetAsset {
  aircraft: string;
  base: string;
  aircraftType: string;
  clinicalTier: ClinicalTier;     // crew qualification at this base
  idleDows: number[];             // days currently idle (from pattern analysis, or manual)
  canCoverNEPT: boolean;          // explicit flag for cross-base NEPT coverage eligibility
  notes?: string;
}

interface CoverageShift {
  contractId: string;
  contract: Contract;
  coveringAsset: FleetAsset;
  shiftDays: number[];            // days the covering asset takes over
  releasedAsset: FleetAsset;      // original asset now freed
  releasedDays: number[];         // days the original asset is freed
  repurposeTo: string;            // label for what the freed asset does
  repurposeRevenue: number;       // AUD/year from repurposed days
  repurposeHoursPerDay: number;
  repurposeRate: number;
  feasible: boolean;
  blockers: string[];             // reasons why it isn't feasible (quals, base, etc.)
  insight: string;                // human-readable explanation
}

// ── Hardcoded asset registry (clinical tiers from operational knowledge) ──
const FLEET_ASSETS: FleetAsset[] = [
  { aircraft: "VH-LTQ", base: "BK",  aircraftType: "B200C", clinicalTier: "NEPT",            idleDows: [0,6], canCoverNEPT: true  },
  { aircraft: "VH-MVW", base: "DU",  aircraftType: "B200",  clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: true  },
  { aircraft: "VH-MVX", base: "BHI", aircraftType: "B200C", clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: true  },
  { aircraft: "VH-MWH", base: "BK",  aircraftType: "B200",  clinicalTier: "NEPT",            idleDows: [0,6], canCoverNEPT: true  },
  { aircraft: "VH-MWK", base: "BK",  aircraftType: "B200C", clinicalTier: "NEPT",            idleDows: [0,6], canCoverNEPT: true  },
  { aircraft: "VH-NAJ", base: "BHI", aircraftType: "B350",  clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: true  },
  { aircraft: "VH-RFD", base: "TAS", aircraftType: "B200C", clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: true  },
  { aircraft: "VH-XYJ", base: "DU",  aircraftType: "B200C", clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: false },
  { aircraft: "VH-XYO", base: "BK",  aircraftType: "B200C", clinicalTier: "NEPT",            idleDows: [0,6], canCoverNEPT: true  },
  { aircraft: "VH-XYR", base: "BHI", aircraftType: "B200",  clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: true  },
  { aircraft: "VH-VPQ", base: "BK",  aircraftType: "B350",  clinicalTier: "NEPT",            idleDows: [0,6], canCoverNEPT: true, notes: "Passenger-configured only" },
  { aircraft: "VH-XYU", base: "DU",  aircraftType: "B200",  clinicalTier: "EMERGENCY_ADVANCED", idleDows: [],    canCoverNEPT: false, notes: "Passenger-configured only" },
];

// ── Default contract registry ────────────────────────────────────────────
const DEFAULT_CONTRACTS: Contract[] = [
  {
    id: "NEPT-DU-001",
    name: "NEPT Standing Contract",
    client: "NSW Health",
    serviceCode: "DU-NEPT",
    currentBase: "DU",
    currentAircraft: "VH-MVW",
    requiredDows: [1,2,3,4,5],    // Mon–Fri
    minDaysPerWeek: 5,
    clinicalTierRequired: "NEPT",
    annualContractValue: 0,
    notes: "1 aircraft + pilot + nurse required. Currently served from Dubbo.",
  },
  {
    id: "ANSW-EMR-001",
    name: "ANSW Emergency Contract",
    client: "Ambulance NSW",
    serviceCode: "DU-AMB-D1",
    currentBase: "DU",
    currentAircraft: "VH-MVW",
    requiredDows: [0,1,2,3,4,5,6], // 7 days
    minDaysPerWeek: 7,
    clinicalTierRequired: "EMERGENCY_ADVANCED",
    annualContractValue: 0,
    notes: "Requires Emergency+ clinical qualifications. Bankstown crew does not hold these quals.",
  },
  {
    id: "NEPT-BK-001",
    name: "NEPT Bankstown Contract",
    client: "NSW Health",
    serviceCode: "BK-NEPT",
    currentBase: "BK",
    currentAircraft: "VH-LTQ",
    requiredDows: [1,2,3,4,5],    // Mon–Fri
    minDaysPerWeek: 5,
    clinicalTierRequired: "NEPT",
    annualContractValue: 0,
    notes: "Bankstown NEPT asset is not rostered weekends or public holidays.",
  },
];

// ── Coverage shift engine ────────────────────────────────────────────────
function analyseCoverageShifts(
  contracts: Contract[],
  assets: FleetAsset[],
  servicePatterns: ServicePattern[],
): CoverageShift[] {
  const shifts: CoverageShift[] = [];

  for (const contract of contracts) {
    const currentAsset = assets.find(a => a.aircraft === contract.currentAircraft);
    if (!currentAsset) continue;

    // Look for OTHER assets that:
    // 1. Can clinically cover the contract
    // 2. Have idle days that overlap with the contract's required days
    // 3. Are a different base from the current serving asset (cross-base shift)
    for (const candidate of assets) {
      if (candidate.aircraft === contract.currentAircraft) continue;
      if (candidate.base === contract.currentBase) continue; // same-base shift is trivial, skip

      const blockers: string[] = [];

      // Clinical tier check
      if (!tierCanCover(candidate.clinicalTier, contract.clinicalTierRequired)) {
        blockers.push(`${candidate.aircraft} at ${candidate.base} holds ${TIER_LABELS[candidate.clinicalTier]} quals — contract requires ${TIER_LABELS[contract.clinicalTierRequired]}`);
      }

      // Can this candidate cover NEPT if required?
      if (contract.clinicalTierRequired === "NEPT" && !candidate.canCoverNEPT) {
        blockers.push(`${candidate.aircraft} not configured for NEPT patient transfer`);
      }

      // Overlap: which of the contract's required days can the candidate cover?
      // Use pattern data if available, else use the asset's declared idle days
      const pattern = servicePatterns.find(p => p.aircraft === candidate.aircraft);
      const candidateIdleDays = pattern
        ? pattern.idleDays
        : candidate.idleDows;
      const shiftDays = contract.requiredDows.filter(d => candidateIdleDays.includes(d));

      if (shiftDays.length === 0 && blockers.length === 0) {
        blockers.push(`${candidate.aircraft} has no idle days matching the contract's required schedule`);
      }

      // What does the shift free up on the current asset?
      const releasedDays = shiftDays; // same days — current asset gets freed on the days it's covered

      // What can the freed current asset do? Only if it meets higher tier for another contract
      // Find contracts the freed asset could pick up that the candidate CANNOT cover
      const repurposeContracts = contracts.filter(c =>
        c.id !== contract.id &&
        tierCanCover(currentAsset.clinicalTier, c.clinicalTierRequired) &&
        !tierCanCover(candidate.clinicalTier, c.clinicalTierRequired) &&
        c.requiredDows.some(d => releasedDays.includes(d))
      );

      const repurposeTo = repurposeContracts.length > 0
        ? repurposeContracts.map(c => c.name).join(", ")
        : `Additional charter work (${currentAsset.aircraftType} @ $${AIRCRAFT_RATES[currentAsset.aircraftType]?.toLocaleString() ?? "—"}/hr)`;

      // Revenue estimate for repurposed days
      const repurposeRate  = AIRCRAFT_RATES[currentAsset.aircraftType] ?? 4000;
      const hoursPerDay    = 3; // conservative for emergency/charter
      const daysPerMonth   = Math.round(releasedDays.length * 4.3);
      const repurposeRevenue = daysPerMonth * hoursPerDay * repurposeRate * 12;

      const feasible = blockers.length === 0 && shiftDays.length > 0;

      // Build the insight text
      let insight = "";
      if (feasible) {
        insight = `${candidate.aircraft} (${candidate.base}) is idle on ${shiftDays.map(d => DAY_NAMES[d]).join("/")} and holds the right qualifications to cover ${contract.name} on those days. `
          + `This frees ${currentAsset.aircraft} (${currentAsset.base}) — which has ${TIER_LABELS[currentAsset.clinicalTier]} capability — to be repurposed for ${repurposeTo}. `
          + `Zero new assets. Zero additional fixed cost. The upfront contract costs are already paid by the primary engagement.`;
      } else if (shiftDays.length > 0) {
        insight = `${candidate.aircraft} could cover ${shiftDays.map(d => DAY_NAMES[d]).join("/")} in principle (the schedule aligns), but clinical qualification constraints prevent it: ${blockers.join("; ")}.`;
      } else {
        insight = `No overlap found between ${candidate.aircraft}'s idle schedule and ${contract.name}'s required days.`;
      }

      shifts.push({
        contractId: contract.id,
        contract,
        coveringAsset: candidate,
        shiftDays,
        releasedAsset: currentAsset,
        releasedDays,
        repurposeTo,
        repurposeRevenue,
        repurposeHoursPerDay: hoursPerDay,
        repurposeRate,
        feasible,
        blockers,
        insight,
      });
    }
  }

  // Sort: feasible first, then by revenue
  return shifts.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return b.repurposeRevenue - a.repurposeRevenue;
  });
}

// Tier badge component
function TierBadge({ tier }: { tier: ClinicalTier }) {
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${TIER_COLOURS[tier]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────
interface RawLog {
  id: number; date: string; day_of_week: number;
  service_code: string; base: string; status: string;
  aircraft_reg: string | null; recorded_at: string;
}

interface ServicePattern {
  serviceCode: string;
  base: string;
  aircraft: string;
  totalDays: number;
  activeByDow: number[];   // count of green days per DOW (0=Sun)
  offlineByDow: number[];  // count of offline/not_required days per DOW
  totalByDow: number[];    // total recorded days per DOW
  utilByDow: number[];     // utilisation % per DOW (0–100)
  idleDays: number[];      // DOWs with util < 30% — candidate idle windows
}

interface Opportunity {
  serviceCode: string;
  aircraft: string;
  aircraftType: string;
  idleDows: number[];
  idleLabel: string;
  maintenanceWindow: string;
  charterDaysPerMonth: number;
  hourlyRate: number;
  conservativeHoursPerDay: number;
  monthlyCharterRevenue: number;
  annualCharterRevenue: number;
  confidence: "high" | "medium" | "low";
  dataPoints: number;
}

// ── Analyse patterns from raw history ────────────────────────────────────
function analyseHistory(history: RawLog[]): ServicePattern[] {
  // Group by serviceCode + aircraftReg
  const map = new Map<string, RawLog[]>();
  for (const row of history) {
    const key = `${row.service_code}::${row.aircraft_reg ?? "UNASSIGNED"}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }

  const patterns: ServicePattern[] = [];
  for (const [key, rows] of map.entries()) {
    const [serviceCode, aircraft] = key.split("::");
    // Deduplicate by date (keep most recent per date)
    const byDate = new Map<string, RawLog>();
    for (const r of rows) {
      if (!byDate.has(r.date) || r.recorded_at > byDate.get(r.date)!.recorded_at) {
        byDate.set(r.date, r);
      }
    }
    const unique = Array.from(byDate.values());

    const activeByDow  = [0,0,0,0,0,0,0];
    const offlineByDow = [0,0,0,0,0,0,0];
    const totalByDow   = [0,0,0,0,0,0,0];

    for (const r of unique) {
      const dow = r.day_of_week;
      totalByDow[dow]++;
      if (r.status === "green" || r.status === "amber") {
        activeByDow[dow]++;
      } else {
        offlineByDow[dow]++;
      }
    }

    const utilByDow = totalByDow.map((t, i) => t === 0 ? -1 : Math.round((activeByDow[i] / t) * 100));
    // Idle = DOWs where we have ≥4 data points AND util < 35%
    const idleDays = utilByDow
      .map((u, i) => ({ dow: i, util: u, n: totalByDow[i] }))
      .filter(x => x.n >= 4 && x.util >= 0 && x.util < 35)
      .map(x => x.dow);

    patterns.push({
      serviceCode,
      base: rows[0]?.base ?? "UNKNOWN",
      aircraft,
      totalDays: unique.length,
      activeByDow, offlineByDow, totalByDow, utilByDow, idleDays,
    });
  }

  return patterns.sort((a, b) => b.idleDays.length - a.idleDays.length);
}

function buildOpportunities(patterns: ServicePattern[]): Opportunity[] {
  const opps: Opportunity[] = [];

  for (const p of patterns) {
    if (p.idleDays.length === 0) continue;
    if (p.aircraft === "UNASSIGNED") continue;

    const aircraftType = AIRCRAFT_TYPES[p.aircraft] ?? "B200";
    const hourlyRate   = AIRCRAFT_RATES[aircraftType] ?? 4000;

    // Conservative estimate: 2 hours block time per idle day charter
    const conservativeHoursPerDay = 2;
    // Maintenance window: suggest the most idle day for maintenance
    const maintenanceDow = p.idleDays.reduce((best, d) =>
      (p.utilByDow[d] < p.utilByDow[best] ? d : best), p.idleDays[0]);

    const charterDows = p.idleDays.filter(d => d !== maintenanceDow);

    // Charter days per month: charterDows * ~4.3 weeks/month
    const charterDaysPerMonth = Math.round(charterDows.length * 4.3);
    const monthlyCharterRevenue = charterDaysPerMonth * conservativeHoursPerDay * hourlyRate;
    const annualCharterRevenue  = monthlyCharterRevenue * 12;

    const confidence: "high" | "medium" | "low" =
      p.totalDays >= 30 ? "high" : p.totalDays >= 15 ? "medium" : "low";

    const idleLabel = p.idleDays.map(d => DAY_NAMES[d]).join(", ");
    const maintenanceWindow = `${DAY_FULL[maintenanceDow]}s — ${Math.round(p.utilByDow[maintenanceDow])}% utilisation`;

    opps.push({
      serviceCode: p.serviceCode,
      aircraft: p.aircraft,
      aircraftType,
      idleDows: p.idleDays,
      idleLabel,
      maintenanceWindow,
      charterDaysPerMonth,
      hourlyRate,
      conservativeHoursPerDay,
      monthlyCharterRevenue,
      annualCharterRevenue,
      confidence,
      dataPoints: p.totalDays,
    });
  }

  return opps.sort((a, b) => b.annualCharterRevenue - a.annualCharterRevenue);
}

// ── Heatmap cell ──────────────────────────────────────────────────────────
function HeatCell({ util, n }: { util: number; n: number }) {
  if (n === 0 || util < 0) {
    return <td className="px-1 py-1 text-center"><span className="text-[10px] text-zinc-600">—</span></td>;
  }
  const bg =
    util >= 80 ? "bg-green-500/25 text-green-300" :
    util >= 50 ? "bg-amber-500/20 text-amber-300" :
    util >= 20 ? "bg-orange-500/20 text-orange-300" :
                 "bg-red-500/20 text-red-400";
  return (
    <td className="px-1 py-1 text-center">
      <div className={`rounded text-[10px] font-bold tabular-nums px-1.5 py-0.5 inline-block ${bg}`}>
        {util}%
      </div>
    </td>
  );
}

function ConfidenceBadge({ c }: { c: "high" | "medium" | "low" }) {
  const cls =
    c === "high"   ? "bg-green-500/15 border-green-500/40 text-green-300" :
    c === "medium" ? "bg-amber-500/15 border-amber-500/40 text-amber-300" :
                     "bg-zinc-500/15 border-zinc-500/40 text-zinc-400";
  return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${cls}`}>{c}</span>;
}

// ── Demo data (used when backend has no history yet) ─────────────────────
function buildDemoHistory(): RawLog[] {
  const rows: RawLog[] = [];
  let id = 1;
  const services = [
    { code: "BK-CLINIC-AIR", base: "BK",  reg: "VH-LTQ" },
    { code: "DU-CLINIC-AIR", base: "DU",  reg: "VH-MVW" },
    { code: "BHI-AMB-D1",   base: "BHI", reg: "VH-MVX" },
    { code: "ESS-D1",        base: "ESS", reg: "VH-MQK" },
    { code: "TAS-D1",        base: "TAS", reg: "VH-RFD" },
  ];
  const today = new Date();
  for (let d = 0; d < 60; d++) {
    const dt = new Date(today); dt.setDate(today.getDate() - d);
    const dateStr = dt.toISOString().slice(0, 10);
    const dow = dt.getDay();
    for (const svc of services) {
      // BK-CLINIC-AIR pattern: active Thu/Fri, active every 2nd Mon/Tue, offline Wed/Sat/Sun
      let status = "green";
      if (svc.code === "BK-CLINIC-AIR") {
        if (dow === 3) status = "offline"; // Wed always offline
        else if (dow === 0 || dow === 6) status = "offline"; // Sun/Sat offline
        else if (dow === 1 || dow === 2) status = (Math.floor(d / 7) % 2 === 0) ? "green" : "offline"; // every 2nd Mon/Tue
      }
      rows.push({
        id: id++, date: dateStr, day_of_week: dow,
        service_code: svc.code, base: svc.base,
        status, aircraft_reg: svc.reg,
        recorded_at: `${dateStr}T08:45:00Z`,
      });
    }
  }
  return rows;
}

// ── Main Page ─────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────
// CONTRACT EDITOR MODAL
// ────────────────────────────────────────────────────────────────

const BLANK_CONTRACT: Contract = {
  id: "",
  name: "",
  client: "",
  serviceCode: "",
  currentBase: "DU",
  currentAircraft: "",
  requiredDows: [1,2,3,4,5],
  minDaysPerWeek: 5,
  clinicalTierRequired: "NEPT",
  annualContractValue: 0,
  notes: "",
};

const ALL_AIRCRAFT = [
  "VH-LTQ","VH-MVW","VH-MVX","VH-MWH","VH-MWK",
  "VH-NAJ","VH-RFD","VH-XYJ","VH-XYO","VH-XYR",
  "VH-VPQ","VH-XYU","VH-MQD","VH-MQK",
];
const ALL_BASES = ["DU","BK","BHI","ESS","TAS"];
const ALL_TIERS: ClinicalTier[] = ["NEPT","EMERGENCY_BASIC","EMERGENCY_ADVANCED","MICA","INTENSIVE_CARE"];

function ContractEditorModal({
  contracts,
  onSave,
  onClose,
  saving,
}: {
  contracts: Contract[];
  onSave: (contracts: Contract[]) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [list, setList] = useState<Contract[]>(contracts.map(c => ({ ...c })));
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Contract | null>(null);

  const openNew = () => {
    const newId = `CONTRACT-${Date.now()}`;
    const blank = { ...BLANK_CONTRACT, id: newId };
    setDraft(blank);
    setEditIdx(-1); // -1 = new
  };

  const openEdit = (idx: number) => {
    setDraft({ ...list[idx] });
    setEditIdx(idx);
  };

  const cancelEdit = () => { setDraft(null); setEditIdx(null); };

  const saveDraft = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.currentAircraft) return;
    if (draft.id === "") draft.id = `CONTRACT-${Date.now()}`;
    if (editIdx === -1) {
      setList(prev => [...prev, draft!]);
    } else {
      setList(prev => prev.map((c, i) => i === editIdx ? draft! : c));
    }
    setDraft(null);
    setEditIdx(null);
  };

  const deleteContract = (idx: number) => {
    setList(prev => prev.filter((_, i) => i !== idx));
    if (editIdx === idx) cancelEdit();
  };

  const toggleDow = (d: number) => {
    if (!draft) return;
    const dows = draft.requiredDows.includes(d)
      ? draft.requiredDows.filter(x => x !== d)
      : [...draft.requiredDows, d].sort();
    setDraft({ ...draft, requiredDows: dows, minDaysPerWeek: dows.length });
  };

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-[10px] text-zinc-400 uppercase tracking-wider mb-1">{label}</label>
      {el}
    </div>
  );
  const inp = (value: string, onChange: (v: string) => void, placeholder?: string) => (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-[#0f0f0f] border-l border-zinc-800 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Contract Registry</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Add, edit or remove contracts. Changes update the Coverage Optimiser immediately.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">

          {/* Contract list */}
          {draft === null && (
            <>
              {list.length === 0 && (
                <div className="text-xs text-zinc-500 text-center py-8">No contracts. Add one below.</div>
              )}
              {list.map((c, idx) => (
                <div key={c.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-200 truncate">{c.name}</span>
                      <TierBadge tier={c.clinicalTierRequired} />
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {c.client} · {c.currentAircraft} @ {c.currentBase} · {c.requiredDows.map(d => DAY_NAMES[d]).join("/")}
                    </div>
                    {c.notes && <div className="text-[10px] text-zinc-600 mt-0.5 truncate">{c.notes}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(idx)} className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-cyan-300 transition-colors" title="Edit">
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => deleteContract(idx)} className="p-1.5 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={openNew}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-cyan-500/50 text-zinc-500 hover:text-cyan-300 text-xs transition-colors">
                <Plus size={12} /> Add Contract
              </button>
            </>
          )}

          {/* Edit / New form */}
          {draft !== null && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-300 mb-1">
                {editIdx === -1 ? "New Contract" : "Edit Contract"}
              </div>

              {field("Contract Name", inp(draft.name, v => setDraft({...draft, name: v}), "e.g. NEPT Standing Contract"))}
              {field("Client", inp(draft.client, v => setDraft({...draft, client: v}), "e.g. NSW Health"))}
              {field("Service Code", inp(draft.serviceCode, v => setDraft({...draft, serviceCode: v}), "e.g. DU-NEPT (matches Morning Brief)"))}

              <div className="grid grid-cols-2 gap-3">
                {field("Current Base",
                  <select value={draft.currentBase} onChange={e => setDraft({...draft, currentBase: e.target.value})}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60">
                    {ALL_BASES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
                {field("Current Aircraft",
                  <select value={draft.currentAircraft} onChange={e => setDraft({...draft, currentAircraft: e.target.value})}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60">
                    <option value="">Select…</option>
                    {ALL_AIRCRAFT.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>

              {field("Clinical Tier Required",
                <select value={draft.clinicalTierRequired} onChange={e => setDraft({...draft, clinicalTierRequired: e.target.value as ClinicalTier})}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60">
                  {ALL_TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
                </select>
              )}

              {field("Required Days of Week",
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_NAMES.map((name, d) => (
                    <button key={d} onClick={() => toggleDow(d)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        draft.requiredDows.includes(d)
                          ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                          : "bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300"
                      }`}>{name}</button>
                  ))}
                </div>
              )}

              {field("Annual Contract Value (AUD excl. GST)",
                <input type="number" min={0} step={1000}
                  value={draft.annualContractValue || ""}
                  onChange={e => setDraft({...draft, annualContractValue: parseFloat(e.target.value) || 0})}
                  placeholder="0 if unknown"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600"
                />
              )}

              {field("Notes (optional)",
                <textarea value={draft.notes ?? ""} onChange={e => setDraft({...draft, notes: e.target.value})}
                  rows={2} placeholder="Any relevant context…"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500/60 placeholder:text-zinc-600 resize-none"
                />
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={saveDraft}
                  disabled={!draft.name.trim() || !draft.currentAircraft}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <CheckCircle size={11} /> {editIdx === -1 ? "Add Contract" : "Save Changes"}
                </button>
                <button onClick={cancelEdit}
                  className="px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 text-xs hover:text-zinc-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — save all */}
        {draft === null && (
          <div className="px-5 py-4 border-t border-zinc-800 flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 flex-1">{list.length} contract{list.length !== 1 ? "s" : ""} in registry</span>
            <button onClick={onClose}
              className="px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 text-xs hover:text-zinc-200 transition-colors">
              Cancel
            </button>
            <button onClick={() => onSave(list)} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
              {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
              {saving ? "Saving…" : "Save & Apply"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssetUtilisation({ role }: Props) {
  const [lookback, setLookback] = useState<30 | 60 | 90 | 180>(90);
  const [filterBase, setFilterBase] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showHeatmap, setShowHeatmap] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/asset-utilisation/history", lookback],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/asset-utilisation/history?days=${lookback}`);
      return res as { history: RawLog[]; days: number };
    },
  });

  const rawHistory = data?.history ?? [];
  const hasRealData = rawHistory.length > 0;
  const history = hasRealData ? rawHistory : buildDemoHistory();

  // ── Load saved contracts from server ──
  const qc = useQueryClient();
  const { data: savedContracts } = useQuery({
    queryKey: ["/api/asset-utilisation/contracts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/asset-utilisation/contracts");
      return res as { contracts: Contract[] | null };
    },
  });
  // Merge saved contracts with defaults (saved takes priority; null = use defaults)
  const [contracts, setContracts] = useState<Contract[]>(DEFAULT_CONTRACTS);
  // Sync once loaded
  useMemo(() => {
    if (savedContracts?.contracts) setContracts(savedContracts.contracts);
  }, [savedContracts]);

  const saveMutation = useMutation({
    mutationFn: async (newContracts: Contract[]) => {
      await apiRequest("POST", "/api/asset-utilisation/contracts", { contracts: newContracts });
    },
    onSuccess: (_data, newContracts) => {
      setContracts(newContracts);
      qc.invalidateQueries({ queryKey: ["/api/asset-utilisation/contracts"] });
      setShowContractEditor(false);
    },
  });

  const patterns = useMemo(() => {
    const all = analyseHistory(history);
    if (filterBase === "ALL") return all;
    return all.filter(p => p.base === filterBase);
  }, [history, filterBase]);

  const opportunities = useMemo(() => buildOpportunities(patterns), [patterns]);
  const coverageShifts = useMemo(() => analyseCoverageShifts(contracts, FLEET_ASSETS, patterns), [contracts, patterns]);
  const feasibleShifts = coverageShifts.filter(s => s.feasible);

  const totalAnnualOpportunity = opportunities.reduce((s, o) => s + o.annualCharterRevenue, 0);
  const totalCoverageRevenue   = feasibleShifts.reduce((s, sh) => s + sh.repurposeRevenue, 0);

  const bases = ["ALL", "BHI", "DU", "BK", "ESS", "TAS"];
  const [coverageExpanded, setCoverageExpanded] = useState<Set<string>>(new Set());
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [showContractEditor, setShowContractEditor] = useState(false);

  return (
    <>
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Asset Utilisation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pattern analysis from 0845 morning brief data — maintenance windows &amp; charter revenue opportunities
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lookback selector */}
          <div className="flex items-center gap-1 text-xs">
            {([30, 60, 90, 180] as const).map(d => (
              <button key={d} onClick={() => setLookback(d)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  lookback === d
                    ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                    : "bg-muted/10 border-card-border text-muted-foreground hover:text-foreground"
                }`}>{d}d</button>
            ))}
          </div>
          <button onClick={() => refetch()}
            className="p-2 rounded-lg border border-card-border bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Demo notice */}
      {!hasRealData && !isLoading && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/30">
          <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-300">
            <strong>Demo mode</strong> — No live morning brief history has been recorded yet. The analysis below is based on a simulated 60-day pattern. Real data accumulates automatically each time the 0845 brief is saved. Switch to the Morning Brief, enter edit mode, assign aircraft to services, and save to start building your dataset.
          </div>
        </div>
      )}

      {/* Base filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter size={12} className="text-muted-foreground" />
        {bases.map(b => (
          <button key={b} onClick={() => setFilterBase(b)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              filterBase === b
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                : "bg-muted/10 border-card-border text-muted-foreground hover:text-foreground"
            }`}>{b}</button>
        ))}
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Aircraft Tracked</div>
          <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {new Set(patterns.map(p => p.aircraft).filter(a => a !== "UNASSIGNED")).size}
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Services Analysed</div>
          <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {patterns.length}
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Charter Opportunities</div>
          <div className="text-2xl font-bold tabular-nums text-amber-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {opportunities.length}
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Coverage Shifts</div>
          <div className="text-2xl font-bold tabular-nums text-cyan-300" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {feasibleShifts.length}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">cross-base feasible</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Annual Upside</div>
          <div className="text-2xl font-bold tabular-nums text-green-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            ${((totalAnnualOpportunity + totalCoverageRevenue) / 1000).toFixed(0)}k
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">charter + coverage · excl. GST</div>
        </div>
      </div>

      {/* ─── Contract Coverage Optimiser ─────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Repeat size={14} className="text-cyan-400" /> Contract Coverage Optimiser
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cross-base coverage shifts — use idle assets to cover contracted obligations, freeing higher-capability assets for more valuable work. Zero new assets required.
            </p>
          </div>
          <button
            onClick={() => setShowContractEditor(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-700/40 text-zinc-400 hover:text-zinc-200 text-[11px] font-semibold transition-colors">
            <Settings size={11} /> Edit Contracts
          </button>
        </div>

        {/* ── Pinned worked example ─────────────────────────────────── */}
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-cyan-500/20 border-cyan-400/50 text-cyan-300 tracking-wider">Worked Example</span>
            <span className="text-xs font-semibold text-cyan-100">Dubbo NEPT → Weekend Coverage Shift</span>
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed mb-3">
            The NEPT contract requires 1 aircraft + pilot + nurse, currently served from Dubbo every day.
            Bankstown (VH-LTQ) is idle Sat/Sun and holds NEPT qualifications — it can cover the NEPT
            obligation on weekends. This frees VH-MVW (Dubbo, Emergency+) on those 2 days per week to
            service the ANSW emergency contract, which Bankstown cannot cover due to clinical qualification
            requirements. Result: 2 additional ANSW days per week with no new assets and no change to the
            primary weekday NEPT obligation.
          </div>
          {/* Flow diagram */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
              <span className="font-mono text-zinc-200">VH-LTQ</span>
              <span className="text-zinc-500">BK</span>
              <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded border bg-blue-500/15 border-blue-500/40 text-blue-300">NEPT</span>
            </div>
            <span className="text-zinc-500">covers NEPT</span>
            <span className="font-semibold text-cyan-300">Sat + Sun</span>
            <ArrowRight size={11} className="text-zinc-500" />
            <span className="text-zinc-500">frees</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
              <span className="font-mono text-zinc-200">VH-MVW</span>
              <span className="text-zinc-500">DU</span>
              <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded border bg-orange-500/15 border-orange-500/40 text-orange-300">Emergency+</span>
            </div>
            <ArrowRight size={11} className="text-zinc-500" />
            <span className="text-green-300 font-semibold">ANSW Emergency (Sat + Sun)</span>
            <span className="ml-auto text-green-400 font-bold tabular-nums text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>+$249k/yr</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            Estimate: 2 days/wk × 4.3 wks/month × 3 hrs/day × $4,000/hr B200 rate · excl. GST · no new assets · fixed costs already covered by the primary NEPT engagement
          </div>
        </div>

        {/* Feasible shifts first */}
        {feasibleShifts.length === 0 && (
          <div className="p-4 rounded-xl bg-zinc-800/40 border border-card-border text-xs text-muted-foreground flex items-center gap-2">
            <Info size={12} /> No feasible cross-base coverage shifts found with current patterns and contract configuration.
          </div>
        )}

        <div className="space-y-3">
          {(showAllShifts ? coverageShifts : feasibleShifts).map((shift, i) => {
            const key = `shift-${shift.contractId}-${shift.coveringAsset.aircraft}`;
            const isOpen = coverageExpanded.has(key);
            const toggle = () => setCoverageExpanded(prev => {
              const next = new Set(prev);
              isOpen ? next.delete(key) : next.add(key);
              return next;
            });

            return (
              <div key={key}
                className={`rounded-xl border transition-colors ${
                  shift.feasible
                    ? "bg-cyan-500/5 border-cyan-500/30 hover:border-cyan-400/50"
                    : "bg-zinc-800/30 border-zinc-700/40 hover:border-zinc-600/50"
                }`}>

                {/* Card header */}
                <button className="w-full text-left p-4 flex items-start gap-3" onClick={toggle}>
                  <div className={`mt-0.5 p-1.5 rounded-lg ${
                    shift.feasible ? "bg-cyan-500/15" : "bg-zinc-700/30"
                  }`}>
                    {shift.feasible
                      ? <Unlock size={12} className="text-cyan-400" />
                      : <Lock size={12} className="text-zinc-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{shift.contract.name}</span>
                      {shift.feasible
                        ? <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-cyan-500/15 border-cyan-500/40 text-cyan-300">Feasible</span>
                        : <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-zinc-600/20 border-zinc-600/40 text-zinc-400">Blocked</span>
                      }
                      <TierBadge tier={shift.contract.clinicalTierRequired} />
                    </div>

                    {/* Coverage flow diagram */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-300 font-mono text-[10px]">{shift.coveringAsset.aircraft}</span>
                      <span className="text-zinc-500 text-[10px]">{shift.coveringAsset.base}</span>
                      <TierBadge tier={shift.coveringAsset.clinicalTier} />
                      <span className="text-zinc-500 text-[10px] mx-0.5">covers</span>
                      <span className="text-cyan-300 text-[10px] font-semibold">{shift.shiftDays.length > 0 ? shift.shiftDays.map(d => DAY_NAMES[d]).join("/") : "0"} days/wk</span>
                      <ArrowRight size={10} className="text-zinc-500" />
                      <span className="text-zinc-500 text-[10px]">frees</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-300 font-mono text-[10px]">{shift.releasedAsset.aircraft}</span>
                      <span className="text-zinc-500 text-[10px]">{shift.releasedAsset.base}</span>
                      <TierBadge tier={shift.releasedAsset.clinicalTier} />
                      <ArrowRight size={10} className="text-zinc-500" />
                      <span className="text-green-300 text-[10px] font-semibold truncate max-w-[160px]">{shift.repurposeTo}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {shift.feasible && shift.repurposeRevenue > 0 && (
                      <div className="text-base font-bold text-green-400 tabular-nums" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                        +${(shift.repurposeRevenue / 1000).toFixed(0)}k/yr
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {isOpen ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/40 pt-3">

                    {/* Insight box */}
                    <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                      shift.feasible
                        ? "bg-cyan-500/8 border border-cyan-500/20 text-cyan-100"
                        : "bg-zinc-800/40 border border-zinc-700/40 text-zinc-400"
                    }`}>
                      <Lightbulb size={12} className={shift.feasible ? "text-cyan-400 shrink-0 mt-0.5" : "text-zinc-500 shrink-0 mt-0.5"} />
                      <span>{shift.insight}</span>
                    </div>

                    {/* Blockers */}
                    {!shift.feasible && shift.blockers.length > 0 && (
                      <div className="space-y-1">
                        {shift.blockers.map((b, bi) => (
                          <div key={bi} className="flex items-start gap-2 text-xs text-red-300">
                            <XCircle size={11} className="shrink-0 mt-0.5" /> {b}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Three-column breakdown */}
                    {shift.feasible && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-800/40 rounded-lg p-3">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Shield size={9} /> Contract Coverage
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="text-zinc-400">Covering asset: </span>
                              <span className="font-mono text-zinc-200">{shift.coveringAsset.aircraft}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">From base: </span>
                              <span className="text-zinc-200">{shift.coveringAsset.base}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Days covered: </span>
                              <span className="text-cyan-300">{shift.shiftDays.map(d => DAY_FULL[d]).join(", ")}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Quals: </span>
                              <TierBadge tier={shift.coveringAsset.clinicalTier} />
                            </div>
                            {shift.coveringAsset.notes && (
                              <div className="text-[10px] text-amber-400 mt-1">{shift.coveringAsset.notes}</div>
                            )}
                          </div>
                        </div>

                        <div className="bg-zinc-800/40 rounded-lg p-3">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Plane size={9} /> Released Asset
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="text-zinc-400">Aircraft: </span>
                              <span className="font-mono text-zinc-200">{shift.releasedAsset.aircraft}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">From base: </span>
                              <span className="text-zinc-200">{shift.releasedAsset.base}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Freed days: </span>
                              <span className="text-green-300">{shift.releasedDays.map(d => DAY_FULL[d]).join(", ")}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Capability: </span>
                              <TierBadge tier={shift.releasedAsset.clinicalTier} />
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-800/40 rounded-lg p-3">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <DollarSign size={9} /> Revenue Projection
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="text-zinc-400">Repurpose to: </span>
                              <span className="text-zinc-200 text-[10px]">{shift.repurposeTo}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Rate: </span>
                              <span className="text-zinc-200">${shift.repurposeRate.toLocaleString()}/hr</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Hrs/day (conservative): </span>
                              <span className="text-zinc-200">{shift.repurposeHoursPerDay}hrs</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-zinc-400">Days/month: </span>
                              <span className="text-zinc-200">{Math.round(shift.releasedDays.length * 4.3)}</span>
                            </div>
                            <div className="text-sm font-bold text-green-400 mt-2 tabular-nums">
                              +${(shift.repurposeRevenue / 1000).toFixed(0)}k / year
                            </div>
                            <div className="text-[9px] text-muted-foreground">conservative · excl. GST · no new assets</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contract notes */}
                    {shift.contract.notes && (
                      <div className="text-[10px] text-zinc-500 border-t border-zinc-700/40 pt-2">{shift.contract.notes}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Toggle to show blocked shifts */}
        {coverageShifts.filter(s => !s.feasible).length > 0 && (
          <button
            onClick={() => setShowAllShifts(v => !v)}
            className="mt-3 text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
            {showAllShifts ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showAllShifts ? "Hide" : "Show"} {coverageShifts.filter(s => !s.feasible).length} blocked/infeasible shifts
          </button>
        )}
      </div>

      {/* Charter Opportunity Cards */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Charter Revenue Opportunities
          </h2>
          <div className="space-y-3">
            {opportunities.map((opp, i) => {
              const key = `${opp.serviceCode}::${opp.aircraft}`;
              const isOpen = expanded.has(key);
              return (
                <div key={key} className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                    onClick={() => setExpanded(prev => {
                      const n = new Set(prev);
                      n.has(key) ? n.delete(key) : n.add(key);
                      return n;
                    })}
                  >
                    {/* Rank */}
                    <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                      {i + 1}
                    </div>
                    {/* Aircraft + service */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                          {opp.aircraft}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">
                          {opp.aircraftType}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{opp.serviceCode}</span>
                        <ConfidenceBadge c={opp.confidence} />
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Idle on <strong className="text-amber-300">{opp.idleLabel}</strong> — {opp.charterDaysPerMonth} charter days/month available
                      </div>
                    </div>
                    {/* Revenue */}
                    <div className="text-right shrink-0 mr-2">
                      <div className="text-base font-bold text-green-400 tabular-nums">
                        ${opp.annualCharterRevenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">/ year est.</div>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-card-border px-4 py-4 space-y-4">
                      {/* Insight narrative */}
                      <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/25">
                        <div className="flex items-start gap-2">
                          <TrendingUp size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-cyan-200 leading-relaxed">
                            <strong>{opp.aircraft}</strong> assigned to <strong>{opp.serviceCode}</strong> shows consistent low utilisation on <strong>{opp.idleLabel}</strong>.
                            {" "}The first contract's fixed costs (crew, insurance, base fees) are already covered by the primary service — meaning any charter revenue on idle days flows at a significantly higher margin.
                            {" "}At {opp.conservativeHoursPerDay}hr/day conservative block time and ${opp.hourlyRate.toLocaleString()}/hr ({opp.aircraftType}),
                            {" "}that's <strong className="text-green-400">${opp.monthlyCharterRevenue.toLocaleString()}/month</strong> of incremental revenue with no new assets required.
                          </p>
                        </div>
                      </div>

                      {/* Three-column breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Maintenance window */}
                        <div className="p-3 rounded-xl bg-muted/10 border border-card-border">
                          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Wrench size={10} /> Maintenance Window
                          </div>
                          <div className="text-sm font-semibold text-foreground">{opp.maintenanceWindow}</div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Schedule TLC, phase checks, and preventative maintenance here — aircraft is already idle,
                            minimising disruption to contracted services.
                          </p>
                        </div>

                        {/* Charter window */}
                        <div className="p-3 rounded-xl bg-green-500/8 border border-green-500/25">
                          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                            <DollarSign size={10} /> Charter Window
                          </div>
                          <div className="text-sm font-semibold text-green-300">
                            {opp.idleDows.filter((_, i) => i !== opp.idleDows.indexOf(opp.idleDows[0])).map(d => DAY_FULL[d]).join(", ") || opp.idleLabel}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                            <div className="tabular-nums">{opp.charterDaysPerMonth} days/month</div>
                            <div className="tabular-nums">{opp.conservativeHoursPerDay} hrs/day (conservative)</div>
                            <div className="tabular-nums text-green-400 font-semibold">${opp.hourlyRate.toLocaleString()}/hr ({opp.aircraftType})</div>
                          </div>
                        </div>

                        {/* Revenue projection */}
                        <div className="p-3 rounded-xl bg-muted/10 border border-card-border">
                          <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <BarChart2 size={10} /> Revenue Projection
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-muted-foreground">Monthly</span>
                              <span className="text-sm font-bold text-green-400 tabular-nums">${opp.monthlyCharterRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-muted-foreground">Annual</span>
                              <span className="text-sm font-bold text-green-400 tabular-nums">${opp.annualCharterRevenue.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-card-border my-1" />
                            <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                              Conservative estimate — actual rates may vary. Pricing flexibility available: maintain margin or price competitively to pressure competition.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data basis */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Calendar size={10} />
                        Based on {opp.dataPoints} recorded operating days · confidence: <ConfidenceBadge c={opp.confidence} />
                        {opp.confidence === "low" && <span className="ml-1 text-amber-400">— more data needed for reliable prediction</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {opportunities.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No idle patterns detected yet — more data points needed.</p>
          <p className="text-xs mt-1 opacity-60">Patterns emerge after 4+ recordings per day-of-week.</p>
        </div>
      )}

      {/* Utilisation Heatmap */}
      {patterns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <BarChart2 size={14} className="text-cyan-400" /> Service Utilisation by Day of Week
            </h2>
            <button onClick={() => setShowHeatmap(v => !v)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              {showHeatmap ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showHeatmap ? "Hide" : "Show"}
            </button>
          </div>
          {showHeatmap && (
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-muted/10">
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-52">Service</th>
                      <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Aircraft</th>
                      {DAY_NAMES.map(d => (
                        <th key={d} className="px-1 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{d}</th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {patterns.map(p => (
                      <tr key={`${p.serviceCode}::${p.aircraft}`} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2 font-semibold text-[11px]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                          {p.serviceCode}
                          {p.idleDays.length > 0 && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-400">
                              <Zap size={8} /> idle
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-cyan-300">{p.aircraft === "UNASSIGNED" ? <span className="text-muted-foreground">—</span> : p.aircraft}</td>
                        {p.utilByDow.map((util, dow) => (
                          <HeatCell key={dow} util={util} n={p.totalByDow[dow]} />
                        ))}
                        <td className="px-3 py-2 text-center text-[10px] tabular-nums text-muted-foreground">{p.totalDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-card-border bg-muted/5 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/25 inline-block" /> ≥80% active</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/20 inline-block" /> 50–79%</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/20 inline-block" /> 20–49%</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/20 inline-block" /> &lt;20% — idle</span>
                <span className="ml-auto">% = active (green/amber) days ÷ total recorded days</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>

    {/* Contract Editor Modal — rendered outside main scroll div so it covers full screen */}
    {showContractEditor && (
      <ContractEditorModal
        contracts={contracts}
        onSave={(updated) => saveMutation.mutate(updated)}
        onClose={() => setShowContractEditor(false)}
        saving={saveMutation.isPending}
      />
    )}
    </>
  );
}
