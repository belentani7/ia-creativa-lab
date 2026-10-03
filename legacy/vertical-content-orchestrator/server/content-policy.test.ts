import { describe, expect, it } from "vitest";
import { CONTENT_CATEGORIES, PLATFORMS, PUBLICATION_STATUSES } from "../drizzle/schema";
import { isVerticalNineSixteen } from "../shared/contentPolicy";

describe("content policy", () => {
  it("exposes exactly the three required content categories", () => {
    expect(CONTENT_CATEGORIES).toEqual(["personal", "gatos/humor", "personaje virtual"]);
  });

  it("exposes exactly the required publication statuses", () => {
    expect(PUBLICATION_STATUSES).toEqual(["privado", "pendiente de auditoría", "publicado"]);
  });

  it("covers every configured destination platform", () => {
    expect(PLATFORMS).toEqual(["instagram", "facebook", "tiktok", "youtube", "telegram"]);
  });

  it("accepts vertical 9:16 media and rejects landscape media", () => {
    expect(isVerticalNineSixteen(1080, 1920)).toBe(true);
    expect(isVerticalNineSixteen(1920, 1080)).toBe(false);
    expect(isVerticalNineSixteen(0, 1920)).toBe(false);
  });
});
