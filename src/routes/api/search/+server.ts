import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PromptRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/prompt-repository";
import { PromptChainRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/prompt-chain-repository";
import { db } from "$lib/server/db";

type SearchResult = {
  moduleId: string;
  moduleName?: string;
  entityType: string;
  entityId: string;
  title: string;
  snippet?: string;
  href: string;
  updatedAt?: number;
};

const SearchSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const moduleId = "MoLOS-AI-Knowledge";
const moduleName = "AI Knowledge";

const buildSnippet = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 160).trim()}...`;
};

const toMs = (value?: number | null) => (value ? value * 1000 : undefined);

export const GET: RequestHandler = async ({ locals, url }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const parsed = SearchSchema.safeParse({
    q: url.searchParams.get("q"),
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    throw error(400, parsed.error.issues[0]?.message ?? "Invalid query");
  }

  const { q, limit } = parsed.data;
  const perTypeLimit = Math.min(20, limit ?? 20);

  const promptRepo = new PromptRepository(db);
  const chainRepo = new PromptChainRepository(db);

  const [prompts, chains] = await Promise.all([
    promptRepo.listByUserId(userId, { search: q, limit: perTypeLimit }),
    chainRepo.searchByUserId(userId, q, perTypeLimit),
  ]);

  const results: SearchResult[] = [
    ...prompts.map((prompt) => ({
      moduleId,
      moduleName,
      entityType: "prompt",
      entityId: prompt.id,
      title: prompt.title,
      snippet: buildSnippet(prompt.description || prompt.content),
      href: `/ui/MoLOS-AI-Knowledge/prompts/${prompt.id}`,
      updatedAt: toMs(prompt.updatedAt),
    })),
    ...chains.map((chain) => ({
      moduleId,
      moduleName,
      entityType: "prompt_chain",
      entityId: chain.id,
      title: chain.name,
      snippet: buildSnippet(chain.description),
      href: "/ui/MoLOS-AI-Knowledge/chains",
      updatedAt: toMs(chain.updatedAt),
    })),
  ];

  return json({ query: q, results, total: results.length });
};
