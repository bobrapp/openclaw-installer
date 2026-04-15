import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, GitBranch, Layers, Shield, Zap, Code2, Rocket, Lightbulb } from "lucide-react";

interface TimelineEntry {
  phase: string;
  title: string;
  description: string;
  details: string[];
  icon: typeof BookOpen;
  badge?: string;
}

const timeline: TimelineEntry[] = [
  {
    phase: "Phase 1",
    title: "Research & Architecture",
    icon: Lightbulb,
    badge: "Foundation",
    description:
      "The project started with researching the OpenClaw/Clawdbot/Moltbot setup path and understanding what a guided macOS installer needed. The goal: check permissions, dependencies, low-privilege constraints, logging, and rollback steps before changing anything.",
    details: [
      "Researched 8 AI agent frameworks: OpenClaw, NemoClaw (NVIDIA), Anthropic Computer Use, OpenAI Operator, Browser Use, Agent S2, AutoGen, CrewAI",
      "Defined 4 host targets: macOS (Local), DigitalOcean, Azure VM, Generic VPS",
      "Chose tech stack: Express + Vite + React + Tailwind + shadcn/ui + Drizzle ORM + SQLite",
      "Designed the 6-step installation wizard flow: Environment Check → Dependencies → Permissions → Configuration → Install → Verify",
      "Architected append-only logging with no PII — a core requirement from the start",
    ],
  },
  {
    phase: "Phase 2",
    title: "Core Web App",
    icon: Layers,
    badge: "Build",
    description:
      "Built the guided installer as a web UI with shell scripts. Every host target got its own preflight, install, and rollback scripts generated dynamically.",
    details: [
      "Created SQLite schema: install_logs, install_state, hardening_checks",
      "Built host selection page with 4 target cards showing step badges",
      "Implemented the 6-step wizard with progress tracking and state persistence",
      "Generated shell scripts per host: preflight (read-only), install (with DRY_RUN mode), rollback",
      "40+ hardening checklist items across Network, Permissions, Secrets, Logging, Observability, Updates categories",
      "Each check has a severity (critical/recommended/optional) and optional validation command",
      "Scripts viewer with syntax highlighting and download capability",
    ],
  },
  {
    phase: "Phase 3",
    title: "Framework Comparison",
    icon: GitBranch,
    badge: "Analysis",
    description:
      "Added a comprehensive comparison of 8 AI agent frameworks with interactive visualizations — radar chart, comparison table, and risk matrix.",
    details: [
      "Compared frameworks across 7 dimensions: Security, Ease of Use, Flexibility, Cost, Support, Scale, Compliance",
      "Interactive radar chart using Recharts for visual comparison",
      "Detailed cards per framework with Benefits, Risks, and Approach tabs",
      "Risk matrix plotting frameworks by likelihood vs. impact",
      "Covered self-hosted vs. API-hosted vs. hybrid deployment models",
    ],
  },
  {
    phase: "Phase 4",
    title: "Router Bug Fix & E2E QA",
    icon: Zap,
    badge: "Critical Fix",
    description:
      "Full end-to-end QA revealed a critical routing bug. The wouter Router only wrapped the main content area, but sidebar Link components were outside — so clicking sidebar links changed the URL but didn't update the rendered page.",
    details: [
      "Discovered: <Router hook={useHashLocation}> only wrapped <AppRouter> inside <main>",
      "Sidebar <Link> components were outside the Router scope",
      "Fix: Lifted Router to wrap the entire app layout including sidebar",
      "22 screenshots across all pages in light + dark mode confirmed the fix",
      "Lesson learned: Always verify that ALL Link/Route components share the same Router context",
    ],
  },
  {
    phase: "Phase 5",
    title: "Immutable Audit Logging",
    icon: Shield,
    badge: "Security",
    description:
      "Implemented the AiGovOps Foundation immutable logging standard — a cryptographic hash chain where every entry hashes the previous one, making tampering immediately detectable.",
    details: [
      "Added audit_logs table: timestamp, date, user, prompt, results, previousHash, currentHash",
      "SHA-256 hash chain: currentHash = SHA-256(timestamp|user|prompt|results|previousHash)",
      "Genesis entry uses previousHash = '0'",
      "Chain verification endpoint validates every link in O(n) time",
      "Owner-only access secured by irreversible passphrase (SHA-256 hashed)",
      "Owner auth table stores only the hash — never the passphrase itself",
      "Audit entries created automatically by preflight runner and manual actions",
    ],
  },
  {
    phase: "Phase 6",
    title: "Live Preflight Runner",
    icon: Zap,
    badge: "SSE Streaming",
    description:
      "Built a live preflight runner that executes checks in the browser and streams results in real-time using Server-Sent Events (SSE).",
    details: [
      "SSE endpoint at /api/preflight/run/:hostTarget streams check results one by one",
      "Host-specific checks: macOS has 11 (Xcode, Homebrew, Keychain, etc.), each host has tailored checks",
      "Progress bar and animated status icons (spinning → pass/warn/fail)",
      "Results auto-logged to both install_logs and audit_logs tables",
      "Summary banner: 'Ready to Proceed' (green) or 'Blocked — Fix Failures' (red)",
      "Every preflight run creates an immutable audit trail entry",
    ],
  },
  {
    phase: "Phase 7",
    title: "AiGovOps Foundation Attribution",
    icon: BookOpen,
    badge: "Attribution",
    description:
      "Added the AiGovOps Foundation page crediting co-founders Bob Rapp and Ken Johnston, with core pillars, the immutable logging standard explanation, and a donation CTA.",
    details: [
      "Co-founder cards with professional backgrounds",
      "Four core pillars: Governance as Code, AI Technical Debt Elimination, Operational Compliance, Community-Driven Standards",
      "Immutable Logging Standard explanation with field-by-field breakdown",
      "'Buy Us a Coffee' donation call-to-action linking to www.aigovopsfoundation.org",
    ],
  },
  {
    phase: "Phase 8",
    title: "GitHub & CI Pipeline",
    icon: Code2,
    badge: "DevOps",
    description:
      "Created the public GitHub repository and added a GitHub Actions CI pipeline that runs preflight checks on every PR.",
    details: [
      "Public repo at github.com/bobrapp/openclaw-installer",
      "CI pipeline: TypeScript check → Build → Schema validation → Security scan → Hash chain verification → PII check → Network binding check",
      "Posts pass/fail as a GitHub commit status check labeled 'AiGovOps Preflight'",
      "Job summary with detailed markdown report of all checks",
      "Comprehensive README with architecture, API docs, security model, and hash chain explanation",
    ],
  },
  {
    phase: "Phase 9",
    title: "PDF Export & Standalone Wizard",
    icon: Rocket,
    badge: "Framework v1",
    description:
      "The final phase: exportable PDF audit reports as compliance artifacts, a standalone single-HTML wizard app, and this 'How I Built This' narrative.",
    details: [
      "PDF audit report: 'AiGovOps Foundation Framework — April 2026 v1'",
      "Full SHA-256 hash chain table, QR code to aigovopsfoundation.org, co-founder attribution",
      "Standalone HTML wizard: self-contained, no server required, walks through all options",
      "Pre-filled suggested values, confirm-each-step flow, test/dry-run before committing",
      "PII and secrets kept hidden in all logs and exports",
      "Version log with crypto hash chain computed in-browser using Web Crypto API",
      "Everything versioned in the AiGovOps audit trail from day one",
    ],
  },
];

