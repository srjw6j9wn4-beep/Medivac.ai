import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

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
  escortHeavy:   integer("escort_heavy").default(0),  // 1 = escort >120 kg (weight category flag)
  referringHospital: text("referring_hospital"),
  receivingHospital: text("receiving_hospital"),
  aircraftReg:   text("aircraft_reg"),                // assigned aircraft
  pilotName:     text("pilot_name"),
  nurseName:     text("nurse_name"),
  driverName:    text("driver_name"),            // Road Leg 1 — pickup driver
  driverNameLeg2: text("driver_name_leg2"),       // Road Leg 2 — drop-off driver
  dispatchedBy:  text("dispatched_by"),
  estimatedEta:  text("estimated_eta"),               // ISO datetime — estimated arrival at destination
  actualDepart:  text("actual_depart"),               // ISO datetime
  actualArrive:  text("actual_arrive"),               // ISO datetime
  completedAt:   text("completed_at"),                 // ISO datetime — auto-set when status → Complete
  notes:         text("notes"),
  groundTransportCost: real("ground_transport_cost").default(200),  // van pick/drop — dollars and cents
  // Patient mobility
  patientMobility: text("patient_mobility").default("ambulant"),   // "ambulant" | "stretcher"
  // Multiple patients — JSON array of {name, ref, mobility, specialConsiderations}
  patients:       text("patients"),
  // Special considerations — comma-separated flags
  specialConsiderations: text("special_considerations"),           // e.g. "Cardiac Monitor,Infectious"
  // Pickup / dropoff time notes (surfaced in Ops Room)
  pickupTimeNote:  text("pickup_time_note"),
  dropoffTimeNote: text("dropoff_time_note"),
  createdAt:     text("created_at").notNull(),
  updatedAt:     text("updated_at").notNull(),
});

export const insertNeptTaskSchema = createInsertSchema(neptTasks).omit({ id: true });
export type InsertNeptTask = z.infer<typeof insertNeptTaskSchema>;
export type NeptTask = typeof neptTasks.$inferSelect;

// ── NEPT Crew Breaks ────────────────────────────────────────────────────────
export const neptBreaks = sqliteTable("nept_breaks", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  category:    text("category").notNull(),          // "Meal Break" | "Cleaning Break"
  base:        text("base").notNull(),              // "Dubbo" | "Bankstown" | "Broken Hill"
  crewNames:   text("crew_names").notNull(),        // comma-separated crew names
  startTime:   text("start_time").notNull(),        // ISO datetime
  endTime:     text("end_time").notNull(),          // ISO datetime
  notes:       text("notes"),
  createdAt:   text("created_at").notNull(),
  updatedAt:   text("updated_at").notNull(),
});

export const insertNeptBreakSchema = createInsertSchema(neptBreaks).omit({ id: true });
export type InsertNeptBreak = z.infer<typeof insertNeptBreakSchema>;
export type NeptBreak = typeof neptBreaks.$inferSelect;

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
  groundTransportCost: integer("ground_transport_cost").default(200),  // van pick/drop $200 each
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
  status:         text("status").notNull().default("Draft"),   // Draft | Pending Approval | Submitted | Paid | Overdue
  approvalStatus: text("approval_status"),                     // null | 'pending' | 'approved' | 'rejected'
  approvedBy:     text("approved_by"),
  approvedAt:     text("approved_at"),
  rejectedBy:     text("rejected_by"),
  rejectedAt:     text("rejected_at"),
  approvalNote:   text("approval_note"),
  autoGenerated:  integer("auto_generated").notNull().default(0), // 1 = auto-created on task completion
  sourceType:     text("source_type"),                          // 'nept' | 'charter' | 'acc' | 'dental' | 'special'
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

