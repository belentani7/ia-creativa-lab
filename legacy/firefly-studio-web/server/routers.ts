import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { listImageModels } from "./_core/imageGeneration";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAudioTranscription,
  deleteAudioTranscription,
  createImageGeneration,
  deleteImageGeneration,
  getUserPreferences,
  listAudioTranscriptions,
  listImageGenerations,
  upsertUserPreferences,
} from "./db";
import { processAudioTranscription } from "./audioService";
import { generateStudioImage } from "./imageService";

const modeSchema = z.enum([
  "text-to-image",
  "generative-fill",
  "style-reference",
  "parametric-adjust",
]);

const aspectRatioSchema = z.enum(["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"]);
const imagePayload = z.string().min(32).max(16_000_000).refine(val => val.startsWith("data:image/") || val.length > 50, {
  message: "Debe ser una imagen válida codificada en base64 o URL de datos",
});

const generationInput = z.object({
  mode: modeSchema,
  prompt: z.string().trim().min(2).max(4000),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  aspectRatio: aspectRatioSchema.default("1:1"),
  steps: z.number().int().min(4).max(50).default(4),
  styleStrength: z.number().min(0).max(1).default(0.8),
  imageBase64: imagePayload.optional(),
  styleImageBase64: imagePayload.optional(),
  maskBase64: imagePayload.optional(),
});

const audioMimeTypeSchema = z.enum([
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/m4a",
  "audio/mp4",
]);

const audioInput = z.object({
  audioDataUrl: z.string().min(32).max(23_000_000).regex(/^data:audio\/[a-z0-9.+-]+;base64,/i, "Debe ser un audio Base64 válido"),
  fileName: z.string().trim().min(1).max(255),
  mimeType: audioMimeTypeSchema,
  language: z.string().regex(/^[a-z]{2}$/i).optional(),
  prompt: z.string().trim().max(400).optional(),
});

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
  studio: router({
    models: publicProcedure.query(async () => {
      try {
        const { models } = await listImageModels();
        return {
          models,
          profiles: [
            { id: "text-to-image", label: "Text-to-Image", engine: "Manus Image Generation" },
            { id: "generative-fill", label: "Generative Fill", engine: "Manus Image Generation" },
            { id: "style-reference", label: "Style Reference", engine: "FLUX.1 Redux" },
            { id: "parametric-adjust", label: "Parametric Adjust", engine: "InstructPix2Pix" },
          ],
        };
      } catch {
        return {
          models: [{ model: "MODEL_GPT_IMAGE_2", id: "gpt-image-2" }],
          profiles: [
            { id: "text-to-image", label: "Text-to-Image", engine: "Manus Image Generation" },
            { id: "generative-fill", label: "Generative Fill", engine: "Manus Image Generation" },
            { id: "style-reference", label: "Style Reference", engine: "FLUX.1 Redux" },
            { id: "parametric-adjust", label: "Parametric Adjust", engine: "InstructPix2Pix" },
          ],
        };
      }
    }),
    generate: protectedProcedure.input(generationInput).mutation(async ({ ctx, input }) => {
      const result = await generateStudioImage(input);
      const id = await createImageGeneration({
        userId: ctx.user.id,
        mode: input.mode,
        prompt: result.optimizedPrompt,
        originalPrompt: result.originalPrompt,
        optimizedPrompt: result.optimizedPrompt,
        optimizationIterations: result.optimizationIterations,
        optimizationQualityScore: result.optimizationQualityScore,
        engine: result.engine,
        providerModel: result.providerModel,
        imageKey: result.imageKey,
        imageUrl: result.imageUrl,
        width: input.width,
        height: input.height,
        aspectRatio: input.aspectRatio,
        steps: input.steps,
      });
      return { id, ...result };
    }),
    history: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(80).default(40) }).optional())
      .query(({ ctx, input }) => listImageGenerations(ctx.user.id, input?.limit ?? 40)),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteImageGeneration(ctx.user.id, input.id)),
    preferences: protectedProcedure.query(({ ctx }) => getUserPreferences(ctx.user.id)),
    savePreferences: protectedProcedure
      .input(
        z.object({
          defaultMode: modeSchema.default("text-to-image"),
          defaultAspectRatio: aspectRatioSchema.default("1:1"),
          defaultSteps: z.number().int().min(4).max(50).default(4),
        }),
      )
      .mutation(({ ctx, input }) => upsertUserPreferences({ userId: ctx.user.id, ...input })),
  }),
  audio: router({
    transcribe: protectedProcedure.input(audioInput).mutation(async ({ ctx, input }) => {
      const processed = await processAudioTranscription({ userId: ctx.user.id, ...input });
      const id = await createAudioTranscription({
        userId: ctx.user.id,
        audioKey: processed.key,
        audioUrl: processed.url,
        fileName: processed.fileName,
        mimeType: processed.mimeType,
        transcript: processed.transcript,
        language: processed.language,
        durationSeconds: processed.durationSeconds,
      });
      return { id, ...processed };
    }),
    history: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(40).default(20) }).optional())
      .query(({ ctx, input }) => listAudioTranscriptions(ctx.user.id, input?.limit ?? 20)),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteAudioTranscription(ctx.user.id, input.id)),
  }),
  hub: router({
    catalog: publicProcedure.query(() => ({
      categories: [
        {
          id: "image",
          label: "Imagen",
          availability: "active" as const,
          description: "Generación, edición guiada, relleno y referencia visual.",
        },
        {
          id: "audio",
          label: "Audio",
          availability: "active" as const,
          description: "Transcribe archivos de audio a texto y guarda el resultado en tu biblioteca.",
        },
        {
          id: "video",
          label: "Vídeo",
          availability: "planned" as const,
          description: "Preparado para un proveedor de vídeo; no genera clips hasta que se conecte uno.",
        },
        {
          id: "discover",
          label: "Explorar",
          availability: "active" as const,
          description: "Acciones rápidas y direcciones creativas para iniciar flujos disponibles.",
        },
        {
          id: "library",
          label: "Biblioteca",
          availability: "active" as const,
          description: "Recupera imágenes, prompts refinados y transcripciones personales.",
        },
      ],
      quickActions: [
        { id: "generate-image", label: "Generar imagen", mode: "text-to-image", availability: "active" as const },
        { id: "edit-image", label: "Editar imagen", mode: "parametric-adjust", availability: "active" as const },
        { id: "generative-fill", label: "Relleno generativo", mode: "generative-fill", availability: "active" as const },
        { id: "expand-image", label: "Ampliar imagen", mode: "generative-fill", availability: "active" as const },
        { id: "remove-object", label: "Quitar objeto", mode: "generative-fill", availability: "active" as const },
        { id: "style-reference", label: "Aplicar estilo", mode: "style-reference", availability: "active" as const },
        { id: "transcribe-audio", label: "Transcribir audio", mode: "audio", availability: "active" as const },
        { id: "generate-video", label: "Generar vídeo", mode: "video", availability: "planned" as const },
        { id: "generate-voice", label: "Generar voz", mode: "voice", availability: "planned" as const },
        { id: "generate-music", label: "Generar música", mode: "music", availability: "planned" as const },
      ],
    })),
  }),
});

export type AppRouter = typeof appRouter;
