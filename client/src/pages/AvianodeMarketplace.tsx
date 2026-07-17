import { useState } from "react";
import { Globe, Plane, DollarSign, CheckCircle2, Clock, TrendingUp, ExternalLink, Star, Send, BarChart3, Users } from "lucide-react";

interface Charter {
  id: string;
  ref: string;
  requestedBy: string;
  country: string;
  origin: string;
  destination: string;
  pax: number;
  dateRequested: string;
  departureDate: string;
  category: string;
  quotedAUD: number;
  status: "new" | "quoted" | "accepted" | "declined";
  aircraft: string | null;
}

const REQUESTS: Charter[] = [
  { id:"r1", ref:"AVI-2026-00412", requestedBy:"Air Alliance MedFlight (Germany)",      country:"DE", origin:"Sydney (YSSY)",    destination:"Singapore (WSSS)", pax:1, dateRequested:"17 Jul 2026", departureDate:"19 Jul 2026", category:"Aeromedical Repatriation",  quotedAUD:185000, status:"new",      aircraft:null },
  { id:"r2", ref:"AVI-2026-00410", requestedBy:"Global Doctors Air (Switzerland)",       country:"CH", origin:"Melbourne (YMML)", destination:"Auckland (NZAA)",   pax:2, dateRequested:"16 Jul 2026", departureDate:"18 Jul 2026", category:"Medical Charter (NEPT)",    quotedAUD:62000,  status:"quoted",   aircraft:"VH-LTQ" },
  { id:"r3", ref:"AVI-2026-00408", requestedBy:"Medavia (Malta)",                        country:"MT", origin:"Brisbane (YBBN)", destination:"Cairns (YBCS)",       pax:1, dateRequested:"15 Jul 2026", departureDate:"16 Jul 2026", category:"Aeromedical IHT",           quotedAUD:28500,  status:"accepted", aircraft:"VH-NAJ" },
  { id:"r4", ref:"AVI-2026-00401", requestedBy:"CEGA Group (United Kingdom)",            country:"GB", origin:"Darwin (YPDN)",    destination:"Perth (YPPH)",        pax:1, dateRequested:"14 Jul 2026", departureDate:"15 Jul 2026", category:"Organ Transport",           quotedAUD:34200,  status:"accepted", aircraft:"VH-MQK" },
  { id:"r5", ref:"AVI-2026-00399", requestedBy:"International SOS (Singapore)",          country:"SG", origin:"Adelaide (YPAD)", destination:"Sydney (YSSY)",        pax:3, dateRequested:"14 Jul 2026", departureDate:"14 Jul 2026", category:"Medical Charter (NEPT)",    quotedAUD:19800,  status:"declined", aircraft:null },
];

const AIRCRAFT_LISTINGS = [
  { rego:"VH-MVW", type:"King Air B200", base:"Dubbo",       range:"1,800 nm", config:"Aeromedical (2 stretcher + 2 med crew)", listed:true,  hourlyUSD:2800 },
  { rego:"VH-LTQ", type:"King Air B350", base:"Bankstown",   range:"2,100 nm", config:"Aeromedical / Pax hybrid (6 pax)",       listed:true,  hourlyUSD:3500 },
  { rego:"VH-MQK", type:"King Air B200", base:"Essendon",    range:"1,800 nm", config:"Aeromedical (2 stretcher + 2 med crew)", listed:true,  hourlyUSD:2800 },
  { rego:"VH-NAJ", type:"King Air B200", base:"Essendon",    range:"1,800 nm", config:"Aeromedical (2 stretcher + 2 med crew)", listed:true,  hourlyUSD:2800 },
  { rego:"VH-MVX", type:"King Air B200", base:"Broken Hill", range:"1,800 nm", config:"Aeromedical (2 stretcher + 2 med crew)", listed:false, hourlyUSD:2800 },
];

const STATS = [
  { label:"Active Listings",        value:"4",           sub:"aircraft on Avinode",       icon:<Plane size={16} className="text-cyan-400" /> },
  { label:"Requests This Month",    value:"12",          sub:"via Avinode marketplace",   icon:<Globe size={16} className="text-cyan-400" /> },
  { label:"Accepted / Won",         value:"7",           sub:"missions confirmed",         icon:<CheckCircle2 size={16} className="text-green-400" /> },
  { label:"Revenue Generated",      value:"$318,500",    sub:"AUD excl. GST YTD",         icon:<DollarSign size={16} className="text-amber-400" /> },
];

const STATUS_CFG = {
  new:      { label:"New",      color:"text-cyan-400",  bg:"bg-cyan-500/10 border-cyan-500/25" },
  quoted:   { label:"Quoted",   color:"text-amber-400", bg:"bg-amber-500/10 border-amber-500/25" },
  accepted: { label:"Accepted", color:"text-green-400", bg:"bg-green-500/10 border-green-500/20" },
  declined: { label:"Declined", color:"text-slate-400", bg:"bg-slate-500/10 border-slate-500/25" },
};

