import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  calculateQuote, fmtCents, AIRCRAFT, loadLiveRates, getRatesLastChecked,
  type AircraftKey, type LegInput, type CrewConfig, type QuoteInput, type QuoteCostBreakdown,
  CL60_CAPTAINS, CL60_FIRST_OFFICERS, PC12_CAPTAINS,
  INTL_AIRPORTS, INTL_OVERFLIGHT_FEES, calculateIntlCharges, USD_TO_AUD,
  type IntlAirportInfo, type IntlChargesSummary,
  type GroundTransportType, type LiveQuoteRate, type LegOvernight,
} from "@/lib/quoteEngine";
import { generateCharterQuotePDF } from "@/lib/generateCharterQuotePDF";
import { AirportLegPicker, IntlAirportSearch } from "@/components/AirportSearch";
import { type Airport, distanceNm as calcDistanceNm } from "@/lib/airportData";
import {
  Plane, Plus, Trash2, Calculator, Save, FileDown, RotateCcw,
  AlertTriangle, ChevronDown, ChevronUp, Users, MapPin, Globe, Building2, AlertCircle, Info, Hotel, Percent, Eye, Edit3,
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
  autoInvoice?: number;
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
  // ── International destinations ───────────────────────────────────────────
  {
    label: "Auckland, New Zealand",
    icaoCodes: ["NZAA"],
    hotels: [
      { name: "Sofitel Auckland Viaduct Harbour", chain: "Accor", stars: 5, approxRateAUD: 520, phone: "+64 9 909 9000", bookingUrl: "https://all.accor.com/hotel/A0Q1" },
      { name: "Pullman Auckland Hotel & Apartments", chain: "Accor", stars: 5, approxRateAUD: 480, phone: "+64 9 353 1000", bookingUrl: "https://all.accor.com/hotel/1098" },
      { name: "Novotel Auckland Airport", chain: "Accor", stars: 4, approxRateAUD: 360, phone: "+64 9 275 9191", bookingUrl: "https://all.accor.com/hotel/4408" },
      { name: "ibis Auckland Airport", chain: "Accor", stars: 3, approxRateAUD: 235, phone: "+64 9 256 8880", bookingUrl: "https://all.accor.com/hotel/5987" },
    ],
  },
  {
    label: "Wellington, New Zealand",
    icaoCodes: ["NZWN"],
    hotels: [
      { name: "InterContinental Wellington", chain: "IHG", stars: 5, approxRateAUD: 495, phone: "+64 4 472 2722", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/wellington" },
      { name: "Sofitel Wellington", chain: "Accor", stars: 5, approxRateAUD: 465, phone: "+64 4 901 9000", bookingUrl: "https://all.accor.com/hotel/D3B4" },
      { name: "Novotel Wellington", chain: "Accor", stars: 4, approxRateAUD: 320, phone: "+64 4 918 1900", bookingUrl: "https://all.accor.com/hotel/3000" },
    ],
  },
  {
    label: "Christchurch, New Zealand",
    icaoCodes: ["NZCH"],
    hotels: [
      { name: "The George Christchurch", chain: "Independent", stars: 5, approxRateAUD: 490, phone: "+64 3 379 4560", bookingUrl: "https://www.thegeorge.com" },
      { name: "Novotel Christchurch Airport", chain: "Accor", stars: 4, approxRateAUD: 295, phone: "+64 3 357 7400", bookingUrl: "https://all.accor.com/hotel/9167" },
      { name: "Crowne Plaza Christchurch", chain: "IHG", stars: 4, approxRateAUD: 340, phone: "+64 3 365 0600", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/christchurch" },
    ],
  },
  {
    label: "Singapore",
    icaoCodes: ["WSSS"],
    hotels: [
      { name: "Crowne Plaza Changi Airport", chain: "IHG", stars: 5, approxRateAUD: 580, phone: "+65 6823 5300", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/singapore" },
      { name: "InterContinental Singapore", chain: "IHG", stars: 5, approxRateAUD: 640, phone: "+65 6338 7600", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/singapore" },
      { name: "Novotel Singapore on Stevens", chain: "Accor", stars: 4, approxRateAUD: 380, phone: "+65 6589 7888", bookingUrl: "https://all.accor.com/hotel/5987" },
    ],
  },
  {
    label: "Hong Kong",
    icaoCodes: ["VHHH"],
    hotels: [
      { name: "Regal Airport Hotel Hong Kong", chain: "Regal Hotels", stars: 5, approxRateAUD: 610, phone: "+852 2286 8888", bookingUrl: "https://www.regalhotel.com/regal-airport-hotel" },
      { name: "Novotel Hong Kong Airport", chain: "Accor", stars: 4, approxRateAUD: 490, phone: "+852 3893 8888", bookingUrl: "https://all.accor.com/hotel/7185" },
      { name: "ibis Hong Kong Central & Sheung Wan", chain: "Accor", stars: 3, approxRateAUD: 295, phone: "+852 2252 9888", bookingUrl: "https://all.accor.com/hotel/6899" },
    ],
  },
  {
    label: "Tokyo (Haneda), Japan",
    icaoCodes: ["RJTT"],
    hotels: [
      { name: "Tokyo Haneda Excel Hotel Tokyu", chain: "Tokyu Hotels", stars: 4, approxRateAUD: 450, phone: "+81 3 5756 6000", bookingUrl: "https://www.tokyuhotels.co.jp/haneda-e/index.html" },
      { name: "Haneda Excel Hotel Tokyu (ANA InterContinental)", chain: "IHG", stars: 5, approxRateAUD: 520, phone: "+81 3 5756 5600", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/tokyo" },
      { name: "Sheraton Grand Tokyo Bay Hotel", chain: "Marriott", stars: 4, approxRateAUD: 410, phone: "+81 47 355 5555", bookingUrl: "https://www.marriott.com/en-us/hotels/tyosg-sheraton-grand-tokyo-bay-hotel" },
    ],
  },
  {
    label: "Bangkok, Thailand",
    icaoCodes: ["VTBS"],
    hotels: [
      { name: "Novotel Bangkok Suvarnabhumi Airport", chain: "Accor", stars: 4, approxRateAUD: 310, phone: "+66 2 131 1111", bookingUrl: "https://all.accor.com/hotel/5779" },
      { name: "Pullman Bangkok Hotel G", chain: "Accor", stars: 5, approxRateAUD: 390, phone: "+66 2 238 1991", bookingUrl: "https://all.accor.com/hotel/6979" },
      { name: "Courtyard Bangkok Airport", chain: "Marriott", stars: 4, approxRateAUD: 285, phone: "+66 2 034 1888", bookingUrl: "https://www.marriott.com/en-us/hotels/bkkcy-courtyard-bangkok-airport" },
    ],
  },
  {
    label: "Bali (Denpasar), Indonesia",
    icaoCodes: ["WADD"],
    hotels: [
      { name: "InterContinental Bali Resort", chain: "IHG", stars: 5, approxRateAUD: 520, phone: "+62 361 701888", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/bali" },
      { name: "Novotel Bali Ngurah Rai Airport", chain: "Accor", stars: 4, approxRateAUD: 295, phone: "+62 361 930 6400", bookingUrl: "https://all.accor.com/hotel/B3M8" },
      { name: "Pullman Bali Legian Beach", chain: "Accor", stars: 5, approxRateAUD: 445, phone: "+62 361 762 888", bookingUrl: "https://all.accor.com/hotel/8634" },
    ],
  },
  {
    label: "Port Moresby, Papua New Guinea",
    icaoCodes: ["AYPY"],
    hotels: [
      { name: "Airways Hotel Port Moresby", chain: "Independent", stars: 5, approxRateAUD: 520, phone: "+675 324 5200", bookingUrl: "https://www.airwayshotel.com" },
      { name: "Holiday Inn Port Moresby", chain: "IHG", stars: 4, approxRateAUD: 390, phone: "+675 303 2000", bookingUrl: "https://www.ihg.com/holidayinn/hotels/au/en/port-moresby" },
      { name: "Crowne Plaza Port Moresby", chain: "IHG", stars: 5, approxRateAUD: 480, phone: "+675 309 3000", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/port-moresby" },
    ],
  },
  {
    label: "Nadi, Fiji",
    icaoCodes: ["NFFN"],
    hotels: [
      { name: "Sofitel Fiji Resort & Spa", chain: "Accor", stars: 5, approxRateAUD: 490, phone: "+679 675 1111", bookingUrl: "https://all.accor.com/hotel/9167" },
      { name: "Novotel Nadi", chain: "Accor", stars: 4, approxRateAUD: 310, phone: "+679 672 2000", bookingUrl: "https://all.accor.com/hotel/3636" },
      { name: "Holiday Inn Resort Vanuatu", chain: "IHG", stars: 4, approxRateAUD: 295, phone: "+679 672 2766", bookingUrl: "https://www.ihg.com/holidayinnresorts/hotels/au/en/fiji" },
    ],
  },
  {
    label: "Suva, Fiji",
    icaoCodes: ["NFSU"],
    hotels: [
      { name: "Holiday Inn Suva", chain: "IHG", stars: 4, approxRateAUD: 290, phone: "+679 330 0600", bookingUrl: "https://www.ihg.com/holidayinn/hotels/au/en/suva" },
      { name: "Grand Pacific Hotel Suva", chain: "Independent", stars: 5, approxRateAUD: 370, phone: "+679 322 2000", bookingUrl: "https://www.grandpacifichotel.com.fj" },
    ],
  },
  {
    label: "Port Vila, Vanuatu",
    icaoCodes: ["NVVF"],
    hotels: [
      { name: "Iririki Island Resort & Spa", chain: "Independent", stars: 4, approxRateAUD: 340, phone: "+678 23388", bookingUrl: "https://www.iririki.com" },
      { name: "Holiday Inn Resort Vanuatu", chain: "IHG", stars: 4, approxRateAUD: 310, phone: "+678 22040", bookingUrl: "https://www.ihg.com/holidayinnresorts/hotels/au/en/vanuatu" },
      { name: "Warwick Le Lagon Resort & Spa", chain: "Warwick Hotels", stars: 4, approxRateAUD: 290, phone: "+678 22313", bookingUrl: "https://www.warwickhotels.com/le-lagon" },
    ],
  },
  {
    label: "Noumea, New Caledonia",
    icaoCodes: ["NWWW", "NWWM"],
    hotels: [
      { name: "Le Méridien Noumea", chain: "Marriott", stars: 5, approxRateAUD: 420, phone: "+687 26 50 00", bookingUrl: "https://www.marriott.com/en-us/hotels/numlc-le-meridien-noumea" },
      { name: "Hilton Noumea La Promenade Residences", chain: "Hilton", stars: 4, approxRateAUD: 380, phone: "+687 23 73 00", bookingUrl: "https://www.hilton.com/en/hotels/nouhnhi-hilton-noumea-la-promenade-residences" },
      { name: "Ramada Resort by Wyndham Noumea", chain: "Wyndham", stars: 4, approxRateAUD: 310, phone: "+687 26 22 00", bookingUrl: "https://www.wyndhamhotels.com/ramada/noumea" },
    ],
  },
  {
    label: "Dubai, UAE",
    icaoCodes: ["OMDB"],
    hotels: [
      { name: "Crowne Plaza Dubai Airport", chain: "IHG", stars: 5, approxRateAUD: 590, phone: "+971 4 282 9999", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/dubai" },
      { name: "Novotel Dubai Al Barsha", chain: "Accor", stars: 4, approxRateAUD: 380, phone: "+971 4 399 9999", bookingUrl: "https://all.accor.com/hotel/7448" },
      { name: "InterContinental Dubai Festival City", chain: "IHG", stars: 5, approxRateAUD: 620, phone: "+971 4 701 1111", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/dubai" },
    ],
  },
  {
    label: "Nuku'alofa, Tonga",
    icaoCodes: ["NFTF"],
    hotels: [
      { name: "Scenic Hotel Tonga", chain: "Scenic Hotel Group", stars: 4, approxRateAUD: 285, phone: "+676 23 344", bookingUrl: "https://www.scenichotelgroup.co.nz/tonga" },
      { name: "Hilton Garden Inn Tonga Nuku'alofa", chain: "Hilton", stars: 4, approxRateAUD: 320, phone: "+676 25 555", bookingUrl: "https://www.hilton.com/en/hotels/nunlpgi-hilton-garden-inn-tonga" },
    ],
  },
  {
    label: "Honiara, Solomon Islands",
    icaoCodes: ["AGGH"],
    hotels: [
      { name: "Heritage Park Hotel Honiara", chain: "Independent", stars: 4, approxRateAUD: 320, phone: "+677 36 100", bookingUrl: "https://www.heritageparkhotel.com.sb" },
      { name: "Coral Sea Resort Honiara", chain: "Independent", stars: 4, approxRateAUD: 295, phone: "+677 21 333", bookingUrl: "https://www.coralsearesort.com.sb" },
    ],
  },
  {
    label: "Papeete, French Polynesia",
    icaoCodes: ["NTAA"],
    hotels: [
      { name: "InterContinental Tahiti Resort & Spa", chain: "IHG", stars: 5, approxRateAUD: 680, phone: "+689 40 86 51 10", bookingUrl: "https://www.ihg.com/intercontinental/hotels/au/en/tahiti" },
      { name: "Sofitel Tahiti Maeva Beach Resort", chain: "Accor", stars: 4, approxRateAUD: 540, phone: "+689 40 42 80 42", bookingUrl: "https://all.accor.com/hotel/0561" },
    ],
  },
  {
    label: "Apia, Samoa",
    icaoCodes: ["NSFA"],
    hotels: [
      { name: "Sheraton Samoa Aggie Grey's Hotel", chain: "Marriott", stars: 4, approxRateAUD: 350, phone: "+685 22 880", bookingUrl: "https://www.marriott.com/en-us/hotels/apwsi-sheraton-samoa-aggie-greys-hotel" },
      { name: "Samoa Sinalei Reef Resort & Spa", chain: "Independent", stars: 4, approxRateAUD: 320, phone: "+685 25 191", bookingUrl: "https://www.sinalei.com" },
    ],
  },
  {
    label: "Manila, Philippines",
    icaoCodes: ["RPLL"],
    hotels: [
      { name: "Sofitel Philippine Plaza Manila", chain: "Accor", stars: 5, approxRateAUD: 410, phone: "+63 2 8551 5555", bookingUrl: "https://all.accor.com/hotel/1466" },
      { name: "Holiday Inn Manila Galleria", chain: "IHG", stars: 4, approxRateAUD: 290, phone: "+63 2 8633 7777", bookingUrl: "https://www.ihg.com/holidayinn/hotels/au/en/manila" },
      { name: "Novotel Manila Araneta City", chain: "Accor", stars: 4, approxRateAUD: 270, phone: "+63 2 8990 7888", bookingUrl: "https://all.accor.com/hotel/A3V1" },
      { name: "Crowne Plaza Manila Galleria", chain: "IHG", stars: 5, approxRateAUD: 360, phone: "+63 2 8633 7777", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/manila" },
    ],
  },
  {
    label: "Jakarta, Indonesia",
    icaoCodes: ["WIII"],
    hotels: [
      { name: "Pullman Jakarta Indonesia", chain: "Accor", stars: 5, approxRateAUD: 390, phone: "+62 21 3192 1111", bookingUrl: "https://all.accor.com/hotel/1320" },
      { name: "Novotel Jakarta Cikini", chain: "Accor", stars: 4, approxRateAUD: 265, phone: "+62 21 2314 1234", bookingUrl: "https://all.accor.com/hotel/6827" },
      { name: "Crowne Plaza Jakarta", chain: "IHG", stars: 5, approxRateAUD: 370, phone: "+62 21 5268 833", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/jakarta" },
      { name: "ibis Jakarta Slipi", chain: "Accor", stars: 3, approxRateAUD: 155, phone: "+62 21 5366 4600", bookingUrl: "https://all.accor.com/hotel/6531" },
    ],
  },
  {
    label: "Los Angeles, USA",
    icaoCodes: ["KLAX"],
    hotels: [
      { name: "Crowne Plaza LAX", chain: "IHG", stars: 4, approxRateAUD: 590, phone: "+1 310 642 7500", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/los-angeles" },
      { name: "Westin Los Angeles Airport", chain: "Marriott", stars: 4, approxRateAUD: 620, phone: "+1 310 216 7100", bookingUrl: "https://www.marriott.com/en-us/hotels/laxwi-the-westin-los-angeles-airport" },
      { name: "Hilton Los Angeles Airport", chain: "Hilton", stars: 4, approxRateAUD: 560, phone: "+1 310 410 4000", bookingUrl: "https://www.hilton.com/en/hotels/laxahhh-hilton-los-angeles-airport" },
    ],
  },
];

// ─── Extended 4★+ Accommodation (regional / non-CT locations) ────────────────
// Covers all major RFDS aerodromes not in the CT preferred-partner list.
// All properties are 4 stars or above, sourced from Booking.com / property websites.
const EXTENDED_ACCOM: AccomLocation[] = [
  {
    label: "Tamworth NSW",
    icaoCodes: ["YSTW"],
    hotels: [
      { name: "Powerhouse Hotel Tamworth", chain: "Independent", stars: 4, approxRateAUD: 175, phone: "+61 2 6766 7000", bookingUrl: "https://www.powerhousehoteltamworth.com.au" },
      { name: "Quality Hotel Tamworth", chain: "Choice Hotels", stars: 4, approxRateAUD: 160, phone: "+61 2 6768 4444", bookingUrl: "https://www.choicehotels.com/new-south-wales/tamworth" },
    ],
  },
  {
    label: "Armidale NSW",
    icaoCodes: ["YARM"],
    hotels: [
      { name: "Armidale Motel", chain: "Independent", stars: 4, approxRateAUD: 155, phone: "+61 2 6772 8799", bookingUrl: "https://www.booking.com/city/au/armidale.html" },
      { name: "Armidale City Motel", chain: "Independent", stars: 4, approxRateAUD: 145, phone: "+61 2 6772 4477", bookingUrl: "https://www.booking.com/city/au/armidale.html" },
    ],
  },
  {
    label: "Wagga Wagga NSW",
    icaoCodes: ["YSWG"],
    hotels: [
      { name: "Mercure Wagga Wagga", chain: "Accor", stars: 4, approxRateAUD: 175, phone: "+61 2 6932 7878", bookingUrl: "https://all.accor.com/hotel/1611" },
      { name: "Quality Hotel Menzies Wagga Wagga", chain: "Choice Hotels", stars: 4, approxRateAUD: 165, phone: "+61 2 6921 4444", bookingUrl: "https://www.choicehotels.com/new-south-wales/wagga-wagga" },
    ],
  },
  {
    label: "Albury NSW",
    icaoCodes: ["YMAY"],
    hotels: [
      { name: "Mantra Albury", chain: "Accor", stars: 4, approxRateAUD: 180, phone: "+61 2 6058 5100", bookingUrl: "https://all.accor.com/hotel/6996" },
      { name: "Rydges Albury", chain: "Rydges", stars: 4, approxRateAUD: 175, phone: "+61 2 6021 5366", bookingUrl: "https://www.rydges.com/accommodation/albury-nsw/rydges-albury" },
    ],
  },
  {
    label: "Orange NSW",
    icaoCodes: ["YORG"],
    hotels: [
      { name: "Mercure Orange", chain: "Accor", stars: 4, approxRateAUD: 170, phone: "+61 2 6362 5000", bookingUrl: "https://all.accor.com/hotel/2044" },
      { name: "Duntryleague Guesthouse", chain: "Independent", stars: 4, approxRateAUD: 185, phone: "+61 2 6362 2877", bookingUrl: "https://www.duntryleague.com.au" },
    ],
  },
  {
    label: "Bathurst NSW",
    icaoCodes: ["YBTH"],
    hotels: [
      { name: "Quality Hotel Rothbury Bathurst", chain: "Choice Hotels", stars: 4, approxRateAUD: 160, phone: "+61 2 6333 1800", bookingUrl: "https://www.choicehotels.com/new-south-wales/bathurst" },
      { name: "Panorama Motor Inn Bathurst", chain: "Independent", stars: 4, approxRateAUD: 145, phone: "+61 2 6331 2666", bookingUrl: "https://www.booking.com/city/au/bathurst.html" },
    ],
  },
  {
    label: "Griffith NSW",
    icaoCodes: ["YGTH"],
    hotels: [
      { name: "Acacia Holiday Units Griffith", chain: "Independent", stars: 4, approxRateAUD: 150, phone: "+61 2 6964 2322", bookingUrl: "https://www.booking.com/city/au/griffith.html" },
      { name: "Quality Hotel Griffith", chain: "Choice Hotels", stars: 4, approxRateAUD: 165, phone: "+61 2 6964 3844", bookingUrl: "https://www.choicehotels.com/new-south-wales/griffith" },
    ],
  },
  {
    label: "Moree NSW",
    icaoCodes: ["YMOR"],
    hotels: [
      { name: "Quality Inn Moree", chain: "Choice Hotels", stars: 4, approxRateAUD: 155, phone: "+61 2 6752 1866", bookingUrl: "https://www.choicehotels.com/new-south-wales/moree" },
      { name: "Gwydir Hotel Moree", chain: "Independent", stars: 4, approxRateAUD: 140, phone: "+61 2 6752 1855", bookingUrl: "https://www.booking.com/city/au/moree.html" },
    ],
  },
  {
    label: "Narrabri NSW",
    icaoCodes: ["YNBR"],
    hotels: [
      { name: "Crossroads Motor Inn Narrabri", chain: "Independent", stars: 4, approxRateAUD: 145, phone: "+61 2 6792 6233", bookingUrl: "https://www.booking.com/city/au/narrabri.html" },
    ],
  },
  {
    label: "Parkes NSW",
    icaoCodes: ["YPKS"],
    hotels: [
      { name: "Quality Inn Parkes International", chain: "Choice Hotels", stars: 4, approxRateAUD: 155, phone: "+61 2 6862 8111", bookingUrl: "https://www.choicehotels.com/new-south-wales/parkes" },
    ],
  },
  {
    label: "Forbes NSW",
    icaoCodes: ["YFBS"],
    hotels: [
      { name: "Forbes RSL Club & Motel", chain: "Independent", stars: 4, approxRateAUD: 135, phone: "+61 2 6852 2966", bookingUrl: "https://www.booking.com/city/au/forbes.html" },
    ],
  },
  {
    label: "Mudgee NSW",
    icaoCodes: ["YMDG"],
    hotels: [
      { name: "Rydges Mudgee", chain: "Rydges", stars: 4, approxRateAUD: 175, phone: "+61 2 6372 1555", bookingUrl: "https://www.rydges.com/accommodation/mudgee-nsw/rydges-mudgee" },
    ],
  },
  {
    label: "Narrandera NSW",
    icaoCodes: ["YNAR"],
    hotels: [
      { name: "Narrandera Motor Inn", chain: "Independent", stars: 4, approxRateAUD: 135, phone: "+61 2 6959 1100", bookingUrl: "https://www.booking.com/city/au/narrandera.html" },
    ],
  },
  {
    label: "Coffs Harbour NSW",
    icaoCodes: ["YCFS"],
    hotels: [
      { name: "Opal Cove Resort", chain: "Independent", stars: 4, approxRateAUD: 199, phone: "+61 2 6651 0510", bookingUrl: "https://www.opalcove.com.au" },
      { name: "Mantra Coffs Harbour", chain: "Accor", stars: 4, approxRateAUD: 185, phone: "+61 2 6651 0111", bookingUrl: "https://all.accor.com/hotel/6994" },
    ],
  },
  {
    label: "Port Macquarie NSW",
    icaoCodes: ["YPMQ"],
    hotels: [
      { name: "Rydges Port Macquarie", chain: "Rydges", stars: 4, approxRateAUD: 195, phone: "+61 2 6583 1200", bookingUrl: "https://www.rydges.com/accommodation/port-macquarie-nsw/rydges-port-macquarie" },
      { name: "Mantra Quayside Port Macquarie", chain: "Accor", stars: 4, approxRateAUD: 185, phone: "+61 2 6584 0400", bookingUrl: "https://all.accor.com/hotel/6998" },
    ],
  },
  {
    label: "Newcastle NSW",
    icaoCodes: ["YWLM"],
    hotels: [
      { name: "Crowne Plaza Newcastle", chain: "IHG", stars: 5, approxRateAUD: 265, phone: "+61 2 4907 5000", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/newcastle" },
      { name: "Novotel Newcastle Beach", chain: "Accor", stars: 4, approxRateAUD: 229, phone: "+61 2 4032 3700", bookingUrl: "https://all.accor.com/hotel/9003" },
      { name: "Rydges Newcastle", chain: "Rydges", stars: 4, approxRateAUD: 195, phone: "+61 2 4926 3777", bookingUrl: "https://www.rydges.com/accommodation/newcastle-nsw/rydges-newcastle" },
    ],
  },
  {
    label: "Hobart TAS",
    icaoCodes: ["YMHB"],
    hotels: [
      { name: "Mövenpick Hotel Hobart", chain: "Accor", stars: 5, approxRateAUD: 289, phone: "+61 3 6210 7600", bookingUrl: "https://all.accor.com/hotel/B3U1" },
      { name: "Hotel Grand Chancellor Hobart", chain: "Independent", stars: 5, approxRateAUD: 275, phone: "+61 3 6235 4535", bookingUrl: "https://www.grandchancellorhotels.com/hotel-grand-chancellor-hobart" },
      { name: "Crowne Plaza Hobart", chain: "IHG", stars: 5, approxRateAUD: 269, phone: "+61 3 6220 0000", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/hobart" },
      { name: "Novotel Hobart", chain: "Accor", stars: 4, approxRateAUD: 229, phone: "+61 3 6220 7700", bookingUrl: "https://all.accor.com/hotel/2130" },
    ],
  },
  {
    label: "Townsville QLD",
    icaoCodes: ["YBTL"],
    hotels: [
      { name: "Rydges Southbank Townsville", chain: "Rydges", stars: 4, approxRateAUD: 199, phone: "+61 7 4726 7800", bookingUrl: "https://www.rydges.com/accommodation/townsville-qld/rydges-southbank-townsville" },
      { name: "DoubleTree by Hilton Townsville", chain: "Hilton", stars: 4, approxRateAUD: 219, phone: "+61 7 4753 6000", bookingUrl: "https://www.hilton.com/en/hotels/tsvdidi-doubletree-townsville" },
      { name: "Hotel Grand Chancellor Townsville", chain: "Independent", stars: 4, approxRateAUD: 189, phone: "+61 7 4729 2000", bookingUrl: "https://www.grandchancellorhotels.com/hotel-grand-chancellor-townsville" },
    ],
  },
  {
    label: "Rockhampton QLD",
    icaoCodes: ["YBRK"],
    hotels: [
      { name: "Crowne Plaza Rockhampton", chain: "IHG", stars: 4, approxRateAUD: 199, phone: "+61 7 4927 8855", bookingUrl: "https://www.ihg.com/crowneplaza/hotels/au/en/rockhampton" },
    ],
  },
  {
    label: "Mount Isa QLD",
    icaoCodes: ["YBMA"],
    hotels: [
      { name: "ibis Styles Mount Isa Verona", chain: "Accor", stars: 4, approxRateAUD: 175, phone: "+61 7 4743 3024", bookingUrl: "https://all.accor.com/hotel/6847" },
    ],
  },
  {
    label: "Longreach QLD",
    icaoCodes: ["YLRE"],
    hotels: [
      { name: "ibis Styles Longreach", chain: "Accor", stars: 4, approxRateAUD: 179, phone: "+61 7 4658 2322", bookingUrl: "https://all.accor.com/hotel/7153" },
    ],
  },
  {
    label: "Charleville QLD",
    icaoCodes: ["YBCV"],
    hotels: [
      { name: "Charleville Motor Inn", chain: "Independent", stars: 4, approxRateAUD: 155, phone: "+61 7 4654 1566", bookingUrl: "https://www.booking.com/city/au/charleville.html" },
    ],
  },
  {
    label: "Coober Pedy SA",
    icaoCodes: ["YCBP"],
    hotels: [
      { name: "Desert Cave Hotel", chain: "Independent", stars: 4, approxRateAUD: 195, phone: "+61 8 8672 5688", bookingUrl: "https://www.desertcave.com.au" },
    ],
  },
  {
    label: "Broome WA",
    icaoCodes: ["YBRM"],
    hotels: [
      { name: "Cable Beach Club Resort & Spa", chain: "Independent", stars: 5, approxRateAUD: 399, phone: "+61 8 9192 0400", bookingUrl: "https://www.cablebeachclub.com" },
      { name: "Mercure Broome", chain: "Accor", stars: 4, approxRateAUD: 215, phone: "+61 8 9192 1303", bookingUrl: "https://all.accor.com/hotel/0745" },
      { name: "Mantra Frangipani Broome", chain: "Accor", stars: 4, approxRateAUD: 199, phone: "+61 8 9193 7700", bookingUrl: "https://all.accor.com/hotel/8534" },
    ],
  },
  {
    label: "Yulara (Uluru) NT",
    icaoCodes: ["YAYE"],
    hotels: [
      { name: "Sails in the Desert Hotel", chain: "Ayers Rock Resort", stars: 5, approxRateAUD: 425, phone: "+61 2 8296 8010", bookingUrl: "https://www.ayersrockresort.com.au/accommodation/sails-in-the-desert" },
      { name: "Desert Gardens Hotel", chain: "Ayers Rock Resort", stars: 4, approxRateAUD: 299, phone: "+61 2 8296 8010", bookingUrl: "https://www.ayersrockresort.com.au/accommodation/desert-gardens-hotel" },
    ],
  },
  {
    label: "Lord Howe Island NSW",
    icaoCodes: ["YLHI"],
    hotels: [
      { name: "Capella Lodge", chain: "Independent", stars: 5, approxRateAUD: 895, phone: "+61 2 9918 4355", bookingUrl: "https://www.lordhowe.com" },
      { name: "Pinetrees Lodge", chain: "Independent", stars: 4, approxRateAUD: 475, phone: "+61 2 6563 2177", bookingUrl: "https://www.pinetrees.com.au" },
    ],
  },
  {
    label: "Gold Coast QLD",
    icaoCodes: ["YBCG"],
    hotels: [
      { name: "Marriott Resort & Spa Gold Coast", chain: "Marriott", stars: 5, approxRateAUD: 329, phone: "+61 7 5592 9800", bookingUrl: "https://www.marriott.com/en-us/hotels/oolmc-surfers-paradise-marriott-resort-and-spa" },
      { name: "Palazzo Versace Gold Coast", chain: "Independent", stars: 5, approxRateAUD: 489, phone: "+61 7 5509 8000", bookingUrl: "https://www.palazzoversace.com.au" },
      { name: "Vibe Hotel Gold Coast", chain: "TFE Hotels", stars: 4, approxRateAUD: 219, phone: "+61 7 5538 2000", bookingUrl: "https://www.vibehotels.com/hotels/gold-coast" },
    ],
  },
  {
    label: "Sunshine Coast QLD",
    icaoCodes: ["YBSU"],
    hotels: [
      { name: "Sofitel Noosa Pacific Resort", chain: "Accor", stars: 5, approxRateAUD: 349, phone: "+61 7 5449 4888", bookingUrl: "https://all.accor.com/hotel/1068" },
      { name: "Novotel Sunshine Coast Resort", chain: "Accor", stars: 4, approxRateAUD: 249, phone: "+61 7 5473 3797", bookingUrl: "https://all.accor.com/hotel/6577" },
    ],
  },
  {
    // Best available in remote outback — no 4★ hotels exist in Walgett
    label: "Walgett NSW",
    icaoCodes: ["YWLG"],
    hotels: [
      { name: "Coolabah Motel Walgett", chain: "Independent", stars: 3, approxRateAUD: 140, phone: "02 6828 1366", bookingUrl: "https://www.coolabahwalgett.com.au" },
      { name: "Gateway Hotel Motel", chain: "Independent", stars: 2, approxRateAUD: 110, phone: "02 6828 1563", bookingUrl: "https://thegatewaywalgett.com.au" },
    ],
  },
  {
    // Best available in remote outback — no 4★ hotels exist in Wilcannia
    label: "Wilcannia NSW",
    icaoCodes: ["YWCA"],
    hotels: [
      { name: "Graham's Motel", chain: "Independent", stars: 2, approxRateAUD: 110, phone: "08 8091 5957", bookingUrl: "https://www.thedarlingriverrun.com.au/directory/liberty-roadhouse-and-grahams-motel/" },
      { name: "Ampol Roadhouse Motel", chain: "Independent", stars: 2, approxRateAUD: 95, phone: "08 8091 5957", bookingUrl: "https://wilcanniatourism.com.au/directory/accommodation" },
    ],
  },
];

/**
 * Returns CT hotels for a specific ICAO, split into 4★+ and below-4★ groups.
 * Also returns extended 4★+ hotels (non-CT) for that ICAO.
 * Never returns hotels from other locations.
 */
function getAccomForICAO(icao: string): {
  ctFourPlus: AccomProperty[];
  ctBelow4: AccomProperty[];
  extended: AccomProperty[];
  locationLabel: string | null;
  hasCtMatch: boolean;
} {
  const code = icao.toUpperCase();
  const ctLoc = CORPORATE_TRAVELLER_ACCOM.find(loc => loc.icaoCodes.includes(code));
  const extLoc = EXTENDED_ACCOM.find(loc => loc.icaoCodes.includes(code));

  return {
    ctFourPlus: ctLoc ? ctLoc.hotels.filter(h => h.stars >= 4).sort((a, b) => b.stars - a.stars || b.approxRateAUD - a.approxRateAUD) : [],
    ctBelow4: ctLoc ? ctLoc.hotels.filter(h => h.stars < 4) : [],
    extended: extLoc ? extLoc.hotels.filter(h => h.stars >= 4).sort((a, b) => b.stars - a.stars || b.approxRateAUD - a.approxRateAUD) : [],
    locationLabel: ctLoc?.label ?? extLoc?.label ?? null,
    hasCtMatch: !!ctLoc,
  };
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


// ─── Airport Curfew Database ─────────────────────────────────────────────────
// Sources: ERSA, AIP Australia, Airport Operating Manuals
// Times are LOCAL. Medivac/aeromedical flights are exempt from noise curfews
// under relevant State legislation and Airport Regulations.
interface CurfewRule {
  start: number;  // hour (24h) curfew begins
  end: number;    // hour (24h) curfew ends (exclusive — i.e. ops resume at this hour)
  label: string;
  statutory: boolean;  // true = legislated, false = voluntary noise abatement
  medicExempt: boolean;
}
const AIRPORT_CURFEWS: Record<string, CurfewRule> = {
  YSSY: { start: 23, end: 6,  label: "Sydney Kingsford Smith", statutory: true,  medicExempt: true  },
  YPPH: { start: 22, end: 6,  label: "Perth International",    statutory: true,  medicExempt: true  },
  YMEN: { start: 21, end: 7,  label: "Essendon Airport",       statutory: true,  medicExempt: true  },
  YSCB: { start: 23, end: 6,  label: "Canberra Airport",       statutory: false, medicExempt: true  },
  YBCG: { start: 23, end: 6,  label: "Gold Coast Airport",     statutory: false, medicExempt: true  },
  YBBN: { start: 23, end: 6,  label: "Brisbane Airport",       statutory: false, medicExempt: true  },
};

function isInCurfew(hhmm: string, rule: CurfewRule): boolean {
  if (!hhmm) return false;
  const [h, m] = hhmm.split(":").map(Number);
  const mins = h * 60 + m;
  const startMins = rule.start * 60;
  const endMins = rule.end * 60;
  if (startMins > endMins) {
    // Spans midnight e.g. 23:00–06:00
    return mins >= startMins || mins < endMins;
  }
  return mins >= startMins && mins < endMins;
}

function addMinsToHHMM(hhmm: string, mins: number): string {
  if (!hhmm || !hhmm.includes(":")) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  const total = ((h * 60 + m + mins) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeDiffMins(from: string, to: string): number {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const diff = (th * 60 + tm) - (fh * 60 + fm);
  return diff < 0 ? diff + 24 * 60 : diff;
}

interface RestCalcProps {
  arrivalTime: string;          // HH:MM
  departureICAO: string;        // next departure (= this arrival airport)
  isMedivac: boolean;
  crewType: "multi" | "single"; // multi = 10hr rest, single = 8hr
}

function RestCalculator({ arrivalTime, departureICAO, isMedivac, crewType }: RestCalcProps) {
  const minRestMins = crewType === "multi" ? 10 * 60 : 8 * 60;
  const minRestLabel = crewType === "multi" ? "10 hrs (CAO 48.1 multi-crew)" : "8 hrs (CAO 48.1 single-pilot)";
  const earliestDep = addMinsToHHMM(arrivalTime, minRestMins);

  const curfewRule = AIRPORT_CURFEWS[departureICAO];
  const curfewActive = curfewRule && isInCurfew(earliestDep, curfewRule);
  const exemptApplies = curfewActive && isMedivac && curfewRule.medicExempt;

  // If curfew applies and no exemption, find first minute curfew lifts
  let blockedUntil: string | null = null;
  let actualEarliestDep = earliestDep;
  if (curfewActive && !exemptApplies) {
    blockedUntil = `${String(curfewRule.end).padStart(2, "0")}:00`;
    actualEarliestDep = blockedUntil;
    // If blocked-until is earlier than rest-end, use rest-end instead
    if (timeDiffMins(earliestDep, blockedUntil) > 12 * 60) {
      // blockedUntil is actually TOMORROW — happens when curfew spans midnight
      // and earliest dep is in the curfew window before midnight
      // actual departure is next day at curfew end
      blockedUntil = `${String(curfewRule.end).padStart(2, "0")}:00 (+1 day)`;
      actualEarliestDep = `${String(curfewRule.end).padStart(2, "0")}:00`;
    }
  }

  const totalWaitMins = timeDiffMins(arrivalTime, actualEarliestDep);
  const waitHrs = Math.floor(totalWaitMins / 60);
  const waitMins = totalWaitMins % 60;

  return (
    <div className="mt-3 rounded-lg border border-blue-400/20 bg-blue-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-400/15 bg-blue-500/8">
        <Clock size={12} className="text-blue-400 flex-shrink-0" />
        <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">Crew Rest Calculator</span>
        <span className="ml-auto text-[9px] text-blue-400/60">CASA CAO 48.1</span>
      </div>

      <div className="px-3 py-2.5 space-y-2">
        {/* Rest timeline */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Arrival</div>
            <div className="text-sm font-bold text-foreground font-mono">{arrivalTime}</div>
            <div className="text-[8px] text-muted-foreground">rest begins</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-[8px] text-blue-400 font-semibold">{minRestMins / 60} hrs min</div>
              <div className="w-full h-px bg-blue-400/30 my-1 relative">
                <div className="absolute inset-y-0 left-0 bg-blue-400/60" style={{ width: "100%" }} />
              </div>
              <div className="text-[8px] text-muted-foreground">required rest</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">Rest Complete</div>
            <div className="text-sm font-bold text-blue-300 font-mono">{earliestDep}</div>
            <div className="text-[8px] text-muted-foreground">earliest legal dep</div>
          </div>
        </div>

        {/* Curfew status */}
        {curfewRule ? (
          <div className={`flex items-start gap-2 px-2.5 py-2 rounded-md text-[10px] ${
            curfewActive && !exemptApplies
              ? "bg-red-500/10 border border-red-400/30 text-red-300"
              : curfewActive && exemptApplies
              ? "bg-amber-500/10 border border-amber-400/30 text-amber-300"
              : "bg-green-500/10 border border-green-400/30 text-green-300"
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {curfewActive && !exemptApplies ? "🔴" : curfewActive && exemptApplies ? "🟡" : "🟢"}
            </div>
            <div className="flex-1">
              {!curfewActive && (
                <span><strong>{departureICAO}</strong> — No curfew conflict. Earliest departure <strong className="font-mono">{earliestDep}</strong> is clear.</span>
              )}
              {curfewActive && exemptApplies && (
                <span><strong>{departureICAO}</strong> curfew {String(curfewRule.start).padStart(2,"0")}:00–{String(curfewRule.end).padStart(2,"0")}:00 applies at earliest rest-complete time. <strong>Medivac exemption applies</strong> — aeromedical operations are exempt. Departure at <strong className="font-mono">{earliestDep}</strong> permitted.</span>
              )}
              {curfewActive && !exemptApplies && (
                <span><strong>{departureICAO}</strong> curfew {String(curfewRule.start).padStart(2,"0")}:00–{String(curfewRule.end).padStart(2,"0")}:00 blocks departure at {earliestDep}. Earliest permitted departure: <strong className="font-mono">{blockedUntil}</strong>.</span>
              )}
              {!curfewRule.statutory && (
                <span className="block text-[9px] opacity-70 mt-0.5">Voluntary noise abatement — not a statutory curfew.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-green-500/8 border border-green-400/20 text-[10px] text-green-400">
            <span>🟢</span>
            <span><strong>{departureICAO}</strong> — No curfew restrictions. Departure from <strong className="font-mono">{earliestDep}</strong> permitted.</span>
          </div>
        )}

        {/* Actual earliest departure summary */}
        <div className="flex items-center justify-between px-2.5 py-2 rounded-md bg-background border border-card-border">
          <div>
            <div className="text-[9px] text-muted-foreground">Earliest Permitted Departure</div>
            <div className="text-base font-bold font-mono text-foreground">{actualEarliestDep}</div>
            <div className="text-[9px] text-muted-foreground">{waitHrs > 0 ? `${waitHrs}h ${waitMins}m` : `${waitMins}m`} from arrival · {minRestLabel}</div>
          </div>
          {curfewActive && exemptApplies && (
            <div className="px-2 py-1 bg-amber-500/15 border border-amber-400/30 rounded text-[9px] text-amber-300 font-semibold text-right">
              Medivac<br/>Exempt
            </div>
          )}
          {curfewActive && !exemptApplies && (
            <div className="px-2 py-1 bg-red-500/15 border border-red-400/30 rounded text-[9px] text-red-300 font-semibold text-right">
              Curfew<br/>Applies
            </div>
          )}
          {!curfewActive && (
            <div className="px-2 py-1 bg-green-500/15 border border-green-400/30 rounded text-[9px] text-green-300 font-semibold text-right">
              Rest<br/>Clear
            </div>
          )}
        </div>
      </div>
    </div>
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

  // International charges state (per leg index)
  const [intlDestICAO, setIntlDestICAO] = useState<Record<number, string>>({});
  const [intlParkingHrs, setIntlParkingHrs] = useState<Record<number, number>>({});
  const [intlPaxCount, setIntlPaxCount] = useState<Record<number, number>>({});
  const [intlCrewNights, setIntlCrewNights] = useState<Record<number, number>>({});
  const [intlOverflights, setIntlOverflights] = useState<Record<number, string[]>>({});
  const [legs, setLegs] = useState<LegInput[]>([emptyLeg()]);
  // Airport objects parallel to legs[] — for autocomplete selection
  const [legAirports, setLegAirports] = useState<Array<{ id: string; from: Airport | null; to: Airport | null }>>([{ id: crypto.randomUUID(), from: null, to: null }]);
  const [includeReturnLeg, setIncludeReturnLeg] = useState(false);
  const [crew, setCrew] = useState<CrewConfig>({
    captain: true, firstOfficer: false, flightNurse: false, flightParamedic: false, icuDoctor: false, count: 1,
    captainName: '', firstOfficerName: '',
  });
  // Per-leg overnight stays
  const [legOvernights, setLegOvernights] = useState<Record<number, { nights: number | ""; hotel: AccomProperty | null; search: string }>>({});

  function getLegOvernight(idx: number) {
    return legOvernights[idx] ?? { nights: 0, hotel: null, search: "" };
  }
  function setLegNights(idx: number, nights: number | "") {
    setLegOvernights(prev => ({ ...prev, [idx]: { ...getLegOvernight(idx), nights } }));
  }
  function setLegHotel(idx: number, hotel: AccomProperty | null) {
    setLegOvernights(prev => ({ ...prev, [idx]: { ...getLegOvernight(idx), hotel } }));
  }
  function setLegSearch(idx: number, search: string) {
    setLegOvernights(prev => ({ ...prev, [idx]: { ...getLegOvernight(idx), search } }));
  }
  const [marginPercent, setMarginPercent] = useState(15);
  const [notes, setNotes] = useState("");
  const [autoInvoice, setAutoInvoice] = useState(false);

  const [breakdown, setBreakdown] = useState<QuoteCostBreakdown | null>(null);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [viewingQuote, setViewingQuote] = useState<CharterQuoteRecord | null>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

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
    setLegAirports(prev => [...prev, { id: crypto.randomUUID(), from: null, to: null }]);
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

  // Auto-calculate distance when international destination is selected
  useEffect(() => {
    Object.entries(intlDestICAO).forEach(([idxStr, intlICAO]) => {
      const idx = Number(idxStr);
      if (!intlICAO) return;
      const intlAp = INTL_AIRPORTS.find(a => a.icao === intlICAO);
      if (!intlAp) return;
      const fromAp = legAirports[idx]?.from;
      if (fromAp?.lat == null || fromAp?.lon == null) return;
      const nm = Math.round(calcDistanceNm(fromAp.lat, fromAp.lon, intlAp.lat, intlAp.lon));
      if (nm > 0) setLegDistance(idx, nm);
    });
  }, [intlDestICAO, legAirports, setLegDistance]);

  // ─── Calculate ────────────────────────────────────────────────────────────
  function handleCalculate() {
    // Build per-leg overnight array for the engine
    const ovEntries: LegOvernight[] = Object.entries(legOvernights)
      .map(([idxStr, ov]) => ({
        legIdx: Number(idxStr),
        nights: ov.nights === "" ? 0 : (ov.nights as number),
        ratePerPersonAUD: ov.hotel?.approxRateAUD ?? 180,
        hotelName: ov.hotel?.name,
        locationLabel: undefined,
      }))
      .filter(ov => ov.nights > 0);

    const input: QuoteInput = {
      aircraftType,
      legs,
      crew: { ...crew, count: crewCount },
      marginPercent,
      accommodationNights: 0, // unused when legOvernights supplied
      legOvernights: ovEntries.length > 0 ? ovEntries : undefined,
      includeReturnLeg,
    };
    // Sum all international charges across all legs (AUD dollars — converted to cents inside engine)
    let totalIntlAUD = 0;
    for (let li = 0; li < legs.length; li++) {
      const destICAO = intlDestICAO[li] || legs[li].toICAO || "";
      const ap = INTL_AIRPORTS.find(a => a.icao === destICAO);
      if (ap && (aircraftType === "CL60" || aircraftType === "PC12")) {
        const pkHrs = intlParkingHrs[li] ?? 2;
        const pax   = intlPaxCount[li] ?? 2;
        const nights = intlCrewNights[li] ?? 0;
        const overflights = intlOverflights[li] ?? [];
        const charges = calculateIntlCharges(destICAO, pkHrs, pax, nights, crewCount, overflights);
        if (charges) totalIntlAUD += charges.totalAUD;
      }
    }
    try {
      const result = calculateQuote({ ...input, intlChargesAUD: totalIntlAUD });
      setBreakdown(result);
    } catch (e) {
      console.error("calculateQuote failed:", e);
      alert("Quote calculation failed — check console for details.");
    }
  }

  function handleStartNew() {
    setClientName(""); setClientContact(""); setPurpose("medevac_charter");
    setDepartureDate(todayISO()); setAircraftType("B200"); setLegs([emptyLeg()]);
    setLegAirports([{ id: crypto.randomUUID(), from: null, to: null }]);
    setIncludeReturnLeg(false);
    setCrew({ captain: true, firstOfficer: false, flightNurse: false, flightParamedic: false, icuDoctor: false, count: 1, captainName: '', firstOfficerName: '' });
    setLegOvernights({}); setMarginPercent(15); setNotes("");
    setBreakdown(null);
    setViewingQuote(null);
  }

  function handleSaveQuote() {
    if (!breakdown) return;
    const quoteNumber = nextNumberData?.quoteNumber || "CQ-2026-0001";
    // Build intlLegs for persistence
    const intlLegsForSave: Array<{legIdx:number;destICAO:string;destName:string;destCountry:string;landingAUD:number;parkingAUD:number;handlingAUD:number;facilityAUD:number;overnightAUD:number;overflightAUD:number;totalAUD:number}> = [];
    if (aircraftType === "CL60" || aircraftType === "PC12") {
      for (let li = 0; li < legs.length; li++) {
        const destICAO = intlDestICAO[li] || legs[li].toICAO || "";
        const ap = INTL_AIRPORTS.find(a => a.icao === destICAO);
        if (ap) {
          const pkHrs = intlParkingHrs[li] ?? 2;
          const pax   = intlPaxCount[li] ?? 2;
          const nights = intlCrewNights[li] ?? 0;
          const overflights = intlOverflights[li] ?? [];
          const charges = calculateIntlCharges(destICAO, pkHrs, pax, nights, crewCount, overflights);
          if (charges) intlLegsForSave.push({ legIdx: li, destICAO: ap.icao, destName: ap.name, destCountry: ap.country,
            landingAUD: charges.landingFeeAUD, parkingAUD: charges.parkingFeeAUD, handlingAUD: charges.handlingFeeAUD,
            facilityAUD: charges.facilityChargeAUD, overnightAUD: charges.overnightAUD, overflightAUD: charges.overflightFeesAUD,
            totalAUD: charges.totalAUD, customsNote: ap.customsNote || "" });
        }
      }
    }
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
      autoInvoice: autoInvoice ? 1 : 0,
      legOvernights: JSON.stringify(legOvernights),
      intlLegs: intlLegsForSave.length > 0 ? JSON.stringify(intlLegsForSave) : null,
    });
  }

  function handleExportPDF() {
    if (!breakdown) return;
    const quoteNumber = nextNumberData?.quoteNumber || "CQ-2026-0001";
    // Build per-leg international charges detail for the PDF table
    const intlLegsData: Array<{legIdx:number;destICAO:string;destName:string;destCountry:string;landingAUD:number;parkingAUD:number;handlingAUD:number;facilityAUD:number;overnightAUD:number;overflightAUD:number;totalAUD:number}> = [];
    if (aircraftType === "CL60" || aircraftType === "PC12") {
      for (let li = 0; li < legs.length; li++) {
        const destICAO = intlDestICAO[li] || legs[li].toICAO || "";
        const ap = INTL_AIRPORTS.find(a => a.icao === destICAO);
        if (ap) {
          const pkHrs = intlParkingHrs[li] ?? 2;
          const pax   = intlPaxCount[li] ?? 2;
          const nights = intlCrewNights[li] ?? 0;
          const overflights = intlOverflights[li] ?? [];
          const charges = calculateIntlCharges(destICAO, pkHrs, pax, nights, crewCount, overflights);
          if (charges) intlLegsData.push({
            legIdx: li,
            destICAO: ap.icao,
            destName: ap.name,
            destCountry: ap.country,
            landingAUD: charges.landingFeeAUD,
            parkingAUD: charges.parkingFeeAUD,
            handlingAUD: charges.handlingFeeAUD,
            facilityAUD: charges.facilityChargeAUD,
            overnightAUD: charges.overnightAUD,
            overflightAUD: charges.overflightFeesAUD,
            totalAUD: charges.totalAUD,
            customsNote: ap.customsNote || "",
          });
        }
      }
    }
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
      legOvernights,
      intlLegs: intlLegsData.length > 0 ? intlLegsData : undefined,
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
      // Scroll the page container into view (works inside iframe; window.scrollTo doesn't)
      setTimeout(() => {
        pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (e) {
      console.error("Failed to parse quote", e);
    }
  }

  function exportSavedQuotePDF(q: CharterQuoteRecord) {
    try {
      const parsedLegs: LegInput[] = JSON.parse(q.legs);
      const parsedCrew: CrewConfig = JSON.parse(q.crew);
      const parsedCosts: QuoteCostBreakdown = JSON.parse(q.costs);
      let parsedLegOvernights: Record<number, { nights: number | ""; hotel: AccomProperty | null; search: string }> | undefined;
      try { parsedLegOvernights = (q as any).legOvernights ? JSON.parse((q as any).legOvernights) : undefined; } catch (_) {}
      // Reconstruct intlLegs from saved costs if available
      let parsedIntlLegs: Array<{legIdx:number;destICAO:string;destName:string;destCountry:string;landingAUD:number;parkingAUD:number;handlingAUD:number;facilityAUD:number;overnightAUD:number;overflightAUD:number;totalAUD:number}> | undefined;
      try {
        const savedIntlLegs = (q as any).intlLegs ? JSON.parse((q as any).intlLegs) : undefined;
        if (savedIntlLegs) parsedIntlLegs = savedIntlLegs;
      } catch (_) {}
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
        legOvernights: parsedLegOvernights,
        intlLegs: parsedIntlLegs,
      }, parsedCosts);
    } catch (e) {
      console.error("Failed to export PDF", e);
    }
  }

  const routeSummary = legs.filter(l => l.fromICAO && l.toICAO)
    .map(l => `${l.fromICAO}→${l.toICAO}`).join(", ");

  // FDP warning only applies within a single continuous duty period.
  // When the return sector is ticked it is for costing only — crew overnight at destination,
  // so outbound and return are separate duty days and no combined FDP warning is raised.
  const fdpWarningLevel = breakdown && !includeReturnLeg
    ? breakdown.totalFdpHours > 14 ? "red" : breakdown.totalFdpHours > 12 ? "yellow" : null
    : null;

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto" ref={pageTopRef}>
      <div className="flex items-center gap-2 mb-1">
        <Calculator size={20} style={{ color: TEAL }} />
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Charter Quick Quote</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Instantly quote a charter flight from scratch — Operations &amp; Dispatch
      </p>

      {/* Viewing banner — shown when a saved quote is loaded */}
      {viewingQuote && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl border text-sm"
          style={{ backgroundColor: `${TEAL}18`, borderColor: `${TEAL}40` }}>
          <span style={{ color: TEAL }} className="font-semibold">
            Viewing saved quote: <span className="font-bold">{viewingQuote.quoteNumber}</span>
            {viewingQuote.clientName ? <span className="text-muted-foreground font-normal"> — {viewingQuote.clientName}</span> : null}
          </span>
          <button onClick={() => { setViewingQuote(null); setBreakdown(null); }}
            className="text-xs text-muted-foreground hover:text-foreground ml-4 flex items-center gap-1">
            <X size={13} /> Clear
          </button>
        </div>
      )}

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
                          {key === "PC12" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">DIRT OK</span>}
                          {key === "PC12" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400">CLINIC</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Part 121 compliance warning for Challenger */}
              {AIRCRAFT[aircraftType]?.part121 && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">CASA Part 121 — Large Aircraft AOC Required</div>
                    <div className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                      The Challenger 604/605 (MTOW &gt;8,618 kg) operates under <strong>CASA Part 121</strong>, not Part 135.
                      Confirm your AOC, crew type ratings, MEL, and maintenance release are compliant with Part 121 requirements before dispatch.
                      Flight and duty limits under <strong>CAO 48.1 Schedule 1 (Large)</strong> apply.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PC12 clinic-only advisory */}
            {aircraftType === "PC12" && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/8 px-3 py-2.5">
                <Plane size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-green-300">PC-12 — Clinic Runs · Dubbo · Broken Hill · Bankstown</div>
                  <div className="text-[11px] text-green-200/80 mt-0.5 leading-relaxed">
                    The Pilatus PC-12/47E is approved for <strong>clinic day-runs</strong> out of Dubbo (YSDU), Broken Hill (YBHI) and Bankstown (YSBK).
                    Single-engine turboprop — <strong>dirt and gravel strips certified</strong> (min 2,650 ft / 808 m). Single-pilot IFR rated under CASA Part 135.
                    Engine: PT6A-67P · 1,200 SHP · Fuel: Jet-A1 · Max cruise 285 KTAS · Ceiling FL300.
                  </div>
                </div>
              </div>
            )}

            {/* PC12 pilot selector */}
            {aircraftType === "PC12" && (
              <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-green-400">PC-12 Pilot (Single-Pilot IFR)</div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Assigned Captain</label>
                  <select
                    value={crew.captainName || ""}
                    onChange={e => setCrew(c => ({ ...c, captainName: e.target.value }))}
                    className="w-full text-xs bg-card border border-green-500/30 rounded px-2 py-1.5 focus:outline-none focus:border-green-400/50"
                  >
                    <option value="">— Select Captain —</option>
                    {PC12_CAPTAINS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
                <div key={legAirports[idx]?.id ?? idx} className="border border-card-border rounded-lg p-3 relative">
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
                    {/* International arrival selector — inline under the To (arrival) field */}
                    {(aircraftType === "CL60" || aircraftType === "PC12") && (() => {
                      const destICAO = intlDestICAO[idx] || leg.toICAO || "";
                      // PC12 range: Pacific/NZ airports only — filter by ICAO prefix
                      const PC12_ICAO_PREFIXES = ["NZ","NF","NW","NV","AG","AY","NS","NT"];
                      const filteredAirports = aircraftType === "PC12"
                        ? INTL_AIRPORTS.filter(a => PC12_ICAO_PREFIXES.some(p => a.icao.startsWith(p)))
                        : INTL_AIRPORTS;
                      return (
                        <div className="mt-1.5 pl-[calc(50%+4px)]">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Globe size={10} className="text-indigo-400" />
                            <label className="text-[10px] text-indigo-400 font-semibold">International Arrival</label>
                            {aircraftType === "PC12" && <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">Pacific / NZ</span>}
                          </div>
                          <IntlAirportSearch
                            value={destICAO}
                            onChange={icao => {
                              setIntlDestICAO(prev => ({ ...prev, [idx]: icao }));
                              // Keep leg.toICAO in sync so route summary and calculations work
                              const apInfo = INTL_AIRPORTS.find(a => a.icao === icao);
                              updateLeg(idx, {
                                toICAO: icao || '',
                                toName: apInfo ? `${apInfo.city} (${apInfo.country})` : icao,
                              });
                            }}
                            airports={filteredAirports}
                            placeholder="City, ICAO or country…"
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Distance (auto-filled or manual override) + departure time */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">
                        Distance (nm)
                        {leg.distanceNm > 0 && legAirports[idx]?.from?.lat && (
                          (legAirports[idx]?.to?.lat || intlDestICAO[idx]) && (
                            <span className="ml-1 text-[#4F98A3]">· auto</span>
                          )
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

                  {/* ── International Airport Panel (CL60 + PC12) ──────── */}
                  {(aircraftType === "CL60" || aircraftType === "PC12") && (() => {
                    const destICAO = intlDestICAO[idx] || leg.toICAO || "";
                    const parkingHrs = intlParkingHrs[idx] ?? 2;
                    const paxCount = intlPaxCount[idx] ?? 2;
                    const crewNights = intlCrewNights[idx] ?? 0;
                    const overflights = intlOverflights[idx] ?? [];
                    const charges = destICAO ? calculateIntlCharges(destICAO, parkingHrs, paxCount, crewNights, crewCount, overflights) : null;
                    const apInfo = charges?.airport ?? INTL_AIRPORTS.find(a => a.icao === destICAO);

                    return (
                      <div className="mt-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg space-y-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Globe size={11} /> International Airport Charges — Leg {idx + 1}
                          {aircraftType === "PC12" && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">PC-12 · Pacific / NZ within range</span>}
                        </div>

                        {apInfo && (
                          <>
                            {/* Airport info row */}
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="p-2 bg-card rounded border border-card-border">
                                <div className="text-muted-foreground mb-0.5">Country / Currency</div>
                                <div className="font-semibold text-foreground">{apInfo.country} · {apInfo.currency}</div>
                              </div>
                              <div className="p-2 bg-card rounded border border-card-border">
                                <div className="text-muted-foreground mb-0.5">Timezone</div>
                                <div className="font-semibold text-foreground">{apInfo.timezone}</div>
                              </div>
                              {apInfo.fuelAvailable && apInfo.jetFuelPriceApproxAUD && (
                                <div className="p-2 bg-card rounded border border-card-border">
                                  <div className="text-muted-foreground mb-0.5">Jet-A1 (approx)</div>
                                  <div className="font-semibold text-cyan-400">${apInfo.jetFuelPriceApproxAUD.toFixed(2)}/L AUD</div>
                                </div>
                              )}
                              <div className="p-2 bg-card rounded border border-card-border">
                                <div className="text-muted-foreground mb-0.5">Fuel Available</div>
                                <div className={`font-semibold ${apInfo.fuelAvailable ? 'text-green-400' : 'text-red-400'}`}>{apInfo.fuelAvailable ? 'Yes — Jet-A1' : 'No'}</div>
                              </div>
                            </div>

                            {/* Customs note */}
                            <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded text-[10px] text-amber-300 flex gap-1.5">
                              <Info size={11} className="flex-shrink-0 mt-0.5" />
                              <span>{apInfo.customsNote}</span>
                            </div>

                            {/* Charge inputs */}
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-muted-foreground block mb-1">Parking (hrs)</label>
                                <input type="number" min={0} step={0.5} value={parkingHrs}
                                  onChange={e => setIntlParkingHrs(prev => ({ ...prev, [idx]: parseFloat(e.target.value) || 0 }))}
                                  className="w-full text-xs bg-card border border-card-border rounded px-2 py-1 focus:outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground block mb-1">Pax count</label>
                                <input type="number" min={0} value={paxCount}
                                  onChange={e => setIntlPaxCount(prev => ({ ...prev, [idx]: parseInt(e.target.value) || 0 }))}
                                  className="w-full text-xs bg-card border border-card-border rounded px-2 py-1 focus:outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground block mb-1">Crew nights</label>
                                <input type="number" min={0} value={crewNights}
                                  onChange={e => setIntlCrewNights(prev => ({ ...prev, [idx]: parseInt(e.target.value) || 0 }))}
                                  className="w-full text-xs bg-card border border-card-border rounded px-2 py-1 focus:outline-none" />
                              </div>
                            </div>

                            {/* Overflight selector */}
                            <div>
                              <label className="text-[10px] text-muted-foreground block mb-1">Overflight countries (select all that apply)</label>
                              <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1">
                                {Object.entries(INTL_OVERFLIGHT_FEES)
                              .filter(([cc]) => aircraftType !== "PC12" || ["NC","WS","NZ","VU","SB","FJ","PG","TO","PF"].includes(cc))
                              .map(([cc, info]) => (
                                  <label key={cc} className="flex items-start gap-1.5 text-[10px] cursor-pointer p-1.5 rounded hover:bg-card">
                                    <input type="checkbox"
                                      checked={overflights.includes(cc)}
                                      onChange={e => {
                                        const next = e.target.checked
                                          ? [...overflights, cc]
                                          : overflights.filter(x => x !== cc);
                                        setIntlOverflights(prev => ({ ...prev, [idx]: next }));
                                      }}
                                      className="mt-0.5 flex-shrink-0"
                                    />
                                    <span><span className="font-semibold text-foreground">{info.country}</span><br /><span className="text-muted-foreground">${(info.feeUSD * USD_TO_AUD).toFixed(0)} AUD</span></span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Charges breakdown */}
                            {charges && (
                              <div className="border-t border-indigo-500/15 pt-2 space-y-1">
                                <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Estimated International Charges</div>
                                {[
                                  { label: `Landing fee (${apInfo.icao})`, val: charges.landingFeeAUD },
                                  { label: `Parking (${parkingHrs} hrs)`, val: charges.parkingFeeAUD },
                                  { label: "Ground handling / agent", val: charges.handlingFeeAUD },
                                  { label: `Facility charges (${paxCount} pax)`, val: charges.facilityChargeAUD },
                                  ...(charges.overflightFeesAUD > 0 ? [{ label: "Overflight permits", val: charges.overflightFeesAUD }] : []),
                                  ...(charges.overnightAUD > 0 ? [{ label: `Crew accommodation (${crewNights}n × ${crewCount} crew)`, val: charges.overnightAUD }] : []),
                                ].map(row => (
                                  <div key={row.label} className="flex justify-between text-[10px]">
                                    <span className="text-muted-foreground">{row.label}</span>
                                    <span className="font-semibold text-foreground">${row.val.toFixed(0)} AUD</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-[10px] pt-1 border-t border-indigo-500/15 mt-1">
                                  <span className="font-bold text-indigo-300">Total intl charges (this leg)</span>
                                  <span className="font-bold text-indigo-300">${charges.totalAUD.toFixed(0)} AUD</span>
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-1">USD rates converted at 1 USD = {USD_TO_AUD} AUD · Approximate only — confirm with handling agent</div>
                              </div>
                            )}

                            {/* ── Intl Crew Accommodation ────────────────────────── */}
                            {(() => {
                              const intlICAO = intlDestICAO[idx];
                              const intlAccom = intlICAO ? getAccomForICAO(intlICAO) : null;
                              const intlOv = getLegOvernight(idx);
                              const intlNights = typeof intlOv.nights === 'number' ? intlOv.nights : 0;
                              const intlHasNights = intlNights > 0;
                              const allIntlHotels = [
                                ...(intlAccom?.ctFourPlus ?? []),
                                ...(intlAccom?.ctBelow4 ?? []),
                                ...(intlAccom?.extended ?? []),
                              ];
                              const intlSearchLc = intlOv.search.toLowerCase();
                              const intlShown = intlSearchLc
                                ? allIntlHotels.filter(h =>
                                    h.name.toLowerCase().includes(intlSearchLc) ||
                                    h.chain.toLowerCase().includes(intlSearchLc)
                                  )
                                : allIntlHotels;

                              if (!intlICAO) return null;

                              return (
                                <div className="mt-3 border-t border-indigo-500/15 pt-3">
                                  <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Hotel size={10} />
                                    Crew Accommodation — {intlICAO}
                                  </div>

                                  {/* Nights selector */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <label className="text-[10px] text-muted-foreground">Nights at destination</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={intlOv.nights}
                                      onChange={e => {
                                        const raw = e.target.value;
                                        if (raw === "") { setLegNights(idx, ""); }
                                        else { const n = parseInt(raw, 10); setLegNights(idx, isNaN(n) ? 0 : Math.max(0, n)); }
                                      }}
                                      onBlur={() => { if (intlOv.nights === "") setLegNights(idx, 0); }}
                                      onMouseDown={e => e.stopPropagation()}
                                      className="w-14 text-xs text-center bg-background border border-indigo-500/30 rounded px-2 py-1 focus:outline-none"
                                    />
                                  </div>

                                  {intlHasNights && (
                                    <>
                                      {/* Selected hotel summary */}
                                      {intlOv.hotel && (
                                        <div className="mb-2 flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2.5 py-2">
                                          <Hotel size={11} className="mt-0.5 shrink-0 text-indigo-400" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-semibold truncate">{intlOv.hotel.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{intlOv.hotel.chain} · <StarRating stars={intlOv.hotel.stars} /> · ${intlOv.hotel.approxRateAUD}/room/nt</div>
                                            <div className="text-[10px] mt-0.5 font-semibold text-indigo-300">
                                              {crewCount} room{crewCount !== 1 ? 's' : ''} × {intlNights} night{intlNights !== 1 ? 's' : ''} = ~${intlOv.hotel.approxRateAUD * crewCount * intlNights} AUD
                                            </div>
                                            <div className="text-[10px] mt-0.5">
                                              <span className="text-muted-foreground">{intlOv.hotel.phone}</span>
                                              {" · "}
                                              <a href={intlOv.hotel.bookingUrl} target="_blank" rel="noreferrer"
                                                className="underline text-indigo-400">Book</a>
                                            </div>
                                          </div>
                                          <button onClick={() => setLegHotel(idx, null)} className="text-muted-foreground hover:text-white shrink-0">
                                            <X size={11} />
                                          </button>
                                        </div>
                                      )}

                                      {/* Hotel list or fallback */}
                                      {allIntlHotels.length === 0 ? (
                                        <div className="text-[11px] text-muted-foreground text-center py-3 space-y-2">
                                          <p>No pre-loaded hotels for <strong>{intlICAO}</strong>.</p>
                                          <a
                                            href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(intlICAO)}&nflt=class%3D4%3Bclass%3D5`}
                                            target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] underline text-indigo-400">
                                            Search 4★+ on Booking.com →
                                          </a>
                                        </div>
                                      ) : (
                                        <>
                                          <input
                                            type="text"
                                            value={intlOv.search}
                                            onChange={e => setLegSearch(idx, e.target.value)}
                                            onMouseDown={e => e.stopPropagation()}
                                            placeholder="Search hotels or chains..."
                                            className="w-full text-xs bg-background border border-indigo-500/20 rounded px-2 py-1 focus:outline-none mb-2"
                                          />
                                          <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                                            {intlShown.map(hotel => (
                                              <button
                                                key={hotel.name}
                                                type="button"
                                                onClick={() => setLegHotel(idx, hotel.name === intlOv.hotel?.name ? null : hotel)}
                                                className={`w-full text-left rounded-lg px-2.5 py-2 border transition-colors ${
                                                  intlOv.hotel?.name === hotel.name
                                                    ? "border-indigo-500/50 bg-indigo-500/10"
                                                    : "border-card-border hover:border-white/20 bg-background/60"
                                                }`}
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="text-[11px] font-medium truncate">{hotel.name}</span>
                                                  <span className="text-[11px] font-semibold shrink-0 text-indigo-300">${hotel.approxRateAUD}/rm/nt</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  <span className="text-[10px] text-muted-foreground">{hotel.chain}</span>
                                                  <StarRating stars={hotel.stars} />
                                                  <a href={hotel.bookingUrl} target="_blank" rel="noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="text-[10px] underline ml-auto shrink-0 text-indigo-400">Book →</a>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                          <p className="text-[9px] text-muted-foreground opacity-60 mt-1">Indicative rates — confirm with Corporate Traveller / booking agent.</p>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    );
                  })()}
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

            {/* CL60 — named Part 121 crew selectors */}
            {aircraftType === "CL60" && (
              <div className="mb-4 space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                  Part 121 Type-Rated Crew
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Captain</label>
                  <select
                    value={crew.captainName ?? ''}
                    onChange={e => setCrew(c => ({ ...c, captainName: e.target.value }))}
                    className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400/40"
                  >
                    <option value="">— Select Captain —</option>
                    {CL60_CAPTAINS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">First Officer</label>
                  <select
                    value={crew.firstOfficerName ?? ''}
                    onChange={e => setCrew(c => ({ ...c, firstOfficerName: e.target.value, firstOfficer: !!e.target.value }))}
                    className="w-full bg-card border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400/40"
                  >
                    <option value="">— Select First Officer —</option>
                    {CL60_FIRST_OFFICERS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-card-border pt-2 mt-1" />
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm opacity-60">
                <input type="checkbox" checked disabled />
                Captain {aircraftType === "CL60" && crew.captainName ? (
                  <span className="text-indigo-300 font-medium">— {crew.captainName}</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">(always required)</span>
                )}
              </label>
              <label className={`flex items-center gap-2 text-sm ${aircraftType === "CL60" ? "opacity-60" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={crew.firstOfficer}
                  disabled={aircraftType === "CL60"}
                  onChange={e => setCrew(c => ({ ...c, firstOfficer: e.target.checked }))}
                />
                First Officer {aircraftType === "CL60" && crew.firstOfficerName ? (
                  <span className="text-indigo-300 font-medium">— {crew.firstOfficerName}</span>
                ) : null}
                {aircraftType === "CL60" && <span className="text-[10px] text-muted-foreground">(select above)</span>}
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
              {/* FDP advisory */}
              {breakdown?.accommodationRequired && (
                <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                  <AlertTriangle size={11} />
                  FDP exceeds 12hrs — accommodation likely required
                </div>
              )}

              {/* Per-leg overnight selector */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">Overnight Stays — select which sector(s) require accommodation</label>
                {legs.map((leg, idx) => {
                  const destLabel = leg.toName || leg.toICAO || `Leg ${idx + 1} destination`;
                  const destICAO = leg.toICAO;
                  const ov = getLegOvernight(idx);
                  const nights = ov.nights;
                  const hasNights = typeof nights === 'number' ? nights > 0 : false;

                  // Pull hotels ONLY for this leg's destination
                  const accom = destICAO ? getAccomForICAO(destICAO) : null;
                  const searchLc = ov.search.toLowerCase();

                  function filterHotels(hotels: AccomProperty[]) {
                    if (!searchLc) return hotels;
                    return hotels.filter(h =>
                      h.name.toLowerCase().includes(searchLc) ||
                      h.chain.toLowerCase().includes(searchLc)
                    );
                  }

                  const shownCtFourPlus = accom ? filterHotels(accom.ctFourPlus) : [];
                  const shownExtended = accom ? filterHotels(accom.extended) : [];
                  // Only show below-4★ CT if no 4★+ exist and no extended options exist
                  const shownCtBelow4 = (accom && accom.ctFourPlus.length === 0 && accom.extended.length === 0)
                    ? filterHotels(accom.ctBelow4)
                    : [];
                  const totalShown = shownCtFourPlus.length + shownExtended.length + shownCtBelow4.length;
                  const noMatch = !accom || (!accom.hasCtMatch && accom.extended.length === 0);
                  // Label for extended section — "Best Available" when no 4★+ exist in that location
                  const allExtendedAreBelow4 = accom ? accom.extended.every(h => h.stars < 4) : false;
                  const extendedSectionLabel = (shownCtFourPlus.length === 0 && allExtendedAreBelow4)
                    ? "Best Available Options"
                    : "Other 4★+ Options";

                  function HotelButton({ hotel }: { hotel: AccomProperty }) {
                    return (
                      <button
                        key={hotel.name}
                        type="button"
                        onClick={() => setLegHotel(idx, hotel.name === ov.hotel?.name ? null : hotel)}
                        className={`w-full text-left rounded-lg px-2.5 py-2 border transition-colors ${
                          ov.hotel?.name === hotel.name
                            ? "border-teal-500/50 bg-teal-500/10"
                            : "border-card-border hover:border-white/20 bg-background/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium truncate">{hotel.name}</span>
                          <span className="text-[11px] font-semibold shrink-0" style={{ color: TEAL }}>${hotel.approxRateAUD}/room/nt</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{hotel.chain}</span>
                          <StarRating stars={hotel.stars} />
                          <a href={hotel.bookingUrl} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[10px] underline ml-auto shrink-0"
                            style={{ color: TEAL }}>Book →</a>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <div key={idx} className="border border-card-border rounded-xl p-3 bg-background/40">
                      {/* Leg header + nights spinner */}
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={11} className="shrink-0" style={{ color: TEAL }} />
                        <span className="text-[11px] font-semibold flex-1 truncate">
                          After Leg {idx + 1}{destICAO ? ` — ${destICAO}` : ''}
                          {destLabel && destLabel !== destICAO ? <span className="text-muted-foreground font-normal"> ({destLabel})</span> : null}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[10px] text-muted-foreground">Nights</label>
                          <input
                            type="number"
                            min={0}
                            value={ov.nights}
                            onChange={e => {
                              const raw = e.target.value;
                              if (raw === "" || raw === "-") { setLegNights(idx, ""); }
                              else { const n = parseInt(raw, 10); setLegNights(idx, isNaN(n) ? 0 : Math.max(0, n)); }
                            }}
                            onBlur={() => { if (ov.nights === "") setLegNights(idx, 0); }}
                            onMouseDown={e => e.stopPropagation()}
                            className="w-14 text-xs text-center bg-background border border-card-border rounded px-2 py-1 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Hotel picker — shown only when nights > 0 */}
                      {hasNights && (
                        <div>
                          {/* Selected hotel summary */}
                          {ov.hotel && (
                            <div className="mb-2 flex items-start gap-2 bg-teal-500/10 border border-teal-500/30 rounded-lg px-2.5 py-2">
                              <Hotel size={11} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold truncate">{ov.hotel.name}</div>
                                <div className="text-[10px] text-muted-foreground">{ov.hotel.chain} · <StarRating stars={ov.hotel.stars} /> · ${ov.hotel.approxRateAUD}/room/nt</div>
                                <div className="text-[10px] mt-0.5 font-semibold" style={{ color: TEAL }}>
                                  {crewCount} room{crewCount !== 1 ? 's' : ''} × {typeof ov.nights === 'number' && ov.nights > 0 ? ov.nights : 1} night{(typeof ov.nights === 'number' && ov.nights > 0 ? ov.nights : 1) !== 1 ? 's' : ''} = ~${ov.hotel.approxRateAUD * crewCount * (typeof ov.nights === 'number' && ov.nights > 0 ? ov.nights : 1)} AUD
                                </div>
                                <div className="text-[10px] mt-0.5">
                                  <span className="text-muted-foreground">{ov.hotel.phone}</span>
                                  {" · "}
                                  <a href={ov.hotel.bookingUrl} target="_blank" rel="noreferrer"
                                    className="underline" style={{ color: TEAL }}>Book</a>
                                </div>
                              </div>
                              <button onClick={() => setLegHotel(idx, null)} className="text-muted-foreground hover:text-white shrink-0">
                                <X size={11} />
                              </button>
                            </div>
                          )}

                          {/* No match at all — show Booking.com link */}
                          {noMatch ? (
                            <div className="text-[11px] text-muted-foreground text-center py-3 space-y-2">
                              <p>No pre-loaded accommodation for <strong>{destICAO}</strong>.</p>
                              <a
                                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(leg.toName || destICAO || '')}&nflt=class%3D4%3Bclass%3D5`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] underline"
                                style={{ color: TEAL }}
                              >
                                Search 4★+ on Booking.com →
                              </a>
                            </div>
                          ) : (
                            <>
                              {/* Search */}
                              <input
                                type="text"
                                value={ov.search}
                                onChange={e => setLegSearch(idx, e.target.value)}
                                onMouseDown={e => e.stopPropagation()}
                                placeholder="Search hotels or chains..."
                                className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none mb-2"
                              />

                              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                                {/* Corporate Traveller 4★+ block */}
                                {shownCtFourPlus.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                                        Corporate Traveller — 4★+
                                      </span>
                                      <a href="https://www.corporatetraveller.com.au" target="_blank" rel="noreferrer"
                                        className="text-[9px] underline opacity-50 hover:opacity-100">CT ↗</a>
                                    </div>
                                    <div className="space-y-1">
                                      {shownCtFourPlus.map(h => <HotelButton key={h.name} hotel={h} />)}
                                    </div>
                                  </div>
                                )}

                                {/* Extended 4★+ block */}
                                {shownExtended.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                      {extendedSectionLabel}
                                    </div>
                                    <div className="space-y-1">
                                      {shownExtended.map(h => <HotelButton key={h.name} hotel={h} />)}
                                    </div>
                                  </div>
                                )}

                                {/* Below-4★ CT fallback (only when no 4★+ exist at all) */}
                                {shownCtBelow4.length > 0 && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                      Corporate Traveller — 3★ &amp; Below
                                    </div>
                                    <div className="space-y-1">
                                      {shownCtBelow4.map(h => <HotelButton key={h.name} hotel={h} />)}
                                    </div>
                                  </div>
                                )}

                                {totalShown === 0 && (
                                  <p className="text-[11px] text-muted-foreground text-center py-2">No results — try a different search</p>
                                )}
                              </div>

                              {/* Booking.com fallback link */}
                              <div className="mt-2 pt-2 border-t border-card-border/50 flex items-center justify-between">
                                <p className="text-[9px] text-muted-foreground opacity-60">Indicative rates via Corporate Traveller preferred partners.</p>
                                <a
                                  href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(leg.toName || destICAO || '')}&nflt=class%3D4%3Bclass%3D5`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] underline shrink-0 ml-2"
                                  style={{ color: TEAL }}
                                >More on Booking.com →</a>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                  {/* end legs.map */}
              </div>
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

              {/* ── Crew Rest Calculator — per sector ─────────────────────── */}
              {breakdown.legs.length > 0 && (() => {
                const isMedivacFlight = purpose === "medevac_charter" || purpose.startsWith("clinic_");
                const isMultiCrew = crew.firstOfficer || crew.flightNurse || crew.flightParamedic || crew.icuDoctor;
                // For each leg, show a rest calculator at destination (except the last leg — no onward rest needed unless return sector)
                const legsToShow = includeReturnLeg ? breakdown.legs : breakdown.legs.slice(0, -1);
                if (legsToShow.length === 0) return null;
                return (
                  <div className="mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Clock size={11} />
                      Crew Rest &amp; Curfew
                    </div>
                    {legsToShow.map((lb, i) => (
                      <div key={i} className="mb-2">
                        <div className="text-[9px] text-muted-foreground font-medium mb-1">
                          After Sector {i + 1}: {lb.leg.fromICAO} → {lb.leg.toICAO}
                          <span className="ml-2 text-foreground/50">
                            (arrives {lb.arrivalTime} local · {lb.flightHours.toFixed(1)} hrs flight)
                          </span>
                        </div>
                        <RestCalculator
                          arrivalTime={lb.arrivalTime}
                          departureICAO={lb.leg.toICAO}
                          isMedivac={isMedivacFlight}
                          crewType={isMultiCrew ? "multi" : "single"}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}

              <CostLineGroup title="Aircraft Costs">
                <CostLine label={`Aircraft Flight Cost (${fmtCents(AIRCRAFT[aircraftType].hourlyRate)}/hr)`} value={breakdown.aircraftCost}
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
                {breakdown.subtotals.intlCharges > 0 && (
                  <CostLine label="Intl airport + overflight charges" value={breakdown.subtotals.intlCharges}
                    detail={`Landing, parking, handling, facility, overflight fees — converted AUD`}
                    expandKey="intl" expanded={expandedLine} onToggle={setExpandedLine} />
                )}
                <CostLine label="Ground transport" value={breakdown.subtotals.groundTransport} expandKey="ground" expanded={expandedLine} onToggle={setExpandedLine} />
                <CostLine
                  label={(() => {
                    const totalNights = Object.values(legOvernights).reduce((sum, ov) => sum + (typeof ov.nights === 'number' ? ov.nights : 0), 0);
                    const hotelsSelected = Object.values(legOvernights).filter(ov => ov.hotel).length;
                    return `Accommodation — ${crewCount} room${crewCount !== 1 ? 's' : ''} × ${totalNights} night${totalNights !== 1 ? 's' : ''}${hotelsSelected > 0 ? ` (${hotelsSelected} hotel${hotelsSelected !== 1 ? 's' : ''})` : ''}`;
                  })()}
                  value={breakdown.subtotals.accommodation}
                  expandKey="accom"
                  expanded={expandedLine}
                  onToggle={setExpandedLine}
                />
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
                <label className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border border-card-border cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoInvoice}
                    onChange={(e) => setAutoInvoice(e.target.checked)}
                    className="accent-current"
                    style={{ accentColor: TEAL }}
                  />
                  Auto-invoice on acceptance
                </label>
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
