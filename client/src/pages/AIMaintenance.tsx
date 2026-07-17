import { useState } from "react";
import {
  Wrench, Send, Sparkles, ShieldAlert, ChevronDown, Search, FileSearch,
  Clock, Wind, Gauge, Wind as OxygenIcon, Bot, User, AlertTriangle,
} from "lucide-react";

const HF = { fontFamily: "'Cabinet Grotesk', sans-serif" };

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    text: "VH-MVW has a cabin pressurisation warning light illuminated intermittently. Aircraft is on the ground at Broken Hill. What does the MEL say?",
  },
  {
    id: 2,
    role: "assistant",
    text: "For the B200, pressurisation warning is covered under MEL Item 21-30-01. Intermittent illumination — if the system tests normal on ground run, the aircraft MAY be dispatched with: (1) ops check before each flight, (2) crew briefed on manual pressurisation procedure, (3) defect entered in tech log. Maximum 3 days before rectification required. Note: verify against your current RFDS SE MEL revision — always use approved data.",
  },
  {
    id: 3,
    role: "user",
    text: "The LAME ran a ground check and system tested normal. Can we release the aircraft?",
  },
  {
    id: 4,
    role: "assistant",
    text: "Based on the MEL provision and normal ground test result, release is permissible subject to: defect logged in tech log (Defect Ref: DEF-2026-0847), crew briefed, and next maintenance due within 3 calendar days. I'd recommend LAME Craig Holloway sign the CRS with the MEL reference cited. Do you want me to pre-fill the defect entry?",
  },
  {
    id: 5,
    role: "user",
    text: "Yes please",
  },
  {
    id: 6,
    role: "assistant",
    text: "Defect entry pre-filled below. Review and confirm before submitting to tech log: Aircraft: VH-MVW | Date: 17 Jul 2026 | Defect: Cabin pressurisation warning light — intermittent illumination | MEL Ref: 21-30-01 | Release conditions: Normal ground test, crew briefed, rectify within 3 days | LAME: [sign] | CRS No: TBC",
  },
];

const RECENT_QUERIES = [
  { label: "Cabin pressurisation warning — VH-MVW", icon: Gauge },
  { label: "Propeller sync fluctuation — VH-XYJ", icon: Wind },
  { label: "Oxygen system pressure drop — VH-MVX", icon: OxygenIcon },
];

