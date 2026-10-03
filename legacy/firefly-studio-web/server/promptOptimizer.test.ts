import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLMMock, listLLMModelsMock } = vi.hoisted(() => ({
  invokeLLMMock: vi.fn(),
  listLLMModelsMock: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: invokeLLMMock,
  listLLMModels: listLLMModelsMock,
}));

import { optimizePrompt, promptOptimizerLimits } from "./promptOptimizer";

describe("promptOptimizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listLLMModelsMock.mockResolvedValue({ data: [{ id: "gpt-5-mini" }] });
  });

  it("iterates until the quality score saturates and never exceeds the configured cap", async () => {
    invokeLLMMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          optimized_prompt: "A considered editorial still life with controlled light.",
          quality_score: 82,
          improved: true,
          saturated: false,
        }) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          optimized_prompt: "A considered editorial still life with controlled cinematic light, tactile materials and precise framing.",
          quality_score: 96,
          improved: true,
          saturated: true,
        }) } }],
      });

    const result = await optimizePrompt({
      mode: "text-to-image",
      prompt: "An editorial still life",
      aspectRatio: "1:1",
      steps: 8,
    });

    expect(result.originalPrompt).toBe("An editorial still life");
    expect(result.optimizedPrompt).toContain("cinematic light");
    expect(result.iterations).toBe(2);
    expect(result.qualityScore).toBe(96);
    expect(result.saturated).toBe(true);
    expect(invokeLLMMock).toHaveBeenCalledTimes(2);
    expect(result.iterations).toBeLessThanOrEqual(promptOptimizerLimits.maxIterations);
  });

  it("returns a deterministic enriched prompt when the LLM is unavailable", async () => {
    invokeLLMMock.mockRejectedValue(new Error("provider unavailable"));

    const result = await optimizePrompt({
      mode: "style-reference",
      prompt: "A portrait with soft light",
      width: 1024,
      height: 1024,
      aspectRatio: "1:1",
      styleStrength: 0.9,
    });

    expect(result.iterations).toBe(0);
    expect(result.saturated).toBe(true);
    expect(result.optimizedPrompt).toContain("1:1");
    expect(result.optimizedPrompt).toContain("90%");
  });
});
