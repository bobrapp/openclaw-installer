/**
 * ClawXXX Patterns — "Patterns for a Human-Friendly World"
 * 38 agent templates: 6 core + 32 community patterns
 * Organized by category with section headers
 */
import { useState, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
  Copy,
  Download,
  Globe,
  Heart,
  Search,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { resolveIcon } from "@/lib/icon-map";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { PageHero } from "@/components/page-hero";
import { PageFooter } from "@/components/page-footer";
import { allPatterns, type PatternEntry } from "@/lib/data-access";
type Pattern = PatternEntry;

interface PatternCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  patterns: Pattern[];
}

/* Core patterns are sourced from data-access.ts — no local definition needed */


/* ─────────────────────────────────────────────────────────────────────
 * Organize into categories
 * ───────────────────────────────────────────────────────────────────── */
const categoryDefs: { id: string; title: string; subtitle: string; icon: string; ids: string[] }[] = [
  {
    id: "core",
    title: "Core Patterns",
    subtitle: "Foundational agent templates for every team",
    icon: "Sparkles",
    ids: ["greeter", "guardian", "storyteller", "teacher", "peacekeeper", "celebrator"],
  },
  {
    id: "indigenous",
    title: "Indigenous & First Peoples",
    subtitle: "Honoring oral traditions, land stewardship, and intergenerational wisdom",
    icon: "Feather",
    ids: ["the-elder", "the-dreamkeeper", "the-pathfinder", "the-circle-keeper", "the-land-walker", "the-song-carrier", "the-bridge-builder"],
  },
  {
    id: "earth",
    title: "Earth-Centered & Nature Traditions",
    subtitle: "Celebrating seasonal rhythms, nature connection, and ancestral practices",
    icon: "Sprout",
    ids: ["the-green-weaver", "the-spirit-listener", "the-season-turner", "the-hearth-keeper"],
  },
  {
    id: "makers",
    title: "Maker & Craft Cultures",
    subtitle: "For bakers, knitters, woodworkers, potters, tinkerers, and gardeners",
    icon: "Hammer",
    ids: ["the-baker", "the-fiber-artist", "the-woodworker", "the-potter", "the-tinkerer", "the-garden-tender"],
  },
  {
    id: "animals",
    title: "Animal Lover Communities",
    subtitle: "Dog lovers, birders, marine enthusiasts, and farm folk",
    icon: "Dog",
    ids: ["the-pack-leader", "the-bird-watcher", "the-reef-guardian", "the-barn-keeper"],
  },
  {
    id: "world",
    title: "World Hobby Cultures",
    subtitle: "Signature crafts and traditions from the 10 most populous nations",
    icon: "Globe",
    ids: ["the-rangoli-maker", "the-calligrapher", "the-pitmaster", "the-batik-weaver", "the-cricket-coach", "the-drum-caller", "the-samba-heart", "the-rickshaw-poet", "the-samovar-host", "the-coffee-roaster"],
  },
  {
    id: "rotary",
    title: "Service & Ethics",
    subtitle: "Rotary International and the Four-Way Test",
    icon: "Scale",
    ids: ["the-four-way-tester"],
  },
];

const patternMap = new Map(allPatterns.map((p) => [p.id, p]));

const categories: PatternCategory[] = categoryDefs.map((def) => ({
  id: def.id,
  title: def.title,
  subtitle: def.subtitle,
  icon: def.icon,
  patterns: def.ids.map((id) => patternMap.get(id)).filter(Boolean) as Pattern[],
}));

