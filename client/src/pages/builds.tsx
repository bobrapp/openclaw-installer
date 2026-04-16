/**
 * Build Catalog — All known OpenClaw deployment builds/variations.
 * Shows build cards, recommended picks, filters, and a comparison table.
 */
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExternalLink,
  Search,
  Star,
  Users,
  Zap,
  Server,
  Cloud,
  Box,
  Laptop,
  Layers,
  Globe,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Terminal,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

/* ─── Types ─── */
type Category = "self-hosted" | "managed" | "PaaS" | "local";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type PriceRange = "free" | "low" | "mid" | "any";

interface Build {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: Category;
  description: string;
  features: string[];
  pricing: string;
  priceRange: PriceRange;
  difficulty: Difficulty;
  learnMoreUrl: string;
  regions: string[];
  stars?: number;
  users?: string;
  commits?: number;
  highlighted?: boolean;
}

/* ─── Data ─── */
const BUILDS: Build[] = [
  {
    id: "openclaw-core",
    name: "OpenClaw Core",
    icon: <GitBranch className="h-5 w-5" />,
    category: "self-hosted",
    description:
      "The original open-source OpenClaw framework. Full control over your deployment, data, and configuration. Requires a server or VPS to run.",
    features: ["Full source access", "Plugin API", "Model agnostic", "Self-healing"],
    pricing: "Free (self-hosted) + API costs",
    priceRange: "free",
    difficulty: "Advanced",
    learnMoreUrl: "https://github.com/openclaw/openclaw",
    regions: ["Global"],
    stars: 188000,
  },
  {
    id: "alphaclaw",
    name: "AlphaClaw",
    icon: <Layers className="h-5 w-5" />,
    category: "self-hosted",
    description:
      "Docker harness with a self-healing watchdog, setup UI, Git sync, and multi-agent management. Ships with Railway and Render one-click templates.",
    features: ["Self-healing watchdog", "Setup UI", "Git sync", "Multi-agent"],
    pricing: "Free (self-hosted)",
    priceRange: "free",
    difficulty: "Intermediate",
    learnMoreUrl: "https://github.com/chrysb/alphaclaw",
    regions: ["Global"],
    commits: 459,
  },
  {
    id: "clawhost",
    name: "ClawHost",
    icon: <Server className="h-5 w-5" />,
    category: "self-hosted",
    description:
      "Community-maintained 1-click self-hosted wrapper. Designed to get OpenClaw running on any Linux server with minimal configuration.",
    features: ["1-click install", "Community support", "Lightweight", "Open source"],
    pricing: "Free",
    priceRange: "free",
    difficulty: "Beginner",
    learnMoreUrl: "https://github.com/clawhost/clawhost",
    regions: ["Global"],
    stars: 200,
  },
  {
    id: "clawtank",
    name: "ClawTank",
    icon: <Cloud className="h-5 w-5" />,
    category: "managed",
    description:
      "Managed cloud deployment with a 60-second first-message guarantee. Zero infrastructure management — just connect and start building.",
    features: ["60s deploy", "Managed infra", "Auto-updates", "Monitoring"],
    pricing: "Freemium",
    priceRange: "free",
    difficulty: "Beginner",
    learnMoreUrl: "https://clawtank.dev",
    regions: ["US", "EU"],
    users: "2k+",
  },
  {
    id: "digitalocean",
    name: "DigitalOcean 1-Click",
    icon: <Cloud className="h-5 w-5" />,
    category: "managed",
    description:
      "Official Marketplace image with Docker-isolated containers, automatic TLS, and gateway authentication. One click from the DO Marketplace.",
    features: ["Docker-isolated", "Auto TLS", "Gateway auth", "Droplet snapshots"],
    pricing: "From $12/mo",
    priceRange: "low",
    difficulty: "Beginner",
    learnMoreUrl: "https://marketplace.digitalocean.com",
    regions: ["US", "EU", "APAC", "Canada"],
    users: "10k+",
  },
  {
    id: "tencent",
    name: "Tencent Cloud Lighthouse",
    icon: <Globe className="h-5 w-5" />,
    category: "managed",
    description:
      "OpenClaw template under the Tencent Cloud Lighthouse 'AI Agent' category. Optimised for China and Asia-Pacific latency requirements.",
    features: ["China optimized", "AI Agent template", "Lighthouse console", "Low latency"],
    pricing: "From $4–10/mo",
    priceRange: "low",
    difficulty: "Beginner",
    learnMoreUrl: "https://www.tencentcloud.com/products/lighthouse",
    regions: ["China", "Hong Kong", "Singapore", "Japan", "South Korea"],
  },
  {
    id: "railway",
    name: "Railway Template",
    icon: <Zap className="h-5 w-5" />,
    category: "PaaS",
    description:
      "GitHub-connected PaaS deploy. Push to main and Railway auto-builds and deploys. Free tier available; hobby plan at $5/mo.",
    features: ["GitHub auto-deploy", "Zero config", "Env management", "Metrics dashboard"],
    pricing: "Free tier · $5/mo hobby",
    priceRange: "free",
    difficulty: "Beginner",
    learnMoreUrl: "https://railway.app",
    regions: ["US", "EU"],
    users: "50k+",
  },
  {
    id: "render",
    name: "Render",
    icon: <Box className="h-5 w-5" />,
    category: "PaaS",
    description:
      "Docker-native PaaS with a generous free tier and auto-scaling. Deploy from a Dockerfile or Git repo with zero configuration overhead.",
    features: ["Free tier", "Auto-scaling", "Docker native", "Pull request previews"],
    pricing: "Free tier · from $7/mo",
    priceRange: "free",
    difficulty: "Beginner",
    learnMoreUrl: "https://render.com",
    regions: ["US", "EU"],
    users: "100k+",
  },
  {
    id: "fly-io",
    name: "Fly.io",
    icon: <Globe className="h-5 w-5" />,
    category: "PaaS",
    description:
      "Edge-native containers deployed close to your users. Global anycast routing, sub-100ms cold starts, and great developer tooling.",
    features: ["Edge containers", "Global anycast", "Persistent volumes", "WireGuard VPN"],
    pricing: "From $3/mo",
    priceRange: "low",
    difficulty: "Intermediate",
    learnMoreUrl: "https://fly.io",
    regions: ["Global (35+ regions)"],
    users: "75k+",
  },
  {
    id: "hetzner",
    name: "Hetzner Cloud",
    icon: <Server className="h-5 w-5" />,
    category: "self-hosted",
    description:
      "EU-based infrastructure with the best price-to-performance ratio in the market. GDPR-compliant datacenters in Germany and Finland.",
    features: ["GDPR compliant", "Best $/perf", "IPv6 native", "Snapshots & backups"],
    pricing: "From $4–5/mo",
    priceRange: "low",
    difficulty: "Intermediate",
    learnMoreUrl: "https://www.hetzner.com/cloud",
    regions: ["Germany", "Finland", "US"],
    users: "500k+",
  },
  {
    id: "oracle-cloud",
    name: "Oracle Cloud Free",
    icon: <Server className="h-5 w-5" />,
    category: "self-hosted",
    description:
      "Always-Free ARM instances with 4 OCPU and 24 GB RAM — more than enough for a full OpenClaw stack. No credit card required to keep it free.",
    features: ["4 OCPU / 24 GB RAM", "Always free", "ARM64 native", "No expiry"],
    pricing: "Free forever",
    priceRange: "free",
    difficulty: "Advanced",
    learnMoreUrl: "https://www.oracle.com/cloud/free/",
    regions: ["US", "EU", "APAC"],
    users: "200k+",
  },
  {
    id: "ollama",
    name: "Ollama Local",
    icon: <Laptop className="h-5 w-5" />,
    category: "local",
    description:
      "Run OpenClaw entirely on your own machine with Ollama-served local models. Zero API costs — supports Qwen3, Llama 3.2, and more.",
    features: ["Zero API cost", "Offline capable", "Qwen3 / Llama 3.2", "GPU accelerated"],
    pricing: "Free",
    priceRange: "free",
    difficulty: "Advanced",
    learnMoreUrl: "https://ollama.com",
    regions: ["Everywhere (local)"],
  },
  {
    id: "aigovops",
    name: "AiGovOps Guided Install",
    icon: <ShieldCheck className="h-5 w-5" />,
    category: "self-hosted",
    description:
      "This project! A full installation wizard with preflight checks, hardening steps, audit trail, and marketplace — works on any supported host.",
    features: ["Preflight wizard", "Hardening steps", "Audit trail", "Marketplace"],
    pricing: "Free (open source)",
    priceRange: "free",
    difficulty: "Intermediate",
    learnMoreUrl: "index.html",
    regions: ["All supported hosts"],
    highlighted: true,
  },
];

