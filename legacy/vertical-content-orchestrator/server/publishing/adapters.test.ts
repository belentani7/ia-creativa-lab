import { afterEach, describe, expect, it } from "vitest";
import {
  getPlatformLimits,
  getPublishingMode,
  publishingAdapters,
} from "./adapters";

const content = {
  id: 7,
  title: "Gato vertical",
  mediaType: "image" as const,
  mediaUrl: "https://example.com/cat.jpg",
  width: 1080,
  height: 1920,
};

afterEach(() => {
  delete process.env.PUBLISHING_MODE;
  delete process.env.PRODUCTION_PUBLISH_CONFIRMATION;
});

describe("publishing adapters", () => {
  it.each(["instagram", "facebook", "tiktok", "youtube", "telegram"] as const)(
    "returns a safe dry-run for %s",
    async platform => {
      const result = await publishingAdapters[platform].publish(
        { ownerId: 1, content },
        "dry-run"
      );
      expect(result.platform).toBe(platform);
      expect(result.mode).toBe("dry-run");
      expect(["privado", "pendiente de auditoría", "publicado"]).toContain(
        result.status
      );
      expect(result.externalId).toContain(`dry-run-${platform}`);
      expect(result.publishedUrl).toBeNull();
    }
  );

  it("uses audit-pending only for TikTok and YouTube by default", async () => {
    const tiktok = await publishingAdapters.tiktok.publish(
      { ownerId: 1, content },
      "safe"
    );
    const youtube = await publishingAdapters.youtube.publish(
      { ownerId: 1, content },
      "safe"
    );
    const instagram = await publishingAdapters.instagram.publish(
      { ownerId: 1, content },
      "safe"
    );
    const telegram = await publishingAdapters.telegram.publish(
      { ownerId: 1, content },
      "safe"
    );
    expect(tiktok.status).toBe("pendiente de auditoría");
    expect(youtube.status).toBe("pendiente de auditoría");
    expect(instagram.status).toBe("privado");
    expect(telegram.status).toBe("privado");
  });

  it.each(["privado", "pendiente de auditoría", "publicado"] as const)(
    "supports controlled simulation status %s",
    async status => {
      process.env.PUBLISHING_SIMULATED_STATUS = status;
      const result = await publishingAdapters.facebook.publish(
        { ownerId: 1, content },
        "safe"
      );
      expect(result.status).toBe(status);
      delete process.env.PUBLISHING_SIMULATED_STATUS;
    }
  );

  it("supports a controlled simulation error", async () => {
    process.env.PUBLISHING_SIMULATED_STATUS = "error";
    await expect(
      publishingAdapters.telegram.publish({ ownerId: 1, content }, "safe")
    ).rejects.toThrow("Simulación controlada");
    delete process.env.PUBLISHING_SIMULATED_STATUS;
  });

  it("loads safe server-side platform limit overrides", () => {
    process.env.PLATFORM_LIMITS_JSON = JSON.stringify({
      tiktok: { minimumIntervalMinutes: 90, dailyCap: 3 },
    });
    expect(getPlatformLimits().tiktok).toEqual({
      minimumIntervalMinutes: 90,
      dailyCap: 3,
    });
    delete process.env.PLATFORM_LIMITS_JSON;
  });

  it("defaults to safe mode without explicit production confirmation", () => {
    process.env.PUBLISHING_MODE = "production";
    expect(getPublishingMode()).toBe("safe");
  });

  it("never pretends production is configured", async () => {
    await expect(
      publishingAdapters.instagram.publish(
        { ownerId: 1, content },
        "production"
      )
    ).rejects.toThrow("Producción bloqueada");
  });
});