export default function AvianodeMarketplace() {
  const [activeTab, setActiveTab] = useState<"requests" | "listings" | "performance">("requests");
  const [selected, setSelected] = useState<string | null>("r1");

  const selectedRequest = REQUESTS.find(r => r.id === selected);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Avinode Air Ambulance Marketplace</h1>
            <a href="https://avinode.com" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline">
              <ExternalLink size={11} /> avinode.com
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            RFDS SE fleet listed on Avinode's global air ambulance network — 180+ vetted operators · 430+ aircraft · Inbound charter requests
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
          <CheckCircle2 size={11} />
          Avinode Connected · Profile Active
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-muted-foreground">{s.label}</span></div>
            <div className="text-2xl font-bold text-slate-100" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key:"requests",    label:"Inbound Requests" },
          { key:"listings",    label:"Our Listings" },
          { key:"performance", label:"Performance" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors border-b-2 -mb-px
              ${activeTab === t.key ? "border-cyan-500 text-cyan-400" : "border-transparent text-muted-foreground hover:text-slate-300"}`}>
            {t.label}
            {t.key === "requests" && REQUESTS.filter(r => r.status === "new").length > 0 && (
              <span className="ml-1.5 text-[10px] bg-cyan-600 text-white rounded-full px-1.5 py-0.5">
                {REQUESTS.filter(r => r.status === "new").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Request list */}
          <div className="space-y-2">
            {REQUESTS.map(r => {
              const sc = STATUS_CFG[r.status];
              return (
                <div key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`bg-card border rounded-xl p-3 cursor-pointer transition-all ${selected === r.id ? "border-cyan-500/50 bg-cyan-950/20" : "border-card-border hover:border-slate-600"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-slate-400">{r.ref}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  </div>
                  <div className="text-sm text-slate-200 font-medium leading-tight">{r.requestedBy}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{r.origin} → {r.destination}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-500">{r.category}</span>
                    <span className="text-xs font-semibold text-amber-400">${r.quotedAUD.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Request detail */}
          {selectedRequest && (
            <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-100">{selectedRequest.ref}</h2>
                  <p className="text-xs text-muted-foreground">{selectedRequest.requestedBy} · {selectedRequest.country}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_CFG[selectedRequest.status].bg} ${STATUS_CFG[selectedRequest.status].color}`}>
                  {STATUS_CFG[selectedRequest.status].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label:"Origin",         value: selectedRequest.origin },
                  { label:"Destination",    value: selectedRequest.destination },
                  { label:"Category",       value: selectedRequest.category },
                  { label:"Passengers",     value: `${selectedRequest.pax} pax` },
                  { label:"Requested",      value: selectedRequest.dateRequested },
                  { label:"Departure",      value: selectedRequest.departureDate },
                  { label:"Quoted (AUD)",   value: `$${selectedRequest.quotedAUD.toLocaleString()} excl. GST` },
                  { label:"Assigned",       value: selectedRequest.aircraft ?? "TBC" },
                ].map(f => (
                  <div key={f.label}>
                    <div className="text-xs text-muted-foreground mb-0.5">{f.label}</div>
                    <div className="text-slate-200 font-medium">{f.value}</div>
                  </div>
                ))}
              </div>

              {selectedRequest.status === "new" && (
                <div className="flex gap-2 pt-2">
                  <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 text-sm transition-colors">
                    <Send size={14} /> Send Quote
                  </button>
                  <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-4 py-2 text-sm transition-colors">
                    Decline Request
                  </button>
                </div>
              )}
              {selectedRequest.status === "quoted" && (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Clock size={12} /> Quote sent — awaiting operator response
                </div>
              )}
              {selectedRequest.status === "accepted" && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Mission confirmed — {selectedRequest.aircraft}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === "listings" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">RFDS SE aircraft visible to 180+ Avinode operators worldwide. Toggle listing status below.</p>
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60 border-b border-border">
                  {["Rego","Type","Base","Range","Configuration","Rate (USD/hr)","Listed"].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AIRCRAFT_LISTINGS.map(a => (
                  <tr key={a.rego} className="border-b border-border/50 hover:bg-slate-900/30">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-cyan-400">{a.rego}</td>
                    <td className="px-4 py-3 text-sm text-slate-200">{a.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{a.base}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{a.range}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{a.config}</td>
                    <td className="px-4 py-3 text-xs text-amber-400 font-semibold">USD {a.hourlyUSD.toLocaleString()}/hr</td>
                    <td className="px-4 py-3">
                      {a.listed
                        ? <span className="inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5"><CheckCircle2 size={9} />Active</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-500/10 border border-slate-500/25 rounded-full px-2 py-0.5"><Clock size={9} />Unlisted</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5"><Star size={11} className="text-amber-400" /> RFDS SE Avinode rating: 4.9/5 · 38 operator reviews · Member since 2019</div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label:"Total Requests (YTD)",    value:"47",       sub:"via Avinode" },
              { label:"Quote Conversion Rate",   value:"64%",      sub:"requests → accepted" },
              { label:"Avg Response Time",       value:"22 min",   sub:"quote turnaround" },
              { label:"Revenue (YTD)",           value:"$1.24M",   sub:"AUD excl. GST" },
              { label:"Avg Mission Value",       value:"$26,400",  sub:"AUD per mission" },
              { label:"Top Requesting Country",  value:"Germany",  sub:"12 requests" },
            ].map(k => (
              <div key={k.label} className="bg-card border border-card-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
                <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{k.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Monthly Request Volume (2026)</h3>
            <div className="flex items-end gap-2 h-24">
              {[4,6,3,8,5,9,12].map((v, i) => {
                const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
                const max = 12;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${(v / max) * 80}px`, background: i === 6 ? "#0e7490" : "#164e63" }} />
                    <span className="text-[9px] text-slate-500">{months[i]}</span>
                    <span className="text-[9px] font-bold text-slate-300">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-600 border-t border-slate-800 pt-4">
        Powered by Avinode Air Ambulance Marketplace API · RFDS SE Operator Profile #AU-0047 · All rates in AUD excl. GST
      </div>
    </div>
  );
}
