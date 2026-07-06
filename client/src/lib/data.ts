// Medivac.ai — Demo data and types

export type UserRole = 'pilot' | 'nurse' | 'senior_flight_nurse' | 'ordering_nurse' | 'doctor' | 'dispatcher' | 'engineer' | 'safety' | 'senior_management' | 'admin';

export interface RoleConfig {
  id: UserRole;
  label: string;
  color: string;
  badge: string;
  icon: string;
}

export const ROLES: RoleConfig[] = [
  { id: 'pilot', label: 'Pilot', color: 'text-cyan-400', badge: 'status-blue', icon: '✈' },
  { id: 'nurse',              label: 'Flight Nurse',            color: 'text-green-400',   badge: 'status-green',  icon: '🏥' },
  { id: 'senior_flight_nurse', label: 'Senior Flight Nurse',     color: 'text-emerald-400', badge: 'status-green',  icon: '🏥' },
  { id: 'ordering_nurse',      label: 'Ordering / Stores Nurse', color: 'text-teal-400',    badge: 'status-green',  icon: '📦' },
  { id: 'doctor', label: 'Doctor', color: 'text-green-300', badge: 'status-green', icon: '⚕' },
  { id: 'dispatcher', label: 'Dispatcher', color: 'text-yellow-400', badge: 'status-yellow', icon: '📡' },
  { id: 'engineer', label: 'Engineer', color: 'text-orange-400', badge: 'status-orange', icon: '🔧' },
  { id: 'safety', label: 'Safety / Compliance', color: 'text-purple-400', badge: 'status-gray', icon: '🛡' },
  { id: 'senior_management', label: 'Senior Management', color: 'text-amber-300', badge: 'status-yellow', icon: '⭐' },
  { id: 'admin', label: 'System Admin', color: 'text-red-400', badge: 'status-red', icon: '⚙' },
];

export interface Mission {
  id: string;
  callsign: string;
  type: 'NEPT' | 'ACC' | 'Medevac' | 'RAHS' | 'Dental' | 'Ferry' | 'Special';
  status: 'Pending' | 'Active' | 'Airborne' | 'Complete' | 'Cancelled';
  aircraft: string;
  pilot: string;
  nurse?: string;
  doctor?: string;
  from: string;
  to: string;
  etd: string;
  eta: string;
  priority: 'P1' | 'P2' | 'P3' | 'Routine';
  releaseGates: { label: string; ok: boolean }[];
}

export const MISSIONS: Mission[] = [
  {
    id: 'M001',
    callsign: 'MEDIVAC 01',
    type: 'Medevac',
    status: 'Active',
    aircraft: 'VH-XYJ',
    pilot: 'Capt. R. Hughes',
    nurse: 'S. Mitchell RN',
    doctor: 'Dr. K. Patel',
    from: 'YSDU',
    to: 'YSSY',
    etd: '06:30',
    eta: '08:15',
    priority: 'P1',
    releaseGates: [
      { label: 'Flight Plan Filed', ok: true },
      { label: 'W&B Calculated', ok: true },
      { label: 'APG Release', ok: true },
      { label: 'Medical Crew Release', ok: true },
      { label: 'Maintenance Release', ok: true },
      { label: 'Fuel Confirmed', ok: true },
    ],
  },
  {
    id: 'M002',
    callsign: 'MEDIVAC 02',
    type: 'NEPT',
    status: 'Pending',
    aircraft: 'VH-XYR',
    pilot: 'Capt. T. Barnes',
    nurse: 'J. O\'Brien RN',
    from: 'YBHI',
    to: 'YDYS',
    etd: '08:45',
    eta: '10:30',
    priority: 'P2',
    releaseGates: [
      { label: 'Flight Plan Filed', ok: true },
      { label: 'W&B Calculated', ok: true },
      { label: 'APG Release', ok: false },
      { label: 'Medical Crew Release', ok: true },
      { label: 'Maintenance Release', ok: true },
      { label: 'Fuel Confirmed', ok: false },
    ],
  },
  {
    id: 'M003',
    callsign: 'DENTAL 01',
    type: 'Dental',
    status: 'Complete',
    aircraft: 'VH-XYU',
    pilot: 'Capt. M. Clarke',
    from: 'YSDU',
    to: 'YMOR',
    etd: '05:00',
    eta: '06:10',
    priority: 'Routine',
    releaseGates: [
      { label: 'Flight Plan Filed', ok: true },
      { label: 'W&B Calculated', ok: true },
      { label: 'APG Release', ok: true },
      { label: 'Medical Crew Release', ok: true },
      { label: 'Maintenance Release', ok: true },
      { label: 'Fuel Confirmed', ok: true },
    ],
  },
  {
    id: 'M004',
    callsign: 'MEDIVAC 03',
    type: 'ACC',
    status: 'Airborne',
    aircraft: 'VH-XYJ',
    pilot: 'Capt. S. Nguyen',
    nurse: 'C. Andrews RN',
    from: 'YWLG',
    to: 'YSDU',
    etd: '04:00',
    eta: '05:45',
    priority: 'P1',
    releaseGates: [
      { label: 'Flight Plan Filed', ok: true },
      { label: 'W&B Calculated', ok: true },
      { label: 'APG Release', ok: true },
      { label: 'Medical Crew Release', ok: true },
      { label: 'Maintenance Release', ok: true },
      { label: 'Fuel Confirmed', ok: true },
    ],
  },
];

