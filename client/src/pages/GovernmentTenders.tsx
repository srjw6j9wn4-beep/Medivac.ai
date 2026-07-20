import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, AlertCircle, Clock, Eye, TrendingUp, Calendar, CheckSquare, FileText, Globe, Flag, ChevronDown, ChevronUp, XCircle, Plus, Trash2, X, PenSquare, Building2, Target } from "lucide-react";

interface TenderPortal {
  service: string;
  url: string;
  href: string;
  notes: string;
  region: string;
}

interface LiveOpportunity {
  ref: string;
  title: string;
  agency: string;
  closes: string;
  urgent: boolean;
  type: string;
  scope: string;
  fit: "VERY HIGH" | "HIGH" | "MEDIUM";
  action: string;
  contact?: string;
  region: string;
  portalUrl?: string;
  portalName?: string;
}

interface PipelineItem {
  opportunity: string;
  agency: string;
  est_date: string;
  value: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW-MED";
  region: string;
  notes?: string;
  portalUrl?: string;
  portalName?: string;
}


interface ClosedTender {
  ref: string;
  title: string;
  agency: string;
  closed: string;
  awarded_to?: string;
  contract_value?: string;
  type: string;
  scope: string;
  region: string;
  fit: "VERY HIGH" | "HIGH" | "MEDIUM";
  missed_reason: string;
  lesson: string;
  bid_submitted?: boolean;
  our_outcome?: string;
  notes?: string;
  portalUrl?: string;
  portalName?: string;
  winnerAnalysis?: {
    likely_reasons: string[];
    strengths: string;
    price_positioning?: string;
    tech_differentiators?: string;
    compliance_advantage?: string;
    incumbent_advantage?: string;
  };
}


interface ManualTender {
  id: number;
  ref: string;
  title: string;
  agency: string;
  closed: string;
  awarded_to?: string;
  contract_value?: string;
  type: string;
  scope: string;
  region: string;
  fit: string;
  missed_reason: string;
  lesson: string;
  bid_submitted: boolean;
  our_outcome?: string;
  notes?: string;
  created_at: string;
}

const BLANK_TENDER = {
  ref: "", title: "", agency: "", closed: "", awarded_to: "", contract_value: "",
  type: "", scope: "", region: "NSW", fit: "MEDIUM" as const,
  missed_reason: "", lesson: "", bid_submitted: false, our_outcome: "", notes: "",
};

// ─── Recently Closed (last 6 months) ────────────────────────────────────────
// AUDIT NOTE (20 Jul 2026): every entry below has been verified against a live,
// public government/news source. Any entry that could not be verified with a
// working link has been removed rather than left as an unverifiable placeholder —
// see AUDIT_REMOVED below for what was taken out and why.
const RECENTLY_CLOSED: ClosedTender[] = [
  {
    ref: "NSW Ambulance — Fixed-Wing Air Ambulance Services Contract",
    title: "NSW Ambulance — Fixed-Wing Air Ambulance Services (10-Year Contract)",
    agency: "NSW Ambulance",
    closed: "Contract executed 13 Feb 2020 · operational since 1 Jan 2022 · runs to ~2032",
    awarded_to: "Pel-Air Aviation Pty Ltd (acquired by Toll Group from Rex Airlines, Oct 2024)",
    portalUrl: "https://www.ambulance.nsw.gov.au/__data/assets/pdf_file/0004/600592/Part-1-Contract_NSW-Ambulance-Fixed-wing-Air-Ambulance-Services-Contract-executed-13.02.2020-RFS.pdf",
    portalName: "NSW Ambulance (published contract PDF)",
    winnerAnalysis: {
      likely_reasons: ["Competitive tender win as new entrant, displacing prior incumbent RFDS", "Dedicated fleet of 5 Beechcraft King Air 350 aircraft purchased specifically for this contract", "Commercial operator pricing model", "NSW-wide base network"],
      strengths: "Pel-Air won this as a genuinely competitive re-tender against the long-standing incumbent (RFDS), demonstrating that incumbency is not decisive if fleet investment and pricing are stronger.",
      price_positioning: "Commercial charter operator pricing was competitive enough to beat a charity-subsidised incumbent.",
      incumbent_advantage: "Not applicable here — this is a rare case of the incumbent losing the re-tender.",
    },
    contract_value: "10-year exclusive service contract; separately, a $54.3M NSW Government boost in 2024 added 2 new Pilatus PC-24 jets to the fleet",
    type: "Exclusive Service Contract",
    scope: "Fixed-wing intra-hospital and inter-hospital patient transfer across NSW — Beechcraft King Air 350 fleet plus 2 Pilatus PC-24 jets added in 2024.",
    region: "NSW",
    fit: "VERY HIGH",
    missed_reason: "This contract closed in 2020 and runs a 10-year term (to ~2032) — the opportunity window has passed and there is no near-term re-tender.",
    lesson: "The next genuine re-tender is not expected until ~2031-2032. Register on Buy.NSW now and build a relationship with the NSW Ambulance Aviation Manager well ahead of that cycle.",
    notes: "Secondary source on the 2024 PC-24 fleet boost: https://www.ambulance.nsw.gov.au/news/news-items/state-of-the-art-nsw-ambulance-jets-preparing-for-take-off",
  },
  {
    ref: "QPS27938",
    title: "Queensland Government Air (QGAir) — Jet Wet Lease",
    agency: "Queensland Police Service (QGAir)",
    closed: "30 October 2025",
    awarded_to: "Not publicly disclosed on the listing",
    portalUrl: "https://www.australiantenders.com.au/tenders/596302/queensland-government-air-qgair-jet-wet-lease",
    portalName: "Australian Tenders (QGAir listing, Tender # QPS27938)",
    contract_value: "Not publicly disclosed",
    type: "Wet Lease Services Agreement",
    scope: "Wet lease of 2 jet aircraft for Donate Life Missions (organ retrieval/medical transport), SERT tactical deployments, disaster management response, and dignitary transport statewide.",
    region: "QLD",
    fit: "HIGH",
    missed_reason: "Not registered on QTenders/QGAir supplier lists at time of tender; award outcome was not publicly disclosed so exact competitive positioning is unknown.",
    lesson: "Register on QTenders and monitor QGAir wet-lease arrangements — contract term and next refresh date are not publicly stated, so ongoing monitoring is required rather than a fixed re-tender date.",
    notes: "Value and awardee are not publicly disclosed on the tender listing — do not restate a specific dollar figure or winner for this entry.",
  },
  {
    ref: "WA Government media statement — 19 Jul 2024",
    title: "Landmark Aeromedical Services Contract — WA Country Health Service / RFDS (WA)",
    agency: "WA Country Health Service",
    closed: "19 July 2024",
    awarded_to: "Royal Flying Doctor Service (Western Operations)",
    portalUrl: "https://www.wa.gov.au/government/media-statements/Cook-Labor-Government/Landmark-contract-with-RFDS-to-advance-aeromedical-services---20240719",
    portalName: "WA Government (official media statement)",
    winnerAnalysis: {
      likely_reasons: ["35+ year incumbent relationship", "Existing WA base network (Derby, Broome, Port Hedland, Kalgoorlie, Meekatharra)", "Charity co-funding model", "Deep Kimberley/Pilbara operational history"],
      strengths: "RFDS WA has decades of operational history in the exact regions covered, with base infrastructure and clinical handover protocols already co-designed with WA Country Health Service.",
      incumbent_advantage: "Very strong — this was reported as a direct, negotiated landmark contract with the long-standing incumbent rather than an open competitive re-tender.",
    },
    contract_value: "Reported at approximately $800M (per ABC News coverage; not an official published figure)",
    type: "Contract (exclusive service agreement)",
    scope: "Primary and inter-hospital aeromedical transfer across WA — Kimberley, Pilbara, Goldfields, Mid-West, Wheatbelt.",
    region: "WA",
    fit: "HIGH",
    missed_reason: "No WA base or sub-contracted LAME support in WA; this was a direct arrangement with the incumbent rather than an open tender we could have bid on.",
    lesson: "Build a WA subcontractor network ahead of any future WA Country Health Service aeromedical procurement.",
    notes: "Secondary source: https://www.abc.net.au/news/2024-07-24/rural-gp-slams-royal-flying-doctor-service-contract-800-million/104126810",
  },
  {
    ref: "AMSA Dedicated Airborne SAR Services — Challenger contract (executed 20 Oct 2014)",
    title: "AMSA Search & Rescue Aircraft Services — Challenger Jets",
    agency: "Australian Maritime Safety Authority",
    closed: "Contract executed 20 Oct 2014 · current term runs to 11 Dec 2028",
    awarded_to: "Leidos SAR Services Pty Ltd (formerly Cobham SAR Services Pty Ltd — Cobham's Australian SAR business was rebranded/acquired under Leidos)",
    portalUrl: "https://www.amsa.gov.au/safety-navigation/search-and-rescue/challenger-aircraft",
    portalName: "AMSA (official)",
    winnerAnalysis: {
      likely_reasons: ["Purpose-built long-range jets (Bombardier Challenger CL-604)", "Existing AMSA relationship from prior contract era", "National coverage from strategically placed bases"],
      strengths: "4 Challenger CL-604 jets provide long-endurance national SAR coverage that AMSA has relied on since 2014 — this is a long-running incumbent arrangement, not a recent award.",
      incumbent_advantage: "Very strong — same operator has held this role for over a decade.",
    },
    contract_value: "$837,837,943 (per AMSA's published Senate Order Contract Details Report)",
    type: "Exclusive contract",
    scope: "National search and rescue coverage using 4 Bombardier Challenger CL-604 jets, tasked by AMSA's Rescue Coordination Centre.",
    region: "AU Federal",
    fit: "MEDIUM",
    missed_reason: "This is a long-running, decade-old incumbent contract (runs to Dec 2028) — there is no near-term re-tender window, and the original 2014 competitive process required capability we do not hold (long-range SAR jets).",
    lesson: "Monitor AMSA's separate 'Opportunity Based SAR Services' panel arrangement (24AMSA001) for shorter-sector opportunities that don't require a dedicated Challenger-class fleet. Track AMSA's tenders/contracts page ahead of the 2028 contract expiry.",
    notes: "Do not confuse this with AMSA's aerial maritime surveillance function — that is a separate program historically run by Border Force/Home Affairs (now largely Leidos Australia / incoming Metrea Australia from 1 Jan 2028), not AMSA.",
  },
];

