import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw error(401, "Unauthorized");
  }

  return json({ ok: true, module: "MoLOS-AI-Knowledge" });
};
