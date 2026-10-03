import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  storagePut: vi.fn(),
  storageGetSignedUrl: vi.fn(),
  transcribeAudio: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: mocks.storagePut,
  storageGetSignedUrl: mocks.storageGetSignedUrl,
}));

vi.mock("./_core/voiceTranscription", () => ({ transcribeAudio: mocks.transcribeAudio }));

import { processAudioTranscription } from "./audioService";

describe("audioService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an audio data URL when its MIME type does not match the declared type", async () => {
    await expect(processAudioTranscription({
      userId: 12,
      audioDataUrl: "data:audio/webm;base64,dGVzdC1hdWRpby1ieXRlcw==",
      fileName: "nota.mp3",
      mimeType: "audio/mpeg",
    })).rejects.toThrow("no coincide");

    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("uploads audio to S3, obtains a signed URL and returns a normalized transcript", async () => {
    mocks.storagePut.mockResolvedValue({ key: "audio/12/recording.webm", url: "/manus-storage/audio/12/recording.webm" });
    mocks.storageGetSignedUrl.mockResolvedValue("https://signed.example/audio");
    mocks.transcribeAudio.mockResolvedValue({ text: "  Nota transcrita.  ", language: "es", duration: 8.4 });

    const result = await processAudioTranscription({
      userId: 12,
      audioDataUrl: "data:audio/webm;base64,dGVzdC1hdWRpby1ieXRlcw==",
      fileName: "nota personal.webm",
      mimeType: "audio/webm",
      language: "es",
    });

    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^audio\/12\//), expect.any(Buffer), "audio/webm");
    expect(mocks.storageGetSignedUrl).toHaveBeenCalledWith("audio/12/recording.webm");
    expect(mocks.transcribeAudio).toHaveBeenCalledWith(expect.objectContaining({ audioUrl: "https://signed.example/audio", language: "es" }));
    expect(result).toMatchObject({
      key: "audio/12/recording.webm",
      transcript: "Nota transcrita.",
      language: "es",
      durationSeconds: 8,
    });
  });
});