/* ─── Helpers ─── */
function PatternCard({ pattern }: { pattern: Pattern }) {
  const Icon = resolveIcon(pattern.icon);
  const { t } = useI18n();
  const { copy, copied } = useCopyToClipboard({ fallbackFilename: `claw-${pattern.id}` });

  return (
    <Card
      className="group hover:border-primary/30 transition-all duration-300 hover:shadow-md"
      data-testid={`card-pattern-${pattern.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center ${pattern.color} group-hover:scale-110 transition-transform`} aria-hidden="true">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{pattern.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5 italic">
              "{pattern.tagline}"
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">{pattern.description}</p>

        <div>
          <Badge variant="secondary" className="text-xs font-normal mb-2">
            {pattern.audience}
          </Badge>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5 mb-1">
            <Heart className="h-3 w-3" aria-hidden="true" />
            {t.patternsWhyMatters}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{pattern.whyItMatters}</p>
        </div>

        {/* Config preview */}
        <details className="group/details">
          <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            {t.patternsViewConfig}
          </summary>
          <pre className="mt-2 p-3 bg-card border border-border rounded-md text-xs font-mono overflow-auto max-h-48 text-muted-foreground">
            {pattern.config}
          </pre>
        </details>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copy(pattern.config, `claw-${pattern.id}`)}
            data-testid={`button-download-${pattern.id}`}
            aria-label={`Download YAML config for ${pattern.name}`}
          >
            <Download className="h-3 w-3 me-1.5" aria-hidden="true" />
            {t.patternsDownloadYaml}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copy(pattern.config)}
            data-testid={`button-copy-${pattern.id}`}
            aria-label={copied ? `Copied config for ${pattern.name}` : `Copy config for ${pattern.name}`}
          >
            {copied ? <Check className="h-3 w-3 me-1.5 text-emerald-500" aria-hidden="true" /> : <Copy className="h-3 w-3 me-1.5" aria-hidden="true" />}
            {copied ? t.patternsCopied : t.patternsCopy}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Category Section ─── */
function CategorySection({ category }: { category: PatternCategory }) {
  const Icon = resolveIcon(category.icon);
  return (
    <section className="space-y-4" aria-labelledby={`cat-heading-${category.id}`}>
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        <div>
          <h2 id={`cat-heading-${category.id}`} className="text-lg font-semibold tracking-tight">{category.title}</h2>
          <p className="text-xs text-muted-foreground">{category.subtitle}</p>
        </div>
        <Badge variant="outline" className="ms-auto text-xs">
          {category.patterns.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {category.patterns.map((p) => (
          <PatternCard key={p.id} pattern={p} />
        ))}
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function Patterns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { t } = useI18n();
  const debouncedSearch = useDebouncedValue(searchQuery, 200);

  const filteredCategories = useMemo(() => {
    if (debouncedSearch === "" && activeCategory === "all") return categories;

    return categories
      .map((cat) => {
        if (activeCategory !== "all" && cat.id !== activeCategory) {
          return { ...cat, patterns: [] };
        }
        const filtered = cat.patterns.filter((p) => {
          if (debouncedSearch === "") return true;
          const q = debouncedSearch.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.audience.toLowerCase().includes(q) ||
            p.tagline.toLowerCase().includes(q)
          );
        });
        return { ...cat, patterns: filtered };
      })
      .filter((cat) => cat.patterns.length > 0);
  }, [debouncedSearch, activeCategory]);

  const totalVisible = filteredCategories.reduce((sum, cat) => sum + cat.patterns.length, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Hero */}
      <PageHero
        icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />}
        title={t.patternsTitle}
        subtitle={t.patternsSubtitle}
        badges={[
          { icon: <Globe className="h-3 w-3" aria-hidden="true" />, label: t.patternsOpenSource },
          { icon: <Heart className="h-3 w-3" aria-hidden="true" />, label: t.patternsHumanFirst },
          { icon: <Shield className="h-3 w-3" aria-hidden="true" />, label: t.patternsGovernanceReady },
          { icon: <Users className="h-3 w-3" aria-hidden="true" />, label: `${allPatterns.length} ${t.patternsTotal || "patterns"}` },
        ]}
        testId="text-patterns-title"
      />

      {/* Search + Category filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t.patternsSearch || "Search patterns by name, description, or audience..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
            data-testid="input-patterns-search"
            aria-label={t.patternsSearch || "Search patterns by name, description, or audience"}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: "all", title: t.patternsAllCategories || "All" }, ...categoryDefs.map((c) => ({ id: c.id, title: c.title }))].map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={activeCategory === cat.id ? "default" : "outline"}
              className="text-xs"
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              data-testid={`button-filter-${cat.id}`}
            >
              {cat.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Category sections */}
      <div aria-live="polite" aria-atomic="false">
        {filteredCategories.map((cat) => (
          <CategorySection key={cat.id} category={cat} />
        ))}

        {totalVisible === 0 && (
          <div className="text-center py-12 text-muted-foreground" role="status">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm">{t.patternsNoResults || "No patterns match your search."}</p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <PageFooter
        text={t.patternsFooter}
        foundationCredit={t.patternsFoundationCredit}
      />
    </div>
  );
}