// ── Charter Quotes ────────────────────────────────────────────────────────────
export const charterQuotes = sqliteTable('charter_quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteNumber: text('quote_number').notNull(),
  clientName: text('client_name').notNull(),
  clientContact: text('client_contact'),
  purpose: text('purpose').notNull(),           // 'medevac_charter' | 'scenic' | 'freight' | 'other'
  aircraftType: text('aircraft_type').notNull(), // 'B200' | 'B350'
  departureDate: text('departure_date').notNull(),
  legs: text('legs').notNull(),                  // JSON: array of leg objects
  crew: text('crew').notNull(),                  // JSON: crew config
  costs: text('costs').notNull(),                // JSON: full breakdown
  totalCost: integer('total_cost').notNull(),    // cents
  marginPercent: integer('margin_percent').notNull().default(15),
  finalQuote: integer('final_quote').notNull(),  // cents (total + margin)
  status: text('status').notNull().default('draft'), // 'draft'|'sent'|'accepted'|'declined'
  autoInvoice: integer('auto_invoice').notNull().default(0), // 1 = auto-generate invoice when accepted
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type CharterQuote = typeof charterQuotes.$inferSelect;
export type InsertCharterQuote = typeof charterQuotes.$inferInsert;

// ── Quote Rates — live rate monitor for Charter Quote engine ────────────────
export const quoteRates = sqliteTable('quote_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rateKey: text('rate_key').notNull().unique(),   // e.g. 'enroute_per_100km_per_tonne'
  rateValue: text('rate_value').notNull(),          // stored as string (numeric)
  category: text('category').notNull(),             // 'airservices' | 'landing' | 'tnc' | 'fuel' | 'crew' | 'accommodation' | 'ground'
  label: text('label').notNull(),                   // human-readable
  unit: text('unit').notNull(),                     // '$/100km/tonne' | '$/tonne' | '$/litre' | '$/hr' | '$/night' | '$/leg'
  source: text('source'),                           // URL of authoritative source
  effectiveDate: text('effective_date'),             // 'YYYY-MM-DD'
  previousValue: text('previous_value'),             // last value before latest update
  previousDate: text('previous_date'),               // when previous value was effective
  lastChecked: text('last_checked'),                 // ISO timestamp of last automated check
  autoUpdateEnabled: integer('auto_update_enabled').notNull().default(1), // 0|1
  notes: text('notes'),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type QuoteRate = typeof quoteRates.$inferSelect;
export type InsertQuoteRate = typeof quoteRates.$inferInsert;

// ── Cost Optimizer — config store ────────────────────────────────────────────
export const costOptimizerConfig = sqliteTable('cost_optimizer_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(), // JSON string
  category: text('category').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type CostOptimizerConfig = typeof costOptimizerConfig.$inferSelect;
export type InsertCostOptimizerConfig = typeof costOptimizerConfig.$inferInsert;

// ── Cost Optimizer — Action Plan items ───────────────────────────────────────
export const actionPlanItems = sqliteTable('action_plan_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'staffing' | 'asset' | 'ops'
  estimatedAnnualValue: integer('estimated_annual_value').notNull(), // cents
  priority: text('priority').notNull(), // 'high' | 'medium' | 'low'
  status: text('status').notNull().default('proposed'), // 'proposed' | 'in_progress' | 'complete'
  notes: text('notes'),
  sourceType: text('source_type'), // 'leakage' | 'staffing' | 'asset' | 'manual'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const insertActionPlanItemSchema = createInsertSchema(actionPlanItems).omit({ id: true });
export type InsertActionPlanItem = z.infer<typeof insertActionPlanItemSchema>;
export type ActionPlanItem = typeof actionPlanItems.$inferSelect;

// ── Client Rate Sheet ─────────────────────────────────────────────────────────
// Per-organisation, per-mission-type billing rates
export const clientRates = sqliteTable('client_rates', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  orgName:       text('org_name').notNull(),        // e.g. "NSW Health", "RAHS Dental"
  orgCode:       text('org_code').notNull(),        // e.g. "nsw_health", "rahs_dental"
  missionType:   text('mission_type').notNull(),    // "NEPT" | "Dental" | "ACC" | "Charter" | "Special"
  rateType:      text('rate_type').notNull(),       // "per_flight" | "per_hour" | "per_leg"
  rateAmountCents: integer('rate_amount_cents').notNull(), // rate in cents
  afterHoursSurchargeCents: integer('after_hours_surcharge_cents').notNull().default(0),
  gstApplicable: integer('gst_applicable').notNull().default(0), // 0=no GST, 1=GST
  notes:         text('notes'),
  effectiveFrom: text('effective_from'),            // ISO date
  active:        integer('active').notNull().default(1),
  createdAt:     text('created_at').notNull(),
  updatedAt:     text('updated_at').notNull(),
});

export const insertClientRateSchema = createInsertSchema(clientRates).omit({ id: true });
export type InsertClientRate = z.infer<typeof insertClientRateSchema>;
export type ClientRate = typeof clientRates.$inferSelect;

// ── Invoice Lines ─────────────────────────────────────────────────────────────
// One line per flight/mission on an invoice
export const invoiceLines = sqliteTable('invoice_lines', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  invoiceBatchId: text('invoice_batch_id').notNull(), // groups lines into a batch/reconciliation
  orgCode:       text('org_code').notNull(),
  orgName:       text('org_name').notNull(),
  missionType:   text('mission_type').notNull(),    // "NEPT" | "Dental" | "ACC" | "Charter" | "Special"
  serviceDate:   text('service_date').notNull(),    // ISO date
  taskRef:       text('task_ref'),                  // e.g. NEPT-2026-0047
  aircraftReg:   text('aircraft_reg'),
  fromIcao:      text('from_icao'),
  toIcao:        text('to_icao'),
  flightTimeMins: integer('flight_time_mins'),      // block time
  paxCount:      integer('pax_count').notNull().default(1),
  rateAmountCents: integer('rate_amount_cents').notNull(),
  afterHoursSurchargeCents: integer('after_hours_surcharge_cents').notNull().default(0),
  additionalCents: integer('additional_cents').notNull().default(0),
  gstCents:      integer('gst_cents').notNull().default(0),
  lineTotalCents: integer('line_total_cents').notNull(),
  status:        text('status').notNull().default('pending'), // pending | approved | invoiced | disputed
  invoiceNumber: text('invoice_number'),            // set once invoiced
  notes:         text('notes'),
  flagged:       integer('flagged').notNull().default(0), // AI flagged for review
  flagReason:    text('flag_reason'),
  autoPopulated: integer('auto_populated').notNull().default(1), // 1=auto from dispatch, 0=manual
  createdAt:     text('created_at').notNull(),
  updatedAt:     text('updated_at').notNull(),
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({ id: true });
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;

// ── Invoice Audit ─────────────────────────────────────────────────────────────
// Full audit trail — every action on every invoice
export const invoiceAudit = sqliteTable('invoice_audit', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  entityType:    text('entity_type').notNull(), // "invoice_line" | "invoice_batch" | "client_rate"
  entityId:      text('entity_id').notNull(),   // the id of the changed entity
  action:        text('action').notNull(),       // "created" | "edited" | "approved" | "disputed" | "invoiced" | "emailed" | "rate_changed"
  performedBy:   text('performed_by').notNull(), // user/role
  detail:        text('detail'),                 // JSON: before/after diff or summary
  createdAt:     text('created_at').notNull(),
});

export type InvoiceAuditEntry = typeof invoiceAudit.$inferSelect;

// ── Invoice Batches ───────────────────────────────────────────────────────────
// A reconciliation run — groups lines, period, status
export const invoiceBatches = sqliteTable('invoice_batches', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  batchId:       text('batch_id').notNull().unique(), // e.g. "BATCH-2026-07-10"
  periodType:    text('period_type').notNull(),  // "daily" | "weekly" | "monthly" | "on_demand"
  periodStart:   text('period_start').notNull(), // ISO date
  periodEnd:     text('period_end').notNull(),   // ISO date
  status:        text('status').notNull().default('reconciling'), // reconciling | review | approved | sent
  totalLines:    integer('total_lines').notNull().default(0),
  totalAmountCents: integer('total_amount_cents').notNull().default(0),
  flaggedCount:  integer('flagged_count').notNull().default(0),
  approvedBy:    text('approved_by'),
  approvedAt:    text('approved_at'),
  sentAt:        text('sent_at'),
  notes:         text('notes'),
  createdAt:     text('created_at').notNull(),
  updatedAt:     text('updated_at').notNull(),
});

export type InvoiceBatch = typeof invoiceBatches.$inferSelect;

// ── Fuel Receipts ─────────────────────────────────────────────────────────────
// Every fuel uplift — scanned or manually entered — lands here first,
// then auto-appears in the Reconciliation tab of Fuel & Finance.
export const fuelReceipts = sqliteTable('fuel_receipts', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  receiptRef:      text('receipt_ref').notNull(),         // e.g. "VE-20260712-001" or auto-generated
  entryMethod:     text('entry_method').notNull().default('manual'), // 'manual' | 'scan' | 'auto'
  aircraftReg:     text('aircraft_reg').notNull(),
  airportIcao:     text('airport_icao').notNull(),
  upliftDate:      text('uplift_date').notNull(),          // ISO yyyy-mm-dd
  upliftLb:        real('uplift_lb').notNull(),            // always in lb
  pricePerLb:      real('price_per_lb').notNull(),
  totalAud:        real('total_aud').notNull(),
  supplier:        text('supplier').notNull(),
  invoiceRef:      text('invoice_ref'),                   // supplier invoice number if known
  scanImageUrl:    text('scan_image_url'),                // URL of scanned receipt image
  reconStatus:     text('recon_status').notNull().default('pending'), // 'pending' | 'matched' | 'queried' | 'approved'
  reconBatchId:    text('recon_batch_id'),                // links to a reconciliation run
  notes:           text('notes'),
  enteredBy:       text('entered_by').notNull().default('ops'),
  createdAt:       text('created_at').notNull(),
  updatedAt:       text('updated_at').notNull(),
});

export const insertFuelReceiptSchema = createInsertSchema(fuelReceipts).omit({ id: true });
export type InsertFuelReceipt = z.infer<typeof insertFuelReceiptSchema>;
export type FuelReceipt = typeof fuelReceipts.$inferSelect;

// ── Ops Tasks ─────────────────────────────────────────────────────────────────
// Operational task management — admin tasks, crew requests, roo runs, fuel orders, etc.
export const opsTasks = sqliteTable('ops_tasks', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  taskRef:       text('task_ref').notNull(),               // e.g. "OPS-2026-0001"
  type:          text('type').notNull(),                   // 'admin' | 'fuel_order' | 'roo_run' | 'catering' | 'transport' | 'maintenance_request' | 'crew_request' | 'other'
  title:         text('title').notNull(),
  description:   text('description'),
  requestedBy:   text('requested_by').notNull(),           // name/role of requester
  requestSource: text('request_source').notNull().default('ops'), // 'ops' | 'crew' | 'pilot' | 'nurse' | 'engineer'
  assignedTo:    text('assigned_to'),                      // assigned ops staff
  aircraftReg:   text('aircraft_reg'),                     // linked aircraft if applicable
  locationIcao:  text('location_icao'),                    // location if applicable
  priority:      text('priority').notNull().default('normal'), // 'low' | 'normal' | 'high' | 'urgent'
  status:        text('status').notNull().default('open'), // 'open' | 'in_progress' | 'pending_approval' | 'completed' | 'cancelled'
  dueDate:       text('due_date'),                         // ISO yyyy-mm-dd
  dueTime:       text('due_time'),                         // HH:MM local
  completedAt:   text('completed_at'),
  completedBy:   text('completed_by'),
  attachments:   text('attachments'),                      // JSON array of file refs
  notes:         text('notes'),
  linkedTaskId:  integer('linked_task_id'),                // link to project task if applicable
  createdAt:     text('created_at').notNull(),
  updatedAt:     text('updated_at').notNull(),
});

