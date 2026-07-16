import { useState } from "react";
import { MISSIONS, type UserRole } from "@/lib/data";
import { CheckCircle, AlertTriangle, Plane, Clock, User, ChevronDown, ChevronUp, Plus, X } from "lucide-react";

interface Props { role: UserRole; }

const BLANK_MISSION = {
  callsign: "", type: "Medivac", priority: "P1",
  from: "", to: "", etd: "", aircraft: "", pilot: "", nurse: "", doctor: "", notes: "",
};

const MISSION_TYPES = ["Medivac","NEPT","ACC","Dental","Ferry","Charter","Special"];
const PRIORITIES    = ["P1","P2","P3","Routine"];
const AIRCRAFT_LIST = ["VH-MVW","VH-MWH","VH-MWK","VH-MQD","VH-MVX","VH-XYJ","VH-XYR","VH-NAJ","VH-LTQ","VH-RFD","VH-XYO","VH-MQK"];

export default function MissionBoard({ role }: Props) {
  const [selected, setSelected]   = useState<string | null>('M001');
  const [showNew, setShowNew]     = useState(false);
  const [form, setForm]           = useState({ ...BLANK_MISSION });
  const [missions, setMissions]   = useState(MISSIONS);
  const [saved, setSaved]         = useState(false);

  const mission = missions.find(m => m.id === selected);

  const statusColor: Record<string, string> = {
    Active: 'status-blue', Airborne: 'status-green', Pending: 'status-yellow',
    Complete: 'status-gray', Cancelled: 'status-red',
  };
  const isActiveMission = (s: string) => s === 'Active' || s === 'Airborne' || s === 'Pending';
  const priorityColor: Record<string, string> = {
    P1:      'bg-red-500/30    text-red-200    border border-red-400/70    font-bold',
    P2:      'bg-orange-500/30 text-orange-200 border border-orange-400/70 font-bold',
    P3:      'bg-yellow-500/30 text-yellow-200 border border-yellow-400/70 font-bold',
    Routine: 'bg-gray-500/25   text-gray-200   border border-gray-400/50   font-semibold',
  };

  function handleCreate() {
    if (!form.callsign || !form.from || !form.to || !form.aircraft) return;
    const newId = `M${String(missions.length + 1).padStart(3,'0')}`;
    const newMission = {
      id: newId,
      callsign: form.callsign.toUpperCase(),
      type: form.type,
      status: "Pending" as const,
      priority: form.priority as any,
      from: form.from.toUpperCase(),
      to: form.to.toUpperCase(),
      etd: form.etd || "TBD",
      eta: "TBD",
      aircraft: form.aircraft,
      pilot: form.pilot || "TBA",
      nurse: form.nurse || undefined,
      doctor: form.doctor || undefined,
      releaseGates: [
        { label: "Flight Plan Filed",      ok: false },
        { label: "W&B Calculated",         ok: false },
        { label: "APG Release",            ok: false },
        { label: "Medical Crew Release",   ok: false },
        { label: "Maintenance Release",    ok: false },
        { label: "Fuel Confirmed",         ok: false },
      ],
    };
    setMissions(prev => [newMission as any, ...prev]);
    setSelected(newId);
    setForm({ ...BLANK_MISSION });
    setShowNew(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const F = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50 text-foreground" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{fontFamily: "'Cabinet Grotesk', sans-serif"}}>Mission Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{missions.length} missions today · {missions.filter(m=>m.status==='Active'||m.status==='Airborne').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400 font-semibold">✓ Mission created</span>}
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-3 py-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/25 transition-colors">
            <Plus size={14} /> New Mission
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mission list */}
        <div className="space-y-2">
          {missions.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              data-testid={`mission-${m.id}`}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected === m.id
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-card border-card-border hover:border-cyan-500/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-cyan-400" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>{m.callsign}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[m.status]}${isActiveMission(m.status) ? ' mission-status-active' : ''}`}>{m.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">{m.from} → {m.to}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityColor[m.priority]}`}>{m.priority}</span>
                <span className="text-xs text-muted-foreground">
                  {m.type === 'Ferry' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-500/15 text-violet-300 border border-violet-500/30 mr-1"><Plane size={9} />Ferry</span>
                  ) : null}
                  {m.type !== 'Ferry' && m.type} · {m.aircraft}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Mission detail */}
        {mission && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-card-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-cyan-400" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>{mission.callsign}</h2>
                  <div className="text-sm text-muted-foreground">{mission.type} · {mission.aircraft}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusColor[mission.status]}${isActiveMission(mission.status) ? ' mission-status-active' : ''}`}>{mission.status}</span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-4 mb-5 p-3 bg-background rounded-lg border border-border">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>{mission.from}</div>
                  <div className="text-xs text-muted-foreground">Departure</div>
                  <div className="text-xs text-cyan-400 font-medium">ETD {mission.etd}</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-px border-t border-dashed border-border" />
                  <Plane size={16} className="text-cyan-400 flex-shrink-0" />
                  <div className="flex-1 h-px border-t border-dashed border-border" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>{mission.to}</div>
                  <div className="text-xs text-muted-foreground">Destination</div>
                  <div className="text-xs text-green-400 font-medium">ETA {mission.eta}</div>
                </div>
              </div>

              {/* Crew */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assigned Crew</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Pilot in Command', value: mission.pilot },
                    ...(mission.nurse ? [{ label: 'Flight Nurse', value: mission.nurse }] : []),
                    ...(mission.doctor ? [{ label: 'Flight Doctor', value: mission.doctor }] : []),
                  ].map(c => (
                    <div key={c.label} className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground w-32 flex-shrink-0">{c.label}</span>
                      <span className="font-medium">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Release gates */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dispatch Release Gates</h3>
                <div className="grid grid-cols-2 gap-2">
                  {mission.releaseGates.map((g, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                      g.ok
                        ? 'bg-green-500/5 border-green-500/20 text-green-400'
                        : 'bg-orange-500/5 border-orange-500/30 text-orange-400'
                    }`}>
                      {g.ok
                        ? <CheckCircle size={14} className="flex-shrink-0" />
                        : <AlertTriangle size={14} className="flex-shrink-0" />}
                      <span>{g.label}</span>
                    </div>
                  ))}
                </div>
                {mission.releaseGates.every(g => g.ok) ? (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle size={16} /> Mission Released — All gates satisfied
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> Dispatch Blocked — {mission.releaseGates.filter(g=>!g.ok).length} gate(s) incomplete
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── New Mission Modal ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="text-base font-bold text-white" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>New Mission</h2>
              <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <F label="Callsign *" value={form.callsign} onChange={v => setForm(f=>({...f,callsign:v}))} placeholder="e.g. MEDIVAC 06" />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Priority *</label>
                  <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Mission Type *</label>
                  <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                    {MISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Aircraft *</label>
                  <select value={form.aircraft} onChange={e => setForm(f=>({...f,aircraft:e.target.value}))}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                    <option value="">Select aircraft</option>
                    {AIRCRAFT_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Departure (ICAO) *" value={form.from} onChange={v => setForm(f=>({...f,from:v}))} placeholder="e.g. YSDU" />
                <F label="Destination (ICAO) *" value={form.to} onChange={v => setForm(f=>({...f,to:v}))} placeholder="e.g. YSSY" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="ETD (HH:MM)" value={form.etd} onChange={v => setForm(f=>({...f,etd:v}))} placeholder="e.g. 08:30" />
                <F label="Pilot in Command" value={form.pilot} onChange={v => setForm(f=>({...f,pilot:v}))} placeholder="e.g. Capt. J. Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Flight Nurse" value={form.nurse} onChange={v => setForm(f=>({...f,nurse:v}))} placeholder="e.g. S. Mitchell RN" />
                <F label="Flight Doctor" value={form.doctor} onChange={v => setForm(f=>({...f,doctor:v}))} placeholder="Optional" />
              </div>
              {(!form.callsign || !form.from || !form.to || !form.aircraft) && (
                <p className="text-xs text-amber-400">* Callsign, departure, destination and aircraft are required.</p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowNew(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-slate-600 hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate}
                  disabled={!form.callsign || !form.from || !form.to || !form.aircraft}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-700 hover:bg-cyan-600 text-white transition-colors disabled:opacity-40">
                  Create Mission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
