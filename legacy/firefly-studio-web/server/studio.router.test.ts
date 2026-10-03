import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  listAudioTranscriptions: vi.fn(),
  deleteAudioTranscription: vi.fn(),
  createAudioTranscription: vi.fn(),
  listImageGenerations: vi.fn(),
  deleteImageGeneration: vi.fn(),
  getUserPreferences: vi.fn(),
  upsertUserPreferences: vi.fn(),
  createImageGeneration: vi.fn(),
  generateStudioImage: vi.fn(),
  processAudioTranscription: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./imageService", () => ({ generateStudioImage: mocks.generateStudioImage }));
vi.mock("./audioService", () => ({ processAudioTranscription: mocks.processAudioTranscription }));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "studio-user",
      email: "creator@example.com",
      name: "Creator",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("studio router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists only the authenticated user's history", async () => {
    mocks.listImageGenerations.mockResolvedValue([{ id: 7, userId: 42, prompt: "A quiet room" }]);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.studio.history({ limit: 12 });

    expect(result).toHaveLength(1);
    expect(mocks.listImageGenerations).toHaveBeenCalledWith(42, 12);
  });

  it("removes a generation through the ownership-aware database helper", async () => {
    mocks.deleteImageGeneration.mockResolvedValue(true);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.studio.remove({ id: 7 })).resolves.toBe(true);
    expect(mocks.deleteImageGeneration).toHaveBeenCalledWith(42, 7);
  });

  it("persists a successful generation with its S3 reference", async () => {
    mocks.generateStudioImage.mockResolvedValue({
      imageUrl: "/manus-storage/generated/result.png",
      imageKey: "generated/result.png",
      engine: "Manus Image Generation",
      providerModel: "MODEL_GPT_IMAGE_2",
      resolvedFallback: false,
      originalPrompt: "A sculptural room in moonlight",
      optimizedPrompt: "A sculptural room in moonlight with cinematic control.",
      optimizationIterations: 2,
      optimizationQualityScore: 96,
    });
    mocks.createImageGeneration.mockResolvedValue(19);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.studio.generate({
      mode: "text-to-image",
      prompt: "A sculptural room in moonlight",
      aspectRatio: "16:9",
      width: 1344,
      height: 768,
      steps: 4,
      styleStrength: 0.8,
    });

    expect(result.id).toBe(19);
    expect(mocks.createImageGeneration).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      imageKey: "generated/result.png",
      imageUrl: "/manus-storage/generated/result.png",
      prompt: "A sculptural room in moonlight with cinematic control.",
      originalPrompt: "A sculptural room in moonlight",
      optimizedPrompt: "A sculptural room in moonlight with cinematic control.",
      optimizationIterations: 2,
      optimizationQualityScore: 96,
      mode: "text-to-image",
    }));
  });

  it("rejects invalid prompt input before calling the generation service", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.studio.generate({
      mode: "text-to-image",
      prompt: " ",
      aspectRatio: "1:1",
      steps: 4,
    })).rejects.toThrow();

    expect(mocks.generateStudioImage).not.toHaveBeenCalled();
  });

  it("lists only the authenticated user's audio history", async () => {
    mocks.listAudioTranscriptions.mockResolvedValue([{ id: 5, userId: 42, transcript: "Nota de voz" }]);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.audio.history({ limit: 8 });

    expect(result).toHaveLength(1);
    expect(mocks.listAudioTranscriptions).toHaveBeenCalledWith(42, 8);
  });

  it("stores a transcribed audio source in the caller's private library", async () => {
    mocks.processAudioTranscription.mockResolvedValue({
      key: "audio/42/note.webm",
      url: "/manus-storage/audio/42/note.webm",
      fileName: "nota.webm",
      mimeType: "audio/webm",
      transcript: "Una nota de voz transcrita.",
      language: "es",
      durationSeconds: 12,
    });
    mocks.createAudioTranscription.mockResolvedValue(25);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.audio.transcribe({
      audioDataUrl: "data:audio/webm;base64,dGVzdC1hdWRpby1maWxlLWRhdGE=",
      fileName: "nota.webm",
      mimeType: "audio/webm",
      language: "es",
    });

    expect(result.id).toBe(25);
    expect(mocks.processAudioTranscription).toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }));
    expect(mocks.createAudioTranscription).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      audioKey: "audio/42/note.webm",
      transcript: "Una nota de voz transcrita.",
    }));
  });

  it("rejects audio payloads outside the supported data URL contract", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.audio.transcribe({
      audioDataUrl: "not-audio",
      fileName: "nota.webm",
      mimeType: "audio/webm",
    })).rejects.toThrow();

    expect(mocks.processAudioTranscription).not.toHaveBeenCalled();
  });

  it("publishes an honest catalog that distinguishes active and planned capabilities", async () => {
    const caller = appRouter.createCaller(createContext());
    const catalog = await caller.hub.catalog();

    expect(catalog.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "image", availability: "active" }),
      expect.objectContaining({ id: "video", availability: "planned" }),
    ]));
    expect(catalog.quickActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "transcribe-audio", availability: "active" }),
      expect.objectContaining({ id: "generate-video", availability: "planned" }),
    ]));
  });
});
