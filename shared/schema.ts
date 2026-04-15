import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Install log entries — immutable, append-only, no PII
export const installLogs = sqliteTable("install_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").notNull(),
  severity: text("severity").notNull(), // info | warn | error | success
  step: text("step").notNull(),
  message: text("message").notNull(),
  host: text("host").notNull(), // macos | digitalocean | azure | generic-vps
});

// Installation state — tracks wizard progress
export const installState = sqliteTable("install_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hostTarget: text("host_target").notNull().default("macos"),
  currentStep: integer("current_step").notNull().default(0),
  stepsCompleted: text("steps_completed").notNull().default("[]"), // JSON array
  preflightResults: text("preflight_results").notNull().default("{}"), // JSON object
  configValues: text("config_values").notNull().default("{}"), // JSON object
  rollbackScripts: text("rollback_scripts").notNull().default("[]"), // JSON array
  status: text("status").notNull().default("pending"), // pending | in_progress | completed | failed | rolled_back
});

// Hardening checklist items
export const hardeningChecks = sqliteTable("hardening_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  command: text("command"),
  isCompleted: integer("is_completed").notNull().default(0),
  hostTarget: text("host_target").notNull(),
  severity: text("severity").notNull(), // critical | recommended | optional
});

// Immutable audit log — crypto hash chain, AiGovOps Foundation standard
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  user: text("user").notNull(), // anonymized user identifier
  prompt: text("prompt").notNull(), // action/prompt description
  results: text("results").notNull(), // outcome of the action
  previousHash: text("previous_hash").notNull(), // hash of prior entry (genesis = "0")
  currentHash: text("current_hash").notNull(), // SHA-256(timestamp+user+prompt+results+previousHash)
});

// Owner passphrase hash for secure log access
export const ownerAuth = sqliteTable("owner_auth", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  passphraseHash: text("passphrase_hash").notNull(), // SHA-256 of passphrase
});

export const insertInstallLogSchema = createInsertSchema(installLogs).omit({ id: true });
export const insertInstallStateSchema = createInsertSchema(installState).omit({ id: true });
export const insertHardeningCheckSchema = createInsertSchema(hardeningChecks).omit({ id: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true });
export const insertOwnerAuthSchema = createInsertSchema(ownerAuth).omit({ id: true });

export type InsertInstallLog = z.infer<typeof insertInstallLogSchema>;
export type InsertInstallState = z.infer<typeof insertInstallStateSchema>;
export type InsertHardeningCheck = z.infer<typeof insertHardeningCheckSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertOwnerAuth = z.infer<typeof insertOwnerAuthSchema>;

export type InstallLog = typeof installLogs.$inferSelect;
export type InstallState = typeof installState.$inferSelect;
export type HardeningCheck = typeof hardeningChecks.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type OwnerAuth = typeof ownerAuth.$inferSelect;
