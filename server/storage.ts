import { users, morningBriefData, passengerManifests, drugEditsTable, chestItemEditsTable, neptTasks, notifications, specialMissionSessions, invoices, charterQuotes, quoteRates } from '@shared/schema';
import type { User, InsertUser, MorningBrief, PassengerManifest, DrugEdit, ChestItemEdit, NeptTask, InsertNeptTask, Notification, SpecialMissionSession, InsertSpecialMissionSession, Invoice, CharterQuote, InsertCharterQuote, QuoteRate } from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Auto-create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS morning_brief_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    data_key TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL DEFAULT 'dispatcher'
  );
  CREATE TABLE IF NOT EXISTS tech_log_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid        TEXT NOT NULL UNIQUE,
    device_id   TEXT NOT NULL DEFAULT 'unknown',
    aircraft    TEXT NOT NULL,
    date        TEXT NOT NULL,
    from_icao   TEXT NOT NULL,
    to_icao     TEXT NOT NULL,
    pic         TEXT NOT NULL,
    sic         TEXT,
    block_off   TEXT,
    takeoff     TEXT,
    landing     TEXT,
    block_on    TEXT,
    block_hours TEXT,
    flight_hours TEXT,
    fuel_start  REAL,
    fuel_uplift REAL,
    fuel_finish REAL,
    mission_type TEXT,
    defects     TEXT,
    remarks     TEXT,
    payload     TEXT NOT NULL,
    synced_at   TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notam_cache (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    icao        TEXT NOT NULL,
    notams_json TEXT NOT NULL,
    fetched_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint    TEXT NOT NULL UNIQUE,
    keys_json   TEXT NOT NULL,
    device_label TEXT NOT NULL DEFAULT 'device',
    created_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS active_missions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id  TEXT NOT NULL UNIQUE,
    aircraft    TEXT NOT NULL,
    airports    TEXT NOT NULL,
    pic         TEXT NOT NULL,
    mission_type TEXT NOT NULL,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    completed   INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS passenger_manifests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_date TEXT NOT NULL,
    flight_number TEXT NOT NULL,
    aircraft_reg TEXT NOT NULL,
    booking_team TEXT NOT NULL,
    sectors TEXT NOT NULL,
    passengers TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    sign_token TEXT,
    signed_at TEXT,
    signature_data TEXT,
    signed_by TEXT,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS drug_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_id TEXT NOT NULL UNIQUE,
    expiry_date TEXT,
    batch_no TEXT,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL DEFAULT 'nurse'
  );
  CREATE TABLE IF NOT EXISTS chest_item_edits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chest_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    expiry_date TEXT,
    qty_present INTEGER,
    note TEXT,
    flag_reorder INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL DEFAULT 'nurse',
    UNIQUE(chest_id, item_id)
  );
  CREATE TABLE IF NOT EXISTS nept_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_ref TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    priority TEXT NOT NULL DEFAULT 'Routine',
    request_time TEXT NOT NULL,
    required_by TEXT,
    pickup_location TEXT NOT NULL,
    pickup_icao TEXT,
    dest_location TEXT NOT NULL,
    dest_icao TEXT,
    sectors TEXT,
    patient_name TEXT,
    patient_ref TEXT,
    escort_name TEXT,
    referring_hospital TEXT,
    receiving_hospital TEXT,
    aircraft_reg TEXT,
    pilot_name TEXT,
    nurse_name TEXT,
    dispatched_by TEXT,
    estimated_eta TEXT,
    actual_depart TEXT,
    actual_arrive TEXT,
    completed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// ── Migrations for existing DBs ───────────────────────────────────────────────
const existingCols = sqlite.prepare("PRAGMA table_info(nept_tasks)").all() as { name: string }[];
const neptColNames = existingCols.map(c => c.name);
if (!neptColNames.includes("estimated_eta")) {
  sqlite.exec("ALTER TABLE nept_tasks ADD COLUMN estimated_eta TEXT");
}
if (!neptColNames.includes("completed_at")) {
  sqlite.exec("ALTER TABLE nept_tasks ADD COLUMN completed_at TEXT");
}
if (!neptColNames.includes("sectors")) {
  sqlite.exec("ALTER TABLE nept_tasks ADD COLUMN sectors TEXT");
}

