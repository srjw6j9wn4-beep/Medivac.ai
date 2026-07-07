/**
 * quoteEngine.ts
 * Client-side cost calculation engine for the Charter Quick Quote module.
 *
 * All monetary values are in INTEGER CENTS. All charges below are inclusive of
 * GST unless otherwise noted (Airservices Australia ACCC-determined rates and
 * the Avdata / statutory landing and terminal navigation charges already embed
 * GST in the published rate).
 *
 * References (rates as supplied for the 2025/26 charging year):
 *  - Airservices Australia Enroute & Met charges: https://www.airservicesaustralia.com/customers/prices/
 *  - Terminal Navigation Charge (TNC) — Airservices Statutory Charging Determination
 *  - Avdata landing charge schedules — https://www.avdata.com.au
 */

// ─── Aircraft constants ─────────────────────────────────────────────────────
export const AIRCRAFT = {
  B200: { mtow: 5.670, tasKts: 240, fuelBurnKgHr: 180, hourlyRate: 4_000_00 }, // cents/hr
  B350: { mtow: 6.804, tasKts: 270, fuelBurnKgHr: 260, hourlyRate: 4_800_00 },
} as const;

export type AircraftKey = keyof typeof AIRCRAFT;

// ─── Airservices Australia charges (IFR, MTOW < 20t) ───────────────────────
const ENROUTE_RATE_PER_100KM_PER_TONNE = 0.90; // $ incl GST
const MET_SURCHARGE_RATE_PER_100KM_PER_TONNE = 0.077; // $ incl GST
const NM_TO_KM = 1.852;

// ─── Terminal Navigation Charge (TNC) rates ($/tonne, incl GST) ────────────
export const TNC_RATES: Record<string, number> = {
  YSSY: 12.11, // Sydney
  YMML: 12.11, // Melbourne
  YBBN: 12.11, // Brisbane
  YPAD: 12.11, // Adelaide
  YPPH: 12.11, // Perth
  YSCB: 12.11, // Canberra
  YMHB: 12.11, // Hobart
  YBNS: 16.36, // Ballina (special 2026 interim)
  // Regional (typical)
  YSDU: 6.96,  // Dubbo
  YBHI: 6.96,  // Broken Hill
  YBTL: 6.96,  // Townsville
  YCSM: 6.96,  // Cessnock
  YARM: 6.96,  // Armidale
  YBUD: 6.96,  // Bundaberg
  YLHI: 6.96,  // Lord Howe Island
  YSTW: 6.96,  // Tamworth
  YNTN: 6.96,  // Normanton
  DEFAULT: 6.96,
};
const TNC_MINIMUM_MAJOR = 21_00; // cents — minimum at capital airports
const TNC_MAJOR_AIRPORTS = new Set(["YSSY", "YMML", "YBBN", "YPAD", "YPPH", "YSCB", "YMHB"]);
const OUT_OF_HOURS_TNC_SURCHARGE = 261_00; // cents per movement, outside 0600-2200 local

// ─── Airport landing charges (Avdata schedule, $/tonne) ────────────────────
export const LANDING_RATES: Record<string, number> = {
  YSDU: 15.45,  // Dubbo
  YBHI: 15.45,  // Broken Hill
  YBTL: 16.00,  // Townsville
  YARM: 15.45,  // Armidale
  YBUD: 15.03,  // Bundaberg
  YLHI: 22.00,  // Lord Howe Island (remote charge)
  YSTW: 15.45,  // Tamworth
  YNRM: 15.45,  // Narromine
  YORG: 14.00,  // Orange
  YBKE: 14.00,  // Bourke
  YNAR: 14.00,  // Narrabri
  YSSY: 5.54,   // Sydney
  YMML: 27.68,  // Melbourne GA
  YBBN: 6.18,   // Brisbane
  DEFAULT: 14.00,
};
const LANDING_MINIMUM = 15_00; // cents

// ─── Fuel ────────────────────────────────────────────────────────────────
const FUEL_PRICE_PER_LITRE = 1.92; // AUD incl GST, Jet-A1 avg July 2026
const KG_PER_LITRE = 0.8;

