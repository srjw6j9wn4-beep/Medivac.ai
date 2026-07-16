import { useState } from "react";
import { X, BookOpen, ChevronDown, ChevronRight, Search, ExternalLink } from "lucide-react";

// ─── Manual content — keyed by route path ─────────────────────────────────────
export const MANUAL: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  "/": {
    title: "Demo Overview",
    sections: [
      { heading: "What is this page?", body: "The Demo Overview is the landing page for Medivac.ai. It provides a high-level tour of platform capabilities, AI avatars (Graham & Jennifer), and live module demonstrations for prospective clients or internal stakeholders." },
      { heading: "Navigation", body: "Use the sidebar to switch between all modules. The role selector at the top of the sidebar lets you preview the platform from different user perspectives (Pilot, Nurse, Admin, etc.)." },
    ],
  },
  "/morning-brief": {
    title: "The 8:45 — Morning Brief",
    sections: [
      { heading: "Overview", body: "The 8:45 is the daily operational briefing tool. It aggregates overnight NEPT tasks, active missions, crew duty status, aircraft availability, weather notes, and NOTAMs into a single structured brief." },
      { heading: "How to run the brief", body: "Open the page before 08:45 AEST. The brief auto-populates from live data. Review each section — NEPT tasks, crew hours, aircraft status — and add notes as required. Tap 'Mark Brief Complete' to log completion with a timestamp." },
      { heading: "Who should use this", body: "The Duty Operations Manager or Senior Dispatcher runs this brief each morning. All crew on shift should be aware of the brief outcomes." },
      { heading: "Tips", body: "If a section shows stale data, use the Refresh button top-right. Brief completion is auditable — it is timestamped and logged against the on-duty ops manager." },
    ],
  },
  "/nept-tasking": {
    title: "NEPT Tasking",
    sections: [
      { heading: "Overview", body: "NEPT (Non-Emergency Patient Transport) Tasking is the core workflow for creating, managing, and completing patient transport tasks. Each task tracks the patient, pickup/dropoff locations, aircraft, crew, and clinical details." },
      { heading: "Creating a task", body: "Click 'New Task'. Fill in the patient details, pickup and destination ICAO codes, requested date/time, aircraft registration, and crew. Special considerations (Cardiac Monitor, Paediatric, Infectious, Humidicrib, Bariatric) must be flagged accurately — they affect multiload eligibility." },
      { heading: "Multiload restrictions", body: "Patients with Cardiac Monitor or Paediatric flags cannot be multiloaded by default (contract obligation and safety policy). If a second patient is added and a restriction applies, the system will block the action and display a Contract Breach panel. A manual override requires uploading a signed approval document before proceeding. The override is permanently logged against the task." },
      { heading: "Generating an invoice", body: "Once a task is marked Complete, tap 'Generate Invoice' from the task view. This creates a pre-populated invoice in the Invoicing module for ops approval." },
      { heading: "Status flow", body: "Tasks move through: Pending → Confirmed → In Progress → Completed (or Cancelled). Cancelled tasks with partial completion can have a partial invoice raised via Invoicing → Bulk Invoice." },
    ],
  },
  "/missions": {
    title: "Mission Board",
    sections: [
      { heading: "Overview", body: "The Mission Board displays all active and planned missions across the operation — NEPT, charter, special, and ferry flights — in a Kanban-style board grouped by status." },
      { heading: "Using the board", body: "Drag tasks between columns to update status. Click any task card to view full details. Filter by aircraft, base, or date using the controls at the top." },
      { heading: "Colour coding", body: "Red = urgent / overdue. Amber = departing soon. Green = on track. Grey = completed. These colours are consistent across all Medivac.ai mission views." },
    ],
  },
  "/passenger-manifest": {
    title: "Passenger Manifest",
    sections: [
      { heading: "Overview", body: "The Passenger Manifest generates a compliant pre-flight manifest for each NEPT or charter mission. It captures passenger names, weights (used for W&B), medical notes, and emergency contacts." },
      { heading: "Signing the manifest", body: "The Pilot-in-Command must review and sign the manifest before departure. Use the 'Sign Manifest' link (or QR code on the printed manifest) to open the digital signature capture." },
      { heading: "Weight & Balance", body: "Passenger weights feed directly into the Aircraft Performance module for W&B calculations. Ensure all weights are confirmed — estimated weights must be flagged as estimates." },
    ],
  },
  "/map": {
    title: "NSW Flight Map",
    sections: [
      { heading: "Overview", body: "The NSW Flight Map is a live operational map showing all active missions, aircraft positions, base locations, and significant waypoints across the RFDS SE operational area." },
      { heading: "Layers", body: "Toggle layers using the controls top-right: Aircraft positions, NEPT task routes, Base locations, Hospital pins, Weather overlay. Layers can be combined." },
      { heading: "Troubleshooting", body: "If the map goes blank, perform a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). The map uses Leaflet with OpenStreetMap tiles — a blank map is usually a tile load failure on first render." },
    ],
  },
  "/dispatch": {
    title: "Dispatch & Intake",
    sections: [
      { heading: "Overview", body: "Dispatch & Intake is the first-contact tool for new mission requests. Dispatchers log incoming calls, capture patient details and clinical urgency, and assign to the appropriate aircraft and crew." },
      { heading: "Triage priorities", body: "P1 = Immediate (life-threatening). P2 = Urgent (within 2 hours). P3 = Non-urgent (scheduled). P4 = Routine NEPT. Priority drives aircraft and crew assignment logic." },
      { heading: "Handover", body: "After intake, tap 'Create Task' to push the record directly into NEPT Tasking or Mission Board depending on mission type." },
    ],
  },
  "/charter-quote": {
    title: "Charter Quote",
    sections: [
      { heading: "Overview", body: "The Charter Quote tool generates fast, accurate cost estimates for ad-hoc charter requests. It uses real aircraft performance data (TAS, fuel burn) and current rate card pricing." },
      { heading: "Aircraft rates", body: "B200: $4,000/hr · B350: $4,800/hr · PC24: $6,000/hr · HELO: $8,500/hr · CL60: $9,500/hr · PC12: $3,200/hr. All rates exclude GST." },
      { heading: "Calculating a quote", body: "Enter origin ICAO, destination ICAO, and select aircraft type. The system calculates distance, flight time at TAS, and total cost. Deadhead legs are automatically included. Press Calculate to generate the quote." },
      { heading: "Saving quotes", body: "Quotes can be saved for later reference or emailed to the client. Saved quotes appear in the Saved Quotes tab with a status of Draft, Sent, or Accepted." },
    ],
  },
  "/rest-calculator": {
    title: "Crew Rest Calculator",
    sections: [
      { heading: "Overview", body: "The Crew Rest Calculator determines minimum rest periods and FDP (Flight Duty Period) limits for crew, based on CASA Part 121/135 regulations and the current RFDS SE EBA." },
      { heading: "How to use", body: "Enter the crew member's last duty-off time and intended reporting time. The calculator returns: remaining rest, FDP remaining, and whether the proposed schedule is compliant." },
      { heading: "EBA provisions", body: "The RFDS SE Pilots EBA 2025 and Nurses EBA 2023 contain specific provisions that are stricter than the regulatory minimums in some areas. This calculator applies the more restrictive of the two." },
    ],
  },
  "/roster": {
    title: "Crew Roster",
    sections: [
      { heading: "Overview", body: "The Crew Roster shows shift schedules for all crew across all bases. Pilots, Nurses, Doctors, and Engineers are displayed with their base, current duty status, and upcoming shifts." },
      { heading: "Editing the roster", body: "Admin and Ops Manager roles can drag-and-drop shifts. Changes trigger an automatic EBA compliance check — violations are flagged in amber." },
      { heading: "Leave management", body: "Leave requests appear in the roster as pending (grey). Approved leave turns blue. Annual leave, sick leave, and training days are tracked separately." },
    ],
  },
  "/frms": {
    title: "Duty & FRMS",
    sections: [
      { heading: "Overview", body: "The Duty & FRMS (Fatigue Risk Management System) page tracks cumulative duty hours for all crew across rolling 7, 28, and 90-day windows — as required by CASA and the EBA." },
      { heading: "Alerts", body: "Red = limit exceeded (roster must be changed immediately). Amber = within 10% of limit (plan relief crew). Green = compliant." },
      { heading: "Reporting", body: "The FRMS report exports a CSV of all duty hours for the period — suitable for CASA audit or internal review." },
    ],
  },
  "/aircraft": {
    title: "Aircraft Status",
    sections: [
      { heading: "Overview", body: "Aircraft Status shows the real-time airworthiness and availability status of every aircraft in the RFDS SE fleet." },
      { heading: "Status codes", body: "AOG = Aircraft on Ground (not airworthy). MAINT = scheduled maintenance. AVAIL = available for tasking. ACTIVE = currently on a mission." },
      { heading: "MEL items", body: "Any deferred defects under the Minimum Equipment List (MEL) are displayed as amber flags on the aircraft card. Click to view the MEL entry and expiry." },
    ],
  },
  "/engineering": {
    title: "Engineering",
    sections: [
      { heading: "Overview", body: "The Engineering module provides a dashboard for LAME and engineers to track defects, scheduled maintenance, component life limits, and AD/SB compliance." },
      { heading: "Defect logging", body: "Log a defect from the aircraft card or directly in Engineering. Each defect requires: description, severity, MEL reference (if applicable), and sign-off status." },
      { heading: "Component tracking", body: "Life-limited components are listed with hours/cycles remaining. The system alerts at 90%, 95%, and 100% of limit." },
    ],
  },
  "/techlog": {
    title: "Tech & Journey Log",
    sections: [
      { heading: "Overview", body: "The Tech & Journey Log is a CASA-compliant digital replacement for the paper journey log. Every flight sector is recorded with times, fuel, crew, and any defects." },
      { heading: "Completing an entry", body: "After each sector: enter block-off and block-on times, fuel uplifted (lb), any defects, and PIC sign-off. Entries are locked once signed and form part of the permanent maintenance record." },
      { heading: "Offline mode", body: "The Tech Log works offline using a local cache. Entries sync automatically when connectivity is restored. Always confirm sync before departing an area with no coverage." },
    ],
  },
  "/medical-equipment": {
    title: "Medical Equipment",
    sections: [
      { heading: "Overview", body: "Medical Equipment tracks the status, location, and service dates of all aeromedical equipment across the fleet and base stores." },
      { heading: "Equipment checks", body: "Each item has a required check interval. Overdue checks appear in red. Complete a check by clicking the item, entering the check result, and signing off." },
      { heading: "Ordering", body: "Low-stock items can be flagged for order directly from this page. Orders route to the Ordering Nurse for approval before being sent to the supplier." },
    ],
  },
  "/stock-usage": {
    title: "Stock Usage & Orders",
    sections: [
      { heading: "Overview", body: "Stock Usage & Orders tracks consumption of medical consumables, medications, and supplies across all aircraft and base stores." },
      { heading: "Recording usage", body: "After each mission, the nurse records items used. This feeds the reorder calculation automatically." },
      { heading: "Orders", body: "When stock drops below the reorder threshold, an order is automatically drafted and sent to the Ordering Nurse for approval. Approved orders are sent to the registered supplier." },
    ],
  },
  "/check-training": {
    title: "Check & Training",
    sections: [
      { heading: "Overview", body: "Check & Training tracks all crew competency checks, recency requirements, and training records — including line checks, IFR approaches, emergency drills, and type ratings." },
      { heading: "Currency alerts", body: "Items within 30 days of expiry show amber. Expired items show red and automatically restrict the crew member from rostering until resolved." },
      { heading: "Uploading records", body: "Training certificates, endorsements, and check reports can be uploaded as PDF or image. They are stored against the crew member's profile for audit." },
    ],
  },
  "/invoicing": {
    title: "Invoicing",
    sections: [
      { heading: "Overview", body: "The Invoicing module manages all revenue billing — NEPT tasks, charter flights, ad-hoc services, and manual adjustments." },
      { heading: "Auto-generated invoices", body: "Invoices are automatically created when a NEPT task or charter is marked Complete. They appear in the Pending Approval queue for ops review before being sent." },
      { heading: "Manual invoices", body: "Use 'New Manual Invoice' for one-off charges. Enter the payer, service description, and amount in dollars (not cents — the system handles GST and formatting automatically)." },
      { heading: "Bulk/monthly invoicing", body: "Use the Bulk Invoice panel to generate a consolidated invoice for all of a client's work within a date range. Supports partial billing for cancelled tasks." },
      { heading: "Currency entry", body: "All amount fields use dollar-first entry. Click the field and type the dollar amount — cents are entered after a decimal point. The field selects all on focus for easy replacement." },
    ],
  },
  "/finance": {
    title: "Fuel & Finance",
    sections: [
      { heading: "Overview", body: "Fuel & Finance tracks all fuel uplifts, reconciles supplier invoices against recorded fuel, and provides financial reporting for operations." },
      { heading: "Recording a fuel uplift", body: "After each refuel, enter the airport ICAO, uplift in pounds (lb), price per lb, and supplier. The entry auto-calculates the AUD cost." },
      { heading: "Reconciliation", body: "The Reconciliation tab matches recorded uplifts against supplier invoices. Discrepancies are flagged for investigation." },
    ],
  },
  "/audit": {
    title: "Audit & Reports",
    sections: [
      { heading: "Overview", body: "Audit & Reports provides a complete, immutable audit trail of all significant actions in the system — task changes, invoice approvals, manifest sign-offs, and crew overrides." },
      { heading: "Filtering", body: "Filter by date range, user, action type, or module. Exports are available as CSV or PDF for regulatory submission." },
      { heading: "Retention", body: "Audit records are retained for 7 years in accordance with CASA and NSW Health requirements." },
    ],
  },
  "/ora": {
    title: "Operational Risk Assessment",
    sections: [
      { heading: "Overview", body: "The Operational Risk Assessment (ORA) tool guides crews and ops through a pre-mission risk scoring exercise, identifying and mitigating risks before each flight." },
      { heading: "Completing an ORA", body: "Work through each risk category (weather, crew fatigue, aircraft, patient condition, route). Score each item Low/Medium/High. The total risk score determines if the mission can proceed, needs mitigation, or requires Duty Manager authorisation." },
      { heading: "High risk missions", body: "If the total score is High, the ORA must be countersigned by the Duty Operations Manager before the mission is approved to proceed." },
    ],
  },
  "/mission-optimiser": {
    title: "Mission Optimiser",
    sections: [
      { heading: "Overview", body: "The Mission Optimiser uses AI to find the most efficient sequencing of multiple NEPT tasks — minimising deadhead, crew duty time, and fuel cost while satisfying all patient time windows." },
      { heading: "Running an optimisation", body: "Select the tasks you want to optimise (from the NEPT Tasking board) and click 'Optimise'. The AI returns the recommended sequence with estimated times and cost savings." },
      { heading: "Accepting a result", body: "Review the proposed sequence. Click 'Accept & Apply' to push the new sequence back to the NEPT board. You can modify individual tasks after applying." },
    ],
  },
  "/ops-tasks": {
    title: "Operations Task Management",
    sections: [
      { heading: "Overview", body: "Operations Task Management is the central hub for all ground-level operational tasks — from routine admin to crew-submitted requests for fuel orders, roo runs, catering, and ground transport." },
      { heading: "Task types", body: "Admin: general admin tasks. Fuel Order: crew request for fuel at a remote location. Roo Run: kangaroo/wildlife carcass removal from runways or strips. Catering: aircraft catering orders. Transport: ground vehicle or taxi requests. Maintenance Request: non-urgent aircraft or facility maintenance. Crew Request: any other crew-initiated request." },
      { heading: "Creating a task", body: "Click 'New Task'. Select the task type, enter a title and description, set priority, assign to an ops staff member, and set a due date/time. Crew can submit requests using the 'Crew Request' button which pre-fills the request source." },
      { heading: "Priority levels", body: "Urgent = address immediately (e.g. roo on runway before departure). High = within 2 hours. Normal = today. Low = this week." },
      { heading: "Updates & comments", body: "Each task has a comment thread. Use this to post status updates, attach documents, or ask for clarification. All comments are timestamped and attributed." },
      { heading: "Completing tasks", body: "Mark a task Complete when all actions are done. Completed tasks are archived but remain searchable for audit purposes." },
    ],
  },
  "/projects": {
    title: "Project Management",
    sections: [
      { heading: "Overview", body: "Project Management provides a structured workspace for tracking multi-step initiatives — platform development, compliance programs, infrastructure upgrades, and clinical projects." },
      { heading: "Creating a project", body: "Click 'New Project'. Enter the project name, category (Platform, Compliance, Infrastructure, Clinical, General), owner, and target date. Projects are assigned a sequential reference number (PRJ-2026-001)." },
      { heading: "Project tasks", body: "Each project contains tasks (tickets). Create tasks within a project by opening it and clicking 'Add Task'. Tasks have a type (Task, Bug, Feature, Improvement, Risk), status (To Do → In Progress → In Review → Done), priority, and optional story points for sprint planning." },
      { heading: "Kanban board", body: "Tasks are displayed in a Kanban board with columns: To Do, In Progress, In Review, Done, Blocked. Drag cards between columns to update status." },
      { heading: "Progress tracking", body: "Project progress (0–100%) is manually set by the project owner to reflect overall completion. It is displayed as a progress bar on the project card." },
      { heading: "Jira integration", body: "If your Jira credentials are configured in the API Integration Hub, project tasks can be pushed to Jira with a single click." },
    ],
  },
  "/pilot-handover": {
    title: "Pilot Handover Board",
    sections: [
      { heading: "Overview", body: "The Pilot Handover Board is a fast, structured digital record of aircraft state at each crew changeover. It captures fuel, oxygen, oil levels, logged defects, MEL items, and crew names — replacing the verbal or paper handover with a timestamped Supabase-backed record that every base can see in real time." },
      { heading: "Selecting an aircraft", body: "The left panel lists all fleet aircraft grouped by base. Each card shows the registration, type, base, current condition status, fuel on board, oxygen pressure, and the time elapsed since the last handover was saved. Cards highlighted in amber have not had a handover saved in more than 8 hours. Click any card to load or create a handover for that aircraft." },
      { heading: "Filtering by base", body: "Use the base filter tabs at the top right (All / Dubbo / Broken Hill / Bankstown / Essendon / Launceston) to narrow the aircraft list to a specific base. This is useful for base-specific shift supervisors." },
      { heading: "Aircraft condition", body: "Set the overall aircraft condition using the status buttons at the top of the handover form: Serviceable (green), Defects Noted (amber), MEL Active (orange), or AOG — Aircraft on Ground (red). This status is visible on the aircraft card for all users and should reflect the entry in the Tech Log." },
      { heading: "Fuel state", body: "Enter fuel on board in pounds (lb) — all King Air fuel quantities are recorded in lb. The visual fuel bar turns amber below 1,500 lb and red below that threshold. The endurance field (e.g. '4+30' for 4 hours 30 minutes) is free-text and should reflect usable endurance at planned cruise power with IFR reserves." },
      { heading: "Oxygen", body: "Enter the medical oxygen cylinder pressure in PSI. The colour bar turns amber below 600 PSI and red below that level. Minimum dispatch pressure is base-specific — refer to the Operations Manual for limits." },
      { heading: "Engine oils", body: "Record the left and right engine oil quantities in US quarts (qt) to the nearest 0.5 qt. Normal operating range for the PT6A-series is typically 7–12 qt — consult the aircraft flight manual for the specific type limit." },
      { heading: "Logged defects", body: "Document any defects that have been entered in the aircraft Tech Log. Copy the defect reference number and description. Leave blank only if there are genuinely nil defects. Defect entries display an 'Active' badge on the form and are visible in the aircraft card list." },
      { heading: "MEL items", body: "List any active Minimum Equipment List (MEL) items with their MEL reference number and any associated placard or operational restriction. A MEL item does not ground the aircraft but must be clearly communicated to the incoming crew." },
      { heading: "Other issues", body: "Use this field for snags, operational notes, or anything the incoming crew needs to know that does not rise to a Tech Log defect — cabin equipment issues, inoperative galley items, known ATC notes, passenger or patient-related handover information." },
      { heading: "Crew details", body: "Enter the outgoing pilot's name (mandatory — the Save button is disabled without it) and the incoming pilot's name. These fields are free-text; use the standard format (e.g. Capt. Smith / F/O Jones). The handover date and time default to now and can be adjusted for retrospective entries." },
      { heading: "Next planned flight", body: "Enter the next planned departure in the format 'YWLG 09:30L' (ICAO identifier followed by local departure time). This gives the incoming crew immediate situational awareness of the next tasking without opening the Mission Board." },
      { heading: "Saving a handover", body: "Click 'Save Handover' to write the record to Supabase. The record is immediately visible to all users with access to the Pilot Handover Board. The aircraft card updates in real time, showing the new fuel state, oxygen, condition, and elapsed time. Previous handovers are retained for audit purposes." },
      { heading: "Who should complete the handover", body: "The outgoing Pilot-in-Command is responsible for completing and saving the handover record before going off duty. The incoming crew should review the board before accepting the aircraft, treating it as the digital equivalent of the walk-around handover brief." },
    ],
  },
  "/api-integrations": {
    title: "API Integration Hub",
    sections: [
      { heading: "Overview", body: "The API Integration Hub is an admin-only page for managing all external system connections — Air Maestro, Veryon, Jira, NSW Health, and others." },
      { heading: "Adding credentials", body: "Click on any integration card to expand it. Enter the required credentials (API keys, URLs, tokens). Credentials are masked after entry and stored encrypted server-side." },
      { heading: "Testing a connection", body: "After entering credentials, click 'Test Connection' to verify the API is reachable and the credentials are valid." },
      { heading: "Pending integrations", body: "Integrations marked 'Pending Approval' require a formal agreement or MOU with the external organisation before credentials can be obtained. See the notes on each card for the approval process." },
      { heading: "Security", body: "Only System Administrators can access this page. Credentials are encrypted at rest using AES-256 and are never exposed in the browser after saving." },
    ],
  },
  "/users": {
    title: "User Management",
    sections: [
      { heading: "Overview", body: "User Management allows administrators to create, edit, deactivate, and manage roles for all Medivac.ai users." },
      { heading: "Roles", body: "Available roles: Admin, Ops Manager, Dispatcher, Pilot, Senior Flight Nurse, Nurse, Ordering Nurse, Doctor, Engineer, Safety, Senior Management. Each role has a defined set of page and action permissions." },
      { heading: "Adding a user", body: "Click 'New User'. Enter their name, email, role, and base. An invite email is sent with a temporary password. Users must change their password on first login." },
      { heading: "Deactivating a user", body: "Deactivated users cannot log in but their records and audit trail are preserved. Do not delete users — deactivate them." },
    ],
  },
  "/rbac": {
    title: "RBAC Permissions",
    sections: [
      { heading: "Overview", body: "Role-Based Access Control (RBAC) defines which pages and actions each role can access. This page displays the full permissions matrix." },
      { heading: "Modifying permissions", body: "Permission changes require Super Admin access. Changes are logged in the audit trail with before/after state." },
    ],
  },
  "/settings": {
    title: "System Settings",
    sections: [
      { heading: "Overview", body: "System Settings controls platform-wide configuration — base details, aircraft registration, rate cards, integration settings, and notification preferences." },
      { heading: "Rate cards", body: "Aircraft hourly rates and NEPT charge-out rates are set here. Changes take effect immediately for new quotes and invoices — they do not retroactively affect existing invoices." },
    ],
  },
  "/after-hours": {
    title: "After-Hours AI Med Line",
    sections: [
      { heading: "Overview", body: "The After-Hours AI Med Line provides an AI-assisted clinical decision support interface for after-hours medical queries from remote patients and facilities." },
      { heading: "Scope", body: "This is a decision-support tool only. All clinical decisions must be made by a qualified medical officer. The AI provides reference information and triage guidance — it does not replace clinical judgement." },
      { heading: "Escalation", body: "If the query requires urgent medical advice beyond the AI's scope, use the direct escalation button to connect to the on-call doctor." },
    ],
  },
  "/telehealth": {
    title: "Telehealth Portal",
    sections: [
      { heading: "Overview", body: "The Telehealth Portal facilitates secure video consultations between patients at remote facilities and RFDS SE medical staff." },
      { heading: "Starting a session", body: "Click 'New Session', enter the patient and facility details, and send the join link to the remote facility. The session opens in a secure, encrypted video room." },
      { heading: "Clinical notes", body: "Notes entered during a telehealth session are attached to the patient record and are available in subsequent consultations." },
    ],
  },
  "/ai-analyst": {
    title: "AI Mission Analyst",
    sections: [
      { heading: "Overview", body: "The AI Mission Analyst reviews completed mission data and provides operational insights — identifying patterns in cancellations, delays, fuel usage, crew duty, and patient acuity." },
      { heading: "Reports", body: "Select a date range and click 'Analyse'. The AI generates a structured report with key findings, risk flags, and recommendations. Reports can be exported as PDF." },
      { heading: "Data sources", body: "The analyst uses data from NEPT Tasking, Mission Board, Duty & FRMS, Fuel & Finance, and Audit logs. The more complete the input data, the better the analysis." },
    ],
  },
  "/doc-ai": {
    title: "Document AI",
    sections: [
      { heading: "Overview", body: "Document AI allows you to upload any aviation, medical, or regulatory document and ask questions about it in plain English." },
      { heading: "Supported formats", body: "PDF, DOCX, TXT. Upload a document, then type your question in the chat interface. The AI will search the document and return a referenced answer." },
      { heading: "Example uses", body: "Checking a specific clause in the EBA. Finding an AD applicability in an airworthiness directive. Reviewing a section of the RFDS SE Operations Manual." },
    ],
  },
  "/iso": {
    title: "ISO Compliance",
    sections: [
      { heading: "Overview", body: "The ISO Compliance module tracks RFDS SE's compliance with ISO 9001 (Quality Management) and relevant healthcare quality standards." },
      { heading: "Non-conformances", body: "Log NCRs from this page. Each NCR requires a root cause, corrective action, and target close date. Overdue NCRs escalate automatically to the Safety Officer." },
    ],
  },
  "/contracts": {
    title: "Contract Compliance",
    sections: [
      { heading: "Overview", body: "Contract Compliance tracks RFDS SE's obligations under its service contracts with NSW Health, LHDs, and NAAS — including response time KPIs, multiload restrictions, and reporting requirements." },
      { heading: "KPI monitoring", body: "Response time performance is calculated automatically from NEPT task data. KPI breaches are flagged in red and generate an automatic notification to the Ops Manager." },
    ],
  },
  "/special-missions": {
    title: "Special Missions",
    sections: [
      { heading: "Overview", body: "Special Missions covers non-standard operations — Lord Howe Island resupply, NETS neonatal transports, international retrievals, and isolated community runs." },
      { heading: "Approval requirements", body: "Most special missions require HOFO (Head of Flight Operations) sign-off before dispatch. The approval workflow is built into the mission creation form." },
    ],
  },
  "/ferry": {
    title: "Ferry Flights",
    sections: [
      { heading: "Overview", body: "Ferry Flights manages positioning flights — moving aircraft between bases, to maintenance facilities, or for positioning to pick up a patient." },
      { heading: "Cost allocation", body: "Ferry flight costs can be allocated to a specific mission, maintenance event, or as an operational overhead depending on the purpose." },
    ],
  },
  "/government-tenders": {
    title: "Government Tenders",
    sections: [
      { heading: "Overview", body: "Government Tenders is a repository for all active and historical tender submissions — NEPT contracts, emergency services aviation, and aeromedical service agreements." },
      { heading: "Tender tracking", body: "Each tender has a status (Drafting, Submitted, Evaluation, Awarded, Lost). Key dates (submission deadline, decision date, contract start) are tracked with reminders." },
    ],
  },
  "/ground-vehicles": {
    title: "Ground Vehicles",
    sections: [
      { heading: "Overview", body: "Ground Vehicles tracks the RFDS SE fleet of ground vehicles — ambulances, staff cars, fuel trucks, and utility vehicles — including registration, service due dates, and allocation." },
    ],
  },
  "/maint-planner": {
    title: "Maintenance Planner",
    sections: [
      { heading: "Overview", body: "The Maintenance Planner provides a forward-looking view of all scheduled maintenance events across the fleet — 100-hourly, phase checks, annual inspections, and ADs." },
      { heading: "Planning", body: "Maintenance windows can be dragged on the timeline to find slots that minimise operational impact. The planner shows aircraft availability gaps for each proposed window." },
    ],
  },
  "/cost-optimizer": {
    title: "Cost Optimizer",
    sections: [
      { heading: "Overview", body: "The Cost Optimizer analyses operational spending and identifies areas where routing, aircraft selection, or crew scheduling changes could reduce costs without impacting service levels." },
    ],
  },
  "/flight-planning": {
    title: "Flight Planning",
    sections: [
      { heading: "Overview", body: "Flight Planning integrates with AvPlan EFB (when connected) to provide route planning, fuel calculation, and weather release for all RFDS SE flights." },
      { heading: "Fuel calculation", body: "All fuel in the system is displayed in pounds (lb) for King Air aircraft. The planning tool calculates trip fuel, reserves, and alternate fuel in lb." },
      { heading: "ICAO identifiers", body: "Always use ICAO identifiers for aerodrome selection. Key identifiers: Walgett = YWLG, Wilcannia = YWCA, Dubbo = YDBO, Broken Hill = YBHI, Bankstown = YSBK." },
    ],
  },
  "/tech-log": {
    title: "Tech & Journey Log (PWA)",
    sections: [
      { heading: "Overview", body: "The standalone Tech & Journey Log PWA is an installable progressive web app optimised for tablet use in the aircraft. It provides a streamlined interface for journey log entries." },
      { heading: "Installing", body: "On iPad or iPhone, open the Tech Log URL in Safari, tap the Share button, then 'Add to Home Screen'. The app will then work offline." },
    ],
  },
};