export const insertOpsTaskSchema = createInsertSchema(opsTasks).omit({ id: true });
export type InsertOpsTask = z.infer<typeof insertOpsTaskSchema>;
export type OpsTask = typeof opsTasks.$inferSelect;

// Ops task comments / updates
export const opsTaskComments = sqliteTable('ops_task_comments', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  taskId:     integer('task_id').notNull(),
  author:     text('author').notNull(),
  body:       text('body').notNull(),
  createdAt:  text('created_at').notNull(),
});
export type OpsTaskComment = typeof opsTaskComments.$inferSelect;

// ── Projects ──────────────────────────────────────────────────────────────────
// Project management — initiatives, programs, platform projects
export const projects = sqliteTable('projects', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  projectRef:  text('project_ref').notNull(),              // e.g. "PRJ-2026-001"
  name:        text('name').notNull(),
  description: text('description'),
  category:    text('category').notNull().default('general'), // 'platform' | 'compliance' | 'infrastructure' | 'clinical' | 'general'
  status:      text('status').notNull().default('active'), // 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority:    text('priority').notNull().default('normal'), // 'low' | 'normal' | 'high' | 'critical'
  owner:       text('owner').notNull(),
  members:     text('members'),                            // JSON array of names
  startDate:   text('start_date'),
  targetDate:  text('target_date'),
  completedAt: text('completed_at'),
  progress:    integer('progress').notNull().default(0),   // 0-100
  notes:       text('notes'),
  createdAt:   text('created_at').notNull(),
  updatedAt:   text('updated_at').notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Project tasks (tickets/cards within a project)
export const projectTasks = sqliteTable('project_tasks', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  projectId:   integer('project_id').notNull(),
  taskRef:     text('task_ref').notNull(),                 // e.g. "PRJ-001-T-04"
  title:       text('title').notNull(),
  description: text('description'),
  type:        text('type').notNull().default('task'),     // 'task' | 'bug' | 'feature' | 'improvement' | 'risk'
  status:      text('status').notNull().default('todo'),   // 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'
  priority:    text('priority').notNull().default('normal'),
  assignedTo:  text('assigned_to'),
  dueDate:     text('due_date'),
  completedAt: text('completed_at'),
  storyPoints: integer('story_points'),
  labels:      text('labels'),                             // JSON array
  notes:       text('notes'),
  createdAt:   text('created_at').notNull(),
  updatedAt:   text('updated_at').notNull(),
});

