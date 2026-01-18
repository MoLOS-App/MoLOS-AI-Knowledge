/**
 * Tasks Module Configuration
 * Defines routes, navigation items, and metadata for the Tasks module
 *
 * Keep the `id` and `href` aligned with `manifest.yaml` and the UI base route.
 */

import { SquareCheck } from "lucide-svelte";
import type { ModuleConfig } from "$lib/config/types";
export const tasksConfig: ModuleConfig = {
  id: "MoLOS-AI-Knowledge",
  name: "Sample Tasks",
  href: "/ui/MoLOS-AI-Knowledge",
  icon: SquareCheck,
  description: "Minimal task CRUD sample module",
  navigation: [
    {
      // Single navigation item for the only page in this boilerplate.
      name: "Tasks",
      icon: SquareCheck,
      href: "/ui/MoLOS-AI-Knowledge",
    },
  ],
};

export const moduleConfig = tasksConfig;
export default tasksConfig;
