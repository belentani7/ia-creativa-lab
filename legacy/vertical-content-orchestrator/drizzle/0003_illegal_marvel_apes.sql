ALTER TABLE `worker_heartbeats` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
CREATE INDEX `worker_schedule_idx` ON `worker_heartbeats` (`scheduleCronTaskUid`);