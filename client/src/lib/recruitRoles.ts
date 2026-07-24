import type { RoleId } from "./schema";

export interface Requirement {
  key: string;
  label: string;
  mandatory: boolean;
}

export interface RegistrationField {
  key: string; // stored in registrationNumbers JSON
  label: string;
  placeholder: string;
}

export interface Role {
  id: RoleId;
  name: string;
  category: string;
  tagline: string;
  overview: string;
  location: string;
  employmentType: string;
  requirements: Requirement[];
  registrationFields: RegistrationField[];
}

// Keyword sets used by the server-side screening heuristic. Frontend does not
// use these — they live here so requirements and scoring stay in one place.
export const ROLE_KEYWORDS: Partial<Record<RoleId, string[]>> = {
  pilot: [
    "cpl", "atpl", "instrument rating", "pic", "pilot in command", "multi-engine",
    "turbine", "king air", "ifr", "single pilot", "flight hours", "casa", "night",
    "remote", "airstrip", "aeromedical", "rfds",
  ],
  flight_nurse: [
    "icu", "intensive care", "emergency", "ed ", "critical care", "ahpra",
    "registered nurse", "retrieval", "aeromedical", "post-graduate", "tertiary",
    "regional", "rural", "resuscitation", "trauma",
  ],
  flight_doctor: [
    "racgp", "acrrm", "acem", "anzca", "cicm", "fellowship", "emergency medicine",
    "rural", "remote", "retrieval", "pre-hospital", "acls", "atls", "ahpra",
    "consultant", "resuscitation", "aeromedical",
  ],
  lame: [
    "b1", "b2", "avionics", "mechanical", "turbine", "king air", "part 145",
    "casa", "licence", "type endorsement", "line maintenance", "beechcraft",
    "engineer", "ame",
  ],
  operations: [
    "flight planning", "notam", "dispatch", "coordination", "atc", "radio",
    "operations", "aeromedical", "retrieval", "part 121", "part 135", "weather",
    "casa", "24/7", "shift", "control",
  ],
};

