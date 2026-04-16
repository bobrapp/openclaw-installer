/**
 * Unified Marketplace Data Model
 * 
 * Consolidates agents, MCP connectors, hosting providers, and 1-click configs
 * into a single browsable, installable, and deployable marketplace.
 * 
 * Every entry is a MarketplaceEntry — the `kind` field determines behavior:
 * - agent:        An agent pattern (YAML template, config, personality)
 * - connector:    An MCP connector (API integration, webhook, data source)
 * - hosting:      A hosting provider (VPS, PaaS, cloud platform)
 * - one-click:    A bundled config (agent + connectors + host = deployable unit)
 */

// ── Core Types ──

export type EntryKind = "agent" | "connector" | "hosting" | "one-click";

/** Trust tier indicating the provenance and review status of a marketplace entry. */
export type TrustTier = "official" | "verified" | "listed";

export type EntryCategory =
  // Connector categories
  | "messaging" | "code" | "data" | "devops" | "ai-provider" | "productivity"
  // Agent categories
  | "core-agent" | "community-agent" | "indigenous" | "earth" | "makers" | "animals"
  // Hosting categories
  | "vps" | "paas" | "cloud-major" | "free-tier"
  // Bundle categories
  | "starter-bundle" | "enterprise-bundle" | "privacy-bundle";

export interface InputField {
  id: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "toggle";
  placeholder?: string;
  required: boolean;
  secret?: boolean;           // Will not appear in audit logs
  options?: string[];         // For select type
  default?: string;
  helpText?: string;
  validation?: string;        // Regex pattern
}

export interface DeployTarget {
  hostId: string;             // "macos" | "digitalocean" | "aws" | "gcp" | "azure" | "generic-vps"
  supported: boolean;
  oneClickAvailable: boolean;
  estimatedMinutes: number;
  notes?: string;
}

export interface MarketplaceEntry {
  id: string;
  kind: EntryKind;
  name: string;
  provider: string;
  category: EntryCategory;
  icon: string;               // lucide-react icon name
  description: string;
  tags: string[];
  featured?: boolean;

  // ── Connector-specific ──
  mcpEndpoint?: string;
  compatibility?: string[];   // ["Claude", "OpenAI", "Gemini", etc.]
  configSnippet?: string;     // YAML config example
  installCmd?: string;

  // ── Agent-specific ──
  agentYaml?: string;         // Full agent template YAML
  personality?: string;       // Short personality description
  humanApproval?: "always" | "risky" | "never";

  // ── Hosting-specific ──
  price?: string;
  priceNote?: string;
  specs?: string[];
  url?: string;
  deployType?: "paas" | "vps-cloudinit" | "vps-manual" | "cloud-api";
  couponCode?: string;
  couponNote?: string;
  region?: string[];          // Available regions
  freeCredits?: string;

  // ── 1-Click Bundle ──
  bundleAgents?: string[];    // IDs of included agents
  bundleConnectors?: string[];// IDs of included connectors
  bundleHost?: string;        // ID of target hosting provider
  requiredInputs?: InputField[];
  deployTargets?: DeployTarget[];
  estimatedCost?: string;

  // ── Trust ──
  trustTier?: TrustTier;           // defaults to "listed"

  // ── Shared ──
  docsUrl?: string;
  sourceUrl?: string;
  version?: string;
  updatedAt?: string;         // ISO date
  communityRating?: number;   // 1-5
  installCount?: number;
}

// ── Deploy Pipeline Types ──

export type PipelineStage = "collect" | "validate" | "smoke" | "stress" | "simulate" | "deploy" | "verify";

export interface PipelineStep {
  stage: PipelineStage;
  label: string;
  description: string;
  estimatedSeconds: number;
  requiresPermission: boolean;
  rollbackAvailable: boolean;
}

