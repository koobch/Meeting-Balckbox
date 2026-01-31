import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, bigint, uuid, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  title: varchar("title", { length: 255 }).notNull(),
  meetingDate: timestamp("meeting_date", { withTimezone: true }),
  participants: text("participants").array(),
  audioStoragePath: text("audio_storage_path"),
  audioFilename: varchar("audio_filename", { length: 255 }),
  audioSizeBytes: bigint("audio_size_bytes", { mode: "number" }),
  audioDurationSeconds: integer("audio_duration_seconds"),
  transcriptWithSpeakers: text("transcript_with_speakers"),
  timelineSummary: text("timeline_summary"),
  topics: text("topics").array(),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const actionItems = pgTable("action_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: 'cascade' }),
  assignee: varchar("assignee", { length: 100 }),
  task: text("task").notNull(),
  dueDate: date("due_date"),
  priority: varchar("priority", { length: 10 }),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  isIntegrated: boolean("is_integrated").notNull().default(false),
  integratedAt: timestamp("integrated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const logicGaps = pgTable("logic_gaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: 'cascade' }),
  speaker: varchar("speaker", { length: 100 }),
  statement: text("statement").notNull(),
  issueType: varchar("issue_type", { length: 20 }),
  severity: varchar("severity", { length: 10 }),
  reason: text("reason"),
  suggestedEvidence: text("suggested_evidence"),
  context: text("context"),
  researchType: varchar("research_type", { length: 255 }),
  reviewStatus: varchar("review_status", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const externalEvidences = pgTable("external_evidences", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  driveFileId: text("drive_file_id").notNull().unique(),
  fileName: text("file_name").notNull(),
  fileType: varchar("file_type", { length: 100 }),
  title: text("title").notNull(),
  summary: text("summary"),
  isIntegrated: boolean("is_integrated").notNull().default(true),
  addedBy: text("added_by"),
  fileSize: text("file_size"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertMeetingSchema = createInsertSchema(meetings);
export const insertActionItemSchema = createInsertSchema(actionItems);
export const insertDecisionSchema = createInsertSchema(decisions);
export const insertLogicGapSchema = createInsertSchema(logicGaps);
export const insertExternalEvidenceSchema = createInsertSchema(externalEvidences);

export type User = typeof users.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type ActionItem = typeof actionItems.$inferSelect;
export type Decision = typeof decisions.$inferSelect;
export type LogicGap = typeof logicGaps.$inferSelect;
export type ExternalEvidence = typeof externalEvidences.$inferSelect;
