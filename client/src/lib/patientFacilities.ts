// Patient pickup location database — NSW, VIC, and Tasmania
// Hospitals, nursing homes, retirement villages, and aged care facilities
// Sorted with most common RFDS pickup locations first (priority = lower number = higher priority)

export interface PatientFacility {
  id: string;
  name: string;
  suburb: string;
  state: "NSW" | "VIC" | "TAS";
  type: "hospital" | "nursing_home" | "aged_care" | "retirement";
  lat: number;
  lon: number;
  priority: number; // lower = appears first in results
  icao?: string;    // nearest airfield if known
  lhd?: string;     // NSW LHD or VIC health region
}

// ─── Commonly used RFDS pickup locations (priority 1–5) ──────────────────────
// ─── NSW Hospitals ─────────────────────────────────────────────────────────────
export const PATIENT_FACILITIES: PatientFacility[] = [
  // ── TOP PRIORITY — Most common RFDS SE pickups ──
  { id: "dubbo-base",        name: "Dubbo Base Hospital",                   suburb: "Dubbo",           state: "NSW", type: "hospital",     lat: -32.246, lon: 148.601, priority: 1,  icao: "YSDU", lhd: "western-nsw" },
  { id: "broken-hill-base",  name: "Broken Hill Base Hospital",             suburb: "Broken Hill",     state: "NSW", type: "hospital",     lat: -31.968, lon: 141.465, priority: 1,  icao: "YBHI", lhd: "far-west" },
  { id: "orange-base",       name: "Orange Health Service",                 suburb: "Orange",          state: "NSW", type: "hospital",     lat: -33.285, lon: 149.102, priority: 1,  icao: "YORA", lhd: "western-nsw" },
  { id: "bathurst-base",     name: "Bathurst Base Hospital",                suburb: "Bathurst",        state: "NSW", type: "hospital",     lat: -33.421, lon: 149.580, priority: 1,  icao: "YBTH", lhd: "western-nsw" },
  { id: "bourke-district",   name: "Bourke District Hospital",              suburb: "Bourke",          state: "NSW", type: "hospital",     lat: -30.094, lon: 145.936, priority: 1,  icao: "YBKE", lhd: "western-nsw" },
  { id: "cobar-district",    name: "Cobar District Hospital",               suburb: "Cobar",           state: "NSW", type: "hospital",     lat: -31.498, lon: 145.839, priority: 1,  icao: "YCBA", lhd: "western-nsw" },
  { id: "narromine-district", name: "Narromine District Hospital",          suburb: "Narromine",       state: "NSW", type: "hospital",     lat: -32.228, lon: 148.244, priority: 1,  icao: "YNAR", lhd: "western-nsw" },
  { id: "lightning-ridge",   name: "Lightning Ridge Multi-Purpose Service", suburb: "Lightning Ridge", state: "NSW", type: "hospital",     lat: -29.428, lon: 147.980, priority: 1,  icao: "YLIK", lhd: "western-nsw" },
  { id: "walgett-mps",       name: "Walgett Multi-Purpose Service",        suburb: "Walgett",         state: "NSW", type: "hospital",     lat: -30.024, lon: 148.112, priority: 1,  icao: "YWCA", lhd: "western-nsw" },
  { id: "nyngan-mps",        name: "Nyngan Multi-Purpose Service",         suburb: "Nyngan",          state: "NSW", type: "hospital",     lat: -31.553, lon: 147.191, priority: 1,  lhd: "western-nsw" },
  { id: "coonamble-mps",     name: "Coonamble Multi-Purpose Service",      suburb: "Coonamble",       state: "NSW", type: "hospital",     lat: -30.955, lon: 148.381, priority: 1,  lhd: "western-nsw" },
  { id: "gilgandra-mps",     name: "Gilgandra Multi-Purpose Service",      suburb: "Gilgandra",       state: "NSW", type: "hospital",     lat: -31.714, lon: 148.659, priority: 1,  lhd: "western-nsw" },
  { id: "condobolin-mps",    name: "Condobolin Multipurpose Service",      suburb: "Condobolin",      state: "NSW", type: "hospital",     lat: -33.073, lon: 147.140, priority: 1,  lhd: "western-nsw" },
  { id: "parkes-district",   name: "Parkes District Hospital",             suburb: "Parkes",          state: "NSW", type: "hospital",     lat: -33.131, lon: 148.169, priority: 1,  lhd: "western-nsw" },
  { id: "forbes-district",   name: "Forbes District Hospital",             suburb: "Forbes",          state: "NSW", type: "hospital",     lat: -33.386, lon: 148.009, priority: 2,  lhd: "western-nsw" },
  { id: "mudgee-district",   name: "Mudgee District Hospital",             suburb: "Mudgee",          state: "NSW", type: "hospital",     lat: -32.600, lon: 149.583, priority: 2,  lhd: "western-nsw" },
  { id: "coolah-mps",        name: "Coolah Multi-Purpose Service",         suburb: "Coolah",          state: "NSW", type: "hospital",     lat: -31.824, lon: 149.720, priority: 2,  lhd: "western-nsw" },
  { id: "warren-mps",        name: "Warren Multi-Purpose Service",         suburb: "Warren",          state: "NSW", type: "hospital",     lat: -31.703, lon: 147.833, priority: 2,  lhd: "western-nsw" },
  { id: "peak-hill-mps",     name: "Peak Hill Multi-Purpose Service",      suburb: "Peak Hill",       state: "NSW", type: "hospital",     lat: -32.726, lon: 148.188, priority: 2,  lhd: "western-nsw" },
  { id: "trundle-mps",       name: "Trundle Multi-Purpose Service",        suburb: "Trundle",         state: "NSW", type: "hospital",     lat: -32.925, lon: 147.703, priority: 2,  lhd: "western-nsw" },
  { id: "tottenham-mps",     name: "Tottenham Multi-Purpose Service",      suburb: "Tottenham",       state: "NSW", type: "hospital",     lat: -32.245, lon: 147.362, priority: 2,  lhd: "western-nsw" },
  { id: "tullamore-mps",     name: "Tullamore Multi-Purpose Service",      suburb: "Tullamore",       state: "NSW", type: "hospital",     lat: -32.641, lon: 147.563, priority: 2,  lhd: "western-nsw" },
  { id: "nevertire-mps",     name: "Nevertire Multi-Purpose Service",      suburb: "Nevertire",       state: "NSW", type: "hospital",     lat: -31.847, lon: 147.713, priority: 2,  lhd: "western-nsw" },

  // ── NSW — Hunter New England ──
  { id: "tamworth-rural",    name: "Tamworth Rural Referral Hospital",     suburb: "Tamworth",        state: "NSW", type: "hospital",     lat: -31.084, lon: 150.918, priority: 1,  icao: "YSTW", lhd: "hunter-new-england" },
  { id: "armidale-rural",    name: "Armidale Rural Referral Hospital",     suburb: "Armidale",        state: "NSW", type: "hospital",     lat: -30.508, lon: 151.679, priority: 2,  lhd: "hunter-new-england" },
  { id: "inverell-district", name: "Inverell District Hospital",           suburb: "Inverell",        state: "NSW", type: "hospital",     lat: -29.778, lon: 151.113, priority: 2,  lhd: "hunter-new-england" },
  { id: "glen-innes",        name: "Glen Innes District Hospital",         suburb: "Glen Innes",      state: "NSW", type: "hospital",     lat: -29.733, lon: 151.741, priority: 2,  lhd: "hunter-new-england" },
  { id: "moree-district",    name: "Moree District Hospital",              suburb: "Moree",           state: "NSW", type: "hospital",     lat: -29.465, lon: 149.842, priority: 2,  icao: "YMOR", lhd: "hunter-new-england" },
  { id: "narrabri-district", name: "Narrabri District Hospital",           suburb: "Narrabri",        state: "NSW", type: "hospital",     lat: -30.324, lon: 149.783, priority: 2,  icao: "YNBR", lhd: "hunter-new-england" },
  { id: "gunnedah-district", name: "Gunnedah District Hospital",           suburb: "Gunnedah",        state: "NSW", type: "hospital",     lat: -30.978, lon: 150.256, priority: 2,  lhd: "hunter-new-england" },
  { id: "quirindi-mps",      name: "Quirindi Multi-Purpose Service",       suburb: "Quirindi",        state: "NSW", type: "hospital",     lat: -31.507, lon: 150.677, priority: 3,  lhd: "hunter-new-england" },
  { id: "murrurundi-mps",    name: "Murrurundi Multi-Purpose Service",     suburb: "Murrurundi",      state: "NSW", type: "hospital",     lat: -31.764, lon: 150.836, priority: 3,  lhd: "hunter-new-england" },
  { id: "john-hunter",       name: "John Hunter Hospital",                 suburb: "New Lambton Heights", state: "NSW", type: "hospital", lat: -32.906, lon: 151.713, priority: 2,  icao: "YWLM", lhd: "hunter-new-england" },
  { id: "mater-newcastle",   name: "Mater Hospital Newcastle",             suburb: "Waratah",         state: "NSW", type: "hospital",     lat: -32.904, lon: 151.705, priority: 3,  lhd: "hunter-new-england" },

  // ── NSW — Murrumbidgee ──
  { id: "wagga-base",        name: "Wagga Wagga Rural Referral Hospital",  suburb: "Wagga Wagga",     state: "NSW", type: "hospital",     lat: -35.107, lon: 147.373, priority: 1,  icao: "YSWG", lhd: "murrumbidgee" },
  { id: "griffith-base",     name: "Griffith Base Hospital",               suburb: "Griffith",        state: "NSW", type: "hospital",     lat: -34.293, lon: 146.047, priority: 1,  icao: "YGTH", lhd: "murrumbidgee" },
  { id: "deniliquin-district", name: "Deniliquin District Hospital",       suburb: "Deniliquin",      state: "NSW", type: "hospital",     lat: -35.534, lon: 144.961, priority: 2,  lhd: "murrumbidgee" },
  { id: "leeton-district",   name: "Leeton District Hospital",             suburb: "Leeton",          state: "NSW", type: "hospital",     lat: -34.555, lon: 146.411, priority: 2,  lhd: "murrumbidgee" },
  { id: "narrandera-district", name: "Narrandera District Hospital",       suburb: "Narrandera",      state: "NSW", type: "hospital",     lat: -34.745, lon: 146.554, priority: 2,  lhd: "murrumbidgee" },
  { id: "hay-mps",           name: "Hay Multi-Purpose Service",            suburb: "Hay",             state: "NSW", type: "hospital",     lat: -34.511, lon: 144.842, priority: 2,  lhd: "murrumbidgee" },
  { id: "hillston-mps",      name: "Hillston Multi-Purpose Service",       suburb: "Hillston",        state: "NSW", type: "hospital",     lat: -33.482, lon: 145.534, priority: 3,  lhd: "murrumbidgee" },
  { id: "tumut-district",    name: "Tumut District Hospital",              suburb: "Tumut",           state: "NSW", type: "hospital",     lat: -35.299, lon: 148.222, priority: 2,  lhd: "murrumbidgee" },
  { id: "young-district",    name: "Young District Hospital",              suburb: "Young",           state: "NSW", type: "hospital",     lat: -34.310, lon: 148.301, priority: 3,  lhd: "murrumbidgee" },
  { id: "cootamundra-district", name: "Cootamundra District Hospital",     suburb: "Cootamundra",     state: "NSW", type: "hospital",     lat: -34.644, lon: 148.029, priority: 3,  lhd: "murrumbidgee" },
  { id: "temora-district",   name: "Temora District Hospital",             suburb: "Temora",          state: "NSW", type: "hospital",     lat: -34.443, lon: 147.538, priority: 3,  lhd: "murrumbidgee" },

  // ── NSW — Mid-North Coast ──
  { id: "port-macquarie",    name: "Port Macquarie Base Hospital",         suburb: "Port Macquarie",  state: "NSW", type: "hospital",     lat: -31.434, lon: 152.909, priority: 2,  icao: "YPMQ", lhd: "mid-north-coast" },
  { id: "kempsey-district",  name: "Kempsey District Hospital",            suburb: "Kempsey",         state: "NSW", type: "hospital",     lat: -31.084, lon: 152.840, priority: 2,  lhd: "mid-north-coast" },
  { id: "taree-manning",     name: "Manning Base Hospital",                suburb: "Taree",           state: "NSW", type: "hospital",     lat: -31.907, lon: 152.462, priority: 2,  lhd: "mid-north-coast" },
  { id: "coffs-harbour",     name: "Coffs Harbour Health Campus",          suburb: "Coffs Harbour",   state: "NSW", type: "hospital",     lat: -30.297, lon: 153.130, priority: 2,  icao: "YSCH", lhd: "mid-north-coast" },
  { id: "macksville-mps",    name: "Macksville District Hospital",         suburb: "Macksville",      state: "NSW", type: "hospital",     lat: -30.706, lon: 152.921, priority: 3,  lhd: "mid-north-coast" },

  // ── NSW — Northern NSW ──
  { id: "lismore-base",      name: "Lismore Base Hospital",                suburb: "Lismore",         state: "NSW", type: "hospital",     lat: -28.812, lon: 153.267, priority: 2,  icao: "YLRD", lhd: "northern-nsw" },
  { id: "ballina-district",  name: "Ballina District Hospital",            suburb: "Ballina",         state: "NSW", type: "hospital",     lat: -28.864, lon: 153.561, priority: 2,  lhd: "northern-nsw" },
  { id: "casino-district",   name: "Casino & District Memorial Hospital",  suburb: "Casino",          state: "NSW", type: "hospital",     lat: -28.865, lon: 153.044, priority: 3,  lhd: "northern-nsw" },
  { id: "grafton-base",      name: "Grafton Base Hospital",                suburb: "Grafton",         state: "NSW", type: "hospital",     lat: -29.685, lon: 152.930, priority: 2,  icao: "YGFN", lhd: "northern-nsw" },

  // ── NSW — Southern NSW / ACT Border ──
  { id: "cooma-district",    name: "Cooma District Hospital",              suburb: "Cooma",           state: "NSW", type: "hospital",     lat: -36.232, lon: 149.129, priority: 2,  icao: "YCOM", lhd: "southern-nsw" },
  { id: "goulburn-base",     name: "Goulburn Base Hospital",               suburb: "Goulburn",        state: "NSW", type: "hospital",     lat: -34.751, lon: 149.722, priority: 2,  lhd: "southern-nsw" },
  { id: "queanbeyan-district", name: "Queanbeyan District Hospital",       suburb: "Queanbeyan",      state: "NSW", type: "hospital",     lat: -35.353, lon: 149.232, priority: 3,  lhd: "southern-nsw" },
  { id: "bega-district",     name: "Bega District Hospital",               suburb: "Bega",            state: "NSW", type: "hospital",     lat: -36.673, lon: 149.840, priority: 3,  lhd: "southern-nsw" },
  { id: "moruya-district",   name: "Moruya District Hospital",             suburb: "Moruya",          state: "NSW", type: "hospital",     lat: -35.904, lon: 150.080, priority: 3,  lhd: "southern-nsw" },
  { id: "nowra-shoalhaven",  name: "Shoalhaven District Memorial Hospital", suburb: "Nowra",          state: "NSW", type: "hospital",     lat: -34.879, lon: 150.606, priority: 3,  lhd: "illawarra-shoalhaven" },

  // ── NSW — Sydney Metro (referral destinations) ──
  { id: "westmead",          name: "Westmead Hospital",                    suburb: "Westmead",        state: "NSW", type: "hospital",     lat: -33.806, lon: 150.987, priority: 2,  icao: "YSCN", lhd: "western-sydney" },
  { id: "liverpool",         name: "Liverpool Hospital",                   suburb: "Liverpool",       state: "NSW", type: "hospital",     lat: -33.921, lon: 150.921, priority: 2,  icao: "YSCN", lhd: "south-western-sydney" },
  { id: "st-george",         name: "St George Hospital",                   suburb: "Kogarah",         state: "NSW", type: "hospital",     lat: -33.964, lon: 151.133, priority: 2,  icao: "YSSY", lhd: "south-eastern-sydney" },
  { id: "concord",           name: "Concord Repatriation General Hospital", suburb: "Concord",        state: "NSW", type: "hospital",     lat: -33.864, lon: 151.087, priority: 2,  icao: "YSCN", lhd: "sydney" },
  { id: "nepean",            name: "Nepean Hospital",                      suburb: "Kingswood",       state: "NSW", type: "hospital",     lat: -33.746, lon: 150.671, priority: 2,  icao: "YSCN", lhd: "nepean-blue-mountains" },
  { id: "royal-north-shore", name: "Royal North Shore Hospital",           suburb: "St Leonards",     state: "NSW", type: "hospital",     lat: -33.824, lon: 151.194, priority: 2,  icao: "YSSY", lhd: "northern-sydney" },
  { id: "prince-of-wales",   name: "Prince of Wales Hospital",             suburb: "Randwick",        state: "NSW", type: "hospital",     lat: -33.912, lon: 151.239, priority: 2,  icao: "YSSY", lhd: "south-eastern-sydney" },
  { id: "rpa",               name: "Royal Prince Alfred Hospital",         suburb: "Camperdown",      state: "NSW", type: "hospital",     lat: -33.889, lon: 151.187, priority: 2,  icao: "YSSY", lhd: "sydney" },
  { id: "gosford",           name: "Gosford Hospital",                     suburb: "Gosford",         state: "NSW", type: "hospital",     lat: -33.418, lon: 151.323, priority: 2,  icao: "YWLM", lhd: "central-coast" },
  { id: "wollongong",        name: "Wollongong Hospital",                  suburb: "Wollongong",      state: "NSW", type: "hospital",     lat: -34.431, lon: 150.894, priority: 2,  icao: "YWOL", lhd: "illawarra-shoalhaven" },
  { id: "blacktown",         name: "Blacktown Hospital",                   suburb: "Blacktown",       state: "NSW", type: "hospital",     lat: -33.773, lon: 150.905, priority: 3,  icao: "YSCN", lhd: "western-sydney" },
  { id: "campbelltown",      name: "Campbelltown Hospital",                suburb: "Campbelltown",    state: "NSW", type: "hospital",     lat: -34.065, lon: 150.815, priority: 3,  lhd: "south-western-sydney" },
  { id: "penrith-nepean",    name: "Penrith (Blue Mountains) District",    suburb: "Penrith",         state: "NSW", type: "hospital",     lat: -33.764, lon: 150.703, priority: 3,  lhd: "nepean-blue-mountains" },

  // ── NSW Nursing Homes & Aged Care — Far West / Western ──
  { id: "broken-hill-ac-1",  name: "Broken Hill Aged Care (RFDS Hostel)", suburb: "Broken Hill",     state: "NSW", type: "aged_care",    lat: -31.959, lon: 141.468, priority: 2,  icao: "YBHI" },
  { id: "lightning-ridge-ac", name: "Lightning Ridge Aged Care Facility",  suburb: "Lightning Ridge", state: "NSW", type: "aged_care",    lat: -29.432, lon: 147.976, priority: 2,  icao: "YLIK" },
  { id: "bourke-ac",         name: "Bourke Aged Care Centre",              suburb: "Bourke",          state: "NSW", type: "aged_care",    lat: -30.098, lon: 145.940, priority: 2,  icao: "YBKE" },
  { id: "walgett-ac",        name: "Walgett Aged Care Facility",           suburb: "Walgett",         state: "NSW", type: "aged_care",    lat: -30.022, lon: 148.115, priority: 3,  icao: "YWCA" },
  { id: "dubbo-ac-1",        name: "Dubbo Nursing Home (Lourdes)",         suburb: "Dubbo",           state: "NSW", type: "nursing_home",  lat: -32.249, lon: 148.605, priority: 2,  icao: "YSDU" },
  { id: "dubbo-ac-2",        name: "Dubbo Aged Care Facility (Bethshan)", suburb: "Dubbo",            state: "NSW", type: "aged_care",    lat: -32.252, lon: 148.612, priority: 2,  icao: "YSDU" },
  { id: "orange-ac-1",       name: "Orange Aged Care (Hopewood Gardens)", suburb: "Orange",           state: "NSW", type: "aged_care",    lat: -33.289, lon: 149.108, priority: 3,  icao: "YORA" },
  { id: "bathurst-ac-1",     name: "Bathurst Nursing Home (Balranald)",   suburb: "Bathurst",         state: "NSW", type: "nursing_home",  lat: -33.418, lon: 149.577, priority: 3,  icao: "YBTH" },
  { id: "cobar-ac",          name: "Cobar Aged Care Centre",               suburb: "Cobar",           state: "NSW", type: "aged_care",    lat: -31.501, lon: 145.842, priority: 3,  icao: "YCBA" },
  { id: "narromine-ac",      name: "Narromine Aged Care Facility",         suburb: "Narromine",       state: "NSW", type: "aged_care",    lat: -32.231, lon: 148.247, priority: 3,  icao: "YNAR" },
  { id: "mudgee-ac",         name: "Mudgee Aged Care (Mudgee District)",  suburb: "Mudgee",           state: "NSW", type: "aged_care",    lat: -32.601, lon: 149.585, priority: 3 },
  { id: "nyngan-ac",         name: "Nyngan Aged Care Hostel",              suburb: "Nyngan",          state: "NSW", type: "aged_care",    lat: -31.555, lon: 147.194, priority: 3 },

  // ── NSW Retirement Villages — Western ──
  { id: "dubbo-rv-1",        name: "Dubbo Retirement Village (Baptist Care)", suburb: "Dubbo",         state: "NSW", type: "retirement",   lat: -32.253, lon: 148.608, priority: 3,  icao: "YSDU" },
  { id: "orange-rv-1",       name: "Orange Retirement Village (Uniting)",  suburb: "Orange",          state: "NSW", type: "retirement",   lat: -33.282, lon: 149.097, priority: 3,  icao: "YORA" },
  { id: "wagga-rv-1",        name: "Wagga Wagga Retirement Village (Mercy)", suburb: "Wagga Wagga",   state: "NSW", type: "retirement",   lat: -35.110, lon: 147.377, priority: 3,  icao: "YSWG" },
  { id: "tamworth-rv-1",     name: "Tamworth Retirement Village (RFBI)",   suburb: "Tamworth",        state: "NSW", type: "retirement",   lat: -31.087, lon: 150.921, priority: 3,  icao: "YSTW" },
  { id: "griffith-rv-1",     name: "Griffith Aged Care (Southern Cross)",  suburb: "Griffith",        state: "NSW", type: "retirement",   lat: -34.296, lon: 146.050, priority: 3,  icao: "YGTH" },
  { id: "broken-hill-rv-1",  name: "Broken Hill Retirement Village",       suburb: "Broken Hill",     state: "NSW", type: "retirement",   lat: -31.962, lon: 141.470, priority: 3,  icao: "YBHI" },

  // ─── VICTORIA — Hospitals ──────────────────────────────────────────────────
  { id: "alfred",            name: "The Alfred Hospital",                  suburb: "Melbourne",       state: "VIC", type: "hospital",     lat: -37.844, lon: 144.983, priority: 2,  icao: "YMEN" },
  { id: "royal-melbourne",   name: "Royal Melbourne Hospital",             suburb: "Parkville",       state: "VIC", type: "hospital",     lat: -37.797, lon: 144.956, priority: 2,  icao: "YMEN" },
  { id: "st-vincent-melb",   name: "St Vincent's Hospital Melbourne",      suburb: "Fitzroy",         state: "VIC", type: "hospital",     lat: -37.808, lon: 144.979, priority: 2,  icao: "YMEN" },
  { id: "monash-melb",       name: "Monash Medical Centre",                suburb: "Clayton",         state: "VIC", type: "hospital",     lat: -37.916, lon: 145.121, priority: 2,  icao: "YMEN" },
  { id: "austin",            name: "Austin Hospital",                      suburb: "Heidelberg",      state: "VIC", type: "hospital",     lat: -37.754, lon: 145.059, priority: 2,  icao: "YMEN" },
  { id: "footscray",         name: "Footscray Hospital (Western Health)",   suburb: "Footscray",       state: "VIC", type: "hospital",     lat: -37.800, lon: 144.899, priority: 2,  icao: "YMEN" },
  { id: "bendigo-health",    name: "Bendigo Health (Lister House)",        suburb: "Bendigo",         state: "VIC", type: "hospital",     lat: -36.757, lon: 144.283, priority: 2,  icao: "YBDG" },
  { id: "ballarat-base",     name: "Ballarat Base Hospital",               suburb: "Ballarat",        state: "VIC", type: "hospital",     lat: -37.560, lon: 143.843, priority: 2,  icao: "YBLT" },
  { id: "geelong-univ",      name: "University Hospital Geelong",          suburb: "Geelong",         state: "VIC", type: "hospital",     lat: -38.151, lon: 144.354, priority: 2,  icao: "YBTL" },
  { id: "warrnambool-sw",    name: "South West Healthcare (Warrnambool)",  suburb: "Warrnambool",     state: "VIC", type: "hospital",     lat: -38.382, lon: 142.490, priority: 2,  icao: "YWBL" },
  { id: "mildura-base",      name: "Mildura Base Hospital",                suburb: "Mildura",         state: "VIC", type: "hospital",     lat: -34.196, lon: 142.149, priority: 2,  icao: "YMIA" },
  { id: "shepparton-gv",     name: "Goulburn Valley Health (Shepparton)",  suburb: "Shepparton",      state: "VIC", type: "hospital",     lat: -36.378, lon: 145.397, priority: 2,  icao: "YSHT" },
  { id: "wodonga-albury",    name: "Border Medical Oncology (Albury Wodonga)", suburb: "Wodonga",    state: "VIC", type: "hospital",     lat: -36.130, lon: 146.893, priority: 2,  icao: "YALB" },
  { id: "latrobe-regional",  name: "Latrobe Regional Health",              suburb: "Traralgon",       state: "VIC", type: "hospital",     lat: -38.192, lon: 146.542, priority: 2,  icao: "YTRE" },
  { id: "wangaratta-nee",    name: "Northeast Health Wangaratta",          suburb: "Wangaratta",      state: "VIC", type: "hospital",     lat: -36.352, lon: 146.325, priority: 2 },
  { id: "horsham-wimmera",   name: "Wimmera Health Care Group (Horsham)",  suburb: "Horsham",         state: "VIC", type: "hospital",     lat: -36.713, lon: 142.200, priority: 2,  icao: "YHSM" },
  { id: "hamilton-base",     name: "Hamilton Base Hospital",               suburb: "Hamilton",        state: "VIC", type: "hospital",     lat: -37.740, lon: 142.025, priority: 3 },
  { id: "echuca-district",   name: "Echuca Regional Health",               suburb: "Echuca",          state: "VIC", type: "hospital",     lat: -36.134, lon: 144.752, priority: 3 },
  { id: "swan-hill-district", name: "Swan Hill District Health",           suburb: "Swan Hill",       state: "VIC", type: "hospital",     lat: -35.338, lon: 143.553, priority: 2,  icao: "YSWH" },
  { id: "bairnsdale-gippsland", name: "Bairnsdale Regional Health Service", suburb: "Bairnsdale",    state: "VIC", type: "hospital",     lat: -37.835, lon: 147.613, priority: 3 },
  { id: "sale-central-gippsland", name: "Central Gippsland Health (Sale)", suburb: "Sale",           state: "VIC", type: "hospital",     lat: -38.101, lon: 147.061, priority: 3,  icao: "YMES" },
  { id: "colac-otway",       name: "Colac Area Health",                    suburb: "Colac",           state: "VIC", type: "hospital",     lat: -38.337, lon: 143.581, priority: 3 },
  { id: "portland-district", name: "Portland District Health",             suburb: "Portland",        state: "VIC", type: "hospital",     lat: -38.343, lon: 141.609, priority: 3 },
  { id: "stawell-regional",  name: "Stawell Regional Health",              suburb: "Stawell",         state: "VIC", type: "hospital",     lat: -37.055, lon: 142.778, priority: 3 },
  { id: "ararat-rural",      name: "Ararat Rural City Health",             suburb: "Ararat",          state: "VIC", type: "hospital",     lat: -37.283, lon: 143.227, priority: 3 },
  { id: "casterton-mps",     name: "Casterton Memorial Hospital",          suburb: "Casterton",       state: "VIC", type: "hospital",     lat: -37.584, lon: 141.406, priority: 3 },
  { id: "nhill-west-wim",    name: "Nhill Hospital (West Wimmera)",        suburb: "Nhill",           state: "VIC", type: "hospital",     lat: -36.334, lon: 141.651, priority: 3 },
  { id: "kaniva-mps",        name: "Kaniva & Serviceton Memorial Hospital", suburb: "Kaniva",          state: "VIC", type: "hospital",     lat: -36.377, lon: 141.245, priority: 3 },
  { id: "donald-mps",        name: "Donald District Hospital",             suburb: "Donald",          state: "VIC", type: "hospital",     lat: -36.363, lon: 142.985, priority: 3 },
  { id: "kerang-district",   name: "Kerang District Health",               suburb: "Kerang",          state: "VIC", type: "hospital",     lat: -35.727, lon: 143.918, priority: 3 },
  { id: "sea-lake-mps",      name: "Sea Lake & District Health",           suburb: "Sea Lake",        state: "VIC", type: "hospital",     lat: -35.506, lon: 142.853, priority: 3 },
  { id: "ouyen-mps",         name: "Ouyen District Health",                suburb: "Ouyen",           state: "VIC", type: "hospital",     lat: -35.069, lon: 142.318, priority: 3 },
  { id: "charlton-mps",      name: "Charlton & District Health",           suburb: "Charlton",        state: "VIC", type: "hospital",     lat: -36.267, lon: 143.350, priority: 3 },
  { id: "st-arnaud-mps",     name: "Mallee Track Health (St Arnaud)",      suburb: "St Arnaud",       state: "VIC", type: "hospital",     lat: -36.620, lon: 143.256, priority: 3 },

  // ── VIC Nursing Homes & Aged Care ──
  { id: "bendigo-ac-1",      name: "Bendigo Aged Care (Regis)",            suburb: "Bendigo",         state: "VIC", type: "aged_care",    lat: -36.761, lon: 144.286, priority: 3,  icao: "YBDG" },
  { id: "ballarat-ac-1",     name: "Ballarat Aged Care (Mercy)",           suburb: "Ballarat",        state: "VIC", type: "aged_care",    lat: -37.563, lon: 143.846, priority: 3,  icao: "YBLT" },
  { id: "mildura-ac-1",      name: "Mildura Aged Care (Sunraysia)",        suburb: "Mildura",         state: "VIC", type: "aged_care",    lat: -34.200, lon: 142.152, priority: 3,  icao: "YMIA" },
  { id: "geelong-ac-1",      name: "Geelong Aged Care (Barwon Health)",    suburb: "Geelong",         state: "VIC", type: "aged_care",    lat: -38.154, lon: 144.357, priority: 3 },
  { id: "shepparton-ac-1",   name: "Shepparton Aged Care (GVH)",           suburb: "Shepparton",      state: "VIC", type: "aged_care",    lat: -36.380, lon: 145.400, priority: 3,  icao: "YSHT" },
  { id: "warrnambool-ac-1",  name: "Warrnambool Nursing Home (South West)",suburb: "Warrnambool",     state: "VIC", type: "nursing_home",  lat: -38.385, lon: 142.492, priority: 3 },
  { id: "horsham-ac-1",      name: "Horsham Aged Care (Wimmera)",          suburb: "Horsham",         state: "VIC", type: "aged_care",    lat: -36.716, lon: 142.202, priority: 3,  icao: "YHSM" },
  { id: "swan-hill-ac-1",    name: "Swan Hill Aged Care (Fronditha)",      suburb: "Swan Hill",       state: "VIC", type: "aged_care",    lat: -35.340, lon: 143.555, priority: 3,  icao: "YSWH" },

  // ── VIC Retirement Villages ──
  { id: "melb-rv-1",         name: "Melbourne Retirement (Bupa Templestowe)", suburb: "Templestowe",  state: "VIC", type: "retirement",   lat: -37.748, lon: 145.169, priority: 4 },
  { id: "geelong-rv-1",      name: "Geelong Retirement (Barwon)",          suburb: "Geelong",         state: "VIC", type: "retirement",   lat: -38.149, lon: 144.350, priority: 4 },
  { id: "bendigo-rv-1",      name: "Bendigo Retirement Village (Uniting)", suburb: "Bendigo",         state: "VIC", type: "retirement",   lat: -36.759, lon: 144.281, priority: 4,  icao: "YBDG" },
  { id: "ballarat-rv-1",     name: "Ballarat Retirement Village (Baptcare)", suburb: "Ballarat",      state: "VIC", type: "retirement",   lat: -37.558, lon: 143.840, priority: 4,  icao: "YBLT" },
  { id: "mildura-rv-1",      name: "Mildura Retirement Village (Sunraysia)", suburb: "Mildura",       state: "VIC", type: "retirement",   lat: -34.198, lon: 142.148, priority: 4,  icao: "YMIA" },

  // ─── TASMANIA — Hospitals ─────────────────────────────────────────────────
  { id: "rht-hobart",        name: "Royal Hobart Hospital",                suburb: "Hobart",          state: "TAS", type: "hospital",     lat: -42.883, lon: 147.329, priority: 1,  icao: "YMHB" },
  { id: "launceston-general", name: "Launceston General Hospital",          suburb: "Launceston",      state: "TAS", type: "hospital",     lat: -41.447, lon: 147.130, priority: 1,  icao: "YMLT" },
  { id: "northwest-burnie",   name: "North West Regional Hospital (Burnie)", suburb: "Burnie",        state: "TAS", type: "hospital",     lat: -41.055, lon: 145.913, priority: 1,  icao: "YWYY" },
  { id: "mersey-devonport",   name: "Mersey Community Hospital (Devonport)", suburb: "Devonport",     state: "TAS", type: "hospital",     lat: -41.177, lon: 146.356, priority: 1,  icao: "YDPO" },
  { id: "calvary-hobart",     name: "Calvary St Luke's Hospital",           suburb: "Hobart",         state: "TAS", type: "hospital",     lat: -42.878, lon: 147.323, priority: 2,  icao: "YMHB" },
  { id: "st-helens-district", name: "St Helens District Hospital",          suburb: "St Helens",      state: "TAS", type: "hospital",     lat: -41.326, lon: 148.248, priority: 2 },
  { id: "scottsdale-district", name: "Scottsdale District Hospital",        suburb: "Scottsdale",     state: "TAS", type: "hospital",     lat: -41.156, lon: 147.517, priority: 2 },
  { id: "deloraine-district", name: "Deloraine Community Hospital",         suburb: "Deloraine",      state: "TAS", type: "hospital",     lat: -41.524, lon: 146.648, priority: 2 },
  { id: "smithton-district",  name: "Smithton District Hospital",            suburb: "Smithton",       state: "TAS", type: "hospital",     lat: -40.844, lon: 145.123, priority: 2 },
  { id: "queenstown-district", name: "Queenstown District Hospital",         suburb: "Queenstown",    state: "TAS", type: "hospital",     lat: -42.081, lon: 145.556, priority: 2 },
  { id: "strahan-mps",        name: "Strahan Community Hospital",            suburb: "Strahan",        state: "TAS", type: "hospital",     lat: -42.153, lon: 145.335, priority: 3 },
  { id: "swansea-mps",        name: "Swansea Community Hospital",            suburb: "Swansea",        state: "TAS", type: "hospital",     lat: -42.122, lon: 148.072, priority: 3 },
  { id: "richmond-community", name: "Richmond Community Health",             suburb: "Richmond",       state: "TAS", type: "hospital",     lat: -42.736, lon: 147.433, priority: 3 },

  // ── TAS Nursing Homes & Aged Care ──
  { id: "hobart-ac-1",        name: "Hobart Aged Care (Regis Rosetta)",     suburb: "Hobart",         state: "TAS", type: "aged_care",    lat: -42.880, lon: 147.332, priority: 2,  icao: "YMHB" },
  { id: "launceston-ac-1",    name: "Launceston Aged Care (Bupa)",          suburb: "Launceston",     state: "TAS", type: "aged_care",    lat: -41.450, lon: 147.132, priority: 2,  icao: "YMLT" },
  { id: "burnie-ac-1",        name: "Burnie Aged Care (North West)",        suburb: "Burnie",         state: "TAS", type: "aged_care",    lat: -41.058, lon: 145.915, priority: 2,  icao: "YWYY" },
  { id: "devonport-ac-1",     name: "Devonport Aged Care (Mersey Care)",    suburb: "Devonport",      state: "TAS", type: "aged_care",    lat: -41.179, lon: 146.358, priority: 2,  icao: "YDPO" },
  { id: "hobart-ac-2",        name: "Hobart Nursing Home (St Lukes Health)", suburb: "Hobart",        state: "TAS", type: "nursing_home",  lat: -42.875, lon: 147.326, priority: 3,  icao: "YMHB" },
  { id: "launceston-rv-1",    name: "Launceston Retirement Village (Uniting)", suburb: "Launceston",  state: "TAS", type: "retirement",   lat: -41.445, lon: 147.128, priority: 3,  icao: "YMLT" },
  { id: "hobart-rv-1",        name: "Hobart Retirement Village (Baptcare)", suburb: "Hobart",         state: "TAS", type: "retirement",   lat: -42.886, lon: 147.335, priority: 3,  icao: "YMHB" },
  { id: "burnie-rv-1",        name: "Burnie Retirement Village",            suburb: "Burnie",         state: "TAS", type: "retirement",   lat: -41.060, lon: 145.917, priority: 3,  icao: "YWYY" },
  { id: "devonport-rv-1",     name: "Devonport Retirement Village (Calvary)", suburb: "Devonport",   state: "TAS", type: "retirement",   lat: -41.175, lon: 146.354, priority: 3,  icao: "YDPO" },
];

