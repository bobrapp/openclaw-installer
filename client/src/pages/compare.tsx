import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Globe,
  Server,
  Code2,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Layers,
} from "lucide-react";

// ────────────────────────────────────────────
// Data
// ────────────────────────────────────────────

interface Framework {
  id: string;
  name: string;
  vendor: string;
  tagline: string;
  category: "computer-use" | "orchestration";
  color: string;
  url: string;
  scores: {
    autonomy: number;
    easeOfUse: number;
    flexibility: number;
    security: number;
    costEfficiency: number;
    selfHostReady: number;
  };
  riskLevel: "low" | "medium" | "high";
  deployModel: string;
  mcpSupport: boolean;
  openSource: boolean;
  githubStars: string;
  pricing: string;
  benefits: string[];
  risks: string[];
  approach: string;
  installerReady: boolean;
  bestFor: string;
}

const frameworks: Framework[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    vendor: "Peter Steinberger",
    tagline: "Local-first open-source AI agent runtime",
    category: "computer-use",
    color: "hsl(188, 50%, 50%)",
    url: "https://github.com/nicepkg/openclaw",
    scores: { autonomy: 9, easeOfUse: 6, flexibility: 9, security: 7, costEfficiency: 9, selfHostReady: 10 },
    riskLevel: "medium",
    deployModel: "Local (Mac mini / Docker)",
    mcpSupport: true,
    openSource: true,
    githubStars: "100k+",
    pricing: "Free + API costs ($15-150/mo)",
    benefits: [
      "Fully local — complete data sovereignty",
      "Native Claude integration (Sonnet 4.5, Opus 4)",
      "MCP protocol with 30+ tool servers",
      "Browser automation via Playwright",
      "Sub-agent spawning for complex workflows",
      "Telegram / Discord / Slack integrations",
      "Local model support (Ollama, llama.cpp)",
    ],
    risks: [
      "Steeper learning curve — CLI comfort required",
      "Unbounded action space (shell, filesystem) needs guardrails",
      "Documentation still evolving",
      "No built-in enterprise governance layer",
      "Security depends on user's own hardening",
    ],
    approach: "Install locally on macOS or via Docker. Run as LaunchAgent or systemd service. All processing happens on your machine — only API calls to LLM providers leave the network. Best paired with Tailscale for remote access and macOS Keychain for secrets.",
    installerReady: true,
    bestFor: "Technical solopreneurs building custom AI workflows with Claude",
  },
  {
    id: "nemoclaw",
    name: "NemoClaw",
    vendor: "NVIDIA",
    tagline: "Enterprise-grade OpenClaw with sandboxed execution",
    category: "computer-use",
    color: "hsl(97, 50%, 40%)",
    url: "https://www.nvidia.com/en-us/ai/",
    scores: { autonomy: 9, easeOfUse: 7, flexibility: 8, security: 9, costEfficiency: 6, selfHostReady: 9 },
    riskLevel: "low",
    deployModel: "Local / Cloud (RTX, DGX, AWS, GCP, Azure)",
    mcpSupport: true,
    openSource: true,
    githubStars: "New (GTC 2026)",
    pricing: "Free (open-source) + GPU/API costs",
    benefits: [
      "OpenShell sandboxed runtime per agent — policy enforcement",
      "AI-Q blueprint: frontier models plan, Nemotron models execute — 50%+ cost reduction",
      "Least-privilege access controls baked into runtime",
      "Privacy routing for sensitive data",
      "Runs on any hardware (not locked to NVIDIA GPUs)",
      "Integrates with LangChain, existing frameworks",
      "Enterprise security and compliance built-in",
    ],
    risks: [
      "Very new — announced March 2026 at GTC",
      "Full ecosystem still maturing",
      "GPU-optimized workflows may need NVIDIA hardware for best performance",
      "Enterprise focus may add complexity for solo developers",
    ],
    approach: "Single-command NemoClaw stack install. OpenShell creates isolated sandbox per agent with network guardrails and policy enforcement. Deploys on RTX PCs, DGX systems, or any major cloud. The AI-Q architecture uses hybrid model routing — expensive frontier models for planning, cheaper Nemotron models for research/execution tasks.",
    installerReady: false,
    bestFor: "Enterprise teams needing governed, sandboxed AI agents at scale",
  },
  {
    id: "anthropic-cu",
    name: "Computer Use",
    vendor: "Anthropic",
    tagline: "Claude controls your desktop via screenshots + mouse/keyboard",
    category: "computer-use",
    color: "hsl(25, 75%, 50%)",
    url: "https://docs.anthropic.com/en/docs/build-with-claude/computer-use",
    scores: { autonomy: 9, easeOfUse: 5, flexibility: 9, security: 6, costEfficiency: 5, selfHostReady: 7 },
    riskLevel: "high",
    deployModel: "API-only (requires dev integration)",
    mcpSupport: false,
    openSource: false,
    githubStars: "N/A (API)",
    pricing: "Claude API pricing (per-token)",
    benefits: [
      "Universal — works with any GUI app, website, or OS",
      "No custom integrations needed per application",
      "Self-correcting via visual feedback loops",
      "Generalizes to untrained applications",
      "Direct desktop control (native apps, not just browser)",
      "Superior coding/dev-task benchmark performance",
    ],
    risks: [
      "API-only — requires significant developer setup for safe desktop integration",
      "Full desktop access creates a large attack surface",
      "Screenshot-based — slower than API-based approaches",
      "High token cost from continuous screenshot processing",
      "No built-in sandboxing — you must build safety guardrails",
      "Prompt injection risk via on-screen content",
    ],
    approach: "API integration with Claude 3.5 Sonnet+ models. The agent captures screenshots of your entire desktop, uses vision to understand what's displayed, and performs mouse/keyboard actions. You must build the execution environment, safety controls, and integration layer yourself. Typically deployed inside a Docker container or VM for isolation.",
    installerReady: false,
    bestFor: "Developers automating legacy software and cross-application desktop workflows",
  },
  {
    id: "openai-operator",
    name: "Operator / CUA",
    vendor: "OpenAI",
    tagline: "GPT-4o in a managed virtual browser",
    category: "computer-use",
    color: "hsl(160, 60%, 40%)",
    url: "https://operator.chatgpt.com",
    scores: { autonomy: 7, easeOfUse: 9, flexibility: 5, security: 8, costEfficiency: 4, selfHostReady: 2 },
    riskLevel: "low",
    deployModel: "Cloud-only (OpenAI hosted)",
    mcpSupport: false,
    openSource: false,
    githubStars: "N/A (SaaS)",
    pricing: "$200/mo (ChatGPT Pro)",
    benefits: [
      "Easiest to use — web interface, no dev setup needed",
      "Secure virtual browser environment (sandboxed by default)",
      "Human takeover mode at critical decision points",
      "Best web navigation benchmark scores",
      "No infrastructure to manage",
      "Built-in safety controls by OpenAI",
    ],
    risks: [
      "Cloud-only — no self-hosting, data goes through OpenAI servers",
      "Limited to web browser tasks (no native app or desktop control)",
      "Expensive at $200/month with no API access",
      "Vendor lock-in to OpenAI ecosystem",
      "No custom agent logic or tool integration",
      "Least flexible — you can't modify agent behavior",
    ],
    approach: "Fully managed SaaS. Log into Operator via ChatGPT Pro subscription. Give high-level instructions, and the CUA model launches its own browser instance to complete web-based tasks. You can intervene via takeover mode. No code, no infrastructure, no customization.",
    installerReady: false,
    bestFor: "Non-technical users who need web task automation with zero setup",
  },
  {
    id: "browser-use",
    name: "Browser Use",
    vendor: "Open Source",
    tagline: "Python framework for AI browser agents — 89.1% WebVoyager",
    category: "computer-use",
    color: "hsl(262, 50%, 55%)",
    url: "https://github.com/browser-use/browser-use",
    scores: { autonomy: 7, easeOfUse: 7, flexibility: 8, security: 6, costEfficiency: 8, selfHostReady: 9 },
    riskLevel: "medium",
    deployModel: "Self-hosted (Python + Playwright)",
    mcpSupport: false,
    openSource: true,
    githubStars: "78k+",
    pricing: "Free + LLM API costs",
    benefits: [
      "89.1% WebVoyager benchmark — SOTA web agent",
      "Multi-model support (OpenAI, Claude, Gemini, local)",
      "Python framework — easy to extend and customize",
      "DOM extraction + vision hybrid approach",
      "Cloud API available ($0.05/step) for managed option",
      "Active community (78k+ GitHub stars)",
    ],
    risks: [
      "Browser-only — no desktop or native app control",
      "You manage infrastructure (Playwright, proxies, scaling)",
      "No built-in memory or session persistence",
      "Requires pairing with a browser provider for production scale",
    ],
    approach: "Install via pip, bring your own LLM API keys. Browser Use wraps Playwright with an AI reasoning layer. The agent extracts DOM structure, takes screenshots for visual context, and plans multi-step browser actions. For production, pair with Browserbase or Firecrawl Browser Sandbox for managed browser infrastructure.",
    installerReady: false,
    bestFor: "Developers building web automation and data extraction agents",
  },
  {
    id: "agent-s2",
    name: "Agent S2",
    vendor: "Simular.ai",
    tagline: "SOTA computer use — OSWorld + WindowsAgentArena benchmarks",
    category: "computer-use",
    color: "hsl(340, 60%, 50%)",
    url: "https://github.com/simular-ai/agent-s",
    scores: { autonomy: 8, easeOfUse: 5, flexibility: 7, security: 5, costEfficiency: 7, selfHostReady: 8 },
    riskLevel: "high",
    deployModel: "Self-hosted (Python, multiplatform)",
    mcpSupport: false,
    openSource: true,
    githubStars: "14k+",
    pricing: "Free + LLM API costs",
    benefits: [
      "State-of-the-art on OSWorld, WindowsAgentArena, AndroidWorld",
      "Outperforms OpenAI CUA and Anthropic Computer Use on benchmarks",
      "Learns from past experiences for improved autonomy",
      "Full GUI agent — works across OS, not just browser",
      "ICLR 2025 accepted research",
      "Multi-platform (macOS, Windows, Android)",
    ],
    risks: [
      "Research-grade — not production-hardened",
      "Limited documentation and community compared to larger projects",
      "Full computer access with minimal built-in safety controls",
      "Benchmark performance doesn't always translate to real-world reliability",
      "Smaller team and community support",
    ],
    approach: "Academic research framework with practical implementation. Uses Agent-Computer Interface (ACI) with visual grounding and learned experience replay. Deploys locally via Python. The agent observes the screen, reasons about GUI elements, and executes actions across any application. Still closer to a research prototype than a production tool.",
    installerReady: false,
    bestFor: "Researchers and advanced users pushing the frontier of computer-use agents",
  },
  {
    id: "autogen",
    name: "AutoGen",
    vendor: "Microsoft",
    tagline: "Multi-agent conversation framework with event-driven architecture",
    category: "orchestration",
    color: "hsl(207, 70%, 50%)",
    url: "https://github.com/microsoft/autogen",
    scores: { autonomy: 8, easeOfUse: 5, flexibility: 9, security: 7, costEfficiency: 7, selfHostReady: 8 },
    riskLevel: "medium",
    deployModel: "Self-hosted (Python)",
    mcpSupport: true,
    openSource: true,
    githubStars: "54.6k+",
    pricing: "Free + LLM API costs",
    benefits: [
      "Mature multi-agent conversation framework",
      "Event-driven async architecture for complex interactions",
      "Supports human-in-the-loop workflows",
      "Built-in MCP integration via extension module",
      "Azure / Microsoft ecosystem integration",
      "Active research community (Microsoft Research)",
      "54.6k GitHub stars — large community",
    ],
    risks: [
      "Steep learning curve — requires significant engineering to productionize",
      "No enterprise-grade governance out of the box",
      "Agent-to-agent loops can be unpredictable",
      "Best suited for research and experimentation, not turnkey production",
      "Complex debugging of multi-agent conversations",
    ],
    approach: "Python framework for orchestrating multiple conversing agents. Agents communicate via async messages in event-driven or request/response patterns. Supports customizable agent types, LLM integration, and tool calling. You build the agent topology, define conversation flows, and AutoGen handles the message routing. Best used when you need agents that reason together, not just execute tasks.",
    installerReady: false,
    bestFor: "Research teams and advanced agent-to-agent collaboration use cases",
  },
  {
    id: "crewai",
    name: "CrewAI",
    vendor: "CrewAI, Inc.",
    tagline: "Role-based multi-agent orchestration with visual designer",
    category: "orchestration",
    color: "hsl(43, 75%, 50%)",
    url: "https://github.com/crewAIInc/crewAI",
    scores: { autonomy: 7, easeOfUse: 8, flexibility: 7, security: 6, costEfficiency: 7, selfHostReady: 8 },
    riskLevel: "medium",
    deployModel: "Self-hosted or CrewAI Cloud",
    mcpSupport: true,
    openSource: true,
    githubStars: "30k+",
    pricing: "Free (open-source), cloud from $25/mo",
    benefits: [
      "Intuitive role-based agent design (manager, researcher, writer)",
      "Visual workflow designer for non-code users",
      "Hierarchical manager-worker orchestration patterns",
      "Built-in monitoring and tracing tools",
      "Flows with conditional logic, loops, state management",
      "Direct MCP server integration via config",
      "Easy to get started — good documentation",
    ],
    risks: [
      "Less flexible than code-first frameworks for custom logic",
      "Cloud dependency for some advanced features",
      "Smaller community than LangGraph or AutoGen",
      "Role-based model can feel constraining for novel architectures",
      "Less suited for real-time or streaming workloads",
    ],
    approach: "Define agents by role (e.g., 'Senior Researcher', 'Technical Writer'), assign tools and goals, and CrewAI orchestrates their collaboration. Supports hierarchical (manager delegates) and sequential (pipeline) patterns. Can run fully self-hosted via Python or use CrewAI Cloud for managed execution. MCP servers connect via simple URL config.",
    installerReady: false,
    bestFor: "Teams building collaborative multi-agent systems with clear role separation",
  },
];

