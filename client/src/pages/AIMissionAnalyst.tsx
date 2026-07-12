import { useState } from "react";
import type { UserRole } from "@/lib/data";
import { MISSIONS, CREW } from "@/lib/data";
import { generatePDF } from "@/lib/generatePDF";

interface Props { role: UserRole }

const SAMPLE_ANALYSIS = [
  {
    missionId: "M001",
    callsign: "MEDIVAC 01",
    summary: "P1 Medivac — Dubbo to Sydney. Patient: 67yo male, STEMI. Crew optimal for case complexity. ETA within cardiac intervention window.",
    risks: [
      { label: "Weather (IMC enroute)", level: "low" },
      { label: "Patient instability risk", level: "medium" },
      { label: "Crew duty hours", level: "low" },
    ],
    recommendation: "PROCEED — All release gates green. Recommended direct track YSDU–YSSY. Brief crew on deterioration protocol.",
    confidence: 94,
    generated: "06:18 AEST",
  },
  {
    missionId: "M002",
    callsign: "MEDIVAC 02",
    summary: "P2 NEPT — Broken Hill to Deniliquin. Elderly patient, stable. APG release pending; fuel confirmation outstanding.",
    risks: [
      { label: "APG release not yet issued", level: "high" },
      { label: "Fuel uplift unconfirmed", level: "high" },
      { label: "Airspace coordination", level: "low" },
    ],
    recommendation: "HOLD — 2 release gates outstanding. Do not dispatch until APG and fuel confirmed.",
    confidence: 72,
    generated: "08:30 AEST",
  },
  {
    missionId: "M004",
    callsign: "MEDIVAC 03",
    summary: "P1 ACC — Walgett to Dubbo. Airborne. Patient: paediatric, respiratory distress. All gates green at departure.",
    risks: [
      { label: "In-flight deterioration", level: "medium" },
      { label: "Night ops (NVG equipped)", level: "low" },
    ],
    recommendation: "MONITOR — Mission in progress. Alert receiving hospital 15 min prior ETA.",
    confidence: 88,
    generated: "04:05 AEST",
  },
];

const INSIGHT_FEED = [
  { time: "06:18", icon: "🧠", text: "Mission M001 risk profile reassessed — crew fatigue index 12% below limit. Cleared." },
  { time: "08:31", icon: "⚠️", text: "M002 APG gate outstanding >45 min. Escalation recommended to Dispatch Supervisor." },
  { time: "04:06", icon: "📡", text: "M004 airborne — telemetry nominal. Receiving team notified via HealthConnect API." },
  { time: "07:55", icon: "📋", text: "Daily audit summary generated — 3 missions completed, 0 safety events, 1 deviation (fuel planning)." },
  { time: "06:00", icon: "🌦", text: "Forecast updated — tailwinds on YSDU–YSSY corridor reducing burn est. by 4%." },
];

const CHAT_STARTERS = [
  "What is the current fleet readiness status?",
  "Summarise overnight missions for handover",
  "Which crew are approaching hour limits?",
  "Explain the APG hold on MEDIVAC 02",
];

type ChatMsg = { role: "user" | "ai"; text: string };

const AI_REPLIES: Record<string, string> = {
  "What is the current fleet readiness status?":
    "Fleet status: VH-MVW airborne Dubbo (ETA 05:45), VH-MQD airborne Dubbo. VH-XYR serviceable Broken Hill (1 MEL defect — non-limiting). VH-XYU in maintenance Dubbo — estimated return 48 hrs. VH-MWH, VH-MVX, VH-MWK, VH-NAJ, VH-VPQ, VH-MQK, VH-XYJ, VH-XYO, VH-RFD, VH-LTQ all serviceable. Overall readiness: 13/14 (93%). Recommend monitoring VH-XYR MEL item resolution.",
  "Summarise overnight missions for handover":
    "Overnight summary: MEDIVAC 03 (M004) departed Walgett 04:00, airborne to Dubbo ETA 05:45 — paediatric respiratory case, all gates green. DENTAL 01 (M003) completed Dubbo–Moree run at 06:10, routine. No safety events recorded. 1 fuel planning deviation logged for M002 (fuel not confirmed prior to planned departure window).",
  "Which crew are approaching hour limits?":
    "Capt. M. Clarke has flown 91 of 100 hours this period — only 9 hours remaining, currency lapsed. Recommend grounding from PIC duties until check complete (due 10 Jun). All other crew within limits. S. Mitchell RN at 55/120 hrs, Dr. K. Patel at 38/120 hrs — no action required.",
  "Explain the APG hold on MEDIVAC 02":
    "MEDIVAC 02 (M002) is currently held pending APG Release. The APG (Aviation Planning Gateway) sign-off was requested at 08:00 but has not been issued as of 08:45. Contributing factors: late flight plan submission (filed 07:58, 2 min before window). Recommend dispatcher contact APG directly. Fuel confirmation also outstanding — both items must be resolved before dispatch.",
};

