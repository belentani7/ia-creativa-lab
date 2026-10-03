import { describe, expect, it, vi } from "vitest";
import { resolveScheduledWorker } from "./scheduledWorker";

describe("scheduled worker resolution", () => {
  it("resolves the persisted worker name by task UID", async () => {
    const find = vi
      .fn()
      .mockResolvedValue({ workerName: "vertical-os-worker-7" });
    await expect(resolveScheduledWorker("task-7", find)).resolves.toBe(
      "vertical-os-worker-7"
    );
    expect(find).toHaveBeenCalledWith("task-7");
  });

  it("returns null for an orphaned task UID", async () => {
    await expect(
      resolveScheduledWorker(
        "orphan-task",
        vi.fn().mockResolvedValue(undefined)
      )
    ).resolves.toBeNull();
  });
});
