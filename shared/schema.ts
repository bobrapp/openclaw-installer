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

export const insertInstallLogSchema = createInsertSchema(installLogs).omit({ id: true });
export const insertInstallStateSchema = createInsertSchema(installState).omit({ id: true });
export const insertHardeningCheckSchema = createInsertSchema(hardeningChecks).omit({ id: true });

export type InsertInstallLog = z.infer<typeof insertInstallLogSchema>;
export type InsertInstallState = z.infer<typeof insertInstallStateSchema>;
export type InsertHardeningCheck = z.infer<typeof insertHardeningCheckSchema>;

export type InstallLog = typeof installLogs.$inferSelect;
export type InstallState = typeof installState.$inferSelect;
export type HardeningCheck = typeof hardeningChecks.$inferSelect;
