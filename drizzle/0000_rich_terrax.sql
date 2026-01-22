CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_ab_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`prompt_ids_json` text DEFAULT '[]' NOT NULL,
	`dataset_json` text DEFAULT '[]' NOT NULL,
	`results_json` text DEFAULT '{}' NOT NULL,
	`status` text CHECK(status IN ('draft', 'running', 'completed')) DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_ai_provider_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text CHECK(provider IN ('openai', 'anthropic', 'openrouter', 'xai')) DEFAULT 'openai' NOT NULL,
	`api_token` text DEFAULT '' NOT NULL,
	`preconfigured_models_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_humanizer_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`input_text` text NOT NULL,
	`output_text` text,
	`level` text CHECK(level IN ('light', 'medium', 'aggressive')) DEFAULT 'medium' NOT NULL,
	`tone` text CHECK(tone IN ('professional', 'casual', 'academic', 'creative', 'conversational')) DEFAULT 'conversational' NOT NULL,
	`confidence_score` integer DEFAULT 0 NOT NULL,
	`status` text CHECK(status IN ('queued', 'completed', 'failed')) DEFAULT 'completed' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_llm_file_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`llm_file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`label` text,
	`commit_message` text,
	`schema_valid` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`llm_file_id`) REFERENCES `MoLOS-AI-Knowledge_llm_files`(`id`)  ON DELETE cascade
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_llm_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`current_version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_playground_sessions` (
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

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_prompt_chains` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`definition_json` text DEFAULT '{}' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_prompt_deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`environment_label` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `MoLOS-AI-Knowledge_prompts`(`id`)  ON DELETE cascade
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_prompt_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`commit_message` text,
	`diff_summary` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `MoLOS-AI-Knowledge_prompts`(`id`)  ON DELETE cascade
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS IF NOT EXISTS IF NOT EXISTS `MoLOS-AI-Knowledge_usage_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metric_type` text NOT NULL,
	`value` real NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
