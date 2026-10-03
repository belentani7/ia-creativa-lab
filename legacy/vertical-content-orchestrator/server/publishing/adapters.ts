import type { ContentItem } from "../../drizzle/schema";
import { publishProduction } from "./productionAdapters";
import type { PUBLICATION_STATUSES } from "../../drizzle/schema";

type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export type PublishingPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "telegram";
export type PublishMode = "safe" | "dry-run" | "production";
export type SimulationStatus = PublicationStatus | "error";

export const PLATFORM_LIMITS = {
  instagram: { minimumIntervalMinutes: 30, dailyCap: 20 },
  facebook: { minimumIntervalMinutes: 30, dailyCap: 20 },
  tiktok: { minimumIntervalMinutes: 60, dailyCap: 10 },
  youtube: { minimumIntervalMinutes: 120, dailyCap: 5 },
  telegram: { minimumIntervalMinutes: 5, dailyCap: 100 },
} as const;

export type PlatformLimits = typeof PLATFORM_LIMITS;
export function getPlatformLimits(): PlatformLimits {
  try {
    const parsed = JSON.parse(process.env.PLATFORM_LIMITS_JSON ?? "null");
    if (!parsed || typeof parsed !== "object") return PLATFORM_LIMITS;
    return Object.fromEntries(
      Object.entries(PLATFORM_LIMITS).map(([platform, fallback]) => {
        const override = (parsed as Record<string, unknown>)[platform] as
          | Partial<typeof fallback>
          | undefined;
        return [
          platform,
          {
            minimumIntervalMinutes: Number(
              override?.minimumIntervalMinutes ??
                fallback.minimumIntervalMinutes
            ),
            dailyCap: Number(override?.dailyCap ?? fallback.dailyCap),
          },
        ];
      })
    ) as PlatformLimits;
  } catch {
    return PLATFORM_LIMITS;
  }
}

export type PublishInput = {
  ownerId: number;
  content: Pick<
    ContentItem,
    "id" | "title" | "mediaType" | "mediaUrl" | "width" | "height"
  >;
  caption?: string | null;
};

export type PublishResult = {
  platform: PublishingPlatform;
  mode: PublishMode;
  status: PublicationStatus;
  externalId: string;
  publishedUrl: string | null;
  message: string;
  payloadKind:
    | "meta-container"
    | "youtube-video-insert"
    | "tiktok-direct-post"
    | "telegram-media";
  payload: Record<string, unknown>;
};

export interface PublishingAdapter {
  readonly platform: PublishingPlatform;
  publish(input: PublishInput, mode: PublishMode): Promise<PublishResult>;
}

function dryRunResult(
  platform: PublishingPlatform,
  input: PublishInput,
  mode: "safe" | "dry-run"
): PublishResult {
  const simulated = process.env.PUBLISHING_SIMULATED_STATUS as
    | SimulationStatus
    | undefined;
  if (simulated === "error")
    throw new Error(`Simulación controlada de error en ${platform}`);
  const auditRequired = platform === "tiktok" || platform === "youtube";
  const status: PublicationStatus =
    simulated ?? (auditRequired ? "pendiente de auditoría" : "privado");
  const payloadKind =
    platform === "instagram" || platform === "facebook"
      ? "meta-container"
      : platform === "youtube"
        ? "youtube-video-insert"
        : platform === "tiktok"
          ? "tiktok-direct-post"
          : "telegram-media";
  const payload =
    platform === "instagram" || platform === "facebook"
      ? {
          media_type: input.content.mediaType === "video" ? "REELS" : "IMAGE",
          video_url:
            input.content.mediaType === "video"
              ? input.content.mediaUrl
              : undefined,
          image_url:
            input.content.mediaType === "image"
              ? input.content.mediaUrl
              : undefined,
          caption: input.caption ?? "",
        }
      : platform === "youtube"
        ? {
            snippet: {
              title: input.content.title,
              description: input.caption ?? "",
            },
            status: { privacyStatus: "private" },
            mediaUrl: input.content.mediaUrl,
          }
        : platform === "tiktok"
          ? {
              post_info: {
                title: input.caption ?? input.content.title,
                privacy_level: "SELF_ONLY",
              },
              source_info: {
                source: "PULL_FROM_URL",
                video_url: input.content.mediaUrl,
              },
            }
          : {
              chat_id: process.env.TELEGRAM_CHAT_ID ?? "dry-run",
              media: input.content.mediaUrl,
              caption: input.caption ?? input.content.title,
            };
  return {
    platform,
    mode,
    status,
    externalId: `${mode}-${platform}-${input.content.id}`,
    publishedUrl:
      status === "publicado"
        ? `https://example.invalid/${platform}/${input.content.id}`
        : null,
    message: `Simulación ${platform}: payload ${payloadKind}; estado ${status}.`,
    payloadKind,
    payload,
  };
}

function assertProductionGate(
  input: PublishInput,
  platform: PublishingPlatform
) {
  if (process.env.PRODUCTION_PUBLISH_CONFIRMATION !== "I_UNDERSTAND") {
    throw new Error(
      "Producción bloqueada: falta PRODUCTION_PUBLISH_CONFIRMATION"
    );
  }
  if (!input.ownerId || !input.content.id) {
    throw new Error(
      "Producción bloqueada: faltan ownerId o content.id para idempotencia"
    );
  }
  return `${platform}:${input.ownerId}:${input.content.id}`;
}

function createAdapter(platform: PublishingPlatform): PublishingAdapter {
  return {
    platform,
    async publish(input, mode) {
      if (mode === "safe" || mode === "dry-run")
        return dryRunResult(platform, input, mode);
      assertProductionGate(input, platform);
      return publishProduction(input, platform);
    },
  };
}

export const publishingAdapters: Record<PublishingPlatform, PublishingAdapter> =
  {
    instagram: createAdapter("instagram"),
    facebook: createAdapter("facebook"),
    tiktok: createAdapter("tiktok"),
    youtube: createAdapter("youtube"),
    telegram: createAdapter("telegram"),
  };

export function getPublishingMode(): PublishMode {
  if (
    process.env.PUBLISHING_MODE === "production" &&
    process.env.PRODUCTION_PUBLISH_CONFIRMATION === "I_UNDERSTAND"
  )
    return "production";
  return process.env.PUBLISHING_MODE === "dry-run" ? "dry-run" : "safe";
}
