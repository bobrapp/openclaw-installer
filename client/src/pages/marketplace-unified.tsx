/**
 * Unified Marketplace Page
 * Consolidates Agents (patterns), Connectors (skills), Hosting providers,
 * and 1-Click Deploy bundles into a single tabbed page.
 *
 * Tabs: All | Agents | Connectors | Hosting | 1-Click Deploy
 */
import { useState, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Copy,
  ExternalLink,
  Plug,
  Rocket,
  Search,
  Server,
  Sparkles,
  Store,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { resolveIcon } from "@/lib/icon-map";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { ConfigCard } from "@/components/config-card";
import { PageHero } from "@/components/page-hero";
import { PageFooter } from "@/components/page-footer";
import { playSound } from "@/lib/sound-engine";
import { allMarketplaceSkills, type MarketplaceSkill, type SkillCategory } from "@/data/marketplace-skills";
import { getSkillCategories, allPatterns, type PatternEntry } from "@/lib/data-access";
import { hostingEntries, oneClickBundles, type MarketplaceEntry } from "@/data/marketplace-unified";

// ── Compatibility badge colors (connectors tab) ──
const compatColors: Record<string, string> = {
  Claude: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  OpenAI: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  NVIDIA: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20",
  Gemini: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Llama: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Mistral: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  Cohere: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

// ── Deploy type labels ──
const deployTypeLabel: Record<string, string> = {
  paas: "PaaS",
  "vps-cloudinit": "Cloud-Init VPS",
  "vps-manual": "Manual VPS",
  "cloud-api": "Cloud API",
};

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

/** Connector card — wraps ConfigCard with marketplace-specific extras */
function ConnectorCard({ skill }: { skill: MarketplaceSkill }) {
  const { t } = useI18n();
  const { copy, copied } = useCopyToClipboard({ fallbackFilename: `claw-${skill.id}-cmd` });

  return (
    <ConfigCard
      id={skill.id}
      name={skill.name}
      subtitle={`${t.mktByProvider || "by"} ${skill.provider}`}
      icon={skill.icon}
      description={skill.description}
      config={skill.configSnippet}
      featured={skill.featured}
      testIdPrefix="card-connector"
      badges={
        <>
          {/* Compatibility badges */}
          <div className="flex flex-wrap gap-1.5">
            {skill.compatibility.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className={`text-[10px] font-medium ${compatColors[c] || ""}`}
              >
                {c}
              </Badge>
            ))}
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      }
    >
      {/* MCP Install command */}
      <div className="bg-muted/50 rounded-lg p-2.5 border border-border/50 font-mono text-xs flex items-center justify-between gap-2">
        <code className="text-primary truncate">{skill.installCmd}</code>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            copy(skill.installCmd);
            playSound("click");
          }}
          aria-label={`Copy install command for ${skill.name}`}
          data-testid={`button-copy-cmd-${skill.id}`}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* MCP Endpoint */}
      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
        <Plug className="h-3 w-3" aria-hidden="true" />
        <span className="font-mono">{skill.mcpEndpoint}</span>
      </div>
    </ConfigCard>
  );
}

/** Agent card — shows pattern info with YAML config */
function AgentCard({ pattern }: { pattern: PatternEntry }) {
  return (
    <ConfigCard
      id={pattern.id}
      name={pattern.name}
      subtitle={pattern.tagline}
      icon={pattern.icon}
      iconColor={pattern.color}
      description={pattern.description}
      config={pattern.config}
      testIdPrefix="card-agent"
    />
  );
}