// ─── Entries removed during the 20 Jul 2026 authenticity audit ────────────
// The following were previously listed as "Recently Closed" real awarded
// tenders but could NOT be verified against any public government notice,
// news report, or procurement portal after extensive searching. Per the
// authenticity policy, an entry presented as a real closed/awarded tender
// must have a live link to a genuine source — since none could be found,
// these have been removed rather than kept with a fabricated or generic
// fallback link. If real internal documentation exists for any of these,
// it should be re-added WITH a verifiable source link:
//  1. "UNICEF Pacific — Standing Offer for Air Charter Services
//      (Samoa, Vanuatu, Solomon Islands)" — no matching UNGM/UNICEF record found.
//  2. "NSW Health Pathology — Urgent Specimen Air Transport (STAT) Panel"
//      (claimed award to Rex Airlines + Inland Aviation) — no matching
//      Buy.NSW/HealthShare NSW procurement record found.
//  3. "GT-NSW-001 — NSW Health NEPT (Ground) — Western NSW LHD Panel" —
//      no matching NSW Health / Western NSW LHD tender record found.
//  4. "GT-FED-001 — Dept of Defence Joint Health Command Medical Ground
//      Transport Services (Holsworthy/Randwick/Williamtown)" — no matching
//      AusTender/Defence record found.
//  5. "MIL-001 — ADF Aeromedical Evacuation Support — Domestic Contingency
//      Contract" (claimed award to Toll Medical Transport) — no matching
//      AusTender/Defence record found; Toll Aviation does hold real Defence
//      aviation programs (https://www.tollaviation.com.au/defence-aviation-programs/)
//      but this specific contract could not be confirmed.

interface CalendarAction {
  month: string;
  action: string;
  priority: "URGENT" | "CRITICAL" | "HIGH" | "MEDIUM";
}

// ─── Portals ──────────────────────────────────────────────────────────────────
const PORTALS: TenderPortal[] = [
  // Australian Federal & State
  { service: "AusTender",            url: "tenders.gov.au",                   href: "https://www.tenders.gov.au",                       notes: "Federal — set keyword alerts (free)",               region: "AU Federal"   },
  { service: "Buy.NSW",              url: "buy.nsw.gov.au",                   href: "https://buy.nsw.gov.au",                           notes: "Replaces tenders.nsw.gov.au from 1 Jul 2026",       region: "NSW"          },
  { service: "QTenders",             url: "qtenders.epw.qld.gov.au",          href: "https://qtenders.epw.qld.gov.au",                  notes: "Free",                                              region: "QLD"          },
  { service: "VicTenders",           url: "tenders.vic.gov.au",               href: "https://www.tenders.vic.gov.au",                   notes: "Free",                                              region: "VIC"          },
  { service: "SA Tenders",           url: "tenders.sa.gov.au",                href: "https://www.tenders.sa.gov.au",                    notes: "Requires registration",                             region: "SA"           },
  { service: "NT Tenders",           url: "tendersonline.nt.gov.au",          href: "https://tendersonline.nt.gov.au",                  notes: "Free",                                              region: "NT"           },
  { service: "WA Tenders",           url: "tenders.wa.gov.au",                href: "https://www.tenders.wa.gov.au",                    notes: "Free — FIFO & remote aviation relevant",            region: "WA"           },
  { service: "TAS Tenders",          url: "tenders.tas.gov.au",               href: "https://www.tenders.tas.gov.au",                   notes: "Free",                                              region: "TAS"          },
  { service: "ACT Tenders",          url: "tenders.act.gov.au",               href: "https://www.tenders.act.gov.au",                   notes: "Free",                                              region: "ACT"          },
  // Australian aggregators & specialist
  { service: "Australian Tenders",   url: "australiantenders.com.au",         href: "https://www.australiantenders.com.au",             notes: "Free aggregator — good for historical data",        region: "AU Aggregator"},
  { service: "TenderLink",           url: "tenderlink.com",                   href: "https://www.tenderlink.com",                       notes: "Paid — aviation category alerts",                   region: "AU Paid"      },
  { service: "NAFC",                 url: "nafc.org.au/tenders",              href: "https://www.nafc.org.au/tenders",                  notes: "Aerial firefighting — NAFC national",               region: "AU Aviation"  },
  { service: "AFAC",                 url: "afac.com.au",                      href: "https://www.afac.com.au",                          notes: "Fire & emergency aviation, national",               region: "AU Aviation"  },
  // International — UN & multilateral
  { service: "UN Global Marketplace",url: "ungm.org",                         href: "https://www.ungm.org",                             notes: "UN system-wide procurement — aviation & logistics", region: "UN"           },
  { service: "UNDP Procurement",     url: "procurement.undp.org",             href: "https://procurement.undp.org",                     notes: "UNDP — humanitarian aviation & charter",            region: "UN"           },
  { service: "UNICEF Supply",        url: "supply.unicef.org",                href: "https://supply.unicef.org",                        notes: "Medical logistics & air transport",                 region: "UN"           },
  { service: "WFP Procurement",      url: "procurement.wfp.org",              href: "https://procurement.wfp.org",                      notes: "Humanitarian air services — remote ops",            region: "UN"           },
  { service: "WHO Procurement",      url: "who.int/about/accountability/procurement", href: "https://www.who.int/about/accountability/procurement", notes: "Medical supply chain & aeromedical", region: "UN" },
  { service: "IOM Procurement",      url: "iom.int/procurement",              href: "https://www.iom.int/procurement",                  notes: "Migration — humanitarian aviation",                 region: "UN"           },
  // International — bilateral & regional
  { service: "NZ GETS",              url: "gets.govt.nz",                     href: "https://www.gets.govt.nz",                         notes: "New Zealand Govt Electronic Tenders",               region: "NZ"           },
  { service: "Pacific Tenders (ADB)",url: "adb.org/projects/tenders",         href: "https://www.adb.org/projects/tenders",             notes: "ADB Pacific region — island aviation",             region: "Pacific"      },
  { service: "World Bank eConsult",  url: "projects.worldbank.org",           href: "https://projects.worldbank.org",                   notes: "World Bank — health & transport projects",          region: "Global"       },
  { service: "AIIB Procurement",     url: "aiib.org/en/projects/procurement", href: "https://www.aiib.org/en/projects/procurement/",    notes: "Asian Infrastructure — regional aviation",          region: "Asia"         },
  { service: "US SAM.gov",           url: "sam.gov",                          href: "https://sam.gov",                                  notes: "US Federal — USAID, DoD, Pacific contracts",        region: "USA"          },
  { service: "UK Find a Tender",     url: "find-tender.service.gov.uk",       href: "https://www.find-tender.service.gov.uk",           notes: "UK Gov — British territories & overseas",          region: "UK"           },
];

