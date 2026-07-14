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
  B200: { mtow: 5.670,  tasKts: 240, fuelBurnKgHr: 180, hourlyRate: 4_000_00, part121: false }, // cents/hr
  B350: { mtow: 6.804,  tasKts: 270, fuelBurnKgHr: 260, hourlyRate: 4_800_00, part121: false },
  CL60: { mtow: 21.863, tasKts: 460, fuelBurnKgHr: 820, hourlyRate: 9_500_00, part121: true  }, // Challenger 604/605 — CASA Part 121
  PC12: { mtow: 4.740,  tasKts: 285, fuelBurnKgHr: 160, hourlyRate: 3_200_00, part121: false }, // Pilatus PC-12/47E NG — PT6A-67P, single-engine turboprop
} as const;

export type AircraftKey = keyof typeof AIRCRAFT;

// ─── Airservices Australia charges (IFR, MTOW < 20t) ───────────────────────
export let ENROUTE_RATE_PER_100KM_PER_TONNE = 0.90; // $ incl GST
export let MET_SURCHARGE_RATE_PER_100KM_PER_TONNE = 0.077; // $ incl GST
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
export let TNC_MAJOR_RATE = 12.11; // $/tonne — major airports (live-overridable)
export let TNC_REGIONAL_RATE = 6.96; // $/tonne — regional (live-overridable)
export let TNC_MINIMUM_MAJOR = 21_00; // cents — minimum at capital airports
const TNC_MAJOR_AIRPORTS = new Set(["YSSY", "YMML", "YBBN", "YPAD", "YPPH", "YSCB", "YMHB"]);
export let OUT_OF_HOURS_TNC_SURCHARGE = 261_00; // cents per movement, outside 0600-2200 local

// ─── Airport landing charges (Avdata schedule, $/tonne) ────────────────────
export let LANDING_RATES: Record<string, number> = {
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
export let FUEL_PRICE_PER_LITRE = 1.92; // AUD incl GST, Jet-A1 avg July 2026
const KG_PER_LITRE = 0.8;

// ─── Crew hourly rates (cents/hr) ───────────────────────────────────────────
export let CREW_HOURLY = {
  captain: 185_00,
  firstOfficer: 145_00,
  flightNurse: 95_00,
  flightParamedic: 95_00,
  icuDoctor: 180_00,
};
const CREW_MIN_HOURS = 3;

// ─── Ground transport (cents/leg) ──────────────────────────────────────────
export let GROUND_VEHICLE_RATES = {
  ambulance: 2_50_00,
  bus: 1_50_00,
  taxi: 8_00_00,
  van: 1_20_00,
  none: 0,
};

// ─── Accommodation ──────────────────────────────────────────────────────────
export let ACCOMMODATION_PER_PERSON_NIGHT = 180_00; // cents
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
  captainName?: string;      // named captain (CL60 / Part 121)
  firstOfficerName?: string; // named FO (CL60 / Part 121)
}

// ─── PC-12 Performance Reference (POH PC-12/47E MSN 1001-1942) ──────────────
// Source: Pilatus PC-12/47E Pilot's Information Manual / AFM
// Engine: Pratt & Whitney Canada PT6A-67P, 1,200 SHP flat-rated (1,845 SHP thermo)
// MTOW: 10,450 lb (4,740 kg) | MLW: 9,921 lb (4,500 kg) | MZFW: 9,039 lb (4,100 kg)
// Fuel: 2,704 lb (1,226 kg) usable — 402 US gal — Jet-A / Jet-A1
// TAS: 285 KTAS (high speed cruise FL220) | Long-range cruise: 208 KTAS FL300
// Certified ceiling: 30,000 ft | Rate of climb SL: 1,920 fpm | TO distance (50ft obs): 2,650 ft
// Range (6 pax NBAA IFR): 1,460 nm | Range (max payload): 651 nm | Range max fuel: 1,845 nm
// Engine limits (PT6A-67P): Ng max 104% | Np max 1,700 RPM (transient 1,870 RPM 20s)
//   Max TO ITT: 820°C (5 min) | Max continuous ITT: 760°C
//   Oil pressure: 90–135 psi (min 60 psi emergency) | Oil temp: –40 to 105°C (110°C 10 min max)
//   Torque: 44.3 psi max TO / 36.9 psi max continuous
//   Fuel type: Jet-A / Jet-A1 / Jet-B / JP-4 (anti-icing additive req'd below 0°C)
// Dirt/gravel capable: YES — certified for unimproved strips ≥ 2,650 ft
// Single-pilot IFR certified (CASA Part 135 — no FO required unless AOC mandates)
// Seats: 9 pax (aeromedical config: typically 1 stretcher + 2 medical crew)
export const PC12_CAPTAINS = [
  "Capt. R. Hughes", "Capt. B. Coote", "Capt. S. Morrison", "Capt. T. Barnes",
] as const;

