import { useState } from "react";
import { CREW, type UserRole } from "@/lib/data";
import { Clock, AlertTriangle, CheckCircle, Users, Moon, Sun, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { role: UserRole; }

const DUTY_DATA = [
  { id: 'C1', name: 'Capt. R. Hughes', role: 'Pilot', base: 'Dubbo', dutyStart: '05:30', dutyEnd: '17:30', dutyHrs: 12, restBefore: 11.5, fdpLimit: 13, cumulDay: 8.2, cum28: 62, cum90: 180, cum365: 680, fatigue: 28, status: 'On Duty' },
  { id: 'C2', name: 'Capt. T. Barnes', role: 'Pilot', base: 'Broken Hill', dutyStart: '07:00', dutyEnd: '19:00', dutyHrs: 12, restBefore: 14.2, fdpLimit: 13, cumulDay: 6.0, cum28: 48, cum90: 142, cum365: 560, fatigue: 18, status: 'On Call' },
  { id: 'C3', name: 'Capt. M. Clarke', role: 'Pilot', base: 'Dubbo', dutyStart: '—', dutyEnd: '—', dutyHrs: 0, restBefore: 22, fdpLimit: 13, cumulDay: 0, cum28: 91, cum90: 268, cum365: 820, fatigue: 12, status: 'Off Duty' },
  { id: 'C4', name: 'S. Mitchell RN', role: 'Flight Nurse', base: 'Dubbo', dutyStart: '05:30', dutyEnd: '17:30', dutyHrs: 12, restBefore: 12, fdpLimit: 14, cumulDay: 7.5, cum28: 55, cum90: 162, cum365: 620, fatigue: 22, status: 'On Duty' },
  { id: 'C5', name: 'Dr. K. Patel', role: 'Flight Doctor', base: 'Dubbo', dutyStart: '05:30', dutyEnd: '17:30', dutyHrs: 12, restBefore: 13, fdpLimit: 14, cumulDay: 7.5, cum28: 38, cum90: 112, cum365: 420, fatigue: 15, status: 'On Duty' },
  { id: 'C6', name: "J. O'Brien RN", role: 'Flight Nurse', base: 'Broken Hill', dutyStart: '—', dutyEnd: '—', dutyHrs: 0, restBefore: 24, fdpLimit: 14, cumulDay: 0, cum28: 70, cum90: 198, cum365: 710, fatigue: 8, status: 'P Day' },
  { id: 'C7', name: 'Capt. B. Henson', role: 'Pilot', base: 'Launceston', dutyStart: '06:00', dutyEnd: '18:00', dutyHrs: 12, restBefore: 12, fdpLimit: 13, cumulDay: 7.8, cum28: 58, cum90: 174, cum365: 650, fatigue: 20, status: 'On Duty' },
  { id: 'C8', name: 'Dr. F. McLaren', role: 'Flight Doctor', base: 'Launceston', dutyStart: '06:00', dutyEnd: '18:00', dutyHrs: 12, restBefore: 12.5, fdpLimit: 14, cumulDay: 7.8, cum28: 44, cum90: 128, cum365: 490, fatigue: 14, status: 'On Duty' },
];

const EBA_LIMITS = [
  { label: 'Max FDP', value: '13h (pilots) / 14h (medical)', ref: 'EBA Clause 18.3' },
  { label: 'Min Rest (post-duty)', value: '10h (10h FDP) / 12h (>10h FDP)', ref: 'EBA Clause 18.5' },
  { label: '28-day cumulative', value: '100 hours flight time', ref: 'CAO 48.1' },
  { label: '90-day cumulative', value: '300 hours flight time', ref: 'CAO 48.1' },
  { label: '365-day cumulative', value: '1000 hours flight time', ref: 'CAO 48.1' },
  { label: 'Availability (28 days)', value: '168 hours maximum', ref: 'EBA Schedule B' },
];

function fatigueBand(score: number) {
  if (score < 15) return { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
  if (score < 25) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' };
  if (score < 35) return { label: 'Elevated', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
  return { label: 'High', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
}

function HoursBar({ value, max, warn }: { value: number; max: number; warn: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= warn ? 'bg-orange-400' : value >= max * 0.8 ? 'bg-yellow-400' : 'bg-cyan-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-14 text-right">{value}/{max}</span>
    </div>
  );
}

export default function DutyFRMS({ role }: Props) {
  const [activeTab, setActiveTab] = useState<'duty' | 'hours' | 'fatigue' | 'limits'>('duty');

  const overLimit = DUTY_DATA.filter(d => d.cum28 >= 90 || d.fatigue >= 28);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Duty & FRMS</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Fatigue Risk Management · EBA 2025 compliance · CAO 48.1</p>
        </div>
        <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border",
          overLimit.length > 0 ? "text-orange-400 bg-orange-500/10 border-orange-500/25" : "text-green-400 bg-green-500/10 border-green-500/20"
        )}>
          {overLimit.length > 0 ? <AlertTriangle size={12} /> : <Shield size={12} />}
          {overLimit.length > 0 ? `${overLimit.length} crew approaching limits` : "All crew within limits"}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'On Duty Now', value: DUTY_DATA.filter(d => d.status === 'On Duty').length, color: 'text-cyan-400', icon: <Users size={16} className="text-cyan-400" /> },
          { label: 'On Call', value: DUTY_DATA.filter(d => d.status === 'On Call').length, color: 'text-yellow-400', icon: <Clock size={16} className="text-yellow-400" /> },
          { label: 'Off Duty / PDay', value: DUTY_DATA.filter(d => d.status === 'Off Duty' || d.status === 'P Day').length, color: 'text-green-400', icon: <Moon size={16} className="text-green-400" /> },
          { label: 'Fatigue Alerts', value: DUTY_DATA.filter(d => d.fatigue >= 25).length, color: 'text-orange-400', icon: <AlertTriangle size={16} className="text-orange-400" /> },
        ].map(k => (
          <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-muted-foreground">{k.label}</span></div>
            <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['duty', 'hours', 'fatigue', 'limits'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn("px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors capitalize",
              activeTab === t ? "border-cyan-400 text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >{t === 'limits' ? 'EBA Limits' : t === 'duty' ? 'Duty Roster' : t === 'hours' ? 'Hour Limits' : 'Fatigue Index'}</button>
        ))}
      </div>

      {/* Duty Roster */}
      {activeTab === 'duty' && (
        <div className="space-y-2">
          {DUTY_DATA.map(d => {
            const fdpPct = (d.dutyHrs / d.fdpLimit) * 100;
            const statusColors: Record<string, string> = {
              'On Duty': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              'On Call': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
              'Off Duty': 'text-muted-foreground bg-white/5 border-white/10',
              'P Day': 'text-green-400 bg-green-500/10 border-green-500/20',
            };
            return (
              <div key={d.id} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.role}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-2">
                      <div><span className="text-muted-foreground">Duty Start</span><div className="font-mono text-foreground">{d.dutyStart}</div></div>
                      <div><span className="text-muted-foreground">Duty End</span><div className="font-mono text-foreground">{d.dutyEnd}</div></div>
                      <div><span className="text-muted-foreground">FDP</span>
                        <div className="font-mono text-foreground">{d.dutyHrs > 0 ? `${d.dutyHrs}h / ${d.fdpLimit}h` : '—'}</div>
                      </div>
                      <div><span className="text-muted-foreground">Rest Before</span>
                        <div className={cn("font-mono", d.restBefore < 10 ? "text-red-400" : "text-foreground")}>{d.restBefore}h</div>
                      </div>
                    </div>
                    {d.dutyHrs > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", fdpPct >= 90 ? "bg-orange-400" : "bg-cyan-400")} style={{ width: `${fdpPct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{d.dutyHrs}/{d.fdpLimit}h FDP</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded border flex-shrink-0", statusColors[d.status])}>{d.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hour Limits */}
      {activeTab === 'hours' && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">Crew Member</th>
                <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">28-Day (100h)</th>
                <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">90-Day (300h)</th>
                <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold uppercase tracking-wider">365-Day (1000h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {DUTY_DATA.map(d => (
                <tr key={d.id} className={cn(d.cum28 >= 90 ? "bg-orange-500/[0.04]" : "")}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{d.name}</div>
                    <div className="text-muted-foreground">{d.role} · {d.base}</div>
                  </td>
                  <td className="px-4 py-3 w-40"><HoursBar value={d.cum28} max={100} warn={90} /></td>
                  <td className="px-4 py-3 w-40"><HoursBar value={d.cum90} max={300} warn={270} /></td>
                  <td className="px-4 py-3 w-40"><HoursBar value={d.cum365} max={1000} warn={900} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fatigue Index */}
      {activeTab === 'fatigue' && (
        <div className="space-y-2">
          {DUTY_DATA.map(d => {
            const band = fatigueBand(d.fatigue);
            return (
              <div key={d.id} className="bg-card border border-card-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{d.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{d.role} · {d.base}</span>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded border", band.bg, band.color)}>
                    {band.label} · {d.fatigue}/40
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      d.fatigue < 15 ? "bg-green-400" : d.fatigue < 25 ? "bg-yellow-400" : d.fatigue < 35 ? "bg-orange-400" : "bg-red-400"
                    )}
                    style={{ width: `${(d.fatigue / 40) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Low</span><span>Moderate</span><span>Elevated</span><span>High</span>
                </div>
              </div>
            );
          })}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-xs text-purple-300">
            <strong>FRMS Note:</strong> Fatigue index scores are calculated from duty hours, rest period, time-of-day, cumulative workload, and roster pattern. Scores above 25 trigger a supervisor review. Above 35 requires a fatigue declaration and operational risk assessment.
          </div>
        </div>
      )}

      {/* EBA Limits */}
      {activeTab === 'limits' && (
        <div className="space-y-3">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">RFDS SE Pilots Agreement 2025 — Key Limits</h3>
            </div>
            <div className="divide-y divide-border/50">
              {EBA_LIMITS.map(l => (
                <div key={l.label} className="px-4 py-3 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-foreground">{l.label}</div>
                    <div className="text-xs text-cyan-400 font-mono mt-0.5">{l.value}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{l.ref}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300">
            <strong>CAO 48.1 — Single Pilot Operations:</strong> Where Medivac flights are single-pilot, additional rest requirements apply. Consecutive night duties require a minimum 2-day break after the 3rd consecutive night.
          </div>
        </div>
      )}
    </div>
  );
}