export interface DeployManifest {
  bundleId: string;
  hostTarget: string;
  inputs: Record<string, string>;  // Collected user inputs
  agents: MarketplaceEntry[];
  connectors: MarketplaceEntry[];
  host: MarketplaceEntry;
  generatedConfig: string;         // Full YAML config
  pipeline: PipelineStep[];
  auditChainHash?: string;
}

// ── Pipeline Templates ──

export const PIPELINE_STAGES: PipelineStep[] = [
  { stage: "collect",  label: "Collect Inputs",     description: "Gather API keys, credentials, and preferences", estimatedSeconds: 0,  requiresPermission: false, rollbackAvailable: false },
  { stage: "validate", label: "Validate Config",    description: "Check all inputs, verify connectivity",         estimatedSeconds: 5,  requiresPermission: false, rollbackAvailable: false },
  { stage: "smoke",    label: "Smoke Test",          description: "Quick health check — can we reach the target?",  estimatedSeconds: 10, requiresPermission: false, rollbackAvailable: false },
  { stage: "stress",   label: "Stress Simulation",   description: "Simulate concurrent requests and load patterns",  estimatedSeconds: 15, requiresPermission: false, rollbackAvailable: false },
  { stage: "simulate", label: "Dry Run",             description: "Full install simulation — no changes made",       estimatedSeconds: 20, requiresPermission: false, rollbackAvailable: false },
  { stage: "deploy",   label: "Deploy",              description: "Execute install step-by-step on target",          estimatedSeconds: 60, requiresPermission: true,  rollbackAvailable: true  },
  { stage: "verify",   label: "Post-Deploy Verify",  description: "Health check, audit log, hash chain seal",        estimatedSeconds: 10, requiresPermission: false, rollbackAvailable: true  },
];

// ── Host Target Registry ──

export const HOST_TARGETS = [
  { id: "macos",          name: "macOS (Local)",    icon: "Apple",  emoji: "🍎", group: "local" },
  { id: "digitalocean",   name: "DigitalOcean",     icon: "Cloud",  emoji: "🌊", group: "cloud" },
  { id: "aws",            name: "AWS EC2",          icon: "Cloud",  emoji: "☁️",  group: "cloud-major" },
  { id: "gcp",            name: "Google Cloud",     icon: "Cloud",  emoji: "🔵", group: "cloud-major" },
  { id: "azure",          name: "Azure VM",         icon: "Cloud",  emoji: "☁️",  group: "cloud" },
  { id: "generic-vps",    name: "Generic VPS",      icon: "Server", emoji: "🖥️",  group: "generic" },
] as const;

export type HostTargetId = typeof HOST_TARGETS[number]["id"];

// ── Required Inputs per Host ──

