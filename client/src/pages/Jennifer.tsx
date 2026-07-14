import { useState, useRef, useEffect, useCallback } from "react";
import { type UserRole } from "@/lib/data";
import { Play, Pause, MessageCircle, Mic, MicOff, Volume2, VolumeX, Maximize2, SkipForward, Send } from "lucide-react";
import { apiRequest, API_BASE } from "@/lib/queryClient";

interface Props { role: UserRole; }

const VIDEOS = [
  {
    id: 1,
    title: "Welcome to Medivac.ai",
    duration: "0:32",
    section: "Introduction",
    desc: "Jennifer introduces Medivac.ai — the end-to-end aeromedical operations platform built for King Air B200/B300 RFDS-style operators.",
    thumbSrc: "/thumb_01_welcome.png",
    color: "from-cyan-900/60 to-slate-900",
    accent: "border-cyan-400/40",
    videoSrc: `/video/01_welcome.mp4`,
    backdropSrc: "/bg_01_welcome.png",
  },
  {
    id: 2,
    title: "Mission Acceptance & Dispatch Flow",
    duration: "0:36",
    section: "Mission Operations",
    desc: "Jennifer walks through how Medivac.ai handles a mission from initial NEPT call through to dispatch release and airborne confirmation.",
    thumbSrc: "/thumb_02_dispatch.png",
    color: "from-blue-900/60 to-slate-900",
    accent: "border-blue-400/40",
    videoSrc: `/video/02_dispatch.mp4`,
    backdropSrc: "/bg_02_dispatch.png",
  },
  {
    id: 3,
    title: "Compliance Gates Explained",
    duration: "0:35",
    section: "Compliance",
    desc: "A full walkthrough of each dispatch release gate — flight plan, W&B, APG release, maintenance release, and crew sign-off.",
    thumbSrc: "/thumb_03_compliance.png",
    color: "from-green-900/60 to-slate-900",
    accent: "border-green-400/40",
    videoSrc: `/video/03_compliance.mp4`,
    backdropSrc: "/bg_03_compliance.png",
  },
  {
    id: 4,
    title: "Ferry Flights — OUT/IN Tracking",
    duration: "0:30",
    section: "Ferry Flights",
    desc: "How Medivac.ai tracks equipment removed and reinstalled during aircraft repositioning, with photo evidence and return-to-service controls.",
    thumbSrc: "/thumb_04_ferry.png",
    color: "from-orange-900/60 to-slate-900",
    accent: "border-orange-400/40",
    videoSrc: `/video/04_ferry.mp4`,
    backdropSrc: "/bg_04_ferry.png",
  },
  {
    id: 5,
    title: "Lord Howe Island Special Mission",
    duration: "0:34",
    section: "Special Missions",
    desc: "Detailed walkthrough of YLHI over-water dispatch — life raft, survival equipment, EPIRBs, SARTIME lodgement and dispatch block logic.",
    thumbSrc: "/thumb_05_lordhowe.png",
    color: "from-teal-900/60 to-slate-900",
    accent: "border-teal-400/40",
    videoSrc: `/video/05_lordhowe.mp4`,
    backdropSrc: "/bg_05_lordhowe_frame.jpg",
  },
  {
    id: 6,
    title: "NETS & ECMO Missions",
    duration: "0:27",
    section: "Special Missions",
    desc: "Jennifer explains neonatal and ECMO transport configurations — required equipment, specialist crew, and receiving facility confirmation gates.",
    thumbSrc: "/thumb_06_nets.png",
    color: "from-purple-900/60 to-slate-900",
    accent: "border-purple-400/40",
    videoSrc: `/video/06_nets.mp4`,
    backdropSrc: "/bg_06_nets.png",
  },
  {
    id: 7,
    title: "ISO Compliance Control Centre",
    duration: "1:16",
    section: "Compliance",
    desc: "Jennifer walks through the ISO 9001:2015 and ISO 13485:2016 certification readiness dashboard — clause scoring, CAPA register, evidence packs, and the four-phase critical path to dual certification by November 2026.",
    thumbSrc: "/thumb_07_iso.png",
    color: "from-amber-900/60 to-slate-900",
    accent: "border-amber-400/40",
    videoSrc: `/video/07_iso.mp4`,
    backdropSrc: "/bg_07_iso.png",
  },
  {
    id: 8,
    title: "Telehealth & Clinical AI",
    duration: "0:29",
    section: "Clinical",
    desc: "How the Telehealth Portal and AI Mission Analyst work together to support in-flight clinical decision making.",
    thumbSrc: "/thumb_08_telehealth.png",
    color: "from-green-900/60 to-slate-900",
    accent: "border-green-400/40",
    videoSrc: `/video/08_telehealth.mp4`,
    backdropSrc: "/bg_08_telehealth.png",
  },
  {
    id: 9,
    title: "Isolation Protocol",
    duration: "0:37",
    section: "Clinical",
    desc: "Isolation flight procedures — patient containment, cabin airflow management, and crew PPE protocols for infectious disease transport.",
    thumbSrc: "/thumb_09_isolation.png",
    color: "from-rose-900/60 to-slate-900",
    accent: "border-rose-400/40",
    videoSrc: `/video/09_isolation.mp4`,
    backdropSrc: "/bg_09_isolation.png",
  },
  {
    id: 10,
    title: "NEPT Tasking Board",
    duration: "1:05",
    section: "Mission Operations",
    desc: "Jennifer demonstrates the NEPT Tasking Board — creating a task, assigning crew and aircraft, running the AI auto-tasker, reviewing the route planner with live NOTAMs and fuel status, and tracking mission progress from dispatch to completion.",
    thumbSrc: "/thumb_10_nept.png",
    color: "from-cyan-900/60 to-slate-900",
    accent: "border-cyan-400/40",
    videoSrc: `/video/10_nept.mp4`,
    backdropSrc: "/bg_10_nept.png",
  },
  {
    id: 11,
    title: "Mission Optimiser",
    duration: "1:00",
    section: "Mission Operations",
    desc: "Jennifer explains how the Mission Optimiser sequences multiple tasks for maximum efficiency — balancing crew duty limits, minimising repositioning, and surfacing scheduling conflicts before they occur.",
    thumbSrc: "/thumb_11_optimiser.png",
    color: "from-violet-900/60 to-slate-900",
    accent: "border-violet-400/40",
    videoSrc: `/video/11_optimiser.mp4`,
    backdropSrc: "/bg_11_optimiser.png",
  },
  {
    id: 12,
    title: "AI Mission Analyst",
    duration: "1:00",
    section: "Clinical Intelligence",
    desc: "Jennifer walks through the AI Mission Analyst — pre-dispatch clinical review, crew qualification cross-check, real-time in-flight monitoring, and post-mission compliance debriefing.",
    thumbSrc: "/thumb_12_analyst.png",
    color: "from-emerald-900/60 to-slate-900",
    accent: "border-emerald-400/40",
    videoSrc: `/video/12_analyst.mp4`,
    backdropSrc: "/bg_12_analyst.png",
  },
  {
    id: 13,
    title: "International Organ & Insurance Transfer",
    duration: "2:08",
    section: "Special Missions",
    desc: "Jennifer covers the full workflow for cross-border organ retrieval and insurance repatriation flights — international clearances, ANZOD coordination, cold ischaemia time monitoring, customs, and CASA Part 121 compliance.",
    thumbSrc: "/thumb_13_international.png",
    color: "from-indigo-900/60 to-slate-900",
    accent: "border-indigo-400/40",
    videoSrc: `/video/13_international_v2.mp4`,
    backdropSrc: "/bg_13_international.png",
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
      className={`w-full text-left rounded-xl border transition-all overflow-hidden ${
        active ? `border-cyan-400/60 ring-1 ring-cyan-400/30` : "border-card-border hover:border-cyan-400/30"
      }`}
    >
      {/* Thumbnail image — full width, 16:9 */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        <img
          src={video.thumbSrc}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Dark gradient overlay at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-mono text-white">
          {video.duration}
        </div>
        {/* Section badge */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 border border-white/10 rounded text-[9px] text-white/80">
          {video.section}
        </div>
        {/* Active play indicator */}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-cyan-400/90 flex items-center justify-center shadow-lg shadow-cyan-400/40">
              <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[11px] border-transparent border-l-black ml-1" />
            </div>
          </div>
        )}
      </div>
      {/* Text below thumbnail */}
      <div className={`px-3 py-2 ${ active ? 'bg-cyan-400/10' : 'bg-card' }`}>
        <div className={`text-xs font-semibold leading-tight ${ active ? 'text-cyan-400' : 'text-foreground' }`}>{video.title}</div>
      </div>
    </button>
  );
}

