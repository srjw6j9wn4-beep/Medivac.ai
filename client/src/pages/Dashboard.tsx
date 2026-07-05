import { MISSIONS, AIRCRAFT, CREW, type UserRole } from "@/lib/data";
import { Activity, Plane, Users, AlertTriangle, CheckCircle, Clock, Radio, TrendingUp, Shield } from "lucide-react";

interface Props { role: UserRole; }

export default function Dashboard({ role }: Props) {
  const activeMissions = MISSIONS.filter(m => m.status === 'Active' || m.status === 'Airborne');
  const pendingReleases = MISSIONS.filter(m => m.releaseGates.some(g => !g.ok));
  const serviceableAircraft = AIRCRAFT.filter(a => a.status === 'Serviceable' || a.status === 'Airborne');
  const onDutyCrew = CREW.filter(c => c.dutyStatus === 'On Duty' || c.dutyStatus === 'On Call');

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold" style={{fontFamily: "'Cabinet Grotesk', sans-serif"}}>Operations Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Friday 6 June 2026 · RFDS SE Section · Dubbo, Broken Hill & Launceston</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Activity size={18} className="text-cyan-400" />} label="Active Missions" value={activeMissions.length.toString()} sub="1 airborne · 1 active" color="cyan" />
        <KpiCard icon={<Plane size={18} className="text-green-400" />} label="Aircraft Ready" value={`${serviceableAircraft.length}/${AIRCRAFT.length}`} sub="1 in maintenance" color="green" />
        <KpiCard icon={<Users size={18} className="text-blue-400" />} label="Crew On Duty" value={`${onDutyCrew.length}`} sub="across all bases" color="blue" />
        <KpiCard icon={<AlertTriangle size={18} className="text-orange-400" />} label="Pending Releases" value={pendingReleases.length.toString()} sub="require attention" color="orange" />
      </div>

      {/* Mission board */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today's Missions <span className="text-cyan-400/60 font-normal normal-case tracking-normal">({MISSIONS.length})</span></h2>
            <a href="/#/missions" className="text-xs text-cyan-400 hover:underline">View all →</a>
          </div>
          {MISSIONS.map(m => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Aircraft status */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fleet Status</h2>
            <div className="space-y-2">
              {AIRCRAFT.map(ac => (
                <div key={ac.rego} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-card-border">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ac.status === 'Airborne' ? 'bg-cyan-400 fleet-dot-active' :
                    ac.status === 'Serviceable' ? 'bg-green-400' :
                    ac.status === 'Maintenance' ? 'bg-orange-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{ac.rego}</div>
                    <div className="text-xs text-muted-foreground truncate">{ac.type} · {ac.base.split(' ')[0]}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ac.status === 'Airborne' ? 'status-blue mission-status-active' :
                    ac.status === 'Serviceable' ? 'status-green' :
                    ac.status === 'Maintenance' ? 'status-orange' : 'status-red'
                  }`}>{ac.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance snapshot */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Compliance Snapshot</h2>
            <div className="bg-card rounded-lg border border-card-border p-4 space-y-3">
              <ComplianceRow label="ISO 9001" score={78} />
              <ComplianceRow label="ISO 13485" score={62} />
              <ComplianceRow label="ISO 27001" score={85} />
              <ComplianceRow label="CASA Compliance" score={94} />
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction href="/#/dispatch" icon={<Radio size={14} />} label="New Dispatch" />
              <QuickAction href="/#/roster" icon={<Users size={14} />} label="Crew Roster" />
              <QuickAction href="/#/aircraft" icon={<Plane size={14} />} label="Fleet Status" />
              <QuickAction href="/#/audit" icon={<Shield size={14} />} label="Audit Log" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const borderColors: Record<string, string> = {
    cyan: 'border-cyan-500/30', green: 'border-green-500/30',
    blue: 'border-blue-500/30', orange: 'border-orange-500/30',
  };
  return (
    <div className={`bg-card rounded-xl border ${borderColors[color]} p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-background">{icon}</div>
      </div>
      <div className="text-2xl font-bold" style={{fontFamily: "'Cabinet Grotesk', sans-serif"}}>{value}</div>
      <div className="text-xs font-medium text-foreground mt-0.5">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

const ACTIVE_MISSION_STATUSES = new Set(['Active', 'Airborne', 'Pending']);

function MissionCard({ mission }: { mission: typeof MISSIONS[0] }) {
  const statusColor: Record<string, string> = {
    Active: 'status-blue', Airborne: 'status-green', Pending: 'status-yellow',
    Complete: 'status-gray', Cancelled: 'status-red',
  };
  const isActiveMission = ACTIVE_MISSION_STATUSES.has(mission.status);
  const priorityColor: Record<string, string> = {
    P1:      'bg-red-500/30    text-red-200    border border-red-400/70    font-bold    px-1.5 py-0.5 rounded',
    P2:      'bg-orange-500/30 text-orange-200 border border-orange-400/70 font-bold    px-1.5 py-0.5 rounded',
    P3:      'bg-yellow-500/30 text-yellow-200 border border-yellow-400/70 font-bold    px-1.5 py-0.5 rounded',
    Routine: 'bg-gray-500/20   text-gray-300   border border-gray-400/40   font-semibold px-1.5 py-0.5 rounded',
  };
  const releaseOk = mission.releaseGates.every(g => g.ok);
  return (
    <div className="bg-card rounded-xl border border-card-border p-4 hover:border-cyan-500/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-cyan-400" style={{fontFamily: "'Cabinet Grotesk', sans-serif"}}>{mission.callsign}</span>
            <span className={`text-xs font-bold ${priorityColor[mission.priority]}`}>{mission.priority}</span>
            <span className="text-xs text-foreground/80 font-medium">{mission.type}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-foreground font-medium">{mission.from}</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-xs text-foreground font-medium">{mission.to}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[mission.status]}${isActiveMission ? ' mission-status-active' : ''}`}>{mission.status}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Plane size={11} />{mission.aircraft}</span>
        <span className="flex items-center gap-1"><Clock size={11} />ETD {mission.etd} · ETA {mission.eta}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {mission.releaseGates.map((g, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${g.ok ? 'bg-green-500/60' : 'bg-orange-500/60'}`} title={g.label} />
          ))}
        </div>
        <span className={`text-xs flex items-center gap-1 ${releaseOk ? 'text-green-400' : 'text-orange-400'}`}>
          {releaseOk ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
          {releaseOk ? 'Released' : 'Pending'}
        </span>
      </div>
    </div>
  );
}

function ComplianceRow({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} className="flex items-center gap-2 p-2.5 bg-card rounded-lg border border-card-border hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors text-xs font-medium text-foreground">
      <span className="text-cyan-400">{icon}</span>
      {label}
    </a>
  );
}
