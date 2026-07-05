import { type UserRole } from "@/lib/data";
import { AlertTriangle, CheckCircle, Anchor, Heart, Activity, MapPin, Clock, Shield } from "lucide-react";

interface Props { role: UserRole; }

export default function SpecialMissions({ role }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>Special Missions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Lord Howe Island · NETS · ECMO — enhanced dispatch requirements</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Lord Howe Island */}
        <div className="bg-card rounded-xl border border-orange-500/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Anchor size={18} className="text-orange-400" />
            <h2 className="text-base font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>Lord Howe Island</h2>
            <span className="ml-auto status-orange text-xs px-2 py-0.5 rounded-full">Over-water</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">YLHI — 700 km over-water sector. Extended dispatch requirements apply.</p>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Life Raft', required: true, present: false },
              { label: 'Over-water Survival Equipment', required: true, present: false },
              { label: 'EPIRBs × 2', required: true, present: true },
              { label: 'Life Jackets × pax', required: true, present: true },
              { label: 'HF Comms', required: true, present: true },
              { label: 'SARTIME lodged', required: true, present: true },
            ].map((g, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${g.present ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/30'}`}>
                {g.present ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" /> : <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />}
                <span className={g.present ? 'text-foreground' : 'text-red-300'}>{g.label}</span>
                {g.required && !g.present && <span className="ml-auto text-red-400 font-bold">BLOCKER</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle size={12} /> Dispatch BLOCKED — life raft & survival equipment required
          </div>
        </div>

        {/* NETS */}
        <div className="bg-card rounded-xl border border-cyan-500/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={18} className="text-cyan-400" />
            <h2 className="text-base font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>NETS</h2>
            <span className="ml-auto status-blue text-xs px-2 py-0.5 rounded-full">Neonatal</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Neonatal Emergency Transport. Incubator and specialist crew required.</p>
          <div className="space-y-2 text-xs">
            {[
              { label: 'NETS Incubator', present: true },
              { label: 'Neonatal Specialist', present: true },
              { label: 'Receiving NICU Confirmed', present: true },
              { label: 'Medical Equipment Logged', present: true },
              { label: 'Patient Transfer Authority', present: true },
              { label: 'Insurance / Medicare', present: true },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-green-500/5 border-green-500/20">
                <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                <span>{g.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 flex items-center gap-2">
            <CheckCircle size={12} /> All gates satisfied — Mission cleared for dispatch
          </div>
        </div>

        {/* ECMO */}
        <div className="bg-card rounded-xl border border-purple-500/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-purple-400" />
            <h2 className="text-base font-bold" style={{fontFamily:"'Cabinet Grotesk',sans-serif"}}>ECMO</h2>
            <span className="ml-auto status-gray text-xs px-2 py-0.5 rounded-full">Critical</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Extracorporeal Membrane Oxygenation transport. Highest-acuity configuration.</p>
          <div className="space-y-2 text-xs">
            {[
              { label: 'ECMO Circuit & Pump', present: true },
              { label: 'Perfusionist on board', present: false },
              { label: 'ICU Doctor', present: true },
              { label: 'ICU Nurse', present: true },
              { label: 'Receiving ICU Confirmed', present: true },
              { label: 'Power supply verified', present: true },
            ].map((g, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${g.present ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/30'}`}>
                {g.present ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" /> : <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />}
                <span className={g.present ? 'text-foreground' : 'text-orange-300'}>{g.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs text-orange-400 flex items-center gap-2">
            <AlertTriangle size={12} /> Perfusionist assignment pending
          </div>
        </div>
      </div>
    </div>
  );
}
