CREATE TABLE IF NOT EXISTS `MoLOS-AI-Knowledge_ai_provider_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text CHECK(provider IN ('openai', 'anthropic', 'openrouter', 'xai')) DEFAULT 'openai' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

ALTER TABLE `MoLOS-AI-Knowledge_llm_files` DROP COLUMN `filename`;

--> statement-breakpoint

ALTER TABLE `MoLOS-AI-Knowledge_prompts` DROP COLUMN `category`;

--> statement-breakpoint

ALTER TABLE `MoLOS-AI-Knowledge_prompts` DROP COLUMN `model_target`;

--> statement-breakpoint

ALTER TABLE `MoLOS-AI-Knowledge_prompts` DROP COLUMN `is_favorite`;

--> statement-breakpoint

ALTER TABLE `MoLOS-AI-Knowledge_prompts` DROP COLUMN `is_private`;
