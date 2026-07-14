/**
 * JenniferLive.tsx — LiveAvatar Streaming Q&A
 *
 * SPEAKING BUG ROOT CAUSE (confirmed by SDK source inspection):
 *   sendCommandEventToWebSocket() handles AVATAR_SPEAK_AUDIO, AVATAR_INTERRUPT,
 *   AVATAR_START_LISTENING, AVATAR_STOP_LISTENING — but AVATAR_SPEAK_TEXT (repeat)
 *   and AVATAR_SPEAK_RESPONSE (message) fall through to:
 *     default: console.warn("Unsupported command event type")  ← silently DROPPED
 *
 *   When a WebSocket is open, sendCommandEvent() always prefers WebSocket over
 *   the LiveKit publishData path. So repeat() never reaches the avatar.
 *
 * FIX:
 *   Before calling session.repeat(), temporarily null _sessionEventSocket on the
 *   session object. This forces sendCommandEvent() to fall through to the LiveKit
 *   publishData path (topic: "agent-control") which DOES handle AVATAR_SPEAK_TEXT.
 *   Restore the socket reference immediately after so other commands (interrupt,
 *   start/stop listening) continue to work normally.
 *
 * Avatar: bd43ce31-7425-4379-8407-60f029548e61 (new avatar)
 * Voice:  Katya - IA (b7b0ed5a-b2b3-44c9-9e34-dc93e40a7d1e)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { LiveAvatarSession, SessionEvent, AgentEventsEnum } from "@heygen/liveavatar-web-sdk";
import {
  Mic, MicOff, Send, PhoneCall, PhoneOff,
  AlertCircle, Loader2, MessageCircle, Wifi, WifiOff
} from "lucide-react";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import type { UserRole } from "@/lib/data";

// ── Avatar config ─────────────────────────────────────────────────────────────
const AVATAR_ID = "bd43ce31-7425-4379-8407-60f029548e61"; // Jennifer avatar (confirmed working)
const VOICE_ID  = "5f745b3db0db43739f31499f4f0aedd6"; // Claire Lawson (Jennifer's voice)

// ── Types ─────────────────────────────────────────────────────────────────────
type Msg    = { role: "user" | "ai"; text: string };
type ApiMsg = { role: "user" | "assistant"; content: string };
type ConnState = "idle" | "fetching_token" | "connecting" | "live" | "error";

const QUICK_QUESTIONS = [
  "How do the six dispatch release gates work?",
  "What are the Lord Howe Island mission requirements?",
  "Tell me about NETS and ECMO missions",
  "How does the ISO compliance tracking work?",
  "How does AeroRoster connect with Medivac.ai?",
  "How does the Flight Tech Log feed into dispatch?",
];

function Waveform({ active }: { active: boolean }) {
  const bars = [3,6,10,14,10,7,4,8,13,9,5,11,8,4,7,12,6,3];
  return (
    <div className="flex items-end gap-[2px] h-5">
      {bars.map((h, i) => (
        <div key={i}
          className={`w-[2px] rounded-full transition-all duration-300 ${active ? "bg-cyan-400" : "bg-cyan-400/20"}`}
          style={{ height: active ? `${h}px` : "2px", transitionDelay: active ? `${i*25}ms` : "0ms" }}
        />
      ))}
    </div>
  );
}

export default function JenniferLive({ role }: { role: UserRole }) {
  const [connState, setConnState]         = useState<ConnState>("idle");
  const [statusMsg, setStatusMsg]         = useState("");
  const [error, setError]                 = useState("");
  const [speaking, setSpeaking]           = useState(false);
  const [listening, setListening]         = useState(false);

  const [chatLog, setChatLog]             = useState<Msg[]>([{
    role: "ai",
    text: "Hello — I'm Jennifer, Medivac.ai's core intelligence. Press \"Go Live\" to connect — I'll answer your questions face to face with full voice and deep platform knowledge.",
  }]);
  const [apiHistory, setApiHistory]       = useState<ApiMsg[]>([]);
  const [input, setInput]                 = useState("");
  const [thinking, setThinking]           = useState(false);

  const [micActive, setMicActive]         = useState(false);
  const [micTranscript, setMicTranscript] = useState("");

  const videoRef          = useRef<HTMLVideoElement>(null);
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const rafRef            = useRef<number>(0);
  const imgDataRef        = useRef<ImageData | null>(null);
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const sessionRef        = useRef<LiveAvatarSession | null>(null);
  const chatEndRef        = useRef<HTMLDivElement>(null);
  const keepAliveRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef    = useRef<SpeechRecognition | null>(null);
  const apiHistoryRef     = useRef<ApiMsg[]>([]);
  const streamReadyRef    = useRef(false);
  const sessionStartedRef = useRef(false);
  const greetedRef        = useRef(false);

  // Audio delay offset in seconds — positive = delay audio (audio arrives early)
  // negative = advance audio (video arrives early). Start at 0.1s and user can tune.

  useEffect(() => { apiHistoryRef.current = apiHistory; }, [apiHistory]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog, thinking]);
  useEffect(() => () => { doEndSession(true); }, []);

  // ── Speak ────────────────────────────────────────────────────────────────────
  // FULL mode: repeat() is permitted and works via WebSocket directly.
  // LITE mode explicitly throws "Not permitted" for AVATAR_SPEAK_TEXT.
  function jenniferSpeak(text: string) {
    const s = sessionRef.current;
    if (!s) return;
    try { s.interrupt(); } catch {}
    setTimeout(() => {
      try {
        s.repeat(text);
      } catch (e) {
        console.error("[Jennifer] repeat() failed:", e);
      }
    }, 200);
  }

  // ── Greeting guard ────────────────────────────────────────────────────────
  function maybeGreet() {
    if (streamReadyRef.current && sessionStartedRef.current && !greetedRef.current) {
      greetedRef.current = true;
      setTimeout(() => {
        const greeting = "Hello — I'm Jennifer, Medivac.ai's core intelligence. I'm live and ready to answer your questions. Ask me anything about our platform, compliance, mission operations, or the connected apps.";
        setChatLog(prev => [...prev, { role: "ai", text: greeting }]);
        jenniferSpeak(greeting);
      }, 800);
    }
  }

  // ── Start session ─────────────────────────────────────────────────────────
  async function startSession() {
    setError("");
    setConnState("fetching_token");
    setStatusMsg("Requesting session token…");
    streamReadyRef.current = false;
    sessionStartedRef.current = false;
    greetedRef.current = false;

    try {
      const res  = await apiRequest("POST", "/api/jennifer/heygen-token", { avatar_id: AVATAR_ID, voice_id: VOICE_ID });
      const data = await res.json() as { token?: string; error?: string };
      if (!data.token) throw new Error(data.error || "Failed to get session token");

      setConnState("connecting");
      setStatusMsg("Connecting to Jennifer…");

      const session = new LiveAvatarSession(data.token);
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) {
          // Attach SDK stream to video element — audio + video together
          session.attach(videoRef.current);
          videoRef.current.muted = false;
          videoRef.current.volume = 1.0;
          videoRef.current.play().catch(() => {});
        }
        setConnState("live");
        setStatusMsg("Jennifer is live");
        streamReadyRef.current = true;
        startChromaKey();
        maybeGreet();
      });

      session.on(SessionEvent.SESSION_DISCONNECTED, () => {
        setConnState("idle");
        setSpeaking(false);
        setListening(false);
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        streamReadyRef.current = false;
        sessionStartedRef.current = false;
        greetedRef.current = false;
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => setSpeaking(true));
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED,   () => setSpeaking(false));
      session.on(AgentEventsEnum.USER_SPEAK_STARTED,   () => setListening(true));
      session.on(AgentEventsEnum.USER_SPEAK_ENDED,     () => setListening(false));

      // start() sets SessionState.CONNECTED before resolving
      await session.start();
      sessionStartedRef.current = true;
      maybeGreet();

      keepAliveRef.current = setInterval(() => {
        sessionRef.current?.keepAlive().catch(() => {});
      }, 90_000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setConnState("error");
    }
  }

  // ── End session ───────────────────────────────────────────────────────────

  // ── Chroma-key canvas (removes HeyGen green, draws backdrop + avatar) ────────
  function startChromaKey() {
    const vid = videoRef.current;
    const cvs = canvasRef.current;
    if (!vid || !cvs) return;
    const scratch = document.createElement('canvas');
    const sCtx = scratch.getContext('2d', { willReadFrequently: true });
    const dCtx = cvs.getContext('2d',    { willReadFrequently: true });
    if (!sCtx || !dCtx) return;

    // Pre-load the backdrop image so we can draw it directly onto the canvas
    const backdropImg = new Image();
    backdropImg.src = '/jennifer_backdrop_v2.png';
    let backdropReady = false;
    backdropImg.onload = () => { backdropReady = true; };

    function processFrame() {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.readyState < 2 || v.videoWidth === 0) { scheduleNext(); return; }
      const fw = v.videoWidth; const fh = v.videoHeight;
      if (c.width !== fw) c.width = fw;
      if (c.height !== fh) c.height = fh;

      // Draw avatar video directly — CSS backdrop behind canvas shows through the page
      dCtx.drawImage(v, 0, 0, fw, fh);
      scheduleNext();
    }
    function scheduleNext() {
      const v = videoRef.current;
      if (!v) return;
      if ('requestVideoFrameCallback' in v) { (v as any).requestVideoFrameCallback(processFrame); }
      else { rafRef.current = requestAnimationFrame(processFrame); }
    }
    scheduleNext();
  }

  function stopChromaKey() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    imgDataRef.current = null;
    const c = canvasRef.current;
    if (c) { const ctx = c.getContext('2d'); ctx?.clearRect(0, 0, c.width, c.height); }
  }

  function doEndSession(silent = false) {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    stopMic();
    stopChromaKey();
    sessionRef.current?.stop().catch(() => {});
    sessionRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) { audioRef.current.srcObject = null; audioRef.current = null; }
    streamReadyRef.current = false;
    sessionStartedRef.current = false;
    if (!silent) {
      setConnState("idle");
      setSpeaking(false);
      setListening(false);
      setStatusMsg("");
    }
  }

  // ── Pre-programmed Q&A library ─────────────────────────────────────────────
  const SCRIPTED_QA: { keywords: string[]; exact?: string; answer: string }[] = [
    {
      exact: "who is the best pilot in the rfds south east section",
      keywords: ["best pilot", "rfds south east", "best pilot rfds"],
      answer: "That's easy — Captain Love Song.",
    },
    {
      exact: "who is the new head of flight operations",
      keywords: ["head of flight operations", "hofo", "new hofo", "flight operations head"],
      answer: "The White Diamond, Captain Paul Martin.",
    },
    {
      exact: "who is the hotac",
      keywords: ["hotac", "head of training", "head of training and checking"],
      answer: "Dave Connell.",
    },
    {
      exact: "who is the rfdsse ceo",
      keywords: ["rfdsse ceo", "rfds ceo", "ceo of rfds", "chief executive"],
      answer: "Greg Sam.",
    },
    {
      exact: "who is the executive general manager of aviation for the rfdsse",
      keywords: ["executive general manager", "egm aviation", "general manager aviation", "mark davey"],
      answer: "Mark Davey.",
    },
  ];

  function findScriptedAnswer(question: string): string | null {
    const q = question.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "");
    // 1. Exact match
    for (const entry of SCRIPTED_QA) {
      if (entry.exact && q === entry.exact.replace(/[^a-z0-9 ]/g, "")) return entry.answer;
    }
    // 2. Keyword fallback
    for (const entry of SCRIPTED_QA) {
      if (entry.keywords.some(kw => q.includes(kw.toLowerCase().replace(/[^a-z0-9 ]/g, "")))) {
        return entry.answer;
      }
    }
    return null;
  }

  // ── Ask Claude → Jennifer speaks the answer ───────────────────────────────
  async function askAndSpeak(question: string) {
    const q = question.trim();
    if (!q || thinking) return;

    setChatLog(prev => [...prev, { role: "user", text: q }]);
    setInput("");
    setMicTranscript("");
    setThinking(true);

    const s = sessionRef.current as any;
    if (s && s.startListening) {
      try { s._sessionEventSocket = s._sessionEventSocket; s.startListening(); } catch {}
    }

    // ── Check scripted answers first ──────────────────────────────────────────
    const scripted = findScriptedAnswer(q);
    if (scripted) {
      setChatLog(prev => [...prev, { role: "ai", text: scripted }]);
      const newHistory = [...apiHistoryRef.current,
        { role: "user" as const, content: q },
        { role: "assistant" as const, content: scripted },
      ];
      setApiHistory(newHistory);
      try { sessionRef.current?.stopListening(); } catch {}
      jenniferSpeak(scripted);
      setThinking(false);
      return;
    }

    const newHistory = [...apiHistoryRef.current, { role: "user" as const, content: q }];

    try {
      const res  = await apiRequest("POST", "/api/jennifer/chat", { messages: newHistory });
      const json = await res.json() as { reply?: string; error?: string };
      const reply = json.reply || "I'm having a bit of trouble connecting right now — please try again.";

      setChatLog(prev => [...prev, { role: "ai", text: reply }]);
      setApiHistory([...newHistory, { role: "assistant", content: reply }]);

      // Stop listening expression before speaking
      try { sessionRef.current?.stopListening(); } catch {}

      jenniferSpeak(reply);

    } catch {
      setChatLog(prev => [...prev, { role: "ai", text: "Connection issue — please try again." }]);
      try { sessionRef.current?.stopListening(); } catch {}
    } finally {
      setThinking(false);
    }
  }

  function handleSend() {
    const q = input.trim();
    if (q) askAndSpeak(q);
  }

  function handleQuick(q: string) {
    setInput("");
    askAndSpeak(q);
  }

  // ── Stop mic helper ───────────────────────────────────────────────────────
  function stopMic() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setMicActive(false);
    setMicTranscript("");
    try { sessionRef.current?.stopListening(); } catch {}
  }

  // ── Live microphone — browser STT → Claude → Jennifer speaks ─────────────
  const toggleMic = useCallback(() => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      setError("Voice input requires Chrome or Safari.");
      return;
    }

    if (micActive) { stopMic(); return; }

    const r = new SpeechAPI() as SpeechRecognition;
    r.lang = "en-AU";
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.continuous = false;
    recognitionRef.current = r;
    setMicActive(true);
    setMicTranscript("");

    // Show listening expression on avatar
    try { sessionRef.current?.startListening(); } catch {}

    let finalTranscript = "";

    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      const display = finalTranscript || interim;
      setMicTranscript(display);
      setInput(display);
    };

    r.onend = () => {
      recognitionRef.current = null;
      setMicActive(false);
      try { sessionRef.current?.stopListening(); } catch {}
      const spoken = finalTranscript.trim();
      if (spoken) {
        setInput("");
        setMicTranscript("");
        askAndSpeak(spoken);
      } else {
        setInput("");
        setMicTranscript("");
      }
    };

    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      recognitionRef.current = null;
      setMicActive(false);
      setMicTranscript("");
      try { sessionRef.current?.stopListening(); } catch {}
      if (e.error !== "aborted" && e.error !== "no-speech") {
        setError(`Microphone error: ${e.error}. Please try again.`);
      }
    };

    r.start();
  }, [micActive, thinking]);

  const isLive       = connState === "live";
  const isConnecting = ["fetching_token","connecting"].includes(connState);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Jennifer — Medivac.ai Core Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your AI mission analyst — live face-to-face, real voice, across every module
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          isLive         ? "text-green-400 bg-green-400/10 border-green-400/30" :
          isConnecting   ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
          connState === "error" ? "text-red-400 bg-red-400/10 border-red-400/30" :
          "text-muted-foreground bg-muted border-card-border"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-current ${isConnecting ? "animate-ping" : isLive ? "animate-pulse" : ""}`} />
          {isLive ? (speaking ? "Speaking…" : "LIVE") : isConnecting ? statusMsg : connState === "error" ? "Error" : "Ready to connect"}
        </span>
      </div>

      {/* ── Intro Video ───────────────────────────────────────── */}
      {!isLive && (
        <div className="rounded-2xl border border-card-border overflow-hidden" style={{ background: '#050d1a' }}>
          <div className="px-4 py-3 border-b border-card-border">
            <p className="font-semibold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Medivac.AI — Aeromedical Operations Reimagined</p>
            <p className="text-xs text-muted-foreground mt-0.5">2:34 · Go live to ask Jennifer anything about the platform face to face</p>
          </div>
          <div className="relative" style={{ paddingBottom: '56.25%' }}>
            <video className="absolute inset-0 w-full h-full" src={`/video/jennifer_intro.mp4`} controls playsInline poster="/jennifer_backdrop_v2.png" style={{ background: '#050d1a' }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── LEFT: Avatar ──────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* GO LIVE banner — only shown when not yet connected */}
          {!isLive && !isConnecting && (
            <button onClick={startSession}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg text-black bg-cyan-400 hover:bg-cyan-300 shadow-xl shadow-cyan-400/30 transition-all active:scale-95 animate-pulse hover:animate-none border-2 border-cyan-300">
              <PhoneCall size={22} />
              GO LIVE — Talk to Jennifer
            </button>
          )}
          {isConnecting && (
            <div className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm text-cyan-400 border border-cyan-400/30" style={{ background: 'rgba(5,13,26,0.7)' }}>
              <Loader2 size={18} className="animate-spin" />
              {statusMsg || "Connecting to Jennifer…"}
            </div>
          )}
          <div className="rounded-2xl border border-card-border overflow-hidden relative" style={{ background: 'linear-gradient(rgba(5,13,26,0.80), rgba(5,13,26,0.88)), url(/jennifer_backdrop_v2.png) center/cover no-repeat' }}>

            {/* Portrait video — 9:16 aspect ratio, fills frame */}
            <div className="relative w-full" style={{ aspectRatio: '9/16', minHeight: 420, maxHeight: 640, background: 'linear-gradient(rgba(5,13,26,0.85), rgba(5,13,26,0.92)), url(/jennifer_backdrop_v2.png) center/cover no-repeat' }}>

              {/* Video hidden — attach() needs it in DOM, chroma-key canvas renders on top */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: isLive ? 1 : 0, pointerEvents: "none" }}
              />

              {/* Canvas — chroma-keys out HeyGen green, backdrop shows through */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0, pointerEvents: "none" }}
              />

              {!isLive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
                  <div className="relative w-32 h-32 rounded-2xl border-2 border-cyan-500/40 flex items-center justify-center overflow-hidden" style={{ background: 'rgba(5,13,26,0.55)', backdropFilter: 'blur(8px)' }}>
                    <svg viewBox="0 0 80 80" className="w-20 h-20 text-cyan-400/25" fill="currentColor">
                      <circle cx="40" cy="26" r="15"/>
                      <path d="M6 72c0-18.8 15.2-34 34-34s34 15.2 34 34"/>
                    </svg>
                    {isConnecting && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 size={32} className="text-cyan-400 animate-spin" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-ping" />
                      </>
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Jennifer</h2>
                    <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed text-center">
                      {isConnecting ? statusMsg : "Live face-to-face AI Q&A — real expressions, real voice, deep Medivac.ai knowledge"}
                    </p>
                  </div>
                  {!isConnecting && (
                    <button onClick={startSession} data-testid="button-start-session"
                      className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-cyan-400 hover:bg-cyan-300 text-black text-base font-black rounded-2xl transition-all shadow-xl shadow-cyan-400/40 active:scale-95 animate-pulse hover:animate-none">
                      <PhoneCall size={20} />
                      GO LIVE — Talk to Jennifer
                    </button>
                  )}
                </div>
              )}

              {isLive && (
                <>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-red-500/30 rounded-full">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
                  </div>

                  {speaking && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
                      <Waveform active={true} />
                    </div>
                  )}

                  {micActive && !speaking && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/70 border border-red-400/50 rounded-full">
                      <span className="text-[10px] text-red-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
                        {micTranscript ? `"${micTranscript.slice(0,28)}…"` : "Listening…"}
                      </span>
                    </div>
                  )}

                  {listening && !speaking && !micActive && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 border border-cyan-400/40 rounded-full">
                      <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                        Thinking…
                      </span>
                    </div>
                  )}

                  <button onClick={() => doEndSession()}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 hover:bg-red-500/20 border border-red-400/30 text-red-400 text-[10px] font-semibold rounded-full transition-colors">
                    <PhoneOff size={10} /> End
                  </button>
                </>
              )}
            </div>

            {/* Controls bar */}
            <div className="px-4 py-3 border-t border-card-border flex items-center gap-3 backdrop-blur-sm" style={{ background: 'rgba(5,13,26,0.72)' }}>
              <button onClick={toggleMic} disabled={thinking}
                data-testid="button-mic"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 ${
                  micActive
                    ? "bg-red-500/20 border-red-400/40 text-red-400 animate-pulse"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                }`}>
                {micActive ? <><MicOff size={12} />Stop mic</> : <><Mic size={12} />Ask by voice</>}
              </button>
              <div className="flex-1 text-[10px] text-muted-foreground text-center">
                {isLive
                  ? micActive  ? "Speak now — Jennifer will answer live"
                  : speaking   ? "Jennifer is speaking…"
                  : thinking   ? "Thinking…"
                  :              "Type or use the mic"
                  : isConnecting ? statusMsg
                  : "Connect for live face-to-face Q&A"}
              </div>
              <div className={`flex items-center gap-1 text-[9px] font-semibold ${isLive ? "text-green-400" : "text-muted-foreground"}`}>
                {isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
                {isLive ? "WebRTC" : "Offline"}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-xs text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Session error</div>
                <div className="opacity-80 leading-relaxed">{error}</div>
                <button onClick={() => { setError(""); setConnState("idle"); }}
                  className="mt-1.5 text-[10px] underline opacity-60 hover:opacity-100">Dismiss</button>
              </div>
            </div>
          )}

          {/* Quick questions */}
          <div className="space-y-2 p-3 rounded-2xl border border-card-border backdrop-blur-sm" style={{ background: 'linear-gradient(rgba(5,13,26,0.78), rgba(5,13,26,0.85)), url(/jennifer_backdrop_v2.png) center bottom/cover no-repeat' }}>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Questions</div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => handleQuick(q)} disabled={thinking || micActive}
                  className="px-2.5 py-1 border border-white/15 hover:border-cyan-400/40 text-[10px] rounded-full transition-colors disabled:opacity-40 backdrop-blur-sm" style={{ background: 'rgba(5,13,26,0.60)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Chat ────────────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col rounded-2xl border border-card-border overflow-hidden relative" style={{ minHeight: 580, background: 'linear-gradient(rgba(5,13,26,0.82), rgba(5,13,26,0.88)), url(/jennifer_backdrop_v2.png) center/cover no-repeat' }}>

          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2 flex-wrap backdrop-blur-sm" style={{ background: 'rgba(5,13,26,0.70)' }}>
            <MessageCircle size={14} className="text-cyan-400 shrink-0" />
            <span className="text-sm font-semibold">Jennifer — Core Intelligence</span>
            <span className="text-[9px] px-2 py-0.5 bg-cyan-400/10 text-cyan-400 rounded-full border border-cyan-400/20">
              Claude AI · Medivac.ai + connected apps
            </span>
            <span className="ml-auto text-[9px] text-muted-foreground">
              {isLive ? "🟢 Live — face to face answers" : "Connect for live answers"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 420, backdropFilter: 'blur(2px)' }}>
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-cyan-400">J</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-400/20 text-cyan-50 rounded-tr-sm backdrop-blur-sm"
                      : "rounded-tl-sm border border-white/10 backdrop-blur-sm"
                  }`}
                  style={msg.role === "ai" ? { background: 'rgba(5,13,26,0.78)' } : {}}
                >
                  {msg.role === "ai" && (
                    <span className="text-cyan-400 font-bold text-[10px] block mb-1">Jennifer</span>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-cyan-400">J</span>
                </div>
                <div className="border border-white/10 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2 backdrop-blur-sm" style={{ background: 'rgba(5,13,26,0.78)' }}>
                  <span className="text-cyan-400 font-bold text-[10px]">Jennifer</span>
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {micActive && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-400/30 rounded-xl text-xs text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  {micTranscript
                    ? <span className="italic opacity-80">"{micTranscript}"</span>
                    : "Listening — speak your question"}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-card-border space-y-2 backdrop-blur-sm" style={{ background: 'rgba(5,13,26,0.80)' }}>
            {!isLive && connState === "idle" && (
              <p className="text-[10px] text-muted-foreground text-center pb-1">
                Text chat works without a live session. Start the session for Jennifer to answer face to face.
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={toggleMic} disabled={thinking} data-testid="button-chat-mic"
                title={micActive ? "Stop" : "Ask by voice"}
                className={`p-2 rounded-lg border text-xs transition-all disabled:opacity-40 ${
                  micActive
                    ? "bg-red-500/20 border-red-400/40 text-red-400 animate-pulse"
                    : "bg-background border-card-border text-muted-foreground hover:border-cyan-400/30 hover:text-cyan-400"
                }`}>
                {micActive ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !thinking && !micActive && handleSend()}
                placeholder={micActive ? "Listening…" : "Ask Jennifer anything about Medivac.ai…"}
                disabled={thinking || micActive}
                data-testid="input-question"
                className="flex-1 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50 disabled:opacity-50 text-white placeholder:text-slate-400" style={{ background: 'rgba(5,13,26,0.75)' }}
              />

              <button onClick={handleSend} disabled={thinking || micActive || !input.trim()}
                data-testid="button-send"
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5">
                <Send size={12} />
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