// ─── Manual PDF page mapping (route → page number in medivac_user_manual.pdf) ─
// Page numbers extracted from PDF bookmarks.
export const MANUAL_PAGES: Record<string, number> = {
  "/": 5,                   // Demo Overview
  "/morning-brief": 7,      // The 8:45 — Chapter 2: Dashboards
  "/nept-tasking": 10,      // NEPT Tasking — Chapter 3: Missions
  "/missions": 11,          // Mission Board
  "/passenger-manifest": 10,// Passenger Manifest
  "/map": 11,               // NSW Flight Map
  "/dispatch": 10,          // Dispatch & Intake
  "/charter-quote": 14,     // Charter Quote — Chapter 4: Operations
  "/rest-calculator": 14,   // Crew Rest Calculator
  "/roster": 22,            // Crew Roster — Chapter 6: Crew & People
  "/frms": 22,              // Duty & FRMS
  "/aircraft": 18,          // Aircraft Status — Chapter 5: Assets
  "/engineering": 19,       // Engineering
  "/techlog": 18,           // Tech & Journey Log
  "/medical-equipment": 25, // Medical Equipment — Chapter 7: Clinical
  "/stock-usage": 25,       // Stock Usage & Orders
  "/check-training": 23,    // Check & Training
  "/invoicing": 31,         // Invoicing — Chapter 9: Business
  "/finance": 31,           // Fuel & Finance
  "/audit": 31,             // Audit & Reports
  "/ora": 15,               // Operational Risk Assessment
  "/mission-optimiser": 14, // Mission Optimiser
  "/ops-tasks": 15,         // Ops Task Management
  "/projects": 36,          // Project Management — Chapter 10: Administration
  "/pilot-handover": 18,    // Pilot Handover Board
  "/api-integrations": 35,  // API Integration Hub
  "/users": 35,             // User Management
  "/rbac": 35,              // RBAC Permissions
  "/settings": 35,          // System Settings
  "/after-hours": 25,       // After-Hours AI Med Line
  "/telehealth": 25,        // Telehealth Portal
  "/ai-analyst": 28,        // AI Mission Analyst — Chapter 8: AI & Comms
  "/doc-ai": 29,            // Document AI
  "/iso": 32,               // ISO Compliance
  "/contracts": 32,         // Contract Compliance
  "/special-missions": 12,  // Special Missions
  "/ferry": 12,             // Ferry Flights
  "/government-tenders": 32,// Government Tenders
  "/ground-vehicles": 19,   // Ground Vehicles
  "/maint-planner": 19,     // Maintenance Planner
  "/cost-optimizer": 31,    // Cost Optimizer
  "/flight-planning": 11,   // Flight Planning
  "/tech-log": 18,          // Tech & Journey Log PWA
  "/docs": 1,               // Document Library — opens manual at cover
};