// ─── CL60 Type-Rated Crew Roster ─────────────────────────────────────────────
export const CL60_CAPTAINS = [
  "Capt. M. Fuge",
  "Capt. N. Furney",
  "Capt. P. Martin",
  "Capt. J. Ivannac",
] as const;

export const CL60_FIRST_OFFICERS = [
  "F/O A. Walsh",
  "F/O D. Keenan",
  "F/O S. Morrison",
  "F/O T. Blake",
] as const;

// ─── International Airport Database (CL60 / Part 121 international ops) ──────
export interface IntlAirportInfo {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone: string;         // IANA tz
  currency: string;         // ISO 4217
  lat: number;              // decimal degrees
  lon: number;              // decimal degrees
  landingFeeUSD: number;    // approximate landing fee USD (MTOW ~21t)
  parkingFeePerHrUSD: number;
  handlingFeeUSD: number;   // ground handling/agent fee per turn
  facilityChargeUSD: number; // airport facility / passenger service charge per pax
  overnightApproxAUD: number; // avg hotel rate AUD (crew standard — 4★ near airport)
  customsNote: string;      // customs/PPR/slot notes
  fuelAvailable: boolean;
  jetFuelPriceApproxAUD?: number; // per litre, Jet-A1
}

export const INTL_AIRPORTS: IntlAirportInfo[] = [
  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  {
    icao: "NZAA", iata: "AKL", name: "Auckland International Airport", city: "Auckland", country: "New Zealand",
    timezone: "Pacific/Auckland", currency: "NZD",
    lat: -37.0082, lon: 174.7850,
    landingFeeUSD: 480, parkingFeePerHrUSD: 18, handlingFeeUSD: 650, facilityChargeUSD: 35,
    overnightApproxAUD: 280, fuelAvailable: true, jetFuelPriceApproxAUD: 2.10,
    customsNote: "PPR not required. Customs/biosecurity clearance mandatory. Medevac arrivals — contact Auckland Rescue Coordination Centre (RCCNZ) +64 4 577 8440.",
  },
  {
    icao: "NZWN", iata: "WLG", name: "Wellington International Airport", city: "Wellington", country: "New Zealand",
    timezone: "Pacific/Auckland", currency: "NZD",
    lat: -41.3272, lon: 174.8050,
    landingFeeUSD: 390, parkingFeePerHrUSD: 14, handlingFeeUSD: 580, facilityChargeUSD: 30,
    overnightApproxAUD: 260, fuelAvailable: true, jetFuelPriceApproxAUD: 2.15,
    customsNote: "Customs clearance required. Biosecurity declaration mandatory. Slot not required for medevac — advise ATC as medical priority.",
  },
  {
    icao: "WSSS", iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore",
    timezone: "Asia/Singapore", currency: "SGD",
    lat: 1.3644, lon: 103.9915,
    landingFeeUSD: 1200, parkingFeePerHrUSD: 45, handlingFeeUSD: 1800, facilityChargeUSD: 55,
    overnightApproxAUD: 380, fuelAvailable: true, jetFuelPriceApproxAUD: 2.45,
    customsNote: "PPR required 48 hrs in advance for non-scheduled ops. Overflight permit via Singapore CAAS required for Malaysian/Indonesian airspace transit. Medevac expedited on request via Changi ATC.",
  },
  {
    icao: "VHHH", iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "China (HK SAR)",
    timezone: "Asia/Hong_Kong", currency: "HKD",
    lat: 22.3080, lon: 113.9185,
    landingFeeUSD: 1450, parkingFeePerHrUSD: 55, handlingFeeUSD: 2200, facilityChargeUSD: 65,
    overnightApproxAUD: 420, fuelAvailable: true, jetFuelPriceApproxAUD: 2.80,
    customsNote: "Slot required — apply via ATFM Hong Kong minimum 24 hrs prior. Overflight permits for PRC airspace mandatory if routing via mainland. Medevac priority available — coordinate with HKIA Operations.",
  },
  {
    icao: "RJTT", iata: "HND", name: "Tokyo Haneda International Airport", city: "Tokyo", country: "Japan",
    timezone: "Asia/Tokyo", currency: "JPY",
    lat: 35.5533, lon: 139.7811,
    landingFeeUSD: 1680, parkingFeePerHrUSD: 62, handlingFeeUSD: 2400, facilityChargeUSD: 75,
    overnightApproxAUD: 450, fuelAvailable: true, jetFuelPriceApproxAUD: 2.90,
    customsNote: "Overflight and landing permission required via JCAB minimum 7 days prior. Medevac may receive expedited approval — contact JCAB International Affairs. Narcotics permit required if carrying controlled medications.",
  },
  {
    icao: "VTBS", iata: "BKK", name: "Suvarnabhumi International Airport", city: "Bangkok", country: "Thailand",
    timezone: "Asia/Bangkok", currency: "THB",
    lat: 13.6811, lon: 100.7474,
    landingFeeUSD: 620, parkingFeePerHrUSD: 22, handlingFeeUSD: 950, facilityChargeUSD: 28,
    overnightApproxAUD: 220, fuelAvailable: true, jetFuelPriceApproxAUD: 2.20,
    customsNote: "DGCA Thailand landing permission required minimum 48 hrs prior. Crew must hold Thai entry visas or e-Visa if applicable. Medevac priority — advise Bangkok ACC.",
  },
  {
    icao: "WADD", iata: "DPS", name: "Ngurah Rai International Airport", city: "Denpasar (Bali)", country: "Indonesia",
    timezone: "Asia/Makassar", currency: "IDR",
    lat: -8.7482, lon: 115.1670,
    landingFeeUSD: 480, parkingFeePerHrUSD: 16, handlingFeeUSD: 880, facilityChargeUSD: 25,
    overnightApproxAUD: 210, fuelAvailable: true, jetFuelPriceApproxAUD: 2.05,
    customsNote: "Indonesia DGCA permit required minimum 5 working days prior. Overflight permit for Indonesian airspace required separately. Consular coordination may be required for repatriation flights.",
  },
  {
    icao: "WIII", iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia",
    timezone: "Asia/Jakarta", currency: "IDR",
    lat: -6.1256, lon: 106.6558,
    landingFeeUSD: 550, parkingFeePerHrUSD: 18, handlingFeeUSD: 950, facilityChargeUSD: 28,
    overnightApproxAUD: 240, fuelAvailable: true, jetFuelPriceApproxAUD: 2.10,
    customsNote: "Indonesia DGCA permit required minimum 5 working days. Coordinate with Angkasa Pura II for handling. Medevac — advise Jakarta ACC for priority handling.",
  },
  {
    icao: "RPLL", iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines",
    timezone: "Asia/Manila", currency: "PHP",
    lat: 14.5086, lon: 121.0197,
    landingFeeUSD: 510, parkingFeePerHrUSD: 17, handlingFeeUSD: 820, facilityChargeUSD: 22,
    overnightApproxAUD: 195, fuelAvailable: true, jetFuelPriceApproxAUD: 2.15,
    customsNote: "CAAP Philippines landing permit required minimum 3 working days prior. Medevac priority — advise Manila ACC. Customs and BOQ clearance required at arrival.",
  },
  {
    icao: "NFTF", iata: "TBU", name: "Fua'amotu International Airport", city: "Nuku'alofa", country: "Tonga",
    timezone: "Pacific/Tongatapu", currency: "TOP",
    lat: -21.2411, lon: -175.1494,
    landingFeeUSD: 280, parkingFeePerHrUSD: 8, handlingFeeUSD: 400, facilityChargeUSD: 18,
    overnightApproxAUD: 180, fuelAvailable: true, jetFuelPriceApproxAUD: 2.55,
    customsNote: "PPR required. Tonga CAD permission minimum 48 hrs. Customs and biosecurity clearance mandatory. Limited after-hours customs support — coordinate in advance.",
  },
  {
    icao: "NVVF", iata: "VLI", name: "Bauerfield International Airport", city: "Port Vila", country: "Vanuatu",
    timezone: "Pacific/Efate", currency: "VUV",
    lat: -17.6993, lon: 168.3200,
    landingFeeUSD: 260, parkingFeePerHrUSD: 7, handlingFeeUSD: 380, facilityChargeUSD: 16,
    overnightApproxAUD: 200, fuelAvailable: true, jetFuelPriceApproxAUD: 2.60,
    customsNote: "CAAV Vanuatu landing approval required. Medevac coordination with Vanuatu Ministry of Health recommended. Customs available daylight hours — 0700-1700 local.",
  },
  {
    icao: "AGGH", iata: "HIR", name: "Honiara International Airport", city: "Honiara", country: "Solomon Islands",
    timezone: "Pacific/Guadalcanal", currency: "SBD",
    lat: -9.4280, lon: 160.0547,
    landingFeeUSD: 240, parkingFeePerHrUSD: 6, handlingFeeUSD: 360, facilityChargeUSD: 14,
    overnightApproxAUD: 190, fuelAvailable: true, jetFuelPriceApproxAUD: 2.70,
    customsNote: "Solomon Islands CAA permit required. Advance customs notification mandatory — limited after-hours capability. Medevac — contact RSIPF for ground coordination.",
  },
  {
    icao: "NTAA", iata: "PPT", name: "Fa'a'ā International Airport", city: "Papeete", country: "French Polynesia",
    timezone: "Pacific/Tahiti", currency: "XPF",
    lat: -17.5537, lon: -149.6067,
    landingFeeUSD: 620, parkingFeePerHrUSD: 22, handlingFeeUSD: 780, facilityChargeUSD: 30,
    overnightApproxAUD: 320, fuelAvailable: true, jetFuelPriceApproxAUD: 2.85,
    customsNote: "French DGAC permit required. French Polynesia is an overseas collectivity — EU rules do not apply. Customs via French authorities. PPR via Papeete ACC.",
  },
  // ── Papua New Guinea ─────────────────────────────────────────────────────
  {
    icao: "AYPY", iata: "POM", name: "Jacksons International Airport", city: "Port Moresby", country: "Papua New Guinea",
    timezone: "Pacific/Port_Moresby", currency: "PGK",
    lat: -9.4438, lon: 147.2200,
    landingFeeUSD: 320, parkingFeePerHrUSD: 10, handlingFeeUSD: 550, facilityChargeUSD: 18,
    overnightApproxAUD: 230, fuelAvailable: true, jetFuelPriceApproxAUD: 2.40,
    customsNote: "CASA PNG (Civil Aviation Safety Authority PNG) landing permit required minimum 3 working days prior. Crew visas required — obtain in advance via PNG High Commission. Customs and Quarantine clearance mandatory on arrival. Narcotics import permit required for controlled medications — coordinate with PNG Department of Health. Medevac — advise Jacksons ATC for priority handling.",
  },
  {
    icao: "AYMH", iata: "HGU", name: "Mount Hagen Kagamuga Airport", city: "Mount Hagen", country: "Papua New Guinea",
    timezone: "Pacific/Port_Moresby", currency: "PGK",
    lat: -5.8267, lon: 144.2958,
    landingFeeUSD: 220, parkingFeePerHrUSD: 6, handlingFeeUSD: 380, facilityChargeUSD: 12,
    overnightApproxAUD: 180, fuelAvailable: true, jetFuelPriceApproxAUD: 2.60,
    customsNote: "CASA PNG permit required. Customs clearance via Jacksons (Port Moresby) if not pre-cleared. PPR required — contact Momase Regional Air Services. Limited after-hours support. Coordinate medevac with Western Highlands Provincial Health Authority.",
  },
  {
    icao: "AYLK", iata: "LAE", name: "Nadzab Airport", city: "Lae", country: "Papua New Guinea",
    timezone: "Pacific/Port_Moresby", currency: "PGK",
    lat: -6.5699, lon: 146.7260,
    landingFeeUSD: 240, parkingFeePerHrUSD: 7, handlingFeeUSD: 400, facilityChargeUSD: 13,
    overnightApproxAUD: 185, fuelAvailable: true, jetFuelPriceApproxAUD: 2.55,
    customsNote: "CASA PNG permit required. PPR via NAC (National Airports Corporation PNG). Customs clearance available — advance notice required. Medevac coordination with Angau Memorial Hospital Lae.",
  },
  // ── New Caledonia ─────────────────────────────────────────────────────────
  {
    icao: "NWWW", iata: "GEA", name: "Noumea Magenta Airport", city: "Noumea", country: "New Caledonia",
    timezone: "Pacific/Noumea", currency: "XPF",
    lat: -22.2583, lon: 166.4728,
    landingFeeUSD: 210, parkingFeePerHrUSD: 6, handlingFeeUSD: 340, facilityChargeUSD: 14,
    overnightApproxAUD: 195, fuelAvailable: true, jetFuelPriceApproxAUD: 2.55,
    customsNote: "French DGAC rules apply — New Caledonia is a French special collectivity. Landing permit via DASS (Direction de l'Aviation Civile) minimum 48 hrs prior. Customs available 0700-1800 local. Medevac coordinate with CHT (Centre Hospitalier Territorial) Noumea.",
  },
  {
    icao: "NWWM", iata: "NOU", name: "La Tontouta International Airport", city: "Noumea", country: "New Caledonia",
    timezone: "Pacific/Noumea", currency: "XPF",
    lat: -22.0146, lon: 166.2130,
    landingFeeUSD: 380, parkingFeePerHrUSD: 12, handlingFeeUSD: 520, facilityChargeUSD: 22,
    overnightApproxAUD: 210, fuelAvailable: true, jetFuelPriceApproxAUD: 2.55,
    customsNote: "Primary international gateway for New Caledonia. French DGAC permit via DASS minimum 48 hrs prior. Full customs and biosecurity clearance available. Medevac priority — advise La Tontouta ATC. Controlled medications require French Ministry of Health (outbound) and DASS (inbound) documentation.",
  },
  // ── Fiji ─────────────────────────────────────────────────────────────────
  {
    icao: "NFFN", iata: "NAN", name: "Nadi International Airport", city: "Nadi", country: "Fiji",
    timezone: "Pacific/Fiji", currency: "FJD",
    lat: -17.7554, lon: 177.4430,
    landingFeeUSD: 340, parkingFeePerHrUSD: 11, handlingFeeUSD: 520, facilityChargeUSD: 22,
    overnightApproxAUD: 210, fuelAvailable: true, jetFuelPriceApproxAUD: 2.35,
    customsNote: "CAAF (Civil Aviation Authority of Fiji) landing permit required minimum 48 hrs prior. Crew and patient passports required. Customs and Biosecurity Fiji clearance mandatory. Medevac priority — advise Nadi ACC. Controlled medications require Fiji Ministry of Health import permit.",
  },
  {
    icao: "NFSU", iata: "SUV", name: "Nausori Airport", city: "Suva", country: "Fiji",
    timezone: "Pacific/Fiji", currency: "FJD",
    lat: -18.0433, lon: 178.5592,
    landingFeeUSD: 260, parkingFeePerHrUSD: 8, handlingFeeUSD: 400, facilityChargeUSD: 18,
    overnightApproxAUD: 195, fuelAvailable: true, jetFuelPriceApproxAUD: 2.40,
    customsNote: "CAAF permit required. Nausori handles domestic and some international traffic — confirm customs availability 24 hrs prior. Biosecurity clearance required. Medevac — coordinate with Colonial War Memorial Hospital Suva and advise Nausori ATC.",
  },
  // ── Samoa ────────────────────────────────────────────────────────────
  {
    icao: "NSFA", iata: "APW", name: "Faleolo International Airport", city: "Apia", country: "Samoa",
    timezone: "Pacific/Apia", currency: "WST",
    lat: -13.8300, lon: -172.0083,
    landingFeeUSD: 180, parkingFeePerHrUSD: 5, handlingFeeUSD: 280, facilityChargeUSD: 12,
    overnightApproxAUD: 175, fuelAvailable: true, jetFuelPriceApproxAUD: 2.65,
    customsNote: "Airports Samoa landing permit required minimum 48 hrs prior. Customs and biosecurity clearance mandatory. Medevac — coordinate with Tupua Tamasese Meaole Hospital Apia.",
  },
  // ── Middle East / Indian Ocean ───────────────────────────────────────────
  {
    icao: "OMDB", iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE",
    timezone: "Asia/Dubai", currency: "AED",
    lat: 25.2532, lon: 55.3657,
    landingFeeUSD: 980, parkingFeePerHrUSD: 38, handlingFeeUSD: 1600, facilityChargeUSD: 50,
    overnightApproxAUD: 360, fuelAvailable: true, jetFuelPriceApproxAUD: 2.30,
    customsNote: "UAE GCAA landing permit required minimum 48 hrs. Overflight permits for transit airspace (India, Pakistan, Oman) required separately. Controlled drug import permits via UAE Ministry of Health for medevac medications.",
  },
  // ── Americas (Repatriation) ───────────────────────────────────────────────
  {
    icao: "KLAX", iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA",
    timezone: "America/Los_Angeles", currency: "USD",
    lat: 33.9425, lon: -118.4081,
    landingFeeUSD: 1850, parkingFeePerHrUSD: 75, handlingFeeUSD: 2800, facilityChargeUSD: 95,
    overnightApproxAUD: 480, fuelAvailable: true, jetFuelPriceApproxAUD: 3.10,
    customsNote: "US CBP eAPIS crew/passenger manifest required minimum 60 min prior to departure (for inbound to USA). APIS outbound from USA required. No prior landing permission required but TSA/CBP clearance at designated international terminal mandatory.",
  },
];