/* ─── Constants ─── */
const CATEGORIES: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "self-hosted", label: "Self-Hosted" },
  { value: "managed", label: "Managed" },
  { value: "PaaS", label: "PaaS" },
  { value: "local", label: "Local" },
];

const DIFFICULTIES: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "Any difficulty" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

const PRICE_RANGES: { value: PriceRange | "any"; label: string }[] = [
  { value: "any", label: "Any price" },
  { value: "free", label: "Free / Free tier" },
  { value: "low", label: "Under $10/mo" },
  { value: "mid", label: "$10+/mo" },
];

const RECOMMENDED_IDS = ["digitalocean", "railway", "aigovops"];

/* ─── Helpers ─── */
function categoryColor(cat: Category) {
  switch (cat) {
    case "self-hosted":
      return "bg-[#1B3A6B]/10 text-[#1B3A6B] border-[#1B3A6B]/20 dark:bg-[#1B3A6B]/20 dark:text-blue-300";
    case "managed":
      return "bg-[#01696F]/10 text-[#01696F] border-[#01696F]/20 dark:bg-[#01696F]/20 dark:text-teal-300";
    case "PaaS":
      return "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300";
    case "local":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
  }
}

function difficultyColor(d: Difficulty) {
  switch (d) {
    case "Beginner":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300";
    case "Intermediate":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300";
    case "Advanced":
      return "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300";
  }
}

