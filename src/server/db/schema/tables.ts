import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { textEnum } from "@molos/database/utils";

const nowSeconds = sql`(strftime('%s','now'))`;

// Define enums locally to avoid import issues
const AiProvider = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  OPENROUTER: "openrouter",
  XAI: "xai",
} as const;

const HumanizationLevel = {
  LIGHT: "light",
  MEDIUM: "medium",
  AGGRESSIVE: "aggressive",
} as const;

const HumanizationTone = {
  PROFESSIONAL: "professional",
  CASUAL: "casual",
  ACADEMIC: "academic",
  CREATIVE: "creative",
  CONVERSATIONAL: "conversational",
} as const;

const HumanizerStatus = {
  QUEUED: "queued",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

const AbTestStatus = {
  DRAFT: "draft",
  RUNNING: "running",
  COMPLETED: "completed",
} as const;

export const prompts = sqliteTable("MoLOS-AI-Knowledge_prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  tags: text("tags").notNull().default("[]"),
  isDeleted: integer("is_deleted", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at").notNull().default(nowSeconds),
  updatedAt: integer("updated_at").notNull().default(nowSeconds),
});

export const promptVersions = sqliteTable('MoLOS-AI-Knowledge_prompt_versions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	promptId: text('prompt_id')
		.notNull()
		.references(() => prompts.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),
	versionNumber: integer('version_number').notNull(),
	content: text('content').notNull(),
	commitMessage: text('commit_message'),
	diffSummary: text('diff_summary'),
	createdAt: integer('created_at').notNull().default(nowSeconds)
});

export const llmFiles = sqliteTable('MoLOS-AI-Knowledge_llm_files', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull(),
	title: text('title').notNull(),
	currentVersion: integer('current_version').notNull().default(1),
	isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull().default(nowSeconds),
	updatedAt: integer('updated_at').notNull().default(nowSeconds)
});

export const llmFileVersions = sqliteTable('MoLOS-AI-Knowledge_llm_file_versions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	llmFileId: text('llm_file_id')
		.notNull()
		.references(() => llmFiles.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),
	versionNumber: integer('version_number').notNull(),
	content: text('content').notNull(),
	label: text('label'),
	commitMessage: text('commit_message'),
	schemaValid: integer('schema_valid', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at').notNull().default(nowSeconds)
});

export const playgroundSessions = sqliteTable('MoLOS-AI-Knowledge_playground_sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull(),
	promptId: text('prompt_id'),
	model: text('model').notNull().default('gpt-4'),
	settingsJson: text('settings_json').notNull().default('{}'),
	messagesJson: text('messages_json').notNull().default('[]'),
	totalTokens: integer('total_tokens').notNull().default(0),
	totalCost: real('total_cost').notNull().default(0),
	latencyMs: integer('latency_ms'),
	createdAt: integer('created_at').notNull().default(nowSeconds),
	updatedAt: integer('updated_at').notNull().default(nowSeconds)
});

export const aiProviderSettings = sqliteTable('MoLOS-AI-Knowledge_ai_provider_settings', {
	userId: text('user_id').primaryKey(),
	provider: textEnum('provider', AiProvider).notNull().default(AiProvider.OPENAI),
	apiToken: text('api_token').notNull().default(''),
	preconfiguredModelsJson: text('preconfigured_models_json').notNull().default('[]'),
	createdAt: integer('created_at').notNull().default(nowSeconds),
	updatedAt: integer('updated_at').notNull().default(nowSeconds)
});

export const humanizerJobs = sqliteTable('MoLOS-AI-Knowledge_humanizer_jobs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').notNull(),
	inputText: text('input_text').notNull(),
	outputText: text('output_text'),
	level: textEnum('level', HumanizationLevel).notNull().default(HumanizationLevel.MEDIUM),
	tone: textEnum('tone', HumanizationTone).notNull().default(HumanizationTone.CONVERSATIONAL),
	confidenceScore: integer('confidence_score').notNull().default(0),
	status: textEnum('status', HumanizerStatus).notNull().default(HumanizerStatus.COMPLETED),
	createdAt: integer('created_at').notNull().default(nowSeconds),
	updatedAt: integer('updated_at').notNull().default(nowSeconds)
});

export const promptDeployments = sqliteTable(
  "MoLOS-AI-Knowledge_prompt_deployments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    promptId: text("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    environmentLabel: text("environment_label").notNull(),
    createdAt: integer("created_at").notNull().default(nowSeconds),
  },
);

// Re-export enums for use in other files
export { AiProvider, HumanizationLevel, HumanizationTone, HumanizerStatus, AbTestStatus };
