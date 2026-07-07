import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Morning Brief — editable ops data store
export const morningBriefData = sqliteTable("morning_brief_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),          // yyyy-mm-dd
  dataKey: text("data_key").notNull(),   // e.g. "services", "aircraft", "notams", "ferry", "vehicles", "clinics"
  payload: text("payload").notNull(),    // JSON string
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull().default("dispatcher"),
});

export const insertMorningBriefSchema = createInsertSchema(morningBriefData).omit({ id: true });
export type InsertMorningBrief = z.infer<typeof insertMorningBriefSchema>;
export type MorningBrief = typeof morningBriefData.$inferSelect;

// ── Passenger Manifests ────────────────────────────────────────────────────
export const passengerManifests = sqliteTable("passenger_manifests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flightDate: text("flight_date").notNull(),        // yyyy-mm-dd
  flightNumber: text("flight_number").notNull(),
  aircraftReg: text("aircraft_reg").notNull(),
  bookingTeam: text("booking_team").notNull(),       // e.g. RAHS Dental
  sectors: text("sectors").notNull(),               // JSON array of sector objects
  passengers: text("passengers").notNull(),         // JSON array of passenger objects
  status: text("status").notNull().default("draft"), // draft | sent | signed
  signToken: text("sign_token"),                    // UUID for PIC sign link
  signedAt: text("signed_at"),
  signatureData: text("signature_data"),            // base64 PNG
  signedBy: text("signed_by"),                     // PIC name
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertManifestSchema = createInsertSchema(passengerManifests).omit({ id: true });
export type InsertManifest = z.infer<typeof insertManifestSchema>;
export type PassengerManifest = typeof passengerManifests.$inferSelect;

// ── Drug Inventory Edits ───────────────────────────────────────────────────
// Persists per-drug expiry date and batch number overrides
export const drugEditsTable = sqliteTable("drug_edits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  drugId:     text("drug_id").notNull().unique(),   // matches DRUGS[].id e.g. "dr01"
  expiryDate: text("expiry_date"),                  // ISO yyyy-mm-dd or null
  batchNo:    text("batch_no"),                     // free text or null
  updatedAt:  text("updated_at").notNull(),
  updatedBy:  text("updated_by").notNull().default("nurse"),
});

export const insertDrugEditSchema = createInsertSchema(drugEditsTable).omit({ id: true });
export type InsertDrugEdit = z.infer<typeof insertDrugEditSchema>;
export type DrugEdit = typeof drugEditsTable.$inferSelect;

// ── Chest Item Edits ───────────────────────────────────────────────────────
// Persists per-chest-item expiry date, qty present, and note overrides
export const chestItemEditsTable = sqliteTable("chest_item_edits", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  chestId:     text("chest_id").notNull(),     // e.g. "chest-dubbo-a"
  itemId:      text("item_id").notNull(),      // e.g. "ci-morphine"
  expiryDate:  text("expiry_date"),            // ISO yyyy-mm-dd or null
  qtyPresent:  integer("qty_present"),         // nullable
  note:        text("note"),
  flagReorder: integer("flag_reorder").notNull().default(0),  // 0/1 boolean
  updatedAt:   text("updated_at").notNull(),
  updatedBy:   text("updated_by").notNull().default("nurse"),
});

export const insertChestItemEditSchema = createInsertSchema(chestItemEditsTable).omit({ id: true });
export type InsertChestItemEdit = z.infer<typeof insertChestItemEditSchema>;
export type ChestItemEdit = typeof chestItemEditsTable.$inferSelect;