const REGION_GROUPS = ["AU Federal", "NSW", "QLD", "VIC", "SA", "NT", "WA", "TAS", "ACT", "AU Aggregator", "AU Paid", "AU Aviation", "UN", "NZ", "Pacific", "Global", "Asia", "USA", "UK"];

// ─── Live opportunities ────────────────────────────────────────────────────────
const LIVE: LiveOpportunity[] = [
  {
    ref: "RFI-2015603",
    title: "NSW Health — Rural & Regional Air Transport RFI",
    agency: "NSW Ministry of Health",
    closes: "30 Jul 2026",
    urgent: true,
    type: "Request for Information",
    scope: "Fixed-wing IHT across regional NSW — Far West, Western NSW, New England, Orana, Riverina. 24/7 operations. Published 18 Jun 2026, extended via amendment 6 Jul 2026.",
    fit: "VERY HIGH",
    action: "Respond by 30 July 2026 3:00 PM — RFI responses shape the upcoming RFT specification. Responding now puts you in the room when the RFT is written.",
    contact: "michael.donnolley@health.nsw.gov.au",
    region: "NSW",
    portalUrl: "https://buy.nsw.gov.au/prcOpportunity/D765D0EB-F970-4337-B0A9FE964C0B015E",
    portalName: "Buy.NSW",
  },
  {
    ref: "CASA 26/106",
    title: "CASA Hire of Aircraft & Simulator Services Panel",
    agency: "Civil Aviation Safety Authority",
    closes: "3 Aug 2026",
    urgent: true,
    type: "Panel Arrangement (RFT)",
    scope: "Aircraft hire for CASA officer transport, NAVAID flight checking, simulator hire, flight training (Part 141/142). All states + overseas. Published 7 Jul 2026.",
    fit: "HIGH",
    action: "Lodge response by 3 August 2026 at 2:00 PM AEST.",
    contact: "ashadmin@casa.gov.au",
    region: "AU Federal",
    portalUrl: "https://www.tenders.gov.au/Atm/Show/851f2c08-da28-40d6-8c15-bdd9fc21932d",
    portalName: "AusTender",
  },
];

// ─── Pipeline ─────────────────────────────────────────────────────────────────
const PIPELINE: PipelineItem[] = [
  // Australian
  { opportunity: "NSW NEPT Fixed-Wing Contract Renewal",           agency: "NSW Ambulance / HealthShare NSW",         est_date: "2027",                value: "$50M–$150M",         priority: "CRITICAL", region: "NSW"      },
  { opportunity: "QLD QGAir Fleet / Wet Lease (new round)",        agency: "QLD Police Service",                     est_date: "Late 2026–Early 2027", value: "$30M–$100M+",       priority: "HIGH",     region: "QLD"      },
  { opportunity: "AMSA Fixed-Wing Aerial Dispersant Capability",   agency: "Australian Maritime Safety Authority",   est_date: "Imminent",            value: "Not disclosed",      priority: "MEDIUM",   region: "AU Federal"},
  { opportunity: "VIC Ambulance Aviation Panel Renewal",           agency: "Ambulance Victoria",                     est_date: "~2026–2027",          value: "$20M–$80M",          priority: "HIGH",     region: "VIC"      },
  { opportunity: "NT Passenger Air Charter Panel",                 agency: "NT Government",                          est_date: "Rolling",             value: "~$52M",              priority: "MEDIUM",   region: "NT"       },
  { opportunity: "WA Country Health RFDS Aviation Services",       agency: "WA Country Health Service",              est_date: "~2027",               value: "$20M–$60M",          priority: "HIGH",     region: "WA"       },
  { opportunity: "NAFC Fixed-Wing Aerial Firefighting",            agency: "National Aerial Firefighting Centre",    est_date: "2026–27 season",      value: "Seasonal",           priority: "MEDIUM",   region: "AU Aviation"},
  { opportunity: "Defence Air Charter (ad hoc)",                   agency: "Department of Defence",                  est_date: "Ongoing",             value: "$300K–$5M/contract", priority: "MEDIUM",   region: "AU Federal"},
  { opportunity: "Toll SA Subcontract Opportunities",              agency: "Attorney-General's Dept SA (via Toll)",  est_date: "Nov 2026",            value: "TBD",                priority: "MEDIUM",   region: "SA"       },
  // Pacific & international
  { opportunity: "PNG DFAT Health Aviation Support",               agency: "DFAT / AusAID PNG Health Program",       est_date: "2026–2027",           value: "TBD",                priority: "HIGH",     region: "Pacific"  },
  { opportunity: "Pacific Aviation Safety Office (PASO) Charter",  agency: "PASO / Pacific Island Govts",            est_date: "Rolling",             value: "TBD",                priority: "MEDIUM",   region: "Pacific"  },
  { opportunity: "UNICEF Pacific Medical Airlift",                 agency: "UNICEF Pacific Region",                  est_date: "Rolling",             value: "TBD",                priority: "MEDIUM",   region: "UN"       },
  { opportunity: "WFP Humanitarian Air Services (Pacific)",        agency: "World Food Programme",                   est_date: "Rolling",             value: "TBD",                priority: "MEDIUM",   region: "UN"       },
  { opportunity: "IOM Pacific Migration Aviation",                 agency: "International Organisation for Migration",est_date: "Rolling",            value: "TBD",                priority: "LOW-MED",  region: "UN"       },
  { opportunity: "NZ Defence Force Air Charter",                   agency: "NZ Ministry of Defence / RNZAF",         est_date: "~2027",               value: "NZD $10M–$40M",      priority: "MEDIUM",   region: "NZ"       },
  { opportunity: "ADB Pacific Transport Connectivity",             agency: "Asian Development Bank",                 est_date: "2026–2027",           value: "USD $5M–$20M",       priority: "MEDIUM",   region: "Pacific"  },
  { opportunity: "WHO Emergency Medical Airlift (WPRO)",           agency: "WHO Western Pacific Region Office",      est_date: "Rolling",             value: "TBD",                priority: "MEDIUM",   region: "UN"       },
  { opportunity: "USAID Indo-Pacific Health Aviation",             agency: "USAID",                                  est_date: "2026–2027",           value: "USD $2M–$10M",       priority: "LOW-MED",  region: "USA"      },
  // Ground transfer & bariatric
  { opportunity: "NSW Health Ground NEPT Panel — Renewal 2027",    agency: "NSW Health",                             est_date: "Mid 2027",            value: "$3M–$5M/yr",         priority: "HIGH",     region: "NSW",       notes: "Re-tender of existing Western NSW LHD ground panel. Acquiring a dedicated bariatric ground vehicle before this opens would significantly improve bid scoring." },
  { opportunity: "State Emergency Management — Medical Ground Support (VIC/NSW)", agency: "VIC/NSW Emergency Management Vic", est_date: "Late 2026",     value: "$800K–$1.5M/yr",     priority: "MEDIUM",   region: "NSW",       notes: "Ground medical support for state emergency events. RFDS SE positioning as a multi-modal provider (air + ground) is a key differentiator." },
  { opportunity: "ADF Joint Health Command — Ground Medical Transport SOA 2027", agency: "Department of Defence",         est_date: "Early 2027",          value: "$1.5M–$2M/yr",       priority: "MEDIUM",   region: "AU Federal", notes: "Requires AusTender registration and Baseline security clearances. Start clearance process now — 6–9 month lead time." },
  { opportunity: "Special Mission — Bariatric Air Transfer NSW/SA", agency: "NSW Ambulance / SA Ambulance",           est_date: "Ongoing / ad hoc",    value: "$500K–$1.2M/yr",     priority: "HIGH",     region: "NSW",       notes: "Very limited competition. Only ~1 dedicated bariatric aircraft in SA (operated from Adelaide). NSW has no dedicated provider. Significant unmet demand from larger hospitals." },
  { opportunity: "AFP Air Charter and Medical Support Panel",      agency: "Australian Federal Police",              est_date: "2027",                value: "$2M–$4M/yr",         priority: "MEDIUM",   region: "AU Federal", notes: "Requires Baseline security clearance. AFP uses medical transport for protective operations and detainee transfers." },
  { opportunity: "NSW Bariatric Ground Transfer Service (Dedicated Vehicle)", agency: "NSW Ambulance / Private Referral", est_date: "Ongoing",           value: "$400K–$800K/yr",     priority: "HIGH",     region: "NSW",       notes: "Only ~2 dedicated bariatric ground vehicles in NSW. Extremely limited supply. High demand from metro and regional hospitals. Low competition, high margin." },
];

