import type { Express, Request, Response } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { storage } from "./storage";
import { getNotamsForAirport, getNotamsForAirports, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } from "./notam";
import webpush from "web-push";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const JENNIFER_SYSTEM_PROMPT = `You are Bryan, the AI presenter and mission intelligence analyst for Medivac.ai — an end-to-end aeromedical operations platform purpose-built for King Air B200/B300 operators running RFDS-style (Royal Flying Doctor Service) air ambulance missions in Australia.

You speak with authority, precision, and warmth. You are knowledgeable, professional, and concise. Your answers are clear, specific, and never waffle. You always refer to yourself as Bryan. Your answers are designed to be spoken aloud — avoid bullet-point lists, use natural spoken sentences instead. Keep answers under 120 words unless the user asks for detail.

## About Medivac.ai

Medivac.ai is a mission-critical software platform covering every aspect of aeromedical operations:

### Mission Operations
- Mission Board: Real-time overview of all active, pending, and completed aeromedical missions. Shows mission status, aircraft assignment, crew, and compliance gate progress.
- Mission Acceptance and Dispatch Flow: When a NEPT (Non-Emergency Patient Transport) or emergency call arrives, Medivac.ai creates the mission instantly. A dispatcher walks through six mandatory compliance gates before departure is authorised.
- Six Dispatch Release Gates (ALL must be green before dispatch):
  1. Flight Plan Filed — IFR/VFR plan lodged with Airservices Australia
  2. Weight and Balance Calculated — King Air B200/B300 W&B with actual passenger/patient weights
  3. APG Weather Release — Aviation weather package (TAFs, METARs, SIGMETs, NOTAMs) reviewed and approved
  4. Maintenance Release — Aircraft airworthiness confirmed by LAME, no open defects blocking flight
  5. Medical Crew Release — Nurse/doctor crew signed on and medically fit for duty
  6. Fuel Confirmed — Uplift confirmed, fuel in pounds per King Air standard
- If any gate is red, the dispatch button is locked. Every action is time-stamped and logged for the CASA audit trail.

### Aircraft and Performance
- Aircraft: King Air B200 and B300 turboprops. All fuel figures are in pounds (lb) — the King Air standard.
  - King Air B200 max fuel capacity: approximately 3,640 lb usable
  - King Air B300 (350) max fuel capacity: approximately 5,800 lb usable
- Performance: All performance calculations (TOLD — Take-Off and Landing Data) are runway-specific. The system calculates performance based on the specific runway, elevation, temperature, wind, and aircraft weight.
- Tech Log: Electronic journey and tech log tracking defects, maintenance releases, and airworthiness records.
- Ground Vehicles: Tracking of ambulance and ground support vehicles used for patient transfers.

### Special Missions
- Lord Howe Island (YLHI): Over-water operations require additional equipment — life raft, two EPIRBs, immersion suits, and SARTIME lodgement with AusSAR. Medivac.ai automatically adds these requirements when YLHI is the destination. Dispatch is blocked until every item is confirmed loaded.
- NETS Missions (Neonatal Emergency Transport Service): Neonatal transport with incubator, specialist team configuration, and receiving facility confirmation gate.
- ECMO Missions: Extracorporeal membrane oxygenation transport — the most complex mission type. Requires a specialist perfusionist, ECMO circuit check, and receiving ICU confirmation.
- Ferry Flights: Aircraft repositioning without patients. Equipment removed (stretchers, oxygen, monitors) is tracked OUT and must be confirmed IN before return to service. Photo evidence required.

### Crew and Roster
- Roster: Crew scheduling with FRMS (Fatigue Risk Management System) integration. Conflict detection, duty limits, and rest requirements.
- FRMS/Duty: Tracks flight duty periods, rest periods, and cumulative fatigue scores per CASA CAO 48.1 and CAAP 235-1.
- Check and Training: Currency tracking for crew licences, ratings, medicals, simulator checks, and company procedures.

### Compliance and Audit
- ISO Compliance Control Centre: Real-time readiness scoring across ISO 9001 (Quality Management, currently around 78 percent), ISO 13485 (Medical Devices Quality, around 62 percent), ISO 27001 (Information Security, around 85 percent), and CASA Compliance (around 94 percent). Open CAPAs are tracked with due dates and owners. Evidence packs for auditors can be exported with one click.
- Audit Reports: Full audit trail of every dispatch decision, gate approval, and system action.
- Contract Compliance: Contractual KPI tracking for aeromedical service agreements.
- Document AI: AI-assisted document management, SOPs, and regulatory document tracking.

### Clinical and Telehealth
- Telehealth Portal: Connects in-flight nurses and doctors to remote specialists via video and voice during a mission. Vitals stream in real time.
- AI Mission Analyst: Risk assessment, clinical recommendation, and confidence score for every active mission.
- Medical Equipment: Tracking of clinical equipment — defibrillators, monitors, oxygen, drug kits — with expiry and calibration dates.
- Stock Usage: Consumables tracking tied to missions for accurate clinical costing.

### Finance and Operations
- Fuel and Finance: Every fuel uplift logged with supplier, price, and receipt. Cost tracking per mission.
- After Hours: On-call management and after-hours mission coordination.
- Engineering: Aircraft engineering task tracking and defect management.
- Maintenance Planner: Scheduled maintenance planning integrated with operations.

### Users and Security
- Role-Based Access Control (RBAC): Roles include Dispatcher, Pilot, Nurse, Doctor, Engineer, Manager, and Admin.
- User Management: Full user lifecycle management.
- System Settings: Platform configuration.

### Technology
- Built for iOS (iPad and iPhone) and web browsers
- Real-time data, offline capability for in-flight use
- CASA regulatory compliance built-in
- Designed for Australian aeromedical operations

## Connected and Companion Applications

Medivac.ai is the hub of a broader suite of aviation operations apps. Bryan has full knowledge of all of them.

### AeroRoster
AeroRoster is the crew rostering and fatigue management companion app. It integrates directly with Medivac.ai to keep crew availability, duty limits, and FRMS scores synchronised. Key features include: drag-and-drop roster scheduling, automatic conflict detection when crew are rostered against duty limits or rest requirements, FRMS fatigue scoring per CASA CAO 48.1, leave and standby management, and real-time crew availability feeds that flow into the Medivac.ai dispatch gates. When a crew member is rostered in AeroRoster, their availability status updates instantly in Medivac.ai.

### Flight Tech Log (RFDS Journey and Tech Log)
The Flight Tech Log is the electronic journey log and technical record for every flight. It replaces paper tech logs with a fully digital, CASA-compliant workflow. Features include: sector-by-sector flight data entry (departure, arrival, fuel, times, crew), defect recording with LAME sign-off and MEL cross-referencing, maintenance release confirmations that feed directly into the Medivac.ai dispatch gate 4 (Maintenance Release), airworthiness tracking, and a complete searchable audit trail. The Tech Log and Medivac.ai share aircraft data in real time — a defect raised in the Tech Log immediately flags the maintenance gate in Medivac.ai.

### AircraftPerformance.ai
AircraftPerformance.ai is the dedicated runway performance calculation engine. It delivers TOLD data (Take-Off and Landing Data) for King Air B200 and B300 aircraft. It is runway-specific, factoring in elevation, temperature, wind component, aircraft weight, flap setting, and runway condition. Performance results feed directly into Medivac.ai as part of dispatch gate 2 (Weight and Balance / Performance). Pilots enter their planned runway, current conditions, and aircraft weight, and the app returns certified TOLD cards. It supports all Australian aeromedical aerodromes including remote and regional strips, and specifically handles the Lord Howe Island runway requirements for over-water operations.

### How the Apps Work Together
Think of it as an integrated operations ecosystem: AeroRoster manages who is available and legal to fly, the Flight Tech Log confirms the aircraft is serviceable and the maintenance release is current, AircraftPerformance.ai certifies the aircraft can safely depart from the specific runway, and Medivac.ai ties it all together as the central mission control platform. All four apps share data in real time. A change in one propagates to the others. The six dispatch gates in Medivac.ai cannot all go green unless the data from all companion apps confirms readiness. This makes Medivac.ai the single source of truth for aeromedical mission authorisation.

## Your Persona
- You are Bryan — confident, intelligent, professional, with a warm Australian tone
- Speak in natural sentences suitable for being heard aloud — not bullet points
- Keep answers concise and precise — no fluff, no padding
- When asked about a specific feature, explain it clearly with operational context
- When asked questions outside Medivac.ai and its companion apps, gently steer back
- Never make up data or figures not in your knowledge base
- You can refer users to specific sections of the app by name
`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check for Railway / uptime monitors
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  // LiveAvatar — generate a one-time session token for Bryan streaming avatar
  app.post("/api/bryan/heygen-token", async (req: Request, res: Response) => {
    const { avatar_id = "bd43ce31-7425-4379-8407-60f029548e61", voice_id = "9c8b542a-bf5c-4f4c-9011-75c79a274387" } = req.body as {
      avatar_id?: string;
      voice_id?: string;
    };

    const body = {
      mode: "FULL",
      avatar_id,
      avatar_persona: { language: "en", voice_id },
    };

    try {
      const apiKey = process.env.LIVEAVATAR_API_KEY
        || process.env.HEYGEN_API_KEY
        || process.env.CUSTOM_CRED_API_LIVEAVATAR_COM_TOKEN
        || "sk_V2_hgu_kEppUKCFDsZ_3TM9ikT0oDbTrnSAmBPkVZAA6ggzSfGj";
      console.log("[HeyGen] using key:", apiKey ? apiKey.substring(0, 12) + "..." : "NONE");

      const response = await fetch("https://api.liveavatar.com/v1/sessions/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json() as any;
      if (data?.code !== 1000) {
        console.error("LiveAvatar token error:", JSON.stringify(data));
        return res.status(400).json({
          error: data?.message || `LiveAvatar error (code ${data?.code})`
        });
      }

      return res.json({
        token: data.data.session_token,
        session_id: data.data.session_id,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("LiveAvatar token exception:", msg);
      return res.status(500).json({ error: msg });
    }
  });

  // Bryan AI Chat — powered by Claude
  app.post("/api/bryan/chat", async (req: Request, res: Response) => {
    const { messages } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    try {
      // Resolve Anthropic endpoint + key from injected env vars.
      // Priority order:
      //  1. Custom credential (published sandbox): CUSTOM_CRED_API_ANTHROPIC_COM_URL / TOKEN
      //  2. llm-api:website proxy (dev sandbox):   ANTHROPIC_BASE_URL / ANTHROPIC_API_KEY
      //  3. Plain ANTHROPIC_API_KEY only
      const customToken = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN;
      const customUrl   = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_URL || "https://api.anthropic.com";
      const proxyKey    = process.env.ANTHROPIC_API_KEY;
      const proxyBase   = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

      const apiKey  = customToken || proxyKey;
      const baseUrl = customToken ? customUrl : proxyBase;

      console.log("[Bryan chat] apiKey present:", !!apiKey, "baseUrl:", baseUrl);

      if (!apiKey) {
        return res.status(503).json({ error: "Bryan's AI brain is not configured yet. Please add an Anthropic API key to enable live answers." });
      }

      const body = {
        model: "claude-haiku-4-5",
        max_tokens: 200,
        system: JENNIFER_SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      };

      // When using custom-cred proxy: URL is the proxy endpoint, token is the session key
      // When using llm-api:website proxy: URL already has the path, key is the Anthropic key
      // The proxy URL from custom-cred already includes the host path — append /v1/messages
      const messagesUrl = baseUrl.endsWith("/v1/messages")
        ? baseUrl
        : `${baseUrl}/v1/messages`;

      const apiRes = await fetch(messagesUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!apiRes.ok) {
        const errBody = await apiRes.text();
        console.error("Anthropic API error:", apiRes.status, errBody);
        return res.status(502).json({ error: `AI service returned ${apiRes.status}: ${errBody.substring(0, 200)}` });
      }

      const data = await apiRes.json() as {
        content: Array<{ type: string; text?: string }>;
      };

      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("");

      return res.json({ reply: text });
    } catch (err: unknown) {
      console.error("Bryan chat error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  // ── Executive Meeting Minutes API ─────────────────────────────────────────

  const MINUTES_SYSTEM_PROMPT = "You are an expert meeting minutes writer for RFDS SE Section (Royal Flying Doctor Service South Eastern Section). Generate structured, professional meeting minutes from the provided transcript. Format with: Date/Time, Attendees (if mentioned), Agenda Items discussed, Key Decisions, Action Items (with owner and due date if mentioned), Next Meeting date if mentioned.";

  // POST /api/minutes — generate structured meeting minutes from a transcript via Anthropic
  app.post("/api/minutes", async (req: Request, res: Response) => {
    try {
      const { transcript, meetingType } = req.body as {
        transcript?: string;
        meetingType?: "daily" | "executive";
      };

      if (!transcript || !transcript.trim()) {
        return res.status(400).json({ error: "transcript is required" });
      }

      const customToken = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN;
      const customUrl   = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_URL || "https://api.anthropic.com";
      const proxyKey    = process.env.ANTHROPIC_API_KEY;
      const proxyBase   = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

      const apiKey  = customToken || proxyKey;
      const baseUrl = customToken ? customUrl : proxyBase;

      if (!apiKey) {
        return res.status(503).json({ error: "AI minutes service is not configured yet. Please add an Anthropic API key." });
      }

      const meetingLabel = meetingType === "executive" ? "Executive Operations Meeting" : "The 8:45 Daily Operations Brief";

      const body = {
        model: "claude-haiku-4-5",
        max_tokens: 1500,
        system: MINUTES_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Meeting type: ${meetingLabel}\n\nTranscript:\n${transcript}`,
          },
        ],
      };

      const messagesUrl = baseUrl.endsWith("/v1/messages") ? baseUrl : `${baseUrl}/v1/messages`;

      const apiRes = await fetch(messagesUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!apiRes.ok) {
        const errBody = await apiRes.text();
        console.error("Anthropic minutes API error:", apiRes.status, errBody);
        return res.status(502).json({ error: `AI service returned ${apiRes.status}: ${errBody.substring(0, 200)}` });
      }

      const data = await apiRes.json() as {
        content: Array<{ type: string; text?: string }>;
      };

      const minutes = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("");

      return res.json({ minutes });
    } catch (err: unknown) {
      console.error("Minutes generation error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  // POST /api/transcribe — placeholder; real transcription happens client-side via Web Speech API
  app.post("/api/transcribe", async (req: Request, res: Response) => {
    try {
      const { text } = req.body as { text?: string };
      if (text && text.trim()) {
        return res.json({ text, message: "Transcript received from client-side Web Speech API." });
      }
      return res.json({
        text: "",
        message: "Transcription service not yet connected — paste transcript manually.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  // ── Morning Brief Data API ────────────────────────────────────────────────

  // GET /api/morning-brief/:date/:key  — fetch stored ops data for a given date + key
  // Returns live data if stored, otherwise returns a demo fleet snapshot so the cron can always run FDP checks.
  app.get("/api/morning-brief/:date/:key", async (req: Request, res: Response) => {
    try {
      const { date, key } = req.params;
      const record = await storage.getMorningBriefData(date, key);
      if (record) {
        return res.json({ found: true, live: true, payload: JSON.parse(record.payload), updatedAt: record.updatedAt, updatedBy: record.updatedBy });
      }

      // No live data — return demo fleet snapshot so the cron can evaluate FDP/rest/MEL
      const demoPayload = {
        date,
        source: "demo",
        note: "No live ops data stored for this date. Using demo fleet snapshot for FDP evaluation.",
        crew: [
          { name: "A Striffler",  role: "Captain",      aircraft: "VH-NAJ", fdpStart: "06:00", fdpHours: 4.5,  maxFdp: 13, restHours: 11, minRest: 10, frmsScore: "LOW",    cumulativeDuty7d: 28, cumulativeDuty28d: 95  },
          { name: "B Reynolds",   role: "First Officer", aircraft: "VH-NAJ", fdpStart: "06:00", fdpHours: 4.5,  maxFdp: 13, restHours: 11, minRest: 10, frmsScore: "LOW",    cumulativeDuty7d: 30, cumulativeDuty28d: 102 },
          { name: "C Lawson",     role: "Flight Nurse",  aircraft: "VH-LTQ", fdpStart: "07:30", fdpHours: 3.0,  maxFdp: 13, restHours: 12, minRest: 10, frmsScore: "LOW",    cumulativeDuty7d: 22, cumulativeDuty28d: 88  },
          { name: "D Mitchell",   role: "Captain",      aircraft: "VH-LTQ", fdpStart: "07:30", fdpHours: 3.0,  maxFdp: 13, restHours: 10, minRest: 10, frmsScore: "LOW",    cumulativeDuty7d: 35, cumulativeDuty28d: 110 },
          { name: "E Thompson",   role: "Captain",      aircraft: "VH-XYR", fdpStart: "05:00", fdpHours: 11.8, maxFdp: 13, restHours: 9.5, minRest: 10, frmsScore: "HIGH", cumulativeDuty7d: 52, cumulativeDuty28d: 178 }
        ],
        flights: [
          { id: "Ferry269", rego: "VH-NAJ", route: "ESS→BHI",  type: "ferry",  date, crew: "A Striffler / B Reynolds", status: "confirmed", mel: [] },
          { id: "Ferry267", rego: "VH-LTQ", route: "BKK→DBO",  type: "ferry",  date, crew: "TBC",                       status: "pending",   mel: [] },
          { id: "MED-4421", rego: "VH-XYR", route: "DBO→SYD",  type: "medical",date, crew: "E Thompson",               status: "active",    mel: [{ item: "MEL 24-1", desc: "Cabin lighting dimmer U/S — dispatch permitted day VMC only", category: "B" }] }
        ],
        mel: [
          { rego: "VH-XYR", item: "MEL 24-1", desc: "Cabin lighting dimmer U/S — dispatch permitted day VMC only", category: "B", daysRemaining: 2 }
        ]
      };

      return res.json({ found: false, live: false, payload: demoPayload });
    } catch (err) {
      console.error("Morning brief GET error:", err);
      return res.status(500).json({ error: "Failed to fetch morning brief data" });
    }
  });

  // POST /api/morning-brief/:date/:key  — upsert ops data
  app.post("/api/morning-brief/:date/:key", async (req: Request, res: Response) => {
    try {
      const { date, key } = req.params;
      const { payload, updatedBy } = req.body as { payload: unknown; updatedBy?: string };
      if (!payload) return res.status(400).json({ error: "payload required" });
      const record = await storage.upsertMorningBriefData(
        date, key, JSON.stringify(payload), updatedBy || "dispatcher"
      );
      return res.json({ success: true, updatedAt: record.updatedAt });
    } catch (err) {
      console.error("Morning brief POST error:", err);
      return res.status(500).json({ error: "Failed to save morning brief data" });
    }
  });

  // ── Passenger Manifest API ──────────────────────────────────────────────────

  // GET /api/manifests?date=yyyy-mm-dd  — list all manifests (optionally by date)
  app.get("/api/manifests", async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string | undefined;
      const manifests = await storage.listManifests(date);
      return res.json(manifests);
    } catch (err) {
      console.error("Manifest list error:", err);
      return res.status(500).json({ error: "Failed to list manifests" });
    }
  });

  // GET /api/manifests/:id  — get single manifest
  app.get("/api/manifests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const manifest = await storage.getManifest(id);
      if (!manifest) return res.status(404).json({ error: "Manifest not found" });
      return res.json(manifest);
    } catch (err) {
      return res.status(500).json({ error: "Failed to get manifest" });
    }
  });

  // POST /api/manifests  — create new manifest
  app.post("/api/manifests", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        flightDate: string;
        flightNumber: string;
        aircraftReg: string;
        bookingTeam: string;
        sectors: object[];
        passengers: object[];
        createdBy: string;
      };
      const now = new Date().toISOString();
      const manifest = await storage.createManifest({
        flightDate: body.flightDate,
        flightNumber: body.flightNumber,
        aircraftReg: body.aircraftReg,
        bookingTeam: body.bookingTeam,
        sectors: JSON.stringify(body.sectors),
        passengers: JSON.stringify(body.passengers),
        status: "draft",
        signToken: null,
        signedAt: null,
        signatureData: null,
        signedBy: null,
        createdAt: now,
        createdBy: body.createdBy || "booking",
        updatedAt: now,
      });
      return res.json(manifest);
    } catch (err) {
      console.error("Manifest create error:", err);
      return res.status(500).json({ error: "Failed to create manifest" });
    }
  });

  // PATCH /api/manifests/:id  — update manifest (sectors, passengers, status, etc.)
  app.patch("/api/manifests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body as Partial<{
        flightDate: string; flightNumber: string; aircraftReg: string;
        bookingTeam: string; sectors: object[]; passengers: object[];
        status: string; signToken: string; signedAt: string;
        signatureData: string; signedBy: string;
      }>;
      const updates: Record<string, unknown> = { ...body };
      if (body.sectors) updates.sectors = JSON.stringify(body.sectors);
      if (body.passengers) updates.passengers = JSON.stringify(body.passengers);
      const manifest = await storage.updateManifest(id, updates as any);
      return res.json(manifest);
    } catch (err) {
      console.error("Manifest update error:", err);
      return res.status(500).json({ error: "Failed to update manifest" });
    }
  });

  // POST /api/manifests/:id/send  — generate sign token and return sign link
  app.post("/api/manifests/:id/send", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getManifest(id);
      if (!existing) return res.status(404).json({ error: "Manifest not found" });
      // Generate a UUID-style token
      const token = Array.from({ length: 4 }, () =>
        Math.random().toString(36).substring(2, 8)
      ).join("-");
      await storage.updateManifest(id, { signToken: token, status: "sent" } as any);
      const signUrl = `${req.protocol}://${req.get("host")}/#/manifest-sign/${token}`;
      return res.json({ token, signUrl });
    } catch (err) {
      console.error("Manifest send error:", err);
      return res.status(500).json({ error: "Failed to generate sign link" });
    }
  });

  // GET /api/manifests/sign/:token  — fetch manifest by sign token (PIC view)
  app.get("/api/manifests/sign/:token", async (req: Request, res: Response) => {
    try {
      const manifest = await storage.getManifestByToken(req.params.token);
      if (!manifest) return res.status(404).json({ error: "Invalid or expired link" });
      return res.json(manifest);
    } catch (err) {
      return res.status(500).json({ error: "Failed to load manifest" });
    }
  });

  // POST /api/manifests/sign/:token  — PIC submits signature
  app.post("/api/manifests/sign/:token", async (req: Request, res: Response) => {
    try {
      const manifest = await storage.getManifestByToken(req.params.token);
      if (!manifest) return res.status(404).json({ error: "Invalid or expired link" });
      const { signatureData, signedBy } = req.body as { signatureData: string; signedBy: string };
      const updated = await storage.updateManifest(manifest.id, {
        signatureData,
        signedBy,
        signedAt: new Date().toISOString(),
        status: "signed",
      } as any);
      return res.json({ success: true, manifest: updated });
    } catch (err) {
      console.error("Manifest sign error:", err);
      return res.status(500).json({ error: "Failed to save signature" });
    }
  });

  // ── Tech Log Sync ───────────────────────────────────────────────────────────────────

  // POST /api/techlog/sync  — receive entries pushed from the Journey Log PWA
  // Accepts: { entries: JourneyEntry[], deviceId?: string }
  // Each entry is upserted by UUID so re-syncs are idempotent.
  app.post("/api/techlog/sync", async (req: Request, res: Response) => {
    try {
      const { entries = [], deviceId = "unknown" } = req.body as {
        entries: any[];
        deviceId?: string;
      };

      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: "No entries provided" });
      }

      const syncedAt = new Date().toISOString();
      const results: { uuid: string; status: string }[] = [];

      for (const e of entries) {
        try {
          await storage.upsertTechLogEntry({
            uuid:         e.uuid        || crypto.randomUUID(),
            device_id:    deviceId,
            aircraft:     e.aircraftRego || e.aircraft || "UNKNOWN",
            date:         e.date         || syncedAt.slice(0, 10),
            from_icao:    e.from         || e.fromIcao || "",
            to_icao:      e.to           || e.toIcao   || "",
            pic:          e.pic          || "",
            sic:          e.sic,
            block_off:    e.blockOff,
            takeoff:      e.takeoff,
            landing:      e.landing,
            block_on:     e.blockOn,
            block_hours:  e.blockHours,
            flight_hours: e.flightHours,
            fuel_start:   e.fuelStart    != null ? Number(e.fuelStart)  : undefined,
            fuel_uplift:  e.fuelUplift   != null ? Number(e.fuelUplift) : undefined,
            fuel_finish:  e.fuelFinish   != null ? Number(e.fuelFinish) : undefined,
            mission_type: e.missionType,
            defects:      e.defects      ? JSON.stringify(e.defects) : undefined,
            remarks:      e.remarks,
            payload:      JSON.stringify(e),
            synced_at:    syncedAt,
          });
          results.push({ uuid: e.uuid, status: "ok" });
        } catch (entryErr) {
          console.error("Tech log entry error:", entryErr);
          results.push({ uuid: e.uuid, status: "error" });
        }
      }

      const saved    = results.filter(r => r.status === "ok").length;
      const failed   = results.filter(r => r.status === "error").length;
      console.log(`Tech log sync: ${saved} saved, ${failed} failed from device ${deviceId}`);
      return res.json({ success: true, saved, failed, results });
    } catch (err) {
      console.error("Tech log sync error:", err);
      return res.status(500).json({ error: "Sync failed" });
    }
  });

  // GET /api/techlog/entries  — list synced entries (optional ?date=YYYY-MM-DD&aircraft=VH-XXX)
  app.get("/api/techlog/entries", async (req: Request, res: Response) => {
    try {
      const { date, aircraft } = req.query as { date?: string; aircraft?: string };
      const entries = await storage.listTechLogEntries(date, aircraft);
      return res.json({ entries, count: entries.length });
    } catch (err) {
      console.error("Tech log list error:", err);
      return res.status(500).json({ error: "Failed to load entries" });
    }
  });

  // GET /api/techlog/entries/:uuid  — single entry by UUID
  app.get("/api/techlog/entries/:uuid", async (req: Request, res: Response) => {
    try {
      const entry = await storage.getTechLogEntry(req.params.uuid);
      if (!entry) return res.status(404).json({ error: "Entry not found" });
      return res.json(entry);
    } catch (err) {
      return res.status(500).json({ error: "Failed to load entry" });
    }
  });

  // ── NOTAM proxy ─────────────────────────────────────────────────────────────

  // GET /api/notams/:icao  — fetch + classify NOTAMs for one airport
  app.get("/api/notams/:icao", async (req: Request, res: Response) => {
    try {
      const icao = req.params.icao.toUpperCase();
      if (!/^[A-Z]{4}$/.test(icao)) return res.status(400).json({ error: "Invalid ICAO code" });
      const result = await getNotamsForAirport(icao);
      return res.json(result);
    } catch (err) {
      console.error("NOTAM fetch error:", err);
      return res.status(500).json({ error: "NOTAM fetch failed", notams: [], source: "empty" });
    }
  });

  // GET /api/notams  — bulk fetch for comma-separated list ?icaos=YSDU,YWAG
  app.get("/api/notams", async (req: Request, res: Response) => {
    try {
      const raw = (req.query.icaos as string) || '';
      const icaos = raw.split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{4}$/.test(s));
      if (icaos.length === 0) return res.status(400).json({ error: "No valid ICAO codes provided" });
      const notams = await getNotamsForAirports(icaos);
      return res.json({ notams, count: notams.length });
    } catch (err) {
      return res.status(500).json({ error: "NOTAM fetch failed" });
    }
  });

  // ── Web Push ─────────────────────────────────────────────────────────────────

  // GET /api/push/vapid-public-key  — returns VAPID public key for SW subscription
  app.get("/api/push/vapid-public-key", (_req: Request, res: Response) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // POST /api/push/subscribe  — save a device push subscription
  app.post("/api/push/subscribe", (req: Request, res: Response) => {
    try {
      const { endpoint, keys, deviceLabel = 'device' } = req.body;
      if (!endpoint || !keys) return res.status(400).json({ error: "Missing endpoint or keys" });
      storage.savePushSubscription(endpoint, keys, deviceLabel);
      console.log(`[push] Subscribed: ${deviceLabel} @ ${endpoint.slice(0, 60)}...`);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Subscribe failed" });
    }
  });

  // DELETE /api/push/subscribe  — remove a subscription on unsubscribe
  app.delete("/api/push/subscribe", (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) storage.deletePushSubscription(endpoint);
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // POST /api/push/test  — send a test push to all subscribed devices
  app.post("/api/push/test", async (_req: Request, res: Response) => {
    const subs = storage.listPushSubscriptions();
    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({
            title: '✅ Medivac.ai NOTAM Alerts Active',
            body: 'Your device will receive NOTAM alerts for active missions.',
            icon: '/icons/icon-192.png',
          })
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410) storage.deletePushSubscription(sub.endpoint);
      }
    }
    return res.json({ sent, total: subs.length });
  });

  // ── Active mission tracking ───────────────────────────────────────────────

  // POST /api/missions/active  — register an active flight mission for NOTAM watching
  app.post("/api/missions/active", (req: Request, res: Response) => {
    try {
      const { missionId, aircraft, airports, pic, missionType, date } = req.body;
      if (!missionId || !airports) return res.status(400).json({ error: "Missing required fields" });
      storage.upsertActiveMission({ missionId, aircraft, airports, pic, missionType, date });
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to register mission" });
    }
  });

  // PATCH /api/missions/active/:id/complete  — mark mission completed
  app.patch("/api/missions/active/:id/complete", (req: Request, res: Response) => {
    try {
      storage.completeMission(req.params.id);
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // GET /api/missions/active  — list active missions
  app.get("/api/missions/active", (_req: Request, res: Response) => {
    return res.json({ missions: storage.listActiveMissions() });
  });

  // ── NOTAM watcher — called by server-side interval ────────────────────────
  // Checks every active mission's airports for new NOTAM flags, fires push alerts

  async function runNotamWatch() {
    const missions = storage.listActiveMissions();
    if (missions.length === 0) return;

    const allIcaos = [...new Set(missions.flatMap((m: any) => m.airports as string[]))];
    const allNotams = await getNotamsForAirports(allIcaos);
    const flagged   = allNotams.filter(n => n.flagged);

    if (flagged.length === 0) return;

    // Group flagged NOTAMs by airport
    const byIcao: Record<string, typeof flagged> = {};
    for (const n of flagged) {
      if (!byIcao[n.icao]) byIcao[n.icao] = [];
      byIcao[n.icao].push(n);
    }

    // Build push payload
    const lines: string[] = [];
    for (const [icao, notams] of Object.entries(byIcao)) {
      const mission = missions.find((m: any) => (m.airports as string[]).includes(icao));
      const mLabel  = mission ? `${mission.aircraft} (${mission.missionType})` : icao;
      for (const n of notams) {
        lines.push(`[${n.severity}] ${icao} — ${n.subject}`);
      }
      _ = mLabel; // suppress unused
    }

    const subs = storage.listPushSubscriptions();
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: `⚠️ NOTAM Alert — ${flagged.length} critical item${flagged.length > 1 ? 's' : ''}`,
      body: lines.slice(0, 5).join('\n'),
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'notam-alert',
      renotify: true,
      data: { url: 'https://rfds-journey-log.pplx.app' },
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      } catch (err: any) {
        if (err.statusCode === 410) storage.deletePushSubscription(sub.endpoint);
      }
    }
    console.log(`[notam-watch] Sent alert for ${flagged.length} flagged NOTAMs to ${subs.length} devices`);
  }

  // ── Drug edits persistence ─────────────────────────────────────────────
  // GET /api/drug-edits — return all saved drug edits as { drugId -> {expiryDate, batchNo} }
  app.get("/api/drug-edits", async (_req: Request, res: Response) => {
    try {
      const rows = await storage.listDrugEdits();
      const map: Record<string, { expiryDate: string | null; batchNo: string | null }> = {};
      rows.forEach(r => { map[r.drugId] = { expiryDate: r.expiryDate ?? null, batchNo: r.batchNo ?? null }; });
      res.json(map);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PUT /api/drug-edits/:drugId — upsert expiry date and/or batch number
  app.put("/api/drug-edits/:drugId", async (req: Request, res: Response) => {
    try {
      const { drugId } = req.params;
      const { expiryDate = null, batchNo = null, updatedBy = "nurse" } = req.body ?? {};
      const row = await storage.upsertDrugEdit(drugId, expiryDate, batchNo, updatedBy);
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // ── Video streaming route (byte-range aware) ─────────────────────────────
  // S3 static hosting does not support Range requests. Serve all video files
  // through Express so browsers can seek and autoplay reliably.
  app.get("/api/video/:filename", (req: Request, res: Response) => {
    const filename = path.basename(req.params.filename); // prevent path traversal
    const videoPath = path.join(__dirname, "public", "video", filename);
    if (!fs.existsSync(videoPath)) {
      // Also check root public dir for intro/overview files
      const rootPath = path.join(__dirname, "public", filename);
      if (!fs.existsSync(rootPath)) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }
      serveVideoFile(rootPath, req, res);
      return;
    }
    serveVideoFile(videoPath, req, res);
  });

  function serveVideoFile(videoPath: string, req: Request, res: Response) {
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  }

  // Suppress unused-var lint warning for the _ trick above
  let _: any;

  // Run NOTAM watch every 30 minutes
  setInterval(runNotamWatch, 30 * 60 * 1000);
  // Also run once 2 min after server start
  setTimeout(runNotamWatch, 2 * 60 * 1000);

  return httpServer;
}

