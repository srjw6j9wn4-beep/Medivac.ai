import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

const BASE = window.location.hostname.endsWith(".pplx.app") ? "/port/5000" : "";
const KEY  = "98dcf87f14cdd94024310478d34915c15867d888a4c5db09e143431a515ffc64";

// Fire-and-forget pre-warm — starts the moment the module is imported
async function prewarm() {
  for (let i = 0; i < 12; i++) {
    try {
      const res = await fetch(`${BASE}/api/auth/session`, {
        headers: { "X-App-Key": KEY },
        credentials: "include",
      });
      if (res.ok) return; // sandbox is up
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
  }
}
prewarm();

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail]     = useState("andy@awlabs.com.au");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  // Show "ready" indicator once backend responds
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < 15; i++) {
        try {
          const res = await fetch(`${BASE}/api/auth/session`, {
            headers: { "X-App-Key": KEY },
            credentials: "include",
          });
          if (res.ok && !cancelled) { setReady(true); return; }
        } catch {}
        await new Promise(r => setTimeout(r, 2000));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Enter your email and password"); return; }
    setError("");
    setLoading(true);
    try {
      // Retry up to 8x for cold-start
      let res: Response | null = null;
      for (let i = 0; i <= 8; i++) {
        res = await fetch(`${BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-App-Key": KEY },
          body: JSON.stringify({ email: email.trim(), password }),
          credentials: "include",
        });
        if (res.status === 404 || res.status === 503) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      }
      if (!res) throw new Error("Server unavailable — try again.");
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); setLoading(false); return; }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  const F = { fontFamily: "'Cabinet Grotesk', sans-serif" };

  return (
    <div style={{
      ...F, minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #0d2147 50%, #0a1628 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg,#1a56db,#1e40af)",
            marginBottom: 16,
            boxShadow: "0 0 0 1px rgba(99,179,237,0.2),0 8px 24px rgba(26,86,219,0.4)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Medivac.ai</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "1px" }}>
            AEROMEDICAL OPERATIONS PLATFORM
          </div>
          {/* Ready indicator */}
          <div style={{ marginTop: 10, height: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {ready ? (
              <>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Ready</span>
              </>
            ) : (
              <>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1.2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Starting up…</span>
              </>
            )}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18, padding: "32px 36px", backdropFilter: "blur(12px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 2 }}>Administrator Sign In</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>Authorised personnel only</div>

          <form onSubmit={handleSubmit} autoComplete="on">
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, letterSpacing: "0.5px" }}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 9, padding: "12px 14px", color: "white",
                  fontSize: 14, fontFamily: "'General Sans',sans-serif", outline: "none",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, letterSpacing: "0.5px" }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  ref={pwRef}
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  placeholder="••••••••••"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 9, padding: "12px 42px 12px 14px", color: "white",
                    fontSize: 14, fontFamily: "'General Sans',sans-serif", outline: "none",
                  }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.3)", padding: 4, fontSize: 13,
                }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(252,165,165,0.1)", border: "1px solid rgba(252,165,165,0.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#fca5a5",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(26,86,219,0.4)" : "linear-gradient(135deg,#1a56db,#1e40af)",
                border: "none", borderRadius: 9, padding: "13px",
                color: "white", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Cabinet Grotesk',sans-serif",
                boxShadow: loading ? "none" : "0 4px 16px rgba(26,86,219,0.4)",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
          Medivac.ai · Secure Access · © Matthew Fuge
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
        input:focus { border-color: rgba(99,179,237,0.5) !important; }
      `}</style>
    </div>
  );
}
