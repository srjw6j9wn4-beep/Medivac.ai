// ERSA — En Route Supplement Australia
// Aerodromes relevant to RFDS South East Section operations
// NSW · QLD · SA · VIC · ACT · TAS
// Types: AD = Certified Aerodrome, ALA = Air Landing Area, HLS = Helipad/Landing Site

export interface ERSAAerodrome {
  icao: string;
  name: string;
  state: string;
  type: "AD" | "ALA" | "HLS";
  /** Special operational warnings shown in booking/dispatch forms (over-water, apron restrictions, etc.) */
  warning?: string;
  /**
   * NSWAA / Aerodrome Operator notes for Ops to action before flight.
   * Includes wildlife hazard requirements (roo runs, bird patrols), runway inspection
   * contact details, CTAF/UNICOM, fuel availability, after-hours access, and any
   * known aerodrome-specific limitations per ERSA and CASA Part 139 MOS requirements.
   */
  nswaaNote?: string;
}

export const ERSA_AERODROMES: ERSAAerodrome[] = [

  // ── NSW ─────────────────────────────────────────────────────────────────────

  {
    icao: "YSBK", name: "Bankstown", state: "NSW", type: "AD",
    nswaaNote: "Controlled aerodrome — Sydney Approach/Tower operating hours apply. No wildlife hazard inspection required. Fuel (Jet-A1 & AVGAS) available. ATIS on 120.9. Follow published instrument approach procedures.",
  },
  {
    icao: "YSDU", name: "Dubbo", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo/wildlife activity known on runway edges and grassed areas, particularly dawn and dusk. Aerodrome operator conducts daily runway inspections — confirm inspection completed before departure via CTAF 126.1. Fuel (Jet-A1) available 24hr self-serve. After-hours contact: Dubbo Regional Airport +61 2 6801 4450.",
  },
  {
    icao: "YBHI", name: "Broken Hill", state: "NSW", type: "AD",
    nswaaNote: "Significant kangaroo and emu hazard on all runways and taxiways, especially at night and dawn. Roo run (runway inspection sweep) REQUIRED before all night and early-morning operations — contact aerodrome manager to confirm. CTAF 126.1. Fuel (Jet-A1) available. After-hours contact: Far West Council Airport +61 8 8080 3444.",
  },
  {
    icao: "YSSY", name: "Sydney (Kingsford Smith)", state: "NSW", type: "AD",
    nswaaNote: "Major international controlled aerodrome — Sydney Approach/Tower. Bird strike management program in operation; crews report any strikes to ARO. Slots/PPR required for GA parking. Fuel (Jet-A1) 24hr. Gate passes required for airside access — coordinate with Menzies Aviation ground handler.",
  },
  {
    icao: "YMAY", name: "Albury", state: "NSW", type: "AD",
    nswaaNote: "Aerodrome conducts daily wildlife inspections. Kangaroo activity noted in paddocks adjacent to runway — monitor on approach. CTAF 123.0. Fuel (Jet-A1 & AVGAS) available. After-hours contact: AlburyCity Airport +61 2 6023 8880.",
  },
  {
    icao: "YARM", name: "Armidale", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo hazard on Runway 36/18 threshold areas. Airport operator conducts dawn patrol — confirm sweep completed before early-morning operations. CTAF 122.1. Fuel (Jet-A1) available during business hours; after-hours via prior arrangement. Contact: Armidale Regional Airport +61 2 6772 1122.",
  },
  {
    icao: "YBNA", name: "Ballina Byron Gateway", state: "NSW", type: "AD",
    nswaaNote: "Bird hazard (raptors, gulls) near coastal approaches. Wildlife patrols conducted before RPT operations. CTAF 118.1. Fuel (Jet-A1) available. After-hours PPR required for GA — contact Ballina Shire Council Airport +61 2 6681 1858.",
  },
  {
    icao: "YBRN", name: "Balranald", state: "NSW", type: "AD",
    nswaaNote: "HIGH KANGAROO AND WILDLIFE HAZARD — remote Murray River region aerodrome with no permanent staff. ROO RUN REQUIRED before ALL operations. Arrange inspection via Balranald Shire Council before arrival. CTAF 126.7. No fuel available on site — fuel from Mildura or Griffith. PPR: Balranald Shire Council +61 3 5020 1300.",
  },
  {
    icao: "YBTH", name: "Bathurst", state: "NSW", type: "AD",
    nswaaNote: "Wildlife (kangaroo, wombat) activity on grass areas near threshold. Daily runway inspection by ATCO. CTAF 118.4. Fuel (Jet-A1) available during business hours. Contact: Bathurst Regional Airport +61 2 6333 6197.",
  },
  {
    icao: "YBKE", name: "Bourke", state: "NSW", type: "AD",
    nswaaNote: "HIGH KANGAROO & EMU HAZARD — runway incursions regularly reported, especially at dawn, dusk and night. ROO RUN MANDATORY for all dawn/dusk/night operations. Contact aerodrome manager to arrange inspection before arrival. CTAF 126.7. Fuel (Jet-A1) limited — confirm availability 24hr before. After-hours contact: Bourke Shire Council +61 2 6872 2222.",
  },
  {
    icao: "YBRW", name: "Brewarrina", state: "NSW", type: "AD",
    nswaaNote: "REMOTE AERODROME — KANGAROO AND EMU HAZARD on all runway areas. No permanent aerodrome staff. ROO RUN REQUIRED before all operations. Contact local council to arrange inspection before arrival. CTAF 126.7. No fuel on site — nearest at Bourke or Walgett. PPR: Brewarrina Shire Council +61 2 6839 2106. Brewarrina Police +61 2 6839 2007.",
  },
  {
    icao: "YCBA", name: "Cobar", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and emu hazard on runway. ROO RUN required for dawn and dusk arrivals. Aerodrome operator conducts scheduled sweeps — confirm before arrival. CTAF 126.7. Fuel (Jet-A1) available. After-hours contact: Cobar Shire Council +61 2 6836 4522.",
  },
  {
    icao: "YCFS", name: "Coffs Harbour", state: "NSW", type: "AD",
    nswaaNote: "Wildlife management program in operation. Bird hazard (sea birds, raptors) on approaches. CTAF 120.3. Fuel (Jet-A1) 24hr. Contact: Coffs Harbour Airport +61 2 6648 4900.",
  },
  {
    icao: "YCBR", name: "Collarenebri", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and emu hazard on runway. ROO RUN required for dawn and dusk operations. No permanent aerodrome staff. CTAF 126.7. No fuel on site — nearest Jet-A1 at Moree or Walgett. PPR: Moree Plains Shire +61 2 6757 3222. Collarenebri Police +61 2 6757 9244.",
  },
  {
    icao: "YCDO", name: "Condobolin", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and wildlife activity near runway — particularly at dawn and dusk. ROO RUN recommended for early and late operations. CTAF 122.8. Fuel (Jet-A1 & AVGAS) available during business hours; after-hours by prior arrangement. Contact: Lachlan Shire Council +61 2 6895 1900.",
  },
  {
    icao: "YCAH", name: "Coolah", state: "NSW", type: "ALA",
    nswaaNote: "Air Landing Area — unsealed strip. High kangaroo and livestock hazard. ROO RUN AND STOCK CHECK MANDATORY before all operations. Contact local landholder prior to arrival. No fuel. PPR required — contact Warrumbungle Shire Council +61 2 6848 2000.",
  },
  {
    icao: "YCOM", name: "Cooma–Snowy Mountains", state: "NSW", type: "AD",
    nswaaNote: "Deer, kangaroo and wombat activity reported near runway thresholds, especially at night. Seasonal fog and ice hazard in winter — check NOTAMs. CTAF 122.8. Fuel (Jet-A1) available. Contact: Snowy Monaro Regional Council +61 2 6455 0600.",
  },
  {
    icao: "YCBB", name: "Coonabarabran", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and wildlife activity near runway. Dawn inspection conducted by local aerodrome representative. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available during business hours. Contact: Warrumbungle Shire Council +61 2 6849 2000.",
  },
  {
    icao: "YCNM", name: "Coonamble", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo hazard on grassed areas adjacent to runway. ROO RUN recommended for dawn operations. CTAF 126.7. Fuel (AVGAS) available; Jet-A1 — confirm before flight. Contact: Coonamble Shire Council +61 2 6822 1333.",
  },
  {
    icao: "YCTM", name: "Cootamundra", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and wildlife activity on grassed areas. Inspection conducted by aerodrome operator. CTAF 126.7. Fuel (AVGAS) available during business hours. Contact: Cootamundra-Gundagai Regional Council +61 2 6942 2366.",
  },
  {
    icao: "YCWR", name: "Cowra", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and bird strike risk near threshold. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Cowra Shire Council Airport +61 2 6340 2000.",
  },
  {
    icao: "YDLQ", name: "Deniliquin", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and livestock hazard — perimeter fencing periodically compromised. Check NOTAMs for runway condition. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Edward River Council +61 3 5898 3000.",
  },
  {
    icao: "YFBS", name: "Forbes", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo activity reported near runway. Daily inspection by aerodrome operator. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Forbes Shire Council +61 2 6850 2300.",
  },
  {
    icao: "YGTH", name: "Griffith", state: "NSW", type: "AD",
    nswaaNote: "Wildlife (kangaroo, rabbit, bird) hazard management in place. CTAF 118.1. Fuel (Jet-A1) available. Ground van base for RFDS SE. After-hours contact: MidCoast Council Airport Operations +61 2 6969 3600.",
  },
  {
    icao: "YIVL", name: "Inverell", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo activity near runway margins. Dawn inspection by aerodrome operator. CTAF 122.1. Fuel (Jet-A1 & AVGAS) available during business hours. Contact: Inverell Shire Council +61 2 6728 8288.",
  },
  {
    icao: "YLRD", name: "Lightning Ridge", state: "NSW", type: "AD",
    nswaaNote: "HIGH KANGAROO, EMU AND GOAT HAZARD — confirmed feral goat and large kangaroo incursions on runway. ROO RUN REQUIRED for all dawn, dusk and night operations. Arrange via local council or opal field contacts before arrival. CTAF 126.7. Fuel (Jet-A1 & AVGAS) limited — confirm availability before flight. After-hours: Walgett Shire Council +61 2 6828 1399. Lightning Ridge Police +61 2 6829 0299.",
  },
  {
    icao: "YLIS", name: "Lismore", state: "NSW", type: "AD",
    nswaaNote: "Wildlife management program operating. Bird hazard on approaches. CTAF 118.0. Fuel (Jet-A1) available. Contact: Richmond Valley Council Airport +61 2 6621 8800.",
  },
  {
    icao: "YMOR", name: "Moree", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo hazard on runway surrounds, particularly at dawn and dusk. Aerodrome operator conducts daily inspection — confirm completed before early-morning operations. CTAF 118.3. Fuel (Jet-A1 & AVGAS) available. After-hours contact: Moree Plains Shire Council +61 2 6757 3222.",
  },
  {
    icao: "YMRU", name: "Meru / Mungindi", state: "NSW", type: "ALA",
    nswaaNote: "REMOTE ALA — HIGH KANGAROO AND LIVESTOCK HAZARD. ROO RUN MANDATORY before ALL operations. Unsealed surface — inspect after rain for soft patches. No fuel. No permanent staff. PPR: Moree Plains Shire Council +61 2 6757 3222. Mungindi Police +61 2 6757 4204. CTAF 126.7.",
  },
  {
    icao: "YNBR", name: "Narrabri", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and bird hazard noted near thresholds. CTAF 122.1. Fuel (Jet-A1 & AVGAS) available. Contact: Narrabri Shire Council +61 2 6799 6866.",
  },
  {
    icao: "YNAR", name: "Narrandera", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and wildlife hazard near runway thresholds. CTAF 126.7. Fuel (AVGAS) available; Jet-A1 by prior arrangement. Contact: Narrandera Shire Council +61 2 6959 5611.",
  },
  {
    icao: "YNRM", name: "Narromine", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and wildlife activity on runway surrounds. Daily inspection by aerodrome operator. Gliding operations active — monitor CTAF for glider traffic. CTAF 122.5. Fuel (Jet-A1 & AVGAS) available. Contact: Narromine Shire Council +61 2 6889 2800.",
  },
  {
    icao: "YWLM", name: "Newcastle (Williamtown)", state: "NSW", type: "AD",
    nswaaNote: "RAAF base — civil terminal co-located. Military and civilian ATC. Wildlife patrols conducted by RAAF. CTAF N/A — Tower controlled. Fuel (Jet-A1) available. PPR and security clearance required for GA.",
  },
  {
    icao: "YNYN", name: "Nyngan", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo hazard on runway thresholds and grassed areas. ROO RUN recommended for dawn and dusk operations. Aerodrome manager available — contact before arrival. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Bogan Shire Council +61 2 6835 9000. After-hours: Nyngan Police +61 2 6835 9255.",
  },
  {
    icao: "YORG", name: "Orange", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and deer activity noted near runway ends. CTAF 118.4. Fuel (Jet-A1) available. Ground van base for RFDS SE. Contact: Orange City Council Airport +61 2 6393 8000.",
  },
  {
    icao: "YPKS", name: "Parkes", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo hazard on grass areas. Daily inspection by aerodrome operator. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Parkes Shire Council +61 2 6861 2333.",
  },
  {
    icao: "YPMQ", name: "Port Macquarie", state: "NSW", type: "AD",
    nswaaNote: "Wildlife management program in operation. Bird and kangaroo hazard. CTAF 118.0. Fuel (Jet-A1) available 24hr. Contact: Port Macquarie Airport +61 2 6581 8800.",
  },
  {
    icao: "YSCO", name: "Scone", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and bird hazard. Thoroughbred training area nearby — check for horse movements near runway. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Scone Airport +61 2 6545 1600.",
  },
  {
    icao: "YSTW", name: "Tamworth", state: "NSW", type: "AD",
    nswaaNote: "Wildlife management program in operation. Kangaroo and bird patrols conducted. CTAF 118.4. Fuel (Jet-A1) available 24hr. Contact: Tamworth Regional Airport +61 2 6755 8100.",
  },
  {
    icao: "YTRE", name: "Taree", state: "NSW", type: "AD",
    nswaaNote: "Wildlife (kangaroo, bird) patrols conducted. CTAF 118.1. Fuel (Jet-A1) available. Contact: MidCoast Council Airport +61 2 6592 5522.",
  },
  {
    icao: "YTIB", name: "Tibooburra", state: "NSW", type: "AD",
    nswaaNote: "REMOTE OUTBACK AERODROME — HIGH KANGAROO, EMU AND FERAL GOAT HAZARD. ROO RUN MANDATORY before ALL operations regardless of time. No permanent aerodrome staff — arrange runway sweep via Tibooburra NPWS or Tibooburra Police before flight. Sealed runway but animal debris common. No Jet-A1 on site. Limited AVGAS only — confirm availability. Carry extra fuel. Monitor crosswind and dust devils especially in afternoon. No ILS — GPS approach only. After-hours contact: Far West NSW NPWS +61 2 6091 7100. Tibooburra Police +61 2 6091 7004. CTAF 126.7.",
  },
  {
    icao: "YWBR", name: "Walgett", state: "NSW", type: "AD",
    nswaaNote: "HIGH KANGAROO HAZARD — large mobs regularly reported on runway and infield areas at dawn and dusk. ROO RUN REQUIRED before all dawn, dusk and night arrivals and departures. Aerodrome manager conducts sweeps — contact before arrival to confirm. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available — confirm after-hours availability. After-hours contact: Walgett Shire Council +61 2 6828 1399. Emergency: Walgett Police +61 2 6828 1299.",
  },
  {
    icao: "YWAG", name: "Wanaaring", state: "NSW", type: "ALA",
    warning: "⚠️ APRON RESTRICTION — Only ONE aircraft may be scheduled at Wanaaring at a time due to limited apron space. Confirm no other aircraft is booked before proceeding.",
    nswaaNote: "VERY REMOTE ALA — HIGH KANGAROO, EMU AND GOAT HAZARD. ROO RUN MANDATORY before ALL operations. No permanent staff — arrange runway sweep via Bourke Shire Council or local landholder before flight. Unsealed strip — check condition after rain. No fuel. CTAF 126.7. PPR: Bourke Shire Council +61 2 6872 2222. Emergency: Wanaaring Police +61 2 6872 0004.",
  },
  {
    icao: "YWTO", name: "Wentworth", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and bird hazard near Murray–Darling junction. ROO RUN recommended for dawn and dusk. CTAF 126.7. Fuel (AVGAS) available; Jet-A1 by prior arrangement from Mildura. Contact: Wentworth Shire Council +61 3 5027 5027.",
  },
  {
    icao: "YWOL", name: "Shellharbour (Wollongong)", state: "NSW", type: "AD",
    nswaaNote: "Wildlife management program in operation. Bird hazard (coastal species) on approaches. CTAF 118.4. Fuel (Jet-A1) available. Contact: Shellharbour Airport +61 2 4297 1100.",
  },
  {
    icao: "YWYB", name: "Wyalong", state: "NSW", type: "ALA",
    nswaaNote: "ALA — Kangaroo and livestock activity on and near runway. ROO RUN required before dawn and dusk operations. Confirm strip condition before arrival. No fuel on site. Contact: Bland Shire Council +61 2 6972 2266. CTAF 126.7.",
  },
  {
    icao: "YYWG", name: "Wagga Wagga", state: "NSW", type: "AD",
    nswaaNote: "RAAF base — civil terminal co-located. Wildlife management conducted by RAAF ARO. Kangaroo hazard on perimeter — reported to ATC. CTAF N/A — Tower controlled. Fuel (Jet-A1) 24hr. Ground van base for RFDS SE. Security PPR required for GA airside access.",
  },
  {
    icao: "YCNK", name: "Cessnock", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and bird activity near runway. CTAF 126.7. Fuel (AVGAS) available. Contact: Cessnock City Council +61 2 4993 4100.",
  },
  {
    icao: "YWGT", name: "Wangaratta", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo hazard on grass areas. CTAF 122.8. Fuel (Jet-A1 & AVGAS) available. Contact: Rural City of Wangaratta +61 3 5722 0888.",
  },
  {
    icao: "YLKC", name: "Lake Cargelligo", state: "NSW", type: "ALA",
    nswaaNote: "ALA — Kangaroo and sheep hazard near runway. ROO RUN REQUIRED before all operations. Unsealed surface — confirm condition before approach after rain. No fuel on site. PPR: Lachlan Shire Council +61 2 6895 1900. CTAF 126.7.",
  },
  {
    icao: "YMND", name: "Mildura", state: "NSW", type: "AD",
    nswaaNote: "Kangaroo and emu hazard near Menindee Lakes. ROO RUN recommended for dawn and dusk. CTAF 126.7. Fuel (Jet-A1) limited — confirm availability before flight. Contact: Central Darling Shire +61 8 8091 6600.",
  },
  {
    icao: "YMEN", name: "Menindee", state: "NSW", type: "ALA",
    nswaaNote: "REMOTE ALA — HIGH KANGAROO, EMU AND GOAT HAZARD adjacent to Kinchega National Park. ROO RUN MANDATORY before ALL operations. Unsealed strip — inspect for animal debris and soft ground. No fuel. No permanent staff. PPR: Central Darling Shire +61 8 8091 6600. Menindee Police +61 8 8091 4044. CTAF 126.7.",
  },
  {
    icao: "YMUT", name: "Muttama", state: "NSW", type: "ALA",
    nswaaNote: "Air Landing Area — kangaroo and livestock hazard. ROO RUN AND STOCK CHECK REQUIRED. No fuel. PPR via local landholder.",
  },
  {
    icao: "YWHG", name: "White Cliffs", state: "NSW", type: "ALA",
    nswaaNote: "REMOTE ALA — HIGH KANGAROO, EMU AND GOAT HAZARD. ROO RUN MANDATORY before ALL operations. Unsealed surface — check condition after rain; opal mining dust can reduce visibility on approach. No fuel. No permanent staff. PPR: Central Darling Shire +61 8 8091 6600. White Cliffs Police +61 8 8091 6505. CTAF 126.7.",
  },
  {
    icao: "YWTL", name: "Wilcannia", state: "NSW", type: "AD",
    nswaaNote: "REMOTE FAR-WEST AERODROME — HIGH KANGAROO, EMU AND GOAT HAZARD. ROO RUN MANDATORY for ALL dawn, dusk and night operations — no exceptions. No permanent aerodrome staff on site. Arrange runway inspection via Central Darling Shire Council before arrival. Sealed runway — inspect for animal strike debris after sweep. CTAF 126.7. Fuel: Jet-A1 limited availability — confirm at least 24hrs before flight. After-hours contact: Central Darling Shire Council +61 8 8091 6600. Emergency contact: Wilcannia Police +61 8 8091 5210.",
  },

  // ── QLD (RFDS SE boundary routes) ───────────────────────────────────────────

  {
    icao: "YBCG", name: "Gold Coast", state: "QLD", type: "AD",
    nswaaNote: "Controlled international airport. Wildlife management in operation. Tower controlled — ATIS on 128.75. Fuel (Jet-A1) 24hr. PPR for GA parking — contact OCS Ground Handling.",
  },
  {
    icao: "YBBN", name: "Brisbane", state: "QLD", type: "AD",
    nswaaNote: "Major international controlled airport. Wildlife strike management program in operation. ATIS on 126.25. Fuel (Jet-A1) 24hr. Slots required — coordinate with Brisbane Airport GA.",
  },
  {
    icao: "YBSU", name: "Sunshine Coast", state: "QLD", type: "AD",
    nswaaNote: "Wildlife management in operation. Bird hazard on approaches. CTAF/Tower. Fuel (Jet-A1) available. Contact: Sunshine Coast Airport +61 7 5453 1500.",
  },
  {
    icao: "YLHR", name: "Longreach", state: "QLD", type: "AD",
    nswaaNote: "Kangaroo and emu hazard on runway surrounds. Dawn inspection by aerodrome operator. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Central Western QLD Airport +61 7 4658 0600.",
  },
  {
    icao: "YBCV", name: "Charleville", state: "QLD", type: "AD",
    nswaaNote: "HIGH KANGAROO AND EMU HAZARD. Runway inspections conducted by aerodrome operator — confirm completed before arrival. CTAF 126.7. Fuel (Jet-A1) available. Contact: Charleville Airport +61 7 4656 8200.",
  },
  {
    icao: "YBTL", name: "Townsville", state: "QLD", type: "AD",
    nswaaNote: "RAAF Townsville / Townsville Airport — wildlife management program in place. Tower controlled. Fuel (Jet-A1) 24hr. PPR for GA movements — contact Townsville Airport Operations.",
  },
  {
    icao: "YCNF", name: "Cunnamulla", state: "QLD", type: "AD",
    nswaaNote: "Kangaroo and emu hazard. ROO RUN recommended for dawn/dusk operations. CTAF 126.7. Fuel availability — confirm before flight. Contact: Paroo Shire Council +61 7 4655 8400.",
  },
  {
    icao: "YSGE", name: "St George", state: "QLD", type: "AD",
    nswaaNote: "Kangaroo hazard on runway. Dawn inspection by aerodrome operator. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. Contact: Balonne Shire Council +61 7 4620 8800.",
  },
  {
    icao: "YBWN", name: "Bourke (Bourke)", state: "QLD", type: "ALA",
    nswaaNote: "Air Landing Area — KANGAROO AND LIVESTOCK HAZARD. ROO RUN MANDATORY before all operations. No fuel. No permanent staff — PPR required.",
  },
  {
    icao: "YBRK", name: "Rockhampton", state: "QLD", type: "AD",
    nswaaNote: "Wildlife management in operation. Bird hazard (brolgas, raptors) reported. Tower controlled. Fuel (Jet-A1) 24hr. Contact: Rockhampton Airport +61 7 4927 3606.",
  },
  {
    icao: "YBMA", name: "Mount Isa", state: "QLD", type: "AD",
    nswaaNote: "Kangaroo hazard reported near runway. Daily inspection by aerodrome operator. CTAF/Tower. Fuel (Jet-A1) 24hr. Contact: Mount Isa Airport +61 7 4743 2502.",
  },

  // ── SA ───────────────────────────────────────────────────────────────────────

  {
    icao: "YPAD", name: "Adelaide", state: "SA", type: "AD",
    nswaaNote: "International controlled airport. Wildlife management in operation. ATIS on 128.2. Fuel (Jet-A1) 24hr. PPR for GA movements.",
  },
  {
    icao: "YPAG", name: "Port Augusta", state: "SA", type: "AD",
    nswaaNote: "Kangaroo and bird hazard on runway surrounds. Dawn/dusk inspection recommended. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available. After-hours contact: Port Augusta City Council Airport +61 8 8641 9100.",
  },
  {
    icao: "YPPH", name: "Perth", state: "WA", type: "AD",
    nswaaNote: "Major international airport — Tower controlled. Wildlife management in operation. ATIS on 123.8. Fuel (Jet-A1) 24hr. PPR for GA — contact Perth Airport Operations.",
  },
  {
    icao: "YMTG", name: "Mount Gambier", state: "SA", type: "AD",
    nswaaNote: "Kangaroo hazard on runway margins. CTAF 118.3. Fuel (Jet-A1 & AVGAS) available. Contact: Mount Gambier Airport +61 8 8721 0900.",
  },
  {
    icao: "YRMD", name: "Renmark", state: "SA", type: "AD",
    nswaaNote: "Kangaroo and bird hazard. CTAF 126.7. Fuel (AVGAS) available; Jet-A1 by arrangement. Contact: Renmark Paringa Council +61 8 8586 6011.",
  },
  {
    icao: "YPED", name: "Edinburgh (RAAF)", state: "SA", type: "AD",
    nswaaNote: "RAAF base — strict access control. PPR and security clearance REQUIRED before arrival. Tower controlled. Wildlife management conducted by RAAF ARO. Fuel (Jet-A1) available for authorised aircraft only.",
  },
  {
    icao: "YCBP", name: "Coober Pedy", state: "SA", type: "AD",
    nswaaNote: "Remote outback aerodrome. Kangaroo and camel hazard reported near runway. ROO RUN recommended for all dawn/dusk operations. CTAF 126.7. Fuel (Jet-A1 & AVGAS) limited — confirm before flight. Contact: Coober Pedy District Council +61 8 8672 4600.",
  },
  {
    icao: "YOOD", name: "Oodnadatta", state: "SA", type: "AD",
    nswaaNote: "REMOTE OUTBACK — HIGH KANGAROO, CAMEL AND LIVESTOCK HAZARD. ROO RUN MANDATORY before ALL operations. No permanent staff — arrange inspection before arrival. No fuel. PPR via Outback Communities Authority or local contact.",
  },
  {
    icao: "YBRR", name: "Bordertown", state: "SA", type: "ALA",
    nswaaNote: "Air Landing Area — livestock and kangaroo hazard. Stock clear REQUIRED before operations. No fuel. PPR via local landholder or Tatiara District Council +61 8 8752 1044.",
  },
  {
    icao: "YMBT", name: "Moomba", state: "SA", type: "AD",
    nswaaNote: "Santos gas field aerodrome — PPR REQUIRED for all operations. Security check-in required before airside access. Wildlife (kangaroo, camel, feral goat) hazard — inspection before every movement. Fuel (Jet-A1) available. Contact: Santos Moomba Operations +61 8 8680 3000. Emergency: Santos Security +61 8 8680 3111. CTAF 126.7.",
  },

  // ── VIC ──────────────────────────────────────────────────────────────────────

  {
    icao: "YMML", name: "Melbourne (Tullamarine)", state: "VIC", type: "AD",
    nswaaNote: "International controlled airport. Wildlife management in operation — bird (ibis, raptor) patrols. ATIS on 118.9. Fuel (Jet-A1) 24hr. Slots required — coordinate with Melbourne Airport GA.",
  },
  {
    icao: "YMEN", name: "Melbourne (Essendon)", state: "VIC", type: "AD",
    nswaaNote: "REMOTE ALA — HIGH KANGAROO, EMU AND GOAT HAZARD adjacent to Kinchega National Park. ROO RUN MANDATORY before ALL operations. Unsealed strip — inspect for animal debris and soft ground. No fuel. No permanent staff. PPR: Central Darling Shire +61 8 8091 6600. Menindee Police +61 8 8091 4044. CTAF 126.7.",
  },
  {
    icao: "YMAV", name: "Avalon", state: "VIC", type: "AD",
    nswaaNote: "Wildlife management in operation. Bird hazard (open farmland surrounds). Tower controlled. Fuel (Jet-A1) 24hr. Contact: Avalon Airport +61 3 5227 9100.",
  },
  {
    icao: "YSWG", name: "Swan Hill", state: "VIC", type: "AD",
    nswaaNote: "Kangaroo and bird hazard near runway. CTAF 122.8. Fuel (AVGAS) available; Jet-A1 by arrangement. Contact: Swan Hill Rural City Council +61 3 5036 2333.",
  },
  {
    icao: "YECH", name: "Echuca", state: "VIC", type: "AD",
    nswaaNote: "Kangaroo and wildlife activity noted. CTAF 126.7. Fuel (AVGAS) available; Jet-A1 by arrangement. Contact: Campaspe Shire Council +61 3 5481 2200.",
  },
  {
    icao: "YHMB", name: "Horsham", state: "VIC", type: "AD",
    nswaaNote: "Wildlife (kangaroo, hare) hazard on runway. CTAF 126.7. Fuel (AVGAS) available; Jet-A1 by arrangement. Contact: Horsham Rural City Council +61 3 5382 9777.",
  },
  {
    icao: "YBNS", name: "Bairnsdale", state: "VIC", type: "AD",
    nswaaNote: "Wildlife and bird activity noted. CTAF 122.8. Fuel (Jet-A1 & AVGAS) available. Contact: East Gippsland Shire +61 3 5153 9500.",
  },
  {
    icao: "YMOR", name: "Mildura", state: "VIC", type: "AD",
    nswaaNote: "Kangaroo hazard on runway surrounds, particularly at dawn and dusk. Aerodrome operator conducts daily inspection — confirm completed before early-morning operations. CTAF 118.3. Fuel (Jet-A1 & AVGAS) available. After-hours contact: Moree Plains Shire Council +61 2 6757 3222.",
  },

  // ── ACT ──────────────────────────────────────────────────────────────────────

  {
    icao: "YSCB", name: "Canberra", state: "ACT", type: "AD",
    nswaaNote: "International controlled airport. Wildlife management in operation (kangaroo and bird hazard near runways). ATIS on 128.25. Fuel (Jet-A1) 24hr. PPR for GA parking — contact Canberra Airport +61 2 6275 2222.",
  },

  // ── TAS ──────────────────────────────────────────────────────────────────────

  {
    icao: "YMLT", name: "Launceston", state: "TAS", type: "AD",
    nswaaNote: "Wildlife management in operation. Wallaby and bird hazard near runway thresholds. ATIS on 133.55. Fuel (Jet-A1) 24hr. Contact: Launceston Airport +61 3 6391 6100.",
  },
  {
    icao: "YMHB", name: "Hobart", state: "TAS", type: "AD",
    nswaaNote: "Wildlife management in operation. Bird and wallaby hazard. Tower controlled. ATIS on 128.45. Fuel (Jet-A1) 24hr. Contact: Hobart Airport +61 3 6216 1600.",
  },
  {
    icao: "YBDV", name: "Devonport", state: "TAS", type: "AD",
    nswaaNote: "Wildlife patrol in operation. Bird hazard on coastal approaches. CTAF/Tower. Fuel (Jet-A1 & AVGAS) available. Contact: Devonport Airport +61 3 6427 0100.",
  },
  {
    icao: "YBIE", name: "Burnie (Wynyard)", state: "TAS", type: "AD",
    nswaaNote: "Bird and wildlife hazard noted on coastal approaches. CTAF 118.3. Fuel (AVGAS) available; Jet-A1 by arrangement. Contact: Burnie City Council Airport +61 3 6430 5700.",
  },


  // ── QLD — Additional Remote ──────────────────────────────────────────────────

  {
    icao: "YBWW", name: "Archerfield", state: "QLD", type: "AD",
    nswaaNote: "Busy non-controlled aerodrome in Brisbane basin — high traffic density. Wildlife management in operation. CTAF 118.9. Fuel (Jet-A1 & AVGAS) available 24hr. Contact: Archerfield Airport +61 7 3277 8111.",
  },
  {
    icao: "YBMK", name: "Mackay", state: "QLD", type: "AD",
    nswaaNote: "Wildlife management in operation. Bird hazard on coastal approaches. Tower controlled. ATIS on 133.8. Fuel (Jet-A1) 24hr. Contact: Mackay Airport +61 7 4957 0100.",
  },
  {
    icao: "YBCS", name: "Cairns", state: "QLD", type: "AD",
    nswaaNote: "International airport — Tower controlled. Wildlife management in operation (birds, feral animals). ATIS on 128.4. Fuel (Jet-A1) 24hr. Contact: Cairns Airport +61 7 4080 6703.",
  },
  {
    icao: "YQLP", name: "Quilpie", state: "QLD", type: "AD",
    nswaaNote: "Kangaroo and emu hazard on runway. ROO RUN required for all dawn, dusk and night operations. Aerodrome operator conducts sweeps — confirm before arrival. CTAF 126.7. Fuel (Jet-A1 & AVGAS) available — confirm after-hours. Contact: Quilpie Shire Council +61 7 4656 0500.",
  },
  {
    icao: "YTWB", name: "Toowoomba (Wellcamp)", state: "QLD", type: "AD",
    nswaaNote: "Regional controlled aerodrome. Wildlife management in operation. Tower controlled. ATIS on 134.55. Fuel (Jet-A1) available. Contact: Toowoomba Wellcamp Airport +61 7 4614 2300.",
  },
  {
    icao: "YBVW", name: "Birdsville", state: "QLD", type: "AD",
    nswaaNote: "VERY REMOTE OUTBACK — HIGH KANGAROO, CAMEL AND DINGO HAZARD. ROO RUN MANDATORY before ALL operations — extremely active wildlife at dawn and dusk. No permanent aerodrome staff. Sealed runway — check for debris after wildlife incursion. Fuel (Jet-A1 & AVGAS) available — confirm 24hrs before; outback fuel supply can be disrupted. Extreme heat — consider performance penalties in summer. Contact: Diamantina Shire Council +61 7 4746 1166. Birdsville Police +61 7 4746 0010. CTAF 126.7.",
  },
  {
    icao: "YBDG", name: "Bundaberg", state: "QLD", type: "AD",
    nswaaNote: "Wildlife management in operation. Bird hazard on agricultural approaches. CTAF/Tower. Fuel (Jet-A1 & AVGAS) available. Contact: Bundaberg Airport +61 7 4130 4700.",
  },
  {
    icao: "YTAM", name: "Thargomindah", state: "QLD", type: "AD",
    nswaaNote: "REMOTE OUTBACK — HIGH KANGAROO AND EMU HAZARD. ROO RUN REQUIRED for all dawn, dusk and night operations. No permanent staff — arrange sweep via Bulloo Shire Council before arrival. CTAF 126.7. Fuel (Jet-A1 & AVGAS) limited — confirm at least 24hrs before. After-hours: Bulloo Shire Council +61 7 4621 8000. Thargomindah Police +61 7 4655 3131.",
  },
  {
    icao: "YSGT", name: "Surat", state: "QLD", type: "ALA",
    nswaaNote: "ALA — KANGAROO AND LIVESTOCK HAZARD. ROO RUN REQUIRED before all operations. Unsealed strip — check condition after rain. No fuel. PPR: Maranoa Regional Council +61 7 4620 8888. CTAF 126.7.",
  },
  {
    icao: "YBTN", name: "Bourke North ALA", state: "QLD", type: "ALA",
    nswaaNote: "REMOTE ALA — KANGAROO AND LIVESTOCK HAZARD. ROO RUN MANDATORY. No fuel. No permanent staff — PPR required. Monitor surface condition after rain. CTAF 126.7.",
  },

  // ── SA — Additional ──────────────────────────────────────────────────────────

  {
    icao: "YPPF", name: "Parafield", state: "SA", type: "AD",
    nswaaNote: "Busy non-controlled training aerodrome in Adelaide basin — high traffic density, exercise extra vigilance on CTAF. CTAF 119.4. Fuel (Jet-A1 & AVGAS) available. Contact: Parafield Airport +61 8 8209 5100.",
  },
  {
    icao: "YHAR", name: "Hawker", state: "SA", type: "AD",
    nswaaNote: "REMOTE FLINDERS RANGES — KANGAROO AND GOAT HAZARD. ROO RUN REQUIRED for all operations. No permanent aerodrome staff. Unsealed runway — check condition especially after rain. No fuel. PPR: Flinders Ranges Council +61 8 8648 6056. Hawker Police +61 8 8648 4018. CTAF 126.7.",
  },
  {
    icao: "YWHA", name: "Whyalla", state: "SA", type: "AD",
    nswaaNote: "Wildlife management in operation. Kangaroo hazard near runway margins. CTAF 119.0. Fuel (Jet-A1 & AVGAS) available. Contact: Whyalla Airport +61 8 8640 3457.",
  },
  {
    icao: "YOLD", name: "Olympic Dam", state: "SA", type: "AD",
    nswaaNote: "BHP mine site aerodrome — PPR REQUIRED. Security check-in mandatory before airside access. Wildlife (kangaroo, camel) hazard — daily inspection by aerodrome operator. Tower controlled. Fuel (Jet-A1) available. Contact: Olympic Dam Airport Operations +61 8 8671 0000.",
  },
  {
    icao: "YINN", name: "Innamincka", state: "SA", type: "ALA",
    nswaaNote: "VERY REMOTE OUTBACK ALA — HIGH KANGAROO AND CAMEL HAZARD on Cooper Creek floodplain. ROO RUN MANDATORY before ALL operations. Unsealed strip — DO NOT USE after significant rainfall; surface becomes impassable. No permanent staff. No fuel — carry all fuel required. PPR: SA Outback Communities Authority. Innamincka Ranger Station +61 8 8675 9900. CTAF 126.7.",
  },

  // ── NT — Key routes ──────────────────────────────────────────────────────────

  {
    icao: "YBAS", name: "Alice Springs", state: "NT", type: "AD",
    nswaaNote: "Remote central Australia aerodrome. Kangaroo and camel hazard near runway surrounds. Daily inspection by aerodrome operator. CTAF/Tower. Fuel (Jet-A1 & AVGAS) available 24hr. Contact: Alice Springs Airport +61 8 8951 1211.",
  },
  {
    icao: "YDVR", name: "Darwin", state: "NT", type: "AD",
    nswaaNote: "International controlled airport. Wildlife management in operation. ATIS on 128.35. Fuel (Jet-A1) 24hr. Contact: Darwin Airport +61 8 8920 1811.",
  },
  {
    icao: "YBDN", name: "Boulia", state: "NT", type: "ALA",
    nswaaNote: "REMOTE ALA — HIGH KANGAROO AND CAMEL HAZARD. ROO RUN MANDATORY. No fuel on site. Check surface condition before approach especially after rain. CTAF 126.7. PPR: Boulia Shire Council +61 7 4746 3155.",
  },

  // ── Lord Howe Island (Special Mission) ──────────────────────────────────────

  {
    icao: "YLHI", name: "Lord Howe Island", state: "NSW", type: "AD",
    warning: "⚠️ OVER-WATER OPERATION — Lord Howe Island requires life raft, 2× EPIRBs, immersion suits, and SARTIME lodgement. Ensure all special equipment is confirmed before dispatch.",
    nswaaNote: "Unique island aerodrome — runway length limited to 880m. PPR REQUIRED from Lord Howe Island Board. Short runway — confirm aircraft performance is acceptable before booking. Bird hazard (masked boobies, providence petrels) on approach and runway, especially at night. Contact: LHI Board +61 2 6563 2066. No commercial fuel — confirm fuel plan and range before departure. Strict weight restriction applies.",
  },
];

// RFDS South East Section primary departure bases (RAHS / Dental)
export const RAHS_DENTAL_BASES: ERSAAerodrome[] = ERSA_AERODROMES.filter(a =>
  ["YSBK", "YSDU", "YBHI"].includes(a.icao)
);

// Lookup by ICAO
export function getAerodrome(icao: string): ERSAAerodrome | undefined {
  return ERSA_AERODROMES.find(a => a.icao === icao);
}

// Format for display in dropdowns
export function formatAerodrome(a: ERSAAerodrome): string {
  return `${a.icao} — ${a.name} (${a.state})`;
}

// Grouped by state for optgroup rendering
export function groupByState(): Record<string, ERSAAerodrome[]> {
  return ERSA_AERODROMES.reduce((acc, a) => {
    if (!acc[a.state]) acc[a.state] = [];
    acc[a.state].push(a);
    return acc;
  }, {} as Record<string, ERSAAerodrome[]>);
}