// Radar chart dimension labels
const dimensionLabels: Record<string, string> = {
  autonomy: "Autonomy",
  easeOfUse: "Ease of Use",
  flexibility: "Flexibility",
  security: "Security",
  costEfficiency: "Cost Efficiency",
  selfHostReady: "Self-Host Ready",
};

const riskColors: Record<string, string> = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-red-500",
};

const riskBg: Record<string, string> = {
  low: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
  medium: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  high: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
};

const riskIcons: Record<string, typeof ShieldCheck> = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
};

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function Compare() {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(["openclaw", "nemoclaw", "anthropic-cu"]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleFramework = (id: string) => {
    setSelectedFrameworks((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((f) => f !== id) : prev;
      }
      return prev.length < 4 ? [...prev, id] : prev;
    });
  };

  const selected = frameworks.filter((f) => selectedFrameworks.includes(f.id));

  // Build radar chart data
  const radarData = Object.keys(dimensionLabels).map((key) => {
    const point: Record<string, string | number> = { dimension: dimensionLabels[key] };
    selected.forEach((f) => {
      point[f.id] = f.scores[key as keyof Framework["scores"]];
    });
    return point;
  });

  const computerUseFrameworks = frameworks.filter((f) => f.category === "computer-use");
  const orchestrationFrameworks = frameworks.filter((f) => f.category === "orchestration");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-compare-title">
          Framework Comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Computer-use agents and orchestration frameworks — benefit, risk, and deployment approach
        </p>
      </div>

      {/* Framework Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Select up to 4 frameworks to compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Cpu className="h-3 w-3" /> Computer-Use Agents
              </p>
              <div className="flex flex-wrap gap-2">
                {computerUseFrameworks.map((f) => (
                  <button
                    key={f.id}
                    data-testid={`button-toggle-${f.id}`}
                    onClick={() => toggleFramework(f.id)}
                    aria-pressed={selectedFrameworks.includes(f.id)}
                    aria-label={`${selectedFrameworks.includes(f.id) ? "Deselect" : "Select"} ${f.name}`}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedFrameworks.includes(f.id)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: f.color }} />
                    {f.name}
                    <span className="ml-1 text-muted-foreground">({f.vendor})</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Orchestration Frameworks
              </p>
              <div className="flex flex-wrap gap-2">
                {orchestrationFrameworks.map((f) => (
                  <button
                    key={f.id}
                    data-testid={`button-toggle-${f.id}`}
                    onClick={() => toggleFramework(f.id)}
                    aria-pressed={selectedFrameworks.includes(f.id)}
                    aria-label={`${selectedFrameworks.includes(f.id) ? "Deselect" : "Select"} ${f.name}`}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedFrameworks.includes(f.id)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: f.color }} />
                    {f.name}
                    <span className="ml-1 text-muted-foreground">({f.vendor})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Radar Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickCount={6}
                />
                {selected.map((f, i) => (
                  <Radar
                    key={f.id}
                    name={f.name}
                    dataKey={f.id}
                    stroke={f.color}
                    fill={f.color}
                    fillOpacity={0.08 + i * 0.04}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => (
                    <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                  )}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="table-comparison">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-32">Dimension</th>
                {selected.map((f) => (
                  <th key={f.id} className="text-left py-2 px-2 font-medium" style={{ color: f.color }}>
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">Vendor</td>
                {selected.map((f) => <td key={f.id} className="py-2 px-2">{f.vendor}</td>)}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">Deploy Model</td>
                {selected.map((f) => <td key={f.id} className="py-2 px-2">{f.deployModel}</td>)}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">Pricing</td>
                {selected.map((f) => <td key={f.id} className="py-2 px-2">{f.pricing}</td>)}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">Open Source</td>
                {selected.map((f) => (
                  <td key={f.id} className="py-2 px-2">
                    {f.openSource ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">MCP Support</td>
                {selected.map((f) => (
                  <td key={f.id} className="py-2 px-2">
                    {f.mcpSupport ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">GitHub Stars</td>
                {selected.map((f) => <td key={f.id} className="py-2 px-2">{f.githubStars}</td>)}
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-3 text-muted-foreground">Risk Level</td>
                {selected.map((f) => {
                  const RiskIcon = riskIcons[f.riskLevel];
                  return (
                    <td key={f.id} className="py-2 px-2">
                      <span className={`inline-flex items-center gap-1 ${riskColors[f.riskLevel]}`}>
                        <RiskIcon className="h-3.5 w-3.5" />
                        <span className="capitalize">{f.riskLevel}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-2 pr-3 text-muted-foreground">Best For</td>
                {selected.map((f) => <td key={f.id} className="py-2 px-2 text-muted-foreground">{f.bestFor}</td>)}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Framework Detail Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Detailed Profiles</h2>
        {selected.map((f) => {
          const isExpanded = expandedCard === f.id;
          const RiskIcon = riskIcons[f.riskLevel];
          return (
            <Card key={f.id} data-testid={`card-framework-${f.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: f.color }}
                    >
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        {f.name}
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {f.vendor}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-normal border ${riskBg[f.riskLevel]}`}>
                          <RiskIcon className="h-2.5 w-2.5 mr-0.5" />
                          {f.riskLevel} risk
                        </Badge>
                        {f.installerReady && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            Installer Ready
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.tagline}</p>
                    </div>
                  </div>
                  <button
                    data-testid={`button-expand-${f.id}`}
                    onClick={() => setExpandedCard(isExpanded ? null : f.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Collapse ${f.name} details` : `Expand ${f.name} details`}
                    className="p-1 rounded-md hover:bg-accent transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <Tabs defaultValue="benefits" className="w-full">
                    <TabsList className="h-8">
                      <TabsTrigger value="benefits" className="text-xs h-7">Benefits</TabsTrigger>
                      <TabsTrigger value="risks" className="text-xs h-7">Risks</TabsTrigger>
                      <TabsTrigger value="approach" className="text-xs h-7">Approach</TabsTrigger>
                    </TabsList>
                    <TabsContent value="benefits" className="mt-3">
                      <ul className="space-y-1.5">
                        {f.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="risks" className="mt-3">
                      <ul className="space-y-1.5">
                        {f.risks.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="approach" className="mt-3">
                      <p className="text-xs leading-relaxed text-muted-foreground">{f.approach}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Official Site
                        </a>
                        <span className="text-xs text-muted-foreground">
                          Deploy: {f.deployModel}
                        </span>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Risk Matrix Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Risk Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["low", "medium", "high"] as const).map((level) => {
              const inLevel = frameworks.filter((f) => f.riskLevel === level);
              const RiskIcon = riskIcons[level];
              return (
                <div key={level} className={`rounded-lg border p-3 ${riskBg[level]}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <RiskIcon className="h-4 w-4" />
                    <span className="text-xs font-semibold capitalize">{level} Risk</span>
                  </div>
                  <ul className="space-y-1">
                    {inLevel.map((f) => (
                      <li key={f.id} className="text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                        <span className="font-medium">{f.name}</span>
                        <span className="text-[10px] opacity-70">— {f.vendor}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] mt-2 opacity-70">
                    {level === "low" && "Managed sandboxing, built-in governance, or minimal attack surface."}
                    {level === "medium" && "Self-hosted with reasonable defaults, but requires hardening and monitoring."}
                    {level === "high" && "Full computer/desktop access with minimal built-in safety controls. Requires expert security configuration."}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Source Attribution */}
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Data compiled from F³ Fund It self-hosted comparison, Helicone browser agent analysis, Vellum framework guide, 
        Firecrawl open-source frameworks review, AIMultiple benchmarks, NVIDIA GTC 2026 announcements, 
        Anthropic and OpenAI documentation, and GitHub repository statistics as of April 2026.
      </p>
    </div>
  );
}