export interface Aircraft {
  rego: string;
  type: string;
  base: string;
  status: 'Serviceable' | 'Maintenance' | 'AOG' | 'Airborne';
  nextService: string;
  techLogState: 'Current' | 'Overdue' | 'Pending';
  defects: number;
  maintenanceRelease: boolean;
}

export const AIRCRAFT: Aircraft[] = [
  // ── King Air B200 series (10) ───────────────────────────────────────────────
  { rego: 'VH-LTQ', type: 'King Air B200C', base: 'Sydney (YSSY)',        status: 'Serviceable', nextService: '120 hrs (62 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-MVW', type: 'King Air B200',  base: 'Dubbo (YSDU)',         status: 'Airborne',    nextService: '120 hrs (28 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-MVX', type: 'King Air B200C', base: 'Broken Hill (YBHI)',   status: 'Serviceable', nextService: '120 hrs (55 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-MWH', type: 'King Air B200',  base: 'Dubbo (YSDU)',         status: 'Serviceable', nextService: '120 hrs (71 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-MWK', type: 'King Air B200C', base: 'Dubbo (YSDU)',         status: 'Serviceable', nextService: '120 hrs (44 remaining)', techLogState: 'Current',  defects: 1, maintenanceRelease: true  },
  { rego: 'VH-RFD', type: 'King Air B200C', base: 'Canberra (YSCB)',      status: 'Serviceable', nextService: '120 hrs (91 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-XYJ', type: 'King Air B200C', base: 'Broken Hill (YBHI)',   status: 'Serviceable', nextService: '120 hrs (37 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-XYO', type: 'King Air B200C', base: 'Sydney (YSSY)',        status: 'Serviceable', nextService: '120 hrs (48 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-XYR', type: 'King Air B200',  base: 'Broken Hill (YBHI)',   status: 'Serviceable', nextService: '120 hrs (88 remaining)', techLogState: 'Current',  defects: 1, maintenanceRelease: true  },
  { rego: 'VH-XYU', type: 'King Air B200',  base: 'Dubbo (YSDU)',         status: 'Maintenance', nextService: 'In maintenance',          techLogState: 'Pending',  defects: 3, maintenanceRelease: false },
  // ── King Air B350 series (4) ────────────────────────────────────────────────
  { rego: 'VH-MQD', type: 'King Air B350',  base: 'Dubbo (YSDU)',         status: 'Airborne',    nextService: '300 hrs (44 remaining)', techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-MQK', type: 'King Air B350',  base: 'Sydney (YSSY)',        status: 'Serviceable', nextService: '300 hrs (112 remaining)', techLogState: 'Current', defects: 0, maintenanceRelease: true  },
  { rego: 'VH-NAJ', type: 'King Air B350',  base: 'Broken Hill (YBHI)',   status: 'Serviceable', nextService: '300 hrs (87 remaining)',  techLogState: 'Current',  defects: 0, maintenanceRelease: true  },
  { rego: 'VH-VPQ', type: 'King Air B350',  base: 'Launceston (YMLT)',   status: 'Serviceable', nextService: '300 hrs (156 remaining)', techLogState: 'Current', defects: 0, maintenanceRelease: true  },
];

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  base: string;
  dutyStatus: 'On Duty' | 'On Call' | 'Off Duty' | 'P Day' | 'Leave';
  hoursFlown: number;
  maxHours: number;
  nextCheck: string;
  currency: boolean;
}

