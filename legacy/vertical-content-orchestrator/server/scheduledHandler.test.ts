import { describe, expect, it, vi } from "vitest";
import { createProcessQueueHandler } from "./scheduledHandler";

function responseDouble() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { json, status, response: { json, status } };
}

describe("processQueue scheduled handler", () => {
  it("returns 403 for non-cron callers", async () => {
    const response = responseDouble();
    const handler = createProcessQueueHandler({
      authenticateRequest: vi.fn().mockResolvedValue({ isCron: false }),
      findWorkerName: vi.fn(),
      processQueue: vi.fn(),
    });

    await handler({} as never, response.response as never);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.status.mock.results[0]?.value.json).toHaveBeenCalledWith({
      error: "cron-only",
    });
  });

  it("returns 2xx and skips an orphaned cron task", async () => {
    const response = responseDouble();
    const handler = createProcessQueueHandler({
      authenticateRequest: vi.fn().mockResolvedValue({
        isCron: true,
        taskUid: "missing-task",
      }),
      findWorkerName: vi.fn().mockResolvedValue(null),
      processQueue: vi.fn(),
    });

    await handler({} as never, response.response as never);

    expect(response.json).toHaveBeenCalledWith({
      ok: true,
      taskUid: "missing-task",
      skipped: "orphan",
    });
  });
});
