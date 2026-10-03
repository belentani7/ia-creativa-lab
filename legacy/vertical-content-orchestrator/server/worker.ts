import {
  claimNextQueueJob,
  completeQueueJob,
  failQueueJob,
  createActivity,
  createContent,
  getPublicationForWorker,
  touchWorkerHeartbeat,
  updatePublicationFromWorker,
} from "./db";
import { publishProduction } from "./publishing/productionAdapters";
import { generateImage } from "./_core/imageGeneration";
import type { PublishInput } from "./publishing/adapters";

const DEFAULT_BATCH = 5;

export function parseQueuePayload(payload: string): Record<string, unknown> {
  const parsed = JSON.parse(payload) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Invalid queue payload");
  return parsed as Record<string, unknown>;
}

async function executePublishJob(payload: Record<string, unknown>) {
  const publicationId = Number(payload.publicationId);
  if (!Number.isInteger(publicationId) || publicationId <= 0)
    throw new Error("Queue publish job requires publicationId");
  const record = await getPublicationForWorker(publicationId);
  if (!record) throw new Error("Publication not found");
  if (record.content.reviewStatus !== "approved")
    throw new Error("Publication content is not approved");
  if (record.publication.externalId || record.publication.publishedUrl) return;

  const input: PublishInput = {
    ownerId: record.publication.ownerId,
    content: record.content,
    caption: typeof payload.caption === "string" ? payload.caption : undefined,
  };
  try {
    const result = await publishProduction(input, record.publication.platform);
    await updatePublicationFromWorker(publicationId, {
      status: result.status,
      externalId: result.externalId,
      publishedUrl: result.publishedUrl,
    });
  } catch (error) {
    await updatePublicationFromWorker(publicationId, {
      status: record.publication.status,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function executeGenerateJob(payload: Record<string, unknown>) {
  const ownerId = Number(payload.ownerId);
  const title = typeof payload.title === "string" ? payload.title : "";
  const category = typeof payload.category === "string" ? payload.category : "";
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
  if (!Number.isInteger(ownerId) || ownerId <= 0 || !title || !prompt)
    throw new Error("Queue generate job requires ownerId, title and prompt");
  if (!["personal", "gatos/humor", "personaje virtual"].includes(category))
    throw new Error("Queue generate job requires a valid category");
  const result = await generateImage({
    prompt: `${prompt}. Composición vertical 9:16, contenido original, sin marcas ni personas reales identificables.`,
  });
  if (!result.url)
    throw new Error("El proveedor no devolvió una URL de imagen");
  const contentId = await createContent(ownerId, {
    ownerId,
    title,
    category: category as "personal" | "gatos/humor" | "personaje virtual",
    mediaType: "image",
    mediaUrl: result.url,
    source: "generated",
    prompt,
    reviewStatus: "pending",
  });
  await createActivity(ownerId, {
    type: "generation",
    message: `Imagen generada y enviada a revisión: ${title}`,
    contentId,
  });
}

async function executeJob(kind: string, payload: Record<string, unknown>) {
  if (kind === "publish") return executePublishJob(payload);
  if (kind === "generate") return executeGenerateJob(payload);
  throw new Error(`Unsupported queue job kind: ${kind}`);
}

export async function processQueueOnce(
  workerName = "heartbeat-worker",
  batchSize = DEFAULT_BATCH
) {
  let processed = 0;
  await touchWorkerHeartbeat(workerName, { status: "running" });
  for (let index = 0; index < batchSize; index += 1) {
    const job = await claimNextQueueJob(workerName);
    if (!job) break;
    try {
      await executeJob(job.kind, parseQueuePayload(job.payload));
      await completeQueueJob(job.id);
      await touchWorkerHeartbeat(workerName, {
        status: "running",
        lastJobId: job.id,
      });
      processed += 1;
    } catch (error) {
      await failQueueJob(job.id, error);
      await touchWorkerHeartbeat(workerName, {
        status: "degraded",
        lastJobId: job.id,
        lastError: error instanceof Error ? error.message : String(error),
      });
    }
  }
  await touchWorkerHeartbeat(workerName, { status: "idle" });
  return { processed };
}
