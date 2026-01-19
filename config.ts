import {
  LayoutDashboard,
  Sparkles,
  MessageSquareText,
  Wand2,
  Workflow,
  BarChart3,
  Settings,
} from "lucide-svelte";
import type { ModuleConfig } from "$lib/config/types";

export const moduleConfig: ModuleConfig = {
  id: "MoLOS-AI-Knowledge",
  name: "AI Knowledge",
  href: "/ui/MoLOS-AI-Knowledge",
  icon: Sparkles,
  description: "Manage prompts, LLM files, and AI workflows",
  navigation: [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/ui/MoLOS-AI-Knowledge",
    },
    {
      name: "Prompts",
      icon: Sparkles,
      href: "/ui/MoLOS-AI-Knowledge/prompts",
    },
    {
      name: "Playground",
      icon: MessageSquareText,
      href: "/ui/MoLOS-AI-Knowledge/playground",
    },
    {
      name: "Humanizer",
      icon: Wand2,
      href: "/ui/MoLOS-AI-Knowledge/humanizer",
    },
    {
      name: "Chains",
      icon: Workflow,
      href: "/ui/MoLOS-AI-Knowledge/chains",
    },
    {
      name: "A/B Tests",
      icon: BarChart3,
      href: "/ui/MoLOS-AI-Knowledge/ab-tests",
    },
    {
      name: "Analytics",
      icon: BarChart3,
      href: "/ui/MoLOS-AI-Knowledge/analytics",
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/ui/MoLOS-AI-Knowledge/settings",
    },
  ],
};

export default moduleConfig;