// Helper — look up an international airport by ICAO
export function getIntlAirport(icao: string): IntlAirportInfo | undefined {
  return INTL_AIRPORTS.find(a => a.icao === icao.toUpperCase());
}

// International enroute/overflight charges (USD) — approximate per sector
export const INTL_OVERFLIGHT_FEES: Record<string, { country: string; feeUSD: number; note: string }> = {
  "NZ":  { country: "New Zealand",     feeUSD: 180,  note: "Airways NZ overflight charge per sector (MTOW-based, ~21t)" },
  "SG":  { country: "Singapore",       feeUSD: 320,  note: "CAAS Singapore overflight fee" },
  "ID":  { country: "Indonesia",       feeUSD: 450,  note: "DGCA Indonesia overflight — mandatory permit + fee" },
  "PH":  { country: "Philippines",     feeUSD: 280,  note: "CAAP Philippines overflight charge" },
  "TH":  { country: "Thailand",        feeUSD: 260,  note: "DGCA Thailand overflight fee" },
  "JP":  { country: "Japan",           feeUSD: 520,  note: "JCAB Japan overflight — permit + charge" },
  "HK":  { country: "Hong Kong",       feeUSD: 380,  note: "HK CAD overflight fee" },
  "FJ":  { country: "Fiji",            feeUSD: 200,  note: "CAAF Fiji overflight" },
  "PG":  { country: "Papua New Guinea", feeUSD: 380,  note: "CASA PNG overflight — mandatory permit + fee (per sector)" },
  "TO":  { country: "Tonga",           feeUSD: 140,  note: "Tonga CAD overflight" },
  "VU":  { country: "Vanuatu",         feeUSD: 150,  note: "CAAV Vanuatu overflight" },
  "SB":  { country: "Solomon Islands", feeUSD: 130,  note: "Solomon Islands CAA overflight" },
  "PF":  { country: "French Polynesia",feeUSD: 290,  note: "French DGAC overflight — French Polynesia airspace" },
  "AE":  { country: "UAE",             feeUSD: 410,  note: "UAE GCAA overflight fee" },
  "NC":  { country: "New Caledonia",    feeUSD: 120,  note: "DASS New Caledonia overflight — French airspace rules apply" },
  "WS":  { country: "Samoa",            feeUSD: 95,   note: "Airports Samoa overflight charge" },
};

