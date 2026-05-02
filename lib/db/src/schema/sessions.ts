import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  formId: text("form_id").notNull(),
  formName: text("form_name").notNull(),
  countryCode: text("country_code").notNull().default("US"),
  status: text("status").notNull().default("in_progress"),
  currentStep: integer("current_step").notNull().default(0),
  totalSteps: integer("total_steps").notNull().default(0),
  answers: jsonb("answers").notNull().default({}),
  persona: jsonb("persona"),
  completionPercent: integer("completion_percent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;

export interface Persona {
  role: "Student" | "Working Professional" | "Self-Employed" | "Senior Citizen" | "Unemployed" | "Other";
  priorExperience: "First time" | "Applied before but it was rejected" | "Applied before and got it" | "Not sure";
  comfort: "I find it confusing" | "I manage okay" | "I'm comfortable with it";
}