// ─── Calendar ─────────────────────────────────────────────────────────────────
const CALENDAR: CalendarAction[] = [
  { month: "July 2026",      action: "Respond to NSW Health RFI-2015603 — closes 30 July 2026 3:00 PM (Buy.NSW portal)",    priority: "URGENT"   },
  { month: "August 2026",    action: "Lodge CASA HASS Panel application (closes 3 Aug)",                            priority: "URGENT"   },
  { month: "August 2026",    action: "Register on Buy.NSW, QTenders, NT Tenders, WA Tenders portals",              priority: "HIGH"     },
  { month: "August 2026",    action: "Register on UN Global Marketplace (UNGM) — required for all UN tenders",     priority: "HIGH"     },
  { month: "September 2026", action: "Publish Capability Statement (4-page PDF, update quarterly)",                 priority: "HIGH"     },
  { month: "September 2026", action: "Commission BARS audit if not current",                                        priority: "HIGH"     },
  { month: "September 2026", action: "Register on UNDP, UNICEF, WFP procurement portals",                          priority: "MEDIUM"   },
  { month: "October 2026",   action: "Monitor QLD QGAir for new wet lease RFT",                                    priority: "HIGH"     },
  { month: "October 2026",   action: "Begin ISO 9001 certification process if not current",                         priority: "MEDIUM"   },
  { month: "October 2026",   action: "Engage DFAT re PNG & Pacific health aviation opportunities",                  priority: "MEDIUM"   },
  { month: "November 2026",  action: "Monitor NSW Ambulance for NEPT/IHT contract signals",                        priority: "CRITICAL" },
  { month: "November 2026",  action: "Monitor WA Country Health for RFDS aviation services tender",                 priority: "HIGH"     },
  { month: "December 2026",  action: "Attend NAFC industry day (aerial firefighting pre-season)",                   priority: "MEDIUM"   },
  { month: "January 2027",   action: "Monitor VIC Ambulance for aviation panel renewal RFI",                       priority: "HIGH"     },
  { month: "February 2027",  action: "Prepare full RFT response template library (AU & international formats)",     priority: "HIGH"     },
];

// ─── Styling helpers ───────────────────────────────────────────────────────────
const FIT_COLORS: Record<string, string> = {
  "VERY HIGH": "bg-teal-600 text-white",
  "HIGH":      "bg-emerald-600 text-white",
  "MEDIUM":    "bg-amber-500 text-white",
};

const PRIORITY_COLORS: Record<string, string> = {
  "URGENT":   "bg-rose-700 text-white",
  "CRITICAL": "bg-rose-700 text-white",
  "HIGH":     "bg-emerald-700 text-white",
  "MEDIUM":   "bg-amber-500 text-white",
  "LOW-MED":  "bg-slate-500 text-white",
};

const REGION_BADGE: Record<string, string> = {
  "NSW":         "bg-blue-900/50 text-blue-300 border border-blue-700/40",
  "QLD":         "bg-purple-900/50 text-purple-300 border border-purple-700/40",
  "VIC":         "bg-indigo-900/50 text-indigo-300 border border-indigo-700/40",
  "SA":          "bg-orange-900/50 text-orange-300 border border-orange-700/40",
  "NT":          "bg-red-900/50 text-red-300 border border-red-700/40",
  "WA":          "bg-yellow-900/50 text-yellow-300 border border-yellow-700/40",
  "TAS":         "bg-teal-900/50 text-teal-300 border border-teal-700/40",
  "ACT":         "bg-cyan-900/50 text-cyan-300 border border-cyan-700/40",
  "AU Federal":  "bg-slate-700/50 text-slate-300 border border-slate-600/40",
  "AU Aggregator":"bg-slate-700/50 text-slate-300 border border-slate-600/40",
  "AU Paid":     "bg-amber-900/50 text-amber-300 border border-amber-700/40",
  "AU Aviation": "bg-sky-900/50 text-sky-300 border border-sky-700/40",
  "UN":          "bg-cyan-900/50 text-cyan-300 border border-cyan-700/40",
  "NZ":          "bg-emerald-900/50 text-emerald-300 border border-emerald-700/40",
  "Pacific":     "bg-teal-900/50 text-teal-300 border border-teal-700/40",
  "Global":      "bg-violet-900/50 text-violet-300 border border-violet-700/40",
  "Asia":        "bg-orange-900/50 text-orange-300 border border-orange-700/40",
  "USA":         "bg-blue-900/50 text-blue-300 border border-blue-700/40",
  "UK":          "bg-rose-900/50 text-rose-300 border border-rose-700/40",
};

