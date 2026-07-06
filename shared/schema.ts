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