const AIRCRAFT_OPTIONS = ["VH-MVW", "VH-XYJ", "VH-MVX"];
const MEL_CHAPTERS = [
  "21 — Air Conditioning / Pressurisation",
  "24 — Electrical Power",
  "27 — Flight Controls",
  "32 — Landing Gear",
  "34 — Navigation",
  "61 — Propellers",
  "71 — Powerplant",
];

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#4F98A3]/15 border border-[#4F98A3]/40 flex items-center justify-center shrink-0">
          <Bot size={16} className="text-[#4F98A3]" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[#4F98A3]/15 border border-[#4F98A3]/30 text-[#CDCCCA]"
            : "bg-[#1C1B19] border border-[#393836] text-[#CDCCCA]"
        }`}
      >
        {msg.text}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#393836] border border-[#5A5957]/40 flex items-center justify-center shrink-0">
          <User size={16} className="text-[#797876]" />
        </div>
      )}
    </div>
  );
}

export default function AIMaintenance() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [aircraft, setAircraft] = useState(AIRCRAFT_OPTIONS[0]);
  const [chapter, setChapter] = useState(MEL_CHAPTERS[0]);

  function handleSend() {
    if (!input.trim()) return;
    const newUserMsg: ChatMessage = { id: messages.length + 1, role: "user", text: input.trim() };
    setMessages((prev) => [
      ...prev,
      newUserMsg,
      {
        id: messages.length + 2,
        role: "assistant",
        text: "Thanks — checking current approved MEL and engineering data for this query. This is a demo response; connect the live MEL database for production-accurate guidance.",
      },
    ]);
    setInput("");
  }

  return (
    <div className="p-6 space-y-6 bg-[#0f1117] min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#CDCCCA]" style={HF}>AI Maintenance Assistant</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#4F98A3]/15 text-[#4F98A3] border border-[#4F98A3]/40">
              BETA
            </span>
          </div>
          <p className="text-sm text-[#797876] mt-0.5">
            MEL Guidance · Troubleshooting · Defect Analysis · Powered by Claude
          </p>
        </div>
      </div>

      <div className="bg-amber-950/30 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/90">
          Beta — LAMEs only. All AI outputs must be verified against current approved data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat interface */}
        <div className="lg:col-span-2 flex flex-col bg-[#1C1B19] border border-[#393836] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#393836] flex items-center gap-2">
            <Sparkles size={16} className="text-[#4F98A3]" />
            <span className="text-sm font-semibold text-[#CDCCCA]" style={HF}>Maintenance Chat</span>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto" style={{ height: "400px" }}>
            {messages.map((m) => (
              <ChatBubble key={m.id} msg={m} />
            ))}
          </div>

          <div className="p-3 border-t border-[#393836] flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="Ask about MEL items, defects, troubleshooting..."
              className="flex-1 bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]"
            />
            <button
              onClick={handleSend}
              className="flex items-center gap-1.5 bg-[#4F98A3] hover:bg-[#4F98A3]/90 text-[#0f1117] font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Send size={14} />
              Send
            </button>
          </div>
        </div>

        {/* Quick access panel */}
        <div className="space-y-4">
          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
            <h2 className="text-xs font-semibold text-[#797876] uppercase tracking-wider mb-3">Recent Queries</h2>
            <div className="space-y-2">
              {RECENT_QUERIES.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    className="w-full flex items-center gap-2 text-left text-sm text-[#CDCCCA] bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 hover:border-[#4F98A3]/50 transition-colors"
                  >
                    <Icon size={14} className="text-[#4F98A3] shrink-0" />
                    <span className="truncate">{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4">
            <h2 className="text-xs font-semibold text-[#797876] uppercase tracking-wider mb-3">MEL Quick Look</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#5A5957] mb-1 block">Aircraft</label>
                <div className="relative">
                  <select
                    value={aircraft}
                    onChange={(e) => setAircraft(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] appearance-none focus:outline-none focus:border-[#4F98A3]"
                  >
                    {AIRCRAFT_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797876] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#5A5957] mb-1 block">MEL Chapter</label>
                <div className="relative">
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#393836] rounded-lg px-3 py-2 text-sm text-[#CDCCCA] appearance-none focus:outline-none focus:border-[#4F98A3]"
                  >
                    {MEL_CHAPTERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797876] pointer-events-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-[#4F98A3] text-[#0f1117] rounded-lg py-2 hover:bg-[#4F98A3]/90 transition-colors">
                  <Search size={13} />
                  Search MEL
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-[#0f1117] border border-[#393836] text-[#CDCCCA] rounded-lg py-2 hover:border-[#4F98A3]/50 transition-colors">
                  <FileSearch size={13} />
                  View Full MEL
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1B19] border border-[#393836] rounded-xl p-4 flex items-start gap-2">
            <Clock size={14} className="text-[#5A5957] shrink-0 mt-0.5" />
            <p className="text-xs text-[#797876]">
              Last MEL sync: 17 Jul 2026, 06:00 AEST · Revision 14
            </p>
          </div>
        </div>
      </div>

      {/* Safety disclaimer */}
      <div className="bg-red-950/20 border border-red-400/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm text-red-200/90">
          AI outputs are decision support only. All maintenance actions must be performed by appropriately licensed LAME under CASR Part 66. Medivac.ai AI Maintenance Assistant does not replace approved maintenance data.
        </p>
      </div>
    </div>
  );
}
