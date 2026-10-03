ALTER TABLE `imageGenerations` ADD `originalPrompt` text;--> statement-breakpoint
ALTER TABLE `imageGenerations` ADD `optimizedPrompt` text;--> statement-breakpoint
ALTER TABLE `imageGenerations` ADD `optimizationIterations` int DEFAULT 1 NOT NULL;