export default function AIMissionAnalyst({ role }: Props) {
  const [activeTab, setActiveTab] = useState<"analysis" | "insights" | "chat">("analysis");
  const [selectedMission, setSelectedMission] = useState(SAMPLE_ANALYSIS[0]);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([
    { role: "ai", text: "G'day — I'm Jennifer, your AI Mission Analyst. I have visibility across all active missions, crew status, aircraft readiness, and release gates. Ask me anything or select a starter below." },
  ]);
  const [thinking, setThinking] = useState(false);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { role: "user", text };
    setChatLog(prev => [...prev, userMsg]);
    setChatInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = AI_REPLIES[text] ?? "I'm analysing that request. Based on current mission data and crew status, I'll have a detailed response shortly. For time-critical queries, please escalate to the Duty Manager.";
      setChatLog(prev => [...prev, { role: "ai", text: reply }]);
      setThinking(false);
    }, 1200);
  }

  const riskColor = (l: string) => l === "high" ? "text-red-400" : l === "medium" ? "text-yellow-400" : "text-green-400";
  const riskBg = (l: string) => l === "high" ? "bg-red-500/10 border-red-500/30" : l === "medium" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30";
  const confColor = (c: number) => c >= 90 ? "text-green-400" : c >= 75 ? "text-yellow-400" : "text-red-400";
  const tabs = [
    { id: "analysis", label: "Mission Analysis" },
    { id: "insights", label: "Live Insights" },
    { id: "chat", label: "Ask Jennifer" },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            AI Mission Analyst
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Jennifer — Intelligent operational briefing and risk assessment</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-cyan-400">Jennifer Active — GPT-4o + Mission Context</span>
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Missions", value: "3", sub: "1 airborne" },
          { label: "Avg Confidence", value: "85%", sub: "across analyses" },
          { label: "Open Risk Items", value: "4", sub: "2 high priority" },
          { label: "Analyses Today", value: "12", sub: "auto-triggered" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            <div className="text-[11px] text-muted-foreground/60 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mission Analysis tab */}
      {activeTab === "analysis" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mission list */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Mission</div>
            {SAMPLE_ANALYSIS.map(m => (
              <button key={m.missionId} onClick={() => setSelectedMission(m)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedMission.missionId === m.missionId ? "border-cyan-400/50 bg-cyan-400/10" : "border-card-border bg-card hover:border-cyan-400/30"}`}>
                <div className="text-sm font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{m.callsign}</div>
                <div className={`text-xs font-semibold mt-1 ${confColor(m.confidence)}`}>{m.confidence}% confidence</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{m.generated}</div>
              </button>
            ))}
          </div>

          {/* Analysis panel */}
          <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{selectedMission.callsign}</div>
                <div className="text-xs text-muted-foreground">Generated {selectedMission.generated}</div>
              </div>
              <div className={`text-2xl font-bold ${confColor(selectedMission.confidence)}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {selectedMission.confidence}%
                <div className="text-xs font-normal text-muted-foreground">confidence</div>
              </div>
            </div>

            <div className="bg-background/40 rounded-lg p-3 text-sm leading-relaxed">
              {selectedMission.summary}
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk Assessment</div>
              <div className="space-y-2">
                {selectedMission.risks.map(r => (
                  <div key={r.label} className={`flex items-center justify-between p-2 rounded-lg border ${riskBg(r.level)}`}>
                    <span className="text-xs">{r.label}</span>
                    <span className={`text-xs font-bold uppercase ${riskColor(r.level)}`}>{r.level}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-cyan-400/30 bg-cyan-400/5 rounded-lg p-3">
              <div className="text-xs font-semibold text-cyan-400 mb-1">AI Recommendation</div>
              <div className="text-sm">{selectedMission.recommendation}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  generatePDF({
                    title: `AI Mission Briefing — ${selectedMission.callsign}`,
                    subtitle: selectedMission.summary,
                    date: new Date().toLocaleDateString("en-AU"),
                    reference: selectedMission.missionId,
                    sections: [
                      {
                        heading: "Mission Summary",
                        rows: [
                          { label: "Callsign", value: selectedMission.callsign },
                          { label: "Mission ID", value: selectedMission.missionId },
                          { label: "AI Confidence", value: `${selectedMission.confidence}%` },
                          { label: "Generated", value: selectedMission.generated },
                          { label: "Summary", value: selectedMission.summary },
                        ],
                      },
                      {
                        heading: "Risk Assessment",
                        rows: selectedMission.risks.map((r: { label: string; level: string }) => ({
                          label: r.label,
                          value: r.level === "high" ? "⚠ HIGH" : r.level === "medium" ? "▲ MEDIUM" : "✓ LOW",
                        })),
                      },
                      {
                        heading: "AI Recommendation",
                        rows: [
                          { label: "Recommendation", value: selectedMission.recommendation },
                        ],
                      },
                    ],
                  });
                }}
                className="flex-1 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors"
              >
                Export Briefing PDF
              </button>
              <button className="flex-1 py-2 bg-card hover:bg-background border border-card-border text-xs font-semibold rounded-lg transition-colors">
                Re-analyse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Insights tab */}
      {activeTab === "insights" && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Intelligence Feed</div>
          {INSIGHT_FEED.map((item, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-4 flex items-start gap-4">
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div className="flex-1">
                <div className="text-sm leading-relaxed">{item.text}</div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chat tab */}
      {activeTab === "chat" && (
        <div className="bg-card border border-card-border rounded-xl flex flex-col" style={{ minHeight: 520 }}>
          {/* Chat log */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 380 }}>
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? "bg-cyan-400/20 text-cyan-100" : "bg-background border border-card-border"}`}>
                  {msg.role === "ai" && <span className="text-cyan-400 font-bold text-xs mr-1">Jennifer</span>}
                  {msg.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-background border border-card-border p-3 rounded-xl text-sm text-muted-foreground">
                  <span className="text-cyan-400 font-bold text-xs mr-1">Jennifer</span>
                  Analysing...
                </div>
              </div>
            )}
          </div>

          {/* Starters */}
          <div className="px-4 pb-2">
            <div className="text-xs text-muted-foreground mb-2">Suggested questions:</div>
            <div className="flex flex-wrap gap-1.5">
              {CHAT_STARTERS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="px-3 py-1 bg-background border border-card-border hover:border-cyan-400/40 rounded-full text-xs transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-card-border flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(chatInput)}
              placeholder="Ask Jennifer about missions, crew, risk, or compliance..."
              className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50"
            />
            <button onClick={() => sendMessage(chatInput)}
              className="px-4 py-2 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
