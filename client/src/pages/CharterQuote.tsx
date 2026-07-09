import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  calculateQuote, fmtCents, AIRCRAFT, loadLiveRates, getRatesLastChecked,
  type AircraftKey, type LegInput, type CrewConfig, type QuoteInput, type QuoteCostBreakdown,
  type GroundTransportType, type LiveQuoteRate,
} from "@/lib/quoteEngine";
import { generateCharterQuotePDF } from "@/lib/generateCharterQuotePDF";
import { AirportLegPicker } from "@/components/AirportSearch";
import { type Airport } from "@/lib/airportData";
import {
  Plane, Plus, Trash2, Calculator, Save, FileDown, RotateCcw,
  AlertTriangle, ChevronDown, ChevronUp, Users, MapPin, Hotel, Percent, Eye, Edit3,
  DollarSign, RefreshCw, Pencil, Check, X, ArrowUp, ArrowDown, Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Purpose = "medevac_charter" | "clinic_dental" | "clinic_rahs" | "clinic_mental_health" | "clinic_specialist" | "clinic_other" | "scenic" | "freight" | "corporate" | "other";
type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

interface CharterQuoteRecord {
  id: number;
  quoteNumber: string;
  clientName: string;
  clientContact: string | null;
  purpose: string;
  aircraftType: string;
  departureDate: string;
  legs: string;
  crew: string;
  costs: string;
  totalCost: number;
  marginPercent: number;
  finalQuote: number;
  status: QuoteStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: "medevac_charter",     label: "Aeromedical Transfer" },
  { value: "clinic_dental",       label: "Clinic — Dental" },
  { value: "clinic_rahs",         label: "Clinic — RAHS" },
  { value: "clinic_mental_health",label: "Clinic — Mental Health" },
  { value: "clinic_specialist",   label: "Clinic — Specialist" },
  { value: "clinic_other",        label: "Clinic — Other" },
  { value: "scenic",              label: "Scenic" },
  { value: "freight",             label: "Freight" },
  { value: "corporate",           label: "Corporate" },
  { value: "other",               label: "Other" },
];

const GROUND_OPTIONS: { value: GroundTransportType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "ambulance", label: "Ambulance" },
  { value: "bus", label: "Bus" },
  { value: "taxi", label: "Taxi" },
  { value: "van", label: "Van" },
];

const TEAL = "#01696F";

// ─── Corporate Traveller Accommodation Data ──────────────────────────────────
interface AccomProperty {
  name: string;
  chain: string;
  stars: number;
  approxRateAUD: number; // per night AUD
  phone: string;
  bookingUrl: string;
}
interface AccomLocation {
  label: string;
  icaoCodes: string[]; // match legs with these ICAO codes
  hotels: AccomProperty[];
}