// ── Search helper ──────────────────────────────────────────────────────────────
export function searchFacilities(query: string, limit = 12): PatientFacility[] {
  if (!query || query.trim().length < 2) {
    // Return most common (priority 1) first
    return PATIENT_FACILITIES
      .filter(f => f.priority <= 1)
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
      .slice(0, limit);
  }

  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/);

  const scored = PATIENT_FACILITIES.map(f => {
    const haystack = `${f.name} ${f.suburb} ${f.state}`.toLowerCase();
    let score = 0;

    // Exact name prefix match — highest score
    if (f.name.toLowerCase().startsWith(q)) score += 100;
    // Suburb match
    if (f.suburb.toLowerCase().startsWith(q)) score += 60;
    // All tokens present
    if (tokens.every(t => haystack.includes(t))) score += 40;
    // Any token present
    tokens.forEach(t => { if (haystack.includes(t)) score += 10; });
    // Type bonus for hospitals
    if (f.type === "hospital") score += 2;
    // Priority bonus (lower priority number = higher priority)
    score += Math.max(0, 5 - f.priority);

    return { f, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.f.name.localeCompare(b.f.name))
    .slice(0, limit)
    .map(s => s.f);
}

export const FACILITY_TYPE_LABELS: Record<PatientFacility["type"], string> = {
  hospital:     "Hospital",
  nursing_home: "Nursing Home",
  aged_care:    "Aged Care",
  retirement:   "Retirement Village",
};

export const FACILITY_TYPE_ICONS: Record<PatientFacility["type"], string> = {
  hospital:     "🏥",
  nursing_home: "🏠",
  aged_care:    "🏡",
  retirement:   "🌿",
};
