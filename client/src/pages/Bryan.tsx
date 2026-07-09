import { useState, useRef, useEffect, useCallback } from "react";
import { type UserRole } from "@/lib/data";
import { Play, Pause, Volume2, Maximize2, SkipForward } from "lucide-react";
import { apiRequest, API_BASE } from "@/lib/queryClient";

interface Props { role: UserRole; }

const VIDEOS = [
  {
    id: 1,
    title: "Welcome to Medivac.ai",
    duration: "0:32",
    section: "Introduction",
    desc: "Jennifer introduces Medivac.ai — the end-to-end aeromedical operations platform built for King Air B200/B300 RFDS-style operators.",
    thumbnail: "/thumb_01_welcome.png",
    color: "from-cyan-900/60 to-slate-900",
    accent: "border-cyan-400/40",
    videoSrc: `${API_BASE}/api/video/01_welcome.mp4`,
    backdropSrc: "/bg_01_welcome.png",
  },
  {
    id: 2,
    title: "Mission Acceptance & Dispatch Flow",
    duration: "0:36",
    section: "Mission Operations",
    desc: "Jennifer walks through how Medivac.ai handles a mission from initial NEPT call through to dispatch release and airborne confirmation.",
    thumbnail: "/thumb_02_dispatch.png",
    color: "from-blue-900/60 to-slate-900",
    accent: "border-blue-400/40",
    videoSrc: `${API_BASE}/api/video/02_dispatch.mp4`,
    backdropSrc: "/bg_02_dispatch.png",
  },
  {
    id: 3,
    title: "Compliance Gates Explained",
    duration: "0:35",
    section: "Compliance",
    desc: "A full walkthrough of each dispatch release gate — flight plan, W&B, APG release, maintenance release, and crew sign-off.",
    thumbnail: "/thumb_03_compliance.png",
    color: "from-green-900/60 to-slate-900",
    accent: "border-green-400/40",
    videoSrc: `${API_BASE}/api/video/03_compliance.mp4`,
    backdropSrc: "/bg_03_compliance.png",
  },
  {
    id: 4,
    title: "Ferry Flights — OUT/IN Tracking",
    duration: "0:30",
    section: "Ferry Flights",
    desc: "How Medivac.ai tracks equipment removed and reinstalled during aircraft repositioning, with photo evidence and return-to-service controls.",
    thumbnail: "/thumb_04_ferry.png",
    color: "from-orange-900/60 to-slate-900",
    accent: "border-orange-400/40",
    videoSrc: `${API_BASE}/api/video/04_ferry.mp4`,
    backdropSrc: "/bg_04_ferry.png",
  },
  {
    id: 5,
    title: "Lord Howe Island Special Mission",
    duration: "0:34",
    section: "Special Missions",
    desc: "Detailed walkthrough of YLHI over-water dispatch — life raft, survival equipment, EPIRBs, SARTIME lodgement and dispatch block logic.",
    thumbnail: "/thumb_05_lordhowe.png",
    color: "from-teal-900/60 to-slate-900",
    accent: "border-teal-400/40",
    videoSrc: `${API_BASE}/api/video/05_lordhowe.mp4`,
    backdropSrc: "/lordhowe_bg.jpg",
  },
  {
    id: 6,
    title: "NETS & ECMO Missions",
    duration: "0:27",
    section: "Special Missions",
    desc: "Jennifer explains neonatal and ECMO transport configurations — required equipment, specialist crew, and receiving facility confirmation gates.",
    thumbnail: "/thumb_06_nets.png",
    color: "from-purple-900/60 to-slate-900",
    accent: "border-purple-400/40",
    videoSrc: `${API_BASE}/api/video/06_nets.mp4`,
    backdropSrc: "/bg_06_nets.png",
  },
  {
    id: 7,
    title: "ISO Compliance Control Centre",
    duration: "1:16",
    section: "Compliance",
    desc: "Jennifer walks through the ISO 9001:2015 and ISO 13485:2016 certification readiness dashboard — clause scoring, CAPA register, evidence packs, and the four-phase critical path to dual certification by November 2026.",
    thumbnail: "/thumb_07_iso.png",
    color: "from-amber-900/60 to-slate-900",
    accent: "border-amber-400/40",
    videoSrc: `${API_BASE}/api/video/07_iso.mp4`,
    backdropSrc: "/bg_07_iso.png",
  },
  {
    id: 8,
    title: "Telehealth & Clinical AI",
    duration: "0:29",
    section: "Clinical",
    desc: "How the Telehealth Portal and AI Mission Analyst work together to support in-flight clinical decision making.",
    thumbnail: "/thumb_08_telehealth.png",
    color: "from-green-900/60 to-slate-900",
    accent: "border-green-400/40",
    videoSrc: `${API_BASE}/api/video/08_telehealth.mp4`,
    backdropSrc: "/bg_08_telehealth.png",
  },
  {
    id: 9,
    title: "Isolation Protocol",
    duration: "0:37",
    section: "Clinical",
    desc: "Isolation flight procedures — patient containment, cabin airflow management, and crew PPE protocols for infectious disease transport.",
    thumbnail: "/thumb_09_isolation.png",
    color: "from-rose-900/60 to-slate-900",
    accent: "border-rose-400/40",
    videoSrc: `${API_BASE}/api/video/09_isolation.mp4`,
    backdropSrc: "/bg_09_isolation.png",
  },
];

