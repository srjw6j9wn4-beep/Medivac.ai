import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, BookOpen, FileText, AlertTriangle, Info } from "lucide-react";

// ── Data ───────────────────────────────────────────────────────────────────────
const REGS = [
  // ── CASR Part 121 ──────────────────────────────────────────────────────────
  {
    id: "121.005",
    part: "Part 121",
    title: "Application of Part 121",
    category: "General",
    severity: "info",
    text: "Part 121 applies to multi-engine aeroplanes with maximum operational passenger seats >9 OR maximum take-off weight >8,618 kg. This captures all RFDS King Air B200 and B350 operations. 'Air transport' expressly includes medical transport operations.",
    rfds: "All RFDS King Air and PC-24 operations are subject to Part 121. Aeromedical flights are explicitly classified as 'air transport'.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: null,
  },
  {
    id: "121.025",
    part: "Part 121",
    title: "Aeroplane to be flown under the IFR",
    category: "General",
    severity: "critical",
    text: "The operator and pilot in command each contravene this subregulation if, during any stage of the flight, the aeroplane is flown under the VFR.",
    rfds: "All RFDS Part 121 flights must be conducted IFR. VFR operations are prohibited for Part 121 operators.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.060",
    part: "Part 121",
    title: "Minimum Equipment List (MEL)",
    category: "Operational Documents",
    severity: "critical",
    text: "The operator contravenes this subregulation if, when the flight begins, there is no minimum equipment list for the aeroplane. A CASA-approved MEL is mandatory for every aircraft. MEL rectification categories: A (time stated in MEL entry), B (3 consecutive calendar days), C (10 consecutive calendar days), D (120 consecutive calendar days) — clock starts the day after defect discovery.",
    rfds: "Every RFDS aircraft must have a CASA-approved MEL on board. Defect deferral categories (A/B/C/D) determine the maximum period before rectification must occur.",
    source: "https://www.casa.gov.au/index.php/rules/changing-rules/flight-operations-regulations-transition/equipment-requirements-part-121-large-aeroplane-air-transport-operators-due-2-december-2023",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.065",
    part: "Part 121",
    title: "Duty Statement to be Available to Crew",
    category: "Operational Documents",
    severity: "info",
    text: "The operator must make a statement of each crew member's assigned duties available to them before they begin those duties.",
    rfds: "All RFDS crew must receive a duty statement before commencing duties. This is captured in the Medivac.ai roster and dispatch gates.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.085",
    part: "Part 121",
    title: "Carriage of Documents",
    category: "Flight Documents",
    severity: "critical",
    text: "The operator and pilot in command must ensure the following are carried on every flight: documents prescribed by the Part 121 Manual of Standards; flight crew medical certificates; flight crew licences. If medical certificates or licences cannot be carried, CASA must be notified in writing before the flight (or within 24 hours if impracticable before).",
    rfds: "Medical certificates and licences for all RFDS flight crew must be carried on every sector. Medivac.ai Dispatch Gate 3 (Crew) verifies currency before dispatch.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.105",
    part: "Part 121",
    title: "Journey Logs",
    category: "Flight Documents",
    severity: "critical",
    text: "Operator must prepare a journey log before every flight. PRE-FLIGHT mandatory fields: aircraft registration or flight number, date, crew names and assigned duties, place and time of departure, fuel added before flight, fuel on board at departure. POST-FLIGHT mandatory fields (as soon as practicable after landing): place of arrival, time flight ends, duration of flight, fuel in tanks at end, incidents and observations relevant to the flight (if any). Exception: information already recorded in the operational flight plan or readily available from another source satisfies the requirement.",
    rfds: "The RFDS Journey Log in Medivac.ai (rfds-techjourneylog.pplx.app) captures all mandatory fields. PIC sign-off is required before the aircraft is next operated. Fuel recorded in pounds (lb) for all King Air aircraft.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.110",
    part: "Part 121",
    title: "Passenger Lists / Medical Transport Lists",
    category: "Flight Documents",
    severity: "critical",
    text: "Required for both passenger transport AND medical transport operations. Must contain: registration mark or flight number, name of each passenger or patient, place of departure and destination for each, number of infants carried, date and estimated departure time.",
    rfds: "Every RFDS aeromedical flight requires a passenger/patient list. Patients are identified by Task ID only — no clinical information stored in the manifest. Escorts are recorded as passengers.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.120",
    part: "Part 121",
    title: "Procedures for Reporting and Recording Defects",
    category: "Defect Reporting",
    severity: "critical",
    text: "The operator's exposition must include procedures for crew to report and record: (a) an abnormal instrument indication; (b) abnormal behaviour by the aeroplane; (c) exceedance of an operating limit in the aircraft flight manual; (d) a defect in the aeroplane. This is Part 121's interface with the technical log requirements in CASR Part 42.",
    rfds: "All defects and abnormal indications must be entered in the Medivac.ai Flight Tech Log before the aircraft is next operated. Defects raised in-flight automatically flag the Engineering maintenance gate.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: null,
  },
  {
    id: "121.160",
    part: "Part 121",
    title: "Operational Control",
    category: "Dispatch",
    severity: "critical",
    text: "The operator's exposition must include procedures for determining how operational control for a flight is to be exercised and by whom.",
    rfds: "The regulatory basis for Medivac.ai's Six Dispatch Gate system. All six gates (Flight Plan, Weight & Balance, Weather Release, Maintenance, Medical Crew, Fuel) must be green before dispatch is authorised. Every gate action is time-stamped for CASA audit.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: null,
  },
  {
    id: "121.175",
    part: "Part 121",
    title: "Operational Flight Plans",
    category: "Flight Planning",
    severity: "critical",
    text: "The operator and pilot in command must prepare an operational flight plan before every flight, having regard to safety, performance, expected operating conditions, and meteorological conditions. Post-flight information must be recorded as soon as practicable after the flight ends.",
    rfds: "Medivac.ai Route Planner and Dispatch Gate 1 (Flight Plan) satisfy this requirement. Pre-flight and post-flight data is captured and time-stamped.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.245",
    part: "Part 121",
    title: "Medical Transport Operations — Applicability",
    category: "Medical Transport",
    severity: "info",
    text: "Division 121.D.7 applies to both passenger transport operations and medical transport operations. All provisions in this Division (regs 121.245–121.295) apply equally to RFDS aeromedical flights.",
    rfds: "RFDS aeromedical operations are explicitly captured by Division 121.D.7. All passenger/patient handling, briefing, and mobility requirements apply.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: null,
  },
  {
    id: "121.275",
    part: "Part 121",
    title: "Carriage of Passengers with Reduced Mobility",
    category: "Medical Transport",
    severity: "warning",
    text: "Specific requirements for the carriage of passengers with reduced mobility. Directly relevant to stretcher configurations, patient loading procedures, and restraint systems on RFDS aeromedical flights.",
    rfds: "RFDS aircraft configured for stretcher transport must comply with mobility restriction requirements. Patient loading procedures must be documented in the operator's exposition.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "121.320",
    part: "Part 121",
    title: "Procedures Relating to First-Aid Kits",
    category: "Medical Equipment",
    severity: "warning",
    text: "First-aid kits are required and must be carried in numbers scaled to passenger seat configuration: 0–100 seats = 1 kit; 101–200 = 2 kits; 201–300 = 3 kits. If departing from an aerodrome without replenishment facilities, sufficient kits must be carried for the flight duration.",
    rfds: "All RFDS aircraft must carry first-aid kits per their seat configuration. Remote western NSW operations often depart from aerodromes without replenishment facilities — carry sufficient kits for the full rotation.",
    source: "https://www.casa.gov.au/index.php/rules/changing-rules/flight-operations-regulations-transition/equipment-requirements-part-121-large-aeroplane-air-transport-operators-due-2-december-2023",
    penalty: null,
  },
  {
    id: "121.325",
    part: "Part 121",
    title: "Universal Precaution Kits",
    category: "Medical Equipment",
    severity: "warning",
    text: "The operator's exposition must include procedures relating to universal precaution kits. Required for all Part 121 passenger and medical transport operations — directly relevant to RFDS infectious disease and infection control protocols.",
    rfds: "Universal precaution kits (PPE, biohazard bags, eye protection, gloves) must be carried on all RFDS aeromedical flights. Tracked in the Medivac.ai Medical Equipment module.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: null,
  },
  {
    id: "121.330",
    part: "Part 121",
    title: "Emergency Medical Kits",
    category: "Medical Equipment",
    severity: "critical",
    text: "The operator's exposition must include procedures relating to emergency medical kits (doctor/medical-crew kits). First-aid oxygen is required for pressurised aeroplanes flown above FL250 carrying passengers.",
    rfds: "All RFDS aeromedical flights carry emergency medical kits. Aircraft operated above FL250 (King Air cruise altitude) must carry first-aid oxygen. Kit contents and expiry tracked in Medivac.ai Medical Equipment module.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: null,
  },
  {
    id: "121.495",
    part: "Part 121",
    title: "Pilot in Command Qualification",
    category: "Flight Crew",
    severity: "critical",
    text: "A pilot qualifies as PIC if: (a) they meet minimum flying experience in the operator's exposition; (b) they have successfully completed command training; (c) they are authorised as PIC under Part 61 (Australian-registered aircraft).",
    rfds: "All RFDS PICs must be authorised under Part 61 and have completed command training per the RFDS exposition. PIC qualification is verified in the Medivac.ai crew dispatch gate.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/s121.495.html",
    penalty: null,
  },
  // ── CASR Part 42 ───────────────────────────────────────────────────────────
  {
    id: "42.115",
    part: "Part 42",
    title: "Rectification of Defect Before Flight",
    category: "Defect Management",
    severity: "critical",
    text: "A defect must be rectified before the next flight unless deferral is permitted. Deferral is recorded in the Flight Technical Log where operation with the defect is permitted by the MEL, under a special flight permit, or subject to conditions/limitations stated in the deferral record.",
    rfds: "No RFDS aircraft may depart with an unresolved defect unless the defect is formally deferred per the MEL. Deferral is logged in the Medivac.ai Flight Tech Log with MEL category and rectification due date.",
    source: "https://amroba.org.au/wp-content/uploads/2015/08/part42-users-guide.pdf",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "42.220",
    part: "Part 42",
    title: "Flight Technical Log — Mandatory Requirement",
    category: "Technical Log",
    severity: "critical",
    text: "The CAMO (person responsible for continuing airworthiness) must maintain a Flight Technical Log for the aircraft at all times. The log must contain details identifying the aircraft (type, model, serial number, registration mark) and be capable of containing all information required under Part 42.",
    rfds: "Medivac.ai Flight Tech Log (rfds-techjourneylog.pplx.app) satisfies this requirement electronically. The log must be available at all times — SOP-OPS-004 governs the paper fallback process when the system is unavailable.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "42.225",
    part: "Part 42",
    title: "Availability of Flight Technical Log",
    category: "Technical Log",
    severity: "critical",
    text: "The Flight Technical Log must be available to: (a) the pilot in command while acting as PIC; and (b) any person carrying out maintenance on the aircraft.",
    rfds: "The Medivac.ai Flight Tech Log is accessible via the app to all PIC-qualified crew. Engineers access the log via the Engineering module. During system outage, the paper log (SOP-OPS-004) must be available to the PIC before departure.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "42.220-pic",
    part: "Part 42",
    title: "PIC Post-Flight Recording Obligations",
    category: "Technical Log",
    severity: "critical",
    text: "Before the aircraft is next operated, the PIC must record in the Flight Technical Log: (1) aircraft time in service for the flight; (2) details of any defect discovered during operation; (3) any abnormal instrument indication; (4) any abnormal aircraft handling; (5) any abnormal aircraft behaviour; (6) any exceedance of a flight manual operating limit. A Certificate of Release to Service (CRS) from the LAME must also be included in the log.",
    rfds: "All six items must be captured in the Medivac.ai Flight Tech Log before the aircraft's next departure. The LAME Tech Stamp (CRS) is recorded in the Maintenance Release section. Fuel on board is recorded in pounds (lb) for all King Air aircraft.",
    source: "https://amroba.org.au/wp-content/uploads/2015/08/part42-users-guide.pdf",
    penalty: "50 penalty units — strict liability",
  },
  {
    id: "42.260",
    part: "Part 42",
    title: "Retention of Technical Log Records",
    category: "Technical Log",
    severity: "warning",
    text: "Flight Technical Log records must be retained for 1 year after the creation date of the record.",
    rfds: "Medivac.ai Flight Tech Log entries are retained in the database indefinitely (exceeding the minimum 1-year requirement). Records are exportable for CASA audit at any time.",
    source: "https://classic.austlii.edu.au/au/legis/cth/consol_reg/casr1998333/s42.260.html",
    penalty: "50 penalty units — strict liability",
  },
  // ── CAO 48.1 ───────────────────────────────────────────────────────────────
  {
    id: "CAO-48.1",
    part: "CAO 48.1",
    title: "Fatigue Management — General",
    category: "Fatigue & Duty Time",
    severity: "critical",
    text: "Fatigue management for Part 121 flight crew is governed by Civil Aviation Order 48.1, not by a Part 121 subpart. Three regulatory tiers: Basic (prescriptive limits, no enhanced risk process required); Enhanced Fatigue Management (more flexible limits, requires operator risk-management processes and continuous monitoring); Fatigue Risk Management System (FRMS — most flexible, requires CASA-approved FRMS). Operators must not assign a duty to a crew member they reasonably believe is unfit due to fatigue.",
    rfds: "RFDS SE Pilots Agreement 2025 specifies EBA fatigue limits which operate alongside CAO 48.1. The most restrictive applicable limit always applies. Medivac.ai Duty & FRMS module tracks cumulative hours against both EBA and CAO 48.1 limits and displays breach warnings when limits are at risk.",
    source: "https://www.casa.gov.au/sites/default/files/2021-08/plain-english-guide-for-fatigue-management-rules-print-version.pdf",
    penalty: null,
  },
  {
    id: "CAO-48.1-ext",
    part: "CAO 48.1",
    title: "FDP Extension and Controlled Rest",
    category: "Fatigue & Duty Time",
    severity: "warning",
    text: "Any FDP or flight time limit may be extended by up to 1 hour if unforeseen operational circumstances arise, the extension is operationally necessary, and the crew member considers themselves fit — subject to not exceeding cumulative flight time limits. The PIC retains authority under CASR 91.215 to decline a permitted extension. Controlled rest on the flight deck is permitted: maximum 40 minutes, cruise phase only (top of climb to 20 minutes before planned top of descent), non-resting pilot holds full PIC duties throughout.",
    rfds: "FDP extensions require the PIC to confirm they consider themselves fit. Any extension must be logged. Controlled rest must not be used when the non-resting pilot's duty hours are approaching limits.",
    source: "https://www.casa.gov.au/sites/default/files/2021-08/plain-english-guide-for-fatigue-management-rules-print-version.pdf",
    penalty: null,
  },
  // ── CASR Part 92 ───────────────────────────────────────────────────────────
  {
    id: "Part-92",
    part: "Part 92",
    title: "Dangerous Goods — Aeromedical Operations",
    category: "Dangerous Goods",
    severity: "warning",
    text: "CASR Part 92 governs the consignment and carriage of dangerous goods by air, applying concurrently with Part 121. RFDS aeromedical operations frequently carry: compressed medical oxygen (UN1072, Class 2.2 non-flammable gas), lithium batteries in medical devices (Class 9 miscellaneous dangerous goods), and other items that may be classified as dangerous goods. Part 92 governs documentation, packaging, marking, labelling, and stowage.",
    rfds: "All RFDS aircraft carrying medical oxygen cylinders or lithium-battery medical devices must comply with Part 92 packaging and documentation requirements. Crew must be trained in dangerous goods recognition and incident reporting per Part 92.",
    source: "https://www.casa.gov.au/rules/regulatory-framework/casr/part-92-casr-consignment-and-carriage-dangerous-goods-air",
    penalty: null,
  },
  // ── RFDS Journey Log / SOP ─────────────────────────────────────────────────
  {
    id: "SOP-OPS-004",
    part: "RFDS SOP",
    title: "Manual Tech Log Fallback Process",
    category: "Tech Log Fallback",
    severity: "warning",
    text: "SOP-OPS-004 governs the mandatory process for maintaining airworthiness records and journey log compliance when the Medivac.ai electronic tech log system is unavailable. Fallback is triggered when: the app URL is unreachable; the server returns 5xx errors or no response within 30 seconds; the New Entry form fails to save after two attempts; the duty supervisor declares a system outage; or planned maintenance is announced. Safety of flight takes absolute precedence — never delay a medical evacuation due to system unavailability. Paper records must be backfilled into the electronic system within 2 hours of restoration. Reconciliation checklist must be completed by the duty supervisor.",
    rfds: "RFDS SE Fleet covered by SOP-OPS-004: VH-MVW, VH-MWH, VH-XYU, VH-MVX, VH-MWK, VH-VPQ, VH-MQD, VH-NAJ, VH-MQK, VH-XYR, VH-LTQ. Applies to all bases: Dubbo, Broken Hill, Bankstown, and all outstations.",
    source: "https://rfds-techjourneylog.pplx.app",
    penalty: null,
  },

  // ── EBA — Pilots Agreement 2025 ────────────────────────────────────────────
  {
    id: "EBA-P-001",
    part: "EBA",
    title: "Pilots EBA — Flight Time Limits",
    category: "EBA — Pilots",
    severity: "critical",
    text: "Pilots Agreement 2025 (approved 5 Nov 2025, expires 30 Jun 2028). Flight time limits: (a) Maximum 100 hours in any 30 consecutive days. (b) Maximum 900 hours in any 365 consecutive days. (c) Flight instruction: maximum 6 hours per tour of duty. (d) In-progress tour may be extended to the CAO 48.1 maximum. After an extension, minimum ground rest is 9 consecutive hours (including 2200–0600 local) plus 1 additional hour for every 15 minutes flight time exceeded beyond 8 hours; or 10 consecutive hours plus the same extension formula. Most restrictive of EBA and CAO 48.1 always applies.",
    rfds: "Medivac.ai Duty & FRMS module tracks cumulative flight hours against both the 100/30-day and 900/365-day EBA limits in real time. A crew member whose projected duty would breach either limit is flagged at dispatch before the task is accepted. Captains may not roster themselves or be rostered beyond these limits regardless of operational pressure.",
    source: "https://www.fwc.gov.au/documents/agreements/fwa/AE530925.pdf",
    penalty: "Breach of EBA flight time limits constitutes a Fair Work Act contravention and may also trigger CASA enforcement action under Part 121.",
  },
  {
    id: "EBA-P-002",
    part: "EBA",
    title: "Pilots EBA — Rostering & Availability",
    category: "EBA — Pilots",
    severity: "warning",
    text: "Rosters are compiled over 28-day or monthly periods, published at least 28 days before the roster period commences. Maximum rostered availability: 168 hours per 28-day cycle, averaged over up to 3 consecutive roster cycles. Can be increased to 192 hours per 28-day cycle when pilot attrition or service growth is declared. Standby at home, reserve duty days, leave and directed duties all count toward the 168-hour cap. No Employee will be required to work on a rostered day off without consent. Overtime or a substitute day off must be arranged within one month for any RDO worked.",
    rfds: "RFDS SE roster builders must apply the 168-hour cap at build time. Medivac.ai AeroRoster enforces this cap during roster generation and highlights any pilot approaching the 192-hour emergency threshold. The 28-day publication lead time must be met before the roster is released to crew.",
    source: "https://www.fwc.gov.au/documents/agreements/fwa/AE530925.pdf",
    penalty: null,
  },
  {
    id: "EBA-P-003",
    part: "EBA",
    title: "Pilots EBA — Ordinary Hours & Overtime",
    category: "EBA — Pilots",
    severity: "info",
    text: "Ordinary hours are 38 hours per week plus 4 additional hours per week included in base salary, averaged over 12 months. Overtime is payable when: (i) an Employee works a rostered day off at RFDSSE request; (ii) an Employee works beyond the 168-hour maximum rostered availability; (iii) duty extends 30 minutes beyond the rostered finish. Overtime alternative: substitute rostered day off arranged within one month. Wages paid fortnightly by EFT no later than the Friday of the pay processing week.",
    rfds: "Base salary already incorporates the 4 additional hours per week. Any RDO work or availability cap breach must be documented in Medivac.ai and authorised by the HOFO before the next pay cycle.",
    source: "https://www.fwc.gov.au/documents/agreements/fwa/AE530925.pdf",
    penalty: null,
  },
  {
    id: "EBA-P-004",
    part: "EBA",
    title: "Pilots EBA — Annual Leave",
    category: "EBA — Pilots",
    severity: "info",
    text: "Seven-day shift roster employees: 42 days annual leave per year (inclusive of rostered days off, weekends and public holidays). Five-day (Mon–Fri) employees: 28 days annual leave per year inclusive of weekends. Annual leave loading is absorbed into total remuneration. Employees may take 2 rostered days off immediately before or after two annual leave periods per year. Excessive accrual: RFDSSE may direct leave where accrual exceeds threshold after 8 weeks notice. Leave for periods less than 7 days is applied to duty days only.",
    rfds: "Leave entitlements are tracked in the Medivac.ai roster module. Seven-day roster crew accrue 42 days; five-day crew accrue 28 days. Annual leave loading is not paid separately — it is included in base salary. Line managers must not unreasonably refuse leave requests.",
    source: "https://www.fwc.gov.au/documents/agreements/fwa/AE530925.pdf",
    penalty: null,
  },
  {
    id: "EBA-P-005",
    part: "EBA",
    title: "Pilots EBA — Allowances",
    category: "EBA — Pilots",
    severity: "info",
    text: "Allowances payable under the Pilots Agreement 2025: (1) Loss of Licence Insurance — RFDSSE reimburses premiums on production of proof of payment, or provides cover on Employee request via HOFO email (GST component included). (2) ATPL Allowance — paid where Employee is required by RFDSSE to hold an Airline Transport Pilots Licence or CPL with ATPL subject passes. (3) Drum Refuelling Allowance — per-event payment when Employee is required to load drum fuel onto the aircraft. (4) Medical Examination — RFDSSE bears cost of all requested medicals; travel allowance paid if no accredited examiner is available in the base town. Allowance values are set out in Schedule A.2.3 of the Agreement.",
    rfds: "Loss of licence insurance is a priority allowance for all RFDS SE pilots — ensure cover is current and reimbursement claims are lodged within 4 weeks of payment. Drum refuelling events should be logged in Medivac.ai for allowance processing.",
    source: "https://www.fwc.gov.au/documents/agreements/fwa/AE530925.pdf",
    penalty: null,
  },

  // ── EBA — Nurses Agreement 2023 ────────────────────────────────────────────
  {
    id: "EBA-N-001",
    part: "EBA",
    title: "Nurses EBA — Hours of Work & Rostering",
    category: "EBA — Nurses",
    severity: "warning",
    text: "Day Workers: ordinary hours between 0700–1900 Mon–Fri, maximum 10 hours per day exclusive of meal breaks. Total 38 hours/week or 152 hours/28 days. Shift Workers: RFDSSE operates 24/7. Ordinary hours average 38 hours/week over 56 days. Shift Workers receive 28 days free from duty in each 56-day cycle. Maximum shift: 12 hours. Rosters published at least 28 days before commencement. Roster changes by mutual agreement or by consultation per clause 13. Rostered hours must not be swapped without line manager approval.",
    rfds: "RFDS SE nursing staff rostered as Shift Workers accrue 28 days free from duty per 56-day cycle. Any roster change affecting overtime eligibility entitles the employee to choose time off in lieu. All roster swaps must be line manager approved — self-arranged swaps without approval are not recognised under the EBA.",
    source: "https://www.fwc.gov.au",
    penalty: null,
  },
  {
    id: "EBA-N-002",
    part: "EBA",
    title: "Nurses EBA — Fatigue Management",
    category: "EBA — Nurses",
    severity: "critical",
    text: "Nurses must commence work free of fatigue, illness, medication, alcohol or any drug that may adversely impact patient care. Minimum rest between shifts: 10 hours (or 8 hours by agreement). If an employee is required to start their next shift before the rest period has elapsed, they may commence late without loss of pay. If a shift commences without the required rest period, overtime at 200% of Base Hourly Rate applies until the full rest period is provided. Shift Workers accommodated away from home must be provided suitable sleeping accommodation by RFDSSE. Employees must contact their line manager when fatigue management needs to be implemented.",
    rfds: "This is a patient safety critical requirement. No RFDS SE nurse should commence a clinical shift without the minimum rest period. The 200% overtime penalty for breach is automatic — line managers must ensure rest compliance before releasing crew for a subsequent shift. Any fatigue concern must be escalated immediately.",
    source: "https://www.fwc.gov.au",
    penalty: "Breach of minimum rest provisions triggers automatic 200% overtime penalty rate until full rest is provided.",
  },
  {
    id: "EBA-N-003",
    part: "EBA",
    title: "Nurses EBA — Allowances",
    category: "EBA — Nurses",
    severity: "info",
    text: "Years of Service Allowance: after 5 years' continuous service with RFDSSE, $2,000 per year paid at $76.92 per fortnight. Work Mobile Phone Allowance: $18.46 per fortnight where employee is required to provide their own mobile phone or electronic device for operational communications. All allowances are for full-time employees; part-time employees receive pro-rata amounts. Casual employees are not entitled to these allowances. RFDSSE uniforms are compulsory for all operational employees; cleaning and maintenance is the employee's responsibility.",
    rfds: "Service allowance eligibility is tracked from commencement date. Employees approaching 5-year service milestones should be flagged for allowance activation in the payroll cycle.",
    source: "https://www.fwc.gov.au",
    penalty: null,
  },
  {
    id: "EBA-N-004",
    part: "EBA",
    title: "Nurses EBA — Annual Leave",
    category: "EBA — Nurses",
    severity: "info",
    text: "RFDSSE encourages all employees to take annual leave as it accrues. Line managers will not unreasonably refuse leave requests or requests to vary leave dates. Direction to take leave: RFDSSE may direct leave by giving at least 8 weeks notice (i) as part of an operational close-down; or (ii) where a Shift Worker has more than 12 weeks accrued or a Day Worker has more than 10 weeks accrued. Shift Workers must be provided 28 days free from duty per 56-day cycle which forms part of leave entitlements.",
    rfds: "Leave management for nursing staff must be proactive — excess accruals beyond 12 weeks (Shift) or 10 weeks (Day) may be directed at 8 weeks notice. Line managers are required to facilitate leave, not refuse it. Leave accruals are visible in the Medivac.ai roster module.",
    source: "https://www.fwc.gov.au",
    penalty: null,
  },

  // ── EBA — Engineering Agreement 2025 ───────────────────────────────────────
  {
    id: "EBA-E-001",
    part: "EBA",
    title: "Engineering EBA — Ordinary Hours & Rostering",
    category: "EBA — Engineering",
    severity: "info",
    text: "Ordinary hours: average 38 hours/week, not exceeding 152 hours in 28 days, maximum 16 hours in any single day. Hours may be worked Monday to Friday continuously (excluding meal breaks) between 0500–1900 at RFDSSE discretion. Work outside the ordinary spread is paid at overtime rates. Rostering arrangements agreed between RFDSSE and majority of employees for the enterprise or part thereof, without precluding individual agreements. Any changes to regular rosters or ordinary hours require consultation per clause 37. Alternate work practices detailed in Schedule C.",
    rfds: "Engineering staff at RFDS SE bases work within the 0500–1900 ordinary hours window. Any work directed outside these hours (e.g. AOG night recovery) must be paid at overtime rates — LAME authorisation for after-hours work should be documented in Medivac.ai maintenance records.",
    source: "https://www.fwc.gov.au",
    penalty: null,
  },
  {
    id: "EBA-E-002",
    part: "EBA",
    title: "Engineering EBA — LAME On-Call",
    category: "EBA — Engineering",
    severity: "warning",
    text: "LAMEs holding appropriate licences and qualifications are required to participate in the annual on-call roster (resets 1 July each year). When rostered on-call, the LAME must be available after ordinary hours until released by the Senior Base Engineer, and remain contactable on the RFDSSE-supplied mobile phone throughout the on-call period. On-call loading: 14.06% of LAME/Senior Base Engineer salary and licence payments — this is included in base salary and Schedule B licence payments (not paid separately). A separate on-call allowance is paid per day rostered on-call based on number of LAMEs participating.",
    rfds: "On-call LAME coverage is critical for RFDS SE airworthiness continuity. The annual roster reset on 1 July must be coordinated by the Chief Engineer. LAMEs must carry the RFDSSE mobile and remain within reasonable callout distance during their on-call period. On-call rosters are visible in Medivac.ai Maintenance Planner.",
    source: "https://www.fwc.gov.au",
    penalty: null,
  },
  {
    id: "EBA-E-003",
    part: "EBA",
    title: "Engineering EBA — Licence Payments & Authority Allowances",
    category: "EBA — Engineering",
    severity: "info",
    text: "Employees required by RFDSSE to hold a current Part 66 CASR licence (Category B1 or B2) appropriate to an RFDS aircraft type are entitled to licence payments and authority allowances per Schedule B.2. 'Aircraft type' means the same ICAO 4-letter designator or same CAA endorsement group. Payments apply for all purposes of the Agreement (i.e. included in overtime and leave calculations). Licence payments in Schedule B.2 are inclusive of the 14.06% on-call loading. Company Authorisations (RFDSSE Company Auth) are issued wholly at RFDSSE discretion based on assessed skills against QSI ENG-005 and operational need.",
    rfds: "RFDS SE LAMEs must hold current Part 66 endorsements for all aircraft types they maintain (B200, B350, PC-24). Licence payment eligibility is verified annually. Company Authorisations do not automatically follow the EBA payment schedule — they are discretionary. Ensure licence currency is tracked in Medivac.ai and CASA endorsement renewals are not allowed to lapse.",
    source: "https://www.fwc.gov.au",
    penalty: "Performing maintenance without a current Part 66 CASR endorsement is a CASA regulatory breach independent of the EBA.",
  },
];

