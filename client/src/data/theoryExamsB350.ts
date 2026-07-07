// Theory Knowledge Exam Bank — King Air B350 / B350C / B350ER
// RFDS SE Operations — B350 Series
// Each question includes source reference for full transparency

import { type ExamQuestion, type Exam } from "./theoryExams";

// ─────────────────────────────────────────────────────────────
// EXAM B1 — B350 Limitations & Airspeeds
// Source: B350 QRH (AVM004h), B350 AFM
// ─────────────────────────────────────────────────────────────
const examB1Questions: ExamQuestion[] = [
  {
    id: "b1q01",
    question: "What is the Maximum Ramp Weight (MRW) for the B350?",
    options: ["15,000 lb", "15,100 lb", "16,500 lb", "14,500 lb"],
    correctIndex: 1,
    explanation: "The B350 Maximum Ramp Weight is 15,100 lb. This is 100 lb more than MTOW to allow for fuel burned during taxi.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q02",
    question: "What is the Maximum Takeoff Weight (MTOW) for the B350?",
    options: ["14,000 lb", "14,500 lb", "15,000 lb", "16,000 lb"],
    correctIndex: 2,
    explanation: "The B350 MTOW is 15,000 lb. This is significantly more than the B200 MTOW of 12,500 lb, reflecting the B350's larger payload and fuel capacity.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q03",
    question: "What is the Maximum Landing Weight (MLW) for the B350?",
    options: ["13,500 lb", "14,000 lb", "14,500 lb", "15,000 lb"],
    correctIndex: 2,
    explanation: "The B350 Maximum Landing Weight is 14,500 lb. Exceeding this weight on landing may result in structural damage to the landing gear.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q04",
    question: "What is the Maximum Zero Fuel Weight (MZFW) for the B350?",
    options: ["13,500 lb", "14,000 lb", "14,500 lb", "15,000 lb"],
    correctIndex: 1,
    explanation: "The B350 MZFW is 14,000 lb. Any weight above MZFW must be fuel, ensuring structural limits for wing bending are not exceeded with fuel weight acting as a counterbalance.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q05",
    question: "What is the Maximum Operating Speed (VMO) for the B350?",
    options: ["220 KIAS", "250 KIAS", "260 KIAS", "280 KIAS"],
    correctIndex: 1,
    explanation: "VMO for the B350 is 250 KIAS below 25,200 ft. Above that altitude, MMO of 0.58M applies. Exceeding VMO/MMO risks structural damage from flutter and aerodynamic loads.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q06",
    question: "What is the Maximum Mach Number (MMO) for the B350?",
    options: ["0.52M", "0.55M", "0.58M", "0.62M"],
    correctIndex: 2,
    explanation: "MMO for the B350 is 0.58M, which applies above 25,200 ft where it becomes more restrictive than VMO of 250 KIAS.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q07",
    question: "What is the Maximum Flap Extended Speed (VFE) for Flaps 40° on the B350?",
    options: ["170 KIAS", "178 KIAS", "185 KIAS", "200 KIAS"],
    correctIndex: 1,
    explanation: "VFE with Flaps 40° is 178 KIAS on the B350. Exceeding this speed with flaps at 40° risks structural damage to the flap structure.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q08",
    question: "What is the Maximum Flap Extended Speed (VFE) for Flaps UP to 17.5° on the B350?",
    options: ["178 KIAS", "200 KIAS", "226 KIAS", "250 KIAS"],
    correctIndex: 2,
    explanation: "VFE for Flaps 0° to 17.5° is 226 KIAS on the B350, allowing higher speed during early flap extension phases.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q09",
    question: "What is the Maximum Landing Gear Operating Speed (VLO) for the B350?",
    options: ["175 KIAS", "181 KIAS", "185 KIAS", "200 KIAS"],
    correctIndex: 2,
    explanation: "VLO (gear operating) for the B350 is 185 KIAS. This is the maximum speed at which the landing gear may be extended or retracted.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q10",
    question: "What is the Maximum Landing Gear Extended Speed (VLE) for the B350?",
    options: ["185 KIAS", "200 KIAS", "220 KIAS", "235 KIAS"],
    correctIndex: 1,
    explanation: "VLE for the B350 is 200 KIAS — the maximum speed with landing gear extended and locked down.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q11",
    question: "What is the Design Maneuvering Speed (VA) for the B350 at maximum weight?",
    options: ["170 KIAS", "181 KIAS", "190 KIAS", "200 KIAS"],
    correctIndex: 2,
    explanation: "VA at maximum weight for the B350 is 190 KIAS. Full or abrupt control inputs should not be made above this speed as structural damage may result.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q12",
    question: "What is the Maximum Certificated Altitude for the B350?",
    options: ["25,000 ft", "31,000 ft", "35,000 ft", "45,000 ft"],
    correctIndex: 2,
    explanation: "The B350's maximum certificated altitude is 35,000 ft — 4,000 ft higher than the B200's 31,000 ft ceiling.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q13",
    question: "What is the Air Minimum Control Speed (VMCA) for the B350?",
    options: ["82 KIAS", "86 KIAS", "96 KIAS", "108 KIAS"],
    correctIndex: 2,
    explanation: "VMCA for the B350 is 96 KIAS — the minimum speed at which directional control can be maintained following sudden failure of the critical engine at takeoff power.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q14",
    question: "What is the Ground Minimum Control Speed (VMCG) for the B350?",
    options: ["82 KIAS", "86 KIAS", "88 KIAS", "96 KIAS"],
    correctIndex: 2,
    explanation: "VMCG for the B350 is 88 KIAS — the minimum speed at which directional control on the ground can be maintained following critical engine failure during takeoff roll.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q15",
    question: "What is the Takeoff Decision Speed (V1) range on the B350?",
    options: ["Equals VR always", "Determined by performance charts based on weight/runway/temp", "Fixed at 100 KIAS", "Same as VMCA"],
    correctIndex: 1,
    explanation: "V1 is not a fixed speed on the B350 — it is determined from performance charts based on takeoff weight, field elevation, temperature, and runway length. It must always be ≥ VMCG and ≤ VR.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures",
  },
  {
    id: "b1q16",
    question: "What is the typical Rotation Speed (VR) for the B350 at maximum weight in ISA conditions?",
    options: ["100 KIAS", "108 KIAS", "115 KIAS", "121 KIAS"],
    correctIndex: 1,
    explanation: "VR for the B350 at maximum weight is approximately 108 KIAS under ISA conditions, but always verify the performance charts for actual conditions.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures / Performance",
  },
  {
    id: "b1q17",
    question: "What is the OEI Best Rate-of-Climb Speed (VYSE) for the B350?",
    options: ["121 KIAS", "127 KIAS", "130 KIAS", "135 KIAS"],
    correctIndex: 1,
    explanation: "VYSE for the B350 is 127 KIAS — the speed that achieves the greatest altitude gain per unit time with one engine inoperative.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Emergency Airspeeds",
  },
  {
    id: "b1q18",
    question: "What is the OEI Best Angle-of-Climb Speed (VXSE) for the B350?",
    options: ["108 KIAS", "115 KIAS", "121 KIAS", "127 KIAS"],
    correctIndex: 2,
    explanation: "VXSE for the B350 is 121 KIAS — the speed that provides the steepest climb gradient on one engine for obstacle clearance.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Emergency Airspeeds",
  },
  {
    id: "b1q19",
    question: "What is the maximum crosswind component for takeoff and landing on the B350?",
    options: ["20 knots", "25 knots", "30 knots", "35 knots"],
    correctIndex: 1,
    explanation: "The demonstrated crosswind component for the B350 is 25 knots. This is a demonstrated value — actual limitations depend on runway surface, conditions, and crew proficiency.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b1q20",
    question: "What is the maximum torque limit for takeoff on the B350 with PT6A-60A engines?",
    options: ["100% (1,700 ft-lb)", "104% (1,768 ft-lb)", "106% (1,802 ft-lb)", "110% (1,870 ft-lb)"],
    correctIndex: 1,
    explanation: "Maximum takeoff torque for the B350's PT6A-60A engines is 104% (1,768 ft-lb). Exceeding this limit requires an engine inspection before further flight.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Engine",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM B2 — B350 Normal Procedures
// Source: B350 QRH (AVM004h), B350 AFM Section 4
// ─────────────────────────────────────────────────────────────
const examB2Questions: ExamQuestion[] = [
  {
    id: "b2q01",
    question: "During the B350 Before Start checklist, what position should the BLEED AIR switches be in?",
    options: ["ON for both engines", "OFF for both engines", "AUTO", "ENG BLD ON, CABIN BLD OFF"],
    correctIndex: 0,
    explanation: "BLEED AIR switches should be ON for both engines during normal operations. Bleed air is used for cabin pressurisation, de-icing, and air conditioning.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Before Start",
  },
  {
    id: "b2q02",
    question: "What is the correct starter engagement ITT limit during B350 engine start?",
    options: ["Less than 800°C", "Less than 850°C", "Less than 900°C", "Less than 1,000°C"],
    correctIndex: 2,
    explanation: "During start, ITT must remain below 900°C (hot start limit). If ITT reaches 900°C, the start must be aborted immediately to prevent engine damage.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Engine Start",
  },
  {
    id: "b2q03",
    question: "At what ITT on the B350 is a 'hot start' defined during engine start?",
    options: ["Above 700°C", "Above 800°C", "Above 900°C", "Above 1,000°C"],
    correctIndex: 2,
    explanation: "A hot start is defined as ITT exceeding 900°C during the start sequence. An immediate abort is required, and the engine must be inspected before another start attempt.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Engine Start",
  },
  {
    id: "b2q04",
    question: "What is the minimum inter-start cooling time between successive B350 engine start attempts?",
    options: ["15 seconds", "30 seconds", "1 minute", "5 minutes"],
    correctIndex: 2,
    explanation: "A minimum of 60 seconds (1 minute) must elapse between start attempts to allow the starter motor and engine internals to cool.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Engine Start",
  },
  {
    id: "b2q05",
    question: "During B350 taxi, what is the normal brake pressure check pressure range?",
    options: ["600–800 PSI", "1,000–1,200 PSI", "1,200–1,500 PSI", "1,500–2,000 PSI"],
    correctIndex: 1,
    explanation: "Normal brake hydraulic pressure for the B350 is 1,000–1,200 PSI. A functional check is performed during taxi to confirm both main and alternate brake pressure.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Taxi",
  },
  {
    id: "b2q06",
    question: "What flap setting is normally used for B350 takeoff?",
    options: ["Flaps 0°", "Flaps 17.5°", "Flaps 35°", "Flaps 40°"],
    correctIndex: 1,
    explanation: "Normal takeoff flap setting for the B350 is 17.5°. This provides an optimum balance between lift and drag for ground roll and initial climb performance.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Before Takeoff",
  },
  {
    id: "b2q07",
    question: "After liftoff, when should the B350 landing gear be retracted?",
    options: ["As soon as wheels leave the ground", "When a positive rate of climb is confirmed", "At 400 ft AGL", "At 500 ft AGL"],
    correctIndex: 1,
    explanation: "Gear retraction is initiated when a positive rate of climb is confirmed on the altimeter and VSI, and there is insufficient runway remaining for landing.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — After Takeoff",
  },
  {
    id: "b2q08",
    question: "What is the normal climb power setting for the B350 (torque)?",
    options: ["80% torque", "Maximum continuous (100%)", "84% torque", "Climb power as per torque tables"],
    correctIndex: 3,
    explanation: "B350 climb power is set using the torque tables in the AFM/performance charts, which account for altitude and temperature. Maximum continuous torque is 100% (1,700 ft-lb).",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Climb",
  },
  {
    id: "b2q09",
    question: "What is the standard B350 cruise altitude for RFDS SE operations on inter-base sectors?",
    options: ["FL180", "FL210", "FL250", "FL310"],
    correctIndex: 2,
    explanation: "FL250 is the typical cruise altitude for B350 RFDS SE inter-base sectors, balancing fuel economy, pressurisation comfort, and airspace constraints.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures / RFDS SE Operations",
  },
  {
    id: "b2q10",
    question: "What flap setting is used for the B350 normal approach and landing?",
    options: ["Flaps 17.5°", "Flaps 35°", "Flaps 40°", "Flaps 0°"],
    correctIndex: 2,
    explanation: "Normal landing is performed with Flaps 40° on the B350, providing maximum lift and drag for a stabilised approach and short landing roll.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Approach and Landing",
  },
  {
    id: "b2q11",
    question: "What is the B350 normal approach speed (VREF + additive) in typical RFDS SE configuration?",
    options: ["100 KIAS", "110–120 KIAS", "120–135 KIAS", "140–150 KIAS"],
    correctIndex: 2,
    explanation: "B350 approach speed in RFDS SE configuration is typically 120–135 KIAS depending on landing weight and conditions. VREF is weight-dependent from performance charts; additive is applied for wind/gusts.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Approach",
  },
  {
    id: "b2q12",
    question: "During B350 shutdown, when should the Condition Levers be placed to FUEL CUTOFF?",
    options: ["As soon as the aircraft stops", "After propellers have stopped", "ITT below 500°C and N1 below 20%", "Immediately after parking brake is set"],
    correctIndex: 2,
    explanation: "Condition Levers are moved to FUEL CUTOFF when ITT is below 500°C and N1 is below 20%, ensuring an orderly and safe engine shutdown sequence.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Engine Shutdown",
  },
  {
    id: "b2q13",
    question: "What action is required if the Propeller Sync (PROP SYNC) is selected ON before engine run-up?",
    options: ["Both engines must be within 100 RPM before engaging", "Deselect PROP SYNC — it must be OFF for run-up", "No special requirement", "Prop sync can remain on throughout"],
    correctIndex: 1,
    explanation: "PROP SYNC must be OFF during engine run-up. Prop sync is only engaged in cruise to reduce vibration and noise, not during power changes.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Engine Run-Up",
  },
  {
    id: "b2q14",
    question: "During before landing checks on the B350, AUTOFEATHER should be set to:",
    options: ["OFF", "ARM", "TEST then ARM", "ON"],
    correctIndex: 1,
    explanation: "AUTOFEATHER is selected to ARM before landing. This ensures an automatic propeller feather is available if an engine fails during a go-around, preventing asymmetric drag.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Before Landing",
  },
  {
    id: "b2q15",
    question: "What is the maximum ITT for ground operation at high power on the B350?",
    options: ["725°C", "785°C", "820°C", "870°C"],
    correctIndex: 1,
    explanation: "Maximum ITT for high-power ground operation on the B350 is 785°C (takeoff and maximum continuous). In flight, 820°C for takeoff (5-minute limit) applies under certain conditions.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Engine",
  },
  {
    id: "b2q16",
    question: "What is the maximum oil temperature for the B350 PT6A-60A engine?",
    options: ["85°C", "99°C", "107°C", "120°C"],
    correctIndex: 2,
    explanation: "Maximum oil temperature for the PT6A-60A engine in the B350 is 107°C continuous. During ground operation, the engine should not be subjected to maximum power until oil temperature is at least 40°C.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Engine",
  },
  {
    id: "b2q17",
    question: "What is the minimum oil temperature for the B350 before applying takeoff power?",
    options: ["0°C", "40°C", "60°C", "70°C"],
    correctIndex: 1,
    explanation: "Oil temperature must be at least 40°C before applying high power on the B350. Operating below this temperature risks inadequate oil film on engine bearings.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Engine",
  },
  {
    id: "b2q18",
    question: "During B350 normal cruise, what is the recommended cabin differential pressure?",
    options: ["3.5 PSI", "4.6 PSI", "6.0 PSI", "6.5 PSI"],
    correctIndex: 3,
    explanation: "Normal cabin differential pressure for the B350 is up to 6.5 PSI, allowing a sea level cabin up to approximately FL220 and a typical 8,000 ft cabin at cruise altitudes around FL350.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Pressurisation",
  },
  {
    id: "b2q19",
    question: "What is the maximum cabin altitude for the B350 pressurisation system?",
    options: ["8,000 ft", "10,000 ft", "12,000 ft", "14,000 ft"],
    correctIndex: 1,
    explanation: "Maximum cabin altitude for the B350 is 10,000 ft. The pressurisation safety valve opens automatically if cabin altitude exceeds this limit.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Pressurisation",
  },
  {
    id: "b2q20",
    question: "During B350 after-landing roll, what action is taken with the Condition Levers?",
    options: ["Move to FUEL CUTOFF immediately", "Leave at HIGH IDLE until turning off runway", "Move to GROUND IDLE", "No change required"],
    correctIndex: 2,
    explanation: "After landing, Condition Levers are moved to GROUND IDLE as part of the after-landing checks, reducing engine power and fuel flow for taxi.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — After Landing",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM B3 — B350 Emergency & Abnormal Procedures
// Source: B350 QRH (AVM004h) Section 3
// ─────────────────────────────────────────────────────────────
const examB3Questions: ExamQuestion[] = [
  {
    id: "b3q01",
    question: "On the B350, following an engine failure at V1, which speed should be maintained for initial obstacle clearance?",
    options: ["VMCA (96 KIAS)", "VXSE (121 KIAS)", "VYSE (127 KIAS)", "V2 as per charts"],
    correctIndex: 3,
    explanation: "Following engine failure at V1, V2 is maintained for initial climb and obstacle clearance. V2 is determined from performance charts based on weight and conditions.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Engine Failure",
  },
  {
    id: "b3q02",
    question: "On the B350, what is the memory item sequence for Engine Fire in Flight?",
    options: [
      "Power Lever IDLE → Condition Lever FUEL CUTOFF → Firewall Shutoff CLOSE → Fire Extinguisher PUSH",
      "Condition Lever FUEL CUTOFF → Power Lever IDLE → Fire Extinguisher PUSH",
      "Fire Extinguisher PUSH immediately → Then shutdown",
      "Feather prop → Fuel shutoff → Extinguisher"
    ],
    correctIndex: 0,
    explanation: "Memory items for B350 Engine Fire in Flight: 1) Power Lever IDLE, 2) Condition Lever FUEL CUTOFF, 3) Firewall Shutoff Valve CLOSE, 4) Fire Extinguisher PUSH. Then use QRH for remainder.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Engine Fire In Flight",
  },
  {
    id: "b3q03",
    question: "On the B350, if the ENG FIRE warning activates on the ground, what is the first memory action?",
    options: ["Power Lever IDLE", "Condition Lever FUEL CUTOFF", "Evacuate aircraft immediately", "Press fire extinguisher"],
    correctIndex: 0,
    explanation: "The first action for Engine Fire on the Ground is Power Lever IDLE, followed immediately by Condition Lever FUEL CUTOFF, then Firewall Shutoff Valve CLOSE, then Fire Extinguisher PUSH.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Engine Fire On Ground",
  },
  {
    id: "b3q04",
    question: "What action is taken first when an AUTOFEATHER activation occurs on the B350?",
    options: ["Pull the prop lever to feather immediately", "Maintain control — confirm engine has failed, then execute OEI procedures", "Reduce power on both engines", "Disconnect AUTOFEATHER system"],
    correctIndex: 1,
    explanation: "When AUTOFEATHER activates, the pilot must first maintain aircraft control, confirm which engine has failed, then execute OEI (one-engine inoperative) procedures per QRH.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Engine Failure",
  },
  {
    id: "b3q05",
    question: "What is the correct response to a CABIN ALTITUDE warning on the B350?",
    options: [
      "Descend immediately at VMO, don oxygen, ATC call",
      "Increase pressurisation first, then assess",
      "Don oxygen immediately, check bleed air, descend to 10,000 ft or MEA",
      "ATC call first, then oxygen"
    ],
    correctIndex: 2,
    explanation: "CABIN ALTITUDE warning response: 1) Oxygen — crew DON and SELECT. 2) Check bleed air and pressurisation controls. 3) Descend to 10,000 ft or MEA (whichever is higher). 4) ATC declaration if required.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Cabin Altitude Warning",
  },
  {
    id: "b3q06",
    question: "During B350 emergency descent, what is the recommended descent speed?",
    options: ["VMO/MMO", "VA (190 KIAS)", "VYSE (127 KIAS)", "250 KIAS / 0.58M"],
    correctIndex: 0,
    explanation: "Emergency descent is conducted at VMO/MMO (250 KIAS / 0.58M). Power levers are IDLE, gear down to increase drag if required, and the descent is as rapid as possible to a safe altitude.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Emergency Descent",
  },
  {
    id: "b3q07",
    question: "On the B350, a hydraulic system failure is indicated by what primary symptom?",
    options: ["Loss of pressurisation", "Landing gear fails to retract/extend normally", "Both prop syncs deactivate", "Loss of electrical power"],
    correctIndex: 1,
    explanation: "Primary indication of hydraulic system failure on the B350 is abnormal landing gear operation (failed to retract or extend). Backup extension is available via the emergency gear extension handle.",
    source: "B350 QRH (AVM004h) — Section 3: Abnormal Procedures — Landing Gear Malfunction",
  },
  {
    id: "b3q08",
    question: "If the B350 landing gear fails to extend normally, what is the emergency extension procedure?",
    options: [
      "Cycle gear handle three times",
      "Pull emergency gear extension handle, allow gravity/spring extension, verify green lights",
      "Increase airspeed to 200 KIAS and cycle gear",
      "Land immediately without gear"
    ],
    correctIndex: 1,
    explanation: "Emergency gear extension: Pull the emergency extension handle — this releases the uplocks mechanically, allowing gear to fall and lock by gravity and spring force. Verify three green lights before landing.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Emergency Gear Extension",
  },
  {
    id: "b3q09",
    question: "What does the B350 STALL WARNING system activate at?",
    options: ["5 knots above stall", "8–10 knots above stall", "15 knots above stall", "20 knots above stall"],
    correctIndex: 1,
    explanation: "The B350 stall warning (stick shaker) activates at approximately 8–10 knots above the stall speed, giving the crew advance warning to initiate recovery before the stall occurs.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Flight Controls / Stall Warning",
  },
  {
    id: "b3q10",
    question: "What is the correct response to a B350 CHIP DETECTOR warning?",
    options: [
      "Continue to destination — note in tech log",
      "Reduce power, monitor engine instruments, land at nearest suitable aerodrome",
      "Shut down affected engine immediately",
      "Increase altitude for glide range"
    ],
    correctIndex: 1,
    explanation: "CHIP DETECTOR warning indicates metal particles in the engine oil, suggesting possible internal engine damage. Reduce power on affected engine, monitor all engine parameters, and land at nearest suitable aerodrome for engineering assessment.",
    source: "B350 QRH (AVM004h) — Section 3: Abnormal Procedures — Engine Chip Detector",
  },
  {
    id: "b3q11",
    question: "During B350 OEI approach, which flap setting is recommended if a missed approach may be required?",
    options: ["Flaps 0°", "Flaps 17.5°", "Flaps 35°", "Flaps 40°"],
    correctIndex: 1,
    explanation: "For OEI approaches where a go-around is possible, Flaps 17.5° is used. This reduces drag and improves OEI climb capability during a missed approach.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — OEI Approach and Landing",
  },
  {
    id: "b3q12",
    question: "What minimum airspeed should be maintained during a B350 OEI approach?",
    options: ["VREF + 5 knots", "VREF + 10 knots", "VYSE (127 KIAS)", "VXSE (121 KIAS)"],
    correctIndex: 0,
    explanation: "OEI approach speed on the B350 is VREF + 5 knots (minimum). Additional additive is applied for gusts. This ensures adequate control authority and stall margin with one engine.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — OEI Approach",
  },
  {
    id: "b3q13",
    question: "If the B350 emergency locator transmitter (ELT) activates inadvertently, what action is taken?",
    options: [
      "Leave it on — ATC will cancel",
      "Turn ELT switch to ARMED or OFF, notify ATC on 121.5 MHz",
      "Reset the avionics",
      "Declare emergency immediately"
    ],
    correctIndex: 1,
    explanation: "Inadvertent ELT activation: Turn switch to ARMED or OFF to stop transmission. Notify ATC on 121.5 MHz and advise of inadvertent activation. Log the event and arrange ground check of ELT.",
    source: "B350 QRH (AVM004h) — Section 3: Abnormal Procedures — ELT Inadvertent Activation",
  },
  {
    id: "b3q14",
    question: "What is the correct response to an OIL PRESSURE LOW warning on the B350?",
    options: [
      "Monitor — land at next scheduled destination",
      "Reduce power on affected engine, monitor, prepare for OEI, land as soon as possible",
      "Shut down engine immediately",
      "Increase power to maintain oil flow"
    ],
    correctIndex: 1,
    explanation: "OIL PRESSURE LOW: Reduce power on affected engine to minimum required for flight, monitor oil temp and pressure, prepare for possible OEI, and land as soon as possible at nearest suitable aerodrome.",
    source: "B350 QRH (AVM004h) — Section 3: Abnormal Procedures — Oil Pressure Low",
  },
  {
    id: "b3q15",
    question: "What is the maximum duration for takeoff power (ITT 820°C range) on the B350?",
    options: ["2 minutes", "5 minutes", "10 minutes", "Continuous"],
    correctIndex: 1,
    explanation: "Maximum takeoff power (820°C ITT range) is limited to 5 minutes on the B350 PT6A-60A engines. Exceeding this limit requires engine inspection.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Engine",
  },
  {
    id: "b3q16",
    question: "If the B350 displays an ICING condition with the de-ice system inoperative, the recommended action is:",
    options: [
      "Maintain altitude and notify ATC",
      "Exit icing conditions immediately — climb, descend, or divert",
      "Increase airspeed to VMO",
      "Continue if ice accretion is slow"
    ],
    correctIndex: 1,
    explanation: "With the de-ice system inoperative, the B350 must exit icing conditions immediately by climbing, descending, or diverting to a different route. Continued flight in icing without protection risks uncontrolled ice accretion.",
    source: "B350 QRH (AVM004h) — Section 3: Abnormal Procedures — Ice Protection Failure",
  },
  {
    id: "b3q17",
    question: "What is the B350 response to a BATTERY BUS OFF warning?",
    options: [
      "Land immediately — aircraft is uncontrollable",
      "Check main bus tie, restore battery bus via circuit breaker or alternate path",
      "Shut down all electrical systems",
      "No immediate action required"
    ],
    correctIndex: 1,
    explanation: "BATTERY BUS OFF: Check bus tie switch and alternate electrical paths. The battery bus powers essential standby equipment. Follow QRH electrical abnormal procedures to restore the bus or isolate the fault.",
    source: "B350 QRH (AVM004h) — Section 3: Abnormal Procedures — Electrical",
  },
  {
    id: "b3q18",
    question: "Following a B350 propeller overspeed, which action prevents further damage?",
    options: [
      "Increase power to overcome overspeed",
      "Condition Lever FUEL CUTOFF on affected engine",
      "Retard Power Lever on affected engine and move Prop Lever towards FEATHER",
      "Engage AUTOFEATHER manually"
    ],
    correctIndex: 2,
    explanation: "Propeller overspeed recovery: Retard the Power Lever on the affected engine to reduce torque, and move the Prop Lever toward FEATHER to reduce RPM. If overspeed cannot be controlled, execute engine shutdown.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Propeller Overspeed",
  },
  {
    id: "b3q19",
    question: "What is the purpose of the B350 AUTOFEATHER system?",
    options: [
      "Automatically feathers both propellers during shutdown",
      "Automatically feathers the propeller of a failed engine at low torque during takeoff/go-around",
      "Maintains prop sync in cruise automatically",
      "Arms the propeller brake during shutdown"
    ],
    correctIndex: 1,
    explanation: "AUTOFEATHER automatically feathers the propeller of an engine that loses torque below 19% during takeoff or go-around, reducing asymmetric drag and improving OEI climb performance.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Propeller / Autofeather",
  },
  {
    id: "b3q20",
    question: "During a B350 rejected takeoff at high speed, what action sequence is used?",
    options: [
      "Throttles idle → Brakes maximum → Reverse not recommended",
      "Brakes maximum → Throttles idle → Condition levers FUEL CUTOFF",
      "Throttles idle → Prop levers FEATHER → Maximum braking",
      "Continue takeoff — do not reject above V1"
    ],
    correctIndex: 0,
    explanation: "RTO (Rejected Takeoff) sequence: Power Levers IDLE → Maximum Braking. Propeller reverse is NOT recommended as it may cause directional control issues. If below V1 and a stop can be made, reject. Above V1, continue.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Rejected Takeoff",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM B4 — B350 Systems Knowledge
// Source: B350 QRH Section 2, B350 AFM
// ─────────────────────────────────────────────────────────────
const examB4Questions: ExamQuestion[] = [
  {
    id: "b4q01",
    question: "What engine type powers the B350?",
    options: ["PT6A-42A", "PT6A-52", "PT6A-60A", "PT6A-67D"],
    correctIndex: 2,
    explanation: "The B350 is powered by two Pratt & Whitney Canada PT6A-60A turboprop engines, each rated at 1,050 shaft horsepower for takeoff.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Powerplant",
  },
  {
    id: "b4q02",
    question: "What is the normal propeller RPM range for the B350 in cruise?",
    options: ["1,500–1,600 RPM", "1,600–1,700 RPM", "1,700–1,750 RPM", "1,750–1,800 RPM"],
    correctIndex: 2,
    explanation: "Normal cruise propeller RPM for the B350 is 1,700–1,750 RPM. Maximum RPM is 1,750 continuous. Prop sync keeps both engines matched to minimise cabin vibration.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Propeller",
  },
  {
    id: "b4q03",
    question: "What hydraulic system pressure does the B350 operate at?",
    options: ["1,500 PSI", "2,000 PSI", "3,000 PSI", "1,000 PSI"],
    correctIndex: 1,
    explanation: "The B350 hydraulic system operates at 2,000 PSI. The system powers the landing gear, brakes, and nosewheel steering.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Hydraulics",
  },
  {
    id: "b4q04",
    question: "The B350 uses which type of de-icing system for wing and tail surfaces?",
    options: ["Hot air (pneumatic bleed)", "Electrothermal boots", "Pneumatic rubber boots (inflation/deflation)", "TKS fluid weeping wing"],
    correctIndex: 2,
    explanation: "The B350 uses pneumatic rubber de-ice boots on the wing and tail leading edges. The boots inflate and deflate rapidly to break and shed ice accumulation.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Ice and Rain Protection",
  },
  {
    id: "b4q05",
    question: "What powers the B350 primary flight instruments?",
    options: ["Pitot-static only", "Dual EFIS (Electronic Flight Instrument System) with dual ADCs and IRUs", "Vacuum gyros", "Single EFIS only"],
    correctIndex: 1,
    explanation: "The B350 features a fully integrated EFIS (glass cockpit) with dual Air Data Computers (ADCs) and dual Inertial Reference Units (IRUs) providing redundant primary flight information.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Avionics / EFIS",
  },
  {
    id: "b4q06",
    question: "What is the B350 total usable fuel capacity?",
    options: ["384 US gal (2,576 lb)", "544 US gal (3,645 lb)", "648 US gal (4,354 lb)", "700 US gal (4,700 lb)"],
    correctIndex: 1,
    explanation: "The B350 holds approximately 544 US gallons (3,645 lb) of usable fuel in wing and nacelle tanks, giving it significantly greater range than the B200.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Fuel",
  },
  {
    id: "b4q07",
    question: "On the B350, what is the function of the CROSSFEED valve?",
    options: [
      "Transfers fuel between nose and tail tanks",
      "Allows either engine to draw fuel from either wing tank",
      "Controls fuel flow to the APU",
      "Isolates a leaking tank"
    ],
    correctIndex: 1,
    explanation: "The crossfeed valve allows either engine to draw fuel from either wing fuel tank. This is used during OEI operations to feed the operating engine from both tanks, extending endurance.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Fuel",
  },
  {
    id: "b4q08",
    question: "The B350 pressurisation system uses bleed air from which source?",
    options: ["Dedicated compressor", "Engine compressor bleed air (both engines)", "Auxiliary Power Unit (APU)", "Ground power only"],
    correctIndex: 1,
    explanation: "The B350 pressurisation and air conditioning system is supplied by bleed air extracted from the compressor section of both PT6A-60A engines.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Environmental Control",
  },
  {
    id: "b4q09",
    question: "How many generators does the B350 electrical system have?",
    options: ["One (right engine only)", "Two (one per engine)", "Two generators plus APU", "Three (two engines + standby)"],
    correctIndex: 1,
    explanation: "The B350 has two generators, one driven by each engine. They operate in parallel to power the main bus. Loss of one generator is automatically compensated by the remaining generator.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Electrical",
  },
  {
    id: "b4q10",
    question: "What is the B350 main bus operating voltage?",
    options: ["14 VDC", "24–28 VDC", "110 VAC", "28 VAC / 14 VDC split bus"],
    correctIndex: 1,
    explanation: "The B350 operates a 28 VDC electrical system, with generators producing 28 VDC and the battery providing 24 VDC backup. AC power is available from inverters for specific avionics.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Electrical",
  },
  {
    id: "b4q11",
    question: "What type of autopilot does the B350 use in RFDS SE configuration?",
    options: ["Single-axis (roll only)", "Dual-axis (pitch + roll)", "Three-axis with autothrottle", "No autopilot fitted"],
    correctIndex: 2,
    explanation: "The B350 in RFDS SE configuration is equipped with a three-axis autopilot (pitch, roll, yaw damper) with optional autothrottle, integrated with the EFIS/FMS for coupled approaches.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Autopilot",
  },
  {
    id: "b4q12",
    question: "What is the function of the B350 Yaw Damper?",
    options: [
      "Automatically corrects for engine failure",
      "Reduces dutch roll tendency in cruise",
      "Controls asymmetric thrust on one engine",
      "Activates during crosswind landing"
    ],
    correctIndex: 1,
    explanation: "The Yaw Damper uses the autopilot yaw channel to dampen dutch roll oscillations, providing a more stable ride in turbulence and during high-altitude cruise.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Autopilot / Yaw Damper",
  },
  {
    id: "b4q13",
    question: "The B350 fuel system uses what type of fuel transfer between tanks during normal operations?",
    options: ["Manual pump transfer only", "Gravity feed between wingtip and nacelle tanks", "Automatic engine-driven fuel pumps with electric boost pumps", "Crossfeed only"],
    correctIndex: 2,
    explanation: "The B350 uses engine-driven fuel pumps as primary supply, with electric boost pumps in each tank for start, takeoff, landing, and as backup. Transfer between tank segments is automatic.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Fuel",
  },
  {
    id: "b4q14",
    question: "What is the maximum propeller RPM limit for the B350?",
    options: ["1,600 RPM", "1,700 RPM", "1,750 RPM", "1,900 RPM"],
    correctIndex: 2,
    explanation: "Maximum propeller RPM for the B350 is 1,750 RPM. The governors prevent exceedance under normal conditions, but overspeed is possible during certain failure modes.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Propeller",
  },
  {
    id: "b4q15",
    question: "What type of brakes does the B350 use?",
    options: ["Drum brakes — hydraulic", "Disc brakes — hydraulic with anti-skid", "Drum brakes — pneumatic", "Disc brakes — manual only"],
    correctIndex: 1,
    explanation: "The B350 uses hydraulic disc brakes with an integrated anti-skid system (Hydro-Aire type) to prevent wheel lockup and maximise braking efficiency on contaminated runways.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Landing Gear / Brakes",
  },
  {
    id: "b4q16",
    question: "What is the B350 minimum engine starting temperature (OAT)?",
    options: ["-40°C", "-54°C", "-65°C", "No restriction"],
    correctIndex: 1,
    explanation: "The B350 PT6A-60A can be started in temperatures as low as -54°C (-65°F). Below this temperature, special cold-weather procedures (pre-heating) are required.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Environment",
  },
  {
    id: "b4q17",
    question: "The B350 wing de-ice boots should be activated when:",
    options: [
      "Icing is anticipated",
      "After approximately ¼ to ½ inch of ice has accumulated on the leading edge",
      "At first entry into IMC",
      "Only when the wing ice light illuminates"
    ],
    correctIndex: 1,
    explanation: "B350 wing de-ice boots should be allowed to accumulate ¼ to ½ inch of ice before activating, as boots need something to push against to break the ice. Premature activation can mould ice to the boot shape.",
    source: "B350 QRH (AVM004h) — Section 4: Normal Procedures — Ice & Rain Protection",
  },
  {
    id: "b4q18",
    question: "On the B350, what does the AUTOFEATHER ARMED light indicate?",
    options: [
      "Both engines are in autofeather mode",
      "The autofeather system is armed and will trigger if torque drops below ~19% on either engine",
      "Propeller feathering is in progress",
      "Autofeather has been manually selected"
    ],
    correctIndex: 1,
    explanation: "AUTOFEATHER ARMED light confirms the system is primed to automatically feather a propeller if engine torque drops below approximately 19% (engine failure threshold) during takeoff or go-around phase.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Propeller / Autofeather",
  },
  {
    id: "b4q19",
    question: "What is the B350 maximum altitude for landing gear extension (VLE)?",
    options: ["35,000 ft", "20,000 ft", "No altitude restriction", "15,000 ft"],
    correctIndex: 2,
    explanation: "There is no altitude restriction for landing gear extension on the B350 — the limitation is airspeed (VLE 200 KIAS). The gear can be extended at any altitude for emergency use.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Landing Gear",
  },
  {
    id: "b4q20",
    question: "The B350 pitot-static system has how many pitot probes?",
    options: ["One (Captain only)", "Two (Captain and Co-pilot)", "Three (Captain, Co-pilot, Standby)", "Four (dual redundancy)"],
    correctIndex: 2,
    explanation: "The B350 has three pitot probes: Captain, Co-pilot, and Standby. Each provides independent airspeed data to prevent single-point failure of the airspeed system.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Pitot-Static",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM B5 — B350 Performance & Weight/Balance
// Source: B350 AFM Performance Charts, RFDS SE Operations
// ─────────────────────────────────────────────────────────────
const examB5Questions: ExamQuestion[] = [
  {
    id: "b5q01",
    question: "For the B350, what is the typical TAS in cruise at FL250 under ISA conditions?",
    options: ["240 KTAS", "270 KTAS", "300 KTAS", "320 KTAS"],
    correctIndex: 1,
    explanation: "The B350 achieves approximately 270 KTAS in cruise at FL250 under ISA conditions — consistent with RFDS SE mission planning figures used in the system (270 kts TAS).",
    source: "B350 AFM — Section 5: Performance / RFDS SE Operations",
  },
  {
    id: "b5q02",
    question: "What is the approximate range of the B350 at long-range cruise with full fuel?",
    options: ["800 NM", "1,200 NM", "1,800 NM", "2,200 NM"],
    correctIndex: 2,
    explanation: "The B350 has a range of approximately 1,800 NM at long-range cruise (LRC) with full fuel load, making it suitable for longer RFDS SE inter-base transfers and aeromedical sectors.",
    source: "B350 AFM — Section 5: Performance",
  },
  {
    id: "b5q03",
    question: "The B350 fuel burn in cruise at FL250 at normal cruise power is approximately:",
    options: ["200 lb/hr total", "400 lb/hr total", "600–700 lb/hr total", "900 lb/hr total"],
    correctIndex: 2,
    explanation: "The B350 burns approximately 600–700 lb/hr total (both engines) in normal cruise at FL250. Actual fuel burn varies with weight, altitude, temperature, and power setting.",
    source: "B350 AFM — Section 5: Performance / Cruise",
  },
  {
    id: "b5q04",
    question: "In B350 performance planning, what is the ISA deviation (ISA+) used to account for?",
    options: ["Wind component", "Temperature above standard (15°C at sea level)", "Magnetic variation", "Humidity effects"],
    correctIndex: 1,
    explanation: "ISA deviation (ISA+) represents how much the actual ambient temperature exceeds the International Standard Atmosphere temperature (15°C at sea level, reducing at altitude). Higher ISA+ reduces engine performance and increases takeoff distance.",
    source: "B350 AFM — Section 5: Performance / ISA Conditions",
  },
  {
    id: "b5q05",
    question: "If runway elevation is 2,400 ft AMSL (Dubbo — YSDU) on an ISA+15 day, the B350 pilot should expect:",
    options: [
      "No performance change from sea-level values",
      "Significantly increased takeoff distance and reduced climb rate",
      "Improved performance due to lower air density",
      "No change in performance as B350 is turbocharged"
    ],
    correctIndex: 1,
    explanation: "High density altitude (from elevation + temperature) reduces air density, which increases takeoff distance, extends ground roll, and reduces climb rate. B350 performance must be checked against the density altitude on the day.",
    source: "B350 AFM — Section 5: Performance / Takeoff",
  },
  {
    id: "b5q06",
    question: "How does a wet or contaminated runway affect B350 takeoff performance?",
    options: [
      "No effect — the B350 uses nose-wheel steering only",
      "Increases ground roll and accelerate-stop distance",
      "Reduces ground roll due to improved traction",
      "No change in balanced field length"
    ],
    correctIndex: 1,
    explanation: "Wet or contaminated runways increase ground roll and accelerate-stop distance due to reduced braking effectiveness and potential hydroplaning. Contaminated runway corrections must be applied to performance data.",
    source: "B350 AFM — Section 5: Performance / Runway Contamination",
  },
  {
    id: "b5q07",
    question: "For B350 weight and balance, the CG envelope must remain within limits:",
    options: ["For takeoff only", "For takeoff and landing, with in-flight fuel burn considered", "At the moment of loading only", "CG is not critical for turboprop aircraft"],
    correctIndex: 1,
    explanation: "CG must remain within the approved envelope for takeoff, throughout flight as fuel burns off, and at landing weight. Fuel burn shifts CG — this must be checked across the entire flight.",
    source: "B350 AFM — Section 6: Weight and Balance",
  },
  {
    id: "b5q08",
    question: "The B350 Balanced Field Length concept means:",
    options: [
      "The runway must be flat and level",
      "Accelerate-stop distance equals the takeoff distance over a 35 ft obstacle at V1",
      "Both engines must have equal thrust",
      "Takeoff distance equals landing distance"
    ],
    correctIndex: 1,
    explanation: "Balanced Field Length means V1 is selected such that the distance to stop (rejected takeoff) equals the distance to clear a 35 ft obstacle (continued takeoff). This maximises the safety of both options.",
    source: "B350 AFM — Section 5: Performance / Balanced Field",
  },
  {
    id: "b5q09",
    question: "On the B350, what effect does a 10-knot headwind have on takeoff performance?",
    options: [
      "Increases ground roll by 10%",
      "Reduces ground roll and total takeoff distance",
      "No effect — performance charts assume no wind",
      "Increases rotation speed"
    ],
    correctIndex: 1,
    explanation: "A headwind reduces groundspeed at rotation, shortening ground roll and total takeoff distance. Performance charts provide headwind correction factors — typically a 10-knot headwind reduces takeoff distance by 10–15%.",
    source: "B350 AFM — Section 5: Performance / Takeoff / Wind",
  },
  {
    id: "b5q10",
    question: "What is the effect of operating the B350 at higher weights on approach and landing speed?",
    options: [
      "No change — VREF is fixed",
      "Higher weight requires a higher VREF and longer landing roll",
      "Higher weight allows a lower approach speed",
      "Weight only affects takeoff, not landing speeds"
    ],
    correctIndex: 1,
    explanation: "VREF increases with aircraft weight on the B350. A heavier aircraft stalls at a higher speed, so VREF (typically 1.3 × stall speed) is correspondingly higher, resulting in a faster approach and longer landing roll.",
    source: "B350 AFM — Section 5: Performance / Landing",
  },
  {
    id: "b5q11",
    question: "What is the approved fuel type for the B350 PT6A-60A?",
    options: ["AVGAS 100LL only", "JET A, JET A-1, or Jet B (to ASTM D1655)", "MOGAS (unleaded petrol)", "Any aviation fuel"],
    correctIndex: 1,
    explanation: "The B350's PT6A-60A engines are certified for JET A, JET A-1, and Jet B turbine fuels conforming to ASTM D1655. Wide-cut Jet B requires a penalty fuel flow correction at high altitudes.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Fuel",
  },
  {
    id: "b5q12",
    question: "The RFDS SE B350 hourly charter rate used in Medivac.ai is:",
    options: ["$3,200/hr", "$4,000/hr", "$4,800/hr", "$6,000/hr"],
    correctIndex: 2,
    explanation: "The RFDS SE B350 operates at a rate of $4,800/hr in the Medivac.ai cost and charter system, reflecting the higher operating costs of the B350 compared to the B200 ($4,000/hr).",
    source: "RFDS SE Operations / Medivac.ai Charter Rate Card",
  },
  {
    id: "b5q13",
    question: "The B350 has a standard seating capacity in aeromedical configuration of approximately:",
    options: ["4 patients", "2 stretchers + 2 attendants + 2 crew", "3 stretchers + crew", "6 passenger seats"],
    correctIndex: 1,
    explanation: "In standard RFDS SE aeromedical configuration, the B350 accommodates 2 stretchers + 2 medical attendants + 2 crew (captain and first officer), allowing tandem patient transport.",
    source: "RFDS SE Operations / B350 Aeromedical Configuration",
  },
  {
    id: "b5q14",
    question: "To calculate Pressure Altitude from indicated altitude, you:",
    options: [
      "Add QNH to the indicated altitude",
      "Set altimeter to 1013.25 hPa (29.92 inHg) — the reading is pressure altitude",
      "Subtract the aerodrome elevation",
      "Apply temperature correction only"
    ],
    correctIndex: 1,
    explanation: "Pressure Altitude is obtained by setting the altimeter subscale to 1013.25 hPa (29.92 inHg standard). The resulting altimeter reading is pressure altitude, used for flight level operations and performance calculations.",
    source: "B350 AFM — Section 5: Performance / Definitions",
  },
  {
    id: "b5q15",
    question: "Density Altitude is defined as:",
    options: [
      "The altitude shown on the altimeter",
      "Pressure altitude corrected for non-standard temperature",
      "The height above the aerodrome in feet",
      "Mean sea level altitude"
    ],
    correctIndex: 1,
    explanation: "Density Altitude is Pressure Altitude corrected for non-standard temperature. High density altitude (hot, high, humid) reduces air density, degrading engine power and aerodynamic performance.",
    source: "B350 AFM — Section 5: Performance / Definitions",
  },
  {
    id: "b5q16",
    question: "If the B350 is operating at MTOW of 15,000 lb and fuel burn is 650 lb/hr, what is the approximate landing weight after 2 hours?",
    options: ["13,700 lb", "13,000 lb", "14,350 lb", "12,500 lb"],
    correctIndex: 0,
    explanation: "650 lb/hr × 2 hrs = 1,300 lb fuel burned. 15,000 − 1,300 = 13,700 lb landing weight. This is below MLW of 14,500 lb, so no early dump of fuel is required.",
    source: "B350 AFM — Section 5: Performance / Fuel Planning",
  },
  {
    id: "b5q17",
    question: "The B350's Net Takeoff Flight Path must clear obstacles by what minimum vertical margin?",
    options: ["15 ft", "35 ft", "50 ft", "200 ft"],
    correctIndex: 1,
    explanation: "The B350 net takeoff flight path must clear all obstacles in the departure path by a minimum of 35 ft (gross path minus net path gradient correction).",
    source: "B350 AFM — Section 5: Performance / Obstacle Clearance",
  },
  {
    id: "b5q18",
    question: "When applying wind corrections for B350 takeoff performance, what percentage of headwind component is typically used?",
    options: ["100% of headwind, 150% of tailwind", "50% of headwind, 150% of tailwind", "50% of headwind, 100% of tailwind", "100% of headwind, 100% of tailwind"],
    correctIndex: 1,
    explanation: "Standard wind corrections: take credit for only 50% of the headwind component (conservative), and use 150% of any tailwind component (conservative for tailwind operations).",
    source: "B350 AFM — Section 5: Performance / Wind Corrections",
  },
  {
    id: "b5q19",
    question: "What is the maximum tailwind component for B350 takeoff and landing?",
    options: ["5 knots", "10 knots", "15 knots", "No tailwind permitted"],
    correctIndex: 1,
    explanation: "Maximum demonstrated tailwind component for B350 takeoff and landing is 10 knots. Tailwinds significantly increase ground roll and balanced field length.",
    source: "B350 QRH (AVM004h) — Section 1: Limitations",
  },
  {
    id: "b5q20",
    question: "When calculating B350 landing distance, which correction factor increases the required distance most significantly?",
    options: ["Light winds", "ISA temperature conditions", "Wet/contaminated runway", "Lower aircraft weight"],
    correctIndex: 2,
    explanation: "A wet or contaminated runway has the most significant effect on landing distance, typically increasing it by 40–100% depending on contamination type (wet, slush, snow, ice).",
    source: "B350 AFM — Section 5: Performance / Landing Distance",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM B6 — B350 vs B200 Comparison (Differences Training)
// Critical for RFDS SE multi-type endorsed pilots
// ─────────────────────────────────────────────────────────────
const examB6Questions: ExamQuestion[] = [
  {
    id: "b6q01",
    question: "What is the MTOW difference between the B350 and the B200?",
    options: ["500 lb", "1,500 lb", "2,500 lb", "5,000 lb"],
    correctIndex: 2,
    explanation: "B350 MTOW is 15,000 lb; B200 MTOW is 12,500 lb — a difference of 2,500 lb. This extra weight capacity allows the B350 to carry more fuel, payload, or medical equipment.",
    source: "B350 QRH (AVM004h) & B200 Memory Flash Cards — Limitations Comparison",
  },
  {
    id: "b6q02",
    question: "The B350 is powered by PT6A-60A engines. How do these compare to the B200's PT6A-42A?",
    options: [
      "PT6A-60A has less power — optimised for fuel economy",
      "PT6A-60A produces more power (1,050 SHP vs 850 SHP) and has greater high-altitude performance",
      "Both engines produce identical power",
      "PT6A-60A is a jet engine, not turboprop"
    ],
    correctIndex: 1,
    explanation: "The PT6A-60A in the B350 produces 1,050 SHP for takeoff vs the B200's PT6A-42A at 850 SHP — 200 more SHP per engine. This gives the B350 superior climb performance and higher cruise altitude capability.",
    source: "B350 & B200 AFM — Powerplant Comparison",
  },
  {
    id: "b6q03",
    question: "The B350 VMCA is 96 KIAS vs the B200 VMCA of 86 KIAS. Why is the B350 VMCA higher?",
    options: [
      "Heavier aircraft always have higher VMCA",
      "Larger, more powerful engines produce greater asymmetric yawing moment at the critical engine failure",
      "B350 has larger vertical stabiliser",
      "B350 uses different propellers"
    ],
    correctIndex: 1,
    explanation: "Higher engine power (PT6A-60A at 1,050 SHP) produces greater thrust, and therefore greater yawing moment when one engine fails. More rudder input — and therefore more speed — is required to maintain directional control.",
    source: "B350 QRH (AVM004h) & B200 Memory Flash Cards — VMCA Comparison",
  },
  {
    id: "b6q04",
    question: "The B350 has a higher service ceiling (35,000 ft) than the B200 (31,000 ft). What is the primary benefit for RFDS SE operations?",
    options: [
      "B350 can carry more patients at high altitude",
      "Higher ceilings allow flight above more weather, improving reliability on long sectors",
      "Higher ceiling means lower fuel burn",
      "No operational benefit — RFDS SE stays below FL250"
    ],
    correctIndex: 1,
    explanation: "A 35,000 ft ceiling allows the B350 to fly above more weather systems on long-haul RFDS SE aeromedical sectors, improving schedule reliability and passenger comfort.",
    source: "B350 AFM & RFDS SE Operations — Ceiling Comparison",
  },
  {
    id: "b6q05",
    question: "In the Medivac.ai system, the B350 TAS is 270 kts vs the B200 at 240 kts. How does this affect a 600 NM sector?",
    options: [
      "No difference — both arrive at the same time",
      "B350 is approximately 16 minutes faster",
      "B350 is approximately 30 minutes faster",
      "B200 is faster due to lower weight"
    ],
    correctIndex: 1,
    explanation: "At 600 NM: B200 time = 600/240 = 2.5 hrs; B350 time = 600/270 = 2.22 hrs — saving approximately 16.7 minutes. On aeromedical missions, this time saving can be clinically significant.",
    source: "RFDS SE Operations / Medivac.ai System — Aircraft Performance",
  },
  {
    id: "b6q06",
    question: "What is the key difference between B350 and B200 de-ice boot operation?",
    options: [
      "B350 uses hot air bleed; B200 uses pneumatic boots",
      "Both use identical pneumatic boot systems — no significant difference",
      "B350 has larger boot coverage area due to longer wing span",
      "B200 has no de-ice boots"
    ],
    correctIndex: 2,
    explanation: "Both aircraft use pneumatic de-ice boots, but the B350 has greater wing span (57.9 ft vs 54.6 ft) resulting in larger boot coverage area. Activation procedures and principles are identical.",
    source: "B350 & B200 AFM — Systems Comparison / Ice Protection",
  },
  {
    id: "b6q07",
    question: "On RFDS SE, what determines whether a B200 or B350 is dispatched for a mission?",
    options: [
      "Only the medical team's preference",
      "Patient weight, sector length, medical equipment requirements, crew endorsement, and aircraft availability",
      "First available aircraft regardless of mission",
      "B350 is always used for aeromedical; B200 only for charters"
    ],
    correctIndex: 1,
    explanation: "Aircraft selection depends on: patient number/weight, sector distance (B350 for longer range), medical equipment loading, crew endorsement currency on type, and aircraft availability from the base.",
    source: "RFDS SE Operations / Dispatch Procedures",
  },
  {
    id: "b6q08",
    question: "The B350 maximum landing weight (14,500 lb) is how much more than the B200 MLW (12,500 lb)?",
    options: ["500 lb", "1,000 lb", "2,000 lb", "3,000 lb"],
    correctIndex: 2,
    explanation: "B350 MLW of 14,500 lb vs B200 MLW of 12,500 lb = 2,000 lb difference. This allows the B350 to carry heavier payloads (patients, medical equipment, fuel) to landing.",
    source: "B350 QRH (AVM004h) & B200 Memory Flash Cards — Limitations Comparison",
  },
  {
    id: "b6q09",
    question: "The B350 uses PT6A-60A engines rated at 1,050 SHP vs B200 PT6A-42A at 850 SHP. What limitation applies uniquely to the higher-power B350 engines?",
    options: [
      "Higher oil change interval required",
      "Higher VMCG (88 vs 86 KIAS) requiring longer runway for safety",
      "Requires 100LL fuel only",
      "No unique limitations — more power is always better"
    ],
    correctIndex: 1,
    explanation: "Higher engine power results in higher VMCG (88 KIAS on B350 vs 86 KIAS on B200), meaning a greater groundspeed is needed for rudder effectiveness at engine failure, requiring performance-limited runway assessments.",
    source: "B350 QRH (AVM004h) & B200 Memory Flash Cards — VMCG Comparison",
  },
  {
    id: "b6q10",
    question: "Both B200 and B350 use the same type of QRH colour coding. What does RED indicate?",
    options: ["Low priority items", "Memory items — must be completed without reference", "Caution items", "Ground-only procedures"],
    correctIndex: 1,
    explanation: "RED items in both the B200 and B350 QRH are MEMORY ITEMS — critical emergency actions that must be performed from memory without reference to any checklist. Immediate action prevents further damage or loss of control.",
    source: "B350 QRH (AVM004h) & B200 QRH (AVM004c) — Introduction",
  },
  {
    id: "b6q11",
    question: "The B350 VYSE is 127 KIAS vs the B200 VYSE of 121 KIAS. A pilot transitioning from B200 must remember to:",
    options: [
      "Fly 6 knots faster on OEI climb",
      "Fly 6 knots slower on OEI climb",
      "Use the same speed — VYSE is identical",
      "Use B200 speeds as they are conservative"
    ],
    correctIndex: 0,
    explanation: "B350 VYSE is 127 KIAS — 6 knots faster than the B200's 121 KIAS. Flying at B200 VYSE (121 KIAS) on the B350 would result in a sub-optimal OEI climb and risk operating below the charted VYSE.",
    source: "B350 QRH (AVM004h) & B200 Memory Flash Cards — OEI Speeds",
  },
  {
    id: "b6q12",
    question: "The B350 has a MZFW of 14,000 lb. If the OEW (Operating Empty Weight) is 9,400 lb, what is the maximum payload?",
    options: ["3,600 lb", "4,600 lb", "5,600 lb", "4,100 lb"],
    correctIndex: 1,
    explanation: "Max payload = MZFW − OEW = 14,000 − 9,400 = 4,600 lb. This payload includes passengers, crew, cargo, and medical equipment but excludes fuel.",
    source: "B350 AFM — Section 6: Weight and Balance",
  },
  {
    id: "b6q13",
    question: "How does the B350's EFIS glass cockpit differ from older B200 steam-gauge variants?",
    options: [
      "No difference — both aircraft have identical avionics",
      "B350 EFIS integrates ADCs, IRUs, FMS and displays on large multi-function screens",
      "B200 has more advanced avionics than B350",
      "B350 uses analogue instruments only"
    ],
    correctIndex: 1,
    explanation: "The B350 features an integrated EFIS (Proline/ProLine 21 or similar) with multi-function displays (MFDs), dual ADCs, IRUs, and a fully coupled FMS. This provides significantly more situational awareness than analogue B200 variants.",
    source: "B350 QRH (AVM004h) — Section 2: Systems — Avionics",
  },
  {
    id: "b6q14",
    question: "If the B350 AUTOFEATHER system activates in flight, what must the crew verify first?",
    options: [
      "Which engine feathered and confirm failure",
      "Immediately shut down both engines",
      "Declare emergency on 121.5 MHz first",
      "Engage autopilot"
    ],
    correctIndex: 0,
    explanation: "When AUTOFEATHER activates, the first crew action is to identify which engine has feathered (confirm the failure) and then execute OEI memory items for that engine. The B200 does not have AUTOFEATHER — this is a key B350 difference.",
    source: "B350 QRH (AVM004h) — Section 3: Emergency Procedures — Engine Failure / Autofeather",
  },
  {
    id: "b6q15",
    question: "The B350 maximum differential pressure limitation of 6.5 PSI, compared to the B200's 6.0 PSI, means:",
    options: [
      "B350 can maintain a lower cabin altitude at high flight levels",
      "B350 has a weaker pressure vessel",
      "B200 has better cabin comfort at cruise",
      "No difference — both are equivalent"
    ],
    correctIndex: 0,
    explanation: "Higher max differential pressure (6.5 vs 6.0 PSI) means the B350 can maintain a lower (more comfortable and physiologically better) cabin altitude at its higher cruise altitudes (e.g., FL350).",
    source: "B350 QRH (AVM004h) — Section 1: Limitations / Pressurisation",
  },
  {
    id: "b6q16",
    question: "For RFDS SE endurance planning, approximately how much longer can the B350 fly than the B200 with full fuel?",
    options: [
      "Same endurance — both are limited to 4 hours",
      "B350 has approximately 2–3 hours more endurance",
      "B200 has more endurance due to lower fuel burn",
      "Endurance is crew fatigue limited, not fuel limited"
    ],
    correctIndex: 1,
    explanation: "B350 usable fuel ~3,645 lb at ~650 lb/hr burn = ~5.6 hr endurance. B200 usable fuel ~2,576 lb at ~450 lb/hr burn = ~5.7 hr. However, the B350 can also fly faster to cover more distance. Range is the key advantage, not just raw endurance.",
    source: "B350 AFM & B200 AFM — Section 5: Performance / Fuel",
  },
  {
    id: "b6q17",
    question: "A pilot with B200 endorsement transitioning to B350 must specifically train on which unique B350 system?",
    options: [
      "De-ice boots — not fitted on B200",
      "AUTOFEATHER system — not present on B200",
      "GPS — not available on B200",
      "Oxygen system — different on B350"
    ],
    correctIndex: 1,
    explanation: "The AUTOFEATHER system is a key B350-specific system not present on the B200. Differences training must cover AUTOFEATHER arming, indication, activation criteria, and crew response.",
    source: "B350 QRH (AVM004h) — Section 2: Systems / Differences Training",
  },
  {
    id: "b6q18",
    question: "Both the B200 and B350 are certificated under which airworthiness category?",
    options: ["Normal category", "Commuter category", "Transport category", "Utility category"],
    correctIndex: 1,
    explanation: "Both the B200 and B350 are certificated under the Commuter Category under FAR Part 23, which requires OEI performance, pressurisation, and other commuter airline standards.",
    source: "B350 AFM & B200 AFM — Section 1: General",
  },
  {
    id: "b6q19",
    question: "What is the key V-speed difference a B200 pilot must know when operating the B350 for the first time?",
    options: [
      "Only MTOW is different — V-speeds are the same",
      "Multiple V-speeds differ: VMCA (96 vs 86), VYSE (127 vs 121), VA (190 vs 181), VMO (250 vs 223 KIAS)",
      "Only VMCA changes",
      "V-speeds scale proportionally with weight"
    ],
    correctIndex: 1,
    explanation: "Multiple critical V-speeds differ between aircraft: VMCA 96 vs 86 KIAS, VYSE 127 vs 121 KIAS, VA 190 vs 181 KIAS, VMO 250 vs 223 KIAS. Differences training must address each of these.",
    source: "B350 QRH (AVM004h) & B200 Memory Flash Cards — V-speed Comparison",
  },
  {
    id: "b6q20",
    question: "The B350's heavier MTOW (15,000 vs 12,500 lb) primarily impacts which performance area in RFDS SE outback operations?",
    options: [
      "No impact — all outback strips are suitable",
      "Takeoff and landing distances on short or unpaved outback strips",
      "Only cruise performance",
      "Only fuel range"
    ],
    correctIndex: 1,
    explanation: "At 15,000 lb MTOW on outback strips (often short, unpaved, and at elevation), the B350's higher weight significantly increases required takeoff and landing distances. Weight reduction may be needed for operations from marginal strips.",
    source: "B350 AFM — Section 5: Performance / RFDS SE Outback Operations",
  },
];

// ─────────────────────────────────────────────────────────────
// EXAM B7 — Mixed: B350 Emergency & Limitations
// ─────────────────────────────────────────────────────────────
const examB7Questions: ExamQuestion[] = [
  ...examB1Questions.slice(0, 5),
  ...examB3Questions.slice(0, 5),
  ...examB4Questions.slice(0, 5),
  ...examB5Questions.slice(0, 5),
].map((q, i) => ({ ...q, id: `b7q${String(i + 1).padStart(2, "0")}` }));

// ─────────────────────────────────────────────────────────────
// EXAM B8 — Mixed: B350 Systems & Procedures
// ─────────────────────────────────────────────────────────────
const examB8Questions: ExamQuestion[] = [
  ...examB2Questions.slice(0, 5),
  ...examB4Questions.slice(5, 10),
  ...examB5Questions.slice(5, 10),
  ...examB6Questions.slice(0, 5),
].map((q, i) => ({ ...q, id: `b8q${String(i + 1).padStart(2, "0")}` }));

// ─────────────────────────────────────────────────────────────
// EXAM B9 — Mixed: B350 Performance & Differences
// ─────────────────────────────────────────────────────────────
const examB9Questions: ExamQuestion[] = [
  ...examB5Questions.slice(10, 15),
  ...examB6Questions.slice(5, 10),
  ...examB1Questions.slice(10, 15),
  ...examB3Questions.slice(10, 15),
].map((q, i) => ({ ...q, id: `b9q${String(i + 1).padStart(2, "0")}` }));

// ─────────────────────────────────────────────────────────────
// EXAM B10 — Mixed: Comprehensive B350
// ─────────────────────────────────────────────────────────────
const examB10Questions: ExamQuestion[] = [
  ...examB1Questions.slice(15, 20),
  ...examB2Questions.slice(15, 20),
  ...examB3Questions.slice(15, 20),
  ...examB6Questions.slice(15, 20),
].map((q, i) => ({ ...q, id: `b10q${String(i + 1).padStart(2, "0")}` }));

// ─────────────────────────────────────────────────────────────
// EXAM B11 — Mixed: OEI, Emergencies & Systems
// ─────────────────────────────────────────────────────────────
const examB11Questions: ExamQuestion[] = [
  ...examB3Questions.slice(0, 7),
  ...examB4Questions.slice(10, 17),
  ...examB2Questions.slice(10, 13),
].map((q, i) => ({ ...q, id: `b11q${String(i + 1).padStart(2, "0")}` }));

// ─────────────────────────────────────────────────────────────
// EXAM B12 — Mixed: Full Syllabus B350 Final
// ─────────────────────────────────────────────────────────────
const examB12Questions: ExamQuestion[] = [
  ...examB1Questions.slice(0, 4),
  ...examB2Questions.slice(0, 4),
  ...examB3Questions.slice(0, 4),
  ...examB4Questions.slice(0, 4),
  ...examB5Questions.slice(0, 4),
].map((q, i) => ({ ...q, id: `b12q${String(i + 1).padStart(2, "0")}` }));

// ─────────────────────────────────────────────────────────────
// EXPORT — B350 Exam Bank
// ─────────────────────────────────────────────────────────────
export const EXAMS_B350: Exam[] = [
  {
    id: "b350-exam-01",
    title: "Exam B1 — Limitations & Airspeeds",
    subtitle: "B350 MTOW, V-speeds, VMO/MMO, gear limits, engine limits",
    questions: examB1Questions,
  },
  {
    id: "b350-exam-02",
    title: "Exam B2 — Normal Procedures",
    subtitle: "Start, taxi, takeoff, cruise, approach, landing, shutdown",
    questions: examB2Questions,
  },
  {
    id: "b350-exam-03",
    title: "Exam B3 — Emergency Procedures",
    subtitle: "Engine fire, OEI, cabin altitude, emergency descent, emergency gear extension",
    questions: examB3Questions,
  },
  {
    id: "b350-exam-04",
    title: "Exam B4 — Systems Knowledge",
    subtitle: "PT6A-60A, hydraulics, electrical, fuel, pressurisation, EFIS, de-ice",
    questions: examB4Questions,
  },
  {
    id: "b350-exam-05",
    title: "Exam B5 — Performance & W/B",
    subtitle: "Cruise performance, range, fuel planning, takeoff/landing, W&B, density altitude",
    questions: examB5Questions,
  },
  {
    id: "b350-exam-06",
    title: "Exam B6 — B350 vs B200 Differences",
    subtitle: "V-speeds, weights, systems, AUTOFEATHER, engine comparisons for type endorsement",
    questions: examB6Questions,
  },
  {
    id: "b350-exam-07",
    title: "Exam B7 — Mixed: Emergencies & Limits",
    subtitle: "Combined B350 emergency procedures and limitations",
    questions: examB7Questions,
  },
  {
    id: "b350-exam-08",
    title: "Exam B8 — Mixed: Systems & Procedures",
    subtitle: "Combined B350 systems knowledge and normal procedures",
    questions: examB8Questions,
  },
  {
    id: "b350-exam-09",
    title: "Exam B9 — Mixed: Performance & Differences",
    subtitle: "Combined B350 performance and B200/B350 differences",
    questions: examB9Questions,
  },
  {
    id: "b350-exam-10",
    title: "Exam B10 — Mixed: Comprehensive",
    subtitle: "Full spectrum B350 across all subject areas",
    questions: examB10Questions,
  },
  {
    id: "b350-exam-11",
    title: "Exam B11 — Mixed: OEI & Systems",
    subtitle: "OEI emergencies, systems knowledge, and abnormal procedures",
    questions: examB11Questions,
  },
  {
    id: "b350-exam-12",
    title: "Exam B12 — Final: Full Syllabus",
    subtitle: "Comprehensive final exam covering all B350 syllabus areas",
    questions: examB12Questions,
  },
];
