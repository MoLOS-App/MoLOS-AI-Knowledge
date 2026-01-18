-- Migration for MoLOS-AI-Knowledge core entities.
DROP TABLE IF EXISTS `MoLOS-AI-Knowledge_tasks`;

CREATE TABLE `MoLOS-AI-Knowledge_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`model_target` text DEFAULT 'gpt-4' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_prompt_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`commit_message` text,
	`diff_summary` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `MoLOS-AI-Knowledge_prompts`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `MoLOS-AI-Knowledge_llm_files` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`current_version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_llm_file_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`llm_file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`label` text,
	`commit_message` text,
	`schema_valid` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`llm_file_id`) REFERENCES `MoLOS-AI-Knowledge_llm_files`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `MoLOS-AI-Knowledge_playground_sessions` (
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

CREATE TABLE `MoLOS-AI-Knowledge_humanizer_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`input_text` text NOT NULL,
	`output_text` text,
	`level` text DEFAULT 'medium' NOT NULL,
	`tone` text DEFAULT 'conversational' NOT NULL,
	`confidence_score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_prompt_chains` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`definition_json` text DEFAULT '{}' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_ab_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`prompt_ids_json` text DEFAULT '[]' NOT NULL,
	`dataset_json` text DEFAULT '[]' NOT NULL,
	`results_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_usage_analytics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metric_type` text NOT NULL,
	`value` real NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_shared_libraries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_private` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE TABLE `MoLOS-AI-Knowledge_shared_library_members` (
	`id` text PRIMARY KEY NOT NULL,
	`library_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`library_id`) REFERENCES `MoLOS-AI-Knowledge_shared_libraries`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `MoLOS-AI-Knowledge_shared_library_prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`library_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`library_id`) REFERENCES `MoLOS-AI-Knowledge_shared_libraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_id`) REFERENCES `MoLOS-AI-Knowledge_prompts`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `MoLOS-AI-Knowledge_prompt_deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`environment_label` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `MoLOS-AI-Knowledge_prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
