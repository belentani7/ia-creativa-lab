import type {
  PublishInput,
  PublishResult,
  PublishingPlatform,
} from "./adapters";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

async function retryNetwork<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise(resolve => setTimeout(resolve, 250 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Error de red");
}

async function postForm(url: string, body: URLSearchParams, token?: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      `API ${response.status}: ${JSON.stringify(data).slice(0, 500)}`
    );
  return data as Record<string, unknown>;
}

export async function publishMeta(
  input: PublishInput,
  platform: "instagram" | "facebook"
): Promise<PublishResult> {
  const token = required("META_ACCESS_TOKEN");
  const version = process.env.META_GRAPH_API_VERSION ?? "v23.0";
  if (platform === "instagram") {
    const account = required("INSTAGRAM_BUSINESS_ACCOUNT_ID");
    const base = `https://graph.facebook.com/${version}`;
    const media = new URLSearchParams({
      media_type: input.content.mediaType === "video" ? "REELS" : "IMAGE",
      caption: input.caption ?? input.content.title,
      ...(input.content.mediaType === "video"
        ? { video_url: input.content.mediaUrl }
        : { image_url: input.content.mediaUrl }),
    });
    const container = await postForm(`${base}/${account}/media`, media, token);
    const creationId = String(container.id ?? "");
    if (!creationId) throw new Error("Meta no devolvió creation_id");
    const published = await postForm(
      `${base}/${account}/media_publish`,
      new URLSearchParams({ creation_id: creationId }),
      token
    );
    return {
      platform,
      mode: "production",
      status: "publicado",
      externalId: String(published.id ?? creationId),
      publishedUrl: null,
      message: "Instagram aceptó la publicación mediante Graph API.",
      payloadKind: "meta-container",
      payload: { media_type: media.get("media_type") },
    };
  }
  const page = required("FACEBOOK_PAGE_ID");
  const base = `https://graph.facebook.com/${version}`;
  const endpoint =
    input.content.mediaType === "video"
      ? `${base}/${page}/videos`
      : `${base}/${page}/photos`;
  const body = new URLSearchParams(
    input.content.mediaType === "video"
      ? {
          file_url: input.content.mediaUrl,
          description: input.caption ?? input.content.title,
        }
      : {
          url: input.content.mediaUrl,
          caption: input.caption ?? input.content.title,
        }
  );
  const result = await postForm(endpoint, body, token);
  return {
    platform,
    mode: "production",
    status: "publicado",
    externalId: String(result.id ?? ""),
    publishedUrl: null,
    message: "Facebook aceptó la publicación mediante Graph API.",
    payloadKind: "meta-container",
    payload: { endpoint },
  };
}

export async function publishTelegram(
  input: PublishInput
): Promise<PublishResult> {
  const token = required("TELEGRAM_BOT_TOKEN");
  const chatId = required("TELEGRAM_CHAT_ID");
  const method =
    input.content.mediaType === "video" ? "sendVideo" : "sendPhoto";
  const mediaKey = input.content.mediaType === "video" ? "video" : "photo";
  const result = await postForm(
    `https://api.telegram.org/bot${token}/${method}`,
    new URLSearchParams({
      chat_id: chatId,
      [mediaKey]: input.content.mediaUrl,
      caption: input.caption ?? input.content.title,
    })
  );
  const message = result.result as { message_id?: number } | undefined;
  return {
    platform: "telegram",
    mode: "production",
    status: "publicado",
    externalId: String(message?.message_id ?? ""),
    publishedUrl: null,
    message: "Telegram aceptó el envío mediante Bot API.",
    payloadKind: "telegram-media",
    payload: { method, chatId: "[configured]" },
  };
}

export async function publishTikTok(
  input: PublishInput
): Promise<PublishResult> {
  const token = required("TIKTOK_ACCESS_TOKEN");
  const response = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: input.caption ?? input.content.title,
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: input.content.mediaUrl,
        },
      }),
    }
  );
  const data = (await response.json().catch(() => ({}))) as {
    data?: { publish_id?: string };
    error?: { message?: string };
  };
  if (!response.ok || !data.data?.publish_id)
    throw new Error(data.error?.message ?? `TikTok API ${response.status}`);
  return {
    platform: "tiktok",
    mode: "production",
    status: "pendiente de auditoría",
    externalId: data.data.publish_id,
    publishedUrl: null,
    message:
      "TikTok aceptó la inicialización; requiere auditoría/estado posterior.",
    payloadKind: "tiktok-direct-post",
    payload: { privacy_level: "SELF_ONLY" },
  };
}

export async function publishYouTube(
  input: PublishInput
): Promise<PublishResult> {
  const token = required("YOUTUBE_ACCESS_TOKEN");
  if (input.content.mediaType !== "video")
    throw new Error("YouTube videos.insert requiere una pieza de vídeo");
  const source = await retryNetwork(() => fetch(input.content.mediaUrl));
  if (!source.ok)
    throw new Error(`No se pudo leer el vídeo origen: ${source.status}`);
  const bytes = Buffer.from(await source.arrayBuffer());
  if (!bytes.length) throw new Error("El vídeo origen está vacío");
  const contentType = source.headers.get("content-type") ?? "video/mp4";
  const metadata = {
    snippet: { title: input.content.title, description: input.caption ?? "" },
    status: { privacyStatus: "private", selfDeclaredMadeForKids: false },
  };
  const session = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": String(bytes.byteLength),
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!session.ok)
    throw new Error(`YouTube API ${session.status}: ${await session.text()}`);
  const uploadUrl = session.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube no devolvió URL resumable");
  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
    },
    body: bytes,
  });
  const uploadedData = (await uploaded.json().catch(() => ({}))) as {
    id?: string;
    status?: { privacyStatus?: string };
  };
  if (!uploaded.ok || !uploadedData.id)
    throw new Error(`YouTube carga resumable ${uploaded.status}`);
  return {
    platform: "youtube",
    mode: "production",
    status: "privado",
    externalId: uploadedData.id,
    publishedUrl: `https://www.youtube.com/watch?v=${uploadedData.id}`,
    message:
      "YouTube recibió el vídeo en privado; requiere revisión/auditoría antes de hacerlo público.",
    payloadKind: "youtube-video-insert",
    payload: {
      privacyStatus: "private",
      resumable: true,
      bytes: bytes.byteLength,
    },
  };
}

export async function publishProduction(
  input: PublishInput,
  platform: PublishingPlatform
): Promise<PublishResult> {
  if (platform === "instagram" || platform === "facebook")
    return publishMeta(input, platform);
  if (platform === "telegram") return publishTelegram(input);
  if (platform === "tiktok") return publishTikTok(input);
  return publishYouTube(input);
}
