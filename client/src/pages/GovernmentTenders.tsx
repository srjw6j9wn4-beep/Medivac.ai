import { ExternalLink, AlertCircle, Clock, Eye, TrendingUp, Calendar, CheckSquare, FileText, Globe, Flag } from "lucide-react";

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
}

interface PipelineItem {
  opportunity: string;
  agency: string;
  est_date: string;
  value: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW-MED";
  region: string;
}

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
    closes: "16 Jul 2026",
    urgent: true,
    type: "Request for Information",
    scope: "Fixed-wing IHT across regional NSW — Far West, Western NSW, New England, Orana, Riverina. 24/7 operations.",
    fit: "VERY HIGH",
    action: "Respond immediately — RFI responses shape the upcoming RFT specification. Responding now puts you in the room when the RFT is written.",
    contact: "michael.donnolley@health.nsw.gov.au",
    region: "NSW",
  },
  {
    ref: "CASA 26/106",
    title: "CASA Hire of Aircraft & Simulator Services Panel",
    agency: "Civil Aviation Safety Authority",
    closes: "3 Aug 2026",
    urgent: true,
    type: "Panel Arrangement (RFT)",
    scope: "Aircraft hire for CASA officer transport, NAVAID flight checking, simulator hire, flight training (Part 141/142). All states + overseas.",
    fit: "HIGH",
    action: "Lodge response by 3 August 2026.",
    contact: "ashadmin@casa.gov.au",
    region: "AU Federal",
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
];

// ─── Calendar ─────────────────────────────────────────────────────────────────
const CALENDAR: CalendarAction[] = [
  { month: "July 2026",      action: "Respond to NSW Health RFI-2015603 (closes 16 July)",                          priority: "URGENT"   },
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

export default function GovernmentTenders() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">

      {/* ── Page Header ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-cyan-900/40 border border-cyan-700/40">
            <Globe size={22} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Government Tender Intelligence</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Australia · Pacific · UN Agencies · International — Health, Police, Fire, Emergency Services & Humanitarian Aviation
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-10 max-w-5xl">

        {/* ══════════════════════════════════════════════
            SECTION 1 — LIVE OPPORTUNITIES
        ══════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-rose-400" />
            <h2 className="text-base font-bold text-white">Live Opportunities — Act Now</h2>
          </div>

          <div className="space-y-4">
            {LIVE.map((opp) => (
              <div key={opp.ref} className="rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between bg-slate-800 px-4 py-3 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {opp.urgent && (
                      <span className="text-[10px] font-bold bg-rose-700 text-white px-2 py-0.5 rounded uppercase tracking-wide">
                        Act Now
                      </span>
                    )}
                    <RegionBadge region={opp.region} />
                    <span className="font-semibold text-white text-sm">{opp.title}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-700 px-2 py-1 rounded shrink-0">{opp.ref}</span>
                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-700">
                  {[
                    ["Agency", opp.agency],
                    ["Closes", opp.closes],
                    ["Type",   opp.type],
                    ["Scope",  opp.scope],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-900 px-4 py-2.5">
                      <div className="text-[10px] uppercase tracking-widest text-cyan-500 font-semibold mb-0.5">{k}</div>
                      <div className="text-sm text-slate-200">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-slate-700">
                  <div className="flex items-start gap-3 px-4 py-3 bg-slate-800/50">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${FIT_COLORS[opp.fit]}`}>
                      FIT: {opp.fit}
                    </span>
                    <p className="text-sm text-slate-300">
                      {opp.fit === "VERY HIGH"
                        ? "This is exactly your operating environment. Dubbo base is central to Western NSW LHD. B200/B350 configured for medical transport. Medivac.ai provides the dispatch & compliance platform."
                        : "King Air B200/B350 are ideal NAVAID calibration and charter aircraft. CASA already regulates you — a place on the CASA panel converts that relationship into recurring government work nationwide."}
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-slate-900">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold text-xs shrink-0 pt-0.5">ACTION REQUIRED</span>
                      <p className="text-sm text-slate-300">{opp.action}</p>
                    </div>
                    {opp.contact && (
                      <a href={`mailto:${opp.contact}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        <ExternalLink size={12} />{opp.contact}
                      </a>
                    )}
                  </div>
                </div>
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
            <h2 className="text-base font-bold text-white">Forward Pipeline — Monitor Closely</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Australian and international opportunities not yet open but expected within the planning horizon</p>

          {/* AU Pipeline */}
          <div className="mb-2 flex items-center gap-2">
            <Flag size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Australian Opportunities</span>
          </div>
          <PipelineTable rows={AU_PIPELINE} />

          {/* International Pipeline */}
          <div className="mt-6 mb-2 flex items-center gap-2">
            <Globe size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">International Opportunities</span>
          </div>
          <PipelineTable rows={INTL_PIPELINE} />

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
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
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
          className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_0.65fr] px-4 py-3 gap-3 items-center border-t border-slate-800 ${i % 2 === 0 ? "bg-slate-900" : "bg-slate-950"}`}>
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
