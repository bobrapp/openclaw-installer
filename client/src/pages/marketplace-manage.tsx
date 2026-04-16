/**
 * Marketplace Manage — Add/Edit marketplace entries and export YAML configs.
 * Supports agent, connector, hosting, and one-click entry kinds.
 * Live YAML preview updates as the form is filled in.
 */
import { useState, useMemo, useCallback } from "react";
import { Settings, Copy, Check, Download, GitBranch, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { resolveIcon } from "@/lib/icon-map";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { PageHero } from "@/components/page-hero";
import { PageFooter } from "@/components/page-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketplaceEntry, EntryKind, EntryCategory } from "@/data/marketplace-unified";

// ── YAML serialiser (no external library) ──────────────────────────────────

function toYaml(entry: Partial<MarketplaceEntry>): string {
  const lines: string[] = [];
  const add = (key: string, val: unknown, indent = 0) => {
    const pad = "  ".repeat(indent);
    if (val === undefined || val === null || val === "") return;
    if (Array.isArray(val)) {
      if (val.length === 0) return;
      lines.push(`${pad}${key}:`);
      val.forEach((v) => lines.push(`${pad}  - ${v}`));
    } else if (typeof val === "object") {
      lines.push(`${pad}${key}:`);
      Object.entries(val as Record<string, unknown>).forEach(([k, v]) =>
        add(k, v, indent + 1)
      );
    } else {
      // Multiline strings
      const s = String(val);
      if (s.includes("\n")) {
        lines.push(`${pad}${key}: |`);
        s.split("\n").forEach((line) => lines.push(`${pad}  ${line}`));
      } else {
        lines.push(`${pad}${key}: ${val}`);
      }
    }
  };
  Object.entries(entry).forEach(([k, v]) => add(k, v));
  return lines.join("\n");
}

// ── Category options per kind ─────────────────────────────────────────────

const CATEGORIES_BY_KIND: Record<EntryKind, { value: EntryCategory; label: string }[]> = {
  connector: [
    { value: "messaging",    label: "Messaging" },
    { value: "code",         label: "Code" },
    { value: "data",         label: "Data" },
    { value: "devops",       label: "DevOps" },
    { value: "ai-provider",  label: "AI Provider" },
    { value: "productivity", label: "Productivity" },
  ],
  agent: [
    { value: "core-agent",      label: "Core Agent" },
    { value: "community-agent", label: "Community Agent" },
    { value: "indigenous",      label: "Indigenous" },
    { value: "earth",           label: "Earth" },
    { value: "makers",          label: "Makers" },
    { value: "animals",         label: "Animals" },
  ],
  hosting: [
    { value: "vps",         label: "VPS" },
    { value: "paas",        label: "PaaS" },
    { value: "cloud-major", label: "Cloud (Major)" },
    { value: "free-tier",   label: "Free Tier" },
  ],
  "one-click": [
    { value: "starter-bundle",    label: "Starter Bundle" },
    { value: "enterprise-bundle", label: "Enterprise Bundle" },
    { value: "privacy-bundle",    label: "Privacy Bundle" },
  ],
};

const COMPATIBILITY_OPTIONS = [
  "Claude", "OpenAI", "NVIDIA", "Gemini", "Llama", "Mistral", "Cohere",
];

// ── Form state ─────────────────────────────────────────────────────────────

interface FormState {
  // Common
  name: string;
  kind: EntryKind | "";
  provider: string;
  category: EntryCategory | "";
  icon: string;
  description: string;
  tags: string;
  featured: boolean;
  docsUrl: string;
  sourceUrl: string;
  version: string;
  // Connector
  mcpEndpoint: string;
  compatibility: string[];
  configSnippet: string;
  installCmd: string;
  // Agent
  agentYaml: string;
  personality: string;
  humanApproval: "always" | "risky" | "never" | "";
  // Hosting
  price: string;
  priceNote: string;
  specs: string;
  url: string;
  deployType: "paas" | "vps-cloudinit" | "vps-manual" | "cloud-api" | "";
  couponCode: string;
  freeCredits: string;
  // One-click
  bundleAgents: string;
  bundleConnectors: string;
  bundleHost: string;
  estimatedCost: string;
}

const INITIAL: FormState = {
  name: "", kind: "", provider: "", category: "", icon: "",
  description: "", tags: "", featured: false, docsUrl: "", sourceUrl: "",
  version: "1.0.0",
  mcpEndpoint: "", compatibility: [], configSnippet: "", installCmd: "",
  agentYaml: "", personality: "", humanApproval: "",
  price: "", priceNote: "", specs: "", url: "", deployType: "",
  couponCode: "", freeCredits: "",
  bundleAgents: "", bundleConnectors: "", bundleHost: "", estimatedCost: "",
};

// ── Validation ─────────────────────────────────────────────────────────────

interface Errors {
  name?: string;
  kind?: string;
  provider?: string;
  description?: string;
}

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.name.trim())        e.name        = "Name is required";
  if (!form.kind)               e.kind        = "Kind is required";
  if (!form.provider.trim())    e.provider    = "Provider is required";
  if (!form.description.trim()) e.description = "Description is required";
  return e;
}

