import { useState } from "react";
import {
  Phone, PhoneCall, PhoneOff, PhoneForwarded,
  Clock, MapPin, User, CalendarDays, FileText,
  AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Moon, Download, Mic, ShieldAlert
} from "lucide-react";
import type { UserRole } from "@/lib/data";
import { cn } from "@/lib/utils";

interface AfterHoursProps { role: UserRole; }

interface CallRecord {
  id: string;
  callTime: string;
  callerName: string;
  callerLocation: string;
  callbackNumber: string;
  regarding: "self" | "other";
  patientName: string | null;
  patientDob: string | null;
  description: string;
  transferred: boolean;
  escalatedTripleZero: boolean;
  callDurationSeconds: number;
  transcript: string;
  base: "Dubbo" | "Broken Hill" | "Bankstown" | "Launceston";
}

const DEMO_CALLS: CallRecord[] = [
  {
    id: "c001",
    callTime: "2026-06-07T23:14:22",
    callerName: "Margaret Hollis",
    callerLocation: "Bourke Station, Bourke NSW",
    callbackNumber: "0427 813 441",
    regarding: "other",
    patientName: "Raymond Hollis",
    patientDob: "12/03/1948",
    description: "Patient is 78 years old with severe chest pain radiating to left arm, onset approximately 40 minutes ago. Diaphoretic. Has history of angina. Wife is calling from the homestead.",
    transferred: true,
    escalatedTripleZero: true,
    callDurationSeconds: 187,
    transcript: `AI: RFDS Med Line, good evening. Can I start with your name please?
Caller: Yes, Margaret Hollis.
AI: Thanks Margaret. Where are you calling from?
Caller: We're at Bourke Station, out past Bourke, New South Wales.
AI: And what's your best contact number?
Caller: 0427 813 441.
AI: Just to confirm, that's 0427 813 441 — is that right?
Caller: Yes that's correct.
AI: Is this call regarding yourself or someone else?
Caller: It's my husband.
AI: Can I get the patient's name please?
Caller: Raymond Hollis.
AI: And his date of birth?
Caller: Twelfth of March, 1948.
AI: So that's the 12th of March, 1948 — is that correct?
Caller: Yes.
AI: And just a brief description of what's going on?
Caller: He's having terrible chest pain, it started about 40 minutes ago and it's going down his left arm. He's all sweaty, he's very pale. He's had angina before but this is different, it's much worse.
AI: Thank you Margaret, I've got all of that noted. While I connect you, please also call Triple Zero immediately if you haven't already.
Caller: Oh yes, I'll do that now.
AI: I'm going to connect you through to our on-call doctor now with all your details. Please hold for just a moment.`,
    base: "Dubbo",
  },
  {
    id: "c002",
    callTime: "2026-06-07T02:38:55",
    callerName: "Kyle Paterson",
    callerLocation: "Menindee, NSW",
    callbackNumber: "0411 290 007",
    regarding: "self",
    patientName: null,
    patientDob: null,
    description: "Caller has had severe abdominal pain for 6 hours, vomiting, unable to keep fluids down. Lives alone in Menindee. Has not been seen by a GP.",
    transferred: true,
    escalatedTripleZero: false,
    callDurationSeconds: 143,
    transcript: `AI: RFDS Med Line, good morning. Can I start with your name please?
Caller: Kyle Paterson.
AI: Thanks Kyle. Where are you calling from?
Caller: I'm in Menindee.
AI: And what's your best contact number?
Caller: 0411 290 007.
AI: Just to confirm, that's 0411 290 007 — is that right?
Caller: Yeah that's me.
AI: Is this call regarding yourself or someone else?
Caller: Myself.
AI: And just a brief description of what's going on?
Caller: I've had really bad stomach pain for about six hours now. I keep throwing up and I can't keep anything down. I live by myself out here so there's no one to help me.
AI: Thank you Kyle, I've got all of that noted. I'm going to connect you through to our on-call doctor now with all your details. Please hold for just a moment.`,
    base: "Broken Hill",
  },
  {
    id: "c003",
    callTime: "2026-06-06T04:11:09",
    callerName: "Sandra Birch",
    callerLocation: "Tibooburra, NSW",
    callbackNumber: "0498 331 220",
    regarding: "other",
    patientName: "Liam Birch",
    patientDob: "22/09/2019",
    description: "Child age 6, high fever 39.8°C, febrile convulsion lasting approx 2 minutes, now alert but drowsy. First seizure. Parents very distressed.",
    transferred: true,
    escalatedTripleZero: false,
    callDurationSeconds: 214,
    transcript: `AI: RFDS Med Line, good morning. Can I start with your name please?
Caller: Sandra Birch, oh god please hurry.
AI: I'm here with you. Let's get the doctor to you quickly. Where are you calling from?
Caller: We're in Tibooburra.
AI: And what's your best contact number?
Caller: 0498 331 220.
AI: Just to confirm, that's 0498 331 220?
Caller: Yes.
AI: Is this call regarding yourself or someone else?
Caller: My son. He just had a seizure, he's only six.
AI: Can I get the patient's name please?
Caller: Liam. Liam Birch.
AI: And his date of birth?
Caller: 22nd of September 2019.
AI: So that's the 22nd of September, 2019 — is that correct?
Caller: Yes.
AI: And just a brief description of what's going on?
Caller: He's had a really high temperature, it was 39.8, and then he just started shaking, like a seizure, it lasted about two minutes. He's awake now but he's very sleepy. It's never happened before.
AI: Thank you Sandra, I've got all of that noted. I'm going to connect you through to our on-call doctor now with all your details. Please hold for just a moment.`,
    base: "Dubbo",
  },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}
