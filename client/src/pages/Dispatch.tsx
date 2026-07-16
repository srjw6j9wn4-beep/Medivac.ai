import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type UserRole } from "@/lib/data";
import { Radio, MapPin, AlertTriangle, CheckCircle, X, Plane, UserPlus, Trash2, ChevronDown, Send, Moon, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import { ERSA_AERODROMES, getAerodrome, type ERSAAerodrome } from "@/data/ersa-airports";

interface Props { role: UserRole; }

// ── Daily status data (mirrors MorningBrief) ──────────────────────────────────
// Service code → { base, aircraft options, crew placeholder names }
interface ShiftInfo {
  code: string;
  base: string;
  aircraft: string[];    // serviceable aircraft at that base
  pilotHint: string;
  nurseHint: string;
  doctorHint: string;
}

const DAILY_SHIFTS: ShiftInfo[] = [
  { code: "BHI-AMB-D1",     base: "Broken Hill", aircraft: ["VH-MVX", "VH-MWK", "VH-XYO"], pilotHint: "Capt. R. Hughes",  nurseHint: "S. Mitchell RN",   doctorHint: "Dr. K. Patel"  },
  { code: "BHI-AMB-D2",     base: "Broken Hill", aircraft: ["VH-MVX", "VH-MWK", "VH-XYO"], pilotHint: "Capt. T. Barnes",  nurseHint: "J. O'Brien RN",    doctorHint: "— None"         },
  { code: "BHI-AMB-N1",     base: "Broken Hill", aircraft: ["VH-MVX", "VH-MWK", "VH-XYO"], pilotHint: "Capt. M. Clarke",  nurseHint: "C. Andrews RN",    doctorHint: "— None"         },
  { code: "BHI-CLINIC-AIR", base: "Broken Hill", aircraft: ["VH-MVX", "VH-MWK"],            pilotHint: "Capt. R. Hughes",  nurseHint: "S. Mitchell RN",   doctorHint: "— None"         },
  { code: "DU-AMB-D1",      base: "Dubbo",       aircraft: ["VH-MVW", "VH-XYJ", "VH-XYU"], pilotHint: "Capt. S. Nguyen", nurseHint: "P. Wallace RN",    doctorHint: "Dr. A. Sharma"  },
  { code: "DU-AMB-N1",      base: "Dubbo",       aircraft: ["VH-MVW", "VH-XYJ", "VH-XYU"], pilotHint: "Capt. L. Grant",   nurseHint: "B. Foster RN",     doctorHint: "— None"         },
  { code: "DU-NEPT",        base: "Dubbo",       aircraft: ["VH-XYU"],                      pilotHint: "Capt. S. Nguyen", nurseHint: "— None",           doctorHint: "— None"         },
  { code: "DU-CLINIC-AIR",  base: "Dubbo",       aircraft: ["VH-MVW", "VH-XYJ"],            pilotHint: "Capt. M. Clarke",  nurseHint: "P. Wallace RN",    doctorHint: "— None"         },
  { code: "BK-NEPT",        base: "Bankstown",   aircraft: ["VH-LTQ", "VH-VPQ"],            pilotHint: "Capt. R. Hughes",  nurseHint: "— None",           doctorHint: "— None"         },
  { code: "BK-RAHS",        base: "Bankstown",   aircraft: ["VH-LTQ"],                      pilotHint: "Capt. T. Barnes",  nurseHint: "J. O'Brien RN",    doctorHint: "— None"         },
  { code: "ESS-D1",         base: "Essendon",    aircraft: ["VH-MQK", "VH-NAJ"],            pilotHint: "Capt. L. Grant",   nurseHint: "B. Foster RN",     doctorHint: "— None"         },
  { code: "ESS-D2",         base: "Essendon",    aircraft: ["VH-MQK", "VH-NAJ"],            pilotHint: "Capt. M. Clarke",  nurseHint: "C. Andrews RN",    doctorHint: "— None"         },
  { code: "TAS-D1",         base: "Launceston",  aircraft: ["VH-MQD", "VH-RFD"],            pilotHint: "Capt. T. Barnes",  nurseHint: "S. Mitchell RN",   doctorHint: "— None"         },
  { code: "TAS-D2",         base: "Launceston",  aircraft: ["VH-MQD", "VH-RFD"],            pilotHint: "Capt. R. Hughes",  nurseHint: "P. Wallace RN",    doctorHint: "— None"         },
  { code: "TAS-N1",         base: "Launceston",  aircraft: ["VH-MQD"],                      pilotHint: "Capt. S. Nguyen", nurseHint: "B. Foster RN",     doctorHint: "— None"         },
];

const MEDICAL_CATEGORIES = [
  "Cardiac", "Trauma", "Obstetric", "Paediatric", "Medical",
  "Humidicrib", "Bariatric", "Infectious Disease", "Neurological",
  "Respiratory", "Burns", "Psychiatric", "NETS", "ECMO",
];

const ALL_AIRCRAFT = [
  "VH-LTQ","VH-MVW","VH-MVX","VH-MWK","VH-MQD","VH-MQK",
  "VH-NAJ","VH-RFD","VH-XYJ","VH-XYO","VH-XYR","VH-XYU",
  "VH-VPQ","VH-MWH",
];

const ALL_PILOTS  = ["Capt. R. Hughes", "Capt. T. Barnes", "Capt. M. Clarke", "Capt. S. Nguyen", "Capt. L. Grant"];
const ALL_NURSES  = ["S. Mitchell RN", "J. O'Brien RN", "C. Andrews RN", "P. Wallace RN", "B. Foster RN", "— None"];
const ALL_DOCTORS = ["Dr. K. Patel", "Dr. A. Sharma", "— None"];

type CrewMode = "shift" | "manual";

interface AdditionalCrew {
  id: string;
  role: string;
  name: string;
}

interface CreatedMission {
  callsign: string;
  type: string;
  from: string;
  to: string;
  priority: string;
  aircraft: string;
  pilot: string;
  nurse: string;
  doctor: string;
  etd: string;
  additionalCrew: AdditionalCrew[];
  medCategory: string;
  gates: { label: string; ok: boolean }[];
}

export default function Dispatch({ role }: Props) {
  const [, navigate] = useLocation();
  const [missionType, setMissionType] = useState("Medivac");
  const [from, setFrom]               = useState("YSDU");
  const [to, setTo]                   = useState("YSSY");
  const [priority, setPriority]       = useState("P1");
  const [etd, setEtd]                 = useState("08:45");
  const [patientWeight, setPatientWeight] = useState("78");
  const [medCategory, setMedCategory] = useState("Cardiac");
  const [created, setCreated]         = useState<CreatedMission | null>(null);
  const [dispatched, setDispatched]   = useState<string | null>(null); // callsign after authorise

  // Dispatch mutation — registers the mission as active and records authorisation
  const dispatchMutation = useMutation({
    mutationFn: async (mission: CreatedMission) => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      await apiRequest('POST', '/api/missions/active', {
        missionId: mission.callsign,
        aircraft: mission.aircraft,
        airports: [mission.from, mission.to],
        pic: mission.pilot,
        missionType: mission.type,
        date: dateStr,
      });
      return mission.callsign;
    },
    onSuccess: (callsign) => {
      setDispatched(callsign);
      setCreated(null);
    },
  });

  // Crew assignment mode
  const [crewMode, setCrewMode]       = useState<CrewMode>("shift");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [shiftOpen, setShiftOpen]     = useState(false);

  // Individual crew fields (editable after shift auto-fill)
  const [aircraft, setAircraft] = useState("VH-XYR");
  const [pilot, setPilot]       = useState("Capt. T. Barnes");
  const [nurse, setNurse]       = useState("J. O'Brien RN");
  const [doctor, setDoctor]     = useState("— None");

  // Additional crew / escorts
  const [additionalCrew, setAdditionalCrew] = useState<AdditionalCrew[]>([]);

  // ── Shift selection ─────────────────────────────────────────────────────────
  function applyShift(code: string) {
    const shift = DAILY_SHIFTS.find(s => s.code === code);
    if (!shift) return;
    setSelectedShift(code);
    setAircraft(shift.aircraft[0] || aircraft);
    setPilot(shift.pilotHint);
    setNurse(shift.nurseHint);
    setDoctor(shift.doctorHint);
    // Auto-set departure ICAO from base
    const baseIcao: Record<string, string> = {
      "Broken Hill": "YBHI", "Dubbo": "YSDU",
      "Bankstown": "YSBK",   "Essendon": "YMEN",
      "Launceston": "YMLT",
    };
    if (baseIcao[shift.base]) setFrom(baseIcao[shift.base]);
    setShiftOpen(false);
  }

  // ── Additional crew ─────────────────────────────────────────────────────────
  function addCrewMember() {
    setAdditionalCrew(prev => [...prev, { id: crypto.randomUUID(), role: "Escort", name: "" }]);
  }
  function updateCrew(id: string, field: keyof AdditionalCrew, val: string) {
    setAdditionalCrew(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeCrew(id: string) {
    setAdditionalCrew(prev => prev.filter(c => c.id !== id));
  }

  // ── Create mission ──────────────────────────────────────────────────────────
  function handleCreate() {
    const num = String(Math.floor(Math.random() * 90) + 10);
    const callsign = `MEDIVAC ${num}`;
    setCreated({
      callsign, type: missionType, from, to, priority,
      aircraft, pilot, nurse, doctor, etd,
      additionalCrew,
      medCategory,
      gates: [
        { label: "Flight Plan Filed",    ok: false },
        { label: "W&B Calculated",       ok: true  },
        { label: "APG Release",          ok: false },
        { label: "Medical Crew Release", ok: false },
        { label: "Maintenance Release",  ok: true  },
        { label: "Fuel Confirmed",       ok: false },
      ],
    });
  }

  // ── Dispatched success view ──────────────────────────────────────────────
  if (dispatched) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
            <Send size={36} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Dispatch Authorised
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">All gates cleared — mission is live</p>
          </div>
          <div className="bg-card border border-green-500/30 rounded-xl px-8 py-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Callsign</div>
            <div className="text-3xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              {dispatched}
            </div>
            <div className="text-xs text-green-400 mt-2 font-semibold">● AIRBORNE — tracking active</div>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            Mission recorded in the Mission Board. All gate approvals logged to the CASA audit trail.
          </p>
        </div>
        <button
          onClick={() => { setDispatched(null); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl transition-colors text-sm"
        >
          <Plane size={15} /> Dispatch Another Mission
        </button>
      </div>
    );
  }

  // ── Created view ────────────────────────────────────────────────────────────
  if (created) {
    const allGreen = created.gates.every(g => g.ok);
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/15 border border-green-500/30">
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Mission Created</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Release gates initiated — crew notified</p>
          </div>
          <button
            onClick={() => setCreated(null)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-card border border-card-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} /> New Mission
          </button>
        </div>

        {/* Mission card */}
        <div className="bg-card border border-green-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{created.callsign}</div>
              <div className="text-sm text-muted-foreground">{created.type} · {created.from} → {created.to}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Medical: {created.medCategory}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                created.priority === "P1" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                created.priority === "P2" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                "bg-muted text-muted-foreground border border-border"
              }`}>{created.priority}</span>
              <span className="text-xs text-muted-foreground font-mono">ETD {created.etd}</span>
            </div>
          </div>

          {/* Core crew */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: "Aircraft", value: created.aircraft },
              { label: "Pilot",    value: created.pilot    },
              { label: "Nurse",    value: created.nurse    },
              { label: "Doctor",   value: created.doctor   },
            ].map(r => (
              <div key={r.label} className="bg-background/50 rounded-lg p-2.5">
                <div className="text-muted-foreground mb-0.5">{r.label}</div>
                <div className="font-semibold">{r.value}</div>
              </div>
            ))}
          </div>

          {/* Additional crew */}
          {created.additionalCrew.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Additional Crew / Escorts</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {created.additionalCrew.map(c => (
                  <div key={c.id} className="bg-background/50 rounded-lg p-2.5">
                    <div className="text-muted-foreground mb-0.5">{c.role}</div>
                    <div className="font-semibold">{c.name || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Release gates */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Release Gates — Complete all to enable dispatch
          </div>
          <div className="space-y-2">
            {created.gates.map((g, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                g.ok ? "bg-green-500/5 border-green-500/20" : "bg-card border-card-border"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  g.ok ? "bg-green-500/20 border border-green-500/30" : "bg-muted border border-border"
                }`}>
                  {g.ok
                    ? <CheckCircle size={13} className="text-green-400" />
                    : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
                </div>
                <span className="text-sm flex-1">{g.label}</span>
                {g.ok
                  ? <span className="text-xs text-green-400 font-semibold">Complete</span>
                  : <button
                      onClick={() => setCreated(prev => prev ? {
                        ...prev,
                        gates: prev.gates.map((gg, ii) => ii === i ? { ...gg, ok: true } : gg)
                      } : null)}
                      className="text-xs px-3 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 font-semibold rounded-lg transition-colors"
                    >
                      Mark Complete
                    </button>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch button */}
        <button
          disabled={!allGreen || dispatchMutation.isPending}
          onClick={() => dispatchMutation.mutate(created)}
          className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-semibold text-sm transition-colors ${
            allGreen && !dispatchMutation.isPending
              ? "bg-green-500 hover:bg-green-400 text-black cursor-pointer shadow-lg shadow-green-500/20"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          }`}
        >
          {dispatchMutation.isPending
            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Authorising...  </>
            : allGreen
              ? <><Plane size={16} /> Authorise Dispatch — All Gates Green</>
              : `⛔ Dispatch Locked — ${created.gates.filter(g => !g.ok).length} gate(s) outstanding`
          }
        </button>
        {dispatchMutation.isError && (
          <p className="text-xs text-red-400 text-center mt-1">
            Failed to record dispatch — please try again.
          </p>
        )}
      </div>
    );
  }

  // ── Active shift (for display after selection) ──────────────────────────────
  const activeShift = DAILY_SHIFTS.find(s => s.code === selectedShift);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Dispatch & Intake</h1>
        <p className="text-sm text-muted-foreground mt-0.5">New mission creation · Booking templates · Live route map</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Mission type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Mission Type</label>
            <div className="flex flex-wrap gap-2">
              {["Medivac", "NEPT", "ACC", "RAHS", "Dental", "Ferry", "Special"].map(t => (
                <button key={t} onClick={() => setMissionType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    missionType === t
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                      : "bg-card border-card-border text-muted-foreground hover:border-cyan-500/20"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Route + priority */}
          <div className="grid grid-cols-3 gap-3">
            <AirportSelect label="Departure" value={from} onChange={setFrom} />
            <AirportSelect label="Destination" value={to} onChange={setTo} />
            <FormField label="Priority" value={priority} onChange={setPriority} type="select" options={["P1","P2","P3","Routine"]} />
          </div>

          {/* ETD */}
          <div className="grid grid-cols-2 gap-3">
            <TimeInput24 label="ETD (local 24hr)" value={etd} onChange={setEtd} />
            <div /> {/* spacer */}
          </div>

          {/* ── Crew assignment ─────────────────────────────────────────────── */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            {/* Mode toggle */}
            <div className="flex border-b border-card-border">
              {(["shift", "manual"] as CrewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setCrewMode(m)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    crewMode === m
                      ? "bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "shift" ? "📋 Select Shift" : "✏️ Manual Entry"}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {crewMode === "shift" ? (
                <>
                  {/* Shift dropdown */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Daily Status — Shift</label>
                    <div className="relative">
                      <button
                        onClick={() => setShiftOpen(o => !o)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground hover:border-cyan-500/50 transition-colors"
                      >
                        <span>{selectedShift || "— Select a shift —"}</span>
                        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${shiftOpen ? "rotate-180" : ""}`} />
                      </button>
                      {shiftOpen && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                          {/* Group by base */}
                          {["Broken Hill","Dubbo","Bankstown","Essendon","Launceston"].map(base => {
                            const shifts = DAILY_SHIFTS.filter(s => s.base === base);
                            return (
                              <div key={base}>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-slate-900/60 border-b border-slate-700">
                                  {base}
                                </div>
                                {shifts.map(s => (
                                  <button
                                    key={s.code}
                                    onClick={() => applyShift(s.code)}
                                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-cyan-500/10 transition-colors flex items-center justify-between gap-3 ${
                                      selectedShift === s.code ? "bg-cyan-500/10 text-cyan-400" : "text-foreground"
                                    }`}
                                  >
                                    <span className="font-mono font-semibold text-xs">{s.code}</span>
                                    <span className="text-xs text-muted-foreground truncate">{s.aircraft[0]} · {s.pilotHint}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auto-filled crew preview */}
                  {activeShift && (
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                      <div className="text-xs text-cyan-400 font-semibold mb-2">
                        Pulled from daily status — {activeShift.base}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Aircraft</span><div className="font-mono font-semibold">{aircraft}</div></div>
                        <div><span className="text-muted-foreground">Pilot</span><div className="font-semibold">{pilot}</div></div>
                        <div><span className="text-muted-foreground">Nurse</span><div className="font-semibold">{nurse}</div></div>
                        <div><span className="text-muted-foreground">Doctor</span><div className="font-semibold">{doctor}</div></div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">Switch to Manual Entry to override individual fields</p>
                    </div>
                  )}

                  {!activeShift && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Select a shift above to auto-fill aircraft and crew from the daily status
                    </p>
                  )}
                </>
              ) : (
                /* Manual entry fields */
                <div className="space-y-3">
                  <FormField label="Aircraft" value={aircraft} onChange={setAircraft} type="select" options={ALL_AIRCRAFT} />
                  <div className="grid grid-cols-1 gap-3">
                    <FormField label="Pilot in Command" value={pilot} onChange={setPilot} type="select" options={ALL_PILOTS} />
                    <FormField label="Flight Nurse"      value={nurse} onChange={setNurse} type="select" options={ALL_NURSES} />
                    <FormField label="Flight Doctor"     value={doctor} onChange={setDoctor} type="select" options={ALL_DOCTORS} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Additional crew / escorts ────────────────────────────────────── */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Additional Crew / Escorts
              </div>
              <button
                onClick={addCrewMember}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
              >
                <UserPlus size={12} /> Add
              </button>
            </div>

            {additionalCrew.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No additional crew — click Add for perfusionists, escorts, observers, or second nurses
              </p>
            ) : (
              <div className="space-y-2">
                {additionalCrew.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <select
                      value={c.role}
                      onChange={e => updateCrew(c.id, "role", e.target.value)}
                      className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-cyan-500/50 w-36 flex-shrink-0"
                    >
                      <option>Escort</option>
                      <option>Second Nurse</option>
                      <option>Flight Doctor</option>
                      <option>Perfusionist</option>
                      <option>Medical Observer</option>
                      <option>Interpreter</option>
                      <option>Family Member</option>
                      <option>Carer</option>
                      <option>Other</option>
                    </select>
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => updateCrew(c.id, "name", e.target.value)}
                      placeholder="Full name"
                      className="flex-1 text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={() => removeCrew(c.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Patient details ─────────────────────────────────────────────── */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Patient Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Patient Weight (kg)</label>
                <input
                  value={patientWeight}
                  onChange={e => setPatientWeight(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50"
                  type="number"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Medical Category</label>
                <select
                  value={medCategory}
                  onChange={e => setMedCategory(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50"
                >
                  {MEDICAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Special category notices */}
            {medCategory === "Humidicrib" && (
              <div className="mt-3 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2">
                ⚠️ Humidicrib transport — confirm NETS team availability and incubator power supply
              </div>
            )}
            {medCategory === "Bariatric" && (
              <div className="mt-3 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2">
                ⚠️ Bariatric — confirm aircraft stretcher rating and W&B with APG before dispatch
              </div>
            )}
            {medCategory === "Infectious Disease" && (
              <div className="mt-3 text-xs text-red-300 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                🔴 Infectious Disease — isolation protocol required. Confirm PPE, decontamination plan, and receiving facility clearance
              </div>
            )}
            {medCategory === "ECMO" && (
              <div className="mt-3 text-xs text-purple-300 bg-purple-900/20 border border-purple-700/40 rounded-lg px-3 py-2">
                🟣 ECMO — perfusionist required. Add via Additional Crew above. Confirm circuit check and receiving ICU
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={!from || !to || !aircraft || !pilot}
            className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-500 text-background rounded-xl font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Radio size={16} /> Create Mission & Begin Release Checks
          </button>
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route map */}
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <MapPin size={14} className="text-cyan-400" />
              <span className="text-xs font-semibold">Live Route Map</span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{from} → {to}</span>
            </div>
            <div className="relative h-56 bg-gradient-to-br from-background to-cyan-950/20 flex items-center justify-center">
              <svg viewBox="0 0 300 200" className="absolute inset-0 w-full h-full opacity-30">
                <path d="M40,160 Q80,80 150,100 Q220,120 260,60" stroke="#22d3ee" strokeWidth="2" fill="none" strokeDasharray="6,3" />
                <circle cx="40" cy="160" r="5" fill="#22d3ee" />
                <circle cx="260" cy="60" r="5" fill="#f97316" />
                <text x="40" y="178" fontSize="10" fill="#22d3ee" textAnchor="middle">{from}</text>
                <text x="260" y="50" fontSize="10" fill="#f97316" textAnchor="middle">{to}</text>
              </svg>
              <div className="relative z-10 text-xs text-muted-foreground text-center">
                <div className="text-cyan-400 font-semibold mb-1">NSW Route Overlay</div>
                <div>~580 nm · Est. 2h 10m</div>
              </div>
            </div>
          </div>

          {/* W&B quick check */}
          <div className="bg-card rounded-xl border border-orange-500/20 p-4">
            <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} /> King Air W&B Pre-check
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "Fuel load",      value: "2,000 lb", ok: true },
                { label: "Est. ramp wt",   value: "12,840 lb", ok: true },
                { label: "MTOW limit",     value: "13,500 lb", ok: true },
                { label: "Margin",         value: "660 lb",   ok: true },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-mono font-semibold ${r.ok ? "text-green-400" : "text-red-400"}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle size={12} /> W&B within limits · APG release required
            </div>
          </div>

          {/* Shift status summary — shows when shift selected */}
          {activeShift && (
            <div className="bg-card border border-cyan-500/20 rounded-xl p-4">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Shift: {activeShift.code}
              </div>
              <div className="text-xs text-muted-foreground mb-2">Base: {activeShift.base}</div>
              <div className="text-xs text-muted-foreground">
                Available aircraft: {activeShift.aircraft.join(", ")}
              </div>
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                <CheckCircle size={11} /> Pulled from daily status
              </div>
            </div>
          )}

          {/* ── Unplanned overnight / AOG shortcut ──────────────────────── */}
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Moon size={11} /> Unplanned Overnight
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Use the <strong className="text-foreground">Crew Rest Calculator</strong> when an
              unplanned overnight occurs — AOG, FDP limit reached, weather diversion, or Dispatcher
              direction. It calculates minimum rest, earliest departure, and curfew status instantly.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/rest-calculator")}
                className="flex items-center justify-center gap-1.5 text-[10px] font-semibold py-2 rounded-lg text-white"
                style={{ backgroundColor: "#01696F" }}
                data-testid="button-aog-rest-calc"
              >
                <Wrench size={11} /> AOG Overnight
              </button>
              <button
                onClick={() => navigate("/rest-calculator")}
                className="flex items-center justify-center gap-1.5 text-[10px] font-semibold py-2 rounded-lg border border-orange-400/40 text-orange-300 bg-orange-500/8"
                data-testid="button-fdp-rest-calc"
              >
                <Moon size={11} /> FDP Exceeded
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────
function FormField({ label, value, onChange, type, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type: "text" | "select"; options?: string[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      {type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50">
          {options?.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} type="text"
          placeholder={placeholder}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50" />
      )}
    </div>
  );
}

function TimeInput24({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [raw, setRaw] = useState(value);
  function handleBlur() {
    const match = raw.replace(":", "").match(/^(\d{1,2})(\d{2})?$/);
    if (match) {
      const hh = match[1].padStart(2, "0");
      const mm = (match[2] || "00").padStart(2, "0");
      if (parseInt(hh) <= 23 && parseInt(mm) <= 59) {
        const norm = `${hh}:${mm}`;
        setRaw(norm); onChange(norm); return;
      }
    }
  }
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      <input
        type="text" inputMode="numeric" value={raw} maxLength={5} placeholder="HH:MM"
        onChange={e => { setRaw(e.target.value); onChange(e.target.value); }}
        onBlur={handleBlur}
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50 font-mono"
      />
    </div>
  );
}

// ── ERSA Airport Selector ─────────────────────────────────────────────────────
function AirportSelect({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const grouped: Record<string, ERSAAerodrome[]> = {};
  ERSA_AERODROMES.forEach(a => {
    if (!grouped[a.state]) grouped[a.state] = [];
    grouped[a.state].push(a);
  });
  const states = Object.keys(grouped).sort();
  const selected = getAerodrome(value);
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50"
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
      {selected?.warning && (
        <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          ⚠️ {selected.warning}
        </div>
      )}
      {selected?.nswaaNote && (
        <div className="mt-1.5 text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 leading-relaxed">
          🦘 NSWAA: {selected.nswaaNote}
        </div>
      )}
    </div>
  );
}