// ── NEPT Tasks ─────────────────────────────────────────────────────────────
export const neptTasks = sqliteTable("nept_tasks", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  taskRef:       text("task_ref").notNull(),          // e.g. "NEPT-2026-0047"
  status:        text("status").notNull().default("Pending"),  // Pending | Assigned | En Route | Complete | Cancelled
  priority:      text("priority").notNull().default("Routine"), // Routine | Urgent | Emergency
  requestTime:   text("request_time").notNull(),      // ISO datetime
  requiredBy:    text("required_by"),                 // ISO datetime — requested departure
  pickupLocation:text("pickup_location").notNull(),   // free text — mirrors sectors[0].from
  pickupIcao:    text("pickup_icao"),                 // mirrors sectors[0].fromIcao
  destLocation:  text("dest_location").notNull(),     // mirrors sectors[last].to
  destIcao:      text("dest_icao"),                   // mirrors sectors[last].toIcao
  sectors:       text("sectors"),                     // JSON: [{from,fromIcao,to,toIcao,eta}]
  patientName:   text("patient_name"),                // identify only — no clinical data
  patientRef:    text("patient_ref"),                 // task ID / UR number
  escortName:    text("escort_name"),
  referringHospital: text("referring_hospital"),
  receivingHospital: text("receiving_hospital"),
  aircraftReg:   text("aircraft_reg"),                // assigned aircraft
  pilotName:     text("pilot_name"),
  nurseName:     text("nurse_name"),
  dispatchedBy:  text("dispatched_by"),
  estimatedEta:  text("estimated_eta"),               // ISO datetime — estimated arrival at destination
  actualDepart:  text("actual_depart"),               // ISO datetime
  actualArrive:  text("actual_arrive"),               // ISO datetime
  completedAt:   text("completed_at"),                 // ISO datetime — auto-set when status → Complete
  notes:         text("notes"),
  createdAt:     text("created_at").notNull(),
  updatedAt:     text("updated_at").notNull(),
});

export const insertNeptTaskSchema = createInsertSchema(neptTasks).omit({ id: true });
export type InsertNeptTask = z.infer<typeof insertNeptTaskSchema>;
export type NeptTask = typeof neptTasks.$inferSelect;

// ── Notifications ────────────────────────────────────────────────────────────
export const notifications = sqliteTable("notifications", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  type:      text("type").notNull(),          // e.g. "task_released"
  title:     text("title").notNull(),
  body:      text("body").notNull(),
  taskRef:   text("task_ref"),                // NEPT-YYYY-NNNN
  taskId:    integer("task_id"),
  readAt:    text("read_at"),                 // ISO datetime — null = unread
  createdAt: text("created_at").notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ── Special Mission QC Sessions ───────────────────────────────────────────────
export const specialMissionSessions = sqliteTable("special_mission_sessions", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  missionType:   text("mission_type").notNull(),    // "lord-howe" | "nets" | "ecmo" | "isolation" | "telehealth"
  missionRef:    text("mission_ref").notNull(),     // e.g. "LHI-2026-001"
  status:        text("status").notNull().default("pre-flight"), // pre-flight | crew-brief | aircraft-config | patient-handover | airborne | post-flight | complete
  aircraftReg:   text("aircraft_reg"),
  destination:   text("destination"),
  checklistData: text("checklist_data").notNull(),  // JSON: Record<checklistItemId, { checked: boolean; signedBy: string; signedAt: string }>
  signoffs:      text("signoffs").notNull(),         // JSON: Array<{ stage, role, timestamp, notes }>
  notes:         text("notes"),
  createdAt:     text("created_at").notNull(),
  updatedAt:     text("updated_at").notNull(),
  completedAt:   text("completed_at"),
});

export const insertSpecialMissionSessionSchema = createInsertSchema(specialMissionSessions).omit({ id: true });
export type InsertSpecialMissionSession = z.infer<typeof insertSpecialMissionSessionSchema>;
export type SpecialMissionSession = typeof specialMissionSessions.$inferSelect;

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoices = sqliteTable("invoices", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber:  text("invoice_number").notNull().unique(),
  invoiceDate:    text("invoice_date").notNull(),
  dueDate:        text("due_date").notNull(),
  serviceDate:    text("service_date").notNull(),
  status:         text("status").notNull().default("Draft"),   // Draft | Submitted | Paid | Overdue
  payerType:      text("payer_type").notNull(),                // "nsw_health" | "private"
  payerName:      text("payer_name").notNull(),
  taskRef:        text("task_ref"),
  patientId:      text("patient_id"),
  pickupLocation: text("pickup_location"),
  destination:    text("destination"),
  aircraftReg:    text("aircraft_reg"),
  missionType:    text("mission_type").notNull().default("Standard NEPT"),
  baseAmount:     integer("base_amount").notNull(),            // cents
  afterHoursSurcharge: integer("after_hours_surcharge").notNull().default(0), // cents
  additionalCharges:   integer("additional_charges").notNull().default(0),    // cents
  gstAmount:      integer("gst_amount").notNull().default(0),  // cents (health = 0)
  totalAmount:    integer("total_amount").notNull(),           // cents
  notes:          text("notes"),
  submittedAt:    text("submitted_at"),
  paidAt:         text("paid_at"),
  createdAt:      text("created_at").notNull(),
  updatedAt:      text("updated_at").notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
