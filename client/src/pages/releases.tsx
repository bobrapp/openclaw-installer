import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  Tag,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ExternalLink,
  FileDown,
  Shield,
  GitBranch,
  Lock,
  FileText,
  Users,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

interface ReleaseAsset {
  name: string;
  download_url: string;
  size: number;
}

interface SbomDiffSummary {
  old_count: number;
  new_count: number;
  added: number;
  removed: number;
  version_changed: number;
  unchanged: number;
}

interface SbomComponent {
  name: string;
  group: string;
  version: string;
  type: string;
  old_version?: string;
  new_version?: string;
}

interface SbomDiff {
  summary: SbomDiffSummary;
  added: SbomComponent[];
  removed: SbomComponent[];
  version_changed: SbomComponent[];
  old_tag: string;
  new_tag: string;
}

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
  assets: ReleaseAsset[];
  target_commitish: string;
  sbom_component_count: number | null;
  sbom_diff: SbomDiff | null;
}

interface GovernanceItem {
  name: string;
  icon: React.ReactNode;
  status: "present" | "missing";
  description: string;
  url?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function DiffBadge({ count, type }: { count: number; type: "added" | "removed" | "changed" }) {
  if (count === 0) return null;
  const config = {
    added: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", prefix: "+" },
    removed: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", prefix: "-" },
    changed: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", prefix: "~" },
  }[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${config.bg} ${config.text}`}>
      {config.prefix}{count}
    </span>
  );
}

function ComponentTable({ items, columns }: { items: SbomComponent[]; columns: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="max-h-48 overflow-auto rounded border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="text-xs py-1.5 sticky top-0 bg-muted">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => {
            const pkg = item.group ? `${item.group}/${item.name}` : item.name;
            return (
              <TableRow key={i} className="text-xs">
                <TableCell className="py-1 font-mono">{pkg}</TableCell>
                {item.old_version ? (
                  <>
                    <TableCell className="py-1 font-mono text-muted-foreground">{item.old_version}</TableCell>
                    <TableCell className="py-1 font-mono">{item.new_version}</TableCell>
                  </>
                ) : (
                  <TableCell className="py-1 font-mono">{item.version}</TableCell>
                )}
                <TableCell className="py-1 text-muted-foreground">{item.type}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SbomDiffDetail({ diff }: { diff: SbomDiff }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (section: string) => setExpanded(expanded === section ? null : section);

  const sections = [
    {
      key: "added",
      label: "Added",
      count: diff.summary.added,
      color: "text-emerald-600 dark:text-emerald-400",
      items: diff.added,
      columns: ["Package", "Version", "Type"],
    },
    {
      key: "removed",
      label: "Removed",
      count: diff.summary.removed,
      color: "text-red-600 dark:text-red-400",
      items: diff.removed,
      columns: ["Package", "Version", "Type"],
    },
    {
      key: "changed",
      label: "Version Changed",
      count: diff.summary.version_changed,
      color: "text-amber-600 dark:text-amber-400",
      items: diff.version_changed,
      columns: ["Package", "Old Version", "New Version", "Type"],
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        <DiffBadge count={diff.summary.added} type="added" />
        <DiffBadge count={diff.summary.removed} type="removed" />
        <DiffBadge count={diff.summary.version_changed} type="changed" />
        <span className="text-xs text-muted-foreground">
          {diff.summary.unchanged} unchanged
        </span>
      </div>
      {sections.map((s) =>
        s.count > 0 ? (
          <div key={s.key}>
            <button
              onClick={() => toggle(s.key)}
              className={`flex items-center gap-1.5 text-xs font-medium ${s.color} hover:underline`}
              data-testid={`button-expand-${s.key}`}
            >
              {expanded === s.key ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {s.label} ({s.count})
            </button>
            {expanded === s.key && <ComponentTable items={s.items} columns={s.columns} />}
          </div>
        ) : null
      )}
    </div>
  );
}

export default function Releases() {
  const { data, isLoading, error, refetch } = useQuery<{
    releases: Release[];
    governance: GovernanceItem[];
  }>({
    queryKey: ["/api/releases"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/releases");
      return res.json();
    },
  });

  const releases = data?.releases ?? [];
  const governance = data?.governance ?? [];

  // Build timeline chart data
  const chartData = [...releases]
    .reverse()
    .map((r) => ({
      tag: r.tag_name,
      components: r.sbom_component_count ?? 0,
      added: r.sbom_diff?.summary?.added ?? 0,
      removed: r.sbom_diff?.summary?.removed ?? 0,
      changed: r.sbom_diff?.summary?.version_changed ?? 0,
      date: formatDate(r.published_at),
    }));

  const governanceScore = governance.filter((g) => g.status === "present").length;
  const governanceTotal = governance.length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-releases-title">
            <Activity className="h-5 w-5 text-primary" />
            Release Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supply-chain drift, governance health, and release history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-releases">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            Fetching release data from GitHub...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center text-destructive">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
            Failed to fetch releases. The app may be running locally without GitHub API access.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {/* Gratitude card */}
          <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Thank you for building in the open</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Every release is a gift to the community. {releases.length > 0 ? `${releases.length} releases shipped so far.` : ''} Keep going.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Releases
                </div>
                <p className="text-2xl font-bold mt-1" data-testid="text-release-count">{releases.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Components
                </div>
                <p className="text-2xl font-bold mt-1" data-testid="text-component-count">
                  {releases[0]?.sbom_component_count ?? "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Governance
                </div>
                <p className="text-2xl font-bold mt-1" data-testid="text-governance-score">
                  {governanceScore}/{governanceTotal}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Protected
                </div>
                <p className="text-2xl font-bold mt-1" data-testid="text-protection-status">
                  {governance.find(g => g.name === "Branch protection")?.status === "present" ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Component Drift Timeline */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Component Drift Timeline
                </CardTitle>
                <CardDescription>
                  Total dependency count and changes across releases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64" data-testid="chart-component-drift">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="tag" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <Area
                        type="monotone"
                        dataKey="components"
                        name="Total Components"
                        stroke="hsl(var(--primary))"
                        fill="url(#colorComp)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="added"
                        name="Added"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        dot={{ r: 3, fill: "#10b981" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="removed"
                        name="Removed"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        dot={{ r: 3, fill: "#ef4444" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="changed"
                        name="Changed"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        dot={{ r: 3, fill: "#f59e0b" }}
                        strokeDasharray="4 2"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Governance Health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Open-Source Governance Health
              </CardTitle>
              <CardDescription>
                Project safeguards, policies, and community standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="governance-checklist">
                {governance.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-card"
                  >
                    <div className={`flex-shrink-0 ${item.status === "present" ? "text-emerald-500" : "text-muted-foreground/40"}`}>
                      {item.status === "present" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener" className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Release History Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Release History
              </CardTitle>
              <CardDescription>
                All tagged releases with SBOM diff details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid="release-history">
                {releases.map((release) => (
                  <div
                    key={release.tag_name}
                    className="border border-border rounded-lg p-4 space-y-3"
                    data-testid={`release-card-${release.tag_name}`}
                  >
                    {/* Release header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {release.tag_name}
                          </Badge>
                          <span className="text-sm font-medium">{release.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Published {formatDate(release.published_at)}
                          {release.sbom_component_count !== null && (
                            <> · {release.sbom_component_count} components</>
                          )}
                        </p>
                      </div>
                      <a
                        href={release.html_url}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        GitHub
                      </a>
                    </div>

                    {/* SBOM Diff */}
                    {release.sbom_diff && <SbomDiffDetail diff={release.sbom_diff} />}
                    {!release.sbom_diff && release.sbom_component_count !== null && (
                      <p className="text-xs text-muted-foreground italic">
                        No previous release to diff against — baseline SBOM with {release.sbom_component_count} components
                      </p>
                    )}

                    {/* Artifacts */}
                    {release.assets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {release.assets.map((asset) => (
                          <a
                            key={asset.name}
                            href={asset.download_url}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                          >
                            <FileDown className="h-3 w-3" />
                            {asset.name}
                            <span className="text-muted-foreground">({formatBytes(asset.size)})</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {releases.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No releases found. Push a v* tag to create your first release.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
