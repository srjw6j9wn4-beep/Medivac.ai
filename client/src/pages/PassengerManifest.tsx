import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { UserRole } from "@/lib/data";
import {
  ERSA_AERODROMES,
  RAHS_DENTAL_BASES,
  getAerodrome,
  type ERSAAerodrome,
} from "@/data/ersa-airports";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  weight: string; // kg
  phone: string;
  notes: string;
  // Sector assignment: array of sector IDs this pax travels on
  boardSectors: string[];
  // Return flight: if true, pax also travels the reverse of their sectors
  hasReturn: boolean;
}

interface Sector {
  id: string;
  from: string;
  to: string;
  etd: string; // stored as "HH:MM" (24hr)
  eta: string; // stored as "HH:MM" (24hr)
}

const BOOKING_TEAMS = ["RAHS", "Dental", "Dispatch", "Operations", "Other"];
const AIRCRAFT_REGS = ["VH-FDR", "VH-OWA", "VH-NHY", "VH-MWY", "VH-XFQ", "VH-ZBY", "VH-MYN", "VH-BKS"];

// Roles that can use this page
const ALLOWED_ROLES = ["rahs", "dental", "dispatcher", "operations", "admin", "manager", "pilot", "manager"];

interface Props { role?: UserRole; }

function newPassenger(): Passenger {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    dob: "",
    weight: "",
    phone: "",
    notes: "",
    boardSectors: [],
    hasReturn: false,
  };
}
function newSector(): Sector {
  return { id: crypto.randomUUID(), from: "", to: "", etd: "", eta: "" };
}

// ── 24hr time display helper ──────────────────────────────────────────────────
// Formats "HH:MM" string to always display as 24hr regardless of locale
function fmt24(t: string): string {
  if (!t) return "";
  // Already "HH:MM" — just return as-is
  return t;
}