const PARTS = ["All", "Part 121", "Part 42", "CAO 48.1", "Part 92", "RFDS SOP", "EBA"];
const CATEGORIES = ["All", "General", "Operational Documents", "Flight Documents", "Flight Planning", "Dispatch", "Defect Reporting", "Defect Management", "Technical Log", "Tech Log Fallback", "Medical Transport", "Medical Equipment", "Flight Crew", "Fatigue & Duty Time", "Dangerous Goods", "EBA — Pilots", "EBA — Nurses", "EBA — Engineering"];

const SEVERITY_CONFIG = {
  critical: { label: "Critical", bg: "bg-red-900/40", border: "border-red-700/60", badge: "bg-red-800 text-red-100", dot: "bg-red-400" },
  warning:  { label: "Important", bg: "bg-amber-900/30", border: "border-amber-700/50", badge: "bg-amber-800 text-amber-100", dot: "bg-amber-400" },
  info:     { label: "Reference", bg: "bg-blue-900/20", border: "border-blue-700/40", badge: "bg-blue-800 text-blue-100", dot: "bg-blue-400" },
};

const PART_COLOURS: Record<string, string> = {
  "Part 121": "bg-teal-800/60 text-teal-200 border-teal-600/50",
  "Part 42":  "bg-purple-800/60 text-purple-200 border-purple-600/50",
  "CAO 48.1": "bg-orange-800/60 text-orange-200 border-orange-600/50",
  "Part 92":  "bg-yellow-800/60 text-yellow-200 border-yellow-600/50",
  "RFDS SOP": "bg-cyan-800/60 text-cyan-200 border-cyan-600/50",
  "EBA": "bg-rose-800/60 text-rose-200 border-rose-600/50",
};

