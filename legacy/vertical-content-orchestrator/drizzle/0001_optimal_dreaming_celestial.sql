CREATE TABLE `activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`type` enum('upload','review','schedule','publish','error','generation') NOT NULL,
	`message` text NOT NULL,
	`platform` enum('instagram','facebook','tiktok','youtube','telegram'),
	`contentId` int,
	`publicationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` enum('personal','gatos/humor','personaje virtual') NOT NULL,
	`mediaType` enum('image','video') NOT NULL,
	`mediaUrl` text NOT NULL,
	`storageKey` varchar(512),
	`prompt` text,
	`width` int,
	`height` int,
	`durationSeconds` int,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`source` enum('upload','generated') NOT NULL DEFAULT 'upload',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contentId` int NOT NULL,
	`scheduleId` int,
	`platform` enum('instagram','facebook','tiktok','youtube','telegram') NOT NULL,
	`status` enum('privado','pendiente de auditoría','publicado') NOT NULL DEFAULT 'privado',
	`externalId` varchar(255),
	`publishedUrl` text,
	`errorMessage` text,
	`attemptedAt` timestamp,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contentId` int NOT NULL,
	`platform` enum('instagram','facebook','tiktok','youtube','telegram') NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`caption` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_owner_date_idx` ON `activity_events` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_owner_idx` ON `content_items` (`ownerId`);--> statement-breakpoint
CREATE INDEX `content_review_idx` ON `content_items` (`reviewStatus`);--> statement-breakpoint
CREATE INDEX `publication_owner_idx` ON `publications` (`ownerId`);--> statement-breakpoint
CREATE INDEX `publication_status_idx` ON `publications` (`status`);--> statement-breakpoint
CREATE INDEX `schedule_owner_date_idx` ON `schedules` (`ownerId`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `schedule_task_idx` ON `schedules` (`scheduleCronTaskUid`);