export default function Jennifer({ role }: Props) {
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

  // TTS — speak Jennifer's replies
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  // Other
  const [videoError, setVideoError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoPlayRef = useRef(false); // set true when tile clicked — auto-play after load
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // kept for type compat, unused
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null); // kept for type compat, unused
  const backdropImgRef = useRef<HTMLImageElement | null>(null); // kept for type compat, unused
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  function fmtTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat — scroll only the chat container, not the whole page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog, thinking]);

  // Canvas refs retained for backward compat but no longer used — layout uses CSS backdrop + video mask instead

  // When active video changes, reload — auto-play if tile was clicked
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.src = activeVideo.videoSrc;
    setPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    setTotalTime("0:00");
    setVideoError("");
    video.load();
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      const onCanPlay = () => {
        video.removeEventListener("canplay", onCanPlay);
        video.play().then(() => setVideoError("")).catch((err: Error) => {
          setVideoError(err.message || "Playback blocked — tap Play to start.");
        });
      };
      video.addEventListener("canplay", onCanPlay);
    }
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
    if (video.paused) {
      video.play().then(() => setVideoError("")).catch((err: Error) => {
        setVideoError(err.message || "Playback blocked. Tap Play to retry.");
      });
    } else {
      video.pause();
    }
  }

  const pageTopRef = useRef<HTMLDivElement | null>(null);

  function handleVideoSelect(v: typeof VIDEOS[0]) {
    autoPlayRef.current = true;
    videoRef.current?.pause();
    setActiveVideo(v);
    // Scroll back to top so presenter card is visible
    setTimeout(() => {
      pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
  }

  function handleNext() {
    autoPlayRef.current = true;
    videoRef.current?.pause();
    setActiveVideo(VIDEOS[(VIDEOS.indexOf(activeVideo) + 1) % VIDEOS.length]);
  }

  // ── TTS: speak Jennifer's reply ──────────────────────────────
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
      const data = await apiRequest("POST", "/api/jennifer/chat", { messages: newHistory });
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
    <div className="p-6 space-y-6" ref={pageTopRef}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>Jennifer — AI Presenter</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real voice narration · Live AI Q&A · Typed or spoken questions</p>
      </div>

      {/* ── Full-width Video Player ── */}
      <div className="space-y-4">
          <div className="bg-card rounded-xl border border-card-border overflow-hidden">
            <div
              className="relative w-full bg-[#0a1628] overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Full-bleed scenic backdrop — always visible, video overlays on top */}
              {activeVideo.backdropSrc && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${activeVideo.backdropSrc})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                  }}
                />
              )}
              {/* Bottom gradient only when paused */}
              {!playing && (
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,13,26,0.75) 0%, rgba(5,13,26,0.1) 50%, rgba(5,13,26,0.0) 70%)' }} />
              )}
              {/* Jennifer video — full width, no blend */}
              <video
                ref={videoRef}
                className="absolute inset-0"
                src={activeVideo.videoSrc}
                playsInline
                preload="auto"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  display: playing ? 'block' : 'none',
                }}
              />

              {!playing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(5,13,26,0.55)' }}>

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
              )}

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
      </div>

      {/* ── Full-width Video Library below ── */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Explainer Library — {VIDEOS.length} narrated modules
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {VIDEOS.map(v => (
            <VideoThumb key={v.id} video={v} active={activeVideo.id === v.id} onClick={() => handleVideoSelect(v)} />
          ))}
        </div>
      </div>
    </div>
  );
}