// ── Airport Selector ──────────────────────────────────────────────────────────
function AirportSelect({
  value,
  onChange,
  limitToBase,
  label,
  required,
}: {
  value: string;
  onChange: (val: string) => void;
  limitToBase?: boolean;
  label: string;
  required?: boolean;
}) {
  const options = limitToBase ? RAHS_DENTAL_BASES : ERSA_AERODROMES;
  const grouped: Record<string, ERSAAerodrome[]> = {};
  options.forEach(a => {
    if (!grouped[a.state]) grouped[a.state] = [];
    grouped[a.state].push(a);
  });
  const states = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">— Select aerodrome —</option>
        {states.map(state => (
          <optgroup key={state} label={`── ${state} ──`}>
            {grouped[state].map(a => (
              <option key={a.icao} value={a.icao}>
                {a.icao} — {a.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ── Warning Banner ────────────────────────────────────────────────────────────
function WarningBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-amber-900 border-2 border-amber-400 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h3 className="text-amber-300 font-bold text-lg mb-2">Operational Notice</h3>
            <p className="text-amber-100 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg transition-colors"
        >
          I Understand — Continue
        </button>
      </div>
    </div>
  );
}

// ── Sector Checkboxes for a passenger ────────────────────────────────────────
function SectorPicker({
  sectors,
  selectedIds,
  onChange,
}: {
  sectors: Sector[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (sectors.length === 0 || sectors.every(s => !s.from && !s.to)) {
    return (
      <p className="text-xs text-slate-500 italic">Add sectors above first</p>
    );
  }
  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {sectors.map((s, idx) => {
        const label = s.from && s.to ? `${s.from}→${s.to}` : `Sector ${idx + 1}`;
        const active = selectedIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              active
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Time Input (forced 24hr) ──────────────────────────────────────────────────
// Uses type="text" with pattern validation to prevent browser 12hr conversion
function TimeInput24({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [raw, setRaw] = useState(value);

  useEffect(() => { setRaw(value); }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setRaw(v);
    // Accept if matches HH:MM pattern
    if (/^\d{0,2}:?\d{0,2}$/.test(v)) {
      onChange(v);
    }
  }

  function handleBlur() {
    // Normalise to HH:MM on blur
    const match = raw.replace(":", "").match(/^(\d{1,2})(\d{2})?$/);
    if (match) {
      const hh = match[1].padStart(2, "0");
      const mm = (match[2] || "00").padStart(2, "0");
      const h = parseInt(hh, 10);
      const m = parseInt(mm, 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const normalised = `${hh}:${mm}`;
        setRaw(normalised);
        onChange(normalised);
        return;
      }
    }
    // If invalid, keep what user typed
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="HH:MM"
        maxLength={5}
        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PassengerManifest({ role }: Props) {

  // Form state
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split("T")[0]);
  const [flightNumber, setFlightNumber] = useState("");
  const [aircraftReg, setAircraftReg] = useState("");
  const [bookingTeam, setBookingTeam] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([newSector()]);
  const [passengers, setPassengers] = useState<Passenger[]>([newPassenger()]);

  // UI state
  const [activeTab, setActiveTab] = useState<"build" | "preview" | "list">("list");
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [manifests, setManifests] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isRAHSDental = ["rahs", "dental"].includes((bookingTeam || "").toLowerCase());

  // Access guard
  const canAccess = ALLOWED_ROLES.includes(role?.toLowerCase() || "");

  useEffect(() => { loadManifests(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function loadManifests() {
    setLoadingList(true);
    try {
      const res = await apiRequest("GET", "/api/manifests");
      const data = await res.json();
      setManifests(Array.isArray(data) ? data : []);
    } catch { setManifests([]); }
    finally { setLoadingList(false); }
  }

  // ── Sector handlers ──────────────────────────────────────────────────────────
  function checkAerodromeWarning(icao: string) {
    const a = getAerodrome(icao);
    if (a?.warning) setWarning(a.warning);
  }

  function updateSector(id: string, field: keyof Sector, val: string) {
    if ((field === "from" || field === "to")) checkAerodromeWarning(val);
    setSectors(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }

  function addSector() {
    if (sectors.length < 6) setSectors(prev => [...prev, newSector()]);
  }

  function removeSector(id: string) {
    if (sectors.length > 1) {
      setSectors(prev => prev.filter(s => s.id !== id));
      // Also remove from passenger sector assignments
      setPassengers(prev => prev.map(p => ({
        ...p,
        boardSectors: p.boardSectors.filter(sid => sid !== id),
      })));
    }
  }

  // ── Passenger handlers ───────────────────────────────────────────────────────
  function updatePassenger(id: string, field: keyof Passenger, val: any) {
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  }

  function addPassenger() {
    if (passengers.length < 7) setPassengers(prev => [...prev, newPassenger()]);
  }

  function removePassenger(id: string) {
    if (passengers.length > 1) setPassengers(prev => prev.filter(p => p.id !== id));
  }

  // ── Return sector label ──────────────────────────────────────────────────────
  // For a passenger's selected sectors, build the return leg description
  function returnSectorLabel(pax: Passenger): string {
    const assigned = sectors.filter(s => pax.boardSectors.includes(s.id));
    if (assigned.length === 0) return "reverse of selected sectors";
    return assigned.map(s => s.from && s.to ? `${s.to}→${s.from}` : "").filter(Boolean).join(" · ") || "reverse of selected sectors";
  }

  // ── Save / Send ──────────────────────────────────────────────────────────────
  async function saveManifest() {
    setSaving(true);
    try {
      const body = {
        flightDate,
        flightNumber,
        aircraftReg,
        bookingTeam,
        sectors,
        passengers,
        createdBy: (role as string) || "booking",
      };
      if (editingId) {
        await apiRequest("PATCH", `/api/manifests/${editingId}`, body);
        showToast("Manifest updated.");
      } else {
        await apiRequest("POST", "/api/manifests", body);
        showToast("Manifest saved as draft.");
      }
      setEditingId(null);
      resetForm();
      setActiveTab("list");
      await loadManifests();
    } catch (e: any) {
      showToast("Save failed — " + (e?.message || "unknown error"));
    } finally { setSaving(false); }
  }

  function loadForEdit(m: any) {
    setFlightDate(m.flight_date || m.flightDate);
    setFlightNumber(m.flight_number || m.flightNumber);
    setAircraftReg(m.aircraft_reg || m.aircraftReg);
    setBookingTeam(m.booking_team || m.bookingTeam);
    try { setSectors(JSON.parse(m.sectors)); } catch { setSectors([newSector()]); }
    try {
      const paxRaw = JSON.parse(m.passengers);
      // Migrate old records that don't have boardSectors/hasReturn
      setPassengers(paxRaw.map((p: any) => ({
        ...p,
        boardSectors: p.boardSectors || [],
        hasReturn: p.hasReturn || false,
      })));
    } catch { setPassengers([newPassenger()]); }
    setEditingId(m.id);
    setActiveTab("build");
  }

  function resetForm() {
    setFlightDate(new Date().toISOString().split("T")[0]);
    setFlightNumber(""); setAircraftReg(""); setBookingTeam("");
    setSectors([newSector()]); setPassengers([newPassenger()]);
    setEditingId(null);
  }

  const totalWeight = passengers.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-center p-8">
        <div>
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-lg font-semibold mb-2">Access Restricted</p>
          <p className="text-sm">Passenger Manifest booking is available to RAHS, Dental, Dispatch, and Operations roles only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
      {warning && <WarningBanner message={warning} onDismiss={() => setWarning(null)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-700 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/medivac-logo.jpg" alt="RFDS" className="h-8 w-auto rounded" />
          <div>
            <h1 className="text-white font-bold text-lg" style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}>
              Passenger Manifest
            </h1>
            <p className="text-slate-400 text-xs">RFDS South East Section — Flight Booking System</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["list", "build"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { if (tab === "build" && !editingId) resetForm(); setActiveTab(tab); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {tab === "list" ? "All Manifests" : editingId ? "Edit Manifest" : "New Manifest"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── LIST TAB ─────────────────────────────────────────────────────────── */}
        {activeTab === "list" && (
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-slate-200 font-semibold text-base">Manifests</h2>
              <button
                onClick={() => { resetForm(); setActiveTab("build"); }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                + New Manifest
              </button>
            </div>
            {loadingList ? (
              <div className="text-slate-400 text-sm text-center py-10">Loading…</div>
            ) : manifests.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-3">📋</div>
                <p className="font-medium">No manifests yet</p>
                <p className="text-sm mt-1">Click "New Manifest" to create the first booking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {manifests.map((m: any) => {
                  const sectors_: Sector[] = (() => { try { return JSON.parse(m.sectors); } catch { return []; } })();
                  const pax_: Passenger[] = (() => { try { return JSON.parse(m.passengers); } catch { return []; } })();
                  const statusColor = m.status === "signed" ? "text-green-400 bg-green-900/30 border-green-700"
                    : "text-slate-400 bg-slate-800 border-slate-600";
                  const returnCount = pax_.filter((p: any) => p.hasReturn).length;
                  return (
                    <div key={m.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-white font-bold text-base">{m.flight_number || m.flightNumber}</span>
                            <span className="text-slate-400 text-sm">{m.flight_date || m.flightDate}</span>
                            <span className="text-slate-400 text-sm">{m.aircraft_reg || m.aircraftReg}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
                              {(m.status || "draft").toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                            <span>{m.booking_team || m.bookingTeam}</span>
                            <span>{pax_.length} pax{returnCount > 0 ? ` (${returnCount} return)` : ""}</span>
                            <span>{sectors_.length} sector{sectors_.length !== 1 ? "s" : ""}</span>
                            {sectors_.length > 0 && (
                              <span className="text-slate-300">
                                {sectors_.map(s => {
                                  const etd = fmt24(s.etd);
                                  return `${s.from}→${s.to}${etd ? ` ${etd}` : ""}`;
                                }).join(" · ")}
                              </span>
                            )}
                          </div>
                          {m.status === "signed" && m.signed_by && (
                            <div className="mt-1 text-xs text-green-400">
                              ✓ Signed by {m.signed_by} · {new Date(m.signed_at).toLocaleString("en-AU")}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => loadForEdit(m)}
                            className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BUILD TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "build" && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Flight Header */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-slate-200 font-semibold mb-4 text-base flex items-center gap-2">
                ✈️ Flight Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Flight Date</label>
                  <input type="date" value={flightDate} onChange={e => setFlightDate(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Flight Number</label>
                  <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                    placeholder="e.g. RFDS101"
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Aircraft Reg</label>
                  <select value={aircraftReg} onChange={e => setAircraftReg(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select —</option>
                    {AIRCRAFT_REGS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Booking Team</label>
                  <select value={bookingTeam} onChange={e => setBookingTeam(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select —</option>
                    {BOOKING_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {isRAHSDental && (
                <div className="mt-3 text-xs text-blue-300 bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-2">
                  ℹ️ RAHS & Dental flights depart from Bankstown, Dubbo, or Broken Hill only. Sector 1 departure is restricted to these bases.
                </div>
              )}
            </div>

            {/* Sectors */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-200 font-semibold text-base">🗺️ Sectors <span className="text-slate-500 text-sm font-normal">({sectors.length}/6)</span></h2>
                {sectors.length < 6 && (
                  <button onClick={addSector}
                    className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    + Add Sector
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {sectors.map((s, idx) => (
                  <div key={s.id} className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-300 text-sm font-semibold">Sector {idx + 1}</span>
                      {sectors.length > 1 && (
                        <button onClick={() => removeSector(s.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors">
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <AirportSelect
                        label="From"
                        value={s.from}
                        onChange={v => updateSector(s.id, "from", v)}
                        limitToBase={isRAHSDental && idx === 0}
                        required
                      />
                      <AirportSelect
                        label="To"
                        value={s.to}
                        onChange={v => updateSector(s.id, "to", v)}
                        required
                      />
                      <TimeInput24
                        label="ETD (local)"
                        value={s.etd}
                        onChange={v => updateSector(s.id, "etd", v)}
                      />
                      <TimeInput24
                        label="ETA (local)"
                        value={s.eta}
                        onChange={v => updateSector(s.id, "eta", v)}
                      />
                    </div>
                    {/* Aerodrome warnings inline */}
                    {[s.from, s.to].map(icao => {
                      const a = getAerodrome(icao);
                      if (!a?.warning) return null;
                      return (
                        <div key={icao} className="mt-2 text-xs text-amber-300 bg-amber-900/30 border border-amber-700 rounded-lg px-3 py-2">
                          {a.warning}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-slate-200 font-semibold text-base">
                    👥 Passengers <span className="text-slate-500 text-sm font-normal">({passengers.length}/7)</span>
                  </h2>
                  {totalWeight > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">Total pax weight: <span className="text-white font-semibold">{totalWeight.toFixed(0)} kg</span></p>
                  )}
                </div>
                {passengers.length < 7 && (
                  <button onClick={addPassenger}
                    className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    + Add Passenger
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {passengers.map((p, idx) => (
                  <div key={p.id} className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-300 text-sm font-semibold">Passenger {idx + 1}</span>
                      {passengers.length > 1 && (
                        <button onClick={() => removePassenger(p.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors">
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Personal details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">First Name</label>
                        <input type="text" value={p.firstName} onChange={e => updatePassenger(p.id, "firstName", e.target.value)}
                          placeholder="First name"
                          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Last Name</label>
                        <input type="text" value={p.lastName} onChange={e => updatePassenger(p.id, "lastName", e.target.value)}
                          placeholder="Last name"
                          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date of Birth</label>
                        <input type="date" value={p.dob} onChange={e => updatePassenger(p.id, "dob", e.target.value)}
                          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Weight (kg)</label>
                        <input type="number" value={p.weight} onChange={e => updatePassenger(p.id, "weight", e.target.value)}
                          placeholder="0" min="0" max="300"
                          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</label>
                        <input type="tel" value={p.phone} onChange={e => updatePassenger(p.id, "phone", e.target.value)}
                          placeholder="04xx xxx xxx"
                          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</label>
                        <input type="text" value={p.notes} onChange={e => updatePassenger(p.id, "notes", e.target.value)}
                          placeholder="Medical / mobility notes"
                          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>

                    {/* Sector assignment */}
                    <div className="mt-4 border-t border-slate-600 pt-3">
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">
                        Travelling on sectors
                      </label>
                      <SectorPicker
                        sectors={sectors}
                        selectedIds={p.boardSectors}
                        onChange={ids => updatePassenger(p.id, "boardSectors", ids)}
                      />
                    </div>

                    {/* Return flight toggle */}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updatePassenger(p.id, "hasReturn", !p.hasReturn)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          p.hasReturn
                            ? "bg-emerald-700 border-emerald-500 text-white"
                            : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span>{p.hasReturn ? "↩ Return flight" : "+ Add return flight"}</span>
                      </button>
                      {p.hasReturn && (
                        <span className="text-xs text-emerald-400">
                          Return leg: {returnSectorLabel(p)}
                          <span className="text-slate-500 ml-2">— stored as separate record for reporting</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return flight explanation */}
            {passengers.some(p => p.hasReturn) && (
              <div className="bg-slate-800 border border-emerald-700/40 rounded-xl p-4 text-sm text-slate-400">
                <span className="text-emerald-400 font-semibold">↩ Return flights</span> — when saved, passengers with a return flag are automatically recorded as travelling both outbound and return legs. Reports will show each direction as a separate entry. You only need to enter the passenger once.
              </div>
            )}

            {/* Save bar */}
            <div className="flex gap-3 justify-end pb-6">
              <button onClick={() => { resetForm(); setActiveTab("list"); }}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                Cancel
              </button>
              <button onClick={saveManifest} disabled={saving || !flightNumber || !aircraftReg || !bookingTeam}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-2.5 rounded-lg transition-colors text-sm">
                {saving ? "Saving…" : editingId ? "Update Manifest" : "Save Draft"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
