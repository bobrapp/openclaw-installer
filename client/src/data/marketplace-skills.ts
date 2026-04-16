import { getSkillConfig } from "./config-loader";

/**
 * ClawXXX Skills Marketplace — Connections, AI Skills & Community Packages
 * Each skill is an MCP-compatible package that ClawXXX can install and invoke.
 */

export type SkillCategory =
  | "connections"
  | "ai-providers"
  | "community"
  | "devops"
  | "data";

export interface MarketplaceSkill {
  id: string;
  name: string;
  provider: string;
  category: SkillCategory;
  icon: string;           // lucide-react icon name
  description: string;
  mcpEndpoint: string;    // MCP server URI stub
  installCmd: string;     // CLI install command
  tags: string[];
  compatibility: string[];  // e.g. ["Claude", "OpenAI", "NVIDIA"]
  configSnippet: string;    // YAML config example
  featured?: boolean;
}

/* ─────────────────────────────────────────────────────────────────
 * CONNECTIONS — MCP-compatible integrations
 * ───────────────────────────────────────────────────────────────── */
const connections: MarketplaceSkill[] = [
  {
    id: "slack-connector",
    name: "Slack",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "MessageSquare",
    description: "Send messages, manage channels, react to events, and run slash commands through Slack's API. Full workspace integration with thread support.",
    mcpEndpoint: "mcp://clawxxx.skills/slack/v1",
    installCmd: "claw mcp install slack-connector",
    tags: ["messaging", "teams", "notifications"],
    compatibility: ["Claude", "OpenAI", "Gemini", "Llama"],
    featured: true,
    configSnippet: getSkillConfig("slack-connector"),
  },
  {
    id: "github-connector",
    name: "GitHub",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "GitBranch",
    description: "Manage repos, issues, PRs, actions, and releases. Create branches, review code, merge PRs, and trigger CI/CD pipelines via MCP.",
    mcpEndpoint: "mcp://clawxxx.skills/github/v1",
    installCmd: "claw mcp install github-connector",
    tags: ["code", "ci-cd", "version-control"],
    compatibility: ["Claude", "OpenAI", "Gemini", "NVIDIA"],
    featured: true,
    configSnippet: getSkillConfig("github-connector"),
  },
  {
    id: "gmail-connector",
    name: "Gmail",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Mail",
    description: "Read, compose, reply, and organize email. Search by label, sender, or date. Supports drafts, attachments, and thread management.",
    mcpEndpoint: "mcp://clawxxx.skills/gmail/v1",
    installCmd: "claw mcp install gmail-connector",
    tags: ["email", "productivity", "google"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("gmail-connector"),
  },
  {
    id: "google-drive-connector",
    name: "Google Drive",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "HardDrive",
    description: "Browse, search, upload, and share files across Google Drive. Create folders, manage permissions, and sync document metadata.",
    mcpEndpoint: "mcp://clawxxx.skills/gdrive/v1",
    installCmd: "claw mcp install google-drive-connector",
    tags: ["files", "storage", "google"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("google-drive-connector"),
  },
  {
    id: "notion-connector",
    name: "Notion",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "BookOpen",
    description: "Read and write Notion pages, databases, and blocks. Query databases with filters, create pages from templates, and sync knowledge bases.",
    mcpEndpoint: "mcp://clawxxx.skills/notion/v1",
    installCmd: "claw mcp install notion-connector",
    tags: ["wiki", "knowledge-base", "productivity"],
    compatibility: ["Claude", "OpenAI", "Gemini", "Llama"],
    configSnippet: getSkillConfig("notion-connector"),
  },
  {
    id: "jira-connector",
    name: "Jira",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "TicketCheck",
    description: "Create and manage issues, epics, and sprints. Transition ticket states, assign work, add comments, and query with JQL.",
    mcpEndpoint: "mcp://clawxxx.skills/jira/v1",
    installCmd: "claw mcp install jira-connector",
    tags: ["project-management", "agile", "atlassian"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("jira-connector"),
  },
  {
    id: "linear-connector",
    name: "Linear",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Layers",
    description: "Manage issues, projects, and cycles in Linear. Create tickets, update status, and sync with your development workflow.",
    mcpEndpoint: "mcp://clawxxx.skills/linear/v1",
    installCmd: "claw mcp install linear-connector",
    tags: ["project-management", "issues", "modern"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("linear-connector"),
  },
  {
    id: "salesforce-connector",
    name: "Salesforce",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Cloud",
    description: "Query and manage Salesforce objects — accounts, contacts, opportunities, and custom objects. Run SOQL queries and create records.",
    mcpEndpoint: "mcp://clawxxx.skills/salesforce/v1",
    installCmd: "claw mcp install salesforce-connector",
    tags: ["crm", "sales", "enterprise"],
    compatibility: ["Claude", "OpenAI", "NVIDIA"],
    configSnippet: getSkillConfig("salesforce-connector"),
  },
  {
    id: "hubspot-connector",
    name: "HubSpot",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Users",
    description: "Manage contacts, deals, and marketing campaigns. Create and update CRM records, enroll contacts in workflows, and track engagement.",
    mcpEndpoint: "mcp://clawxxx.skills/hubspot/v1",
    installCmd: "claw mcp install hubspot-connector",
    tags: ["crm", "marketing", "sales"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("hubspot-connector"),
  },
  {
    id: "stripe-connector",
    name: "Stripe",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "CreditCard",
    description: "Create payment links, manage subscriptions, issue invoices, and check balances. Read-only or full access modes available.",
    mcpEndpoint: "mcp://clawxxx.skills/stripe/v1",
    installCmd: "claw mcp install stripe-connector",
    tags: ["payments", "billing", "commerce"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("stripe-connector"),
  },
  {
    id: "discord-connector",
    name: "Discord",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Gamepad2",
    description: "Send messages, manage servers, create channels, and respond to events. Bot integration with slash command support.",
    mcpEndpoint: "mcp://clawxxx.skills/discord/v1",
    installCmd: "claw mcp install discord-connector",
    tags: ["messaging", "community", "gaming"],
    compatibility: ["Claude", "OpenAI", "Llama"],
    configSnippet: getSkillConfig("discord-connector"),
  },
  {
    id: "twilio-connector",
    name: "Twilio",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Phone",
    description: "Send SMS, make voice calls, and manage WhatsApp messages. Programmable communications for alerts, verification, and outreach.",
    mcpEndpoint: "mcp://clawxxx.skills/twilio/v1",
    installCmd: "claw mcp install twilio-connector",
    tags: ["sms", "voice", "communications"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("twilio-connector"),
  },
  {
    id: "google-calendar-connector",
    name: "Google Calendar",
    provider: "ClawXXX Community",
    category: "connections",
    icon: "Calendar",
    description: "Create events, check availability, set reminders, and manage multiple calendars. Supports recurring events and timezone handling.",
    mcpEndpoint: "mcp://clawxxx.skills/gcal/v1",
    installCmd: "claw mcp install google-calendar-connector",
    tags: ["calendar", "scheduling", "google"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("google-calendar-connector"),
  },
  {
    id: "postgres-connector",
    name: "PostgreSQL",
    provider: "ClawXXX Community",
    category: "data",
    icon: "Database",
    description: "Run read-only SQL queries against PostgreSQL databases. Inspect schemas, list tables, and export results. Safe by default.",
    mcpEndpoint: "mcp://clawxxx.skills/postgres/v1",
    installCmd: "claw mcp install postgres-connector",
    tags: ["database", "sql", "analytics"],
    compatibility: ["Claude", "OpenAI", "Gemini", "NVIDIA"],
    configSnippet: getSkillConfig("postgres-connector"),
  },
  {
    id: "snowflake-connector",
    name: "Snowflake",
    provider: "ClawXXX Community",
    category: "data",
    icon: "Snowflake",
    description: "Query Snowflake data warehouses. Run analytics queries, inspect schemas, and export result sets with warehouse-aware session management.",
    mcpEndpoint: "mcp://clawxxx.skills/snowflake/v1",
    installCmd: "claw mcp install snowflake-connector",
    tags: ["data-warehouse", "analytics", "cloud"],
    compatibility: ["Claude", "OpenAI", "NVIDIA"],
    configSnippet: getSkillConfig("snowflake-connector"),
  },
];

/* ─────────────────────────────────────────────────────────────────
 * AI PROVIDER SKILLS — First-party model integrations
 * ───────────────────────────────────────────────────────────────── */
const aiProviders: MarketplaceSkill[] = [
  {
    id: "claude-skill",
    name: "Claude (Anthropic)",
    provider: "Anthropic",
    category: "ai-providers",
    icon: "Brain",
    description: "Invoke Claude models for reasoning, analysis, coding, and conversation. Supports tool use, long context, and system prompts. MCP-native.",
    mcpEndpoint: "mcp://clawxxx.skills/claude/v1",
    installCmd: "claw mcp install claude-skill",
    tags: ["reasoning", "coding", "analysis"],
    compatibility: ["Claude"],
    featured: true,
    configSnippet: getSkillConfig("claude-skill"),
  },
  {
    id: "openai-skill",
    name: "OpenAI (GPT / Assistants)",
    provider: "OpenAI",
    category: "ai-providers",
    icon: "Zap",
    description: "Access GPT models, Assistants API, and DALL-E. Supports function calling, code interpreter, retrieval, and multi-modal inputs.",
    mcpEndpoint: "mcp://clawxxx.skills/openai/v1",
    installCmd: "claw mcp install openai-skill",
    tags: ["gpt", "assistants", "dall-e"],
    compatibility: ["OpenAI"],
    featured: true,
    configSnippet: getSkillConfig("openai-skill"),
  },
  {
    id: "nvidia-skill",
    name: "NVIDIA (NIM / NeMo)",
    provider: "NVIDIA",
    category: "ai-providers",
    icon: "Cpu",
    description: "Run NVIDIA NIM microservices and NeMo Guardrails. Deploy optimized inference on GPU clusters with enterprise-grade safety rails.",
    mcpEndpoint: "mcp://clawxxx.skills/nvidia/v1",
    installCmd: "claw mcp install nvidia-skill",
    tags: ["gpu", "inference", "guardrails"],
    compatibility: ["NVIDIA"],
    featured: true,
    configSnippet: getSkillConfig("nvidia-skill"),
  },
  {
    id: "gemini-skill",
    name: "Google Gemini",
    provider: "Google",
    category: "ai-providers",
    icon: "Gem",
    description: "Access Gemini models for multi-modal reasoning, long documents, and code generation. Native Google Cloud integration.",
    mcpEndpoint: "mcp://clawxxx.skills/gemini/v1",
    installCmd: "claw mcp install gemini-skill",
    tags: ["multi-modal", "long-context", "google"],
    compatibility: ["Gemini"],
    configSnippet: getSkillConfig("gemini-skill"),
  },
  {
    id: "llama-skill",
    name: "Meta Llama",
    provider: "Meta",
    category: "ai-providers",
    icon: "Mountain",
    description: "Run Llama models locally or via hosted endpoints. Open-weight models with fine-tuning support and community extensions.",
    mcpEndpoint: "mcp://clawxxx.skills/llama/v1",
    installCmd: "claw mcp install llama-skill",
    tags: ["open-source", "local", "fine-tuning"],
    compatibility: ["Llama"],
    configSnippet: getSkillConfig("llama-skill"),
  },
  {
    id: "mistral-skill",
    name: "Mistral AI",
    provider: "Mistral",
    category: "ai-providers",
    icon: "Wind",
    description: "European AI models optimized for efficiency. Multi-lingual, function calling, and JSON mode. Sovereign AI for EU compliance.",
    mcpEndpoint: "mcp://clawxxx.skills/mistral/v1",
    installCmd: "claw mcp install mistral-skill",
    tags: ["european", "efficient", "multilingual"],
    compatibility: ["Mistral"],
    configSnippet: getSkillConfig("mistral-skill"),
  },
  {
    id: "cohere-skill",
    name: "Cohere",
    provider: "Cohere",
    category: "ai-providers",
    icon: "Search",
    description: "Enterprise search, RAG, and embeddings. Command models for generation, Embed for semantic search, and Rerank for result quality.",
    mcpEndpoint: "mcp://clawxxx.skills/cohere/v1",
    installCmd: "claw mcp install cohere-skill",
    tags: ["rag", "embeddings", "search"],
    compatibility: ["Cohere"],
    configSnippet: getSkillConfig("cohere-skill"),
  },
];

/* ─────────────────────────────────────────────────────────────────
 * COMMUNITY SKILLS — User-contributed packages
 * ───────────────────────────────────────────────────────────────── */
const communitySkills: MarketplaceSkill[] = [
  {
    id: "web-scraper",
    name: "Web Reader",
    provider: "Community",
    category: "community",
    icon: "Globe",
    description: "Fetch and parse web pages, extract structured data, and convert HTML to markdown. Respects robots.txt and rate limits.",
    mcpEndpoint: "mcp://clawxxx.skills/web-reader/v1",
    installCmd: "claw mcp install web-reader",
    tags: ["web", "extraction", "parsing"],
    compatibility: ["Claude", "OpenAI", "Gemini", "Llama"],
    configSnippet: getSkillConfig("web-scraper"),
  },
  {
    id: "pdf-toolkit",
    name: "PDF Toolkit",
    provider: "Community",
    category: "community",
    icon: "FileText",
    description: "Generate, merge, split, and extract text from PDFs. Create reports from templates with charts, tables, and multi-language support.",
    mcpEndpoint: "mcp://clawxxx.skills/pdf-toolkit/v1",
    installCmd: "claw mcp install pdf-toolkit",
    tags: ["pdf", "reports", "documents"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("pdf-toolkit"),
  },
  {
    id: "cron-scheduler",
    name: "Task Scheduler",
    provider: "Community",
    category: "community",
    icon: "Clock",
    description: "Schedule recurring tasks with cron expressions. Run health checks, generate reports, send reminders, and trigger workflows on a cadence.",
    mcpEndpoint: "mcp://clawxxx.skills/scheduler/v1",
    installCmd: "claw mcp install task-scheduler",
    tags: ["automation", "scheduling", "cron"],
    compatibility: ["Claude", "OpenAI", "Gemini", "Llama"],
    configSnippet: getSkillConfig("cron-scheduler"),
  },
  {
    id: "governance-auditor",
    name: "Governance Auditor",
    provider: "AiGovOps Foundation",
    category: "community",
    icon: "ShieldCheck",
    description: "Automated compliance checks against AiGovOps standards. Hash-chain audit trails, SBOM generation, and Four-Way Test validation.",
    mcpEndpoint: "mcp://clawxxx.skills/governance/v1",
    installCmd: "claw mcp install governance-auditor",
    tags: ["compliance", "audit", "governance"],
    compatibility: ["Claude", "OpenAI", "Gemini", "NVIDIA"],
    featured: true,
    configSnippet: getSkillConfig("governance-auditor"),
  },
  {
    id: "memory-store",
    name: "Memory Store",
    provider: "Community",
    category: "community",
    icon: "Brain",
    description: "Persistent memory for agents — store facts, preferences, and conversation context. Vector-backed retrieval with semantic search.",
    mcpEndpoint: "mcp://clawxxx.skills/memory/v1",
    installCmd: "claw mcp install memory-store",
    tags: ["memory", "context", "persistence"],
    compatibility: ["Claude", "OpenAI", "Gemini", "Llama"],
    configSnippet: getSkillConfig("memory-store"),
  },
  {
    id: "docker-manager",
    name: "Docker Manager",
    provider: "Community",
    category: "devops",
    icon: "Container",
    description: "Build, run, stop, and inspect Docker containers. Manage images, networks, and volumes. Compose stack support included.",
    mcpEndpoint: "mcp://clawxxx.skills/docker/v1",
    installCmd: "claw mcp install docker-manager",
    tags: ["containers", "devops", "infrastructure"],
    compatibility: ["Claude", "OpenAI", "Gemini"],
    configSnippet: getSkillConfig("docker-manager"),
  },
  {
    id: "kubernetes-pilot",
    name: "Kubernetes Pilot",
    provider: "Community",
    category: "devops",
    icon: "Network",
    description: "Manage Kubernetes clusters — deploy workloads, scale pods, check status, and read logs. kubectl-compatible with namespace awareness.",
    mcpEndpoint: "mcp://clawxxx.skills/k8s/v1",
    installCmd: "claw mcp install kubernetes-pilot",
    tags: ["kubernetes", "orchestration", "devops"],
    compatibility: ["Claude", "OpenAI", "NVIDIA"],
    configSnippet: getSkillConfig("kubernetes-pilot"),
  },
];

/* ─── Export all ─── */
export const allMarketplaceSkills: MarketplaceSkill[] = [
  ...connections,
  ...aiProviders,
  ...communitySkills,
];

export const skillCategories = [
  { id: "connections" as const, title: "Connections", subtitle: "Plug into the tools your team already uses", icon: "Plug" },
  { id: "ai-providers" as const, title: "AI Providers", subtitle: "First-party model integrations from leading AI labs", icon: "Cpu" },
  { id: "community" as const, title: "Community Skills", subtitle: "Open-source packages built by the ClawXXX community", icon: "Users" },
  { id: "devops" as const, title: "DevOps & Infrastructure", subtitle: "Container, orchestration, and deployment tools", icon: "Server" },
  { id: "data" as const, title: "Data & Analytics", subtitle: "Database connectors and data pipeline tools", icon: "Database" },
];

/* ─── Donation tiers ─── */
export interface DonationTier {
  id: string;
  emoji: string;
  drink: string;
  region: string;
  amount: number;
  stripeStub: string;
}

export const donationTiers: DonationTier[] = [
  { id: "coffee", emoji: "☕", drink: "Coffee", region: "Americas & Europe", amount: 3, stripeStub: "https://donate.stripe.com/placeholder_coffee" },
  { id: "tea", emoji: "🍵", drink: "Tea", region: "Asia & Middle East", amount: 3, stripeStub: "https://donate.stripe.com/placeholder_tea" },
  { id: "yerba", emoji: "🧉", drink: "Yerba Mate", region: "South America", amount: 5, stripeStub: "https://donate.stripe.com/placeholder_yerba" },
  { id: "chai", emoji: "🫖", drink: "Chai", region: "South Asia", amount: 3, stripeStub: "https://donate.stripe.com/placeholder_chai" },
  { id: "kahawa", emoji: "☕", drink: "Kahawa", region: "East Africa", amount: 3, stripeStub: "https://donate.stripe.com/placeholder_kahawa" },
  { id: "samovar", emoji: "🫖", drink: "Samovar Tea", region: "Central Asia & Russia", amount: 5, stripeStub: "https://donate.stripe.com/placeholder_samovar" },
];

/* ─── Community Curators ─── */
export interface Curator {
  name: string;
  role: string;
  email: string;
}

export const curators: Curator[] = [
  { name: "Ken Johnston", role: "Community Curator", email: "Ken.Johnston@aigovops.community" },
  { name: "Bob Rapp", role: "Community Curator", email: "Bob.Rapp@aigovops.community" },
];
