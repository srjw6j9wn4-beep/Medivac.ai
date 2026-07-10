/**
 * IFR Ground Theory Exam Bank — Part 1 (Topics a–i)
 * RFDS South Eastern Section — Medivac.ai
 *
 * Maps directly to CASA Form 61-1503 (Instrument Rating — Ground Theory
 * Examination Statement of Achievement) syllabus topics (a) through (i):
 *
 *   (a) Privileges and limitations of the IR and endorsements
 *   (b) Proficiency check requirements
 *   (c) IFR and approach recency requirements
 *   (d) Night recency requirements
 *   (e) Night VFR operations
 *   (f) Aircraft instrument requirements
 *   (g) Interpreting operational and meteorological information
 *   (h) Take-off minima
 *   (i) Holding and alternate requirements
 *
 * Pass mark: 70%   Questions: 15 per exam
 */

import { Exam, ExamQuestion } from './theoryExams';

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (a) — Privileges and limitations of the IR and endorsements
// Source: CASR Part 61 Subpart 61.G; CASR 61.600–61.640
// ─────────────────────────────────────────────────────────────────────────────
const ifrAQuestions: ExamQuestion[] = [
  {
    id: "ifr-a-q01",
    question: "What is the primary privilege conferred on the holder of an Instrument Rating (IR) under CASR 61.600?",
    options: [
      "The privilege to fly any aircraft type without further endorsement",
      "The privilege to conduct flight under the IFR and to fly in IMC, subject to the ratings, endorsements and currency held",
      "The privilege to act as an instructor for instrument flying",
      "The privilege to operate as PIC on RPT operations regardless of aircraft category",
    ],
    correctIndex: 1,
    explanation: "CASR 61.600 provides that the holder of an IR may conduct flight under the IFR, including flight in IMC, but only within the scope of the specific ratings, endorsements and recency the pilot holds for the aircraft category and approach types being flown.",
    source: "CASR Part 61.600",
  },
  {
    id: "ifr-a-q02",
    question: "An IR holder wishes to fly an ILS approach to minima in a multi-engine aeroplane. What is required in addition to the base IR?",
    options: [
      "Nothing further — the IR alone permits all approach types",
      "A separate command instrument rating for multi-engine aircraft only",
      "The appropriate instrument approach category endorsement (e.g. ILS) recorded in the pilot's logbook or CASA record",
      "A current air transport pilot licence",
    ],
    correctIndex: 2,
    explanation: "Beyond the base IR, CASR 61.610 requires the pilot to hold the specific instrument approach category endorsement (ILS, NDB, VOR, RNP/RNAV or GNSS) relevant to the approach being flown, appropriately recorded.",
    source: "CASR Part 61.610",
  },
  {
    id: "ifr-a-q03",
    question: "Which of the following instrument approach endorsement categories exist under the CASR 61 IR framework?",
    options: [
      "ILS, NDB, VOR, RNP/RNAV (GNSS) only — no others exist",
      "ILS, NDB, VOR and RNP/RNAV (including GNSS) approach categories",
      "Only GNSS, since all other approach types have been withdrawn",
      "Category I, II and III only, with no ground-based navaid distinction",
    ],
    correctIndex: 1,
    explanation: "The CASR Part 61 instrument rating syllabus recognises distinct approach category endorsements: ILS, NDB, VOR and RNP/RNAV (which includes GNSS-based approaches). A pilot must hold the relevant endorsement for the approach type flown.",
    source: "CASR Part 61 Subpart 61.G; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-a-q04",
    question: "What additional requirement applies specifically to conducting a GNSS-based instrument approach under an IR?",
    options: [
      "No additional requirement beyond the base IR",
      "The pilot must hold the RNP/RNAV (GNSS) approach endorsement and the aircraft must have approved GNSS equipment for the approach type flown",
      "A current CPL is required in addition to the IR",
      "The pilot must hold a separate 'GNSS rating' issued independently of the IR",
    ],
    correctIndex: 1,
    explanation: "To fly a GNSS approach the pilot must hold the RNP/RNAV (GNSS) endorsement as part of the IR, and the aircraft must be equipped with GNSS navigation equipment approved for the specific approach procedure (e.g. RNP APCH).",
    source: "CASR 61.610; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-a-q05",
    question: "May an IR holder legally fly in IMC at night without a night VFR or IR-specific night endorsement, given the IR itself covers night operation?",
    options: [
      "No — a separate 'night IMC' endorsement is required beyond the IR",
      "Yes — the IR privileges inherently cover operations in IMC by day or night provided the pilot is current and the aircraft is IFR-equipped",
      "Only if the flight remains below 5,000 ft",
      "Only with a check pilot on board",
    ],
    correctIndex: 1,
    explanation: "The Instrument Rating privileges under CASR 61.600 apply to IMC flight by day or night — there is no separate 'night IMC' endorsement. The pilot must simply hold the IR, be current, and operate a suitably equipped aircraft.",
    source: "CASR 61.600",
  },
  {
    id: "ifr-a-q06",
    question: "A pilot holds an IR with an NDB approach endorsement only. Can they legally fly a published RNP approach?",
    options: [
      "Yes, because all instrument approaches are covered once any IR endorsement is held",
      "No — the RNP/RNAV (GNSS) endorsement must be separately held before flying an RNP approach",
      "Yes, but only in VMC",
      "Only if flying single-pilot IFR",
    ],
    correctIndex: 1,
    explanation: "Each approach category endorsement (ILS, NDB, VOR, RNP/RNAV) is separate. Holding an NDB endorsement does not confer privileges to fly RNP/RNAV or GNSS approaches; the specific endorsement for that approach type must be held.",
    source: "CASR 61.610; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-a-q07",
    question: "Under CASR Part 61, who may act as pilot-in-command (PIC) of an IFR flight in IMC?",
    options: [
      "Any licence holder with 200 hours total time",
      "A pilot holding a current IR appropriate to the aircraft category, with the relevant approach endorsements and current IFR recency",
      "Any commercial pilot licence holder regardless of instrument training",
      "Only pilots holding an ATPL",
    ],
    correctIndex: 1,
    explanation: "PIC of an IFR flight in IMC must hold a current IR appropriate to the category of aircraft flown (aeroplane, helicopter), hold endorsements for any approach types to be flown, and satisfy the recency requirements of CASR 61.870.",
    source: "CASR Part 61 Subpart 61.G",
  },
  {
    id: "ifr-a-q08",
    question: "What is the key distinction between 'currency' and 'recency' as applied to an IR holder?",
    options: [
      "They are identical terms used interchangeably with no regulatory difference",
      "Currency refers to the IR itself remaining valid (not expired/suspended); recency refers to meeting the specific recent-experience requirements (e.g. approaches in the last 90 days) to exercise IFR privileges",
      "Currency applies only to medical certificates; recency applies only to licences",
      "Recency is a synonym for the proficiency check interval only",
    ],
    correctIndex: 1,
    explanation: "Currency is about the rating remaining valid and not lapsed or revoked. Recency is the CASR 61.870 requirement to have flown a minimum number of IFR legs and approaches within the preceding 90 days to actually exercise the privileges in IMC.",
    source: "CASR 61.600; CASR 61.870",
  },
  {
    id: "ifr-a-q09",
    question: "An IR holder's proficiency check has lapsed beyond the permitted grace period. What is the effect on their privileges?",
    options: [
      "No effect — the IR remains fully valid regardless of proficiency check status",
      "The IR privileges are suspended until a proficiency check is successfully completed",
      "Only night IFR privileges are affected",
      "The pilot may still fly IFR but not file to alternates",
    ],
    correctIndex: 1,
    explanation: "If the required proficiency check (IPC) is not completed within the specified interval, the pilot may not exercise the privileges of the IR until a satisfactory proficiency check has been completed.",
    source: "CASR 61.870; CASR 61.885",
  },
  {
    id: "ifr-a-q10",
    question: "Which statement correctly describes IR privileges regarding single-pilot IFR (SPIFR) operations?",
    options: [
      "SPIFR is automatically included in every IR without further consideration",
      "SPIFR privileges require the aircraft to be approved for single-pilot IFR operation and the pilot to meet any operator/aircraft-specific SPIFR training requirements",
      "SPIFR is prohibited under all Australian IFR operations",
      "SPIFR only applies to turbine aircraft",
    ],
    correctIndex: 1,
    explanation: "While the IR itself does not preclude single-pilot operation, SPIFR requires the aircraft type to be certified/approved for single-pilot IFR and, for many operators, additional SPIFR-specific training and checking beyond the base IR.",
    source: "CASR Part 61 Subpart 61.G; CASA MOS Part 61",
  },
  {
    id: "ifr-a-q11",
    question: "What limitation applies to an IR holder who has never completed a VOR approach endorsement but holds ILS and RNP endorsements?",
    options: [
      "They may still fly VOR approaches under the general IR privileges",
      "They may not fly a VOR approach until the VOR approach endorsement is completed and recorded",
      "They may fly a VOR approach only in visual conditions",
      "The limitation only applies at night",
    ],
    correctIndex: 1,
    explanation: "Instrument approach endorsements are procedure-specific. Without a VOR approach endorsement, the pilot is not authorised to fly VOR approaches, regardless of holding other approach endorsements.",
    source: "CASR 61.610; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-a-q12",
    question: "Does the IR permit a pilot to fly into Class A airspace without an ATC clearance?",
    options: [
      "Yes, the IR alone authorises entry to Class A airspace without clearance",
      "No — entry to controlled airspace, including Class A, always requires an ATC clearance regardless of rating held",
      "Only above FL200",
      "Only if VMC exists at the time",
    ],
    correctIndex: 1,
    explanation: "Holding an IR authorises IFR flight and IMC capability but does not remove the requirement to obtain an ATC clearance before entering controlled airspace, including Class A.",
    source: "CASR Part 91; AIP ENR 1.1",
  },
  {
    id: "ifr-a-q13",
    question: "A newly issued IR holder has an ILS endorsement but has not flown an actual ILS approach in IMC. Are they legally permitted to fly the approach in IMC?",
    options: [
      "No, a period of supervised IMC experience is mandatory before use",
      "Yes — once the endorsement is granted and recency requirements are met, the pilot may exercise that privilege in actual IMC",
      "Only with an instructor on board for the first five approaches",
      "Only in daylight hours",
    ],
    correctIndex: 1,
    explanation: "Once an approach endorsement is granted (having met the training and testing standard) and the pilot satisfies recency requirements, they are legally entitled to fly that approach type in actual IMC without further supervision.",
    source: "CASR 61.610; CASR 61.870",
  },
  {
    id: "ifr-a-q14",
    question: "How does an Instrument Rating (Command) differ in privilege from an Instrument Rating restricted to command under supervision?",
    options: [
      "There is no such distinction under CASR Part 61",
      "The command IR allows the holder to act as PIC on IFR flights without supervision, subject to endorsements/recency; a restricted or 'under supervision' variant limits IFR command privileges until further training/checking is completed",
      "Both allow unrestricted command with no distinction",
      "The distinction only applies to multi-crew jet operations",
    ],
    correctIndex: 1,
    explanation: "CASR Part 61 recognises that an IR can be issued or endorsed to limit the holder to acting under supervision until specified experience/training milestones are met, after which full unsupervised command privileges apply.",
    source: "CASR Part 61 Subpart 61.G",
  },
  {
    id: "ifr-a-q15",
    question: "What must an IR holder verify before accepting a clearance for an approach type they are endorsed for, but have not flown in over 12 months?",
    options: [
      "Nothing — the endorsement itself is sufficient authority regardless of elapsed time",
      "That their IFR/approach recency under CASR 61.870 is current, and if lapsed, that an appropriate proficiency check or recency-restoring flight has been completed",
      "That the aircraft has dual VOR receivers fitted",
      "That the flight is conducted only in VMC as a precaution",
    ],
    correctIndex: 1,
    explanation: "Holding the endorsement is necessary but not sufficient — the pilot must also satisfy the ongoing recency requirements of CASR 61.870. If recency has lapsed, the privilege cannot be exercised until it is re-established.",
    source: "CASR 61.870; CASR 61.600",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (b) — Proficiency check requirements
// Source: CASR Part 61 Subpart 61.G; CASR 61.870–61.885
// ─────────────────────────────────────────────────────────────────────────────
const ifrBQuestions: ExamQuestion[] = [
  {
    id: "ifr-b-q01",
    question: "How often must an Instrument Proficiency Check (IPC) be completed to maintain the privileges of an IR under CASR 61.870?",
    options: [
      "Every 12 months",
      "Every 24 months",
      "Every 6 months",
      "Only once, at initial issue",
    ],
    correctIndex: 0,
    explanation: "CASR 61.870 requires an IPC to be completed within the preceding 12 months for the pilot to exercise the privileges of the instrument rating.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-b-q02",
    question: "Who is authorised to conduct an IPC under CASR 61.875?",
    options: [
      "Any licensed commercial pilot",
      "An appropriately approved testing officer, flight examiner, or authorised check pilot endorsed to conduct instrument proficiency checks",
      "Any CASA-registered flying instructor regardless of instrument endorsement",
      "The pilot's chief pilot without further approval",
    ],
    correctIndex: 1,
    explanation: "CASR 61.875 specifies that only a person holding the appropriate approval — such as a CASA flight examiner or an approved check pilot with IPC testing authority — may conduct a valid IPC.",
    source: "CASR 61.875",
  },
  {
    id: "ifr-b-q03",
    question: "Which elements must an IPC assess as a minimum?",
    options: [
      "VFR navigation skills only",
      "Instrument flying skills including at least one precision and one non-precision approach, holding procedures, and recovery from unusual attitudes/instrument failures as applicable",
      "Only a straight-in ILS approach",
      "Only radio communications proficiency",
    ],
    correctIndex: 1,
    explanation: "An IPC must include a representative sample of instrument flying tasks: approach procedures (precision and non-precision as relevant to endorsements held), holding, and abnormal/emergency instrument procedures.",
    source: "CASR 61.870; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-b-q04",
    question: "What is the fundamental difference between an IPC and an OPC (Operator Proficiency Check)?",
    options: [
      "They are the same check with different names",
      "An IPC satisfies the CASR instrument rating recency/currency requirement generically; an OPC is an operator-specific check often combining IPC content with operator SOP and type-specific procedures under an AOC",
      "An OPC is only for VFR pilots",
      "An IPC is conducted only in a simulator, while an OPC is only conducted in the aircraft",
    ],
    correctIndex: 1,
    explanation: "The IPC satisfies the generic CASR instrument rating proficiency requirement. Many air operators combine this with operator-specific procedures and standards into an OPC, which may satisfy both the CASR IPC requirement and the operator's AOC obligations simultaneously.",
    source: "CASR 61.870; CASA MOS Part 61",
  },
  {
    id: "ifr-b-q05",
    question: "Does a Biennial Flight Review (BFR) satisfy the requirement for an IPC?",
    options: [
      "Yes, a BFR always covers instrument proficiency automatically",
      "No — a BFR is a separate general competency check and does not by itself satisfy the specific IPC requirements for instrument privileges",
      "Only if conducted in IMC",
      "Only for single-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "The BFR is a general flight review addressing broad flying competency and is a distinct requirement from the IPC. An IPC specifically tests instrument flying skills and must be conducted to its own standard to renew IR privileges.",
    source: "CASR 61.870; CASR Part 61 Subpart 61.G",
  },
  {
    id: "ifr-b-q06",
    question: "May an IPC be conducted in an approved Flight Simulation Training Device (FSTD) rather than the actual aircraft?",
    options: [
      "No, an IPC must always be conducted in the actual aircraft type",
      "Yes, provided the FSTD is approved to the appropriate level for IPC credit and covers the required approach types and endorsements",
      "Only for turbine aircraft, never for piston aircraft",
      "Only if the aircraft is unserviceable at the time",
    ],
    correctIndex: 1,
    explanation: "An approved FSTD of the appropriate qualification level may be used to conduct an IPC, provided it can adequately represent the approach procedures and endorsements being tested.",
    source: "CASR 61.870; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-b-q07",
    question: "If a pilot's IPC lapses by more than the permitted grace period, what must occur before IFR privileges may again be exercised?",
    options: [
      "Nothing — the pilot may resume IFR flying immediately after lapse",
      "A new satisfactory IPC must be completed with an authorised person before resuming IFR privileges",
      "Only a self-declaration of competency is required",
      "A medical certificate renewal alone restores privileges",
    ],
    correctIndex: 1,
    explanation: "Once the IPC validity period has lapsed, the pilot cannot legally exercise IR privileges until a new IPC is satisfactorily completed by an authorised examiner or check pilot.",
    source: "CASR 61.870; CASR 61.885",
  },
  {
    id: "ifr-b-q08",
    question: "What documentation must be completed following a successful IPC?",
    options: [
      "No documentation is required — a verbal confirmation suffices",
      "An endorsement/entry in the pilot's logbook or CASA-recognised record, signed by the person conducting the check, recording the date and scope of the check",
      "Only a receipt of payment",
      "A CASA Form 61-1503 is completed instead of a logbook entry",
    ],
    correctIndex: 1,
    explanation: "The person conducting the IPC must make an appropriately dated and signed entry in the pilot's logbook (or equivalent record) confirming successful completion, which establishes the new 12-month validity period.",
    source: "CASR 61.870; CASR 61.875",
  },
  {
    id: "ifr-b-q09",
    question: "For a multi-engine IR holder, must the IPC be conducted with one engine simulated inoperative?",
    options: [
      "No, single-engine work is never included in an IPC",
      "Where relevant to the class/type rating, the IPC should include representative engine-out instrument procedures appropriate to the aircraft category",
      "Only if requested by the pilot",
      "Only for turboprop aircraft, never for piston twins",
    ],
    correctIndex: 1,
    explanation: "For multi-engine aircraft, the IPC should include asymmetric (simulated engine-out) instrument flying as relevant, since this reflects a realistic operational and emergency scenario for that aircraft category.",
    source: "CASA MOS Part 61 §8.5; CASR 61.870",
  },
  {
    id: "ifr-b-q10",
    question: "Can renewal of a lapsed Instrument Rating be achieved solely via a proficiency check, without reapplying for a new rating?",
    options: [
      "No, a lapsed IR always requires a completely new application and full flight test",
      "Yes — in many cases a satisfactory proficiency check within the applicable period can renew/reactivate the rating without a full re-issue process",
      "Only if the lapse is less than one week",
      "Only via a written exam, with no flight component",
    ],
    correctIndex: 1,
    explanation: "Where the lapse is within the allowable timeframe under CASR provisions, a satisfactory proficiency check can renew the rating's currency without requiring the pilot to undergo the complete initial issue process.",
    source: "CASR 61.870; CASR 61.885",
  },
  {
    id: "ifr-b-q11",
    question: "Which best describes the relationship between recency (CASR 61.870 approach/IFR currency) and the annual IPC?",
    options: [
      "They are unrelated and independent requirements with no interaction",
      "The IPC re-establishes both rating currency and satisfies the recency requirement at the time it is passed; ongoing recency must then be separately maintained between IPCs",
      "Recency automatically extends for 12 months once granted at any point, regardless of activity",
      "The IPC only affects night privileges",
    ],
    correctIndex: 1,
    explanation: "Passing an IPC restores/confirms both the rating's overall currency and satisfies recency at that moment. Between IPCs, the pilot must independently maintain 90-day recency (approaches, IFR legs) through actual flying to keep exercising privileges.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-b-q12",
    question: "What is a key content difference expected in an OPC compared to a basic CASR IPC?",
    options: [
      "There is no difference — OPCs never include operator SOPs",
      "An OPC typically incorporates the operator's specific standard operating procedures, MEL considerations, and CRM/company-specific standards in addition to the generic instrument competency items",
      "OPCs never include instrument approaches",
      "OPCs are shorter and omit holding procedures",
    ],
    correctIndex: 1,
    explanation: "Because an OPC is conducted under an AOC to satisfy an operator's own check-and-training system, it typically layers company SOPs, MEL/CDL procedures and CRM standards on top of the core instrument competency assessment.",
    source: "CASA MOS Part 61; CASR Part 61 Subpart 61.G",
  },
  {
    id: "ifr-b-q13",
    question: "A pilot completes an IPC on 10 March. By what date must the next IPC be completed to avoid a lapse in privileges?",
    options: [
      "10 March the following year (within 12 months of the previous check)",
      "10 June the same year",
      "There is no fixed date — only flight hours matter",
      "31 December of the same calendar year",
    ],
    correctIndex: 0,
    explanation: "The 12-month validity period runs from the date of the previous satisfactory IPC, so the next IPC must be completed on or before the same date 12 months later to maintain continuous privileges.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-b-q14",
    question: "Does successfully completing an IPC automatically satisfy the requirement for a separate class or type rating proficiency check on the same aircraft?",
    options: [
      "Yes, in all cases the IPC covers all other proficiency check requirements",
      "Not necessarily — a class/type rating proficiency check may be a distinct requirement from the instrument-specific IPC, though operators often combine them into a single event",
      "No, IPCs and type proficiency checks are never combinable",
      "Only turbine type ratings require a separate check; piston types do not",
    ],
    correctIndex: 1,
    explanation: "While operators frequently combine the IPC with type/class proficiency checks for efficiency, they are conceptually distinct requirements; the specific combination and coverage must be verified against the relevant CASR and operator procedures.",
    source: "CASR Part 61 Subpart 61.G; CASA MOS Part 61",
  },
  {
    id: "ifr-b-q15",
    question: "Which statement about examiner qualification for conducting an IPC is correct?",
    options: [
      "Any pilot with an IR of their own may conduct another pilot's IPC",
      "The person conducting the IPC must hold a specific CASA authorisation/approval (e.g. as a flight examiner or approved check pilot) recognised for instrument proficiency testing",
      "Only CASA staff employees may conduct IPCs",
      "IPCs may be self-certified by the pilot under test",
    ],
    correctIndex: 1,
    explanation: "CASR 61.875 requires the examiner to hold specific CASA-recognised authority to conduct instrument proficiency checks — merely holding a personal IR is not sufficient to test another pilot.",
    source: "CASR 61.875",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (c) — IFR and approach recency requirements
// Source: CASR 61.870; CASR 61.395
// ─────────────────────────────────────────────────────────────────────────────
const ifrCQuestions: ExamQuestion[] = [
  {
    id: "ifr-c-q01",
    question: "What is the standard IFR recency requirement under CASR 61.870 for a pilot to act as PIC under the IFR?",
    options: [
      "At least 1 IFR flight in the preceding 12 months",
      "At least 3 IFR flights (legs) including instrument approaches, within the preceding 90 days",
      "At least 10 hours of any flying in the preceding 90 days",
      "No recency requirement exists beyond holding a current IR",
    ],
    correctIndex: 1,
    explanation: "CASR 61.870 requires a pilot to have conducted at least 3 IFR flights, including instrument approaches, within the preceding 90 days to exercise IFR privileges as PIC.",
    source: "CASR 61.870(2)",
  },
  {
    id: "ifr-c-q02",
    question: "A pilot flew 2 IFR legs with approaches 60 days ago and none since. Are they current to depart IFR today?",
    options: [
      "Yes, 2 legs within 90 days is sufficient",
      "No — a minimum of 3 IFR legs (with approaches) within the preceding 90 days is required; 2 legs does not satisfy the recency standard",
      "Yes, because the legs occurred within 90 days regardless of quantity",
      "It depends only on total flight hours, not leg count",
    ],
    correctIndex: 1,
    explanation: "The regulation specifies a minimum of 3 qualifying IFR legs within 90 days. Two legs, regardless of recency within the window, do not meet the threshold, so the pilot is not IFR current.",
    source: "CASR 61.870(2)",
  },
  {
    id: "ifr-c-q03",
    question: "What specifically must each of the 3 qualifying IFR flights within the 90-day window include to count toward recency?",
    options: [
      "Simply operating under an IFR flight plan with no approach requirement",
      "Operation under the IFR including the conduct of an instrument approach procedure",
      "A minimum of 2 hours flight time regardless of approach type",
      "VMC conditions maintained throughout the flight",
    ],
    correctIndex: 1,
    explanation: "To count toward the 90-day recency requirement, each flight must be conducted under the IFR and include an instrument approach procedure, not merely an IFR flight plan without an approach.",
    source: "CASR 61.870(2)",
  },
  {
    id: "ifr-c-q04",
    question: "How is 'approach recency' distinct from general 'IFR recency' under CASR 61.870?",
    options: [
      "They are identical requirements with no distinction",
      "IFR recency requires 3 IFR legs in 90 days; approach recency more specifically addresses maintaining currency in the actual instrument approach procedures (e.g. types flown) used to satisfy that requirement",
      "Approach recency is measured over 12 months, not 90 days",
      "Approach recency applies only to helicopter operations",
    ],
    correctIndex: 1,
    explanation: "IFR recency (3 legs/90 days) is the overarching requirement; embedded within it is the expectation that the approaches flown are representative of the approach types (endorsements) the pilot intends to use, ensuring genuine currency rather than a technical box-tick.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-c-q05",
    question: "May time spent in an approved FSTD count toward the 90-day IFR/approach recency requirement?",
    options: [
      "No, only actual aircraft flight counts toward recency",
      "Yes, provided the FSTD is approved to a level that permits recency credit for IFR flights and approaches under the applicable CASR/MOS provisions",
      "Only for jet aircraft recency, not piston or turboprop",
      "FSTD time only counts for night recency, not IFR recency",
    ],
    correctIndex: 1,
    explanation: "Where the FSTD holds the appropriate qualification level, time and approaches conducted in it can be credited toward the 90-day IFR recency requirement, subject to the specific MOS provisions governing that device.",
    source: "CASR 61.870; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-c-q06",
    question: "What is the consequence for a pilot who has lapsed their 90-day IFR recency but still holds a currently valid IR (IPC not yet due)?",
    options: [
      "No consequence — the IR itself is sufficient authority to fly IFR regardless of recent experience",
      "The pilot may not act as PIC under the IFR until recency is re-established, even though the IR itself remains valid",
      "The pilot may fly IFR but only above 10,000 ft",
      "The pilot must fly with a check pilot for the remainder of the calendar year",
    ],
    correctIndex: 1,
    explanation: "Recency and rating currency are separate. Even with a valid, non-lapsed IR, a pilot who has not met the 90-day recency requirement cannot exercise IFR privileges as PIC until recency is restored — typically by flying qualifying legs/approaches or via an IPC.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-c-q07",
    question: "How can a pilot who has lapsed 90-day recency re-establish it without a full IPC, assuming within the IPC's 12-month validity?",
    options: [
      "It is impossible — an IPC is always mandatory to restore any lapsed recency",
      "By flying the required number of qualifying IFR legs and approaches (e.g. under supervision or dual, as applicable) to again satisfy the 90-day threshold",
      "By completing a written exam only",
      "By simply waiting for the next calendar quarter",
    ],
    correctIndex: 1,
    explanation: "If only the 90-day recency (not the 12-month IPC) has lapsed, the pilot can generally restore currency by flying the requisite number of IFR legs with approaches, sometimes under supervision, to rebuild recency within the still-valid IR/IPC period.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-c-q08",
    question: "Is dual instructional flight with a suitably qualified instructor eligible to count toward a pilot's 90-day IFR recency?",
    options: [
      "No, only solo IFR PIC time counts",
      "Yes, dual instrument flight time conducted under the IFR with approaches, under appropriate supervision, may count toward recency as specified in the regulations",
      "Only if the instructor is also the aircraft owner",
      "Dual time never counts toward any recency requirement",
    ],
    correctIndex: 1,
    explanation: "Dual instructional flights that meet the IFR and approach criteria can be credited toward recency, recognising that supervised practice still provides genuine currency in instrument procedures.",
    source: "CASR 61.870; CASA MOS Part 61",
  },
  {
    id: "ifr-c-q09",
    question: "A pilot conducted 3 IFR legs 95 days ago with approaches, and nothing since. Are they IFR current today?",
    options: [
      "Yes, because 3 legs is the correct number required",
      "No — the legs must fall within the preceding 90 days; at 95 days they are outside the recency window and no longer count",
      "Yes, provided the aircraft is still airworthy",
      "It depends only on the pilot's total instrument hours logged historically",
    ],
    correctIndex: 1,
    explanation: "Recency is a rolling 90-day window. Flights older than 90 days no longer count toward the current recency calculation, so the pilot in this scenario has lapsed recency and must re-establish it.",
    source: "CASR 61.870(2)",
  },
  {
    id: "ifr-c-q10",
    question: "What does 'maintaining recency' practically require of an active IFR pilot over time?",
    options: [
      "A single annual flight satisfies all ongoing recency needs",
      "Continuously ensuring that at least 3 qualifying IFR legs with approaches fall within any rolling 90-day period during active IFR operations",
      "Recency, once achieved, never needs to be repeated",
      "Only logging total hours, regardless of recency of specific flights",
    ],
    correctIndex: 1,
    explanation: "Because the 90-day window is rolling, an actively IFR-current pilot must continually accrue qualifying legs so that at any given time, at least 3 fall within the preceding 90 days.",
    source: "CASR 61.870",
  },
  {
    id: "ifr-c-q11",
    question: "Does conducting a visual approach in otherwise IMC-capable conditions count as a qualifying approach for IFR recency purposes?",
    options: [
      "Yes, any type of approach counts equally",
      "No — recency specifically requires the conduct of an instrument approach procedure, not a visual approach, even if flown under an IFR flight plan",
      "Only if conducted at night",
      "Only if flown to minima",
    ],
    correctIndex: 1,
    explanation: "The regulation requires an instrument approach procedure to be flown, not simply operation under IFR with a visual approach to land, since the intent is to maintain genuine instrument procedural currency.",
    source: "CASR 61.870(2)",
  },
  {
    id: "ifr-c-q12",
    question: "If a pilot's operator requires more stringent recency (e.g. an approach every 30 days) than CASR 61.870, which standard governs the pilot's actual operations under that operator's AOC?",
    options: [
      "The CASR minimum always overrides any operator standard",
      "The operator's more stringent internal standard applies in addition to, and effectively supersedes, the CASR minimum for that operator's flights",
      "The pilot may choose whichever standard is more convenient",
      "Operator standards can never be more restrictive than CASR minima",
    ],
    correctIndex: 1,
    explanation: "Operators may impose recency standards more conservative than the regulatory minimum. Where this is the case, pilots operating under that AOC must comply with the higher (more restrictive) operator standard.",
    source: "CASR 61.870; Operator Exposition/Operations Manual",
  },
  {
    id: "ifr-c-q13",
    question: "What is the primary safety rationale behind the 90-day IFR/approach recency requirement?",
    options: [
      "It exists purely as an administrative formality with no safety basis",
      "Instrument flying and approach procedures are perishable skills; recent practical experience reduces the risk of error during actual IMC operations",
      "It is solely to generate revenue for training organisations",
      "It exists only to satisfy insurance requirements, unrelated to safety",
    ],
    correctIndex: 1,
    explanation: "Instrument flying skills degrade without regular practice. The 90-day recency requirement ensures pilots have sufficiently recent hands-on experience with IFR operations and approach procedures to safely operate in actual IMC.",
    source: "CASR 61.870; CASA Safety Behaviours guidance",
  },
  {
    id: "ifr-c-q14",
    question: "Can an instrument approach flown in visual meteorological conditions (VMC), but flown as a full procedural approach under the IFR, count toward recency?",
    options: [
      "No, the approach must be flown in actual IMC to count",
      "Yes — a properly conducted instrument approach procedure counts toward recency regardless of whether it occurs in actual IMC or VMC, since the procedural currency is what is being maintained",
      "Only if simulated instrument conditions (hood/foggles) are used throughout",
      "Only if conducted with an examiner on board",
    ],
    correctIndex: 1,
    explanation: "The recency requirement is about maintaining currency in flying the procedure itself; a fully flown instrument approach counts whether conducted in actual IMC or VMC, as the procedural and technical skill is what is exercised.",
    source: "CASR 61.870(2)",
  },
  {
    id: "ifr-c-q15",
    question: "A pilot has a current IR, current IPC, but has not flown any IFR legs in the last 200 days. What must they do before accepting an IFR clearance into IMC?",
    options: [
      "Nothing, since the IPC remains valid within 12 months",
      "Re-establish the 90-day recency by flying the required qualifying IFR legs and approaches, since IPC validity and 90-day recency are assessed separately",
      "Wait until their next IPC is due",
      "Fly only VFR for the remainder of the IPC validity period, permanently",
    ],
    correctIndex: 1,
    explanation: "IPC validity (12 months) and 90-day recency are independent checks. A lapsed 90-day recency, even with a valid IPC, must be re-established through qualifying flights before the pilot can exercise IFR privileges in IMC.",
    source: "CASR 61.870",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (d) — Night recency requirements
// Source: CASR Part 61.395; CASR 2 definitions
// ─────────────────────────────────────────────────────────────────────────────
const ifrDQuestions: ExamQuestion[] = [
  {
    id: "ifr-d-q01",
    question: "Under CASR 61.395, what is the minimum night recency requirement to carry passengers at night as PIC?",
    options: [
      "1 takeoff and landing in the preceding 90 days",
      "3 takeoffs and 3 landings at night in the preceding 90 days",
      "5 takeoffs and landings in the preceding 12 months",
      "No specific recency requirement exists for night flight",
    ],
    correctIndex: 1,
    explanation: "CASR 61.395 requires a pilot to have completed at least 3 takeoffs and 3 landings at night within the preceding 90 days to carry passengers at night.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q02",
    question: "Do the 3 takeoffs and landings required for night recency need to be in the same aircraft category as the intended flight?",
    options: [
      "No, any aircraft category satisfies the requirement",
      "Yes — the takeoffs and landings must be performed in an aircraft of the same category (e.g. aeroplane) as that used for the flight for which recency is claimed",
      "Only the landings need to match category; takeoffs can be in any category",
      "Category matching is only required for multi-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "The night recency requirement specifies that the takeoffs and landings must be conducted in the same category of aircraft to be valid for exercising night privileges in that category.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q03",
    question: "Do circuits (takeoff followed immediately by landing in the circuit) satisfy the night recency requirement, or is cross-country flight required?",
    options: [
      "Only full cross-country night flights count; circuits never qualify",
      "Circuit takeoffs and landings at night are acceptable and commonly used specifically to satisfy the night recency requirement",
      "Only formation flights count toward night recency",
      "Circuits count only if conducted in IMC",
    ],
    correctIndex: 1,
    explanation: "Night circuit training — repeated takeoffs and landings in the circuit at night — is an accepted and common method of satisfying the 3 takeoffs/landings in 90 days night recency requirement.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q04",
    question: "How is 'night' defined for the purposes of recency and operational requirements under CASR?",
    options: [
      "Any time after 6:00 pm local time",
      "The period between the end of evening civil twilight and the beginning of morning civil twilight",
      "Any time the sun is below 10 degrees elevation",
      "A fixed period from 8:00 pm to 5:00 am regardless of location or date",
    ],
    correctIndex: 1,
    explanation: "CASR 2 defines night as the period from the end of evening civil twilight to the beginning of morning civil twilight, which varies by date and location — not a fixed clock time.",
    source: "CASR 2 — Dictionary definitions",
  },
  {
    id: "ifr-d-q05",
    question: "Can an instrument approach flown at night substitute for the 3 takeoffs/landings requirement for night VFR passenger-carrying recency?",
    options: [
      "Yes, any night instrument approach automatically satisfies the takeoff/landing recency requirement",
      "No — the night recency requirement specifically requires actual takeoffs and landings at night; an instrument approach alone (without a full landing cycle) does not substitute for this",
      "Only precision approaches (ILS) count as a substitute",
      "Only if the approach is flown to a full stop with no other traffic",
    ],
    correctIndex: 1,
    explanation: "The CASR 61.395 requirement is specifically for takeoffs and landings at night, distinct from instrument approach recency. Flying an approach without completing an actual landing does not satisfy this specific requirement.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q06",
    question: "Is there a distinction in night recency requirements between a visual landing and one following an instrument approach at night?",
    options: [
      "Yes, only instrument approach landings ever count toward night recency",
      "No — for the purposes of the 61.395 takeoff/landing count, a landing counts as a landing whether it followed a visual pattern or an instrument approach, provided it occurred at night",
      "Visual landings count double toward the requirement",
      "Instrument approach landings at night never count toward this specific requirement",
    ],
    correctIndex: 1,
    explanation: "For the basic 3 takeoffs/3 landings at night requirement, what matters is that the takeoff and landing occurred during the defined night period — the specific approach method (visual pattern or instrument approach) does not change whether it counts.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q07",
    question: "A pilot completes 3 night takeoffs and landings solo, 100 days before a planned passenger flight at night. Are they current?",
    options: [
      "Yes, since the flights occurred and were of the correct type",
      "No — the flights must fall within the preceding 90 days; at 100 days the recency has lapsed",
      "Yes, provided they hold a current medical certificate",
      "Currency does not expire once established",
    ],
    correctIndex: 1,
    explanation: "Like other recency requirements, night takeoff/landing recency is assessed on a rolling 90-day basis. Flights beyond 90 days no longer count, so this pilot's recency has lapsed and must be re-established.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q08",
    question: "Can dual (instructional) night takeoffs and landings with an instructor be counted toward the pilot's own 90-day night recency?",
    options: [
      "No, only solo takeoffs and landings ever count",
      "Yes — provided the pilot is at the controls performing the takeoff and landing, dual instructional flights can generally be credited toward night recency",
      "Only if the instructor performs the landing personally",
      "Dual time counts only for the instructor's recency, never the student's",
    ],
    correctIndex: 1,
    explanation: "As long as the pilot under assessment is actually performing the takeoff and landing (even under instruction/supervision), these can be credited toward that pilot's personal night recency requirement.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q09",
    question: "What operational consequence follows if a pilot's night takeoff/landing recency has lapsed, but they still hold a valid licence and medical?",
    options: [
      "No consequence, since the licence itself authorises night flight indefinitely",
      "The pilot may not carry passengers at night until the 3 takeoffs/landings in 90 days requirement is satisfied again",
      "The pilot may carry passengers at night but not conduct takeoffs personally",
      "The requirement only affects instrument-rated pilots, not VFR night pilots",
    ],
    correctIndex: 1,
    explanation: "A lapsed night recency specifically restricts the privilege of carrying passengers at night until the pilot re-establishes currency by completing the required takeoffs and landings.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q10",
    question: "For a multi-crew IFR passenger operation at night, does the co-pilot also need to individually satisfy the night takeoff/landing recency requirement?",
    options: [
      "No, only the PIC's recency matters in multi-crew operations",
      "Yes — the recency requirement under CASR 61.395 applies to the individual pilot exercising the privilege, so each crew member expected to conduct takeoffs/landings must independently be current",
      "Recency requirements do not apply in multi-crew jet aircraft",
      "Only applies if the co-pilot is also the relief PIC on that sector",
    ],
    correctIndex: 1,
    explanation: "Night recency is a personal requirement attaching to the individual pilot performing the takeoff/landing, not just the designated PIC — any pilot expected to perform these functions must be individually current.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q11",
    question: "How does civil twilight length variation affect determination of 'night' for recency logging purposes across the year in Australia?",
    options: [
      "Twilight duration is constant year-round and location-independent, so no variation occurs",
      "Civil twilight duration varies by latitude and season, so the precise start/end of 'night' shifts throughout the year and must be checked (e.g. via AIP/ERSA data) for accurate logging",
      "Twilight only matters for airports above 30 degrees south latitude",
      "Night start/end times are fixed by ATC clearance times, not astronomical data",
    ],
    correctIndex: 1,
    explanation: "Because civil twilight varies with date and latitude, pilots must reference published data (e.g. ERSA, AIP, or twilight tables) to correctly determine when 'night' begins and ends for recency and operational purposes on a given day.",
    source: "CASR 2; AIP GEN 2.7",
  },
  {
    id: "ifr-d-q12",
    question: "Does a touch-and-go count as both a landing and a takeoff for the purposes of night recency counting?",
    options: [
      "No, a touch-and-go never counts toward recency",
      "Yes — a touch-and-go is generally credited as one landing and one takeoff for recency purposes, since both control inputs and configuration changes occur",
      "A touch-and-go counts only as a landing, never a takeoff",
      "A touch-and-go counts double as two landings",
    ],
    correctIndex: 1,
    explanation: "A touch-and-go involves both a landing (touchdown) and a subsequent takeoff in a single continuous maneuver, and is generally credited as one of each toward the required count for recency.",
    source: "CASR 61.395; general operational practice",
  },
  {
    id: "ifr-d-q13",
    question: "If a pilot only ever flies IFR at night with instrument approaches to landing, but never in VMC, do they still separately need to satisfy the basic night takeoff/landing recency of CASR 61.395?",
    options: [
      "No, IFR recency automatically covers all night recency requirements",
      "Yes — CASR 61.395 night takeoff/landing recency is a separate, specific requirement from general IFR recency and must be independently satisfied",
      "Only if operating single-engine aircraft",
      "Only if the pilot does not hold an instrument rating",
    ],
    correctIndex: 1,
    explanation: "Night takeoff/landing recency (61.395) and IFR/approach recency (61.870) are distinct requirements assessed separately, even though flights conducted at night under IFR can often satisfy both simultaneously if they include actual takeoffs and landings.",
    source: "CASR 61.395; CASR 61.870",
  },
  {
    id: "ifr-d-q14",
    question: "What must a pilot do if they intend to conduct a passenger-carrying night flight but have only completed 2 of the required 3 night landings within 90 days?",
    options: [
      "Proceed with the flight since 2 landings is close enough",
      "Complete at least 1 further qualifying night takeoff and landing before conducting the passenger flight at night",
      "Downgrade the flight to a training flight instead, with no further action needed",
      "Only the takeoff count matters, not landings",
    ],
    correctIndex: 1,
    explanation: "The regulation requires the full complement of 3 takeoffs and 3 landings within 90 days. With only 2 completed, the pilot must fly at least one more qualifying night takeoff/landing cycle before carrying passengers at night.",
    source: "CASR 61.395",
  },
  {
    id: "ifr-d-q15",
    question: "Why does CASR distinguish night recency from general (day) recency requirements?",
    options: [
      "There is no meaningful safety distinction; it is purely historical wording",
      "Night operations present increased risk due to reduced visual cues, illusions, and reliance on instruments/lighting, so more specific and frequent recent practical experience is mandated",
      "Night recency exists only to increase training provider revenue",
      "Because night flights are statistically shorter than day flights",
    ],
    correctIndex: 1,
    explanation: "Night flying carries elevated risks from degraded visual cues, potential spatial disorientation, and dependence on instrument and lighting references, justifying a specific and more frequently renewed recency standard.",
    source: "CASR 61.395; CASA Safety guidance material",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (e) — Night VFR operations
// Source: CASR Part 91; CAO 20.18; AIP ENR 1.2
// ─────────────────────────────────────────────────────────────────────────────
const ifrEQuestions: ExamQuestion[] = [
  {
    id: "ifr-e-q01",
    question: "What minimum equipment does CAO 20.18 require for an aeroplane conducting night VFR operations, beyond standard day VFR equipment?",
    options: [
      "No additional equipment is required beyond day VFR",
      "Additional items including adequate instrument lighting, a turn indicator/attitude reference, and appropriate navigation and anti-collision lighting",
      "A weather radar system is mandatory for all night VFR flights",
      "A second independent altimeter only",
    ],
    correctIndex: 1,
    explanation: "CAO 20.18 mandates additional equipment for night VFR beyond day VFR minimums, including suitable flight instrument lighting, gyroscopic instruments for attitude/turn reference, and correct external lighting for collision avoidance.",
    source: "CAO 20.18",
  },
  {
    id: "ifr-e-q02",
    question: "What are the basic VMC minima that must be maintained for night VFR flight outside controlled airspace?",
    options: [
      "Any visibility is acceptable as long as the pilot has a current NVFR rating",
      "Minimum specified flight visibility and distance from cloud as prescribed for night VMC, generally more conservative than day VMC minima",
      "VMC minima do not apply at night if flying under an IFR flight plan",
      "Only a cloud base requirement applies; visibility is unrestricted",
    ],
    correctIndex: 1,
    explanation: "Night VMC minima are generally more conservative than day VMC criteria, reflecting the reduced ability to visually detect terrain, obstacles, and other traffic at night, and are specified in CASR Part 91/AIP.",
    source: "AIP ENR 1.2; CASR Part 91",
  },
  {
    id: "ifr-e-q03",
    question: "How does night VFR fundamentally differ in regulatory treatment from night IFR?",
    options: [
      "There is no difference; both are treated identically",
      "Night VFR permits visual navigation and flight by visual reference in VMC at night with a night VFR rating, while night IFR requires an instrument rating and permits flight in IMC using instrument procedures",
      "Night VFR requires an instrument rating, while night IFR does not",
      "Night VFR is prohibited in Australia; only night IFR is legal",
    ],
    correctIndex: 1,
    explanation: "Night VFR (NVFR) allows visual flight at night in VMC using a specific NVFR endorsement/rating, while night IFR requires the pilot to hold an Instrument Rating and follow instrument procedures, permitting flight into IMC.",
    source: "CASR Part 61; CASR Part 91",
  },
  {
    id: "ifr-e-q04",
    question: "What lighting requirement applies to an aircraft's position (navigation) lights during night VFR operation?",
    options: [
      "Navigation lights are optional at the pilot's discretion",
      "Position/navigation lights (red, green, white) must be displayed continuously from before takeoff through to after landing during the night period",
      "Only the anti-collision beacon is required; navigation lights are not needed",
      "Navigation lights are only required above 5,000 ft",
    ],
    correctIndex: 1,
    explanation: "Navigation lights (red on the left/port wingtip, green on the right/starboard wingtip, white on the tail) must be displayed throughout night operations to ensure the aircraft's position and orientation are visible to other traffic.",
    source: "CASR Part 91; AIP ENR 1.2",
  },
  {
    id: "ifr-e-q05",
    question: "Are certain classes of airspace or aerodrome operations restricted or prohibited for night VFR flight?",
    options: [
      "No restrictions exist anywhere for night VFR",
      "Yes — night VFR operations may be restricted in specific circumstances, such as into aerodromes without adequate lighting/facilities or into designated areas where NVFR is not permitted",
      "Night VFR is banned Australia-wide under all circumstances",
      "Restrictions apply only to helicopters, never aeroplanes",
    ],
    correctIndex: 1,
    explanation: "Night VFR requires suitable aerodrome lighting and navigational references; operations to aerodromes lacking adequate facilities, or into specifically prohibited/restricted areas, may not be permitted under night VFR.",
    source: "AIP ENR 1.2; CASR Part 91",
  },
  {
    id: "ifr-e-q06",
    question: "What ATC service requirement typically applies to night VFR flights that do not apply to day VFR flights in the same airspace?",
    options: [
      "None — ATC requirements are identical day and night",
      "Night VFR flights are often required to operate on a flight plan and maintain two-way radio communication/flight following with ATC to a greater extent than equivalent day VFR flights",
      "ATC services are unavailable at night in Australia",
      "Night VFR flights must always be conducted under a full IFR clearance",
    ],
    correctIndex: 1,
    explanation: "Due to the increased risk profile of night flying, night VFR operations commonly require a submitted flight plan and ongoing communication with ATC or flight information services, exceeding typical day VFR requirements.",
    source: "AIP ENR 1.2; CASR Part 91",
  },
  {
    id: "ifr-e-q07",
    question: "What is a key operational risk specifically associated with night VFR that drives additional equipment requirements under CAO 20.18?",
    options: [
      "Excessive fuel burn compared to day flight",
      "Loss of visual horizon reference and increased risk of spatial disorientation, necessitating reliable gyroscopic attitude/turn instruments even for visual flight",
      "Increased risk of bird strikes exclusively",
      "Radio frequency congestion",
    ],
    correctIndex: 1,
    explanation: "At night, visual horizon references can be degraded or absent (especially over water or unlit terrain), increasing disorientation risk; CAO 20.18 therefore mandates gyroscopic instruments to provide a reliable attitude/turn reference even during visual flight.",
    source: "CAO 20.18",
  },
  {
    id: "ifr-e-q08",
    question: "Does a night VFR rating alone permit a pilot to fly into cloud?",
    options: [
      "Yes, NVFR permits limited flight into cloud",
      "No — an NVFR rating only permits flight by visual reference in VMC; flight into cloud (IMC) requires an Instrument Rating",
      "Only briefly, for less than one minute",
      "Only if flying above 10,000 ft",
    ],
    correctIndex: 1,
    explanation: "Night VFR privileges are strictly limited to visual flight in VMC. Any flight into cloud or IMC conditions requires the pilot to hold and exercise an Instrument Rating, which NVFR alone does not confer.",
    source: "CASR Part 61; CASR Part 91",
  },
  {
    id: "ifr-e-q09",
    question: "What instrument is specifically required by CAO 20.18 to provide an artificial horizon/attitude reference for night VFR flight?",
    options: [
      "A magnetic compass alone is sufficient",
      "A gyroscopic attitude indicator (or equivalent turn and slip/turn coordinator combination as specified) to assist in maintaining aircraft attitude without visual reference",
      "A GPS moving map display",
      "A radio altimeter",
    ],
    correctIndex: 1,
    explanation: "CAO 20.18 requires gyroscopic instrumentation — typically an attitude indicator or an approved turn indicator combination — to give the pilot a reliable attitude reference during night VFR flight when visual cues may be unreliable.",
    source: "CAO 20.18",
  },
  {
    id: "ifr-e-q10",
    question: "For night VFR over remote or unlit terrain, what additional planning consideration is typically emphasised beyond standard day VFR planning?",
    options: [
      "None — planning is identical to day VFR",
      "Careful selection of routes with adequate ground lighting/references, higher minimum safe altitudes, and contingency planning for loss of visual reference or diversion",
      "Only fuel planning changes; terrain and lighting are irrelevant",
      "Night VFR flight over unlit terrain is entirely prohibited in all circumstances",
    ],
    correctIndex: 1,
    explanation: "Night VFR over remote/unlit areas demands greater attention to route selection, terrain clearance margins, and diversion planning, since visual references may be minimal or absent, increasing the risk of controlled flight into terrain.",
    source: "AIP ENR 1.2; CAO 20.18",
  },
  {
    id: "ifr-e-q11",
    question: "What is the significance of the anti-collision (beacon/strobe) light requirement during night operations?",
    options: [
      "It has no operational significance and is purely cosmetic",
      "It enhances the conspicuity of the aircraft to other traffic, supplementing navigation lights, and is required to be operating during night flight (with exceptions such as in cloud to avoid disorientation)",
      "It is required only during taxi, never in flight",
      "It replaces the need for navigation lights entirely",
    ],
    correctIndex: 1,
    explanation: "The anti-collision light increases the aircraft's visibility to other aircraft at night, working alongside navigation lights; it is required to be on during night operations, though may be turned off in circumstances where its flashing could cause pilot disorientation (e.g. in cloud).",
    source: "CASR Part 91; AIP ENR 1.2",
  },
  {
    id: "ifr-e-q12",
    question: "Under CAO 20.18, is a serviceable radio altimeter a mandatory requirement for basic single-engine night VFR aeroplane operations?",
    options: [
      "Yes, it is mandatory for all night VFR aircraft regardless of type",
      "No — a radio altimeter is not among the basic mandatory night VFR equipment items; the requirement instead focuses on instrument lighting, gyroscopic references, and appropriate navigation/anti-collision lighting",
      "Only required for aircraft above 5,700 kg",
      "Only required for twin-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "CAO 20.18's basic night VFR equipment requirements centre on instrument lighting, gyroscopic attitude/turn references, and correct external lighting — a radio altimeter is not a standard mandatory item for basic night VFR aeroplane operations.",
    source: "CAO 20.18",
  },
  {
    id: "ifr-e-q13",
    question: "Why are night VMC cloud clearance and visibility criteria generally more conservative than day VMC criteria?",
    options: [
      "There is no difference between day and night VMC criteria",
      "Because visual detection of other aircraft, terrain, and obstacles is significantly harder at night, greater separation from cloud and higher visibility minima help compensate for the reduced visual acquisition range",
      "Night VMC criteria are actually less conservative to allow more night flying",
      "The difference relates only to radio communication requirements, not visual criteria",
    ],
    correctIndex: 1,
    explanation: "Reduced visual acuity and detection range at night mean pilots need greater buffers from cloud and terrain to have adequate time to see and avoid hazards, justifying more conservative VMC criteria at night.",
    source: "AIP ENR 1.2",
  },
  {
    id: "ifr-e-q14",
    question: "What must a pilot verify about an aerodrome before planning a night VFR arrival there?",
    options: [
      "Nothing specific — any aerodrome usable by day is automatically usable at night",
      "That the aerodrome has adequate runway/approach lighting and is approved/suitable for night operations, as published in ERSA/AIP",
      "Only that fuel is available on arrival",
      "Only that the runway is sealed",
    ],
    correctIndex: 1,
    explanation: "Not all aerodromes are lit or approved for night operations. Pilots must check ERSA/AIP for published lighting facilities and any night-use restrictions before planning a night VFR arrival.",
    source: "AIP ENR 1.2; ERSA aerodrome entries",
  },
  {
    id: "ifr-e-q15",
    question: "Can a pilot with only a day VFR rating (no NVFR endorsement) legally act as PIC on a flight departing just before the official night period begins, intending to land after night has commenced?",
    options: [
      "Yes, as long as the flight departed in daylight",
      "No — if any portion of the flight, including the landing, occurs during the defined night period, the pilot must hold the appropriate NVFR rating (or IR) to conduct that segment legally",
      "Only if the landing occurs within 10 minutes of the start of night",
      "There is no restriction as long as the destination is a controlled aerodrome",
    ],
    correctIndex: 1,
    explanation: "If any part of the flight — including arrival/landing — occurs after the onset of night as defined by CASR 2, the pilot must hold the appropriate night rating (NVFR or IR) covering that segment of flight.",
    source: "CASR 2; CASR Part 61; AIP ENR 1.2",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (f) — Aircraft instrument requirements
// Source: CAO 20.18; CASR 91.245; AIP GEN 1.5
// ─────────────────────────────────────────────────────────────────────────────
const ifrFQuestions: ExamQuestion[] = [
  {
    id: "ifr-f-q01",
    question: "What category of instruments does CAO 20.18 mandate as a minimum for IFR flight, in addition to basic day VFR equipment?",
    options: [
      "Only a magnetic compass is required beyond day VFR equipment",
      "A full complement including airspeed indicator, altimeter, attitude indicator, heading indicator/gyro compass, turn and slip indicator, and vertical speed indicator, plus appropriate navigation equipment",
      "Only a GPS receiver is required, with no other flight instruments",
      "Only two engine instruments are required beyond VFR equipment",
    ],
    correctIndex: 1,
    explanation: "CAO 20.18 sets out a comprehensive minimum instrument fit for IFR flight, covering the primary flight instruments (ASI, altimeter, attitude, heading, turn/slip, VSI) plus the navigation equipment appropriate to the routes/approaches flown.",
    source: "CAO 20.18",
  },
  {
    id: "ifr-f-q02",
    question: "Which instruments are classified as 'pitot-static' instruments requiring a functioning pitot-static system?",
    options: [
      "Attitude indicator, heading indicator, and turn coordinator",
      "Airspeed indicator, altimeter, and vertical speed indicator",
      "ADF, VOR receiver, and transponder",
      "Fuel flow gauge and EGT gauge",
    ],
    correctIndex: 1,
    explanation: "The airspeed indicator, altimeter, and vertical speed indicator all derive their readings from the pitot-static system (pitot pressure and static pressure), making them the classic pitot-static instrument group.",
    source: "CASR 91.245; general aircraft systems knowledge",
  },
  {
    id: "ifr-f-q03",
    question: "Which instruments are classified as 'gyroscopic' instruments in a conventional IFR instrument panel?",
    options: [
      "Airspeed indicator, altimeter, VSI",
      "Attitude indicator, heading indicator (directional gyro), and turn coordinator/turn and slip indicator",
      "ADF and VOR indicators only",
      "OAT gauge and clock",
    ],
    correctIndex: 1,
    explanation: "The gyroscopic instrument group comprises the attitude indicator (artificial horizon), heading indicator/directional gyro, and turn coordinator or turn and slip indicator, all relying on gyroscopic principles for their function.",
    source: "CASR 91.245; general aircraft systems knowledge",
  },
  {
    id: "ifr-f-q04",
    question: "What navigation equipment requirement applies for an aircraft to conduct IFR flight on routes requiring RNAV/RNP navigation performance?",
    options: [
      "No specific navigation equipment is required beyond a magnetic compass",
      "The aircraft must carry navigation equipment (e.g. approved GNSS/FMS) certified to the relevant RNAV/RNP specification for the route or procedure being flown",
      "Only a single VOR receiver is required for all RNP routes",
      "ADF equipment alone satisfies all RNP requirements",
    ],
    correctIndex: 1,
    explanation: "RNAV/RNP routes and procedures require navigation systems (typically GNSS-based) certified to meet the specific navigation performance specification (e.g. RNP 1, RNP APCH) published for that route or procedure.",
    source: "CASR 91.245; AIP GEN 1.5",
  },
  {
    id: "ifr-f-q05",
    question: "When is supplemental oxygen required to be carried and used under Australian IFR operating rules based on cabin altitude?",
    options: [
      "Oxygen is never required regardless of altitude",
      "Oxygen provisions are required above specified cabin altitude thresholds and duration limits, escalating from crew-only requirements to full crew-and-passenger requirements as cabin altitude increases",
      "Oxygen is only required above 41,000 ft",
      "Oxygen requirements apply only to VFR flights, not IFR",
    ],
    correctIndex: 1,
    explanation: "Regulations impose tiered oxygen requirements based on cabin altitude and time spent at that altitude — starting with crew oxygen requirements at moderate altitudes and extending to full occupant provision at higher cabin altitudes, regardless of IFR/VFR status but particularly relevant to IFR high-altitude operations.",
    source: "CASR Part 91; AIP GEN 1.5",
  },
  {
    id: "ifr-f-q06",
    question: "What pre-flight equipment check is specifically required before commencing an IFR flight regarding pitot-static and gyroscopic instruments?",
    options: [
      "No specific check is required beyond a general walk-around",
      "A functional check confirming correct operation and agreement of the ASI, altimeter, VSI, attitude and heading indicators, consistent with normal power/attitude changes during taxi and initial climb",
      "Only the altimeter needs to be checked; other instruments are assumed serviceable",
      "Equipment checks are only required for the first flight of the day",
    ],
    correctIndex: 1,
    explanation: "Before IFR flight, pilots should verify correct indications and cross-check agreement between pitot-static and gyroscopic instruments during taxi, takeoff and initial climb, to detect any malfunction before entering IMC.",
    source: "CASR 91.245; AIP GEN 1.5; Aircraft Flight Manual procedures",
  },
  {
    id: "ifr-f-q07",
    question: "What is the minimum navigation receiver redundancy commonly expected for single-pilot IFR (SPIFR) operations relying on ground-based navaids?",
    options: [
      "A single VOR receiver is always sufficient with no backup",
      "Typically dual independent navigation sources (e.g. dual VOR, or VOR plus GNSS) are expected so that failure of one does not leave the pilot without navigation reference",
      "No navigation receiver is required if flying under radar vectors",
      "Only ADF equipment is required, with no VOR",
    ],
    correctIndex: 1,
    explanation: "For SPIFR reliability, having a second independent navigation source protects against a single equipment failure removing the pilot's only means of navigation, which is why dual navigation systems are commonly required or strongly recommended.",
    source: "CASR 91.245; CASA MOS Part 61; AIP GEN 1.5",
  },
  {
    id: "ifr-f-q08",
    question: "Why does CAO 20.18 require a serviceable turn and slip indicator or turn coordinator even when an attitude indicator is fitted?",
    options: [
      "It is purely a legacy requirement with no functional purpose",
      "It provides an independent backup attitude/turn reference on a separate power/vacuum source, protecting against loss of the primary attitude indicator or its power source",
      "It is required only for aerobatic flight",
      "It measures airspeed more accurately than the ASI",
    ],
    correctIndex: 1,
    explanation: "The turn and slip indicator/turn coordinator, often driven by an independent electrical or vacuum source, provides a critical backup for attitude/turn information if the primary attitude indicator or its power source fails during IMC flight.",
    source: "CAO 20.18",
  },
  {
    id: "ifr-f-q09",
    question: "What does CASR 91.245 require regarding the serviceability status of mandatory IFR instruments and equipment prior to dispatch?",
    options: [
      "Minor unserviceability of any instrument is always acceptable without restriction",
      "All instruments and equipment prescribed as required for IFR flight must be serviceable, or the flight must be conducted under an approved Minimum Equipment List (MEL) provision if applicable",
      "Only the altimeter must be serviceable; other instruments are optional",
      "Serviceability checks are only required annually, not before each flight",
    ],
    correctIndex: 1,
    explanation: "CASR 91.245 requires that instruments and equipment mandated for the type of flight be serviceable before dispatch, unless an approved MEL permits dispatch with specific inoperative items under defined conditions.",
    source: "CASR 91.245",
  },
  {
    id: "ifr-f-q10",
    question: "For IFR flight into known or forecast icing conditions, what additional equipment consideration applies beyond the basic instrument fit?",
    options: [
      "No additional equipment consideration exists for icing",
      "The aircraft must be appropriately certified/equipped for flight into icing conditions (e.g. pitot heat, de-ice/anti-ice systems) if such conditions are forecast or encountered",
      "Only additional oxygen equipment is needed for icing conditions",
      "Icing equipment is only relevant to VFR flights",
    ],
    correctIndex: 1,
    explanation: "Flight into known or forecast icing requires the aircraft to have appropriate certification and equipment (pitot heat, de-ice boots, prop de-ice, etc.) — this is a distinct consideration from the base IFR instrument requirements.",
    source: "CASR Part 91; AIP GEN 1.5; Aircraft Flight Manual",
  },
  {
    id: "ifr-f-q11",
    question: "What is the purpose of requiring a standby/backup altimeter or alternate static source on some IFR aircraft?",
    options: [
      "To provide a second reading purely for cross-checking passenger comfort",
      "To ensure altitude information remains available in the event of a blocked or failed primary static source, which is safety-critical for IFR terrain and traffic separation",
      "To measure true airspeed rather than indicated airspeed",
      "It has no functional safety purpose",
    ],
    correctIndex: 1,
    explanation: "A blocked pitot-static system can render the primary altimeter unreliable; a standby altimeter or alternate static source provides continued altitude awareness, which is essential for maintaining safe vertical separation in IFR/IMC.",
    source: "CASR 91.245; Aircraft Flight Manual",
  },
  {
    id: "ifr-f-q12",
    question: "Does CAO 20.18 distinguish equipment requirements between single-engine and multi-engine IFR aircraft?",
    options: [
      "No, requirements are identical regardless of engine configuration",
      "Yes — while the core instrument requirements are broadly similar, additional considerations (e.g. redundancy, electrical/vacuum source diversity) become more critical for reliability in more complex or higher-performance aircraft",
      "Multi-engine aircraft require fewer instruments than single-engine aircraft",
      "CAO 20.18 applies only to single-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "While the fundamental instrument list is broadly consistent, operational and reliability considerations (backup power sources, redundancy) often become more significant on more complex or higher-performance multi-engine IFR aircraft.",
    source: "CAO 20.18; CASR 91.245",
  },
  {
    id: "ifr-f-q13",
    question: "What must a pilot verify regarding the aircraft's GNSS equipment before relying on it for an RNP approach?",
    options: [
      "Nothing specific — any GPS unit is acceptable for any approach",
      "That the installed GNSS system is approved/certified for the specific type of RNP approach to be flown (e.g. RNP APCH with the required integrity monitoring), as documented in the aircraft's AFM/POH supplement",
      "Only that the unit has a current database subscription, with no certification requirement",
      "That the GNSS antenna is mounted on the top of the fuselage",
    ],
    correctIndex: 1,
    explanation: "Not all GNSS installations are certified for all approach types. The pilot must confirm the specific equipment approval status (per AFM/POH supplement) covers the RNP approach procedure intended to be flown.",
    source: "CASR 91.245; AIP GEN 1.5; CASA MOS Part 61 §8.5",
  },
  {
    id: "ifr-f-q14",
    question: "What is the significance of an 'equipment check' requirement before commencing an IFR departure in reduced visibility?",
    options: [
      "It has no particular significance for reduced visibility departures",
      "It ensures critical flight instruments are confirmed serviceable before losing visual reference shortly after takeoff, when any instrument malfunction would be far harder to detect and manage",
      "It is only relevant for night departures, not low visibility day departures",
      "It replaces the need for a take-off briefing",
    ],
    correctIndex: 1,
    explanation: "In low visibility, the pilot may lose outside visual reference almost immediately after takeoff, so confirming correct instrument operation beforehand is critical — any undetected malfunction discovered only after losing visual reference significantly increases risk.",
    source: "AIP GEN 1.5; CASR 91.245",
  },
  {
    id: "ifr-f-q15",
    question: "Which of the following best summarises the overall intent of CAO 20.18 and CASR 91.245 together regarding IFR aircraft equipment?",
    options: [
      "To specify aesthetic cockpit layout standards only",
      "To ensure aircraft conducting IFR flight carry serviceable instruments and navigation equipment sufficient for safe flight and navigation without external visual reference, including appropriate redundancy for critical systems",
      "To regulate only engine performance instruments, not flight instruments",
      "To apply exclusively to airline-category aircraft, not general aviation",
    ],
    correctIndex: 1,
    explanation: "Together, CAO 20.18 and CASR 91.245 establish the baseline and ongoing serviceability standard for flight/navigation instruments needed to safely conduct IFR operations without visual reference, incorporating redundancy considerations for critical instruments.",
    source: "CAO 20.18; CASR 91.245; AIP GEN 1.5",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (g) — Interpreting operational and meteorological information
// Source: AIP ENR 1.1; AIP GEN 3.5; BOM aviation weather products
// ─────────────────────────────────────────────────────────────────────────────
const ifrGQuestions: ExamQuestion[] = [
  {
    id: "ifr-g-q01",
    question: "In a METAR, the group 'BKN008' indicates what cloud condition?",
    options: [
      "Broken cloud with base at 8,000 ft AGL",
      "Broken cloud with base at 800 ft AGL",
      "Broken cloud with base at 80 ft AGL",
      "Overcast cloud with base at 8,000 ft AGL",
    ],
    correctIndex: 1,
    explanation: "Cloud height groups in METARs are given in hundreds of feet, so '008' equals 800 ft. 'BKN' denotes broken cloud coverage (5–7 oktas), so BKN008 means broken cloud with a base at 800 ft AGL.",
    source: "AIP GEN 3.5 — METAR/SPECI Code",
  },
  {
    id: "ifr-g-q02",
    question: "A TAF contains the change group 'FM1400 30015G25KT'. What does this indicate?",
    options: [
      "From 1400 UTC, wind is forecast from 300° at 15 kt with gusts to 25 kt",
      "At exactly 1400 UTC, a temporary wind shift to 300/15 with visibility 25 km",
      "From 1400 local time, wind decreasing to 15 kt from the south",
      "A forecast wind change at FL140 only, not at the surface",
    ],
    correctIndex: 0,
    explanation: "'FM1400' denotes a definite, rapid change from 1400 UTC. '30015G25KT' means wind from 300° true at 15 knots, gusting to 25 knots — all TAF/METAR winds are in UTC and true direction unless noted otherwise.",
    source: "AIP GEN 3.5 — TAF Code and Abbreviations",
  },
  {
    id: "ifr-g-q03",
    question: "What is the primary purpose of a SIGMET compared to an AIRMET?",
    options: [
      "SIGMETs and AIRMETs are identical products with different names",
      "A SIGMET warns of significant en-route weather hazardous to all aircraft (e.g. severe turbulence, severe icing, thunderstorms, volcanic ash); an AIRMET addresses less severe hazards primarily relevant to lower-performance aircraft",
      "AIRMETs only cover thunderstorm activity; SIGMETs cover only volcanic ash",
      "SIGMETs are issued only for domestic flights; AIRMETs only for international flights",
    ],
    correctIndex: 1,
    explanation: "SIGMETs cover significant meteorological phenomena hazardous to aircraft generally (severe turbulence/icing, thunderstorms, volcanic ash, dust storms), while AIRMETs cover moderate hazards particularly significant to lower-performance/lower-altitude aircraft.",
    source: "AIP GEN 3.5; BOM Aviation Weather Services",
  },
  {
    id: "ifr-g-q04",
    question: "What information does an Area Forecast (ARFOR) provide that a TAF does not?",
    options: [
      "ARFOR provides a single-point forecast for one aerodrome only",
      "ARFOR provides weather conditions over a defined geographic forecast area (route/region), covering cloud, visibility, weather, icing and freezing level across that area, rather than a point forecast for a single aerodrome",
      "ARFOR only forecasts winds aloft, nothing else",
      "ARFOR is identical in scope and content to a TAF",
    ],
    correctIndex: 1,
    explanation: "While a TAF is a point forecast for a specific aerodrome, the Area Forecast covers a broader geographic area relevant to en-route planning, including expected cloud, visibility, weather phenomena, icing, and freezing level across that region.",
    source: "AIP GEN 3.5; BOM Aviation Area Forecast documentation",
  },
  {
    id: "ifr-g-q05",
    question: "A wind shear report states 'MODERATE WINDSHEAR ON APPROACH RWY 34 SFC-2000FT'. What should the pilot take from this?",
    options: [
      "Windshear is only relevant to departing aircraft, not arriving aircraft",
      "Moderate windshear is present on the approach path to runway 34 between the surface and 2,000 ft, requiring the pilot to consider go-around criteria and increased approach speed margins",
      "The report only applies above 2,000 ft, not near the surface",
      "This report can be disregarded unless winds exceed 50 kt",
    ],
    correctIndex: 1,
    explanation: "This report warns of moderate windshear specifically on the approach to runway 34, within the surface-to-2,000 ft band, prompting the pilot to plan for possible airspeed/altitude deviations and consider a go-around if control becomes difficult.",
    source: "AIP ENR 1.1; BOM Windshear/Turbulence reporting",
  },
  {
    id: "ifr-g-q06",
    question: "In an ATIS broadcast stating 'QNH 1013, expect ILS approach runway 16, runway wet', what must the pilot specifically extract for altimeter setting purposes?",
    options: [
      "QFE 1013 for approach",
      "QNH 1013 hectopascals, to be set on the altimeter subscale for altitude reference above mean sea level",
      "The ATIS QNH is not usable and ATC must confirm it separately",
      "1013 refers to the transition altitude, not a pressure setting",
    ],
    correctIndex: 1,
    explanation: "QNH 1013 hPa is the sea-level-referenced pressure setting to be entered in the altimeter subscale, giving altitude readings referenced to mean sea level — distinct from QFE which references aerodrome elevation.",
    source: "AIP GEN 3.5; AIP ENR 1.1",
  },
  {
    id: "ifr-g-q07",
    question: "What is the essential difference between QNH and QFE?",
    options: [
      "There is no difference; both terms mean the same pressure setting",
      "QNH is the pressure setting that gives altitude above mean sea level when set on the altimeter; QFE is the setting that gives height above the specific aerodrome elevation (zero at touchdown)",
      "QFE is used for enroute navigation; QNH is used only on the ground",
      "QNH applies only outside controlled airspace; QFE applies only inside controlled airspace",
    ],
    correctIndex: 1,
    explanation: "QNH set on the altimeter shows altitude above mean sea level; QFE set on the altimeter shows height above the reference aerodrome (reading zero at aerodrome elevation on landing) — Australia predominantly uses QNH operationally.",
    source: "AIP GEN 3.5",
  },
  {
    id: "ifr-g-q08",
    question: "Which cloud type is most associated with severe turbulence, icing, and thunderstorm hazards relevant to IFR flight planning?",
    options: [
      "Cirrus (Ci)",
      "Cumulonimbus (Cb)",
      "Stratus (St)",
      "Altocumulus (Ac)",
    ],
    correctIndex: 1,
    explanation: "Cumulonimbus clouds are associated with severe turbulence, heavy precipitation, lightning, hail, and significant icing risk, making them a primary hazard to avoid in IFR flight planning and en-route weather avoidance.",
    source: "AIP ENR 1.1; BOM Aviation Weather Services",
  },
  {
    id: "ifr-g-q09",
    question: "A TAF includes 'TEMPO 0206 3000 SHRA BKN015'. What is the correct interpretation?",
    options: [
      "A permanent change from 0200 to 0600 UTC to 3000 m visibility, showers of rain, and broken cloud at 1,500 ft",
      "Temporary fluctuations expected between 0200 and 0600 UTC of visibility 3,000 m in showers of rain, with broken cloud base at 1,500 ft, each lasting less than one hour",
      "3000 refers to a wind direction of 300°, not visibility",
      "This condition is guaranteed to occur continuously for the entire period stated",
    ],
    correctIndex: 1,
    explanation: "TEMPO indicates temporary, intermittent fluctuations (each generally lasting under an hour, less than half the period) expected within the specified time window — here reduced visibility to 3,000 m in rain showers with broken cloud at 1,500 ft, between 0200–0600 UTC.",
    source: "AIP GEN 3.5 — TAF Code",
  },
  {
    id: "ifr-g-q10",
    question: "What does the term 'CAVOK' mean when it appears in a METAR or TAF?",
    options: [
      "Ceiling and visibility okay, but only for VFR aircraft",
      "Visibility 10 km or more, no cloud below 5,000 ft (or the highest minimum sector altitude, whichever is greater) with no cumulonimbus, and no significant weather phenomena",
      "Clear air visible over Kalgoorlie, a specific regional code",
      "Cloud and visibility overcast, knots — a wind descriptor",
    ],
    correctIndex: 1,
    explanation: "CAVOK is a defined code meaning visibility ≥10 km, no cloud below 5,000 ft/MSA (whichever is higher) with no cumulonimbus or towering cumulus, and no significant weather present — a single code replacing multiple groups.",
    source: "AIP GEN 3.5 — METAR/TAF Code",
  },
  {
    id: "ifr-g-q11",
    question: "What key hazard information does an AIRMET specifically aim to communicate to pilots of lower-performance aircraft?",
    options: [
      "Only information about high-altitude jet stream turbulence above FL350",
      "Moderate turbulence, moderate icing, extensive low cloud, or reduced visibility phenomena that, while not meeting SIGMET severity, are still operationally significant for lower-performance aircraft",
      "AIRMETs exclusively cover volcanic ash advisories",
      "AIRMETs are only relevant to helicopter operations",
    ],
    correctIndex: 1,
    explanation: "AIRMETs communicate moderate-severity hazards (turbulence, icing, low cloud/visibility) that are below SIGMET thresholds but still significant, particularly for aircraft with more limited performance or equipment to avoid them.",
    source: "AIP GEN 3.5; BOM Aviation Weather Services",
  },
  {
    id: "ifr-g-q12",
    question: "How should a pilot interpret a METAR reporting 'RMK FZRA' appended after the main body?",
    options: [
      "Fuzzy radar returns detected near the aerodrome, no operational significance",
      "Freezing rain is occurring — a serious icing hazard requiring careful consideration for aircraft surfaces and control",
      "Frequency range advisory for radio communications",
      "Forecast zone radius, relating to controlled airspace boundaries",
    ],
    correctIndex: 1,
    explanation: "'FZRA' denotes freezing rain, a serious icing hazard that can rapidly accumulate ice on aircraft surfaces; pilots must treat this as a significant operational consideration for ground and flight operations.",
    source: "AIP GEN 3.5 — METAR weather phenomena codes",
  },
  {
    id: "ifr-g-q13",
    question: "What is the operational significance of a forecast freezing level given in an Area Forecast?",
    options: [
      "It only matters for departures, never for cruise or descent planning",
      "It identifies the altitude at which temperatures reach 0°C, marking where airframe icing risk in visible moisture becomes significant, informing route/altitude selection and anti-ice planning",
      "It indicates the altitude below which VFR flight is prohibited",
      "It refers only to fuel freezing temperature limits",
    ],
    correctIndex: 1,
    explanation: "The freezing level marks where temperature crosses 0°C; above this level, in visible moisture (cloud, precipitation), airframe icing becomes a risk, directly informing altitude selection and de-ice/anti-ice equipment planning.",
    source: "AIP ENR 1.1; BOM Area Forecast documentation",
  },
  {
    id: "ifr-g-q14",
    question: "What distinguishes a SPECI from a routine METAR?",
    options: [
      "A SPECI is issued at fixed hourly intervals identical to METAR",
      "A SPECI is a special (non-routine) observation issued when specific significant changes in weather occur between scheduled METAR observations",
      "A SPECI only reports wind information, omitting cloud and visibility",
      "SPECI reports are issued only for military aerodromes",
    ],
    correctIndex: 1,
    explanation: "A SPECI is issued outside the routine schedule when defined significant changes occur (e.g. rapid visibility decrease, onset of thunderstorms, wind shift) that warrant an immediate updated observation.",
    source: "AIP GEN 3.5 — SPECI criteria",
  },
  {
    id: "ifr-g-q15",
    question: "When cross-referencing a TAF and the current METAR before an IFR departure, what is the pilot primarily checking for?",
    options: [
      "Only that both documents have the same issue time",
      "Consistency between forecast and actual conditions, and whether current/forecast weather trends support the planned departure, en-route, and destination/alternate minima requirements",
      "That the TAF and METAR use different units of measurement",
      "Nothing operationally significant; TAFs and METARs are unrelated",
    ],
    correctIndex: 1,
    explanation: "Comparing the TAF's forecast trends against the latest actual METAR helps the pilot verify the forecast is tracking as expected and confirm that weather at departure, en-route, and destination/alternate will support the flight and satisfy applicable minima.",
    source: "AIP ENR 1.1; AIP GEN 3.5",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (h) — Take-off minima
// Source: AIP ENR 1.5; CASR Part 91; CASA AC 91-10
// ─────────────────────────────────────────────────────────────────────────────
const ifrHQuestions: ExamQuestion[] = [
  {
    id: "ifr-h-q01",
    question: "What is the standard minimum take-off visibility commonly published for multi-engine IFR aircraft operations without specific lower operator-approved minima?",
    options: [
      "There is no standard reference value; visibility is entirely at pilot discretion",
      "A standard published minimum such as 800 m to 1,600 m visibility (or equivalent RVR), depending on runway lighting and markings, unless a lower approved operator minimum applies",
      "Always exactly 5,000 m regardless of runway facilities",
      "Take-off minima are only prescribed for single-engine aircraft",
    ],
    correctIndex: 1,
    explanation: "Standard take-off minima in AIP ENR 1.5 are generally expressed as visibility (or RVR) values in the vicinity of 800–1,600 m, varying with runway lighting/marking standards, unless the operator holds specific lower approved minima.",
    source: "AIP ENR 1.5",
  },
  {
    id: "ifr-h-q02",
    question: "Why might an operator hold specific approved take-off minima lower than the standard published AIP values?",
    options: [
      "Operators are never permitted to use minima different from the standard AIP values",
      "Operators with appropriate approvals, procedures, and crew training (e.g. low visibility operations approval) may be authorised for lower take-off minima reflecting their demonstrated capability",
      "Lower minima are automatically available to any AOC holder without further approval",
      "Lower minima apply universally regardless of aircraft equipment",
    ],
    correctIndex: 1,
    explanation: "Operator-specific take-off minima below the standard AIP values require specific CASA approval, reflecting the operator's demonstrated procedures, crew training, and aircraft equipment capability to safely operate in lower visibility.",
    source: "CASA AC 91-10; AIP ENR 1.5",
  },
  {
    id: "ifr-h-q03",
    question: "What is the fundamental difference between 'visibility' and 'RVR' (Runway Visual Range) as applied to take-off minima?",
    options: [
      "They are the same measurement reported in different units",
      "Visibility is a general meteorological observation of horizontal visual range; RVR is a specific instrumented or observed measurement of the distance a pilot can see down the runway, often more precise for low-visibility operations",
      "RVR is measured only in the vertical dimension",
      "Visibility applies only at night; RVR applies only in daylight",
    ],
    correctIndex: 1,
    explanation: "General visibility is a broader meteorological observation, while RVR specifically measures the distance visible along the runway (often via transmissometers), providing more precise guidance for take-off/landing decisions in marginal conditions.",
    source: "AIP ENR 1.5; AIP GEN 3.5",
  },
  {
    id: "ifr-h-q04",
    question: "What is the purpose of the one-engine-inoperative (OEI) climb gradient requirement in take-off performance planning?",
    options: [
      "It relates only to fuel efficiency calculations, not safety",
      "It ensures the aircraft can achieve a minimum specified climb gradient after an engine failure at or after the critical point during takeoff, to safely clear obstacles in the departure path",
      "It applies only to single-engine aircraft",
      "It has no bearing on take-off minima or departure planning",
    ],
    correctIndex: 1,
    explanation: "OEI climb gradient requirements ensure that, following an engine failure during or shortly after takeoff, the remaining performance is sufficient to clear obstacles along the departure path, directly influencing weight limits and departure procedure selection.",
    source: "CASR Part 91; CASA AC 91-10",
  },
  {
    id: "ifr-h-q05",
    question: "Under what circumstance is a take-off alternate required to be nominated for an IFR departure?",
    options: [
      "A take-off alternate is never required under any circumstances",
      "When weather conditions at the departure aerodrome are below the applicable landing minima for that aerodrome, such that the aircraft could not return and land safely shortly after departure if required",
      "Only when departing from an aerodrome with a single runway",
      "Only for flights exceeding 6 hours duration",
    ],
    correctIndex: 1,
    explanation: "A take-off alternate is required when departure aerodrome weather is below the landing minima applicable to that aerodrome, ensuring a safe diversion option exists if the aircraft needs to return shortly after takeoff (e.g. following an engine failure).",
    source: "CASR Part 91; AIP ENR 1.5",
  },
  {
    id: "ifr-h-q06",
    question: "How does a wet runway typically affect applicable take-off minima and performance calculations compared to a dry runway?",
    options: [
      "Wet runway conditions have no effect on take-off performance or minima",
      "A wet runway generally requires more conservative performance calculations (e.g. reduced accelerate-stop margins) and may affect the runway condition code used in take-off minima and performance determination",
      "A wet runway always improves stopping performance compared to dry",
      "Wet runway considerations apply only to landing, never take-off",
    ],
    correctIndex: 1,
    explanation: "Wet runway surfaces reduce tyre friction, affecting accelerate-stop distance and rejected takeoff performance; this is factored into performance calculations and can influence applicable weight limits and, in some cases, minima considerations.",
    source: "CASA AC 91-10; CASR Part 91",
  },
  {
    id: "ifr-h-q07",
    question: "If runway lighting is limited to basic edge lighting only (no centreline or high-intensity approach lighting), how does this typically affect standard take-off minima?",
    options: [
      "Runway lighting standard has no effect on take-off minima",
      "Reduced/basic runway lighting typically results in a higher (more conservative) minimum take-off visibility requirement compared to runways with enhanced lighting systems",
      "Basic lighting always permits lower minima than enhanced lighting",
      "Take-off minima are only affected by approach lighting, never runway edge lighting",
    ],
    correctIndex: 1,
    explanation: "Standard take-off minima scale with the quality of runway visual aids — runways with only basic edge lighting generally require higher visibility minima than those with centreline lighting or high-intensity systems, since visual reference is reduced.",
    source: "AIP ENR 1.5",
  },
  {
    id: "ifr-h-q08",
    question: "What action is required if forecast/actual weather at the departure aerodrome is below the applicable take-off minima at the planned departure time?",
    options: [
      "The flight may depart regardless, as take-off minima are advisory only",
      "The take-off may not be commenced until conditions meet or exceed the applicable take-off minima, or unless the operator holds an approval permitting operation below standard minima under defined conditions",
      "The pilot may depart if the destination weather is good, regardless of departure conditions",
      "Take-off minima apply only to jet aircraft, not turboprop or piston aircraft",
    ],
    correctIndex: 1,
    explanation: "Take-off minima are a hard regulatory/operational limit — the aircraft must not commence takeoff unless conditions meet or exceed the applicable minima, except under specific approved lower-minima provisions the operator may hold.",
    source: "CASR Part 91; AIP ENR 1.5",
  },
  {
    id: "ifr-h-q09",
    question: "What role does the accelerate-stop distance available (ASDA) play in determining take-off performance limits relevant to minima planning?",
    options: [
      "ASDA is irrelevant to take-off performance; it only concerns landing distance",
      "ASDA represents the distance available to accelerate to decision speed and then stop safely if the takeoff is rejected, directly limiting maximum take-off weight and hence performance margins relevant to safe departure",
      "ASDA is a fixed value identical at every aerodrome worldwide",
      "ASDA only matters for aircraft under 5,700 kg MTOW",
    ],
    correctIndex: 1,
    explanation: "ASDA (runway plus stopway, where applicable) constrains the maximum weight at which an aircraft can safely accelerate and, if needed, stop within the available distance following a rejected takeoff — a core input to take-off performance and planning.",
    source: "CASA AC 91-10; CASR Part 91",
  },
  {
    id: "ifr-h-q10",
    question: "Does the requirement to comply with take-off minima apply equally to VFR and IFR departures?",
    options: [
      "Yes, identical minima apply regardless of flight rules",
      "No — take-off minima as discussed in AIP ENR 1.5 and CASA AC 91-10 are specifically an IFR/air transport operational construct; VFR departures are instead governed by VMC criteria appropriate to the airspace",
      "VFR departures always require higher minima than IFR",
      "Take-off minima apply only to helicopter operations",
    ],
    correctIndex: 1,
    explanation: "Take-off minima specifically address the visibility/RVR needed to safely conduct an IFR departure and handle a potential rejected takeoff or engine failure scenario; VFR departures are instead subject to the applicable VMC criteria for the airspace and time of day.",
    source: "AIP ENR 1.5; CASR Part 91",
  },
  {
    id: "ifr-h-q11",
    question: "In the context of take-off minima, what does 'net take-off flight path' refer to?",
    options: [
      "The actual radar-tracked ground path flown after departure, unrelated to performance",
      "The theoretical climb-out flight path, degraded by a specified performance margin to account for OEI conditions, used to assess safe obstacle clearance during departure planning",
      "The shortest possible route to the first waypoint",
      "A path defined solely by ATC vectors with no performance basis",
    ],
    correctIndex: 1,
    explanation: "The net take-off flight path is the gross (actual) OEI flight path reduced by a regulatory margin, used to conservatively assess whether obstacles in the departure area will be safely cleared, directly influencing weight limits and minima considerations.",
    source: "CASA AC 91-10; CASR Part 91",
  },
  {
    id: "ifr-h-q12",
    question: "Why is a lower take-off visibility minimum sometimes permitted for aircraft with an OEI-focused departure procedure designed for the specific runway?",
    options: [
      "Lower minima are permitted purely at the discretion of the pilot with no procedural basis",
      "A specifically designed and validated departure procedure (accounting for obstacles and OEI performance) can provide the necessary safety margin, allowing regulatory approval of a lower minimum than the generic standard value",
      "Lower minima are never permitted regardless of procedure design",
      "OEI procedures always require higher minima, never lower",
    ],
    correctIndex: 1,
    explanation: "Where a specific engine-out departure procedure has been designed and validated for a runway (addressing terrain/obstacles), this can justify a lower approved take-off minimum, since the safety margin is achieved through the procedure rather than generic visual reference alone.",
    source: "CASA AC 91-10; AIP ENR 1.5",
  },
  {
    id: "ifr-h-q13",
    question: "What is a key reason take-off minima may be more restrictive at night compared to day, for the same runway and lighting configuration?",
    options: [
      "There is never any difference between day and night take-off minima",
      "Reduced visual cues at night for detecting deviation, obstacles, or a rejected takeoff scenario can justify more conservative minima, depending on the specific visual aids and procedures available",
      "Night take-off minima are always lower than day minima",
      "Take-off minima do not consider time of day at all",
    ],
    correctIndex: 1,
    explanation: "Night conditions reduce the pilot's ability to visually detect deviations or obstacles compared to daylight, which — depending on the runway's visual aids — can be reflected in more conservative applicable take-off minima.",
    source: "AIP ENR 1.5; CASA AC 91-10",
  },
  {
    id: "ifr-h-q14",
    question: "How should a pilot treat a situation where the current RVR is reported below the aircraft/operator's approved take-off minima, but forecast to improve within 10 minutes?",
    options: [
      "Depart immediately since improvement is forecast",
      "The pilot must not commence takeoff until the reported/observed conditions actually meet or exceed the applicable minima at the time of departure — forecast improvement does not substitute for current compliance",
      "A 10-minute forecast automatically satisfies the requirement",
      "Only the destination weather trend matters in this decision",
    ],
    correctIndex: 1,
    explanation: "Take-off minima compliance is based on the actual observed/reported conditions at the time of departure, not a forecast trend. The pilot must wait until conditions genuinely meet or exceed the applicable minima before commencing takeoff.",
    source: "CASR Part 91; AIP ENR 1.5",
  },
  {
    id: "ifr-h-q15",
    question: "What is the overall safety objective underlying take-off minima requirements?",
    options: [
      "To maximise schedule reliability regardless of risk",
      "To ensure sufficient visual reference and performance margin exist for the pilot to safely control the aircraft, detect and manage a rejected takeoff or engine failure, and clear obstacles during the critical departure phase",
      "To simplify air traffic control sequencing only",
      "To standardise fuel burn calculations across operators",
    ],
    correctIndex: 1,
    explanation: "Take-off minima exist to guarantee an appropriate combination of visual reference and performance margin so that, in the event of a rejected takeoff or engine failure during the critical departure phase, the crew retains adequate capability to control and safely manage the aircraft.",
    source: "AIP ENR 1.5; CASA AC 91-10; CASR Part 91",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM (i) — Holding and alternate requirements
// Source: CASR 91.445; AIP ENR 1.5
// ─────────────────────────────────────────────────────────────────────────────
const ifrIQuestions: ExamQuestion[] = [
  {
    id: "ifr-i-q01",
    question: "Under CASR 91.445, when must an IFR flight nominate a destination alternate aerodrome?",
    options: [
      "An alternate is required on every IFR flight without exception",
      "An alternate is required when forecast weather at the destination does not meet the specified alternate minima criteria for the expected time of arrival, or other conditions specified in the regulation are not met",
      "An alternate is only required for international flights",
      "An alternate is never required if the aircraft carries extra fuel",
    ],
    correctIndex: 1,
    explanation: "CASR 91.445 requires nomination of a destination alternate where forecast destination weather does not satisfy the alternate minima criteria (or other specified conditions, such as a single suitable runway/navaid) for the estimated time of arrival, ensuring a safe diversion option.",
    source: "CASR 91.445",
  },
  {
    id: "ifr-i-q02",
    question: "What does the commonly referenced '1-2-3 rule' broadly describe in relation to filing an alternate?",
    options: [
      "A rule stating fuel reserves of 1, 2, or 3 hours depending on aircraft type",
      "A general planning guideline that if, within 1 hour either side of ETA, the forecast ceiling is at least 2,000 ft and visibility at least 3 statute miles (or equivalent) above minima, an alternate may not be required — though the specific figures/criteria used in Australia are as published in AIP ENR 1.5",
      "A rule requiring exactly 3 alternates to be filed for every flight",
      "A requirement to carry alternate fuel for 123 nautical miles",
    ],
    correctIndex: 1,
    explanation: "The '1-2-3 rule' is a widely referenced mnemonic (varying by jurisdiction) linking forecast ceiling/visibility margins around ETA to whether an alternate is required; in the Australian context, the specific applicable criteria and figures are defined in AIP ENR 1.5 and CASR 91.445.",
    source: "AIP ENR 1.5; CASR 91.445",
  },
  {
    id: "ifr-i-q03",
    question: "What are 'alternate minima' as published in AIP ENR 1.5?",
    options: [
      "The absolute minimum fuel required to be carried on any IFR flight",
      "The specific weather (ceiling and visibility) criteria that must be forecast to be equalled or exceeded at an aerodrome for it to be nominated as a usable alternate for the estimated time of use",
      "The minimum runway length required at any alternate aerodrome",
      "A fixed universal value of 500 ft and 5 km applicable to every aerodrome",
    ],
    correctIndex: 1,
    explanation: "Alternate minima are the specific forecast ceiling and visibility values (varying by aerodrome/approach type) that must be met or exceeded for an aerodrome to be validly nominated as an alternate for the relevant time of use.",
    source: "AIP ENR 1.5",
  },
  {
    id: "ifr-i-q04",
    question: "What must holding fuel calculations account for when planning an IFR flight to an aerodrome with a forecast of possible delay?",
    options: [
      "Holding fuel is never required to be considered in flight planning",
      "Sufficient fuel to hold for a specified period (as prescribed by the operator's fuel policy and regulations) at the expected holding point, plus fuel to proceed to the alternate if required, in addition to standard reserves",
      "Only enough fuel to complete one holding pattern, regardless of expected delay",
      "Holding fuel is only relevant for turbojet aircraft",
    ],
    correctIndex: 1,
    explanation: "Fuel planning must include an allowance for holding (per the applicable fuel policy) in case of traffic or weather delay, plus fuel to divert to the alternate and account for the required final reserve — not merely enough for the direct routing.",
    source: "CASR Part 91; AIP ENR 1.5",
  },
  {
    id: "ifr-i-q05",
    question: "What is the standard maximum holding speed for a Category B aircraft in a standard holding pattern below 14,000 ft, as published in AIP ENR 1.5?",
    options: [
      "170 KIAS",
      "200 KIAS",
      "230 KIAS",
      "265 KIAS",
    ],
    correctIndex: 0,
    explanation: "Standard holding speed schedules published in AIP ENR 1.5 specify maximum holding speeds by aircraft category and altitude band; for Category B aircraft below 14,000 ft, the applicable maximum holding speed is 170 KIAS.",
    source: "AIP ENR 1.5 — Holding Speed Schedule",
  },
  {
    id: "ifr-i-q06",
    question: "Which three standard holding pattern entry procedures are recognised for entering a published holding pattern?",
    options: [
      "Direct, parallel, and teardrop entries, determined by the aircraft's approach track relative to the holding pattern sectors",
      "Left-hand, right-hand, and reciprocal entries",
      "Standard, non-standard, and emergency entries",
      "North, south, and combined entries",
    ],
    correctIndex: 0,
    explanation: "The three recognised holding pattern entry procedures are direct entry, parallel (offset) entry, and teardrop entry, with the applicable method determined by the sector (relative to the inbound holding course) from which the aircraft approaches the fix.",
    source: "AIP ENR 1.5 — Holding Procedures",
  },
  {
    id: "ifr-i-q07",
    question: "What determines the standard outbound leg timing in a time-based (non-DME) holding pattern?",
    options: [
      "A fixed 3-minute outbound leg regardless of wind",
      "A standard 1-minute outbound leg (in the absence of published DME/RNAV distances), adjusted by the pilot to compensate for the effect of wind so that the inbound leg approximates the same standard time",
      "The outbound leg time is always identical to the total flight time remaining",
      "Outbound leg timing is determined solely by ATC verbal instruction with no standard default",
    ],
    correctIndex: 1,
    explanation: "In a standard time-based hold, the outbound leg is nominally 1 minute, with the pilot applying wind corrections (adjusting heading and timing) so the resulting pattern approximates the intended inbound leg timing despite wind drift.",
    source: "AIP ENR 1.5 — Holding Procedures",
  },
  {
    id: "ifr-i-q08",
    question: "What is the significance of the published Minimum Holding Altitude (MHA) at a holding fix?",
    options: [
      "It is simply a suggested altitude with no regulatory significance",
      "It is the lowest altitude that ensures adequate obstacle clearance and navaid signal reception while holding at that fix, and must not be flown below while holding",
      "It only applies to helicopters, not fixed-wing aircraft",
      "It is always identical to the minimum sector altitude for the entire route",
    ],
    correctIndex: 1,
    explanation: "The MHA is published to guarantee both terrain/obstacle clearance and reliable navaid reception within the holding pattern, and pilots must not descend below it while established in the hold at that fix.",
    source: "AIP ENR 1.5",
  },
  {
    id: "ifr-i-q09",
    question: "Under CASR 91.445, what alternative to nominating a destination alternate may sometimes apply for certain aerodromes/approach capabilities?",
    options: [
      "An alternate can never be waived under any circumstances",
      "Where the destination has at least two separate, independent approach/runway options (or other specified redundancy conditions defined in the regulation) and forecast conditions meet the applicable criteria, the requirement to nominate an alternate may not apply",
      "An alternate can be waived simply if the pilot has more than 15 years of experience",
      "The requirement is waived automatically for all jet aircraft",
    ],
    correctIndex: 1,
    explanation: "CASR 91.445 provides for circumstances (such as sufficiently independent approach/runway redundancy at the destination, combined with satisfying the applicable weather criteria) where the alternate requirement may not apply, though these are specific and must be verified against the regulation.",
    source: "CASR 91.445",
  },
  {
    id: "ifr-i-q10",
    question: "How is the minimum fuel required to divert to an alternate typically calculated?",
    options: [
      "A fixed 30 minutes of fuel regardless of distance to the alternate",
      "Fuel to fly from the missed approach point (or relevant diversion point) at the destination to the alternate, plus any required holding, approach, and the prescribed fixed/variable reserve",
      "Only the fuel used during the cruise segment to the alternate, excluding approach and reserve fuel",
      "Alternate fuel is not a distinct planning category; it is included within trip fuel automatically",
    ],
    correctIndex: 1,
    explanation: "Alternate fuel planning covers the diversion from the missed approach point at the destination to the alternate, including the approach at the alternate, plus the required fixed and/or variable fuel reserves as specified by the operator's fuel policy and regulations.",
    source: "CASR Part 91; AIP ENR 1.5",
  },
  {
    id: "ifr-i-q11",
    question: "In a parallel entry to a holding pattern, what is the general sequence of actions?",
    options: [
      "Fly directly to the fix and turn immediately outbound on the holding course",
      "Cross the fix, turn to parallel the inbound holding course on the non-holding side for the outbound time, then turn to intercept the inbound holding course back to the fix",
      "Overfly the fix and immediately descend to the MHA before turning",
      "Parallel entry requires flying a full 360° turn before crossing the fix",
    ],
    correctIndex: 1,
    explanation: "A parallel entry involves crossing the fix, flying parallel to the inbound holding course on the non-holding side for the outbound leg, then turning to intercept and follow the inbound course back to the fix, before continuing the standard pattern.",
    source: "AIP ENR 1.5 — Holding Entry Procedures",
  },
  {
    id: "ifr-i-q12",
    question: "In a teardrop entry to a holding pattern, what is the general technique?",
    options: [
      "Cross the fix and fly outbound on a track diverging from the holding course by approximately 30°, within the holding side, then turn to intercept the inbound holding course",
      "Cross the fix and fly outbound exactly along the inbound holding course reversed",
      "Fly a full parallel track on the non-holding side before intercepting",
      "Teardrop entries are prohibited under Australian holding procedures",
    ],
    correctIndex: 0,
    explanation: "A teardrop entry involves crossing the fix and tracking outbound at approximately 30° from the reciprocal of the inbound holding course, remaining on the holding side, before turning to intercept the inbound course back through the fix.",
    source: "AIP ENR 1.5 — Holding Entry Procedures",
  },
  {
    id: "ifr-i-q13",
    question: "What effect does exceeding the maximum published holding speed for the aircraft category have on the protected holding airspace?",
    options: [
      "No effect — protected airspace dimensions are independent of speed",
      "Exceeding the published maximum holding speed risks the aircraft flying outside the protected holding airspace, eroding the obstacle clearance and containment margins the pattern was designed to provide",
      "It only affects fuel burn, not airspace containment",
      "It automatically extends the protected area to compensate",
    ],
    correctIndex: 1,
    explanation: "Holding pattern protected airspace dimensions are calculated based on the maximum permitted holding speed for each aircraft category; exceeding that speed can cause the aircraft to drift outside the protected area, compromising obstacle clearance.",
    source: "AIP ENR 1.5",
  },
  {
    id: "ifr-i-q14",
    question: "Why might ATC assign holding at a fix with a specified 'expect further clearance' (EFC) time?",
    options: [
      "EFC times are purely advisory and carry no operational significance",
      "The EFC time provides the pilot with a planning reference for expected clearance beyond the hold, supporting fuel and diversion decision-making if communications are lost or clearance is delayed",
      "EFC times are only used for VFR traffic, not IFR holding",
      "EFC time indicates the exact minute the aircraft must land, regardless of fuel state",
    ],
    correctIndex: 1,
    explanation: "The EFC time gives the pilot a reference point for expected further clearance, which is critical both for fuel/diversion planning and as the trigger for lost-communications procedures if radio contact is lost while holding.",
    source: "AIP ENR 1.5; CASR Part 91",
  },
  {
    id: "ifr-i-q15",
    question: "What combination of factors determines whether a nominated alternate aerodrome is valid for a specific IFR flight?",
    options: [
      "Only the runway length at the alternate matters; weather is irrelevant",
      "The alternate must have a suitable approach procedure available, adequate runway/facilities for the aircraft type, and forecast weather meeting or exceeding the published alternate minima for the estimated time of use",
      "Any aerodrome within 50 NM of the destination automatically qualifies",
      "The alternate's validity depends solely on it having a control tower",
    ],
    correctIndex: 1,
    explanation: "A valid alternate must offer a usable approach procedure and facilities suited to the aircraft, with forecast weather for the relevant time meeting or exceeding the published alternate minima — runway proximity or tower status alone do not establish validity.",
    source: "CASR 91.445; AIP ENR 1.5",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXAM EXPORTS — CASA Form 61-1503 Ground Theory Topics (a)–(i)
// ─────────────────────────────────────────────────────────────────────────────

const exam_a: Exam = {
  id: "ifr-a",
  title: "Privileges and limitations of the IR and endorsements",
  subtitle: "CASA Form 61-1503 — Ground Theory (a)",
  questions: ifrAQuestions,
};

const exam_b: Exam = {
  id: "ifr-b",
  title: "Proficiency check requirements",
  subtitle: "CASA Form 61-1503 — Ground Theory (b)",
  questions: ifrBQuestions,
};

const exam_c: Exam = {
  id: "ifr-c",
  title: "IFR and approach recency requirements",
  subtitle: "CASA Form 61-1503 — Ground Theory (c)",
  questions: ifrCQuestions,
};

const exam_d: Exam = {
  id: "ifr-d",
  title: "Night recency requirements",
  subtitle: "CASA Form 61-1503 — Ground Theory (d)",
  questions: ifrDQuestions,
};

const exam_e: Exam = {
  id: "ifr-e",
  title: "Night VFR operations",
  subtitle: "CASA Form 61-1503 — Ground Theory (e)",
  questions: ifrEQuestions,
};

const exam_f: Exam = {
  id: "ifr-f",
  title: "Aircraft instrument requirements",
  subtitle: "CASA Form 61-1503 — Ground Theory (f)",
  questions: ifrFQuestions,
};

const exam_g: Exam = {
  id: "ifr-g",
  title: "Interpreting operational and meteorological information",
  subtitle: "CASA Form 61-1503 — Ground Theory (g)",
  questions: ifrGQuestions,
};

const exam_h: Exam = {
  id: "ifr-h",
  title: "Take-off minima",
  subtitle: "CASA Form 61-1503 — Ground Theory (h)",
  questions: ifrHQuestions,
};

const exam_i: Exam = {
  id: "ifr-i",
  title: "Holding and alternate requirements",
  subtitle: "CASA Form 61-1503 — Ground Theory (i)",
  questions: ifrIQuestions,
};

export const EXAMS_IFR_PART1: Exam[] = [exam_a, exam_b, exam_c, exam_d, exam_e, exam_f, exam_g, exam_h, exam_i];
