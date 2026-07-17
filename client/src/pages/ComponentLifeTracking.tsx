import { useState } from "react";
import { Wrench, AlertTriangle, CheckCircle2, Clock, Package, Bell, Filter, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";

type ComponentStatus = "ok" | "warning" | "due" | "overdue";

interface Component {
  id: string;
  rego: string;
  aircraft: string;
  description: string;
  partNo: string;
  serialNo: string;
  lifeLimitHrs: number | null;
  lifeLimitCycles: number | null;
  lifeLimitDays: number | null;
  currentHrs: number;
  currentCycles: number;
  lastInspected: string;
  nextDue: string;
  status: ComponentStatus;
  adSbRef: string | null;
}

interface Part {
  id: string;
  partNo: string;
  description: string;
  aircraft: string[];
  onHand: number;
  minStock: number;
  reorderQty: number;
  unitCost: number;
  lastOrdered: string;
}

interface ADSB {
  id: string;
  ref: string;
  title: string;
  type: "AD" | "SB";
  applicability: string[];
  effectiveDate: string;
  complianceDate: string;
  status: "open" | "closed" | "deferred";
  affectedAircraft: string[];
}

const COMPONENTS: Component[] = [
  { id:"c1",  rego:"VH-MVW", aircraft:"King Air B200", description:"Left Engine Hot Section Inspection",        partNo:"3101386-1",   serialNo:"XB2248",  lifeLimitHrs:3500,  lifeLimitCycles:null, lifeLimitDays:null, currentHrs:3380, currentCycles:0,   lastInspected:"12 Jan 2026", nextDue:"Aug 2026",  status:"warning",  adSbRef:null },
  { id:"c2",  rego:"VH-MVW", aircraft:"King Air B200", description:"Right Engine Hot Section Inspection",       partNo:"3101386-1",   serialNo:"XB2249",  lifeLimitHrs:3500,  lifeLimitCycles:null, lifeLimitDays:null, currentHrs:3290, currentCycles:0,   lastInspected:"12 Jan 2026", nextDue:"Sep 2026",  status:"ok",       adSbRef:null },
  { id:"c3",  rego:"VH-MVW", aircraft:"King Air B200", description:"Main Landing Gear Overhaul",               partNo:"50-910175-9", serialNo:"LG4411A", lifeLimitHrs:null,  lifeLimitCycles:null, lifeLimitDays:2920, currentHrs:0,    currentCycles:0,   lastInspected:"05 Mar 2024", nextDue:"Mar 2032",  status:"ok",       adSbRef:null },
  { id:"c4",  rego:"VH-XYJ", aircraft:"King Air B200", description:"Propeller (LH) — Life Limit",              partNo:"HC-E4A-3E",   serialNo:"PRO9982", lifeLimitHrs:6000,  lifeLimitCycles:null, lifeLimitDays:null, currentHrs:5920, currentCycles:0,   lastInspected:"20 Apr 2026", nextDue:"Aug 2026",  status:"warning",  adSbRef:null },
  { id:"c5",  rego:"VH-XYJ", aircraft:"King Air B200", description:"ELT Battery Replacement",                  partNo:"110-334-06",  serialNo:"ELT0042", lifeLimitHrs:null,  lifeLimitCycles:null, lifeLimitDays:730,  currentHrs:0,    currentCycles:0,   lastInspected:"01 Jul 2024", nextDue:"01 Jul 2026", status:"overdue", adSbRef:null },
  { id:"c6",  rego:"VH-MVX", aircraft:"King Air B200", description:"Emergency Oxygen Bottle Hydrostatic Test",  partNo:"10-357AH",    serialNo:"OX1188",  lifeLimitHrs:null,  lifeLimitCycles:null, lifeLimitDays:1825, currentHrs:0,    currentCycles:0,   lastInspected:"15 Jun 2021", nextDue:"Jun 2026",  status:"overdue",  adSbRef:null },
  { id:"c7",  rego:"VH-LTQ", aircraft:"King Air B350", description:"LH Thrust Reverser Actuator Overhaul",     partNo:"101-590042-3",serialNo:"TRA7721", lifeLimitHrs:3000,  lifeLimitCycles:null, lifeLimitDays:null, currentHrs:2850, currentCycles:0,   lastInspected:"10 Feb 2026", nextDue:"Nov 2026",  status:"warning",  adSbRef:"SB3300-78-4002" },
  { id:"c8",  rego:"VH-LTQ", aircraft:"King Air B350", description:"Fire Extinguisher Bottle Recharge",        partNo:"63520-501",   serialNo:"FE0029",  lifeLimitHrs:null,  lifeLimitCycles:null, lifeLimitDays:365,  currentHrs:0,    currentCycles:0,   lastInspected:"10 Jul 2025", nextDue:"10 Jul 2026", status:"due",     adSbRef:null },
  { id:"c9",  rego:"VH-MQK", aircraft:"King Air B200", description:"Auxiliary Fuel Pump Replacement",          partNo:"35-389904-1", serialNo:"FP9901",  lifeLimitHrs:2000,  lifeLimitCycles:null, lifeLimitDays:null, currentHrs:1940, currentCycles:0,   lastInspected:"22 Nov 2025", nextDue:"Dec 2026",  status:"warning",  adSbRef:null },
  { id:"c10", rego:"VH-NAJ", aircraft:"King Air B200", description:"Tire & Wheel Assembly — Nose",             partNo:"096-02700-3", serialNo:"W0041N",  lifeLimitHrs:null,  lifeLimitCycles:800,  lifeLimitDays:null, currentHrs:0,    currentCycles:760, lastInspected:"01 Apr 2026", nextDue:"Oct 2026",  status:"ok",       adSbRef:null },
];

const PARTS: Part[] = [
  { id:"p1", partNo:"3101386-1",   description:"Engine Hot Section Inspection Kit",   aircraft:["B200","B350"], onHand:1,  minStock:1, reorderQty:2, unitCost:12400, lastOrdered:"Mar 2026" },
  { id:"p2", partNo:"HC-E4A-3E",   description:"Propeller Assembly (LH)",             aircraft:["B200"],        onHand:0,  minStock:1, reorderQty:1, unitCost:28500, lastOrdered:"Jan 2025" },
  { id:"p3", partNo:"110-334-06",  description:"ELT Lithium Battery",                 aircraft:["B200","B350"], onHand:3,  minStock:2, reorderQty:4, unitCost:320,   lastOrdered:"Jun 2026" },
  { id:"p4", partNo:"63520-501",   description:"Fire Extinguisher (Halon)",           aircraft:["B200","B350"], onHand:2,  minStock:2, reorderQty:4, unitCost:890,   lastOrdered:"Apr 2026" },
  { id:"p5", partNo:"35-389904-1", description:"Auxiliary Fuel Pump",                 aircraft:["B200"],        onHand:0,  minStock:1, reorderQty:1, unitCost:6200,  lastOrdered:"Oct 2024" },
  { id:"p6", partNo:"096-02700-3", description:"Nose Wheel Assembly",                 aircraft:["B200"],        onHand:1,  minStock:1, reorderQty:2, unitCost:4100,  lastOrdered:"Feb 2026" },
];

const AD_SBS: ADSB[] = [
  { id:"ad1", ref:"AD/B200/94",      title:"Emergency Exit Hatch Actuator Inspection",         type:"AD", applicability:["B200","B200C"], effectiveDate:"10 Mar 2026", complianceDate:"10 Sep 2026", status:"open",     affectedAircraft:["VH-MVW","VH-XYJ","VH-MVX","VH-MQK","VH-NAJ"] },
  { id:"ad2", ref:"AD/B350/12",      title:"Cabin Pressure Differential Sensor Replacement",   type:"AD", applicability:["B350"],        effectiveDate:"01 May 2026", complianceDate:"01 Nov 2026", status:"open",     affectedAircraft:["VH-LTQ"] },
  { id:"sb1", ref:"SB3300-78-4002",  title:"Thrust Reverser Actuator Seal Update",             type:"SB", applicability:["B350"],        effectiveDate:"22 Jan 2026", complianceDate:"30 Sep 2026", status:"open",     affectedAircraft:["VH-LTQ"] },
  { id:"sb2", ref:"SB200-27-4012",   title:"Aileron Control Rod End Inspection",               type:"SB", applicability:["B200","B200C"], effectiveDate:"15 Nov 2025", complianceDate:"15 May 2026", status:"closed",   affectedAircraft:["VH-MVW","VH-XYJ","VH-MVX"] },
  { id:"ad3", ref:"AD/B200/91",      title:"Fuel Selector Valve Inspection",                   type:"AD", applicability:["B200"],        effectiveDate:"01 Aug 2025", complianceDate:"01 Feb 2026", status:"closed",   affectedAircraft:["VH-MVW","VH-XYJ","VH-MVX","VH-MQK","VH-NAJ"] },
];

const STATUS_CFG: Record<ComponentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ok:       { label:"OK",       color:"text-green-400",  bg:"bg-green-500/10 border-green-500/20",  icon:<CheckCircle2 size={12} /> },
  warning:  { label:"Warning",  color:"text-amber-400",  bg:"bg-amber-500/10 border-amber-500/20",  icon:<AlertTriangle size={12} /> },
  due:      { label:"Due Now",  color:"text-orange-400", bg:"bg-orange-500/10 border-orange-500/20",icon:<Clock size={12} /> },
  overdue:  { label:"Overdue",  color:"text-red-400",    bg:"bg-red-500/10 border-red-500/20",      icon:<AlertTriangle size={12} /> },
};