// USD to AUD conversion rate (approximate, update periodically)
export const USD_TO_AUD = 1.55;

export interface IntlChargesSummary {
  landingFeeAUD: number;
  parkingFeeAUD: number;   // assumes 2 hr turn
  handlingFeeAUD: number;
  facilityChargeAUD: number;
  overflightFeesAUD: number;
  overnightAUD: number;
  totalAUD: number;
  airport: IntlAirportInfo;
  selectedOverflights: string[]; // country codes
}

export function calculateIntlCharges(
  icao: string,
  parkingHours: number,
  paxCount: number,
  crewNights: number,
  crewCount: number,
  overflightCountries: string[],
): IntlChargesSummary | null {
  const ap = getIntlAirport(icao);
  if (!ap) return null;
  const landingFeeAUD = ap.landingFeeUSD * USD_TO_AUD;
  const parkingFeeAUD = ap.parkingFeePerHrUSD * parkingHours * USD_TO_AUD;
  const handlingFeeAUD = ap.handlingFeeUSD * USD_TO_AUD;
  const facilityChargeAUD = ap.facilityChargeUSD * paxCount * USD_TO_AUD;
  const overflightFeesAUD = overflightCountries.reduce((sum, cc) => {
    return sum + (INTL_OVERFLIGHT_FEES[cc]?.feeUSD ?? 0) * USD_TO_AUD;
  }, 0);
  const overnightAUD = ap.overnightApproxAUD * crewNights * crewCount;
  return {
    landingFeeAUD, parkingFeeAUD, handlingFeeAUD, facilityChargeAUD,
    overflightFeesAUD, overnightAUD,
    totalAUD: landingFeeAUD + parkingFeeAUD + handlingFeeAUD + facilityChargeAUD + overflightFeesAUD + overnightAUD,
    airport: ap,
    selectedOverflights: overflightCountries,
  };
}

