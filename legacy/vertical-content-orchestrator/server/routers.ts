import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { isVerticalNineSixteen } from "../shared/contentPolicy";
import { assertVerifiedVerticalImage } from "./mediaValidation";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import {
  createActivity,
  createContent,
  createPublication,
  createSchedule,
  enqueueQueueJob,
  getActivityForOwner,
  getContentForOwner,
  getDashboardStats,
  getPublicationsForOwner,
  getQueueStatsForOwner,
  getWorkerHeartbeat,
  setWorkerScheduleTaskUid,
  getReviewQueue,
  getSchedulesForOwner,
  updateContentMetadata,
  updateReviewStatus,
} from "./db";
import {
  getPlatformLimits,
  getPublishingMode,
  publishingAdapters,
} from "./publishing/adapters";

const categorySchema = z.enum(["personal", "gatos/humor", "personaje virtual"]);
const platformSchema = z.enum([
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
]);
const dayKey = (date: Date, timezone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: protectedProcedure.query(({ ctx }) =>
    getDashboardStats(ctx.user.id)
  ),
  content: router({
    list: protectedProcedure.query(({ ctx }) =>
      getContentForOwner(ctx.user.id)
    ),
    reviewQueue: protectedProcedure.query(({ ctx }) =>
      getReviewQueue(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(180),
          category: categorySchema,
          mediaType: z.enum(["image", "video"]),
          mediaUrl: z.string().url(),
          storageKey: z.string().max(512).optional(),
          prompt: z.string().max(5000).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
          durationSeconds: z.number().int().positive().optional(),
          source: z.enum(["upload", "generated"]).default("upload"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (
          input.width &&
          input.height &&
          !isVerticalNineSixteen(input.width, input.height)
        )
          throw new Error("El contenido debe tener una relación 9:16");
        const id = await createContent(ctx.user.id, {
          ...input,
          ownerId: ctx.user.id,
        });
        await createActivity(ctx.user.id, {
          type: input.source === "generated" ? "generation" : "upload",
          message: `Contenido añadido: ${input.title}`,
          contentId: id,
        });
        return { id };
      }),
    upload: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(180),
          category: categorySchema,
          mediaType: z.enum(["image", "video"]),
          fileName: z.string().min(1).max(200),
          mimeType: z.string().regex(/^(image|video)\//),
          dataUrl: z.string().min(32).max(24_000_000),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          durationSeconds: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isVerticalNineSixteen(input.width, input.height))
          throw new Error("El archivo debe tener una relación 9:16");
        const match = input.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
        if (!match) throw new Error("Formato de archivo no válido");
        const bytes = Buffer.from(match[1], "base64");
        if (input.mediaType === "image") {
          const verified = assertVerifiedVerticalImage(bytes, input.mimeType);
          if (
            verified.width !== input.width ||
            verified.height !== input.height
          )
            throw new Error(
              "Las dimensiones declaradas no coinciden con el archivo real"
            );
        } else {
          throw new Error(
            "La subida de vídeo requiere un inspector binario server-side; el modo seguro no acepta metadatos no verificados"
          );
        }
        const { key, url } = await storagePut(
          `${ctx.user.id}/content/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
          bytes,
          input.mimeType
        );
        const id = await createContent(ctx.user.id, {
          ownerId: ctx.user.id,
          title: input.title,
          category: input.category,
          mediaType: input.mediaType,
          mediaUrl: url,
          storageKey: key,
          width: input.width,
          height: input.height,
          durationSeconds: input.durationSeconds,
          source: "upload",
          reviewStatus: "pending",
        });
        await createActivity(ctx.user.id, {
          type: "upload",
          message: `Archivo subido y enviado a revisión: ${input.title}`,
          contentId: id,
        });
        return { id, url };
      }),
    generate: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(180),
          category: categorySchema,
          prompt: z.string().min(3).max(5000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const job = await enqueueQueueJob({
          ownerId: ctx.user.id,
          kind: "generate",
          idempotencyKey: `generate:${ctx.user.id}:${input.title}:${input.prompt}`,
          payload: {
            ownerId: ctx.user.id,
            title: input.title,
            category: input.category,
            prompt: input.prompt,
          },
        });
        await createActivity(ctx.user.id, {
          type: "generation",
          message: `Generación encolada para el worker: ${job.id}`,
        });
        return { queueJobId: job.id, status: "queued" as const };
      }),
    updateMetadata: protectedProcedure
      .input(
        z.object({
          contentId: z.number().int().positive(),
          title: z.string().min(1).max(180),
          category: categorySchema,
          prompt: z.string().max(5000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateContentMetadata(ctx.user.id, input.contentId, {
          title: input.title,
          category: input.category,
          prompt: input.prompt ?? null,
        });
        await createActivity(ctx.user.id, {
          type: "review",
          message: `Metadatos corregidos antes de revisión: ${input.title}`,
          contentId: input.contentId,
        });
        return { success: true } as const;
      }),
    review: protectedProcedure
      .input(
        z.object({
          contentId: z.number().int().positive(),
          status: z.enum(["approved", "rejected"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateReviewStatus(ctx.user.id, input.contentId, input.status);
        await createActivity(ctx.user.id, {
          type: "review",
          message:
            input.status === "approved"
              ? "Contenido aprobado para programación"
              : "Contenido rechazado durante la revisión",
          contentId: input.contentId,
        });
        return { success: true } as const;
      }),
  }),
  schedules: router({
    list: protectedProcedure.query(({ ctx }) =>
      getSchedulesForOwner(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          contentId: z.number().int().positive(),
          platform: platformSchema,
          scheduledAt: z.coerce.date(),
          timezone: z.string().min(1).max(64).default("UTC"),
          caption: z.string().max(5000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getSchedulesForOwner(ctx.user.id);
        const limit = getPlatformLimits()[input.platform];
        const samePlatform = existing.filter(
          item => item.platform === input.platform && item.enabled
        );
        const nearest = samePlatform.some(
          item =>
            Math.abs(
              new Date(item.scheduledAt).getTime() - input.scheduledAt.getTime()
            ) <
            limit.minimumIntervalMinutes * 60_000
        );
        const sameDay = samePlatform.filter(
          item =>
            dayKey(new Date(item.scheduledAt), input.timezone) ===
            dayKey(input.scheduledAt, input.timezone)
        ).length;
        if (nearest)
          throw new Error(
            `Respeta un intervalo mínimo de ${limit.minimumIntervalMinutes} minutos para ${input.platform}`
          );
        if (sameDay >= limit.dailyCap)
          throw new Error(
            `Se alcanzó el límite diario configurado para ${input.platform}`
          );
        const id = await createSchedule(ctx.user.id, {
          ...input,
          ownerId: ctx.user.id,
        });
        await createActivity(ctx.user.id, {
          type: "schedule",
          platform: input.platform,
          contentId: input.contentId,
          message: `Publicación programada en ${input.platform}`,
        });
        return { id };
      }),
  }),
  publications: router({
    list: protectedProcedure.query(({ ctx }) =>
      getPublicationsForOwner(ctx.user.id)
    ),
    publishDryRun: protectedProcedure
      .input(
        z.object({
          contentId: z.number().int().positive(),
          platform: platformSchema,
          caption: z.string().max(5000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const items = await getContentForOwner(ctx.user.id);
        const content = items.find(item => item.id === input.contentId);
        if (!content) throw new Error("Contenido no encontrado");
        if (content.reviewStatus !== "approved")
          throw new Error("Solo se puede publicar contenido aprobado");
        try {
          const result = await publishingAdapters[input.platform].publish(
            { ownerId: ctx.user.id, content, caption: input.caption },
            "dry-run"
          );
          const publicationId = await createPublication(ctx.user.id, {
            contentId: content.id,
            platform: input.platform,
            status: result.status,
            externalId: result.externalId,
            publishedUrl: result.publishedUrl,
            errorMessage: null,
            attemptedAt: new Date(),
          });
          await createActivity(ctx.user.id, {
            type: "publish",
            platform: input.platform,
            contentId: content.id,
            publicationId,
            message: result.message,
          });
          return {
            ...result,
            publicationId,
            configuredMode: getPublishingMode(),
          };
        } catch (error) {
          await createActivity(ctx.user.id, {
            type: "error",
            platform: input.platform,
            contentId: content.id,
            message: `Error de publicación en ${input.platform}: ${error instanceof Error ? error.message : "error desconocido"}`,
          });
          throw error;
        }
      }),
    publish: protectedProcedure
      .input(
        z.object({
          contentId: z.number().int().positive(),
          platform: platformSchema,
          caption: z.string().max(5000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const items = await getContentForOwner(ctx.user.id);
        const content = items.find(item => item.id === input.contentId);
        if (!content) throw new Error("Contenido no encontrado");
        if (content.reviewStatus !== "approved")
          throw new Error("Solo se puede publicar contenido aprobado");
        const existing = (await getPublicationsForOwner(ctx.user.id)).find(
          item =>
            item.contentId === content.id &&
            item.platform === input.platform &&
            !item.errorMessage
        );
        if (existing)
          return {
            publicationId: existing.id,
            platform: existing.platform,
            status: existing.status,
            externalId: existing.externalId ?? "",
            publishedUrl: existing.publishedUrl,
            message: "Entrega ya registrada; se evita duplicar la publicación.",
            mode: getPublishingMode(),
            payloadKind: "meta-container" as const,
            payload: {},
          };
        const mode = getPublishingMode();
        if (mode !== "production")
          throw new Error(
            "La publicación real requiere PUBLISHING_MODE=production y confirmación explícita"
          );
        const publicationId = await createPublication(ctx.user.id, {
          contentId: content.id,
          platform: input.platform,
          status: "privado",
          externalId: null,
          publishedUrl: null,
          errorMessage: null,
          attemptedAt: null,
        });
        const job = await enqueueQueueJob({
          ownerId: ctx.user.id,
          kind: "publish",
          idempotencyKey: `publish:${ctx.user.id}:${publicationId}`,
          payload: { publicationId, caption: input.caption ?? null },
        });
        await createActivity(ctx.user.id, {
          type: "publish",
          platform: input.platform,
          contentId: content.id,
          publicationId,
          message: `Entrega encolada para el worker: ${job.id}`,
        });
        return {
          publicationId,
          queueJobId: job.id,
          platform: input.platform,
          status: "privado" as const,
          externalId: "",
          publishedUrl: null,
          message:
            "Entrega persistida en la cola; el worker la procesará según el scheduler.",
          mode,
          configuredMode: mode,
          payloadKind: "meta-container" as const,
          payload: { queued: true },
        };
      }),
  }),
  worker: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const workerName = `vertical-os-worker-${ctx.user.id}`;
      const [queue, heartbeat] = await Promise.all([
        getQueueStatsForOwner(ctx.user.id),
        getWorkerHeartbeat(workerName),
      ]);
      return {
        queue,
        heartbeats: heartbeat ? [heartbeat] : [],
        mode: getPublishingMode(),
      };
    }),
    schedule: protectedProcedure
      .input(z.object({ cron: z.string().regex(/^\d+ \d+ \d+ \* \* \*$/) }))
      .mutation(async ({ ctx, input }) => {
        const workerName = `vertical-os-worker-${ctx.user.id}`;
        const current = await getWorkerHeartbeat(workerName);
        if (current?.scheduleCronTaskUid)
          return { taskUid: current.scheduleCronTaskUid, reused: true };
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[
          COOKIE_NAME
        ];
        if (!sessionToken)
          throw new Error("Session token required to schedule worker");
        const job = await createHeartbeatJob(
          {
            name: workerName,
            cron: input.cron,
            path: "/api/scheduled/processQueue",
            payload: {},
            description: "Vertical OS persistent queue worker",
          },
          sessionToken
        );
        await setWorkerScheduleTaskUid(workerName, job.taskUid);
        return {
          taskUid: job.taskUid,
          nextExecutionAt: job.nextExecutionAt ?? null,
          reused: false,
        };
      }),
    setEnabled: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const workerName = `vertical-os-worker-${ctx.user.id}`;
        const current = await getWorkerHeartbeat(workerName);
        if (!current?.scheduleCronTaskUid)
          throw new Error("Worker scheduler is not configured");
        const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[
          COOKIE_NAME
        ];
        if (!sessionToken)
          throw new Error("Session token required to update worker");
        const result = await updateHeartbeatJob(
          current.scheduleCronTaskUid,
          { enable: input.enabled },
          sessionToken
        );
        return {
          enabled: input.enabled,
          nextExecutionAt: result.nextExecutionAt ?? null,
        };
      }),
  }),
  activity: protectedProcedure.query(({ ctx }) =>
    getActivityForOwner(ctx.user.id)
  ),
  integrations: protectedProcedure.query(() => ({
    instagram: {
      configured: Boolean(
        process.env.META_ACCESS_TOKEN &&
          process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
      ),
      mode: "Meta Graph API",
    },
    facebook: {
      configured: Boolean(
        process.env.META_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID
      ),
      mode: "Meta Graph API",
    },
    youtube: {
      configured: Boolean(
        process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET
      ),
      mode: "YouTube Data API",
    },
    tiktok: {
      configured: Boolean(
        process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET
      ),
      mode: "Content Posting API",
    },
    telegram: {
      configured: Boolean(
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
      ),
      mode: "Telegram Bot API",
    },
  })),
});

export type AppRouter = typeof appRouter;
