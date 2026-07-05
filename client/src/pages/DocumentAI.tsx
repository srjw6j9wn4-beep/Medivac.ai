import { useState } from "react";
import type { UserRole } from "@/lib/data";

interface Props { role: UserRole }

const DOCUMENTS = [
  { id: "DOC001", name: "RFDS EBA 2025 — Pilots Agreement", type: "EBA / Agreement", size: "2.4 MB", uploaded: "02 Jun 2026", status: "Indexed", pages: 48, extracted: 312, tags: ["EBA", "Pilot", "Hours", "Leave"] },
  { id: "DOC002", name: "CASA CAO 48.1 — Fatigue Rules", type: "Regulatory", size: "1.1 MB", uploaded: "15 Apr 2026", status: "Indexed", pages: 22, extracted: 147, tags: ["FRMS", "Fatigue", "CASA"] },
  { id: "DOC003", name: "King Air B200 AFM — Chapter 4", type: "Aircraft Manual", size: "5.8 MB", uploaded: "20 Mar 2026", status: "Indexed", pages: 104, extracted: 820, tags: ["B200", "Performance", "Fuel", "Limitations"] },
  { id: "DOC004", name: "NSWAA Operations Specification", type: "Operations", size: "3.2 MB", uploaded: "10 Jan 2026", status: "Processing", pages: 66, extracted: 0, tags: ["NSWAA", "OpsSpec", "Approval"] },
  { id: "DOC005", name: "ISO 9001:2015 Internal Audit Report", type: "Quality", size: "0.8 MB", uploaded: "28 May 2026", status: "Indexed", pages: 14, extracted: 88, tags: ["ISO", "Quality", "Audit"] },
];

const EXTRACTIONS = [
  { doc: "RFDS EBA 2025", field: "Max Duty Hours (7 days)", value: "60 hours", clause: "Clause 14.3" },
  { doc: "RFDS EBA 2025", field: "Max Block Hours (year)", value: "900 hours", clause: "Clause 14.1" },
  { doc: "RFDS EBA 2025", field: "Minimum rest between shifts", value: "10 hours", clause: "Clause 15.2" },
  { doc: "CASA CAO 48.1", field: "Max FDP (single pilot)", value: "11 hours", clause: "Section 8" },
  { doc: "CASA CAO 48.1", field: "Augmented crew FDP", value: "16 hours", clause: "Section 9" },
  { doc: "King Air B200 AFM", field: "Max fuel capacity", value: "3640 lb", clause: "4.2.1" },
  { doc: "King Air B200 AFM", field: "Max landing weight", value: "12,500 lb", clause: "4.1.3" },
];

const AI_ANSWERS: Record<string, string> = {
  "What are the maximum pilot duty hours per week?":
    "Per the RFDS SE Pilots Agreement 2025, Clause 14.3: The maximum duty hours in any 7-day period is 60 hours. Annual block hour limit is 900 hours (Clause 14.1). Minimum rest between duty periods is 10 hours (Clause 15.2).",
  "What is the King Air B200 max fuel load?":
    "Per the King Air B200 AFM, Chapter 4, Section 4.2.1: Maximum fuel capacity is 3,640 lb. Usable fuel is approximately 3,600 lb. All fuel figures are in pounds as per King Air fuel management.",
  "What does CASA CAO 48.1 say about single pilot FDP?":
    "CASA CAO 48.1, Section 8: Maximum Flight Duty Period for a single-pilot operation is 11 hours from report time. With augmented crew, maximum FDP extends to 16 hours (Section 9). Cumulative limits apply per 28-day rolling window.",
};

const STARTERS = [
  "What are the maximum pilot duty hours per week?",
  "What is the King Air B200 max fuel load?",
  "What does CASA CAO 48.1 say about single pilot FDP?",
];

type ChatMsg = { role: "user" | "ai"; text: string; sources?: string[] };

const statusColor = (s: string) => s === "Indexed" ? "status-green" : s === "Processing" ? "status-yellow" : "status-gray";

