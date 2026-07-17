import { useState } from "react";
import {
  Plane, Fuel, Truck, UtensilsCrossed, Stamp, Users, Warehouse, Snowflake,
  BatteryCharging, Send, MessageSquare, X, Search, Plus, Star, CheckCircle2,
  Clock, AlertTriangle, Phone, Mail, ChevronDown,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

// ─── Types ──────────────────────────────────────────────────────────────────

type ReqStatus = "Confirmed" | "Pending" | "Query";

interface HandlingRequest {
  id: string;
  flightRef: string;
  route: string;
  aircraft: string;
  services: string[];
  status: ReqStatus;
  eta: string;
  agentName: string;
  agentPhone: string;
  queryMessage?: string;
}

interface FBO {
  icao: string;
  name: string;
  phone: string;
  email: string;
  fuelTypes: string;
  customs: boolean;
  rating: number; // out of 5
}

const FLIGHT_REFS = [
  { ref: "FRY-2607", aircraft: "VH-MVW (B200)", route: "YSBK → YMEN" },
  { ref: "FRY-2608", aircraft: "VH-XYJ (B350)", route: "YSDU → YSSY" },
  { ref: "FRY-2609", aircraft: "VH-MVX (B200)", route: "YBHI → YMLT" },
  { ref: "POS-1142", aircraft: "VH-MVW (B200)", route: "YMEN → YSDU" },
];

const SERVICE_OPTIONS = [
  { key: "fuel", label: "Fuel (AVGAS/JETA)", icon: Fuel },
  { key: "gpu", label: "GPU", icon: BatteryCharging },
  { key: "towing", label: "Towing", icon: Truck },
  { key: "catering", label: "Catering (crew meals)", icon: UtensilsCrossed },
  { key: "customs", label: "Customs (international)", icon: Stamp },
  { key: "immigration", label: "Immigration", icon: Users },
  { key: "hangarage", label: "Hangarage", icon: Warehouse },
  { key: "deicing", label: "De-icing", icon: Snowflake },
];

const ACTIVE_REQUESTS: HandlingRequest[] = [
  {
    id: "HR-4471",
    flightRef: "FRY-2607",
    route: "YSBK → YMEN",
    aircraft: "VH-MVW (B200)",
    services: ["Fuel (JETA)", "GPU", "Catering"],
    status: "Confirmed",
    eta: "17 Jul 2026, 14:20 AEST",
    agentName: "Danielle Osei",
    agentPhone: "+61 3 9338 0221",
  },
  {
    id: "HR-4472",
    flightRef: "FRY-2608",
    route: "YSDU → YSSY",
    aircraft: "VH-XYJ (B350)",
    services: ["Fuel (JETA)", "Towing", "Hangarage"],
    status: "Confirmed",
    eta: "17 Jul 2026, 16:05 AEST",
    agentName: "Marcus Chen",
    agentPhone: "+61 2 9693 6644",
  },
  {
    id: "HR-4473",
    flightRef: "FRY-2609",
    route: "YBHI → YMLT",
    aircraft: "VH-MVX (B200)",
    services: ["Fuel (AVGAS)", "GPU"],
    status: "Pending",
    eta: "18 Jul 2026, 09:40 AEST",
    agentName: "Sarah Whitfield",
    agentPhone: "+61 3 6391 8850",
  },
  {
    id: "HR-4474",
    flightRef: "POS-1142",
    route: "YMEN → YSDU",
    aircraft: "VH-MVW (B200)",
    services: ["Fuel", "Catering", "De-icing"],
    status: "Query",
    eta: "18 Jul 2026, 11:15 AEST",
    agentName: "Rohan Patel",
    agentPhone: "+61 3 9338 0221",
    queryMessage: "Fuel quantity — please confirm JETA or AVGAS",
  },
];

const FBO_DIRECTORY: FBO[] = [
  { icao: "YSDU", name: "Dubbo Aero Club", phone: "+61 2 6884 2260", email: "ops@dubboaeroclub.com.au", fuelTypes: "AVGAS, JETA", customs: false, rating: 4 },
  { icao: "YBHI", name: "BHI Ground", phone: "+61 8 8087 3311", email: "handling@bhiground.com.au", fuelTypes: "AVGAS, JETA", customs: false, rating: 3 },
  { icao: "YSBK", name: "Sydney Jet Base", phone: "+61 2 9791 9700", email: "ops@sydneyjetbase.com.au", fuelTypes: "JETA", customs: false, rating: 5 },
  { icao: "YMEN", name: "Essendon Fields", phone: "+61 3 9948 9400", email: "handling@essendonfields.com.au", fuelTypes: "AVGAS, JETA", customs: false, rating: 4 },
  { icao: "YMLT", name: "Launceston Handling", phone: "+61 3 6391 8850", email: "ops@launcestonhandling.com.au", fuelTypes: "AVGAS, JETA", customs: false, rating: 4 },
  { icao: "YSSY", name: "Menzies Aviation YSSY", phone: "+61 2 9693 6644", email: "syd.ops@menziesaviation.com", fuelTypes: "JETA", customs: true, rating: 5 },
  { icao: "YMML", name: "Signature Flight Support", phone: "+61 3 9338 0221", email: "melbourne@signatureflight.com", fuelTypes: "JETA", customs: true, rating: 5 },
  { icao: "YPPH", name: "Perth Handling", phone: "+61 8 9479 6600", email: "ops@perthhandling.com.au", fuelTypes: "AVGAS, JETA", customs: true, rating: 4 },
  { icao: "YBBN", name: "Brisbane Jet Centre", phone: "+61 7 3860 5500", email: "ops@brisbanejetcentre.com.au", fuelTypes: "JETA", customs: true, rating: 4 },
  { icao: "NZAA", name: "AeroCentre NZ", phone: "+64 9 275 1200", email: "ops@aerocentre.co.nz", fuelTypes: "AVGAS, JETA", customs: true, rating: 4 },
];

function StatusBadge({ status }: { status: ReqStatus }) {
  const map: Record<ReqStatus, string> = {
    Confirmed: "bg-green-400/10 text-green-400 border-green-400/30",
    Pending: "bg-amber-400/10 text-amber-400 border-amber-400/30",
    Query: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  };
  const iconMap: Record<ReqStatus, React.ReactNode> = {
    Confirmed: <CheckCircle2 size={12} />,
    Pending: <Clock size={12} />,
    Query: <AlertTriangle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${map[status]}`}>
      {iconMap[status]}
      {status}
    </span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(value)}
      <span className="text-[#393836]">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-[#797876] uppercase tracking-wider">{label}</div>
        <div className="text-lg font-semibold text-[#CDCCCA]" style={HF}>{value}</div>
      </div>
    </div>
  );
}

export default function FBOHandling() {
  const [tab, setTab] = useState<"new" | "active" | "directory">("new");

  // form state
  const [flightRef, setFlightRef] = useState(FLIGHT_REFS[0].ref);
  const selectedFlight = FLIGHT_REFS.find((f) => f.ref === flightRef) ?? FLIGHT_REFS[0];
  const [departureFbo, setDepartureFbo] = useState("YSSY — Sydney Jet Base");
  const [arrivalFbo, setArrivalFbo] = useState("");
  const [etd, setEtd] = useState("2026-07-18T09:00");
  const [eta, setEta] = useState("2026-07-18T11:30");
  const [services, setServices] = useState<string[]>(["fuel"]);
  const [fuelQty, setFuelQty] = useState("450 kg (JETA)");
  const [instructions, setInstructions] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // directory filter
  const [filter, setFilter] = useState("");

  function toggleService(key: string) {
    setServices((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  }

  const filteredFbos = FBO_DIRECTORY.filter((f) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      f.icao.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      f.fuelTypes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6 bg-[#0f1117] min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#CDCCCA]" style={HF}>FBO & Handling Integration</h1>
        <p className="text-sm text-[#797876] mt-0.5">
          Ground Handling · Fuel Orders · Customs · Slot Requests · Avinode Ground
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Plane size={18} className="text-[#4F98A3]" />} label="Active Requests" value="4" />
        <KpiCard icon={<CheckCircle2 size={18} className="text-green-400" />} label="Confirmed" value="8" />
        <KpiCard icon={<Clock size={18} className="text-amber-400" />} label="Pending Response" value="2" />
        <KpiCard icon={<Send size={18} className="text-[#4F98A3]" />} label="Avg Response Time" value="18 min" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#393836]">
        {[
          { id: "new", label: "New Handling Request" },
          { id: "active", label: "Active Requests" },
          { id: "directory", label: "FBO Directory" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "new" | "active" | "directory")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#4F98A3] text-[#4F98A3]"
                : "border-transparent text-[#797876] hover:text-[#CDCCCA]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: New Handling Request */}
      {tab === "new" && (
        <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-6 space-y-5 max-w-3xl">
          {submitted && (
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-3 flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 size={16} />
              Handling request sent to arrival FBO — awaiting confirmation.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#5A5957] mb-1 block">Flight Reference</label>
              <div className="relative">
                <select
                  value={flightRef}
                  onChange={(e) => setFlightRef(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] appearance-none focus:outline-none focus:border-[#4F98A3]"
                >
                  {FLIGHT_REFS.map((f) => (
                    <option key={f.ref} value={f.ref}>{f.ref} — {f.route}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797876] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#5A5957] mb-1 block">Aircraft</label>
              <input
                readOnly
                value={selectedFlight.aircraft}
                className="w-full bg-[#0f1117]/60 border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#797876]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#5A5957] mb-1 block">Departure FBO (ICAO lookup)</label>
              <input
                value={departureFbo}
                onChange={(e) => setDepartureFbo(e.target.value)}
                placeholder="e.g. YSSY — Sydney Jet Base"
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
              />
            </div>
            <div>
              <label className="text-xs text-[#5A5957] mb-1 block">Arrival FBO (ICAO lookup)</label>
              <input
                value={arrivalFbo}
                onChange={(e) => setArrivalFbo(e.target.value)}
                placeholder="e.g. YMEN — Essendon Fields"
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#5A5957] mb-1 block">ETD</label>
              <input
                type="datetime-local"
                value={etd}
                onChange={(e) => setEtd(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
              />
            </div>
            <div>
              <label className="text-xs text-[#5A5957] mb-1 block">ETA</label>
              <input
                type="datetime-local"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] focus:outline-none focus:border-[#4F98A3]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#5A5957] mb-2 block">Services Required</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SERVICE_OPTIONS.map((s) => {
                const Icon = s.icon;
                const active = services.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleService(s.key)}
                    className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                      active
                        ? "bg-[#4F98A3]/15 border-[#4F98A3]/50 text-[#4F98A3]"
                        : "bg-[#0f1117] border-[#393836] text-[#797876] hover:border-[#5A5957]"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#5A5957] mb-1 block">Fuel Quantity</label>
            <input
              value={fuelQty}
              onChange={(e) => setFuelQty(e.target.value)}
              placeholder="e.g. 450 kg (JETA) or 300 L (AVGAS)"
              className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
            />
          </div>

          <div>
            <label className="text-xs text-[#5A5957] mb-1 block">Special Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Crew requires quick-turn, patient onboard, priority handling..."
              className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3] resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#4F98A3] hover:bg-[#4F98A3]/90 text-[#0f1117] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            <Send size={14} />
            Send Handling Request
          </button>
        </div>
      )}

      {/* TAB 2: Active Requests */}
      {tab === "active" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACTIVE_REQUESTS.map((req) => (
            <div key={req.id} className="bg-[#1C1B19] border border-[#393836] rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#CDCCCA]" style={HF}>{req.id}</div>
                  <div className="text-xs text-[#797876] mt-0.5">{req.flightRef} · {req.route}</div>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="text-xs text-[#797876]">
                Aircraft: <span className="text-[#CDCCCA]">{req.aircraft}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {req.services.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#0f1117] border border-[#393836] text-[#797876]">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#797876]">
                <Clock size={12} />
                ETA at FBO: <span className="text-[#CDCCCA]">{req.eta}</span>
              </div>

              {req.status === "Query" && req.queryMessage && (
                <div className="bg-orange-400/10 border border-orange-400/30 rounded-lg p-2.5 flex items-start gap-2 text-xs text-orange-300">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  {req.queryMessage}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#393836]">
                <div className="text-xs text-[#797876]">
                  <div className="text-[#CDCCCA]">{req.agentName}</div>
                  <div className="flex items-center gap-1 mt-0.5"><Phone size={11} /> {req.agentPhone}</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 text-xs font-medium bg-[#4F98A3]/15 text-[#4F98A3] border border-[#4F98A3]/40 rounded-lg px-3 py-1.5 hover:bg-[#4F98A3]/25 transition-colors">
                    <MessageSquare size={12} />
                    Message Handler
                  </button>
                  <button className="flex items-center gap-1 text-xs font-medium bg-[#0f1117] text-red-400 border border-red-400/30 rounded-lg px-3 py-1.5 hover:bg-red-400/10 transition-colors">
                    <X size={12} />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FBO Directory */}
      {tab === "directory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5957]" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by ICAO or service..."
                className="w-full bg-[#1C1B19] border border-[#393836] rounded-lg pl-9 pr-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
              />
            </div>
            <button className="flex items-center gap-2 bg-[#4F98A3] hover:bg-[#4F98A3]/90 text-[#0f1117] font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
              <Plus size={14} />
              Add FBO
            </button>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#797876] uppercase tracking-wider border-b border-[#393836]">
                    <th className="py-3 px-4">ICAO</th>
                    <th className="py-3 px-4">FBO Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Fuel Types</th>
                    <th className="py-3 px-4">Customs?</th>
                    <th className="py-3 px-4">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFbos.map((fbo) => (
                    <tr key={fbo.icao} className="border-b border-[#393836]/60 last:border-0 hover:bg-[#0f1117]/40">
                      <td className="py-3 px-4 font-semibold text-[#4F98A3]" style={HF}>{fbo.icao}</td>
                      <td className="py-3 px-4 text-[#CDCCCA]">{fbo.name}</td>
                      <td className="py-3 px-4 text-[#797876]">
                        <span className="flex items-center gap-1.5"><Phone size={12} />{fbo.phone}</span>
                      </td>
                      <td className="py-3 px-4 text-[#797876]">
                        <span className="flex items-center gap-1.5"><Mail size={12} />{fbo.email}</span>
                      </td>
                      <td className="py-3 px-4 text-[#797876]">{fbo.fuelTypes}</td>
                      <td className="py-3 px-4">
                        {fbo.customs ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/30">Yes</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#393836] text-[#797876] border border-[#5A5957]/30">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4"><StarRating value={fbo.rating} /></td>
                    </tr>
                  ))}
                  {filteredFbos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-sm text-[#5A5957]">
                        No FBOs match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
