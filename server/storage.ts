import { users, morningBriefData, passengerManifests, drugEditsTable, chestItemEditsTable, neptTasks } from '@shared/schema';
import type { User, InsertUser, MorningBrief, PassengerManifest, DrugEdit, ChestItemEdit, NeptTask, InsertNeptTask } from '@shared/schema';
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

  listActiveMissions(): any[] {
    const rows = sqlite.prepare(
      'SELECT * FROM active_missions WHERE completed = 0 ORDER BY created_at DESC'
    ).all() as any[];
    return rows.map(r => ({ ...r, airports: JSON.parse(r.airports) }));
  }
}

export const storage = new DatabaseStorage();
