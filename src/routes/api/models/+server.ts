import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { AiProvider } from "$lib/models/external_modules/MoLOS-AI-Knowledge";

const providers = new Set(Object.values(AiProvider));
const defaultModels = [
  "gpt-4",
  "gpt-4-turbo",
  "claude-sonnet-4-5",
  "claude-haiku-4-5",
  "gemini-pro",
];

export const GET: RequestHandler = async ({ locals, url }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const providerParam = url.searchParams.get("provider") ?? "";
  const provider = providers.has(providerParam as AiProvider)
    ? (providerParam as AiProvider)
    : AiProvider.OPENAI;

  if (provider === AiProvider.OPENROUTER) {
    return json({
      provider,
      models: [],
    });
  }

  return json({
    provider,
    models: defaultModels,
  });
};
