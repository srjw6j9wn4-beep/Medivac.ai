import { useState } from "react";
import {
  Clock, AlertTriangle, CheckCircle, Shield, RefreshCw,
  Users, Plane, Stethoscope, Truck, Wrench, Briefcase,
  ChevronRight, Wifi, WifiOff, Calendar
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type DayCode = 'ON' | 'OFF' | 'P' | 'LEAVE' | 'FERRY' | 'SIM' | 'OPS';
type RosterGroup = 'Pilots' | 'Nurses' | 'Doctors' | 'Drivers' | 'Engineering' | 'Management';

interface CrewMember {
  id: string;
  name: string;
  role: string;
  base: string;
  touringBase?: string;
  dutyStatus: string;
  currency: boolean;
  hoursFlown?: number;
  maxHours?: number;
  qualifications?: string[];
  week: DayCode[];
  notes?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const PILOTS: CrewMember[] = [
  { id: 'P1', name: 'Capt. Sarah Mitchell', role: 'Captain / PIC', base: 'Dubbo', dutyStatus: 'On Duty', currency: true,  hoursFlown: 312, maxHours: 400, qualifications: ['B200', 'B350', 'IFR', 'NVG'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P2', name: 'Capt. James Clarke',   role: 'Captain / PIC', base: 'Dubbo', dutyStatus: 'On Call', currency: false, hoursFlown: 389, maxHours: 400, qualifications: ['B200', 'B350', 'IFR'],       week: ['OFF','OFF','ON','ON','ON','ON','OFF'], notes: 'Currency lapsed — renewal 10 Jun' },
  { id: 'P3', name: 'F/O Emma Watkins',     role: 'First Officer',  base: 'Broken Hill', dutyStatus: 'On Duty', currency: true,  hoursFlown: 178, maxHours: 300, qualifications: ['B200', 'IFR'],       week: ['ON','ON','OFF','OFF','OFF','ON','ON'] },
  { id: 'P4', name: 'Capt. Liam Nguyen',    role: 'Captain / PIC', base: 'Dubbo', dutyStatus: 'Off Duty', currency: true, hoursFlown: 241, maxHours: 400, qualifications: ['B200', 'B350', 'IFR', 'NVG'], week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
  { id: 'P5', name: 'F/O Rachel Torres',    role: 'First Officer',  base: 'Broken Hill', dutyStatus: 'P Day', currency: true, hoursFlown: 134, maxHours: 300, qualifications: ['B200', 'IFR'],           week: ['P','P','ON','ON','ON','ON','OFF'] },
  { id: 'P6', name: 'Capt. David Walsh',    role: 'Captain / PIC', base: 'Dubbo', dutyStatus: 'On Duty', currency: true,  hoursFlown: 290, maxHours: 400, qualifications: ['B200', 'B350', 'IFR', 'Ferry'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P7', name: 'Capt. Brooke Henson',  role: 'Captain / PIC', base: 'Launceston', dutyStatus: 'On Duty', currency: true, hoursFlown: 265, maxHours: 400, qualifications: ['B350', 'IFR', 'TAS Amb'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'P8', name: 'F/O Daniel Frost',     role: 'First Officer',  base: 'Launceston', dutyStatus: 'On Call', currency: true, hoursFlown: 142, maxHours: 300, qualifications: ['B350', 'IFR'],              week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
];

const NURSES: CrewMember[] = [
  { id: 'N1', name: 'RN Kate Sullivan',   role: 'Retrieval Nurse / Team Lead', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['ICU', 'PICU', 'Neonatal', 'RSI'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'N2', name: 'RN Mark Johnson',    role: 'Retrieval Nurse',             base: 'Dubbo',       dutyStatus: 'On Call',  currency: true,  qualifications: ['ICU', 'RSI'],                     week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'N3', name: 'RN Priya Sharma',    role: 'Retrieval Nurse',             base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true,  qualifications: ['ICU', 'PICU'],                    week: ['ON','ON','OFF','OFF','ON','ON','ON'] },
  { id: 'N4', name: 'RN Chloe Adams',     role: 'Retrieval Nurse',             base: 'Dubbo',       dutyStatus: 'Leave',    currency: true,  qualifications: ['ICU', 'Neonatal'],                week: ['LEAVE','LEAVE','LEAVE','LEAVE','LEAVE','OFF','OFF'] },
  { id: 'N5', name: 'RN Tom Brennan',     role: 'Retrieval Nurse',             base: 'Broken Hill', dutyStatus: 'Off Duty', currency: true,  qualifications: ['ICU', 'RSI'],                     week: ['OFF','OFF','ON','ON','ON','ON','OFF'] },
  { id: 'N6', name: 'RN Amelia Chen',     role: 'Retrieval Nurse',             base: 'Dubbo',       dutyStatus: 'P Day',    currency: true,  qualifications: ['ICU', 'PICU', 'Neonatal'],        week: ['P','P','ON','ON','ON','ON','OFF'] },
  { id: 'N7', name: 'RN Claire O\'Donnell',role: 'Retrieval Nurse',             base: 'Launceston',  dutyStatus: 'On Duty',  currency: true,  qualifications: ['ICU', 'RSI', 'TAS Amb'],          week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'N8', name: 'RN Jason Whitfield', role: 'Retrieval Nurse',             base: 'Launceston',  dutyStatus: 'Off Duty', currency: true,  qualifications: ['ICU', 'PICU'],                    week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
];

const DOCTORS: CrewMember[] = [
  { id: 'D1', name: 'Dr. Helen Foster',   role: 'Medical Director / RFDS',  base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['FACEM', 'CICM', 'NETS', 'RSI'],  week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'D2', name: 'Dr. Nathan Park',    role: 'Retrieval Physician',      base: 'Dubbo',       dutyStatus: 'On Call',  currency: true,  qualifications: ['FACEM', 'RSI'],                  week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'D3', name: 'Dr. Sophie Laurent', role: 'Retrieval Physician',      base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true,  qualifications: ['FACEM', 'CICM'],                 week: ['ON','ON','OFF','OFF','OFF','ON','ON'] },
  { id: 'D4', name: 'Dr. James Okafor',   role: 'Retrieval Physician',      base: 'Dubbo',       dutyStatus: 'Off Duty', currency: true,  qualifications: ['FACEM', 'Paediatrics', 'NETS'],  week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
  { id: 'D5', name: 'Dr. Fiona McLaren',  role: 'Retrieval Physician',      base: 'Launceston',  dutyStatus: 'On Duty',  currency: true,  qualifications: ['FACEM', 'RSI', 'TAS Amb'],       week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
];

const DRIVERS: CrewMember[] = [
  { id: 'DR1', name: 'Brian McDonald',    role: 'Patient Transport Driver', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['MICA', 'HV Licence', 'P2'],       week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'DR2', name: 'Sandra Lee',        role: 'Patient Transport Driver', base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['MICA', 'HV Licence'],             week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'DR3', name: 'Chris Papadopoulos',role: 'Patient Transport Driver', base: 'Broken Hill', dutyStatus: 'On Call',  currency: true,  qualifications: ['MICA', 'HV Licence', 'P2'],       week: ['OFF','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'DR4', name: 'Amy Wilson',        role: 'Patient Transport Driver', base: 'Broken Hill', dutyStatus: 'Off Duty', currency: true,  qualifications: ['MICA', 'HV Licence'],             week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
  { id: 'DR5', name: 'Tom Fischer',       role: 'Ground Ops / Ramp',       base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['APRON', 'HV Licence'],            week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'DR6', name: 'Kylie Nguyen',      role: 'Ground Ops / Ramp',       base: 'Dubbo',       dutyStatus: 'P Day',    currency: true,  qualifications: ['APRON'],                          week: ['P','P','ON','ON','ON','ON','OFF'] },
];

const ENGINEERING: CrewMember[] = [
  { id: 'E1', name: 'Craig Holloway',     role: 'LAME — King Air',         base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200', 'B350', 'LAME', 'Avionics'], week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'E2', name: 'Darren Stubbs',      role: 'LAME — King Air',         base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200', 'B350', 'LAME'],             week: ['ON','ON','ON','ON','OFF','OFF','OFF'] },
  { id: 'E3', name: 'Mia Kowalski',       role: 'Licensed Engineer',        base: 'Broken Hill', dutyStatus: 'On Duty',  currency: true,  qualifications: ['B200', 'LAME'],                     week: ['ON','ON','OFF','OFF','OFF','ON','ON'] },
  { id: 'E4', name: 'Paul Tran',          role: 'Maintenance Controller',   base: 'Dubbo',       dutyStatus: 'On Duty',  currency: true,  qualifications: ['Veryon', 'MEL', 'Planning'],        week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'E5', name: 'Josh Reynolds',      role: 'Licensed Engineer',        base: 'Dubbo',       dutyStatus: 'Off Duty', currency: true,  qualifications: ['B200', 'B350', 'LAME'],             week: ['OFF','OFF','OFF','ON','ON','ON','ON'] },
];

const MANAGEMENT: CrewMember[] = [
  { id: 'M1', name: 'Fiona Gallagher',    role: 'Base Manager — Dubbo',     base: 'Dubbo',       touringBase: undefined,      dutyStatus: 'On Duty',  currency: true,  qualifications: ['OPS', 'CASA', 'ISO'],    week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'M2', name: 'Robert Chen',        role: 'Operations Manager',       base: 'Dubbo',       touringBase: 'Broken Hill',  dutyStatus: 'Touring',  currency: true,  qualifications: ['OPS', 'FRMS', 'Dispatch'], week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'M3', name: 'Angela Morris',      role: 'Base Manager — Broken Hill',base: 'Broken Hill', touringBase: undefined,      dutyStatus: 'On Duty', currency: true,  qualifications: ['OPS', 'CASA'],           week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'M5', name: 'Sarah Blackwell',    role: 'Base Manager — Launceston', base: 'Launceston',  touringBase: undefined,      dutyStatus: 'On Duty', currency: true,  qualifications: ['OPS', 'CASA', 'TAS Amb'], week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
  { id: 'M4', name: 'Peter Huang',        role: 'Chief Pilot',              base: 'Dubbo',       touringBase: 'Bankstown',    dutyStatus: 'Touring',  currency: true,  qualifications: ['B200', 'B350', 'LAME', 'CASA', 'EBA'], week: ['ON','ON','ON','ON','ON','OFF','OFF'] },
];

const GROUP_DATA: Record<RosterGroup, CrewMember[]> = {
  Pilots: PILOTS,
  Nurses: NURSES,
  Doctors: DOCTORS,
  Drivers: DRIVERS,
  Engineering: ENGINEERING,
  Management: MANAGEMENT,
};

const GROUP_ICONS: Record<RosterGroup, React.ReactNode> = {
  Pilots:      <Plane size={14} />,
  Nurses:      <Stethoscope size={14} />,
  Doctors:     <Stethoscope size={14} />,
  Drivers:     <Truck size={14} />,
  Engineering: <Wrench size={14} />,
  Management:  <Briefcase size={14} />,
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_STYLE: Record<DayCode, string> = {
  ON:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  OFF:   'bg-muted/60 text-muted-foreground border-border',
  P:     'bg-purple-500/20 text-purple-300 border-purple-500/30',
  LEAVE: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  FERRY: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  SIM:   'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  OPS:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const DUTY_STYLE: Record<string, string> = {
  'On Duty':  'status-green',
  'On Call':  'status-blue',
  'Off Duty': 'status-gray',
  'P Day':    'status-gray',
  'Leave':    'status-orange',
  'Touring':  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

// ─── Today's duty counts ──────────────────────────────────────────────────────
function todayCount(crew: CrewMember[]) {
  // "Today" = Mon (index 0)
  return {
    on:   crew.filter(c => c.week[0] === 'ON').length,
    off:  crew.filter(c => c.week[0] === 'OFF').length,
    other: crew.filter(c => !['ON','OFF'].includes(c.week[0])).length,
    total: crew.length,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Roster() {
  const [activeGroup, setActiveGroup] = useState<RosterGroup>('Pilots');
  const [syncing, setSyncing] = useState(false);
  const [lastSync] = useState('09:47 AEST');

  const crew = GROUP_DATA[activeGroup];
  const counts = todayCount(crew);

  function handleSync() {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1800);
  }

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Air Maestro Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            4-on / 4-off cycle · Dubbo &amp; Broken Hill · Week of 2–8 Jun 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Wifi size={12} />
            <span>Air Maestro — Live</span>
          </div>
          <button
            onClick={handleSync}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-card-border text-xs hover:bg-muted/40 transition-colors ${syncing ? 'opacity-60' : ''}`}
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : `Last sync ${lastSync}`}
          </button>
        </div>
      </div>

      {/* Air Maestro sync banner */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
        <Shield size={14} />
        <span>Air Maestro integration active — roster data pulled live from Operations · EBA rules enforced · FRMS limits monitored</span>
        <ChevronRight size={12} className="ml-auto" />
      </div>

      {/* Role group tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(GROUP_DATA) as RosterGroup[]).map(group => {
          const cnt = todayCount(GROUP_DATA[group]);
          const isActive = activeGroup === group;
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-card border-card-border text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              }`}
            >
              {GROUP_ICONS[group]}
              <span style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{group}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-muted text-muted-foreground'}`}>
                {cnt.on}/{cnt.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-card-border p-3">
          <div className="text-xs text-muted-foreground mb-1">On Duty Today</div>
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{counts.on}</div>
          <div className="text-xs text-muted-foreground">of {counts.total} {activeGroup.toLowerCase()}</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-3">
          <div className="text-xs text-muted-foreground mb-1">Off Duty</div>
          <div className="text-2xl font-bold text-muted-foreground" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{counts.off}</div>
          <div className="text-xs text-muted-foreground">unavailable today</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-3">
          <div className="text-xs text-muted-foreground mb-1">Other Status</div>
          <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{counts.other}</div>
          <div className="text-xs text-muted-foreground">P Day / Leave / SIM</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-3">
          <div className="text-xs text-muted-foreground mb-1">Currency Issues</div>
          <div className="text-2xl font-bold text-red-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {crew.filter(c => !c.currency).length}
          </div>
          <div className="text-xs text-muted-foreground">require attention</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.entries(DAY_STYLE) as [DayCode, string][]).map(([code, cls]) => (
          <span key={code} className="flex items-center gap-1.5">
            <span className={`w-4 h-4 rounded border inline-block ${cls}`} />
            {code === 'ON' ? 'On Duty' : code === 'OFF' ? 'Off Duty' : code === 'P' ? 'P Day (EBA)' : code === 'LEAVE' ? 'Annual Leave' : code === 'FERRY' ? 'Ferry Flight' : code === 'SIM' ? 'Simulator' : 'OPS Day'}
          </span>
        ))}
      </div>

      {/* Roster grid */}
      <div className="bg-card rounded-xl border border-card-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Name</th>
              <th className="text-center px-2 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              {DAYS.map(d => (
                <th key={d} className="text-center px-1 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[52px]">{d}</th>
              ))}
              {(activeGroup === 'Pilots') && (
                <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[90px]">Hrs</th>
              )}
              <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">Qualifications</th>
            </tr>
          </thead>
          <tbody>
            {crew.map(c => {
              const pct = c.hoursFlown && c.maxHours ? Math.round((c.hoursFlown / c.maxHours) * 100) : 0;
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm">{c.name}</div>
                      {c.touringBase && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                          Touring: {c.touringBase}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.role} · {c.base}</div>
                    {c.notes && (
                      <div className="text-xs text-orange-400 mt-0.5 flex items-center gap-1">
                        <AlertTriangle size={10} />{c.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${DUTY_STYLE[c.dutyStatus] || 'status-gray'}`}>
                      {c.dutyStatus}
                    </span>
                  </td>
                  {c.week.map((day, i) => (
                    <td key={i} className="px-1 py-3">
                      <div className={`mx-auto w-10 h-8 rounded flex items-center justify-center text-xs font-medium border ${DAY_STYLE[day] || DAY_STYLE['OFF']}`}>
                        {day}
                      </div>
                    </td>
                  ))}
                  {activeGroup === 'Pilots' && (
                    <td className="px-3 py-3">
                      <div className="text-center text-xs font-medium">{c.hoursFlown}/{c.maxHours}</div>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden w-16 mx-auto">
                        <div
                          className={`h-full rounded-full ${pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-3 text-center">
                    {c.currency
                      ? <CheckCircle size={16} className="mx-auto text-green-400" />
                      : <AlertTriangle size={16} className="mx-auto text-orange-400" />}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.qualifications?.map(q => (
                        <span key={q} className="text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                          {q}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FRMS / Ops footer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">FRMS Alert</div>
          <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {PILOTS.filter(p => !p.currency).length + NURSES.filter(n => !n.currency).length}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Capt. Clarke — currency lapsed · renewal 10 Jun</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Air Maestro Sync</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-green-400">Connected</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Last pull: {lastSync} · Next: 10:17</div>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Crew Available</div>
          <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {Object.values(GROUP_DATA).flat().filter(c => c.week[0] === 'ON').length}
            <span className="text-sm font-normal text-muted-foreground"> / {Object.values(GROUP_DATA).flat().length}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">All departments · Mon 2 Jun</div>
        </div>
      </div>

    </div>
  );
}
