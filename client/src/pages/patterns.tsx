/**
 * ClawXXX Patterns — "Patterns for a Human-Friendly World"
 * 38 agent templates: 6 core + 32 community patterns
 * Organized by category with section headers
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check,
  Copy,
  Download,
  Globe,
  HandHeart,
  Heart,
  Search,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { resolveIcon } from "@/lib/icon-map";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { getPatternConfig } from "@/data/config-loader";

/* ─── Types ─── */
interface Pattern {
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

interface PatternCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  patterns: Pattern[];
}

/* ─────────────────────────────────────────────────────────────────────
 * CATEGORY 0: Core Patterns (original 6)
 * ───────────────────────────────────────────────────────────────────── */
const corePatterns: Pattern[] = [
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

/* ─────────────────────────────────────────────────────────────────────
 * Community Patterns — imported from generated data
 * ───────────────────────────────────────────────────────────────────── */
import { communityPatterns } from "@/data/community-patterns";

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

const allPatterns: Pattern[] = [...corePatterns, ...communityPatterns];
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
          <div className={`h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center ${pattern.color} group-hover:scale-110 transition-transform`}>
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
            <Heart className="h-3 w-3" />
            {t.patternsWhyMatters}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{pattern.whyItMatters}</p>
        </div>

        {/* Config preview */}
        <details className="group/details">
          <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            {t.patternsViewConfig}
          </summary>
          <pre className="mt-2 p-3 bg-card border border-border rounded-md text-xs font-mono overflow-auto max-h-48 text-muted-foreground">
            {pattern.config}
          </pre>
        </details>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => copy(pattern.config, `claw-${pattern.id}`)} data-testid={`button-download-${pattern.id}`}>
            <Download className="h-3 w-3 mr-1.5" />
            {t.patternsDownloadYaml}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy(pattern.config)} data-testid={`button-copy-${pattern.id}`}>
            {copied ? <Check className="h-3 w-3 mr-1.5 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1.5" />}
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
    <section className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{category.title}</h2>
          <p className="text-xs text-muted-foreground">{category.subtitle}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">
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

  const filteredCategories = useMemo(() => {
    if (searchQuery === "" && activeCategory === "all") return categories;

    return categories
      .map((cat) => {
        if (activeCategory !== "all" && cat.id !== activeCategory) {
          return { ...cat, patterns: [] };
        }
        const filtered = cat.patterns.filter((p) => {
          if (searchQuery === "") return true;
          const q = searchQuery.toLowerCase();
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
  }, [searchQuery, activeCategory]);

  const totalVisible = filteredCategories.reduce((sum, cat) => sum + cat.patterns.length, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 py-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-patterns-title">
            {t.patternsTitle}
          </h1>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.patternsSubtitle}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {t.patternsOpenSource}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {t.patternsHumanFirst}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {t.patternsGovernanceReady}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {allPatterns.length} {t.patternsTotal || "patterns"}
          </span>
        </div>
      </div>

      {/* Search + Category filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.patternsSearch || "Search patterns by name, description, or audience..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-patterns-search"
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
      {filteredCategories.map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}

      {totalVisible === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t.patternsNoResults || "No patterns match your search."}</p>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {t.patternsFooter}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {t.patternsFoundationCredit}{" "}
          <a
            href="https://www.aigovopsfoundation.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            AiGovOps Foundation
          </a>
        </p>
      </div>
    </div>
  );
}