export const ROLES: Role[] = [
  {
    id: "pilot",
    name: "Line Pilot (Fixed Wing)",
    category: "Flight Crew",
    tagline: "Single-pilot IFR aeromedical operations across remote Australia.",
    overview:
      "Command fixed-wing aeromedical missions delivering critical care to patients across regional and remote Australia. You will operate turbine aircraft into challenging airstrips, often single-pilot IFR, day and night, in all conditions. This role demands exceptional airmanship, precise decision-making, and a commitment to patient outcomes.",
    location: "Regional bases — Australia-wide",
    employmentType: "Full-time · Rostered",
    registrationFields: [
      { key: "ARN", label: "CASA Aviation Reference Number (ARN)", placeholder: "e.g. 123456" },
      { key: "Licence", label: "Licence Type & Number", placeholder: "e.g. CPL 1234567" },
    ],
    requirements: [
      { key: "cpl_atpl", label: "Current Australian CPL with ATPL subjects completed (or full ATPL)", mandatory: true },
      { key: "me_ir_renewals", label: "Multi-Engine Command Instrument Rating with minimum 4 renewals", mandatory: true },
      { key: "class1_medical", label: "Current CASA Class 1 Medical Certificate", mandatory: true },
      { key: "hours_total", label: "Minimum 2,500 total flight hours", mandatory: true },
      { key: "hours_pic", label: "Minimum 2,000 hours Pilot in Command", mandatory: true },
      { key: "hours_me_command", label: "Minimum 500 hours Multi-Engine command time", mandatory: true },
      { key: "hours_night", label: "Minimum 100 hours night flying", mandatory: true },
      { key: "hours_instrument", label: "Minimum 100 hours instrument time", mandatory: true },
      { key: "work_rights", label: "Australian citizenship, permanent residency, or valid work visa", mandatory: true },
      { key: "asic", label: "Current Aviation Security Identification Card (ASIC) or eligibility to obtain", mandatory: true },
      { key: "dat", label: "Drug and alcohol testing compliance", mandatory: true },
      { key: "drivers_licence", label: "Current Driver's Licence", mandatory: true },
      { key: "police_wwcc", label: "Police check and Working with Children Check", mandatory: true },
      { key: "vaccination", label: "Pre-employment vaccination evidence (MMR, whooping cough, chickenpox, hepatitis A & B)", mandatory: true },
      { key: "turbine", label: "Turbine experience", mandatory: false },
      { key: "spifr", label: "Single pilot IFR operations experience", mandatory: false },
      { key: "remote_airstrip", label: "Remote/regional airstrip experience", mandatory: false },
    ],
  },
  {
    id: "flight_nurse",
    name: "Flight Nurse",
    category: "Clinical Crew",
    tagline: "Critical-care nursing at altitude for the sickest patients in the remotest places.",
    overview:
      "Deliver advanced critical care in the aeromedical environment, managing complex patients throughout retrieval and inter-hospital transfer. You will draw on deep ICU and emergency experience to make autonomous clinical decisions in a resource-limited cabin, working alongside pilots and doctors as a high-performing crew.",
    location: "Regional bases — Australia-wide",
    employmentType: "Full-time · Rotating shifts",
    registrationFields: [
      { key: "AHPRA", label: "AHPRA Registration Number", placeholder: "e.g. NMW0001234567" },
    ],
    requirements: [
      { key: "ahpra_rn", label: "Current AHPRA registration as Registered Nurse", mandatory: true },
      { key: "ahpra_no_conditions", label: "AHPRA registration with no conditions or restrictions", mandatory: true },
      { key: "exp_5yr", label: "Minimum 5 years post-registration experience", mandatory: true },
      { key: "exp_3yr_cc", label: "Minimum 3 years critical care experience (ICU/ED) after recognised post-graduate certificate", mandatory: true },
      { key: "pg_cert", label: "Post-graduate certificate (or higher) in Emergency Medicine or Intensive Care", mandatory: true },
      { key: "tertiary_ed_icu", label: "Experience in a Major Regional/Tertiary ED with 24-hour medical coverage OR recognised ICU", mandatory: true },
      { key: "work_rights", label: "Australian work rights", mandatory: true },
      { key: "rotating_shifts", label: "Willingness to work rotating shifts including nights, weekends, and public holidays", mandatory: true },
      { key: "drivers_licence", label: "Current Driver's Licence", mandatory: true },
      { key: "police_wwcc", label: "Police check and Working with Children Check", mandatory: true },
      { key: "vaccination", label: "Pre-employment vaccination evidence (MMR, whooping cough, chickenpox, hepatitis A & B)", mandatory: true },
      { key: "remote_health", label: "Remote/rural health experience", mandatory: false },
      { key: "retrieval_exp", label: "Retrieval/aeromedical experience", mandatory: false },
    ],
  },
  {
    id: "flight_doctor",
    name: "Flight Doctor / Retrieval Consultant",
    category: "Clinical Crew",
    tagline: "Senior clinical leadership for the most complex pre-hospital retrievals.",
    overview:
      "Provide senior medical leadership on high-acuity aeromedical retrievals and inter-hospital transfers. You will bring rural, remote, or emergency expertise to austere environments, leading the clinical response, mentoring crew, and participating in an on-call retrieval roster.",
    location: "Regional bases — Australia-wide",
    employmentType: "Full-time / Fractional · On-call roster",
    registrationFields: [
      { key: "AHPRA", label: "AHPRA Registration Number", placeholder: "e.g. MED0001234567" },
      { key: "Fellowship", label: "Fellowship (College & Year)", placeholder: "e.g. FACRRM 2019" },
    ],
    requirements: [
      { key: "ahpra_mp", label: "Current AHPRA registration as Medical Practitioner (unconditional)", mandatory: true },
      { key: "fellowship", label: "Fellowship with RACGP or ACRRM, OR ACEM/ANZCA/CICM (retrieval consultants)", mandatory: true },
      { key: "exp_rural_em", label: "Significant experience in rural, remote, or emergency medicine", mandatory: true },
      { key: "acls_atls", label: "Current ACLS/ATLS or equivalent advanced life support certification", mandatory: true },
      { key: "work_rights", label: "Australian work rights", mandatory: true },
      { key: "on_call", label: "Willingness to participate in on-call and after-hours retrieval roster", mandatory: true },
      { key: "drivers_licence", label: "Current Driver's Licence", mandatory: true },
      { key: "police_wwcc", label: "Police check and Working with Children Check", mandatory: true },
      { key: "vaccination", label: "Pre-employment vaccination evidence (MMR, whooping cough, chickenpox, hepatitis A & B)", mandatory: true },
      { key: "prehospital", label: "Pre-hospital or retrieval medicine experience", mandatory: false },
      { key: "clinical_leadership", label: "Clinical leadership experience", mandatory: false },
    ],
  },
  {
    id: "lame",
    name: "Licensed Aircraft Maintenance Engineer (LAME)",
    category: "Engineering",
    tagline: "Keep the fleet mission-ready. Turbine maintenance under Part 145.",
    overview:
      "Maintain a fleet of turbine aeromedical aircraft to the highest airworthiness standards within a CASA Part 145 organisation. You will perform scheduled and line maintenance, troubleshoot complex defects, and ensure aircraft are always ready to respond, working shifts and on-call as operations demand.",
    location: "Maintenance bases — Australia-wide",
    employmentType: "Full-time · Shift & on-call",
    registrationFields: [
      { key: "AME_Licence", label: "CASA AME Licence Number", placeholder: "e.g. 123456" },
      { key: "Category", label: "Licence Category (B1 / B2)", placeholder: "e.g. B1" },
    ],
    requirements: [
      { key: "ame_licence", label: "Current CASA AME Licence — Category B1 (Mechanical) or B2 (Avionics)", mandatory: true },
      { key: "exp_3yr", label: "Minimum 3 years post-licence experience in aviation maintenance", mandatory: true },
      { key: "turbine_exp", label: "Experience with turbine-powered aircraft", mandatory: true },
      { key: "part145", label: "CASA Part 145 maintenance organisation experience", mandatory: true },
      { key: "asic", label: "Current Aviation Security Identification Card (ASIC) or eligibility to obtain", mandatory: true },
      { key: "work_rights", label: "Australian work rights", mandatory: true },
      { key: "dat", label: "Drug and alcohol testing compliance", mandatory: true },
      { key: "police", label: "Police check", mandatory: true },
      { key: "shifts_oncall", label: "Ability to work shifts and on-call requirements", mandatory: true },
      { key: "king_air_type", label: "Type endorsement on Beechcraft King Air B200/B350 (or willingness to obtain)", mandatory: false },
      { key: "line_maintenance", label: "Line maintenance experience", mandatory: false },
      { key: "avionics_systems", label: "Experience with aircraft avionics systems (Category B2 applicants)", mandatory: false },
    ],
  },
  {
    id: "operations",
    name: "Operations Officer / Mission Coordinator",
    category: "Operations",
    tagline: "The calm voice coordinating every mission, 24/7.",
    overview:
      "Coordinate aeromedical missions from tasking to touchdown in a high-tempo operations centre. You will manage flight planning, crewing, and communications under pressure, liaising with clinicians, pilots, and hospitals to move critically ill patients safely and swiftly, around the clock.",
    location: "Operations centres — Australia-wide",
    employmentType: "Full-time · 24/7 rotating shifts",
    registrationFields: [],
    requirements: [
      { key: "exp_2yr_ops", label: "Minimum 2 years in aviation operations, aeromedical coordination, emergency dispatch, or similar high-tempo environment", mandatory: true },
      { key: "flight_planning", label: "Proficiency in flight planning, NOTAM and weather interpretation (formal qualification or demonstrated experience)", mandatory: true },
      { key: "casa_regs", label: "Understanding of CASA regulations applicable to Part 121/135 operations", mandatory: true },
      { key: "comms", label: "Strong communication skills", mandatory: true },
      { key: "shifts_247", label: "Ability to work rotating 24/7 shifts including nights, weekends, and public holidays", mandatory: true },
      { key: "attention_pressure", label: "High attention to detail and ability to perform under pressure", mandatory: true },
      { key: "work_rights", label: "Australian work rights", mandatory: true },
      { key: "police_wwcc", label: "Police check and Working with Children Check", mandatory: true },
      { key: "asic", label: "ASIC or eligibility to obtain", mandatory: true },
      { key: "radio_atc", label: "Radio communications and ATC liaison experience", mandatory: false },
      { key: "ops_systems", label: "Experience with computerised operations management systems", mandatory: false },
      { key: "aeromedical_exp", label: "Exposure to aeromedical or retrieval operations", mandatory: false },
    ],
  },
];