export interface LegOvernight {
  legIdx: number;      // which leg the crew stays after
  nights: number;      // number of nights
  ratePerPersonAUD: number; // hotel rate per person per night (AUD)
  hotelName?: string;  // for display only
  locationLabel?: string; // for display only
}

export interface QuoteInput {
  aircraftType: AircraftKey;
  legs: LegInput[];
  crew: CrewConfig;
  marginPercent: number;
  accommodationNights: number;  // legacy — kept for backward compat, ignored when legOvernights supplied
  legOvernights?: LegOvernight[]; // per-leg overnight stays
  includeReturnLeg: boolean;
  intlChargesAUD?: number;  // total international airport/overflight charges (AUD cents) — from intl panel
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
  arrivalTime: string;       // HH:MM local at destination
  departureDateOffset: number; // 0 = same day, 1 = next day, etc.
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
    intlCharges: number;   // international airport + overflight fees
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
  if (icao === "YBNS") return TNC_RATES.YBNS; // Ballina special interim rate, not live-tracked
  if (TNC_MAJOR_AIRPORTS.has(icao)) return TNC_MAJOR_RATE;
  if (icao in TNC_RATES) return TNC_REGIONAL_RATE;
  return TNC_REGIONAL_RATE;
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
      arrivalTime,
      departureDateOffset: 0, // simplified — same-day; could be enhanced with date tracking
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
  // When a return leg is included for quoting purposes only, the crew overnights at
  // destination — the return is a separate duty day and must NOT factor into FDP warnings.
  const outboundLegs = input.includeReturnLeg ? legBreakdowns.slice(0, -1) : legBreakdowns;
  const outboundFlightHours = outboundLegs.reduce((sum, lb) => sum + lb.flightHours, 0);
  const totalFdpHours = outboundFlightHours + outboundLegs.length * (PRE_FLIGHT_HOURS + POST_FLIGHT_HOURS);
  const billedHours = Math.max(totalFlightHours + legs.length * (PRE_FLIGHT_HOURS + POST_FLIGHT_HOURS), CREW_MIN_HOURS);

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
  // accommodationRequired: triggered by long outbound FDP, OR by the presence of a return
  // leg (which always means an overnight stay at destination for quoting purposes).
  const accommodationRequired = totalFdpHours > FDP_ACCOMMODATION_TRIGGER_HOURS || input.includeReturnLeg;
  const crewCount = Math.max(input.crew.count || 1, crewBreakdown.length);
  let accommodation = 0;
  if (input.legOvernights && input.legOvernights.length > 0) {
    // Per-leg overnight — use the hotel rate selected for each leg
    for (const ov of input.legOvernights) {
      const ratePerPersonCents = Math.round((ov.ratePerPersonAUD || 0) * 100);
      accommodation += ov.nights * crewCount * ratePerPersonCents;
    }
  } else {
    // Legacy flat-rate fallback
    const nights = input.accommodationNights || 0;
    accommodation = nights * crewCount * ACCOMMODATION_PER_PERSON_NIGHT;
  }

