import { and, desc, eq, isNull, lte, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityEvents,
  contentItems,
  queueJobs,
  workerHeartbeats,
  publications,
  schedules,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function getContentForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentItems)
    .where(eq(contentItems.ownerId, ownerId))
    .orderBy(desc(contentItems.createdAt));
}

export async function getReviewQueue(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentItems)
    .where(
      and(
        eq(contentItems.ownerId, ownerId),
        eq(contentItems.reviewStatus, "pending")
      )
    )
    .orderBy(desc(contentItems.createdAt));
}

export async function getSchedulesForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(schedules)
    .where(eq(schedules.ownerId, ownerId))
    .orderBy(schedules.scheduledAt);
}

export async function getPublicationsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(publications)
    .where(eq(publications.ownerId, ownerId))
    .orderBy(desc(publications.createdAt));
}

export async function getActivityForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.ownerId, ownerId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(40);
}

export async function getDashboardStats(ownerId: number) {
  const db = await getDb();
  if (!db)
    return {
      totalContent: 0,
      pendingReview: 0,
      scheduled: 0,
      published: 0,
      privatePublications: 0,
    };
  const [content, pending, scheduled, published, privateCount] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(contentItems)
        .where(eq(contentItems.ownerId, ownerId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(contentItems)
        .where(
          and(
            eq(contentItems.ownerId, ownerId),
            eq(contentItems.reviewStatus, "pending")
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schedules)
        .where(
          and(eq(schedules.ownerId, ownerId), eq(schedules.enabled, true))
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(publications)
        .where(
          and(
            eq(publications.ownerId, ownerId),
            eq(publications.status, "publicado")
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(publications)
        .where(
          and(
            eq(publications.ownerId, ownerId),
            eq(publications.status, "privado")
          )
        ),
    ]);
  return {
    totalContent: Number(content[0]?.count ?? 0),
    pendingReview: Number(pending[0]?.count ?? 0),
    scheduled: Number(scheduled[0]?.count ?? 0),
    published: Number(published[0]?.count ?? 0),
    privatePublications: Number(privateCount[0]?.count ?? 0),
  };
}

export async function updateReviewStatus(
  ownerId: number,
  contentId: number,
  reviewStatus: "approved" | "rejected"
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(contentItems)
    .set({ reviewStatus, updatedAt: new Date() })
    .where(
      and(eq(contentItems.id, contentId), eq(contentItems.ownerId, ownerId))
    );
}

export async function updateContentMetadata(
  ownerId: number,
  contentId: number,
  input: Pick<typeof contentItems.$inferInsert, "title" | "category" | "prompt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(contentItems)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(eq(contentItems.id, contentId), eq(contentItems.ownerId, ownerId))
    );
}

export async function createContent(
  ownerId: number,
  input: typeof contentItems.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(contentItems).values({ ...input, ownerId });
  return Number(result[0].insertId);
}

export async function createActivity(
  ownerId: number,
  input: Omit<typeof activityEvents.$inferInsert, "ownerId">
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityEvents).values({ ...input, ownerId });
}

export async function createSchedule(
  ownerId: number,
  input: typeof schedules.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(schedules).values({ ...input, ownerId });
  return Number(result[0].insertId);
}

export async function createPublication(
  ownerId: number,
  input: Omit<typeof publications.$inferInsert, "ownerId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(publications).values({ ...input, ownerId });
  return Number(result[0].insertId);
}

export async function enqueueQueueJob(input: {
  ownerId: number;
  kind: "publish" | "generate" | "process";
  idempotencyKey: string;
  payload: unknown;
  maxAttempts?: number;
  runAfter?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db
    .select()
    .from(queueJobs)
    .where(eq(queueJobs.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing[0]) return existing[0];
  try {
    await db.insert(queueJobs).values({
      ownerId: input.ownerId,
      kind: input.kind,
      idempotencyKey: input.idempotencyKey,
      payload: JSON.stringify(input.payload),
      maxAttempts: input.maxAttempts ?? 3,
      runAfter: input.runAfter ?? new Date(),
    });
  } catch (error) {
    const raced = await db
      .select()
      .from(queueJobs)
      .where(eq(queueJobs.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (!raced[0]) throw error;
  }
  const created = await db
    .select()
    .from(queueJobs)
    .where(eq(queueJobs.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (!created[0]) throw new Error("Queue job was not created");
  return created[0];
}

export async function claimNextQueueJob(workerName: string, leaseMs = 110_000) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  const candidate = await db
    .select()
    .from(queueJobs)
    .where(
      or(
        and(eq(queueJobs.status, "queued"), lte(queueJobs.runAfter, now)),
        and(
          eq(queueJobs.status, "running"),
          or(isNull(queueJobs.leaseUntil), lt(queueJobs.leaseUntil, now))
        )
      )
    )
    .orderBy(queueJobs.runAfter)
    .limit(1);
  if (!candidate[0]) return undefined;
  const leaseUntil = new Date(Date.now() + leaseMs);
  const updated = await db
    .update(queueJobs)
    .set({
      status: "running",
      leaseOwner: workerName,
      leaseUntil,
      updatedAt: now,
    })
    .where(
      and(
        eq(queueJobs.id, candidate[0].id),
        or(
          eq(queueJobs.status, "queued"),
          and(eq(queueJobs.status, "running"), lt(queueJobs.leaseUntil, now))
        )
      )
    );
  if (!updated[0].affectedRows) return undefined;
  const claimed = await db
    .select()
    .from(queueJobs)
    .where(eq(queueJobs.id, candidate[0].id))
    .limit(1);
  return claimed[0];
}

export async function completeQueueJob(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(queueJobs)
    .set({
      status: "succeeded",
      leaseOwner: null,
      leaseUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(queueJobs.id, jobId));
}

export async function failQueueJob(jobId: number, error: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db
    .select()
    .from(queueJobs)
    .where(eq(queueJobs.id, jobId))
    .limit(1);
  if (!current[0]) return;
  const attempts = current[0].attempts + 1;
  const dead = attempts >= current[0].maxAttempts;
  const delay = Math.min(15 * 60_000, 10_000 * 2 ** Math.max(0, attempts - 1));
  await db
    .update(queueJobs)
    .set({
      status: dead ? "dead" : "queued",
      attempts,
      runAfter: new Date(Date.now() + delay),
      leaseOwner: null,
      leaseUntil: null,
      lastError:
        error instanceof Error
          ? error.message.slice(0, 2000)
          : String(error).slice(0, 2000),
      updatedAt: new Date(),
    })
    .where(eq(queueJobs.id, jobId));
}

export async function getPublicationForWorker(publicationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const publication = await db
    .select()
    .from(publications)
    .where(eq(publications.id, publicationId))
    .limit(1);
  if (!publication[0]) return undefined;
  const content = await db
    .select()
    .from(contentItems)
    .where(
      and(
        eq(contentItems.id, publication[0].contentId),
        eq(contentItems.ownerId, publication[0].ownerId)
      )
    )
    .limit(1);
  if (!content[0]) throw new Error("Publication content not found");
  return { publication: publication[0], content: content[0] };
}

export async function updatePublicationFromWorker(
  publicationId: number,
  result: {
    status: "privado" | "pendiente de auditoría" | "publicado";
    externalId?: string | null;
    publishedUrl?: string | null;
    errorMessage?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  await db
    .update(publications)
    .set({
      status: result.status,
      externalId: result.externalId ?? null,
      publishedUrl: result.publishedUrl ?? null,
      errorMessage: result.errorMessage ?? null,
      attemptedAt: now,
      publishedAt:
        result.errorMessage || result.status !== "publicado" ? null : now,
      updatedAt: now,
    })
    .where(eq(publications.id, publicationId));
}

export async function getQueueStatsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return { queued: 0, running: 0, failed: 0, dead: 0 };
  const rows = await db
    .select({ status: queueJobs.status, count: sql<number>`count(*)` })
    .from(queueJobs)
    .where(eq(queueJobs.ownerId, ownerId))
    .groupBy(queueJobs.status);
  const stats = { queued: 0, running: 0, failed: 0, dead: 0 };
  for (const row of rows) {
    if (row.status in stats)
      stats[row.status as keyof typeof stats] = Number(row.count);
  }
  return stats;
}

export async function getWorkerHeartbeats() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(workerHeartbeats)
    .orderBy(desc(workerHeartbeats.lastSeenAt));
}

export async function getWorkerHeartbeat(workerName: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(workerHeartbeats)
    .where(eq(workerHeartbeats.workerName, workerName))
    .limit(1);
  return rows[0];
}

export async function getWorkerHeartbeatByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(workerHeartbeats)
    .where(eq(workerHeartbeats.scheduleCronTaskUid, taskUid))
    .limit(1);
  return rows[0];
}

export async function setWorkerScheduleTaskUid(
  workerName: string,
  taskUid: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(workerHeartbeats)
    .values({
      workerName,
      status: "idle",
      scheduleCronTaskUid: taskUid,
    })
    .onDuplicateKeyUpdate({
      set: { scheduleCronTaskUid: taskUid, updatedAt: new Date() },
    });
}

export async function touchWorkerHeartbeat(
  workerName: string,
  input: {
    status: "idle" | "running" | "degraded";
    lastJobId?: number | null;
    lastError?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(workerHeartbeats)
    .values({
      workerName,
      status: input.status,
      lastJobId: input.lastJobId ?? null,
      lastError: input.lastError ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        status: input.status,
        lastJobId: input.lastJobId ?? null,
        lastError: input.lastError ?? null,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });
}