export default function Regulations() {
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState("All");
  const [selectedCat, setSelectedCat] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = REGS.filter((r) => {
    const q = search.toLowerCase();
    // Keyword aliases — common search terms map to relevant content
    const aliases: Record<string, string[]> = {
      "annual check": ["proficiency", "line check"],
      "eba": ["pilots agreement", "nurses", "engineering enterprise", "enterprise agreement"],
      "leave": ["annual leave", "personal leave", "carer"],
      "sick leave": ["personal leave", "carer"],
      "overtime": ["overtime", "penalty"],
      "on call": ["on-call", "lame"],
      "licence": ["licence", "atpl", "lame"],
      "drum fuel": ["drum refuelling"],
      "rest": ["rest period", "fatigue"],
      "shift": ["shift worker", "rostering"],
    };
    const expandedQ = aliases[q] ? [q, ...aliases[q]] : [q];
    const matchesSearch =
      !q ||
      expandedQ.some(term =>
        r.id.toLowerCase().includes(term) ||
        r.title.toLowerCase().includes(term) ||
        r.text.toLowerCase().includes(term) ||
        r.rfds.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term)
      );
    const matchesPart = selectedPart === "All" || r.part === selectedPart;
    const matchesCat = selectedCat === "All" || r.category === selectedCat;
    return matchesSearch && matchesPart && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-foreground">Regulatory Reference</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          CASR Part 121 · Part 42 · CAO 48.1 · Part 92 · RFDS SOP — searchable compliance reference for RFDS aeromedical operations
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Part 121 regulations", count: REGS.filter(r => r.part === "Part 121").length, colour: "text-teal-400" },
          { label: "Part 42 (Tech Log)", count: REGS.filter(r => r.part === "Part 42").length, colour: "text-purple-400" },
          { label: "CAO 48.1 (Fatigue)", count: REGS.filter(r => r.part === "CAO 48.1").length, colour: "text-orange-400" },
          { label: "Part 92 & RFDS SOP", count: REGS.filter(r => r.part === "Part 92" || r.part === "RFDS SOP").length, colour: "text-cyan-400" },
          { label: "EBA Clauses", count: REGS.filter(r => r.part === "EBA").length, colour: "text-rose-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
            <span className={`text-lg font-bold ${s.colour}`}>{s.count}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs text-red-300">{REGS.filter(r => r.severity === "critical").length} critical compliance items</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="input-reg-search"
            placeholder="Search regulations, topics, or RFDS notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PARTS.map(p => (
            <button
              key={p}
              data-testid={`button-part-${p}`}
              onClick={() => setSelectedPart(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                selectedPart === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            data-testid={`button-cat-${cat}`}
            onClick={() => setSelectedCat(cat)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors ${
              selectedCat === cat
                ? "bg-primary/20 text-primary border-primary/50"
                : "bg-card text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {REGS.length} regulations
        {search && ` matching "${search}"`}
      </p>

      {/* Regulation cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>No regulations match your search.</p>
          </div>
        )}
        {filtered.map((reg) => {
          const sev = SEVERITY_CONFIG[reg.severity as keyof typeof SEVERITY_CONFIG];
          const isOpen = expanded === reg.id;
          return (
            <div
              key={reg.id}
              data-testid={`card-reg-${reg.id}`}
              className={`rounded-lg border ${sev.bg} ${sev.border} overflow-hidden transition-all`}
            >
              {/* Card header — always visible */}
              <button
                data-testid={`button-expand-${reg.id}`}
                className="w-full text-left px-5 py-4 flex items-start gap-4"
                onClick={() => setExpanded(isOpen ? null : reg.id)}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-foreground">{reg.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${PART_COLOURS[reg.part] || "bg-muted text-muted-foreground border-border"}`}>
                      {reg.part}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${sev.badge}`}>
                      {sev.label}
                    </span>
                    <span className="text-xs text-muted-foreground bg-card/50 border border-border/50 px-2 py-0.5 rounded">
                      {reg.category}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{reg.title}</p>
                  {!isOpen && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reg.text}</p>
                  )}
                </div>
                <span className="text-muted-foreground text-xs mt-1 flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-5 space-y-4">
                  {/* Regulation text */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={11} /> Regulation Text
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{reg.text}</p>
                  </div>

                  {/* RFDS relevance */}
                  <div className="bg-card/60 border border-border/50 rounded-md p-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Info size={11} /> RFDS Relevance
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{reg.rfds}</p>
                  </div>

                  {/* Penalty */}
                  {reg.penalty && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-300 font-medium">{reg.penalty}</p>
                    </div>
                  )}

                  {/* Source link */}
                  <a
                    href={reg.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-source-${reg.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink size={11} />
                    View official source
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="bg-card/40 border border-border/40 rounded-lg p-4 mt-8">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Regulatory Disclaimer:</strong> This reference is compiled from CASR 1998 (consolidated), CAO 48.1, and CASA guidance materials as at July 2026. It is provided for operational reference only and does not constitute legal advice. Always confirm compliance requirements against the current in-force legislation at{" "}
          <a href="https://www.legislation.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">legislation.gov.au</a>{" "}
          and your operator's CASA-approved exposition. In the event of any conflict, the current in-force legislation and your exposition take precedence.
        </p>
      </div>
    </div>
  );
}
