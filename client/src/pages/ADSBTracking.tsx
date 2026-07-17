import { useState, useEffect } from "react";
import { MapPin, Radio, AlertTriangle, Navigation, Clock, TrendingUp, Plane, RefreshCw } from "lucide-react";

interface Aircraft {
  id: string;
  rego: string;
  type: string;
  base: string;
  missionId: string | null;
  status: "active" | "ground" | "returning";
  lat: number;
  lon: number;
  alt: number; // ft
  speed: number; // kts
  heading: number; // deg
  etaDest: string | null;
  dest: string | null;
  filedRoute: string | null;
  deviated: boolean;
  lastUpdate: string;
}

const INITIAL_AIRCRAFT: Aircraft[] = [
  { id:"a1", rego:"VH-MVW", type:"King Air B200", base:"Dubbo",       missionId:"MRQ-4891", status:"active",    lat:-32.10, lon:149.80, alt:14000, speed:238, heading:112, etaDest:"10:42", dest:"Sydney (YSSY)",    filedRoute:"YSDU-SNO-YSBK", deviated:false, lastUpdate:"09:31:05" },
  { id:"a2", rego:"VH-XYJ", type:"King Air B200", base:"Dubbo",       missionId:"MRQ-4893", status:"active",    lat:-31.40, lon:145.20, alt:12000, speed:235, heading:287, etaDest:"10:15", dest:"Broken Hill (YBHI)",filedRoute:"YSDU-BHI",        deviated:false, lastUpdate:"09:31:12" },
  { id:"a3", rego:"VH-MVX", type:"King Air B200", base:"Broken Hill", missionId:null,        status:"ground",    lat:-31.99, lon:141.47, alt:0,     speed:0,   heading:0,   etaDest:null,    dest:null,                filedRoute:null,              deviated:false, lastUpdate:"09:30:48" },
  { id:"a4", rego:"VH-MWK", type:"King Air B200", base:"Broken Hill", missionId:"MRQ-4895", status:"returning", lat:-32.80, lon:143.10, alt:11500, speed:240, heading:257, etaDest:"10:28", dest:"Broken Hill (YBHI)",filedRoute:"YSSY-BHI",        deviated:true,  lastUpdate:"09:31:08" },
  { id:"a5", rego:"VH-LTQ", type:"King Air B350", base:"Bankstown",   missionId:"MRQ-4890", status:"active",    lat:-33.50, lon:150.20, alt:16000, speed:268, heading:45, etaDest:"09:58", dest:"Newcastle (YWLM)", filedRoute:"YSBK-YWLM",       deviated:false, lastUpdate:"09:31:01" },
  { id:"a6", rego:"VH-MQK", type:"King Air B200", base:"Essendon",    missionId:null,        status:"ground",    lat:-37.73, lon:144.90, alt:0,     speed:0,   heading:0,   etaDest:null,    dest:null,                filedRoute:null,              deviated:false, lastUpdate:"09:30:55" },
  { id:"a7", rego:"VH-NAJ", type:"King Air B200", base:"Essendon",    missionId:"MRQ-4888", status:"active",    lat:-36.10, lon:146.50, alt:13000, speed:242, heading:178, etaDest:"10:05", dest:"Melbourne (YMML)", filedRoute:"YMML-YWGT-YMML",  deviated:false, lastUpdate:"09:31:14" },
  { id:"a8", rego:"VH-MQD", type:"King Air B200", base:"Launceston",  missionId:null,        status:"ground",    lat:-41.54, lon:147.21, alt:0,     speed:0,   heading:0,   etaDest:null,    dest:null,                filedRoute:null,              deviated:false, lastUpdate:"09:30:40" },
];

const BASES: { name: string; icao: string; lat: number; lon: number }[] = [
  { name:"Dubbo",       icao:"YSDU", lat:-32.217, lon:148.575 },
  { name:"Broken Hill", icao:"YBHI", lat:-31.988, lon:141.472 },
  { name:"Bankstown",   icao:"YSBK", lat:-33.924, lon:150.988 },
  { name:"Essendon",    icao:"YMEN", lat:-37.729, lon:144.902 },
  { name:"Launceston",  icao:"YMLT", lat:-41.545, lon:147.214 },
];

const STATUS_CFG = {
  active:    { label:"Active Mission", color:"text-cyan-400",   bg:"bg-cyan-500/10 border-cyan-500/25" },
  ground:    { label:"On Ground",      color:"text-slate-400",  bg:"bg-slate-500/10 border-slate-500/25" },
  returning: { label:"Returning",      color:"text-amber-400",  bg:"bg-amber-500/10 border-amber-500/25" },
};

