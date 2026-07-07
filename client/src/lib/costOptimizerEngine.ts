/**
 * costOptimizerEngine.ts
 * In-memory financial intelligence engine for the Operations Cost Optimizer module.
 *
 * All monetary values are in INTEGER CENTS internally. Divide by 100 for display.
 * Constants sourced from quoteEngine.ts (B200/B350 hourly rates, crew EBA rates)
 * plus standalone assumptions documented inline for this module.
 */

import { AIRCRAFT, CREW_HOURLY } from "./quoteEngine";

// ─── Shared constants ────────────────────────────────────────────────────────
export const WORKING_WEEKS = 48; // allows for scheduled maintenance downtime

export const SECTOR_REVENUE = {
  nept: 3_800_00,     // avg NEPT sector revenue, cents
  charter: 4_200_00,  // avg charter sector revenue, cents
  dentalRahs: 2_800_00, // avg Dental/RAHS sector revenue, cents
};

export const B200_HOURLY = AIRCRAFT.B200.hourlyRate;   // 400,000c = $4,000/hr
export const B350_HOURLY = AIRCRAFT.B350.hourlyRate;   // 480,000c = $4,800/hr
export const FLIGHT_NURSE_HOURLY = CREW_HOURLY.flightNurse; // 9,500c = $95/hr
export const CAPTAIN_HOURLY = CREW_HOURLY.captain;          // 18,500c = $185/hr

export const OUT_OF_HOURS_TNC_SURCHARGE = 261_00; // cents/movement
export const CREW_NIGHT_LOADING_PCT = 20;

// ─── Formatting helpers ──────────────────────────────────────────────────────
export function fmtAUD(cents: number): string {
  const dollars = Math.round(cents / 100);
  const sign = dollars < 0 ? "-" : "";
  return `${sign}$${Math.abs(dollars).toLocaleString("en-AU")}`;
}

