// Re-export enums from schema for type consistency
export {
  AiProvider,
  HumanizationLevel,
  HumanizationTone,
  HumanizerStatus,
  AbTestStatus,
} from "../server/db/schema";

export interface Prompt {
	id: string;
	userId: string;
	title: string;
	description?: string;
	content: string;
	tags: string[];
	isDeleted: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface PromptVersion {
	id: string;
	promptId: string;
	userId: string;
	versionNumber: number;
	content: string;
	commitMessage?: string;
	diffSummary?: string;
	createdAt: number;
}

export interface LlmFile {
	id: string;
	userId: string;
	title: string;
	currentVersion: number;
	isDeleted: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface LlmFileVersion {
	id: string;
	llmFileId: string;
	userId: string;
	versionNumber: number;
	content: string;
	label?: string;
	commitMessage?: string;
	schemaValid: boolean;
	createdAt: number;
}

export interface PlaygroundSession {
	id: string;
	userId: string;
	promptId?: string;
	model: string;
	settingsJson: string;
	messagesJson: string;
	totalTokens: number;
	totalCost: number;
	latencyMs?: number;
	createdAt: number;
	updatedAt: number;
}

export interface AiProviderSettings {
	userId: string;
	provider: AiProvider;
	apiToken: string;
	preconfiguredModels: string[];
	createdAt: number;
	updatedAt: number;
}

export interface HumanizerJob {
	id: string;
	userId: string;
	inputText: string;
	outputText?: string;
	level: HumanizationLevel;
	tone: HumanizationTone;
	confidenceScore: number;
	status: HumanizerStatus;
	createdAt: number;
	updatedAt: number;
}

export interface PromptChain {
	id: string;
	userId: string;
	name: string;
	description?: string;
	definitionJson: string;
	tags: string[];
	createdAt: number;
	updatedAt: number;
}

export interface AbTest {
	id: string;
	userId: string;
	name: string;
	promptIdsJson: string;
	datasetJson: string;
	resultsJson: string;
	status: AbTestStatus;
	createdAt: number;
	updatedAt: number;
}

export interface UsageAnalytic {
	id: string;
	userId: string;
	entityType: string;
	entityId?: string;
	metricType: string;
	value: number;
	metadataJson: string;
	createdAt: number;
}

export interface PromptDeployment {
	id: string;
	promptId: string;
	userId: string;
	versionNumber: number;
	environmentLabel: string;
	createdAt: number;
}

export type AiProvider = (typeof AiProvider)[keyof typeof AiProvider];
export type HumanizationLevel = (typeof HumanizationLevel)[keyof typeof HumanizationLevel];
export type HumanizationTone = (typeof HumanizationTone)[keyof typeof HumanizationTone];
export type HumanizerStatus = (typeof HumanizerStatus)[keyof typeof HumanizerStatus];
export type AbTestStatus = (typeof AbTestStatus)[keyof typeof AbTestStatus];
export type CreatePromptInput = Omit<
	Prompt,
	'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted'
> & { commitMessage?: string };
export type UpdatePromptInput = Partial<
	Omit<Prompt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & { commitMessage?: string };

export type CreateLlmFileInput = Omit<
	LlmFile,
	'id' | 'userId' | 'currentVersion' | 'createdAt' | 'updatedAt' | 'isDeleted'
> & { content: string; label?: string; commitMessage?: string };
export type UpdateLlmFileInput = Partial<
	Omit<LlmFile, 'id' | 'userId' | 'currentVersion' | 'createdAt' | 'updatedAt'>
> & { content?: string; label?: string; commitMessage?: string };

export type CreateHumanizerJobInput = Omit<
	HumanizerJob,
	'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'
>;

export type CreatePromptChainInput = Omit<PromptChain, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdatePromptChainInput = Partial<
	Omit<PromptChain, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export type UpdateAiProviderSettingsInput = Partial<
	Omit<AiProviderSettings, 'userId' | 'createdAt' | 'updatedAt'>
>;

export type CreateAbTestInput = Omit<AbTest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateAbTestInput = Partial<Omit<AbTest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