export default function HowIBuiltThis() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-how-built-title">
            How I Built This
          </h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          The complete story of building the OpenClaw Installer — from research through
          the AiGovOps Foundation Framework v1. Every phase, every decision, every lesson.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Phases", value: "9" },
          { label: "Host Targets", value: "4" },
          { label: "Hardening Checks", value: "40+" },
          { label: "Frameworks Compared", value: "8" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <ScrollArea className="h-auto">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {timeline.map((entry, i) => (
              <div key={i} className="relative pl-12" data-testid={`timeline-entry-${i}`}>
                {/* Circle on the line */}
                <div className="absolute left-[10px] top-1 h-5 w-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono">{entry.phase}</Badge>
                      {entry.badge && (
                        <Badge variant="secondary" className="text-xs">{entry.badge}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm flex items-center gap-2 mt-1">
                      <entry.icon className="h-4 w-4 text-primary shrink-0" />
                      {entry.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>
                    <ul className="space-y-1.5">
                      {entry.details.map((detail, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary mt-0.5 shrink-0">-</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Closing */}
      <Card className="mt-8 border-primary/20 bg-primary/[0.02]">
        <CardContent className="pt-6 text-center">
          <p className="text-sm font-medium mb-2">Built with the AiGovOps Foundation Standard</p>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">
            Every action throughout this build was logged in the immutable audit chain.
            The framework ensures transparency, accountability, and compliance from the first line of code.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            A work of Bob Rapp and Ken Johnston —{" "}
            <a
              href="https://www.aigovopsfoundation.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.aigovopsfoundation.org
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
