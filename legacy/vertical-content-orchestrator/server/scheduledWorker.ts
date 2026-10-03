export type ScheduledWorkerRow = {
  workerName: string;
};

export async function resolveScheduledWorker(
  taskUid: string,
  findByTaskUid: (taskUid: string) => Promise<ScheduledWorkerRow | undefined>
) {
  const heartbeat = await findByTaskUid(taskUid);
  return heartbeat?.workerName ?? null;
}
