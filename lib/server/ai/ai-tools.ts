import { PromptRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/prompt-repository';
import { LlmFileRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/llm-file-repository';
import { PlaygroundSessionRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/playground-session-repository';
import { HumanizerJobRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/humanizer-job-repository';
import { AiProviderSettingsRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/ai-provider-settings-repository';
import {
	HumanizationLevel,
	HumanizationTone
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
import { runHumanizerPipeline } from '$lib/utils/external_modules/MoLOS-AI-Knowledge/humanizer';
import { db } from '$lib/server/db';

type ToolDefinition = {
	name: string;
	description: string;
	parameters: {
		type: 'object';
		properties: Record<string, unknown>;
		required?: string[];
	};
	execute: (params: any) => Promise<any>;
};

export function getAiTools(userId: string): ToolDefinition[] {
	const promptRepo = new PromptRepository(db as any);
	const llmFileRepo = new LlmFileRepository(db as any);
	const playgroundRepo = new PlaygroundSessionRepository(db as any);
	const humanizerRepo = new HumanizerJobRepository(db as any);
	const settingsRepo = new AiProviderSettingsRepository(db as any);

	return [
		{
			name: 'list_prompts',
			description: 'List saved prompts for the current user.',
			parameters: {
				type: 'object',
				properties: {
					search: { type: 'string' },
					tag: { type: 'string' }
				}
			},
			execute: async (params) => {
				return await promptRepo.listByUserId(userId, {
					search: params.search,
					tag: params.tag
				});
			}
		},
		{
			name: 'create_prompt',
			description: 'Create a new AI prompt template.',
			parameters: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					content: { type: 'string' },
					description: { type: 'string' },
					tags: { type: 'array', items: { type: 'string' } },
					commitMessage: { type: 'string' }
				},
				required: ['title', 'content']
			},
			execute: async (params) => {
				return await promptRepo.create(
					{
						title: params.title,
						content: params.content,
						description: params.description,
						tags: params.tags ?? [],
						commitMessage: params.commitMessage
					},
					userId
				);
			}
		},
		{
			name: 'update_prompt',
			description: 'Update an existing AI prompt template.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					content: { type: 'string' },
					description: { type: 'string' },
					tags: { type: 'array', items: { type: 'string' } },
					isDeleted: { type: 'boolean' },
					commitMessage: { type: 'string' }
				},
				required: ['id']
			},
			execute: async (params) => {
				const updated = await promptRepo.update(params.id, userId, {
					title: params.title,
					content: params.content,
					description: params.description,
					tags: params.tags,
					isDeleted: params.isDeleted,
					commitMessage: params.commitMessage
				});
				if (!updated) throw new Error('Prompt not found');
				return updated;
			}
		},
		{
			name: 'delete_prompt',
			description: 'Soft-delete a prompt by id.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string' }
				},
				required: ['id']
			},
			execute: async (params) => {
				const deleted = await promptRepo.softDelete(params.id, userId);
				if (!deleted) throw new Error('Prompt not found');
				return { success: true };
			}
		},
		{
			name: 'list_llm_files',
			description: 'List LLM.txt files for the current user.',
			parameters: {
				type: 'object',
				properties: {}
			},
			execute: async () => {
				return await llmFileRepo.listByUserId(userId);
			}
		},
		{
			name: 'create_llm_file',
			description: 'Create a new LLM.txt file entry.',
			parameters: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					content: { type: 'string' },
					label: { type: 'string' },
					commitMessage: { type: 'string' }
				},
				required: ['title', 'content']
			},
			execute: async (params) => {
				return await llmFileRepo.create(
					{
						title: params.title,
						content: params.content,
						label: params.label,
						commitMessage: params.commitMessage
					},
					userId
				);
			}
		},
		{
			name: 'update_llm_file',
			description: 'Update an LLM.txt file entry.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					content: { type: 'string' },
					label: { type: 'string' },
					commitMessage: { type: 'string' },
					isDeleted: { type: 'boolean' }
				},
				required: ['id']
			},
			execute: async (params) => {
				const updated = await llmFileRepo.update(params.id, userId, {
					title: params.title,
					content: params.content,
					label: params.label,
					commitMessage: params.commitMessage,
					isDeleted: params.isDeleted
				});
				if (!updated) throw new Error('LLM file not found');
				return updated;
			}
		},
		{
			name: 'list_playground_sessions',
			description: 'List recent playground sessions.',
			parameters: {
				type: 'object',
				properties: {
					limit: { type: 'number', default: 20 }
				}
			},
			execute: async (params) => {
				return await playgroundRepo.listByUserId(userId, params.limit ?? 20);
			}
		},
		{
			name: 'create_playground_session',
			description: 'Create a new playground session.',
			parameters: {
				type: 'object',
				properties: {
					promptId: { type: 'string' },
					model: { type: 'string' },
					settings: { type: 'object' },
					messages: { type: 'array', items: {} },
					totalTokens: { type: 'number' },
					totalCost: { type: 'number' },
					latencyMs: { type: 'number' }
				},
				required: ['model', 'settings', 'messages', 'totalTokens', 'totalCost']
			},
			execute: async (params) => {
				return await playgroundRepo.create(userId, {
					promptId: params.promptId,
					model: params.model,
					settings: params.settings ?? {},
					messages: params.messages ?? [],
					totalTokens: params.totalTokens ?? 0,
					totalCost: params.totalCost ?? 0,
					latencyMs: params.latencyMs
				});
			}
		},
		{
			name: 'update_playground_session',
			description: 'Update a playground session by id.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					promptId: { type: 'string' },
					model: { type: 'string' },
					settings: { type: 'object' },
					messages: { type: 'array', items: {} },
					totalTokens: { type: 'number' },
					totalCost: { type: 'number' },
					latencyMs: { type: 'number' }
				},
				required: ['id']
			},
			execute: async (params) => {
				const updated = await playgroundRepo.update(userId, params.id, {
					promptId: params.promptId,
					model: params.model,
					settings: params.settings,
					messages: params.messages,
					totalTokens: params.totalTokens,
					totalCost: params.totalCost,
					latencyMs: params.latencyMs
				});
				if (!updated) throw new Error('Playground session not found');
				return updated;
			}
		},
		{
			name: 'delete_playground_session',
			description: 'Delete a playground session by id.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string' }
				},
				required: ['id']
			},
			execute: async (params) => {
				const deleted = await playgroundRepo.delete(userId, params.id);
				if (!deleted) throw new Error('Playground session not found');
				return { success: true };
			}
		},
		{
			name: 'list_humanizer_jobs',
			description: 'List recent humanizer jobs for the user.',
			parameters: {
				type: 'object',
				properties: {
					limit: { type: 'number', default: 20 }
				}
			},
			execute: async (params) => {
				return await humanizerRepo.listByUserId(userId, params.limit ?? 20);
			}
		},
		{
			name: 'humanize_text',
			description: 'Run the humanizer pipeline and store the result as a job.',
			parameters: {
				type: 'object',
				properties: {
					inputText: { type: 'string' },
					level: {
						type: 'string',
						enum: Object.values(HumanizationLevel)
					},
					tone: {
						type: 'string',
						enum: Object.values(HumanizationTone)
					},
					model: { type: 'string' },
					options: { type: 'string' },
					temperature: { type: 'number' },
					topP: { type: 'number' },
					frequencyPenalty: { type: 'number' },
					presencePenalty: { type: 'number' },
					maxTokens: { type: 'number' }
				},
				required: ['inputText', 'level', 'tone']
			},
			execute: async (params) => {
				const providerSettings = await settingsRepo.getByUserId(userId);
				const defaultModels = [
					'gpt-4',
					'gpt-4-turbo',
					'claude-sonnet-4-5',
					'claude-haiku-4-5',
					'gemini-pro'
				];
				const allowedModels = providerSettings?.preconfiguredModels?.length
					? providerSettings.preconfiguredModels
					: defaultModels;
				const requestedModel = typeof params.model === 'string' ? params.model.trim() : '';
				const selectedModel =
					requestedModel && allowedModels.includes(requestedModel) ? requestedModel : undefined;

				const result = await runHumanizerPipeline({
					inputText: params.inputText,
					level: params.level,
					tone: params.tone,
					providerSettings,
					model: selectedModel,
					optionsText: params.options,
					settings: {
						temperature: params.temperature,
						topP: params.topP,
						frequencyPenalty: params.frequencyPenalty,
						presencePenalty: params.presencePenalty,
						maxTokens: params.maxTokens
					}
				});

				const job = await humanizerRepo.create(userId, {
					inputText: params.inputText,
					outputText: result.outputText,
					level: params.level,
					tone: params.tone,
					confidenceScore: result.confidenceScore
				});

				return {
					jobId: job.id,
					outputText: result.outputText,
					confidenceScore: result.confidenceScore,
					detectorScore: result.detectorScore,
					usedFallback: result.usedFallback
				};
			}
		},
		{
			name: 'delete_humanizer_job',
			description: 'Delete a humanizer job by id.',
			parameters: {
				type: 'object',
				properties: {
					id: { type: 'string' }
				},
				required: ['id']
			},
			execute: async (params) => {
				const deleted = await humanizerRepo.delete(userId, params.id);
				if (!deleted) throw new Error('Humanizer job not found');
				return { success: true };
			}
		}
	];
}