type Tab = "components" | "inventory" | "adsb";

export default function ComponentLifeTracking() {
  const [activeTab, setActiveTab] = useState<Tab>("components");
  const [filterRego, setFilterRego] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedAd, setExpandedAd] = useState<string | null>(null);

  const regos = ["All", ...Array.from(new Set(COMPONENTS.map(c => c.rego)))];

  const filteredComponents = COMPONENTS.filter(c => {
    if (filterRego !== "All" && c.rego !== filterRego) return false;
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    return true;
  });

  const counts = {
    ok:      COMPONENTS.filter(c => c.status === "ok").length,
    warning: COMPONENTS.filter(c => c.status === "warning").length,
    due:     COMPONENTS.filter(c => c.status === "due").length,
    overdue: COMPONENTS.filter(c => c.status === "overdue").length,
  };

  const stockAlerts = PARTS.filter(p => p.onHand < p.minStock);
  const openADs = AD_SBS.filter(a => a.status === "open");

  const tabs: { key: Tab; label: string }[] = [
    { key:"components", label:"Component Life Limits" },
    { key:"inventory",  label:"Parts Inventory" },
    { key:"adsb",       label:"AD / SB Register" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Component Life Tracking</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Component hours · AD/SB applicability · Parts inventory · Reorder alerts</p>
        </div>
        {(counts.overdue > 0 || counts.due > 0) && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-full px-3 py-1.5">
            <AlertTriangle size={12} />
            {counts.overdue + counts.due} component{(counts.overdue + counts.due) > 1 ? "s" : ""} require immediate attention
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"OK",           value: counts.ok,      color:"text-green-400" },
          { label:"Warning",      value: counts.warning, color:"text-amber-400" },
          { label:"Due Now",      value: counts.due,     color:"text-orange-400" },
          { label:"Overdue",      value: counts.overdue, color:"text-red-400" },
        ].map(k => (
          <div key={k.label}
            className="bg-card border border-card-border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors"
            onClick={() => setFilterStatus(k.label === "OK" ? "ok" : k.label === "Warning" ? "warning" : k.label === "Due Now" ? "due" : "overdue")}>
            <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
            <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px
              ${activeTab === t.key ? "border-cyan-500 text-cyan-400" : "border-transparent text-muted-foreground hover:text-slate-300"}`}>
            {t.label}
            {t.key === "inventory" && stockAlerts.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-amber-500 text-black rounded-full px-1.5 py-0.5">{stockAlerts.length}</span>
            )}
            {t.key === "adsb" && openADs.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-orange-500 text-black rounded-full px-1.5 py-0.5">{openADs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Component Life Tab */}
      {activeTab === "components" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select value={filterRego} onChange={e => setFilterRego(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none">
              {regos.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none">
              {["All","ok","warning","due","overdue"].map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : STATUS_CFG[s as ComponentStatus].label}</option>)}
            </select>
            {filterStatus !== "All" && (
              <button onClick={() => setFilterStatus("All")} className="text-xs text-slate-500 hover:text-slate-300 px-2">Clear filter</button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-border">
                  {["Rego","Description","Part No","Life Limit","Current","Next Due","Status","AD/SB"].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComponents.map(c => {
                  const sc = STATUS_CFG[c.status];
                  const hrsRemain = c.lifeLimitHrs ? c.lifeLimitHrs - c.currentHrs : null;
                  const pct = c.lifeLimitHrs ? Math.min((c.currentHrs / c.lifeLimitHrs) * 100, 100) : c.lifeLimitCycles ? Math.min((c.currentCycles / c.lifeLimitCycles) * 100, 100) : null;
                  const barColor = pct === null ? "" : pct >= 95 ? "bg-red-400" : pct >= 85 ? "bg-amber-400" : "bg-green-400";
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-cyan-400">{c.rego}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-100 leading-tight">{c.description}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">S/N: {c.serialNo}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.partNo}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {c.lifeLimitHrs && `${c.lifeLimitHrs.toLocaleString()} hrs`}
                        {c.lifeLimitCycles && `${c.lifeLimitCycles} cycles`}
                        {c.lifeLimitDays && `${c.lifeLimitDays} days`}
                        {!c.lifeLimitHrs && !c.lifeLimitCycles && !c.lifeLimitDays && "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-300">
                          {c.lifeLimitHrs && `${c.currentHrs.toLocaleString()} hrs`}
                          {c.lifeLimitCycles && `${c.currentCycles} cycles`}
                          {!c.lifeLimitHrs && !c.lifeLimitCycles && c.lastInspected}
                        </div>
                        {pct !== null && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{Math.round(pct)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">{c.nextDue}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                          {sc.icon}{sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-amber-400 font-mono">{c.adSbRef ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <div className="space-y-3">
          {stockAlerts.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <Bell size={14} />
              <span className="font-semibold">{stockAlerts.length} part{stockAlerts.length > 1 ? "s" : ""} below minimum stock — reorder required</span>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-border">
                  {["Part No","Description","Applicable Aircraft","On Hand","Min Stock","Reorder Qty","Unit Cost","Last Ordered","Status"].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PARTS.map(p => {
                  const low = p.onHand < p.minStock;
                  return (
                    <tr key={p.id} className={`border-b border-border/50 hover:bg-slate-900/30 transition-colors ${low ? "bg-amber-950/10" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400">{p.partNo}</td>
                      <td className="px-4 py-3 text-sm text-slate-100">{p.description}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.aircraft.join(", ")}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${low ? "text-red-400" : "text-green-400"}`}>{p.onHand}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.minStock}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.reorderQty}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">${p.unitCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{p.lastOrdered}</td>
                      <td className="px-4 py-3">
                        {low
                          ? <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5"><Bell size={9} />Reorder</span>
                          : <span className="inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5"><CheckCircle2 size={9} />OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AD/SB Tab */}
      {activeTab === "adsb" && (
        <div className="space-y-3">
          {openADs.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-500/10 border border-orange-500/25 rounded-xl px-4 py-3">
              <AlertTriangle size={14} />
              <span className="font-semibold">{openADs.length} open AD/SB{openADs.length > 1 ? "s" : ""} require compliance action</span>
            </div>
          )}
          <div className="space-y-2">
            {AD_SBS.map(ad => {
              const isOpen = expandedAd === ad.id;
              const statusColor = ad.status === "open" ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                : ad.status === "deferred" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                : "text-green-400 bg-green-500/10 border-green-500/20";
              const typeColor = ad.type === "AD" ? "bg-red-700 text-white" : "bg-blue-700 text-white";
              return (
                <div key={ad.id} className="bg-card border border-card-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedAd(isOpen ? null : ad.id)}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${typeColor}`}>{ad.type}</span>
                    <span className="font-mono text-sm font-semibold text-slate-100">{ad.ref}</span>
                    <span className="flex-1 text-sm text-slate-300 truncate">{ad.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${statusColor}`}>{ad.status}</span>
                    {isOpen ? <ChevronUp size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
                  </div>
                  {isOpen && (
                    <div className="border-t border-border px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><div className="text-xs text-muted-foreground mb-0.5">Effective Date</div><div className="text-slate-200">{ad.effectiveDate}</div></div>
                        <div><div className="text-xs text-muted-foreground mb-0.5">Compliance Due</div><div className={ad.status === "open" ? "text-orange-300 font-semibold" : "text-slate-200"}>{ad.complianceDate}</div></div>
                        <div><div className="text-xs text-muted-foreground mb-0.5">Applicability</div><div className="text-slate-200">{ad.applicability.join(", ")}</div></div>
                        <div><div className="text-xs text-muted-foreground mb-0.5">Status</div><span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusColor}`}>{ad.status}</span></div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1.5">Affected Aircraft</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ad.affectedAircraft.map(r => (
                            <span key={r} className="font-mono text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-cyan-400">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
