import { useState } from "react";
import medivacLogo from "/medivac-logo.jpg";

// On Railway: no /port/5000 prefix. On pplx.app: uses /port/5000.
const BASE    = window.location.hostname.endsWith(".pplx.app") ? "/port/5000" : "";
const APP_KEY = "98dcf87f14cdd94024310478d34915c15867d888a4c5db09e143431a515ffc64";

interface LoginProps { onLogin: (token: string) => void; }

export default function Login({ onLogin }: LoginProps) {
  const [email,    setEmail]    = useState("andy@awlabs.com.au");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Key": APP_KEY },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        onLogin(data.token);
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch {
      setError("Cannot reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"#0a0f14",
      fontFamily:"'Cabinet Grotesk','General Sans',sans-serif",
    }}>
      <div style={{
        background:"#111820", border:"1px solid #1e2d3d", borderRadius:16,
        padding:"48px 40px", width:"100%", maxWidth:400,
        boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <img src={medivacLogo} alt="Medivac.ai" style={{ height:48, borderRadius:8, marginBottom:12 }} />
          <div style={{ color:"#94a3b8", fontSize:13 }}>Aeromedical Operations Platform</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#64748b", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="username" required
              style={{ width:"100%", boxSizing:"border-box", background:"#0d1520", border:"1px solid #1e2d3d", borderRadius:8, color:"#e2e8f0", fontSize:14, padding:"10px 14px", outline:"none" }}
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", color:"#64748b", fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" required placeholder="Enter password"
              style={{ width:"100%", boxSizing:"border-box", background:"#0d1520", border:"1px solid #1e2d3d", borderRadius:8, color:"#e2e8f0", fontSize:14, padding:"10px 14px", outline:"none" }}
            />
          </div>

          {error && (
            <div style={{ background:"#2d1515", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 14px", color:"#fca5a5", fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"12px", borderRadius:8, border:"none",
            background: loading ? "#1e3a4a" : "#0ea5e9",
            color:"#fff", fontSize:14, fontWeight:600,
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop:24, textAlign:"center", color:"#334155", fontSize:11 }}>
          Medivac.ai · Authorised Access Only
        </div>
      </div>
    </div>
  );
}
