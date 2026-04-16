/**
 * data-access.ts — Data access abstraction layer.
 * Centralizes all filtering logic for skills and patterns.
 * Pages call these functions so that if data ever moves to an API,
 * only this layer needs to change.
 */
import {
  allMarketplaceSkills,
  skillCategories,
  type MarketplaceSkill,
  type SkillCategory,
} from "@/data/marketplace-skills";
import { communityPatterns } from "@/data/community-patterns";
import { getPatternConfig } from "@/data/config-loader";

/* ─── Pattern type (mirrors patterns.tsx inline type) ─── */
export interface PatternEntry {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  audience: string;
  description: string;
  whyItMatters: string;
  config: string;
}

/* ─── Core patterns (sourced from patterns.tsx) ─── */
const corePatterns: PatternEntry[] = [
  {
    id: "greeter",
    name: "The Greeter",
    tagline: "Every interaction starts with warmth",
    icon: "HandHeart",
    color: "text-teal-500",
    audience: "Customer-facing teams, community managers",
    description:
      "A conversational agent that welcomes users with genuine warmth, remembers their context, and guides them to what they need without feeling transactional.",
    whyItMatters:
      "First impressions set the tone for every relationship. When AI greets people with care, it signals that the humans behind the technology care too.",
    config: getPatternConfig("greeter"),
  },
  {
    id: "guardian",
    name: "The Guardian",
    tagline: "Protecting what matters, transparently",
    icon: "Shield",
    color: "text-blue-500",
    audience: "Security teams, compliance officers, DevOps",
    description:
      "A security-focused agent that monitors systems, flags anomalies, and explains risks in plain language — never hiding behind jargon or alarm fatigue.",
    whyItMatters:
      "Security should empower, not intimidate. When protection is transparent and understandable, everyone becomes a partner in keeping systems safe.",
    config: getPatternConfig("guardian"),
  },
  {
    id: "storyteller",
    name: "The Storyteller",
    tagline: "Making complexity feel like a story",
    icon: "BookOpen",
    color: "text-purple-500",
    audience: "Technical writers, educators, product teams",
    description:
      "An agent that transforms complex technical documentation into engaging narratives, using analogies, progressive disclosure, and a natural reading flow.",
    whyItMatters:
      "Knowledge shouldn't be locked behind walls of jargon. When technology tells its own story clearly, more people can participate in shaping it.",
    config: getPatternConfig("storyteller"),
  },
  {
    id: "teacher",
    name: "The Teacher",
    tagline: "Learning at your own pace, with encouragement",
    icon: "GraduationCap",
    color: "text-amber-500",
    audience: "Training programs, onboarding, self-learners",
    description:
      "A patient, adaptive learning agent that meets people where they are, celebrates small wins, adjusts difficulty dynamically, and never makes anyone feel behind.",
    whyItMatters:
      "Everyone learns differently, at different speeds. When AI adapts to the learner instead of forcing the learner to adapt, education becomes truly accessible.",
    config: getPatternConfig("teacher"),
  },
  {
    id: "peacekeeper",
    name: "The Peacekeeper",
    tagline: "Finding common ground through understanding",
    icon: "Handshake",
    color: "text-green-500",
    audience: "Mediators, community moderators, team leads",
    description:
      "A conflict-aware agent that facilitates respectful dialogue, identifies common ground, de-escalates tension, and helps groups find consensus without forcing agreement.",
    whyItMatters:
      "The hardest problems are human ones. When AI helps people listen to each other instead of talk past each other, it creates space for real solutions.",
    config: getPatternConfig("peacekeeper"),
  },
  {
    id: "celebrator",
    name: "The Celebrator",
    tagline: "Because every win deserves acknowledgment",
    icon: "PartyPopper",
    color: "text-pink-500",
    audience: "Teams, project managers, community builders",
    description:
      "An agent that tracks milestones, celebrates achievements (big and small), maintains a gratitude journal, and helps teams feel the progress they're making.",
    whyItMatters:
      "Humans need to feel their progress. When we're buried in to-do lists, it's easy to forget how far we've come. This agent makes sure no win goes unnoticed.",
    config: getPatternConfig("celebrator"),
  },
];

/** All patterns: core + community */
export const allPatterns: PatternEntry[] = [...corePatterns, ...communityPatterns as PatternEntry[]];

/* ─── Skills access functions ─── */

export function getSkillCategories() {
  return skillCategories;
}

/**
 * Returns marketplace skills filtered by optional category and search query.
 * Mirrors the inline filter logic previously in marketplace.tsx.
 */
export function getSkills(options?: {
  category?: SkillCategory | "all";
  search?: string;
}): MarketplaceSkill[] {
  const { category, search } = options ?? {};
  return allMarketplaceSkills.filter((skill) => {
    const matchesSearch =
      !search ||
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase()) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())) ||
      skill.provider.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !category || category === "all" || skill.category === category;

    return matchesSearch && matchesCategory;
  });
}

/* ─── Patterns access functions ─── */

/**
 * Returns patterns filtered by optional category and search query.
 * Mirrors the inline filter logic previously in patterns.tsx.
 */
export function getPatterns(options?: {
  category?: string;
  search?: string;
}): PatternEntry[] {
  const { category, search } = options ?? {};
  return allPatterns.filter((p) => {
    const matchesCategory = !category || category === "all" || p.id === category;
    const matchesSearch =
      !search ||
      (() => {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.audience.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q)
        );
      })();
    return matchesCategory && matchesSearch;
  });
}