export const insertProjectTaskSchema = createInsertSchema(projectTasks).omit({ id: true });
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type ProjectTask = typeof projectTasks.$inferSelect;

// ── Asset Utilisation — Service Status Log ────────────────────────────────
// Appended each time the 0845 morning brief is saved. Feeds the
// Asset Utilisation analytics engine to detect idle patterns and
// surface charter / maintenance window opportunities.
export const serviceStatusLog = sqliteTable('service_status_log', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  date:        text('date').notNull(),          // yyyy-mm-dd
  dayOfWeek:   integer('day_of_week').notNull(), // 0=Sun … 6=Sat
  serviceCode: text('service_code').notNull(),  // e.g. "BK-CLINIC-AIR"
  base:        text('base').notNull(),          // BHI | DU | BK | ESS | TAS
  status:      text('status').notNull(),        // green | amber | offline | not_required
  aircraftReg: text('aircraft_reg'),            // e.g. "VH-LTQ" — nullable if unassigned
  recordedAt:  text('recorded_at').notNull(),   // ISO timestamp
  recordedBy:  text('recorded_by'),             // role string
});

export const insertServiceStatusLogSchema = createInsertSchema(serviceStatusLog).omit({ id: true });
export type InsertServiceStatusLog = z.infer<typeof insertServiceStatusLogSchema>;
export type ServiceStatusLog = typeof serviceStatusLog.$inferSelect;