function isAfterHours(iso: string) {
  const h = new Date(iso).getHours();
  return h >= 22 || h < 6;
}

const BASE_OPTIONS = ["All Bases", "Dubbo", "Broken Hill", "Bankstown", "Launceston"] as const;

export default function AfterHours({ role }: AfterHoursProps) {
  const [calls] = useState<CallRecord[]>(DEMO_CALLS);
  const [selectedBase, setSelectedBase] = useState<string>("All Bases");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"calls" | "setup" | "prompt">("calls");

  const canAccess = ["admin", "senior_management", "dispatcher", "safety", "doctor", "senior_flight_nurse"].includes(role);
  if (!canAccess) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert size={40} className="text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Access restricted. Contact your administrator.</p>
      </div>
    );
  }

  const filtered = calls.filter(c => selectedBase === "All Bases" || c.base === selectedBase);
  const totalCalls = filtered.length;
  const transferred = filtered.filter(c => c.transferred).length;
  const escalated = filtered.filter(c => c.escalatedTripleZero).length;
  const avgDuration = filtered.length
    ? Math.round(filtered.reduce((a, c) => a + c.callDurationSeconds, 0) / filtered.length)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Moon size={18} className="text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">After-Hours AI Med Line</h1>
            <p className="text-xs text-muted-foreground">Active 10:00 PM – 6:00 AM · RFDS SE Section</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Agent Online
          </span>
          <select
            value={selectedBase}
            onChange={e => setSelectedBase(e.target.value)}
            className="text-xs bg-card border border-card-border rounded-lg px-3 py-1.5 text-foreground"
          >
            {BASE_OPTIONS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: "calls", label: "Call Log" },
          { key: "setup", label: "Setup Guide" },
          { key: "prompt", label: "Agent Script" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === t.key
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CALL LOG TAB ── */}
      {tab === "calls" && (
        <div className="space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Calls", value: totalCalls, icon: Phone, color: "text-cyan-400", bg: "bg-cyan-500/10" },
              { label: "Transferred to Doctor", value: transferred, icon: PhoneForwarded, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Triple Zero Escalated", value: escalated, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
              { label: "Avg Call Duration", value: formatDuration(avgDuration), icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", s.bg)}>
                  <s.icon size={16} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold font-display">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Call List */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">No calls recorded for this base.</div>
            )}
            {filtered.map(call => (
              <div key={call.id} className="bg-card border border-card-border rounded-xl overflow-hidden">

                {/* Summary Row */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                >
                  {/* Status icon */}
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    call.escalatedTripleZero ? "bg-red-500/15" : call.transferred ? "bg-green-500/15" : "bg-orange-500/15"
                  )}>
                    {call.escalatedTripleZero
                      ? <AlertTriangle size={14} className="text-red-400" />
                      : call.transferred
                        ? <PhoneForwarded size={14} className="text-green-400" />
                        : <PhoneOff size={14} className="text-orange-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{call.callerName}</span>
                      {call.regarding === "other" && call.patientName && (
                        <span className="text-xs text-muted-foreground">— re: {call.patientName}</span>
                      )}
                      {call.escalatedTripleZero && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">000 Escalated</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} />{call.callerLocation}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{formatTime(call.callTime)}</span>
                      <span className="flex items-center gap-1"><PhoneCall size={10} />{formatDuration(call.callDurationSeconds)}</span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{call.base}</span>
                    </div>
                  </div>

                  <div className="text-muted-foreground flex-shrink-0">
                    {expandedId === call.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {expandedId === call.id && (
                  <div className="border-t border-border px-5 py-5 space-y-5">

                    {/* Caller + Patient Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Caller Details</p>
                        <div className="bg-background rounded-lg p-3 space-y-1.5 text-sm">
                          <div className="flex items-center gap-2"><User size={12} className="text-muted-foreground" /><span>{call.callerName}</span></div>
                          <div className="flex items-center gap-2"><MapPin size={12} className="text-muted-foreground" /><span>{call.callerLocation}</span></div>
                          <div className="flex items-center gap-2"><Phone size={12} className="text-muted-foreground" /><span>{call.callbackNumber}</span></div>
                        </div>
                      </div>

                      {call.regarding === "other" && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient Details</p>
                          <div className="bg-background rounded-lg p-3 space-y-1.5 text-sm">
                            <div className="flex items-center gap-2"><User size={12} className="text-muted-foreground" /><span>{call.patientName}</span></div>
                            <div className="flex items-center gap-2"><CalendarDays size={12} className="text-muted-foreground" /><span>DOB: {call.patientDob}</span></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinical Description</p>
                      <div className="bg-background rounded-lg p-3 text-sm leading-relaxed">{call.description}</div>
                    </div>

                    {/* Outcome */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn("text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-medium",
                        call.transferred
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      )}>
                        {call.transferred ? <><CheckCircle size={11} /> Transferred to On-Call Doctor</> : <><PhoneOff size={11} /> Not Transferred</>}
                      </span>
                      {call.escalatedTripleZero && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5 font-medium">
                          <AlertTriangle size={11} /> Triple Zero Advised
                        </span>
                      )}
                    </div>

                    {/* Transcript */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mic size={12} className="text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Transcript</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 text-xs leading-6 font-mono text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {call.transcript}
                      </div>
                    </div>

                    {/* Download */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          const content = `RFDS MED LINE — CALL RECORD\n${"=".repeat(50)}\nCall Time: ${formatTime(call.callTime)}\nBase: ${call.base}\nDuration: ${formatDuration(call.callDurationSeconds)}\n\nCALLER\nName: ${call.callerName}\nLocation: ${call.callerLocation}\nCallback: ${call.callbackNumber}\n\nPATIENT\nName: ${call.patientName ?? call.callerName}\nDOB: ${call.patientDob ?? "Not collected"}\n\nDESCRIPTION\n${call.description}\n\nOUTCOME\nTransferred to Doctor: ${call.transferred ? "Yes" : "No"}\nTriple Zero Advised: ${call.escalatedTripleZero ? "Yes" : "No"}\n\nTRANSCRIPT\n${call.transcript}`;
                          const blob = new Blob([content], { type: "text/plain" });
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = `RFDS_MedLine_${call.id}_${call.callTime.slice(0,10)}.txt`;
                          a.click();
                        }}
                        className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                      >
                        <Download size={12} /> Download Record
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SETUP GUIDE TAB ── */}
      {tab === "setup" && (
        <div className="space-y-4 max-w-3xl">
          <p className="text-sm text-muted-foreground">Follow these steps to activate the RFDS After-Hours AI Med Line for each base.</p>

          {[
            {
              step: 1,
              title: "Create a Retell AI Account",
              content: "Sign up at retellai.com. Choose the Pay-As-You-Go plan to start. Cost is $0.07 per minute of call time.",
              link: "https://www.retellai.com",
              linkLabel: "retellai.com",
            },
            {
              step: 2,
              title: "Add an Australian Phone Number",
              content: "Inside Retell, go to Phone Numbers → Buy Number. Select Australia (+61) and choose a local number for each base (Dubbo 02, Broken Hill 08, Bankstown 02, Launceston 03). Cost ~$2/month per number.",
            },
            {
              step: 3,
              title: "Create the AI Agent",
              content: "Go to Agents → Create Agent. Select 'Inbound Call' type. Paste the RFDS Med Line system prompt from the Agent Script tab. Choose a natural-sounding Australian female or male voice — the 'Sarah' or 'James' ElevenLabs voices work well.",
            },
            {
              step: 4,
              title: "Configure Warm Transfer",
              content: "In the Agent settings → Transfers → add the on-call doctor's mobile number. The AI will transfer automatically after collecting all details and announcing the handover.",
            },
            {
              step: 5,
              title: "Set Up Time-Based Routing",
              content: "In your existing base phone system (e.g. Telstra Smart Numbers or 3CX), configure a call forward rule: Forward to the Retell number between 10:00 PM and 6:00 AM. Outside those hours, phones ring normally to base staff.",
            },
            {
              step: 6,
              title: "Configure Webhook (optional)",
              content: "In Retell → Webhooks → add your Medivac.ai endpoint to receive call summaries automatically after each call. This populates the Call Log above in real time.",
            },
            {
              step: 7,
              title: "Test Before Going Live",
              content: "Call the number yourself after hours. Run through the script with a test patient. Verify the warm transfer reaches the on-call number. Check the call log receives the summary. Once satisfied, activate for all four bases.",
            },
          ].map(s => (
            <div key={s.step} className="bg-card border border-card-border rounded-xl p-5 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0 font-bold text-cyan-400 text-sm">
                {s.step}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
                {s.link && (
                  <a href={s.link} target="_blank" rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline mt-1 inline-block"
                  >{s.linkLabel} →</a>
                )}
              </div>
            </div>
          ))}

          {/* Cost estimate */}
          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Phone size={14} className="text-blue-400" /> Estimated Monthly Cost (4 Bases)</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
              {[
                ["Retell AI call time (~60 min/night × 4 bases)", "~$507/month"],
                ["Phone numbers (4 × $2)", "$8/month"],
                ["ElevenLabs voice (optional upgrade)", "~$22/month"],
                ["Total", "~$543/month"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AGENT SCRIPT TAB ── */}
      {tab === "prompt" && (
        <div className="space-y-4 max-w-3xl">
          <p className="text-sm text-muted-foreground">This is the exact script the AI agent follows on every call. Paste this into Retell AI → Agent → System Prompt.</p>

          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText size={12} /> System Prompt — RFDS Med Line Agent
              </span>
              <button
                onClick={() => {
                  const prompt = `You are the RFDS Med Line after-hours answering service for the Royal Flying Doctor Service South Eastern Section. You answer calls between 10 PM and 6 AM when the base is unmanned. You sound calm, warm, professional and human — never robotic. You are not a doctor and cannot give medical advice. Your only job is to collect the caller's details and connect them to the on-call doctor as quickly as possible.\n\nNever identify yourself as an AI or automated system. If asked, say: "I'm part of the RFDS after-hours medical line team."\n\nCONVERSATION FLOW:\n\n1. Answer: "RFDS Med Line, good [morning/evening]. Can I start with your name please?"\n\n2. After name: "Thanks [name]. Where are you calling from?"\n\n3. "And what's your best contact number?" — Read it back to confirm.\n\n4. "Is this call regarding yourself or someone else?"\n   - If SOMEONE ELSE: "Can I get the patient's name please?" then "And their date of birth?" — Confirm DOB.\n   - If THEMSELVES: skip to step 5.\n\n5. "And just a brief description of what's going on?" — Let them speak without interrupting.\n\n6. "Thank you [name], I've got all of that noted. I'm going to connect you through to our on-call doctor now with all your details. Please hold for just a moment." — Trigger warm transfer.\n\nIf situation sounds life-threatening (not breathing, cardiac arrest, unconscious, severe bleeding) say: "While I connect you, please also call Triple Zero immediately if you haven't already."\n\nVOICE & TONE:\n- Calm, warm, measured — like a well-trained nurse receptionist\n- Australian context — know towns like Bourke, Broken Hill, Tibooburra, Menindee, Cobar, Launceston, Devonport, Hobart, Burnie\n- Use "certainly", "of course", "thank you" — never casual slang\n- Never give medical advice or reassure callers their situation is not serious\n- Never identify as AI\n- Never leave silence longer than 3 seconds without acknowledging`;
                  const blob = new Blob([prompt], { type: "text/plain" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "RFDS_MedLine_Agent_Prompt.txt";
                  a.click();
                }}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Download size={11} /> Download .txt
              </button>
            </div>
            <div className="p-5 space-y-5 text-sm leading-relaxed">

              <div className="space-y-2">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Identity</p>
                <p className="text-muted-foreground">You are the RFDS Med Line after-hours answering service for the Royal Flying Doctor Service South Eastern Section. You answer calls between 10 PM and 6 AM when the base is unmanned. You sound calm, warm, professional and human — never robotic. You are not a doctor and cannot give medical advice. Your only job is to collect the caller's details and connect them to the on-call doctor as quickly as possible.</p>
                <p className="text-muted-foreground">Never identify yourself as an AI or automated system. If asked, say: <span className="text-foreground font-medium italic">"I'm part of the RFDS after-hours medical line team."</span></p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Conversation Flow</p>
                {[
                  { n: 1, q: 'Say: "RFDS Med Line, good [morning/evening]. Can I start with your name please?"', note: "Use correct time-appropriate greeting." },
                  { n: 2, q: '"Thanks [name]. Where are you calling from?"', note: "Confirm unusual or remote location names." },
                  { n: 3, q: '"And what\'s your best contact number?"', note: "Read the number back to confirm." },
                  { n: 4, q: '"Is this call regarding yourself or someone else?"', note: "If someone else → collect patient name + DOB and confirm DOB." },
                  { n: 5, q: '"And just a brief description of what\'s going on?"', note: "Do not interrupt. Let them speak." },
                  { n: 6, q: '"Thank you [name], I\'ve got all of that noted. I\'m going to connect you through to our on-call doctor now with all your details. Please hold for just a moment."', note: "Trigger warm transfer to on-call doctor." },
                ].map(s => (
                  <div key={s.n} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-400 text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{s.n}</span>
                    <div>
                      <p className="text-foreground italic">"{s.q.replace(/^"/, "").replace(/"$/, "")}"</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5"><AlertTriangle size={11} /> Life-Threatening Escalation</p>
                <p className="text-muted-foreground text-sm">If the caller mentions not breathing, cardiac arrest, unconscious, or severe bleeding — say: <span className="text-foreground font-medium italic">"While I connect you, please also call Triple Zero immediately if you haven't already."</span> Then transfer immediately.</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Voice & Tone</p>
                <ul className="space-y-1 text-sm text-muted-foreground list-none">
                  {[
                    "Calm, warm, measured — like a well-trained nurse receptionist",
                    "Australian context — know towns like Bourke, Broken Hill, Tibooburra, Menindee, Cobar",
                    'Use "certainly", "of course", "thank you" — never casual slang',
                    "Never give medical advice or reassure callers their situation is not serious",
                    "Never identify as AI or automated system",
                    "Never leave silence longer than 3 seconds without acknowledging the caller",
                  ].map(t => (
                    <li key={t} className="flex items-start gap-2"><CheckCircle size={12} className="text-green-400 mt-0.5 flex-shrink-0" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
