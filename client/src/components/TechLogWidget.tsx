import { ExternalLink, BookOpen, AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { Link } from "wouter";

// Demo data — reflects a typical RFDS daily snapshot
const OPEN_DEFECTS = [
  { rego: "VH-NAJ", defect: "LH cabin reading light U/S", raised: "14 Jun", cat: "MEL", mel: "A" },
  { rego: "VH-LTQ", defect: "Co-pilot USB port intermittent", raised: "15 Jun", cat: "Minor", mel: null },
];

const RECENT_ENTRIES = [
  { rego: "VH-NAJ", type: "Journey Log", detail: "DBO–ESS–BHI  ·  2.4 hrs", date: "Today", pilot: "A. Striffler" },
  { rego: "VH-LTQ", type: "Journey Log", detail: "BHI–BKK  ·  1.8 hrs", date: "Today", pilot: "T. McBride" },
  { rego: "VH-XYR", type: "Tech Entry",  detail: "120 hr check completed — RTS", date: "2 Jun", pilot: "LAME: J. Hartley" },
];

export default function TechLogWidget() {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Tech &amp; Journey Log
          </span>
        </div>
        <Link href="/tech-log">
          <a className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
            Open full log <ExternalLink size={10} />
          </a>
        </Link>
      </div>

      {/* Open defects */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={11} className="text-orange-400" />
          <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide">
            Open Defects ({OPEN_DEFECTS.length})
          </span>
        </div>
        <div className="space-y-1.5">
          {OPEN_DEFECTS.map((d, i) => (
            <div key={i} className="flex items-start justify-between gap-2 px-3 py-2 bg-orange-500/5 border border-orange-400/20 rounded-xl">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-orange-300">{d.rego}</span>
                  {d.mel && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-orange-400/20 text-orange-300 rounded-full border border-orange-400/30 font-semibold">
                      MEL {d.mel}
                    </span>
                  )}
                  <span className="text-[8px] px-1.5 py-0.5 bg-background border border-card-border text-muted-foreground rounded-full">
                    {d.cat}
                  </span>
                </div>
                <p className="text-[10px] text-foreground/80 truncate">{d.defect}</p>
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">{d.raised}</span>
            </div>
          ))}
          {OPEN_DEFECTS.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border border-green-400/20 rounded-xl">
              <CheckCircle size={11} className="text-green-400" />
              <span className="text-[10px] text-green-400">No open defects — fleet clear</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent entries */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock size={11} className="text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Entries
          </span>
        </div>
        <div className="space-y-1.5">
          {RECENT_ENTRIES.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-background/60 border border-card-border rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <Wrench size={10} className="text-cyan-400/60 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-cyan-300">{e.rego}</span>
                    <span className="text-[9px] px-1.5 py-px bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 rounded-full">
                      {e.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{e.detail}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-muted-foreground">{e.date}</p>
                <p className="text-[9px] text-muted-foreground/60">{e.pilot}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