// ── Staff Idea Hub ─────────────────────────────────────────────────────────
export const staffSuggestions = sqliteTable('staff_suggestions', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  title:            text('title').notNull(),
  description:      text('description').notNull(),
  category:         text('category').notNull(),      // growth|efficiency|safety|culture|technology|other
  impactArea:       text('impact_area').notNull(),   // operations|finance|people|customer|compliance
  submittedBy:      text('submitted_by').notNull(),
  submittedAt:      text('submitted_at').notNull(),
  status:           text('status').notNull().default('pending'), // pending|reviewing|approved|declined|implemented
  gmNote:           text('gm_note'),
  gmReviewedAt:     text('gm_reviewed_at'),
  aiScore:          integer('ai_score'),             // 0-100
  aiSummary:        text('ai_summary'),
  aiEffort:         text('ai_effort'),               // low|medium|high
  aiImpact:         text('ai_impact'),               // low|medium|high
  aiRecommendation: text('ai_recommendation'),
  aiAnalysedAt:     text('ai_analysed_at'),
  clusterTag:       text('cluster_tag'),
});

export const insertStaffSuggestionSchema = createInsertSchema(staffSuggestions).omit({ id: true });
export type InsertStaffSuggestion = z.infer<typeof insertStaffSuggestionSchema>;
export type StaffSuggestion = typeof staffSuggestions.$inferSelect;

