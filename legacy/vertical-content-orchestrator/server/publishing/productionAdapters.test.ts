import { afterEach, describe, expect, it, vi } from "vitest";
import {
  publishMeta,
  publishTelegram,
  publishTikTok,
  publishYouTube,
} from "./productionAdapters";

const content = {
  id: 2,
  title: "Prueba vertical",
  mediaType: "video" as const,
  mediaUrl: "https://cdn.example/video.mp4",
  width: 1080,
  height: 1920,
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of [
    "META_ACCESS_TOKEN",
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "FACEBOOK_PAGE_ID",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "TIKTOK_ACCESS_TOKEN",
    "YOUTUBE_ACCESS_TOKEN",
  ])
    delete process.env[key];
});

describe("official production adapter contracts", () => {
  it("creates and publishes an Instagram container", async () => {
    process.env.META_ACCESS_TOKEN = "test-meta";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "ig-1";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "container-1" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "media-1" }), { status: 200 })
      );
    const result = await publishMeta(
      { ownerId: 1, content, caption: "hola" },
      "instagram"
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("publicado");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/ig-1/media");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("media_publish");
  });

  it("uses the Telegram media method for video", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test-telegram";
    process.env.TELEGRAM_CHAT_ID = "chat-1";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 9 } }), {
        status: 200,
      })
    );
    const result = await publishTelegram({ ownerId: 1, content });
    expect(result.externalId).toBe("9");
    expect(result.payloadKind).toBe("telegram-media");
  });

  it("keeps TikTok in audit-pending state", async () => {
    process.env.TIKTOK_ACCESS_TOKEN = "test-tiktok";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { publish_id: "tt-1" } }), {
        status: 200,
      })
    );
    const result = await publishTikTok({ ownerId: 1, content });
    expect(result.status).toBe("pendiente de auditoría");
    expect(result.externalId).toBe("tt-1");
  });

  it("does not retry a failed Telegram publish POST", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test-telegram";
    process.env.TELEGRAM_CHAT_ID = "chat-1";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network"));
    await expect(publishTelegram({ ownerId: 1, content })).rejects.toThrow(
      "network"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed YouTube session POST", async () => {
    process.env.YOUTUBE_ACCESS_TOKEN = "test-youtube";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response("video-bytes", { status: 200 }))
      .mockRejectedValueOnce(new Error("session network"));
    await expect(publishYouTube({ ownerId: 1, content })).rejects.toThrow(
      "session network"
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uploads the binary to a private YouTube resumable session", async () => {
    process.env.YOUTUBE_ACCESS_TOKEN = "test-youtube";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(
        new Response("video-bytes", {
          status: 200,
          headers: { "content-type": "video/mp4" },
        })
      )
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: { location: "https://upload.example/session" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: "yt-1", status: { privacyStatus: "private" } }),
          { status: 200 }
        )
      );
    const result = await publishYouTube({ ownerId: 1, content });
    expect(result.status).toBe("privado");
    expect(result.externalId).toBe("yt-1");
    expect(result.payload).toMatchObject({
      privacyStatus: "private",
      resumable: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
