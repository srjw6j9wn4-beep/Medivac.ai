import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getAerodrome } from "@/data/ersa-airports";

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  weight: string;
  phone: string;
  notes: string;
}

interface Sector {
  id: string;
  from: string;
  to: string;
  etd: string;
  eta: string;
}

function formatAge(dob: string): string {
  if (!dob) return "";
  const d = new Date(dob);
  const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return isNaN(age) ? "" : `${age} yrs`;
}

function aeroName(icao: string): string {
  const a = getAerodrome(icao);
  return a ? `${icao} — ${a.name}` : icao;
}

export default function ManifestSign() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [manifest, setManifest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picName, setPicName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasSig = useRef(false);

  useEffect(() => {
    if (!token) { setError("Invalid link."); setLoading(false); return; }
    apiRequest("GET", `/api/manifests/sign/${token}`)
      .then(r => r.json())
      .then((data: any) => {
        if (data.error) { setError(data.error); return; }
        setManifest(data);
        if (data.status === "signed") setSigned(true);
      })
      .catch(() => setError("Unable to load manifest. Please check the link."))
      .finally(() => setLoading(false));
  }, [token]);

  // Canvas drawing helpers
  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
    hasSig.current = true;
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(false);
    lastPos.current = null;
  }

  function clearSig() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSig.current = false;
  }

  async function submitSignature() {
    if (!picName.trim()) { alert("Please enter your name before signing."); return; }
    if (!hasSig.current) { alert("Please draw your signature before submitting."); return; }
    const canvas = canvasRef.current; if (!canvas) return;
    const sigData = canvas.toDataURL("image/png");
    setSigning(true);
    try {
      const res = await apiRequest("POST", `/api/manifests/sign/${token}`, {
        signatureData: sigData,
        signedBy: picName.trim(),
      });
      const data = await res.json();
      if (data.success) {
        setSigned(true);
        setManifest(data.manifest);
      } else {
        alert("Error saving signature: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Failed to submit signature. Please try again.");
    } finally { setSigning(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-slate-500 text-lg">Loading manifest…</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-red-600 font-bold text-xl mb-2">Invalid Link</h2>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </div>
  );

  const sectors: Sector[] = (() => { try { return JSON.parse(manifest.sectors); } catch { return []; } })();
  const passengers: Passenger[] = (() => { try { return JSON.parse(manifest.passengers); } catch { return []; } })();
  const totalWeight = passengers.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 print:p-0 print:space-y-4">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white text-lg font-bold">R</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">RFDS South East Section</p>
                  <h1 className="text-slate-900 font-bold text-xl leading-tight">Passenger Manifest</h1>
                </div>
              </div>
            </div>
            <div className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              manifest.status === "signed" ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-amber-100 text-amber-700 border border-amber-300"
            }`}>
              {manifest.status === "signed" ? "✓ SIGNED" : "AWAITING SIGNATURE"}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Date", value: manifest.flight_date || manifest.flightDate },
              { label: "Flight", value: manifest.flight_number || manifest.flightNumber },
              { label: "Aircraft", value: manifest.aircraft_reg || manifest.aircraftReg },
              { label: "Booked by", value: manifest.booking_team || manifest.bookingTeam },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-slate-900 font-semibold text-sm mt-0.5">{value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sectors */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-slate-300">
          <h2 className="text-slate-700 font-bold text-sm uppercase tracking-wide mb-4">Flight Sectors</h2>
          <div className="space-y-3">
            {sectors.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-slate-400 w-6">{i + 1}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">{aeroName(s.from)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-slate-800 text-sm">{aeroName(s.to)}</span>
                </div>
                <div className="text-slate-500 text-xs flex gap-3">
                  {s.etd && <span>ETD {s.etd}</span>}
                  {s.eta && <span>ETA {s.eta}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-700 font-bold text-sm uppercase tracking-wide">
              Passengers — {passengers.length} aboard
            </h2>
            {totalWeight > 0 && (
              <span className="text-xs text-slate-500">Total: <strong>{totalWeight.toFixed(0)} kg</strong></span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["#", "Name", "DOB / Age", "Weight", "Phone", "Notes"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide pb-2 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {passengers.map((p, i) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium text-slate-800">{p.firstName} {p.lastName}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{p.dob} {p.dob && <span className="text-slate-400">({formatAge(p.dob)})</span>}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{p.weight ? `${p.weight} kg` : "—"}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{p.phone || "—"}</td>
                  <td className="py-2.5 text-slate-500 text-xs">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature section */}
        {!signed ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
            <h2 className="text-slate-700 font-bold text-sm uppercase tracking-wide mb-4">PIC Signature</h2>
            <p className="text-slate-500 text-sm mb-4">
              I confirm that I have reviewed this passenger manifest and accept responsibility for the listed passengers on the above sectors.
            </p>
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">PIC Full Name</label>
              <input
                type="text"
                value={picName}
                onChange={e => setPicName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Signature</label>
                <button onClick={clearSig} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear</button>
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                className="w-full border-2 border-slate-300 rounded-xl bg-white cursor-crosshair touch-none"
                style={{ height: "160px" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              <p className="text-xs text-slate-400 mt-1">Sign above using mouse or finger/stylus on iPad</p>
            </div>
            <button
              onClick={submitSignature}
              disabled={signing}
              className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-base"
            >
              {signing ? "Submitting…" : "Sign & Submit Manifest"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
              <div>
                <h2 className="text-green-700 font-bold text-base">Manifest Signed</h2>
                <p className="text-green-600 text-sm">
                  Signed by <strong>{manifest.signed_by || manifest.signedBy}</strong> ·{" "}
                  {manifest.signed_at || manifest.signedAt
                    ? new Date(manifest.signed_at || manifest.signedAt).toLocaleString("en-AU")
                    : ""}
                </p>
              </div>
            </div>
            {(manifest.signature_data || manifest.signatureData) && (
              <div className="border border-green-200 rounded-xl overflow-hidden inline-block">
                <img
                  src={manifest.signature_data || manifest.signatureData}
                  alt="Signature"
                  className="max-h-24 block"
                />
              </div>
            )}
            <div className="mt-4 flex gap-3 print:hidden">
              <button
                onClick={() => {
                  // Try window.print() first (works in browser tabs)
                  // If inside an iframe (pplx.app), fall back to downloading the page as HTML
                  try {
                    window.print();
                  } catch (_) {
                    // Fallback: capture current document HTML and trigger download
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>RFDS Passenger Manifest</title><style>body{font-family:sans-serif;padding:24px}@media print{.print\\:hidden{display:none}}</style></head><body>${document.querySelector('.max-w-2xl')?.innerHTML ?? document.body.innerHTML}</body></html>`;
                    const blob = new Blob([html], { type: "text/html" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `RFDS_Manifest_${new Date().toISOString().slice(0,10)}.html`;
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => { document.body.removeChild(a); }, 2000);
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-6 print:pb-2">
          RFDS South East Section · Passenger Manifest · Generated by Medivac.ai
        </div>
      </div>
    </div>
  );
}
