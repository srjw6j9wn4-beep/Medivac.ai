import { useState } from "react";
import { MISSIONS, type UserRole } from "@/lib/data";
import { CheckCircle, AlertTriangle, Plane, Clock, User, ChevronDown, ChevronUp, Plus } from "lucide-react";

interface Props { role: UserRole; }

export default function MissionBoard({ role }: Props) {
  const [selected, setSelected] = useState<string | null>('M001');

  const mission = MISSIONS.find(m => m.id === selected);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{fontFamily: "'Cabinet Grotesk', sans-serif"}}>Mission Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{MISSIONS.length} missions today · {MISSIONS.filter(m=>m.status==='Active'||m.status==='Airborne').length} active</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/25 transition-colors">
          <Plus size={14} /> New Mission
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mission list */}
        <div className="space-y-2">
          {MISSIONS.map(m => (
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
                <span className="text-xs text-muted-foreground">{m.type} · {m.aircraft}</span>
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
    </div>
  );
}
