import type { Request, Response } from "express";

type CronUser = { isCron?: boolean; taskUid?: string };

type HandlerDependencies = {
  authenticateRequest: (req: Request) => Promise<CronUser>;
  findWorkerName: (taskUid: string) => Promise<string | null>;
  processQueue: (workerName: string) => Promise<{ processed: number }>;
};

export function createProcessQueueHandler({
  authenticateRequest,
  findWorkerName,
  processQueue,
}: HandlerDependencies) {
  return async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      if (!user.isCron || !user.taskUid)
        return res.status(403).json({ error: "cron-only" });
      const workerName = await findWorkerName(user.taskUid);
      if (!workerName)
        return res.json({ ok: true, taskUid: user.taskUid, skipped: "orphan" });
      const result = await processQueue(workerName);
      return res.json({ ok: true, taskUid: user.taskUid, ...result });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  };
}
