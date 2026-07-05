import { useState } from "react";
import { MISSIONS, AIRCRAFT, NSW_AIRPORTS, type UserRole } from "@/lib/data";
import { Plane, Radio, MapPin, AlertTriangle, Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { role: UserRole; }

const ROUTES = [
  { from: { x: 52, y: 48 }, to: { x: 82, y: 68 }, mission: 'M001', status: 'Active', color: '#f97316' },
  { from: { x: 18, y: 44 }, to: { x: 72, y: 78 }, mission: 'M002', status: 'Pending', color: '#facc15' },
  { from: { x: 52, y: 48 }, to: { x: 44, y: 38 }, mission: 'M003', status: 'Complete', color: '#22d3ee' },
  { from: { x: 44, y: 32 }, to: { x: 52, y: 48 }, mission: 'M004', status: 'Airborne', color: '#4ade80' },
];

const AIRPORT_POSITIONS: Record<string, { x: number; y: number }> = {
  YSDU: { x: 52, y: 48 },  // Dubbo — centre
  YBHI: { x: 18, y: 44 },  // Broken Hill — west
  YMLT: { x: 72, y: 82 },  // Launceston — Tasmania
  YSSY: { x: 82, y: 68 },  // Sydney — east coast
  YWLG: { x: 44, y: 32 },  // Walgett — north
  YMOR: { x: 56, y: 28 },  // Moree — north-east
  YDYS: { x: 50, y: 72 },  // Deniliquin — south
  YNAR: { x: 50, y: 48 },  // Narromine
  YCOR: { x: 32, y: 44 },  // Cobar
  YLHI: { x: 94, y: 44 },  // Lord Howe Island
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-orange-400',
  Airborne: 'text-cyan-400',
  Pending: 'text-yellow-400',
  Complete: 'text-green-400',
  Cancelled: 'text-red-400',
};

export default function FlightMap({ role }: Props) {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);

  const selected = MISSIONS.find(m => m.id === selectedMission);
  const activeMissions = MISSIONS.filter(m => m.status === 'Active' || m.status === 'Airborne');

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>NSW Flight Map</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live operational picture · RFDS SE Section airspace</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map panel */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2">
            <Navigation size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">NSW / VIC Operational Zone</span>
          </div>
          <div className="relative bg-slate-900/60" style={{ paddingBottom: '65%' }}>
            <svg
              viewBox="0 0 100 65"
              className="absolute inset-0 w-full h-full"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.03) 0%, transparent 70%)' }}
            >
              {/* Grid lines */}
              {[20, 40, 60, 80].map(x => (
                <line key={`vg${x}`} x1={x} y1="0" x2={x} y2="65" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
              ))}
              {[13, 26, 39, 52].map(y => (
                <line key={`hg${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
              ))}

              {/* Flight routes */}
              {ROUTES.map(r => (
                <g key={r.mission}>
                  <line
                    x1={r.from.x} y1={r.from.y} x2={r.to.x} y2={r.to.y}
                    stroke={r.color}
                    strokeWidth={selectedMission === r.mission ? "0.8" : "0.4"}
                    strokeDasharray={r.status === 'Airborne' ? "none" : "1,1"}
                    opacity={r.status === 'Complete' ? 0.3 : 0.7}
                  />
                  {/* Animated aircraft dot for airborne */}
                  {r.status === 'Airborne' && (
                    <circle r="0.8" fill={r.color}>
                      <animateMotion
                        dur="8s"
                        repeatCount="indefinite"
                        path={`M${r.from.x},${r.from.y} L${r.to.x},${r.to.y}`}
                      />
                    </circle>
                  )}
                </g>
              ))}

              {/* Airports */}
              {NSW_AIRPORTS.map(ap => {
                const pos = AIRPORT_POSITIONS[ap.icao];
                if (!pos) return null;
                const isBase = ap.icao === 'YSDU' || ap.icao === 'YBHI' || ap.icao === 'YMLT';
                const isHovered = hoveredAirport === ap.icao;
                return (
                  <g key={ap.icao}
                    onMouseEnter={() => setHoveredAirport(ap.icao)}
                    onMouseLeave={() => setHoveredAirport(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isBase && (
                      <circle cx={pos.x} cy={pos.y} r="2.5" fill="rgba(34,211,238,0.1)" stroke="rgba(34,211,238,0.3)" strokeWidth="0.3" />
                    )}
                    <circle
                      cx={pos.x} cy={pos.y}
                      r={isBase ? "1.2" : "0.8"}
                      fill={isBase ? "#22d3ee" : "#64748b"}
                      stroke={isHovered ? "#fff" : "none"}
                      strokeWidth="0.3"
                    />
                    <text
                      x={pos.x + 1.8} y={pos.y + 0.8}
                      fontSize="2.2"
                      fill={isBase ? "#22d3ee" : "#94a3b8"}
                      fontFamily="monospace"
                      fontWeight={isBase ? "bold" : "normal"}
                    >
                      {ap.icao}
                    </text>
                    {isHovered && (
                      <text x={pos.x + 1.8} y={pos.y + 3.2} fontSize="1.8" fill="#e2e8f0">
                        {ap.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1">
              {[
                { color: 'bg-cyan-400', label: 'Airborne' },
                { color: 'bg-orange-400', label: 'Active' },
                { color: 'bg-yellow-400', label: 'Pending' },
                { color: 'bg-green-400', label: 'Complete' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-0.5 ${l.color} rounded`} />
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Active missions */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Missions</h2>
            <div className="space-y-2">
              {MISSIONS.filter(m => m.status !== 'Complete' && m.status !== 'Cancelled').map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMission(selectedMission === m.id ? null : m.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedMission === m.id
                      ? "bg-cyan-500/10 border-cyan-500/30"
                      : "bg-card border-card-border hover:border-cyan-500/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground font-mono">{m.callsign}</span>
                    <span className={cn("text-xs font-semibold", STATUS_COLORS[m.status])}>{m.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{m.from}</span>
                    <span>→</span>
                    <span className="font-mono">{m.to}</span>
                    <span className="ml-auto">{m.etd}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.aircraft} · {m.priority}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected mission detail */}
          {selected && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{selected.callsign} — Detail</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Aircraft</span><div className="font-mono text-foreground">{selected.aircraft}</div></div>
                <div><span className="text-muted-foreground">Priority</span><div className="font-semibold text-foreground">{selected.priority}</div></div>
                <div><span className="text-muted-foreground">ETD</span><div className="font-mono text-foreground">{selected.etd}</div></div>
                <div><span className="text-muted-foreground">ETA</span><div className="font-mono text-foreground">{selected.eta}</div></div>
                <div><span className="text-muted-foreground">Pilot</span><div className="text-foreground">{selected.pilot}</div></div>
                {selected.nurse && <div><span className="text-muted-foreground">Nurse</span><div className="text-foreground">{selected.nurse}</div></div>}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Release Gates</div>
                <div className="flex flex-wrap gap-1">
                  {selected.releaseGates.map(g => (
                    <span key={g.label} className={cn("text-[10px] px-1.5 py-0.5 rounded border", g.ok ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                      {g.ok ? '✓' : '✗'} {g.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fleet position */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fleet Position</h2>
            <div className="space-y-1.5">
              {AIRCRAFT.map(ac => (
                <div key={ac.rego} className="flex items-center gap-2 p-2 bg-card border border-card-border rounded-lg">
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                    ac.status === 'Airborne' ? 'bg-cyan-400 animate-pulse' :
                    ac.status === 'Serviceable' ? 'bg-green-400' :
                    'bg-orange-400'
                  )} />
                  <span className="text-xs font-mono font-semibold text-foreground">{ac.rego}</span>
                  <span className="text-xs text-muted-foreground truncate">{ac.base.split('(')[0].trim()}</span>
                  <span className={cn("ml-auto text-xs", ac.status === 'Airborne' ? 'text-cyan-400' : ac.status === 'Serviceable' ? 'text-green-400' : 'text-orange-400')}>{ac.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
