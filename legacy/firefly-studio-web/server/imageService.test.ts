import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateImageMock, listImageModelsMock, optimizePromptMock } = vi.hoisted(() => ({
  generateImageMock: vi.fn(),
  listImageModelsMock: vi.fn(),
  optimizePromptMock: vi.fn(),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: generateImageMock,
  listImageModels: listImageModelsMock,
}));

vi.mock("./promptOptimizer", () => ({
  optimizePrompt: optimizePromptMock,
}));

import { generateStudioImage } from "./imageService";

describe("generateStudioImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listImageModelsMock.mockResolvedValue({
      models: [{ model: "MODEL_FLUX_1_REDUX", id: "flux-1-redux" }],
    });
    generateImageMock.mockResolvedValue({
      url: "/manus-storage/generated/test-result.png",
    });
    optimizePromptMock.mockResolvedValue({
      originalPrompt: "Original prompt",
      optimizedPrompt: "Refined prompt with controlled light and composition.",
      iterations: 2,
      qualityScore: 96,
      saturated: true,
    });
  });

  it("selects the dedicated FLUX.1 Redux provider model for style reference", async () => {
    const result = await generateStudioImage({
      mode: "style-reference",
      prompt: "Translate the visual rhythm into a cinematic editorial finish.",
      imageBase64: "data:image/png;base64,base-image",
      styleImageBase64: "data:image/png;base64,style-image",
      styleStrength: 0.82,
      aspectRatio: "1:1",
    });

    expect(result.engine).toBe("FLUX.1 Redux");
    expect(result.providerModel).toBe("MODEL_FLUX_1_REDUX");
    expect(result.resolvedFallback).toBe(false);
    expect(result.optimizedPrompt).toContain("Refined prompt");
    expect(result.optimizationIterations).toBe(2);
    expect(generateImageMock).toHaveBeenCalledWith(expect.objectContaining({
      model: "MODEL_FLUX_1_REDUX",
      prompt: expect.stringContaining("Refined prompt"),
      originalImages: [
        { b64Json: "base-image", mimeType: "image/png" },
        { b64Json: "style-image", mimeType: "image/png" },
      ],
    }));
  });

  it("rejects generative fill without both a base image and a mask", async () => {
    await expect(generateStudioImage({
      mode: "generative-fill",
      prompt: "Extend the surface with matching texture.",
      imageBase64: "data:image/png;base64,base-image",
    })).rejects.toThrow("requires a base image and a mask");

    expect(generateImageMock).not.toHaveBeenCalled();
  });
});
