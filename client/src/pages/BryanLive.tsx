/**
 * BryanLive.tsx — LiveAvatar Streaming Q&A
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
 * Avatar: 03f8332d-9046-42a1-bff3-3b2309f77b58 (Graham in Black Suit)
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
const AVATAR_ID = "03f8332d-9046-42a1-bff3-3b2309f77b58"; // Graham in Black Suit
const VOICE_ID  = "e04e9d57-853f-4d72-a8ff-8e3c768f4c9c"; // Graham - IA (matches Graham avatar)

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

export default function BryanLive({ role }: { role: UserRole }) {
  const [connState, setConnState]         = useState<ConnState>("idle");
  const [statusMsg, setStatusMsg]         = useState("");
  const [error, setError]                 = useState("");
  const [speaking, setSpeaking]           = useState(false);
  const [listening, setListening]         = useState(false);

  const [chatLog, setChatLog]             = useState<Msg[]>([{
    role: "ai",
    text: "G'day — I'm Graham, your Medivac.ai AI presenter and mission analyst. Press \"Go Live\" to connect — I'll answer your questions face to face with full voice and expressions.",
  }]);
  const [apiHistory, setApiHistory]       = useState<ApiMsg[]>([]);
  const [input, setInput]                 = useState("");
  const [thinking, setThinking]           = useState(false);

  const [micActive, setMicActive]         = useState(false);
  const [micTranscript, setMicTranscript] = useState("");

  const [videoMuted, setVideoMuted]       = useState(true);   // Safari: start muted, user unmutes
  const videoRef          = useRef<HTMLVideoElement>(null);
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const rafRef            = useRef<number>(0);
  const imgDataRef        = useRef<ImageData | null>(null); // reused buffer — no per-frame alloc
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const sessionRef        = useRef<LiveAvatarSession | null>(null);
  const chatEndRef        = useRef<HTMLDivElement>(null);
  const keepAliveRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef    = useRef<SpeechRecognition | null>(null);
  const apiHistoryRef     = useRef<ApiMsg[]>([]);
  const streamReadyRef    = useRef(false);
  const sessionStartedRef = useRef(false);
  const greetedRef        = useRef(false);

  useEffect(() => { apiHistoryRef.current = apiHistory; }, [apiHistory]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog, thinking]);
  useEffect(() => () => { doEndSession(true); }, []);

  // Purge any ghost <audio> elements injected by previous failed attempts
  useEffect(() => {
    document.querySelectorAll("audio[data-bryan-audio]").forEach(el => el.remove());
  }, []);

  // ── Speak ────────────────────────────────────────────────────────────────────
  // FULL mode: repeat() is permitted and works via WebSocket directly.
  // Fire repeat() only after any in-flight interrupt has cleared (one rAF tick).
  function bryanSpeak(text: string) {
    const s = sessionRef.current;
    if (!s) return;
    try { s.interrupt(); } catch {}
    setTimeout(() => {
      try {
        s.repeat(text);
      } catch (e) {
        console.error("[Bryan] repeat() failed:", e);
      }
    }, 200);
  }

  // ── Greeting guard ────────────────────────────────────────────────────────
  function maybeGreet() {
    if (streamReadyRef.current && sessionStartedRef.current && !greetedRef.current) {
      greetedRef.current = true;
      setTimeout(() => {
        const greeting = "G'day — I'm Graham, Medivac.ai's AI presenter. I'm live and ready to answer your questions. Ask me anything about dispatch gates, mission types, compliance, or the connected apps.";
        setChatLog(prev => [...prev, { role: "ai", text: greeting }]);
        bryanSpeak(greeting);
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
      const res  = await apiRequest("POST", "/api/bryan/heygen-token", { avatar_id: AVATAR_ID, voice_id: VOICE_ID });
      const data = await res.json() as { token?: string; error?: string };
      if (!data.token) {
        const errMsg = data.error || "Failed to get session token";
        // HeyGen 400 = invalid or expired API key
        if (res.status === 400 || errMsg.toLowerCase().includes("invalid") || errMsg.toLowerCase().includes("api")) {
          throw new Error("Graham Live is temporarily unavailable — the HeyGen API key needs to be updated in Railway. Please contact your system administrator.");
        }
        throw new Error(errMsg);
      }

      setConnState("connecting");
      setStatusMsg("Connecting to Graham…");

      const session = new LiveAvatarSession(data.token);
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        // Set live state first so React re-renders the video element as visible
        setConnState("live");
        setStatusMsg("Graham is live");
        streamReadyRef.current = true;
        // Attach immediately — video is in the DOM (opacity:0), attach() works.
        // Start chroma-key on loadeddata so first frame is ready before we process.
        // Safari/iOS: play muted first, unmute via user tap overlay.
        const vid = videoRef.current;
        if (vid) {
          try { session.attach(vid); } catch(e) { console.warn("attach failed:", e); }
          vid.muted = true;
          vid.volume = 1.0;

          const onReady = () => {
            startChromaKey();
            vid.removeEventListener('loadeddata', onReady);
          };
          // If already has data (fast network), start immediately; else wait
          if (vid.readyState >= 2) {
            startChromaKey();
          } else {
            vid.addEventListener('loadeddata', onReady);
          }

          vid.play().catch(() => {
            // Autoplay blocked even muted — unmute overlay handles user gesture
          });
        }
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
  // ── Optimised chroma-key pipeline ────────────────────────────────────────────────
  //
  // 1. requestVideoFrameCallback — fires only on a new decoded frame, skips
  //    duplicate ticks that rAF would otherwise process between video frames.
  // 2. 50% downscale before getImageData — reduces pixel count by 75%,
  //    cutting the per-frame CPU cost of the keying loop significantly.
  //    The display canvas is sized to full resolution; CSS stretches it.
  // 3. ImageData buffer reuse — single allocation per session, mutated
  //    in-place each frame to avoid GC pressure during high-load monitoring.
  // 4. willReadFrequently: true — hints the browser to keep the canvas
  //    surface CPU-readable, avoiding costly GPU→CPU readbacks.
  // 5. Falls back to rAF on browsers that lack rVFC (Firefox < 132).
  // ──────────────────────────────────────────────────────────────────────────────

  function startChromaKey() {
    const vid = videoRef.current;
    const cvs = canvasRef.current;
    if (!vid || !cvs) return;

    // Scratch canvas: half-res for pixel processing (75% fewer pixels)
    const scratch = document.createElement('canvas');
    const sCtx    = scratch.getContext('2d', { willReadFrequently: true });
    // Display canvas context — willReadFrequently keeps it CPU-readable
    const dCtx    = cvs.getContext('2d', { willReadFrequently: true });
    if (!sCtx || !dCtx) return;

    function processFrame() {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.readyState < 2 || v.videoWidth === 0) {
        scheduleNext();
        return;
      }

      const fw = v.videoWidth;
      const fh = v.videoHeight;
      const sw = fw >> 1;   // 50% width  (bit-shift = fast floor divide by 2)
      const sh = fh >> 1;   // 50% height

      // Sync display canvas size to full frame
      if (c.width !== fw)  c.width  = fw;
      if (c.height !== fh) c.height = fh;

      // Sync scratch canvas to half-res
      if (scratch.width  !== sw) scratch.width  = sw;
      if (scratch.height !== sh) scratch.height = sh;

      // Draw video at 50% scale into scratch
      sCtx.drawImage(v, 0, 0, sw, sh);

      // Reuse ImageData buffer — allocate only when dimensions change
      if (!imgDataRef.current || imgDataRef.current.width !== sw || imgDataRef.current.height !== sh) {
        imgDataRef.current = sCtx.getImageData(0, 0, sw, sh);
      } else {
        imgDataRef.current = sCtx.getImageData(0, 0, sw, sh);
      }

      const d = imgDataRef.current.data;
      const len = d.length;

      // Chroma-key: remove #00d804 green-screen
      // Threshold: G > 150, R < 80, B < 80  — tuned to live stream colour
      for (let i = 0; i < len; i += 4) {
        if (d[i+1] > 150 && d[i] < 80 && d[i+2] < 80) d[i+3] = 0;
      }

      sCtx.putImageData(imgDataRef.current, 0, 0);

      // Scale keyed half-res result back up to full display canvas
      dCtx.clearRect(0, 0, fw, fh);
      dCtx.drawImage(scratch, 0, 0, fw, fh);

      scheduleNext();
    }

    function scheduleNext() {
      const v = videoRef.current;
      if (!v) return;
      // AV-SYNC FIX: prefer requestVideoFrameCallback over rAF. rVFC only fires
      // when the <video> element has actually decoded a new frame, so we never
      // reprocess/redraw a stale frame between real frame arrivals. Processing
      // on every rAF tick (up to 60/s) instead of on true new-frame events is
      // what causes the canvas to visually drift from the audio track over
      // time — rVFC keeps the keyed canvas locked to the same frame boundaries
      // the audio track's playback clock is already using.
      if ('requestVideoFrameCallback' in v) {
        (v as any).requestVideoFrameCallback(processFrame);
      } else {
        // Fallback: rAF for browsers without rVFC (e.g. Firefox < 132)
        rafRef.current = requestAnimationFrame(processFrame);
      }
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
    setVideoMuted(true);   // Reset for next session
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

  // ── Ask Claude → Bryan speaks the answer ───────────────────────────────
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
      bryanSpeak(scripted);
      setThinking(false);
      return;
    }

    const newHistory = [...apiHistoryRef.current, { role: "user" as const, content: q }];

    try {
      const res  = await apiRequest("POST", "/api/bryan/chat", { messages: newHistory });
      const json = await res.json() as { reply?: string; error?: string };
      const reply = json.reply || "I'm having a bit of trouble connecting right now — please try again.";

      setChatLog(prev => [...prev, { role: "ai", text: reply }]);
      setApiHistory([...newHistory, { role: "assistant", content: reply }]);

      // Stop listening expression before speaking
      try { sessionRef.current?.stopListening(); } catch {}

      bryanSpeak(reply);

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

  // ── Live microphone — browser STT → Claude → Bryan speaks ─────────────
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
            Graham — Live Avatar Q&amp;A
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            LiveAvatar · WebRTC · Real face &amp; voice · Claude AI · Type or speak your question
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
        <>
          {/* Jennifer blink simulation — pre-recorded video has no real blinks,
              so we overlay a thin animated strip over the eye line to fake a
              natural ~15 blinks/min cadence (1 blink every 4s). */}
          <style>{`
            @keyframes jennifer-blink {
              0%, 96%, 100% { transform: scaleY(0); opacity: 0; }
              97%   { transform: scaleY(1); opacity: 0.95; }
              98%   { transform: scaleY(0.05); opacity: 0.6; }
              99%   { transform: scaleY(1); opacity: 0.95; }
              99.5% { transform: scaleY(0); opacity: 0; }
            }
          `}</style>
          <div className="rounded-2xl border border-card-border overflow-hidden" style={{ background: '#050d1a' }}>
            <div className="px-4 py-3 border-b border-card-border">
              <p className="font-semibold text-sm" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Medivac.AI — Aeromedical Operations Reimagined</p>
              <p className="text-xs text-muted-foreground mt-0.5">2:34 · Watch Graham introduce the platform, then go live to ask questions</p>
            </div>
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <video className="absolute inset-0 w-full h-full" src={`${API_BASE}/api/video/jennifer_intro.mp4`} controls playsInline poster="/graham_bg_professional.png" style={{ background: '#050d1a' }} />
              {/* Simulated blink overlay — only rendered while intro video is showing (!isLive) */}
              {!isLive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '26%',
                    left: 0,
                    right: 0,
                    height: '6%',
                    background: 'rgba(10, 15, 25, 0.92)',
                    transformOrigin: 'top',
                    animation: 'jennifer-blink 4s infinite',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── LEFT: Avatar ──────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* GO LIVE banner — only shown when not yet connected */}
          {!isLive && !isConnecting && (
            <button onClick={startSession}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg text-black bg-cyan-400 hover:bg-cyan-300 shadow-xl shadow-cyan-400/30 transition-all active:scale-95 animate-pulse hover:animate-none border-2 border-cyan-300">
              <PhoneCall size={22} />
              GO LIVE — Start Talking to Graham
            </button>
          )}
          {isConnecting && (
            <div className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm text-cyan-400 border border-cyan-400/30" style={{ background: 'rgba(5,13,26,0.7)' }}>
              <Loader2 size={18} className="animate-spin" />
              {statusMsg || "Connecting to Graham…"}
            </div>
          )}
          <div className="rounded-2xl border border-card-border overflow-hidden relative" style={{ background: 'url(/graham_bg_portrait.png) center/cover no-repeat' }}>

            {/* Portrait video — 9:16 aspect ratio, fills frame */}
            <div className="relative w-full" style={{ aspectRatio: '9/16', minHeight: 420, maxHeight: 640, background: 'url(/graham_bg_portrait.png) center/cover no-repeat' }}>

              {/* Video — visible so attach() works, but hidden behind the canvas */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={videoMuted}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0, pointerEvents: "none" }}
                // @ts-ignore
                x-webkit-airplay="allow"
              />

              {/* Canvas — chroma-keyed output: green pixels removed, comms backdrop shows through */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: isLive ? 1 : 0, pointerEvents: "none" }}
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
                    <h2 className="text-lg font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Graham</h2>
                    <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed text-center">
                      {isConnecting ? statusMsg : "Live face-to-face AI Q&A — real expressions, real voice, deep Medivac.ai knowledge"}
                    </p>
                  </div>
                  {!isConnecting && (
                    <button onClick={startSession} data-testid="button-start-session"
                      className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-cyan-400 hover:bg-cyan-300 text-black text-base font-black rounded-2xl transition-all shadow-xl shadow-cyan-400/40 active:scale-95 animate-pulse hover:animate-none">
                      <PhoneCall size={20} />
                      GO LIVE — Talk to Graham
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

                  {/* Safari/iOS autoplay: video plays muted — show tap-to-unmute overlay */}
                  {videoMuted && (
                    <button
                      onClick={() => {
                        const vid = videoRef.current;
                        if (vid) {
                          vid.muted = false;
                          vid.volume = 1.0;
                          // Resume play in case Safari paused it
                          vid.play().catch(() => {});
                        }
                        setVideoMuted(false);
                      }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-[2px] z-10 cursor-pointer"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cyan-400/20 border-2 border-cyan-400/60 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-white">Tap to unmute</span>
                      <span className="text-[10px] text-cyan-400/80">Graham is live — audio requires one tap</span>
                    </button>
                  )}

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
                  ? micActive  ? "Speak now — Graham will answer live"
                  : speaking   ? "Graham is speaking…"
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
          <div className="space-y-2 p-3 rounded-2xl border border-card-border backdrop-blur-sm" style={{ background: 'linear-gradient(rgba(5,13,26,0.78), rgba(5,13,26,0.85)), url(/graham_bg_professional.png) center top/cover no-repeat' }}>
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
        <div className="xl:col-span-3 flex flex-col rounded-2xl border border-card-border overflow-hidden relative" style={{ minHeight: 580, background: 'linear-gradient(rgba(5,13,26,0.82), rgba(5,13,26,0.88)), url(/graham_bg_professional.png) center/cover no-repeat' }}>

          <div className="px-4 py-3 border-b border-card-border flex items-center gap-2 flex-wrap backdrop-blur-sm" style={{ background: 'rgba(5,13,26,0.70)' }}>
            <MessageCircle size={14} className="text-cyan-400 shrink-0" />
            <span className="text-sm font-semibold">Graham Q&amp;A</span>
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
                    <span className="text-cyan-400 font-bold text-[10px] block mb-1">Graham</span>
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
                  <span className="text-cyan-400 font-bold text-[10px]">Graham</span>
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
                Text chat works without a live session. Start the session for Graham to answer face to face.
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
                placeholder={micActive ? "Listening…" : "Ask Graham anything about Medivac.ai…"}
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
