CREATE TABLE IF NOT EXISTS `MoLOS-AI-Knowledge_playground_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`prompt_id` text,
	`model` text DEFAULT 'gpt-4' NOT NULL,
	`settings_json` text DEFAULT '{}' NOT NULL,
	`messages_json` text DEFAULT '[]' NOT NULL,
	`total_tokens` integer DEFAULT 0 NOT NULL,
	`total_cost` real DEFAULT 0 NOT NULL,
	`latency_ms` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

ALTER TABLE `MoLOS-AI-Knowledge_ai_provider_settings` ADD `preconfigured_models_json` text DEFAULT '[]' NOT NULL;