export const CREW: CrewMember[] = [
  { id: 'C1', name: 'Capt. R. Hughes', role: 'Pilot', base: 'Dubbo', dutyStatus: 'On Duty', hoursFlown: 62, maxHours: 100, nextCheck: '15 Jul 2026', currency: true },
  { id: 'C2', name: 'Capt. T. Barnes', role: 'Pilot', base: 'Broken Hill', dutyStatus: 'On Call', hoursFlown: 48, maxHours: 100, nextCheck: '22 Aug 2026', currency: true },
  { id: 'C3', name: 'Capt. M. Clarke', role: 'Pilot', base: 'Dubbo', dutyStatus: 'Off Duty', hoursFlown: 91, maxHours: 100, nextCheck: '10 Jun 2026', currency: false },
  { id: 'C4', name: 'S. Mitchell RN', role: 'Flight Nurse', base: 'Dubbo', dutyStatus: 'On Duty', hoursFlown: 55, maxHours: 120, nextCheck: '30 Jul 2026', currency: true },
  { id: 'C5', name: 'Dr. K. Patel', role: 'Flight Doctor', base: 'Dubbo', dutyStatus: 'On Duty', hoursFlown: 38, maxHours: 120, nextCheck: '15 Sep 2026', currency: true },
  { id: 'C6', name: 'J. O\'Brien RN', role: 'Flight Nurse', base: 'Broken Hill', dutyStatus: 'P Day', hoursFlown: 70, maxHours: 120, nextCheck: '5 Aug 2026', currency: true },
];

export const NSW_AIRPORTS = [
  { icao: 'YSDU', name: 'Dubbo', lat: -32.217, lng: 148.574 },
  { icao: 'YBHI', name: 'Broken Hill', lat: -31.994, lng: 141.472 },
  { icao: 'YSSY', name: 'Sydney', lat: -33.946, lng: 151.177 },
  { icao: 'YWLG', name: 'Walgett', lat: -30.032, lng: 148.126 },
  { icao: 'YMOR', name: 'Moree', lat: -29.499, lng: 149.845 },
  { icao: 'YDYS', name: 'Deniliquin', lat: -35.559, lng: 144.946 },
  { icao: 'YNAR', name: 'Narromine', lat: -32.214, lng: 148.225 },
  { icao: 'YCOR', name: 'Cobar', lat: -31.538, lng: 145.794 },
  { icao: 'YLHI', name: 'Lord Howe Is.', lat: -31.538, lng: 159.077 },
  { icao: 'YMLT', name: 'Launceston', lat: -41.545, lng: 147.214 },
];

export const ISO_ITEMS = [
  { standard: 'ISO 9001:2015', section: '4.1 Context', document: 'Context Analysis', owner: 'GM', status: 'In Progress', evidence: 'Draft' },
  { standard: 'ISO 13485:2016', section: '7.3 Design', document: 'Design & Dev Plan', owner: 'CTO', status: 'Complete', evidence: 'Filed' },
  { standard: 'ISO/IEC 27001', section: 'A.9 Access Ctrl', document: 'RBAC Policy', owner: 'IT', status: 'Complete', evidence: 'Filed' },
  { standard: 'ISO/IEC 25010', section: '4.2 Quality', document: 'QA Framework', owner: 'QA Lead', status: 'Gap', evidence: 'Missing' },
  { standard: 'ISO 9001:2015', section: '8.4 Ext. Providers', document: 'Supplier Controls', owner: 'Ops', status: 'In Progress', evidence: 'Draft' },
  { standard: 'ISO 13485:2016', section: '8.2 Clinical', document: 'Clinical Workflow Val.', owner: 'Medical Dir.', status: 'In Progress', evidence: 'Draft' },
];