  // ─── Aircraft hourly cost ───────────────────────────────────────────────
  const aircraftCost = totalFlightHours * aircraft.hourlyRate;

  // ─── International charges (from intl panel — AUD dollars, convert to cents) ──
  const intlChargesCents = Math.round((input.intlChargesAUD ?? 0) * 100);

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
    accommodation +
    intlChargesCents
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
      intlCharges: intlChargesCents,
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

// ─── Live rate loading ───────────────────────────────────────────────
// Fetches current rates from the server-side quote_rates table and overrides
// the module-level rate variables above. If the fetch fails for any reason,
// the hardcoded fallback defaults declared above remain in effect.

export interface LiveQuoteRate {
  id: number;
  rateKey: string;
  rateValue: string;
  category: string;
  label: string;
  unit: string;
  source: string | null;
  effectiveDate: string | null;
  previousValue: string | null;
  previousDate: string | null;
  lastChecked: string | null;
  autoUpdateEnabled: number;
  notes: string | null;
  updatedAt: string;
}

let lastLoadedRates: LiveQuoteRate[] = [];

/** Resolve the correct API base — mirrors the logic in lib/queryClient.ts. */
function resolveApiBase(): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".pplx.app")) {
    return "/port/5000";
  }
  return "";
}

/**
 * Loads live rates from GET /api/quote-rates and overrides the module-level
 * rate variables used by calculateQuote(). Falls back silently to the
 * hardcoded defaults declared above if the fetch fails or a key is missing.
 */
