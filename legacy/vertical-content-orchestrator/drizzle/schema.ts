import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

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

export const contentItems = mysqlTable(
  "content_items",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    category: mysqlEnum("category", [
      "personal",
      "gatos/humor",
      "personaje virtual",
    ]).notNull(),
    mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
    mediaUrl: text("mediaUrl").notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    prompt: text("prompt"),
    width: int("width"),
    height: int("height"),
    durationSeconds: int("durationSeconds"),
    reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"])
      .default("pending")
      .notNull(),
    source: mysqlEnum("source", ["upload", "generated"])
      .default("upload")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerIdx: index("content_owner_idx").on(table.ownerId),
    reviewIdx: index("content_review_idx").on(table.reviewStatus),
  })
);

export const schedules = mysqlTable(
  "schedules",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    contentId: int("contentId").notNull(),
    platform: mysqlEnum("platform", [
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
      "telegram",
    ]).notNull(),
    scheduledAt: timestamp("scheduledAt").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
    caption: text("caption"),
    enabled: boolean("enabled").default(true).notNull(),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerDateIdx: index("schedule_owner_date_idx").on(
      table.ownerId,
      table.scheduledAt
    ),
    taskIdx: index("schedule_task_idx").on(table.scheduleCronTaskUid),
  })
);

export const publications = mysqlTable(
  "publications",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    contentId: int("contentId").notNull(),
    scheduleId: int("scheduleId"),
    platform: mysqlEnum("platform", [
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
      "telegram",
    ]).notNull(),
    status: mysqlEnum("status", [
      "privado",
      "pendiente de auditoría",
      "publicado",
    ])
      .default("privado")
      .notNull(),
    externalId: varchar("externalId", { length: 255 }),
    publishedUrl: text("publishedUrl"),
    errorMessage: text("errorMessage"),
    attemptedAt: timestamp("attemptedAt"),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerIdx: index("publication_owner_idx").on(table.ownerId),
    statusIdx: index("publication_status_idx").on(table.status),
  })
);

export const queueJobs = mysqlTable(
  "queue_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    kind: mysqlEnum("kind", ["publish", "generate", "process"]).notNull(),
    status: mysqlEnum("status", [
      "queued",
      "running",
      "succeeded",
      "failed",
      "dead",
    ])
      .default("queued")
      .notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 255 })
      .notNull()
      .unique(),
    payload: text("payload").notNull(),
    attempts: int("attempts").default(0).notNull(),
    maxAttempts: int("maxAttempts").default(3).notNull(),
    runAfter: timestamp("runAfter").defaultNow().notNull(),
    leaseOwner: varchar("leaseOwner", { length: 128 }),
    leaseUntil: timestamp("leaseUntil"),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    readyIdx: index("queue_ready_idx").on(table.status, table.runAfter),
    leaseIdx: index("queue_lease_idx").on(table.leaseUntil),
    ownerIdx: index("queue_owner_idx").on(table.ownerId),
  })
);

export const workerHeartbeats = mysqlTable(
  "worker_heartbeats",
  {
    id: int("id").autoincrement().primaryKey(),
    workerName: varchar("workerName", { length: 128 }).notNull().unique(),
    status: mysqlEnum("status", ["idle", "running", "degraded"])
      .default("idle")
      .notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
    lastJobId: int("lastJobId"),
    scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
    lastError: text("lastError"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    scheduleIdx: index("worker_schedule_idx").on(table.scheduleCronTaskUid),
  })
);

export const activityEvents = mysqlTable(
  "activity_events",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    type: mysqlEnum("type", [
      "upload",
      "review",
      "schedule",
      "publish",
      "error",
      "generation",
    ]).notNull(),
    message: text("message").notNull(),
    platform: mysqlEnum("platform", [
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
      "telegram",
    ]),
    contentId: int("contentId"),
    publicationId: int("publicationId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    ownerDateIdx: index("activity_owner_date_idx").on(
      table.ownerId,
      table.createdAt
    ),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type QueueJob = typeof queueJobs.$inferSelect;
export type WorkerHeartbeat = typeof workerHeartbeats.$inferSelect;

export const CONTENT_CATEGORIES = [
  "personal",
  "gatos/humor",
  "personaje virtual",
] as const;
export const PUBLICATION_STATUSES = [
  "privado",
  "pendiente de auditoría",
  "publicado",
] as const;
export const PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
] as const;