function StarCount({ count }: { count: number }) {
  const fmt =
    count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count);
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {fmt}
    </span>
  );
}

function UserCount({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Users className="h-3 w-3" />
      {label}
    </span>
  );
}

function CommitCount({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <GitBranch className="h-3 w-3" />
      {count} commits
    </span>
  );
}

/* ─── Build Card ─── */
function BuildCard({ build, recommended }: { build: Build; recommended?: boolean }) {
  const isInternal = build.learnMoreUrl === "index.html";

  return (
    <Card
      className={`flex flex-col h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 ${
        build.highlighted
          ? "border-[#01696F]/40 bg-[#01696F]/5 dark:bg-[#01696F]/10"
          : ""
      } ${recommended ? "ring-2 ring-[#1B3A6B]/20 dark:ring-[#1B3A6B]/40" : ""}`}
    >
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-start justify-between gap-2">
          {/* Icon + Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                build.highlighted
                  ? "bg-[#01696F]/15 text-[#01696F]"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {build.icon}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight truncate">
                {build.name}
              </CardTitle>
            </div>
          </div>
          {/* Category badge */}
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 font-medium ${categoryColor(build.category)}`}
          >
            {build.category}
          </Badge>
        </div>

        <CardDescription className="text-xs leading-relaxed mt-2 line-clamp-3">
          {build.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Feature chips */}
        <div className="flex flex-wrap gap-1">
          {build.features.map((f) => (
            <span
              key={f}
              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
            >
              {f}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3">
          {build.stars !== undefined && <StarCount count={build.stars} />}
          {build.users && <UserCount label={build.users} />}
          {build.commits !== undefined && <CommitCount count={build.commits} />}
        </div>

        {/* Regions */}
        <div className="flex items-start gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-xs text-muted-foreground leading-snug">
            {build.regions.join(", ")}
          </span>
        </div>

        {/* Bottom row: pricing + difficulty + CTA */}
        <div className="mt-auto pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">{build.pricing}</span>
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${difficultyColor(build.difficulty)}`}
            >
              {build.difficulty}
            </Badge>
          </div>
          {isInternal ? (
            <a href={build.learnMoreUrl}>
              <Button size="sm" variant="default" className="h-7 text-xs px-3 bg-[#01696F] hover:bg-[#015558]">
                Open
              </Button>
            </a>
          ) : (
            <a href={build.learnMoreUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-xs px-3 gap-1">
                Learn More
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Recommended Strip ─── */
function RecommendedSection() {
  const picks = BUILDS.filter((b) => RECOMMENDED_IDS.includes(b.id));
  const reasons: Record<string, string> = {
    digitalocean: "Easiest cloud deploy",
    railway: "Easiest PaaS",
    aigovops: "Most complete setup",
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#01696F]" />
        <h2 className="text-sm font-semibold">Recommended for you</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {picks.map((build) => (
          <div
            key={build.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-[#1B3A6B]/20 bg-[#1B3A6B]/5 dark:bg-[#1B3A6B]/10 hover:border-[#1B3A6B]/40 transition-colors"
          >
            <div className="h-8 w-8 rounded-md bg-[#1B3A6B]/10 flex items-center justify-center text-[#1B3A6B] dark:text-blue-300 shrink-0">
              {build.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{build.name}</p>
              <p className="text-xs text-muted-foreground">{reasons[build.id]}</p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${difficultyColor(build.difficulty)}`}
                >
                  {build.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">{build.pricing}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comparison Table ─── */
function ComparisonTable({ builds }: { builds: Build[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? builds : builds.slice(0, 7);

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-[#01696F]" />
        <h2 className="text-sm font-semibold">Side-by-side comparison</h2>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold w-40">Build</TableHead>
              <TableHead className="text-xs font-semibold">Category</TableHead>
              <TableHead className="text-xs font-semibold">Difficulty</TableHead>
              <TableHead className="text-xs font-semibold">Pricing</TableHead>
              <TableHead className="text-xs font-semibold">Regions</TableHead>
              <TableHead className="text-xs font-semibold">Popularity</TableHead>
              <TableHead className="text-xs font-semibold">Key Strength</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((b) => (
              <TableRow key={b.id} className={b.highlighted ? "bg-[#01696F]/5" : ""}>
                <TableCell className="text-xs font-medium py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{b.icon}</span>
                    {b.name}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${categoryColor(b.category)}`}
                  >
                    {b.category}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${difficultyColor(b.difficulty)}`}
                  >
                    {b.difficulty}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs py-2 text-muted-foreground whitespace-nowrap">
                  {b.pricing}
                </TableCell>
                <TableCell className="text-xs py-2 text-muted-foreground max-w-[140px]">
                  <span className="truncate block">{b.regions.slice(0, 3).join(", ")}{b.regions.length > 3 ? ` +${b.regions.length - 3}` : ""}</span>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {b.stars !== undefined && <StarCount count={b.stars} />}
                    {b.users && <UserCount label={b.users} />}
                    {b.commits !== undefined && <CommitCount count={b.commits} />}
                    {!b.stars && !b.users && !b.commits && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs py-2 text-muted-foreground">
                  {b.features[0]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {builds.length > 7 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" /> Show all {builds.length} builds
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function BuildsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | "all">("all");
  const [activePriceRange, setActivePriceRange] = useState<PriceRange | "any">("any");

  const filtered = useMemo(() => {
    return BUILDS.filter((b) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.features.some((f) => f.toLowerCase().includes(q));

      const matchesCategory = activeCategory === "all" || b.category === activeCategory;
      const matchesDifficulty =
        activeDifficulty === "all" || b.difficulty === activeDifficulty;
      const matchesPrice =
        activePriceRange === "any" ||
        (activePriceRange === "free" && b.priceRange === "free") ||
        (activePriceRange === "low" && (b.priceRange === "free" || b.priceRange === "low")) ||
        (activePriceRange === "mid" &&
          (b.priceRange === "free" || b.priceRange === "low" || b.priceRange === "mid"));

      return matchesQuery && matchesCategory && matchesDifficulty && matchesPrice;
    });
  }, [query, activeCategory, activeDifficulty, activePriceRange]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-8 hero-gradient -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 pt-7 pb-5 rounded-b-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-md bg-[#01696F]/20 flex items-center justify-center text-[#01696F]">
            <Layers className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">
            Build Catalog
          </h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          All known OpenClaw deployment builds and variations — from fully managed cloud to
          local Ollama installs. Compare options and find the right fit for your setup.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { icon: <Layers className="h-3.5 w-3.5" />, label: `${BUILDS.length} builds` },
            { icon: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />, label: "188k+ GitHub stars" },
            { icon: <Server className="h-3.5 w-3.5" />, label: "4 categories" },
            { icon: <Globe className="h-3.5 w-3.5" />, label: "Global coverage" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-xs bg-background/60 border border-border px-2.5 py-1 rounded-full text-muted-foreground"
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Recommended section */}
      <RecommendedSection />

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 text-sm"
            placeholder="Search builds by name or feature…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <Button
              key={c.value}
              variant={activeCategory === c.value ? "default" : "outline"}
              size="sm"
              className={`text-xs h-9 ${
                activeCategory === c.value
                  ? "bg-[#1B3A6B] hover:bg-[#152e57]"
                  : ""
              }`}
              onClick={() => setActiveCategory(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Difficulty + Price filters */}
      <div className="flex flex-wrap gap-3 mb-6 -mt-2">
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-xs text-muted-foreground mr-1">Difficulty:</span>
          {DIFFICULTIES.map((d) => (
            <Button
              key={d.value}
              variant={activeDifficulty === d.value ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setActiveDifficulty(d.value)}
            >
              {d.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-xs text-muted-foreground mr-1">Price:</span>
          {PRICE_RANGES.map((p) => (
            <Button
              key={p.value}
              variant={activePriceRange === p.value ? "secondary" : "ghost"}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setActivePriceRange(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-4">
        Showing{" "}
        <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
        {BUILDS.length} builds
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              recommended={RECOMMENDED_IDS.includes(build.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Terminal className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No builds match your filters</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try broadening your search or clearing filters
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs"
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
              setActiveDifficulty("all");
              setActivePriceRange("any");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Comparison table */}
      <ComparisonTable builds={filtered.length > 0 ? filtered : BUILDS} />

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center mt-8 pb-4">
        Pricing and availability may change. Verify with each provider before deploying.
      </p>
    </div>
  );
}
