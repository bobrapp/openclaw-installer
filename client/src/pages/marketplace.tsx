/**
 * ClawXXX Skills Marketplace
 * Browse, preview, and install MCP-compatible skills, connections, and AI provider packages.
 * Uses shared ConfigCard, centralized icon-map, useCopyToClipboard, and full i18n.
 */
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Heart,
  Plug,
  Search,
  Shield,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { resolveIcon } from "@/lib/icon-map";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { ConfigCard } from "@/components/config-card";
import { celebrate } from "@/lib/celebrations";
import { playSound } from "@/lib/sound-engine";
import {
  allMarketplaceSkills,
  skillCategories,
  donationTiers,
  curators,
  type MarketplaceSkill,
  type SkillCategory,
} from "@/data/marketplace-skills";

/* ─── Compatibility badge colors ─── */
const compatColors: Record<string, string> = {
  Claude: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  OpenAI: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  NVIDIA: "bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20",
  Gemini: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Llama: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Mistral: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  Cohere: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

/* ─── Skill Card (wraps ConfigCard with marketplace-specific extras) ─── */
function SkillCard({ skill }: { skill: MarketplaceSkill }) {
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
      testIdPrefix="card-skill"
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
          className="h-6 w-6 p-0 shrink-0"
          onClick={() => {
            copy(skill.installCmd);
            playSound("click");
          }}
          data-testid={`button-copy-cmd-${skill.id}`}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* MCP Endpoint */}
      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
        <Plug className="h-3 w-3" />
        <span className="font-mono">{skill.mcpEndpoint}</span>
      </div>
    </ConfigCard>
  );
}

/* ─── Category Section ─── */
function CategorySection({
  category,
  skills,
}: {
  category: (typeof skillCategories)[number];
  skills: MarketplaceSkill[];
}) {
  const Icon = resolveIcon(category.icon);
  if (skills.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{category.title}</h2>
          <p className="text-xs text-muted-foreground">{category.subtitle}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">
          {skills.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </section>
  );
}

/* ─── Donation Section ─── */
function DonationSection() {
  const { t } = useI18n();
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="text-center space-y-3 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              {t.mktDonationTitle || "Buy the Foundation a Drink"}
            </h2>
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t.mktDonationDesc || "Every skill in this marketplace is free and open-source. If ClawXXX helps your team, consider supporting the AiGovOps Foundation with a small donation — pick your local favorite."}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {donationTiers.map((tier) => (
            <a
              key={tier.id}
              href={tier.stripeStub}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-center"
              data-testid={`button-donate-${tier.id}`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {tier.emoji}
              </span>
              <span className="text-sm font-medium">{tier.drink}</span>
              <span className="text-[10px] text-muted-foreground">{tier.region}</span>
              <Badge variant="outline" className="text-[10px] mt-1">
                ${tier.amount}
              </Badge>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-4">
          {t.mktDonationPowered || "Powered by Stripe. All donations go directly to the AiGovOps Foundation, a 501(c)(3) equivalent."}
        </p>
      </div>
    </section>
  );
}

/* ─── Curator Section ─── */
function CuratorSection() {
  const { t } = useI18n();
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t.mktCuratorsTitle || "Community Curators"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t.mktCuratorsDesc || "Have a skill to share? Reach out to our curators or submit directly."}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {curators.map((curator) => (
          <Card key={curator.email} className="hover:border-primary/30 transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {curator.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{curator.name}</p>
                <p className="text-xs text-muted-foreground">{curator.role}</p>
                <a
                  href={`mailto:${curator.email}`}
                  className="text-xs text-primary hover:underline truncate block"
                >
                  {curator.email}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="hover:border-primary/30 transition-all border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.mktSubmitSkill || "Submit a Skill"}</p>
              <p className="text-xs text-muted-foreground">
                {t.mktSubmitSkillDesc || "Share your MCP package with the community"}
              </p>
              <a
                href="mailto:skills@aigovops.community?subject=ClawXXX%20Skill%20Submission"
                className="text-xs text-primary hover:underline"
              >
                skills@aigovops.community
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">("all");
  const { t } = useI18n();

  const filtered = useMemo(() => {
    return allMarketplaceSkills.filter((skill) => {
      const matchesSearch =
        searchQuery === "" ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        skill.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "all" || skill.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const categoryFilters = useMemo(() => {
    return [
      { id: "all" as const, label: t.mktAllSkills || "All Skills", count: allMarketplaceSkills.length },
      ...skillCategories.map((cat) => ({
        id: cat.id,
        label: cat.title,
        count: allMarketplaceSkills.filter((s) => s.category === cat.id).length,
      })),
    ];
  }, [t]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 py-4">
        <div className="flex items-center justify-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-marketplace-title">
            {t.marketplaceTitle || "Skills Marketplace"}
          </h1>
          <Store className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t.marketplaceSubtitle || "MCP-compatible connections, AI provider skills, and community packages — install with one command, configure with standard YAML."}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Plug className="h-3 w-3" />
            {t.marketplaceMcpNative || "MCP Native"}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {t.marketplaceGovernanceReady || "Governance Ready"}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {t.marketplaceOpenSource || "Open Source"}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {allMarketplaceSkills.length} {t.marketplaceSkillCount || "skills"}
          </span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.marketplaceSearch || "Search skills, providers, or tags..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-marketplace-search"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={activeCategory === cat.id ? "default" : "outline"}
              className="text-xs"
              onClick={() => {
                setActiveCategory(cat.id);
                playSound("click");
              }}
              data-testid={`button-filter-${cat.id}`}
            >
              {cat.label}
              <Badge
                variant="secondary"
                className="ml-1.5 text-[10px] h-4 min-w-[1rem] px-1"
              >
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Skill grid — by category or flat if filtered */}
      {activeCategory === "all" && searchQuery === "" ? (
        skillCategories.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            skills={allMarketplaceSkills.filter((s) => s.category === cat.id)}
          />
        ))
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t.mktNoResults || "No skills match your search."}</p>
              <p className="text-xs mt-1">{t.mktNoResultsHint || "Try a different query or browse all categories."}</p>
            </div>
          )}
        </div>
      )}

      {/* Donation */}
      <DonationSection />

      {/* Community Curators */}
      <CuratorSection />

      {/* Footer */}
      <div className="text-center py-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {t.marketplaceFooter || "All skills follow MCP (Model Context Protocol) standards. Configs are portable across any MCP-compatible host."}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {t.mktCuratedBy || "Curated by the"}{" "}
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
