import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const generationMode = [
  "text-to-image",
  "generative-fill",
  "style-reference",
  "parametric-adjust",
] as const;

export const imageGenerations = mysqlTable("imageGenerations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mode: mysqlEnum("mode", generationMode).notNull(),
  prompt: text("prompt").notNull(),
  engine: varchar("engine", { length: 128 }).notNull(),
  providerModel: varchar("providerModel", { length: 128 }),
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  originalPrompt: text("originalPrompt"),
  optimizedPrompt: text("optimizedPrompt"),
  optimizationIterations: int("optimizationIterations").default(1).notNull(),
  optimizationQualityScore: int("optimizationQualityScore").default(0).notNull(),
  sourceImageKey: varchar("sourceImageKey", { length: 512 }),
  width: int("width"),
  height: int("height"),
  aspectRatio: varchar("aspectRatio", { length: 32 }),
  steps: int("steps"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImageGeneration = typeof imageGenerations.$inferSelect;
export type InsertImageGeneration = typeof imageGenerations.$inferInsert;

/** Audio sources live in S3; this table contains only each user's transcript metadata. */
export const audioTranscriptions = mysqlTable("audioTranscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  audioKey: varchar("audioKey", { length: 512 }).notNull(),
  audioUrl: varchar("audioUrl", { length: 1024 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  transcript: text("transcript").notNull(),
  language: varchar("language", { length: 16 }),
  durationSeconds: int("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudioTranscription = typeof audioTranscriptions.$inferSelect;
export type InsertAudioTranscription = typeof audioTranscriptions.$inferInsert;

export const userPreferences = mysqlTable(
  "userPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    defaultMode: mysqlEnum("defaultMode", generationMode)
      .default("text-to-image")
      .notNull(),
    defaultAspectRatio: varchar("defaultAspectRatio", { length: 32 })
      .default("1:1")
      .notNull(),
    defaultSteps: int("defaultSteps").default(4).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userIdUnique: uniqueIndex("userPreferences_userId_unique").on(table.userId) }),
);

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

export const generationRelations = {
  imageGenerations,
  audioTranscriptions,
  userPreferences,
};

// The database schema intentionally stores metadata and S3 keys only, never image bytes.