export default function DocumentAI({ role }: Props) {
  const [tab, setTab] = useState<"library" | "extractions" | "chat">("library");
  const [chatLog, setChatLog] = useState<ChatMsg[]>([
    { role: "ai", text: "Document AI is ready. I have indexed 4 documents covering EBA rules, CASA regulations, aircraft manuals, and quality audits. Ask a question and I'll cite the exact clause." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [dragging, setDragging] = useState(false);

  const tabs = [
    { id: "library", label: "Document Library" },
    { id: "extractions", label: "Key Extractions" },
    { id: "chat", label: "Ask Documents" },
  ] as const;

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setChatLog(prev => [...prev, { role: "user", text }]);
    setChatInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = AI_ANSWERS[text] ?? "I searched the indexed documents but couldn't find a definitive answer to that specific question. Try rephrasing, or upload the relevant document if it's not yet in the library.";
      const sources = text.includes("duty hours") ? ["RFDS EBA 2025 — Cl. 14.3"] : text.includes("fuel") ? ["King Air B200 AFM — 4.2.1"] : text.includes("CASA") ? ["CASA CAO 48.1 — S.8"] : undefined;
      setChatLog(prev => [...prev, { role: "ai", text: reply, sources }]);
      setThinking(false);
    }, 1300);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Document AI</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Intelligent document indexing, extraction, and question-answering</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-400/10 border border-purple-400/30 rounded-xl">
          <span className="text-purple-400 text-sm">🧩</span>
          <span className="text-xs font-semibold text-purple-400">RAG Engine — {DOCUMENTS.filter(d => d.status === "Indexed").length} docs indexed</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Documents", value: String(DOCUMENTS.length), color: "text-cyan-400" },
          { label: "Pages Indexed", value: "188", color: "text-purple-400" },
          { label: "Facts Extracted", value: "1,367", color: "text-green-400" },
          { label: "Queries Today", value: "24", color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t.id ? "bg-cyan-400/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Library */}
      {tab === "library" && (
        <div className="space-y-4">
          {/* Upload zone */}
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragging ? "border-cyan-400/60 bg-cyan-400/5" : "border-card-border"}`}>
            <div className="text-3xl mb-2">📂</div>
            <div className="text-sm font-semibold mb-1">Drop documents here or click to upload</div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, TXT — up to 50 MB per file</div>
            <button className="mt-3 px-4 py-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
              Browse Files
            </button>
          </div>

          {/* Document list */}
          <div className="space-y-2">
            {DOCUMENTS.map(doc => (
              <div key={doc.id} className="bg-card border border-card-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-2xl">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.type} · {doc.size} · {doc.pages} pages · Uploaded {doc.uploaded}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {doc.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-background border border-card-border rounded-full text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`badge ${statusColor(doc.status)}`}>{doc.status}</span>
                  {doc.extracted > 0 && <span className="text-[10px] text-muted-foreground">{doc.extracted} facts</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extractions */}
      {tab === "extractions" && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-card-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Auto-extracted Key Facts
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border text-muted-foreground">
                  <th className="text-left p-3">Document</th>
                  <th className="text-left p-3">Field</th>
                  <th className="text-left p-3">Value</th>
                  <th className="text-left p-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {EXTRACTIONS.map((e, i) => (
                  <tr key={i} className="border-b border-card-border/50 hover:bg-background/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{e.doc}</td>
                    <td className="p-3 font-medium">{e.field}</td>
                    <td className="p-3 font-bold text-cyan-400">{e.value}</td>
                    <td className="p-3 text-purple-400 font-mono">{e.clause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <div className="bg-card border border-card-border rounded-xl flex flex-col" style={{ minHeight: 500 }}>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 360 }}>
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? "bg-cyan-400/20 text-cyan-100" : "bg-background border border-card-border"}`}>
                  {msg.role === "ai" && <span className="text-purple-400 font-bold text-xs mr-1">Doc AI</span>}
                  <div>{msg.text}</div>
                  {msg.sources && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.sources.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-purple-400/10 border border-purple-400/20 rounded-full text-[10px] text-purple-400">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-background border border-card-border p-3 rounded-xl text-sm text-muted-foreground">
                  <span className="text-purple-400 font-bold text-xs mr-1">Doc AI</span>Searching documents...
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pb-2">
            <div className="text-xs text-muted-foreground mb-2">Try asking:</div>
            <div className="flex flex-wrap gap-1.5">
              {STARTERS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="px-3 py-1 bg-background border border-card-border hover:border-purple-400/40 rounded-full text-xs transition-colors">{s}</button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-card-border flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(chatInput)}
              placeholder="Ask about any indexed document..."
              className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400/50" />
            <button onClick={() => sendMessage(chatInput)} className="px-4 py-2 bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/30 text-purple-400 text-xs font-semibold rounded-lg transition-colors">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