// ── Notifications table ─────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    task_ref   TEXT,
    task_id    INTEGER,
    read_at    TEXT,
    created_at TEXT NOT NULL
  )
`);

// ── Invoices ─────────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number       TEXT NOT NULL UNIQUE,
    invoice_date         TEXT NOT NULL,
    due_date             TEXT NOT NULL,
    service_date         TEXT NOT NULL,
    status               TEXT NOT NULL DEFAULT 'Draft',
    payer_type           TEXT NOT NULL,
    payer_name           TEXT NOT NULL,
    task_ref             TEXT,
    patient_id           TEXT,
    pickup_location      TEXT,
    destination          TEXT,
    aircraft_reg         TEXT,
    mission_type         TEXT NOT NULL DEFAULT 'Standard NEPT',
    base_amount          INTEGER NOT NULL,
    after_hours_surcharge INTEGER NOT NULL DEFAULT 0,
    additional_charges   INTEGER NOT NULL DEFAULT 0,
    gst_amount           INTEGER NOT NULL DEFAULT 0,
    total_amount         INTEGER NOT NULL,
    notes                TEXT,
    submitted_at         TEXT,
    paid_at              TEXT,
    created_at           TEXT NOT NULL,
    updated_at           TEXT NOT NULL
  );
`);

// ── Charter Quotes ───────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS charter_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_contact TEXT,
    purpose TEXT NOT NULL,
    aircraft_type TEXT NOT NULL,
    departure_date TEXT NOT NULL,
    legs TEXT NOT NULL,
    crew TEXT NOT NULL,
    costs TEXT NOT NULL,
    total_cost INTEGER NOT NULL,
    margin_percent INTEGER NOT NULL DEFAULT 15,
    final_quote INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Quote Rates ──────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS quote_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate_key TEXT NOT NULL UNIQUE,
    rate_value TEXT NOT NULL,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    unit TEXT NOT NULL,
    source TEXT,
    effective_date TEXT,
    previous_value TEXT,
    previous_date TEXT,
    last_checked TEXT,
    auto_update_enabled INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Special Mission QC Sessions ──────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS special_mission_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_type     TEXT NOT NULL,
    mission_ref      TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pre-flight',
    aircraft_reg     TEXT,
    destination      TEXT,
    checklist_data   TEXT NOT NULL DEFAULT '{}',
    signoffs         TEXT NOT NULL DEFAULT '[]',
    notes            TEXT,
    created_at       TEXT NOT NULL,
    updated_at       TEXT NOT NULL,
    completed_at     TEXT
  )