// ── Convert form → partial MarketplaceEntry ────────────────────────────────

function formToEntry(form: FormState): Partial<MarketplaceEntry> {
  const csv = (v: string) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const base: Partial<MarketplaceEntry> = {
    ...(form.name        && { name:        form.name }),
    ...(form.kind        && { kind:        form.kind as EntryKind }),
    ...(form.provider    && { provider:    form.provider }),
    ...(form.category    && { category:    form.category as EntryCategory }),
    ...(form.icon        && { icon:        form.icon }),
    ...(form.description && { description: form.description }),
    ...(form.tags        && { tags:        csv(form.tags) }),
    ...(form.featured    && { featured:    true }),
    ...(form.docsUrl     && { docsUrl:     form.docsUrl }),
    ...(form.sourceUrl   && { sourceUrl:   form.sourceUrl }),
    ...(form.version     && { version:     form.version }),
  };

  if (form.kind === "connector") {
    Object.assign(base, {
      ...(form.mcpEndpoint       && { mcpEndpoint:    form.mcpEndpoint }),
      ...(form.compatibility.length && { compatibility: form.compatibility }),
      ...(form.configSnippet     && { configSnippet: form.configSnippet }),
      ...(form.installCmd        && { installCmd:    form.installCmd }),
    });
  }

  if (form.kind === "agent") {
    Object.assign(base, {
      ...(form.agentYaml     && { agentYaml:     form.agentYaml }),
      ...(form.personality   && { personality:   form.personality }),
      ...(form.humanApproval && { humanApproval: form.humanApproval as "always" | "risky" | "never" }),
    });
  }

  if (form.kind === "hosting") {
    Object.assign(base, {
      ...(form.price      && { price:      form.price }),
      ...(form.priceNote  && { priceNote:  form.priceNote }),
      ...(form.specs      && { specs:      csv(form.specs) }),
      ...(form.url        && { url:        form.url }),
      ...(form.deployType && { deployType: form.deployType as "paas" | "vps-cloudinit" | "vps-manual" | "cloud-api" }),
      ...(form.couponCode && { couponCode: form.couponCode }),
      ...(form.freeCredits && { freeCredits: form.freeCredits }),
    });
  }

  if (form.kind === "one-click") {
    Object.assign(base, {
      ...(form.bundleAgents     && { bundleAgents:      csv(form.bundleAgents) }),
      ...(form.bundleConnectors && { bundleConnectors:  csv(form.bundleConnectors) }),
      ...(form.bundleHost       && { bundleHost:        form.bundleHost }),
      ...(form.estimatedCost    && { estimatedCost:     form.estimatedCost }),
    });
  }

  return base;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mt-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">
          {title}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  error,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── PR instructions ────────────────────────────────────────────────────────

function PrInstructions({ filename }: { filename: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <GitBranch className="h-4 w-4 text-primary" />
        Submit as Pull Request
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Save the YAML above to{" "}
        <code className="text-primary bg-muted px-1 py-0.5 rounded text-[11px]">
          data/marketplace/{filename}.yaml
        </code>{" "}
        in the OpenClaw repository, then run:
      </p>
      <pre className="bg-muted rounded-md p-3 text-xs font-mono text-foreground overflow-x-auto leading-relaxed whitespace-pre">
{`git checkout -b feat/marketplace-${filename}
git add data/marketplace/${filename}.yaml
git commit -m "feat(marketplace): add ${filename} entry"
gh pr create --title "Add ${filename} to marketplace" \\
  --body "New marketplace entry submitted via the management UI."`}
      </pre>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MarketplaceManage() {
  const { t } = useI18n();
  const { copy, copied } = useCopyToClipboard({ fallbackFilename: "marketplace-entry" });

  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const SettingsIcon = resolveIcon("Settings");

  // Live YAML
  const entry = useMemo(() => formToEntry(form), [form]);
  const yaml  = useMemo(() => toYaml(entry), [entry]);

  const slug = form.name
    ? form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "entry";

  // Generic field updater
  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  // Compatibility multi-select toggle
  const toggleCompat = (c: string) =>
    setForm((prev) => ({
      ...prev,
      compatibility: prev.compatibility.includes(c)
        ? prev.compatibility.filter((x) => x !== c)
        : [...prev.compatibility, c],
    }));

  // Download YAML
  const downloadYaml = () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${slug}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Form submit (validation only — no side effects)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const categories = form.kind ? CATEGORIES_BY_KIND[form.kind as EntryKind] : [];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full space-y-6">

        {/* Hero */}
        <PageHero
          icon={<SettingsIcon className="h-5 w-5 text-primary" />}
          title={t.manageTitle || "Manage Marketplace"}
          subtitle={t.manageSubtitle || "Create, edit, and export marketplace entries as YAML."}
          testId="manage-hero-title"
        />

        {/* ── Section 1: Form ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-primary" />
              {t.manageAddEntry || "Add New Entry"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              {/* Common fields */}
              <FieldGroup title="Common Fields">
                <FieldRow>
                  <Field label="Name" required error={errors.name}>
                    <Input
                      data-testid="field-name"
                      placeholder="e.g. Slack Connector"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Kind" required error={errors.kind}>
                    <Select
                      value={form.kind}
                      onValueChange={(v) => {
                        set("kind", v as EntryKind);
                        set("category", "");
                      }}
                    >
                      <SelectTrigger data-testid="field-kind">
                        <SelectValue placeholder="Select kind…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="connector">Connector</SelectItem>
                        <SelectItem value="hosting">Hosting</SelectItem>
                        <SelectItem value="one-click">1-Click Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldRow>

                <FieldRow>
                  <Field label="Provider" required error={errors.provider}>
                    <Input
                      data-testid="field-provider"
                      placeholder="e.g. AiGovOps"
                      value={form.provider}
                      onChange={(e) => set("provider", e.target.value)}
                    />
                  </Field>
                  <Field label="Category">
                    <Select
                      value={form.category}
                      onValueChange={(v) => set("category", v as EntryCategory)}
                      disabled={!form.kind}
                    >
                      <SelectTrigger data-testid="field-category">
                        <SelectValue placeholder={form.kind ? "Select category…" : "Select kind first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldRow>

                <FieldRow>
                  <Field label="Icon (Lucide name)">
                    <Input
                      data-testid="field-icon"
                      placeholder="e.g. Plug, Brain, Server"
                      value={form.icon}
                      onChange={(e) => set("icon", e.target.value)}
                    />
                  </Field>
                  <Field label="Version">
                    <Input
                      data-testid="field-version"
                      placeholder="1.0.0"
                      value={form.version}
                      onChange={(e) => set("version", e.target.value)}
                    />
                  </Field>
                </FieldRow>

                <Field label="Description" required error={errors.description} className="col-span-2">
                  <Textarea
                    data-testid="field-description"
                    placeholder="Describe what this entry does…"
                    rows={3}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>

                <FieldRow>
                  <Field label="Tags (comma-separated)">
                    <Input
                      data-testid="field-tags"
                      placeholder="mcp, governance, ai"
                      value={form.tags}
                      onChange={(e) => set("tags", e.target.value)}
                    />
                  </Field>
                  <Field label="Docs URL">
                    <Input
                      data-testid="field-docsUrl"
                      type="url"
                      placeholder="https://docs.example.com"
                      value={form.docsUrl}
                      onChange={(e) => set("docsUrl", e.target.value)}
                    />
                  </Field>
                </FieldRow>

                <FieldRow>
                  <Field label="Source URL">
                    <Input
                      data-testid="field-sourceUrl"
                      type="url"
                      placeholder="https://github.com/org/repo"
                      value={form.sourceUrl}
                      onChange={(e) => set("sourceUrl", e.target.value)}
                    />
                  </Field>
                  <Field label="">
                    <label
                      className="flex items-center gap-2 cursor-pointer mt-6 text-sm select-none"
                      htmlFor="field-featured"
                    >
                      <Checkbox
                        id="field-featured"
                        data-testid="field-featured"
                        checked={form.featured}
                        onCheckedChange={(v) => set("featured", Boolean(v))}
                      />
                      <span>Featured entry</span>
                    </label>
                  </Field>
                </FieldRow>

                {/* Trust Tier — read-only */}
                <div
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-1"
                  data-testid="field-trust-tier"
                >
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Trust Tier</Label>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground border-muted-foreground/30"
                    >
                      listed
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    New entries start as &ldquo;listed&rdquo;. Trust tier upgrades require Foundation review.
                  </p>
                </div>
              </FieldGroup>

              {/* Connector-specific */}
              {form.kind === "connector" && (
                <FieldGroup title="Connector Fields">
                  <FieldRow>
                    <Field label="MCP Endpoint">
                      <Input
                        data-testid="field-mcpEndpoint"
                        placeholder="https://mcp.example.com/v1"
                        value={form.mcpEndpoint}
                        onChange={(e) => set("mcpEndpoint", e.target.value)}
                      />
                    </Field>
                    <Field label="Install Command">
                      <Input
                        data-testid="field-installCmd"
                        placeholder="npx claw install @org/connector"
                        value={form.installCmd}
                        onChange={(e) => set("installCmd", e.target.value)}
                      />
                    </Field>
                  </FieldRow>

                  <Field label="Compatibility">
                    <div className="flex flex-wrap gap-2 pt-1" data-testid="field-compatibility">
                      {COMPATIBILITY_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCompat(c)}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            form.compatibility.includes(c)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Config Snippet (YAML)">
                    <Textarea
                      data-testid="field-configSnippet"
                      placeholder={"connector:\n  endpoint: ${MCP_ENDPOINT}\n  auth: bearer"}
                      rows={5}
                      className="font-mono text-xs"
                      value={form.configSnippet}
                      onChange={(e) => set("configSnippet", e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              )}

              {/* Agent-specific */}
              {form.kind === "agent" && (
                <FieldGroup title="Agent Fields">
                  <FieldRow>
                    <Field label="Personality">
                      <Input
                        data-testid="field-personality"
                        placeholder="Calm, methodical, governance-focused"
                        value={form.personality}
                        onChange={(e) => set("personality", e.target.value)}
                      />
                    </Field>
                    <Field label="Human Approval">
                      <Select
                        value={form.humanApproval}
                        onValueChange={(v) => set("humanApproval", v as "always" | "risky" | "never")}
                      >
                        <SelectTrigger data-testid="field-humanApproval">
                          <SelectValue placeholder="Select approval mode…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Always</SelectItem>
                          <SelectItem value="risky">Risky actions only</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>

                  <Field label="Agent YAML">
                    <Textarea
                      data-testid="field-agentYaml"
                      placeholder={"agent:\n  name: Guardian\n  model: claude-3-5-sonnet\n  tools: [read, write]"}
                      rows={8}
                      className="font-mono text-xs"
                      value={form.agentYaml}
                      onChange={(e) => set("agentYaml", e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              )}

              {/* Hosting-specific */}
              {form.kind === "hosting" && (
                <FieldGroup title="Hosting Fields">
                  <FieldRow>
                    <Field label="Price">
                      <Input
                        data-testid="field-price"
                        placeholder="$6/mo"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value)}
                      />
                    </Field>
                    <Field label="Price Note">
                      <Input
                        data-testid="field-priceNote"
                        placeholder="Billed monthly, cancel anytime"
                        value={form.priceNote}
                        onChange={(e) => set("priceNote", e.target.value)}
                      />
                    </Field>
                  </FieldRow>

                  <FieldRow>
                    <Field label="Specs (comma-separated)">
                      <Input
                        data-testid="field-specs"
                        placeholder="1 vCPU, 1 GB RAM, 25 GB SSD"
                        value={form.specs}
                        onChange={(e) => set("specs", e.target.value)}
                      />
                    </Field>
                    <Field label="Deploy Type">
                      <Select
                        value={form.deployType}
                        onValueChange={(v) =>
                          set("deployType", v as "paas" | "vps-cloudinit" | "vps-manual" | "cloud-api")
                        }
                      >
                        <SelectTrigger data-testid="field-deployType">
                          <SelectValue placeholder="Select deploy type…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paas">PaaS</SelectItem>
                          <SelectItem value="vps-cloudinit">VPS — Cloud Init</SelectItem>
                          <SelectItem value="vps-manual">VPS — Manual</SelectItem>
                          <SelectItem value="cloud-api">Cloud API</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>

                  <FieldRow>
                    <Field label="Provider URL">
                      <Input
                        data-testid="field-url"
                        type="url"
                        placeholder="https://digitalocean.com"
                        value={form.url}
                        onChange={(e) => set("url", e.target.value)}
                      />
                    </Field>
                    <Field label="Coupon Code">
                      <Input
                        data-testid="field-couponCode"
                        placeholder="OPENCLAW2024"
                        value={form.couponCode}
                        onChange={(e) => set("couponCode", e.target.value)}
                      />
                    </Field>
                  </FieldRow>

                  <Field label="Free Credits">
                    <Input
                      data-testid="field-freeCredits"
                      placeholder="$200 credit for 60 days"
                      value={form.freeCredits}
                      onChange={(e) => set("freeCredits", e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              )}

              {/* One-click-specific */}
              {form.kind === "one-click" && (
                <FieldGroup title="Bundle Fields">
                  <FieldRow>
                    <Field label="Bundle Agents (comma-separated IDs)">
                      <Input
                        data-testid="field-bundleAgents"
                        placeholder="guardian-agent, greeter-agent"
                        value={form.bundleAgents}
                        onChange={(e) => set("bundleAgents", e.target.value)}
                      />
                    </Field>
                    <Field label="Bundle Connectors (comma-separated IDs)">
                      <Input
                        data-testid="field-bundleConnectors"
                        placeholder="slack-connector, github-connector"
                        value={form.bundleConnectors}
                        onChange={(e) => set("bundleConnectors", e.target.value)}
                      />
                    </Field>
                  </FieldRow>

                  <FieldRow>
                    <Field label="Bundle Host ID">
                      <Input
                        data-testid="field-bundleHost"
                        placeholder="digitalocean"
                        value={form.bundleHost}
                        onChange={(e) => set("bundleHost", e.target.value)}
                      />
                    </Field>
                    <Field label="Estimated Cost">
                      <Input
                        data-testid="field-estimatedCost"
                        placeholder="~$12/mo"
                        value={form.estimatedCost}
                        onChange={(e) => set("estimatedCost", e.target.value)}
                      />
                    </Field>
                  </FieldRow>
                </FieldGroup>
              )}

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  data-testid="btn-validate"
                  className="w-full sm:w-auto"
                >
                  {submitted ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Valid — scroll down to export YAML
                    </>
                  ) : (
                    "Validate Entry"
                  )}
                </Button>
                {Object.keys(errors).length > 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    Please fix the errors above before exporting.
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Section 2: YAML Export ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base font-semibold">
                {t.managePreview || "Live Preview"}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="btn-copy-yaml"
                  onClick={() => copy(yaml, slug)}
                  disabled={!yaml.trim()}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />{t.manageCopyYaml || "Copy YAML"}</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1.5" />{t.manageCopyYaml || "Copy YAML"}</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="btn-download-yaml"
                  onClick={downloadYaml}
                  disabled={!yaml.trim()}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {t.manageDownloadYaml || "Download YAML"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* YAML code block */}
            <div className="relative rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border text-[10px] font-mono text-muted-foreground">
                <span>{slug}.yaml</span>
                <span className="text-primary/70">
                  {yaml.trim() ? `${yaml.split("\n").length} lines` : "Empty — fill the form above"}
                </span>
              </div>
              <pre
                data-testid="yaml-preview"
                className="p-4 text-xs font-mono text-foreground bg-muted/20 overflow-x-auto whitespace-pre leading-relaxed min-h-[100px]"
              >
                {yaml.trim() || "# Start filling in the form to see YAML output here…"}
              </pre>
            </div>

            {/* PR instructions */}
            {yaml.trim() && (
              <PrInstructions filename={slug} />
            )}
          </CardContent>
        </Card>

      </main>
      <PageFooter text={t.marketplaceFooter || "All entries follow MCP standards. Configs are portable across any MCP-compatible host."} />
    </div>
  );
}
