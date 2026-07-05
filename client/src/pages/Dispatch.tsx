import { useState } from "react";
import { type UserRole } from "@/lib/data";
import { Radio, MapPin, AlertTriangle, CheckCircle, X, Plane } from "lucide-react";

interface Props { role: UserRole; }

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
  gates: { label: string; ok: boolean }[];
}

export default function Dispatch({ role }: Props) {
  const [missionType, setMissionType] = useState("Medevac");
  const [from, setFrom] = useState("YSDU");
  const [to, setTo] = useState("YSSY");
  const [priority, setPriority] = useState("P1");
  const [aircraft, setAircraft] = useState("VH-XYR");
  const [pilot, setPilot] = useState("Capt. T. Barnes");
  const [nurse, setNurse] = useState("J. O'Brien RN");
  const [doctor, setDoctor] = useState("— None");
  const [etd, setEtd] = useState("08:45");
  const [patientWeight, setPatientWeight] = useState("78");
  const [medCategory, setMedCategory] = useState("Cardiac");
  const [created, setCreated] = useState<CreatedMission | null>(null);

  function handleCreate() {
    const num = String(Math.floor(Math.random() * 90) + 10);
    const callsign = `MEDIVAC ${num}`;
    setCreated({
      callsign,
      type: missionType,
      from,
      to,
      priority,
      aircraft,
      pilot,
      nurse,
      doctor,
      etd,
      gates: [
        { label: "Flight Plan Filed", ok: false },
        { label: "W&B Calculated", ok: true },
        { label: "APG Release", ok: false },
        { label: "Medical Crew Release", ok: false },
        { label: "Maintenance Release", ok: true },
        { label: "Fuel Confirmed", ok: false },
      ],
    });
  }

  if (created) {
    return (
      <div className="p-6 space-y-6">
        {/* Success header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/15 border border-green-500/30">
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Mission Created</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Release gates initiated — crew notified</p>
          </div>
          <button onClick={() => setCreated(null)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-card border border-card-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
            <X size={12} /> New Mission
          </button>
        </div>

        {/* Mission card */}
        <div className="bg-card border border-green-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{created.callsign}</div>
              <div className="text-sm text-muted-foreground">{created.type} · {created.from} → {created.to}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                created.priority === 'P1' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                created.priority === 'P2' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-muted text-muted-foreground border border-border'
              }`}>{created.priority}</span>
              <span className="text-xs text-muted-foreground">ETD {created.etd}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Aircraft', value: created.aircraft },
              { label: 'Pilot', value: created.pilot },
              { label: 'Nurse', value: created.nurse },
              { label: 'Doctor', value: created.doctor },
            ].map(r => (
              <div key={r.label} className="bg-background/50 rounded-lg p-2.5">
                <div className="text-muted-foreground mb-0.5">{r.label}</div>
                <div className="font-semibold">{r.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Release gates */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Release Gates — Complete all to enable dispatch</div>
          <div className="space-y-2">
            {created.gates.map((g, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                g.ok ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-card-border'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  g.ok ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted border border-border'
                }`}>
                  {g.ok
                    ? <CheckCircle size={13} className="text-green-400" />
                    : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
                </div>
                <span className="text-sm flex-1">{g.label}</span>
                {g.ok
                  ? <span className="text-xs text-green-400 font-semibold">Complete</span>
                  : g.isORA
                    ? <Link href="/ora">
                        <a className="text-xs px-3 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                          <ClipboardList size={11} /> Open ORA
                        </a>
                      </Link>
                    : <button
                        onClick={() => setCreated(prev => prev ? {
                          ...prev,
                          gates: prev.gates.map((gg, ii) => ii === i ? { ...gg, ok: true } : gg)
                        } : null)}
                        className="text-xs px-3 py-1 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 font-semibold rounded-lg transition-colors">
                        Mark Complete
                      </button>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch button — locks if any gate incomplete */}
        {(() => {
          const allGreen = created.gates.every(g => g.ok);
          return (
            <button
              disabled={!allGreen}
              className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-semibold text-sm transition-colors ${
                allGreen
                  ? 'bg-green-500 hover:bg-green-400 text-black cursor-pointer shadow-lg shadow-green-500/20'
                  : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
              }`}>
              {allGreen ? <><Plane size={16} /> Authorise Dispatch — All Gates Green</> : `⛔ Dispatch Locked — ${created.gates.filter(g => !g.ok).length} gate(s) outstanding`}
            </button>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>Dispatch & Intake</h1>
        <p className="text-sm text-muted-foreground mt-0.5">New mission creation · Booking templates · Live route map</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mission type selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Mission Type</label>
            <div className="flex flex-wrap gap-2">
              {['Medevac', 'NEPT', 'ACC', 'RAHS', 'Dental', 'Ferry', 'Special'].map(t => (
                <button key={t} onClick={() => setMissionType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${missionType === t ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-card border-card-border text-muted-foreground hover:border-cyan-500/20'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority" value={priority} onChange={setPriority} type="select"
              options={['P1', 'P2', 'P3', 'Routine']} />
            <FormField label="Aircraft" value={aircraft} onChange={setAircraft} type="select"
              options={['VH-LTQ','VH-MVW','VH-MVX','VH-MWH','VH-MWK','VH-RFD','VH-XYJ','VH-XYO','VH-XYR','VH-XYU','VH-MQD','VH-MQK','VH-NAJ','VH-VPQ']} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Departure ICAO" value={from} onChange={setFrom} type="text" placeholder="e.g. YSDU" />
            <FormField label="Destination ICAO" value={to} onChange={setTo} type="text" placeholder="e.g. YSSY" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="ETD" value={etd} onChange={setEtd} type="time" />
            <FormField label="Pilot in Command" value={pilot} onChange={setPilot} type="select"
              options={['Capt. R. Hughes', 'Capt. T. Barnes', 'Capt. M. Clarke']} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Flight Nurse" value={nurse} onChange={setNurse} type="select"
              options={["S. Mitchell RN", "J. O'Brien RN", "— None"]} />
            <FormField label="Flight Doctor" value={doctor} onChange={setDoctor} type="select"
              options={["Dr. K. Patel", "— None"]} />
          </div>

          {/* Patient info */}
          <div className="p-4 bg-card rounded-xl border border-card-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Patient Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Patient Weight (kg)</label>
                <input value={patientWeight} onChange={e => setPatientWeight(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50" type="number" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Medical Category</label>
                <select value={medCategory} onChange={e => setMedCategory(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50">
                  <option>Cardiac</option><option>Trauma</option><option>Obstetric</option><option>Paediatric</option><option>Medical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleCreate} className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-500 text-background rounded-xl font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20">
            <Radio size={16} /> Create Mission & Begin Release Checks
          </button>
        </div>

        {/* Route map placeholder + weight note */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <MapPin size={14} className="text-cyan-400" />
              <span className="text-xs font-semibold">Live Route Map</span>
              <span className="ml-auto text-xs text-muted-foreground">{from} → {to}</span>
            </div>
            {/* SVG map placeholder */}
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
              <AlertTriangle size={12} />King Air W&B Pre-check
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Fuel load', value: '2,000 lb', ok: true },
                { label: 'Est. ramp weight', value: '12,840 lb', ok: true },
                { label: 'MTOW limit', value: '13,500 lb', ok: true },
                { label: 'Margin', value: '660 lb', ok: true },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-mono font-semibold ${r.ok ? 'text-green-400' : 'text-red-400'}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle size={12} />W&B within limits · APG release required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type: 'text' | 'select' | 'time'; options?: string[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50">
          {options?.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} type={type === 'time' ? 'time' : 'text'}
          placeholder={placeholder}
          className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-cyan-500/50" />
      )}
    </div>
  );
}