export function fmtAUDDecimal(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ─── Revenue & Cost Summary (Tab 1) ──────────────────────────────────────────
export interface CostSummary {
  totalAnnualRevenuePotential: number; // cents
  totalFixedCosts: number; // cents
  variableCostsBySector: { sector: string; costPerSector: number }[]; // cents
  ebitdaEstimate: number; // cents
  costPerAvailableSeatKm: number; // cents, small decimal number represented as cents/ASK*100
}

export const COST_BREAKDOWN = [
  { name: "Aircraft ops", value: 8_200_000_00, color: "#01696F" },
  { name: "Crew", value: 6_400_000_00, color: "#20808D" },
  { name: "Fuel", value: 2_100_000_00, color: "#A13544" },
  { name: "Airport charges", value: 780_000_00, color: "#DA7101" },
  { name: "Ground transport", value: 540_000_00, color: "#437A22" },
  { name: "Admin/overhead", value: 1_650_000_00, color: "#7A39BB" },
  { name: "Accommodation", value: 410_000_00, color: "#944454" },
];

export function getCostSummary(): CostSummary {
  const totalFixedCosts = COST_BREAKDOWN.reduce((s, c) => s + c.value, 0);
  // Estimated annual sector volume across the network (NEPT + charter + dental/RAHS)
  const neptSectors = 260 * 3; // ~3 aircraft-equivalent daily sector capacity
  const charterSectors = 150;
  const dentalSectors = 120;
  const totalAnnualRevenuePotential =
    neptSectors * SECTOR_REVENUE.nept +
    charterSectors * SECTOR_REVENUE.charter +
    dentalSectors * SECTOR_REVENUE.dentalRahs;

  const ebitdaEstimate = totalAnnualRevenuePotential - totalFixedCosts;

  // Cost per available seat km — illustrative network-wide figure
  const totalAvailableSeatKm = 3_200_000; // ASKs/yr (illustrative)
  const costPerAvailableSeatKm = totalFixedCosts / totalAvailableSeatKm; // cents/ASK

  return {
    totalAnnualRevenuePotential,
    totalFixedCosts,
    variableCostsBySector: [
      { sector: "NEPT", costPerSector: 2_950_00 },
      { sector: "Charter", costPerSector: 3_100_00 },
      { sector: "Dental/RAHS", costPerSector: 2_050_00 },
    ],
    ebitdaEstimate,
    costPerAvailableSeatKm,
  };
}

// 12-month revenue vs cost trend (illustrative seasonal pattern)
export interface MonthTrend { month: string; revenue: number; cost: number }
export function getMonthlyTrend(): MonthTrend[] {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const seasonality = [0.92, 0.90, 0.97, 1.00, 1.03, 1.08, 1.12, 1.10, 1.02, 0.98, 0.95, 0.93];
  const summary = getCostSummary();
  const baseRevenue = summary.totalAnnualRevenuePotential / 12;
  const baseCost = summary.totalFixedCosts / 12;
  return months.map((month, i) => ({
    month,
    revenue: Math.round(baseRevenue * seasonality[i]),
    cost: Math.round(baseCost * (0.95 + (seasonality[i] - 1) * 0.3)),
  }));
}

// ─── Revenue Leakage Scanner (Tab 2) ─────────────────────────────────────────
export interface LeakageItem {
  id: string;
  title: string;
  icon: string; // lucide icon name resolved in component
  annualValue: number; // cents; positive = opportunity/loss magnitude
  isLoss: boolean; // true = red (leakage), false = green (opportunity)
  rootCause: string;
  fixRecommendation: string;
  breakEvenMonths?: number;
  confidence: "High" | "Medium" | "Low";
  category: "staffing" | "asset" | "ops";
}

export function getLeakageItems(): LeakageItem[] {
  return [
    {
      id: "orange-nurse",
      title: "Orange base — no permanent nurse",
      icon: "UserX",
      annualValue: 806_400_00,
      isLoss: false,
      rootCause: "Orange has no permanently based flight nurse, so same-day ground-transport-enabled taskings cannot be actioned without flying crew from Dubbo — adding hours of delay and frequently causing the sector to be declined or reassigned.",
      fixRecommendation: "Base a full-time flight nurse in Orange ($95/hr EBA, 38hr week ≈ $187K/yr) to enable same-day response. Estimated 4 additional sectors/week × 48 weeks = 192 sectors/yr × $4,200 avg revenue.",
      breakEvenMonths: 7.4,
      confidence: "High",
      category: "staffing",
    },
    {
      id: "bhi-spare-capacity",
      title: "Broken Hill spare capacity",
      icon: "PlaneTakeoff",
      annualValue: 988_000_00,
      isLoss: true,
      rootCause: "BHI aircraft utilisation analysis shows utilisation below the 70% efficient-use threshold, meaning airframe hours are available for additional tasking that is currently being declined or routed elsewhere.",
      fixRecommendation: "Actively market and accept one additional NEPT sector per day from the Broken Hill base. 260 sectors/yr × $3,800 avg NEPT revenue.",
      confidence: "High",
      category: "ops",
    },
    {
      id: "night-premium",
      title: "Night sector premium not applied",
      icon: "Moon",
      annualValue: 94_000_00,
      isLoss: true,
      rootCause: "Out-of-hours Terminal Navigation Charge (TNC) surcharge ($261/movement) and the associated 20% crew loading are not consistently itemised and charged on invoices for night sectors.",
      fixRecommendation: "Enforce automatic night-sector surcharge application in the invoicing workflow. Estimated 2 night sectors/week currently under-billed.",
      confidence: "Medium",
      category: "ops",
    },
    {
      id: "deadhead-legs",
      title: "Deadhead positioning legs",
      icon: "Route",
      annualValue: 748_800_00,
      isLoss: true,
      rootCause: "Unrecovered ferry/positioning legs — approximately 3 per week averaging 1.2hr each at the B200 hourly rate — are absorbed as an operating cost rather than being recovered from the tasking client.",
      fixRecommendation: "Add a ferry recovery line item to invoices for all positioning legs directly attributable to a chargeable tasking. 3/week × 1.2hr × $4,000/hr × 48 weeks.",
      confidence: "Medium",
      category: "ops",
    },
    {
      id: "ground-transport-idle",
      title: "Ground transport underutilisation",
      icon: "Truck",
      annualValue: 260_000_00,
      isLoss: false,
      rootCause: "Ground ambulance/vehicle fleet sits idle approximately 60% of rostered time with no secondary revenue arrangement in place.",
      fixRecommendation: "Rent idle ground vehicle capacity to the regional hospital network at $250/hr for 20hrs/week — passive revenue with no incremental fixed cost.",
      confidence: "Medium",
      category: "asset",
    },
    {
      id: "accommodation-overrun",
      title: "Accommodation cost overrun",
      icon: "Hotel",
      annualValue: 37_440_00,
      isLoss: true,
      rootCause: "Crew accommodation is being booked above the EBA schedule rate — actual average $220/night vs. $180/night budget — across 936 crew-nights per year.",
      fixRecommendation: "Enforce EBA-compliant accommodation booking via preferred-supplier agreements and pre-approved rate caps.",
      confidence: "High",
      category: "ops",
    },
    {
      id: "crew-overtime",
      title: "Crew overtime (unbudgeted FDP extensions)",
      icon: "Clock",
      annualValue: 126_360_00,
      isLoss: true,
      rootCause: "Flight Duty Period (FDP) extensions beyond the 12-hour trigger point require additional accommodation and attract an overtime penalty. Estimated at 15% of sectors incurring an average $340 penalty.",
      fixRecommendation: "Improve crew rostering and tasking sequencing to reduce FDP extensions; pre-position relief crew for known long-duty days.",
      confidence: "Medium",
      category: "staffing",
    },
    {
      id: "dental-triangulation",
      title: "Dental/RAHS flight triangulation inefficiency",
      icon: "Milestone",
      annualValue: 160_000_00,
      isLoss: true,
      rootCause: "Dental/RAHS flights routed Bankstown → Dubbo → Broken Hill as 3 legs instead of a direct 2-leg routing, adding an unrecovered positioning leg at approximately $4,000 per occurrence, an estimated 40 times per year.",
      fixRecommendation: "Re-plan Dental/RAHS routing to a direct 2-leg structure wherever crew and aircraft positioning allows.",
      confidence: "Medium",
      category: "ops",
    },
  ];
}

// ─── Base Staffing Planner (Tab 3) ────────────────────────────────────────────
export interface BaseMatrixRow {
  base: string;
  aircraft: string;
  captain: number;
  fo: number;
  flightNurse: number;
  paramedic: number;
  groundVehicle: string;
}

export const BASE_MATRIX: BaseMatrixRow[] = [
  { base: "Dubbo", aircraft: "B200 + B350", captain: 2, fo: 2, flightNurse: 3, paramedic: 2, groundVehicle: "Ambulance ×2" },
  { base: "Broken Hill", aircraft: "B200", captain: 1, fo: 1, flightNurse: 2, paramedic: 1, groundVehicle: "Ambulance ×1" },
  { base: "Bankstown", aircraft: "—", captain: 1, fo: 1, flightNurse: 1, paramedic: 0, groundVehicle: "Van ×1" },
];

export interface StaffingOpportunity {
  id: string;
  position: string;
  base: string;
  annualSalaryCost: number; // cents
  additionalSectors: number; // per year
  sectorRevenue: number; // cents, per sector
  revenueGenerated: number; // cents
  netBenefit: number; // cents
  roiPct: number;
  breakEvenMonths: number;
  approved: boolean;
}

function calcStaffingOpportunity(
  id: string, position: string, base: string,
  annualSalaryCost: number, additionalSectors: number, sectorRevenue: number,
): Omit<StaffingOpportunity, "approved"> {
  const revenueGenerated = additionalSectors * sectorRevenue;
  const netBenefit = revenueGenerated - annualSalaryCost;
  const roiPct = (netBenefit / annualSalaryCost) * 100;
  const breakEvenMonths = annualSalaryCost > 0 ? (annualSalaryCost / (revenueGenerated / 12)) : 0;
  return { id, position, base, annualSalaryCost, additionalSectors, sectorRevenue, revenueGenerated, netBenefit, roiPct, breakEvenMonths };
}

export function getStaffingOpportunities(): StaffingOpportunity[] {
  // Orange Flight Nurse — matches leakage scanner #1: 187K salary, 192 sectors, $4,200 avg -> net ~619,400
  const orange = calcStaffingOpportunity("orange-fn", "Flight Nurse", "Orange", 187_000_00, 192, 4_200_00);
  // Narromine part-time paramedic — net +$280,000/yr (pre-populated target)
  const narromine = calcStaffingOpportunity("narromine-pm", "Part-time Paramedic (NEPT support)", "Narromine", 95_000_00, 99, 3_800_00);
  // Tamworth Captain — net +$198,000/yr (reduce Dubbo deadheads)
  const tamworth = calcStaffingOpportunity("tamworth-capt", "Captain (reduce Dubbo deadheads)", "Tamworth", 192_400_00, 93, 4_200_00);
  // Broken Hill second flight nurse — net +$344,000/yr (night coverage)
  const bhiNurse = calcStaffingOpportunity("bhi-fn2", "Second Flight Nurse (night coverage)", "Broken Hill", 187_000_00, 140, 3_800_00);

  return [
    { ...orange, approved: false },
    { ...narromine, approved: false },
    { ...tamworth, approved: false },
    { ...bhiNurse, approved: false },
  ];
}

// ─── Asset Acquisition Analyser (Tab 4) ──────────────────────────────────────
export interface VehicleAsset {
  id: string;
  name: string;
  purchasePrice: number; // cents
  annualRunning: number; // cents
  annualRevenue: number; // cents
  breakEvenMonths: number;
}

export const VEHICLE_ASSETS: VehicleAsset[] = [
  { id: "ambulance", name: "Ambulance (Mercedes Sprinter fit-out)", purchasePrice: 220_000_00, annualRunning: 35_000_00, annualRevenue: 380_000_00, breakEvenMonths: 7.5 },
  { id: "icu-van", name: "ICU Transfer Van", purchasePrice: 180_000_00, annualRunning: 28_000_00, annualRevenue: 240_000_00, breakEvenMonths: 10 },
  { id: "4wd", name: "4WD Patient Transport (rural access)", purchasePrice: 95_000_00, annualRunning: 22_000_00, annualRevenue: 195_000_00, breakEvenMonths: 8.2 },
  { id: "bus", name: "Bus (multi-patient dental transport)", purchasePrice: 145_000_00, annualRunning: 31_000_00, annualRevenue: 520_000_00, breakEvenMonths: 4.1 },
];

// ── Bariatric Van — standalone flagship vehicle model ──────────────────────────────
export interface BariatricVanModel {
  vehicleCost: number; // cents
  fitoutCost: number; // cents
  purchasePrice: number; // cents, vehicle + fit-out
  annualRunning: number; // cents
  annualCrewCost: number; // cents
  sectorRate: number; // cents, avg $2,100
  sectorsPerYearFullUtil: number; // 720
  annualRevenueFullUtil: number; // cents, $1,512,000
  annualRevenueYear1Conservative: number; // cents, $756,000 (50% ramp-up)
  breakEvenMonthsConservative: number; // 4.8
  breakEvenMonthsOptimistic: number; // 2.9
  npv3yrPerUnit: number; // cents, ~$2.1M
  ebitdaMarginPct: number; // 78
  roiYear1Pct: number; // 212
}

export const BARIATRIC_VAN: BariatricVanModel = {
  vehicleCost: 85_000_00,
  fitoutCost: 110_000_00,
  purchasePrice: 195_000_00,
  annualRunning: 32_000_00,
  annualCrewCost: 115_000_00,
  sectorRate: 2_100_00,
  sectorsPerYearFullUtil: 720, // 3/day x 5 days/wk x 48 weeks
  annualRevenueFullUtil: 1_512_000_00,
  annualRevenueYear1Conservative: 756_000_00,
  breakEvenMonthsConservative: 4.8,
  breakEvenMonthsOptimistic: 2.9,
  npv3yrPerUnit: 2_100_000_00,
  ebitdaMarginPct: 78,
  roiYear1Pct: 212,
};

export interface BariatricPlacementCandidate {
  location: string;
  catchmentPop: number;
  estDemandPerWeek: string;
  nearestHospital: string;
  score: number; // 1-5 stars
}

export const BARIATRIC_PLACEMENT_CANDIDATES: BariatricPlacementCandidate[] = [
  { location: "Dubbo", catchmentPop: 42_000, estDemandPerWeek: "8–12 sectors", nearestHospital: "Dubbo Base Hospital", score: 5 },
  { location: "Orange", catchmentPop: 41_000, estDemandPerWeek: "6–10 sectors", nearestHospital: "Orange Base Hospital", score: 4 },
  { location: "Broken Hill", catchmentPop: 18_000, estDemandPerWeek: "3–5 sectors", nearestHospital: "Broken Hill Hospital", score: 3 },
];

export const BARIATRIC_PLACEMENT_RECOMMENDATION =
  "Priority placement: Dubbo — highest catchment population in the RFDS SE operational zone, direct proximity to Dubbo Base Hospital, and existing RFDS crew base for operational support. Orange is the recommended second unit once Dubbo reaches 80% utilisation.";

export interface BariatricFleetYear {
  year: number;
  units: number;
  unitLocations: string;
  revenue: number; // cents
  net: number; // cents
}

export const BARIATRIC_FLEET_PLAN: BariatricFleetYear[] = [
  { year: 1, units: 1, unitLocations: "Dubbo", revenue: 756_000_00, net: 609_000_00 },
  { year: 2, units: 2, unitLocations: "Dubbo + Orange", revenue: 2_520_000_00, net: 2_160_000_00 },
  { year: 3, units: 3, unitLocations: "+ Broken Hill or Bathurst", revenue: 3_780_000_00, net: 3_210_000_00 },
];

export interface AircraftAsset {
  id: string;
  name: string;
  purchasePrice: number; // cents
  annualOps: number; // cents
  annualRevenue: number; // cents
  breakEvenMonths: number;
  notes: string;
}

export const AIRCRAFT_ASSETS: AircraftAsset[] = [
  { id: "pc12", name: "PC-12 (patient transport)", purchasePrice: 4_200_000_00, annualOps: 1_800_000_00, annualRevenue: 5_600_000_00, breakEvenMonths: 18, notes: "440 kts, 8 seats" },
  { id: "b200-3rd", name: "Third B200", purchasePrice: 6_800_000_00, annualOps: 2_400_000_00, annualRevenue: 6_800_000_00, breakEvenMonths: 22, notes: "Mirrors BHI fleet" },
  { id: "b350-2nd", name: "B350 replacement (second)", purchasePrice: 8_500_000_00, annualOps: 2_800_000_00, annualRevenue: 8_100_000_00, breakEvenMonths: 28, notes: "Fleet renewal" },
];

/** Cumulative P&L series in cents, months 1..n. Net monthly = revenue/12 - running/12, minus purchase in month 1. */
export function cumulativePnlSeries(purchasePrice: number, annualRunning: number, annualRevenue: number, months: number): { month: number; cumulative: number }[] {
  const monthlyNet = (annualRevenue - annualRunning) / 12;
  const series: { month: number; cumulative: number }[] = [];
  let cumulative = -purchasePrice;
  for (let m = 1; m <= months; m++) {
    cumulative += monthlyNet;
    series.push({ month: m, cumulative: Math.round(cumulative) });
  }
  return series;
}

export function findBreakEvenMonth(series: { month: number; cumulative: number }[]): number | null {
  for (const point of series) {
    if (point.cumulative >= 0) return point.month;
  }
  return null;
}

/** NPV at given discount rate over N years, annual net cash flow, minus initial purchase */
export function npv3yr(purchasePrice: number, annualRunning: number, annualRevenue: number, discountRate = 0.07, years = 3): number {
  const annualNet = annualRevenue - annualRunning;
  let npv = -purchasePrice;
  for (let y = 1; y <= years; y++) {
    npv += annualNet / Math.pow(1 + discountRate, y);
  }
  return Math.round(npv);
}

export function ebitdaMargin(annualRunning: number, annualRevenue: number): number {
  const ebitda = annualRevenue - annualRunning;
  return (ebitda / annualRevenue) * 100;
}

/** Simple IRR approximation via annual net cash flows over N years (Newton's method not needed for illustrative use — use approximation) */
export function approxIRR(purchasePrice: number, annualNet: number, years: number): number {
  // Solve for r where purchasePrice = sum(annualNet / (1+r)^t) for t=1..years, via bisection
  let lo = -0.5, hi = 2.0;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    let npv = -purchasePrice;
    for (let t = 1; t <= years; t++) npv += annualNet / Math.pow(1 + mid, t);
    if (npv > 0) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * 100; // as %
}

/** Monthly debt service (principal + interest) for a loan financed at annual rate over N years */
export function monthlyDebtService(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return Math.round(principal / n);
  const payment = (principal * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(payment);
}

// ─── Action Plan (Tab 5) ──────────────────────────────────────────────────────
export function assignPriority(annualValueCents: number): "high" | "medium" | "low" {
  const dollars = Math.abs(annualValueCents) / 100;
  if (dollars >= 300_000) return "high";
  if (dollars >= 100_000) return "medium";
  return "low";
}