function RegionBadge({ region }: { region: string }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${REGION_BADGE[region] ?? "bg-slate-700 text-slate-300"}`}>
      {region}
    </span>
  );
}

// Group portals by region category
const AU_PORTALS  = PORTALS.filter(p => ["AU Federal","NSW","QLD","VIC","SA","NT","WA","TAS","ACT","AU Aggregator","AU Paid","AU Aviation"].includes(p.region));
const INTL_PORTALS = PORTALS.filter(p => !["AU Federal","NSW","QLD","VIC","SA","NT","WA","TAS","ACT","AU Aggregator","AU Paid","AU Aviation"].includes(p.region));

// Group pipeline by region category
const AU_PIPELINE   = PIPELINE.filter(p => ["AU Federal","NSW","QLD","VIC","SA","NT","WA","TAS","ACT","AU Aviation"].includes(p.region));
const INTL_PIPELINE = PIPELINE.filter(p => !["AU Federal","NSW","QLD","VIC","SA","NT","WA","TAS","ACT","AU Aviation"].includes(p.region));

// Map priority -> fit-style label so pipeline items can share the detail modal's fit badge styling
const PRIORITY_TO_FIT: Record<string, "VERY HIGH" | "HIGH" | "MEDIUM"> = {
  "CRITICAL": "VERY HIGH",
  "HIGH":     "HIGH",
  "MEDIUM":   "MEDIUM",
  "LOW-MED":  "MEDIUM",
};

// Normalise a PipelineItem into the shape the shared detail modal expects
function toPipelineTender(item: PipelineItem) {
  return {
    ...item,
    _kind: "pipeline" as const,
    title: item.opportunity,
    fit: PRIORITY_TO_FIT[item.priority] ?? "MEDIUM",
    type: "Internal Opportunity Thesis — Not Yet Published",
    action: item.notes ?? `Monitor ${item.agency} for release of this opportunity and prepare a capability statement ahead of time.`,
  };
}

export default function GovernmentTenders() {
  const [showClosed, setShowClosed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ ...BLANK_TENDER });
  const [addError, setAddError] = useState("");
  const qc = useQueryClient();

  const { data: manualData } = useQuery({
    queryKey: ["/api/closed-tenders"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/closed-tenders");
      return r.json() as Promise<{ tenders: ManualTender[] }>;
    },
  });
  const manualTenders: ManualTender[] = manualData?.tenders ?? [];

  // Filters for Recently Closed section — declared before applyFilters which references them
  const [filterRegion, setFilterRegion] = useState("ALL");
  const [filterFit, setFilterFit] = useState("ALL");
  const [filterBid, setFilterBid] = useState("ALL");
  const [showWinner, setShowWinner] = useState<string | null>(null);
  const [selectedTender, setSelectedTender] = useState<any>(null);

  const applyFilters = <T extends { region: string; fit: string; bid_submitted?: boolean }>(list: T[]) =>
    list.filter(t => {
      if (filterRegion !== "ALL" && t.region !== filterRegion) return false;
      if (filterFit !== "ALL" && t.fit !== filterFit) return false;
      if (filterBid === "BID" && !t.bid_submitted) return false;
      if (filterBid === "NOBID" && t.bid_submitted) return false;
      return true;
    });
  const filteredStatic = applyFilters(RECENTLY_CLOSED.map(t => ({ ...t, bid_submitted: false })));

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...BLANK_TENDER });

  const editMutation = useMutation({
    mutationFn: async ({ id, form }: { id: number; form: typeof BLANK_TENDER }) => {
      const r = await apiRequest("PATCH", `/api/closed-tenders/${id}`, form);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/closed-tenders"] });
      setEditId(null);
    },
  });


  const addMutation = useMutation({
    mutationFn: async (form: typeof BLANK_TENDER) => {
      const r = await apiRequest("POST", "/api/closed-tenders", form);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/closed-tenders"] });
      setShowAddModal(false);
      setAddForm({ ...BLANK_TENDER });
      setAddError("");
    },
    onError: () => setAddError("Failed to save. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await apiRequest("DELETE", `/api/closed-tenders/${id}`);
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/closed-tenders"] }),
  });

  const handleAddSubmit = () => {
    if (!addForm.ref || !addForm.title || !addForm.agency || !addForm.closed || !addForm.type || !addForm.scope) {
      setAddError("Please fill in all required fields (marked *).");
      return;
    }
    setAddError("");
    addMutation.mutate(addForm);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">

      {/* ── Page Header ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-cyan-900/40 border border-cyan-700/40">
            <Globe size={22} className="text-cyan-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Government Tender Intelligence</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Australia · Pacific · UN Agencies · International — Health, Police, Fire, Emergency Services & Humanitarian Aviation
            </p>
          </div>
          <button
            onClick={() => setShowClosed(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors shrink-0 ${
              showClosed
                ? "bg-rose-900/40 border-rose-700/60 text-rose-300 hover:bg-rose-900/60"
                : "bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <XCircle size={15} />
            Recently Closed
            {showClosed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-10 max-w-5xl">


        {/* ══════════════════════════════════════════════
            SECTION 0 — RECENTLY CLOSED (TOGGLE)
        ══════════════════════════════════════════════ */}
        {showClosed && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-rose-400" />
                <h2 className="text-base font-bold text-white">Recently Closed — Last 6 Months</h2>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-900/40 border border-cyan-700/40 text-cyan-300 hover:bg-cyan-900/70 text-xs font-semibold transition-colors"
              >
                <Plus size={13} /> Add Tender
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Tenders that closed recently. Add ones you bid on to track outcomes and build institutional knowledge.
            </p>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mr-1">Filter:</span>
              <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                <option value="ALL">All Regions</option>
                {["NSW","VIC","QLD","SA","WA","NT","TAS","ACT","AU Federal","AU Aviation","UN","NZ","Pacific","Global","Asia","USA","UK"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select value={filterFit} onChange={e => setFilterFit(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                <option value="ALL">All Fit Ratings</option>
                <option value="VERY HIGH">Very High Fit</option>
                <option value="HIGH">High Fit</option>
                <option value="MEDIUM">Medium Fit</option>
              </select>
              <select value={filterBid} onChange={e => setFilterBid(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
                <option value="ALL">All Bids</option>
                <option value="BID">We Bid</option>
                <option value="NOBID">Did Not Bid</option>
              </select>
              {(filterRegion !== "ALL" || filterFit !== "ALL" || filterBid !== "ALL") && (
                <button onClick={() => { setFilterRegion("ALL"); setFilterFit("ALL"); setFilterBid("ALL"); }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-600 hover:bg-slate-700 transition-colors">
                  Clear
                </button>
              )}
            </div>

            {/* Manual entries first (with delete button) */}
            {manualTenders.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <PenSquare size={13} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Your Tracked Tenders ({manualTenders.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {manualTenders.map((t) => (
                    <div key={t.id}
                      onClick={() => setSelectedTender({ ...t, _kind: "closed", _manual: true })}
                      className="rounded-xl border border-cyan-800/50 bg-slate-900 p-4 flex flex-col gap-3 cursor-pointer hover:border-cyan-600/70 hover:bg-slate-900/80 transition-colors relative">
                      <div className="flex items-center gap-1.5 absolute top-3 right-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditForm({ ref: t.ref, title: t.title, agency: t.agency, closed: t.closed, awarded_to: t.awarded_to ?? "", contract_value: t.contract_value ?? "", type: t.type, scope: t.scope, region: t.region, fit: (t.fit as any) ?? "MEDIUM", missed_reason: t.missed_reason ?? "", lesson: t.lesson ?? "", bid_submitted: t.bid_submitted, our_outcome: t.our_outcome ?? "", notes: t.notes ?? "" }); setEditId(t.id); }}
                          className="p-1.5 rounded hover:bg-cyan-900/40 text-slate-500 hover:text-cyan-400 transition-colors"
                          title="Edit"
                        >
                          <PenSquare size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm("Remove this tender?")) deleteMutation.mutate(t.id); }}
                          className="p-1.5 rounded hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pr-14">
                        {t.bid_submitted ? (
                          <span className="text-[10px] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/40 px-2 py-0.5 rounded uppercase tracking-wide">Bid Submitted</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded uppercase tracking-wide">No Bid</span>
                        )}
                        <RegionBadge region={t.region} />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${FIT_COLORS[t.fit as keyof typeof FIT_COLORS] ?? "bg-slate-500 text-white"}`}>FIT: {t.fit}</span>
                      </div>
                      <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{t.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Building2 size={12} className="shrink-0" />
                        <span className="truncate">{t.agency}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{t.contract_value || "Not disclosed"}</span>
                        <span className="text-slate-500">{t.closed}</span>
                      </div>
                      <div className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 mt-1">View Details →</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Static intelligence entries */}
            <div className="flex items-center gap-2 mb-3">
              <Globe size={13} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Market Intelligence (Pre-loaded)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStatic.map((t) => (
                <div key={t.ref}
                  onClick={() => setSelectedTender({ ...t, _kind: "closed" })}
                  className="rounded-xl border border-rose-900/50 bg-slate-900 p-4 flex flex-col gap-3 cursor-pointer hover:border-rose-700/70 hover:bg-slate-900/80 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700/40 px-2 py-0.5 rounded uppercase tracking-wide">
                      Closed
                    </span>
                    <RegionBadge region={t.region} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${FIT_COLORS[t.fit]}`}>FIT: {t.fit}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{t.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Building2 size={12} className="shrink-0" />
                    <span className="truncate">{t.agency}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{t.contract_value ?? "Not disclosed"}</span>
                    <span className="text-slate-500">{t.closed}</span>
                  </div>
                  <div className="text-xs font-semibold text-rose-400 hover:text-rose-300 mt-1">View Details →</div>
                </div>
              ))}
            </div>

            {/* Summary callout */}
            <div className="mt-4 rounded-xl border border-rose-800/40 bg-rose-950/20 px-5 py-4">
              <p className="text-sm text-rose-100">
                <span className="font-bold">6 tenders closed in the past 6 months</span> with a combined estimated value of{" "}
                <span className="font-semibold">~$225M+</span>. The two highest-fit misses — NSW Ambulance IHT Panel and WA Country Health — were lost primarily due to{" "}
                <span className="font-semibold">portal registration gaps</span> and{" "}
                <span className="font-semibold">missing compliance documents</span> (UNGM, WA Indigenous Employment Plan). These are low-effort fixes.
              </p>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SECTION 1 — LIVE OPPORTUNITIES
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-rose-400" />
            <h2 className="text-base font-bold text-white">Live Opportunities — Act Now</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LIVE.map((opp) => (
              <div key={opp.ref}
                onClick={() => setSelectedTender({ ...opp, _kind: "live" })}
                className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3 cursor-pointer hover:border-cyan-600/60 hover:bg-slate-900/80 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  {opp.urgent && (
                    <span className="text-[10px] font-bold bg-rose-700 text-white px-2 py-0.5 rounded uppercase tracking-wide">
                      Act Now
                    </span>
                  )}
                  <RegionBadge region={opp.region} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${FIT_COLORS[opp.fit]}`}>FIT: {opp.fit}</span>
                </div>
                <h3 className="font-semibold text-white text-sm leading-snug">{opp.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 size={12} className="shrink-0" />
                  <span className="truncate">{opp.agency}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{opp.type}</span>
                  <span className="text-cyan-400 font-semibold">Closes {opp.closes}</span>
                </div>
                <div className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 mt-1">View Details →</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2 — PIPELINE (AU + INTERNATIONAL)
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold text-white">Internal Opportunity Theses — Monitor Closely</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Internal analyst forecasts of likely future demand, based on market gaps and agency signals. These are NOT published government tenders, RFIs, or RFTs — no agency has issued a notice for any item below. Verify against AusTender / Buy.NSW / state portals before treating as a live opportunity.</p>

          {/* AU Pipeline */}
          <div className="mb-2 flex items-center gap-2">
            <Flag size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Australian Opportunities</span>
          </div>
          <PipelineTiles rows={AU_PIPELINE} onSelect={(item) => setSelectedTender(toPipelineTender(item))} />

          {/* International Pipeline */}
          <div className="mt-6 mb-2 flex items-center gap-2">
            <Globe size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">International Opportunities</span>
          </div>
          <PipelineTiles rows={INTL_PIPELINE} onSelect={(item) => setSelectedTender(toPipelineTender(item))} />

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW-MED"] as const).map((p) => (
              <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[p]}`}>{p}</span>
            ))}
            <span className="text-xs text-slate-500">Priority = contract value × fleet fit</span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — MONITORING PORTALS
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Eye size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold text-white">Recommended Monitoring Setup</h2>
            <span className="text-xs text-slate-500">Register once, then let alerts do the watching</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">All portals across Australian states, UN agencies, and international procurement systems</p>

          {/* Australian portals */}
          <div className="mb-2 flex items-center gap-2">
            <Flag size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Australian Portals</span>
          </div>
          <PortalTable rows={AU_PORTALS} />

          {/* International portals */}
          <div className="mt-6 mb-2 flex items-center gap-2">
            <Globe size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">International Portals</span>
          </div>
          <PortalTable rows={INTL_PORTALS} />

          {/* Contract Expiry Watch */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" />
              Contract Expiry Watch List
            </h3>
            <div className="space-y-0">
              {[
                { label: "NSW Ambulance / Pel-Air fixed-wing",              when: "Est. expiry 2027",          level: "CRITICAL", region: "NSW"      },
                { label: "QLD QGAir wet lease arrangements",                when: "Annual / biennial",          level: "HIGH",     region: "QLD"      },
                { label: "WA Country Health RFDS aviation services",         when: "Watch for RFI ~2027",       level: "HIGH",     region: "WA"       },
                { label: "VIC Ambulance Victoria fixed-wing panel",          when: "Watch for RFI 2026–2027",   level: "HIGH",     region: "VIC"      },
                { label: "NT Government air charter panel",                  when: "Rolling — monitor NT Tenders",level: "MEDIUM", region: "NT"       },
                { label: "NZ Defence Force air charter",                     when: "~2027",                     level: "MEDIUM",   region: "NZ"       },
                { label: "UNICEF Pacific medical airlift standing offer",     when: "Rolling",                   level: "MEDIUM",   region: "UN"       },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <RegionBadge region={item.region} />
                    <span className="text-sm text-slate-300 truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:block">{item.when}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[item.level]}`}>{item.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — 12-MONTH ACTION CALENDAR
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold text-white">12-Month Action Calendar</h2>
          </div>

          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-[140px_1fr_90px] bg-slate-800 px-4 py-2.5 gap-4">
              {["Month", "Action", "Priority"].map((h) => (
                <div key={h} className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{h}</div>
              ))}
            </div>
            {CALENDAR.map((row, i) => (
              <div key={`${row.month}-${i}`}
                className={`grid grid-cols-[140px_1fr_90px] px-4 py-3 gap-4 items-center border-t border-slate-800 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-950"}`}>
                <div className="text-sm font-semibold text-slate-300">{row.month}</div>
                <div className="text-sm text-slate-300">{row.action}</div>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[row.priority]}`}>{row.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 5 — TENDER READINESS CHECKLIST
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold text-white">Tender Readiness Checklist</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChecklistCard title="Regulatory & Compliance" items={[
              "AOC — current and unrestricted",
              "CASA Part 135 charter approval",
              "Dangerous Goods certification",
              "ISO 9001:2015 certification",
              "ISO 45001 (WHS management)",
              "BARS aviation safety accreditation",
              "Safety Management System (SMS) current",
            ]} />
            <ChecklistCard title="Capability Statement" items={[
              "Fleet — registration, type, TAS, range, config",
              "Crew qualifications & AeroRoster fatigue evidence",
              "Bases — Dubbo (YSDU) + outstations",
              "24/7 availability commitment documented",
              "Response time — notification to airborne",
              "Medical config — stretcher, O₂, monitoring, power",
              "Maintenance — LAME coverage, AOC authority",
              "Insurance certificates — hull + liability",
            ]} />
            <ChecklistCard title="Technology Differentiators" items={[
              "Medivac.ai — real-time dispatch & CASA audit trail",
              "AeroRoster — EBA-compliant fatigue management",
              "FlightLog AI — digital tech log, LAME sign-off",
              "AI Mission Analyst — risk scoring & clinical rec.",
              "Telehealth Portal — live vitals, specialist consult",
            ]} />
            <ChecklistCard title="International Readiness" items={[
              "Registered on UN Global Marketplace (UNGM)",
              "UNDP, UNICEF, WFP vendor profiles active",
              "International insurance — USD liability cover",
              "ICAO operator certificate (international ops)",
              "Indigenous Employment Plan (for Pacific & NT)",
              "Indigenous subcontractor identified",
              "Community benefit statement drafted",
            ]} />
          </div>
        </section>

        {/* ── Closing callout ── */}
        <div className="rounded-xl border border-cyan-800/40 bg-cyan-900/20 px-5 py-4">
          <p className="text-sm text-cyan-100">
            <span className="font-bold">Two immediate actions.</span>{" "}
            Respond to the <span className="font-semibold">NSW Health RFI by 16 July</span> and lodge the{" "}
            <span className="font-semibold">CASA Panel application by 3 August</span>. In parallel, register on the{" "}
            <span className="font-semibold">UN Global Marketplace</span> — it is a prerequisite for all UN agency tenders and takes several weeks to approve.
          </p>
        </div>

      </div>

      {/* ── Edit Closed Tender Modal ── */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Edit Tender</h2>
              <button onClick={() => setEditId(null)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ref *" value={editForm.ref} onChange={v => setEditForm(f => ({...f, ref: v}))} />
                <Field label="Closed Month *" value={editForm.closed} onChange={v => setEditForm(f => ({...f, closed: v}))} />
              </div>
              <Field label="Title *" value={editForm.title} onChange={v => setEditForm(f => ({...f, title: v}))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agency *" value={editForm.agency} onChange={v => setEditForm(f => ({...f, agency: v}))} />
                <Field label="Contract Type *" value={editForm.type} onChange={v => setEditForm(f => ({...f, type: v}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Awarded To" value={editForm.awarded_to} onChange={v => setEditForm(f => ({...f, awarded_to: v}))} />
                <Field label="Contract Value" value={editForm.contract_value} onChange={v => setEditForm(f => ({...f, contract_value: v}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Region *</label>
                  <select value={editForm.region} onChange={e => setEditForm(f => ({...f, region: e.target.value}))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                    {["NSW","VIC","QLD","SA","WA","NT","TAS","ACT","AU Federal","AU Aviation","UN","NZ","Pacific","Global","Asia","USA","UK"].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Fleet Fit</label>
                  <select value={editForm.fit} onChange={e => setEditForm(f => ({...f, fit: e.target.value as any}))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                    <option value="VERY HIGH">Very High</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
              </div>
              <TextArea label="Scope *" value={editForm.scope} onChange={v => setEditForm(f => ({...f, scope: v}))} rows={2} />
              <div className="flex items-center gap-3">
                <input type="checkbox" id="edit_bid" checked={editForm.bid_submitted}
                  onChange={e => setEditForm(f => ({...f, bid_submitted: e.target.checked}))} className="accent-cyan-500" />
                <label htmlFor="edit_bid" className="text-sm text-slate-300 cursor-pointer">We submitted a bid</label>
              </div>
              {editForm.bid_submitted && (
                <Field label="Our Outcome" value={editForm.our_outcome} onChange={v => setEditForm(f => ({...f, our_outcome: v}))} />
              )}
              <TextArea label="Why Missed / What We Learned" value={editForm.missed_reason} onChange={v => setEditForm(f => ({...f, missed_reason: v}))} rows={2} />
              <TextArea label="Forward Action" value={editForm.lesson} onChange={v => setEditForm(f => ({...f, lesson: v}))} rows={2} />
              <TextArea label="Additional Notes" value={editForm.notes} onChange={v => setEditForm(f => ({...f, notes: v}))} rows={2} />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setEditId(null)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-slate-600 hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={() => editMutation.mutate({ id: editId!, form: editForm })} disabled={editMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-700 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50">
                  {editMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Closed Tender Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Add Closed Tender</h2>
              <button onClick={() => { setShowAddModal(false); setAddError(""); }} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ref / Tender Number *" value={addForm.ref} onChange={v => setAddForm(f => ({...f, ref: v}))} placeholder="e.g. AusTender CN4179501" />
                <Field label="Closed Month *" value={addForm.closed} onChange={v => setAddForm(f => ({...f, closed: v}))} placeholder="e.g. March 2026" />
              </div>
              {/* Title */}
              <Field label="Tender Title *" value={addForm.title} onChange={v => setAddForm(f => ({...f, title: v}))} placeholder="Full tender name" />
              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agency *" value={addForm.agency} onChange={v => setAddForm(f => ({...f, agency: v}))} placeholder="Procuring agency" />
                <Field label="Contract Type *" value={addForm.type} onChange={v => setAddForm(f => ({...f, type: v}))} placeholder="e.g. Panel Arrangement, RFT" />
              </div>
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Awarded To" value={addForm.awarded_to} onChange={v => setAddForm(f => ({...f, awarded_to: v}))} placeholder="Winning operator" />
                <Field label="Contract Value" value={addForm.contract_value} onChange={v => setAddForm(f => ({...f, contract_value: v}))} placeholder="e.g. $38M over 3 years" />
              </div>
              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Region *</label>
                  <select value={addForm.region} onChange={e => setAddForm(f => ({...f, region: e.target.value}))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                    {["NSW","VIC","QLD","SA","WA","NT","TAS","ACT","AU Federal","AU Aviation","UN","NZ","Pacific","Global","Asia","USA","UK"].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Fleet Fit</label>
                  <select value={addForm.fit} onChange={e => setAddForm(f => ({...f, fit: e.target.value as any}))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                    <option value="VERY HIGH">Very High</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
              </div>
              {/* Scope */}
              <TextArea label="Scope *" value={addForm.scope} onChange={v => setAddForm(f => ({...f, scope: v}))} placeholder="Brief description of what the contract covers" rows={2} />
              {/* Bid submitted */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="bid_submitted" checked={addForm.bid_submitted}
                  onChange={e => setAddForm(f => ({...f, bid_submitted: e.target.checked}))}
                  className="accent-cyan-500" />
                <label htmlFor="bid_submitted" className="text-sm text-slate-300 cursor-pointer">We submitted a bid for this tender</label>
              </div>
              {/* Our outcome */}
              {addForm.bid_submitted && (
                <Field label="Our Outcome" value={addForm.our_outcome} onChange={v => setAddForm(f => ({...f, our_outcome: v}))} placeholder="e.g. Unsuccessful — scored 72/100. Feedback: pricing too high." />
              )}
              {/* Missed reason */}
              <TextArea label="Why Missed / What We Learned" value={addForm.missed_reason} onChange={v => setAddForm(f => ({...f, missed_reason: v}))} placeholder="Why didn't we win or bid? What gap does this expose?" rows={2} />
              {/* Lesson */}
              <TextArea label="Forward Action" value={addForm.lesson} onChange={v => setAddForm(f => ({...f, lesson: v}))} placeholder="What do we do before the next cycle?" rows={2} />
              {/* Notes */}
              <TextArea label="Additional Notes" value={addForm.notes} onChange={v => setAddForm(f => ({...f, notes: v}))} placeholder="Contacts, portal links, internal references…" rows={2} />

              {addError && <p className="text-sm text-rose-400">{addError}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => { setShowAddModal(false); setAddError(""); }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-slate-600 hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddSubmit} disabled={addMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-700 hover:bg-cyan-600 text-white transition-colors disabled:opacity-50">
                  {addMutation.isPending ? "Saving…" : "Save Tender"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tender Detail Modal ── */}
      {selectedTender && (
        <TenderDetailModal tender={selectedTender} onClose={() => setSelectedTender(null)} />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">{label}</label>
      <input value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500" />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">{label}</label>
      <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none" />
    </div>
  );
}

function PipelineTable({ rows }: { rows: PipelineItem[] }) {
  const PRIORITY_COLORS: Record<string, string> = {
    "CRITICAL": "bg-rose-700 text-white",
    "HIGH":     "bg-emerald-700 text-white",
    "MEDIUM":   "bg-amber-500 text-white",
    "LOW-MED":  "bg-slate-500 text-white",
  };
  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.65fr] bg-slate-800 px-4 py-2.5 gap-3">
        {["Opportunity", "Agency", "Est. Date", "Value", "Priority"].map((h) => (
          <div key={h} className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{h}</div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={row.opportunity}
          className={`border-t border-slate-800 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-950"}`}>
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.65fr] px-4 py-3 gap-3 items-center">
            <div className="flex items-start gap-1.5 flex-wrap">
              <RegionBadge region={row.region} />
              <span className="text-sm font-medium text-slate-200">{row.opportunity}</span>
            </div>
            <div className="text-xs text-slate-400">{row.agency}</div>
            <div className="text-xs text-slate-400">{row.est_date}</div>
            <div className="text-xs text-slate-300">{row.value}</div>
            <div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[row.priority]}`}>{row.priority}</span>
            </div>
          </div>
          {row.notes && (
            <div className="px-4 pb-3 -mt-1">
              <p className="text-xs text-slate-500 leading-relaxed">{row.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PipelineTiles({ rows, onSelect }: { rows: PipelineItem[]; onSelect: (item: PipelineItem) => void }) {
  const PRIORITY_COLORS: Record<string, string> = {
    "CRITICAL": "bg-rose-700 text-white",
    "HIGH":     "bg-emerald-700 text-white",
    "MEDIUM":   "bg-amber-500 text-white",
    "LOW-MED":  "bg-cyan-700 text-white",
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rows.map((row) => (
        <div key={row.opportunity}
          onClick={() => onSelect(row)}
          className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3 cursor-pointer hover:border-cyan-600/60 hover:bg-slate-900/80 transition-colors">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/40 px-2 py-0.5 rounded uppercase tracking-wide">
              Internal Thesis
            </span>
            <RegionBadge region={row.region} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[row.priority] ?? "bg-slate-500 text-white"}`}>{row.priority}</span>
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{row.opportunity}</h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">{row.agency}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">{row.value}</span>
            <span className="text-cyan-400 font-semibold">{row.est_date}</span>
          </div>
          <div className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 mt-1">View Details →</div>
        </div>
      ))}
    </div>
  );
}

