CREATE TABLE `audioTranscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`audioKey` varchar(512) NOT NULL,
	`audioUrl` varchar(1024) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`transcript` text NOT NULL,
	`language` varchar(16),
	`durationSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audioTranscriptions_id` PRIMARY KEY(`id`)
);
