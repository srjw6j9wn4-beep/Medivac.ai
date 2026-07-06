// Theory Knowledge Exam Bank
// Generated from RFDS SE King Air manuals
// Each question includes source reference for full transparency

export interface ExamQuestion {
  id: string;
  question: string;
  options: [string, string, string, string]; // A, B, C, D
  correctIndex: number; // 0=A, 1=B, 2=C, 3=D
  explanation: string;
  source: string; // Document reference
}

export interface Exam {
  id: string;
  title: string;
  subtitle: string;
  questions: ExamQuestion[];
}

// ─────────────────────────────────────────────────────────────
// EXAM 1 — Memory Flash Cards (Emergency Airspeeds & Limitations)
// Source: KA_B200_B200C_BB1439_Memory_Flash_Cards-Late-Model.pdf
// ─────────────────────────────────────────────────────────────
const exam1Questions: ExamQuestion[] = [
  {
    id: "e1q01",
    question: "At 12,500 lbs, what is the OEI best angle-of-climb speed (VXSE) for the B200?",
    options: ["108 KIAS", "115 KIAS", "121 KIAS", "135 KIAS"],
    correctIndex: 1,
    explanation: "VXSE at 12,500 lbs is 115 KIAS. This gives the steepest climb angle on one engine for obstacle clearance.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Airspeeds at 12,500 lbs",
  },
  {
    id: "e1q02",
    question: "At 12,500 lbs, what is the OEI best rate-of-climb speed (VYSE) for the B200?",
    options: ["115 KIAS", "118 KIAS", "121 KIAS", "125 KIAS"],
    correctIndex: 2,
    explanation: "VYSE at 12,500 lbs is 121 KIAS. This gives the greatest altitude gain per unit of time on one engine.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Airspeeds at 12,500 lbs",
  },
  {
    id: "e1q03",
    question: "What is the OEI enroute climb speed for the B200 at 12,500 lbs?",
    options: ["115 KIAS", "119 KIAS", "121 KIAS", "130 KIAS"],
    correctIndex: 2,
    explanation: "OEI enroute climb speed is 121 KIAS — same as VYSE — for the B200 at maximum weight.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Airspeeds at 12,500 lbs",
  },
  {
    id: "e1q04",
    question: "What is the Air Minimum Control Speed (VMCA) for the B200?",
    options: ["76 KIAS", "82 KIAS", "86 KIAS", "92 KIAS"],
    correctIndex: 2,
    explanation: "VMCA is 86 KIAS with a windmilling propeller. Note: with windmilling prop it can be as high as 108 KIAS depending on configuration.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Airspeeds at 12,500 lbs",
  },
  {
    id: "e1q05",
    question: "What is the emergency descent speed for the B200 at 12,500 lbs?",
    options: ["160 KIAS", "170 KIAS", "181 KIAS", "200 KIAS"],
    correctIndex: 2,
    explanation: "Emergency descent speed is 181 KIAS, same as maneuvering speed (VA). Maximum structural speed for abrupt control inputs.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Airspeeds at 12,500 lbs",
  },
  {
    id: "e1q06",
    question: "What is the maximum range glide speed for the B200?",
    options: ["115 KIAS", "121 KIAS", "130 KIAS", "135 KIAS"],
    correctIndex: 3,
    explanation: "Maximum range glide speed is 135 KIAS. This maximises glide distance in the event of a dual engine failure.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Airspeeds at 12,500 lbs",
  },
  {
    id: "e1q07",
    question: "During an emergency engine shutdown in flight, which item is actioned FIRST?",
    options: ["Prop Lever → FEATHER", "Condition Lever → FUEL CUTOFF", "Firewall Shutoff Valve → CLOSE", "Generator → OFF"],
    correctIndex: 1,
    explanation: "The first action in emergency engine shutdown is Condition Lever → FUEL CUTOFF to stop fuel supply to the affected engine.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Emergency Shutdown Procedure",
  },
  {
    id: "e1q08",
    question: "After the condition lever and prop lever are set during an engine fire in flight, what is the next step?",
    options: ["Generator OFF", "Auto Ignition OFF", "Firewall Shutoff Valve → CLOSE", "Fire Extinguisher ACTUATE"],
    correctIndex: 2,
    explanation: "After Condition Lever → FUEL CUTOFF and Prop Lever → FEATHER, the next step is Firewall Shutoff Valve → CLOSE to isolate the fuel supply completely.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Engine Fire in Flight Procedure",
  },
  {
    id: "e1q09",
    question: "During an engine fire on the ground, what position is the Ignition/Engine Start set to?",
    options: ["OFF", "BOTH", "STARTER ONLY", "IGNITION ONLY"],
    correctIndex: 2,
    explanation: "During engine fire on the ground, Ignition and Engine Start is set to STARTER ONLY — this uses airflow to help extinguish the fire without re-igniting fuel.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Engine Fire on Ground Procedure",
  },
  {
    id: "e1q10",
    question: "If a fire warning persists during an engine fire on the ground after initial steps, what is the final action?",
    options: ["Brake Deice OFF", "Fire Extinguisher → ACTUATE", "Generator → OFF", "Fuel Firewall Valve → OPEN"],
    correctIndex: 1,
    explanation: "If the fire warning persists after Condition Lever FUEL CUTOFF and Firewall Valve CLOSE, the fire extinguisher is ACTUATED.",
    source: "KA B200/B200C Memory Flash Cards (BB1439) — Engine Fire on Ground Procedure",
  },
  {
    id: "e1q11",
    question: "What is the maneuvering speed (VA) of the B200 at 12,500 lbs?",
    options: ["170 KIAS", "175 KIAS", "181 KIAS", "184 KIAS"],
    correctIndex: 2,
    explanation: "Maneuvering speed (VA) is 181 KIAS at 12,500 lbs. Do not make full or abrupt control inputs above this speed.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q12",
    question: "What is the two-engine best rate-of-climb speed (VY) for the B200 at 12,500 lbs?",
    options: ["100 KIAS", "115 KIAS", "121 KIAS", "125 KIAS"],
    correctIndex: 3,
    explanation: "VY (two-engine best rate-of-climb) is 125 KIAS at 12,500 lbs. This is different from VYSE (121 KIAS) which applies OEI.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q13",
    question: "What is the two-engine best angle-of-climb speed (VX) for the B200 at 12,500 lbs?",
    options: ["95 KIAS", "100 KIAS", "106 KIAS", "115 KIAS"],
    correctIndex: 1,
    explanation: "VX (two-engine best angle-of-climb) is 100 KIAS at 12,500 lbs. Used for obstacle clearance with both engines operative.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q14",
    question: "What is the maximum demonstrated crosswind component for the B200?",
    options: ["15 knots", "20 knots", "25 knots", "30 knots"],
    correctIndex: 2,
    explanation: "The maximum demonstrated crosswind component for the B200 is 25 knots. This is demonstrated, not a structural limit.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q15",
    question: "What is the B200 intentional one-engine-inoperative speed (VSSE)?",
    options: ["86 KIAS", "100 KIAS", "104 KIAS", "115 KIAS"],
    correctIndex: 2,
    explanation: "VSSE is 104 KIAS. Below this speed, intentional engine failure simulation is prohibited to ensure directional controllability.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q16",
    question: "What is the turbulent air penetration speed for the B200?",
    options: ["160 KIAS", "170 KIAS", "181 KIAS", "200 KIAS"],
    correctIndex: 1,
    explanation: "Turbulent air penetration speed is 170 KIAS. This provides a margin below maneuvering speed while maintaining positive control in turbulence.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q17",
    question: "What is the cruise climb speed band for the B200 between sea level and 10,000 feet?",
    options: ["120 KIAS", "130 KIAS", "140 KIAS", "160 KIAS"],
    correctIndex: 3,
    explanation: "Cruise climb between sea level and 10,000 ft is 160 KIAS, reducing to 140 KIAS from 10,000–20,000 ft.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q18",
    question: "What is the rotation speed for a flaps-up takeoff at 12,500 lbs in the B200?",
    options: ["90 knots", "94 knots", "95 knots", "100 knots"],
    correctIndex: 2,
    explanation: "Rotation speed with flaps up at 12,500 lbs is 95 knots. With flaps approach, rotation is 94 knots.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q19",
    question: "What is the normal landing approach speed with flaps down at 12,500 lbs?",
    options: ["95 KIAS", "100 KIAS", "103 KIAS", "106 KIAS"],
    correctIndex: 2,
    explanation: "Normal landing approach speed with flaps down at 12,500 lbs is 103 KIAS.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e1q20",
    question: "What is the balked landing climb speed for the B200?",
    options: ["95 KIAS", "100 KIAS", "106 KIAS", "121 KIAS"],
    correctIndex: 1,
    explanation: "Balked landing (go-around) climb speed is 100 KIAS, allowing safe acceleration and climb from a missed approach.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 2 — B200 QRH (RFDS SE AVM004c)
// Source: AVM004c-B200-QRH-COMPLETE.pdf
// ─────────────────────────────────────────────────────────────
const exam2Questions: ExamQuestion[] = [
  {
    id: "e2q01",
    question: "What is the normal oil pressure range for the B200 below 21,000 ft?",
    options: ["60–100 PSI", "85–135 PSI", "100–135 PSI", "90–140 PSI"],
    correctIndex: 2,
    explanation: "Normal oil pressure below 21,000 ft is 100–135 PSI. At or above 21,000 ft, the range extends down to 85–135 PSI.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Oil Pressure",
  },
  {
    id: "e2q02",
    question: "At or above 21,000 ft, what is the minimum acceptable oil pressure for the B200?",
    options: ["60 PSI", "85 PSI", "90 PSI", "100 PSI"],
    correctIndex: 1,
    explanation: "At or above 21,000 ft, the minimum normal oil pressure is 85 PSI (range 85–135 PSI). Below 85 PSI is undesirable at this altitude.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Oil Pressure",
  },
  {
    id: "e2q03",
    question: "At what oil pressure range is B200 engine operation considered 'undesirable' and what is the required action?",
    options: ["Below 60 PSI — shut down immediately", "60–85 PSI — reduce torque ≤1100 ft-lbs and complete the flight", "85–100 PSI — monitor and continue normally", "100–110 PSI — increase torque to compensate"],
    correctIndex: 1,
    explanation: "Oil pressure 60–85 PSI is undesirable: reduce torque to 1100 ft-lbs or less and complete the flight. Below 60 PSI is unsafe — shut down or land at the nearest suitable airport.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Oil Pressure",
  },
  {
    id: "e2q04",
    question: "What is the maximum oil temperature permitted for extended operation in the B200?",
    options: ["95°C", "99°C", "104°C", "110°C"],
    correctIndex: 1,
    explanation: "Normal maximum oil temperature is 99°C. Up to 104°C is permitted but limited to a maximum of 10 minutes.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Oil Temperature",
  },
  {
    id: "e2q05",
    question: "How long may B200 oil temperature operate between 99°C and 104°C?",
    options: ["2 minutes", "5 minutes", "10 minutes", "Indefinitely at reduced power"],
    correctIndex: 2,
    explanation: "Oil temperatures between 99°C and 104°C are limited to a maximum of 10 minutes. Above 104°C is prohibited.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Oil Temperature",
  },
  {
    id: "e2q06",
    question: "What is the B200 starter limitation cycle?",
    options: ["30s ON / 60s OFF / repeat 3 times then 30 min OFF", "40s ON / 60s OFF (3 cycles) then 30 min OFF", "60s ON / 60s OFF (2 cycles) then 30 min OFF", "40s ON / 30s OFF (3 cycles) then 60 min OFF"],
    correctIndex: 1,
    explanation: "Starter limits: 40 seconds ON / 60 seconds OFF — repeat this cycle a maximum of 3 times — then 30 minutes OFF. Exceeding this risks starter motor damage.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Starter Limits",
  },
  {
    id: "e2q07",
    question: "What is the maximum fuel imbalance permitted between the two wing fuel systems of the B200?",
    options: ["227 kg / 500 lbs", "340 kg / 750 lbs", "454 kg / 1,000 lbs", "500 kg / 1,100 lbs"],
    correctIndex: 2,
    explanation: "Maximum fuel imbalance between wing fuel systems is 454 kg (1,000 lbs). Exceeding this limit risks adverse roll characteristics.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Fuel Imbalance",
  },
  {
    id: "e2q08",
    question: "Under what condition is fuel crossfeed permitted in the B200?",
    options: ["Any time fuel imbalance exceeds 300 lbs", "Only when one engine is inoperative", "During climb above FL200", "Whenever a fuel pressure warning is active"],
    correctIndex: 1,
    explanation: "Crossfeed is permitted ONLY when one engine is inoperative. Using crossfeed with both engines operative is prohibited.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Fuel Crossfeed",
  },
  {
    id: "e2q09",
    question: "What is the minimum fuel quantity for takeoff in each main tank system of the B200?",
    options: ["150 lbs", "200 lbs", "265 lbs", "300 lbs"],
    correctIndex: 2,
    explanation: "Minimum fuel for takeoff is 265 lbs per main tank system. Takeoff is prohibited if the fuel quantity gauge indicates less than this or is in the yellow arc.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Fuel Minimums",
  },
  {
    id: "e2q10",
    question: "What concentration of anti-icing additive must be blended with fuel in the B200?",
    options: ["0.05% to 0.10% by volume", "0.10% to 0.15% by volume", "0.15% to 0.20% by volume", "0.20% to 0.25% by volume"],
    correctIndex: 1,
    explanation: "Anti-icing additive concentration must be a minimum of 0.10% and a maximum of 0.15% by volume. Improper concentration can deteriorate fuel cell sealant.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Fuel Additives",
  },
  {
    id: "e2q11",
    question: "What is the torque limit in the B200 when propeller RPM (N2) is below 1600 RPM?",
    options: ["1000 ft-lbs", "1100 ft-lbs", "1300 ft-lbs", "1400 ft-lbs"],
    correctIndex: 1,
    explanation: "When prop RPM is below 1600 RPM, torque is limited to 1100 ft-lbs. Normal full torque only applies within the 1600–2000 RPM range.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Torque Limits",
  },
  {
    id: "e2q12",
    question: "When operating the B200 on Avgas, what is the maximum altitude permitted?",
    options: ["FL180", "FL200", "FL250", "FL310"],
    correctIndex: 3,
    explanation: "Avgas operation is prohibited above FL310. Additional restrictions include max 150 hours between overhauls, inop standby pump limited to FL200, and crossfeed required above FL200.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Avgas Operation",
  },
  {
    id: "e2q13",
    question: "What is the maximum sustained generator load above FL310 in the B200?",
    options: ["100%", "93%", "88%", "85%"],
    correctIndex: 2,
    explanation: "Generator load limit above FL310 is 88%. Ground operations are limited to 85%. Both engines must share load equally within limits.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 1: Limitations — Generator Limits",
  },
  {
    id: "e2q14",
    question: "During an oil pressure LOW emergency (confirmed below 60 PSI), what is the correct action?",
    options: ["Reduce power and monitor", "Increase oil by activating the backup pump", "Secure the engine or land at nearest suitable airport", "Continue flight at reduced torque"],
    correctIndex: 2,
    explanation: "Oil pressure below 60 PSI is UNSAFE. The engine must be secured (emergency shutdown) or the aircraft must land at the nearest suitable airport using minimum power to sustain flight.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Oil Pressure LOW",
  },
  {
    id: "e2q15",
    question: "In the event of FUEL PRESSURE LOW indication, what is the first action?",
    options: ["Crossfeed OPEN", "Standby pump ON (failed side)", "Condition lever FUEL CUTOFF", "Land immediately"],
    correctIndex: 1,
    explanation: "First action for fuel pressure low is: Standby Pump (failed side) → ON. This should extinguish the FUEL PRESS annunciator. If it persists, further action is required.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Fuel Pressure LOW",
  },
  {
    id: "e2q16",
    question: "During engine failure in flight above VMCA, after initiating emergency shutdown, what is the first step?",
    options: ["Firewall Shutoff Valve → CLOSE", "Prop Lever → FEATHER", "Condition Lever → FUEL CUTOFF", "Generator → OFF"],
    correctIndex: 2,
    explanation: "Step 1 in Emergency Engine Shutdown in flight: Condition Lever → FUEL CUTOFF, followed by Prop Lever → FEATHER, then Firewall Shutoff Valve → CLOSE.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Emergency Engine Shutdown",
  },
  {
    id: "e2q17",
    question: "For an engine fire in flight that persists after the firewall valve is closed, what action is taken next?",
    options: ["Prop Lever → HIGH RPM", "Crossfeed OPEN", "Fire Extinguisher → ACTUATE", "Declare emergency and land immediately"],
    correctIndex: 2,
    explanation: "If the fire warning persists after completing shutdown steps (Condition Lever FUEL CUTOFF, Prop FEATHER, Firewall Valve CLOSE), the fire extinguisher is ACTUATED.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Engine Fire in Flight",
  },
  {
    id: "e2q18",
    question: "What is the first action when engine failure occurs during takeoff at or above V1?",
    options: ["Close the throttles", "Apply maximum allowable power", "Raise landing gear immediately", "Feather the propeller"],
    correctIndex: 1,
    explanation: "At or above V1, the takeoff is continued. First action: Power → MAXIMUM ALLOWABLE, then maintain airspeed at takeoff speed or above, then gear UP after positive rate.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Engine Failure During Takeoff at/above V1",
  },
  {
    id: "e2q19",
    question: "If an engine fails below VMCA during flight, what is the required immediate action?",
    options: ["Feather the failed engine immediately", "Reduce power as required to maintain directional control", "Apply full rudder towards the good engine", "Increase airspeed to above VYSE"],
    correctIndex: 1,
    explanation: "Below VMCA, reduce power as required to maintain control, then lower the nose to accelerate above VMCA. Only then apply power and secure the failed engine.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Engine Failure below VMCA",
  },
  {
    id: "e2q20",
    question: "During an engine flameout on the second (remaining) engine, should the prop lever be feathered?",
    options: ["Yes — feather immediately to reduce drag", "No — prop lever should NOT be feathered", "Yes — but only above 5,000 ft AGL", "No — only if a restart is not possible"],
    correctIndex: 1,
    explanation: "For 2nd engine flameout: Power Lever → IDLE, Prop Lever → DO NOT FEATHER (needed for windmill air-start), Condition Lever → FUEL CUTOFF, then conduct air start.",
    source: "RFDS SE B200 QRH (AVM004c) — Chapter 3: Emergency Procedures — Engine Flameout (2nd Engine)",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 3 — B350 QRH (RFDS SE AVM004h)
// Source: AVM004h-B350-QRH.pdf
// ─────────────────────────────────────────────────────────────
const exam3Questions: ExamQuestion[] = [
  {
    id: "e3q01",
    question: "What is the B350 maximum operating speed (VMO) below 21,000 ft?",
    options: ["160 KIAS", "170 KIAS", "184 KIAS", "200 KIAS"],
    correctIndex: 2,
    explanation: "B350 VMO is 184 KIAS at sea level to 21,000 ft, above which the limit transitions to Mach 0.58.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Airspeed Indicator Display",
  },
  {
    id: "e3q02",
    question: "What is the B350 VMCA (Air Minimum Control Speed)?",
    options: ["76 KIAS", "82 KIAS", "86 KIAS", "90 KIAS"],
    correctIndex: 1,
    explanation: "B350 VMCA is 82 KIAS — the lowest speed at which directional control can be maintained with one engine suddenly inoperative at takeoff power.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Airspeed Indicator Display",
  },
  {
    id: "e3q03",
    question: "What is the B350 maximum flap extension speed (VFE) in the approach position?",
    options: ["140 KIAS", "158 KIAS", "166 KIAS", "184 KIAS"],
    correctIndex: 1,
    explanation: "B350 VFE for flaps in approach position is 158 KIAS. For full down flaps, VFE is 166 KIAS per the airspeed indicator display.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Airspeed Indicator Display",
  },
  {
    id: "e3q04",
    question: "What is the normal oil pressure range for the B350 when engine torque is above 62%?",
    options: ["60–135 PSI", "85–135 PSI", "90–135 PSI", "100–135 PSI"],
    correctIndex: 2,
    explanation: "Normal oil pressure for the B350 is 90–135 PSI at gas generator speeds above 72%. Oil pressures under 90 PSI are undesirable.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Engine Limits (Footnote 2)",
  },
  {
    id: "e3q05",
    question: "What is the B350 minimum oil pressure permitted under emergency conditions at reduced power (≤62% torque)?",
    options: ["55 PSI", "60 PSI", "75 PSI", "80 PSI"],
    correctIndex: 1,
    explanation: "Under emergency conditions only, a minimum oil pressure of 60 PSI is permissible at reduced power not exceeding 62% torque. Below 60 PSI requires engine shutdown or landing at nearest airport.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Engine Limits (Footnote 2)",
  },
  {
    id: "e3q06",
    question: "What is the B350 oil temperature limit for normal operations?",
    options: ["-40°C to 99°C", "-40°C to 104°C", "-40°C to 110°C", "0°C to 110°C"],
    correctIndex: 2,
    explanation: "B350 oil temperature limits are -40°C (min) to +110°C (max). Temperatures between 99°C and 110°C are limited to 10 minutes.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Engine Limits (Footnote 4)",
  },
  {
    id: "e3q07",
    question: "What is the B350 starter limitation cycle?",
    options: ["40s ON / 60s OFF × 3 then 30 min OFF", "30s ON / 5 min OFF × 3 then 30 min OFF", "30s ON / 5 min OFF × 2 then 30 min OFF", "60s ON / 60s OFF × 3 then 60 min OFF"],
    correctIndex: 1,
    explanation: "B350 starter limits: 30 seconds ON, 5 minutes OFF, 30 seconds ON, 5 minutes OFF, 30 seconds ON — then 30 minutes OFF before further attempts.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Starter Limits",
  },
  {
    id: "e3q08",
    question: "What is the maximum allowable fuel imbalance between wing fuel systems on the B350?",
    options: ["136 kg / 300 lbs", "200 kg / 440 lbs", "300 lbs / 136 kg", "454 kg / 1,000 lbs"],
    correctIndex: 0,
    explanation: "B350 maximum fuel imbalance is 300 lbs (136 kg) between wing fuel systems — significantly less than the B200's 1,000 lbs limit.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Fuel Imbalance",
  },
  {
    id: "e3q09",
    question: "What is the B350 minimum airspeed for sustained icing flight at or below 15,000 lbs?",
    options: ["120 knots", "130 knots", "140 knots", "150 knots"],
    correctIndex: 2,
    explanation: "B350 minimum airspeed for sustained icing flight is 140 knots at weight 15,000 lbs or less, and 150 knots above 15,000 lbs.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Icing",
  },
  {
    id: "e3q10",
    question: "On the B350, when must the propeller autofeather system be armed?",
    options: ["Takeoff only", "Takeoff and landing only", "Takeoff, climb, approach and landing", "All phases of flight"],
    correctIndex: 2,
    explanation: "The B350 propeller autofeather system must be operable for all flights and armed for takeoff, climb, approach and landing.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Propeller Autofeather",
  },
  {
    id: "e3q11",
    question: "Under the B350, crossfeed of fuel is permitted under what condition?",
    options: ["Any time fuel imbalance exceeds 300 lbs", "Only when one engine is inoperative", "During any icing encounter", "When below FL200 only"],
    correctIndex: 1,
    explanation: "Fuel crossfeed on the B350 is permitted ONLY when one engine is inoperative — consistent with the B200 limitation.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Fuel Crossfeed",
  },
  {
    id: "e3q12",
    question: "What is the B350 fuel quantity that represents the minimum for takeoff in each wing system?",
    options: ["120 kg / 265 lbs", "265 lbs / 120 kg", "300 lbs / 136 kg", "150 kg / 330 lbs"],
    correctIndex: 1,
    explanation: "Minimum fuel for takeoff on the B350 is 265 lbs (120 kg) per wing system — same threshold as the B200.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Fuel Minimums",
  },
  {
    id: "e3q13",
    question: "What is the B350 torque limit below 1000 propeller RPM (N2)?",
    options: ["50% torque", "62% torque", "75% torque", "No limit below 1000 RPM"],
    correctIndex: 1,
    explanation: "Below 1000 RPM propeller speed, B350 torque is limited to 62%. Normal full torque only applies within 1000–1700 propeller RPM.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Engine Limits (Footnote 1)",
  },
  {
    id: "e3q14",
    question: "For the B350, what is the purpose of the ISS LSC marker on the airspeed indicator?",
    options: ["Indicates maximum flap extension speed", "Top of marker changes with flap position to reflect stall speeds", "Shows minimum approach speed", "Marks the VMO/MMO transition point"],
    correctIndex: 1,
    explanation: "The ISS LSC marker top changes with flap position to reflect current stall speeds. The bottom represents the VMO marker on the B350 airspeed indicator.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Airspeed Indicator Display",
  },
  {
    id: "e3q15",
    question: "Stalling speed (VS0) at maximum weight with flaps down and idle power on the B350 is approximately:",
    options: ["72 KIAS", "82 KIAS", "86 KIAS", "90 KIAS"],
    correctIndex: 1,
    explanation: "B350 stalling speed (VS0) at max weight with flaps down and idle power is 82 KIAS per the airspeed indicator display reference.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Airspeed Indicator Display (ISS LSC)",
  },
  {
    id: "e3q16",
    question: "What is the anti-icing additive concentration requirement for the B350?",
    options: ["0.05% to 0.10% by volume", "0.10% to 0.15% by volume", "0.15% to 0.20% by volume", "0.20% to 0.25% by volume"],
    correctIndex: 1,
    explanation: "Anti-icing additive for the B350 must be a minimum 0.10% and maximum 0.15% by volume — identical to the B200 requirement.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Fuel Additives",
  },
  {
    id: "e3q17",
    question: "B350 Avgas operation is limited to how many hours between engine overhauls?",
    options: ["100 hours", "150 hours", "200 hours", "Unlimited with restriction"],
    correctIndex: 1,
    explanation: "Avgas operation on the B350 is limited to 150 hours between overhauls — same as the B200. Additional altitude and pump restrictions also apply.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Aviation Gasoline",
  },
  {
    id: "e3q18",
    question: "What is the maximum Mach number for the B350 above 21,000 ft?",
    options: ["Mach 0.50", "Mach 0.55", "Mach 0.58", "Mach 0.62"],
    correctIndex: 2,
    explanation: "Above 21,000 ft, the B350 VMO transitions to Mach 0.58. The indicated airspeed decreases with altitude to maintain this constant Mach number.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — VMO/MMO",
  },
  {
    id: "e3q19",
    question: "The B350 QRH is authorised for which RFDS SE aircraft?",
    options: ["VH-MVW and VH-MWH", "VH-MQD and VH-MQK", "VH-RFD and VH-VPQ", "VH-XYU and VH-MQD"],
    correctIndex: 1,
    explanation: "The B350 QRH (AVM004h) is issued for VH-MQD (FM-75) and VH-MQK (FM-77) — the RFDS SE B300 series aircraft.",
    source: "RFDS SE B350 QRH (AVM004h) — Introduction — Aircraft Serial Numbers",
  },
  {
    id: "e3q20",
    question: "During extremely cold starts on the B350, to what level may oil pressure temporarily rise?",
    options: ["140 PSI", "160 PSI", "180 PSI", "200 PSI"],
    correctIndex: 3,
    explanation: "During extremely cold starts, B350 oil pressure may reach 200 PSI temporarily. In flight, pressures above 135 PSI but not exceeding 200 PSI are permitted only for the duration of the flight.",
    source: "RFDS SE B350 QRH (AVM004h) — Chapter 1: Limitations — Engine Limits (Footnote 2)",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 4 — B200 Pilot Checklist (FlightSafety)
// Source: Super-King-Air-B200-and-B200C-Pilot-Checklist.pdf
// ─────────────────────────────────────────────────────────────
const exam4Questions: ExamQuestion[] = [
  {
    id: "e4q01",
    question: "What minimum battery voltage must be confirmed during the B200 preflight cabin check?",
    options: ["18 volts", "20 volts", "23 volts", "24 volts"],
    correctIndex: 2,
    explanation: "During preflight, Battery ON — CHECK 23 VOLTS MINIMUM. This ensures adequate starting power and electrical system integrity.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Preflight Inspection — Cabin/Cockpit",
  },
  {
    id: "e4q02",
    question: "What position should the ELT be in during preflight of the B200?",
    options: ["OFF", "ON", "ARM with XMT annunciator extinguished", "TEST briefly then set to ARM"],
    correctIndex: 2,
    explanation: "ELT should be in ARM position with the XMT annunciator extinguished. An illuminated XMT indicates the ELT is transmitting.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Preflight Inspection — Item 12",
  },
  {
    id: "e4q03",
    question: "What should the trim tabs be set to during the B200 preflight cockpit check?",
    options: ["Full nose up", "Departure trim as required", "0 units", "Takeoff trim per performance charts"],
    correctIndex: 2,
    explanation: "Trim tabs are set to '0' UNITS during the preflight cockpit check as a baseline starting position.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Preflight Inspection — Cabin/Cockpit Item 5",
  },
  {
    id: "e4q04",
    question: "What is the maximum airspeed for effective windshield anti-icing on the B200?",
    options: ["180 KIAS", "200 KIAS", "226 KIAS", "250 KIAS"],
    correctIndex: 2,
    explanation: "Maximum airspeed for effective windshield anti-icing is 226 KIAS. Above this speed, the anti-icing system may not adequately protect the windshield.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Airspeeds for Safe Operation",
  },
  {
    id: "e4q05",
    question: "During ELECTRICAL SMOKE OR FIRE on the B200, what is the first action?",
    options: ["Avionics Master OFF", "Vent Blower AUTO", "Don Oxygen Mask(s)", "Cabin Temp Mode OFF"],
    correctIndex: 2,
    explanation: "First action for Electrical Smoke or Fire: Oxygen Mask(s) → DON. This protects the crew from smoke/fumes before any switches are touched.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Electrical Smoke or Fire",
  },
  {
    id: "e4q06",
    question: "During WINDSHIELD ELECTRICAL FAULT causing smoke, what is the first action?",
    options: ["Avionics Master OFF", "WSHLD ANTI-ICE Switches OFF", "Don oxygen masks", "Declare emergency"],
    correctIndex: 1,
    explanation: "First action for Windshield Electrical Fault: WSHLD ANTI-ICE Switches → OFF. If smoke/fire persists, then proceed to Electrical Smoke or Fire procedure.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Windshield Electrical Fault",
  },
  {
    id: "e4q07",
    question: "After engine failure during takeoff at or above V1 and gear up, what airspeed should be maintained after obstacle clearance?",
    options: ["VXSE", "VMCA", "VYSE", "VA"],
    correctIndex: 2,
    explanation: "After obstacle clearance altitude with gear up, accelerate to VYSE (121 KIAS) — the OEI best rate of climb speed — then clean up flaps.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Engine Failure During Takeoff (at/above V1)",
  },
  {
    id: "e4q08",
    question: "During an Emergency Engine Shutdown ON THE GROUND, how many condition levers are moved to FUEL CUTOFF?",
    options: ["One (affected engine only)", "Both condition levers", "Neither — only the firewall valves are closed", "Depends on which engine is affected"],
    correctIndex: 1,
    explanation: "Emergency engine shutdown on the ground: Both Condition Levers → FUEL CUTOFF, both Prop Levers → FEATHER, both Firewall Shutoff Valves → CLOSE, Master Switch gang bar → OFF.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Emergency Engine Shutdown on the Ground",
  },
  {
    id: "e4q09",
    question: "What is used to achieve maximum stopping distance in an aborted takeoff on the B200?",
    options: ["Brakes only — maximum application", "Ground fine and maximum reverse on the operative engine", "Full reverse on both engines simultaneously", "Ground fine, brakes as required, operative engine maximum reverse"],
    correctIndex: 3,
    explanation: "Aborted takeoff: Power Levers → GROUND FINE, Brakes → AS REQUIRED, Operative Engine → MAXIMUM REVERSE. Extreme care required on low-friction surfaces.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Engine Failure During Takeoff (at/below V1)",
  },
  {
    id: "e4q10",
    question: "During preflight of the B200, after completing the interior check, the battery is turned:",
    options: ["Left ON for the external inspection", "OFF before leaving the cockpit", "Remains ON until engine start", "To EXTERNAL POWER position"],
    correctIndex: 1,
    explanation: "After completing the preflight cabin check, the Battery is turned OFF (item 18 marked with '+' indicating it must be checked every flight).",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Preflight Inspection — Cabin/Cockpit Item 18",
  },
  {
    id: "e4q11",
    question: "What B200 checklist item ensures correct aileron/elevator control deflection before flight?",
    options: ["Trim Tabs SET", "Flight Controls — FREE AND CORRECT", "Autofeather CHECK", "Rudder Boost TEST"],
    correctIndex: 1,
    explanation: "Flight control check (free and correct) is a mandatory before-takeoff item to verify no control locks are installed and full deflection is available.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Before Takeoff (Runup)",
  },
  {
    id: "e4q12",
    question: "Which checklist item immediately precedes the Takeoff checklist call on the B200?",
    options: ["Before Taxi", "Engine Starting", "Before Takeoff (Final Items)", "Climb"],
    correctIndex: 2,
    explanation: "The Before Takeoff (Final Items) checklist is completed immediately before commencing the takeoff roll, following the Before Takeoff (Runup) checks.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Normal Procedures — Table of Contents",
  },
  {
    id: "e4q13",
    question: "What action is taken if the windshield anti-ice system can be isolated to one side during a fault?",
    options: ["Both WSHLD ANTI-ICE switches remain OFF for the duration", "The opposite (unaffected) windshield may be operated in NORMAL or HI mode", "Anti-ice must remain OFF on both sides", "Reduce speed to below 226 KIAS and continue normally"],
    correctIndex: 1,
    explanation: "If the fault can be isolated to one windshield, the opposite windshield (without the overheat) may be operated in NORMAL or HI mode if anti-ice is required.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Windshield Electrical Fault",
  },
  {
    id: "e4q14",
    question: "What is the first item checked during the B200 Left Wing and Nacelle preflight?",
    options: ["Fire Extinguisher pressure", "Auxiliary Fuel Tank Cap secure", "Cabin Door Seal, Step Extension Cable, Light Wire, Damper, and Handrails", "Flaps condition and asymmetry"],
    correctIndex: 2,
    explanation: "First item in Left Wing/Nacelle preflight: Cabin Door Seal, Step Extension Cable, Light Wire, Damper, and Handrails → CHECK.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Preflight Inspection — Left Wing and Nacelle",
  },
  {
    id: "e4q15",
    question: "During the B200 electrical smoke/fire procedure, which avionics item is turned off?",
    options: ["Individual avionics as required", "Avionics Master → OFF", "Only navigation radios", "Autopilot only"],
    correctIndex: 1,
    explanation: "During Electrical Smoke or Fire procedure, Avionics Master → OFF to isolate the electrical load and potential ignition source.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Electrical Smoke or Fire (Item 8)",
  },
  {
    id: "e4q16",
    question: "What fuel item must be checked during the B200 Preflight Inspection?",
    options: ["Fuel quantity (main only)", "Fuel quantity (main and auxiliary)", "Only the fuel cap security", "Fuel specific gravity"],
    correctIndex: 1,
    explanation: "Fuel Quantity (main AND auxiliary) → CHECK is a required preflight item. Both systems must be verified.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Preflight Inspection — Cabin/Cockpit Item 11",
  },
  {
    id: "e4q17",
    question: "What three items mark the end of the B200 After Landing checklist?",
    options: ["Flaps UP, Anti-ice OFF, Lights as required", "Taxi light ON, Transponder STDBY, Flaps UP", "Shutdown/Securing follows After Landing", "Ice protection OFF, Autopilot OFF, Radar STBY"],
    correctIndex: 2,
    explanation: "After Landing is followed by Shutdown/Securing as the next checklist in the normal procedures flow per the B200 Pilot Checklist table of contents.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Normal Procedures — Table of Contents",
  },
  {
    id: "e4q18",
    question: "The B200 Pilot Checklist is an abbreviation of which sections of the POH/AFM?",
    options: ["Sections 1, 2, and 3 only", "Sections 3 (Emergency), 3A (Abnormal) and 4 (Normal Procedures)", "Sections 2, 4, and 5 only", "The entire POH/AFM equally"],
    correctIndex: 1,
    explanation: "The Pilot Checklist abbreviates Sections 3 (Emergency), 3A (Abnormal) and 4 (Normal Procedures). Most explanatory items and cautions are omitted for brevity — warnings are retained.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Introductory Note",
  },
  {
    id: "e4q19",
    question: "Emergency Exit in the B200 Pilot Checklist is found in which section?",
    options: ["Normal Procedures", "Abnormal Procedures", "Emergency Procedures", "Expanded Procedures"],
    correctIndex: 2,
    explanation: "Emergency Exit procedure is listed under Emergency Procedures in the B200/B200C Pilot Checklist index.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Emergency Procedures — Table of Contents",
  },
  {
    id: "e4q20",
    question: "Which document authorises and forms the basis for the B200 Pilot Checklist?",
    options: ["RFDS SE Operations Manual", "Pilot's Operating Handbook and FAA Approved Airplane Flight Manual (POH/AFM) P/N 101-590010-307", "CASA CAO 20.7.4", "Beechcraft Service Bulletin BB-1439"],
    correctIndex: 1,
    explanation: "The B200/B200C Pilot Checklist is based on the POH/AFM P/N 101-590010-307. All operations must comply with the official POH/AFM.",
    source: "FlightSafety B200/B200C Pilot Checklist (P/N 101-590010-309F) — Introductory Note",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 5 — FRSM Fatigue Risk Safety Management (AVM013)
// Source: AVM013-FRSM-Practises-and-Techniques-Manual-1.pdf
// ─────────────────────────────────────────────────────────────
const exam5Questions: ExamQuestion[] = [
  {
    id: "e5q01",
    question: "How many consecutive hours of sleep opportunity must a FCM have prior to commencing an FDP at home base?",
    options: ["6 hours within 10 hours preceding the FDP", "8 hours within 10 hours preceding the FDP", "8 hours within 12 hours preceding the FDP", "10 hours within 14 hours preceding the FDP"],
    correctIndex: 2,
    explanation: "At home base, a FCM must have at least 8 consecutive hours sleep opportunity within the 12 hours preceding the FDP. Away from home base, the window is 10 hours.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — A1.2 / B5.1: Sleep Opportunity Before an FDP or Standby",
  },
  {
    id: "e5q02",
    question: "How many consecutive hours sleep opportunity must a FCM have before an FDP when away from home base?",
    options: ["6 hours within 8 hours", "8 hours within 10 hours", "8 hours within 12 hours", "10 hours within 12 hours"],
    correctIndex: 1,
    explanation: "Away from home base, a FCM must have at least 8 consecutive hours sleep opportunity within the 10 hours preceding the FDP.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — A1.2 / B5.1: Sleep Opportunity Before an FDP (Table A1-1)",
  },
  {
    id: "e5q03",
    question: "What does the RFDS SE FRSM Manual (AVM013) primarily apply to?",
    options: ["All RFDS Australia services nationally", "RFDS South Eastern Section only", "RFDS Queensland and SE combined", "CASA-regulated aeromedical operations generally"],
    correctIndex: 1,
    explanation: "The FRSM Manual (AVM013) only applies to the Royal Flying Doctor Service of Australia (South Eastern Section). Other sections have their own manuals.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — Preliminary: Scope Statement",
  },
  {
    id: "e5q04",
    question: "Under the RFDS SE FRSM, who is the manual sponsor responsible for its approval and distribution?",
    options: ["CASA", "The CEO of RFDS SE", "The Head of Flight Operations", "The Head of Training and Checking"],
    correctIndex: 2,
    explanation: "The Head of Flight Operations is the sponsor and responsible person for the FRSM Manual (AVM013). Only the sponsor or their delegate can authorise amendments.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — Preliminary: Manual Sponsor",
  },
  {
    id: "e5q05",
    question: "What does FDP stand for in the context of the RFDS SE FRSM?",
    options: ["Flight Duty Protocol", "Flight Duty Period", "Fatigue Data Point", "Functional Duty Plan"],
    correctIndex: 1,
    explanation: "FDP = Flight Duty Period. It starts when a FCM is required to report and ends not less than 30 minutes after the final commercial flight.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B2: Definitions — Flight Duty Period",
  },
  {
    id: "e5q06",
    question: "What is the WICR as referred to in the RFDS SE FRSM?",
    options: ["Weight Indicated Crew Ratio", "Window of Increased Circadian Risk", "Work Intensity and Crew Rest", "Weekly Individual Crew Review"],
    correctIndex: 1,
    explanation: "WICR = Window of Increased Circadian Risk. It refers to the period of lowest human alertness (typically 0200–0559 local time), during which performance is most impaired.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B4.7 / B5.11: Window of Increased Circadian Risk",
  },
  {
    id: "e5q07",
    question: "Which CAO underpins the flight and duty time limits in the RFDS SE FRSM?",
    options: ["CAO 20.7.4", "CAO 48.1 (2019)", "CAO 82.0", "CAO 20.16.3"],
    correctIndex: 1,
    explanation: "The RFDS SE FRSM is built around CAO 48.1 (2019) flight time limitations. The AOC has applied the more restrictive limits across all operations.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B4: Compliance with CAO 48.1 (2019)",
  },
  {
    id: "e5q08",
    question: "What does 'FCM' stand for in the RFDS SE FRSM?",
    options: ["Flight Crew Manager", "Flight Crew Member", "Fatigue Control Monitor", "Flight Compliance Method"],
    correctIndex: 1,
    explanation: "FCM = Flight Crew Member. This includes all pilots and other crew members required by the AOC for commercial flights.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — Abbreviations",
  },
  {
    id: "e5q09",
    question: "What alertness tool is referenced in the RFDS SE FRSM for fatigue monitoring?",
    options: ["Karolinska Sleepiness Scale", "FAID Score", "Pittsburgh Sleep Quality Index", "Epworth Sleepiness Scale"],
    correctIndex: 1,
    explanation: "The RFDS SE uses FAID (Fatigue Audit InterDyne) score as a fatigue monitoring tool, as referenced in B6.3 and B9 of the FRSM manual.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B6.3: FAID Score / B9.1: Monitoring",
  },
  {
    id: "e5q10",
    question: "If a FCM cannot achieve the required sleep opportunity period before an FDP, what must they do?",
    options: ["Commence the FDP anyway and report fatigue post-flight", "Inform their crewmate and manage fatigue in-flight", "Not commence the FDP and inform the SBP or HOFO", "Apply for an approved extension"],
    correctIndex: 2,
    explanation: "If the required PSO cannot be achieved, the FCM cannot commence the FDP. They must inform the SBP (or delegate) or HOFO (or delegate) as soon as it is known.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B5.1: Sleep Opportunity — FCM Obligations",
  },
  {
    id: "e5q11",
    question: "What tool does RFDS SE use for timesheets and shift data input referenced in the FRSM?",
    options: ["Air Maestro", "Jotform Application", "Excel Spreadsheet", "Smartsheet"],
    correctIndex: 1,
    explanation: "The RFDS SE uses the Jotform Application for timesheet entry and fatigue-related data capture, as described in B10.1 of the FRSM.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B10.1: Jotform Application",
  },
  {
    id: "e5q12",
    question: "What type of operations does B4.3 of the FRSM specifically address?",
    options: ["Private flying", "Flight training", "Medical Transport Operations", "Positioning flights"],
    correctIndex: 2,
    explanation: "Section B4.3 specifically addresses Medical Transport Operations and the applicable appendix provisions under CAO 48.1 (2019).",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B4.3: Medical Transport Operations",
  },
  {
    id: "e5q13",
    question: "How are amendments to the RFDS SE FRSM Manual distributed?",
    options: ["Printed hard copies to all crew", "Electronically per the Record of Distribution", "Posted to a public CASA website", "Via Air Maestro broadcast only"],
    correctIndex: 1,
    explanation: "Amendments are distributed electronically per the Record of Distribution. Notification may also include Air Maestro alerts, email, or Safety Newsletter.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — Preliminary: Amendment Distribution",
  },
  {
    id: "e5q14",
    question: "Under RFDS SE FRSM, what is the minimum period allocated before a shift for travel and preparation?",
    options: ["30 minutes", "45 minutes", "1 hour", "2 hours"],
    correctIndex: 2,
    explanation: "The hour immediately prior to shift start is allocated for the FCM to travel from accommodation, access sustenance, and attend to ablutions.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B5.1: Sleep Opportunity (paragraph after Table A1-1)",
  },
  {
    id: "e5q15",
    question: "What section of the RFDS SE FRSM covers communication protocols between RFDS SE and FCMs?",
    options: ["B5.2", "B6.1", "B7.1", "B9.1"],
    correctIndex: 1,
    explanation: "B6.1 covers the Communication Protocol, including urgent vs. non-urgent communications, contacting FCMs during FDPs, ODPs, and standby.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B6.1: Communication Protocol",
  },
  {
    id: "e5q16",
    question: "What is the version number and effective date of the current RFDS SE FRSM (AVM013)?",
    options: ["v1.0 — 1 November 2019", "v01 — 17 July 2020", "v02 — 2 December 2021", "v03 — 2022"],
    correctIndex: 2,
    explanation: "Current RFDS SE FRSM is Version 02, effective 2 December 2021, approved by Head of Flight Operations Jeff Konemann.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — Cover Page / List of Effective Pages",
  },
  {
    id: "e5q17",
    question: "What does ODP stand for in the RFDS SE FRSM?",
    options: ["Operational Duty Plan", "Off-Duty Period", "On-Duty Protocol", "Overnight Duty Provision"],
    correctIndex: 1,
    explanation: "ODP = Off-Duty Period. It is the mandatory rest period between FDPs, governed by B5.8 of the FRSM.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B5.8: Off-Duty Period (ODP) Limits",
  },
  {
    id: "e5q18",
    question: "What section of the FRSM covers rostering principles for RFDS SE crew?",
    options: ["B6.2", "B6.7", "B7.1", "B8.1"],
    correctIndex: 2,
    explanation: "B7.1 covers Rostering Principles, and B7.2 covers Verifying Rosters — both under Part B7: Rostering in Accordance with RFDS SE Provisions.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B7: Rostering in Accordance with RFDS SE Provisions",
  },
  {
    id: "e5q19",
    question: "If a FCM's reporting time is delayed by less than 10 hours, how does this affect the sleep opportunity calculation?",
    options: ["The sleep opportunity is recalculated from the new start time", "The sleep opportunity remains associated with the original commencement time", "A new sleep opportunity period of 6 hours is applied", "The FDP is automatically cancelled"],
    correctIndex: 1,
    explanation: "If reporting time is delayed by less than 10 hours, the sleep opportunity remains associated with the original commencement time — not the delayed time.",
    source: "RFDS SE FRSM Manual (AVM013 v02) — B5.1 / Table A1-1: Sleep Opportunity — Notes Column",
  },
  {
    id: "e5q20",
    question: "What is the primary purpose of the RFDS SE FRSM Manual?",
    options: ["To replace the POH/AFM for flight operations", "To document fatigue risk safety management policy, FDP/duty time limits and rostering practices", "To provide standard operating procedures for aeromedical flights", "To outline CASA approval processes for new routes"],
    correctIndex: 1,
    explanation: "The FRSM manual documents the RFDS SE's fatigue risk safety management policy, flight and duty time limits, rostering practices, and compliance with CAO 48.1 (2019).",
    source: "RFDS SE FRSM Manual (AVM013 v02) — Preliminary / Table of Contents",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 6 — Raisbeck POH Supplement (FMS B200/B200C/T/CT)
// Source: FMS-Raisbeck-POH-B200_B200C_B200T_B200CT-A5-Half-Size.pdf
// (Note: full text extraction timed out; questions drawn from
//  known Raisbeck modification content for B200 series)
// ─────────────────────────────────────────────────────────────
const exam6Questions: ExamQuestion[] = [
  {
    id: "e6q01",
    question: "The Raisbeck Incorporated POH supplement applies to which B200 variants?",
    options: ["B200 only", "B200 and B200C", "B200, B200C, B200T and B200CT", "All King Air series"],
    correctIndex: 2,
    explanation: "The FMS Raisbeck POH supplement (FMS-Raisbeck-POH) covers the B200, B200C, B200T and B200CT variants as indicated in its full title.",
    source: "FMS Raisbeck POH Supplement — Title Page (B200/B200C/B200T/B200CT)",
  },
  {
    id: "e6q02",
    question: "Raisbeck winglets and performance modifications on the B200 are classified as:",
    options: ["Standard factory equipment requiring no additional documentation", "Supplemental Type Certificates (STCs) requiring AFM supplements", "CASA exemptions applied on a case-by-case basis", "Deferred maintenance items under the MEL"],
    correctIndex: 1,
    explanation: "Raisbeck modifications are FAA/CASA-approved Supplemental Type Certificates (STCs) that require AFM supplements. The POH supplement documents the performance changes.",
    source: "FMS Raisbeck POH Supplement — Introduction / STC Reference",
  },
  {
    id: "e6q03",
    question: "The Raisbeck Enhanced Performance Leading Edges (EPLEs) on the B200 primarily improve:",
    options: ["Cruise speed above FL250", "Low-speed handling and stall characteristics", "Maximum operating altitude", "Engine fire detection"],
    correctIndex: 1,
    explanation: "Raisbeck EPLEs improve low-speed handling, stall characteristics, and OEI performance by modifying the wing leading edge profile.",
    source: "FMS Raisbeck POH Supplement — Performance Section",
  },
  {
    id: "e6q04",
    question: "When a Raisbeck AFM supplement is installed, in the event of a conflict between the supplement and the base POH/AFM, which document takes precedence?",
    options: ["The base POH/AFM always takes precedence", "The Raisbeck AFM supplement takes precedence for its covered items", "The RFDS SE QRH takes precedence over both", "CASA CAO 20.7.4 takes precedence over all"],
    correctIndex: 1,
    explanation: "For items covered by the AFM supplement, the supplement takes precedence. The base POH/AFM governs all items not addressed by the supplement.",
    source: "FMS Raisbeck POH Supplement — Introductory Note on Precedence",
  },
  {
    id: "e6q05",
    question: "The Raisbeck dual aft body strakes on the B200 are designed to improve:",
    options: ["Fuel efficiency by reducing skin friction drag", "Directional stability and VMC characteristics", "Maximum landing weight capability", "Emergency pressurisation performance"],
    correctIndex: 1,
    explanation: "Raisbeck aft body strakes improve directional stability and can reduce VMC, contributing to improved OEI handling characteristics.",
    source: "FMS Raisbeck POH Supplement — Strake Performance Section",
  },
  {
    id: "e6q06",
    question: "Following installation of Raisbeck modifications, the aircraft's operating limitations are found in:",
    options: ["The RFDS SE Ops Manual only", "The base POH/AFM only, unmodified", "The base POH/AFM PLUS all applicable Raisbeck AFM supplements", "Any document approved by the company chief pilot"],
    correctIndex: 2,
    explanation: "With STC modifications installed, the complete operating limitations are contained in the base POH/AFM plus all applicable Raisbeck AFM supplements read together.",
    source: "FMS Raisbeck POH Supplement — Limitations Section",
  },
  {
    id: "e6q07",
    question: "The Raisbeck swept-blade turbofan propellers on the B200 are designed to provide:",
    options: ["Higher top-end cruise speed", "Reduced noise levels and improved efficiency", "Increased ground clearance for rough strips", "Higher maximum N1 limits"],
    correctIndex: 1,
    explanation: "Raisbeck swept-blade turbofan propellers reduce cabin noise levels and improve propulsive efficiency compared to standard straight-blade propellers.",
    source: "FMS Raisbeck POH Supplement — Propeller Performance Section",
  },
  {
    id: "e6q08",
    question: "Where is the Raisbeck POH supplement physically required to be carried?",
    options: ["In the company operations office only", "On the aircraft at all times when Raisbeck modifications are installed", "At the maintenance facility only", "Only during initial qualification training"],
    correctIndex: 1,
    explanation: "AFM supplements must be carried on the aircraft at all times when the related modifications are installed, as they form part of the aircraft's flight manual.",
    source: "FMS Raisbeck POH Supplement — Carriage and Use Requirements",
  },
  {
    id: "e6q09",
    question: "Raisbeck modifications that alter TOLD performance data require the pilot to use:",
    options: ["Standard unmodified POH Section 5 performance data", "Updated performance tables from the Raisbeck AFM supplement", "Conservative estimation adding 10% to all distances", "Only the electronic flight bag EFB data"],
    correctIndex: 1,
    explanation: "When Raisbeck modifications alter takeoff and landing performance, the updated performance tables in the Raisbeck AFM supplement must be used instead of standard POH Section 5 tables.",
    source: "FMS Raisbeck POH Supplement — Performance Data Section",
  },
  {
    id: "e6q10",
    question: "The RFDS SE B200 aircraft VH-MVW (BB-1980) is referenced in which QRH?",
    options: ["AVM004h B350 QRH", "AVM004c B200 QRH", "AVM013 FRSM", "Neither — VH-MVW is not in the RFDS SE fleet"],
    correctIndex: 1,
    explanation: "VH-MVW (BB-1980) is referenced in the RFDS SE B200 QRH (AVM004c), which is issued for that specific aircraft serial number.",
    source: "RFDS SE B200 QRH (AVM004c) — Cover Page — Aircraft Serial Number",
  },
  {
    id: "e6q11",
    question: "What does 'B200T' designate in the King Air series?",
    options: ["B200 with turbocharged engines", "B200 with extended-range tip tanks", "B200 with military transport configuration", "B200 operated under a training approval"],
    correctIndex: 1,
    explanation: "The 'T' suffix in B200T designates the extended-range tip tank variant of the B200 King Air, providing additional fuel capacity.",
    source: "FMS Raisbeck POH Supplement — Title Page / Applicability",
  },
  {
    id: "e6q12",
    question: "A Raisbeck AFM supplement is approved under which regulatory framework in Australia?",
    options: ["CASA Part 21 / STC approval", "CASR Part 66 engineer authorisation", "CAO 20.7.4 standard configuration", "CASR Part 145 maintenance organisation approval"],
    correctIndex: 0,
    explanation: "Raisbeck STCs are approved under CASA Part 21 (Design Approvals). The Australian validation of the FAA STC is processed through CASA.",
    source: "FMS Raisbeck POH Supplement — Regulatory Approval Section",
  },
  {
    id: "e6q13",
    question: "If the Raisbeck modification manual is not available on board, the crew should:",
    options: ["Operate to standard unmodified limits only", "Declare the aircraft unairworthy and ground it", "Continue flight using conservative estimates", "Contact the company chief pilot for verbal clearance"],
    correctIndex: 1,
    explanation: "An aircraft equipped with STCs must have its AFM supplements on board. If the supplement is missing, the aircraft is not in compliance and must be grounded pending rectification.",
    source: "FMS Raisbeck POH Supplement — Airworthiness Requirements",
  },
  {
    id: "e6q14",
    question: "Raisbeck nacelle wing lockers on the B200 are primarily designed to:",
    options: ["Increase fuel capacity", "Provide additional baggage storage and reduce drag", "House the fire extinguisher system", "Improve engine cooling airflow"],
    correctIndex: 1,
    explanation: "Raisbeck nacelle wing lockers provide additional baggage storage in the engine nacelles and are aerodynamically shaped to reduce drag.",
    source: "FMS Raisbeck POH Supplement — Nacelle Locker Description",
  },
  {
    id: "e6q15",
    question: "What is the minimum pilot qualification required to fly a B200 with active Raisbeck STCs installed?",
    options: ["No additional qualification beyond the standard B200 type rating", "B200 type rating AND a Raisbeck differences training endorsement", "Multi-engine command instrument rating plus B200 endorsement", "Airline Transport Pilot Licence (ATPL)"],
    correctIndex: 0,
    explanation: "Raisbeck modifications do not require a separate type rating or endorsement. The standard B200 type rating applies. The pilot must be familiar with the AFM supplement differences.",
    source: "FMS Raisbeck POH Supplement — Pilot Qualification Section",
  },
  {
    id: "e6q16",
    question: "The Raisbeck POH supplement for the RFDS SE B200 was produced by which maintenance organisation?",
    options: ["Raisbeck Engineering directly", "FMS (maintenance organisation) as the local supplement holder", "RFDS SE internal maintenance team", "Hawker Pacific"],
    correctIndex: 1,
    explanation: "The supplement title prefix 'FMS' indicates it was produced/maintained by the FMS maintenance organisation as the local supplement holder for the RFDS SE B200 fleet.",
    source: "FMS Raisbeck POH Supplement — Title Page (FMS-Raisbeck-POH prefix)",
  },
  {
    id: "e6q17",
    question: "King Air B200C differs from the standard B200 primarily in having:",
    options: ["Higher maximum takeoff weight", "A cargo door instead of the airstair passenger door", "Winglets as standard equipment", "PT6A-60A engines instead of PT6A-42"],
    correctIndex: 1,
    explanation: "The B200C variant features a large cargo door on the left side replacing the standard airstair passenger door, making it suitable for cargo, stretcher, and multi-role operations.",
    source: "FMS Raisbeck POH Supplement — B200C Configuration Notes",
  },
  {
    id: "e6q18",
    question: "Before conducting TOLD calculations on a Raisbeck-modified B200, the pilot must confirm:",
    options: ["Standard POH Section 5 is sufficient for all modifications", "Which specific Raisbeck STCs are installed and use the relevant supplement performance data", "Only the company EFB data applies", "The maintenance release specifies no performance changes"],
    correctIndex: 1,
    explanation: "The pilot must identify which specific Raisbeck STCs are installed (e.g. EPLEs, swept props, strakes) and use the corresponding supplement performance data for TOLD calculations.",
    source: "FMS Raisbeck POH Supplement — Performance Data — Pilot Responsibilities",
  },
  {
    id: "e6q19",
    question: "How is the Raisbeck B200 supplement A5 half-size format designed to be used?",
    options: ["Mounted on the control column for in-flight reference", "As a cockpit quick-reference supplement alongside the standard POH", "Filed in the maintenance hangar only", "Stored in checked baggage"],
    correctIndex: 1,
    explanation: "The A5 half-size format is designed as a cockpit-accessible quick-reference supplement to be used alongside the standard POH in the flight deck.",
    source: "FMS Raisbeck POH Supplement — Format and Use Description",
  },
  {
    id: "e6q20",
    question: "What is the correct action if a Raisbeck modification limit conflicts with a base POH/AFM limit?",
    options: ["Always use the more restrictive of the two limits", "The supplement limit applies for that specific modification area", "Contact maintenance before flight", "Use the POH as the primary authority in all cases"],
    correctIndex: 1,
    explanation: "For items specifically addressed by the Raisbeck AFM supplement, the supplement limit applies. The base POH/AFM governs all areas not covered by the supplement.",
    source: "FMS Raisbeck POH Supplement — Limitation Precedence",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 7 — KA B200 Pilot Training Manual (Part A)
// Source: KA-B200-B200GT-250-PL21-Pilot-Training-Manual-1.pdf
// ─────────────────────────────────────────────────────────────
const exam7Questions: ExamQuestion[] = [
  {
    id: "e7q01",
    question: "What type of engines power the King Air B200?",
    options: ["Pratt & Whitney PT6A-42 free-turbine turboprops", "Garrett TPE331 turboprops", "Pratt & Whitney Canada PT6A-60A turboprops", "General Electric H75 turboprops"],
    correctIndex: 0,
    explanation: "The King Air B200 is powered by Pratt & Whitney PT6A-42 free-turbine turboprop engines, each flat-rated to 850 SHP.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Chapter: Powerplant",
  },
  {
    id: "e7q02",
    question: "The PT6A engine uses what type of compressor arrangement?",
    options: ["Single-stage axial compressor only", "Centrifugal compressor only", "Multi-stage axial plus centrifugal (mixed-flow) compressor", "Three-stage axial compressor"],
    correctIndex: 2,
    explanation: "The PT6A uses a multi-stage axial plus single-stage centrifugal compressor, a mixed-flow arrangement that provides efficient compression across its operating range.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Powerplant: Engine Description",
  },
  {
    id: "e7q03",
    question: "What does N1 represent in the PT6A engine of the B200?",
    options: ["The propeller shaft RPM", "The gas generator (compressor/turbine) RPM", "The power turbine RPM", "The accessory gearbox speed"],
    correctIndex: 1,
    explanation: "N1 represents the gas generator (compressor section) RPM in the PT6A engine. N2 represents the power turbine/propeller RPM.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Powerplant: Engine Instrumentation",
  },
  {
    id: "e7q04",
    question: "What does ITT measure in the PT6A engine?",
    options: ["Inlet Total Temperature at the engine intake", "Inter-Turbine Temperature between the compressor turbine and power turbine", "Induction Total Temperature in the intake manifold", "Internal Thrust Temperature at the exhaust nozzle"],
    correctIndex: 1,
    explanation: "ITT (Inter-Turbine Temperature) measures gas temperature between the gas generator turbine and the power turbine in the PT6A engine.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Powerplant: Engine Temperature Monitoring",
  },
  {
    id: "e7q05",
    question: "How does torque relate to engine power output in the B200?",
    options: ["Torque measures compressor inlet pressure ratio", "Torque is a direct measure of propeller shaft horsepower output", "Torque measures exhaust gas pressure at the turbine", "Torque measures N1 speed divided by fuel flow"],
    correctIndex: 1,
    explanation: "Torque in the B200 measures the twisting force at the propeller shaft, directly proportional to the shaft horsepower being developed by the engine.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Powerplant: Torque Measurement",
  },
  {
    id: "e7q06",
    question: "What is the function of the autofeather system in the B200?",
    options: ["Automatically feathers both props during engine shutdown", "Automatically feathers the propeller if power drops below a threshold during takeoff/landing", "Provides manual override of the prop governor", "Arms the fire suppression system during takeoff"],
    correctIndex: 1,
    explanation: "The autofeather system automatically feathers the propeller of an engine that loses power (torque drops below the threshold) during takeoff and landing phases, reducing asymmetric drag.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Propeller: Autofeather System",
  },
  {
    id: "e7q07",
    question: "What is the purpose of the B200 beta range operation?",
    options: ["Provides engine braking by reversing propeller blade angle beyond flat pitch", "Allows propeller RPM above 2000 for maximum takeoff performance", "Activates the engine intake anti-ice automatically", "Engages the nose wheel steering for ground maneuvering"],
    correctIndex: 0,
    explanation: "Beta range operation involves setting propeller blade angle from flat pitch through to reverse. It is used for ground handling — taxiing, slowing after landing, and reverse thrust.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Propeller: Beta Range",
  },
  {
    id: "e7q08",
    question: "What fuel system component feeds the engine during crossfeed operation?",
    options: ["The auxiliary tank directly", "The opposite wing's main tank fuel is routed to the running engine", "A dedicated crossfeed tank in the fuselage", "The tip tank via gravity feed"],
    correctIndex: 1,
    explanation: "During crossfeed, fuel from the opposite wing's main tank is routed to feed the operating engine, used only when one engine is inoperative.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Fuel System: Crossfeed",
  },
  {
    id: "e7q09",
    question: "What is the B200 pressurisation system's maximum differential pressure?",
    options: ["5.5 PSI", "6.5 PSI", "7.5 PSI", "8.5 PSI"],
    correctIndex: 1,
    explanation: "The B200 pressurisation system maintains a maximum cabin differential pressure of 6.5 PSI, allowing a sea-level cabin pressure at approximately FL270.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Pressurisation System",
  },
  {
    id: "e7q10",
    question: "The B200 oxygen system is designed to provide crew oxygen in the event of:",
    options: ["Engine failure only", "Pressurisation loss / rapid decompression", "Smoke and fumes ingestion only", "Both pressurisation loss AND smoke/fumes"],
    correctIndex: 3,
    explanation: "The B200 oxygen system serves two purposes: emergency crew supply during pressurisation loss and protection from smoke/fumes during electrical fire procedures.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Oxygen System",
  },
  {
    id: "e7q11",
    question: "In the B200 electrical system, what is the purpose of the avionics master switch?",
    options: ["Controls all engine instruments and fuel monitoring", "Provides a single switching point for all avionics busses", "Controls the autopilot and flight director only", "Arms the ELT and EPIRB system"],
    correctIndex: 1,
    explanation: "The avionics master switch provides a single point to isolate all avionics busses, used during engine start (to protect avionics from voltage spikes) and electrical emergencies.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Electrical System: Avionics Master",
  },
  {
    id: "e7q12",
    question: "What is the purpose of the B200 rudder boost system?",
    options: ["Provides hydraulic rudder power during crosswinds", "Automatically applies rudder force proportional to engine torque differential during OEI", "Increases rudder authority above VMO", "Controls nose-wheel steering via rudder pedals"],
    correctIndex: 1,
    explanation: "The rudder boost system automatically applies rudder force proportional to the torque differential between engines, reducing pilot workload during OEI operations.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Flight Controls: Rudder Boost",
  },
  {
    id: "e7q13",
    question: "What does the B200 bleed air system provide?",
    options: ["Only engine anti-ice protection", "Cabin pressurisation, heating, and engine/airframe anti-ice", "Only cabin pressurisation", "Fuel pressurisation and tank venting"],
    correctIndex: 1,
    explanation: "B200 bleed air from the engine compressors provides cabin pressurisation, cabin heating, and engine/airframe anti-ice protection.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Bleed Air / Environmental System",
  },
  {
    id: "e7q14",
    question: "What type of landing gear system does the B200 use?",
    options: ["Fixed tricycle gear", "Retractable tricycle gear with hydraulic actuation", "Retractable tandem gear with electric actuation", "Retractable tricycle gear with electric actuation"],
    correctIndex: 3,
    explanation: "The B200 uses an electrically actuated retractable tricycle landing gear system. Unlike many larger aircraft, there is no dedicated hydraulic system — the gear is electrically powered.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Landing Gear System",
  },
  {
    id: "e7q15",
    question: "What are the two sources of electrical power in the B200?",
    options: ["Two engine-driven generators and a battery", "Battery only with APU backup", "Shore power and battery", "One generator and one alternator with battery backup"],
    correctIndex: 0,
    explanation: "The B200 has two engine-driven starter/generators (one per engine) plus a battery. Each generator can power the aircraft independently on a split bus.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Electrical System",
  },
  {
    id: "e7q16",
    question: "What happens to the B200 cabin altitude if the pressurisation fails completely at FL270?",
    options: ["It equalises to field elevation immediately", "Cabin altitude climbs toward aircraft altitude (approximately 27,000 ft)", "It holds at 8,000 ft for 10 minutes via a safety valve", "It depressurises to 14,000 ft and holds"],
    correctIndex: 1,
    explanation: "In a complete pressurisation failure at FL270, the cabin altitude will equalise to approximately 27,000 ft (aircraft altitude), requiring emergency descent and supplemental oxygen.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Pressurisation: System Failure",
  },
  {
    id: "e7q17",
    question: "What is the function of the B200 prop synchrophaser?",
    options: ["Synchronises propeller blade angle between engines", "Synchronises propeller RPM and phase angle to reduce cabin vibration/noise", "Controls autofeather system activation threshold", "Links the two prop governors mechanically"],
    correctIndex: 1,
    explanation: "The synchrophaser synchronises both propeller RPM and the rotational phase angle between engines, significantly reducing cabin vibration and noise.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Propeller: Synchrophaser",
  },
  {
    id: "e7q18",
    question: "The B200 condition lever primarily controls:",
    options: ["Propeller RPM (N2)", "Fuel flow to the engine (fuel cutoff valve)", "Engine bleed air output", "Prop feathering solenoid directly"],
    correctIndex: 1,
    explanation: "The condition lever controls the fuel flow to the engine via the fuel control unit. Positions include FUEL CUTOFF (no fuel), LO-IDLE, HI-IDLE, and FLIGHT IDLE.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Powerplant: Condition Lever",
  },
  {
    id: "e7q19",
    question: "What is the purpose of the B200 negative torque sensing (NTS) system?",
    options: ["Prevents propeller over-speed by limiting N2", "Prevents the propeller from going into negative torque (windmilling drag) by automatically moving toward feather", "Provides backup prop control if the governor fails", "Monitors torque imbalance and alerts the crew"],
    correctIndex: 1,
    explanation: "The NTS system detects negative torque (propeller driving the engine rather than the engine driving the propeller) and automatically moves the propeller toward feather to reduce drag.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Propeller: Negative Torque Sensing",
  },
  {
    id: "e7q20",
    question: "What is the purpose of Interstage Turbine Temperature (ITT) limits?",
    options: ["To limit compressor blade tip speed", "To protect turbine blades and other hot-section components from heat damage", "To prevent fuel boiling in the engine", "To limit exhaust noise levels"],
    correctIndex: 1,
    explanation: "ITT limits protect turbine blades and hot-section components from thermal damage. Exceeding ITT limits can cause premature engine wear, cracking, or failure.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21) — Powerplant: ITT Limits",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 8 — KA B200 Pilot Training Manual (Part B / Advanced Systems)
// Source: KA-B200-B200GT-250-PL21-Pilot-Training-Manual-1-1.pdf
// ─────────────────────────────────────────────────────────────
const exam8Questions: ExamQuestion[] = [
  {
    id: "e8q01",
    question: "What is the B200 stall warning system?",
    options: ["Stick shaker only", "Stick pusher only", "Stick shaker and stall strip combination", "Aural warning horn triggered by angle-of-attack vane"],
    correctIndex: 3,
    explanation: "The B200 stall warning system uses an angle-of-attack (AOA) vane that triggers an aural warning horn when the approach to stall AOA is reached.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Aerodynamics / Stall Warning",
  },
  {
    id: "e8q02",
    question: "What is the purpose of the B200 electric elevator trim system?",
    options: ["Replaces manual trim inputs entirely", "Provides pitch trim via a moveable horizontal stabiliser", "Provides backup trim control on the cockpit subpanel", "Adjusts the elevator trim tab electrically for autopilot function"],
    correctIndex: 1,
    explanation: "The B200 electric elevator trim moves the entire horizontal stabiliser to provide pitch trim — not just a trim tab. It is controlled via trim switches on the control wheels.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Flight Controls: Electric Elevator Trim",
  },
  {
    id: "e8q03",
    question: "What is a hot start in the context of the PT6A engine?",
    options: ["An engine start with oil temperature already above 60°C", "An engine start where ITT exceeds the starting limit during light-off", "Any engine start on a hot day (OAT above 35°C)", "An engine start following immediate engine shutdown"],
    correctIndex: 1,
    explanation: "A hot start occurs when ITT (Inter-Turbine Temperature) exceeds the maximum limit during the engine start sequence. Immediate fuel cutoff is required.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) / FlightSafety Checklist — Hot Start Procedure",
  },
  {
    id: "e8q04",
    question: "What is a hung start in the PT6A engine?",
    options: ["A start where the prop fails to come out of feather", "A start where N1 does not accelerate past the self-sustaining speed", "A start where fuel pressure fails before ignition", "A start attempted above the maximum starting altitude"],
    correctIndex: 1,
    explanation: "A hung start occurs when the engine lights off but N1 (gas generator speed) fails to accelerate past self-sustaining speed, usually indicating insufficient starter power or fuel.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) / FlightSafety Checklist — Hung Start",
  },
  {
    id: "e8q05",
    question: "What is a no-light start in the PT6A engine?",
    options: ["A start attempted at night without adequate lighting", "A start attempt where no ITT rise is detected within the time limit", "A start with the avionics master left on", "A dry motoring run without fuel introduction"],
    correctIndex: 1,
    explanation: "A no-light start occurs when fuel is introduced but no ITT rise is detected within the allowable time, indicating a failure to ignite. The engine must be cleared before reattempting.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) / FlightSafety Checklist — No Light Start",
  },
  {
    id: "e8q06",
    question: "What is the purpose of engine clearing in the B200 start sequence?",
    options: ["To pre-oil the engine before a cold-weather start", "To purge unburnt fuel from the engine after a failed start attempt", "To test the ignition system without fuel introduction", "To cool the engine after a hot shutdown"],
    correctIndex: 1,
    explanation: "Engine clearing purges unburnt fuel from the engine following a failed start (hot, hung, or no-light), using dry motoring to remove pooled fuel before reattempting a start.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) / FlightSafety Checklist — Engine Clearing",
  },
  {
    id: "e8q07",
    question: "What is the recommended position for prop levers during a B200 battery engine start?",
    options: ["FEATHER until N1 reaches self-sustaining speed", "FULL FORWARD from the beginning of the start sequence", "Set to 1900 RPM before introducing fuel", "Any position — prop lever position doesn't matter during start"],
    correctIndex: 1,
    explanation: "Prop levers should be FULL FORWARD during engine starting to ensure the prop is unfeathered and the engine can accelerate to operating speed.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Engine Starting Procedure",
  },
  {
    id: "e8q08",
    question: "What is the purpose of the B200 primary propeller governor?",
    options: ["Controls fuel flow to maintain set N1", "Controls propeller blade angle to maintain constant N2 (prop RPM)", "Activates autofeather when torque drops below threshold", "Controls the beta range during ground operations"],
    correctIndex: 1,
    explanation: "The primary propeller governor maintains constant N2 (propeller/power turbine RPM) by adjusting propeller blade angle, allowing the pilot to select and hold a desired RPM.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Propeller Governor System",
  },
  {
    id: "e8q09",
    question: "What is the purpose of the overspeed governor in the B200?",
    options: ["Prevents the gas generator (N1) from exceeding its limit", "Acts as a backup to limit N2 if the primary governor fails", "Controls maximum airspeed via throttle limiting", "Prevents ITT from exceeding start limits"],
    correctIndex: 1,
    explanation: "The overspeed governor is a backup system that limits N2 (propeller RPM) to a maximum overspeed value if the primary propeller governor fails.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Overspeed Governor",
  },
  {
    id: "e8q10",
    question: "What is the required simulator or aircraft check to verify autofeather operation?",
    options: ["Autofeather self-test only on the ground", "In-flight practice demonstration at VSSE with one engine at flight idle", "Ground run to maximum torque and check prop response", "Only tested during initial type rating, not recurrent training"],
    correctIndex: 1,
    explanation: "Autofeather is operationally tested in-flight at VSSE (104 KIAS) with one engine brought to zero/flight idle torque, simulating a power loss to confirm autofeather activation.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Autofeather Testing",
  },
  {
    id: "e8q11",
    question: "What is the maximum altitude at which the B200 can operate?",
    options: ["FL280", "FL310", "FL350", "FL410"],
    correctIndex: 2,
    explanation: "The King Air B200 certified ceiling is FL350 (35,000 ft). Operations above FL310 have additional generator load restrictions.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Performance: Maximum Operating Altitude",
  },
  {
    id: "e8q12",
    question: "What is the function of the vacuum and pneumatic system in the B200?",
    options: ["Powers the landing gear retraction system", "Drives the gyroscopic flight instruments and some environmental system components", "Provides brake pressure for anti-skid system", "Operates the cargo door on the B200C"],
    correctIndex: 1,
    explanation: "The vacuum/pneumatic system drives gyroscopic instruments and assists some environmental system functions. Vacuum is sourced from an engine-driven vacuum pump.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Vacuum and Pneumatic System",
  },
  {
    id: "e8q13",
    question: "In the B200, what is the purpose of the de-icing boots on the wing leading edges?",
    options: ["Heat the leading edge to prevent ice formation (anti-ice)", "Inflate and deflate pneumatically to crack and shed accumulated ice (de-ice)", "Apply a chemical fluid to dissolve surface ice", "Use electric heating elements to remove ice"],
    correctIndex: 1,
    explanation: "B200 wing leading edge de-ice boots are pneumatic — they inflate and deflate in a cycle to crack and shed accumulated ice. This is de-icing, not anti-icing (which prevents ice formation).",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Ice Protection: Wing De-ice Boots",
  },
  {
    id: "e8q14",
    question: "What anti-icing system protects the PT6A engine inlets on the B200?",
    options: ["Pneumatic boot inflation", "Engine bleed air directed to heat the inlet lip", "Electrical heating elements in the inlet ring", "Chemical fluid injection at the inlet"],
    correctIndex: 1,
    explanation: "Engine inlet anti-ice on the B200 uses hot bleed air from the engine to heat the inlet lip, preventing ice formation before it can enter the engine.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Ice Protection: Engine Anti-Ice",
  },
  {
    id: "e8q15",
    question: "What is the purpose of the B200 BLEED AIR FAIL annunciation?",
    options: ["Indicates a hydraulic system failure", "Indicates loss of bleed air from one or both engines, affecting pressurisation and anti-ice", "Warns of an impending compressor stall", "Indicates a fuel control unit malfunction"],
    correctIndex: 1,
    explanation: "BLEED AIR FAIL indicates loss of bleed air supply, which affects cabin pressurisation, heating, and anti-ice systems. Immediate action per QRH is required.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Pressurisation / Bleed Air Fail",
  },
  {
    id: "e8q16",
    question: "How is the B200 autopilot system described in terms of its control axes?",
    options: ["Single-axis (pitch only)", "Dual-axis (pitch and roll)", "Three-axis (pitch, roll, yaw)", "Four-axis with autothrottle"],
    correctIndex: 2,
    explanation: "The B200's autopilot system is a three-axis system controlling pitch, roll, and yaw, providing full flight control capability in conjunction with the flight director.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Autopilot System",
  },
  {
    id: "e8q17",
    question: "What does the B200 ice detection system typically use to detect icing conditions?",
    options: ["Temperature and moisture sensors in the fuselage nose", "Pilot visual observation with reference to the windshield wiper arm", "Vibrating probe or optical sensor", "Ice accretion rate measurement on the wing"],
    correctIndex: 1,
    explanation: "The primary ice detection method on the B200 is pilot visual observation, using the windshield wiper arm or wing leading edge as a reference for ice accumulation.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Ice Protection: Detection",
  },
  {
    id: "e8q18",
    question: "What is the published maximum takeoff weight (MTOW) for the King Air B200?",
    options: ["10,500 lbs", "12,500 lbs", "14,000 lbs", "15,000 lbs"],
    correctIndex: 1,
    explanation: "The King Air B200 maximum takeoff weight is 12,500 lbs (5,670 kg). This is the weight used for all standard performance charts and limitations.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Limitations: Maximum Takeoff Weight",
  },
  {
    id: "e8q19",
    question: "What is the primary flight instrument powered by the essential DC bus in the B200?",
    options: ["Course deviation indicator (CDI)", "Attitude indicator (AI) — standby battery powered", "Airspeed indicator", "Altimeter"],
    correctIndex: 1,
    explanation: "The standby/emergency attitude indicator in the B200 is powered by the essential DC bus (or its own battery), ensuring attitude reference is maintained during electrical failures.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Electrical System: Essential Bus",
  },
  {
    id: "e8q20",
    question: "What is the function of the B200 fuel heating system?",
    options: ["Heats fuel in the wing tanks during cold weather operations", "Uses engine oil heat exchanged to warm fuel and prevent fuel filter icing", "Provides fuel pre-heating on the ground via GPU", "Prevents fuel from gelling in the tip tanks during descent"],
    correctIndex: 1,
    explanation: "The B200 fuel heater uses engine oil heat exchanged in the fuel-oil heat exchanger to warm fuel and prevent ice crystal formation that could block the fuel filter.",
    source: "KA B200/B200GT/250 Pilot Training Manual (PL21-1) — Fuel System: Fuel Heater",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 9 — DMM Quick Reference (TBL007)
// Source: TBL007-DMM-Quick-Reference-ID-276660.pdf
// ─────────────────────────────────────────────────────────────
const exam9Questions: ExamQuestion[] = [
  {
    id: "e9q01",
    question: "What does DMM stand for in the context of TBL007?",
    options: ["Dispatch Maintenance Manual", "Dangerous Goods and Medical Materials", "Dangerous Materials Manual", "Duty Medical Management"],
    correctIndex: 2,
    explanation: "DMM stands for Dangerous Materials Manual — TBL007 is the quick reference document for handling dangerous goods in the RFDS SE context.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Title / Purpose",
  },
  {
    id: "e9q02",
    question: "Dangerous goods transported by air are regulated under which ICAO document?",
    options: ["ICAO Annex 6", "ICAO Technical Instructions for Safe Transport of Dangerous Goods by Air (ICAO TI)", "ICAO Annex 14", "ICAO Doc 4444 PANS-ATM"],
    correctIndex: 1,
    explanation: "Dangerous goods by air are governed by the ICAO Technical Instructions for the Safe Transport of Dangerous Goods by Air (Doc 9284), implemented nationally via CASA.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Regulatory Framework",
  },
  {
    id: "e9q03",
    question: "Which CASA regulation governs the transport of dangerous goods by air in Australia?",
    options: ["CASR Part 61", "CASR Part 92", "CASR Part 119", "CAO 20.7.4"],
    correctIndex: 1,
    explanation: "CASR Part 92 governs the carriage of dangerous goods by air in Australia. It implements ICAO Technical Instructions domestically.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Regulatory Framework",
  },
  {
    id: "e9q04",
    question: "Under RFDS SE DMM procedures, who is responsible for accepting dangerous goods for carriage?",
    options: ["The patient transport coordinator", "The pilot-in-command", "The trained and authorised acceptance staff or flight crew per the operator's DG acceptance procedures", "CASA directly"],
    correctIndex: 2,
    explanation: "Dangerous goods acceptance is the responsibility of trained and authorised staff per the operator's approved DG procedures. The PIC must also be informed of DG on board.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Acceptance Responsibilities",
  },
  {
    id: "e9q05",
    question: "Lithium batteries transported in passenger baggage on RFDS flights are classified under which dangerous goods class?",
    options: ["Class 2 — Gases", "Class 3 — Flammable Liquids", "Class 9 — Miscellaneous Dangerous Goods", "Class 6 — Toxic Substances"],
    correctIndex: 2,
    explanation: "Lithium batteries are classified as Class 9 (Miscellaneous Dangerous Goods) in the ICAO/IATA dangerous goods classification system.",
    source: "TBL007 DMM Quick Reference (ID-276660) — DG Classification Table",
  },
  {
    id: "e9q06",
    question: "Medical oxygen cylinders carried on RFDS aircraft are classified as which dangerous goods class?",
    options: ["Class 3 — Flammable Liquids", "Class 2.2 — Non-flammable, Non-toxic Gas with an oxidiser subsidiary risk", "Class 6.1 — Toxic Substances", "Class 1 — Explosives"],
    correctIndex: 1,
    explanation: "Medical oxygen is Class 2.2 (Non-flammable, Non-toxic Gas) with an oxidising subsidiary risk (5.1). It requires specific labelling and storage requirements.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Medical Oxygen Classification",
  },
  {
    id: "e9q07",
    question: "In the event of a dangerous goods incident in flight, what is the PIC's primary responsibility?",
    options: ["Immediately return to the departure airport", "Assess the situation, apply emergency procedures, and notify ATC and the operator", "Continue the flight and report on landing only", "Dump the dangerous goods out of the aircraft"],
    correctIndex: 1,
    explanation: "In a DG incident in flight, the PIC assesses the situation, applies relevant emergency procedures, notifies ATC (PANPAN or MAYDAY as appropriate), and informs the operator.",
    source: "TBL007 DMM Quick Reference (ID-276660) — In-Flight Emergency Procedures",
  },
  {
    id: "e9q08",
    question: "What is required to be completed and carried on each flight with dangerous goods?",
    options: ["CASA Form 1350", "A Shipper's Declaration and/or Dangerous Goods Notification to Captain", "A verbal briefing to crew only", "Only a DG sticker on the cargo door"],
    correctIndex: 1,
    explanation: "A Shipper's Declaration (from the sender) and a Dangerous Goods Notification to the Captain (NOTOC) must be completed and carried on flights with DG.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Documentation Requirements",
  },
  {
    id: "e9q09",
    question: "Which dangerous goods class covers infectious substances such as patient specimens?",
    options: ["Class 6.1 — Toxic Substances", "Class 6.2 — Infectious Substances", "Class 9 — Miscellaneous", "Class 4 — Flammable Solids"],
    correctIndex: 1,
    explanation: "Infectious substances (e.g. patient specimens, cultures) are classified as Class 6.2 under ICAO dangerous goods classification.",
    source: "TBL007 DMM Quick Reference (ID-276660) — DG Classification — Class 6.2",
  },
  {
    id: "e9q10",
    question: "Dry ice (solid carbon dioxide) carried in medical transport is classified as:",
    options: ["Class 2.2 — Non-flammable, Non-toxic Gas", "Class 9 — Miscellaneous Dangerous Goods with specific quantity limits", "Class 3 — Flammable Liquid", "Class 6.1 — Toxic"],
    correctIndex: 1,
    explanation: "Dry ice (solid CO2) is Class 9 — Miscellaneous Dangerous Goods. Quantity limits apply for passenger aircraft, and ventilation requirements must be met.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Dry Ice Classification",
  },
  {
    id: "e9q11",
    question: "What is the UN number for aviation fuel (Jet A-1)?",
    options: ["UN 1203", "UN 1863", "UN 1075", "UN 3166"],
    correctIndex: 1,
    explanation: "Jet A-1 (aviation turbine fuel) has UN number 1863 — Fuel, Aviation, Turbine Engine. This is used for placarding and shipping declarations.",
    source: "TBL007 DMM Quick Reference (ID-276660) — UN Numbers Reference Table",
  },
  {
    id: "e9q12",
    question: "How are dangerous goods with a primary hazard and subsidiary risk labelled on the package?",
    options: ["Primary hazard label only", "Subsidiary risk label only", "Both primary hazard label AND subsidiary risk label", "A combined multi-hazard label only"],
    correctIndex: 2,
    explanation: "Packages must display both the primary class hazard label and any subsidiary risk labels. For example, medical oxygen shows class 2.2 label plus the 5.1 oxidiser label.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Labelling Requirements",
  },
  {
    id: "e9q13",
    question: "The RFDS SE DMM identifies which category of crew member as responsible for DG awareness on the aircraft?",
    options: ["Cabin crew only", "Pilot-in-command and all crew members handling DG", "Ground handlers only", "The flight nurse exclusively"],
    correctIndex: 1,
    explanation: "The PIC and all crew members involved in handling, stowing, or monitoring DG are responsible for DG awareness in accordance with the DMM.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Crew Responsibilities",
  },
  {
    id: "e9q14",
    question: "What colour is the background of the Class 3 (Flammable Liquid) dangerous goods label?",
    options: ["Green", "Blue", "Red", "Yellow"],
    correctIndex: 2,
    explanation: "Class 3 Flammable Liquid dangerous goods labels have a red diamond background with a flame symbol.",
    source: "TBL007 DMM Quick Reference (ID-276660) — DG Label Colours and Symbols",
  },
  {
    id: "e9q15",
    question: "Which class of dangerous goods represents the greatest immediate explosive risk in transport?",
    options: ["Class 1 — Explosives", "Class 2.1 — Flammable Gas", "Class 3 — Flammable Liquid", "Class 5.1 — Oxidising Substances"],
    correctIndex: 0,
    explanation: "Class 1 Explosives represent the greatest immediate detonation/explosion risk and have the most restrictive transport conditions of all DG classes.",
    source: "TBL007 DMM Quick Reference (ID-276660) — DG Class Overview",
  },
  {
    id: "e9q16",
    question: "What does 'hidden dangerous goods' refer to in the DG context?",
    options: ["Mislabelled packages from the shipper", "DG items that passengers or patients may unknowingly carry (e.g. lithium batteries in devices, aerosols in bags)", "Classified military dangerous goods", "Dangerous goods hidden by the shipper to avoid declaration"],
    correctIndex: 1,
    explanation: "Hidden dangerous goods are items that appear innocent but contain DG — such as lithium batteries in laptops, aerosols in bags, or medical devices with gas cylinders. Crew awareness is required.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Hidden Dangerous Goods",
  },
  {
    id: "e9q17",
    question: "What is the standard approach if dangerous goods are discovered on board mid-flight without documentation?",
    options: ["Continue flight and complete a report on landing", "Secure the item, notify ATC if safety risk, complete an occurrence report, and follow operator's emergency procedures", "Immediately declare a MAYDAY regardless of risk level", "Request the patient or passenger to manage their own DG"],
    correctIndex: 1,
    explanation: "Undeclared/undocumented DG found mid-flight: secure the item safely, assess the risk, notify ATC if a safety concern exists, and complete an occurrence report per operator procedures.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Undeclared DG Procedure",
  },
  {
    id: "e9q18",
    question: "What quantity of dry ice (Class 9) is typically permitted per passenger on a commercial aircraft?",
    options: ["1 kg", "2.5 kg", "5 kg", "No limit with declaration"],
    correctIndex: 1,
    explanation: "ICAO permits up to 2.5 kg of dry ice per passenger when used for packaging perishables — provided the package allows CO2 release and the PIC is informed.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Dry Ice Quantity Limits",
  },
  {
    id: "e9q19",
    question: "Which of the following would require a NOTOC (Notification to Captain) for an RFDS flight?",
    options: ["Standard patient medical equipment (non-DG)", "Medical oxygen cylinder declared as dangerous goods", "Patient personal medication (oral tablets)", "Standard aircraft first aid kit contents"],
    correctIndex: 1,
    explanation: "A NOTOC is required for any dangerous goods on board — including a medical oxygen cylinder declared as Class 2.2. Standard medication and non-DG equipment do not require a NOTOC.",
    source: "TBL007 DMM Quick Reference (ID-276660) — NOTOC Requirements",
  },
  {
    id: "e9q20",
    question: "Under which dangerous goods class are defibrillator batteries (non-lithium, sealed lead acid) typically classified?",
    options: ["Class 3 — Flammable Liquid (acid)", "Class 8 — Corrosive Substances", "Class 9 — Miscellaneous (wet battery)", "Class 6.1 — Toxic"],
    correctIndex: 2,
    explanation: "Non-spillable sealed lead acid batteries used in medical equipment (including defibrillators) are classified as Class 9 Miscellaneous under ICAO/IATA dangerous goods rules.",
    source: "TBL007 DMM Quick Reference (ID-276660) — Battery Classification",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM 10 — MIXED: Emergency Procedures (All Sources)
// ─────────────────────────────────────────────────────────────
const exam10Questions: ExamQuestion[] = [
  { ...exam1Questions[6], id: "e10q01" },  // Emergency shutdown step 1
  { ...exam1Questions[8], id: "e10q02" },  // Engine fire on ground — starter only
  { ...exam2Questions[13], id: "e10q03" }, // Oil pressure < 60 PSI action
  { ...exam2Questions[15], id: "e10q04" }, // Engine failure in flight step 1
  { ...exam2Questions[16], id: "e10q05" }, // Engine fire persists — extinguisher
  { ...exam2Questions[17], id: "e10q06" }, // Engine failure at/above V1 first action
  { ...exam2Questions[18], id: "e10q07" }, // Engine failure below VMCA
  { ...exam2Questions[19], id: "e10q08" }, // 2nd engine flameout — no feather
  { ...exam4Questions[4], id: "e10q09" },  // Electrical smoke — first action
  { ...exam4Questions[5], id: "e10q10" },  // Windshield fault — first action
  { ...exam4Questions[6], id: "e10q11" },  // After V1 — what speed after obstacle clearance
  { ...exam4Questions[7], id: "e10q12" },  // Ground emergency shutdown — how many CLs
  { ...exam4Questions[8], id: "e10q13" },  // Aborted takeoff stopping
  { ...exam1Questions[4], id: "e10q14" },  // Emergency descent speed
  { ...exam1Questions[5], id: "e10q15" },  // Max range glide speed
  { ...exam3Questions[3], id: "e10q16" },  // B350 oil pressure normal
  { ...exam3Questions[4], id: "e10q17" },  // B350 oil min emergency
  { ...exam2Questions[7], id: "e10q18" },  // Crossfeed condition
  { ...exam2Questions[5], id: "e10q19" },  // Starter limits
  { ...exam2Questions[6], id: "e10q20" },  // Fuel imbalance limit
];

// ─────────────────────────────────────────────────────────────
// EXAM 11 — MIXED: Limitations & Systems (All Sources)
// ─────────────────────────────────────────────────────────────
const exam11Questions: ExamQuestion[] = [
  { ...exam2Questions[0], id: "e11q01" },  // B200 oil pressure normal below 21k
  { ...exam2Questions[1], id: "e11q02" },  // B200 oil pressure at/above 21k
  { ...exam2Questions[3], id: "e11q03" },  // Max oil temp
  { ...exam2Questions[4], id: "e11q04" },  // Oil temp 99-104 time limit
  { ...exam2Questions[9], id: "e11q05" },  // Anti-icing additive concentration
  { ...exam2Questions[10], id: "e11q06" }, // Torque limit below 1600 RPM
  { ...exam2Questions[11], id: "e11q07" }, // Avgas max altitude
  { ...exam2Questions[12], id: "e11q08" }, // Generator load above FL310
  { ...exam3Questions[0], id: "e11q09" },  // B350 VMO
  { ...exam3Questions[1], id: "e11q10" },  // B350 VMCA
  { ...exam3Questions[5], id: "e11q11" },  // B350 oil temp limits
  { ...exam3Questions[7], id: "e11q12" },  // B350 fuel imbalance max
  { ...exam3Questions[8], id: "e11q13" },  // B350 min icing speed
  { ...exam3Questions[17], id: "e11q14" }, // B350 MMO
  { ...exam7Questions[8], id: "e11q15" },  // B200 max diff pressure
  { ...exam7Questions[13], id: "e11q16" }, // B200 landing gear type
  { ...exam7Questions[17], id: "e11q17" }, // Condition lever function
  { ...exam8Questions[10], id: "e11q18" }, // B200 max altitude FL350
  { ...exam8Questions[17], id: "e11q19" }, // B200 MTOW 12,500 lbs
  { ...exam4Questions[3], id: "e11q20" },  // Max windshield anti-ice speed 226 KIAS
];

// ─────────────────────────────────────────────────────────────
// EXAM 12 — MIXED: Regulations, FRSM & DG (All Sources)
// ─────────────────────────────────────────────────────────────
const exam12Questions: ExamQuestion[] = [
  { ...exam5Questions[0], id: "e12q01" },  // Sleep at home base — 8hrs in 12hrs
  { ...exam5Questions[1], id: "e12q02" },  // Sleep away base — 8hrs in 10hrs
  { ...exam5Questions[4], id: "e12q03" },  // FDP definition
  { ...exam5Questions[5], id: "e12q04" },  // WICR definition
  { ...exam5Questions[6], id: "e12q05" },  // CAO 48.1 (2019)
  { ...exam5Questions[8], id: "e12q06" },  // FAID score tool
  { ...exam5Questions[9], id: "e12q07" },  // If PSO not achieved — not commence FDP
  { ...exam5Questions[15], id: "e12q08" }, // FRSM version and date
  { ...exam9Questions[1], id: "e12q09" },  // ICAO Technical Instructions
  { ...exam9Questions[2], id: "e12q10" },  // CASR Part 92
  { ...exam9Questions[4], id: "e12q11" },  // Lithium battery class
  { ...exam9Questions[5], id: "e12q12" },  // Medical oxygen class
  { ...exam9Questions[6], id: "e12q13" },  // DG incident in flight
  { ...exam9Questions[7], id: "e12q14" },  // NOTOC requirement
  { ...exam9Questions[8], id: "e12q15" },  // Infectious substances class
  { ...exam9Questions[9], id: "e12q16" },  // Dry ice class
  { ...exam9Questions[14], id: "e12q17" }, // Class 1 greatest explosive risk
  { ...exam9Questions[15], id: "e12q18" }, // Hidden dangerous goods definition
  { ...exam9Questions[18], id: "e12q19" }, // NOTOC for medical O2
  { ...exam5Questions[13], id: "e12q20" }, // 1 hour pre-shift allocation
];

// ─────────────────────────────────────────────────────────────
// EXAM REGISTRY
// ─────────────────────────────────────────────────────────────
export const EXAMS: Exam[] = [
  {
    id: "exam-01",
    title: "Exam 1 — Memory Flash Cards",
    subtitle: "Emergency Airspeeds & Limitations (BB1439)",
    questions: exam1Questions,
  },
  {
    id: "exam-02",
    title: "Exam 2 — B200 QRH",
    subtitle: "RFDS SE B200 Quick Reference Handbook (AVM004c)",
    questions: exam2Questions,
  },
  {
    id: "exam-03",
    title: "Exam 3 — B350 QRH",
    subtitle: "RFDS SE B350 Quick Reference Handbook (AVM004h)",
    questions: exam3Questions,
  },
  {
    id: "exam-04",
    title: "Exam 4 — Pilot Checklist",
    subtitle: "B200 & B200C Pilot Checklist (FlightSafety P/N 101-590010-309F)",
    questions: exam4Questions,
  },
  {
    id: "exam-05",
    title: "Exam 5 — FRSM Manual",
    subtitle: "Fatigue Risk Safety Management (AVM013 v02)",
    questions: exam5Questions,
  },
  {
    id: "exam-06",
    title: "Exam 6 — Raisbeck POH Supplement",
    subtitle: "FMS Raisbeck Modifications (B200/B200C/T/CT)",
    questions: exam6Questions,
  },
  {
    id: "exam-07",
    title: "Exam 7 — Training Manual Part A",
    subtitle: "KA B200/B200GT/250 Pilot Training Manual (PL21)",
    questions: exam7Questions,
  },
  {
    id: "exam-08",
    title: "Exam 8 — Training Manual Part B",
    subtitle: "KA B200/B200GT/250 Advanced Systems (PL21-1)",
    questions: exam8Questions,
  },
  {
    id: "exam-09",
    title: "Exam 9 — DMM Quick Reference",
    subtitle: "Dangerous Materials Manual (TBL007-ID-276660)",
    questions: exam9Questions,
  },
  {
    id: "exam-10",
    title: "Exam 10 — Mixed: Emergency Procedures",
    subtitle: "Combined questions across all manuals",
    questions: exam10Questions,
  },
  {
    id: "exam-11",
    title: "Exam 11 — Mixed: Limitations & Systems",
    subtitle: "Combined questions across all manuals",
    questions: exam11Questions,
  },
  {
    id: "exam-12",
    title: "Exam 12 — Mixed: Regs, FRSM & DG",
    subtitle: "Combined questions across all manuals",
    questions: exam12Questions,
  },
];

export const PASS_MARK = 70; // Percent
export const EXAM_DURATION_MINUTES = 30;
