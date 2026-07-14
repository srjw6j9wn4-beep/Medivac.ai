import { useState, useRef, useCallback, useEffect } from "react";
import { MISSIONS, AIRCRAFT, NSW_AIRPORTS, type UserRole } from "@/lib/data";
import { Plane, Navigation, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { role: UserRole; }

const ROUTES = [
  { from: { x: 52, y: 48 }, to: { x: 82, y: 68 }, mission: 'M001', status: 'Active',   color: '#f97316' },
  { from: { x: 18, y: 44 }, to: { x: 72, y: 78 }, mission: 'M002', status: 'Pending',  color: '#facc15' },
  { from: { x: 52, y: 48 }, to: { x: 44, y: 38 }, mission: 'M003', status: 'Complete', color: '#22d3ee' },
  { from: { x: 44, y: 32 }, to: { x: 52, y: 48 }, mission: 'M004', status: 'Airborne', color: '#4ade80' },
];


export default function FlightMap({ role }: Props) {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [hoveredAirport, setHoveredAirport]   = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen]       = useState(false);

  // ViewBox state for pan/zoom
  const leafletRef     = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);


  // ── Leaflet map initialisation ────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current || !leafletRef.current) return;
    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = L.map(leafletRef.current!, {
        center: [-32.5, 146.5], zoom: 6,
        zoomControl: true, attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Airport markers
      NSW_AIRPORTS.forEach(ap => {
        const isBase = ap.icao === 'YSDU' || ap.icao === 'YBHI' || ap.icao === 'YSBK';
        const html = isBase
          ? `<div style="background:#0097A7;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);">✈</div>`
          : `<div style="background:#1e293b;color:#94a3b8;border-radius:4px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:1px solid #334155;box-shadow:0 1px 4px rgba(0,0,0,0.4);">✈</div>`;
        L.marker([ap.lat, ap.lng], {
          icon: L.divIcon({ className: "", html, iconSize: isBase ? [30,30] : [22,22], iconAnchor: isBase ? [15,15] : [11,11] })
        }).bindPopup(`<b>${ap.name}</b><br/>${ap.icao}${isBase ? "<br/><b style='color:#0097A7'>RFDS Base</b>" : ""}`).addTo(map);
      });

      // Active mission routes
      MISSIONS.filter(m => m.status !== 'Complete' && m.status !== 'Cancelled').forEach(m => {
        const fromAp = NSW_AIRPORTS.find(a => a.icao === m.from);
        const toAp   = NSW_AIRPORTS.find(a => a.icao === m.to);
        if (fromAp && toAp) {
          const color = m.status === 'Airborne' ? '#22d3ee' : m.status === 'Active' ? '#f97316' : '#facc15';
          L.polyline([[fromAp.lat, fromAp.lng],[toAp.lat, toAp.lng]], {
            color, weight: m.status === 'Airborne' ? 3 : 2, opacity: 0.85,
            dashArray: m.status === 'Airborne' ? undefined : "6 4",
          }).bindPopup(`<b>${m.callsign}</b><br/>${m.from} → ${m.to}<br/>${m.status}`).addTo(map);
        }
      });

      mapInstanceRef.current = { map, L };
    });
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.map.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  const zoom = (factor: number) => {
    if (mapInstanceRef.current) {
      factor < 1 ? mapInstanceRef.current.map.zoomIn() : mapInstanceRef.current.map.zoomOut();
    }
  };
  const resetView = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.map.setView([-32.5, 146.5], 6);
  };

  const selected       = MISSIONS.find(m => m.id === selectedMission);
  const activeMissions = MISSIONS.filter(m => m.status !== 'Complete' && m.status !== 'Cancelled');

  // ── Zoom ─────────────────────────────────────────────────────────────────────


  // Reset view

  // ── Fullscreen (CSS overlay — no browser API needed) ─────────────────────
  function toggleFullscreen() { setIsFullscreen(f => !f); }

  // Escape key exits fullscreen
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  // ── Map panel (reused in normal + fullscreen) ─────────────────────────────
  function MapPanel({ compact = false }: { compact?: boolean }) {
    return (
      <div className={cn(
        "bg-card border border-card-border rounded-xl overflow-hidden flex flex-col",
        compact ? "h-full" : ""
      )}>
        {/* Map toolbar */}
        <div className="px-4 py-2.5 border-b border-card-border flex items-center gap-2 flex-shrink-0">
          <Navigation size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
            NSW / VIC Operational Zone
          </span>
          <span className="text-[10px] text-muted-foreground mr-2 hidden sm:block">
            Scroll to zoom · Drag to pan
          </span>
          {/* Zoom controls */}
          <button
            onClick={() => zoom(0.75)}
            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => zoom(1.33)}
            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
            title="Reset view"
          >
            <RotateCcw size={12} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-white/5 text-cyan-400 hover:text-cyan-300 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen (Ops room / visitor display)"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* Leaflet map — OpenStreetMap tiles + airport overlays */}
        <div className="relative flex-1" style={{ minHeight: compact ? "100%" : "480px" }}>
          <div ref={leafletRef} style={{ width: "100%", height: "100%", minHeight: compact ? "400px" : "480px" }} />
        </div>
      </div>
    );
  }

  // ── Right sidebar content ─────────────────────────────────────────────────
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
      {/* ── Fullscreen overlay ───────────────────────────────────────────── */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[999] bg-slate-950 flex flex-col"
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
        >
          {/* Fullscreen header bar */}
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

          {/* Fullscreen body — map takes all available space */}
          <div className="flex flex-1 gap-0 overflow-hidden">
            {/* Map — expands to fill */}
            <div className="flex-1 p-4 flex flex-col">
              <MapPanel compact />
            </div>
            {/* Sidebar — fixed width scrollable */}
            <div className="w-72 border-l border-white/10 overflow-y-auto p-4 flex-shrink-0">
              <SidePanel />
            </div>
          </div>
        </div>
      )}

      {/* ── Normal layout ─────────────────────────────────────────────────── */}
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
          <div className="lg:col-span-2">
            <MapPanel />
          </div>
          <div>
            <SidePanel />
          </div>
        </div>
      </div>
    </>
  );
}
