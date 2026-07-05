import { useState } from "react";
import { MISSIONS, AIRCRAFT, CREW, NSW_AIRPORTS, type UserRole } from "@/lib/data";
import { Navigation, Cloud, Wind, Eye, AlertTriangle, CheckCircle, Clock, Plane, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { role: UserRole; }

const WEATHER: Record<string, { metar: string; vis: string; wind: string; cloud: string; ok: boolean }> = {
  YSDU: { metar: 'YSDU 050530Z 12008KT 9999 FEW030 18/08 Q1018', vis: '9999m', wind: '120/08', cloud: 'FEW 3000ft', ok: true },
  YBHI: { metar: 'YBHI 050530Z 27015KT 9999 SCT020 16/06 Q1015', vis: '9999m', wind: '270/15', cloud: 'SCT 2000ft', ok: true },
  YSSY: { metar: 'YSSY 050530Z 05012KT 9999 BKN025 20/14 Q1016', vis: '9999m', wind: '050/12', cloud: 'BKN 2500ft', ok: true },
  YWLG: { metar: 'YWLG 050530Z 36006KT 8000 FEW015 OVC040 14/12 Q1018', vis: '8000m', wind: '360/06', cloud: 'OVC 4000ft', ok: false },
  YMOR: { metar: 'YMOR 050530Z 15010KT 9999 FEW025 19/09 Q1017', vis: '9999m', wind: '150/10', cloud: 'FEW 2500ft', ok: true },
};

const NOTAMS = [
  { id: 'A0123/26', text: 'YSDU: ILS RWY 05 UNSERVICEABLE. NO NOTAM TO CANCEL.', type: 'warn', expires: '06 JUN 06:00Z' },
  { id: 'A0456/26', text: 'YBHI: RUNWAY 05/23 CLOSED FOR MAINTENANCE 0400-0800Z.', type: 'alert', expires: '05 JUN 08:00Z' },
  { id: 'A0789/26', text: 'RESTRICTED AREA RA2750 ACTIVE 0300-0900Z FL050-FL200.', type: 'warn', expires: '05 JUN 09:00Z' },
  { id: 'A0812/26', text: 'YSSY: RUNWAY 34L/16R CLOSED RESURFACING. EXPECT DELAYS.', type: 'info', expires: '10 JUN 18:00Z' },
];

const RELEASES = [
  { mission: 'MEDIVAC 01', aircraft: 'VH-MVW', route: 'YSDU → YSSY', pilot: 'Capt. R. Hughes', gates: { flightPlan: true, wb: true, apg: true, fuel: true, medical: true, mx: true } },
  { mission: 'MEDIVAC 02', aircraft: 'VH-XYR', route: 'YBHI → YDYS', pilot: 'Capt. T. Barnes', gates: { flightPlan: true, wb: true, apg: false, fuel: false, medical: true, mx: true } },
];

export default function FlightPlanning({ role }: Props) {
  const [activeTab, setActiveTab] = useState<'releases' | 'weather' | 'notams' | 'fuel'>('releases');
  const [expandedRelease, setExpandedRelease] = useState<string | null>('MEDIVAC 01');

  const tabs = [
    { id: 'releases', label: 'Release Gates' },
    { id: 'weather', label: 'Weather' },
    { id: 'notams', label: 'NOTAMs' },
    { id: 'fuel', label: 'Fuel Planning' },
  ] as const;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Flight Planning</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Pre-departure release gates, weather, NOTAMs · {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Missions Today', value: '4', sub: '2 pending release', color: 'text-cyan-400', icon: <Plane size={16} className="text-cyan-400" /> },
          { label: 'Weather OK', value: '4/5', sub: '1 marginal', color: 'text-green-400', icon: <Cloud size={16} className="text-green-400" /> },
          { label: 'Active NOTAMs', value: NOTAMS.length.toString(), sub: '1 critical', color: 'text-orange-400', icon: <AlertTriangle size={16} className="text-orange-400" /> },
          { label: 'Releases Ready', value: '1/2', sub: '1 pending APG', color: 'text-yellow-400', icon: <FileText size={16} className="text-yellow-400" /> },
        ].map(k => (
          <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-muted-foreground">{k.label}</span></div>
            <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
              activeTab === t.id ? "border-cyan-400 text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >{t.label}</button>
        ))}
      </div>

      {/* Release Gates */}
      {activeTab === 'releases' && (
        <div className="space-y-3">
          {RELEASES.map(rel => {
            const allOk = Object.values(rel.gates).every(Boolean);
            const isOpen = expandedRelease === rel.mission;
            return (
              <div key={rel.mission} className={cn("bg-card border rounded-xl overflow-hidden", allOk ? "border-green-500/30" : "border-orange-500/30")}>
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedRelease(isOpen ? null : rel.mission)}
                >
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", allOk ? "bg-green-400" : "bg-orange-400")} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-foreground">{rel.mission}</div>
                    <div className="text-xs text-muted-foreground">{rel.aircraft} · {rel.route} · {rel.pilot}</div>
                  </div>
                  <span className={cn("text-xs font-semibold", allOk ? "text-green-400" : "text-orange-400")}>
                    {allOk ? "CLEARED" : "PENDING"}
                  </span>
                  {isOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 py-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(rel.gates).map(([key, ok]) => {
                        const labels: Record<string, string> = { flightPlan: 'Flight Plan Filed', wb: 'W&B Calculated', apg: 'APG Release', fuel: 'Fuel Confirmed', medical: 'Medical Crew', mx: 'Maintenance Release' };
                        return (
                          <div key={key} className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs", ok ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-red-500/5 border-red-500/20 text-red-400")}>
                            {ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                            {labels[key]}
                          </div>
                        );
                      })}
                    </div>
                    {!allOk && (
                      <div className="mt-3 p-2.5 bg-orange-500/8 border border-orange-500/20 rounded-lg text-xs text-orange-300">
                        ⚠ APG release and fuel confirmation required before departure clearance can be issued.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weather */}
      {activeTab === 'weather' && (
        <div className="space-y-3">
          {Object.entries(WEATHER).map(([icao, wx]) => {
            const ap = NSW_AIRPORTS.find(a => a.icao === icao);
            return (
              <div key={icao} className={cn("bg-card border rounded-xl p-4", wx.ok ? "border-card-border" : "border-yellow-500/30")}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-bold font-mono text-cyan-400">{icao}</span>
                    <span className="text-xs text-muted-foreground ml-2">{ap?.name}</span>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded border", wx.ok ? "text-green-400 border-green-500/20 bg-green-500/10" : "text-yellow-400 border-yellow-500/20 bg-yellow-500/10")}>
                    {wx.ok ? "VMC OK" : "Marginal"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-xs"><div className="text-muted-foreground mb-0.5">Visibility</div><div className="font-mono text-foreground">{wx.vis}</div></div>
                  <div className="text-xs"><div className="text-muted-foreground mb-0.5">Wind</div><div className="font-mono text-foreground">{wx.wind}</div></div>
                  <div className="text-xs"><div className="text-muted-foreground mb-0.5">Cloud</div><div className="font-mono text-foreground">{wx.cloud}</div></div>
                </div>
                <div className="bg-background rounded p-2 text-[10px] font-mono text-muted-foreground">{wx.metar}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* NOTAMs */}
      {activeTab === 'notams' && (
        <div className="space-y-2">
          {NOTAMS.map(n => (
            <div key={n.id} className={cn("bg-card border rounded-xl p-4",
              n.type === 'alert' ? "border-red-500/30" :
              n.type === 'warn' ? "border-orange-500/30" : "border-card-border"
            )}>
              <div className="flex items-start gap-3">
                <span className={cn("text-xs font-bold font-mono mt-0.5",
                  n.type === 'alert' ? "text-red-400" :
                  n.type === 'warn' ? "text-orange-400" : "text-blue-400"
                )}>{n.id}</span>
                <div className="flex-1">
                  <div className="text-xs text-foreground leading-relaxed">{n.text}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={10} /> Expires: {n.expires}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fuel Planning */}
      {activeTab === 'fuel' && (
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fuel Requirements — Today's Missions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-4">Mission</th>
                    <th className="text-left py-2 pr-4">Route</th>
                    <th className="text-right py-2 pr-4">Trip Fuel (lb)</th>
                    <th className="text-right py-2 pr-4">Alternate (lb)</th>
                    <th className="text-right py-2 pr-4">Reserve (lb)</th>
                    <th className="text-right py-2">Total FOB (lb)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { m: 'MEDIVAC 01', route: 'YSDU→YSSY', trip: 2840, alt: 480, res: 400, total: 3720 },
                    { m: 'MEDIVAC 02', route: 'YBHI→YDYS', trip: 2100, alt: 380, res: 400, total: 2880 },
                    { m: 'DENTAL 01', route: 'YSDU→YMOR', trip: 960, alt: 280, res: 400, total: 1640 },
                  ].map(r => (
                    <tr key={r.m}>
                      <td className="py-2 pr-4 font-mono font-semibold text-foreground">{r.m}</td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono">{r.route}</td>
                      <td className="py-2 pr-4 text-right font-mono text-foreground">{r.trip.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{r.alt.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{r.res.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono font-bold text-cyan-400">{r.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300">
            <strong>RFDS SE Fuel Policy:</strong> All King Air B200/B350 operations — minimum 400 lb fixed reserve. Alternate fuel required when destination forecast below alternate minima or &lt;3h before ETD. Fuel in pounds (lb) — do not convert to kg or litres.
          </div>
        </div>
      )}
    </div>
  );
}
