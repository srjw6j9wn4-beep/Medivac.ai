import { AIRCRAFT, type UserRole } from "@/lib/data";
import { Wrench, CheckCircle, AlertTriangle, FileText, Fuel, Tool } from "lucide-react";

interface Props { role: UserRole; }

export default function Aircraft({ role }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>Aircraft Status</h1>
        <p className="text-sm text-muted-foreground mt-0.5">King Air B200/B300 fleet · Veryon maintenance integration</p>
      </div>

      <div className="grid gap-5">
        {AIRCRAFT.map(ac => (
          <div key={ac.rego} className="bg-card rounded-xl border border-card-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  ac.status === 'Airborne' ? 'bg-cyan-400' :
                  ac.status === 'Serviceable' ? 'bg-green-400' :
                  ac.status === 'Maintenance' ? 'bg-orange-400' : 'bg-red-400'
                }`} />
                <div>
                  <h2 className="text-base font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>{ac.rego}</h2>
                  <div className="text-sm text-muted-foreground">{ac.type} · Base: {ac.base}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ac.defects > 0 && (
                  <span className="status-orange text-xs px-2 py-0.5 rounded-full">{ac.defects} defect{ac.defects > 1 ? 's' : ''}</span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  ac.status === 'Airborne' ? 'status-blue' :
                  ac.status === 'Serviceable' ? 'status-green' :
                  ac.status === 'Maintenance' ? 'status-orange' : 'status-red'
                }`}>{ac.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCell icon={<Wrench size={14} />} label="Next Service" value={ac.nextService} />
              <InfoCell icon={<FileText size={14} />} label="Tech Log" value={ac.techLogState} valueColor={
                ac.techLogState === 'Current' ? 'text-green-400' :
                ac.techLogState === 'Pending' ? 'text-yellow-400' : 'text-red-400'
              } />
              <InfoCell icon={<CheckCircle size={14} />} label="Maint. Release" value={ac.maintenanceRelease ? 'Released' : 'Not Released'} valueColor={ac.maintenanceRelease ? 'text-green-400' : 'text-red-400'} />
              <InfoCell icon={<AlertTriangle size={14} />} label="Open Defects" value={ac.defects > 0 ? `${ac.defects} open` : 'None'} valueColor={ac.defects > 0 ? 'text-orange-400' : 'text-green-400'} />
            </div>

            {/* W&B / Fuel note for King Air */}
            <div className="mt-4 p-3 bg-background rounded-lg border border-border text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">King Air Performance Note: </span>
              MTOW 13,500 lb cap active. Standard fuel call: 2,000 lb/sector. APG runway analysis required before dispatch release.
              Fuel in <span className="text-cyan-400 font-semibold">pounds (lb)</span>.
            </div>
          </div>
        ))}
      </div>

      {/* Handover log */}
      <div className="bg-card rounded-xl border border-card-border p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Aircraft Handover Log — VH-MVW</h2>
        <div className="space-y-3">
          {[
            { from: 'Capt. R. Hughes', to: 'Capt. T. Barnes', time: '18:00', status: 'Serviceable', fuel: '2,400 lb', notes: 'No defects. Oil checked. Oxygen full.' },
          ].map((h, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-background rounded-lg border border-border text-sm">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{h.from}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="font-semibold">{h.to}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{h.time}</span>
                </div>
                <div className="text-xs text-muted-foreground">{h.notes} · Fuel: {h.fuel}</div>
              </div>
              <span className="status-green text-xs px-2 py-0.5 rounded-full flex-shrink-0">{h.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-xs text-cyan-400">
          Next pilot acceptance required from Capt. T. Barnes before 18:30. Maintenance hold: None active.
        </div>
      </div>
    </div>
  );
}

function InfoCell({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="p-3 bg-background rounded-lg border border-border">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <span className="text-cyan-400">{icon}</span>
        {label}
      </div>
      <div className={`text-sm font-semibold ${valueColor || 'text-foreground'}`}>{value}</div>
    </div>
  );
}
