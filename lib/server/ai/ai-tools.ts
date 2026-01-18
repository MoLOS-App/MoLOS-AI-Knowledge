import { PromptRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/prompt-repository";
import { db } from "$lib/server/db";

type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (params: any) => Promise<any>;
};

export function getAiTools(userId: string): ToolDefinition[] {
  const promptRepo = new PromptRepository(db as any);

  return [
    {
      name: "list_prompts",
      description: "List saved prompts for the current user.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          category: { type: "string" },
          tag: { type: "string" },
        },
      },
      execute: async (params) => {
        return await promptRepo.listByUserId(userId, {
          search: params.search,
          category: params.category,
          tag: params.tag,
        });
      },
    },
    {
      name: "create_prompt",
      description: "Create a new AI prompt template.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          modelTarget: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          isFavorite: { type: "boolean" },
          isPrivate: { type: "boolean" },
          commitMessage: { type: "string" },
        },
        required: ["title", "content", "category", "modelTarget"],
      },
      execute: async (params) => {
        return await promptRepo.create(
          {
            title: params.title,
            content: params.content,
            description: params.description,
            category: params.category,
            modelTarget: params.modelTarget,
            tags: params.tags ?? [],
            isFavorite: params.isFavorite ?? false,
            isPrivate: params.isPrivate ?? false,
            commitMessage: params.commitMessage,
          },
          userId,
        );
      },
    },
  ];
}