export const HOST_REQUIRED_INPUTS: Record<string, InputField[]> = {
  macos: [
    { id: "installDir",    label: "Install Directory",  type: "text",     required: true,  default: "~/.openclaw",          placeholder: "~/.openclaw" },
    { id: "serviceName",   label: "Service Name",       type: "text",     required: true,  default: "com.clawdbot.gateway", placeholder: "com.clawdbot.gateway" },
    { id: "bindAddr",      label: "Bind Address",       type: "text",     required: true,  default: "127.0.0.1",            placeholder: "127.0.0.1" },
    { id: "logDir",        label: "Log Directory",      type: "text",     required: true,  default: "/var/log/openclaw",    placeholder: "/var/log/openclaw" },
    { id: "apiKey",        label: "API Key",            type: "password", required: false, secret: true,                     placeholder: "Set post-install", helpText: "If provided, stored securely in Keychain" },
  ],
  digitalocean: [
    { id: "doToken",       label: "DO API Token",       type: "password", required: true,  secret: true, placeholder: "dop_v1_...", helpText: "From cloud.digitalocean.com/account/api/tokens" },
    { id: "region",        label: "Region",             type: "select",   required: true,  default: "nyc3", options: ["nyc1", "nyc3", "sfo3", "ams3", "sgp1", "lon1", "fra1", "blr1"] },
    { id: "dropletSize",   label: "Droplet Size",       type: "select",   required: true,  default: "s-1vcpu-1gb", options: ["s-1vcpu-512mb-10gb", "s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-2gb", "s-2vcpu-4gb"] },
    { id: "sshKeyId",      label: "SSH Key ID",         type: "text",     required: true,  placeholder: "12345678", helpText: "From doctl compute ssh-key list" },
    { id: "apiKey",        label: "AI Provider API Key", type: "password", required: false, secret: true, placeholder: "Set post-install" },
  ],
  aws: [
    { id: "awsAccessKey",  label: "AWS Access Key",     type: "password", required: true,  secret: true, placeholder: "AKIA...",     helpText: "IAM user with EC2 + SSM permissions" },
    { id: "awsSecretKey",  label: "AWS Secret Key",     type: "password", required: true,  secret: true, placeholder: "wJal...",     helpText: "Never stored in logs" },
    { id: "awsRegion",     label: "AWS Region",         type: "select",   required: true,  default: "us-east-1", options: ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"] },
    { id: "instanceType",  label: "Instance Type",      type: "select",   required: true,  default: "t3.micro", options: ["t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge"] },
    { id: "keyPairName",   label: "SSH Key Pair Name",  type: "text",     required: true,  placeholder: "my-keypair",  helpText: "Existing EC2 key pair name" },
    { id: "apiKey",        label: "AI Provider API Key", type: "password", required: false, secret: true, placeholder: "Set post-install" },
  ],
  gcp: [
    { id: "gcpProject",    label: "GCP Project ID",     type: "text",     required: true,  placeholder: "my-project-123", helpText: "From console.cloud.google.com" },
    { id: "gcpServiceKey", label: "Service Account Key", type: "password", required: true, secret: true, placeholder: "JSON key file contents", helpText: "Compute Engine + Secret Manager access" },
    { id: "gcpRegion",     label: "Region",             type: "select",   required: true,  default: "us-central1", options: ["us-central1", "us-east1", "us-west1", "europe-west1", "europe-west4", "asia-east1", "asia-southeast1"] },
    { id: "gcpZone",       label: "Zone",               type: "select",   required: true,  default: "us-central1-a", options: ["us-central1-a", "us-central1-b", "us-east1-b", "us-west1-a", "europe-west1-b", "asia-east1-a"] },
    { id: "machineType",   label: "Machine Type",       type: "select",   required: true,  default: "e2-micro", options: ["e2-micro", "e2-small", "e2-medium", "n2-standard-2"] },
    { id: "apiKey",        label: "AI Provider API Key", type: "password", required: false, secret: true, placeholder: "Set post-install" },
  ],
  azure: [
    { id: "azureSubId",    label: "Subscription ID",    type: "text",     required: true,  placeholder: "xxxxxxxx-xxxx-...", helpText: "From Azure Portal" },
    { id: "azureTenantId", label: "Tenant ID",          type: "text",     required: true,  placeholder: "xxxxxxxx-xxxx-..." },
    { id: "azureClientId", label: "App Client ID",      type: "text",     required: true,  placeholder: "xxxxxxxx-xxxx-..." },
    { id: "azureSecret",   label: "Client Secret",      type: "password", required: true,  secret: true, placeholder: "..." },
    { id: "azureRegion",   label: "Region",             type: "select",   required: true,  default: "eastus", options: ["eastus", "eastus2", "westus2", "centralus", "westeurope", "northeurope", "southeastasia"] },
    { id: "vmSize",        label: "VM Size",            type: "select",   required: true,  default: "Standard_B1s", options: ["Standard_B1s", "Standard_B1ms", "Standard_B2s", "Standard_D2s_v3"] },
    { id: "apiKey",        label: "AI Provider API Key", type: "password", required: false, secret: true, placeholder: "Set post-install" },
  ],
  "generic-vps": [
    { id: "sshHost",       label: "SSH Host",           type: "text",     required: true,  placeholder: "203.0.113.10" },
    { id: "sshUser",       label: "SSH User",           type: "text",     required: true,  default: "root",    placeholder: "root" },
    { id: "sshPort",       label: "SSH Port",           type: "number",   required: true,  default: "22",      placeholder: "22" },
    { id: "apiKey",        label: "AI Provider API Key", type: "password", required: false, secret: true, placeholder: "Set post-install" },
  ],
};


// ══════════════════════════════════════════════════════════════
//  PRE-BUILT 1-CLICK BUNDLES
// ══════════════════════════════════════════════════════════════

export const oneClickBundles: MarketplaceEntry[] = [
  {
    id: "ai-chat-gateway-do",
    kind: "one-click",
    trustTier: "official",
    name: "AI Chat Gateway on DigitalOcean",
    provider: "AiGovOps Foundation",
    category: "starter-bundle",
    icon: "Rocket",
    description: "A privacy-first AI chat gateway with Slack integration, GitHub connector, and OpenAI/Claude support. Deploys to a $4/mo DigitalOcean Droplet in ~3 minutes.",
    tags: ["chat", "gateway", "privacy", "slack", "github"],
    featured: true,
    bundleAgents: ["greeter", "guardian"],
    bundleConnectors: ["slack-connector", "github-connector", "openai-provider"],
    bundleHost: "digitalocean-droplets",
    deployTargets: [
      { hostId: "digitalocean", supported: true,  oneClickAvailable: true,  estimatedMinutes: 3 },
      { hostId: "aws",          supported: true,  oneClickAvailable: true,  estimatedMinutes: 5 },
      { hostId: "gcp",          supported: true,  oneClickAvailable: true,  estimatedMinutes: 5 },
      { hostId: "azure",        supported: true,  oneClickAvailable: true,  estimatedMinutes: 5 },
      { hostId: "generic-vps",  supported: true,  oneClickAvailable: false, estimatedMinutes: 8 },
      { hostId: "macos",        supported: true,  oneClickAvailable: true,  estimatedMinutes: 2 },
    ],
    estimatedCost: "$4/mo (DigitalOcean) + AI API usage",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "multi-agent-hub-aws",
    kind: "one-click",
    trustTier: "official",
    name: "Multi-Agent Hub on AWS",
    provider: "AiGovOps Foundation",
    category: "enterprise-bundle",
    icon: "Users",
    description: "Full multi-agent setup with 6 core agents, all MCP connectors, monitoring, and auto-scaling on AWS EC2. Includes CloudWatch integration and SSM secret management.",
    tags: ["multi-agent", "enterprise", "aws", "monitoring", "auto-scale"],
    featured: true,
    bundleAgents: ["greeter", "guardian", "storyteller", "teacher", "peacekeeper", "celebrator"],
    bundleConnectors: ["slack-connector", "github-connector", "openai-provider", "claude-provider", "postgres-connector", "redis-connector"],
    bundleHost: "aws-ec2",
    deployTargets: [
      { hostId: "aws",          supported: true,  oneClickAvailable: true,  estimatedMinutes: 8 },
      { hostId: "gcp",          supported: true,  oneClickAvailable: true,  estimatedMinutes: 8 },
      { hostId: "azure",        supported: true,  oneClickAvailable: true,  estimatedMinutes: 8 },
      { hostId: "digitalocean", supported: true,  oneClickAvailable: true,  estimatedMinutes: 6 },
      { hostId: "macos",        supported: true,  oneClickAvailable: true,  estimatedMinutes: 3 },
    ],
    estimatedCost: "$12/mo (AWS t3.small) + AI API usage",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "privacy-first-local",
    kind: "one-click",
    trustTier: "official",
    name: "Privacy-First Local Setup",
    provider: "AiGovOps Foundation",
    category: "privacy-bundle",
    icon: "Shield",
    description: "Zero-cloud AI gateway. Everything runs on your Mac — Ollama for local inference, no API keys needed, all data stays on your machine. Perfect for sensitive workloads.",
    tags: ["privacy", "local", "ollama", "no-cloud", "airgap"],
    featured: true,
    bundleAgents: ["greeter", "guardian"],
    bundleConnectors: ["ollama-provider"],
    bundleHost: "macos-local",
    deployTargets: [
      { hostId: "macos",        supported: true,  oneClickAvailable: true,  estimatedMinutes: 2 },
      { hostId: "generic-vps",  supported: true,  oneClickAvailable: false, estimatedMinutes: 5, notes: "Requires GPU for reasonable inference speed" },
    ],
    estimatedCost: "Free (local hardware only)",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "governance-compliance-gcp",
    kind: "one-click",
    trustTier: "official",
    name: "Governance & Compliance on GCP",
    provider: "AiGovOps Foundation",
    category: "enterprise-bundle",
    icon: "ShieldCheck",
    description: "Enterprise governance stack with audit logging, compliance reporting, and automated policy enforcement. Deploys to GCP with Secret Manager and Cloud Logging integration.",
    tags: ["governance", "compliance", "audit", "gcp", "enterprise"],
    bundleAgents: ["guardian", "peacekeeper"],
    bundleConnectors: ["claude-provider", "github-connector", "jira-connector", "postgres-connector"],
    bundleHost: "gcp-compute",
    deployTargets: [
      { hostId: "gcp",          supported: true,  oneClickAvailable: true,  estimatedMinutes: 6 },
      { hostId: "aws",          supported: true,  oneClickAvailable: true,  estimatedMinutes: 6 },
      { hostId: "azure",        supported: true,  oneClickAvailable: true,  estimatedMinutes: 6 },
    ],
    estimatedCost: "$10/mo (GCP e2-small) + AI API usage",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
];


// ══════════════════════════════════════════════════════════════
//  HOSTING PROVIDERS (migrated from hosting-deals.tsx)
// ══════════════════════════════════════════════════════════════

export const hostingEntries: MarketplaceEntry[] = [
  {
    id: "digitalocean-droplets",
    kind: "hosting",
    trustTier: "verified",
    name: "DigitalOcean Droplets",
    provider: "DigitalOcean",
    category: "vps",
    icon: "Cloud",
    description: "Developer-friendly cloud with one-click deploy support built into OpenClaw. Simple pricing, great API.",
    tags: ["vps", "simple", "api", "one-click"],
    price: "$4/mo",
    priceNote: "Basic shared CPU Droplet",
    specs: ["1 vCPU", "512MB RAM", "10GB SSD", "500GB transfer"],
    url: "https://www.digitalocean.com/",
    deployType: "vps-cloudinit",
    featured: true,
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "aws-ec2",
    kind: "hosting",
    trustTier: "verified",
    name: "AWS EC2",
    provider: "Amazon Web Services",
    category: "cloud-major",
    icon: "Cloud",
    description: "Enterprise-grade cloud with free tier. EC2 t3.micro free for 12 months. SSM for secrets, CloudWatch for monitoring, Security Groups for firewall.",
    tags: ["enterprise", "free-tier", "iam", "ssm", "cloudwatch"],
    featured: true,
    price: "Free tier",
    priceNote: "t3.micro free for 12 months, then ~$8.50/mo",
    specs: ["2 vCPU", "1GB RAM", "30GB EBS", "750hrs/mo free"],
    url: "https://aws.amazon.com/ec2/",
    deployType: "cloud-api",
    freeCredits: "12-month free tier",
    region: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "gcp-compute",
    kind: "hosting",
    trustTier: "verified",
    name: "Google Cloud Compute Engine",
    provider: "Google Cloud",
    category: "cloud-major",
    icon: "Cloud",
    description: "Always-free e2-micro instance. Secret Manager for credentials, Cloud Logging for monitoring. Great for small governance workloads.",
    tags: ["free-tier", "google", "secret-manager", "cloud-logging"],
    featured: true,
    price: "Free tier",
    priceNote: "e2-micro always free in us-central1/us-west1/us-east1",
    specs: ["0.25 vCPU (shared)", "1GB RAM", "30GB standard disk", "1GB egress/mo"],
    url: "https://cloud.google.com/compute/",
    deployType: "cloud-api",
    freeCredits: "$300 new user credit + always-free e2-micro",
    region: ["us-central1", "us-east1", "us-west1", "europe-west1"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "azure-vm",
    kind: "hosting",
    trustTier: "verified",
    name: "Azure Virtual Machines",
    provider: "Microsoft Azure",
    category: "cloud-major",
    icon: "Cloud",
    description: "Enterprise Azure with NSG firewall, Key Vault for secrets, and Monitor for observability. B1s free for 12 months.",
    tags: ["enterprise", "free-tier", "nsg", "key-vault", "monitor"],
    price: "Free tier",
    priceNote: "B1s free for 12 months, then ~$7.59/mo",
    specs: ["1 vCPU", "1GB RAM", "64GB SSD", "750hrs/mo free"],
    url: "https://azure.microsoft.com/",
    deployType: "cloud-api",
    freeCredits: "$200 credit + 12-month free tier",
    region: ["eastus", "westus2", "westeurope", "southeastasia"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "hostinger-vps",
    kind: "hosting",
    trustTier: "verified",
    name: "Hostinger VPS",
    provider: "Hostinger",
    category: "vps",
    icon: "Server",
    description: "AI-friendly VPS with beginner tools. Matt Wolfe's pick for accessible AI hosting.",
    tags: ["beginner", "affordable", "ai-friendly"],
    price: "$3.99/mo",
    priceNote: "KVM 1 plan (48-month term)",
    specs: ["1 vCPU", "4GB RAM", "50GB NVMe SSD", "1TB transfer"],
    url: "https://www.hostinger.com/",
    deployType: "vps-manual",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "hetzner-cloud",
    kind: "hosting",
    trustTier: "verified",
    name: "Hetzner Cloud",
    provider: "Hetzner",
    category: "vps",
    icon: "Server",
    description: "German engineering, transparent pricing. Developer favorite for price-performance ratio.",
    tags: ["european", "transparent", "dev-favorite"],
    price: "€3.99/mo",
    priceNote: "CX23 plan",
    specs: ["2 vCPU", "4GB RAM", "40GB SSD", "20TB transfer"],
    url: "https://www.hetzner.com/cloud/",
    deployType: "vps-manual",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "vultr-cloud",
    kind: "hosting",
    trustTier: "verified",
    name: "Vultr Cloud Compute",
    provider: "Vultr",
    category: "vps",
    icon: "Server",
    description: "Free $300 credit for new accounts. Great for testing before committing.",
    tags: ["free-credit", "testing", "global"],
    price: "$6/mo",
    priceNote: "Regular Cloud Compute (or free with $300 credit)",
    specs: ["1 vCPU", "1GB RAM", "25GB SSD", "1TB transfer"],
    url: "https://www.vultr.com/",
    deployType: "vps-manual",
    freeCredits: "$300 new user credit",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "contabo-vps",
    kind: "hosting",
    trustTier: "verified",
    name: "Contabo VPS",
    provider: "Contabo",
    category: "vps",
    icon: "Server",
    description: "Maximum specs per dollar. Unbeatable RAM for the price.",
    tags: ["value", "high-ram", "budget"],
    price: "$3.96/mo",
    priceNote: "VPS 10 plan (12-month term)",
    specs: ["4 vCPU", "8GB RAM", "50GB NVMe SSD", "32TB transfer"],
    url: "https://contabo.com/",
    deployType: "vps-manual",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "render-paas",
    kind: "hosting",
    trustTier: "verified",
    name: "Render",
    provider: "Render",
    category: "paas",
    icon: "Layers",
    description: "Push to GitHub, Render handles the rest. Easiest deploy path for OpenClaw.",
    tags: ["paas", "git-deploy", "easy", "ssl"],
    price: "$7/mo",
    priceNote: "Starter plan",
    specs: ["0.5 vCPU", "512MB RAM", "Free SSL", "Auto-deploy from Git"],
    url: "https://render.com/",
    deployType: "paas",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "railway-paas",
    kind: "hosting",
    trustTier: "verified",
    name: "Railway",
    provider: "Railway",
    category: "paas",
    icon: "Train",
    description: "PaaS with Docker-native deploys and direct GitHub integration. Free tier available, then $5/mo hobby plan. Has an official OpenClaw Railway template for one-click deploy.",
    tags: ["paas", "docker", "github", "free-tier", "template"],
    featured: true,
    price: "$5/mo",
    priceNote: "Hobby plan; free tier available",
    specs: ["Docker containers", "GitHub-connected", "Free tier included", "Auto-deploy from Git"],
    url: "https://railway.app/",
    deployType: "paas",
    freeCredits: "Free tier included",
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "fly-io",
    kind: "hosting",
    trustTier: "verified",
    name: "Fly.io",
    provider: "Fly.io",
    category: "paas",
    icon: "Zap",
    description: "Edge container hosting with global distribution and scale-to-zero pricing. Deploy OpenClaw close to your users across 30+ regions. Starts from $3/mo.",
    tags: ["edge", "containers", "global", "scale-to-zero", "docker"],
    price: "From $3/mo",
    priceNote: "Pay-per-use; scale-to-zero when idle",
    specs: ["Global edge network", "Scale-to-zero", "Docker containers", "30+ regions"],
    url: "https://fly.io/",
    deployType: "paas",
    region: ["us-east", "us-west", "eu-central", "ap-southeast", "ap-northeast", "sa-east"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "oracle-cloud-free",
    kind: "hosting",
    trustTier: "verified",
    name: "Oracle Cloud Free Tier",
    provider: "Oracle Cloud",
    category: "free-tier",
    icon: "Database",
    description: "The best always-free cloud tier available. 4 ARM OCPU and 24GB RAM on Ampere A1 instances — permanently free. Ideal for running OpenClaw at zero cost indefinitely.",
    tags: ["free-tier", "arm", "always-free", "best-value", "oracle"],
    featured: true,
    price: "Always Free",
    priceNote: "4 OCPU + 24GB RAM ARM — no expiry",
    specs: ["4 OCPU (ARM Ampere A1)", "24GB RAM", "200GB block storage", "Always free — no expiry"],
    url: "https://www.oracle.com/cloud/free/",
    deployType: "cloud-api",
    freeCredits: "Always-free ARM tier",
    region: ["us-ashburn-1", "us-phoenix-1", "eu-frankfurt-1", "ap-tokyo-1", "ap-singapore-1"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "ovhcloud-vps",
    kind: "hosting",
    trustTier: "listed",
    name: "OVHcloud VPS",
    provider: "OVHcloud",
    category: "vps",
    icon: "Shield",
    description: "EU-sovereign cloud with strong GDPR compliance posture. Ideal for European deployments requiring data residency. Affordable entry pricing from €3.50/mo.",
    tags: ["eu", "gdpr", "sovereignty", "data-residency", "europe"],
    price: "From €3.50/mo",
    priceNote: "Starter VPS plan",
    specs: ["1 vCPU", "2GB RAM", "20GB SSD", "100Mbps unmetered"],
    url: "https://www.ovhcloud.com/",
    deployType: "vps-manual",
    region: ["EU-WEST", "EU-CENTRAL", "US-EAST", "CA-EAST", "AP-SOUTHEAST"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "tencent-lighthouse",
    kind: "hosting",
    trustTier: "verified",
    name: "Tencent Cloud Lighthouse",
    provider: "Tencent Cloud",
    category: "vps",
    icon: "Globe",
    description: "Optimized for China and Asia-Pacific deployments. Features an official OpenClaw template in the AI Agent category for rapid provisioning. From ¥24/mo.",
    tags: ["china", "asia-pacific", "template", "openclaw-native", "lighthouse"],
    featured: true,
    price: "From ¥24/mo",
    priceNote: "Lighthouse entry plan",
    specs: ["1 vCPU", "2GB RAM", "50GB SSD", "200GB/mo transfer"],
    url: "https://www.tencentcloud.com/products/lighthouse",
    deployType: "vps-cloudinit",
    region: ["ap-beijing", "ap-shanghai", "ap-guangzhou", "ap-chengdu", "ap-singapore", "ap-tokyo"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "alibaba-cloud-ecs",
    kind: "hosting",
    trustTier: "verified",
    name: "Alibaba Cloud ECS",
    provider: "Alibaba Cloud",
    category: "cloud-major",
    icon: "Globe",
    description: "The largest Asian cloud provider with strong coverage in Asia, Middle East, and Africa. Essential for deployments targeting emerging markets and APAC enterprise customers.",
    tags: ["asia", "middle-east", "africa", "apac", "alibaba", "emerging-markets"],
    price: "From $3.47/mo",
    priceNote: "ecs.t5-lc1m1.small instance",
    specs: ["1 vCPU", "1GB RAM", "40GB cloud disk", "1Mbps bandwidth"],
    url: "https://www.alibabacloud.com/product/ecs",
    deployType: "cloud-api",
    region: ["cn-hangzhou", "cn-beijing", "cn-shanghai", "ap-southeast-1", "me-east-1", "ap-south-1", "eu-central-1"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
  {
    id: "kamatera-cloud",
    kind: "hosting",
    trustTier: "listed",
    name: "Kamatera Cloud",
    provider: "Kamatera",
    category: "vps",
    icon: "Server",
    description: "Flexible cloud infrastructure across 24 global data centers with strong Middle East and Asia coverage. Fully customizable CPU/RAM/storage configurations from $4/mo.",
    tags: ["middle-east", "asia", "custom-config", "global", "flexible"],
    price: "From $4/mo",
    priceNote: "1 vCPU, 1GB RAM custom config",
    specs: ["Custom CPU/RAM/SSD", "24 global DCs", "SLA 99.95%", "Hourly billing"],
    url: "https://www.kamatera.com/",
    deployType: "vps-manual",
    region: ["us-east", "us-west", "eu-west", "me-tel-aviv", "me-dubai", "ap-hong-kong", "ap-singapore"],
    version: "1.0.0",
    updatedAt: "2026-04-16",
  },
];


// ══════════════════════════════════════════════════════════════
//  QUERY HELPERS
// ══════════════════════════════════════════════════════════════

/** Get all marketplace entries of a given kind */
export function getEntriesByKind(kind: EntryKind): MarketplaceEntry[] {
  return getAllEntries().filter(e => e.kind === kind);
}

/** Get all marketplace entries */
export function getAllEntries(): MarketplaceEntry[] {
  // Import existing skills and patterns, merge with hosting and bundles
  return [...hostingEntries, ...oneClickBundles];
  // Note: connector and agent entries are loaded from existing data sources
  // and merged at the page level for backward compatibility
}

/** Get a single entry by ID */
export function getEntryById(id: string): MarketplaceEntry | undefined {
  return getAllEntries().find(e => e.id === id);
}

/** Get deploy targets for a host */
export function getHostInputs(hostId: string): InputField[] {
  return HOST_REQUIRED_INPUTS[hostId] || [];
}
