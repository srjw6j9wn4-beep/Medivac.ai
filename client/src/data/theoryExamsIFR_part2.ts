/**
 * IFR Theory Exam Bank — Part 2
 * RFDS South Eastern Section — Medivac.ai
 *
 * Covers CASA Form 61-1503 Ground Theory syllabus topics (j) through (q)
 * for the Instrument Rating theory examination programme:
 *
 *   (j) IFR procedures for all airspace classifications
 *   (k) Departure and approach instrument procedures
 *   (l) Operations below LSALT and MSA for day and night
 *   (m) GNSS and PBN standards
 *   (n) Circling approaches
 *   (o) Adverse weather operations
 *   (p) ERSA normal and emergency procedures
 *   (q) IFR planning
 *
 * Pass mark: 70%   Duration: 30 min per exam   Questions: 15 per exam
 */

import { Exam, ExamQuestion } from "./theoryExams";

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (j) — IFR procedures for all airspace classifications
// Source: AIP ENR 1.4; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examJQuestions: ExamQuestion[] = [
  {
    id: "ifr-j-q01",
    question: "In Australian Class A airspace, what type of traffic is permitted to operate?",
    options: [
      "IFR and VFR traffic, separated by ATC",
      "IFR traffic only, with full ATC separation provided between all aircraft",
      "VFR traffic only, above 10,000 ft",
      "IFR traffic with no separation service, self-separation applies",
    ],
    correctIndex: 1,
    explanation: "Class A airspace is IFR only. All aircraft operating in Class A receive a full ATC separation service from all other traffic — VFR flight is not permitted.",
    source: "AIP ENR 1.4 — Airspace Classifications, Class A",
  },
  {
    id: "ifr-j-q02",
    question: "An IFR flight is operating in Class C airspace. What is required before entry?",
    options: [
      "Only a position report abeam the boundary",
      "An ATC clearance, which must be obtained and complied with prior to entry",
      "Nothing — Class C only requires two-way radio contact",
      "A SARTIME lodged with ATC",
    ],
    correctIndex: 1,
    explanation: "Class C airspace requires an ATC clearance for both IFR and VFR aircraft prior to entry. IFR aircraft receive separation from all other IFR and VFR traffic within Class C.",
    source: "AIP ENR 1.4 — Airspace Classifications, Class C",
  },
  {
    id: "ifr-j-q03",
    question: "In Class D airspace, what separation is provided to an IFR aircraft?",
    options: [
      "No separation service — traffic information only",
      "Separation from other IFR traffic, and traffic information (with avoidance advice on request) in relation to VFR traffic",
      "Full separation from all IFR and VFR traffic identical to Class C",
      "Separation from VFR traffic only",
    ],
    correctIndex: 1,
    explanation: "In Class D airspace, ATC separates IFR aircraft from other IFR traffic and provides traffic information on VFR traffic, with avoidance advice available on request. VFR aircraft are not separated from each other.",
    source: "AIP ENR 1.4 — Airspace Classifications, Class D",
  },
  {
    id: "ifr-j-q04",
    question: "What ATC service does an IFR aircraft receive in Class E airspace with respect to VFR traffic?",
    options: [
      "Full separation identical to IFR-IFR separation",
      "Traffic information only where the VFR aircraft is known to ATC — no separation is provided from VFR traffic",
      "No service of any kind is provided in Class E",
      "IFR aircraft are separated from VFR traffic above FL180 only",
    ],
    correctIndex: 1,
    explanation: "Class E airspace provides IFR-to-IFR separation, but IFR aircraft are not separated from VFR traffic. Traffic information is passed when the VFR traffic is known to ATC (e.g. via a flight plan or SSR), but see-and-avoid remains the primary defence.",
    source: "AIP ENR 1.4 — Airspace Classifications, Class E",
  },
  {
    id: "ifr-j-q05",
    question: "An IFR flight is operating in Class G airspace below 10,000 ft. What separation service does the aircraft receive from other traffic?",
    options: [
      "Full radar separation from all traffic",
      "None — Class G is uncontrolled airspace; ATC provides no separation service and the pilot is responsible for traffic avoidance",
      "IFR-IFR separation only, as in Class E",
      "Separation is provided but only at night",
    ],
    correctIndex: 1,
    explanation: "Class G is uncontrolled airspace. No ATC separation service is provided to any traffic — IFR or VFR. Pilots operating IFR in Class G rely on procedural separation (e.g. broadcasting position on the area frequency) and see-and-avoid.",
    source: "AIP ENR 1.4 — Airspace Classifications, Class G",
  },
  {
    id: "ifr-j-q06",
    question: "What is the maximum indicated airspeed permitted below 10,000 ft AMSL for an IFR aircraft in Australian airspace, unless otherwise authorised?",
    options: [
      "200 KIAS",
      "230 KIAS",
      "250 KIAS",
      "280 KIAS",
    ],
    correctIndex: 2,
    explanation: "Unless otherwise authorised by ATC or the aircraft's approved flight manual limitations require a lower speed, the maximum speed below 10,000 ft AMSL is 250 KIAS.",
    source: "CASR Part 91.347 — Speed Limits",
  },
  {
    id: "ifr-j-q07",
    question: "What are the basic VMC criteria that distinguish VFR from IFR flight conditions in controlled airspace above 3,000 ft AMSL?",
    options: [
      "Flight visibility 5 km, clear of cloud",
      "Flight visibility 8 km, and specified vertical/horizontal distances from cloud (1,000 ft vertically, 1,500 m horizontally)",
      "Flight visibility 3 km, in sight of the surface",
      "There is no VMC criteria above 3,000 ft",
    ],
    correctIndex: 1,
    explanation: "Above 3,000 ft AMSL (or 1,000 ft AGL, whichever is higher) in most controlled airspace, VMC requires flight visibility of at least 8 km and distance from cloud of at least 1,000 ft vertically and 1,500 m horizontally. If these are not met, IMC exists and IFR procedures apply.",
    source: "AIP ENR 1.4 — VMC Criteria Table; CASR Part 91",
  },
  {
    id: "ifr-j-q08",
    question: "An IFR aircraft is in IMC while transiting Class G airspace. What is the minimum requirement for the pilot regarding radio communication?",
    options: [
      "No radio requirement in Class G at any time",
      "The aircraft must broadcast position, level, and intentions on the area VHF frequency at appropriate points, even though no ATC clearance is required",
      "A clearance must be obtained exactly as in Class C",
      "Radio contact is only required within 10 NM of a CTAF",
    ],
    correctIndex: 1,
    explanation: "While no ATC clearance is required to operate IFR in Class G, pilots must maintain a listening watch and make position/level/intentions broadcasts on the area frequency, particularly at boundary crossings and reporting points, to support procedural traffic separation.",
    source: "AIP ENR 1.4 — Class G Procedures; AIP ENR 1.1",
  },
  {
    id: "ifr-j-q09",
    question: "What is the primary characteristic that distinguishes Class C from Class D airspace in terms of VFR traffic separation from IFR aircraft?",
    options: [
      "There is no difference — both provide identical separation",
      "In Class C, IFR aircraft are separated from VFR traffic; in Class D, IFR aircraft only receive traffic information (with avoidance advice on request) regarding VFR traffic",
      "Class D provides greater separation standards than Class C",
      "Class C has no VFR traffic permitted at all",
    ],
    correctIndex: 1,
    explanation: "Class C provides full separation between IFR and VFR traffic. Class D only requires IFR-IFR separation; VFR traffic is given traffic information to IFR flights, with avoidance advice available on request, but not full separation.",
    source: "AIP ENR 1.4 — Airspace Classifications Comparison Table",
  },
  {
    id: "ifr-j-q10",
    question: "Above what level does Class A airspace generally commence in most of the Australian FIR (outside specific lower designations)?",
    options: [
      "FL180",
      "FL125",
      "10,000 ft AMSL",
      "FL200",
    ],
    correctIndex: 0,
    explanation: "Class A airspace in Australia generally commences at FL180 and extends upward, encompassing the majority of high-level en route airspace, with all traffic required to operate IFR.",
    source: "AIP ENR 1.4 — Vertical Structure of Australian Airspace",
  },
  {
    id: "ifr-j-q11",
    question: "An IFR flight requests to operate VFR-on-top through Class E airspace. Is this permitted under Australian procedures?",
    options: [
      "Yes, VFR-on-top is a standard clearance option in Australia identical to the US NAS",
      "No — Australia does not have a 'VFR-on-top' clearance; an aircraft operating on an IFR flight plan remains IFR unless it cancels IFR and reverts to VFR entirely",
      "Only above FL200",
      "Only in Class C airspace",
    ],
    correctIndex: 1,
    explanation: "Unlike the US system, Australian procedures do not provide a 'VFR-on-top' clearance. An aircraft is either operating IFR or VFR; a pilot may cancel IFR (SARTIME/flight notification permitting) and continue under VFR, but cannot hold a hybrid clearance.",
    source: "AIP ENR 1.4; CASR Part 91 — Flight Rules",
  },
  {
    id: "ifr-j-q12",
    question: "What action must an IFR pilot take before entering Class D airspace without a clearance already issued?",
    options: [
      "Simply enter and report once established",
      "Establish two-way communication and obtain a clearance from the responsible ATC unit prior to entry into the Class D steps",
      "No requirement — entry is permitted if broadcasting intentions only",
      "File a SARTIME with the tower",
    ],
    correctIndex: 1,
    explanation: "Entry to Class D airspace (typically a control zone around a non-radar tower-controlled aerodrome) requires the aircraft to establish two-way communications and receive an ATC clearance before entering the airspace steps.",
    source: "AIP ENR 1.4 — Class D Procedures",
  },
  {
    id: "ifr-j-q13",
    question: "In which airspace classification is an ATC clearance NOT required for an IFR flight to operate, though the pilot must still comply with instrument flight rules?",
    options: [
      "Class C",
      "Class D",
      "Class G",
      "Class A",
    ],
    correctIndex: 2,
    explanation: "Class G airspace is uncontrolled; no ATC clearance is required for IFR flight. However, the pilot must still comply with all IFR procedural requirements (LSALT, MSA compliance, broadcasts, alerting service arrangements).",
    source: "AIP ENR 1.4 — Class G Airspace",
  },
  {
    id: "ifr-j-q14",
    question: "What primary factor determines whether an IFR flight in Class E airspace will receive traffic information about a VFR aircraft nearby?",
    options: [
      "The time of day",
      "Whether the VFR aircraft is known to ATC — e.g. it holds a clearance, is in radio/radar contact, or has filed a flight note",
      "The type of aircraft",
      "Traffic information is never provided in Class E",
    ],
    correctIndex: 1,
    explanation: "ATC can only pass traffic information on VFR aircraft of which they are aware. If a VFR aircraft is not in contact with ATC or otherwise known (e.g. no flight notification, not squawking), no information can be provided about it.",
    source: "AIP ENR 1.4 — Class E Airspace Services",
  },
  {
    id: "ifr-j-q15",
    question: "An aircraft is IFR and cruising in Class C airspace below 10,000 ft. What speed restriction applies unless otherwise authorised by ATC?",
    options: [
      "No restriction — Class C is exempt from the general speed limit",
      "Maximum 250 KIAS as per the general speed limit below 10,000 ft AMSL",
      "Maximum 200 KIAS",
      "Maximum 300 KIAS",
    ],
    correctIndex: 1,
    explanation: "The 250 KIAS general speed limit below 10,000 ft AMSL applies in all airspace classifications, including Class C, unless a specific ATC authorisation permits a higher speed for that segment of flight.",
    source: "CASR Part 91.347; AIP ENR 1.4",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (k) — Departure and approach instrument procedures
// Source: AIP ENR 1.5; AIP AD 1.1; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examKQuestions: ExamQuestion[] = [
  {
    id: "ifr-k-q01",
    question: "An ATC clearance includes a Standard Instrument Departure (SID) designator. What is the pilot's obligation regarding the SID?",
    options: [
      "The SID is advisory only and may be disregarded if convenient",
      "The pilot must fly the SID as published, including all altitude and speed constraints, unless otherwise instructed by ATC",
      "The SID only applies to jet aircraft",
      "SIDs apply only in Class A airspace",
    ],
    correctIndex: 1,
    explanation: "Once assigned, a SID must be flown exactly as published, including all lateral tracking and vertical/speed constraints, unless ATC issues an amended instruction. SIDs provide obstacle clearance and traffic sequencing.",
    source: "AIP ENR 1.5 — Departure Procedures (SIDs)",
  },
  {
    id: "ifr-k-q02",
    question: "What is the primary purpose of a Standard Arrival Route (STAR)?",
    options: [
      "To provide obstacle clearance and traffic sequencing for arriving aircraft from the en route structure to a point where an approach can be commenced",
      "To replace the need for an instrument approach",
      "To provide a missed approach procedure",
      "To define holding patterns only",
    ],
    correctIndex: 0,
    explanation: "A STAR links the en route phase of flight to the approach phase, providing defined tracking, altitude constraints, and traffic sequencing, typically terminating at an initial approach fix.",
    source: "AIP ENR 1.5 — Arrival Procedures (STARs)",
  },
  {
    id: "ifr-k-q03",
    question: "Which three ground-based components make up a full ILS installation providing both lateral and vertical guidance?",
    options: [
      "Localiser, Glide Path, and Marker Beacons (OM/MM)",
      "VOR, DME, and NDB",
      "Localiser, DME, and ATIS",
      "Glide Path, RNAV, and RVR sensor",
    ],
    correctIndex: 0,
    explanation: "A standard ILS consists of the Localiser (lateral guidance), Glide Path (vertical guidance), and marker beacons — typically Outer Marker (OM) and Middle Marker (MM) — providing range/distance cues along the approach.",
    source: "AIP GEN 3.4 / ENR 1.5 — ILS Components",
  },
  {
    id: "ifr-k-q04",
    question: "During an NDB approach, what primary instrument is used to track inbound to the beacon?",
    options: [
      "ILS Course Deviation Indicator",
      "ADF (Automatic Direction Finder) needle, referenced to the RMI/bearing pointer",
      "Glide slope indicator",
      "GNSS CDI only",
    ],
    correctIndex: 1,
    explanation: "NDB approaches are flown by tracking to/from the beacon using the ADF needle displayed on the RMI or bearing pointer, applying wind correction to maintain the desired track, as NDB provides no inherent course guidance signal like a VOR/ILS.",
    source: "AIP ENR 1.5 — Non-Precision Approach Procedures (NDB)",
  },
  {
    id: "ifr-k-q05",
    question: "A VOR approach uses the VOR radial as the final approach course. What must the pilot do to fly the approach accurately?",
    options: [
      "Simply follow the ADF needle",
      "Select the correct OBS/course on the VOR receiver and track the CDI needle, correcting for wind drift while monitoring DME/timing for step-down fixes",
      "Disregard the CDI and fly by heading only",
      "Use GNSS exclusively regardless of VOR indications",
    ],
    correctIndex: 1,
    explanation: "A VOR approach requires setting the published inbound course on the OBS, tracking the CDI centred, applying wind correction, and using DME or timing to identify step-down fix crossings and the missed approach point.",
    source: "AIP ENR 1.5 — Non-Precision Approach Procedures (VOR)",
  },
  {
    id: "ifr-k-q06",
    question: "At the missed approach point, the required visual reference has not been established. What must the pilot do?",
    options: [
      "Continue descent below MDA/DA to look further",
      "Immediately execute the published missed approach procedure without delay",
      "Circle at MDA until visual",
      "Request a lower minima from ATC",
    ],
    correctIndex: 1,
    explanation: "If the required visual reference is not established at the missed approach point (or DA on a precision approach), the pilot must immediately commence the published missed approach procedure — continuing the approach without visual reference is not permitted.",
    source: "CASR Part 91.730; AIP ENR 1.5 — Missed Approach",
  },
  {
    id: "ifr-k-q07",
    question: "What is the 'approach ban' in Australian IFR operations?",
    options: [
      "A prohibition on flying approaches at night",
      "A regulatory restriction preventing a pilot from commencing or continuing an instrument approach beyond the outer marker/FAF (or equivalent point) if the reported visibility/RVR is below the applicable minima",
      "A ban on circling approaches",
      "A restriction that applies only to single-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "The approach ban prevents an aircraft from continuing an approach past specified points (e.g. the FAF or outer marker) when the reported visibility or RVR is below the minima applicable to that approach, reducing exposure to unsuccessful low-visibility approaches.",
    source: "CASR Part 91.730 — Approach Ban",
  },
  {
    id: "ifr-k-q08",
    question: "What distinguishes a Decision Altitude (DA) from a Minimum Descent Altitude (MDA)?",
    options: [
      "There is no difference — the terms are interchangeable",
      "DA applies to precision/APV approaches where a missed approach must commence immediately upon reaching it without visual reference; MDA applies to non-precision approaches and permits level flight at that altitude while visual reference is sought until the MAPt",
      "MDA is always lower than DA for the same runway",
      "DA is used only for circling approaches",
    ],
    correctIndex: 1,
    explanation: "DA (used with precision approaches such as ILS, or APV procedures like LPV/BARO-VNAV) requires an immediate missed approach if the required visual reference is not present at that altitude. MDA (non-precision approaches) is a 'floor' that may be flown level until the MAPt while the crew searches for visual reference.",
    source: "AIP ENR 1.5 — DA vs MDA Definitions; ICAO Annex 6",
  },
  {
    id: "ifr-k-q09",
    question: "On an ILS approach, the aircraft crosses the Outer Marker (OM). What is the primary function of the OM?",
    options: [
      "It marks the runway threshold",
      "It provides a fix, usually coincident with the glide path intercept point, to verify altitude and confirm the aircraft is established on the approach",
      "It indicates the missed approach point",
      "It has no operational function, only historical significance",
    ],
    correctIndex: 1,
    explanation: "The Outer Marker typically coincides with the glide path intercept altitude, allowing the crew to cross-check that they are established on the correct vertical profile before continuing the approach.",
    source: "AIP ENR 1.5 — ILS Approach Procedure",
  },
  {
    id: "ifr-k-q10",
    question: "What is the operational significance of the Middle Marker (MM) on an ILS approach?",
    options: [
      "It marks the point roughly corresponding to Category I DA, providing a positional cue close to the decision point",
      "It marks the start of the approach",
      "It only functions during a missed approach",
      "It replaces the need for a glide path",
    ],
    correctIndex: 0,
    explanation: "The Middle Marker is positioned approximately at the Category I DA point, giving the crew an aural/visual cue that they are nearing the decision altitude on the approach.",
    source: "AIP ENR 1.5 — ILS Marker Beacons",
  },
  {
    id: "ifr-k-q11",
    question: "A pilot flying a published SID encounters an ATC instruction to 'climb via SID except maintain 4,000.' What does this mean?",
    options: [
      "Disregard the SID entirely and fly a heading",
      "Fly the SID's lateral track and comply with all published speed/altitude restrictions, but stop climb at 4,000 ft until further clearance",
      "Climb directly to the SID's top altitude, ignoring 4,000 ft",
      "The SID no longer applies once any ATC instruction is given",
    ],
    correctIndex: 1,
    explanation: "'Climb via SID except maintain [altitude]' retains the SID's lateral path and any published speed constraints but caps the climb at the specified altitude override, pending further ATC clearance.",
    source: "AIP ENR 1.5 — SID Compliance Phraseology",
  },
  {
    id: "ifr-k-q12",
    question: "What must a pilot verify before commencing a published instrument approach procedure?",
    options: [
      "Nothing beyond selecting the correct frequency",
      "That the procedure is current (not superseded by NOTAM/amendment), the correct chart/database cycle is loaded, and the aircraft is appropriately equipped for that approach type",
      "Only that the runway is long enough",
      "That ATC has issued a SID clearance",
    ],
    correctIndex: 1,
    explanation: "Before flying any instrument approach, the crew must confirm currency of the procedure (checking NOTAMs for changes/withdrawal), that chart or navigation database data matches the current AIRAC cycle, and that the aircraft/crew are approved for that approach type (e.g. RNP, CAT II).",
    source: "AIP AD 1.1; CASR Part 91 — Approach Procedure Currency",
  },
  {
    id: "ifr-k-q13",
    question: "During a missed approach following an ILS, what is the first priority for the pilot flying?",
    options: [
      "Immediately turn toward the alternate aerodrome",
      "Apply go-around power, establish a positive climb, and fly the published missed approach lateral and vertical profile",
      "Contact ATC before applying power",
      "Level off and assess before climbing",
    ],
    correctIndex: 1,
    explanation: "The immediate priority in a missed approach is establishing a positive climb by applying go-around thrust/power and configuring the aircraft, while following the published missed approach track and altitude — communication with ATC follows once the aircraft is safely established on the missed approach.",
    source: "AIP ENR 1.5 — Missed Approach Procedure",
  },
  {
    id: "ifr-k-q14",
    question: "What information is a STAR NOT permitted to alter or override?",
    options: [
      "The en route airway structure entirely",
      "ATC's ability to issue radar vectors or amended clearances that supersede the published STAR at any time",
      "Communication frequencies",
      "Nothing — a STAR is absolute once assigned",
    ],
    correctIndex: 1,
    explanation: "Even when a STAR is assigned, ATC retains full authority to issue radar vectors, altitude changes, or route amendments that override or replace all or part of the STAR as traffic and operational needs require.",
    source: "AIP ENR 1.5 — STAR Application; CASR Part 91",
  },
  {
    id: "ifr-k-q15",
    question: "An aircraft is established on a VOR approach and reaches the MAPt with the runway environment in sight but only partially aligned for landing. What should the pilot do?",
    options: [
      "Land regardless, since visual reference exists",
      "If a normal landing cannot be made using normal manoeuvres, execute the missed approach; only continue if a normal descent/landing profile can be safely flown from the current position",
      "Circle indefinitely until fully aligned",
      "Descend below MDA to realign visually",
    ],
    correctIndex: 1,
    explanation: "Visual reference alone is not sufficient — the pilot must be able to complete a normal manoeuvre to landing using normal rates of descent and bank. If this is not possible from the aircraft's position, a missed approach must be flown rather than forcing an unstable landing.",
    source: "CASR Part 91.730 — Requirements for Continuing Below MDA/DA",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (l) — Operations below LSALT and MSA for day and night
// Source: AIP ENR 1.1; AIP ENR 1.5; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examLQuestions: ExamQuestion[] = [
  {
    id: "ifr-l-q01",
    question: "What is the definition of Lowest Safe Altitude (LSALT)?",
    options: [
      "The lowest altitude at which the autopilot may be engaged",
      "The lowest altitude that provides safe terrain and obstacle clearance for an IFR flight on a given route segment, incorporating the appropriate obstacle clearance margin",
      "The altitude at which oxygen is required",
      "The transition altitude for the region",
    ],
    correctIndex: 1,
    explanation: "LSALT is calculated for each route segment to ensure a minimum specified vertical clearance above the highest terrain or obstacle within the applicable width of the route, published by the operator or derived from charts/systems per CASR requirements.",
    source: "AIP ENR 1.1 — LSALT Definition",
  },
  {
    id: "ifr-l-q02",
    question: "What obstacle clearance margin is typically added when calculating LSALT for a designated route in Australia?",
    options: [
      "500 ft flat, regardless of terrain",
      "1,000 ft over terrain below 5,000 ft AMSL, and 2,000 ft over terrain/obstacles at or above 5,000 ft AMSL (within the applicable safety buffer distances)",
      "300 ft over all terrain",
      "No margin is required if using GNSS",
    ],
    correctIndex: 1,
    explanation: "The standard obstacle clearance margins used for LSALT calculation are 1,000 ft above terrain/obstacles below 5,000 ft AMSL, and 2,000 ft above terrain/obstacles at or above 5,000 ft AMSL, within the relevant lateral safety buffer either side of the route.",
    source: "AIP ENR 1.1 — LSALT Calculation Criteria",
  },
  {
    id: "ifr-l-q03",
    question: "What is the key difference between MSA (Minimum Sector Altitude) and LSALT?",
    options: [
      "They are identical concepts with different names",
      "MSA provides obstacle clearance within a defined sector around a specific navigation aid/fix for use in the vicinity of an approach, whereas LSALT applies along an en route segment for the cruise/transit phase",
      "MSA is only used at night",
      "LSALT is calculated by ATC in real time",
    ],
    correctIndex: 1,
    explanation: "MSA is published on approach charts and provides obstacle clearance within a specified radius (commonly 25 NM) of a nominated facility, divided into sectors, for use during arrival/approach planning. LSALT is a route-based altitude for the en route phase.",
    source: "AIP ENR 1.5 — MSA; AIP ENR 1.1 — LSALT",
  },
  {
    id: "ifr-l-q04",
    question: "What does MOCA (Minimum Obstacle Clearance Altitude) represent, and how does it differ from LSALT?",
    options: [
      "MOCA and LSALT are the same value on all charts",
      "MOCA provides obstacle clearance but may not guarantee reliable navigation aid reception at that altitude, unlike LSALT which is used for normal IFR operation and planning",
      "MOCA only applies above FL200",
      "MOCA is always higher than LSALT",
    ],
    correctIndex: 1,
    explanation: "MOCA guarantees obstacle clearance on a route segment but does not guarantee navigation signal reception (e.g. VOR/NDB) at that altitude — it is typically used only where LSALT compliance is otherwise not achievable and specific conditions are met, such as with GNSS position fixing.",
    source: "AIP ENR 1.1 — MOCA vs LSALT",
  },
  {
    id: "ifr-l-q05",
    question: "Under what general condition may a pilot descend below the LSALT prior to commencing an instrument approach during the day?",
    options: [
      "At the pilot's discretion at any time",
      "When the aircraft is being flown in VMC by day, with the pilot able to navigate by visual reference to the ground and maintain terrain/obstacle clearance visually",
      "Only if cleared by ATC via radar vectors, regardless of visibility",
      "Never — LSALT must be maintained until intercepting the final approach segment",
    ],
    correctIndex: 1,
    explanation: "Descent below LSALT prior to the approach is only permitted in VMC by day, where the pilot can maintain visual reference to the ground/water sufficient to navigate and ensure terrain clearance, or via an approved instrument procedure (e.g. established on a published approach segment).",
    source: "AIP ENR 1.1 — Descent Below LSALT; CASR Part 91",
  },
  {
    id: "ifr-l-q06",
    question: "What additional restriction applies to descent below LSALT at night compared to day operations?",
    options: [
      "No difference — the same VMC criteria apply",
      "At night, visual terrain reference is far less reliable, so descent below LSALT not on an instrument procedure is generally not permitted unless specific conditions (e.g. lighting, defined visual approach criteria) are satisfied",
      "Night descent below LSALT is always prohibited under all circumstances including on an approach",
      "LSALT does not apply at night",
    ],
    correctIndex: 1,
    explanation: "At night, the reduced ability to see terrain and obstacles visually means unstructured descent below LSALT is far more hazardous. Descent below LSALT at night is generally restricted to established instrument procedures or specific visual approach criteria with adequate ground lighting/reference.",
    source: "AIP ENR 1.1 — Night IFR Operations Below LSALT",
  },
  {
    id: "ifr-l-q07",
    question: "What is a Visual Descent Point (VDP) on a non-precision approach?",
    options: [
      "The point where the missed approach commences",
      "A defined point on the final approach course from which a normal descent from MDA to the runway touchdown point may be commenced, provided visual reference has been established",
      "The point where the localiser signal begins",
      "A point used only for circling approaches",
    ],
    correctIndex: 1,
    explanation: "The VDP identifies the last point along the final approach track from which a normal, stabilised descent from MDA to landing can be made — descending prior to the VDP without adequate visual reference risks an excessively steep or premature descent.",
    source: "AIP ENR 1.5 — Visual Descent Point",
  },
  {
    id: "ifr-l-q08",
    question: "What is the fundamental relationship between MDA and the ability to continue descent toward the runway on a non-precision approach?",
    options: [
      "The aircraft may descend below MDA at pilot discretion regardless of visual reference",
      "The aircraft may not descend below MDA unless the required visual reference for the runway is established and a normal descent/landing manoeuvre can be made",
      "MDA only applies above 10,000 ft",
      "MDA is a target altitude, not a floor — deviation below is always acceptable",
    ],
    correctIndex: 1,
    explanation: "MDA is a hard floor on a non-precision approach; descent below it is only authorised once the required visual references are in sight and a normal manoeuvre to landing can be completed using normal rates of descent and bank.",
    source: "CASR Part 91.730 — MDA Compliance",
  },
  {
    id: "ifr-l-q09",
    question: "On a route where the LSALT is 8,500 ft but ATC assigns and the aircraft maintains FL070 (7,000 ft) under radar surveillance in Class C airspace, is this compliant?",
    options: [
      "No — LSALT can never be overridden regardless of ATC surveillance",
      "Yes, provided the ATC unit has verified radar/ADS-B terrain and obstacle clearance for that specific route/altitude and issues the clearance accordingly — this substitutes for LSALT compliance under radar navigation guidance",
      "Only if the flight is VFR",
      "Only permitted at night",
    ],
    correctIndex: 1,
    explanation: "ATC may authorise flight below the published LSALT under certain surveillance-based navigation guidance procedures (e.g. radar or ADS-B vectoring with verified terrain clearance), which substitutes for the pilot's own LSALT compliance for that specific clearance.",
    source: "AIP ENR 1.1 — LSALT and ATC Radar Navigation Guidance",
  },
  {
    id: "ifr-l-q10",
    question: "What lateral distance either side of the route centreline is typically used in calculating the standard LSALT obstacle clearance area?",
    options: [
      "2 NM either side",
      "5 NM either side of track, widening progressively at turning points",
      "10 NM either side always",
      "No lateral buffer is applied",
    ],
    correctIndex: 1,
    explanation: "The standard LSALT obstacle clearance area extends 5 NM either side of the route centreline (widening at track changes/turning points) within which the highest terrain/obstacle is identified and the appropriate clearance margin applied.",
    source: "AIP ENR 1.1 — LSALT Area of Consideration",
  },
  {
    id: "ifr-l-q11",
    question: "A pilot wants to descend below LSALT under IFR while remote from any instrument approach, in day VMC, over unfamiliar mountainous terrain. What is required in addition to VMC?",
    options: [
      "Nothing further — VMC alone always suffices",
      "The pilot must be able to maintain continuous visual reference with the ground/water and be satisfied that terrain and obstacle clearance can be maintained visually throughout the descent and subsequent flight below LSALT",
      "Only an ATC clearance is needed, VMC is irrelevant",
      "A SARTIME must be extended",
    ],
    correctIndex: 1,
    explanation: "Even in day VMC, the pilot must maintain visual contact with the terrain/water sufficient to positively ensure ongoing obstacle clearance — simply being clear of cloud with adequate visibility is not sufficient if terrain cannot be positively identified and avoided.",
    source: "AIP ENR 1.1 — Conditions for Descent Below LSALT",
  },
  {
    id: "ifr-l-q12",
    question: "What does the MSA published on an approach chart typically guarantee within its defined radius (commonly 25 NM) from the reference facility?",
    options: [
      "Reliable radio navigation reception only",
      "A minimum of 1,000 ft clearance above the highest obstacle within each sector (or 2,000 ft in designated mountainous areas)",
      "No obstacle protection — it is advisory",
      "Only protection from other traffic, not terrain",
    ],
    correctIndex: 1,
    explanation: "MSA provides an obstacle clearance altitude for each defined sector around the reference point, typically affording a minimum of 1,000 ft clearance above the highest obstacle in that sector (increased in designated mountainous terrain), for use during an emergency descent or approach preparation, not for normal cruise navigation.",
    source: "AIP ENR 1.5 — Minimum Sector Altitude",
  },
  {
    id: "ifr-l-q13",
    question: "During a diversion following an in-flight event, the pilot has no current LSALT calculated for a direct track to the alternate. What action should be taken?",
    options: [
      "Fly the direct track at any convenient altitude",
      "Climb to, or remain at, an altitude that provides known safe terrain clearance (e.g. area MSA, previous LSALT plus margin, or a conservatively high altitude) until a proper LSALT can be determined or a charted route/altitude is available",
      "Descend to minimize fuel burn regardless of terrain",
      "LSALT is not required during diversions",
    ],
    correctIndex: 1,
    explanation: "Without a calculated LSALT for a new direct track, the pilot must remain at a conservatively safe altitude — using area MSA values, chart contour information, or GNSS-derived terrain awareness — until a proper safe altitude for the diversion track has been established.",
    source: "AIP ENR 1.1 — LSALT for Ad Hoc Tracks; CASR Part 91",
  },
  {
    id: "ifr-l-q14",
    question: "Why is night operation below LSALT considered significantly more hazardous than day operation, even in reported VMC conditions?",
    options: [
      "Because radios do not work as well at night",
      "Because visual terrain features, especially in areas without ground lighting, are extremely difficult or impossible to perceive at night, increasing the risk of unseen terrain/obstacle collision despite technical VMC",
      "Because IFR is not permitted at night in Australia",
      "Because MSA does not apply at night",
    ],
    correctIndex: 1,
    explanation: "Even where reported visibility and cloud clearance meet VMC criteria at night, the absence of visual terrain cues (particularly over unlit or featureless terrain) makes visual terrain avoidance unreliable, which is why regulations impose greater restrictions on descent below LSALT at night.",
    source: "AIP ENR 1.1 — Night VMC Limitations for Terrain Avoidance",
  },
  {
    id: "ifr-l-q15",
    question: "What must a pilot do if, while established below LSALT on a visual segment by day, cloud or reduced visibility is encountered that removes the required visual reference?",
    options: [
      "Continue at the same altitude and hope conditions improve",
      "Immediately initiate a climb to LSALT (or a known safe altitude) while manoeuvring away from terrain, and reassess options including diversion or a return to instrument procedures",
      "Descend further to get below the cloud",
      "Declare a MAYDAY immediately regardless of terrain",
    ],
    correctIndex: 1,
    explanation: "Loss of the required visual reference below LSALT is a serious safety event requiring an immediate climb to a known safe altitude (LSALT or higher) while avoiding known terrain, followed by reassessment of the flight — continuing visually or descending further is not acceptable.",
    source: "AIP ENR 1.1 — Loss of Visual Reference Below LSALT",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (m) — GNSS and PBN standards
// Source: AIP ENR 1.1; CASR Part 91; CASA AC 91U-1; ICAO Doc 9613
// ─────────────────────────────────────────────────────────────────────────────
const examMQuestions: ExamQuestion[] = [
  {
    id: "ifr-m-q01",
    question: "What does LNAV describe in the context of a GNSS approach?",
    options: [
      "A vertically guided approach using barometric data",
      "Lateral Navigation only — the approach provides lateral course guidance derived from GNSS, with no vertical guidance; a stepped MDA descent profile is flown",
      "A precision approach identical to ILS",
      "A backup NDB approach mode",
    ],
    correctIndex: 1,
    explanation: "LNAV provides lateral guidance only, based on GNSS positioning to a defined MDA — vertical profile is managed by the pilot using stepdown fixes, similar to a conventional non-precision approach.",
    source: "AIP ENR 1.1 — GNSS Approach Types (LNAV)",
  },
  {
    id: "ifr-m-q02",
    question: "What distinguishes LPV minima from LNAV/VNAV or LNAV minima on an RNP APCH chart?",
    options: [
      "LPV provides no vertical guidance at all",
      "LPV (Localizer Performance with Vertical guidance) uses SBAS augmentation to provide angular, ILS-like lateral and vertical guidance down to a Decision Altitude, typically lower than LNAV/VNAV minima",
      "LPV is only usable above FL180",
      "LPV and LNAV are identical minima sets",
    ],
    correctIndex: 1,
    explanation: "LPV uses Satellite-Based Augmentation System (SBAS, e.g. SBAS/GPS) corrections to provide angular guidance similar to an ILS, typically achieving lower minima (DA) than LNAV or baro-VNAV based procedures, though Australia's SBAS coverage/certification governs availability.",
    source: "AIP ENR 1.1 — LPV Minima; ICAO Doc 9613 PBN Manual",
  },
  {
    id: "ifr-m-q03",
    question: "What is the key difference between RNP APCH and RNP AR APCH?",
    options: [
      "There is no meaningful difference",
      "RNP APCH uses standard RNP values (e.g. RNP 1.0/0.3) without special aircraft/crew authorisation; RNP AR APCH requires specific operator/aircraft authorisation and can use much tighter RNP values with curved paths and reduced obstacle clearance areas",
      "RNP AR is only used for departures",
      "RNP APCH always requires dual GNSS receivers, RNP AR does not",
    ],
    correctIndex: 1,
    explanation: "RNP APCH is available to appropriately equipped aircraft without special authorisation using standard RNP values. RNP AR (Authorization Required) demands specific operator and aircraft approval, permitting tighter RNP tolerances, curved (RF leg) paths, and reduced obstacle clearance surfaces — often used at terrain-challenged aerodromes.",
    source: "CASA AC 91U-1 — RNP AR Operations; ICAO Doc 9613",
  },
  {
    id: "ifr-m-q04",
    question: "What does RAIM stand for, and what is its function on a GNSS approach?",
    options: [
      "Receiver Autonomous Integrity Monitoring — it detects satellite geometry/signal faults and alerts the crew if position integrity cannot be assured to the required level",
      "Radio Altimeter Integrated Module — measures height above terrain",
      "Route Alerting and Information Management — a flight-planning tool",
      "Runway Approach Indication Marker — a ground-based visual aid",
    ],
    correctIndex: 0,
    explanation: "RAIM is an internal GNSS receiver function that cross-checks redundant satellite measurements to detect a faulty signal and verify that position accuracy meets the integrity requirement for the phase of flight — if RAIM is unavailable or predicted to be unavailable, the approach may not be authorised.",
    source: "AIP ENR 1.1 — RAIM Requirements; ICAO Doc 9613",
  },
  {
    id: "ifr-m-q05",
    question: "Before departure, RAIM prediction indicates an outage at the ETA for the planned GNSS approach at the destination. What should the crew do?",
    options: [
      "Proceed as planned; RAIM outages have no operational relevance",
      "Plan for an alternative approach type, delay, or select an alternate aerodrome, as the GNSS approach may not be authorised for use during the predicted outage window",
      "Fly the approach anyway using the flight director",
      "Ignore RAIM predictions if using WAAS/SBAS equipment",
    ],
    correctIndex: 1,
    explanation: "A predicted RAIM outage means the GNSS receiver may be unable to provide required integrity monitoring during that window, so the crew must plan a suitable alternative — a different approach type, revised timing, or an alternate aerodrome — before committing to the flight.",
    source: "AIP ENR 1.1 — RAIM Prediction Requirements; CASR Part 91",
  },
  {
    id: "ifr-m-q06",
    question: "How does CDI (or equivalent lateral deviation display) sensitivity typically change during a GNSS RNP approach as the aircraft progresses from en route to the final approach segment?",
    options: [
      "Sensitivity remains constant throughout all phases",
      "Sensitivity increases (full-scale deflection value decreases) progressively from en route (e.g. ±2 NM) through terminal (±1 NM) to approach (typically ±0.3 NM or tighter), reflecting the tighter RNP value required",
      "Sensitivity decreases as the aircraft approaches the runway",
      "CDI sensitivity is irrelevant on GNSS approaches",
    ],
    correctIndex: 1,
    explanation: "As RNP value tightens through the phases of flight, the full-scale deflection of the lateral deviation display automatically scales down, giving the crew a more sensitive (and appropriately smaller) display of lateral deviation appropriate to the tighter navigation accuracy required.",
    source: "AIP ENR 1.1 — RNP CDI Scaling; ICAO Doc 9613 PBN Manual",
  },
  {
    id: "ifr-m-q07",
    question: "What does a Performance-Based Navigation (PBN) specification such as 'RNAV 2' or 'RNP 1' primarily define?",
    options: [
      "The specific brand of avionics required",
      "The required navigation performance accuracy, integrity, and functional requirements an aircraft/system must meet for a given operation, independent of the specific sensor used to achieve it",
      "Only the required communication frequency",
      "The maximum altitude for the procedure",
    ],
    correctIndex: 1,
    explanation: "PBN specifications (RNAV X or RNP X) define required accuracy (X NM, 95% of the time), along with integrity, continuity, and functional requirements. They are sensor-independent in principle, though most modern implementations rely on GNSS.",
    source: "ICAO Doc 9613 — PBN Concept",
  },
  {
    id: "ifr-m-q08",
    question: "What equipment/approval elements are typically required for an aircraft/crew to conduct RNP APCH operations with LNAV/VNAV minima using BARO-VNAV?",
    options: [
      "No special requirements — any GPS unit suffices",
      "A certified RNP APCH-capable navigation system, an approved BARO-VNAV function with valid temperature compensation/limitations, and appropriate aircraft/operator approval documented in the AFM/Ops Manual",
      "Only a current database cycle, nothing else",
      "A functioning ADF",
    ],
    correctIndex: 1,
    explanation: "LNAV/VNAV minima using BARO-VNAV require an approved navigation system capable of computing a vertical path from barometric altitude, with appropriate temperature limitations observed (since baro-VNAV accuracy is temperature-sensitive), and documented aircraft/operator approval.",
    source: "CASA AC 91U-1; AIP ENR 1.1 — BARO-VNAV Requirements",
  },
  {
    id: "ifr-m-q09",
    question: "Why must BARO-VNAV approaches typically observe a minimum temperature limitation published on the approach chart?",
    options: [
      "Cold temperatures affect satellite signal strength",
      "Extremely cold temperatures cause the true vertical path flown to be lower than the computed barometric path (since cold air is denser), risking reduced obstacle clearance if not compensated for",
      "Battery performance in the GNSS receiver degrades in the cold",
      "There is no temperature limitation for BARO-VNAV",
    ],
    correctIndex: 1,
    explanation: "In cold temperatures, actual altitude is lower than indicated altitude for a given pressure setting (since colder, denser air compresses the pressure levels), so an uncompensated barometric vertical path flies the aircraft closer to terrain than intended — hence published minimum temperature limits or system temperature compensation are required.",
    source: "AIP ENR 1.1 — Cold Temperature Restrictions for BARO-VNAV",
  },
  {
    id: "ifr-m-q10",
    question: "What does 'APV' stand for in the classification of instrument approach procedures?",
    options: [
      "Approach Procedure with Vectors",
      "Approach with Vertical guidance — a procedure providing both lateral and vertical guidance but not meeting the full precision approach ILS/GLS standard (e.g. LNAV/VNAV, LPV)",
      "Automatic Precision Vectoring",
      "Aircraft Position Verification",
    ],
    correctIndex: 1,
    explanation: "APV procedures provide vertical and lateral guidance to a Decision Altitude but do not meet the strict signal-in-space standards of a full ILS/GLS precision approach — LNAV/VNAV and LPV are both classified as APV procedures.",
    source: "ICAO Annex 6 / Doc 9613 — Approach Classification",
  },
  {
    id: "ifr-m-q11",
    question: "What key equipment redundancy consideration applies to conducting RNP AR APCH operations in Australia?",
    options: [
      "No redundancy is required — a single GNSS receiver is sufficient",
      "Typically dual independent GNSS/FMS systems (or equivalent fault-tolerant architecture) are required, along with specific aircraft certification and operator authorisation, given the reduced obstacle clearance margins involved",
      "Redundancy is only required for the autopilot, not navigation",
      "RNP AR requires only a single VOR receiver as backup",
    ],
    correctIndex: 1,
    explanation: "Because RNP AR procedures rely on tight lateral containment with reduced obstacle clearance, aircraft must typically have dual independent navigation systems and specific certification, with the operator holding an authorisation validating the aircraft, crew training, and procedures.",
    source: "CASA AC 91U-1 — RNP AR Authorisation Requirements",
  },
  {
    id: "ifr-m-q12",
    question: "What action is required if a GNSS receiver on approach displays a lateral deviation exceeding the RNP APCH containment limits, without any fault annunciation?",
    options: [
      "Continue as normal — RNP containment has no operational significance",
      "The crew should treat this as a navigation performance issue and discontinue the approach if positive lateral guidance/containment cannot be assured, reverting to a suitable alternative",
      "Increase speed to correct more quickly and continue",
      "This situation cannot occur on RNP APCH by design",
    ],
    correctIndex: 1,
    explanation: "If displayed deviation exceeds the RNP containment limit without a system fault flag, the crew cannot be assured the aircraft remains within protected obstacle clearance limits, and should discontinue the approach and use an alternative means of navigation/approach.",
    source: "AIP ENR 1.1; ICAO Doc 9613 — RNP Monitoring and Alerting",
  },
  {
    id: "ifr-m-q13",
    question: "How does LP (Localizer Performance) differ from LPV on a GNSS approach?",
    options: [
      "LP and LPV are identical",
      "LP provides SBAS-augmented lateral guidance only (no vertical guidance, flown to an MDA), whereas LPV adds vertical guidance to a DA",
      "LP is used only for departures, never approaches",
      "LP requires an ILS ground station",
    ],
    correctIndex: 1,
    explanation: "LP uses the same SBAS-based angular lateral guidance concept as LPV but does not include a vertical guidance component — the aircraft flies to an MDA using LP, typically where terrain or other factors preclude publishing a vertical path.",
    source: "ICAO Doc 9613 — LP vs LPV Minima Lines",
  },
  {
    id: "ifr-m-q14",
    question: "What database currency requirement applies to conducting an RNP APCH procedure?",
    options: [
      "Database currency is irrelevant for RNP APCH",
      "The onboard navigation database must be current (within the applicable AIRAC cycle) and match the published procedure exactly, as any discrepancy can result in incorrect path construction",
      "Database currency only matters for oceanic operations",
      "A database more than 5 years old is acceptable if no changes are known",
    ],
    correctIndex: 1,
    explanation: "RNP procedures depend on the aircraft's navigation database matching the published charted procedure exactly (same AIRAC cycle where possible), since the aircraft flies the coded path directly — outdated or mismatched data can result in incorrect path construction and loss of obstacle protection.",
    source: "CASA AC 91U-1; AIP ENR 1.1 — Database Currency Requirements",
  },
  {
    id: "ifr-m-q15",
    question: "What is the primary reason PBN navigation specifications are described as 'sensor independent' in concept?",
    options: [
      "Because they can never actually be achieved using GNSS",
      "Because the specification defines required performance outcomes (accuracy, integrity, availability, continuity) rather than mandating a specific technology, allowing different underlying sensors (GNSS, DME/DME, VOR/DME) to satisfy the same requirement where suitably available",
      "Because PBN specifications apply only to visual approaches",
      "Because PBN removes the need for any navigation sensor",
    ],
    correctIndex: 1,
    explanation: "PBN's sensor-independence means the standard specifies the navigation performance required (e.g. RNP 1 = 1 NM accuracy 95% of the time with defined integrity/continuity), which can theoretically be met by various technologies, though in practice most current implementations are GNSS-based.",
    source: "ICAO Doc 9613 — PBN Manual, Concept and Sensor Independence",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (n) — Circling approaches
// Source: AIP ENR 1.5; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examNQuestions: ExamQuestion[] = [
  {
    id: "ifr-n-q01",
    question: "What determines an aircraft's circling approach category (A, B, C, or D)?",
    options: [
      "The aircraft's engine type (turboprop vs jet)",
      "The aircraft's indicated airspeed at the maximum certificated landing weight (VAT, typically 1.3 × VSO), which places it into a defined speed-based category",
      "The number of engines",
      "The pilot's personal preference",
    ],
    correctIndex: 1,
    explanation: "Circling categories are defined by a speed range based on 1.3 times the stall speed in the landing configuration at maximum certificated landing weight (VAT) — this determines the applicable circling radius and minima, not aircraft type or engine count.",
    source: "AIP ENR 1.5 — Aircraft Approach Categories",
  },
  {
    id: "ifr-n-q02",
    question: "How does the protected circling area radius change as the aircraft category increases from A to D?",
    options: [
      "It remains constant across all categories",
      "It increases with category, since higher-category aircraft fly the circling manoeuvre at higher speeds requiring a larger turning radius and protected area",
      "It decreases with category",
      "Category has no bearing on circling area size",
    ],
    correctIndex: 1,
    explanation: "As circling category increases (A through D, reflecting higher approach speeds), the protected circling area radius increases correspondingly to accommodate the larger turn radius flown at higher speed, and published circling minima reflect this larger area's obstacle clearance.",
    source: "AIP ENR 1.5 — Circling Area Radii by Category",
  },
  {
    id: "ifr-n-q03",
    question: "Why are circling minima generally higher (less favourable) than straight-in approach minima for the same procedure?",
    options: [
      "Circling minima are set arbitrarily higher for no operational reason",
      "Circling requires manoeuvring in visual conditions around the aerodrome at low level, often not aligned with any specific runway centreline, requiring greater obstacle clearance margins and visual reference throughout the manoeuvre",
      "Circling minima are actually always lower than straight-in",
      "Circling only applies to Category A aircraft",
    ],
    correctIndex: 1,
    explanation: "Circling involves manoeuvring visually at a relatively low altitude around the aerodrome, often outside the protection of a single approach course, so the obstacle clearance area is larger and minima are set higher to maintain adequate visual terrain/obstacle avoidance capability.",
    source: "AIP ENR 1.5 — Circling vs Straight-In Minima Rationale",
  },
  {
    id: "ifr-n-q04",
    question: "What is the maximum permissible circling approach speed for a Category C aircraft under Australian procedures?",
    options: [
      "100 KIAS",
      "121 KIAS",
      "141 KIAS",
      "166 KIAS",
    ],
    correctIndex: 2,
    explanation: "Category C aircraft have a maximum circling speed of 141 KIAS. Exceeding this speed during the circling manoeuvre would take the aircraft outside its protected obstacle clearance area, unless it is instead operated using the minima for the next higher category.",
    source: "AIP ENR 1.5 — Circling Approach Category Speed Limits",
  },
  {
    id: "ifr-n-q05",
    question: "During a circling approach in visual conditions, the crew loses sight of the runway environment while manoeuvring downwind. What is the required action?",
    options: [
      "Continue the circuit from memory and rejoin visually later",
      "Immediately initiate the missed approach procedure, turning toward the protected side as appropriate, climbing to the missed approach altitude",
      "Descend to try to regain visual contact",
      "Land on any visible runway regardless of alignment",
    ],
    correctIndex: 1,
    explanation: "Loss of visual reference during circling requires an immediate missed approach. The turn direction should be made toward the safe protected side of the circling area (often toward the airport, as briefed) climbing to the missed approach altitude following the procedure.",
    source: "AIP ENR 1.5 — Loss of Visual Reference During Circling",
  },
  {
    id: "ifr-n-q06",
    question: "What visual reference requirement must be maintained throughout a circling manoeuvre?",
    options: [
      "Only the runway threshold needs to be visible at the start",
      "The pilot must maintain visual reference sufficient to continue the manoeuvre safely, keeping the runway environment (or specific visual references) in sight throughout, adjusted as necessary for safe manoeuvring",
      "No visual reference is required once initially established",
      "Only ATC's radar picture is relevant, visual reference is not required",
    ],
    correctIndex: 1,
    explanation: "Continuous visual reference with the aerodrome environment must be maintained throughout the circling manoeuvre; if this is lost at any point, an immediate missed approach must be flown rather than continuing to manoeuvre without adequate visual cues.",
    source: "CASR Part 91.730 — Visual Reference Requirements for Circling",
  },
  {
    id: "ifr-n-q07",
    question: "Is circling approved at night in Australia?",
    options: [
      "Circling is never permitted at night under any circumstances",
      "Circling may be conducted at night where specifically authorised (e.g. published night circling minima exist and adequate lighting/visual references are available), but is subject to more conservative requirements than day circling",
      "Night circling has identical requirements to day circling with no additional restrictions",
      "Night circling is permitted only for Category A aircraft",
    ],
    correctIndex: 1,
    explanation: "Night circling is permitted only where specific night circling minima are published and appropriate visual references (lighting) are available, recognising the greater difficulty of maintaining visual reference to terrain and the runway environment at night.",
    source: "AIP ENR 1.5 — Night Circling Procedures",
  },
  {
    id: "ifr-n-q08",
    question: "An aircraft is certified with a VAT that places it at the top of Category B but the pilot chooses to fly the circling manoeuvre at Category C speeds due to gusty conditions. What minima must be used?",
    options: [
      "Category B minima, since that is the aircraft's normal category",
      "Category C minima, since the protected obstacle clearance area must correspond to the actual speed flown, not the aircraft's default category",
      "The lower of the two minima values",
      "No adjustment is required regardless of speed flown",
    ],
    correctIndex: 1,
    explanation: "If a pilot elects to fly the circling manoeuvre faster than their aircraft's normal category speed range, they must use the minima and protected area for the higher category that corresponds to the actual speed being flown, to ensure adequate obstacle clearance.",
    source: "AIP ENR 1.5 — Speed and Category Correlation for Circling",
  },
  {
    id: "ifr-n-q09",
    question: "What primary factor causes the protected circling area to be published as different radii for different categories, rather than a single fixed radius for all aircraft?",
    options: [
      "Aircraft weight only",
      "The relationship between category-based approach speed and the resulting turn radius required to manoeuvre visually around the circling area within a normal bank angle",
      "Fuel capacity of the aircraft type",
      "The manufacturer of the aircraft",
    ],
    correctIndex: 1,
    explanation: "Higher-speed categories require a larger turn radius to manoeuvre at normal bank angles, so the protected circling area (and associated obstacle clearance) must be correspondingly larger to keep the aircraft's manoeuvring within a protected obstacle-cleared zone.",
    source: "AIP ENR 1.5 — Circling Area Construction Criteria",
  },
  {
    id: "ifr-n-q10",
    question: "During a circling approach, what determines the direction of turn permitted at any point in the manoeuvre?",
    options: [
      "The pilot may turn in any direction at any time with no restriction",
      "The pilot must remain within the protected circling area at all times, adjusting the flight path (including turn direction and timing) to maintain both visual reference and containment within the protected area relative to the landing runway",
      "Turn direction is always to the right regardless of the runway used",
      "Circling permits only straight-line manoeuvring, no turns",
    ],
    correctIndex: 1,
    explanation: "The pilot has some flexibility to manoeuvre in the circling area but must not exceed its protected boundary. Turns are adjusted as necessary to remain within this obstacle-cleared area while maintaining visual contact and positioning for a safe landing.",
    source: "AIP ENR 1.5 — Circling Manoeuvring Requirements",
  },
  {
    id: "ifr-n-q11",
    question: "What is the operational reason circling minima typically increase at aerodromes surrounded by higher or more complex terrain?",
    options: [
      "Terrain has no bearing on circling minima, only runway length matters",
      "The obstacle clearance surface used to calculate circling minima accounts for the highest obstacle within the protected circling area for that category — more challenging terrain raises the obstacle clearance altitude required",
      "Circling minima are fixed nationally and never vary by aerodrome",
      "Higher terrain only affects straight-in minima, not circling",
    ],
    correctIndex: 1,
    explanation: "Because circling minima are derived from the highest obstacle within the category-specific protected area around the aerodrome, aerodromes with higher surrounding terrain will have correspondingly higher published circling minima to maintain the required clearance.",
    source: "AIP ENR 1.5 — Terrain Influence on Circling Minima",
  },
  {
    id: "ifr-n-q12",
    question: "A Category D aircraft's approach speed calculation (VAT) places it just over the Category C upper limit. What must be observed?",
    options: [
      "The pilot may round down and use Category C minima regardless",
      "Category D minima and the larger Category D protected area must be used, since VAT determines the applicable category strictly by the published speed range",
      "The aircraft can choose either category at will",
      "Category has no relevance if the aircraft is turbine-powered",
    ],
    correctIndex: 1,
    explanation: "Category is determined strictly by VAT falling within the published speed range for each category. If VAT places the aircraft in Category D, Category D minima and protected area dimensions must be used — not a lower category simply because the excess is small.",
    source: "AIP ENR 1.5 — Category Determination by VAT",
  },
  {
    id: "ifr-n-q13",
    question: "What must the pilot do immediately upon deciding to discontinue a circling approach due to deteriorating weather, even before losing full visual reference?",
    options: [
      "Wait until visual reference is completely lost before acting",
      "Commence the missed approach promptly, since early recognition of deteriorating conditions and proactive action reduces risk compared to waiting until visual reference is fully lost",
      "Attempt to land immediately on the nearest available surface",
      "Reduce speed and circle at a lower altitude to remain visual",
    ],
    correctIndex: 1,
    explanation: "Good practice and regulatory expectation is not to wait until visual reference is completely lost — recognising deteriorating trends and initiating the missed approach promptly is safer and reduces the risk of an inadvertent loss of visual reference in a critical phase of manoeuvring flight.",
    source: "AIP ENR 1.5 — Proactive Missed Approach Decision-Making",
  },
  {
    id: "ifr-n-q14",
    question: "What is a key structural feature that differentiates a circling approach from a straight-in approach in terms of runway alignment?",
    options: [
      "There is no difference; both always align exactly with the runway centreline",
      "A circling approach may terminate on a final approach course that is not aligned with, or does not lead directly to, the landing runway, requiring visual manoeuvring to align for landing",
      "Circling approaches are always flown to the same runway as the final approach course",
      "Straight-in approaches never require visual reference",
    ],
    correctIndex: 1,
    explanation: "A circling approach exists specifically because the instrument approach's final course is not aligned with (or does not lead to) the landing runway within the criteria for a straight-in approach, necessitating a visual manoeuvre to align the aircraft with the landing runway.",
    source: "AIP ENR 1.5 — Circling Approach Purpose and Application",
  },
  {
    id: "ifr-n-q15",
    question: "What braking/configuration consideration should be planned for prior to commencing a circling approach in gusty or crosswind conditions?",
    options: [
      "No special consideration is needed; circling is identical to straight-in in all wind conditions",
      "The crew should plan an appropriate approach speed additive for gusts (which may push the aircraft into a higher circling category), review runway crosswind limits, and brief the missed approach contingency given the reduced margins during manoeuvring flight",
      "Circling should be attempted only with a tailwind for a faster approach",
      "Flaps should always be retracted for circling regardless of aircraft type",
    ],
    correctIndex: 1,
    explanation: "Gusty/crosswind conditions may require an approach speed additive that increases the effective circling category (and therefore the minima/area used), while also requiring review of crosswind limits and a clear missed-approach contingency plan given the reduced protection margins in the visual manoeuvring phase.",
    source: "AIP ENR 1.5 — Circling Considerations in Adverse Wind",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (o) — Adverse weather operations
// Source: AIP ENR 1.1; BOM Aviation Weather Products; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examOQuestions: ExamQuestion[] = [
  {
    id: "ifr-o-q01",
    question: "What is the difference between 'known icing conditions' and 'forecast icing conditions'?",
    options: [
      "They are the same thing described differently",
      "Known icing refers to conditions where ice has been observed or reported to actually be forming (e.g. by PIREP), whereas forecast icing refers to atmospheric conditions (temperature and visible moisture) predicted to be conducive to icing but not necessarily confirmed",
      "Forecast icing only applies to ground operations",
      "Known icing only applies above FL200",
    ],
    correctIndex: 1,
    explanation: "'Known icing' generally means conditions where ice accumulation has actually been observed/reported (e.g. via PIREP or direct observation), while 'forecast icing conditions' describes atmospheric parameters (visible moisture and temperatures near or below 0°C) predicted by forecast products, which may or may not produce actual icing.",
    source: "AIP ENR 1.1 — Icing Definitions; CASR Part 91",
  },
  {
    id: "ifr-o-q02",
    question: "What is the recommended primary avoidance strategy for a thunderstorm cell displayed on airborne weather radar?",
    options: [
      "Fly directly through the weakest-looking part of the cell",
      "Avoid the cell by a lateral distance of at least 20 NM where practical (or per operator guidance), particularly avoiding the area beneath and immediately downwind of the cell",
      "Fly directly beneath the cell at low level to avoid turbulence",
      "Climb above all cells regardless of altitude capability",
    ],
    correctIndex: 1,
    explanation: "Standard guidance is to avoid thunderstorm cells by a substantial lateral margin — commonly cited as around 20 NM for significant cells — and to particularly avoid flight beneath or immediately downwind of a cell due to severe turbulence, hail, and windshear hazards.",
    source: "AIP ENR 1.1 — Thunderstorm Avoidance Guidance",
  },
  {
    id: "ifr-o-q03",
    question: "A pilot encounters unexpected windshear on approach. What is the correct reporting mechanism to alert other aircraft and ATC?",
    options: [
      "No report is required — windshear is a normal hazard",
      "A Pilot Report (PIREP) should be transmitted to ATC as soon as practicable, including location, altitude, and nature/severity of the windshear encountered",
      "Only the company should be notified after landing",
      "PIREPs are only used for turbulence, not windshear",
    ],
    correctIndex: 1,
    explanation: "Windshear encounters should be reported to ATC via a PIREP as soon as practicable, providing location, altitude/phase of flight, and the nature and severity of the shear so that ATC can pass the information to following aircraft and update weather awareness.",
    source: "AIP ENR 1.1 — PIREP Requirements for Windshear",
  },
  {
    id: "ifr-o-q04",
    question: "What are the standard ICAO turbulence reporting categories used in PIREPs?",
    options: [
      "Mild, moderate, strong, extreme",
      "Light, Moderate, Severe, Extreme",
      "Category 1 through Category 4",
      "Calm, breezy, gusty, violent",
    ],
    correctIndex: 1,
    explanation: "The standard turbulence intensity categories for PIREPs and forecast products are Light, Moderate, Severe, and Extreme, each with defined effects on aircraft control, occupant movement, and structural loading.",
    source: "AIP ENR 1.1 — Turbulence Reporting Categories",
  },
  {
    id: "ifr-o-q05",
    question: "What does a Low-Level Wind Shear Alert System (LLWAS), where installed, provide to arriving/departing aircraft?",
    options: [
      "A forecast of upper-level jet stream winds",
      "Real-time detection of significant wind shear/gust front activity near the aerodrome surface, triggering alerts to ATC for relay to aircraft on approach or departure",
      "A prediction of icing conditions",
      "A measurement of runway friction only",
    ],
    correctIndex: 1,
    explanation: "LLWAS uses a network of surface wind sensors around an aerodrome to detect significant wind shifts indicative of gust fronts or wind shear, allowing ATC to issue timely alerts to aircraft on approach or departure before they encounter the hazard.",
    source: "AIP ENR 1.1 — Low-Level Wind Shear Alerting Systems",
  },
  {
    id: "ifr-o-q06",
    question: "What operational adjustment is typically required when landing on a runway reported as contaminated with standing water or slush?",
    options: [
      "No adjustment — normal landing distance calculations apply unchanged",
      "Landing distance must be recalculated using contaminated runway performance data, typically requiring significantly increased landing distance and adjusted approach speed/technique due to reduced braking action and risk of hydroplaning",
      "Only the approach speed needs to be reduced, distance calculations are unaffected",
      "Contaminated runway operations are always prohibited under IFR",
    ],
    correctIndex: 1,
    explanation: "Contaminated runway conditions (standing water, slush, ice) significantly reduce braking effectiveness and increase risk of hydroplaning, requiring the crew to apply contaminated-surface performance data, which typically extends required landing distance substantially compared to a dry runway.",
    source: "CASR Part 91 — Contaminated Runway Performance; Aircraft AFM/POH Data",
  },
  {
    id: "ifr-o-q07",
    question: "Under ISA conditions, at a given pressure altitude, if the actual outside air temperature is significantly colder than the ISA standard, what effect does this have on true altitude relative to indicated altitude (with QNH set)?",
    options: [
      "True altitude will be higher than indicated altitude",
      "True altitude will be lower than indicated altitude — the aircraft is actually closer to terrain than the altimeter suggests",
      "There is no effect — QNH setting eliminates all temperature error",
      "The effect only applies above the transition altitude",
    ],
    correctIndex: 1,
    explanation: "In colder-than-ISA conditions, air is denser and pressure levels are compressed closer together, so for a given indicated altitude (with correct QNH), the true altitude is actually lower than indicated — meaning the aircraft is closer to terrain/obstacles than the altimeter shows, requiring cold temperature corrections in extreme cases.",
    source: "AIP ENR 1.1 — Cold Temperature Altimetry Errors",
  },
  {
    id: "ifr-o-q08",
    question: "When is a cold temperature altimeter correction typically required to be applied to a published minimum altitude (e.g. on an approach)?",
    options: [
      "Never — QNH altimeter setting fully corrects for all temperature effects",
      "When the reported aerodrome temperature is below a specified threshold (commonly around -15°C or per the relevant published table/chart), a correction must be added to relevant minimum altitudes to compensate for the true-altitude shortfall",
      "Only when operating above FL200",
      "Only during summer operations",
    ],
    correctIndex: 1,
    explanation: "QNH corrects for pressure but not temperature deviation from ISA. When temperatures are significantly below ISA (commonly below around -15°C, depending on the specific procedure/authority guidance), a cold temperature correction must be added to published minimum altitudes to maintain the intended obstacle clearance margin.",
    source: "AIP ENR 1.1 — Cold Temperature Correction Procedures",
  },
  {
    id: "ifr-o-q09",
    question: "What weather product issued by the Bureau of Meteorology specifically warns of significant meteorological phenomena hazardous to aviation, such as severe turbulence, severe icing, or widespread thunderstorm activity?",
    options: [
      "TAF (Terminal Aerodrome Forecast)",
      "SIGMET",
      "METAR",
      "SPECI",
    ],
    correctIndex: 1,
    explanation: "A SIGMET (Significant Meteorological Information) warns specifically of hazardous en route weather phenomena including severe turbulence, severe icing, widespread thunderstorms/CBs, volcanic ash, and similar hazards, distinct from routine TAF/METAR reports.",
    source: "AIP MET 1.3 — SIGMET; BOM Aviation Weather Services",
  },
  {
    id: "ifr-o-q10",
    question: "A pilot encounters moderate structural icing that is accumulating faster than the aircraft's ice protection system can shed. What is the appropriate immediate response?",
    options: [
      "Maintain course and altitude and monitor",
      "Take prompt action to exit the icing conditions — by climbing, descending, or diverting to an altitude/area with warmer temperatures or clear of visible moisture, as continuing may exceed the aircraft's certificated icing capability",
      "Increase airspeed only, altitude change is unnecessary",
      "Turn on landing lights to melt the ice",
    ],
    correctIndex: 1,
    explanation: "When ice accretion exceeds the capability of the aircraft's protection systems, the crew must actively exit the icing environment — typically by changing altitude to find warmer air or air clear of visible moisture, or by diverting — rather than continuing to accumulate ice beyond the aircraft's certificated limits.",
    source: "AIP ENR 1.1 — Icing Encounter Procedures; CASR Part 91",
  },
  {
    id: "ifr-o-q11",
    question: "What information should a comprehensive windshear PIREP include?",
    options: [
      "Only the aircraft callsign",
      "Location/phase of flight, altitude, magnitude of airspeed/altitude change experienced, and duration if known",
      "Only the time of the encounter",
      "Only whether the encounter was on climb or descent",
    ],
    correctIndex: 1,
    explanation: "A useful windshear PIREP should specify the location and phase of flight (e.g. on final at X NM), the altitude, the magnitude of the airspeed and/or altitude excursion experienced, and duration/persistence if observed, to help other pilots and ATC assess the hazard.",
    source: "AIP ENR 1.1 — PIREP Content Standards for Windshear",
  },
  {
    id: "ifr-o-q12",
    question: "What is meant by 'severe turbulence' in the standard PIREP/forecast classification?",
    options: [
      "Turbulence causing minor changes in altitude or attitude, occupants feel a slight strain against seatbelts",
      "Large, abrupt changes in altitude and/or attitude; large variations in airspeed; aircraft may be momentarily out of control; occupants forced violently against seatbelts",
      "No noticeable effect on the aircraft",
      "Turbulence only encountered in clear air above FL350",
    ],
    correctIndex: 1,
    explanation: "Severe turbulence causes large, abrupt changes in altitude/attitude and airspeed, with the aircraft possibly momentarily out of control, and occupants forced violently against restraints — a significant step up from moderate turbulence in both intensity and hazard.",
    source: "AIP ENR 1.1 — Turbulence Reporting Criteria (Severe)",
  },
  {
    id: "ifr-o-q13",
    question: "What is the general recommended vertical avoidance margin above the top of a significant thunderstorm cell if overflight cannot be avoided (and the aircraft has the performance capability)?",
    options: [
      "No margin required if above the visible cloud top",
      "At least 5,000 ft above the cell top where practicable, in recognition that turbulence and hazards can extend above the visible cloud top",
      "500 ft is generally considered sufficient",
      "Overflight of any thunderstorm is always safe regardless of altitude",
    ],
    correctIndex: 1,
    explanation: "Guidance commonly recommends a vertical clearance of at least 5,000 ft above a significant thunderstorm cell top if overflight is attempted, since turbulence, hail, and other hazards can extend well above the visible cloud top — and even this margin does not guarantee avoidance of all hazards.",
    source: "AIP ENR 1.1 — Thunderstorm Overflight Guidance",
  },
  {
    id: "ifr-o-q14",
    question: "What is the primary hazard represented by microburst-type windshear, particularly relevant to LLWAS detection?",
    options: [
      "A gradual, gentle decrease in headwind over several minutes",
      "A sudden, localised, intense downdraft that spreads out near the surface, producing rapid changes from headwind to tailwind (or vice versa) over a short distance/time, severely affecting aircraft performance on approach or departure",
      "A steady crosswind with no vertical component",
      "An increase in visibility near the surface",
    ],
    correctIndex: 1,
    explanation: "A microburst produces an intense, localised downdraft that spreads outward on hitting the surface, causing rapid shifts from headwind to tailwind (or the reverse) over a very short time/distance — a severe hazard to aircraft on approach or departure due to sudden performance loss.",
    source: "AIP ENR 1.1 — Microburst Windshear Hazard",
  },
  {
    id: "ifr-o-q15",
    question: "What must a pilot consider regarding braking action reports (e.g. 'good', 'medium', 'poor', 'nil') when planning a landing on a wet or contaminated runway?",
    options: [
      "Braking action reports are purely advisory and can be disregarded",
      "Braking action reports directly affect the applicable landing distance performance data and go/no-go decision; a 'poor' or 'nil' report may require diversion or significant increases in required landing distance margins",
      "Only the 'good' report category has any operational significance",
      "Braking action reports apply only to takeoff performance, not landing",
    ],
    correctIndex: 1,
    explanation: "Braking action reports directly feed into contaminated/wet runway landing performance calculations. A 'poor' or 'nil' report may mean the required landing distance exceeds what is available, requiring the crew to reconsider the destination or apply significant safety margins, potentially diverting.",
    source: "CASR Part 91 — Runway Surface Condition and Landing Performance",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (p) — ERSA normal and emergency procedures
// Source: AIP ENR 1.1; AIP ENR 6; ERSA GEN; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examPQuestions: ExamQuestion[] = [
  {
    id: "ifr-p-q01",
    question: "What is the primary content of the FAC (Facilities) pages in the ERSA for a given aerodrome?",
    options: [
      "Weather forecasts for the next 24 hours",
      "Detailed aerodrome facility information — runway dimensions/surface, lighting, fuel availability, communications frequencies, navigation aids, hours of operation, and other operational details",
      "Only the aerodrome's postal address",
      "Instrument approach chart minima only",
    ],
    correctIndex: 1,
    explanation: "ERSA FAC pages provide comprehensive aerodrome facility details — runway data, lighting availability, fuel types, communication and navigation frequencies, hours of operation, and administrative/operational notes — essential for flight planning to any aerodrome.",
    source: "ERSA GEN — Facilities (FAC) Section Description",
  },
  {
    id: "ifr-p-q02",
    question: "Where in the ERSA would a pilot find search and rescue (SAR) alerting procedures and relevant contact details?",
    options: [
      "In the FAC pages for each aerodrome only",
      "In the ERSA GEN section covering emergency and SAR procedures, including how to activate SARTIME/SARWATCH and relevant contact points",
      "SAR procedures are not published in ERSA at all",
      "Only in the AIP MET section",
    ],
    correctIndex: 1,
    explanation: "The ERSA GEN section contains emergency and SAR procedures, describing how alerting services operate, SARTIME/SARWATCH mechanisms, and contact information — complementing the aerodrome-specific FAC pages.",
    source: "ERSA GEN — Emergency and SAR Procedures",
  },
  {
    id: "ifr-p-q03",
    question: "What is the purpose of checking NOTAMs via NAIPS in conjunction with ERSA information before a flight?",
    options: [
      "NOTAMs replace the need to consult ERSA entirely",
      "NOTAMs provide time-critical amendments or temporary changes (e.g. runway closures, navaid outages, temporary restrictions) that supersede or modify the otherwise static published ERSA information",
      "NOTAMs are only relevant for international flights",
      "NOTAMs are not related to ERSA content at all",
    ],
    correctIndex: 1,
    explanation: "ERSA presents relatively static published aerodrome and procedural data, whereas NOTAMs (checked via NAIPS) provide the current, time-critical amendments — closures, outages, temporary hazards — that may override or modify the ERSA baseline for a specific flight.",
    source: "AIP ENR 1.1 — Relationship Between ERSA and NOTAM; NAIPS",
  },
  {
    id: "ifr-p-q04",
    question: "What does a 'mandatory frequency' (MF) requirement published in ERSA for a non-controlled aerodrome mean for an IFR pilot?",
    options: [
      "Monitoring the frequency is optional",
      "The pilot must broadcast intentions and monitor the designated MF frequency within the specified area/procedure around the aerodrome to alert other traffic of their position and intentions",
      "MF only applies to VFR traffic",
      "MF requirements are the same as a CTAF and have no additional obligations",
    ],
    correctIndex: 1,
    explanation: "At an aerodrome designated with a Mandatory Frequency (MF), all pilots — IFR and VFR — must monitor and make position/intention broadcasts on that frequency within the defined MF area/procedure to enhance mutual traffic awareness in the absence of ATC separation service.",
    source: "ERSA FAC / AIP ENR 1.1 — Mandatory Frequency Procedures",
  },
  {
    id: "ifr-p-q05",
    question: "In the event of a communication (radio) failure during IFR flight in controlled airspace, what is the general expectation for altitude if operating in IMC?",
    options: [
      "Immediately descend to the lowest safe altitude regardless of clearance",
      "Maintain the last assigned altitude (or minimum altitude for terrain clearance if higher) for a specified period, then proceed in accordance with the flight plan and comply with radio failure procedures published in the AIP",
      "Climb immediately to the highest possible altitude",
      "Land at the nearest suitable aerodrome regardless of conditions",
    ],
    correctIndex: 1,
    explanation: "Standard IFR radio failure procedure (as detailed in AIP ENR 1.1) generally requires maintaining the last assigned altitude (or an appropriate minimum safe altitude if higher) and proceeding via the flight-planned route, adjusting for expected clearances, until reaching the clearance limit and initiating approach per the published procedure.",
    source: "AIP ENR 1.1 — Communication Failure Procedures; CASR Part 91",
  },
  {
    id: "ifr-p-q06",
    question: "What is the difference between SARTIME and SARWATCH?",
    options: [
      "They are identical procedures with different names",
      "SARTIME is a nominated time by which, if the flight has not reported/arrived, search and rescue action will be initiated; SARWATCH is the alerting service itself (e.g. provided by ATC flight watch) that monitors the flight against that time",
      "SARWATCH only applies to international flights",
      "SARTIME cancels the need for any flight notification",
    ],
    correctIndex: 1,
    explanation: "SARTIME is the specific time nominated (usually on the flight notification/plan) by which the pilot must report or cancel, failing which SAR action commences. SARWATCH describes the alerting service (typically via ATC or a nominated responsible person) actively monitoring the flight against that SARTIME.",
    source: "AIP ENR 1.1 — SARTIME and SARWATCH Definitions",
  },
  {
    id: "ifr-p-q07",
    question: "What distinguishes a MAYDAY call from a PAN call?",
    options: [
      "There is no operational difference between the two",
      "MAYDAY indicates a distress condition — grave and imminent danger requiring immediate assistance; PAN indicates an urgency condition — a safety concern that does not (yet) constitute grave and imminent danger",
      "PAN is used only for medical emergencies, MAYDAY for all others",
      "MAYDAY is used only on the ground, PAN only in flight",
    ],
    correctIndex: 1,
    explanation: "MAYDAY (said three times) signals a distress condition of grave and imminent danger requiring immediate assistance. PAN (said three times) signals an urgency condition — a situation of concern for safety that does not amount to distress but warrants priority attention.",
    source: "AIP ENR 1.1 — Distress and Urgency Phraseology; ICAO Annex 10",
  },
  {
    id: "ifr-p-q08",
    question: "What is the primary purpose of an Emergency Locator Transmitter (ELT) carried on an aircraft?",
    options: [
      "To provide continuous position reporting to ATC in normal operations",
      "To automatically (or manually) transmit a distress signal on impact or activation, assisting search and rescue services in locating the aircraft",
      "To replace the requirement for a SARTIME",
      "To serve as the primary VHF communication radio",
    ],
    correctIndex: 1,
    explanation: "An ELT is designed to activate automatically upon a crash-level deceleration (or be manually triggered) and transmit a distress signal on designated frequencies (121.5/406 MHz) to aid search and rescue services in locating the aircraft.",
    source: "CASR Part 91 — ELT Carriage and Operation Requirements",
  },
  {
    id: "ifr-p-q09",
    question: "What ERSA/AIP requirement applies if a pilot cancels IFR/SARWATCH after landing at an aerodrome with no ATC or communications facility?",
    options: [
      "No action is required — SARWATCH cancels automatically upon landing",
      "The pilot must actively cancel the SARWATCH/notify arrival by an approved method (e.g. via a nominated telephone service, radio relay, or other means) within the required timeframe to prevent unnecessary SAR action from being triggered",
      "The pilot must wait for ATC to call and confirm",
      "SARWATCH only needs to be cancelled if landing at night",
    ],
    correctIndex: 1,
    explanation: "At aerodromes without direct communications/ATC coverage, the pilot remains responsible for actively cancelling SARWATCH or reporting arrival through an approved alternative method within the required timeframe, to avoid triggering unnecessary search and rescue resources.",
    source: "AIP ENR 1.1 — SARWATCH Cancellation Procedures",
  },
  {
    id: "ifr-p-q10",
    question: "What information source in ERSA would identify whether an aerodrome has an approved instrument approach procedure available and any associated notes/restrictions?",
    options: [
      "The ERSA GEN pages exclusively",
      "The aerodrome's FAC entry, cross-referenced with the relevant DAP (Departure and Approach Procedures) charts",
      "The ERSA does not contain any approach-related information",
      "Only the AIP MET section",
    ],
    correctIndex: 1,
    explanation: "The FAC entry for an aerodrome in ERSA typically notes available approach procedures and cross-references, while the full procedure detail (tracks, minima) is published in the DAP (Departure and Approach Procedures) chart set.",
    source: "ERSA FAC; AIP AD 1.1 — Relationship to DAP Charts",
  },
  {
    id: "ifr-p-q11",
    question: "During a total two-way communication failure in VMC, what is the pilot generally expected to do?",
    options: [
      "Continue as if in IMC and follow the full IFR lost-comms altitude/route procedure regardless of visibility",
      "Continue the flight in VMC where possible and land as soon as practicable at a suitable aerodrome, since visual operation removes the primary risk that lost-comms procedures are designed to mitigate",
      "Immediately declare a MAYDAY for the radio failure alone",
      "Descend to the lowest available altitude and remain there until landing",
    ],
    correctIndex: 1,
    explanation: "If VMC conditions permit, a pilot experiencing radio failure should continue in VMC and land as soon as practicable at a suitable aerodrome, since the primary risk (uncoordinated flight in IMC without ATC separation) does not apply while visual flight and self-separation remain possible.",
    source: "AIP ENR 1.1 — Radio Failure in VMC Conditions",
  },
  {
    id: "ifr-p-q12",
    question: "What ERSA content would specifically inform a pilot of the correct emergency phone number and procedures for reporting an aircraft overdue at a remote strip?",
    options: [
      "The ERSA does not cover overdue aircraft procedures",
      "The ERSA GEN section on SAR/emergency procedures, along with area-specific SAR contact information",
      "Only the destination aerodrome's individual FAC entry",
      "The AIP MET forecast section",
    ],
    correctIndex: 1,
    explanation: "The ERSA GEN section addresses emergency and SAR-related procedures broadly, including relevant contact points for reporting overdue aircraft, complementing SARTIME/SARWATCH mechanisms established during flight notification.",
    source: "ERSA GEN — SAR and Emergency Contact Information",
  },
  {
    id: "ifr-p-q13",
    question: "What is a key reason for reviewing ERSA emergency procedures as part of pre-flight planning, even for a routine IFR flight?",
    options: [
      "It is purely a formality with no practical value",
      "It ensures the pilot is familiar with correct SARTIME/SARWATCH arrangements, emergency contact numbers, and radio failure procedures specific to the route/aerodromes being used, before any emergency arises",
      "ERSA emergency procedures are identical everywhere so review is unnecessary",
      "Only required for flights over water",
    ],
    correctIndex: 1,
    explanation: "Pre-flight familiarity with relevant SAR arrangements, contact details, and radio failure procedures ensures the pilot can act correctly and promptly if an emergency does arise, rather than needing to research procedures under time pressure during the event itself.",
    source: "AIP ENR 1.1; ERSA GEN — Pre-Flight Emergency Procedure Review",
  },
  {
    id: "ifr-p-q14",
    question: "What must a pilot operating IFR without an active SARWATCH arrangement (e.g. cancelled early) understand about search and rescue response?",
    options: [
      "SAR response remains identical regardless of SARWATCH status",
      "Without an active SARWATCH, there is no mechanism actively monitoring for overdue status, meaning any accident or incident may not be detected/responded to as promptly as if SARWATCH were maintained",
      "SARWATCH is irrelevant to actual SAR response times",
      "Cancelling SARWATCH early has no safety implications",
    ],
    correctIndex: 1,
    explanation: "SARWATCH provides the active monitoring mechanism that triggers a timely search and rescue response if a flight becomes overdue. Without it, there is no structured trigger for initiating SAR action, potentially significantly delaying detection and response to an accident or incident.",
    source: "AIP ENR 1.1 — Importance of Maintaining SARWATCH",
  },
  {
    id: "ifr-p-q15",
    question: "What ERSA/AIP guidance governs the phraseology and repetition requirement for an initial MAYDAY call?",
    options: [
      "MAYDAY is said once, followed immediately by the aircraft type",
      "The word MAYDAY is transmitted three times, followed by the identification of the station addressed (if applicable), aircraft callsign, nature of the emergency, and other pertinent information (intentions, position, altitude, souls on board)",
      "MAYDAY calls require no specific format and may be phrased freely",
      "MAYDAY is only valid if transmitted on the emergency frequency 121.5 MHz",
    ],
    correctIndex: 1,
    explanation: "The standard distress call format is: MAYDAY MAYDAY MAYDAY, followed by the callsign, nature of emergency, and other pertinent details such as intentions, position, altitude, and persons on board — transmitted on the frequency in use, not necessarily only 121.5 MHz.",
    source: "AIP ENR 1.1 — Distress Message Format; ICAO Annex 10",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (q) — IFR planning
// Source: CASR 91.465; AIP ENR 1.10; AIP ENR 1.5; CASR Part 91
// ─────────────────────────────────────────────────────────────────────────────
const examQQuestions: ExamQuestion[] = [
  {
    id: "ifr-q-q01",
    question: "Under CASR 91.465, what are the primary fuel components that must be calculated for an IFR flight?",
    options: [
      "Only trip fuel and taxi fuel",
      "Taxi fuel, trip fuel, contingency fuel, alternate fuel (if required), final reserve fuel, and any additional fuel required for the specific operation (e.g. holding, APU)",
      "Only final reserve fuel is a regulatory requirement",
      "Fuel planning is at the pilot's sole discretion with no regulatory components",
    ],
    correctIndex: 1,
    explanation: "CASR 91.465 sets out the required fuel components for an IFR flight: taxi, trip, contingency, alternate (where an alternate is required), final reserve, plus any additional fuel for specific operational requirements — each must be calculated and carried.",
    source: "CASR 91.465 — Fuel Requirements for IFR Flights",
  },
  {
    id: "ifr-q-q02",
    question: "What is the purpose of 'final reserve fuel' (sometimes referred to as fixed reserve) in IFR fuel planning?",
    options: [
      "It covers additional fuel for a diversion to a second alternate",
      "It is a fixed minimum quantity of fuel intended to allow the aircraft to fly for a specified period (commonly 30 or 45 minutes depending on aircraft type) at holding speed at a specified altitude in the event of unforeseen circumstances, and must not be planned to be used for any other purpose",
      "It is fuel used exclusively for engine start and taxi",
      "It is optional and not required by regulation",
    ],
    correctIndex: 1,
    explanation: "Final reserve fuel is a fixed, non-discretionary minimum fuel quantity — for many aircraft categories equating to a specified holding time (e.g. 30–45 minutes) at a nominal altitude/speed — intended purely as a safety buffer that should not be eroded into during normal flight planning.",
    source: "CASR 91.465 — Final Reserve Fuel Requirements",
  },
  {
    id: "ifr-q-q03",
    question: "What does 'contingency fuel' account for in IFR flight planning?",
    options: [
      "Fuel for an alternate aerodrome only",
      "An allowance (commonly a percentage of trip fuel or a specified minimum) to cover unforeseen factors such as deviations from planned routing, wind variations from forecast, or minor inefficiencies not otherwise accounted for",
      "Fuel reserved exclusively for holding at the destination",
      "Fuel used only during taxi and ground operations",
    ],
    correctIndex: 1,
    explanation: "Contingency fuel provides a margin against unplanned variations from the flight-planned conditions — such as different-than-forecast winds, minor route deviations, or altitude changes — that are not large enough to require diversion planning but could otherwise erode the final reserve.",
    source: "CASR 91.465 — Contingency Fuel",
  },
  {
    id: "ifr-q-q04",
    question: "When is an alternate aerodrome required to be nominated for an IFR flight?",
    options: [
      "An alternate is never required under Australian IFR rules",
      "An alternate is required unless specific criteria are met at the destination — e.g. an approved instrument approach is available, weather at ETA is forecast to remain at or above specified minima, and other regulatory conditions are satisfied allowing the alternate requirement to be waived",
      "An alternate is required only for flights over 500 NM",
      "An alternate is required only for single-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "Under CASR provisions, an alternate aerodrome must generally be nominated unless the destination meets specific conditions — suitable approach availability, forecast weather comfortably above minima for a defined period around ETA, and other regulatory criteria — that permit the alternate requirement to be dispensed with.",
    source: "CASR 91.465 / AIP ENR 1.5 — Alternate Aerodrome Requirements",
  },
  {
    id: "ifr-q-q05",
    question: "What weather-related factors should be assessed when selecting a suitable alternate aerodrome for an IFR flight?",
    options: [
      "Only current conditions at the time of departure",
      "Forecast conditions for the expected arrival time at the alternate, ensuring they are at or above the alternate minima applicable to the approach(es) available there, plus consideration of runway/wind suitability",
      "Only the alternate's runway length, weather is irrelevant",
      "The alternate does not need weather assessment if it has an ILS",
    ],
    correctIndex: 1,
    explanation: "Alternate selection requires the forecast weather for the relevant arrival time window to be at or above the specific alternate minima for available approaches, in addition to confirming adequate runway length/surface and acceptable wind conditions for the aircraft type.",
    source: "AIP ENR 1.5 — Alternate Aerodrome Selection Criteria",
  },
  {
    id: "ifr-q-q06",
    question: "How does route selection incorporating LSALT influence IFR flight planning beyond simple distance considerations?",
    options: [
      "LSALT has no bearing on route selection, only distance matters",
      "A route with a lower LSALT may allow more favourable cruise altitudes for aircraft performance, fuel efficiency, or icing/oxygen considerations, whereas a route with high LSALT (e.g. over mountainous terrain) may force a higher, less efficient cruise level or additional oxygen/pressurisation requirements",
      "LSALT only matters for VFR flights",
      "Route selection is based solely on prevailing winds, ignoring terrain",
    ],
    correctIndex: 1,
    explanation: "LSALT directly affects which cruise altitudes are usable on a given route. A route requiring a high LSALT (e.g. through mountainous terrain) may force operation at less efficient altitudes or trigger oxygen/pressurisation/icing considerations, making an alternative lower-LSALT routing more operationally favourable if available.",
    source: "AIP ENR 1.1 / ENR 1.5 — Route Planning and LSALT Considerations",
  },
  {
    id: "ifr-q-q07",
    question: "What weight and balance consideration is particularly critical for IFR departures from aerodromes with high LSALT requirements along the departure route?",
    options: [
      "Weight and balance has no relevance to IFR departure planning",
      "The aircraft's climb performance (and hence the achievable time/distance to reach the required LSALT or MSA) must be assessed against takeoff weight, since an overweight aircraft may be unable to achieve the necessary climb gradient to clear terrain along the departure track",
      "Only centre of gravity matters, weight is irrelevant to LSALT compliance",
      "LSALT considerations only apply after reaching cruise altitude, not during departure",
    ],
    correctIndex: 1,
    explanation: "Takeoff weight directly affects climb gradient and rate. If the departure route requires reaching a high LSALT or MSA within a limited distance, the aircraft's weight must be assessed to confirm adequate climb performance is available — an overweight aircraft may be unable to comply with required terrain clearance climb gradients.",
    source: "CASR Part 91 — Departure Performance and Terrain Clearance Planning",
  },
  {
    id: "ifr-q-q08",
    question: "Why must NOTAMs be checked as part of IFR flight planning, even for a route/aerodrome flown regularly?",
    options: [
      "NOTAMs never change and only need to be checked once per year",
      "NOTAMs provide time-critical information on temporary hazards, closures, navaid outages, or procedure changes that may not be reflected in the pilot's existing familiarity or in current charts, and can materially affect the safety or legality of the flight",
      "NOTAMs are only relevant to international operations",
      "NOTAM checks are optional for IFR pilots under Australian regulation",
    ],
    correctIndex: 1,
    explanation: "Even a route flown often may be affected by new, temporary conditions — a closed runway, a navaid outage, a changed procedure, or a new hazard — that are only captured through a current NOTAM check, making this step mandatory regardless of pilot familiarity.",
    source: "CASR Part 91.185 — NOTAM Check Requirement; AIP ENR 1.1",
  },
  {
    id: "ifr-q-q09",
    question: "Under AIP ENR 1.10, what is a core requirement for a valid ATC IFR flight plan lodgement?",
    options: [
      "It must be lodged verbally to the destination tower only",
      "It must be lodged in the prescribed ICAO flight plan format (or approved equivalent), submitted with sufficient lead time before the proposed departure to allow processing, and contain accurate route, altitude, and aircraft equipment information",
      "It only needs to specify the departure and destination aerodromes",
      "Flight plans are not required for any IFR flight in Australia",
    ],
    correctIndex: 1,
    explanation: "IFR flight plans must be lodged in the prescribed ICAO format (or an approved local equivalent), submitted with adequate lead time for ATC processing, and must accurately reflect the intended route, altitude, aircraft type/equipment, and other required fields.",
    source: "AIP ENR 1.10 — Flight Plan Lodgement Requirements",
  },
  {
    id: "ifr-q-q10",
    question: "In the ICAO flight plan form, what does Item (Field) 10 — commonly labelled 'Equipment' — describe, and why is it critical for IFR operations?",
    options: [
      "It records the pilot's licence number",
      "It specifies the navigation, communication, and surveillance equipment carried (e.g. GNSS, transponder capability), which ATC uses to determine what procedures (e.g. RNP approaches, reduced separation) the aircraft is eligible for",
      "It records only the aircraft's paint scheme",
      "Field 10 is optional and rarely completed",
    ],
    correctIndex: 1,
    explanation: "Field 10 (equipment) communicates to ATC the aircraft's navigation, communication, and surveillance capability (e.g. GNSS/RNP approval, transponder mode). This directly affects what procedures, routings, and separation standards ATC can apply to that flight, making accurate completion essential.",
    source: "AIP ENR 1.10 — Flight Plan Form Field 10 (Equipment)",
  },
  {
    id: "ifr-q-q11",
    question: "What is the purpose of Field 18 ('Other Information') on the ICAO flight plan, in the context of IFR operations?",
    options: [
      "It is unused and left blank on all IFR flight plans",
      "It carries additional operational details such as RVR requirements, PBN capability codes, communications failure procedures notes, or other remarks not captured elsewhere in the standard fields",
      "It only records the pilot's date of birth",
      "It is used exclusively for VFR flight plans",
    ],
    correctIndex: 1,
    explanation: "Field 18 allows additional structured remarks — such as PBN capability codes, communication/navigation notes, RVR requirements, or other pertinent details — that support ATC and other agencies in correctly handling the flight, beyond what the standard fields capture.",
    source: "AIP ENR 1.10 — Flight Plan Form Field 18 (Other Information)",
  },
  {
    id: "ifr-q-q12",
    question: "What is a 'drift-down' procedure, and in what context is it particularly relevant to IFR planning for multi-engine turbine or piston aircraft?",
    options: [
      "A procedure for descending during normal cruise to save fuel",
      "The planned descent profile and terrain clearance analysis following an engine failure at cruise altitude over high terrain, ensuring the aircraft can maintain adequate obstacle clearance on reduced power as it descends to a one-engine-inoperative cruise altitude",
      "A procedure used only during a normal missed approach",
      "A term describing gradual loss of airspeed in a holding pattern",
    ],
    correctIndex: 1,
    explanation: "Drift-down planning addresses what happens if an engine fails while operating over terrain requiring a high LSALT — the aircraft's one-engine-inoperative climb/descent performance must be assessed to confirm it can maintain safe terrain clearance as it drifts down to a sustainable single-engine cruise altitude.",
    source: "CASR Part 91 — Engine Failure/Drift-Down Performance Planning",
  },
  {
    id: "ifr-q-q13",
    question: "Why is drift-down analysis particularly critical for planning routes over mountainous terrain with a multi-engine piston (MEP) aircraft compared to a modern turbine?",
    options: [
      "There is no difference — drift-down performance is identical regardless of aircraft type",
      "MEP aircraft typically have significantly lower one-engine-inoperative climb/service ceiling performance relative to turbine aircraft, meaning the achievable drift-down altitude may be well below the LSALT for some mountainous routes, requiring specific route/altitude contingency planning",
      "Drift-down only applies to turbine aircraft, not MEP",
      "MEP aircraft never need to consider engine failure in planning",
    ],
    correctIndex: 1,
    explanation: "MEP aircraft generally have lower single-engine service ceilings and climb performance than turbine aircraft, so an engine failure over high-LSALT terrain may force the aircraft down to an altitude below the safe terrain clearance level — requiring the crew to have pre-planned escape routes or track adjustments for this scenario.",
    source: "CASR Part 91 — Multi-Engine Piston OEI Performance Planning",
  },
  {
    id: "ifr-q-q14",
    question: "What role does the flight plan's 'Q' field information (route and points) play in ATC's ability to provide services to an IFR flight?",
    options: [
      "It has no operational role, it is purely administrative record-keeping",
      "It defines the exact route the aircraft intends to fly, allowing ATC to plan separation, issue appropriate clearances, and identify LSALT/MSA and airspace crossing requirements along that specific track",
      "It only matters for flights above FL290",
      "The route field is optional for domestic IFR flights",
    ],
    correctIndex: 1,
    explanation: "The route field defines the specific track the flight intends to follow, which ATC uses to plan separation from other traffic, issue clearances consistent with the filed route, and cross-check against airspace, LSALT, and procedural requirements along that path.",
    source: "AIP ENR 1.10 — Flight Plan Route Field",
  },
  {
    id: "ifr-q-q15",
    question: "What overall principle should govern an IFR pilot's approach to fuel and route planning when multiple valid alternates and fuel strategies are available?",
    options: [
      "Always choose the option that minimises fuel cost, regardless of other factors",
      "Select the combination of route, altitude, alternate, and fuel load that provides the greatest safety margin consistent with regulatory minimums, factoring in weather trends, aircraft performance, terrain, and realistic contingencies — not merely the minimum legally required figures",
      "Fuel and route planning should be finalised only after departure, based on conditions encountered en route",
      "Any combination meeting the bare CASR 91.465 minimums is equally acceptable in all circumstances",
    ],
    correctIndex: 1,
    explanation: "While CASR 91.465 sets regulatory minimums, sound IFR planning practice is to build in a realistic safety margin above bare minimums where operationally practical — considering weather trends, terrain, and aircraft performance — rather than treating the regulatory minimum fuel/route figures as the automatic default in all conditions.",
    source: "CASR 91.465; AIP ENR 1.5 — Fuel and Route Planning Principles",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM BANK — assembled
// ─────────────────────────────────────────────────────────────────────────────

const exam_j: Exam = {
  id: "ifr-j",
  title: "IFR procedures for all airspace classifications",
  subtitle: "CASA Form 61-1503 — Ground Theory (j)",
  questions: examJQuestions,
};

const exam_k: Exam = {
  id: "ifr-k",
  title: "Departure and approach instrument procedures",
  subtitle: "CASA Form 61-1503 — Ground Theory (k)",
  questions: examKQuestions,
};

const exam_l: Exam = {
  id: "ifr-l",
  title: "Operations below LSALT and MSA for day and night",
  subtitle: "CASA Form 61-1503 — Ground Theory (l)",
  questions: examLQuestions,
};

const exam_m: Exam = {
  id: "ifr-m",
  title: "GNSS and PBN standards",
  subtitle: "CASA Form 61-1503 — Ground Theory (m)",
  questions: examMQuestions,
};

const exam_n: Exam = {
  id: "ifr-n",
  title: "Circling approaches",
  subtitle: "CASA Form 61-1503 — Ground Theory (n)",
  questions: examNQuestions,
};

const exam_o: Exam = {
  id: "ifr-o",
  title: "Adverse weather operations",
  subtitle: "CASA Form 61-1503 — Ground Theory (o)",
  questions: examOQuestions,
};

const exam_p: Exam = {
  id: "ifr-p",
  title: "ERSA normal and emergency procedures",
  subtitle: "CASA Form 61-1503 — Ground Theory (p)",
  questions: examPQuestions,
};

const exam_q: Exam = {
  id: "ifr-q",
  title: "IFR planning",
  subtitle: "CASA Form 61-1503 — Ground Theory (q)",
  questions: examQQuestions,
};

export const EXAMS_IFR_PART2: Exam[] = [exam_j, exam_k, exam_l, exam_m, exam_n, exam_o, exam_p, exam_q];
