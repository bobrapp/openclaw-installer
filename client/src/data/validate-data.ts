/**
 * Build-time data validation with Zod (#11)
 * Validates all patterns and skills have required fields and valid data.
 * Called at module load time — invalid data fails fast with console errors.
 */
import { z } from "zod";
import { allMarketplaceSkills, skillCategories } from "./marketplace-skills";
import { communityPatterns } from "./community-patterns";

// ── Pattern schema ──
const PatternSchema = z.object({
  id: z.string().min(1, "Pattern id is required"),
  name: z.string().min(1, "Pattern name is required"),
  tagline: z.string().min(1, "Pattern tagline is required"),
  icon: z.string().min(1, "Pattern icon name is required"),
  color: z.string().min(1, "Pattern color class is required"),
  audience: z.string().min(1, "Pattern audience is required"),
  description: z.string().min(10, "Pattern description too short"),
  whyItMatters: z.string().min(10, "Pattern whyItMatters too short"),
  config: z.string().min(1, "Pattern config YAML is required"),
});

// ── Skill schema ──
const SkillSchema = z.object({
  id: z.string().min(1, "Skill id is required"),
  name: z.string().min(1, "Skill name is required"),
  provider: z.string().min(1, "Skill provider is required"),
  category: z.enum(["connections", "ai-providers", "community", "devops", "data", "communication"]),
  icon: z.string().min(1, "Skill icon name is required"),
  description: z.string().min(10, "Skill description too short"),
  mcpEndpoint: z.string().startsWith("mcp://", "MCP endpoint must start with mcp://"),
  installCmd: z.string().startsWith("claw ", "Install command must start with 'claw '"),
  tags: z.array(z.string()).min(1, "At least one tag required"),
  compatibility: z.array(z.string()).min(1, "At least one compatibility entry required"),
  configSnippet: z.string().min(1, "Config snippet is required"),
  featured: z.boolean().optional(),
});

// ── Category schema ──
const CategorySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  icon: z.string().min(1),
});

// ── Validation runner ──
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  stats: {
    patterns: number;
    skills: number;
    categories: number;
  };
}

export function validateAllData(): ValidationResult {
  const errors: string[] = [];

  // Validate community patterns
  const patternIds = new Set<string>();
  for (const pattern of communityPatterns) {
    const result = PatternSchema.safeParse(pattern);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`Pattern "${pattern.id}": ${issue.path.join(".")} — ${issue.message}`);
      }
    }
    if (patternIds.has(pattern.id)) {
      errors.push(`Duplicate pattern ID: "${pattern.id}"`);
    }
    patternIds.add(pattern.id);
  }

  // Validate marketplace skills
  const skillIds = new Set<string>();
  for (const skill of allMarketplaceSkills) {
    const result = SkillSchema.safeParse(skill);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`Skill "${skill.id}": ${issue.path.join(".")} — ${issue.message}`);
      }
    }
    if (skillIds.has(skill.id)) {
      errors.push(`Duplicate skill ID: "${skill.id}"`);
    }
    skillIds.add(skill.id);
  }

  // Validate categories
  for (const cat of skillCategories) {
    const result = CategorySchema.safeParse(cat);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`Category "${cat.id}": ${issue.path.join(".")} — ${issue.message}`);
      }
    }
  }

  // Cross-reference: every skill's category must exist in skillCategories
  const validCategoryIds = new Set(skillCategories.map((c) => c.id));
  for (const skill of allMarketplaceSkills) {
    if (!validCategoryIds.has(skill.category)) {
      errors.push(`Skill "${skill.id}" references unknown category "${skill.category}"`);
    }
  }

  // Log in dev mode
  if (errors.length > 0) {
    console.error(`[data-validation] ${errors.length} errors found:`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
  } else if (import.meta.env.DEV) {
    console.log(
      `[data-validation] ✓ All data valid: ${communityPatterns.length} patterns, ${allMarketplaceSkills.length} skills, ${skillCategories.length} categories`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      patterns: communityPatterns.length,
      skills: allMarketplaceSkills.length,
      categories: skillCategories.length,
    },
  };
}

// Auto-validate on import (fails fast in dev)
if (import.meta.env.DEV) {
  validateAllData();
}