`);

export const db = drizzle(sqlite);

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
  payload: string;  // full JSON of original entry
  synced_at: string;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMorningBriefData(date: string, dataKey: string): Promise<MorningBrief | undefined>;
  upsertMorningBriefData(date: string, dataKey: string, payload: string, updatedBy: string): Promise<MorningBrief>;
  // Manifests
  createManifest(data: Omit<PassengerManifest, 'id'>): Promise<PassengerManifest>;
  getManifest(id: number): Promise<PassengerManifest | undefined>;
  getManifestByToken(token: string): Promise<PassengerManifest | undefined>;
  listManifests(flightDate?: string): Promise<PassengerManifest[]>;
  updateManifest(id: number, updates: Partial<PassengerManifest>): Promise<PassengerManifest>;
  // Tech Log
  upsertTechLogEntry(entry: TechLogEntry): Promise<TechLogEntry>;
  listTechLogEntries(date?: string, aircraft?: string): Promise<TechLogEntry[]>;
  getTechLogEntry(uuid: string): Promise<TechLogEntry | undefined>;
  // Drug edits
  listDrugEdits(): Promise<DrugEdit[]>;
  upsertDrugEdit(drugId: string, expiryDate: string | null, batchNo: string | null, updatedBy: string): Promise<DrugEdit>;
  // Chest item edits
  listChestItemEdits(chestId?: string): Promise<ChestItemEdit[]>;
  upsertChestItemEdit(chestId: string, itemId: string, data: { expiryDate?: string | null; qtyPresent?: number | null; note?: string | null; flagReorder?: boolean }, updatedBy: string): Promise<ChestItemEdit>;
  // NEPT tasks
  listNeptTasks(): Promise<NeptTask[]>;
  getNeptTask(id: number): Promise<NeptTask | undefined>;
  createNeptTask(data: Omit<NeptTask, 'id'>): Promise<NeptTask>;
  updateNeptTask(id: number, updates: Partial<NeptTask>): Promise<NeptTask>;
  deleteNeptTask(id: number): Promise<void>;
  // Invoices
  listInvoices(): Invoice[];
  getInvoice(id: number): Invoice | undefined;
  createInvoice(data: Omit<Invoice, 'id'>): Invoice;
  updateInvoice(id: number, updates: Partial<Invoice>): Invoice;
  deleteInvoice(id: number): boolean;
  getNextInvoiceNumber(): string;
  // Charter Quotes
  getCharterQuotes(): CharterQuote[];
  getCharterQuote(id: number): CharterQuote | undefined;
  createCharterQuote(data: InsertCharterQuote): CharterQuote;
  updateCharterQuote(id: number, data: Partial<InsertCharterQuote>): CharterQuote | undefined;
  deleteCharterQuote(id: number): boolean;
  getNextQuoteNumber(): string;
  // Quote Rates
  getAllRates(): QuoteRate[];
  getRateByKey(key: string): QuoteRate | undefined;
  upsertRate(key: string, value: string, previousValue?: string, previousDate?: string, lastChecked?: string): QuoteRate;
  updateRateManual(key: string, value: string, notes?: string): QuoteRate | undefined;
}

// ── Default rate seed data ───────────────────────────────────────────────────
const AIRSERVICES_SOURCE = 'https://www.airservicesaustralia.com/industry-info/aviation-charging/';
const AVDATA_SOURCE = 'https://avdata.com.au/airport-charge-rates';

interface DefaultRateSeed {
  rateKey: string;
  rateValue: string;
  category: string;
  label: string;
  unit: string;
  source?: string | null;
  effectiveDate?: string | null;
}

const DEFAULT_RATES: DefaultRateSeed[] = [
  // Airservices
  { rateKey: 'enroute_rate', rateValue: '0.90', category: 'airservices', label: 'Enroute Nav (IFR <20t)', unit: '$/100km/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'met_surcharge_rate', rateValue: '0.077', category: 'airservices', label: 'Met Service Surcharge', unit: '$/100km/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_major_rate', rateValue: '12.11', category: 'airservices', label: 'Terminal Nav Charge — Major Airports', unit: '$/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_regional_rate', rateValue: '6.96', category: 'airservices', label: 'Terminal Nav Charge — Regional', unit: '$/tonne', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_out_of_hours', rateValue: '261.00', category: 'airservices', label: 'TNC Out-of-Hours Surcharge (>15min)', unit: '$/movement', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },
  { rateKey: 'tnc_minimum_major', rateValue: '21.00', category: 'airservices', label: 'TNC Minimum Charge (major airports)', unit: '$', source: AIRSERVICES_SOURCE, effectiveDate: '2025-08-01' },

  // Fuel
  { rateKey: 'fuel_jet_a1_per_litre', rateValue: '1.92', category: 'fuel', label: 'Jet-A1 Fuel Price (incl GST)', unit: '$/litre', source: 'https://avdata.com.au', effectiveDate: '2026-07-01' },

  // Crew
  { rateKey: 'crew_captain', rateValue: '185.00', category: 'crew', label: 'Captain Hourly Rate', unit: '$/hr' },
  { rateKey: 'crew_first_officer', rateValue: '145.00', category: 'crew', label: 'First Officer Hourly Rate', unit: '$/hr' },
  { rateKey: 'crew_flight_nurse', rateValue: '95.00', category: 'crew', label: 'Flight Nurse/Paramedic Hourly Rate', unit: '$/hr' },
  { rateKey: 'crew_icu_doctor', rateValue: '180.00', category: 'crew', label: 'ICU Doctor Hourly Rate', unit: '$/hr' },

  // Landing fees
  { rateKey: 'landing_default', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Default', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YSDU', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Dubbo', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YBHI', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Broken Hill', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YBTL', rateValue: '16.00', category: 'landing', label: 'Landing Fee — Townsville', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YARM', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Armidale', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YBUD', rateValue: '15.03', category: 'landing', label: 'Landing Fee — Bundaberg', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YLHI', rateValue: '22.00', category: 'landing', label: 'Landing Fee — Lord Howe Island', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YSTW', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Tamworth', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YNRM', rateValue: '15.45', category: 'landing', label: 'Landing Fee — Narromine', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YORG', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Orange', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YBKE', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Bourke', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YNBR', rateValue: '14.00', category: 'landing', label: 'Landing Fee — Narrabri', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YSSY', rateValue: '5.54', category: 'landing', label: 'Landing Fee — Sydney', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YMML', rateValue: '27.68', category: 'landing', label: 'Landing Fee — Melbourne GA', unit: '$/tonne', source: AVDATA_SOURCE },
  { rateKey: 'landing_YBBN', rateValue: '6.18', category: 'landing', label: 'Landing Fee — Brisbane', unit: '$/tonne', source: AVDATA_SOURCE },

  // Accommodation
  { rateKey: 'accommodation_per_person_night', rateValue: '180.00', category: 'accommodation', label: 'Crew Accommodation', unit: '$/person/night' },

  // Ground
  { rateKey: 'ground_ambulance', rateValue: '250.00', category: 'ground', label: 'Ambulance Transfer', unit: '$/leg' },
  { rateKey: 'ground_bus', rateValue: '150.00', category: 'ground', label: 'Bus', unit: '$/leg' },
  { rateKey: 'ground_taxi', rateValue: '800.00', category: 'ground', label: 'Taxi Charter', unit: '$/leg' },
  { rateKey: 'ground_van', rateValue: '120.00', category: 'ground', label: 'Van', unit: '$/leg' },
];

export function seedDefaultRates(): void {
  const row = sqlite.prepare('SELECT COUNT(*) as cnt FROM quote_rates').get() as { cnt: number };
  if (row.cnt > 0) return;
  const now = new Date().toISOString();
  const insert = sqlite.prepare(`
    INSERT INTO quote_rates
      (rate_key, rate_value, category, label, unit, source, effective_date,
       previous_value, previous_date, last_checked, auto_update_enabled, notes, updated_at)
    VALUES
      (@rateKey, @rateValue, @category, @label, @unit, @source, @effectiveDate,
       NULL, NULL, @lastChecked, 1, NULL, CURRENT_TIMESTAMP)
  `);
  const insertMany = sqlite.transaction((rates: DefaultRateSeed[]) => {
    for (const r of rates) {
      insert.run({
        rateKey: r.rateKey,
        rateValue: r.rateValue,
        category: r.category,
        label: r.label,
        unit: r.unit,
        source: r.source ?? null,
        effectiveDate: r.effectiveDate ?? null,
        lastChecked: now,
      });
    }
  });
  insertMany(DEFAULT_RATES);
  console.log(`[quote-rates] Seeded ${DEFAULT_RATES.length} default rates`);
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async getMorningBriefData(date: string, dataKey: string): Promise<MorningBrief | undefined> {
    return db.select().from(morningBriefData)
      .where(and(eq(morningBriefData.date, date), eq(morningBriefData.dataKey, dataKey)))
      .get();
  }

  async upsertMorningBriefData(date: string, dataKey: string, payload: string, updatedBy: string): Promise<MorningBrief> {
    const existing = await this.getMorningBriefData(date, dataKey);
    const updatedAt = new Date().toISOString();
    if (existing) {
      return db.update(morningBriefData)
        .set({ payload, updatedAt, updatedBy })
        .where(and(eq(morningBriefData.date, date), eq(morningBriefData.dataKey, dataKey)))
        .returning().get();
    }
    return db.insert(morningBriefData)
      .values({ date, dataKey, payload, updatedAt, updatedBy })
      .returning().get();
  }

  async createManifest(data: Omit<PassengerManifest, 'id'>): Promise<PassengerManifest> {
    return db.insert(passengerManifests).values(data as any).returning().get() as PassengerManifest;
  }

  async getManifest(id: number): Promise<PassengerManifest | undefined> {
    return db.select().from(passengerManifests).where(eq(passengerManifests.id, id)).get() as PassengerManifest | undefined;
  }

  async getManifestByToken(token: string): Promise<PassengerManifest | undefined> {
    return db.select().from(passengerManifests).where(eq(passengerManifests.signToken, token)).get() as PassengerManifest | undefined;
  }

  async listManifests(flightDate?: string): Promise<PassengerManifest[]> {
    if (flightDate) {
      return db.select().from(passengerManifests).where(eq(passengerManifests.flightDate, flightDate)).all() as PassengerManifest[];
    }
    return db.select().from(passengerManifests).all() as PassengerManifest[];
  }

  async updateManifest(id: number, updates: Partial<PassengerManifest>): Promise<PassengerManifest> {
    return db.update(passengerManifests)
      .set({ ...updates, updatedAt: new Date().toISOString() } as any)
      .where(eq(passengerManifests.id, id))
      .returning().get() as PassengerManifest;
  }

  // ── Tech Log ─────────────────────────────────────────────────────────────────────

  async upsertTechLogEntry(entry: TechLogEntry): Promise<TechLogEntry> {
    sqlite.prepare(`
      INSERT INTO tech_log_entries
        (uuid, device_id, aircraft, date, from_icao, to_icao, pic, sic,
         block_off, takeoff, landing, block_on, block_hours, flight_hours,
         fuel_start, fuel_uplift, fuel_finish, mission_type, defects, remarks,
         payload, synced_at)
      VALUES
        (@uuid, @device_id, @aircraft, @date, @from_icao, @to_icao, @pic, @sic,
         @block_off, @takeoff, @landing, @block_on, @block_hours, @flight_hours,
         @fuel_start, @fuel_uplift, @fuel_finish, @mission_type, @defects, @remarks,
         @payload, @synced_at)
      ON CONFLICT(uuid) DO UPDATE SET
        payload     = excluded.payload,
        defects     = excluded.defects,
        remarks     = excluded.remarks,
        synced_at   = excluded.synced_at
    `).run(entry);
    return this.getTechLogEntry(entry.uuid) as Promise<TechLogEntry>;
  }

  async listTechLogEntries(date?: string, aircraft?: string): Promise<TechLogEntry[]> {
    let query = 'SELECT * FROM tech_log_entries WHERE 1=1';
    const params: Record<string, string> = {};
    if (date)     { query += ' AND date = @date';         params.date = date; }
    if (aircraft) { query += ' AND aircraft = @aircraft'; params.aircraft = aircraft; }
    query += ' ORDER BY date DESC, block_off DESC';
    return sqlite.prepare(query).all(params) as TechLogEntry[];
  }

  async getTechLogEntry(uuid: string): Promise<TechLogEntry | undefined> {
    return sqlite.prepare('SELECT * FROM tech_log_entries WHERE uuid = ?').get(uuid) as TechLogEntry | undefined;
  }

  // ── NOTAM cache ──────────────────────────────────────────────────────────
  getCachedNotams(icao: string): { notams: any[]; fetchedAt: string } | undefined {
    const row = sqlite.prepare('SELECT notams_json, fetched_at FROM notam_cache WHERE icao = ? ORDER BY id DESC LIMIT 1').get(icao) as any;
    if (!row) return undefined;
    return { notams: JSON.parse(row.notams_json), fetchedAt: row.fetched_at };
  }

  saveNotamCache(icao: string, notams: any[]): void {
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO notam_cache (icao, notams_json, fetched_at)
      VALUES (?, ?, ?)
    `).run(icao, JSON.stringify(notams), now);
    // Keep only latest 3 per ICAO
    sqlite.prepare(`
      DELETE FROM notam_cache WHERE icao = ? AND id NOT IN (
        SELECT id FROM notam_cache WHERE icao = ? ORDER BY id DESC LIMIT 3
      )
    `).run(icao, icao);
  }

  // ── Push subscriptions ───────────────────────────────────────────────────
  savePushSubscription(endpoint: string, keys: object, deviceLabel: string): void {
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO push_subscriptions (endpoint, keys_json, device_label, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET keys_json = excluded.keys_json, device_label = excluded.device_label
    `).run(endpoint, JSON.stringify(keys), deviceLabel, now);
  }

  listPushSubscriptions(): { endpoint: string; keys: any; deviceLabel: string }[] {
    const rows = sqlite.prepare('SELECT endpoint, keys_json, device_label FROM push_subscriptions').all() as any[];
    return rows.map(r => ({ endpoint: r.endpoint, keys: JSON.parse(r.keys_json), deviceLabel: r.device_label }));
  }

  deletePushSubscription(endpoint: string): void {
    sqlite.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  }

  // ── Active missions ───────────────────────────────────────────────────────
  upsertActiveMission(m: {
    missionId: string; aircraft: string; airports: string[];
    pic: string; missionType: string; date: string;
  }): void {
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO active_missions (mission_id, aircraft, airports, pic, mission_type, date, created_at, completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(mission_id) DO UPDATE SET
        airports = excluded.airports, completed = 0, date = excluded.date
    `).run(m.missionId, m.aircraft, JSON.stringify(m.airports), m.pic, m.missionType, m.date, now);
  }

  completeMission(missionId: string): void {
    sqlite.prepare('UPDATE active_missions SET completed = 1 WHERE mission_id = ?').run(missionId);
  }

  // ── Drug edits ─────────────────────────────────────────────────────────
  async listDrugEdits(): Promise<DrugEdit[]> {
    return db.select().from(drugEditsTable).all();
  }

  async upsertDrugEdit(drugId: string, expiryDate: string | null, batchNo: string | null, updatedBy: string): Promise<DrugEdit> {
    const now = new Date().toISOString();
    const existing = db.select().from(drugEditsTable).where(eq(drugEditsTable.drugId, drugId)).get();
    if (existing) {
      return db.update(drugEditsTable)
        .set({ expiryDate, batchNo, updatedAt: now, updatedBy })
        .where(eq(drugEditsTable.drugId, drugId))
        .returning().get()!;
    }
    return db.insert(drugEditsTable)
      .values({ drugId, expiryDate, batchNo, updatedAt: now, updatedBy })
      .returning().get()!;
  }

  // ── Chest item edits ──────────────────────────────────────────────────────
  async listChestItemEdits(chestId?: string): Promise<ChestItemEdit[]> {
    if (chestId) {
      return db.select().from(chestItemEditsTable).where(eq(chestItemEditsTable.chestId, chestId)).all();
    }
    return db.select().from(chestItemEditsTable).all();
  }

  async upsertChestItemEdit(chestId: string, itemId: string, data: { expiryDate?: string | null; qtyPresent?: number | null; note?: string | null; flagReorder?: boolean }, updatedBy: string): Promise<ChestItemEdit> {
    const now = new Date().toISOString();
    const existing = db.select().from(chestItemEditsTable)
      .where(eq(chestItemEditsTable.chestId, chestId))
      .all()
      .find((r: ChestItemEdit) => r.itemId === itemId);
    const flagReorderInt = data.flagReorder ? 1 : 0;
    if (existing) {
      return db.update(chestItemEditsTable)
        .set({
          expiryDate:  data.expiryDate  ?? existing.expiryDate,
          qtyPresent:  data.qtyPresent  ?? existing.qtyPresent,
          note:        data.note        ?? existing.note,
          flagReorder: data.flagReorder !== undefined ? flagReorderInt : existing.flagReorder,
          updatedAt: now,
          updatedBy,
        })
        .where(eq(chestItemEditsTable.id, existing.id))
        .returning().get()!;
    }
    return db.insert(chestItemEditsTable)
      .values({
        chestId,
        itemId,
        expiryDate:  data.expiryDate  ?? null,
        qtyPresent:  data.qtyPresent  ?? null,
        note:        data.note        ?? null,
        flagReorder: flagReorderInt,
        updatedAt: now,
        updatedBy,
      })
      .returning().get()!;
  }

  // ── NEPT tasks ───────────────────────────────────────────────────────────
  async listNeptTasks(): Promise<NeptTask[]> {
    return db.select().from(neptTasks).all();
  }
  async getNeptTask(id: number): Promise<NeptTask | undefined> {
    return db.select().from(neptTasks).where(eq(neptTasks.id, id)).get();
  }
  async createNeptTask(data: Omit<NeptTask, 'id'>): Promise<NeptTask> {
    return db.insert(neptTasks).values(data).returning().get()!;
  }
  async updateNeptTask(id: number, updates: Partial<NeptTask>): Promise<NeptTask> {
    return db.update(neptTasks)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(neptTasks.id, id))
      .returning().get()!;
  }
  async deleteNeptTask(id: number): Promise<void> {
    db.delete(neptTasks).where(eq(neptTasks.id, id)).run();
  }

  // ── Notifications ───────────────────────────────────────────────────────────────
  createNotification(data: { type: string; title: string; body: string; taskRef?: string; taskId?: number }): Notification {
    return db.insert(notifications).values({
      type:      data.type,
      title:     data.title,
      body:      data.body,
      taskRef:   data.taskRef ?? null,
      taskId:    data.taskId ?? null,
      readAt:    null,
      createdAt: new Date().toISOString(),
    }).returning().get()!;
  }

  listUnreadNotifications(): Notification[] {
    // Return all notifications, most recent first, unread at top
    return db.select().from(notifications).all()
      .sort((a, b) => {
        // unread first, then by createdAt desc
        if (!a.readAt && b.readAt) return -1;
        if (a.readAt && !b.readAt) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  markNotificationRead(id: number): Notification | undefined {
    return db.update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(eq(notifications.id, id))
      .returning().get();
  }

  markAllNotificationsRead(): void {
    sqlite.exec(`UPDATE notifications SET read_at = datetime('now') WHERE read_at IS NULL`);
  }

  listActiveMissions(): any[] {
    const rows = sqlite.prepare(
      'SELECT * FROM active_missions WHERE completed = 0 ORDER BY created_at DESC'
    ).all() as any[];
    return rows.map(r => ({ ...r, airports: JSON.parse(r.airports) }));
  }

  // ── Invoices ─────────────────────────────────────────────────────────────────
  listInvoices(): Invoice[] {
    return db.select().from(invoices).all()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getInvoice(id: number): Invoice | undefined {
    return db.select().from(invoices).where(eq(invoices.id, id)).get();
  }

  createInvoice(data: Omit<Invoice, 'id'>): Invoice {
    return db.insert(invoices).values(data).returning().get()!;
  }

  updateInvoice(id: number, updates: Partial<Invoice>): Invoice {
    return db.update(invoices)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(invoices.id, id))
      .returning().get()!;
  }

  deleteInvoice(id: number): boolean {
    const result = db.delete(invoices).where(eq(invoices.id, id)).run();
    return (result as any).changes > 0;
  }

  getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const all = db.select().from(invoices).all()
      .filter(inv => inv.invoiceNumber.includes(`NEPT-${year}`));
    const seq = all.length + 1;
    return `INV-NEPT-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ── Special Mission QC Sessions ──────────────────────────────────────────────
  listSpecialMissionSessions(): SpecialMissionSession[] {
    return db.select().from(specialMissionSessions)
      .all()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getSpecialMissionSession(id: number): SpecialMissionSession | undefined {
    return db.select().from(specialMissionSessions).where(eq(specialMissionSessions.id, id)).get();
  }

  createSpecialMissionSession(data: Omit<SpecialMissionSession, 'id'>): SpecialMissionSession {
    return db.insert(specialMissionSessions).values(data).returning().get()!;
  }

  updateSpecialMissionSession(id: number, updates: Partial<SpecialMissionSession>): SpecialMissionSession {
    return db.update(specialMissionSessions)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(specialMissionSessions.id, id))
      .returning().get()!;
  }

  // ── Charter Quotes ──────────────────────────────────────────────────────────
  getCharterQuotes(): CharterQuote[] {
    return db.select().from(charterQuotes).all()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getCharterQuote(id: number): CharterQuote | undefined {
    return db.select().from(charterQuotes).where(eq(charterQuotes.id, id)).get();
  }

  createCharterQuote(data: InsertCharterQuote): CharterQuote {
    const now = new Date().toISOString();
    return db.insert(charterQuotes).values({
      ...data,
      createdAt: (data as any).createdAt ?? now,
      updatedAt: (data as any).updatedAt ?? now,
    }).returning().get()!;
  }

  updateCharterQuote(id: number, data: Partial<InsertCharterQuote>): CharterQuote | undefined {
    return db.update(charterQuotes)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(charterQuotes.id, id))
      .returning().get();
  }

  deleteCharterQuote(id: number): boolean {
    const result = db.delete(charterQuotes).where(eq(charterQuotes.id, id)).run();
    return (result as any).changes > 0;
  }

  getNextQuoteNumber(): string {
    const year = new Date().getFullYear();
    const all = db.select().from(charterQuotes).all()
      .filter(q => q.quoteNumber.includes(`CQ-${year}`));
    const seq = all.length + 1;
    return `CQ-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ── Quote Rates ────────────────────────────────────────────────────────────
  getAllRates(): QuoteRate[] {
    return db.select().from(quoteRates).all()
      .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
  }

  getRateByKey(key: string): QuoteRate | undefined {
    return db.select().from(quoteRates).where(eq(quoteRates.rateKey, key)).get();
  }

  upsertRate(key: string, value: string, previousValue?: string, previousDate?: string, lastChecked?: string): QuoteRate {
    const existing = this.getRateByKey(key);
    const now = lastChecked ?? new Date().toISOString();
    if (existing) {
      sqlite.prepare(`
        INSERT OR REPLACE INTO quote_rates
          (id, rate_key, rate_value, category, label, unit, source, effective_date,
           previous_value, previous_date, last_checked, auto_update_enabled, notes, updated_at)
        VALUES
          (@id, @rateKey, @rateValue, @category, @label, @unit, @source, @effectiveDate,
           @previousValue, @previousDate, @lastChecked, @autoUpdateEnabled, @notes, CURRENT_TIMESTAMP)
      `).run({
        id: existing.id,
        rateKey: existing.rateKey,
        rateValue: value,
        category: existing.category,
        label: existing.label,
        unit: existing.unit,
        source: existing.source,
        effectiveDate: existing.effectiveDate,
        previousValue: previousValue ?? existing.previousValue,
        previousDate: previousDate ?? existing.previousDate,
        lastChecked: now,
        autoUpdateEnabled: existing.autoUpdateEnabled,
        notes: existing.notes,
      });
      return this.getRateByKey(key)!;
    }
    // No existing row — insert a minimal new rate (should be rare, seed covers all known keys)
    sqlite.prepare(`
      INSERT INTO quote_rates
        (rate_key, rate_value, category, label, unit, source, effective_date,
         previous_value, previous_date, last_checked, auto_update_enabled, notes, updated_at)
      VALUES
        (@rateKey, @rateValue, 'unknown', @rateKey, '', NULL, NULL,
         @previousValue, @previousDate, @lastChecked, 1, NULL, CURRENT_TIMESTAMP)
    `).run({
      rateKey: key,
      rateValue: value,
      previousValue: previousValue ?? null,
      previousDate: previousDate ?? null,
      lastChecked: now,
    });
    return this.getRateByKey(key)!;
  }

  updateRateManual(key: string, value: string, notes?: string): QuoteRate | undefined {
    const existing = this.getRateByKey(key);
    if (!existing) return undefined;
    sqlite.prepare(`
      UPDATE quote_rates
      SET rate_value = @rateValue,
          previous_value = @previousValue,
          previous_date = @previousDate,
          notes = COALESCE(@notes, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE rate_key = @rateKey
    `).run({
      rateKey: key,
      rateValue: value,
      previousValue: existing.rateValue !== value ? existing.rateValue : existing.previousValue,
      previousDate: existing.rateValue !== value ? new Date().toISOString().slice(0, 10) : existing.previousDate,
      notes: notes ?? null,
    });
    return this.getRateByKey(key);
  }
}

export const storage = new DatabaseStorage();

// Seed default rates once on startup if the table is empty
seedDefaultRates();