function HeadingArrow({ deg }: { deg: number }) {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <Navigation size={14} className="text-cyan-400" style={{ transform: `rotate(${deg}deg)` }} />
    </div>
  );
}

function AltBar({ alt }: { alt: number }) {
  const pct = Math.min((alt / 20000) * 100, 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-slate-400">{alt === 0 ? "GND" : `FL${Math.round(alt / 100).toString().padStart(3,"0")}`}</span>
    </div>
  );
}

export default function ADSBTracking() {
  const [aircraft, setAircraft] = useState<Aircraft[]>(INITIAL_AIRCRAFT);
  const [selected, setSelected] = useState<string | null>("a1");
  const [lastRefresh, setLastRefresh] = useState("09:31:14");
  const [filter, setFilter] = useState<"all" | "active" | "ground">("all");

  // Simulate live position updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAircraft(prev => prev.map(a => {
        if (a.status === "ground") return a;
        const rad = (a.heading * Math.PI) / 180;
        const nm = (a.speed / 3600) * 30; // 30s tick
        const dLat = (nm * Math.cos(rad)) / 60;
        const dLon = (nm * Math.sin(rad)) / (60 * Math.cos((a.lat * Math.PI) / 180));
        const now = new Date();
        return {
          ...a,
          lat: a.lat + dLat,
          lon: a.lon + dLon,
          lastUpdate: `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`,
        };
      }));
      const now = new Date();
      setLastRefresh(`${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedAc = aircraft.find(a => a.id === selected);
  const filtered = aircraft.filter(a => filter === "all" ? true : filter === "active" ? a.status !== "ground" : a.status === "ground");
  const deviations = aircraft.filter(a => a.deviated);

  // Simple SVG map — approximate NSW/VIC bounding box
  const MAP_LAT_MIN = -44, MAP_LAT_MAX = -29, MAP_LON_MIN = 138, MAP_LON_MAX = 154;
  function toSvg(lat: number, lon: number, W: number, H: number) {
    const x = ((lon - MAP_LON_MIN) / (MAP_LON_MAX - MAP_LON_MIN)) * W;
    const y = ((MAP_LAT_MAX - lat) / (MAP_LAT_MAX - MAP_LAT_MIN)) * H;
    return { x, y };
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Live ADS-B Aircraft Tracking</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time position, altitude, speed · ADS-B Exchange / OzRunways API · 30-second update</p>
        </div>
        <div className="flex items-center gap-3">
          {deviations.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1.5">
              <AlertTriangle size={12} />
              {deviations.length} route deviation{deviations.length > 1 ? "s" : ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
            <Radio size={11} className="animate-pulse" />
            Live · Updated {lastRefresh}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Aircraft Tracked",   value: aircraft.length,                           color:"text-cyan-400" },
          { label:"Active Missions",    value: aircraft.filter(a=>a.status==="active").length, color:"text-cyan-400" },
          { label:"On Ground",          value: aircraft.filter(a=>a.status==="ground").length, color:"text-slate-400" },
          { label:"Route Deviations",   value: deviations.length,                         color: deviations.length > 0 ? "text-amber-400" : "text-green-400" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Map + List split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* SVG Map */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Flight Map — Eastern Australia</span>
            <div className="flex gap-1 text-[11px]">
              {["all","active","ground"].map(f => (
                <button key={f} onClick={() => setFilter(f as any)}
                  className={`px-2.5 py-1 rounded capitalize ${filter === f ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 400 460" className="w-full rounded-lg" style={{ background: "#0a1628" }}>
            {/* Ocean/land background */}
            <rect width={400} height={460} fill="#0a1628" />
            {/* Grid lines */}
            {[130,135,140,145,150,155].map(lon => {
              const { x } = toSvg(-30, lon, 400, 460);
              return <line key={lon} x1={x} y1={0} x2={x} y2={460} stroke="#1e2d45" strokeWidth={0.5} />;
            })}
            {[-30,-32,-34,-36,-38,-40,-42,-44].map(lat => {
              const { y } = toSvg(lat, 138, 400, 460);
              return <line key={lat} x1={0} y1={y} x2={400} y2={y} stroke="#1e2d45" strokeWidth={0.5} />;
            })}

            {/* Base markers */}
            {BASES.map(b => {
              const { x, y } = toSvg(b.lat, b.lon, 400, 460);
              return (
                <g key={b.icao}>
                  <rect x={x-18} y={y-6} width={36} height={12} rx={3} fill="#1e3a5f" stroke="#2563eb" strokeWidth={0.5} />
                  <text x={x} y={y+4} textAnchor="middle" fill="#60a5fa" fontSize={6} fontFamily="monospace">{b.icao}</text>
                </g>
              );
            })}

            {/* Aircraft markers */}
            {aircraft.filter(a => filter === "all" ? true : filter === "active" ? a.status !== "ground" : a.status === "ground").map(a => {
              const { x, y } = toSvg(a.lat, a.lon, 400, 460);
              const isSelected = selected === a.id;
              const color = a.deviated ? "#f59e0b" : a.status === "ground" ? "#64748b" : "#22d3ee";
              const rad = (a.heading * Math.PI) / 180;
              return (
                <g key={a.id} style={{ cursor:"pointer" }} onClick={() => setSelected(a.id)}>
                  {isSelected && <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />}
                  {/* Plane icon approximation */}
                  <polygon
                    points={`${x},${y-5} ${x-3},${y+3} ${x},${y+1} ${x+3},${y+3}`}
                    fill={color}
                    stroke={isSelected ? "white" : "none"}
                    strokeWidth={0.5}
                    style={{ transform: `rotate(${a.heading}deg)`, transformOrigin: `${x}px ${y}px` }}
                  />
                  {a.deviated && <circle cx={x+6} cy={y-6} r={3} fill="#f59e0b" />}
                  <text x={x} y={y+12} textAnchor="middle" fill={color} fontSize={5.5} fontFamily="monospace">{a.rego}</text>
                </g>
              );
            })}
          </svg>
          <div className="flex gap-4 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />Ground</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Deviation</span>
          </div>
        </div>

        {/* Aircraft list */}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filtered.map(a => {
            const sc = STATUS_CFG[a.status];
            const isSelected = selected === a.id;
            return (
              <div key={a.id}
                onClick={() => setSelected(a.id)}
                className={`bg-card border rounded-xl p-3 cursor-pointer transition-all ${isSelected ? "border-cyan-500/50 bg-cyan-950/20" : "border-card-border hover:border-slate-600"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Plane size={13} className={sc.color} />
                    <span className="font-mono text-sm font-bold text-slate-100">{a.rego}</span>
                    {a.deviated && <AlertTriangle size={11} className="text-amber-400" />}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{a.type} · {a.base}</div>
                {a.status !== "ground" && (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      <HeadingArrow deg={a.heading} />
                      <div>
                        <div className="text-[11px] text-slate-300">{a.speed} kts · {a.heading}°</div>
                        <AltBar alt={a.alt} />
                      </div>
                    </div>
                    {a.dest && <div className="text-[10px] text-cyan-400 mt-1">→ {a.dest} · ETA {a.etaDest}</div>}
                    {a.missionId && <div className="text-[10px] text-slate-500 mt-0.5">{a.missionId}</div>}
                  </>
                )}
                {a.deviated && (
                  <div className="text-[10px] text-amber-400 bg-amber-500/10 rounded px-2 py-1 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={9} /> Route deviation detected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected aircraft detail */}
      {selectedAc && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Plane size={18} className="text-cyan-400" />
            <div>
              <h2 className="font-bold text-slate-100">{selectedAc.rego} — {selectedAc.type}</h2>
              <p className="text-xs text-muted-foreground">Base: {selectedAc.base} · Last update: {selectedAc.lastUpdate}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:"Altitude",  value: selectedAc.alt === 0 ? "On Ground" : `${selectedAc.alt.toLocaleString()} ft`, icon:<TrendingUp size={14} className="text-cyan-400" /> },
              { label:"Speed",     value: selectedAc.speed === 0 ? "Stationary" : `${selectedAc.speed} kts`, icon:<Navigation size={14} className="text-cyan-400" /> },
              { label:"Heading",   value: selectedAc.heading === 0 ? "—" : `${selectedAc.heading}°`, icon:<Navigation size={14} className="text-slate-400" /> },
              { label:"ETA",       value: selectedAc.etaDest ?? "—", icon:<Clock size={14} className="text-cyan-400" /> },
            ].map(d => (
              <div key={d.label} className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{d.icon}{d.label}</div>
                <div className="text-lg font-bold text-slate-100">{d.value}</div>
              </div>
            ))}
          </div>
          {selectedAc.dest && (
            <div className="mt-3 text-sm text-slate-300">
              <span className="text-muted-foreground">Route: </span>{selectedAc.filedRoute}
              <span className="mx-2 text-slate-600">→</span>
              <span className="text-cyan-400">{selectedAc.dest}</span>
            </div>
          )}
          {selectedAc.deviated && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-2.5">
              <AlertTriangle size={15} />
              <div>
                <div className="font-semibold">Route deviation detected</div>
                <div className="text-xs text-amber-300/70">Aircraft has deviated from its filed route. Ops controller has been notified.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data source note */}
      <div className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        Live data source: ADS-B Exchange API + OzRunways ADS-B Network · 30-second positional refresh · Simulated positions for demo
      </div>
    </div>
  );
}