const STARTERS = [
  "How does dispatch release work?",
  "What are the Lord Howe Island requirements?",
  "Tell me about NETS missions",
  "What is the King Air fuel capacity?",
  "How does ISO compliance tracking work?",
  "What does the Telehealth Portal do?",
];

type Msg = { role: "user" | "ai"; text: string };
type ApiMsg = { role: "user" | "assistant"; content: string };

function WaveformBars({ active }: { active: boolean }) {
  const heights = [3, 6, 9, 12, 8, 14, 10, 6, 4, 8, 12, 7, 5, 10, 13, 8, 6, 4];
  return (
    <div className="flex items-end gap-0.5 h-5">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full transition-all ${active ? "bg-cyan-400" : "bg-cyan-400/30"}`}
          style={{
            height: active ? `${h}px` : "3px",
            transitionDelay: active ? `${i * 30}ms` : "0ms",
            transitionDuration: active ? "300ms" : "150ms",
          }}
        />
      ))}
    </div>
  );
}

function VideoThumb({
  video, active, onClick,
}: {
  video: typeof VIDEOS[0]; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
        active ? `bg-cyan-400/10 border-cyan-400/40` : "bg-card border-card-border hover:border-cyan-400/30"
      }`}
    >
      <div
        className={`shrink-0 w-14 h-10 rounded-lg border ${video.accent} flex items-center justify-center relative overflow-hidden`}
        style={video.backdropSrc
          ? { backgroundImage: `url(${video.backdropSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }
        }
      >
        {!video.backdropSrc && <span className="text-xl">{video.thumbnail}</span>}
        <div className={`absolute inset-0 ${video.backdropSrc ? 'bg-black/20' : `bg-gradient-to-br ${video.color}`}`} />
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold truncate ${active ? "text-cyan-400" : ""}`}>{video.title}</div>
        <div className="text-[10px] text-muted-foreground">{video.section} · {video.duration}</div>
      </div>
    </button>
  );
}

