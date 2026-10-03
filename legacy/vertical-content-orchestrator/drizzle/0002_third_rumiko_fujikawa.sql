CREATE TABLE `queue_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`kind` enum('publish','generate','process') NOT NULL,
	`status` enum('queued','running','succeeded','failed','dead') NOT NULL DEFAULT 'queued',
	`idempotencyKey` varchar(255) NOT NULL,
	`payload` text NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`runAfter` timestamp NOT NULL DEFAULT (now()),
	`leaseOwner` varchar(128),
	`leaseUntil` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `queue_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `queue_jobs_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `worker_heartbeats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerName` varchar(128) NOT NULL,
	`status` enum('idle','running','degraded') NOT NULL DEFAULT 'idle',
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastJobId` int,
	`lastError` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `worker_heartbeats_id` PRIMARY KEY(`id`),
	CONSTRAINT `worker_heartbeats_workerName_unique` UNIQUE(`workerName`)
);
--> statement-breakpoint
CREATE INDEX `queue_ready_idx` ON `queue_jobs` (`status`,`runAfter`);--> statement-breakpoint
CREATE INDEX `queue_lease_idx` ON `queue_jobs` (`leaseUntil`);--> statement-breakpoint
CREATE INDEX `queue_owner_idx` ON `queue_jobs` (`ownerId`);