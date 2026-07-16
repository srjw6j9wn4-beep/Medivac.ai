/**
 * JenniferLive.tsx — Intro video + Graham (BryanLive) Q&A
 */

import type { UserRole } from "@/lib/data";
import BryanLive from "./BryanLive";

interface Props { role: UserRole; }

export default function JenniferLive({ role }: Props) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Medivac.AI — Aeromedical Operations Reimagined
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Purpose-built for King Air operators running RFDS-style air ambulance missions across Australia
        </p>
      </div>

      {/* Intro Video */}
      <div className="rounded-2xl border border-card-border overflow-hidden" style={{ background: '#050d1a' }}>
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <video
            className="absolute inset-0 w-full h-full"
            src="/video/jennifer_intro.mp4"
            controls
            playsInline
            poster="/jennifer_backdrop_v2.png"
            style={{ background: '#050d1a' }}
          />
        </div>
      </div>

      {/* Graham Live Q&A */}
      <BryanLive role={role} embedded />
    </div>
  );
}