/** Hosting card — shows provider info with price and specs */
function HostingCard({ entry }: { entry: MarketplaceEntry }) {
  const { t } = useI18n();
  const Icon = resolveIcon(entry.icon);

  return (
    <Card
      className={`group hover:border-primary/30 transition-all duration-300 hover:shadow-md ${
        entry.featured ? "ring-1 ring-primary/20" : ""
      }`}
      data-testid={`card-hosting-${entry.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base truncate">{entry.name}</CardTitle>
              {entry.featured && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                  {t.mktFeatured || "Featured"}
                </Badge>
              )}
              {entry.freeCredits && (
                <Badge variant="outline" className="text-[10px] shrink-0 text-emerald-600 border-emerald-500/30">
                  {entry.freeCredits}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">{entry.provider}</CardDescription>
          </div>
          {/* Price badge */}
          {entry.price && (
            <div className="text-end shrink-0">
              <span className="text-sm font-semibold text-primary">{entry.price}</span>
              {entry.priceNote && (
                <p className="text-[10px] text-muted-foreground">{entry.priceNote}</p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/80 leading-relaxed">{entry.description}</p>

        {/* Specs */}
        {entry.specs && entry.specs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.specs.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-[10px]">
                {spec}
              </Badge>
            ))}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Deploy type */}
        {entry.deployType && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Server className="h-3 w-3" aria-hidden="true" />
            <span>{deployTypeLabel[entry.deployType] || entry.deployType}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
              data-testid={`button-hosting-link-${entry.id}`}
            >
              <Button size="sm" className="w-full text-xs" variant="outline">
                <ExternalLink className="h-3 w-3 me-1.5" aria-hidden="true" />
                {t.mktViewDetails || "View Details"}
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** 1-Click Bundle card */
function BundleCard({ entry }: { entry: MarketplaceEntry }) {
  const { t } = useI18n();
  const Icon = resolveIcon(entry.icon);

  const agentCount = entry.bundleAgents?.length ?? 0;
  const connectorCount = entry.bundleConnectors?.length ?? 0;
  const supportedHosts = entry.deployTargets?.filter((d) => d.supported) ?? [];

  return (
    <Card
      className={`group hover:border-primary/30 transition-all duration-300 hover:shadow-md ${
        entry.featured ? "ring-1 ring-primary/20" : ""
      }`}
      data-testid={`card-bundle-${entry.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{entry.name}</CardTitle>
              {entry.featured && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                  {t.mktFeatured || "Featured"}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">{entry.provider}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/80 leading-relaxed">{entry.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Estimated cost */}
        {entry.estimatedCost && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-muted-foreground">{t.mktEstCost || "Est. Cost"}:</span>
            <span className="text-primary font-semibold">{entry.estimatedCost}</span>
          </div>
        )}

        {/* Includes counts */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">{t.mktIncludes || "Includes"}:</span>
          {agentCount > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {agentCount} agent{agentCount !== 1 ? "s" : ""}
            </span>
          )}
          {connectorCount > 0 && (
            <span className="flex items-center gap-1">
              <Plug className="h-3 w-3" aria-hidden="true" />
              {connectorCount} connector{connectorCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Supported hosts with deploy time */}
        {supportedHosts.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t.mktSupportsHosts || "Supported Hosts"}:</p>
            <div className="flex flex-wrap gap-1.5">
              {supportedHosts.map((dt) => (
                <Badge
                  key={dt.hostId}
                  variant={dt.oneClickAvailable ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {dt.hostId}
                  {dt.oneClickAvailable && ` ~${dt.estimatedMinutes}min`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Deploy Now button */}
        <div className="pt-1">
          <a href="/deploy" data-testid={`button-deploy-${entry.id}`}>
            <Button size="sm" className="w-full text-xs">
              <Rocket className="h-3 w-3 me-1.5" aria-hidden="true" />
              {t.mktDeployNow || "Deploy Now"}
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

/** All tab — unified card for any entry type */
function AllEntryCard({ entry }: { entry: PatternEntry | MarketplaceSkill | MarketplaceEntry }) {
  const { t } = useI18n();

  // Determine which card type to render
  if ("kind" in entry) {
    if (entry.kind === "hosting") return <HostingCard entry={entry as MarketplaceEntry} />;
    if (entry.kind === "one-click") return <BundleCard entry={entry as MarketplaceEntry} />;
  }
  if ("mcpEndpoint" in entry) {
    return <ConnectorCard skill={entry as MarketplaceSkill} />;
  }
  if ("config" in entry && "audience" in entry) {
    return <AgentCard pattern={entry as PatternEntry} />;
  }
  return null;
}

/** Empty state shown when search yields no results */
function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="col-span-2 text-center py-16 text-muted-foreground" role="status">
      <Search className="h-8 w-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 opacity-70">{hint}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Category section for Connectors tab
// ─────────────────────────────────────────────────────────────────

interface SkillCategoryDef {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

function ConnectorCategorySection({
  category,
  skills,
}: {
  category: SkillCategoryDef;
  skills: MarketplaceSkill[];
}) {
  const Icon = resolveIcon(category.icon);
  if (skills.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby={`cat-heading-${category.id}`}>
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        <div>
          <h2
            id={`cat-heading-${category.id}`}
            className="text-lg font-semibold tracking-tight"
          >
            {category.title}
          </h2>
          <p className="text-xs text-muted-foreground">{category.subtitle}</p>
        </div>
        <Badge variant="outline" className="ms-auto text-xs">
          {skills.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {skills.map((skill) => (
          <ConnectorCard key={skill.id} skill={skill} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Agent group headings
// ─────────────────────────────────────────────────────────────────

const CORE_AGENT_IDS = ["greeter", "guardian", "storyteller", "teacher", "peacekeeper", "celebrator"];

function AgentGroupSection({
  title,
  patterns,
}: {
  title: string;
  patterns: PatternEntry[];
}) {
  if (patterns.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <Badge variant="outline" className="ms-auto text-xs">
          {patterns.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {patterns.map((p) => (
          <AgentCard key={p.id} pattern={p} />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────

export default function MarketplaceUnified() {
  const { t, dir } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeConnectorCategory, setActiveConnectorCategory] = useState<SkillCategory | "all">("all");
  const debouncedSearch = useDebouncedValue(searchQuery, 200);

  const skillCategories = getSkillCategories();

  // ── Data counts (for tab badges) ──
  const totalAgents = allPatterns.length;
  const totalConnectors = allMarketplaceSkills.length;
  const totalHosting = hostingEntries.length;
  const totalBundles = oneClickBundles.length;
  const totalAll = totalAgents + totalConnectors + totalHosting + totalBundles;

  // ── Filtering helpers ──
  const matchesSearch = (fields: string[]): boolean => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return fields.some((f) => f.toLowerCase().includes(q));
  };

  // All tab — flat merged list
  const allEntries = useMemo(() => {
    const agents = allPatterns.filter((p) =>
      matchesSearch([p.name, p.tagline, p.description, p.audience])
    );
    const connectors = allMarketplaceSkills.filter((s) =>
      matchesSearch([s.name, s.description, s.provider, ...s.tags])
    );
    const hosting = hostingEntries.filter((h) =>
      matchesSearch([h.name, h.description, h.provider, ...h.tags])
    );
    const bundles = oneClickBundles.filter((b) =>
      matchesSearch([b.name, b.description, b.provider, ...b.tags])
    );
    return [...agents, ...connectors, ...hosting, ...bundles];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Agents tab
  const filteredAgents = useMemo(
    () =>
      allPatterns.filter((p) =>
        matchesSearch([p.name, p.tagline, p.description, p.audience])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch]
  );
  const coreAgents = filteredAgents.filter((p) => CORE_AGENT_IDS.includes(p.id));
  const communityAgents = filteredAgents.filter((p) => !CORE_AGENT_IDS.includes(p.id));

  // Connectors tab
  const filteredConnectors = useMemo(
    () =>
      allMarketplaceSkills.filter((s) => {
        const matchesCat =
          activeConnectorCategory === "all" || s.category === activeConnectorCategory;
        const matchesSrch = matchesSearch([s.name, s.description, s.provider, ...s.tags]);
        return matchesCat && matchesSrch;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, activeConnectorCategory]
  );

  // Hosting tab
  const filteredHosting = useMemo(
    () =>
      hostingEntries.filter((h) =>
        matchesSearch([h.name, h.description, h.provider, ...h.tags])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch]
  );

  // 1-Click tab
  const filteredBundles = useMemo(
    () =>
      oneClickBundles.filter((b) =>
        matchesSearch([b.name, b.description, b.provider, ...b.tags])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch]
  );

  // Connector category filters
  const connectorCategoryFilters = useMemo(
    () => [
      {
        id: "all" as const,
        label: t.mktAllSkills || "All",
        count: allMarketplaceSkills.length,
      },
      ...skillCategories.map((cat) => ({
        id: cat.id,
        label: cat.title,
        count: allMarketplaceSkills.filter((s) => s.category === cat.id).length,
      })),
    ],
    [t, skillCategories]
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" dir={dir}>
      {/* Hero */}
      <PageHero
        icon={<Store className="h-5 w-5 text-primary" aria-hidden="true" />}
        title={t.unifiedMarketplaceTitle || "Marketplace"}
        subtitle={
          t.unifiedMarketplaceSubtitle ||
          "Agents, connectors, hosting providers, and 1-click deploy bundles — everything you need in one place."
        }
        badges={[
          {
            icon: <Sparkles className="h-3 w-3" aria-hidden="true" />,
            label: `${totalAgents} agents`,
          },
          {
            icon: <Plug className="h-3 w-3" aria-hidden="true" />,
            label: `${totalConnectors} connectors`,
          },
          {
            icon: <Server className="h-3 w-3" aria-hidden="true" />,
            label: `${totalHosting} hosts`,
          },
          {
            icon: <Rocket className="h-3 w-3" aria-hidden="true" />,
            label: `${totalBundles} bundles`,
          },
        ]}
        testId="text-unified-marketplace-title"
      />

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search agents, connectors, providers, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
          data-testid="input-unified-marketplace-search"
          aria-label="Search marketplace"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          playSound("click");
        }}
        className="space-y-6"
      >
        <TabsList
          className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg"
          aria-label="Marketplace sections"
          data-testid="tabs-unified-marketplace"
        >
          {/* All */}
          <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs" data-testid="tab-all">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            {t.tabAll || "All"}
            <Badge variant="secondary" className="ms-0.5 text-[10px] h-4 min-w-[1.25rem] px-1">
              {totalAll}
            </Badge>
          </TabsTrigger>

          {/* Agents */}
          <TabsTrigger value="agents" className="flex items-center gap-1.5 text-xs" data-testid="tab-agents">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t.tabAgents || "Agents"}
            <Badge variant="secondary" className="ms-0.5 text-[10px] h-4 min-w-[1.25rem] px-1">
              {totalAgents}
            </Badge>
          </TabsTrigger>

          {/* Connectors */}
          <TabsTrigger value="connectors" className="flex items-center gap-1.5 text-xs" data-testid="tab-connectors">
            <Plug className="h-3.5 w-3.5" aria-hidden="true" />
            {t.tabConnectors || "Connectors"}
            <Badge variant="secondary" className="ms-0.5 text-[10px] h-4 min-w-[1.25rem] px-1">
              {totalConnectors}
            </Badge>
          </TabsTrigger>

          {/* Hosting */}
          <TabsTrigger value="hosting" className="flex items-center gap-1.5 text-xs" data-testid="tab-hosting">
            <Server className="h-3.5 w-3.5" aria-hidden="true" />
            {t.tabHosting || "Hosting"}
            <Badge variant="secondary" className="ms-0.5 text-[10px] h-4 min-w-[1.25rem] px-1">
              {totalHosting}
            </Badge>
          </TabsTrigger>

          {/* 1-Click Deploy */}
          <TabsTrigger value="one-click" className="flex items-center gap-1.5 text-xs" data-testid="tab-one-click">
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            {t.tabOneClick || "1-Click Deploy"}
            <Badge variant="secondary" className="ms-0.5 text-[10px] h-4 min-w-[1.25rem] px-1">
              {totalBundles}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── All tab ── */}
        <TabsContent value="all">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            aria-live="polite"
            aria-atomic="false"
          >
            {allEntries.map((entry, idx) => (
              <AllEntryCard
                key={
                  "id" in entry
                    ? (entry as MarketplaceSkill | MarketplaceEntry).id
                    : (entry as PatternEntry).id
                }
                entry={entry}
              />
            ))}
            {allEntries.length === 0 && (
              <EmptyState
                message={t.mktNoResults || "No results match your search."}
                hint={t.mktNoResultsHint || "Try a different query or browse the tabs."}
              />
            )}
          </div>
        </TabsContent>

        {/* ── Agents tab ── */}
        <TabsContent value="agents">
          <div className="space-y-10" aria-live="polite" aria-atomic="false">
            {filteredAgents.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <EmptyState
                  message={t.mktNoResults || "No agents match your search."}
                  hint={t.mktNoResultsHint || "Try a different query."}
                />
              </div>
            ) : (
              <>
                <AgentGroupSection title="Core Agents" patterns={coreAgents} />
                <AgentGroupSection title="Community Agents" patterns={communityAgents} />
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Connectors tab ── */}
        <TabsContent value="connectors">
          <div className="space-y-6" aria-live="polite" aria-atomic="false">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {connectorCategoryFilters.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={activeConnectorCategory === cat.id ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => {
                    setActiveConnectorCategory(cat.id as SkillCategory | "all");
                    playSound("click");
                  }}
                  aria-pressed={activeConnectorCategory === cat.id}
                  data-testid={`button-connector-filter-${cat.id}`}
                >
                  {cat.label}
                  <Badge variant="secondary" className="ms-1.5 text-[10px] h-4 min-w-[1rem] px-1">
                    {cat.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Results */}
            {activeConnectorCategory === "all" && debouncedSearch === "" ? (
              <div className="space-y-10">
                {skillCategories.map((cat) => (
                  <ConnectorCategorySection
                    key={cat.id}
                    category={cat}
                    skills={allMarketplaceSkills.filter((s) => s.category === cat.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredConnectors.map((skill) => (
                  <ConnectorCard key={skill.id} skill={skill} />
                ))}
                {filteredConnectors.length === 0 && (
                  <EmptyState
                    message={t.mktNoResults || "No connectors match your search."}
                    hint={t.mktNoResultsHint || "Try a different query or browse all categories."}
                  />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Hosting tab ── */}
        <TabsContent value="hosting">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            aria-live="polite"
            aria-atomic="false"
          >
            {filteredHosting.map((entry) => (
              <HostingCard key={entry.id} entry={entry} />
            ))}
            {filteredHosting.length === 0 && (
              <EmptyState
                message={t.mktNoResults || "No hosting providers match your search."}
                hint={t.mktNoResultsHint || "Try a different query."}
              />
            )}
          </div>
        </TabsContent>

        {/* ── 1-Click Deploy tab ── */}
        <TabsContent value="one-click">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            aria-live="polite"
            aria-atomic="false"
          >
            {filteredBundles.map((entry) => (
              <BundleCard key={entry.id} entry={entry} />
            ))}
            {filteredBundles.length === 0 && (
              <EmptyState
                message={t.mktNoResults || "No bundles match your search."}
                hint={t.mktNoResultsHint || "Try a different query."}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <PageFooter
        text={
          t.marketplaceFooter ||
          "All skills follow MCP (Model Context Protocol) standards. Configs are portable across any MCP-compatible host."
        }
        foundationCredit={t.mktCuratedBy || "Curated by the"}
      />
    </div>
  );
}
