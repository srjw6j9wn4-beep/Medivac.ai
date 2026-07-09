import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbstcyegnzufiebnktrx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3RjeWVnbnp1ZmllYm5rdHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTQ3MDUsImV4cCI6MjA5OTE3MDcwNX0.GfiAmBe66R64dISvV0Dzg0BNV9p5wsw5dps0RGRSmJY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { transport: WebSocket },
});

// ── Type definitions ─────────────────────────────────────────────────────────
export type User = { id: number; username: string; password: string };
export type InsertUser = { username: string; password: string };
export type MorningBrief = { id: number; date: string; dataKey: string; payload: string; updatedAt: string; updatedBy: string };
export type PassengerManifest = { id: number; flightDate: string; flightNumber: string; aircraftReg: string; bookingTeam: string; sectors: string; passengers: string; status: string; signToken: string | null; signedAt: string | null; signatureData: string | null; signedBy: string | null; createdAt: string; createdBy: string; updatedAt: string };
export type DrugEdit = { id: number; drugId: string; expiryDate: string | null; batchNo: string | null; updatedAt: string; updatedBy: string };
export type ChestItemEdit = { id: number; chestId: string; itemId: string; expiryDate: string | null; qtyPresent: number | null; note: string | null; flagReorder: number; updatedAt: string; updatedBy: string };
export type NeptTask = { id: number; taskRef: string; status: string; priority: string; requestTime: string; requiredBy: string | null; pickupLocation: string; pickupIcao: string | null; destLocation: string; destIcao: string | null; sectors: string | null; patientName: string | null; patientRef: string | null; escortName: string | null; referringHospital: string | null; receivingHospital: string | null; aircraftReg: string | null; pilotName: string | null; nurseName: string | null; dispatchedBy: string | null; estimatedEta: string | null; actualDepart: string | null; actualArrive: string | null; completedAt: string | null; notes: string | null; groundTransportCost: number | null; createdAt: string; updatedAt: string };
export type Notification = { id: number; type: string; title: string; body: string; taskRef: string | null; taskId: number | null; readAt: string | null; createdAt: string };
export type SpecialMissionSession = { id: number; missionType: string; missionRef: string; status: string; aircraftReg: string | null; destination: string | null; checklistData: string; signoffs: string; notes: string | null; groundTransportCost: number | null; createdAt: string; updatedAt: string; completedAt: string | null };
export type Invoice = { id: number; invoiceNumber: string; invoiceDate: string; dueDate: string; serviceDate: string; status: string; payerType: string; payerName: string; taskRef: string | null; patientId: string | null; pickupLocation: string | null; destination: string | null; aircraftReg: string | null; missionType: string; baseAmount: number; afterHoursSurcharge: number; additionalCharges: number; gstAmount: number; totalAmount: number; notes: string | null; submittedAt: string | null; paidAt: string | null; createdAt: string; updatedAt: string };
export type CharterQuote = { id: number; quoteNumber: string; clientName: string; clientContact: string | null; purpose: string; aircraftType: string; departureDate: string; legs: string; crew: string; costs: string; totalCost: number; marginPercent: number; finalQuote: number; status: string; notes: string | null; createdAt: string; updatedAt: string };
export type InsertCharterQuote = Omit<CharterQuote, 'id'>;
export type QuoteRate = { id: number; rateKey: string; rateValue: string; category: string; label: string; unit: string; source: string | null; effectiveDate: string | null; previousValue: string | null; previousDate: string | null; lastChecked: string | null; autoUpdateEnabled: number; notes: string | null; updatedAt: string };
export type CostOptimizerConfig = { id: number; key: string; value: string; category: string; updatedAt: string };
export type ActionPlanItem = { id: number; title: string; category: string; estimatedAnnualValue: number; priority: string; status: string; notes: string | null; sourceType: string | null; createdAt: string; updatedAt: string };
export type InsertActionPlanItem = Omit<ActionPlanItem, 'id'>;

export interface TechLogEntry {
  id?: number; uuid: string; device_id: string; aircraft: string; date: string;
  from_icao: string; to_icao: string; pic: string; sic?: string; block_off?: string;
  takeoff?: string; landing?: string; block_on?: string; block_hours?: string;
  flight_hours?: string; fuel_start?: number; fuel_uplift?: number; fuel_finish?: number;
  mission_type?: string; defects?: string; remarks?: string; payload: string; synced_at: string;
}

