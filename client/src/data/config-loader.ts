/**
 * Config Loader — Loads externalized YAML configs via Vite glob imports.
 * Pattern and skill configs live in /data/configs/{patterns,skills}/*.yaml
 * and are imported as raw strings at build time.
 */

// Vite glob imports — resolved at build time, no runtime cost
const patternConfigs = import.meta.glob<string>("./configs/patterns/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});

const skillConfigs = import.meta.glob<string>("./configs/skills/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Extract the filename (without extension) from a glob path */
function extractId(path: string): string {
  const filename = path.split("/").pop() || "";
  return filename.replace(/\.yaml$/, "");
}

// Build lookup maps: id -> raw YAML string
const patternConfigMap = new Map<string, string>();
for (const [path, content] of Object.entries(patternConfigs)) {
  patternConfigMap.set(extractId(path), content);
}

const skillConfigMap = new Map<string, string>();
for (const [path, content] of Object.entries(skillConfigs)) {
  skillConfigMap.set(extractId(path), content);
}

/**
 * Get a pattern's YAML config by id.
 * Falls back to empty string if not found.
 */
export function getPatternConfig(id: string): string {
  return patternConfigMap.get(id) || "";
}

/**
 * Get a skill's YAML config by id.
 * Falls back to empty string if not found.
 */
export function getSkillConfig(id: string): string {
  return skillConfigMap.get(id) || "";
}

/** Check if a pattern config exists */
export function hasPatternConfig(id: string): boolean {
  return patternConfigMap.has(id);
}

/** Check if a skill config exists */
export function hasSkillConfig(id: string): boolean {
  return skillConfigMap.has(id);
}
