import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimNextQueueJob: vi.fn(),
  completeQueueJob: vi.fn(),
  createActivity: vi.fn(),
  createContent: vi.fn(),
  failQueueJob: vi.fn(),
  getPublicationForWorker: vi.fn(),
  touchWorkerHeartbeat: vi.fn(),
  updatePublicationFromWorker: vi.fn(),
  publishProduction: vi.fn(),
  generateImage: vi.fn(),
}));

vi.mock("./db", () => mocks);
vi.mock("./publishing/productionAdapters", () => ({
  publishProduction: mocks.publishProduction,
}));
vi.mock("./_core/imageGeneration", () => ({
  generateImage: mocks.generateImage,
}));

import { parseQueuePayload, processQueueOnce } from "./worker";

describe("persistent worker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.touchWorkerHeartbeat.mockResolvedValue(undefined);
    mocks.completeQueueJob.mockResolvedValue(undefined);
    mocks.createActivity.mockResolvedValue(undefined);
    mocks.createContent.mockResolvedValue(21);
    mocks.generateImage.mockResolvedValue({
      url: "https://cdn.test/generated.png",
    });
    mocks.failQueueJob.mockResolvedValue(undefined);
    mocks.updatePublicationFromWorker.mockResolvedValue(undefined);
  });

  it("rejects malformed queue payloads", () => {
    expect(() => parseQueuePayload("[]")).toThrow("Invalid queue payload");
    expect(parseQueuePayload('{"publicationId":7}')).toEqual({
      publicationId: 7,
    });
  });

  it("claims and completes a publish job", async () => {
    mocks.claimNextQueueJob
      .mockResolvedValueOnce({
        id: 11,
        kind: "publish",
        payload: JSON.stringify({ publicationId: 7, caption: "hola" }),
      })
      .mockResolvedValueOnce(undefined);
    mocks.getPublicationForWorker.mockResolvedValue({
      publication: {
        ownerId: 2,
        contentId: 9,
        platform: "telegram",
        status: "privado",
      },
      content: {
        id: 9,
        ownerId: 2,
        title: "Gato",
        mediaType: "image",
        mediaUrl: "https://cdn.test/gato.jpg",
        reviewStatus: "approved",
      },
    });
    mocks.publishProduction.mockResolvedValue({
      status: "publicado",
      externalId: "msg-1",
      publishedUrl: null,
    });

    const result = await processQueueOnce("worker-test", 1);

    expect(result).toEqual({ processed: 1 });
    expect(mocks.completeQueueJob).toHaveBeenCalledWith(11);
    expect(mocks.failQueueJob).not.toHaveBeenCalled();
    expect(mocks.updatePublicationFromWorker).toHaveBeenCalledWith(7, {
      status: "publicado",
      externalId: "msg-1",
      publishedUrl: null,
    });
  });

  it("skips a publication already confirmed by the provider", async () => {
    mocks.claimNextQueueJob.mockResolvedValueOnce({
      id: 14,
      kind: "publish",
      payload: JSON.stringify({ publicationId: 9 }),
    });
    mocks.getPublicationForWorker.mockResolvedValue({
      publication: {
        ownerId: 2,
        contentId: 9,
        platform: "telegram",
        status: "publicado",
        externalId: "already-sent",
        publishedUrl: "https://t.me/example/1",
      },
      content: {
        id: 9,
        ownerId: 2,
        title: "Gato",
        mediaType: "image",
        mediaUrl: "https://cdn.test/gato.jpg",
        reviewStatus: "approved",
      },
    });

    const result = await processQueueOnce("worker-test", 1);

    expect(result).toEqual({ processed: 1 });
    expect(mocks.publishProduction).not.toHaveBeenCalled();
    expect(mocks.completeQueueJob).toHaveBeenCalledWith(14);
  });

  it("processes a queued generation into reviewable content", async () => {
    mocks.claimNextQueueJob
      .mockResolvedValueOnce({
        id: 13,
        kind: "generate",
        payload: JSON.stringify({
          ownerId: 2,
          title: "Gato generado",
          category: "gatos/humor",
          prompt: "Un gato astronauta",
        }),
      })
      .mockResolvedValueOnce(undefined);

    const result = await processQueueOnce("worker-test", 1);

    expect(result).toEqual({ processed: 1 });
    expect(mocks.generateImage).toHaveBeenCalled();
    expect(mocks.createContent).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        title: "Gato generado",
        mediaUrl: "https://cdn.test/generated.png",
        reviewStatus: "pending",
      })
    );
    expect(mocks.completeQueueJob).toHaveBeenCalledWith(13);
  });

  it("records and requeues a failed job", async () => {
    mocks.claimNextQueueJob.mockResolvedValueOnce({
      id: 12,
      kind: "publish",
      payload: JSON.stringify({ publicationId: 8 }),
    });
    mocks.getPublicationForWorker.mockResolvedValue({
      publication: {
        ownerId: 2,
        contentId: 9,
        platform: "telegram",
        status: "privado",
      },
      content: {
        id: 9,
        ownerId: 2,
        title: "Gato",
        mediaType: "image",
        mediaUrl: "https://cdn.test/gato.jpg",
        reviewStatus: "approved",
      },
    });
    mocks.publishProduction.mockRejectedValue(new Error("API offline"));

    const result = await processQueueOnce("worker-test", 1);

    expect(result).toEqual({ processed: 0 });
    expect(mocks.failQueueJob).toHaveBeenCalledWith(12, expect.any(Error));
    expect(mocks.completeQueueJob).not.toHaveBeenCalled();
    expect(mocks.touchWorkerHeartbeat).toHaveBeenCalledWith(
      "worker-test",
      expect.objectContaining({ status: "degraded", lastJobId: 12 })
    );

    mocks.claimNextQueueJob.mockResolvedValueOnce({
      id: 12,
      kind: "publish",
      payload: JSON.stringify({ publicationId: 8 }),
    });
    mocks.publishProduction.mockResolvedValueOnce({
      status: "publicado",
      externalId: "msg-recovered",
      publishedUrl: null,
    });
    const recovered = await processQueueOnce("worker-test", 1);
    expect(recovered).toEqual({ processed: 1 });
    expect(mocks.completeQueueJob).toHaveBeenCalledWith(12);
  });
});