// ── Helper: map DB snake_case row → camelCase type ───────────────────────────
function mapMorningBrief(r: any): MorningBrief {
  return { id: r.id, date: r.date, dataKey: r.data_key, payload: r.payload, updatedAt: r.updated_at, updatedBy: r.updated_by };
}
function mapManifest(r: any): PassengerManifest {
  return { id: r.id, flightDate: r.flight_date, flightNumber: r.flight_number, aircraftReg: r.aircraft_reg, bookingTeam: r.booking_team, sectors: r.sectors, passengers: r.passengers, status: r.status, signToken: r.sign_token, signedAt: r.signed_at, signatureData: r.signature_data, signedBy: r.signed_by, createdAt: r.created_at, createdBy: r.created_by, updatedAt: r.updated_at };
}
function mapDrugEdit(r: any): DrugEdit {
  return { id: r.id, drugId: r.drug_id, expiryDate: r.expiry_date, batchNo: r.batch_no, updatedAt: r.updated_at, updatedBy: r.updated_by };
}
function mapChestItemEdit(r: any): ChestItemEdit {
  return { id: r.id, chestId: r.chest_id, itemId: r.item_id, expiryDate: r.expiry_date, qtyPresent: r.qty_present, note: r.note, flagReorder: r.flag_reorder, updatedAt: r.updated_at, updatedBy: r.updated_by };
}
function mapNeptTask(r: any): NeptTask {
  return { id: r.id, taskRef: r.task_ref, status: r.status, priority: r.priority, requestTime: r.request_time, requiredBy: r.required_by, pickupLocation: r.pickup_location, pickupIcao: r.pickup_icao, destLocation: r.dest_location, destIcao: r.dest_icao, sectors: r.sectors, patientName: r.patient_name, patientRef: r.patient_ref, escortName: r.escort_name, referringHospital: r.referring_hospital, receivingHospital: r.receiving_hospital, aircraftReg: r.aircraft_reg, pilotName: r.pilot_name, nurseName: r.nurse_name, dispatchedBy: r.dispatched_by, estimatedEta: r.estimated_eta, actualDepart: r.actual_depart, actualArrive: r.actual_arrive, completedAt: r.completed_at, notes: r.notes, groundTransportCost: r.ground_transport_cost, createdAt: r.created_at, updatedAt: r.updated_at };
}
function mapNotification(r: any): Notification {
  return { id: r.id, type: r.type, title: r.title, body: r.body, taskRef: r.task_ref, taskId: r.task_id, readAt: r.read_at, createdAt: r.created_at };
}
function mapSpecialMission(r: any): SpecialMissionSession {
  return { id: r.id, missionType: r.mission_type, missionRef: r.mission_ref, status: r.status, aircraftReg: r.aircraft_reg, destination: r.destination, checklistData: r.checklist_data, signoffs: r.signoffs, notes: r.notes, groundTransportCost: r.ground_transport_cost, createdAt: r.created_at, updatedAt: r.updated_at, completedAt: r.completed_at };
}
function mapInvoice(r: any): Invoice {
  return { id: r.id, invoiceNumber: r.invoice_number, invoiceDate: r.invoice_date, dueDate: r.due_date, serviceDate: r.service_date, status: r.status, payerType: r.payer_type, payerName: r.payer_name, taskRef: r.task_ref, patientId: r.patient_id, pickupLocation: r.pickup_location, destination: r.destination, aircraftReg: r.aircraft_reg, missionType: r.mission_type, baseAmount: r.base_amount, afterHoursSurcharge: r.after_hours_surcharge, additionalCharges: r.additional_charges, gstAmount: r.gst_amount, totalAmount: r.total_amount, notes: r.notes, submittedAt: r.submitted_at, paidAt: r.paid_at, createdAt: r.created_at, updatedAt: r.updated_at };
}
function mapCharterQuote(r: any): CharterQuote {
  return { id: r.id, quoteNumber: r.quote_number, clientName: r.client_name, clientContact: r.client_contact, purpose: r.purpose, aircraftType: r.aircraft_type, departureDate: r.departure_date, legs: r.legs, crew: r.crew, costs: r.costs, totalCost: r.total_cost, marginPercent: r.margin_percent, finalQuote: r.final_quote, status: r.status, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at };
}
function mapQuoteRate(r: any): QuoteRate {
  return { id: r.id, rateKey: r.rate_key, rateValue: r.rate_value, category: r.category, label: r.label, unit: r.unit, source: r.source, effectiveDate: r.effective_date, previousValue: r.previous_value, previousDate: r.previous_date, lastChecked: r.last_checked, autoUpdateEnabled: r.auto_update_enabled, notes: r.notes, updatedAt: r.updated_at };
}
function mapCostConfig(r: any): CostOptimizerConfig {
  return { id: r.id, key: r.key, value: r.value, category: r.category, updatedAt: r.updated_at };
}
function mapActionItem(r: any): ActionPlanItem {
  return { id: r.id, title: r.title, category: r.category, estimatedAnnualValue: r.estimated_annual_value, priority: r.priority, status: r.status, notes: r.notes, sourceType: r.source_type, createdAt: r.created_at, updatedAt: r.updated_at };
}

// ── Error helper ─────────────────────────────────────────────────────────────
async function sb<T>(promise: Promise<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data as T;
}