// Build the PDF URL with a page fragment so PDF viewers jump to the right page
export function manualPageUrl(path: string): string {
  const page = MANUAL_PAGES[path] ?? 1;
  return `/medivac_user_manual.pdf#page=${page}`;
}


// Fallback for pages without specific content
const FALLBACK = {
  title: "Medivac.ai User Manual",
  sections: [
    { heading: "Welcome to Medivac.ai", body: "Medivac.ai is a comprehensive aeromedical operations platform built for RFDS SE. Use the sidebar navigation to access all modules." },
    { heading: "Getting help", body: "Each page has a Help button (?) that opens the relevant section of this manual. If you need further assistance, contact your Ops Manager or the system administrator." },
    { heading: "Reporting issues", body: "If you encounter a bug or unexpected behaviour, use the Project Management module to log it, or contact the Medivac.ai support team." },
  ],
};

interface HelpDrawerProps {
  path: string;
  onClose: () => void;
}

export default function HelpDrawer({ path, onClose }: HelpDrawerProps) {
  const content = MANUAL[path] ?? FALLBACK;
  const manualUrl = manualPageUrl(path);
  const manualPage = MANUAL_PAGES[path] ?? 1;
  const [open, setOpen] = useState<number[]>([0]); // first section open by default
  const [search, setSearch] = useState("");

  const filtered = content.sections.filter(s =>
    !search || s.heading.toLowerCase().includes(search.toLowerCase()) || s.body.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (i: number) => setOpen(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#1C1B19] border-l border-[#393836] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#393836] bg-[#01696F]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#01696F]/20 flex items-center justify-center">
              <BookOpen size={15} className="text-[#4F98A3]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#4F98A3] font-semibold uppercase tracking-wider">User Manual · Page {manualPage}</div>
              <div className="text-sm font-bold text-[#CDCCCA] truncate" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                {content.title}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={manualUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open manual at page ${manualPage}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#01696F]/20 hover:bg-[#01696F]/35 text-[#4F98A3] hover:text-[#6BBDC8] text-[10px] font-semibold transition-all border border-[#01696F]/30 hover:border-[#4F98A3]/50"
            >
              <ExternalLink size={10} />
              Open PDF · p.{manualPage}
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-[#797876] hover:text-[#CDCCCA] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5957]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search this section…"
              className="w-full pl-8 pr-3 py-2 bg-[#171614] border border-[#393836] rounded-lg text-xs text-[#CDCCCA] placeholder:text-[#5A5957] focus:outline-none focus:border-[#4F98A3]/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-[#5A5957] text-sm">No results found.</div>
          )}
          {filtered.map((s, i) => (
            <div key={i} className="rounded-xl border border-[#393836] overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-sm font-semibold text-[#CDCCCA]">{s.heading}</span>
                {open.includes(i)
                  ? <ChevronDown size={14} className="text-[#4F98A3] shrink-0" />
                  : <ChevronRight size={14} className="text-[#797876] shrink-0" />}
              </button>
              {open.includes(i) && (
                <div className="px-4 pb-4 text-xs text-[#797876] leading-relaxed border-t border-[#393836] pt-3">
                  {s.body}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#393836] flex items-center justify-between">
          <span className="text-[10px] text-[#5A5957]">Medivac.ai · Operator Manual · Draft 1 · July 2026</span>
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#4F98A3] hover:underline"
          >
            <ExternalLink size={9} /> Open full manual
          </a>
        </div>
      </div>
    </>
  );
}
