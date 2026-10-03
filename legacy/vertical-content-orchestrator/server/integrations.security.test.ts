import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("integrations security", () => {
  it("rejects non-9:16 uploads through the protected mutation", async () => {
    const ctx = {
      user: { id: 1, openId: "owner", role: "admin" },
    } as TrpcContext;
    await expect(
      appRouter.createCaller(ctx).content.upload({
        title: "landscape",
        category: "personal",
        mediaType: "image",
        fileName: "landscape.jpg",
        mimeType: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,aGVsbG8gaGVsbG8gaGVsbG8gaGVsbG8=",
        width: 1920,
        height: 1080,
      })
    ).rejects.toThrow("9:16");
  });

  it("blocks uninspected video uploads in safe mode", async () => {
    const ctx = {
      user: { id: 1, openId: "owner", role: "admin" },
    } as TrpcContext;
    const dataUrl = "data:video/mp4;base64,aGVsbG8gaGVsbG8gaGVsbG8gaGVsbG8=";
    await expect(
      appRouter.createCaller(ctx).content.upload({
        title: "video",
        category: "gatos/humor",
        mediaType: "video",
        fileName: "video.mp4",
        mimeType: "video/mp4",
        dataUrl,
        width: 1080,
        height: 1920,
      })
    ).rejects.toThrow("inspector binario server-side");
  });

  it("returns only public status metadata and never credential values", async () => {
    process.env.META_ACCESS_TOKEN = "secret-meta-token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "sensitive-account-id";
    const ctx = {
      user: { id: 1, openId: "owner", role: "admin" },
    } as TrpcContext;
    const result = await appRouter.createCaller(ctx).integrations();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("secret-meta-token");
    expect(serialized).not.toContain("sensitive-account-id");
    expect(result.instagram).toEqual({
      configured: true,
      mode: "Meta Graph API",
    });
    expect(Object.keys(result.instagram).sort()).toEqual([
      "configured",
      "mode",
    ]);
  });
});
