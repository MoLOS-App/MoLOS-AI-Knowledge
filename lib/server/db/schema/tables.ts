import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { textEnum } from "$lib/server/db/utils";
import {
  PromptCategory,
  ModelTarget,
  HumanizationLevel,
  HumanizationTone,
  HumanizerStatus,
  AbTestStatus,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";

const nowSeconds = sql`(strftime('%s','now'))`;

export const prompts = sqliteTable("MoLOS-AI-Knowledge_prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  category: textEnum("category", PromptCategory)
    .notNull()
    .default(PromptCategory.GENERAL),
  modelTarget: textEnum("model_target", ModelTarget)
    .notNull()
    .default(ModelTarget.GPT_4),
  tags: text("tags").notNull().default("[]"),
  isFavorite: integer("is_favorite", { mode: "boolean" })
    .notNull()
    .default(false),
  isPrivate: integer("is_private", { mode: "boolean" })
    .notNull()
    .default(false),
  isDeleted: integer("is_deleted", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at").notNull().default(nowSeconds),
  updatedAt: integer("updated_at").notNull().default(nowSeconds),
});

export const promptVersions = sqliteTable("MoLOS-AI-Knowledge_prompt_versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  commitMessage: text("commit_message"),
  diffSummary: text("diff_summary"),
  createdAt: integer("created_at").notNull().default(nowSeconds),
});

export const llmFiles = sqliteTable("MoLOS-AI-Knowledge_llm_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  currentVersion: integer("current_version").notNull().default(1),
  isDeleted: integer("is_deleted", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at").notNull().default(nowSeconds),
  updatedAt: integer("updated_at").notNull().default(nowSeconds),
});

export const llmFileVersions = sqliteTable(
  "MoLOS-AI-Knowledge_llm_file_versions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    llmFileId: text("llm_file_id")
      .notNull()
      .references(() => llmFiles.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    content: text("content").notNull(),
    label: text("label"),
    commitMessage: text("commit_message"),
    schemaValid: integer("schema_valid", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at").notNull().default(nowSeconds),
  },
);

export const playgroundSessions = sqliteTable(
  "MoLOS-AI-Knowledge_playground_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    promptId: text("prompt_id"),
    model: textEnum("model", ModelTarget)
      .notNull()
      .default(ModelTarget.GPT_4),
    settingsJson: text("settings_json").notNull().default("{}"),
    messagesJson: text("messages_json").notNull().default("[]"),
    totalTokens: integer("total_tokens").notNull().default(0),
    totalCost: real("total_cost").notNull().default(0),
    latencyMs: integer("latency_ms"),
    createdAt: integer("created_at").notNull().default(nowSeconds),
    updatedAt: integer("updated_at").notNull().default(nowSeconds),
  },
);

export const humanizerJobs = sqliteTable("MoLOS-AI-Knowledge_humanizer_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  inputText: text("input_text").notNull(),
  outputText: text("output_text"),
  level: textEnum("level", HumanizationLevel)
    .notNull()
    .default(HumanizationLevel.MEDIUM),
  tone: textEnum("tone", HumanizationTone)
    .notNull()
    .default(HumanizationTone.CONVERSATIONAL),
  confidenceScore: integer("confidence_score").notNull().default(0),
  status: textEnum("status", HumanizerStatus)
    .notNull()
    .default(HumanizerStatus.COMPLETED),
  createdAt: integer("created_at").notNull().default(nowSeconds),
  updatedAt: integer("updated_at").notNull().default(nowSeconds),
});

export const promptChains = sqliteTable("MoLOS-AI-Knowledge_prompt_chains", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  definitionJson: text("definition_json").notNull().default("{}"),
  tags: text("tags").notNull().default("[]"),
  createdAt: integer("created_at").notNull().default(nowSeconds),
  updatedAt: integer("updated_at").notNull().default(nowSeconds),
});

export const abTests = sqliteTable("MoLOS-AI-Knowledge_ab_tests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  promptIdsJson: text("prompt_ids_json").notNull().default("[]"),
  datasetJson: text("dataset_json").notNull().default("[]"),
  resultsJson: text("results_json").notNull().default("{}"),
  status: textEnum("status", AbTestStatus)
    .notNull()
    .default(AbTestStatus.DRAFT),
  createdAt: integer("created_at").notNull().default(nowSeconds),
  updatedAt: integer("updated_at").notNull().default(nowSeconds),
});

export const usageAnalytics = sqliteTable(
  "MoLOS-AI-Knowledge_usage_analytics",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metricType: text("metric_type").notNull(),
    value: real("value").notNull(),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: integer("created_at").notNull().default(nowSeconds),
  },
);

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