export default function Bryan({ role }: Props) {
  const [activeVideo, setActiveVideo] = useState(VIDEOS[0]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");

  // Chat state
  const [chatLog, setChatLog] = useState<Msg[]>([
    { role: "ai", text: "G'day — I'm Jennifer, your Medivac.ai AI presenter and mission analyst. Ask me anything about the platform — type your question or use the mic. I'm across every module, from dispatch release to ISO compliance." },
  ]);
  const [apiHistory, setApiHistory] = useState<ApiMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Voice input
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // TTS — speak Bryan's replies
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  // Other
  const [videoError, setVideoError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef  = useRef<GainNode | null>(null); // kept for type compat, no longer used
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  function fmtTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, thinking]);

  // No Web Audio GainNode — HeyGen Diora videos are recorded at proper levels.
  // Native volume at 1.0 is sufficient and avoids MediaElementSource re-routing issues.
  const audioSetupDone = useRef(false); // kept to avoid breaking video-switch reset logic

  // When active video changes, reload
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    audioSetupDone.current = false;
    video.volume = 1.0;
    video.src = activeVideo.videoSrc;
    video.load();
    setPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    setTotalTime("0:00");
    setVideoError("");
  }, [activeVideo]);

  // Wire video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(fmtTime(video.currentTime));
      }
    };
    const onLoadedMetadata = () => setTotalTime(fmtTime(video.duration));
    const onEnded = () => { setPlaying(false); setProgress(100); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      const err = video.error;
      setVideoError(err ? `Video error ${err.code}` : "Video failed to load.");
      setPlaying(false);
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
    };
  }, []);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    // Ensure native volume is max
    video.volume = 1.0;
    if (video.paused) {
      video.play().then(() => setVideoError("")).catch((err: Error) => {
        setVideoError(err.message || "Playback blocked. Tap Play to retry.");
      });
    } else {
      video.pause();
    }
  }

  function handleVideoSelect(v: typeof VIDEOS[0]) {
    videoRef.current?.pause();
    setActiveVideo(v);
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
  }

  function handleNext() {
    videoRef.current?.pause();
    setActiveVideo(VIDEOS[(VIDEOS.indexOf(activeVideo) + 1) % VIDEOS.length]);
  }

  // ── TTS: speak Bryan's reply ──────────────────────────────
  function speakText(text: string) {
    if (!ttsEnabled) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-AU";
    utter.rate = 0.95;
    utter.pitch = 1.05;
    // Try to use a female voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith("en") && /female|woman|samantha|karen|victoria|moira|tessa/i.test(v.name)
    ) || voices.find(v => v.lang.startsWith("en-AU")) || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  // ── AI chat call ─────────────────────────────────────────────
  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg: Msg = { role: "user", text: trimmed };
    const apiUserMsg: ApiMsg = { role: "user", content: trimmed };

    setChatLog(prev => [...prev, userMsg]);
    setChatInput("");
    setThinking(true);
    stopSpeaking();

    const newHistory: ApiMsg[] = [...apiHistory, apiUserMsg];

    try {
      const data = await apiRequest("POST", "/api/bryan/chat", { messages: newHistory });
      const json = await data.json();
      const reply: string = json.reply || "I couldn't process that right now. Please try again.";

      const aiMsg: Msg = { role: "ai", text: reply };
      const apiAssistantMsg: ApiMsg = { role: "assistant", content: reply };

      setChatLog(prev => [...prev, aiMsg]);
      setApiHistory([...newHistory, apiAssistantMsg]);
      speakText(reply);
    } catch (err) {
      const errorMsg = "I'm having trouble connecting right now. Check the backend is running and try again.";
      setChatLog(prev => [...prev, { role: "ai", text: errorMsg }]);
    } finally {
      setThinking(false);
    }
  }

  // ── Voice Input ──────────────────────────────────────────────
  const handleVoiceInput = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError("Voice input not supported in this browser. Try Chrome or Safari.");
      setTimeout(() => setVoiceError(""), 4000);
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.lang = "en-AU";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setVoiceError("");
    setListening(true);

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript = transcript;
      }
      setChatInput(transcript);
    };

    recognition.onend = () => {
      setListening(false);
      const toSend = finalTranscript || "";
      if (toSend.trim()) {
        setChatInput("");
        sendMessage(toSend);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (event.error === "not-allowed") {
        setVoiceError("Microphone permission denied.");
      } else if (event.error === "no-speech") {
        setVoiceError("No speech detected. Try again.");
      } else {
        setVoiceError(`Voice error: ${event.error}`);
      }
      setTimeout(() => setVoiceError(""), 4000);
    };

    recognition.start();
  }, [listening, apiHistory, chatLog]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Jennifer — AI Presenter</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real voice narration · 8 narrated modules · HeyGen AI voice</p>
      </div>

      <div className="space-y-4">

        {/* ── Video player + library ── */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div
              className="relative w-full bg-[#0a1628]"
              style={{
                aspectRatio: '16/9',
                ...(activeVideo.backdropSrc ? {
                  backgroundImage: `url(${activeVideo.backdropSrc})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {})
              }}
            >
              {/* Video sits in its own layer so screen blend only composites against the backdrop, not the UI overlays */}
              <div className="absolute inset-0" style={{ isolation: 'isolate' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: "screen" }}
                  playsInline
                  preload="auto"
                  src={activeVideo.videoSrc}
                />
              </div>

              {/* Overlay: shown when not playing, fades out smoothly when playing starts */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 transition-opacity duration-500 ${
                playing ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}>
                  {activeVideo.thumbnail.startsWith('/') ? (
                    <img src={activeVideo.thumbnail} alt={activeVideo.title} className="w-20 h-14 object-cover rounded-lg shadow-lg mb-1 opacity-90" />
                  ) : (
                    <div className="text-4xl mb-1">{activeVideo.thumbnail}</div>
                  )}
                  <div className="text-lg font-bold text-white text-center px-6" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                    {activeVideo.title}
                  </div>
                  <p className="text-sm text-white/70 max-w-md text-center px-6 leading-relaxed">{activeVideo.desc}</p>
                  <button onClick={handlePlay}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black text-sm font-bold rounded-full transition-colors shadow-lg shadow-cyan-400/30">
                    <Play size={16} className="ml-0.5" />
                    Play — Jennifer Presents
                  </button>
              </div>

              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 rounded-full text-[10px] font-semibold text-cyan-400 border border-cyan-400/20">
                {activeVideo.section}
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 rounded-full text-[10px] text-white/70">
                {currentTime} / {totalTime || activeVideo.duration}
              </div>
            </div>

            <div className="p-3 border-t border-card-border">
              <div
                className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-3 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div className="h-full bg-cyan-400 rounded-full transition-none"
                  style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handlePlay}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 text-xs font-semibold rounded-lg transition-colors">
                  {playing ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Play</>}
                </button>
                <button onClick={handleNext}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward size={13} /> Next
                </button>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                  <Volume2 size={13} />
                  <span className="text-[10px]">HeyGen · Real Voice</span>
                </div>
                <div className="flex-1 text-xs text-muted-foreground truncate text-center">{activeVideo.title}</div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Video library */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Explainer Library — {VIDEOS.length} narrated modules
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIDEOS.map(v => (
                <VideoThumb key={v.id} video={v} active={activeVideo.id === v.id} onClick={() => handleVideoSelect(v)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