const CORPORATE_TRAVELLER_ACCOM: AccomLocation[] = [
  {
    label: "Dubbo NSW",
    icaoCodes: ["YSDU"],
    hotels: [
      { name: "Grand Mercure Dubbo", chain: "Accor", stars: 4, approxRateAUD: 175, phone: "+61 2 6882 0900", bookingUrl: "https://all.accor.com/hotel/8536" },
      { name: "ibis budget Dubbo", chain: "Accor", stars: 2, approxRateAUD: 105, phone: "+61 2 6882 0499", bookingUrl: "https://all.accor.com/hotel/6860" },
      { name: "Quality Inn Dubbo International", chain: "Choice Hotels", stars: 3, approxRateAUD: 160, phone: "+61 2 6882 0922", bookingUrl: "https://www.choicehotels.com/new-south-wales/dubbo" },
      { name: "Comfort Inn & Suites Dubbo", chain: "Choice Hotels", stars: 3, approxRateAUD: 150, phone: "+61 2 6884 8877", bookingUrl: "https://www.choicehotels.com/new-south-wales/dubbo" },
    ],
  },
  {
    label: "Broken Hill NSW",
    icaoCodes: ["YBHI"],
    hotels: [
      { name: "ibis Styles Broken Hill", chain: "Accor", stars: 3, approxRateAUD: 150, phone: "+61 8 8088 4044", bookingUrl: "https://all.accor.com/hotel/8085" },
      { name: "Comfort Inn Crystal", chain: "Choice Hotels", stars: 3, approxRateAUD: 140, phone: "+61 8 8088 2344", bookingUrl: "https://www.choicehotels.com/new-south-wales/broken-hill/comfort-inn-hotels/au107" },
      { name: "The Palace Hotel", chain: "Independent", stars: 3, approxRateAUD: 125, phone: "+61 8 8088 1699", bookingUrl: "https://www.thepalacehotelbrokenhill.com.au" },
      { name: "Desert Sand Motor Inn", chain: "Independent", stars: 3, approxRateAUD: 115, phone: "+61 8 8088 2566", bookingUrl: "https://www.booking.com/hotel/au/desert-sand-motor-inn-broken-hill.html" },
    ],
  },
  {
    label: "Sydney / Bankstown NSW",
    icaoCodes: ["YSSY", "YSBK"],
    hotels: [
      { name: "Mercure Sydney Bankstown", chain: "Accor", stars: 4, approxRateAUD: 130, phone: "+61 2 9709 0000", bookingUrl: "https://all.accor.com/hotel/1619" },
      { name: "Travelodge Hotel Bankstown Sydney", chain: "TFE Hotels", stars: 3, approxRateAUD: 120, phone: "+61 2 9790 0600", bookingUrl: "https://www.travelodgehotels.com.au/hotels/bankstown" },
      { name: "BreakFree Bankstown International", chain: "Accor", stars: 3, approxRateAUD: 115, phone: "+61 2 9708 5000", bookingUrl: "https://all.accor.com/hotel/2175" },
      { name: "Novotel Sydney Airport", chain: "Accor", stars: 4, approxRateAUD: 259, phone: "+61 2 9518 0000", bookingUrl: "https://all.accor.com/hotel/3562" },
      { name: "Holiday Inn Sydney Airport", chain: "IHG", stars: 4, approxRateAUD: 239, phone: "+61 2 9101 6800", bookingUrl: "https://www.ihg.com/holidayinn/hotels/au/en/sydney" },
      { name: "Crowne Plaza Sydney Airport", chain: "IHG", stars: 4, approxRateAUD: 265, phone: "+61 2 8332 7600", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/sydney" },
    ],
  },
  {
    label: "Melbourne / Essendon VIC",
    icaoCodes: ["YMEN", "YMML"],
    hotels: [
      { name: "Hyatt Place Melbourne Essendon Fields", chain: "Hyatt", stars: 4, approxRateAUD: 215, phone: "+61 3 9336 1234", bookingUrl: "https://www.hyatt.com/hyatt-place/en-US/melef-hyatt-place-melbourne-essendon-fields" },
      { name: "ibis Styles Melbourne Airport", chain: "Accor", stars: 3, approxRateAUD: 169, phone: "+61 3 9335 2200", bookingUrl: "https://all.accor.com/hotel/9565" },
      { name: "Novotel Melbourne Airport", chain: "Accor", stars: 4, approxRateAUD: 249, phone: "+61 3 9933 0000", bookingUrl: "https://all.accor.com/hotel/5575" },
      { name: "Crowne Plaza Melbourne", chain: "IHG", stars: 5, approxRateAUD: 285, phone: "+61 3 9648 2777", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/melbourne" },
      { name: "Adina Apartment Hotel Melbourne", chain: "TFE Hotels", stars: 4, approxRateAUD: 210, phone: "+61 3 8663 0000", bookingUrl: "https://www.adinahotels.com/en/apartments/melbourne" },
      { name: "Vibe Hotel Melbourne Docklands", chain: "TFE Hotels", stars: 4, approxRateAUD: 215, phone: "+61 3 8684 8000", bookingUrl: "https://www.vibehotels.com/hotels/melbourne/docklands" },
    ],
  },
  {
    label: "Launceston TAS",
    icaoCodes: ["YMLT"],
    hotels: [
      { name: "Peppers Silo Launceston", chain: "Accor", stars: 5, approxRateAUD: 245, phone: "+61 3 6337 8300", bookingUrl: "https://all.accor.com/hotel/A1B1" },
      { name: "The Sebel Launceston", chain: "Accor", stars: 4, approxRateAUD: 205, phone: "+61 3 6333 3500", bookingUrl: "https://all.accor.com/hotel/5882" },
      { name: "Mantra Charles Hotel Launceston", chain: "Accor", stars: 4, approxRateAUD: 185, phone: "+61 3 6334 3434", bookingUrl: "https://all.accor.com/hotel/1899" },
      { name: "Mercure Launceston", chain: "Accor", stars: 4, approxRateAUD: 175, phone: "+61 3 6334 3599", bookingUrl: "https://all.accor.com/hotel/6523" },
    ],
  },
  {
    label: "Brisbane QLD",
    icaoCodes: ["YBBN", "YBCG"],
    hotels: [
      { name: "Crystalbrook Vincent", chain: "Crystalbrook Collection", stars: 5, approxRateAUD: 320, phone: "+61 7 3234 0300", bookingUrl: "https://crystalbrookcollection.com/vincent" },
      { name: "Sofitel Brisbane Central", chain: "Accor", stars: 5, approxRateAUD: 295, phone: "+61 7 3835 3535", bookingUrl: "https://all.accor.com/hotel/5585" },
      { name: "Pullman Brisbane King George Square", chain: "Accor", stars: 5, approxRateAUD: 279, phone: "+61 7 3229 9111", bookingUrl: "https://all.accor.com/hotel/3174" },
      { name: "voco Brisbane City Centre", chain: "IHG", stars: 4, approxRateAUD: 245, phone: "+61 7 3238 2222", bookingUrl: "https://www.ihg.com/voco/hotels/au/en/brisbane" },
      { name: "Hotel Indigo Brisbane City Centre", chain: "IHG", stars: 4, approxRateAUD: 235, phone: "+61 7 3007 8000", bookingUrl: "https://www.ihg.com/hotelindigo/hotels/au/en/brisbane" },
      { name: "Adina Apartment Hotel Brisbane", chain: "TFE Hotels", stars: 4, approxRateAUD: 215, phone: "+61 7 3175 7000", bookingUrl: "https://www.adinahotels.com/en/apartments/brisbane" },
      { name: "Mantra South Bank Brisbane", chain: "Accor", stars: 4, approxRateAUD: 199, phone: "+61 7 3240 0500", bookingUrl: "https://all.accor.com/hotel/6835" },
      { name: "Travelodge Hotel Garden City Brisbane", chain: "TFE Hotels", stars: 3, approxRateAUD: 145, phone: "+61 7 3216 6000", bookingUrl: "https://www.travelodgehotels.com.au/hotels/brisbane-garden-city" },
    ],
  },
  {
    label: "Adelaide SA",
    icaoCodes: ["YPAD"],
    hotels: [
      { name: "InterContinental Adelaide", chain: "IHG", stars: 5, approxRateAUD: 310, phone: "+61 8 8238 2400", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/adelaide" },
      { name: "Sofitel Adelaide", chain: "Accor", stars: 5, approxRateAUD: 295, phone: "+61 8 8217 2300", bookingUrl: "https://all.accor.com/hotel/B1A1" },
      { name: "Crowne Plaza Adelaide", chain: "IHG", stars: 5, approxRateAUD: 279, phone: "+61 8 8206 8888", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/adelaide" },
      { name: "The Playford Adelaide — MGallery", chain: "Accor", stars: 5, approxRateAUD: 265, phone: "+61 8 8213 8888", bookingUrl: "https://all.accor.com/hotel/1819" },
      { name: "Novotel Adelaide (Adelaide Rockford)", chain: "Accor", stars: 4, approxRateAUD: 195, phone: "+61 8 8211 8255", bookingUrl: "https://all.accor.com/hotel/7383" },
      { name: "Adina Apartment Hotel Adelaide Treasury", chain: "TFE Hotels", stars: 4, approxRateAUD: 185, phone: "+61 8 8112 0000", bookingUrl: "https://www.adinahotels.com/en/apartments/adelaide" },
      { name: "Holiday Inn Express Adelaide City Centre", chain: "IHG", stars: 3, approxRateAUD: 169, phone: "+61 8 7079 9000", bookingUrl: "https://www.ihg.com/holidayinnexpress/hotels/au/en/adelaide" },
      { name: "ibis Adelaide", chain: "Accor", stars: 3, approxRateAUD: 145, phone: "+61 8 8211 8888", bookingUrl: "https://all.accor.com/hotel/6178" },
    ],
  },
  {
    label: "Perth WA",
    icaoCodes: ["YPPH"],
    hotels: [
      { name: "InterContinental Perth", chain: "IHG", stars: 5, approxRateAUD: 315, phone: "+61 8 9486 7777", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/perth" },
      { name: "Crowne Plaza Perth", chain: "IHG", stars: 5, approxRateAUD: 295, phone: "+61 8 9270 0000", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/perth" },
      { name: "Novotel Perth Langley", chain: "Accor", stars: 4, approxRateAUD: 229, phone: "+61 8 9221 1200", bookingUrl: "https://all.accor.com/hotel/0782" },
      { name: "Adina Apartment Hotel Perth Barrack Plaza", chain: "TFE Hotels", stars: 4, approxRateAUD: 215, phone: "+61 8 9322 2500", bookingUrl: "https://www.adinahotels.com/en/apartments/perth-barrack-plaza" },
      { name: "Rendezvous Hotel Perth Central", chain: "TFE Hotels", stars: 4, approxRateAUD: 205, phone: "+61 8 9321 8088", bookingUrl: "https://www.rendezvoushotels.com/perth-central" },
      { name: "Vibe Hotel Subiaco Perth", chain: "TFE Hotels", stars: 4, approxRateAUD: 189, phone: "+61 8 6267 7000", bookingUrl: "https://www.vibehotels.com/hotels/perth/subiaco" },
      { name: "Holiday Inn Perth City Centre", chain: "IHG", stars: 4, approxRateAUD: 219, phone: "+61 8 6559 0000", bookingUrl: "https://www.ihg.com/holidayinn/hotels/au/en/perth" },
      { name: "Travelodge Hotel Perth", chain: "TFE Hotels", stars: 3, approxRateAUD: 149, phone: "+61 8 9213 9600", bookingUrl: "https://www.travelodgehotels.com.au/hotels/perth" },
      { name: "ibis Perth", chain: "Accor", stars: 3, approxRateAUD: 145, phone: "+61 8 9322 2844", bookingUrl: "https://all.accor.com/hotel/6165" },
    ],
  },
  {
    label: "Darwin NT",
    icaoCodes: ["YPDN"],
    hotels: [
      { name: "Novotel Darwin CBD", chain: "Accor", stars: 4, approxRateAUD: 229, phone: "+61 8 8943 5400", bookingUrl: "https://all.accor.com/hotel/2094" },
      { name: "Novotel Darwin Airport", chain: "Accor", stars: 4, approxRateAUD: 219, phone: "+61 8 8920 3000", bookingUrl: "https://all.accor.com/hotel/8706" },
      { name: "Mercure Darwin Airport Resort", chain: "Accor", stars: 4, approxRateAUD: 195, phone: "+61 8 8920 0800", bookingUrl: "https://all.accor.com/hotel/7191" },
      { name: "Adina Apartment Hotel Darwin Waterfront", chain: "TFE Hotels", stars: 4, approxRateAUD: 210, phone: "+61 8 8982 9000", bookingUrl: "https://www.adinahotels.com/en/apartments/darwin-waterfront" },
      { name: "Vibe Hotel Darwin Waterfront", chain: "TFE Hotels", stars: 4, approxRateAUD: 199, phone: "+61 8 8982 9999", bookingUrl: "https://www.vibehotels.com/hotels/darwin/waterfront" },
      { name: "Mantra Pandanas Darwin", chain: "Accor", stars: 4, approxRateAUD: 185, phone: "+61 8 8943 4333", bookingUrl: "https://all.accor.com/hotel/3889" },
      { name: "ibis Darwin Airport Hotel", chain: "Accor", stars: 3, approxRateAUD: 149, phone: "+61 8 8920 0700", bookingUrl: "https://all.accor.com/hotel/9218" },
    ],
  },
  {
    label: "Alice Springs NT",
    icaoCodes: ["YBAS"],
    hotels: [
      { name: "Crowne Plaza Alice Springs Lasseters", chain: "IHG", stars: 5, approxRateAUD: 269, phone: "+61 8 8950 7777", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/alice-springs" },
      { name: "Mercure Alice Springs Resort", chain: "Accor", stars: 4, approxRateAUD: 199, phone: "+61 8 8952 8000", bookingUrl: "https://all.accor.com/hotel/5952" },
      { name: "DoubleTree by Hilton Alice Springs", chain: "Hilton", stars: 4, approxRateAUD: 225, phone: "+61 8 8950 8000", bookingUrl: "https://www.hilton.com/en/hotels/aspdidi-doubletree-alice-springs" },
    ],
  },
  {
    label: "Cairns QLD",
    icaoCodes: ["YBCS"],
    hotels: [
      { name: "Crystalbrook Riley", chain: "Crystalbrook Collection", stars: 5, approxRateAUD: 345, phone: "+61 7 4252 7777", bookingUrl: "https://crystalbrookcollection.com/riley" },
      { name: "Crystalbrook Bailey", chain: "Crystalbrook Collection", stars: 5, approxRateAUD: 315, phone: "+61 7 4253 0888", bookingUrl: "https://crystalbrookcollection.com/bailey" },
      { name: "Crystalbrook Flynn", chain: "Crystalbrook Collection", stars: 5, approxRateAUD: 299, phone: "+61 7 4080 9400", bookingUrl: "https://crystalbrookcollection.com/flynn" },
      { name: "Pullman Reef Hotel Casino Cairns", chain: "Accor", stars: 5, approxRateAUD: 289, phone: "+61 7 4030 8888", bookingUrl: "https://all.accor.com/hotel/1684" },
      { name: "Pullman Cairns International", chain: "Accor", stars: 5, approxRateAUD: 279, phone: "+61 7 4031 1300", bookingUrl: "https://all.accor.com/hotel/0046" },
      { name: "Novotel Cairns Oasis Resort", chain: "Accor", stars: 4, approxRateAUD: 219, phone: "+61 7 4080 1888", bookingUrl: "https://all.accor.com/hotel/0887" },
      { name: "Mercure Cairns", chain: "Accor", stars: 4, approxRateAUD: 179, phone: "+61 7 4051 3877", bookingUrl: "https://all.accor.com/hotel/0888" },
      { name: "ibis Styles Cairns", chain: "Accor", stars: 3, approxRateAUD: 149, phone: "+61 7 4031 0300", bookingUrl: "https://all.accor.com/hotel/9157" },
    ],
  },
];

function getRelevantAccomLocations(legs: LegInput[]): AccomLocation[] {
  const icaoSet = new Set<string>();
  legs.forEach(l => {
    if (l.toICAO) icaoSet.add(l.toICAO.toUpperCase());
  });
  if (icaoSet.size === 0) return CORPORATE_TRAVELLER_ACCOM; // show all if no route set
  const matched = CORPORATE_TRAVELLER_ACCOM.filter(loc =>
    loc.icaoCodes.some(code => icaoSet.has(code))
  );
  return matched.length > 0 ? matched : CORPORATE_TRAVELLER_ACCOM;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-yellow-400 text-[10px]">
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
    </span>
  );
}

function emptyLeg(): LegInput {
  return {
    fromICAO: "", fromName: "", toICAO: "", toName: "",
    distanceNm: 0, departureTime: "09:00", refuelStop: false,
    groundTransport: { type: "none", legs: 1 },
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStatusColor(status: QuoteStatus): string {
  switch (status) {
    case "draft": return "bg-gray-500/15 text-gray-300 border-gray-500/30";
    case "sent": return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    case "accepted": return "bg-green-500/15 text-green-300 border-green-500/30";
    case "declined": return "bg-red-500/15 text-red-300 border-red-500/30";
    default: return "bg-gray-500/15 text-gray-300 border-gray-500/30";
  }
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap capitalize ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}

export default function CharterQuote() {
  const qc = useQueryClient();

  // ─── Form state ───────────────────────────────────────────────────────────
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("medevac_charter");
  const [departureDate, setDepartureDate] = useState(todayISO());
  const [aircraftType, setAircraftType] = useState<AircraftKey>("B200");
  const [legs, setLegs] = useState<LegInput[]>([emptyLeg()]);
  // Airport objects parallel to legs[] — for autocomplete selection
  const [legAirports, setLegAirports] = useState<Array<{ from: Airport | null; to: Airport | null }>>([{ from: null, to: null }]);
  const [includeReturnLeg, setIncludeReturnLeg] = useState(false);
  const [crew, setCrew] = useState<CrewConfig>({
    captain: true, firstOfficer: false, flightNurse: false, flightParamedic: false, icuDoctor: false, count: 1,
  });
  const [accommodationNights, setAccommodationNights] = useState<number | "">(0);
  const [accomSearch, setAccomSearch] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<AccomProperty | null>(null);
  const [marginPercent, setMarginPercent] = useState(15);
  const [notes, setNotes] = useState("");

  const [breakdown, setBreakdown] = useState<QuoteCostBreakdown | null>(null);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [viewingQuote, setViewingQuote] = useState<CharterQuoteRecord | null>(null);

  // ─── Live rate loading ───────────────────────────────────────────────
  const [ratesLoading, setRatesLoading] = useState(true);
  const [rateCardTick, setRateCardTick] = useState(0); // bump to force RateCard re-render after refresh

  useEffect(() => {
    loadLiveRates().catch(console.error).finally(() => setRatesLoading(false));
  }, []);

  const crewCount = useMemo(() => {
    let n = 1; // captain always
    if (crew.firstOfficer) n++;
    if (crew.flightNurse) n++;
    if (crew.flightParamedic) n++;
    if (crew.icuDoctor) n++;
    return n;
  }, [crew]);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: quoteRates = [], isLoading: rateCardQueryLoading } = useQuery<LiveQuoteRate[]>({
    queryKey: ["/api/quote-rates"],
  });

  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const refreshRatesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quote-rates/refresh", {});
      return res.json() as Promise<{ checked: number; updated: number; changes: Array<{ key: string; old: string; new: string }> }>;
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["/api/quote-rates"] });
      await loadLiveRates();
      setRateCardTick(t => t + 1);
      setRefreshMessage(result.updated > 0 ? `${result.updated} rate${result.updated === 1 ? "" : "s"} updated` : "All rates current");
      setTimeout(() => setRefreshMessage(null), 6000);
    },
    onError: () => {
      setRefreshMessage("Refresh failed — check connection");
      setTimeout(() => setRefreshMessage(null), 6000);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ key, value, notes }: { key: string; value: string; notes?: string }) => {
      const res = await apiRequest("PUT", `/api/quote-rates/${key}`, { value, notes });
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["/api/quote-rates"] });
      await loadLiveRates();
      setRateCardTick(t => t + 1);
    },
  });

  const { data: nextNumberData } = useQuery<{ quoteNumber: string }>({
    queryKey: ["/api/charter-quotes/next-number"],
  });
  const { data: quotes = [] } = useQuery<CharterQuoteRecord[]>({
    queryKey: ["/api/charter-quotes"],
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/charter-quotes", data).then(r => {
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      return r.json();
    }),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["/api/charter-quotes"] });
      qc.invalidateQueries({ queryKey: ["/api/charter-quotes/next-number"] });
      setSaveMessage({ type: 'success', text: `Quote ${saved.quoteNumber} saved successfully.` });
      setTimeout(() => setSaveMessage(null), 6000);
    },
    onError: (err: any) => {
      setSaveMessage({ type: 'error', text: `Failed to save — ${err?.message ?? 'please try again'}.` });
      setTimeout(() => setSaveMessage(null), 8000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<CharterQuoteRecord> }) =>
      apiRequest("PATCH", `/api/charter-quotes/${id}`, updates).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/charter-quotes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/charter-quotes/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/charter-quotes"] }),
  });

  // ─── Leg management ───────────────────────────────────────────────────────
  function updateLeg(idx: number, patch: Partial<LegInput>) {
    setLegs(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }
  function addLeg() {
    setLegs(prev => [...prev, emptyLeg()]);
    setLegAirports(prev => [...prev, { from: null, to: null }]);
  }
  function removeLeg(idx: number) {
    if (legs.length <= 1) return;
    setLegs(prev => prev.filter((_, i) => i !== idx));
    setLegAirports(prev => prev.filter((_, i) => i !== idx));
  }

  // Airport selection handlers — update both airport object and LegInput ICAO/name
  const setLegFrom = useCallback((idx: number, ap: Airport | null) => {
    setLegAirports(prev => prev.map((la, i) => i === idx ? { ...la, from: ap } : la));
    setLegs(prev => prev.map((l, i) => i === idx ? {
      ...l,
      fromICAO: ap?.icao ?? "",
      fromName: ap ? (ap.city || ap.name) : "",
    } : l));
  }, []);

  const setLegTo = useCallback((idx: number, ap: Airport | null) => {
    setLegAirports(prev => prev.map((la, i) => i === idx ? { ...la, to: ap } : la));
    setLegs(prev => prev.map((l, i) => i === idx ? {
      ...l,
      toICAO: ap?.icao ?? "",
      toName: ap ? (ap.city || ap.name) : "",
    } : l));
  }, []);

  const setLegDistance = useCallback((idx: number, nm: number) => {
    setLegs(prev => prev.map((l, i) => i === idx ? { ...l, distanceNm: nm } : l));
  }, []);

  // ─── Calculate ────────────────────────────────────────────────────────────
  function handleCalculate() {
    const input: QuoteInput = {
      aircraftType,
      legs,
      crew: { ...crew, count: crewCount },
      marginPercent,
      accommodationNights: accommodationNights === "" ? 0 : accommodationNights,
      includeReturnLeg,
    };
    const result = calculateQuote(input);
    setBreakdown(result);
  }

  function handleStartNew() {
    setClientName(""); setClientContact(""); setPurpose("medevac_charter");
    setDepartureDate(todayISO()); setAircraftType("B200"); setLegs([emptyLeg()]);
    setIncludeReturnLeg(false);
    setCrew({ captain: true, firstOfficer: false, flightNurse: false, flightParamedic: false, icuDoctor: false, count: 1 });
    setAccommodationNights(0); setMarginPercent(15); setNotes("");
    setBreakdown(null);
    setViewingQuote(null);
  }

  function handleSaveQuote() {
    if (!breakdown) return;
    const quoteNumber = nextNumberData?.quoteNumber || "CQ-2026-0001";
    saveMutation.mutate({
      quoteNumber,
      clientName: clientName || "Unnamed Client",
      clientContact: clientContact || null,
      purpose,
      aircraftType,
      departureDate,
      legs: JSON.stringify(legs),
      crew: JSON.stringify({ ...crew, count: crewCount }),
      costs: JSON.stringify(breakdown),
      totalCost: breakdown.baseCost,
      marginPercent,
      finalQuote: breakdown.finalQuote,
      status: "draft",
      notes: notes || null,
    });
  }

  function handleExportPDF() {
    if (!breakdown) return;
    const quoteNumber = nextNumberData?.quoteNumber || "CQ-2026-0001";
    generateCharterQuotePDF({
      quoteNumber,
      clientName: clientName || "Unnamed Client",
      clientContact: clientContact || null,
      purpose,
      aircraftType,
      departureDate,
      legs,
      crew: { ...crew, count: crewCount },
      marginPercent,
      notes,
    }, breakdown);
  }

  function loadQuoteForView(q: CharterQuoteRecord) {
    setViewingQuote(q);
    try {
      const parsedLegs: LegInput[] = JSON.parse(q.legs);
      const parsedCrew: CrewConfig = JSON.parse(q.crew);
      const parsedCosts: QuoteCostBreakdown = JSON.parse(q.costs);
      setClientName(q.clientName);
      setClientContact(q.clientContact || "");
      setPurpose(q.purpose as Purpose);
      setDepartureDate(q.departureDate);
      setAircraftType(q.aircraftType as AircraftKey);
      setLegs(parsedLegs);
      setCrew(parsedCrew);
      setMarginPercent(q.marginPercent);
      setNotes(q.notes || "");
      setBreakdown(parsedCosts);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("Failed to parse quote", e);
    }
  }

  function exportSavedQuotePDF(q: CharterQuoteRecord) {
    try {
      const parsedLegs: LegInput[] = JSON.parse(q.legs);
      const parsedCrew: CrewConfig = JSON.parse(q.crew);
      const parsedCosts: QuoteCostBreakdown = JSON.parse(q.costs);
      generateCharterQuotePDF({
        quoteNumber: q.quoteNumber,
        clientName: q.clientName,
        clientContact: q.clientContact,
        purpose: q.purpose,
        aircraftType: q.aircraftType as AircraftKey,
        departureDate: q.departureDate,
        legs: parsedLegs,
        crew: parsedCrew,
        marginPercent: q.marginPercent,
        notes: q.notes,
      }, parsedCosts);
    } catch (e) {
      console.error("Failed to export PDF", e);
    }
  }

  const routeSummary = legs.filter(l => l.fromICAO && l.toICAO)
    .map(l => `${l.fromICAO}→${l.toICAO}`).join(", ");

  const fdpWarningLevel = breakdown
    ? breakdown.totalFdpHours > 14 ? "red" : breakdown.totalFdpHours > 12 ? "yellow" : null
    : null;

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Calculator size={20} style={{ color: TEAL }} />
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Charter Quick Quote</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Instantly quote a charter flight from scratch — Operations &amp; Dispatch
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ══════════════════ LEFT PANEL — INPUT FORM (40%) ══════════════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* 1. Charter Details */}
          <div className="bg-card border border-card-border rounded-2xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">1. Charter Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Client Name</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1"
                  style={{ ["--tw-ring-color" as any]: TEAL }}
                  placeholder="e.g. Orana Cancer Centre" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contact / Phone</label>
                <input value={clientContact} onChange={e => setClientContact(e.target.value)}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none"
                  placeholder="e.g. 02 6882 xxxx" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Charter Purpose</label>
                <select value={purpose} onChange={e => setPurpose(e.target.value as Purpose)}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none">
                  {PURPOSE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Departure Date</label>
                <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Aircraft</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(AIRCRAFT) as AircraftKey[]).map(key => {
                    const a = AIRCRAFT[key];
                    const active = aircraftType === key;
                    return (
                      <button key={key} onClick={() => setAircraftType(key)}
                        className={`text-left rounded-lg border p-2.5 transition-colors ${active ? "border-[#01696F] bg-[#01696F]/10" : "border-card-border hover:border-white/20"}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Plane size={13} style={{ color: active ? TEAL : undefined }} />
                          <span className="text-sm font-bold">{key}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">MTOW {a.mtow}t</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{a.tasKts}kt TAS</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{a.fuelBurnKgHr}kg/hr</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Rate Card — live monitored rates */}
          <RateCard
            rates={quoteRates}
            loading={ratesLoading || rateCardQueryLoading}
            lastChecked={getRatesLastChecked()}
            refreshMutation={refreshRatesMutation}
            updateMutation={updateRateMutation}
            refreshMessage={refreshMessage}
            tick={rateCardTick}
          />

          {/* 2. Flight Legs */}
          <div className="bg-card border border-card-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Flight Legs</h2>
              <a href="https://skyvector.com" target="_blank" rel="noreferrer"
                className="text-[10px] hover:underline" style={{ color: TEAL }}>
                Use distance calculator →
              </a>
            </div>
            <div className="space-y-4">
              {legs.map((leg, idx) => (
                <div key={idx} className="border border-card-border rounded-lg p-3 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} /> Leg {idx + 1}
                    </span>
                    {legs.length > 1 && (
                      <button onClick={() => removeLeg(idx)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {/* Airport autocomplete pickers — auto-calc distance on selection */}
                  <div className="mb-2">
                    <AirportLegPicker
                      fromAirport={legAirports[idx]?.from ?? null}
                      toAirport={legAirports[idx]?.to ?? null}
                      onFromChange={ap => setLegFrom(idx, ap)}
                      onToChange={ap => setLegTo(idx, ap)}
                      onDistanceCalculated={nm => setLegDistance(idx, nm)}
                    />
                  </div>

                  {/* Distance (auto-filled or manual override) + departure time */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">
                        Distance (nm)
                        {leg.distanceNm > 0 && legAirports[idx]?.from?.lat && legAirports[idx]?.to?.lat && (
                          <span className="ml-1 text-[#4F98A3]">· auto</span>
                        )}
                      </label>
                      <input
                        type="number"
                        value={leg.distanceNm || ""}
                        onChange={e => updateLeg(idx, { distanceNm: parseFloat(e.target.value) || 0 })}
                        placeholder="nm"
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Departure (HH:MM)</label>
                      <input
                        type="time"
                        value={leg.departureTime}
                        onChange={e => updateLeg(idx, { departureTime: e.target.value })}
                        onMouseDown={e => e.stopPropagation()}
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                      <input type="checkbox" checked={leg.refuelStop} onChange={e => updateLeg(idx, { refuelStop: e.target.checked })} />
                      Refuel stop
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Ground Transport</label>
                      <select value={leg.groundTransport?.type || "none"}
                        onChange={e => updateLeg(idx, { groundTransport: { type: e.target.value as GroundTransportType, legs: leg.groundTransport?.legs || 1 } })}
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none">
                        {GROUND_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Quantity</label>
                      <input type="number" min={1} value={leg.groundTransport?.legs || 1}
                        onChange={e => updateLeg(idx, { groundTransport: { type: leg.groundTransport?.type || "none", legs: parseInt(e.target.value) || 1 } })}
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addLeg}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-card-border hover:border-white/30 transition-colors">
                <Plus size={13} /> Add Leg
              </button>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={includeReturnLeg} onChange={e => setIncludeReturnLeg(e.target.checked)} />
                Add Return Leg
              </label>
            </div>
          </div>

          {/* 3. Crew Configuration */}
          <div className="bg-card border border-card-border rounded-2xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users size={13} /> 3. Crew Configuration
            </h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm opacity-60">
                <input type="checkbox" checked disabled />
                Captain <span className="text-[10px] text-muted-foreground">(always required)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={crew.firstOfficer} onChange={e => setCrew(c => ({ ...c, firstOfficer: e.target.checked }))} />
                First Officer
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={crew.flightNurse} onChange={e => setCrew(c => ({ ...c, flightNurse: e.target.checked }))} />
                Flight Nurse
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={crew.flightParamedic} onChange={e => setCrew(c => ({ ...c, flightParamedic: e.target.checked }))} />
                Flight Paramedic
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={crew.icuDoctor} onChange={e => setCrew(c => ({ ...c, icuDoctor: e.target.checked }))} />
                ICU Doctor
              </label>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Total crew on board: <span className="font-bold" style={{ color: TEAL }}>{crewCount}</span>
            </div>
          </div>

          {/* 4. Additional Costs */}
          <div className="bg-card border border-card-border rounded-2xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Hotel size={13} /> 4. Additional Costs
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Accommodation Nights</label>
                <input
                  type="number"
                  min={0}
                  value={accommodationNights}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === "" || raw === "-") {
                      setAccommodationNights("");
                    } else {
                      const n = parseInt(raw, 10);
                      setAccommodationNights(isNaN(n) ? "" : Math.max(0, n));
                    }
                  }}
                  onBlur={() => {
                    if (accommodationNights === "") setAccommodationNights(0);
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none"
                />
                {breakdown?.accommodationRequired && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                    <AlertTriangle size={11} />
                    FDP exceeds 12hrs — accommodation likely required
                  </div>
                )}
              </div>

              {/* Corporate Traveller Accommodation Panel */}
              {accommodationNights > 0 && (() => {
                const relevantLocs = getRelevantAccomLocations(legs);
                const searchLc = accomSearch.toLowerCase();
                const filteredLocs = relevantLocs.map(loc => ({
                  ...loc,
                  hotels: loc.hotels.filter(h =>
                    !searchLc ||
                    h.name.toLowerCase().includes(searchLc) ||
                    h.chain.toLowerCase().includes(searchLc) ||
                    loc.label.toLowerCase().includes(searchLc)
                  ),
                })).filter(loc => loc.hotels.length > 0);

                return (
                  <div className="border border-card-border rounded-xl p-3 bg-background/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                        <Hotel size={11} className="inline mr-1" />
                        Accommodation — via Corporate Traveller
                      </span>
                      <a
                        href="https://www.corporatetraveller.com.au"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] underline opacity-60 hover:opacity-100"
                      >
                        corporatetraveller.com.au
                      </a>
                    </div>

                    {/* Search */}
                    <input
                      type="text"
                      value={accomSearch}
                      onChange={e => setAccomSearch(e.target.value)}
                      onMouseDown={e => e.stopPropagation()}
                      placeholder="Search hotels or chains..."
                      className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none mb-2"
                    />

                    {/* Selected hotel summary */}
                    {selectedHotel && (
                      <div className="mb-2 flex items-start gap-2 bg-teal-500/10 border border-teal-500/30 rounded-lg px-2.5 py-2">
                        <Hotel size={12} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold truncate">{selectedHotel.name}</div>
                          <div className="text-[10px] text-muted-foreground">{selectedHotel.chain} · <StarRating stars={selectedHotel.stars} /> · ~${selectedHotel.approxRateAUD}/night</div>
                          <div className="text-[10px] mt-0.5">
                            <span className="text-muted-foreground">{selectedHotel.phone}</span>
                            {" · "}
                            <a href={selectedHotel.bookingUrl} target="_blank" rel="noreferrer"
                              className="underline" style={{ color: TEAL }}>Book via CT</a>
                          </div>
                        </div>
                        <button onClick={() => setSelectedHotel(null)} className="text-muted-foreground hover:text-white shrink-0">
                          <X size={11} />
                        </button>
                      </div>
                    )}

                    {/* Hotel list by location */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-0.5">
                      {filteredLocs.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-2">No results — try a different search</p>
                      ) : filteredLocs.map(loc => (
                        <div key={loc.label}>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{loc.label}</div>
                          <div className="space-y-1">
                            {loc.hotels.map(hotel => (
                              <button
                                key={hotel.name}
                                type="button"
                                onClick={() => setSelectedHotel(hotel === selectedHotel ? null : hotel)}
                                className={`w-full text-left rounded-lg px-2.5 py-2 border transition-colors ${
                                  selectedHotel?.name === hotel.name
                                    ? "border-teal-500/50 bg-teal-500/10"
                                    : "border-card-border hover:border-white/20 bg-background/60"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-medium truncate">{hotel.name}</span>
                                  <span className="text-[11px] font-semibold shrink-0" style={{ color: TEAL }}>${hotel.approxRateAUD}/nt</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{hotel.chain}</span>
                                  <StarRating stars={hotel.stars} />
                                  <a
                                    href={hotel.bookingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-[10px] underline ml-auto shrink-0"
                                    style={{ color: TEAL }}
                                  >
                                    Book →
                                  </a>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[9px] text-muted-foreground mt-2 opacity-60">
                      Rates are indicative corporate rates via Corporate Traveller preferred partners (Accor, IHG, TFE Hotels, Choice Hotels). Book directly through Corporate Traveller for negotiated pricing.
                    </p>
                  </div>
                );
              })()}
              <div>
                <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1"><Percent size={11}/> Margin %</label>
                <input type="number" min={0} max={100} value={marginPercent}
                  onChange={e => setMarginPercent(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none resize-none"
                  placeholder="Optional notes for the quote..." />
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button onClick={handleCalculate}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: TEAL }}>
            <Calculator size={16} /> Calculate Quote
          </button>
        </div>

        {/* ══════════════════ RIGHT PANEL — COST BREAKDOWN (60%) ══════════════════ */}
        <div className="lg:col-span-3 space-y-4">

          {!breakdown && (
            <div className="bg-card border border-card-border rounded-2xl p-10 text-center">
              <Calculator size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">Fill in the charter details and click <strong>Calculate Quote</strong> to see the live cost breakdown.</p>
            </div>
          )}

          {breakdown && (
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: TEAL }}>Cost Breakdown</h2>
                <span className="text-[10px] text-muted-foreground">{routeSummary || "No route entered"}</span>
              </div>

              {fdpWarningLevel && (
                <div className={`mb-4 flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
                  fdpWarningLevel === "red"
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                }`}>
                  <AlertTriangle size={14} />
                  {fdpWarningLevel === "red"
                    ? `FDP Advisory: ${breakdown.totalFdpHours.toFixed(1)} hrs exceeds the CASA CAO 48.1 multi-crew maximum of 14 hrs.`
                    : `FDP Advisory: ${breakdown.totalFdpHours.toFixed(1)} hrs approaches the 12hr accommodation trigger threshold.`}
                </div>
              )}

              <CostLineGroup title="Aircraft Costs">
                <CostLine label="Aircraft hourly rate" value={breakdown.aircraftCost}
                  detail={`${breakdown.totalFlightHours.toFixed(1)} hrs @ ${fmtCents(AIRCRAFT[aircraftType].hourlyRate)}/hr`}
                  expandKey="aircraft" expanded={expandedLine} onToggle={setExpandedLine} />
                <CostLine label="Fuel (Jet-A1 @ $1.92/L)" value={breakdown.subtotals.fuel}
                  detail="Per-leg burn calculated from aircraft fuel flow"
                  expandKey="fuel" expanded={expandedLine} onToggle={setExpandedLine} />
              </CostLineGroup>

              <CostLineGroup title="Airservices Australia">
                <CostLine label="Enroute nav charges (IFR)" value={breakdown.subtotals.enroute} expandKey="enroute" expanded={expandedLine} onToggle={setExpandedLine} />
                <CostLine label="Met service surcharge" value={breakdown.subtotals.met} expandKey="met" expanded={expandedLine} onToggle={setExpandedLine} />
                <CostLine label="Terminal nav charges (TNC)" value={breakdown.subtotals.terminalNav} expandKey="tnc" expanded={expandedLine} onToggle={setExpandedLine} />
                <CostLine label="Out-of-hours surcharge" value={breakdown.subtotals.outOfHoursSurcharge} expandKey="ooh" expanded={expandedLine} onToggle={setExpandedLine} />
              </CostLineGroup>

              <CostLineGroup title="Airport Fees">
                <CostLine label="Landing fees (each airport)" value={breakdown.subtotals.landingFees} expandKey="landing" expanded={expandedLine} onToggle={setExpandedLine} />
              </CostLineGroup>

              <CostLineGroup title="Crew">
                {breakdown.crewBreakdown.map(c => (
                  <CostLine key={c.role} label={`${c.role} (${c.hours.toFixed(1)} hrs FDP)`} value={c.cost} expandKey={`crew-${c.role}`} expanded={expandedLine} onToggle={setExpandedLine} />
                ))}
              </CostLineGroup>

              <CostLineGroup title="Ground & Logistics">
                <CostLine label="Ground transport" value={breakdown.subtotals.groundTransport} expandKey="ground" expanded={expandedLine} onToggle={setExpandedLine} />
                <CostLine label={`Accommodation (${accommodationNights} nights)`} value={breakdown.subtotals.accommodation} expandKey="accom" expanded={expandedLine} onToggle={setExpandedLine} />
              </CostLineGroup>

              {/* Expanded per-leg detail */}
              {expandedLine && ["aircraft", "fuel", "enroute", "met", "tnc", "ooh", "landing", "ground"].includes(expandedLine) && (
                <div className="mt-2 mb-3 bg-background/50 border border-card-border rounded-lg p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Per-Leg Detail</div>
                  <table className="w-full text-[11px]">
                    <tbody>
                      {breakdown.legs.map((lb, i) => (
                        <tr key={i} className="border-b border-card-border/50 last:border-0">
                          <td className="py-1 pr-2 text-muted-foreground">{lb.leg.fromICAO || "?"} → {lb.leg.toICAO || "?"}</td>
                          <td className="py-1 text-right font-medium">
                            {expandedLine === "aircraft" && fmtCents(lb.flightHours * AIRCRAFT[aircraftType].hourlyRate)}
                            {expandedLine === "fuel" && fmtCents(lb.fuel)}
                            {expandedLine === "enroute" && fmtCents(lb.enroute)}
                            {expandedLine === "met" && fmtCents(lb.met)}
                            {expandedLine === "tnc" && fmtCents(lb.terminalNavDeparture + lb.terminalNavArrival)}
                            {expandedLine === "ooh" && fmtCents(lb.outOfHoursSurcharge)}
                            {expandedLine === "landing" && fmtCents(lb.landingFee)}
                            {expandedLine === "ground" && fmtCents(lb.groundTransport)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-card-border mt-4 pt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (incl. GST)</span>
                  <span className="font-semibold">{fmtCents(breakdown.baseCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margin ({marginPercent}%)</span>
                  <span className="font-semibold">{fmtCents(breakdown.margin)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2" style={{ borderColor: TEAL }}>
                  <span className="text-base font-bold">Total Quote</span>
                  <span className="text-2xl font-extrabold" style={{ color: TEAL }}>{fmtCents(breakdown.finalQuote)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground text-right italic">All charges include GST</div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={handleSaveQuote} disabled={saveMutation.isPending || !breakdown}
                  title={!breakdown ? "Calculate the quote first" : ""}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: TEAL }}>
                  <Save size={13} /> {saveMutation.isPending ? "Saving..." : "Save Quote"}
                </button>
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md border border-card-border hover:border-white/30">
                  <FileDown size={13} /> Export PDF
                </button>
                <button onClick={handleStartNew}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md border border-card-border hover:border-white/30">
                  <RotateCcw size={13} /> Start New
                </button>
              </div>
              {saveMessage && (
                <div className={`mt-2 text-[11px] font-medium ${
                  saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>{saveMessage.text}</div>
              )}
            </div>
          )}

          {/* Saved Quotes list */}
          <div className="bg-card border border-card-border rounded-2xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Saved Quotes</h2>
            {quotes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No quotes saved yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-card-border">
                      <th className="py-2 pr-2">Quote #</th>
                      <th className="py-2 pr-2">Client</th>
                      <th className="py-2 pr-2">Route</th>
                      <th className="py-2 pr-2">Aircraft</th>
                      <th className="py-2 pr-2">Date</th>
                      <th className="py-2 pr-2 text-right">Total</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map(q => {
                      let route = "—";
                      try {
                        const ls: LegInput[] = JSON.parse(q.legs);
                        if (ls.length) route = `${ls[0].fromICAO} → ${ls[ls.length - 1].toICAO}`;
                      } catch {}
                      return (
                        <tr key={q.id} className="border-b border-card-border/50 last:border-0 hover:bg-white/3">
                          <td className="py-2 pr-2 font-medium">{q.quoteNumber}</td>
                          <td className="py-2 pr-2">{q.clientName}</td>
                          <td className="py-2 pr-2 text-muted-foreground">{route}</td>
                          <td className="py-2 pr-2">{q.aircraftType}</td>
                          <td className="py-2 pr-2 text-muted-foreground">{q.departureDate}</td>
                          <td className="py-2 pr-2 text-right font-semibold">{fmtCents(q.finalQuote)}</td>
                          <td className="py-2 pr-2">
                            <select value={q.status} onChange={e => updateMutation.mutate({ id: q.id, updates: { status: e.target.value as QuoteStatus } })}
                              className="text-[10px] bg-transparent border-none focus:outline-none cursor-pointer">
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="accepted">Accepted</option>
                              <option value="declined">Declined</option>
                            </select>
                            <StatusBadge status={q.status} />
                          </td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => loadQuoteForView(q)} title="View / Edit" className="text-muted-foreground hover:text-foreground">
                                <Eye size={13} />
                              </button>
                              <button onClick={() => exportSavedQuotePDF(q)} title="Export PDF" className="text-muted-foreground hover:text-foreground">
                                <FileDown size={13} />
                              </button>
                              <button onClick={() => deleteMutation.mutate(q.id)} title="Delete" className="text-red-400 hover:text-red-300">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function CostLineGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CostLine({
  label, value, detail, expandKey, expanded, onToggle,
}: {
  label: string; value: number; detail?: string;
  expandKey: string; expanded: string | null; onToggle: (k: string | null) => void;
}) {
  const isExpanded = expanded === expandKey;
  return (
    <button onClick={() => onToggle(isExpanded ? null : expandKey)}
      className="w-full flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-white/5 transition-colors text-left">
      <span className="flex items-center gap-1 text-foreground/80">
        {label}
        {isExpanded ? <ChevronUp size={10} className="text-muted-foreground" /> : <ChevronDown size={10} className="text-muted-foreground" />}
      </span>
      <span className="font-medium">{fmtCents(value)}</span>
    </button>
  );
}

// ─── Rate Card (Live Rate Monitor) ──────────────────────────────────────────
const RATE_CATEGORY_ORDER = ["AIRSERVICES", "FUEL", "CREW", "LANDING", "ACCOMMODATION", "GROUND"];
const RATE_CATEGORY_LABELS: Record<string, string> = {
  AIRSERVICES: "Airservices Australia",
  FUEL: "Fuel",
  CREW: "Crew ($/hr)",
  LANDING: "Landing Fees ($/tonne)",
  ACCOMMODATION: "Accommodation",
  GROUND: "Ground Transport",
};
// Normalise category to uppercase so Supabase lowercase values match the order/labels above
function normCategory(cat: string): string { return cat.toUpperCase(); }

function fmtRateDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function fmtRateValue(rate: LiveQuoteRate): string {
  const v = parseFloat(rate.rateValue);
  if (isNaN(v)) return rate.rateValue;
  return `$${v.toFixed(2)}${rate.unit ? ` ${rate.unit}` : ""}`;
}

interface RateCardProps {
  rates: LiveQuoteRate[];
  loading: boolean;
  lastChecked: string | null;
  refreshMutation: { mutate: () => void; isPending: boolean };
  updateMutation: { mutate: (v: { key: string; value: string; notes?: string }) => void; isPending: boolean };
  refreshMessage: string | null;
  tick: number;
}

function RateCard({ rates, loading, lastChecked, refreshMutation, updateMutation, refreshMessage }: RateCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [landingExpanded, setLandingExpanded] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const grouped = useMemo(() => {
    const map: Record<string, LiveQuoteRate[]> = {};
    for (const r of rates) {
      const cat = normCategory(r.category);
      if (!map[cat]) map[cat] = [];
      map[cat].push(r);
    }
    return map;
  }, [rates]);

  const startEdit = (rate: LiveQuoteRate) => {
    setEditingKey(rate.rateKey);
    setEditValue(rate.rateValue);
  };
  const cancelEdit = () => { setEditingKey(null); setEditValue(""); };
  const saveEdit = (rate: LiveQuoteRate) => {
    if (!editValue || isNaN(parseFloat(editValue))) return;
    updateMutation.mutate({ key: rate.rateKey, value: editValue, notes: "Manually overridden" });
    setEditingKey(null);
    setEditValue("");
  };

  const renderRow = (rate: LiveQuoteRate) => {
    const prev = rate.previousValue ? parseFloat(rate.previousValue) : null;
    const curr = parseFloat(rate.rateValue);
    const changed = prev !== null && !isNaN(prev) && !isNaN(curr) && prev !== curr;
    const increased = changed && prev !== null && curr > prev;
    const isEditing = editingKey === rate.rateKey;

    return (
      <tr key={rate.rateKey} className="border-t border-card-border/60">
        <td className="py-1.5 pr-2 text-foreground/80">{rate.label}</td>
        <td className="py-1.5 pr-2 font-medium whitespace-nowrap">
          {isEditing ? (
            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
              className="w-20 text-xs bg-background border border-card-border rounded px-1.5 py-0.5 focus:outline-none" />
          ) : (
            fmtRateValue(rate)
          )}
        </td>
        <td className="py-1.5 pr-2 text-[10px] text-muted-foreground whitespace-nowrap">{fmtRateDate(rate.effectiveDate)}</td>
        <td className="py-1.5 pr-2 whitespace-nowrap">
          {changed && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${increased ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {increased ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
              was ${prev?.toFixed(2)}
            </span>
          )}
        </td>
        <td className="py-1.5 pl-1 text-right whitespace-nowrap">
          {isEditing ? (
            <span className="inline-flex items-center gap-1">
              <button onClick={() => saveEdit(rate)} className="text-green-400 hover:text-green-300" title="Save">
                <Check size={12} />
              </button>
              <button onClick={cancelEdit} className="text-red-400 hover:text-red-300" title="Cancel">
                <X size={12} />
              </button>
            </span>
          ) : (
            <button onClick={() => startEdit(rate)} className="text-muted-foreground hover:text-foreground" title="Edit rate">
              <Pencil size={11} />
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderGroupTable = (category: string, rows: LiveQuoteRate[]) => (
    <div key={category} className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: TEAL }}>
        {RATE_CATEGORY_LABELS[category] ?? category}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[9px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-medium pb-1">Rate</th>
            <th className="text-left font-medium pb-1">Value</th>
            <th className="text-left font-medium pb-1">Effective</th>
            <th className="text-left font-medium pb-1">Change</th>
            <th className="text-right font-medium pb-1"></th>
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <button className="w-full flex items-center justify-between" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-2">
          <DollarSign size={14} style={{ color: TEAL }} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rate Card</h2>
          {lastChecked && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground whitespace-nowrap">
              Verified {fmtRateDate(lastChecked)}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-muted-foreground">
              {rates.length} live rate{rates.length === 1 ? "" : "s"} tracked
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); refreshMutation.mutate(); }}
              disabled={refreshMutation.isPending}
              className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-md border border-card-border hover:bg-white/5 disabled:opacity-50"
            >
              {refreshMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Refresh Rates
            </button>
          </div>

          {refreshMessage && (
            <div className="mb-3 text-[10px] px-2.5 py-1.5 rounded-md" style={{ backgroundColor: `${TEAL}22`, color: TEAL }}>
              {refreshMessage}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
              <Loader2 size={13} className="animate-spin" /> Loading rates...
            </div>
          ) : (
            <>
              {RATE_CATEGORY_ORDER.filter(cat => cat !== "LANDING" && grouped[cat]?.length).map(cat => renderGroupTable(cat, grouped[cat]))}

              {grouped.LANDING?.length > 0 && (
                <div className="mb-1">
                  <button className="w-full flex items-center justify-between mb-1" onClick={() => setLandingExpanded(v => !v)}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                      Landing Fees ($/tonne)
                    </span>
                    {landingExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                  </button>
                  {landingExpanded && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          <th className="text-left font-medium pb-1">Rate</th>
                          <th className="text-left font-medium pb-1">Value</th>
                          <th className="text-left font-medium pb-1">Effective</th>
                          <th className="text-left font-medium pb-1">Change</th>
                          <th className="text-right font-medium pb-1"></th>
                        </tr>
                      </thead>
                      <tbody>{grouped.LANDING.slice(0, 10).map(renderRow)}</tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