function PortalTable({ rows }: { rows: TenderPortal[] }) {
  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      <div className="grid grid-cols-[0.8fr_2fr_1fr_2fr] bg-slate-800 px-4 py-2.5 gap-4">
        {["Region", "Portal", "Service", "Notes"].map((h) => (
          <div key={h} className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{h}</div>
        ))}
      </div>
      {rows.map((p, i) => (
        <div key={p.service}
          className={`grid grid-cols-[0.8fr_2fr_1fr_2fr] px-4 py-3 gap-4 items-center border-t border-slate-800 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-950"}`}>
          <RegionBadge region={p.region} />
          <a href={p.href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
            {p.url}<ExternalLink size={11} />
          </a>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-200">{p.service}</span>
            {p.region === "AU Paid" && (
              <span className="text-[9px] bg-amber-700/40 text-amber-400 border border-amber-700/40 px-1.5 py-0.5 rounded font-semibold">PAID</span>
            )}
          </div>
          <div className="text-xs text-slate-400">{p.notes}</div>
        </div>
      ))}
    </div>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="text-sm font-semibold text-cyan-400 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <label key={item} className="flex items-start gap-2.5 cursor-pointer group">
            <input type="checkbox" className="mt-0.5 accent-cyan-500 shrink-0" />
            <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Portal picker for guidance generation ─────────────────────────────────
function pickRelevantPortal(region: string): string {
  const match = PORTALS.find(p => p.region === region);
  return match ? match.service : "AusTender";
}

function austenderSearchUrl(title: string): string {
  // AusTender uses /Search/KeywordSearch — the /search?keyword= path returns 404
  return `https://www.tenders.gov.au/Search/KeywordSearch?keyword=${encodeURIComponent(title)}`;
}

// ─── Source / portal link resolver for the detail modal ───────────────────
function resolveSourceLink(tender: any, kind: "closed" | "live" | "pipeline"): { label: string; sub: string; href: string } {
  if (kind === "closed") {
    // If a direct portal URL is provided, use it; otherwise fall back to keyword search
    if (tender.portalUrl) {
      return {
        label: tender.portalName ? `View on ${tender.portalName}` : "View original tender notice",
        sub: tender.portalUrl.replace(/^https?:\/\//, ""),
        href: tender.portalUrl,
      };
    }
    return {
      label: "Search AusTender for this contract",
      sub: "tenders.gov.au",
      href: austenderSearchUrl(tender.title),
    };
  }
  if (kind === "live") {
    const url = tender.portalUrl ?? tender.href;
    if (url) {
      const portalName = tender.portalName ?? pickRelevantPortal(tender.region);
      return {
        label: `View on ${portalName}`,
        sub: url.replace(/^https?:\/\//, ""),
        href: url,
      };
    }
    return {
      label: "Search AusTender for this opportunity",
      sub: "tenders.gov.au",
      href: austenderSearchUrl(tender.title),
    };
  }
  // pipeline
  if (tender.portalUrl) {
    const portalName = tender.portalName ?? pickRelevantPortal(tender.region);
    return {
      label: `Monitor on ${portalName}`,
      sub: tender.portalUrl.replace(/^https?:\/\//, ""),
      href: tender.portalUrl,
    };
  }
  return {
    label: "Set alert on AusTender",
    sub: "tenders.gov.au",
    href: "https://www.tenders.gov.au",
  };
}

function TenderDetailModal({ tender, onClose }: { tender: any; onClose: () => void }) {
  const kind: "closed" | "live" | "pipeline" = tender._kind === "pipeline" ? "pipeline" : tender._kind === "closed" ? "closed" : "live";
  const isClosed = kind === "closed";
  const isPipeline = kind === "pipeline";

  const guidance: string[] = [];
  if (isPipeline) {
    const portal = tender.portalName ?? pickRelevantPortal(tender.region);
    guidance.push("This is an internal opportunity thesis based on market analysis — no agency has published an RFI or RFT for this yet.");
    guidance.push(`Monitor ${portal} for an actual RFT release — set a keyword alert.`);
    guidance.push(`Prepare capability statement addressing: ${tender.notes ?? tender.agency}.`);
    guidance.push(`Expected timeline: ${tender.est_date} — begin internal review now.`);
    guidance.push(tender.priority === "CRITICAL" || tender.priority === "HIGH"
      ? "Strategic tip: high-priority pipeline item — engage the agency early via an RFI or expression of interest if one is published ahead of the RFT."
      : "Strategic tip: track this opportunity in the calendar and revisit capability fit closer to the expected release date.");
  } else if (isClosed) {
    const portal = pickRelevantPortal(tender.region);
    guidance.push(`Register on ${portal} before the next tender cycle opens.`);
    if (tender.missed_reason) {
      guidance.push(`Address capability gaps: ${tender.missed_reason}`);
    }
    if (tender.winnerAnalysis?.strengths) {
      guidance.push(`Key differentiators to close the gap: ${tender.winnerAnalysis.strengths}`);
    } else if (tender.winnerAnalysis?.likely_reasons?.length) {
      guidance.push(`Key differentiators used by the winner: ${tender.winnerAnalysis.likely_reasons.join(", ")}`);
    }
    if (tender.lesson) {
      guidance.push(`Next cycle expected: ${tender.lesson}`);
    }
  } else {
    guidance.push(`Submission deadline: ${tender.closes}. Prioritise resourcing to lodge ahead of this date.`);
    guidance.push("Key requirements to address in bid: fleet configuration, response times, and compliance documentation called out in the scope above.");
    guidance.push(`Portal / contact: ${tender.contact ?? pickRelevantPortal(tender.region)}`);
    guidance.push(tender.fit === "VERY HIGH"
      ? "Strategic tip: this matches your existing operating footprint closely — lead with base location, fleet type, and existing agency relationships."
      : "Strategic tip: emphasise regulatory relationship and compliance history with the agency to offset any capability gaps.");
  }

  const sourceLink = resolveSourceLink(tender, kind);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#1C1B19] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${isClosed ? "bg-rose-900/60 text-rose-300 border border-rose-700/40" : isPipeline ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40" : "bg-cyan-900/60 text-cyan-300 border border-cyan-700/40"}`}>
                {isClosed ? "Closed" : isPipeline ? "Opportunity Thesis (Unpublished)" : "Live Opportunity"}
              </span>
              <RegionBadge region={tender.region} />
              {isPipeline ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[tender.priority as keyof typeof PRIORITY_COLORS] ?? "bg-slate-500 text-white"}`}>PRIORITY: {tender.priority}</span>
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${FIT_COLORS[tender.fit as keyof typeof FIT_COLORS] ?? "bg-slate-500 text-white"}`}>FIT: {tender.fit}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{tender.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors shrink-0">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Key facts grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5 flex items-center gap-1.5">
                <Building2 size={11} /> Agency
              </div>
              <div className="text-sm text-slate-200">{tender.agency}</div>
            </div>
            <div className="bg-slate-900 px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Region</div>
              <div className="text-sm text-slate-200">{tender.region}</div>
            </div>
            {isClosed ? (
              <>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Contract Value</div>
                  <div className="text-sm text-slate-200">{tender.contract_value ?? "Not disclosed"}</div>
                </div>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Closed Date</div>
                  <div className="text-sm text-slate-200">{tender.closed}</div>
                </div>
              </>
            ) : isPipeline ? (
              <>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Status</div>
                  <div className="text-sm text-slate-200">{tender.type}</div>
                </div>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Value Estimate (Analyst Forecast)</div>
                  <div className="text-sm text-slate-200">{tender.value ?? "Not disclosed"}</div>
                </div>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Estimated Timing (Unconfirmed)</div>
                  <div className="text-sm text-slate-200">{tender.est_date}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Value Estimate</div>
                  <div className="text-sm text-slate-200">{tender.value ?? "Not disclosed"}</div>
                </div>
                <div className="bg-slate-900 px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-0.5">Deadline</div>
                  <div className="text-sm text-slate-200">{tender.closes}</div>
                </div>
              </>
            )}
          </div>

          {/* Scope / description */}
          {tender.scope && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-1">
                {isClosed ? "Scope" : isPipeline ? "Scope / Description" : "Description / Scope"}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{tender.scope}</p>
            </div>
          )}

          {/* Requirements (live opportunities) */}
          {!isClosed && !isPipeline && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-1">Requirements</div>
              <p className="text-sm text-slate-300 leading-relaxed">{tender.action}</p>
              {tender.contact && (
                <a href={`mailto:${tender.contact}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  <ExternalLink size={12} />{tender.contact}
                </a>
              )}
            </div>
          )}

          {/* Recommended Action (pipeline items) */}
          {isPipeline && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-semibold mb-1">Recommended Action</div>
              <p className="text-sm text-slate-300 leading-relaxed">{tender.action}</p>
            </div>
          )}

          {/* Closed-tender specific: likely reasons won/lost + lesson */}
          {isClosed && (
            <>
              {tender.winnerAnalysis?.likely_reasons?.length > 0 && (
                <div className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-amber-400/90 font-semibold mb-1.5">Likely Reasons Won / Lost</div>
                  <ul className="space-y-1">
                    {tender.winnerAnalysis.likely_reasons.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 mt-1 shrink-0">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tender.missed_reason && (
                <div className="rounded-lg bg-rose-950/30 border border-rose-900/40 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold mb-1">Why It Was Missed</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{tender.missed_reason}</p>
                </div>
              )}
              {tender.lesson && (
                <div className="rounded-lg bg-cyan-950/30 border border-cyan-900/40 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold mb-1">Lesson Learned</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{tender.lesson}</p>
                </div>
              )}
            </>
          )}

          {/* Competitive Tender Guidance */}
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-800/40 px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
              <Target size={12} /> Competitive Tender Guidance
            </div>
            <ul className="space-y-1.5">
              {guidance.map((g, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>{g}
                </li>
              ))}
            </ul>
          </div>

          {/* Source / Portal link */}
          <div className="mt-2 pt-4 border-t border-[#393836]">
            <a
              href={sourceLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-[#1C1B19] border border-[#393836] px-4 py-3 hover:border-[#4F98A3]/60 transition-colors"
            >
              <ExternalLink size={16} className="text-[#4F98A3] shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#4F98A3] truncate">{sourceLink.label}</div>
                <div className="text-xs text-slate-500 truncate">{sourceLink.sub}</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