// ─── Crew hourly rates (cents/hr) ───────────────────────────────────────────
export const CREW_HOURLY = {
  captain: 185_00,
  firstOfficer: 145_00,
  flightNurse: 95_00,
  flightParamedic: 95_00,
  icuDoctor: 180_00,
};
const CREW_MIN_HOURS = 3;

// ─── Ground transport (cents/leg) ──────────────────────────────────────────
export const GROUND_VEHICLE_RATES = {
  ambulance: 2_50_00,
  bus: 1_50_00,
  taxi: 8_00_00,
  van: 1_20_00,
  none: 0,
};

// ─── Accommodation ──────────────────────────────────────────────────────────
export const ACCOMMODATION_PER_PERSON_NIGHT = 180_00; // cents
const FDP_ACCOMMODATION_TRIGGER_HOURS = 12;
const FDP_MAX_HOURS = 14; // CASA CAO 48.1 multi-crew max

// ─── Pre/post flight duty additions per leg ────────────────────────────────
const PRE_FLIGHT_HOURS = 0.5;
const POST_FLIGHT_HOURS = 0.2;

// ─── Types ──────────────────────────────────────────────────────────────────
export type GroundTransportType = "ambulance" | "bus" | "taxi" | "van" | "none";

export interface LegInput {
  fromICAO: string;
  fromName: string;
  toICAO: string;
  toName: string;
  distanceNm: number;
  departureTime: string; // HH:MM local
  refuelStop: boolean;
  groundTransport?: { type: GroundTransportType; legs: number };
}

export interface CrewConfig {
  captain: boolean;
  firstOfficer: boolean;
  flightNurse: boolean;
  flightParamedic: boolean;
  icuDoctor: boolean;
  count: number;
}

export interface QuoteInput {
  aircraftType: AircraftKey;
  legs: LegInput[];
  crew: CrewConfig;
  marginPercent: number;
  accommodationNights: number;
  includeReturnLeg: boolean;
}

export interface LegCostBreakdown {
  leg: LegInput;
  flightHours: number;
  distanceKm: number;
  enroute: number;
  met: number;
  terminalNavDeparture: number;
  terminalNavArrival: number;
  landingFee: number;
  fuel: number;
  groundTransport: number;
  outOfHoursSurcharge: number;
  isOutOfHoursDeparture: boolean;
  isOutOfHoursArrival: boolean;
}

