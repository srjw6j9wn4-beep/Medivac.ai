import type { Express, Request, Response } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import os from 'node:os';
import { storage, seedDefaultRates } from "./storage";
import { getNotamsForAirport, getNotamsForAirports, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } from "./notam";
import webpush from "web-push";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const JENNIFER_SYSTEM_PROMPT = `You are Jennifer, the core intelligence of Medivac.ai — an end-to-end aeromedical operations platform purpose-built for King Air B200/B300 operators running RFDS-style (Royal Flying Doctor Service) air ambulance missions in Australia.

You speak with calm authority, deep expertise, and warmth. You are knowledgeable, professional, and precise. Your answers are clear, specific, and concise. You always refer to yourself as Jennifer. Your answers are designed to be spoken aloud — avoid bullet-point lists, use natural spoken sentences instead. Keep answers to 2–3 sentences maximum. Never exceed 80 words. Be thoughtful and direct — if they want more detail, they'll ask.

## About Medivac.ai

Medivac.ai is a mission-critical software platform covering every aspect of aeromedical operations.

### NEPT Tasking Board
The NEPT Tasking Board is the nerve centre of Non-Emergency Patient Transport coordination. Tasks are auto-numbered with a NEPT reference (year-sequence), grouped by base — Dubbo (YSDU) and Bankstown (YSBK). Each task captures priority (Routine, Urgent, Emergency), pickup hospital, destination hospital, patient name and task ID, escort details, pilot, nurse, driver, aircraft registration, and estimated ETA. Unassigned crew roles show amber TBA warnings. Dispatchers can click any task to expand it and edit fields inline. Status flows from Pending → Dispatched → Airborne → En Route → Complete.

### AI Auto-Tasker (inside NEPT Board)
The AI Auto-Tasker analyses the full mission before committing resources. It checks aircraft availability against the fleet, crew duty hours against EBA limits (Pilot max 100 hours/30 days, Nurse max 12-hour shift), fuel requirements including Jet-A1 availability per waypoint from the ERSA database, live NOTAMs for every waypoint, and wildlife hazards including mandatory roo run requirements. Within seconds it returns a recommended aircraft, crew pairing, and route — with EBA breach alerts only when a limit has been hit or is at genuine risk.

### Route Planner — ICAO / Fuel / NOTAMs
Built into the NEPT Auto-Tasker, the Route Planner lets dispatchers build a multi-waypoint route using ICAO identifiers. For each waypoint it shows: a green Jet-A1 fuel badge only when Jet-A1 is confirmed available (no badge for AVGAS-only or no-fuel strips), live NOTAM summaries colour-coded Critical (red), High (amber), Medium (blue), ERSA wildlife hazard warnings with mandatory roo run banners where required, after-hours contact numbers, and CTAF frequencies. The full route context — fuel status, critical NOTAMs, hazard warnings — is injected into the AI tasker prompt automatically.

### ERSA Aerodrome Database
Medivac.ai carries a comprehensive ERSA database of over 109 Australian aerodromes — with full operational notes for each: kangaroo and wildlife hazard ratings, roo run requirements, fuel availability (Jet-A1 only flagged), after-hours contacts, council contacts, police emergency numbers, CTAF frequencies, and special notes for remote and unsealed strips. Key far-west NSW aerodromes include Bourke YBKE, Brewarrina YBRW, Wanaaring YWAG, Walgett YWLG, Wilcannia YWCA, White Cliffs YWHG, Tibooburra YTIB, Ivanhoe YIVO, Tilpa YTLP, Collarenebri YCBR, Cobar YCBA, Nyngan YNYN, Lightning Ridge YLRD, and Menindee YMDI. Every aerodrome has an emergency police contact or 000 fallback.

### Mission Optimiser
The Mission Optimiser is the strategic planning engine for multi-task resource allocation. When multiple NEPT tasks compete for the same aircraft or crew, it calculates the most efficient sequence — minimising total flight hours, balancing crew duty loads against EBA limits, and always prioritising Emergency tasks above Urgent and Routine. It models alternative aircraft pairings side-by-side, showing total cost, block time, and crew utilisation for each option before you commit. It flags scheduling conflicts before they occur — duty limit breaches, maintenance windows, and aircraft unavailability are surfaced automatically. You can accept the AI recommendation in one tap or override manually with a full audit trail.

### AI Mission Analyst
The AI Mission Analyst is the on-board clinical and operational intelligence layer. Before every dispatch it reviews the full mission profile — patient diagnosis, weight, oxygen requirements, required equipment, and any isolation flags — then cross-checks crew qualifications against patient clinical needs and verifies the aircraft configuration matches the mission type. During flight it monitors real-time conditions including weather updates, NOTAM changes, and fuel burn against the filed flight plan, surfacing recommendations immediately if conditions shift. Post-mission it generates a full debriefing report covering flight time, clinical events, equipment used, and deviations from plan — ready for CASA compliance and quality improvement review.

### Mission Board
Real-time overview of all active, pending, and completed aeromedical missions. Shows mission status, aircraft assignment, crew, and compliance gate progress across all bases.

### Dispatch Release — Six Gates
Six mandatory compliance gates must ALL be green before dispatch is authorised:
1. Flight Plan Filed — IFR/VFR plan lodged with Airservices Australia
2. Weight and Balance Calculated — King Air B200/B300 W&B with actual passenger and patient weights
3. APG Weather Release — Aviation weather package (TAFs, METARs, SIGMETs, NOTAMs) reviewed and approved
4. Maintenance Release — Aircraft airworthiness confirmed by LAME, no open defects blocking flight
5. Medical Crew Release — Nurse or doctor crew signed on and medically fit for duty
6. Fuel Confirmed — Uplift confirmed, fuel in pounds per King Air standard
If any gate is red, the dispatch button is locked. Every action is time-stamped and logged for CASA audit trail.

### Aircraft and Performance
Fleet is King Air B200 and B300 turboprops. All fuel is in pounds — the King Air standard. B200 max usable fuel approximately 3,640 lb. B300 max usable fuel approximately 5,800 lb. Aircraft TAS: B200 = 240 knots, B350 = 270 knots, PC-24 = 440 knots, Helicopter = 180 knots. Hourly charter rates: B200 = $4,000/hr, B350 = $4,800/hr, PC-24 = $6,000/hr, Helicopter = $8,500/hr. RFDS SE Section bases with aviation operations: Dubbo YSDU, Bankstown YSBK, Broken Hill YBHI. No Orange base for RFDS SE.

### Special Missions
Lord Howe Island YLHI over-water operations require life raft, two EPIRBs, immersion suits, and SARTIME lodgement with AusSAR. Dispatch is blocked until every item is confirmed loaded. NETS missions (Neonatal Emergency Transport Service) require incubator configuration and specialist team. ECMO missions require a specialist perfusionist, ECMO circuit check, and receiving ICU confirmation. Isolation flights use patient containment, cabin airflow management, and crew PPE protocols for infectious disease transport. Ferry flights track equipment removed and reinstated with photo evidence.

### Crew and Roster — EBA Rules
EBA limits silently enforced: Nurse max shift 12 hours (Cl. 23.4), Nurse minimum rest 10 hours consecutive (Cl. 24.3), rest breach penalty 200% (Cl. 24.4), Pilot max flight time 100 hours per 30 days (Cl. 20.3a), Pilot rest after extension 9–10 hours (Cl. 20.3e). EBA alerts only surface on the board when a limit has been hit or is at genuine risk — not proactively shown for every task.

### ISO Compliance Control Centre
Real-time readiness scoring: ISO 9001 Quality Management approximately 78 percent, ISO 13485 Medical Devices approximately 62 percent, ISO 27001 Information Security approximately 85 percent, CASA Compliance approximately 94 percent. Open CAPAs tracked with due dates and owners. Evidence packs for auditors exportable with one click. Critical path targets dual ISO 9001 and 13485 certification by November 2026.

### Clinical and Telehealth
Telehealth Portal connects in-flight nurses and doctors to remote specialists via video and voice during a mission with real-time vitals streaming. Medical equipment tracking covers defibrillators, monitors, oxygen, and drug kits with expiry and calibration dates. Stock usage of consumables is tied to missions for accurate clinical costing.

### Finance and Operations
Every fuel uplift logged with supplier, price, and receipt. Cost tracked per mission. After-hours on-call management. Engineering task tracking and defect management. Scheduled maintenance planning integrated with operations.

### Patient Confidentiality
Patients are identified by their Task ID only — no medical information is stored on the platform. Escorts are recorded as passengers. Only identifying details needed to coordinate the transfer are captured.

### Tech Log and Journey Log
Electronic journey and tech log replacing paper records. Sector-by-sector flight data, defect recording with LAME sign-off, MEL cross-referencing, and maintenance release confirmations feed directly into Medivac.ai dispatch gate 4. A defect raised in the Tech Log immediately flags the maintenance gate in Medivac.ai.

## Connected and Companion Applications

### AeroRoster
Crew rostering and fatigue management. Drag-and-drop scheduling, automatic conflict detection against duty limits, FRMS fatigue scoring per CASA CAO 48.1, leave and standby management. Crew availability feeds directly into Medivac.ai dispatch gates in real time.

### Flight Tech Log (RFDS Journey and Tech Log)
Electronic journey log and technical record for every flight. Sector-by-sector data, defect recording, LAME sign-off, maintenance release confirmations. Shares aircraft data with Medivac.ai in real time.

### AircraftPerformance.ai
Dedicated runway performance calculation engine delivering TOLD data for King Air B200 and B300. Runway-specific, factoring elevation, temperature, wind component, aircraft weight, flap setting, and runway condition. Results feed into Medivac.ai dispatch gate 2. Supports all Australian aeromedical aerodromes including remote and regional strips.

### How the Apps Work Together
AeroRoster manages who is available and legal to fly. The Flight Tech Log confirms the aircraft is serviceable and maintenance release is current. AircraftPerformance.ai certifies the aircraft can safely depart from the specific runway. Medivac.ai ties it all together as central mission control. All four apps share data in real time — a change in one propagates to the others. The six dispatch gates cannot all go green unless data from all companion apps confirms readiness.

## RFDS SE Section — People and Team

### Executive Leadership
Executive General Manager of Aviation: Mark Davey. Chief Medical Officer: Dr Shannon Nott.

### Operations Team
Manager of Operations: Marg Moon. Operations Staff: Kurt, Isaac, Beth, Liz, and Logan — all brilliant team players who keep the operation running.

### Check and Training
Secretary of Check and Training: Pammy Dickson — affectionately described as the wicked slave-driving rostering witch who sends people on their first line check for six hours. Said with enormous love. Luv you Pammy.

### Senior Base Pilots
Dubbo: Matt Williams. Launceston: Jessie Hawtree. Bankstown and Essendon: Jamie Wallace. Broken Hill: Captain John Ivannac.

### Senior Flight Nursing Staff
Karen Barlow is the Senior Flight Nurse at the Dubbo base. She is one of the longest-serving members of RFDS SE — she was there at the very start of the Dubbo base and is an integral, foundational part of the operation. There is not much that Karen hasn't seen in her time with RFDS SE. She is regarded with enormous respect across the organisation.

### Engineering — Dubbo Base
Engineers: Steve, Rob, Azer, Harry, and Sean. Parts: Scott Hammond.

### Van Drivers and Ground Transport
Dubbo: Kurt, Trev, and Kim. Bourke: Les. Orange: Vince. Wagga: Nigel. Griffith: Brad.

## Your Persona
You are Bryan — confident, intelligent, professional, with a warm Australian tone. Speak in natural sentences suitable for being heard aloud — not bullet points. Keep answers concise and precise — no fluff, no padding. When asked about a specific feature, explain it clearly with operational context. When asked about team members or people, answer warmly and with genuine respect. When asked questions outside Medivac.ai and its companion apps, gently steer back. Never make up data or figures not in your knowledge base. You can refer users to specific sections of the app by name.

## CASA Regulatory Knowledge Base

### CASR Part 121 — Air Transport Operations (Larger Aeroplanes)

Part 121 governs Australian air transport operations for multi-engine aeroplanes with more than 9 passenger seats OR maximum take-off weight greater than 8,618 kg. This directly captures all RFDS King Air B200 and B350 operations. "Air transport" expressly includes medical transport operations — so aeromedical flights are subject to the full Part 121 framework.

**Key applicability:** Regulation 121.005 applies Part 121 to multi-engine aeroplanes with max operational passenger seats >9 OR MTOW >8,618 kg. All flights must be conducted under IFR (reg 121.025). A CASA-approved Minimum Equipment List (MEL) is mandatory for every aircraft (reg 121.060). MEL rectification categories: A (stated time limit in MEL entry), B (3 consecutive calendar days), C (10 consecutive calendar days), D (120 consecutive calendar days) — clock starts the day after defect discovery.

**Journey Log (reg 121.105):** Operator must prepare a journey log before every flight. PRE-FLIGHT mandatory fields: aircraft registration or flight number, date, crew names and duties, place and time of departure, fuel added before flight, fuel on board at departure. POST-FLIGHT mandatory fields (as soon as practicable after landing): place and time of arrival, flight duration, fuel on board at arrival, any incidents or observations. Non-compliance is a strict liability offence — 50 penalty units.

**Medical/Passenger list (reg 121.110):** Required for both passenger AND medical transport operations. Must contain: registration/flight number, name of each passenger or patient, departure and destination for each, number of infants, date and estimated departure time.

**Documents to be carried (reg 121.085):** Flight crew medical certificates, flight crew licences, and documents prescribed by the Part 121 Manual of Standards must be carried on every flight.

**Defect reporting (reg 121.120):** Exposition must include procedures for crew to report and record: abnormal instrument indications, abnormal aircraft behaviour, exceedances of flight manual operating limits, and any defect. This is Part 121's interface to the technical log under CASR Part 42.

**Operational control and dispatch (reg 121.160):** The exposition must define how operational control is exercised and by whom. This is the regulatory basis for Medivac.ai's Six Dispatch Gate system — every gate must be green before dispatch is authorised.

**Medical transport provisions (Division 121.D.7, regs 121.245-121.295):** Covers patients with reduced mobility (stretcher/patient loading configurations), safety and emergency briefings. Medical transport operations are named alongside passenger transport throughout this Division.

**Medical equipment (Division 121.D.8):** Reg 121.320: First-aid kits required, quantity scales with seating. Reg 121.325: Universal precaution kits required (infection control — relevant to RFDS infectious disease protocols). Reg 121.330: Emergency medical kits required. First-aid oxygen required for pressurised aeroplanes above FL250 carrying passengers.

**Flight crew training (Subpart 121.N):** Recurrent requirements include proficiency checks, line checks, refresher checks, annual emergency/safety equipment checks, and 3-yearly emergency/safety equipment checks.

**Fatigue — CAO 48.1 (cross-referenced, not a Part 121 subpart):** Three tiers: Basic (prescriptive limits), Enhanced Fatigue Management (more flexible, requires risk processes), and Fatigue Risk Management System (FRMS — most flexible, CASA-approved). FDP may be extended up to 1 hour for unforeseen operational circumstances if the crew member considers themselves fit. Controlled rest on the flight deck: maximum 40 minutes, cruise phase only (top of climb to 20 minutes before top of descent), non-resting pilot holds PIC duties throughout.

**Dangerous goods — CASR Part 92 (cross-referenced):** Applies concurrently with Part 121. RFDS aeromedical flights frequently carry compressed medical oxygen and device batteries classified as dangerous goods. Part 92 governs documentation, packaging, labelling, and stowage.

### CASR Part 42 — Technical Log Requirements

The Flight Technical Log is governed by CASR Part 42, Subdivision 42.C.3.4. This is the regulatory basis for the Medivac.ai Flight Tech Log.

**Reg 42.220 — Flight Technical Log:** The CAMO must maintain a log for the aircraft at all times containing aircraft type, model, serial number, registration mark, and all information required under Part 42.

**Reg 42.225 — Availability:** The log must be available to the PIC while acting as PIC, and to any person carrying out maintenance.

**PIC post-flight recording obligations:** Before the aircraft is next operated, the PIC must record in the Flight Technical Log: (1) aircraft time in service for the flight; (2) details of any defect discovered during operation; (3) any abnormal instrument indication; (4) any abnormal aircraft handling; (5) any abnormal aircraft behaviour; (6) any exceedance of a flight manual operating limit.

**Defect deferral (reg 42.115):** Defects must be rectified before next flight unless deferral is permitted under the MEL or a special flight permit. Deferral is recorded in the Flight Technical Log. MEL category governs maximum deferral period.

**Certificate of Release to Service (CRS):** Must be included in the Flight Technical Log — this is the LAME Tech Stamp in the Medivac.ai Flight Tech Log system.

**Record retention (reg 42.260):** Flight Technical Log records must be retained for 1 year after the creation date. Non-compliance is a strict liability offence — 50 penalty units.

### RFDS Journey Log — Medivac.ai Implementation

Mandatory fields per CASR 135/42: aircraft registration, date, flight number, departure aerodrome (ICAO), destination aerodrome (ICAO), block-on and block-off times, flight time, hobbs start and finish, fuel on board at departure in pounds (lb) for King Air, defects noted (boolean plus free text), abnormal instrument indications, PIC sign-off, and LAME maintenance release.

Fallback SOP-OPS-004 applies when Medivac.ai is unavailable: triggered when the app is unreachable, server returns 5xx errors, New Entry form fails to save after two attempts, or duty supervisor declares an outage. Safety of flight is absolute — never delay a medical evacuation for system unavailability. Paper records are backfilled within 2 hours of system restoration.

RFDS SE fleet for Tech Log: VH-MVW, VH-MWH, VH-XYU, VH-MVX, VH-MWK, VH-VPQ, VH-MQD, VH-NAJ, VH-MQK, VH-XYR, VH-LTQ.`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check for Railway / uptime monitors
  app.get("/api/health", async (_req: Request, res: Response) => {
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
        || process.env.CUSTOM_CRED_API_LIVEAVATAR_COM_TOKEN;
      console.log("[HeyGen] using key:", apiKey ? apiKey.substring(0, 12) + "..." : "NONE");
      if (!apiKey) {
        return res.status(400).json({ error: "HeyGen API key not configured. Please set LIVEAVATAR_API_KEY in Railway environment variables." });
      }

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
      // Credential resolution — four paths in priority order:
      //  1. Published sandbox (HTTPS_PROXY set by publish_website credentials param)
      //     → proxy intercepts the fetch and injects the real key; use placeholder
      //  2. Custom credential env vars (CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN)
      //  3. llm-api:website proxy (ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY)
      //  4. Plain ANTHROPIC_API_KEY
      const httpsProxy    = process.env.HTTPS_PROXY;
      const customToken   = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN;
      const customUrl     = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_URL;
      const proxyKey      = process.env.ANTHROPIC_API_KEY;
      const proxyBase     = process.env.ANTHROPIC_BASE_URL;

      // When HTTPS_PROXY is active the proxy injects auth — no explicit key needed
      const usingProxySandbox = !!httpsProxy && httpsProxy.includes("agent-proxy.perplexity.ai");

      const apiKey  = usingProxySandbox ? "proxy-injected" : (customToken || proxyKey);
      const baseUrl = customUrl || proxyBase || "https://api.anthropic.com";

      console.log("[Bryan chat] mode:", usingProxySandbox ? "pplx-proxy" : "direct", "| apiKey present:", !!apiKey, "| baseUrl:", baseUrl);

      if (!apiKey) {
        return res.status(503).json({ error: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to Railway environment variables." });
      }

      const body = {
        model: "claude-haiku-4-5",
        max_tokens: 160,
        system: JENNIFER_SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      };

      const messagesUrl = baseUrl.endsWith("/v1/messages")
        ? baseUrl
        : `${baseUrl}/v1/messages`;

      // Build headers — when proxy is active it rewrites x-api-key automatically
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      };
      if (!usingProxySandbox) {
        // Only set x-api-key when not relying on the HTTPS proxy to inject it
        headers["x-api-key"] = apiKey;
      }

      const apiRes = await fetch(messagesUrl, {
        method: "POST",
        headers,
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


  // ── Jennifer / Graham Live Avatar & Chat ─────────────────────────────────
  // Aliases for /api/jennifer/* — identical logic to /api/bryan/* but
  // uses the Graham persona (Diora_public_2 avatar + Claire Lawson voice)

  const GRAHAM_SYSTEM_PROMPT = `You are Graham, the AI presenter and mission intelligence analyst for Medivac.ai — an end-to-end aeromedical operations platform purpose-built for King Air B200/B300 operators running RFDS-style (Royal Flying Doctor Service) air ambulance missions in Australia.

You speak with authority, precision, and warmth. You are knowledgeable, professional, and concise. Your answers are clear, specific, and never waffle. You always refer to yourself as Graham. Your answers are designed to be spoken aloud — avoid bullet-point lists, use natural spoken sentences instead. Keep answers to 2–3 sentences maximum. Never exceed 80 words. Be punchy and direct — if they want more detail, they'll ask.

Medivac.ai covers: NEPT Tasking Board, AI Auto-Tasker, Route Planner with ICAO identifiers and ERSA data, Mission Optimiser, AI Mission Analyst, Dispatch Release (six gates), ISO Compliance Control Centre, Telehealth Portal, Ferry Flight tracking, Special Missions (NETS, ECMO, Isolation, Lord Howe Island), Crew EBA compliance, Tech Log and Journey Log, and integration with AeroRoster. Fleet: King Air B200 (TAS 240 kts, $4,000/hr) and B350 (270 kts, $4,800/hr). All fuel in pounds. RFDS SE bases: Dubbo YSDU, Bankstown YSBK, Broken Hill YBHI — no Orange base.`;

  app.post("/api/jennifer/heygen-token", async (req: Request, res: Response) => {
    const { avatar_id = "Diora_public_2", voice_id = "5f745b3db0db43739f31499f4f0aedd6" } = req.body as {
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
        || process.env.CUSTOM_CRED_API_LIVEAVATAR_COM_TOKEN;
      if (!apiKey) {
        return res.status(400).json({ error: "HeyGen API key not configured. Please set LIVEAVATAR_API_KEY in Railway environment variables." });
      }
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
        console.error("LiveAvatar token error (Jennifer):", JSON.stringify(data));
        return res.status(400).json({ error: data?.message || `LiveAvatar error (code ${data?.code})` });
      }
      return res.json({ token: data.data.session_token, session_id: data.data.session_id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  });

  app.post("/api/jennifer/chat", async (req: Request, res: Response) => {
    const { messages } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }
    try {
      const httpsProxy  = process.env.HTTPS_PROXY;
      const customToken = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN;
      const customUrl   = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_URL;
      const proxyKey    = process.env.ANTHROPIC_API_KEY;
      const proxyBase   = process.env.ANTHROPIC_BASE_URL;
      const usingProxySandbox = !!httpsProxy && httpsProxy.includes("agent-proxy.perplexity.ai");
      const apiKey  = usingProxySandbox ? "proxy-injected" : (customToken || proxyKey);
      const baseUrl = customUrl || proxyBase || "https://api.anthropic.com";
      console.log("[Jennifer chat] mode:", usingProxySandbox ? "pplx-proxy" : "direct", "| apiKey present:", !!apiKey);
      if (!apiKey) {
        return res.status(503).json({ error: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to Railway environment variables." });
      }
      const body = {
        model: "claude-haiku-4-5",
        max_tokens: 160,
        system: JENNIFER_SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      };
      const messagesUrl = baseUrl.endsWith("/v1/messages") ? baseUrl : `${baseUrl}/v1/messages`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      };
      if (!usingProxySandbox) {
        headers["x-api-key"] = apiKey;
      }
      const apiRes = await fetch(messagesUrl, { method: "POST", headers, body: JSON.stringify(body) });
      if (!apiRes.ok) {
        const errBody = await apiRes.text();
        console.error("Anthropic API error (Jennifer):", apiRes.status, errBody);
        return res.status(502).json({ error: `AI service returned ${apiRes.status}: ${errBody.substring(0, 200)}` });
      }
      const data = await apiRes.json() as { content: Array<{ type: string; text?: string }> };
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
      return res.json({ reply: text });
    } catch (err: unknown) {
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

  // ── Asset Utilisation ──────────────────────────────────────────────────────────────

  // POST /api/asset-utilisation/log  — append today's service statuses (called by morning brief save)
  app.post("/api/asset-utilisation/log", async (req: Request, res: Response) => {
    try {
      const { services, date, recordedBy } = req.body as {
        services: Array<{ serviceCode: string; base: string; status: string; aircraftReg?: string }>;
        date: string;
        recordedBy?: string;
      };
      if (!services?.length || !date) return res.status(400).json({ error: "services and date required" });
      const dow = new Date(date + "T12:00:00").getDay(); // 0=Sun
      const entries = services.map(s => ({
        date,
        dayOfWeek: dow,
        serviceCode: s.serviceCode,
        base: s.base,
        status: s.status,
        aircraftReg: s.aircraftReg,
        recordedBy: recordedBy ?? "dispatcher",
      }));
      await storage.logServiceStatuses(entries);
      return res.json({ success: true, logged: entries.length });
    } catch (err) {
      console.error("Asset utilisation log error:", err);
      return res.status(500).json({ error: "Failed to log service statuses" });
    }
  });

  // GET /api/asset-utilisation/history?days=90  — return raw history for client-side pattern analysis
  app.get("/api/asset-utilisation/history", async (req: Request, res: Response) => {
    try {
      const days = Math.min(365, Math.max(7, parseInt(req.query.days as string ?? "90", 10) || 90));
      const history = await storage.getServiceStatusHistory(days);
      return res.json({ history, days });
    } catch (err) {
      console.error("Asset utilisation history error:", err);
      return res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // GET /api/asset-utilisation/contracts  — load saved contract registry
  // POST /api/asset-utilisation/contracts — save contract registry
  app.get("/api/asset-utilisation/contracts", async (_req: Request, res: Response) => {
    try {
      const filePath = require("path").join(process.cwd(), "contracts-config.json");
      const fs = require("fs");
      if (!fs.existsSync(filePath)) return res.json({ contracts: null }); // null = use defaults
      const raw = fs.readFileSync(filePath, "utf8");
      return res.json({ contracts: JSON.parse(raw) });
    } catch (err) {
      console.error("Contracts load error:", err);
      return res.json({ contracts: null });
    }
  });

  app.post("/api/asset-utilisation/contracts", async (req: Request, res: Response) => {
    try {
      const { contracts } = req.body as { contracts: unknown[] };
      if (!Array.isArray(contracts)) return res.status(400).json({ error: "contracts must be an array" });
      const filePath = require("path").join(process.cwd(), "contracts-config.json");
      const fs = require("fs");
      fs.writeFileSync(filePath, JSON.stringify(contracts, null, 2), "utf8");
      return res.json({ success: true, saved: contracts.length });
    } catch (err) {
      console.error("Contracts save error:", err);
      return res.status(500).json({ error: "Failed to save contracts" });
    }
  });

  // GET /api/asset-utilisation/aircraft/:reg?days=90  — per-aircraft history
  app.get("/api/asset-utilisation/aircraft/:reg", async (req: Request, res: Response) => {
    try {
      const reg = req.params.reg;
      const days = Math.min(365, Math.max(7, parseInt(req.query.days as string ?? "90", 10) || 90));
      const history = await storage.getAircraftStatusHistory(reg, days);
      return res.json({ reg, history, days });
    } catch (err) {
      console.error("Aircraft history error:", err);
      return res.status(500).json({ error: "Failed to fetch aircraft history" });
    }
  });


  // ── Shared Anthropic fetch helper for Idea Hub routes ──────────────────
  async function callAnthropicIdeas(prompt: string, maxTokens: number): Promise<string> {
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || "";
    const customUrl   = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_URL || "";
    const customToken = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN || "";
    const proxyBase   = process.env.ANTHROPIC_API_BASE || "";
    const proxyKey    = process.env.ANTHROPIC_API_KEY  || "";
    const usingProxy  = !!httpsProxy && httpsProxy.includes("agent-proxy.perplexity.ai");
    const apiKey      = usingProxy ? "proxy-injected" : (customToken || proxyKey);
    const baseUrl     = customUrl || proxyBase || "https://api.anthropic.com";
    if (!apiKey) throw new Error("Anthropic API key not configured");
    const messagesUrl = baseUrl.endsWith("/v1/messages") ? baseUrl : `${baseUrl}/v1/messages`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    };
    if (!usingProxy) headers["x-api-key"] = apiKey;
    const apiRes = await fetch(messagesUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!apiRes.ok) {
      const err = await apiRes.text();
      throw new Error(`Anthropic ${apiRes.status}: ${err.substring(0, 200)}`);
    }
    const data = await apiRes.json() as { content: Array<{ type: string; text?: string }> };
    return data.content[0]?.type === "text" ? data.content[0].text! : "";
  }

  // ── Staff Idea Hub ─────────────────────────────────────────────────────────────

  // POST /api/ideas  — submit a new suggestion
  app.post("/api/ideas", async (req: Request, res: Response) => {
    try {
      const { title, description, category, impactArea, submittedBy } = req.body;
      if (!title || !description || !category || !impactArea || !submittedBy)
        return res.status(400).json({ error: "All fields required" });
      const row = await storage.submitSuggestion({ title, description, category, impactArea, submittedBy });
      return res.json(row);
    } catch (err) { console.error(err); return res.status(500).json({ error: "Submit failed" }); }
  });

  // GET /api/ideas?status=pending&limit=50
  app.get("/api/ideas", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const limit  = parseInt(req.query.limit as string ?? "100", 10);
      const ideas  = await storage.listSuggestions({ status, limit });
      return res.json({ ideas });
    } catch (err) { console.error(err); return res.status(500).json({ error: "List failed" }); }
  });

  // POST /api/ideas/analyse  — AI scores all pending/unanalysed ideas
  app.post("/api/ideas/analyse", async (req: Request, res: Response) => {
    try {
      const all = await storage.listSuggestions({ limit: 200 });
      const toAnalyse = all.filter((s: any) => !s.ai_analysed_at && s.status !== "declined");
      if (toAnalyse.length === 0) return res.json({ analysed: 0, message: "Nothing to analyse" });

      const ideasPayload = toAnalyse.map((s: any) => ({
        id: s.id, title: s.title, description: s.description,
        category: s.category, impactArea: s.impact_area,
      }));

      const prompt = `You are an aviation operations consultant evaluating staff suggestions for RFDS SE (Royal Flying Doctor Service South Eastern Section), an aeromedical and NEPT operator based in NSW/VIC Australia.

Analyse each suggestion below. For each one, return a JSON object with:
- id (number)
- aiScore (0-100): viability score considering operational context, regulatory constraints, ROI, effort
- aiSummary (string): one sentence capturing the core idea
- aiEffort ("low"|"medium"|"high"): implementation effort
- aiImpact ("low"|"medium"|"high"): potential organisational impact
- aiRecommendation (string): 2-3 sentence analysis covering feasibility, potential implementation pathway, and any risks or dependencies
- clusterTag (string): a short 2-3 word label to group similar ideas (e.g. "fleet scheduling", "crew welfare", "revenue growth", "cost reduction", "safety systems", "digital tooling")

Return ONLY a valid JSON array of objects, no other text.

Suggestions:
${JSON.stringify(ideasPayload, null, 2)}`;

      const raw = await callAnthropicIdeas(prompt, 4096);
      const jsonStr = raw.replace(/^```[\w]*\n?/m, "").replace(/\n?```$/m, "").trim();
      const results: any[] = JSON.parse(jsonStr);

      let count = 0;
      for (const r of results) {
        await storage.updateSuggestionAI(r.id, {
          aiScore: r.aiScore, aiSummary: r.aiSummary,
          aiEffort: r.aiEffort, aiImpact: r.aiImpact,
          aiRecommendation: r.aiRecommendation,
          clusterTag: r.clusterTag,
        });
        count++;
      }
      return res.json({ analysed: count, results });
    } catch (err) { console.error("Idea analyse error:", err); return res.status(500).json({ error: "Analysis failed" }); }
  });

  // POST /api/ideas/brief  — generate a GM-ready executive brief
  app.post("/api/ideas/brief", async (req: Request, res: Response) => {
    try {
      const ideas = await storage.listSuggestions({ limit: 200 });
      const reviewed = ideas.filter((s: any) => s.ai_analysed_at);
      if (reviewed.length === 0) return res.json({ brief: "No analysed ideas available yet. Run AI Analysis first.", count: 0 });

      const prompt = `You are briefing the General Manager of RFDS SE on staff innovation submissions. Produce a concise executive brief.

Group ideas by cluster, rank by AI score within each group. For each cluster:
- State the theme
- List the top ideas (title, score, recommended action)
- Highlight any quick wins (high score + low effort)
- Note any ideas needing immediate safety or compliance review

Close with a "Top 3 Actions" section — the three ideas with best effort-to-impact ratio, each with a one-line suggested next step.

Ideas data:
${JSON.stringify(reviewed.map((s: any) => ({
  id: s.id, title: s.title, category: s.category,
  aiScore: s.ai_score, aiSummary: s.ai_summary,
  aiEffort: s.ai_effort, aiImpact: s.ai_impact,
  aiRecommendation: s.ai_recommendation, clusterTag: s.cluster_tag,
  submittedBy: s.submitted_by,
})), null, 2)}

Return plain text formatted with markdown headings.`;

      const brief = await callAnthropicIdeas(prompt, 2048);
      return res.json({ brief, count: reviewed.length });
    } catch (err) { console.error("Brief error:", err); return res.status(500).json({ error: "Brief generation failed" }); }
  });

  // PATCH /api/ideas/:id  — GM reviews: update status + note
  app.patch("/api/ideas/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, gmNote } = req.body;
      if (!status) return res.status(400).json({ error: "status required" });
      await storage.updateSuggestionGM(id, { status, gmNote });
      return res.json({ success: true });
    } catch (err) { console.error(err); return res.status(500).json({ error: "Update failed" }); }
  });

  // ── Passenger Manifest API ──────────────────────────────────────────────────────────────

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
  app.get("/api/push/vapid-public-key", async (_req: Request, res: Response) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // POST /api/push/subscribe  — save a device push subscription
  app.post("/api/push/subscribe", async (req: Request, res: Response) => {
    try {
      const { endpoint, keys, deviceLabel = 'device' } = req.body;
      if (!endpoint || !keys) return res.status(400).json({ error: "Missing endpoint or keys" });
      await storage.savePushSubscription(endpoint, keys, deviceLabel);
      console.log(`[push] Subscribed: ${deviceLabel} @ ${endpoint.slice(0, 60)}...`);
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Subscribe failed" });
    }
  });

  // DELETE /api/push/subscribe  — remove a subscription on unsubscribe
  app.delete("/api/push/subscribe", async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) await storage.deletePushSubscription(endpoint);
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // POST /api/push/test  — send a test push to all subscribed devices
  app.post("/api/push/test", async (_req: Request, res: Response) => {
    const subs = await storage.listPushSubscriptions();
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
        if (err.statusCode === 410) await storage.deletePushSubscription(sub.endpoint);
      }
    }
    return res.json({ sent, total: subs.length });
  });

  // ── Active mission tracking ───────────────────────────────────────────────

  // POST /api/missions/active  — register an active flight mission for NOTAM watching
  app.post("/api/missions/active", async (req: Request, res: Response) => {
    try {
      const { missionId, aircraft, airports, pic, missionType, date } = req.body;
      if (!missionId || !airports) return res.status(400).json({ error: "Missing required fields" });
      await storage.upsertActiveMission({ missionId, aircraft, airports, pic, missionType, date });
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Failed to register mission" });
    }
  });

  // PATCH /api/missions/active/:id/complete  — mark mission completed
  app.patch("/api/missions/active/:id/complete", async (req: Request, res: Response) => {
    try {
      await storage.completeMission(req.params.id);
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // GET /api/missions/active  — list active missions
  app.get("/api/missions/active", async (_req: Request, res: Response) => {
    try { return res.json({ missions: await storage.listActiveMissions() }); }
    catch (err) { return res.status(500).json({ error: String(err) }); }
  });

  // ── NOTAM watcher — called by server-side interval ────────────────────────
  // Checks every active mission's airports for new NOTAM flags, fires push alerts

  async function runNotamWatch() {
    const missions = await storage.listActiveMissions();
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

    const subs = await storage.listPushSubscriptions();
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
        if (err.statusCode === 410) await storage.deletePushSubscription(sub.endpoint);
      }
    }
    console.log(`[notam-watch] Sent alert for ${flagged.length} flagged NOTAMs to ${subs.length} devices`);
  }


  // ── NEPT AI Auto Tasking Optimiser ────────────────────────────────────────
  app.post("/api/nept/auto-task", async (req: Request, res: Response) => {
    const { jobSheet, opDate, availableAircraft, crewNotes, nurseEbaRule, dutyStart, maxDutyHours, nurseShiftStart } = req.body;

    if (!jobSheet || !opDate || !availableAircraft?.length) {
      return res.status(400).json({ error: "jobSheet, opDate and availableAircraft are required." });
    }

    const httpsProxy  = process.env.HTTPS_PROXY || process.env.https_proxy || "";
    const customToken = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_TOKEN || "";
    const customUrl   = process.env.CUSTOM_CRED_API_ANTHROPIC_COM_URL || "";
    const proxyKey    = process.env.ANTHROPIC_API_KEY || "";
    const proxyBase   = process.env.ANTHROPIC_BASE_URL || process.env.ANTHROPIC_API_BASE || "";
    const usingProxy  = !!httpsProxy && httpsProxy.includes("agent-proxy.perplexity.ai");
    const apiKey      = usingProxy ? "proxy-injected" : (customToken || proxyKey);
    const baseUrl     = customUrl || proxyBase || "https://api.anthropic.com";

    console.log("[auto-task] mode:", usingProxy ? "pplx-proxy" : "direct", "| httpsProxy:", httpsProxy ? "set" : "not set", "| apiKey present:", !!apiKey, "| baseUrl:", baseUrl);

    if (!apiKey) {
      return res.status(503).json({ error: "Anthropic API key not configured. Proxy: " + (httpsProxy ? "set" : "not set") });
    }

    const systemPrompt = `You are an expert RFDS aeromedical operations scheduler for RFDS SE Section (Royal Flying Doctor Service, South Eastern Section) in Australia.

Your task is to optimise the day's NEPT (Non-Emergency Patient Transport) tasking across the available aircraft and bases.

HARD RULES — never violate these (sourced directly from approved Fair Work enterprise agreements):
1. Each aircraft has ONE pilot and ONE nurse assigned per day.
2. Minimum 60 minutes ground time at every airport for patient handling, documentation, and boarding.
3. Nurse EBA lunch break: ${nurseEbaRule}. Do NOT schedule a patient leg during this window — this is a non-negotiable EBA entitlement (Nurses EBA 2023, Cl. 25.2).
4. Pilot and nurse duty must not exceed ${maxDutyHours} hours from ${dutyStart}.
5. NURSE EBA — MAX SHIFT DURATION: Nurse shift workers must not exceed 12 hours of ordinary duty in a single day (Nurses EBA 2023, Cl. 23.4). If the duty window from ${dutyStart} plus ${maxDutyHours} hours would exceed this limit, cap the nurse's duty at 12 hours and flag a warning.
6. NURSE EBA — MINIMUM REST: Nurses must have a minimum 10 consecutive hours free from duty between shifts (Nurses EBA 2023, Cl. 24.3). If the previous shift end time is known, do not schedule duty that would breach this rest period.
7. NURSE EBA — REST PENALTY: If a nurse is required to start a shift without the full 10-hour rest, note this in the warnings array — it attracts 200% overtime rate until the rest period is restored (Nurses EBA 2023, Cl. 24.4).
8. PILOT — FLIGHT TIME: Pilots must not exceed 100 flight hours in 30 consecutive days or 900 hours in 365 days (Pilots Agreement 2025, Cl. 20.3). Flag warnings if cumulative hours are provided.
9. Realistic cruise speeds: B200 = 240 kts TAS, B350 = 270 kts TAS.
10. Dubbo (YSDU) is the primary base. Bankstown (YSBK) handles Sydney metro tasking.
11. Each task leg must have correct ICAO codes for Australian aerodromes.
12. Return each aircraft to its home base unless impossible within duty time.
13. Always assign the closest available aircraft to minimise positioning.

EFFICIENCY PRINCIPLES:
- Combine single-direction trips into round trips where clinically safe
- Position aircraft proactively when it saves overall duty time
- Avoid deadhead legs unless necessary for patient safety
- Spread workload evenly across available aircraft

GROUND TRANSPORT (ROAD TRANSFER) PRINCIPLES — critically important:
- Every NEPT task has road transfer legs: pickup from patient location to aerodrome (Leg 1) and aerodrome to receiving facility (Leg 2). These MUST be assigned to an available driver with the PTV at that location.
- If a location has a PTV but NO available driver today, you MUST propose a solution in this priority order:
  1. BORROW from adjacent/nearby location: Check if a driver from Griffith, Narrandera, Orange, Parkes or any nearby town has nil or low tasking and could drive to cover. Name the driver and location explicitly.
  2. FLY IN a driver from base: A driver from Dubbo or Bankstown can travel as a passenger on the aircraft positioning to that location. Include an explicit "Driver positioning" note in the task sectors and name the driver being repositioned.
  3. SHARE across multi-patient days: If multiple patients are in the same town, sequence them so one driver handles all legs efficiently — list the sequencing.
  4. If nil ground transport is possible, flag "NIL GROUND TRANSPORT" and suggest the nearest available alternate (e.g. patient held for next available driver day, or commercial taxi arranged).
- Always name the specific driver assigned to each road leg in the groundTransport field.
- A driver flying as a passenger is a perfectly valid operational solution — plan it as a real sector.
- If a PTV vehicle itself is unavailable, note this separately — a driver alone cannot perform the transfer.

You must return a JSON object ONLY — no prose, no markdown, no code block markers. The JSON must exactly match this schema:
{
  "summary": "One paragraph summary of the optimised plan including any ground transport solutions proposed",
  "tasks": [
    {
      "aircraft": "VH-XXX",
      "base": "Dubbo",
      "pilot": "TBA",
      "nurse": "TBA",
      "sectors": [
        {
          "from": "Dubbo",
          "fromIcao": "YSDU",
          "to": "Broken Hill",
          "toIcao": "YBHI",
          "etd": "07:30",
          "eta": "09:10",
          "groundTime": "60 min"
        }
      ],
      "groundTransport": [
        {
          "location": "Wagga Wagga",
          "vehicleId": "PTV-WAG",
          "leg": "pickup",
          "driver": "Wagga Driver 1",
          "solution": "local",
          "solutionDetail": "Local driver available"
        },
        {
          "location": "Wagga Wagga",
          "vehicleId": "PTV-WAG",
          "leg": "dropoff",
          "driver": "Griffith Driver",
          "solution": "borrowed",
          "solutionDetail": "Griffith Driver repositioned — nil Griffith tasking today, driving to Wagga to cover"
        }
      ],
      "dutyStart": "07:00",
      "dutyEnd": "17:00",
      "totalFlightTime": "4:20",
      "notes": "Positioned via Broken Hill to minimise deadhead; return leg combined with afternoon transfer."
    }
  ],
  "warnings": ["EBA breach alerts and ground transport issues go here as short strings"]
}

IMPORTANT — EBA mentions in output: keep "notes" plain and operational (routing, timing, positioning) by default. Only reference a specific EBA clause number or limit value inside "notes" for a task when that task is actually at, near (e.g. within 30 min of a duty/rest cap), or in breach of the limit. If every EBA rule is comfortably satisfied with margin, do not mention EBA in the notes at all — leave "warnings" empty and keep notes purely operational. Never restate the full set of EBA limits as boilerplate.`;

    const userMsg = `Operations Date: ${opDate}
Duty Start: ${dutyStart}
Max Duty: ${maxDutyHours} hours

EBA HARD LIMITS (from approved Fair Work agreements — must be enforced):
- Nurse max ordinary hours per shift: 12 hours (Nurses EBA 2023, Cl. 23.4)
- Nurse minimum rest between shifts: 10 consecutive hours (Nurses EBA 2023, Cl. 24.3)
- Nurse lunch break entitlement: ${nurseEbaRule} (Nurses EBA 2023, Cl. 25.2) — no patient legs in this window
- Pilot max flight time: 100 hrs/30 days, 900 hrs/365 days (Pilots Agreement 2025, Cl. 20.3)
- Pilot rest after duty extension: minimum 9–10 consecutive hours (Pilots Agreement 2025, Cl. 20.3(e))

Available Aircraft:
${availableAircraft.map((a: any) => `- ${a.reg} (${a.type}) based at ${a.base}`).join("\n")}

Crew Availability Notes:
${crewNotes}

JOB SHEET:
${jobSheet}

Produce the optimised run plan as JSON.`;

    try {
      const messagesUrl = baseUrl.endsWith("/v1/messages") ? baseUrl : `${baseUrl}/v1/messages`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      };
      if (!usingProxy) headers["x-api-key"] = apiKey;

      const apiRes = await fetch(messagesUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 2500,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      if (!apiRes.ok) {
        const errBody = await apiRes.text();
        console.error("[auto-task] Anthropic API error:", apiRes.status, errBody);
        return res.status(502).json({ error: `AI service returned ${apiRes.status}: ${errBody.substring(0, 200)}` });
      }

      const data = await apiRes.json() as any;
      const text = data?.content?.[0]?.text ?? "";

      // Strip any accidental markdown fences
      const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/,"").trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Try to extract JSON from mixed content
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else return res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
      }

      return res.json(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[auto-task] error:", msg);
      return res.status(500).json({ error: msg });
    }
  });

  // ── NEPT Tasking Board ────────────────────────────────────────────────────
  app.get("/api/nept-tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.listNeptTasks();
      res.json(tasks);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.post("/api/nept-tasks", async (req: Request, res: Response) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Invalid request body — expected a task object." });
    }
    try {
      const now = new Date().toISOString();
      const task = await storage.createNeptTask({ ...req.body, createdAt: now, updatedAt: now });
      res.status(201).json(task);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.patch("/api/nept-tasks/:id", async (req: Request, res: Response) => {
    try {
      const id   = parseInt(req.params.id);
      const body = { ...req.body };

      // Fetch current task so we can detect status transitions
      const existing = await storage.getNeptTask(id);

      // Auto-stamp completedAt when status transitions to Complete
      if (body.status === "Complete" && !body.completedAt) {
        body.completedAt = new Date().toISOString();
      }
      // Clear completedAt if status is moved back away from Complete
      if (body.status && body.status !== "Complete") {
        body.completedAt = null;
      }

      const task = await storage.updateNeptTask(id, body);
      if (!task) return res.status(404).json({ error: "Not found" });

      // Fire notification when status transitions TO Released
      if (body.status === "Released" && existing && existing.status !== "Released") {
        const route = task.pickupLocation && task.destLocation
          ? `${task.pickupLocation} → ${task.destLocation}`
          : task.taskRef;
        const patient = task.patientName ? ` · Patient: ${task.patientName}` : "";
        await storage.createNotification({
          type:    "task_released",
          title:   `Task Released to Gate`,
          body:    `${task.taskRef} — ${route}${ task.aircraftReg ? ` · ${task.aircraftReg}` : "" }${patient}`,
          taskRef: task.taskRef,
          taskId:  task.id,
        });
      }

      // Auto-generate invoice when a NEPT task transitions to Complete
      if (body.status === "Complete" && existing && existing.status !== "Complete") {
        try {
          const clientRates = await storage.listClientRates();
          const rate = clientRates.find(r => r.missionType === "NEPT" && r.active === 1) ?? clientRates.find(r => r.missionType === "NEPT");
          const amountCents = rate?.rateAmountCents ?? 0;
          if (amountCents > 0) {
            await storage.autoGenerateInvoice({
              sourceType: "nept",
              taskRef: task.taskRef,
              serviceDate: task.completedAt ?? new Date().toISOString(),
              aircraftReg: task.aircraftReg,
              pickupLocation: task.pickupLocation,
              destination: task.destLocation,
              missionType: "NEPT",
              payerType: rate?.orgCode ?? "unknown",
              payerName: rate?.orgName ?? task.referringHospital ?? "Unknown Payer",
              baseAmountCents: amountCents,
              afterHoursSurchargeCents: rate?.afterHoursSurchargeCents ?? 0,
              gstApplicable: rate?.gstApplicable ?? 1,
            });
          }
        } catch (invErr) {
          console.error("Auto-invoice generation failed for NEPT task", task.taskRef, invErr);
        }
      }

      res.json(task);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  app.get("/api/notifications", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.listUnreadNotifications());
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.post("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const n = await storage.markNotificationRead(parseInt(req.params.id));
      res.json(n ?? { ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.post("/api/notifications/read-all", async (_req: Request, res: Response) => {
    try {
      await storage.markAllNotificationsRead();
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  app.delete("/api/nept-tasks/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteNeptTask(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── NEPT Breaks ────────────────────────────────────────────────────────
  app.get("/api/nept-breaks", async (_req: Request, res: Response) => {
    try { res.json(await storage.listNeptBreaks()); }
    catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.post("/api/nept-breaks", async (req: Request, res: Response) => {
    try {
      const { category, base, crewNames, startTime, endTime, notes } = req.body;
      if (!category || !base || !crewNames || !startTime || !endTime)
        return res.status(400).json({ error: "category, base, crewNames, startTime and endTime are required" });
      const b = await storage.createNeptBreak({ category, base, crewNames, startTime, endTime, notes: notes ?? null });
      res.status(201).json(b);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.delete("/api/nept-breaks/:id", async (req: Request, res: Response) => {
    try { await storage.deleteNeptBreak(parseInt(req.params.id)); res.json({ ok: true }); }
    catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Chest item edits persistence ───────────────────────────────────────────
  // GET /api/chest-item-edits — all saved edits as { chestId_itemId -> {...} }
  app.get("/api/chest-item-edits", async (_req: Request, res: Response) => {
    try {
      const rows = await storage.listChestItemEdits();
      // key: "chestId::itemId" -> payload
      const map: Record<string, { expiryDate: string | null; qtyPresent: number | null; note: string | null; flagReorder: boolean }> = {};
      rows.forEach(r => {
        map[`${r.chestId}::${r.itemId}`] = {
          expiryDate:  r.expiryDate  ?? null,
          qtyPresent:  r.qtyPresent  ?? null,
          note:        r.note        ?? null,
          flagReorder: r.flagReorder === 1,
        };
      });
      res.json(map);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PUT /api/chest-item-edits/:chestId/:itemId — upsert a single chest item edit
  app.put("/api/chest-item-edits/:chestId/:itemId", async (req: Request, res: Response) => {
    try {
      const { chestId, itemId } = req.params;
      const { expiryDate = null, qtyPresent = null, note = null, flagReorder = false, updatedBy = "nurse" } = req.body ?? {};
      const row = await storage.upsertChestItemEdit(chestId, itemId, { expiryDate, qtyPresent, note, flagReorder }, updatedBy);
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

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

  // ── Chest reorder queue (in-memory bridge replacing localStorage) ──────────
  // Stores pending reorder items so StockUsage can consume them cross-page
  const chestReorderQueue: { stockId: string; qty: number; note: string }[] = [];

  app.get("/api/chest-reorder-queue", async (_req: Request, res: Response) => {
    res.json([...chestReorderQueue]);
  });

  app.post("/api/chest-reorder-queue", async (req: Request, res: Response) => {
    const items: { stockId: string; qty: number; note: string }[] = req.body ?? [];
    items.forEach(item => {
      const idx = chestReorderQueue.findIndex(e => e.stockId === item.stockId);
      if (idx >= 0) {
        chestReorderQueue[idx].qty = Math.max(chestReorderQueue[idx].qty, item.qty);
      } else {
        chestReorderQueue.push(item);
      }
    });
    res.json({ ok: true, count: chestReorderQueue.length });
  });

  app.delete("/api/chest-reorder-queue", async (_req: Request, res: Response) => {
    chestReorderQueue.length = 0;
    res.json({ ok: true });
  });

  // ── Video streaming route (byte-range aware) ─────────────────────────────
  // S3 static hosting does not support Range requests. Serve all video files
  // through Express so browsers can seek and autoplay reliably.
  app.get("/api/video/:filename", async (req: Request, res: Response) => {
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

  // ── Special Mission QC Sessions ─────────────────────────────────────────────
  app.get("/api/special-missions", async (_req: Request, res: Response) => {
    try {
      const sessions = await storage.listSpecialMissionSessions();
      res.json(sessions);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/special-missions", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const session = await storage.createSpecialMissionSession({
        missionType:   req.body.missionType,
        missionRef:    req.body.missionRef,
        status:        req.body.status ?? "pre-flight",
        aircraftReg:   req.body.aircraftReg ?? null,
        destination:   req.body.destination ?? null,
        checklistData: req.body.checklistData ?? "{}",
        signoffs:      req.body.signoffs ?? "[]",
        notes:         req.body.notes ?? null,
        createdAt:     now,
        updatedAt:     now,
        completedAt:   null,
      });
      res.status(201).json(session);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.patch("/api/special-missions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates: any = { ...req.body };
      if (updates.status === "complete") updates.completedAt = new Date().toISOString();
      const session = await storage.updateSpecialMissionSession(id, updates);
      res.json(session);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // ── Invoices ─────────────────────────────────────────────────────────────────
  app.get("/api/invoices", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.listInvoices());
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/invoices/next-number", async (_req: Request, res: Response) => {
    try {
      res.json({ invoiceNumber: await storage.getNextInvoiceNumber() });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const inv = await storage.getInvoice(parseInt(req.params.id));
      if (!inv) return res.status(404).json({ error: "Not found" });
      res.json(inv);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const body = req.body;
      const inv = await storage.createInvoice({
        invoiceNumber:       body.invoiceNumber,
        invoiceDate:         body.invoiceDate,
        dueDate:             body.dueDate,
        serviceDate:         body.serviceDate,
        status:              body.status ?? "Draft",
        approvalStatus:      body.approvalStatus ?? null,
        approvedBy:          body.approvedBy ?? null,
        approvedAt:          body.approvedAt ?? null,
        rejectedBy:          body.rejectedBy ?? null,
        rejectedAt:          body.rejectedAt ?? null,
        approvalNote:        body.approvalNote ?? null,
        autoGenerated:       body.autoGenerated ?? 0,
        sourceType:          body.sourceType ?? null,
        payerType:           body.payerType,
        payerName:           body.payerName,
        taskRef:             body.taskRef ?? null,
        patientId:           body.patientId ?? null,
        pickupLocation:      body.pickupLocation ?? null,
        destination:         body.destination ?? null,
        aircraftReg:         body.aircraftReg ?? null,
        missionType:         body.missionType ?? "Standard NEPT",
        baseAmount:          body.baseAmount ?? 0,
        afterHoursSurcharge: body.afterHoursSurcharge ?? 0,
        additionalCharges:   body.additionalCharges ?? 0,
        gstAmount:           body.gstAmount ?? 0,
        totalAmount:         body.totalAmount ?? 0,
        notes:               body.notes ?? null,
        submittedAt:         null,
        paidAt:              null,
        createdAt:           now,
        updatedAt:           now,
      });
      res.status(201).json(inv);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.patch("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates: any = { ...req.body };
      if (updates.status === "Submitted" && !updates.submittedAt) updates.submittedAt = new Date().toISOString();
      if (updates.status === "Paid" && !updates.paidAt) updates.paidAt = new Date().toISOString();
      res.json(await storage.updateInvoice(id, updates));
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/invoices/:id/approve", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { approvedBy, note } = req.body ?? {};
      const now = new Date().toISOString();
      const invoice = await storage.updateInvoice(id, {
        approvalStatus: "approved",
        approvedBy: approvedBy ?? "unknown",
        approvedAt: now,
        approvalNote: note ?? null,
        status: "Submitted",
        submittedAt: now,
      } as any);
      await storage.logAudit("invoice", String(id), "approved", approvedBy ?? "unknown", note ?? undefined);
      await storage.createNotification({
        type: "invoice_approved",
        title: "Invoice Approved",
        body: `Invoice ${invoice.invoiceNumber} approved by ${approvedBy ?? "unknown"}.`,
        taskRef: invoice.taskRef ?? undefined,
      });
      res.json(invoice);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/invoices/:id/reject", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { rejectedBy, note } = req.body ?? {};
      const now = new Date().toISOString();
      const invoice = await storage.updateInvoice(id, {
        approvalStatus: "rejected",
        rejectedBy: rejectedBy ?? "unknown",
        rejectedAt: now,
        approvalNote: note ?? null,
        status: "Draft",
      } as any);
      await storage.logAudit("invoice", String(id), "rejected", rejectedBy ?? "unknown", note ?? undefined);
      await storage.createNotification({
        type: "invoice_rejected",
        title: "Invoice Returned",
        body: `Invoice ${invoice.invoiceNumber} returned by ${rejectedBy ?? "unknown"}${note ? `: ${note}` : ""}.`,
        taskRef: invoice.taskRef ?? undefined,
      });
      res.json(invoice);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteInvoice(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // ── Bulk / Monthly Client Invoice ────────────────────────────────────────────
  // POST /api/invoices/bulk-search  — find completed NEPT tasks for a client in date range
  app.post("/api/invoices/bulk-search", async (req: Request, res: Response) => {
    try {
      const { payerName, dateFrom, dateTo } = req.body;
      if (!payerName || !dateFrom || !dateTo) return res.status(400).json({ error: "payerName, dateFrom, dateTo are required" });
      // Search completed NEPT tasks in the date range
      const tasks = await storage.listNeptTasks();
      const from = new Date(dateFrom + "T00:00:00").getTime();
      const to   = new Date(dateTo   + "T23:59:59").getTime();
      const matched = tasks.filter(t => {
        // Use completedAt for Complete, updatedAt for Cancelled (no completedAt stamp on cancel)
        const dateStr = t.completedAt ?? (t.status === "Cancelled" ? t.updatedAt : null);
        const dateMs = dateStr ? new Date(dateStr).getTime() : null;
        // Include Complete or Cancelled tasks within range
        if (!dateMs || dateMs < from || dateMs > to) return false;
        if (t.status !== "Complete" && t.status !== "Cancelled") return false;
        if (payerName === "__ALL__") return true;
        // Match payer by referringHospital or receivingHospital (case-insensitive contains)
        const q = payerName.toLowerCase();
        return (
          (t.referringHospital ?? "").toLowerCase().includes(q) ||
          (t.receivingHospital ?? "").toLowerCase().includes(q) ||
          (t.pickupLocation ?? "").toLowerCase().includes(q) ||
          (t.destLocation ?? "").toLowerCase().includes(q)
        );
      });
      res.json(matched);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // POST /api/invoices/bulk-generate — create one consolidated invoice for selected tasks
  app.post("/api/invoices/bulk-generate", async (req: Request, res: Response) => {
    try {
      const { payerName, payerType, dateFrom, dateTo, taskRefs, lineItems, notes } = req.body;
      if (!payerName || !taskRefs?.length) return res.status(400).json({ error: "payerName and taskRefs required" });
      const now = new Date().toISOString();
      const year = new Date().getFullYear();
      const allInvoices = await storage.listInvoices();
      const bulkCount = allInvoices.filter(i => i.invoiceNumber?.includes(`BULK-${year}`)).length;
      const invoiceNumber = `INV-BULK-${year}-${String(bulkCount + 1).padStart(4, "0")}`;
      const totalAmountCents = (lineItems as any[]).reduce((s: number, l: any) => s + (Number(l.amountCents) || 0), 0);
      const invoice = await storage.createInvoice({
        invoiceNumber,
        invoiceDate: now,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        serviceDate: dateFrom ?? now,
        status: "Draft",
        approvalStatus: null,
        approvedBy: null, approvedAt: null,
        rejectedBy: null, rejectedAt: null,
        approvalNote: null,
        autoGenerated: 0,
        sourceType: "bulk",
        payerType: payerType ?? "nsw_health",
        payerName,
        taskRef: taskRefs.join(", "),
        patientId: null,
        pickupLocation: null,
        destination: null,
        aircraftReg: null,
        missionType: "Standard NEPT",
        baseAmount: totalAmountCents / 100,
        afterHoursSurcharge: 0,
        additionalCharges: 0,
        gstAmount: 0,
        totalAmount: totalAmountCents / 100,
        notes: notes ?? `Consolidated invoice for ${taskRefs.length} transfer(s) — ${dateFrom} to ${dateTo}`,
        submittedAt: null,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      });
      res.status(201).json(invoice);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // ── Charter Quotes ────────────────────────────────────────────────────────────
  app.get("/api/charter-quotes", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getCharterQuotes());
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/charter-quotes/next-number", async (_req: Request, res: Response) => {
    try {
      res.json({ quoteNumber: await storage.getNextQuoteNumber() });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/charter-quotes/:id", async (req: Request, res: Response) => {
    try {
      const q = await storage.getCharterQuote(parseInt(req.params.id));
      if (!q) return res.status(404).json({ error: "Not found" });
      res.json(q);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/charter-quotes", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const body = req.body;
      const quote = await storage.createCharterQuote({
        quoteNumber:    body.quoteNumber,
        clientName:     body.clientName,
        clientContact:  body.clientContact ?? null,
        purpose:        body.purpose,
        aircraftType:   body.aircraftType,
        departureDate:  body.departureDate,
        legs:           body.legs,
        crew:           body.crew,
        costs:          body.costs,
        totalCost:      body.totalCost,
        marginPercent:  body.marginPercent ?? 15,
        finalQuote:     body.finalQuote,
        status:         body.status ?? "draft",
        notes:          body.notes ?? null,
        createdAt:      now,
        updatedAt:      now,
      } as any);
      res.status(201).json(quote);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.patch("/api/charter-quotes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getCharterQuote(id);
      const updated = await storage.updateCharterQuote(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });

      // Auto-generate invoice when quote transitions to accepted and autoInvoice is enabled
      if (req.body.status === "accepted" && existing && existing.status !== "accepted" && existing.autoInvoice) {
        try {
          await storage.autoGenerateInvoice({
            sourceType: "charter",
            taskRef: updated.quoteNumber,
            serviceDate: updated.departureDate,
            aircraftReg: null,
            pickupLocation: null,
            destination: null,
            missionType: "Charter",
            payerType: "charter",
            payerName: updated.clientName,
            baseAmountCents: Math.round((updated.finalQuote ?? 0) * 100),
            afterHoursSurchargeCents: 0,
            gstApplicable: 0,
          });
        } catch (invErr) {
          console.error("Auto-invoice generation failed for charter quote", updated.quoteNumber, invErr);
        }
      }

      res.json(updated);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/charter-quotes/:id", async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteCharterQuote(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // ── Fuel Receipts ───────────────────────────────────────────────────
  app.get("/api/fuel-receipts", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.listFuelReceipts());
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/fuel-receipts", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const body = req.body;
      const receiptRef = body.receiptRef && String(body.receiptRef).trim().length > 0
        ? body.receiptRef
        : `FR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const receipt = await storage.createFuelReceipt({
        receiptRef,
        entryMethod:    body.entryMethod ?? "manual",
        aircraftReg:    body.aircraftReg,
        airportIcao:    body.airportIcao,
        upliftDate:     body.upliftDate,
        upliftLb:       body.upliftLb,
        pricePerLb:     body.pricePerLb,
        totalAud:       body.totalAud,
        supplier:       body.supplier,
        invoiceRef:     body.invoiceRef ?? null,
        scanImageUrl:   body.scanImageUrl ?? null,
        reconStatus:    body.reconStatus ?? "pending",
        reconBatchId:   body.reconBatchId ?? null,
        notes:          body.notes ?? null,
        enteredBy:      body.enteredBy ?? "ops",
        createdAt:      now,
        updatedAt:      now,
      });
      await storage.createNotification({
        type: "fuel_receipt_added",
        title: "Fuel Uplift Logged",
        body: `${receipt.upliftLb} lb uplifted at ${receipt.airportIcao} for ${receipt.aircraftReg} (${receipt.receiptRef}).`,
      });
      res.status(201).json(receipt);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.patch("/api/fuel-receipts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateFuelReceipt(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/fuel-receipts/:id", async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteFuelReceipt(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // ── Cost Optimizer ───────────────────────────────────────────────────────
  app.get("/api/cost-optimizer/config", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getCostConfig());
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.put("/api/cost-optimizer/config/:key", async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const { value, category } = req.body as { value?: string; category?: string };
      if (value === undefined || value === null) {
        return res.status(400).json({ error: "value is required" });
      }
      const row = await storage.upsertCostConfig(key, String(value), category ?? "general");
      res.json(row);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get("/api/action-plan", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getActionPlan());
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post("/api/action-plan", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const item = await storage.createActionItem({
        title: body.title,
        category: body.category,
        estimatedAnnualValue: body.estimatedAnnualValue,
        priority: body.priority,
        status: body.status ?? "proposed",
        notes: body.notes ?? null,
        sourceType: body.sourceType ?? "manual",
      } as any);
      res.status(201).json(item);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.put("/api/action-plan/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateActionItem(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.delete("/api/action-plan/:id", async (req: Request, res: Response) => {
    try {
      const ok = await storage.deleteActionItem(parseInt(req.params.id));
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // ── Quote Rates — live rate monitor for Charter Quote engine ────────────────

  // GET /api/quote-rates — all rates, ordered by category then label
  app.get("/api/quote-rates", async (_req: Request, res: Response) => {
    try {
      res.json(await storage.getAllRates());
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // PUT /api/quote-rates/:key — ops manual override
  app.put("/api/quote-rates/:key", async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const { value, notes } = req.body as { value?: string | number; notes?: string };
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ error: "value is required" });
      }
      const rate = await storage.updateRateManual(key, String(value), notes);
      if (!rate) return res.status(404).json({ error: "Rate not found" });
      res.json(rate);
    } catch (e) { res.status(500).json({ error: String(e) }); }
  });

  // POST /api/quote-rates/refresh — best-effort live rate check against public sources
  app.post("/api/quote-rates/refresh", async (_req: Request, res: Response) => {
    const changes: Array<{ key: string; old: string; new: string }> = [];
    let checked = 0;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    // ── Avdata landing fees ──────────────────────────────────────────────────
    try {
      const avdataRes = await fetch("https://avdata.com.au/airport-charge-rates");
      if (avdataRes.ok) {
        const html = await avdataRes.text();
        const re = /([A-Z]{4}).*?\$([0-9]+\.[0-9]+)\s+per tonne/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(html)) !== null) {
          const icao = match[1];
          const newValue = match[2];
          const key = `landing_${icao}`;
          const existing = await storage.getRateByKey(key);
          if (!existing) continue; // only track airports we already seed
          checked++;
          const oldValue = parseFloat(existing.rateValue);
          const newNum = parseFloat(newValue);
          if (Math.abs(oldValue - newNum) > 0.10) {
            await storage.upsertRate(key, newValue, existing.rateValue, today, nowIso);
            changes.push({ key, old: existing.rateValue, new: newValue });
          } else {
            await storage.upsertRate(key, existing.rateValue, undefined, undefined, nowIso);
          }
        }
      }
    } catch (err) {
      console.error("[quote-rates/refresh] Avdata fetch failed:", err);
    }

    // ── Airservices Australia enroute/TNC rates ─────────────────────────────
    try {
      const airservicesRes = await fetch("https://www.airservicesaustralia.com/industry-info/aviation-charging/");
      if (airservicesRes.ok) {
        const html = await airservicesRes.text();
        const enrouteMatch = /Up to 20 tonnes.*?\$([0-9]+\.[0-9]+)/i.exec(html);
        if (enrouteMatch) {
          const key = "enroute_rate";
          const existing = await storage.getRateByKey(key);
          if (existing) {
            checked++;
            const newValue = enrouteMatch[1];
            const oldValue = parseFloat(existing.rateValue);
            const newNum = parseFloat(newValue);
            if (Math.abs(oldValue - newNum) > 0.10) {
              await storage.upsertRate(key, newValue, existing.rateValue, today, nowIso);
              changes.push({ key, old: existing.rateValue, new: newValue });
            } else {
              await storage.upsertRate(key, existing.rateValue, undefined, undefined, nowIso);
            }
          }
        }
        // Update last_checked for other airservices rates regardless of a specific match
        for (const k of ["met_surcharge_rate", "tnc_major_rate", "tnc_regional_rate", "tnc_out_of_hours", "tnc_minimum_major"]) {
          const existing = await storage.getRateByKey(k);
          if (existing) {
            checked++;
            await storage.upsertRate(k, existing.rateValue, undefined, undefined, nowIso);
          }
        }
      }
    } catch (err) {
      console.error("[quote-rates/refresh] Airservices fetch failed:", err);
    }

    res.json({ checked, updated: changes.length, changes });
  });


// ── Client Rates ────────────────────────────────────────────────────────────
  app.get("/api/client-rates", async (_req: Request, res: Response) => {
    try { res.json(await storage.listClientRates()); }
    catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.post("/api/client-rates", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const rate = await storage.createClientRate({ ...req.body, createdAt: now, updatedAt: now });
      await storage.logAudit("client_rate", String(rate.id), "created", req.body.createdBy ?? "ops", JSON.stringify(req.body));
      res.status(201).json(rate);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.patch("/api/client-rates/:id", async (req: Request, res: Response) => {
    try {
      const rate = await storage.updateClientRate(parseInt(req.params.id), req.body);
      if (!rate) return res.status(404).json({ error: "Not found" });
      await storage.logAudit("client_rate", req.params.id, "edited", req.body.updatedBy ?? "ops", JSON.stringify(req.body));
      res.json(rate);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.delete("/api/client-rates/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteClientRate(parseInt(req.params.id));
      await storage.logAudit("client_rate", req.params.id, "deleted", "ops");
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Invoice Lines ────────────────────────────────────────────────────────────
  app.get("/api/invoice-lines", async (req: Request, res: Response) => {
    try {
      const { batchId, orgCode, status, dateFrom, dateTo } = req.query as Record<string, string>;
      res.json(await storage.listInvoiceLines({ batchId, orgCode, status, dateFrom, dateTo }));
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.post("/api/invoice-lines", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const line = await storage.createInvoiceLine({ ...req.body, createdAt: now, updatedAt: now });
      await storage.logAudit("invoice_line", String(line.id), "created", req.body.createdBy ?? "system", JSON.stringify(req.body));
      res.status(201).json(line);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.patch("/api/invoice-lines/:id", async (req: Request, res: Response) => {
    try {
      const before = await storage.listInvoiceLines();
      const prev = before.find(l => l.id === parseInt(req.params.id));
      const line = await storage.updateInvoiceLine(parseInt(req.params.id), req.body);
      if (!line) return res.status(404).json({ error: "Not found" });
      await storage.logAudit("invoice_line", req.params.id, req.body.status === "approved" ? "approved" : req.body.status === "disputed" ? "disputed" : "edited", req.body.updatedBy ?? "ops", JSON.stringify({ before: prev, after: req.body }));
      res.json(line);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.delete("/api/invoice-lines/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteInvoiceLine(parseInt(req.params.id));
      await storage.logAudit("invoice_line", req.params.id, "deleted", "ops");
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Auto-populate invoice line from dispatch ─────────────────────────────────
  app.post("/api/invoice-lines/auto-populate", async (req: Request, res: Response) => {
    try {
    // Called when a mission is dispatched — auto-creates a pending invoice line
    const { missionType, taskRef, aircraftReg, fromIcao, toIcao, serviceDate, paxCount, orgCode, orgName, flightTimeMins, afterHours } = req.body;
    const now = new Date().toISOString();
    const today = (serviceDate ?? now).slice(0, 10);
    // Look up rate for this org + mission type
    let rateAmount = 0;
    let afterHoursAmount = 0;
    let gstApplicable = 0;
    const rate = await storage.getRateForOrg(orgCode ?? "default", missionType ?? "NEPT");
    if (rate) {
      rateAmount = rate.rateAmountCents;
      afterHoursAmount = afterHours ? rate.afterHoursSurchargeCents : 0;
      gstApplicable = rate.gstApplicable;
    }
    const subtotal = rateAmount + afterHoursAmount;
    const gstCents = gstApplicable ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + gstCents;
    // Find or create today's batch
    const batchId = `BATCH-${today}`;
    let batch = await storage.getInvoiceBatch(batchId);
    if (!batch) {
      batch = await storage.createInvoiceBatch({ batchId, periodType: "daily", periodStart: today, periodEnd: today, status: "reconciling", totalLines: 0, totalAmountCents: 0, flaggedCount: 0, approvedBy: null, approvedAt: null, sentAt: null, notes: null, createdAt: now, updatedAt: now });
    }
    // Flag if no rate found
    const flagged = !rate ? 1 : 0;
    const flagReason = !rate ? "No client rate configured for this org/mission type" : null;
    const line = await storage.createInvoiceLine({ invoiceBatchId: batchId, orgCode: orgCode ?? "unknown", orgName: orgName ?? orgCode ?? "Unknown", missionType: missionType ?? "NEPT", serviceDate: today, taskRef: taskRef ?? null, aircraftReg: aircraftReg ?? null, fromIcao: fromIcao ?? null, toIcao: toIcao ?? null, flightTimeMins: flightTimeMins ?? null, paxCount: paxCount ?? 1, rateAmountCents: rateAmount, afterHoursSurchargeCents: afterHoursAmount, additionalCents: 0, gstCents, lineTotalCents: total, status: "pending", invoiceNumber: null, notes: null, flagged, flagReason, autoPopulated: 1, createdAt: now, updatedAt: now });
    // Update batch totals
    const allLines = await storage.listInvoiceLines({ batchId });
    const batchTotal = allLines.reduce((s, l) => s + l.lineTotalCents, 0);
    const flagCount = allLines.filter(l => l.flagged).length;
    await storage.updateInvoiceBatch(batchId, { totalLines: allLines.length, totalAmountCents: batchTotal, flaggedCount: flagCount });
    await storage.logAudit("invoice_line", String(line.id), "auto_populated", "system", JSON.stringify({ taskRef, missionType, orgCode, rateAmount, total }));
    res.status(201).json(line);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Invoice Batches ──────────────────────────────────────────────────────────
  app.get("/api/invoice-batches", async (_req: Request, res: Response) => {
    try { res.json(await storage.listInvoiceBatches()); }
    catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.get("/api/invoice-batches/:batchId", async (req: Request, res: Response) => {
    try {
      const batch = await storage.getInvoiceBatch(req.params.batchId);
      if (!batch) return res.status(404).json({ error: "Not found" });
      res.json(batch);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.post("/api/invoice-batches", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const batch = await storage.createInvoiceBatch({ ...req.body, createdAt: now, updatedAt: now });
      await storage.logAudit("invoice_batch", batch.batchId, "created", req.body.createdBy ?? "ops");
      res.status(201).json(batch);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.patch("/api/invoice-batches/:batchId/approve", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const batch = await storage.updateInvoiceBatch(req.params.batchId, { status: "approved", approvedBy: req.body.approvedBy ?? "ops", approvedAt: now });
      const lines = await storage.listInvoiceLines({ batchId: req.params.batchId, status: "pending" });
      for (const line of lines) await storage.updateInvoiceLine(line.id, { status: "approved" });
      await storage.logAudit("invoice_batch", req.params.batchId, "approved", req.body.approvedBy ?? "ops", `${lines.length} lines approved`);
      res.json(batch);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.patch("/api/invoice-batches/:batchId/send", async (req: Request, res: Response) => {
    try {
      const now = new Date().toISOString();
      const batch = await storage.updateInvoiceBatch(req.params.batchId, { status: "sent", sentAt: now });
      const lines = await storage.listInvoiceLines({ batchId: req.params.batchId, status: "approved" });
      for (const line of lines) await storage.updateInvoiceLine(line.id, { status: "invoiced" });
      await storage.logAudit("invoice_batch", req.params.batchId, "sent", req.body.sentBy ?? "ops", `Sent to clients — placeholder (email not yet wired)`);
      res.json(batch);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });
  app.patch("/api/invoice-batches/:batchId", async (req: Request, res: Response) => {
    try {
      const batch = await storage.updateInvoiceBatch(req.params.batchId, req.body);
      res.json(batch);
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Invoice Audit Trail ──────────────────────────────────────────────────────
  app.get("/api/invoice-audit", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.query as Record<string, string>;
      res.json(await storage.listAudit(entityType, entityId));
    } catch (err) { res.status(500).json({ error: String(err) }); }
  });

  // ── Ops Tasks ────────────────────────────────────────────────────────────────
  app.get('/api/ops-tasks', async (req, res) => {
    try { res.json(await storage.listOpsTasks()); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/ops-tasks/:id', async (req, res) => {
    try {
      const t = await storage.getOpsTask(Number(req.params.id));
      t ? res.json(t) : res.status(404).json({ error: 'Not found' });
    } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/ops-tasks', async (req, res) => {
    try { res.status(201).json(await storage.createOpsTask(req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.patch('/api/ops-tasks/:id', async (req, res) => {
    try { res.json(await storage.updateOpsTask(Number(req.params.id), req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/ops-tasks/:id', async (req, res) => {
    try { res.json({ ok: await storage.deleteOpsTask(Number(req.params.id)) }); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/ops-tasks/:id/comments', async (req, res) => {
    try { res.json(await storage.listOpsTaskComments(Number(req.params.id))); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/ops-tasks/:id/comments', async (req, res) => {
    try { res.status(201).json(await storage.createOpsTaskComment({ ...req.body, task_id: Number(req.params.id) })); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });

  // ── Projects ─────────────────────────────────────────────────────────────────
  app.get('/api/projects', async (req, res) => {
    try { res.json(await storage.listProjects()); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/projects', async (req, res) => {
    try { res.status(201).json(await storage.createProject(req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.patch('/api/projects/:id', async (req, res) => {
    try { res.json(await storage.updateProject(Number(req.params.id), req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/projects/:id', async (req, res) => {
    try { res.json({ ok: await storage.deleteProject(Number(req.params.id)) }); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/projects/:id/tasks', async (req, res) => {
    try { res.json(await storage.listProjectTasks(Number(req.params.id))); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/projects/:id/tasks', async (req, res) => {
    try { res.status(201).json(await storage.createProjectTask({ ...req.body, project_id: Number(req.params.id) })); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.patch('/api/project-tasks/:id', async (req, res) => {
    try { res.json(await storage.updateProjectTask(Number(req.params.id), req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/project-tasks/:id', async (req, res) => {
    try { res.json({ ok: await storage.deleteProjectTask(Number(req.params.id)) }); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });

  // ── Pilot Handover Board ──────────────────────────────────────────────────────
  app.get('/api/handover', async (_req, res) => {
    try { res.json(await storage.listHandovers()); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/handover/:reg', async (req, res) => {
    try {
      const h = await storage.getHandoverByReg(req.params.reg);
      h ? res.json(h) : res.status(404).json({ error: 'Not found' });
    } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/handover', async (req, res) => {
    try { res.status(201).json(await storage.upsertHandover(req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });
  app.patch('/api/handover/:id', async (req, res) => {
    try { res.json(await storage.updateHandover(Number(req.params.id), req.body)); } catch(e:any) { res.status(500).json({ error: e.message }); }
  });

  // ── Closed Tenders ──────────────────────────────────────────────────────────
  app.get("/api/closed-tenders", async (_req: Request, res: Response) => {
    try {
      const tenders = await storage.listClosedTenders();
      return res.json({ tenders });
    } catch (err) { console.error(err); return res.status(500).json({ error: "Failed to list" }); }
  });

  app.post("/api/closed-tenders", async (req: Request, res: Response) => {
    try {
      const { ref, title, agency, closed, awarded_to, contract_value, type, scope,
              region, fit, missed_reason, lesson, bid_submitted, our_outcome, notes } = req.body;
      if (!ref || !title || !agency || !closed || !type || !scope || !region)
        return res.status(400).json({ error: "Missing required fields" });
      const row = await storage.createClosedTender({
        ref, title, agency, closed, awarded_to, contract_value, type, scope,
        region, fit: fit ?? "MEDIUM", missed_reason: missed_reason ?? "",
        lesson: lesson ?? "", bid_submitted: !!bid_submitted, our_outcome, notes,
      });
      return res.json({ tender: row });
    } catch (err) { console.error(err); return res.status(500).json({ error: "Failed to create" }); }
  });


  app.patch("/api/closed-tenders/:id", async (req: Request, res: Response) => {
    try {
      const row = await storage.updateClosedTender(Number(req.params.id), req.body);
      return res.json({ tender: row });
    } catch (err) { console.error(err); return res.status(500).json({ error: "Failed to update" }); }
  });

  app.delete("/api/closed-tenders/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteClosedTender(Number(req.params.id));
      return res.json({ success: true });
    } catch (err) { console.error(err); return res.status(500).json({ error: "Failed to delete" }); }
  });

  // ── Split Duty PDF Export ────────────────────────────────────────────────
  app.post("/api/split-duty/export", async (req: Request, res: Response) => {
    try {
      const payload = JSON.stringify(req.body);
      const outPath = path.join(os.tmpdir(), `split_duty_${Date.now()}.pdf`);
      const scriptPath = path.join(process.cwd(), 'server', 'split_duty_pdf.py');

      await new Promise<void>((resolve, reject) => {
        execFile('python3', [scriptPath, payload, outPath], { timeout: 15000 }, (err) => {
          if (err) reject(err); else resolve();
        });
      });

      const buf = fs.readFileSync(outPath);
      fs.unlinkSync(outPath);

      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SplitDuty_${stamp}.pdf"`);
      res.setHeader('Content-Length', buf.length);
      return res.send(buf);
    } catch (err) {
      console.error('[split-duty/export]', err);
      return res.status(500).json({ error: 'PDF generation failed' });
    }
  });


  return httpServer;
}
