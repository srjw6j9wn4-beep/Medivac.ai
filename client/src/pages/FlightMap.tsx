import { useState, useEffect } from "react";
import { MISSIONS, AIRCRAFT, NSW_AIRPORTS, type UserRole } from "@/lib/data";
import { Navigation, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { role: UserRole; }

const STATUS_COLORS: Record<string, string> = {
  Active:    'text-orange-400',
  Airborne:  'text-cyan-400',
  Pending:   'text-yellow-400',
  Complete:  'text-green-400',
  Cancelled: 'text-red-400',
};

export default function FlightMap({ role }: Props) {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen]       = useState(false);
  const [showAllAircraft, setShowAllAircraft] = useState(false);

  const selected       = MISSIONS.find(m => m.id === selectedMission);
  const activeMissions = MISSIONS.filter(m => m.status !== 'Complete' && m.status !== 'Cancelled');

  function toggleFullscreen() { setIsFullscreen(f => !f); }

  // Escape key exits fullscreen
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // ── Map panel (iframe — works in all sandbox/iframe environments) ─────────
  function MapPanel({ compact = false }: { compact?: boolean }) {
    const h = compact ? "400px" : "500px";
    return (
      <div className={cn(
        "bg-card border border-card-border rounded-xl overflow-hidden flex flex-col",
        compact ? "h-full" : ""
      )}>
        {/* Toolbar */}
        <div className="px-4 py-2.5 border-b border-card-border flex items-center gap-2 flex-shrink-0">
          <Navigation size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
            NSW / VIC Operational Zone
          </span>
          <span className="text-[10px] text-muted-foreground mr-2 hidden sm:block">
            Scroll to zoom · Drag to pan
          </span>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-white/5 text-cyan-400 hover:text-cyan-300 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* OSM iframe — no Leaflet, works in all iframe environments */}
        <div className="relative" style={{ height: h }}>
          <iframe
            title="NSW Operational Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=140.9,-37.5,153.6,-28.0&layer=mapnik"
            style={{ width: "100%", height: h, border: 0, display: "block" }}
            loading="lazy"
          />
          {/* RFDS base overlays */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none">
            {NSW_AIRPORTS
              .filter(a => a.icao === 'YSDU' || a.icao === 'YBHI' || a.icao === 'YSBK')
              .map(base => (
                <div key={base.icao} className="bg-cyan-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  ✈ {base.icao} — {base.name}
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Right sidebar ─────────────────────────────────────────────────────────
  function SidePanel() {
    return (
      <div className="space-y-3">
        {/* Active missions */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Missions</h2>
          <div className="space-y-2">
            {activeMissions.map(m => (
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
                  <span className="ml-auto font-mono">{m.etd}</span>
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
                  <span key={g.label} className={cn("text-[10px] px-1.5 py-0.5 rounded border",
                    g.ok ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                    {g.ok ? '✓' : '✗'} {g.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fleet position */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fleet Position</h2>
            <button
              onClick={() => setShowAllAircraft(b => !b)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${
                showAllAircraft ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-card-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {showAllAircraft ? 'All A/C' : 'On Ground'}
            </button>
          </div>
          <div className="space-y-1.5">
            {AIRCRAFT.filter(ac => showAllAircraft || ac.status !== 'Airborne').map(ac => (
              <div key={ac.rego} className="flex items-center gap-2 p-2 bg-card border border-card-border rounded-lg">
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                  ac.status === 'Airborne'    ? 'bg-cyan-400 animate-pulse' :
                  ac.status === 'Serviceable' ? 'bg-green-400' :
                  'bg-orange-400'
                )} />
                <span className="text-xs font-mono font-semibold text-foreground">{ac.rego}</span>
                <span className="text-xs text-muted-foreground truncate">{ac.base.split('(')[0].trim()}</span>
                <span className={cn("ml-auto text-xs",
                  ac.status === 'Airborne'    ? 'text-cyan-400' :
                  ac.status === 'Serviceable' ? 'text-green-400' :
                  'text-orange-400'
                )}>{ac.status}</span>
              </div>
            ))}
            {AIRCRAFT.filter(ac => showAllAircraft || ac.status !== 'Airborne').length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">All aircraft airborne</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </div>
              <span className="text-white font-bold text-lg">NSW Flight Map</span>
              <span className="text-xs text-slate-400">RFDS SE Section · Operational Picture</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">Press Esc to exit</span>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
              >
                <Minimize2 size={13} /> Exit Fullscreen
              </button>
            </div>
          </div>
          <div className="flex flex-1 gap-0 overflow-hidden">
            <div className="flex-1 p-4 flex flex-col"><MapPanel compact /></div>
            <div className="w-72 border-l border-white/10 overflow-y-auto p-4 flex-shrink-0"><SidePanel /></div>
          </div>
        </div>
      )}

      {/* Normal layout */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>NSW Flight Map</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Live operational picture · RFDS SE Section airspace</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><MapPanel /></div>
          <div><SidePanel /></div>
        </div>
      </div>
    </>
  );
}
