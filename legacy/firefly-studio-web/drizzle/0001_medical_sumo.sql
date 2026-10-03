CREATE TABLE `imageGenerations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mode` enum('text-to-image','generative-fill','style-reference','parametric-adjust') NOT NULL,
	`prompt` text NOT NULL,
	`engine` varchar(128) NOT NULL,
	`providerModel` varchar(128),
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`sourceImageKey` varchar(512),
	`width` int,
	`height` int,
	`aspectRatio` varchar(32),
	`steps` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imageGenerations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultMode` enum('text-to-image','generative-fill','style-reference','parametric-adjust') NOT NULL DEFAULT 'text-to-image',
	`defaultAspectRatio` varchar(32) NOT NULL DEFAULT '1:1',
	`defaultSteps` int NOT NULL DEFAULT 4,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
