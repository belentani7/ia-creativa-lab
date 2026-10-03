import { describe, expect, it } from "vitest";
import { categoryForAction, filterQuickActions } from "./hubFilters";

const actions = [
  { id: "generate", mode: "text-to-image", availability: "active" as const },
  { id: "transcribe", mode: "audio", availability: "active" as const },
  { id: "voice", mode: "voice", availability: "planned" as const },
  { id: "video", mode: "video", availability: "planned" as const },
];

describe("hubFilters", () => {
  it("clasifica voz y música dentro de la categoría de audio", () => {
    expect(categoryForAction("voice")).toBe("audio");
    expect(categoryForAction("music")).toBe("audio");
    expect(categoryForAction("generative-fill")).toBe("image");
  });

  it("filtra las acciones por estado y categoría sin alterar la fuente", () => {
    expect(filterQuickActions(actions, "active").map(item => item.id)).toEqual(["generate", "transcribe"]);
    expect(filterQuickActions(actions, "audio").map(item => item.id)).toEqual(["transcribe", "voice"]);
    expect(filterQuickActions(actions, "video").map(item => item.id)).toEqual(["video"]);
    expect(filterQuickActions(actions, "planned").map(item => item.id)).toEqual(["voice", "video"]);
    expect(actions).toHaveLength(4);
  });
});
