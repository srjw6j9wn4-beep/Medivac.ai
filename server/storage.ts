import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, sql as drizzleSql } from 'drizzle-orm';
import { pgTable, serial, text, integer, real } from 'drizzle-orm/pg-core';

// ── PostgreSQL connection (Supabase) ─────────────────────────────────────────
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 5 });
export const db = drizzle(client);

// ── Inline PG table definitions (mirrors schema.ts but for pg-core) ──────────
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  password: text('password').notNull(),
});

const morningBriefData = pgTable('morning_brief_data', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
  dataKey: text('data_key').notNull(),
  payload: text('payload').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull().default('dispatcher'),
});

const passengerManifests = pgTable('passenger_manifests', {
  id: serial('id').primaryKey(),
  flightDate: text('flight_date').notNull(),
  flightNumber: text('flight_number').notNull(),
  aircraftReg: text('aircraft_reg').notNull(),
  bookingTeam: text('booking_team').notNull(),
  sectors: text('sectors').notNull(),
  passengers: text('passengers').notNull(),
  status: text('status').notNull().default('draft'),
  signToken: text('sign_token'),
  signedAt: text('signed_at'),
  signatureData: text('signature_data'),
  signedBy: text('signed_by'),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const drugEditsTable = pgTable('drug_edits', {
  id: serial('id').primaryKey(),
  drugId: text('drug_id').notNull(),
  expiryDate: text('expiry_date'),
  batchNo: text('batch_no'),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull().default('nurse'),
});

const chestItemEditsTable = pgTable('chest_item_edits', {
  id: serial('id').primaryKey(),
  chestId: text('chest_id').notNull(),
  itemId: text('item_id').notNull(),
  expiryDate: text('expiry_date'),
  qtyPresent: integer('qty_present'),
  note: text('note'),
  flagReorder: integer('flag_reorder').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull().default('nurse'),
});

const neptTasks = pgTable('nept_tasks', {
  id: serial('id').primaryKey(),
  taskRef: text('task_ref').notNull(),
  status: text('status').notNull().default('Pending'),
  priority: text('priority').notNull().default('Routine'),
  requestTime: text('request_time').notNull(),
  requiredBy: text('required_by'),
  pickupLocation: text('pickup_location').notNull(),
  pickupIcao: text('pickup_icao'),
  destLocation: text('dest_location').notNull(),
  destIcao: text('dest_icao'),
  sectors: text('sectors'),
  patientName: text('patient_name'),
  patientRef: text('patient_ref'),
  escortName: text('escort_name'),
  referringHospital: text('referring_hospital'),
  receivingHospital: text('receiving_hospital'),
  aircraftReg: text('aircraft_reg'),
  pilotName: text('pilot_name'),
  nurseName: text('nurse_name'),
  dispatchedBy: text('dispatched_by'),
  estimatedEta: text('estimated_eta'),
  actualDepart: text('actual_depart'),
  actualArrive: text('actual_arrive'),
  completedAt: text('completed_at'),
  notes: text('notes'),
  groundTransportCost: integer('ground_transport_cost').default(200),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  taskRef: text('task_ref'),
  taskId: integer('task_id'),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull(),
});

const specialMissionSessions = pgTable('special_mission_sessions', {
  id: serial('id').primaryKey(),
  missionType: text('mission_type').notNull(),
  missionRef: text('mission_ref').notNull(),
  status: text('status').notNull().default('pre-flight'),
  aircraftReg: text('aircraft_reg'),
  destination: text('destination'),
  checklistData: text('checklist_data').notNull().default('{}'),
  signoffs: text('signoffs').notNull().default('[]'),
  notes: text('notes'),
  groundTransportCost: integer('ground_transport_cost').default(200),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
});

const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date').notNull(),
  serviceDate: text('service_date').notNull(),
  status: text('status').notNull().default('Draft'),
  payerType: text('payer_type').notNull(),
  payerName: text('payer_name').notNull(),
  taskRef: text('task_ref'),
  patientId: text('patient_id'),
  pickupLocation: text('pickup_location'),
  destination: text('destination'),
  aircraftReg: text('aircraft_reg'),
  missionType: text('mission_type').notNull().default('Standard NEPT'),
  baseAmount: integer('base_amount').notNull(),
  afterHoursSurcharge: integer('after_hours_surcharge').notNull().default(0),
  additionalCharges: integer('additional_charges').notNull().default(0),
  gstAmount: integer('gst_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull(),
  notes: text('notes'),
  submittedAt: text('submitted_at'),
  paidAt: text('paid_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const charterQuotes = pgTable('charter_quotes', {
  id: serial('id').primaryKey(),
  quoteNumber: text('quote_number').notNull(),
  clientName: text('client_name').notNull(),
  clientContact: text('client_contact'),
  purpose: text('purpose').notNull(),
  aircraftType: text('aircraft_type').notNull(),
  departureDate: text('departure_date').notNull(),
  legs: text('legs').notNull(),
  crew: text('crew').notNull(),
  costs: text('costs').notNull(),
  totalCost: integer('total_cost').notNull(),
  marginPercent: integer('margin_percent').notNull().default(15),
  finalQuote: integer('final_quote').notNull(),
  status: text('status').notNull().default('draft'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const quoteRates = pgTable('quote_rates', {
  id: serial('id').primaryKey(),
  rateKey: text('rate_key').notNull(),
  rateValue: text('rate_value').notNull(),
  category: text('category').notNull(),
  label: text('label').notNull(),
  unit: text('unit').notNull(),
  source: text('source'),
  effectiveDate: text('effective_date'),
  previousValue: text('previous_value'),
  previousDate: text('previous_date'),
  lastChecked: text('last_checked'),
  autoUpdateEnabled: integer('auto_update_enabled').notNull().default(1),
  notes: text('notes'),
  updatedAt: text('updated_at').notNull(),
});

const costOptimizerConfig = pgTable('cost_optimizer_config', {
  id: serial('id').primaryKey(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  category: text('category').notNull(),
  updatedAt: text('updated_at').notNull(),
});

const actionPlanItems = pgTable('action_plan_items', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  estimatedAnnualValue: integer('estimated_annual_value').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull().default('proposed'),
  notes: text('notes'),
  sourceType: text('source_type'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ── Re-export types so routes.ts imports continue to work ────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = { username: string; password: string };
export type MorningBrief = typeof morningBriefData.$inferSelect;
export type PassengerManifest = typeof passengerManifests.$inferSelect;
export type DrugEdit = typeof drugEditsTable.$inferSelect;
export type ChestItemEdit = typeof chestItemEditsTable.$inferSelect;
export type NeptTask = typeof neptTasks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type SpecialMissionSession = typeof specialMissionSessions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type CharterQuote = typeof charterQuotes.$inferSelect;
export type InsertCharterQuote = typeof charterQuotes.$inferInsert;
export type QuoteRate = typeof quoteRates.$inferSelect;
export type CostOptimizerConfig = typeof costOptimizerConfig.$inferSelect;
export type ActionPlanItem = typeof actionPlanItems.$inferSelect;
export type InsertActionPlanItem = Omit<typeof actionPlanItems.$inferInsert, 'id'>;

export interface TechLogEntry {
  id?: number;
  uuid: string;
  device_id: string;
  aircraft: string;
  date: string;
  from_icao: string;
  to_icao: string;
  pic: string;
  sic?: string;
  block_off?: string;
  takeoff?: string;
  landing?: string;
  block_on?: string;
  block_hours?: string;
  flight_hours?: string;
  fuel_start?: number;
  fuel_uplift?: number;
  fuel_finish?: number;
  mission_type?: string;
  defects?: string;
  remarks?: string;
  payload: string;
  synced_at: string;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMorningBriefData(date: string, dataKey: string): Promise<MorningBrief | undefined>;
  upsertMorningBriefData(date: string, dataKey: string, payload: string, updatedBy: string): Promise<MorningBrief>;
  createManifest(data: Omit<PassengerManifest, 'id'>): Promise<PassengerManifest>;
  getManifest(id: number): Promise<PassengerManifest | undefined>;
  getManifestByToken(token: string): Promise<PassengerManifest | undefined>;
  listManifests(flightDate?: string): Promise<PassengerManifest[]>;
  updateManifest(id: number, updates: Partial<PassengerManifest>): Promise<PassengerManifest>;
  upsertTechLogEntry(entry: TechLogEntry): Promise<TechLogEntry>;
  listTechLogEntries(date?: string, aircraft?: string): Promise<TechLogEntry[]>;
  getTechLogEntry(uuid: string): Promise<TechLogEntry | undefined>;
  listDrugEdits(): Promise<DrugEdit[]>;
  upsertDrugEdit(drugId: string, expiryDate: string | null, batchNo: string | null, updatedBy: string): Promise<DrugEdit>;
  listChestItemEdits(chestId?: string): Promise<ChestItemEdit[]>;
  upsertChestItemEdit(chestId: string, itemId: string, data: { expiryDate?: string | null; qtyPresent?: number | null; note?: string | null; flagReorder?: boolean }, updatedBy: string): Promise<ChestItemEdit>;
  listNeptTasks(): Promise<NeptTask[]>;
  getNeptTask(id: number): Promise<NeptTask | undefined>;
  createNeptTask(data: Omit<NeptTask, 'id'>): Promise<NeptTask>;
  updateNeptTask(id: number, updates: Partial<NeptTask>): Promise<NeptTask>;
  deleteNeptTask(id: number): Promise<void>;
  listInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(data: Omit<Invoice, 'id'>): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<boolean>;
  getNextInvoiceNumber(): Promise<string>;
  getCharterQuotes(): Promise<CharterQuote[]>;
  getCharterQuote(id: number): Promise<CharterQuote | undefined>;
  createCharterQuote(data: InsertCharterQuote): Promise<CharterQuote>;
  updateCharterQuote(id: number, data: Partial<InsertCharterQuote>): Promise<CharterQuote | undefined>;
  deleteCharterQuote(id: number): Promise<boolean>;
  getNextQuoteNumber(): Promise<string>;
  getCostConfig(): Promise<CostOptimizerConfig[]>;
  upsertCostConfig(key: string, value: string, category: string): Promise<CostOptimizerConfig>;
  getActionPlan(): Promise<ActionPlanItem[]>;
  createActionItem(item: Omit<InsertActionPlanItem, 'createdAt' | 'updatedAt'>): Promise<ActionPlanItem>;
  updateActionItem(id: number, updates: Partial<ActionPlanItem>): Promise<ActionPlanItem | undefined>;
  deleteActionItem(id: number): Promise<boolean>;
  getAllRates(): Promise<QuoteRate[]>;
  getRateByKey(key: string): Promise<QuoteRate | undefined>;
  upsertRate(key: string, value: string, previousValue?: string, previousDate?: string, lastChecked?: string): Promise<QuoteRate>;
  updateRateManual(key: string, value: string, notes?: string): Promise<QuoteRate | undefined>;
  createNotification(data: { type: string; title: string; body: string; taskRef?: string; taskId?: number }): Promise<Notification>;
  listUnreadNotifications(): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(): Promise<void>;
  getCachedNotams(icao: string): Promise<{ notams: any[]; fetchedAt: string } | undefined>;
  saveNotamCache(icao: string, notams: any[]): Promise<void>;
  savePushSubscription(endpoint: string, keys: object, deviceLabel: string): Promise<void>;
  listPushSubscriptions(): Promise<{ endpoint: string; keys: any; deviceLabel: string }[]>;
  deletePushSubscription(endpoint: string): Promise<void>;
  upsertActiveMission(m: { missionId: string; aircraft: string; airports: string[]; pic: string; missionType: string; date: string }): Promise<void>;
  completeMission(missionId: string): Promise<void>;
  listActiveMissions(): Promise<any[]>;
  listSpecialMissionSessions(): Promise<SpecialMissionSession[]>;
  getSpecialMissionSession(id: number): Promise<SpecialMissionSession | undefined>;
  createSpecialMissionSession(data: Omit<SpecialMissionSession, 'id'>): Promise<SpecialMissionSession>;
  updateSpecialMissionSession(id: number, updates: Partial<SpecialMissionSession>): Promise<SpecialMissionSession>;
}

// ── Default rate seed data ───────────────────────────────────────────────────
const AIRSERVICES_SOURCE = 'https://www.airservicesaustralia.com/industry-info/aviation-charging/';
const AVDATA_SOURCE = 'https://avdata.com.au/airport-charge-rates';

const DEFAULT_RATES = [
  { rateKey: 'enroute_rate', rateValue: '0.90', category: 'airservices', label: 'Enroute Nav (IFR <20t)', unit: '$/100km/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'met_surcharge_rate', rateValue: '0.077', category: 'airservices', label: 'Met Service Surcharge', unit: '$/100km/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_major_rate', rateValue: '12.11', category: 'airservices', label: 'Terminal Nav Charge — Major Airports', unit: '$/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_regional_rate', rateValue: '6.96', category: 'airservices', label: 'Terminal Nav Charge — Regional', unit: '$/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_out_of_hours', rateValue: '261.00', category: 'airservices', label: 'TNC Out-of-Hours Surcharge (>15min)', unit: '$/movement', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_minimum_major', rateValue: '21.00', category: 'airservices', label: 'TNC Minimum Charge (major airports)', unit: '$', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'fuel_jet_a1_per_litre', rateValue: '1.92', category: 'fuel', label: 'Jet-A1 Fuel Price (incl GST)', unit: '$/litre', source: 'https://avdata.com.au', effectiveDate: '2026-07-01' },
  { rateKey: 'crew_captain', rateValue: '185.00', category: 'crew', label: 'Captain Hourly Rate', unit: '$/hr', source: null, effectiveDate: null },
  { rateKey: 'crew_first_officer', rateValue: '145.00', category: 'crew', label: 'First Officer Hourly Rate', unit: '$/hr', source: null, effectiveDate: null },
  { rateKey: 'crew_flight_nurse', rateValue: '95.00', category: 'crew', label: 'Flight Nurse/Paramedic Hourly Rate', unit: '$/hr', source: null, effectiveDate: null },
  { rateKey: 'crew_icu_doctor', rateValue: '180.00', category: 'crew', label: 'ICU Doctor Hourly Rate', unit: '$/hr', source: null, effectiveDate: null },
  { rateKey: 'landing_default', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Default', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YSDU', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Dubbo', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YBHI', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Broken Hill', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YBTL', rateValue: '16.00', category: 'landing', label: 'Landing Fee — Townsville', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YARM', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Armidale', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YBUD', rateValue: '15.03', category: 'landing', label: 'Landing Fee — Bundaberg', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YLHI', rateValue: '22.00', category: 'landing', label: 'Landing Fee — Lord Howe Island', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YSTW', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Tamworth', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YNRM', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Narromine', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YORG', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Orange', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YBKE', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Bourke', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YNBR', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Narrabri', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YSSY', rateValue: '5.54', category: 'landing', label: 'Landing Fee — Sydney', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YMML', rateValue: '27.68', category: 'landing', label: 'Landing Fee — Melbourne GA', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'landing_YBBN', rateValue: '6.18', category: 'landing', label: 'Landing Fee — Brisbane', unit: '$/tonne', source: AVDATA_SOURCE, effectiveDate: null },
  { rateKey: 'accommodation_per_person_night', rateValue: '180.00', category: 'accommodation', label: 'Crew Accommodation', unit: '$/person/night', source: null, effectiveDate: null },
  { rateKey: 'ground_ambulance', rateValue: '250.00', category: 'ground', label: 'Ambulance Transfer', unit: '$/leg', source: null, effectiveDate: null },
  { rateKey: 'ground_bus', rateValue: '150.00', category: 'ground', label: 'Bus', unit: '$/leg', source: null, effectiveDate: null },
  { rateKey: 'ground_taxi', rateValue: '800.00', category: 'ground', label: 'Taxi Charter', unit: '$/leg', source: null, effectiveDate: null },
  { rateKey: 'ground_van', rateValue: '120.00', category: 'ground', label: 'Van', unit: '$/leg', source: null, effectiveDate: null },
];

export async function seedDefaultRates(): Promise<void> {
  const rows = await db.select({ count: drizzleSql<number>`count(*)` }).from(quoteRates);
  if (Number(rows[0].count) > 0) return;
  const now = new Date().toISOString();
  for (const r of DEFAULT_RATES) {
    await db.insert(quoteRates).values({
      rateKey: r.rateKey,
      rateValue: r.rateValue,
      category: r.category,
      label: r.label,
      unit: r.unit,
      source: r.source ?? null,
      effectiveDate: r.effectiveDate ?? null,
      previousValue: null,
      previousDate: null,
      lastChecked: now,
      autoUpdateEnabled: 1,
      notes: null,
      updatedAt: now,
    });
  }
  console.log(`[quote-rates] Seeded ${DEFAULT_RATES.length} default rates`);
}

// ── DatabaseStorage ──────────────────────────────────────────────────────────
export class DatabaseStorage implements IStorage {

  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).then(r => r[0]);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).then(r => r[0]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().then(r => r[0]);
  }

  async getMorningBriefData(date: string, dataKey: string): Promise<MorningBrief | undefined> {
    return db.select().from(morningBriefData)
      .where(and(eq(morningBriefData.date, date), eq(morningBriefData.dataKey, dataKey)))
      .then(r => r[0]);
  }

  async upsertMorningBriefData(date: string, dataKey: string, payload: string, updatedBy: string): Promise<MorningBrief> {
    const existing = await this.getMorningBriefData(date, dataKey);
    const updatedAt = new Date().toISOString();
    if (existing) {
      return db.update(morningBriefData)
        .set({ payload, updatedAt, updatedBy })
        .where(and(eq(morningBriefData.date, date), eq(morningBriefData.dataKey, dataKey)))
        .returning().then(r => r[0]);
    }
    return db.insert(morningBriefData)
      .values({ date, dataKey, payload, updatedAt, updatedBy })
      .returning().then(r => r[0]);
  }

  async createManifest(data: Omit<PassengerManifest, 'id'>): Promise<PassengerManifest> {
    return db.insert(passengerManifests).values(data as any).returning().then(r => r[0]);
  }

  async getManifest(id: number): Promise<PassengerManifest | undefined> {
    return db.select().from(passengerManifests).where(eq(passengerManifests.id, id)).then(r => r[0]);
  }

  async getManifestByToken(token: string): Promise<PassengerManifest | undefined> {
    return db.select().from(passengerManifests).where(eq(passengerManifests.signToken, token)).then(r => r[0]);
  }

  async listManifests(flightDate?: string): Promise<PassengerManifest[]> {
    if (flightDate) {
      return db.select().from(passengerManifests).where(eq(passengerManifests.flightDate, flightDate));
    }
    return db.select().from(passengerManifests);
  }

  async updateManifest(id: number, updates: Partial<PassengerManifest>): Promise<PassengerManifest> {
    return db.update(passengerManifests)
      .set({ ...updates, updatedAt: new Date().toISOString() } as any)
      .where(eq(passengerManifests.id, id))
      .returning().then(r => r[0]);
  }

  // ── Tech Log ─────────────────────────────────────────────────────────────
  async upsertTechLogEntry(entry: TechLogEntry): Promise<TechLogEntry> {
    await client`
      INSERT INTO tech_log_entries
        (uuid, device_id, aircraft, date, from_icao, to_icao, pic, sic,
         block_off, takeoff, landing, block_on, block_hours, flight_hours,
         fuel_start, fuel_uplift, fuel_finish, mission_type, defects, remarks,
         payload, synced_at)
      VALUES
        (${entry.uuid}, ${entry.device_id}, ${entry.aircraft}, ${entry.date},
         ${entry.from_icao}, ${entry.to_icao}, ${entry.pic}, ${entry.sic ?? null},
         ${entry.block_off ?? null}, ${entry.takeoff ?? null}, ${entry.landing ?? null},
         ${entry.block_on ?? null}, ${entry.block_hours ?? null}, ${entry.flight_hours ?? null},
         ${entry.fuel_start ?? null}, ${entry.fuel_uplift ?? null}, ${entry.fuel_finish ?? null},
         ${entry.mission_type ?? null}, ${entry.defects ?? null}, ${entry.remarks ?? null},
         ${entry.payload}, ${entry.synced_at})
      ON CONFLICT(uuid) DO UPDATE SET
        payload   = EXCLUDED.payload,
        defects   = EXCLUDED.defects,
        remarks   = EXCLUDED.remarks,
        synced_at = EXCLUDED.synced_at
    `;
    return this.getTechLogEntry(entry.uuid) as Promise<TechLogEntry>;
  }

  async listTechLogEntries(date?: string, aircraft?: string): Promise<TechLogEntry[]> {
    if (date && aircraft) {
      return client`SELECT * FROM tech_log_entries WHERE date = ${date} AND aircraft = ${aircraft} ORDER BY date DESC, block_off DESC` as any;
    } else if (date) {
      return client`SELECT * FROM tech_log_entries WHERE date = ${date} ORDER BY date DESC, block_off DESC` as any;
    } else if (aircraft) {
      return client`SELECT * FROM tech_log_entries WHERE aircraft = ${aircraft} ORDER BY date DESC, block_off DESC` as any;
    }
    return client`SELECT * FROM tech_log_entries ORDER BY date DESC, block_off DESC` as any;
  }

  async getTechLogEntry(uuid: string): Promise<TechLogEntry | undefined> {
    const rows = await client`SELECT * FROM tech_log_entries WHERE uuid = ${uuid}` as any[];
    return rows[0];
  }

  // ── NOTAM cache ──────────────────────────────────────────────────────────
  async getCachedNotams(icao: string): Promise<{ notams: any[]; fetchedAt: string } | undefined> {
    const rows = await client`SELECT notams_json, fetched_at FROM notam_cache WHERE icao = ${icao} ORDER BY id DESC LIMIT 1` as any[];
    if (!rows[0]) return undefined;
    return { notams: JSON.parse(rows[0].notams_json), fetchedAt: rows[0].fetched_at };
  }

  async saveNotamCache(icao: string, notams: any[]): Promise<void> {
    const now = new Date().toISOString();
    await client`INSERT INTO notam_cache (icao, notams_json, fetched_at) VALUES (${icao}, ${JSON.stringify(notams)}, ${now})`;
    await client`DELETE FROM notam_cache WHERE icao = ${icao} AND id NOT IN (SELECT id FROM notam_cache WHERE icao = ${icao} ORDER BY id DESC LIMIT 3)`;
  }

  // ── Push subscriptions ───────────────────────────────────────────────────
  async savePushSubscription(endpoint: string, keys: object, deviceLabel: string): Promise<void> {
    const now = new Date().toISOString();
    await client`
      INSERT INTO push_subscriptions (endpoint, keys_json, device_label, created_at)
      VALUES (${endpoint}, ${JSON.stringify(keys)}, ${deviceLabel}, ${now})
      ON CONFLICT(endpoint) DO UPDATE SET keys_json = EXCLUDED.keys_json, device_label = EXCLUDED.device_label
    `;
  }

  async listPushSubscriptions(): Promise<{ endpoint: string; keys: any; deviceLabel: string }[]> {
    const rows = await client`SELECT endpoint, keys_json, device_label FROM push_subscriptions` as any[];
    return rows.map((r: any) => ({ endpoint: r.endpoint, keys: JSON.parse(r.keys_json), deviceLabel: r.device_label }));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await client`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
  }

  // ── Active missions ───────────────────────────────────────────────────────
  async upsertActiveMission(m: { missionId: string; aircraft: string; airports: string[]; pic: string; missionType: string; date: string }): Promise<void> {
    const now = new Date().toISOString();
    await client`
      INSERT INTO active_missions (mission_id, aircraft, airports, pic, mission_type, date, created_at, completed)
      VALUES (${m.missionId}, ${m.aircraft}, ${JSON.stringify(m.airports)}, ${m.pic}, ${m.missionType}, ${m.date}, ${now}, 0)
      ON CONFLICT(mission_id) DO UPDATE SET airports = EXCLUDED.airports, completed = 0, date = EXCLUDED.date
    `;
  }

  async completeMission(missionId: string): Promise<void> {
    await client`UPDATE active_missions SET completed = 1 WHERE mission_id = ${missionId}`;
  }

  async listActiveMissions(): Promise<any[]> {
    const rows = await client`SELECT * FROM active_missions WHERE completed = 0 ORDER BY created_at DESC` as any[];
    return rows.map((r: any) => ({ ...r, airports: JSON.parse(r.airports) }));
  }

  // ── Drug edits ────────────────────────────────────────────────────────────
  async listDrugEdits(): Promise<DrugEdit[]> {
    return db.select().from(drugEditsTable);
  }

  async upsertDrugEdit(drugId: string, expiryDate: string | null, batchNo: string | null, updatedBy: string): Promise<DrugEdit> {
    const now = new Date().toISOString();
    const existing = await db.select().from(drugEditsTable).where(eq(drugEditsTable.drugId, drugId)).then(r => r[0]);
    if (existing) {
      return db.update(drugEditsTable)
        .set({ expiryDate, batchNo, updatedAt: now, updatedBy })
        .where(eq(drugEditsTable.drugId, drugId))
        .returning().then(r => r[0]);
    }
    return db.insert(drugEditsTable)
      .values({ drugId, expiryDate, batchNo, updatedAt: now, updatedBy })
      .returning().then(r => r[0]);
  }

  // ── Chest item edits ──────────────────────────────────────────────────────
  async listChestItemEdits(chestId?: string): Promise<ChestItemEdit[]> {
    if (chestId) {
      return db.select().from(chestItemEditsTable).where(eq(chestItemEditsTable.chestId, chestId));
    }
    return db.select().from(chestItemEditsTable);
  }

  async upsertChestItemEdit(chestId: string, itemId: string, data: { expiryDate?: string | null; qtyPresent?: number | null; note?: string | null; flagReorder?: boolean }, updatedBy: string): Promise<ChestItemEdit> {
    const now = new Date().toISOString();
    const all = await db.select().from(chestItemEditsTable).where(eq(chestItemEditsTable.chestId, chestId));
    const existing = all.find(r => r.itemId === itemId);
    const flagReorderInt = data.flagReorder ? 1 : 0;
    if (existing) {
      return db.update(chestItemEditsTable)
        .set({
          expiryDate: data.expiryDate ?? existing.expiryDate,
          qtyPresent: data.qtyPresent ?? existing.qtyPresent,
          note: data.note ?? existing.note,
          flagReorder: data.flagReorder !== undefined ? flagReorderInt : existing.flagReorder,
          updatedAt: now,
          updatedBy,
        })
        .where(eq(chestItemEditsTable.id, existing.id))
        .returning().then(r => r[0]);
    }
    return db.insert(chestItemEditsTable)
      .values({ chestId, itemId, expiryDate: data.expiryDate ?? null, qtyPresent: data.qtyPresent ?? null, note: data.note ?? null, flagReorder: flagReorderInt, updatedAt: now, updatedBy })
      .returning().then(r => r[0]);
  }

  // ── NEPT tasks ────────────────────────────────────────────────────────────
  async listNeptTasks(): Promise<NeptTask[]> {
    return db.select().from(neptTasks);
  }
  async getNeptTask(id: number): Promise<NeptTask | undefined> {
    return db.select().from(neptTasks).where(eq(neptTasks.id, id)).then(r => r[0]);
  }
  async createNeptTask(data: Omit<NeptTask, 'id'>): Promise<NeptTask> {
    return db.insert(neptTasks).values(data as any).returning().then(r => r[0]);
  }
  async updateNeptTask(id: number, updates: Partial<NeptTask>): Promise<NeptTask> {
    return db.update(neptTasks)
      .set({ ...updates, updatedAt: new Date().toISOString() } as any)
      .where(eq(neptTasks.id, id))
      .returning().then(r => r[0]);
  }
  async deleteNeptTask(id: number): Promise<void> {
    await db.delete(neptTasks).where(eq(neptTasks.id, id));
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  async createNotification(data: { type: string; title: string; body: string; taskRef?: string; taskId?: number }): Promise<Notification> {
    return db.insert(notifications).values({
      type: data.type, title: data.title, body: data.body,
      taskRef: data.taskRef ?? null, taskId: data.taskId ?? null,
      readAt: null, createdAt: new Date().toISOString(),
    }).returning().then(r => r[0]);
  }

  async listUnreadNotifications(): Promise<Notification[]> {
    const all = await db.select().from(notifications);
    return all.sort((a, b) => {
      if (!a.readAt && b.readAt) return -1;
      if (a.readAt && !b.readAt) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    return db.update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(eq(notifications.id, id))
      .returning().then(r => r[0]);
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications).set({ readAt: new Date().toISOString() });
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  async listInvoices(): Promise<Invoice[]> {
    const all = await db.select().from(invoices);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return db.select().from(invoices).where(eq(invoices.id, id)).then(r => r[0]);
  }
  async createInvoice(data: Omit<Invoice, 'id'>): Promise<Invoice> {
    return db.insert(invoices).values(data as any).returning().then(r => r[0]);
  }
  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    return db.update(invoices)
      .set({ ...updates, updatedAt: new Date().toISOString() } as any)
      .where(eq(invoices.id, id))
      .returning().then(r => r[0]);
  }
  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }
  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const all = await db.select().from(invoices);
    const seq = all.filter(inv => inv.invoiceNumber.includes(`NEPT-${year}`)).length + 1;
    return `INV-NEPT-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ── Special Mission QC Sessions ───────────────────────────────────────────
  async listSpecialMissionSessions(): Promise<SpecialMissionSession[]> {
    const all = await db.select().from(specialMissionSessions);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getSpecialMissionSession(id: number): Promise<SpecialMissionSession | undefined> {
    return db.select().from(specialMissionSessions).where(eq(specialMissionSessions.id, id)).then(r => r[0]);
  }
  async createSpecialMissionSession(data: Omit<SpecialMissionSession, 'id'>): Promise<SpecialMissionSession> {
    return db.insert(specialMissionSessions).values(data as any).returning().then(r => r[0]);
  }
  async updateSpecialMissionSession(id: number, updates: Partial<SpecialMissionSession>): Promise<SpecialMissionSession> {
    return db.update(specialMissionSessions)
      .set({ ...updates, updatedAt: new Date().toISOString() } as any)
      .where(eq(specialMissionSessions.id, id))
      .returning().then(r => r[0]);
  }

  // ── Charter Quotes ────────────────────────────────────────────────────────
  async getCharterQuotes(): Promise<CharterQuote[]> {
    const all = await db.select().from(charterQuotes);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getCharterQuote(id: number): Promise<CharterQuote | undefined> {
    return db.select().from(charterQuotes).where(eq(charterQuotes.id, id)).then(r => r[0]);
  }
  async createCharterQuote(data: InsertCharterQuote): Promise<CharterQuote> {
    const now = new Date().toISOString();
    return db.insert(charterQuotes).values({ ...data, createdAt: (data as any).createdAt ?? now, updatedAt: (data as any).updatedAt ?? now } as any).returning().then(r => r[0]);
  }
  async updateCharterQuote(id: number, data: Partial<InsertCharterQuote>): Promise<CharterQuote | undefined> {
    return db.update(charterQuotes)
      .set({ ...data, updatedAt: new Date().toISOString() } as any)
      .where(eq(charterQuotes.id, id))
      .returning().then(r => r[0]);
  }
  async deleteCharterQuote(id: number): Promise<boolean> {
    const result = await db.delete(charterQuotes).where(eq(charterQuotes.id, id)).returning();
    return result.length > 0;
  }
  async getNextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const all = await db.select().from(charterQuotes);
    const seq = all.filter(q => q.quoteNumber.includes(`CQ-${year}`)).length + 1;
    return `CQ-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ── Quote Rates ───────────────────────────────────────────────────────────
  async getAllRates(): Promise<QuoteRate[]> {
    const all = await db.select().from(quoteRates);
    return all.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
  }
  async getRateByKey(key: string): Promise<QuoteRate | undefined> {
    return db.select().from(quoteRates).where(eq(quoteRates.rateKey, key)).then(r => r[0]);
  }
  async upsertRate(key: string, value: string, previousValue?: string, previousDate?: string, lastChecked?: string): Promise<QuoteRate> {
    const existing = await this.getRateByKey(key);
    const now = lastChecked ?? new Date().toISOString();
    if (existing) {
      return db.update(quoteRates)
        .set({ rateValue: value, previousValue: previousValue ?? existing.previousValue, previousDate: previousDate ?? existing.previousDate, lastChecked: now, updatedAt: now })
        .where(eq(quoteRates.rateKey, key))
        .returning().then(r => r[0]);
    }
    return db.insert(quoteRates)
      .values({ rateKey: key, rateValue: value, category: 'unknown', label: key, unit: '', previousValue: previousValue ?? null, previousDate: previousDate ?? null, lastChecked: now, autoUpdateEnabled: 1, updatedAt: now })
      .returning().then(r => r[0]);
  }
  async updateRateManual(key: string, value: string, notes?: string): Promise<QuoteRate | undefined> {
    const existing = await this.getRateByKey(key);
    if (!existing) return undefined;
    const prevValue = existing.rateValue !== value ? existing.rateValue : existing.previousValue;
    const prevDate = existing.rateValue !== value ? new Date().toISOString().slice(0, 10) : existing.previousDate;
    return db.update(quoteRates)
      .set({ rateValue: value, previousValue: prevValue, previousDate: prevDate, notes: notes ?? existing.notes, updatedAt: new Date().toISOString() })
      .where(eq(quoteRates.rateKey, key))
      .returning().then(r => r[0]);
  }

  // ── Cost Optimizer ────────────────────────────────────────────────────────
  async getCostConfig(): Promise<CostOptimizerConfig[]> {
    const all = await db.select().from(costOptimizerConfig);
    return all.sort((a, b) => a.category.localeCompare(b.category) || a.key.localeCompare(b.key));
  }
  async upsertCostConfig(key: string, value: string, category: string): Promise<CostOptimizerConfig> {
    const now = new Date().toISOString();
    const existing = await db.select().from(costOptimizerConfig).where(eq(costOptimizerConfig.key, key)).then(r => r[0]);
    if (existing) {
      return db.update(costOptimizerConfig).set({ value, category, updatedAt: now }).where(eq(costOptimizerConfig.key, key)).returning().then(r => r[0]);
    }
    return db.insert(costOptimizerConfig).values({ key, value, category, updatedAt: now }).returning().then(r => r[0]);
  }
  async getActionPlan(): Promise<ActionPlanItem[]> {
    const all = await db.select().from(actionPlanItems);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createActionItem(item: Omit<InsertActionPlanItem, 'createdAt' | 'updatedAt'>): Promise<ActionPlanItem> {
    const now = new Date().toISOString();
    return db.insert(actionPlanItems).values({ ...item, createdAt: now, updatedAt: now } as any).returning().then(r => r[0]);
  }
  async updateActionItem(id: number, updates: Partial<ActionPlanItem>): Promise<ActionPlanItem | undefined> {
    const { id: _id, createdAt: _c, ...rest } = updates as any;
    return db.update(actionPlanItems).set({ ...rest, updatedAt: new Date().toISOString() }).where(eq(actionPlanItems.id, id)).returning().then(r => r[0]);
  }
  async deleteActionItem(id: number): Promise<boolean> {
    const result = await db.delete(actionPlanItems).where(eq(actionPlanItems.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
