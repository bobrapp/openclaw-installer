/**
 * ClawXXX Skills Marketplace — Connections, AI Skills & Community Packages
 * Each skill is an MCP-compatible package that ClawXXX can install and invoke.
 */

export type SkillCategory =
  | "connections"
  | "ai-providers"
  | "community"
  | "devops"
  | "data"
  | "communication";

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
    configSnippet: `# ClawXXX Skill: Slack Connector
skill: slack-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/slack/v1
  transport: stdio
  auth:
    type: oauth2
    scopes:
      - channels:read
      - chat:write
      - reactions:write
actions:
  - send_message
  - list_channels
  - add_reaction
  - create_thread`,
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
    configSnippet: `# ClawXXX Skill: GitHub Connector
skill: github-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/github/v1
  transport: stdio
  auth:
    type: pat
    env: GITHUB_TOKEN
actions:
  - create_issue
  - open_pr
  - merge_pr
  - list_repos
  - trigger_workflow`,
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
    configSnippet: `# ClawXXX Skill: Gmail Connector
skill: gmail-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/gmail/v1
  transport: stdio
  auth:
    type: oauth2
    provider: google
    scopes:
      - gmail.readonly
      - gmail.send
actions:
  - search_email
  - send_email
  - create_draft
  - list_labels`,
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
    configSnippet: `# ClawXXX Skill: Google Drive
skill: google-drive-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/gdrive/v1
  transport: stdio
  auth:
    type: oauth2
    provider: google
actions:
  - list_files
  - upload_file
  - share_file
  - create_folder`,
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
    configSnippet: `# ClawXXX Skill: Notion
skill: notion-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/notion/v1
  transport: stdio
  auth:
    type: bearer
    env: NOTION_TOKEN
actions:
  - query_database
  - create_page
  - update_block
  - search`,
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
    configSnippet: `# ClawXXX Skill: Jira
skill: jira-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/jira/v1
  transport: stdio
  auth:
    type: api_key
    env: JIRA_API_TOKEN
actions:
  - create_issue
  - transition_issue
  - search_jql
  - add_comment`,
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
    configSnippet: `# ClawXXX Skill: Linear
skill: linear-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/linear/v1
  transport: stdio
  auth:
    type: bearer
    env: LINEAR_API_KEY
actions:
  - create_issue
  - update_status
  - list_projects
  - search_issues`,
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
    configSnippet: `# ClawXXX Skill: Salesforce
skill: salesforce-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/salesforce/v1
  transport: stdio
  auth:
    type: oauth2
    provider: salesforce
actions:
  - query_soql
  - create_record
  - update_record
  - list_objects`,
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
    configSnippet: `# ClawXXX Skill: HubSpot
skill: hubspot-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/hubspot/v1
  transport: stdio
  auth:
    type: bearer
    env: HUBSPOT_TOKEN
actions:
  - create_contact
  - create_deal
  - search_contacts
  - enroll_workflow`,
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
    configSnippet: `# ClawXXX Skill: Stripe
skill: stripe-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/stripe/v1
  transport: stdio
  auth:
    type: api_key
    env: STRIPE_SECRET_KEY
actions:
  - create_payment_link
  - list_subscriptions
  - create_invoice
  - check_balance`,
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
    configSnippet: `# ClawXXX Skill: Discord
skill: discord-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/discord/v1
  transport: stdio
  auth:
    type: bot_token
    env: DISCORD_BOT_TOKEN
actions:
  - send_message
  - create_channel
  - list_members
  - add_reaction`,
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
    configSnippet: `# ClawXXX Skill: Twilio
skill: twilio-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/twilio/v1
  transport: stdio
  auth:
    type: api_key
    env: TWILIO_AUTH_TOKEN
actions:
  - send_sms
  - make_call
  - send_whatsapp
  - check_status`,
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
    configSnippet: `# ClawXXX Skill: Google Calendar
skill: google-calendar-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/gcal/v1
  transport: stdio
  auth:
    type: oauth2
    provider: google
    scopes:
      - calendar.events
actions:
  - create_event
  - list_events
  - check_availability
  - delete_event`,
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
    configSnippet: `# ClawXXX Skill: PostgreSQL
skill: postgres-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/postgres/v1
  transport: stdio
  auth:
    type: connection_string
    env: DATABASE_URL
  read_only: true
actions:
  - run_query
  - list_tables
  - describe_table
  - export_csv`,
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
    configSnippet: `# ClawXXX Skill: Snowflake
skill: snowflake-connector
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/snowflake/v1
  transport: stdio
  auth:
    type: keypair
    env: SNOWFLAKE_PRIVATE_KEY
actions:
  - run_query
  - list_schemas
  - describe_table
  - export_results`,
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
    configSnippet: `# ClawXXX Skill: Claude (Anthropic)
skill: claude-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/claude/v1
  transport: stdio
  auth:
    type: api_key
    env: ANTHROPIC_API_KEY
models:
  - claude-sonnet-4
  - claude-opus-4
capabilities:
  - tool_use
  - long_context
  - vision`,
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
    configSnippet: `# ClawXXX Skill: OpenAI
skill: openai-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/openai/v1
  transport: stdio
  auth:
    type: api_key
    env: OPENAI_API_KEY
models:
  - gpt-5
  - gpt-5-mini
  - dall-e-3
capabilities:
  - function_calling
  - code_interpreter
  - vision`,
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
    configSnippet: `# ClawXXX Skill: NVIDIA NIM
skill: nvidia-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/nvidia/v1
  transport: stdio
  auth:
    type: api_key
    env: NVIDIA_API_KEY
services:
  - nim_inference
  - nemo_guardrails
  - triton_server`,
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
    configSnippet: `# ClawXXX Skill: Google Gemini
skill: gemini-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/gemini/v1
  transport: stdio
  auth:
    type: api_key
    env: GOOGLE_AI_KEY
models:
  - gemini-2.5-pro
  - gemini-2.5-flash`,
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
    configSnippet: `# ClawXXX Skill: Meta Llama
skill: llama-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/llama/v1
  transport: stdio
  auth:
    type: none
models:
  - llama-4-scout
  - llama-4-maverick
deployment:
  - local_ollama
  - cloud_hosted`,
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
    configSnippet: `# ClawXXX Skill: Mistral AI
skill: mistral-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/mistral/v1
  transport: stdio
  auth:
    type: api_key
    env: MISTRAL_API_KEY
models:
  - mistral-large
  - mistral-medium`,
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
    configSnippet: `# ClawXXX Skill: Cohere
skill: cohere-skill
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/cohere/v1
  transport: stdio
  auth:
    type: api_key
    env: COHERE_API_KEY
services:
  - command_generate
  - embed
  - rerank`,
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
    configSnippet: `# ClawXXX Skill: Web Reader
skill: web-reader
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/web-reader/v1
  transport: stdio
actions:
  - fetch_page
  - extract_data
  - html_to_markdown`,
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
    configSnippet: `# ClawXXX Skill: PDF Toolkit
skill: pdf-toolkit
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/pdf-toolkit/v1
  transport: stdio
actions:
  - generate_pdf
  - merge_pdfs
  - extract_text
  - fill_template`,
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
    configSnippet: `# ClawXXX Skill: Task Scheduler
skill: task-scheduler
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/scheduler/v1
  transport: stdio
actions:
  - create_schedule
  - list_schedules
  - run_once
  - delete_schedule`,
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
    configSnippet: `# ClawXXX Skill: Governance Auditor
skill: governance-auditor
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/governance/v1
  transport: stdio
standards:
  - aigovops_v1
  - four_way_test
actions:
  - run_audit
  - generate_sbom
  - verify_hash_chain
  - export_report`,
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
    configSnippet: `# ClawXXX Skill: Memory Store
skill: memory-store
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/memory/v1
  transport: stdio
  storage: sqlite
actions:
  - store_fact
  - search_memory
  - list_facts
  - forget`,
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
    configSnippet: `# ClawXXX Skill: Docker Manager
skill: docker-manager
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/docker/v1
  transport: stdio
  auth:
    type: socket
    path: /var/run/docker.sock
actions:
  - run_container
  - build_image
  - list_containers
  - compose_up`,
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
    configSnippet: `# ClawXXX Skill: Kubernetes Pilot
skill: kubernetes-pilot
version: "1.0"
mcp:
  server: mcp://clawxxx.skills/k8s/v1
  transport: stdio
  auth:
    type: kubeconfig
    path: ~/.kube/config
actions:
  - apply_manifest
  - get_pods
  - scale_deployment
  - read_logs`,
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
