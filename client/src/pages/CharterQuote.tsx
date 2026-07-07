import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  calculateQuote, fmtCents, AIRCRAFT,
  type AircraftKey, type LegInput, type CrewConfig, type QuoteInput, type QuoteCostBreakdown,
  type GroundTransportType,
} from "@/lib/quoteEngine";
import { generateCharterQuotePDF } from "@/lib/generateCharterQuotePDF";
import {
  Plane, Plus, Trash2, Calculator, Save, FileDown, RotateCcw,
  AlertTriangle, ChevronDown, ChevronUp, Users, MapPin, Hotel, Percent, Eye, Edit3,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Purpose = "medevac_charter" | "scenic" | "freight" | "corporate" | "other";
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
  { value: "medevac_charter", label: "Aeromedical Transfer" },
  { value: "scenic", label: "Scenic" },
  { value: "freight", label: "Freight" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

const GROUND_OPTIONS: { value: GroundTransportType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "ambulance", label: "Ambulance" },
  { value: "bus", label: "Bus" },
  { value: "taxi", label: "Taxi" },
  { value: "van", label: "Van" },
];

const TEAL = "#01696F";

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
  const [includeReturnLeg, setIncludeReturnLeg] = useState(false);
  const [crew, setCrew] = useState<CrewConfig>({
    captain: true, firstOfficer: false, flightNurse: false, flightParamedic: false, icuDoctor: false, count: 1,
  });
  const [accommodationNights, setAccommodationNights] = useState(0);
  const [marginPercent, setMarginPercent] = useState(15);
  const [notes, setNotes] = useState("");

  const [breakdown, setBreakdown] = useState<QuoteCostBreakdown | null>(null);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [viewingQuote, setViewingQuote] = useState<CharterQuoteRecord | null>(null);

  const crewCount = useMemo(() => {
    let n = 1; // captain always
    if (crew.firstOfficer) n++;
    if (crew.flightNurse) n++;
    if (crew.flightParamedic) n++;
    if (crew.icuDoctor) n++;
    return n;
  }, [crew]);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: nextNumberData } = useQuery<{ quoteNumber: string }>({
    queryKey: ["/api/charter-quotes/next-number"],
  });
  const { data: quotes = [] } = useQuery<CharterQuoteRecord[]>({
    queryKey: ["/api/charter-quotes"],
  });

  // ─── Mutations ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/charter-quotes", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/charter-quotes"] });
      qc.invalidateQueries({ queryKey: ["/api/charter-quotes/next-number"] });
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
  }
  function removeLeg(idx: number) {
    setLegs(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }

  // ─── Calculate ────────────────────────────────────────────────────────────
  function handleCalculate() {
    const input: QuoteInput = {
      aircraftType,
      legs,
      crew: { ...crew, count: crewCount },
      marginPercent,
      accommodationNights,
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
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">From ICAO</label>
                      <input value={leg.fromICAO} onChange={e => updateLeg(idx, { fromICAO: e.target.value.toUpperCase() })}
                        maxLength={4} placeholder="YDBO"
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 uppercase focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">From Name</label>
                      <input value={leg.fromName} onChange={e => updateLeg(idx, { fromName: e.target.value })}
                        placeholder="Dubbo"
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">To ICAO</label>
                      <input value={leg.toICAO} onChange={e => updateLeg(idx, { toICAO: e.target.value.toUpperCase() })}
                        maxLength={4} placeholder="YBHI"
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 uppercase focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">To Name</label>
                      <input value={leg.toName} onChange={e => updateLeg(idx, { toName: e.target.value })}
                        placeholder="Broken Hill"
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Distance (nm)</label>
                      <input type="number" value={leg.distanceNm || ""} onChange={e => updateLeg(idx, { distanceNm: parseFloat(e.target.value) || 0 })}
                        placeholder="240"
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Departure (HH:MM)</label>
                      <input type="time" value={leg.departureTime} onChange={e => updateLeg(idx, { departureTime: e.target.value })}
                        className="w-full text-xs bg-background border border-card-border rounded px-2 py-1 focus:outline-none" />
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
                <input type="number" min={0} value={accommodationNights}
                  onChange={e => setAccommodationNights(parseInt(e.target.value) || 0)}
                  className="w-full text-sm bg-background border border-card-border rounded-md px-3 py-1.5 focus:outline-none" />
                {breakdown?.accommodationRequired && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                    <AlertTriangle size={11} />
                    FDP exceeds 12hrs — accommodation likely required
                  </div>
                )}
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
                <button onClick={handleSaveQuote} disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-md text-white disabled:opacity-50"
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
              {saveMutation.isSuccess && (
                <div className="mt-2 text-[11px] text-green-400">Quote saved successfully.</div>
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