export interface QuoteCostBreakdown {
  legs: LegCostBreakdown[];
  subtotals: {
    enroute: number;
    met: number;
    terminalNav: number;
    landingFees: number;
    fuel: number;
    crew: number;
    groundTransport: number;
    accommodation: number;
    outOfHoursSurcharge: number;
  };
  crewBreakdown: { role: string; hours: number; rate: number; cost: number }[];
  totalFlightHours: number;
  totalDistanceNm: number;
  totalFdpHours: number;
  accommodationRequired: boolean;
  aircraftCost: number;
  baseCost: number;
  margin: number;
  gstIncluded: boolean;
  finalQuote: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function tncRateFor(icao: string): number {
  return TNC_RATES[icao] ?? TNC_RATES.DEFAULT;
}

function landingRateFor(icao: string): number {
  return LANDING_RATES[icao] ?? LANDING_RATES.DEFAULT;
}

function isOutOfHours(hhmm: string): boolean {
  if (!hhmm || !hhmm.includes(":")) return false;
  const [h] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return false;
  // Outside 0600–2200 local
  return h < 6 || h >= 22;
}

function addMinutesToTime(hhmm: string, minutes: number): string {
  if (!hhmm || !hhmm.includes(":")) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Mirrors the last leg reversed, departing after an assumed 1hr ground turnaround. */
export function buildReturnLeg(lastLeg: LegInput, firstLeg: LegInput): LegInput {
  const flightHours = lastLeg.distanceNm / AIRCRAFT.B200.tasKts; // rough estimate for turnaround calc, refined by caller
  const arrivalOffsetMin = Math.round(flightHours * 60) + 60; // +60 min ground turnaround before return departs
  return {
    fromICAO: lastLeg.toICAO,
    fromName: lastLeg.toName,
    toICAO: firstLeg.fromICAO,
    toName: firstLeg.fromName,
    distanceNm: lastLeg.distanceNm,
    departureTime: addMinutesToTime(lastLeg.departureTime, arrivalOffsetMin),
    refuelStop: lastLeg.refuelStop,
    groundTransport: { type: "none", legs: 0 },
  };
}

// ─── Main calculation ───────────────────────────────────────────────────────
export function calculateQuote(input: QuoteInput): QuoteCostBreakdown {
  const aircraft = AIRCRAFT[input.aircraftType];
  const mtowTonnes = aircraft.mtow;

  let legs = [...input.legs];
  if (input.includeReturnLeg && legs.length > 0) {
    const returnLeg = buildReturnLeg(legs[legs.length - 1], legs[0]);
    legs = [...legs, returnLeg];
  }

  const legBreakdowns: LegCostBreakdown[] = [];

  let totalEnroute = 0;
  let totalMet = 0;
  let totalTerminalNav = 0;
  let totalLandingFees = 0;
  let totalFuel = 0;
  let totalGroundTransport = 0;
  let totalOutOfHours = 0;
  let totalFlightHours = 0;
  let totalDistanceNm = 0;

  for (const leg of legs) {
    const distanceKm = leg.distanceNm * NM_TO_KM;
    const flightHours = leg.distanceNm / aircraft.tasKts;

    // Airservices Australia charges
    const enroute = ENROUTE_RATE_PER_100KM_PER_TONNE * (distanceKm / 100) * mtowTonnes * 100; // cents
    const met = MET_SURCHARGE_RATE_PER_100KM_PER_TONNE * (distanceKm / 100) * mtowTonnes * 100; // cents

    // Terminal Navigation Charges — one for departure aerodrome, one for arrival aerodrome
    const depIsMajor = TNC_MAJOR_AIRPORTS.has(leg.fromICAO);
    const arrIsMajor = TNC_MAJOR_AIRPORTS.has(leg.toICAO);
    let tncDeparture = tncRateFor(leg.fromICAO) * mtowTonnes * 100;
    let tncArrival = tncRateFor(leg.toICAO) * mtowTonnes * 100;
    if (depIsMajor) tncDeparture = Math.max(tncDeparture, TNC_MINIMUM_MAJOR);
    if (arrIsMajor) tncArrival = Math.max(tncArrival, TNC_MINIMUM_MAJOR);

    // Out-of-hours TNC surcharge — applies per movement outside 0600-2200 local
    const isOutOfHoursDeparture = isOutOfHours(leg.departureTime);
    const arrivalTime = addMinutesToTime(leg.departureTime, Math.round(flightHours * 60));
    const isOutOfHoursArrival = isOutOfHours(arrivalTime);
    let outOfHoursSurcharge = 0;
    if (isOutOfHoursDeparture) outOfHoursSurcharge += OUT_OF_HOURS_TNC_SURCHARGE;
    if (isOutOfHoursArrival) outOfHoursSurcharge += OUT_OF_HOURS_TNC_SURCHARGE;

    // Landing fee on arrival (and again if this leg includes a refuel stop, treated as
    // an extra intermediate landing/departure at the same destination charge rate)
    let landingFee = Math.max(landingRateFor(leg.toICAO) * mtowTonnes * 100, LANDING_MINIMUM);
    if (leg.refuelStop) {
      landingFee += Math.max(landingRateFor(leg.toICAO) * mtowTonnes * 100, LANDING_MINIMUM);
    }

    // Fuel cost
    const fuelKg = aircraft.fuelBurnKgHr * flightHours;
    const fuelLitres = fuelKg / KG_PER_LITRE;
    const fuel = fuelLitres * FUEL_PRICE_PER_LITRE * 100; // cents
    const fuelWithRefuelOverhead = leg.refuelStop ? fuel * 1.02 : fuel; // small overhead for refuel handling

    // Ground transport
    const gt = leg.groundTransport;
    const groundTransport = gt && gt.type !== "none" ? GROUND_VEHICLE_RATES[gt.type] * (gt.legs || 1) : 0;

    legBreakdowns.push({
      leg,
      flightHours,
      distanceKm,
      enroute,
      met,
      terminalNavDeparture: tncDeparture,
      terminalNavArrival: tncArrival,
      landingFee,
      fuel: fuelWithRefuelOverhead,
      groundTransport,
      outOfHoursSurcharge,
      isOutOfHoursDeparture,
      isOutOfHoursArrival,
    });

    totalEnroute += enroute;
    totalMet += met;
    totalTerminalNav += tncDeparture + tncArrival;
    totalLandingFees += landingFee;
    totalFuel += fuelWithRefuelOverhead;
    totalGroundTransport += groundTransport;
    totalOutOfHours += outOfHoursSurcharge;
    totalFlightHours += flightHours;
    totalDistanceNm += leg.distanceNm;
  }

  // ─── Crew costs ───────────────────────────────────────────────────────────
  // FDP = total flight time + 0.5hr pre-flight + 0.2hr post-flight PER LEG
  const totalFdpHours = totalFlightHours + legs.length * (PRE_FLIGHT_HOURS + POST_FLIGHT_HOURS);
  const billedHours = Math.max(totalFdpHours, CREW_MIN_HOURS);

  const crewBreakdown: { role: string; hours: number; rate: number; cost: number }[] = [];
  let totalCrewCost = 0;

  // Captain always present
  {
    const cost = billedHours * CREW_HOURLY.captain;
    crewBreakdown.push({ role: "Captain", hours: billedHours, rate: CREW_HOURLY.captain, cost });
    totalCrewCost += cost;
  }
  if (input.crew.firstOfficer) {
    const cost = billedHours * CREW_HOURLY.firstOfficer;
    crewBreakdown.push({ role: "First Officer", hours: billedHours, rate: CREW_HOURLY.firstOfficer, cost });
    totalCrewCost += cost;
  }
  if (input.crew.flightNurse) {
    const cost = billedHours * CREW_HOURLY.flightNurse;
    crewBreakdown.push({ role: "Flight Nurse", hours: billedHours, rate: CREW_HOURLY.flightNurse, cost });
    totalCrewCost += cost;
  }
  if (input.crew.flightParamedic) {
    const cost = billedHours * CREW_HOURLY.flightParamedic;
    crewBreakdown.push({ role: "Flight Paramedic", hours: billedHours, rate: CREW_HOURLY.flightParamedic, cost });
    totalCrewCost += cost;
  }
  if (input.crew.icuDoctor) {
    const cost = billedHours * CREW_HOURLY.icuDoctor;
    crewBreakdown.push({ role: "ICU Doctor", hours: billedHours, rate: CREW_HOURLY.icuDoctor, cost });
    totalCrewCost += cost;
  }

  // ─── Accommodation ──────────────────────────────────────────────────────
  const accommodationRequired = totalFdpHours > FDP_ACCOMMODATION_TRIGGER_HOURS;
  const nights = input.accommodationNights || 0;
  const crewCount = Math.max(input.crew.count || 1, crewBreakdown.length);
  const accommodation = nights * crewCount * ACCOMMODATION_PER_PERSON_NIGHT;

  // ─── Aircraft hourly cost ───────────────────────────────────────────────
  const aircraftCost = totalFlightHours * aircraft.hourlyRate;

  // ─── Totals ─────────────────────────────────────────────────────────────
  const baseCost = Math.round(
    aircraftCost +
    totalFuel +
    totalEnroute +
    totalMet +
    totalTerminalNav +
    totalOutOfHours +
    totalLandingFees +
    totalCrewCost +
    totalGroundTransport +
    accommodation
  );

  const margin = Math.round(baseCost * (input.marginPercent / 100));
  const finalQuote = baseCost + margin;

  return {
    legs: legBreakdowns,
    subtotals: {
      enroute: Math.round(totalEnroute),
      met: Math.round(totalMet),
      terminalNav: Math.round(totalTerminalNav),
      landingFees: Math.round(totalLandingFees),
      fuel: Math.round(totalFuel),
      crew: Math.round(totalCrewCost),
      groundTransport: Math.round(totalGroundTransport),
      accommodation: Math.round(accommodation),
      outOfHoursSurcharge: Math.round(totalOutOfHours),
    },
    crewBreakdown,
    totalFlightHours,
    totalDistanceNm,
    totalFdpHours,
    accommodationRequired,
    aircraftCost: Math.round(aircraftCost),
    baseCost,
    margin,
    gstIncluded: true,
    finalQuote,
  };
}

export function fmtCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