export async function loadLiveRates(): Promise<void> {
  try {
    const apiBase = resolveApiBase();
    const appKey = (import.meta as any).env?.VITE_APP_KEY as string | undefined;
    const headers: Record<string, string> = {};
    if (appKey) headers["X-App-Key"] = appKey;

    const res = await fetch(`${apiBase}/api/quote-rates`, { headers });
    if (!res.ok) return;
    const rates: LiveQuoteRate[] = await res.json();
    if (!Array.isArray(rates) || rates.length === 0) return;
    lastLoadedRates = rates;

    const byKey: Record<string, LiveQuoteRate> = {};
    for (const r of rates) byKey[r.rateKey] = r;
    const num = (key: string): number | undefined => {
      const r = byKey[key];
      if (!r) return undefined;
      const n = parseFloat(r.rateValue);
      return Number.isNaN(n) ? undefined : n;
    };

    // Airservices
    const enroute = num("enroute_rate");
    if (enroute !== undefined) ENROUTE_RATE_PER_100KM_PER_TONNE = enroute;
    const met = num("met_surcharge_rate");
    if (met !== undefined) MET_SURCHARGE_RATE_PER_100KM_PER_TONNE = met;
    const tncMajor = num("tnc_major_rate");
    if (tncMajor !== undefined) TNC_MAJOR_RATE = tncMajor;
    const tncRegional = num("tnc_regional_rate");
    if (tncRegional !== undefined) TNC_REGIONAL_RATE = tncRegional;
    const outOfHours = num("tnc_out_of_hours");
    if (outOfHours !== undefined) OUT_OF_HOURS_TNC_SURCHARGE = Math.round(outOfHours * 100);
    const tncMin = num("tnc_minimum_major");
    if (tncMin !== undefined) TNC_MINIMUM_MAJOR = Math.round(tncMin * 100);

    // Fuel
    const fuel = num("fuel_jet_a1_per_litre");
    if (fuel !== undefined) FUEL_PRICE_PER_LITRE = fuel;

    // Crew ($/hr -> cents/hr)
    const captain = num("crew_captain");
    const firstOfficer = num("crew_first_officer");
    const flightNurse = num("crew_flight_nurse");
    const icuDoctor = num("crew_icu_doctor");
    CREW_HOURLY = {
      captain: captain !== undefined ? Math.round(captain * 100) : CREW_HOURLY.captain,
      firstOfficer: firstOfficer !== undefined ? Math.round(firstOfficer * 100) : CREW_HOURLY.firstOfficer,
      flightNurse: flightNurse !== undefined ? Math.round(flightNurse * 100) : CREW_HOURLY.flightNurse,
      flightParamedic: flightNurse !== undefined ? Math.round(flightNurse * 100) : CREW_HOURLY.flightParamedic,
      icuDoctor: icuDoctor !== undefined ? Math.round(icuDoctor * 100) : CREW_HOURLY.icuDoctor,
    };

    // Landing fees per-airport ($/tonne) — DB keys use landing_XXXX, with landing_YNBR
    // mapping to the engine's YNAR (Narrabri) key.
    const landingKeyMap: Record<string, string> = { YNBR: "YNAR" };
    const newLandingRates: Record<string, number> = { ...LANDING_RATES };
    for (const r of rates) {
      if (!r.rateKey.startsWith("landing_")) continue;
      const suffix = r.rateKey.replace("landing_", "");
      const n = parseFloat(r.rateValue);
      if (Number.isNaN(n)) continue;
      if (suffix === "default") {
        newLandingRates.DEFAULT = n;
      } else {
        const icao = landingKeyMap[suffix] ?? suffix;
        newLandingRates[icao] = n;
      }
    }
    LANDING_RATES = newLandingRates;

    // Ground transport ($/leg -> cents/leg)
    const ambulance = num("ground_ambulance");
    const bus = num("ground_bus");
    const taxi = num("ground_taxi");
    const van = num("ground_van");
    GROUND_VEHICLE_RATES = {
      ambulance: ambulance !== undefined ? Math.round(ambulance * 100) : GROUND_VEHICLE_RATES.ambulance,
      bus: bus !== undefined ? Math.round(bus * 100) : GROUND_VEHICLE_RATES.bus,
      taxi: taxi !== undefined ? Math.round(taxi * 100) : GROUND_VEHICLE_RATES.taxi,
      van: van !== undefined ? Math.round(van * 100) : GROUND_VEHICLE_RATES.van,
      none: 0,
    };

    // Accommodation ($/person/night -> cents)
    const accom = num("accommodation_per_person_night");
    if (accom !== undefined) ACCOMMODATION_PER_PERSON_NIGHT = Math.round(accom * 100);
  } catch (err) {
    // Best-effort — keep hardcoded defaults on any failure
    console.error("[quoteEngine] loadLiveRates failed, using hardcoded defaults:", err);
  }
}

/** Returns the most recent lastChecked timestamp among all loaded rates, or null if none loaded. */
export function getRatesLastChecked(): string | null {
  if (lastLoadedRates.length === 0) return null;
  let latest: string | null = null;
  for (const r of lastLoadedRates) {
    if (r.lastChecked && (!latest || r.lastChecked > latest)) latest = r.lastChecked;
  }
  return latest;
}

/** Returns the currently loaded live rates (empty array if loadLiveRates() has not run yet). */
export function getLoadedRates(): LiveQuoteRate[] {
  return lastLoadedRates;
}