// ── Default rate seed data ───────────────────────────────────────────────────
const AIRSERVICES_SOURCE = 'https://www.airservicesaustralia.com/industry-info/aviation-charging/';
const AVDATA_SOURCE = 'https://avdata.com.au/airport-charge-rates';
const DEFAULT_RATES = [
  { rate_key: 'enroute_rate', rate_value: '0.90', category: 'airservices', label: 'Enroute Nav (IFR <20t)', unit: '$/100km/tonne', source: AIRSERVICES_SOURCE, effective_date: '2025-08-01' },
  { rate_key: 'met_surcharge_rate', rate_value: '0.077', category: 'airservices', label: 'Met Service Surcharge', unit: '$/100km/tonne', source: AIRSERVICES_SOURCE, effective_date: '2025-08-01' },
  { rate_key: 'tnc_major_rate', rate_value: '12.11', category: 'airservices', label: 'Terminal Nav Charge — Major Airports', unit: '$/tonne', source: AIRSERVICES_SOURCE, effective_date: '2025-08-01' },
  { rate_key: 'tnc_regional_rate', rate_value: '6.96', category: 'airservices', label: 'Terminal Nav Charge — Regional', unit: '$/tonne', source: AIRSERVICES_SOURCE, effective_date: '2025-08-01' },
  { rate_key: 'tnc_out_of_hours', rate_value: '261.00', category: 'airservices', label: 'TNC Out-of-Hours Surcharge (>15min)', unit: '$/movement', source: AIRSERVICES_SOURCE, effective_date: '2025-08-01' },
  { rate_key: 'tnc_minimum_major', rate_value: '21.00', category: 'airservices', label: 'TNC Minimum Charge (major airports)', unit: '$', source: AIRSERVICES_SOURCE, effective_date: '2025-08-01' },
  { rate_key: 'fuel_jet_a1_per_litre', rate_value: '1.92', category: 'fuel', label: 'Jet-A1 Fuel Price (incl GST)', unit: '$/litre', source: 'https://avdata.com.au', effective_date: '2026-07-01' },
  { rate_key: 'crew_captain', rate_value: '185.00', category: 'crew', label: 'Captain Hourly Rate', unit: '$/hr', source: null, effective_date: null },
  { rate_key: 'crew_first_officer', rate_value: '145.00', category: 'crew', label: 'First Officer Hourly Rate', unit: '$/hr', source: null, effective_date: null },
  { rate_key: 'crew_flight_nurse', rate_value: '95.00', category: 'crew', label: 'Flight Nurse/Paramedic Hourly Rate', unit: '$/hr', source: null, effective_date: null },
  { rate_key: 'crew_icu_doctor', rate_value: '180.00', category: 'crew', label: 'ICU Doctor Hourly Rate', unit: '$/hr', source: null, effective_date: null },
  { rate_key: 'landing_default', rate_value: '14.00', category: 'landing', label: 'Landing Fee — Default', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YSDU', rate_value: '15.45', category: 'landing', label: 'Landing Fee — Dubbo', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YBHI', rate_value: '15.45', category: 'landing', label: 'Landing Fee — Broken Hill', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YBTL', rate_value: '16.00', category: 'landing', label: 'Landing Fee — Townsville', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YARM', rate_value: '15.45', category: 'landing', label: 'Landing Fee — Armidale', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YBUD', rate_value: '15.03', category: 'landing', label: 'Landing Fee — Bundaberg', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YLHI', rate_value: '22.00', category: 'landing', label: 'Landing Fee — Lord Howe Island', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YSTW', rate_value: '15.45', category: 'landing', label: 'Landing Fee — Tamworth', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YNRM', rate_value: '15.45', category: 'landing', label: 'Landing Fee — Narromine', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YORG', rate_value: '14.00', category: 'landing', label: 'Landing Fee — Orange', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YBKE', rate_value: '14.00', category: 'landing', label: 'Landing Fee — Bourke', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YNBR', rate_value: '14.00', category: 'landing', label: 'Landing Fee — Narrabri', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YSSY', rate_value: '5.54', category: 'landing', label: 'Landing Fee — Sydney', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YMML', rate_value: '27.68', category: 'landing', label: 'Landing Fee — Melbourne GA', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'landing_YBBN', rate_value: '6.18', category: 'landing', label: 'Landing Fee — Brisbane', unit: '$/tonne', source: AVDATA_SOURCE, effective_date: null },
  { rate_key: 'accommodation_per_person_night', rate_value: '180.00', category: 'accommodation', label: 'Crew Accommodation', unit: '$/person/night', source: null, effective_date: null },
  { rate_key: 'ground_ambulance', rate_value: '250.00', category: 'ground', label: 'Ambulance Transfer', unit: '$/leg', source: null, effective_date: null },
  { rate_key: 'ground_bus', rate_value: '150.00', category: 'ground', label: 'Bus', unit: '$/leg', source: null, effective_date: null },
  { rate_key: 'ground_taxi', rate_value: '800.00', category: 'ground', label: 'Taxi Charter', unit: '$/leg', source: null, effective_date: null },
  { rate_key: 'ground_van', rate_value: '120.00', category: 'ground', label: 'Van', unit: '$/leg', source: null, effective_date: null },
];

export async function seedDefaultRates(): Promise<void> {
  const { count } = await supabase.from('quote_rates').select('*', { count: 'exact', head: true }).then(r => ({ count: r.count ?? 0 }));
  if (count > 0) return;
  const now = new Date().toISOString();
  const rows = DEFAULT_RATES.map(r => ({ ...r, auto_update_enabled: 1, previous_value: null, previous_date: null, last_checked: now, notes: null, updated_at: now }));
  await supabase.from('quote_rates').insert(rows);
  console.log(`[quote-rates] Seeded ${DEFAULT_RATES.length} default rates`);
}

// ── Types for new tables ──────────────────────────────────────────────────────
export type ClientRate = { id: number; orgName: string; orgCode: string; missionType: string; rateType: string; rateAmountCents: number; afterHoursSurchargeCents: number; gstApplicable: number; notes: string | null; effectiveFrom: string | null; active: number; createdAt: string; updatedAt: string; };
export type InvoiceLine = { id: number; invoiceBatchId: string; orgCode: string; orgName: string; missionType: string; serviceDate: string; taskRef: string | null; aircraftReg: string | null; fromIcao: string | null; toIcao: string | null; flightTimeMins: number | null; paxCount: number; rateAmountCents: number; afterHoursSurchargeCents: number; additionalCents: number; gstCents: number; lineTotalCents: number; status: string; invoiceNumber: string | null; notes: string | null; flagged: number; flagReason: string | null; autoPopulated: number; createdAt: string; updatedAt: string; };
export type InvoiceAuditEntry = { id: number; entityType: string; entityId: string; action: string; performedBy: string; detail: string | null; createdAt: string; };
export type InvoiceBatch = { id: number; batchId: string; periodType: string; periodStart: string; periodEnd: string; status: string; totalLines: number; totalAmountCents: number; flaggedCount: number; approvedBy: string | null; approvedAt: string | null; sentAt: string | null; notes: string | null; createdAt: string; updatedAt: string; };

function mapClientRate(r: any): ClientRate {
  return { id: r.id, orgName: r.org_name, orgCode: r.org_code, missionType: r.mission_type, rateType: r.rate_type, rateAmountCents: r.rate_amount_cents, afterHoursSurchargeCents: r.after_hours_surcharge_cents ?? 0, gstApplicable: r.gst_applicable ?? 0, notes: r.notes, effectiveFrom: r.effective_from, active: r.active ?? 1, createdAt: r.created_at, updatedAt: r.updated_at };
}
function mapInvoiceLine(r: any): InvoiceLine {
  return { id: r.id, invoiceBatchId: r.invoice_batch_id, orgCode: r.org_code, orgName: r.org_name, missionType: r.mission_type, serviceDate: r.service_date, taskRef: r.task_ref, aircraftReg: r.aircraft_reg, fromIcao: r.from_icao, toIcao: r.to_icao, flightTimeMins: r.flight_time_mins, paxCount: r.pax_count ?? 1, rateAmountCents: r.rate_amount_cents, afterHoursSurchargeCents: r.after_hours_surcharge_cents ?? 0, additionalCents: r.additional_cents ?? 0, gstCents: r.gst_cents ?? 0, lineTotalCents: r.line_total_cents, status: r.status, invoiceNumber: r.invoice_number, notes: r.notes, flagged: r.flagged ?? 0, flagReason: r.flag_reason, autoPopulated: r.auto_populated ?? 1, createdAt: r.created_at, updatedAt: r.updated_at };
}
function mapAuditEntry(r: any): InvoiceAuditEntry {
  return { id: r.id, entityType: r.entity_type, entityId: r.entity_id, action: r.action, performedBy: r.performed_by, detail: r.detail, createdAt: r.created_at };
}
function mapInvoiceBatch(r: any): InvoiceBatch {
  return { id: r.id, batchId: r.batch_id, periodType: r.period_type, periodStart: r.period_start, periodEnd: r.period_end, status: r.status, totalLines: r.total_lines ?? 0, totalAmountCents: r.total_amount_cents ?? 0, flaggedCount: r.flagged_count ?? 0, approvedBy: r.approved_by, approvedAt: r.approved_at, sentAt: r.sent_at, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at };
}
class DatabaseStorage {

  // ── Users ─────────────────────────────────────────────────────────────────
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    return data ?? undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from('users').select('*').eq('username', username).single();
    return data ?? undefined;
  }
  async createUser(u: InsertUser): Promise<User> {
    return sb(supabase.from('users').insert(u).select().single());
  }

  // ── Morning Brief ─────────────────────────────────────────────────────────
  async getMorningBriefData(date: string, dataKey: string): Promise<MorningBrief | undefined> {
    const { data } = await supabase.from('morning_brief_data').select('*').eq('date', date).eq('data_key', dataKey).single();
    return data ? mapMorningBrief(data) : undefined;
  }
  async upsertMorningBriefData(date: string, dataKey: string, payload: string, updatedBy: string): Promise<MorningBrief> {
    const updatedAt = new Date().toISOString();
    const existing = await this.getMorningBriefData(date, dataKey);
    if (existing) {
      const { data } = await supabase.from('morning_brief_data').update({ payload, updated_at: updatedAt, updated_by: updatedBy }).eq('id', existing.id).select().single();
      return mapMorningBrief(data);
    }
    const { data } = await supabase.from('morning_brief_data').insert({ date, data_key: dataKey, payload, updated_at: updatedAt, updated_by: updatedBy }).select().single();
    return mapMorningBrief(data);
  }

  // ── Manifests ─────────────────────────────────────────────────────────────
  async createManifest(d: Omit<PassengerManifest, 'id'>): Promise<PassengerManifest> {
    const row = { flight_date: d.flightDate, flight_number: d.flightNumber, aircraft_reg: d.aircraftReg, booking_team: d.bookingTeam, sectors: d.sectors, passengers: d.passengers, status: d.status, sign_token: d.signToken, signed_at: d.signedAt, signature_data: d.signatureData, signed_by: d.signedBy, created_at: d.createdAt, created_by: d.createdBy, updated_at: d.updatedAt };
    const { data } = await supabase.from('passenger_manifests').insert(row).select().single();
    return mapManifest(data);
  }
  async getManifest(id: number): Promise<PassengerManifest | undefined> {
    const { data } = await supabase.from('passenger_manifests').select('*').eq('id', id).single();
    return data ? mapManifest(data) : undefined;
  }
  async getManifestByToken(token: string): Promise<PassengerManifest | undefined> {
    const { data } = await supabase.from('passenger_manifests').select('*').eq('sign_token', token).single();
    return data ? mapManifest(data) : undefined;
  }
  async listManifests(flightDate?: string): Promise<PassengerManifest[]> {
    let q = supabase.from('passenger_manifests').select('*').order('created_at', { ascending: false });
    if (flightDate) q = q.eq('flight_date', flightDate);
    const { data } = await q;
    return (data ?? []).map(mapManifest);
  }
  async updateManifest(id: number, u: Partial<PassengerManifest>): Promise<PassengerManifest> {
    const row: any = { updated_at: new Date().toISOString() };
    if (u.flightDate !== undefined) row.flight_date = u.flightDate;
    if (u.flightNumber !== undefined) row.flight_number = u.flightNumber;
    if (u.aircraftReg !== undefined) row.aircraft_reg = u.aircraftReg;
    if (u.bookingTeam !== undefined) row.booking_team = u.bookingTeam;
    if (u.status !== undefined) row.status = u.status;
    if (u.signToken !== undefined) row.sign_token = u.signToken;
    if (u.signedAt !== undefined) row.signed_at = u.signedAt;
    if (u.signatureData !== undefined) row.signature_data = u.signatureData;
    if (u.signedBy !== undefined) row.signed_by = u.signedBy;
    if (u.passengers !== undefined) row.passengers = u.passengers;
    if (u.sectors !== undefined) row.sectors = u.sectors;
    const { data } = await supabase.from('passenger_manifests').update(row).eq('id', id).select().single();
    return mapManifest(data);
  }

  // ── Tech Log ──────────────────────────────────────────────────────────────
  async upsertTechLogEntry(e: TechLogEntry): Promise<TechLogEntry> {
    const row = { uuid: e.uuid, device_id: e.device_id, aircraft: e.aircraft, date: e.date, from_icao: e.from_icao, to_icao: e.to_icao, pic: e.pic, sic: e.sic ?? null, block_off: e.block_off ?? null, takeoff: e.takeoff ?? null, landing: e.landing ?? null, block_on: e.block_on ?? null, block_hours: e.block_hours ?? null, flight_hours: e.flight_hours ?? null, fuel_start: e.fuel_start ?? null, fuel_uplift: e.fuel_uplift ?? null, fuel_finish: e.fuel_finish ?? null, mission_type: e.mission_type ?? null, defects: e.defects ?? null, remarks: e.remarks ?? null, payload: e.payload, synced_at: e.synced_at };
    await supabase.from('tech_log_entries').upsert(row, { onConflict: 'uuid' });
    return this.getTechLogEntry(e.uuid) as Promise<TechLogEntry>;
  }
  async listTechLogEntries(date?: string, aircraft?: string): Promise<TechLogEntry[]> {
    let q = supabase.from('tech_log_entries').select('*').order('date', { ascending: false });
    if (date) q = q.eq('date', date);
    if (aircraft) q = q.eq('aircraft', aircraft);
    const { data } = await q;
    return (data ?? []) as TechLogEntry[];
  }
  async getTechLogEntry(uuid: string): Promise<TechLogEntry | undefined> {
    const { data } = await supabase.from('tech_log_entries').select('*').eq('uuid', uuid).single();
    return data ?? undefined;
  }

  // ── NOTAM cache ───────────────────────────────────────────────────────────
  async getCachedNotams(icao: string): Promise<{ notams: any[]; fetchedAt: string } | undefined> {
    const { data } = await supabase.from('notam_cache').select('*').eq('icao', icao).order('id', { ascending: false }).limit(1).single();
    if (!data) return undefined;
    return { notams: JSON.parse(data.notams_json), fetchedAt: data.fetched_at };
  }
  async saveNotamCache(icao: string, notams: any[]): Promise<void> {
    const now = new Date().toISOString();
    await supabase.from('notam_cache').insert({ icao, notams_json: JSON.stringify(notams), fetched_at: now });
    const { data: rows } = await supabase.from('notam_cache').select('id').eq('icao', icao).order('id', { ascending: false });
    if (rows && rows.length > 3) {
      const toDelete = rows.slice(3).map((r: any) => r.id);
      await supabase.from('notam_cache').delete().in('id', toDelete);
    }
  }

  // ── Push subscriptions ────────────────────────────────────────────────────
  async savePushSubscription(endpoint: string, keys: object, deviceLabel: string): Promise<void> {
    const now = new Date().toISOString();
    await supabase.from('push_subscriptions').upsert({ endpoint, keys_json: JSON.stringify(keys), device_label: deviceLabel, created_at: now }, { onConflict: 'endpoint' });
  }
  async listPushSubscriptions(): Promise<{ endpoint: string; keys: any; deviceLabel: string }[]> {
    const { data } = await supabase.from('push_subscriptions').select('*');
    return (data ?? []).map((r: any) => ({ endpoint: r.endpoint, keys: JSON.parse(r.keys_json), deviceLabel: r.device_label }));
  }
  async deletePushSubscription(endpoint: string): Promise<void> {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }

  // ── Active missions ───────────────────────────────────────────────────────
  async upsertActiveMission(m: { missionId: string; aircraft: string; airports: string[]; pic: string; missionType: string; date: string }): Promise<void> {
    const now = new Date().toISOString();
    await supabase.from('active_missions').upsert({ mission_id: m.missionId, aircraft: m.aircraft, airports: JSON.stringify(m.airports), pic: m.pic, mission_type: m.missionType, date: m.date, created_at: now, completed: 0 }, { onConflict: 'mission_id' });
  }
  async completeMission(missionId: string): Promise<void> {
    await supabase.from('active_missions').update({ completed: 1 }).eq('mission_id', missionId);
  }
  async listActiveMissions(): Promise<any[]> {
    const { data } = await supabase.from('active_missions').select('*').eq('completed', 0).order('created_at', { ascending: false });
    return (data ?? []).map((r: any) => ({ ...r, airports: JSON.parse(r.airports) }));
  }

  // ── Drug edits ────────────────────────────────────────────────────────────
  async listDrugEdits(): Promise<DrugEdit[]> {
    const { data } = await supabase.from('drug_edits').select('*');
    return (data ?? []).map(mapDrugEdit);
  }
  async upsertDrugEdit(drugId: string, expiryDate: string | null, batchNo: string | null, updatedBy: string): Promise<DrugEdit> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('drug_edits').upsert({ drug_id: drugId, expiry_date: expiryDate, batch_no: batchNo, updated_at: now, updated_by: updatedBy }, { onConflict: 'drug_id' }).select().single();
    return mapDrugEdit(data);
  }

  // ── Chest item edits ──────────────────────────────────────────────────────
  async listChestItemEdits(chestId?: string): Promise<ChestItemEdit[]> {
    let q = supabase.from('chest_item_edits').select('*');
    if (chestId) q = q.eq('chest_id', chestId);
    const { data } = await q;
    return (data ?? []).map(mapChestItemEdit);
  }
  async upsertChestItemEdit(chestId: string, itemId: string, d: { expiryDate?: string | null; qtyPresent?: number | null; note?: string | null; flagReorder?: boolean }, updatedBy: string): Promise<ChestItemEdit> {
    const now = new Date().toISOString();
    const existing = await this.listChestItemEdits(chestId).then(rows => rows.find(r => r.itemId === itemId));
    const row: any = { chest_id: chestId, item_id: itemId, updated_at: now, updated_by: updatedBy, expiry_date: d.expiryDate ?? existing?.expiryDate ?? null, qty_present: d.qtyPresent ?? existing?.qtyPresent ?? null, note: d.note ?? existing?.note ?? null, flag_reorder: d.flagReorder !== undefined ? (d.flagReorder ? 1 : 0) : (existing?.flagReorder ?? 0) };
    const { data } = await supabase.from('chest_item_edits').upsert(row, { onConflict: 'chest_id,item_id' }).select().single();
    return mapChestItemEdit(data);
  }

  // ── NEPT tasks ────────────────────────────────────────────────────────────
  async listNeptTasks(): Promise<NeptTask[]> {
    const { data } = await supabase.from('nept_tasks').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapNeptTask);
  }
  async getNeptTask(id: number): Promise<NeptTask | undefined> {
    const { data } = await supabase.from('nept_tasks').select('*').eq('id', id).single();
    return data ? mapNeptTask(data) : undefined;
  }
  async createNeptTask(d: Omit<NeptTask, 'id'>): Promise<NeptTask> {
    const row = { task_ref: d.taskRef, status: d.status, priority: d.priority, request_time: d.requestTime, required_by: d.requiredBy, pickup_location: d.pickupLocation, pickup_icao: d.pickupIcao, dest_location: d.destLocation, dest_icao: d.destIcao, sectors: d.sectors, patient_name: d.patientName, patient_ref: d.patientRef, escort_name: d.escortName, referring_hospital: d.referringHospital, receiving_hospital: d.receivingHospital, aircraft_reg: d.aircraftReg, pilot_name: d.pilotName, nurse_name: d.nurseName, dispatched_by: d.dispatchedBy, estimated_eta: d.estimatedEta, actual_depart: d.actualDepart, actual_arrive: d.actualArrive, completed_at: d.completedAt, notes: d.notes, ground_transport_cost: d.groundTransportCost, created_at: d.createdAt, updated_at: d.updatedAt };
    const { data } = await supabase.from('nept_tasks').insert(row).select().single();
    return mapNeptTask(data);
  }
  async updateNeptTask(id: number, u: Partial<NeptTask>): Promise<NeptTask> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { taskRef: 'task_ref', status: 'status', priority: 'priority', requestTime: 'request_time', requiredBy: 'required_by', pickupLocation: 'pickup_location', pickupIcao: 'pickup_icao', destLocation: 'dest_location', destIcao: 'dest_icao', sectors: 'sectors', patientName: 'patient_name', patientRef: 'patient_ref', escortName: 'escort_name', referringHospital: 'referring_hospital', receivingHospital: 'receiving_hospital', aircraftReg: 'aircraft_reg', pilotName: 'pilot_name', nurseName: 'nurse_name', dispatchedBy: 'dispatched_by', estimatedEta: 'estimated_eta', actualDepart: 'actual_depart', actualArrive: 'actual_arrive', completedAt: 'completed_at', notes: 'notes', groundTransportCost: 'ground_transport_cost' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('nept_tasks').update(row).eq('id', id).select().single();
    return mapNeptTask(data);
  }
  async deleteNeptTask(id: number): Promise<void> {
    await supabase.from('nept_tasks').delete().eq('id', id);
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  async createNotification(d: { type: string; title: string; body: string; taskRef?: string; taskId?: number }): Promise<Notification> {
    const { data } = await supabase.from('notifications').insert({ type: d.type, title: d.title, body: d.body, task_ref: d.taskRef ?? null, task_id: d.taskId ?? null, read_at: null, created_at: new Date().toISOString() }).select().single();
    return mapNotification(data);
  }
  async listUnreadNotifications(): Promise<Notification[]> {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapNotification).sort((a, b) => { if (!a.readAt && b.readAt) return -1; if (a.readAt && !b.readAt) return 1; return b.createdAt.localeCompare(a.createdAt); });
  }
  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const { data } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).select().single();
    return data ? mapNotification(data) : undefined;
  }
  async markAllNotificationsRead(): Promise<void> {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  async listInvoices(): Promise<Invoice[]> {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapInvoice);
  }
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const { data } = await supabase.from('invoices').select('*').eq('id', id).single();
    return data ? mapInvoice(data) : undefined;
  }
  async createInvoice(d: Omit<Invoice, 'id'>): Promise<Invoice> {
    const row = { invoice_number: d.invoiceNumber, invoice_date: d.invoiceDate, due_date: d.dueDate, service_date: d.serviceDate, status: d.status, payer_type: d.payerType, payer_name: d.payerName, task_ref: d.taskRef, patient_id: d.patientId, pickup_location: d.pickupLocation, destination: d.destination, aircraft_reg: d.aircraftReg, mission_type: d.missionType, base_amount: d.baseAmount, after_hours_surcharge: d.afterHoursSurcharge, additional_charges: d.additionalCharges, gst_amount: d.gstAmount, total_amount: d.totalAmount, notes: d.notes, submitted_at: d.submittedAt, paid_at: d.paidAt, created_at: d.createdAt, updated_at: d.updatedAt };
    const { data } = await supabase.from('invoices').insert(row).select().single();
    return mapInvoice(data);
  }
  async updateInvoice(id: number, u: Partial<Invoice>): Promise<Invoice> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { invoiceNumber: 'invoice_number', invoiceDate: 'invoice_date', dueDate: 'due_date', serviceDate: 'service_date', status: 'status', payerType: 'payer_type', payerName: 'payer_name', taskRef: 'task_ref', patientId: 'patient_id', pickupLocation: 'pickup_location', destination: 'destination', aircraftReg: 'aircraft_reg', missionType: 'mission_type', baseAmount: 'base_amount', afterHoursSurcharge: 'after_hours_surcharge', additionalCharges: 'additional_charges', gstAmount: 'gst_amount', totalAmount: 'total_amount', notes: 'notes', submittedAt: 'submitted_at', paidAt: 'paid_at' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('invoices').update(row).eq('id', id).select().single();
    return mapInvoice(data);
  }
  async deleteInvoice(id: number): Promise<boolean> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    return !error;
  }
  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).like('invoice_number', `%NEPT-${year}%`).then(r => ({ count: r.count ?? 0 }));
    return `INV-NEPT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── Special Mission QC Sessions ───────────────────────────────────────────
  async listSpecialMissionSessions(): Promise<SpecialMissionSession[]> {
    const { data } = await supabase.from('special_mission_sessions').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapSpecialMission);
  }
  async getSpecialMissionSession(id: number): Promise<SpecialMissionSession | undefined> {
    const { data } = await supabase.from('special_mission_sessions').select('*').eq('id', id).single();
    return data ? mapSpecialMission(data) : undefined;
  }
  async createSpecialMissionSession(d: Omit<SpecialMissionSession, 'id'>): Promise<SpecialMissionSession> {
    const row = { mission_type: d.missionType, mission_ref: d.missionRef, status: d.status, aircraft_reg: d.aircraftReg, destination: d.destination, checklist_data: d.checklistData, signoffs: d.signoffs, notes: d.notes, ground_transport_cost: d.groundTransportCost, created_at: d.createdAt, updated_at: d.updatedAt, completed_at: d.completedAt };
    const { data } = await supabase.from('special_mission_sessions').insert(row).select().single();
    return mapSpecialMission(data);
  }
  async updateSpecialMissionSession(id: number, u: Partial<SpecialMissionSession>): Promise<SpecialMissionSession> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { missionType: 'mission_type', missionRef: 'mission_ref', status: 'status', aircraftReg: 'aircraft_reg', destination: 'destination', checklistData: 'checklist_data', signoffs: 'signoffs', notes: 'notes', groundTransportCost: 'ground_transport_cost', completedAt: 'completed_at' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('special_mission_sessions').update(row).eq('id', id).select().single();
    return mapSpecialMission(data);
  }

  // ── Charter Quotes ────────────────────────────────────────────────────────
  async getCharterQuotes(): Promise<CharterQuote[]> {
    const { data } = await supabase.from('charter_quotes').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapCharterQuote);
  }
  async getCharterQuote(id: number): Promise<CharterQuote | undefined> {
    const { data } = await supabase.from('charter_quotes').select('*').eq('id', id).single();
    return data ? mapCharterQuote(data) : undefined;
  }
  async createCharterQuote(d: InsertCharterQuote): Promise<CharterQuote> {
    const now = new Date().toISOString();
    const row = { quote_number: d.quoteNumber, client_name: d.clientName, client_contact: d.clientContact, purpose: d.purpose, aircraft_type: d.aircraftType, departure_date: d.departureDate, legs: d.legs, crew: d.crew, costs: d.costs, total_cost: d.totalCost, margin_percent: d.marginPercent, final_quote: d.finalQuote, status: d.status, notes: d.notes, created_at: d.createdAt ?? now, updated_at: d.updatedAt ?? now };
    const { data } = await supabase.from('charter_quotes').insert(row).select().single();
    return mapCharterQuote(data);
  }
  async updateCharterQuote(id: number, u: Partial<InsertCharterQuote>): Promise<CharterQuote | undefined> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { quoteNumber: 'quote_number', clientName: 'client_name', clientContact: 'client_contact', purpose: 'purpose', aircraftType: 'aircraft_type', departureDate: 'departure_date', legs: 'legs', crew: 'crew', costs: 'costs', totalCost: 'total_cost', marginPercent: 'margin_percent', finalQuote: 'final_quote', status: 'status', notes: 'notes' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('charter_quotes').update(row).eq('id', id).select().single();
    return data ? mapCharterQuote(data) : undefined;
  }
  async deleteCharterQuote(id: number): Promise<boolean> {
    const { error } = await supabase.from('charter_quotes').delete().eq('id', id);
    return !error;
  }
  async getNextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase.from('charter_quotes').select('*', { count: 'exact', head: true }).like('quote_number', `%CQ-${year}%`).then(r => ({ count: r.count ?? 0 }));
    return `CQ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── Quote Rates ───────────────────────────────────────────────────────────
  async getAllRates(): Promise<QuoteRate[]> {
    const { data } = await supabase.from('quote_rates').select('*').order('category').order('label');
    return (data ?? []).map(mapQuoteRate);
  }
  async getRateByKey(key: string): Promise<QuoteRate | undefined> {
    const { data } = await supabase.from('quote_rates').select('*').eq('rate_key', key).single();
    return data ? mapQuoteRate(data) : undefined;
  }
  async upsertRate(key: string, value: string, previousValue?: string, previousDate?: string, lastChecked?: string): Promise<QuoteRate> {
    const now = lastChecked ?? new Date().toISOString();
    const existing = await this.getRateByKey(key);
    if (existing) {
      const { data } = await supabase.from('quote_rates').update({ rate_value: value, previous_value: previousValue ?? existing.previousValue, previous_date: previousDate ?? existing.previousDate, last_checked: now, updated_at: now }).eq('rate_key', key).select().single();
      return mapQuoteRate(data);
    }
    const { data } = await supabase.from('quote_rates').insert({ rate_key: key, rate_value: value, category: 'unknown', label: key, unit: '', previous_value: previousValue ?? null, previous_date: previousDate ?? null, last_checked: now, auto_update_enabled: 1, updated_at: now }).select().single();
    return mapQuoteRate(data);
  }
  async updateRateManual(key: string, value: string, notes?: string): Promise<QuoteRate | undefined> {
    const existing = await this.getRateByKey(key);
    if (!existing) return undefined;
    const prevValue = existing.rateValue !== value ? existing.rateValue : existing.previousValue;
    const prevDate = existing.rateValue !== value ? new Date().toISOString().slice(0, 10) : existing.previousDate;
    const { data } = await supabase.from('quote_rates').update({ rate_value: value, previous_value: prevValue, previous_date: prevDate, notes: notes ?? existing.notes, updated_at: new Date().toISOString() }).eq('rate_key', key).select().single();
    return data ? mapQuoteRate(data) : undefined;
  }

  // ── Cost Optimizer ────────────────────────────────────────────────────────
  async getCostConfig(): Promise<CostOptimizerConfig[]> {
    const { data } = await supabase.from('cost_optimizer_config').select('*').order('category').order('key');
    return (data ?? []).map(mapCostConfig);
  }
  async upsertCostConfig(key: string, value: string, category: string): Promise<CostOptimizerConfig> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('cost_optimizer_config').upsert({ key, value, category, updated_at: now }, { onConflict: 'key' }).select().single();
    return mapCostConfig(data);
  }
  async getActionPlan(): Promise<ActionPlanItem[]> {
    const { data } = await supabase.from('action_plan_items').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapActionItem);
  }
  async createActionItem(item: Omit<InsertActionPlanItem, 'createdAt' | 'updatedAt'>): Promise<ActionPlanItem> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('action_plan_items').insert({ title: item.title, category: item.category, estimated_annual_value: item.estimatedAnnualValue, priority: item.priority, status: item.status ?? 'proposed', notes: item.notes ?? null, source_type: item.sourceType ?? null, created_at: now, updated_at: now }).select().single();
    return mapActionItem(data);
  }
  async updateActionItem(id: number, u: Partial<ActionPlanItem>): Promise<ActionPlanItem | undefined> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { title: 'title', category: 'category', estimatedAnnualValue: 'estimated_annual_value', priority: 'priority', status: 'status', notes: 'notes', sourceType: 'source_type' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('action_plan_items').update(row).eq('id', id).select().single();
    return data ? mapActionItem(data) : undefined;
  }
  async deleteActionItem(id: number): Promise<boolean> {
    const { error } = await supabase.from('action_plan_items').delete().eq('id', id);
    return !error;
  }

  // ── Client Rates ──────────────────────────────────────────────────────────
  async listClientRates(): Promise<ClientRate[]> {
    const { data } = await supabase.from('client_rates').select('*').order('org_name').order('mission_type');
    return (data ?? []).map(mapClientRate);
  }
  async getClientRate(id: number): Promise<ClientRate | undefined> {
    const { data } = await supabase.from('client_rates').select('*').eq('id', id).single();
    return data ? mapClientRate(data) : undefined;
  }
  async getRateForOrg(orgCode: string, missionType: string): Promise<ClientRate | undefined> {
    const { data } = await supabase.from('client_rates').select('*').eq('org_code', orgCode).eq('mission_type', missionType).eq('active', 1).order('effective_from', { ascending: false }).limit(1).single();
    return data ? mapClientRate(data) : undefined;
  }
  async createClientRate(d: Omit<ClientRate, 'id'>): Promise<ClientRate> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('client_rates').insert({ org_name: d.orgName, org_code: d.orgCode, mission_type: d.missionType, rate_type: d.rateType, rate_amount_cents: d.rateAmountCents, after_hours_surcharge_cents: d.afterHoursSurchargeCents, gst_applicable: d.gstApplicable, notes: d.notes, effective_from: d.effectiveFrom, active: d.active, created_at: now, updated_at: now }).select().single();
    return mapClientRate(data);
  }
  async updateClientRate(id: number, u: Partial<ClientRate>): Promise<ClientRate | undefined> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { orgName: 'org_name', orgCode: 'org_code', missionType: 'mission_type', rateType: 'rate_type', rateAmountCents: 'rate_amount_cents', afterHoursSurchargeCents: 'after_hours_surcharge_cents', gstApplicable: 'gst_applicable', notes: 'notes', effectiveFrom: 'effective_from', active: 'active' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('client_rates').update(row).eq('id', id).select().single();
    return data ? mapClientRate(data) : undefined;
  }
  async deleteClientRate(id: number): Promise<boolean> {
    const { error } = await supabase.from('client_rates').delete().eq('id', id);
    return !error;
  }

  // ── Invoice Lines ─────────────────────────────────────────────────────────
  async listInvoiceLines(filters?: { batchId?: string; orgCode?: string; status?: string; dateFrom?: string; dateTo?: string }): Promise<InvoiceLine[]> {
    let q = supabase.from('invoice_lines').select('*').order('service_date', { ascending: false });
    if (filters?.batchId) q = q.eq('invoice_batch_id', filters.batchId);
    if (filters?.orgCode) q = q.eq('org_code', filters.orgCode);
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.dateFrom) q = q.gte('service_date', filters.dateFrom);
    if (filters?.dateTo) q = q.lte('service_date', filters.dateTo);
    const { data } = await q;
    return (data ?? []).map(mapInvoiceLine);
  }
  async createInvoiceLine(d: Omit<InvoiceLine, 'id'>): Promise<InvoiceLine> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('invoice_lines').insert({ invoice_batch_id: d.invoiceBatchId, org_code: d.orgCode, org_name: d.orgName, mission_type: d.missionType, service_date: d.serviceDate, task_ref: d.taskRef, aircraft_reg: d.aircraftReg, from_icao: d.fromIcao, to_icao: d.toIcao, flight_time_mins: d.flightTimeMins, pax_count: d.paxCount, rate_amount_cents: d.rateAmountCents, after_hours_surcharge_cents: d.afterHoursSurchargeCents, additional_cents: d.additionalCents, gst_cents: d.gstCents, line_total_cents: d.lineTotalCents, status: d.status, invoice_number: d.invoiceNumber, notes: d.notes, flagged: d.flagged, flag_reason: d.flagReason, auto_populated: d.autoPopulated, created_at: now, updated_at: now }).select().single();
    return mapInvoiceLine(data);
  }
  async updateInvoiceLine(id: number, u: Partial<InvoiceLine>): Promise<InvoiceLine | undefined> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { status: 'status', notes: 'notes', flagged: 'flagged', flagReason: 'flag_reason', invoiceNumber: 'invoice_number', additionalCents: 'additional_cents', lineTotalCents: 'line_total_cents', rateAmountCents: 'rate_amount_cents', afterHoursSurchargeCents: 'after_hours_surcharge_cents', gstCents: 'gst_cents', flightTimeMins: 'flight_time_mins', paxCount: 'pax_count' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('invoice_lines').update(row).eq('id', id).select().single();
    return data ? mapInvoiceLine(data) : undefined;
  }
  async deleteInvoiceLine(id: number): Promise<boolean> {
    const { error } = await supabase.from('invoice_lines').delete().eq('id', id);
    return !error;
  }

  // ── Invoice Audit ─────────────────────────────────────────────────────────
  async logAudit(entityType: string, entityId: string, action: string, performedBy: string, detail?: string): Promise<void> {
    await supabase.from('invoice_audit').insert({ entity_type: entityType, entity_id: entityId, action, performed_by: performedBy, detail: detail ?? null, created_at: new Date().toISOString() });
  }
  async listAudit(entityType?: string, entityId?: string, limit = 200): Promise<InvoiceAuditEntry[]> {
    let q = supabase.from('invoice_audit').select('*').order('created_at', { ascending: false }).limit(limit);
    if (entityType) q = q.eq('entity_type', entityType);
    if (entityId) q = q.eq('entity_id', entityId);
    const { data } = await q;
    return (data ?? []).map(mapAuditEntry);
  }

  // ── Invoice Batches ───────────────────────────────────────────────────────
  async listInvoiceBatches(): Promise<InvoiceBatch[]> {
    const { data } = await supabase.from('invoice_batches').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapInvoiceBatch);
  }
  async getInvoiceBatch(batchId: string): Promise<InvoiceBatch | undefined> {
    const { data } = await supabase.from('invoice_batches').select('*').eq('batch_id', batchId).single();
    return data ? mapInvoiceBatch(data) : undefined;
  }
  async createInvoiceBatch(d: Omit<InvoiceBatch, 'id'>): Promise<InvoiceBatch> {
    const now = new Date().toISOString();
    const { data } = await supabase.from('invoice_batches').insert({ batch_id: d.batchId, period_type: d.periodType, period_start: d.periodStart, period_end: d.periodEnd, status: d.status, total_lines: d.totalLines, total_amount_cents: d.totalAmountCents, flagged_count: d.flaggedCount, approved_by: d.approvedBy, approved_at: d.approvedAt, sent_at: d.sentAt, notes: d.notes, created_at: now, updated_at: now }).select().single();
    return mapInvoiceBatch(data);
  }
  async updateInvoiceBatch(batchId: string, u: Partial<InvoiceBatch>): Promise<InvoiceBatch | undefined> {
    const row: any = { updated_at: new Date().toISOString() };
    const map: Record<string, string> = { status: 'status', totalLines: 'total_lines', totalAmountCents: 'total_amount_cents', flaggedCount: 'flagged_count', approvedBy: 'approved_by', approvedAt: 'approved_at', sentAt: 'sent_at', notes: 'notes' };
    for (const [k, v] of Object.entries(map)) if ((u as any)[k] !== undefined) row[v] = (u as any)[k];
    const { data } = await supabase.from('invoice_batches').update(row).eq('batch_id', batchId).select().single();
    return data ? mapInvoiceBatch(data) : undefined;
  }
}

export const storage = new DatabaseStorage();
