import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, bigint, uuid } from "drizzle-orm/pg-core";
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
  projectId: uuid("project_id"), // SQL: project_id uuid null
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

export const insertMeetingSchema = createInsertSchema(meetings);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
