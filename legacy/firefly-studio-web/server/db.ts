import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  audioTranscriptions,
  InsertAudioTranscription,
  imageGenerations,
  InsertImageGeneration,
  InsertUser,
  InsertUserPreferences,
  userPreferences,
  users,
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
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createImageGeneration(input: InsertImageGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(imageGenerations).values(input);
  return result[0].insertId;
}

export async function listImageGenerations(userId: number, limit = 40) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(imageGenerations)
    .where(eq(imageGenerations.userId, userId))
    .orderBy(desc(imageGenerations.createdAt))
    .limit(limit);
}

export async function getImageGenerationById(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(imageGenerations)
    .where(and(eq(imageGenerations.userId, userId), eq(imageGenerations.id, id)))
    .limit(1);
  return result[0];
}

export async function deleteImageGeneration(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getImageGenerationById(userId, id);
  if (!existing) return false;
  await db.delete(imageGenerations).where(eq(imageGenerations.id, id));
  return true;
}

export async function createAudioTranscription(input: InsertAudioTranscription) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(audioTranscriptions).values(input);
  return result[0].insertId;
}

export async function listAudioTranscriptions(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(audioTranscriptions)
    .where(eq(audioTranscriptions.userId, userId))
    .orderBy(desc(audioTranscriptions.createdAt))
    .limit(limit);
}

export async function deleteAudioTranscription(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db
    .select({ id: audioTranscriptions.id })
    .from(audioTranscriptions)
    .where(and(eq(audioTranscriptions.userId, userId), eq(audioTranscriptions.id, id)))
    .limit(1);
  if (!existing[0]) return false;
  await db.delete(audioTranscriptions).where(eq(audioTranscriptions.id, id));
  return true;
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertUserPreferences(input: InsertUserPreferences) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(userPreferences).values(input).onDuplicateKeyUpdate({
    set: {
      defaultMode: input.defaultMode,
      defaultAspectRatio: input.defaultAspectRatio,
      defaultSteps: input.defaultSteps,
      updatedAt: new Date(),
    },
  });
  return getUserPreferences(input.userId);
}