// ── RBAC Permissions ───────────────────────────────────────────────────────
// Stores the full permission matrix as a single JSON blob, keyed by a
// singleton row (settings_key = 'default'). Admins edit via the RBAC page.
export const rbacPermissions = sqliteTable('rbac_permissions', {
  settingsKey: text('settings_key').primaryKey(),   // always 'default'
  matrix:      text('matrix').notNull(),            // JSON: Record<role, Record<moduleId, PermLevel>>
  updatedAt:   text('updated_at').notNull(),
  updatedBy:   text('updated_by').notNull(),
});

// ── Regulatory Monitoring ─────────────────────────────────────────────────────
export const regSources = sqliteTable("reg_sources", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  key:         text("key").notNull().unique(),      // e.g. "casa_part121"
  label:       text("label").notNull(),
  url:         text("url").notNull(),
  lastHash:    text("last_hash"),                   // SHA-256 of last fetched content
  lastChecked: text("last_checked"),                // ISO datetime
  lastChanged: text("last_changed"),                // ISO datetime of last detected change
  status:      text("status").notNull().default("pending"), // pending | ok | changed | error
});

export const regAlerts = sqliteTable("reg_alerts", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  sourceKey:   text("source_key").notNull(),
  sourceLabel: text("source_label").notNull(),
  summary:     text("summary").notNull(),           // AI-generated plain-English change summary
  impact:      text("impact").notNull(),            // AI-generated operational impact for RFDS SE
  affectedSops: text("affected_sops").notNull(),    // JSON array of affected SOP codes
  detectedAt:  text("detected_at").notNull(),       // ISO datetime
  readAt:      text("read_at"),                     // null = unread
});

export type RegSource = typeof regSources.$inferSelect;
export type RegAlert = typeof regAlerts.$inferSelect;

export const bugReports = sqliteTable("bug_reports", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  createdAt:   text("created_at").notNull().default(""),
  page:        text("page").notNull(),
  pagePath:    text("page_path").notNull(),
  category:    text("category").notNull(),
  severity:    text("severity").notNull(),
  description: text("description").notNull(),
  steps:       text("steps").notNull().default(""),
  status:      text("status").notNull().default("open"),
  resolvedAt:  text("resolved_at"),
  resolvedBy:  text("resolved_by"),
});

export const insertBugReportSchema = createInsertSchema(bugReports).omit({ id: true, createdAt: true, status: true, resolvedAt: true, resolvedBy: true });
export type InsertBugReport = z.infer<typeof insertBugReportSchema>;
export type BugReport = typeof bugReports.$inferSelect;