// ---------------------------------------------------------------------------
// Apprentice Program — a distinct, human, aspirational track. Not a job listing.
// The "criteria" are soft, self-affirmed statements rather than a hard gate.
// ---------------------------------------------------------------------------

export interface SoftCriterion {
  key: string;
  label: string;
}

export const APPRENTICE = {
  id: "apprentice" as RoleId,
  name: "Apprentice Program",
  headline: "Start Here. Go Anywhere.",
  subheading: "Medivac.ai Apprentice Program — Aviation Trades & Operations",
  intro:
    "You don't need a fancy resume. You don't need to have it all figured out. If you've got the drive to learn, we've got a place for you to start — working on real aircraft that save lives across the bush.",
  forWho: [
    "Young people aged 15–25 from regional, rural, or remote Australia",
    "People who haven't had every opportunity — but have the drive to earn one",
    "Kids interested in aircraft maintenance, operations, ground handling, logistics, or admin",
    "No prior aviation experience needed — just determination, reliability, and a willingness to learn",
  ],
  whatYouGet: [
    "A structured apprenticeship in aviation trades (AME pathway, operations support, logistics)",
    "Mentorship from experienced RFDS-standard aeromedical engineers and operations staff",
    "A real pathway to full CASA certification and a professional career in aviation",
    "Real work on real aircraft from day one",
    "A reference and a professional network that lasts a lifetime",
  ],
  criteria: [
    { key: "regional", label: "I live in a regional, rural, or remote area of Australia (or grew up in one)" },
    { key: "age", label: "I am between 15 and 25 years old" },
    { key: "interested", label: "I'm interested in aviation, engineering, or operations (even if I don't know much yet)" },
    { key: "reliable", label: "I'm reliable and show up when I say I will" },
    { key: "commit", label: "I'm willing to commit to a structured 2–4 year apprenticeship program" },
    { key: "work_rights", label: "I have Australian citizenship, permanent residency, or approved work rights" },
    { key: "checks", label: "I'm willing to undergo a police check and drug and alcohol testing" },
  ] as SoftCriterion[],
};

// Enthusiasm signal keywords used by the apprentice screening heuristic.
export const APPRENTICE_ENTHUSIASM_KEYWORDS = [
  "passion", "passionate", "curious", "love", "dream", "always wanted",
  "fascinated", "fascinate", "excited", "inspire", "inspired", "determined",
  "hard work", "learn", "aircraft", "planes", "flying", "aviation", "engine",
  "fix", "build", "hands-on", "opportunity", "help people", "never given up",
];

export function getRole(id: string): Role | undefined {
  return ROLES.find((r) => r.id === id);
}

export function mandatoryCount(role: Role): number {
  return role.requirements.filter((r) => r.mandatory).length;
}
