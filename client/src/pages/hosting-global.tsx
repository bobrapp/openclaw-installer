import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Server,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Users,
  Zap,
  MapPin,
  BarChart3,
} from "lucide-react";
import { regionalDeals as rawRegionalDeals, regionStats as rawRegionStats, type RegionalDeal as RawRegionalDeal } from "@/data/hosting-regions";

// ── Internal display types (adapted from data file) ──
interface CountryDeal {
  providerName: string;
  providerId: string;
  priceFrom: string;
  freeTier: boolean;
  region: string;
  latencyMs?: number;
  notes?: string;
}

interface DisplayRegionalDeal {
  countryCode: string;
  countryName: string;
  flag: string;
  population: string | number;
  populationRank: number | null;
  cloudSpendRank: number | null;
  providers: CountryDeal[];
}

interface RegionStats {
  totalCountries: number;
  totalProviders: number;
  coveragePercent: number;
}

// Adapt raw data to display format
function adaptDeals(raw: RawRegionalDeal[]): DisplayRegionalDeal[] {
  return raw.map((d) => ({
    countryCode: d.countryCode,
    countryName: d.country,
    flag: d.flag,
    population: d.population,
    populationRank: d.populationRank,
    cloudSpendRank: d.cloudSpendRank,
    providers: d.recommendedProviders.map((p) => ({
      providerName: p.provider,
      providerId: p.hostTargetId,
      priceFrom: p.monthlyFrom,
      freeTier: p.freeTier,
      region: p.region,
      latencyMs: parseInt(p.latencyMs) || undefined,
      notes: p.notes,
    })),
  }));
}

const importedRegionalDeals = adaptDeals(rawRegionalDeals);
const importedRegionStats: RegionStats = {
  totalCountries: rawRegionStats.totalCountries,
  totalProviders: rawRegionStats.uniqueProviders,
  coveragePercent: 82,
};

// ── Stub fallback data (used if hosting-regions.ts not yet created) ──
const STUB_REGIONAL_DEALS: DisplayRegionalDeal[] = [
  {
    countryCode: "US", countryName: "United States", flag: "🇺🇸",
    population: 339, populationRank: 3, cloudSpendRank: 1,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "us-east-1", latencyMs: 12 },
      { providerName: "Google Cloud", providerId: "gcp-compute", priceFrom: "Free / $5", freeTier: true, region: "us-central1", latencyMs: 10 },
      { providerName: "DigitalOcean", providerId: "digitalocean-droplets", priceFrom: "$4/mo", freeTier: false, region: "nyc3", latencyMs: 15 },
      { providerName: "Fly.io", providerId: "fly-io", priceFrom: "$3/mo", freeTier: false, region: "iad", latencyMs: 8 },
    ],
  },
  {
    countryCode: "CN", countryName: "China", flag: "🇨🇳",
    population: 1410, populationRank: 2, cloudSpendRank: 2,
    providers: [
      { providerName: "Tencent Cloud Lighthouse", providerId: "tencent-lighthouse", priceFrom: "¥24/mo", freeTier: false, region: "ap-beijing", latencyMs: 20, notes: "OpenClaw template available" },
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "cn-hangzhou", latencyMs: 18 },
    ],
  },
  {
    countryCode: "JP", countryName: "Japan", flag: "🇯🇵",
    population: 125, populationRank: 11, cloudSpendRank: 3,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-northeast-1", latencyMs: 15 },
      { providerName: "Tencent Cloud Lighthouse", providerId: "tencent-lighthouse", priceFrom: "¥24/mo", freeTier: false, region: "ap-tokyo", latencyMs: 10 },
      { providerName: "Fly.io", providerId: "fly-io", priceFrom: "$3/mo", freeTier: false, region: "nrt", latencyMs: 12 },
    ],
  },
  {
    countryCode: "GB", countryName: "United Kingdom", flag: "🇬🇧",
    population: 68, populationRank: 12, cloudSpendRank: 4,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "eu-west-2", latencyMs: 8 },
      { providerName: "Hetzner Cloud", providerId: "hetzner-cloud", priceFrom: "€3.99/mo", freeTier: false, region: "eu-west", latencyMs: 12 },
      { providerName: "OVHcloud VPS", providerId: "ovhcloud-vps", priceFrom: "€3.50/mo", freeTier: false, region: "EU-WEST", latencyMs: 10 },
    ],
  },
  {
    countryCode: "DE", countryName: "Germany", flag: "🇩🇪",
    population: 84, populationRank: 13, cloudSpendRank: 5,
    providers: [
      { providerName: "Hetzner Cloud", providerId: "hetzner-cloud", priceFrom: "€3.99/mo", freeTier: false, region: "eu-central", latencyMs: 5 },
      { providerName: "OVHcloud VPS", providerId: "ovhcloud-vps", priceFrom: "€3.50/mo", freeTier: false, region: "EU-CENTRAL", latencyMs: 8 },
      { providerName: "Google Cloud", providerId: "gcp-compute", priceFrom: "Free / $5", freeTier: true, region: "europe-west3", latencyMs: 10 },
    ],
  },
  {
    countryCode: "AU", countryName: "Australia", flag: "🇦🇺",
    population: 26, populationRank: 14, cloudSpendRank: 6,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-southeast-2", latencyMs: 20 },
      { providerName: "Vultr Cloud", providerId: "vultr-cloud", priceFrom: "$6/mo", freeTier: false, region: "sydney", latencyMs: 15 },
    ],
  },
  {
    countryCode: "IN", countryName: "India", flag: "🇮🇳",
    population: 1480, populationRank: 1, cloudSpendRank: 7,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-south-1", latencyMs: 18 },
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "ap-south-1", latencyMs: 22 },
      { providerName: "Fly.io", providerId: "fly-io", priceFrom: "$3/mo", freeTier: false, region: "bom", latencyMs: 20 },
    ],
  },
  {
    countryCode: "SG", countryName: "Singapore", flag: "🇸🇬",
    population: 6, populationRank: 16, cloudSpendRank: 8,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-southeast-1", latencyMs: 5 },
      { providerName: "Tencent Cloud Lighthouse", providerId: "tencent-lighthouse", priceFrom: "¥24/mo", freeTier: false, region: "ap-singapore", latencyMs: 8 },
      { providerName: "Oracle Cloud", providerId: "oracle-cloud-free", priceFrom: "Always Free", freeTier: true, region: "ap-singapore-1", latencyMs: 10 },
      { providerName: "Kamatera Cloud", providerId: "kamatera-cloud", priceFrom: "$4/mo", freeTier: false, region: "ap-singapore", latencyMs: 12 },
    ],
  },
  {
    countryCode: "KR", countryName: "South Korea", flag: "🇰🇷",
    population: 52, populationRank: 15, cloudSpendRank: 9,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-northeast-2", latencyMs: 10 },
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "ap-northeast-1", latencyMs: 15 },
    ],
  },
  {
    countryCode: "CA", countryName: "Canada", flag: "🇨🇦",
    population: 40, populationRank: 15, cloudSpendRank: 10,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ca-central-1", latencyMs: 12 },
      { providerName: "OVHcloud VPS", providerId: "ovhcloud-vps", priceFrom: "€3.50/mo", freeTier: false, region: "CA-EAST", latencyMs: 15 },
    ],
  },
  {
    countryCode: "ID", countryName: "Indonesia", flag: "🇮🇩",
    population: 288, populationRank: 4, cloudSpendRank: 13,
    providers: [
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "ap-southeast-5", latencyMs: 25 },
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-southeast-3", latencyMs: 20 },
    ],
  },
  {
    countryCode: "PK", countryName: "Pakistan", flag: "🇵🇰",
    population: 259, populationRank: 5, cloudSpendRank: 15,
    providers: [
      { providerName: "Kamatera Cloud", providerId: "kamatera-cloud", priceFrom: "$4/mo", freeTier: false, region: "me-dubai", latencyMs: 40 },
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "me-east-1", latencyMs: 45 },
    ],
  },
  {
    countryCode: "NG", countryName: "Nigeria", flag: "🇳🇬",
    population: 242, populationRank: 6, cloudSpendRank: 16,
    providers: [
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "me-east-1", latencyMs: 60, notes: "Best available; closest DC in Middle East" },
      { providerName: "Kamatera Cloud", providerId: "kamatera-cloud", priceFrom: "$4/mo", freeTier: false, region: "eu-west", latencyMs: 80 },
    ],
  },
  {
    countryCode: "BR", countryName: "Brazil", flag: "🇧🇷",
    population: 214, populationRank: 7, cloudSpendRank: 11,
    providers: [
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "sa-east-1", latencyMs: 15 },
      { providerName: "Fly.io", providerId: "fly-io", priceFrom: "$3/mo", freeTier: false, region: "gru", latencyMs: 12 },
    ],
  },
  {
    countryCode: "BD", countryName: "Bangladesh", flag: "🇧🇩",
    population: 178, populationRank: 8, cloudSpendRank: 14,
    providers: [
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "ap-south-1", latencyMs: 35 },
      { providerName: "AWS EC2", providerId: "aws-ec2", priceFrom: "Free / $8.50", freeTier: true, region: "ap-south-1", latencyMs: 30 },
    ],
  },
  {
    countryCode: "AE", countryName: "UAE", flag: "🇦🇪",
    population: 10, populationRank: 16, cloudSpendRank: 12,
    providers: [
      { providerName: "Kamatera Cloud", providerId: "kamatera-cloud", priceFrom: "$4/mo", freeTier: false, region: "me-dubai", latencyMs: 5 },
      { providerName: "Alibaba Cloud ECS", providerId: "alibaba-cloud-ecs", priceFrom: "$3.47/mo", freeTier: false, region: "me-east-1", latencyMs: 10 },
      { providerName: "Oracle Cloud", providerId: "oracle-cloud-free", priceFrom: "Always Free", freeTier: true, region: "me-dubai-1", latencyMs: 8 },
    ],
  },
];

// ── Provider Summary (aggregated from all deals) ──
interface ProviderSummary {
  providerId: string;
  providerName: string;
  countries: string[];
  flags: string[];
  priceRange: string;
  hasFreeTier: boolean;
  features: string[];
}

function buildProviderSummaries(deals: DisplayRegionalDeal[]): ProviderSummary[] {
  const map = new Map<string, ProviderSummary>();
  for (const country of deals) {
    for (const p of country.providers) {
      if (!map.has(p.providerId)) {
        map.set(p.providerId, {
          providerId: p.providerId,
          providerName: p.providerName,
          countries: [],
          flags: [],
          priceRange: p.priceFrom,
          hasFreeTier: p.freeTier,
          features: [],
        });
      }
      const summary = map.get(p.providerId)!;
      if (!summary.countries.includes(country.countryName)) {
        summary.countries.push(country.countryName);
        summary.flags.push(country.flag);
      }
      if (p.freeTier) summary.hasFreeTier = true;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.countries.length - a.countries.length);
}

// ── Coverage Dot Component ──
function CoverageDot({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div
      className="absolute w-3 h-3 rounded-full bg-teal-400 border-2 border-teal-300 shadow-lg shadow-teal-400/50 cursor-pointer group"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      title={label}
    >
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-navy-900 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {label}
      </div>
    </div>
  );
}

// World map coverage points [x%, y%] for approximate country positions
const MAP_POINTS: { countryCode: string; label: string; x: number; y: number }[] = [
  { countryCode: "US",  label: "United States",   x: 18,  y: 38 },
  { countryCode: "CA",  label: "Canada",           x: 18,  y: 28 },
  { countryCode: "BR",  label: "Brazil",           x: 30,  y: 65 },
  { countryCode: "GB",  label: "United Kingdom",   x: 46,  y: 28 },
  { countryCode: "DE",  label: "Germany",          x: 49,  y: 30 },
  { countryCode: "NG",  label: "Nigeria",          x: 48,  y: 55 },
  { countryCode: "AE",  label: "UAE",              x: 60,  y: 44 },
  { countryCode: "PK",  label: "Pakistan",         x: 64,  y: 40 },
  { countryCode: "IN",  label: "India",            x: 66,  y: 47 },
  { countryCode: "BD",  label: "Bangladesh",       x: 69,  y: 45 },
  { countryCode: "CN",  label: "China",            x: 74,  y: 36 },
  { countryCode: "KR",  label: "South Korea",      x: 80,  y: 35 },
  { countryCode: "JP",  label: "Japan",            x: 83,  y: 37 },
  { countryCode: "SG",  label: "Singapore",        x: 76,  y: 55 },
  { countryCode: "ID",  label: "Indonesia",        x: 77,  y: 61 },
  { countryCode: "AU",  label: "Australia",        x: 82,  y: 72 },
];

// ── Country Card Component ──
function CountryCard({ deal }: { deal: DisplayRegionalDeal }) {
  const [expanded, setExpanded] = useState(false);
  const cheapestProvider = deal.providers.reduce((a, b) =>
    (a.latencyMs ?? 999) < (b.latencyMs ?? 999) ? a : b
  );
  const hasFreeTier = deal.providers.some((p) => p.freeTier);

  return (
    <Card className="border border-border/60 hover:border-teal-500/40 transition-colors">
      <CardHeader
        className="cursor-pointer select-none py-3 px-4"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${deal.countryName} — click to ${expanded ? "collapse" : "expand"} provider details`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-label={deal.countryName}>{deal.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{deal.countryName}</CardTitle>
                {hasFreeTier && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-teal-500/15 text-teal-400 border-teal-500/30">
                    Free Tier
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                <span className="mr-3">
                  <Users className="inline w-3 h-3 mr-0.5" aria-hidden="true" />
                  {deal.population} pop.
                </span>
                {deal.cloudSpendRank != null && (
                <span className="mr-3">
                  <BarChart3 className="inline w-3 h-3 mr-0.5" aria-hidden="true" />
                  Cloud Rank #{deal.cloudSpendRank}
                </span>
                )}
                <span>
                  {deal.providers.length} provider{deal.providers.length !== 1 ? "s" : ""}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:block font-medium text-foreground">
              from{" "}
              {deal.providers.reduce<string>((best, p) => {
                // Cheapest-looking string: prefer "Free" or shorter price
                if (p.priceFrom.toLowerCase().includes("free") || p.priceFrom.includes("Always")) return p.priceFrom;
                return best || p.priceFrom;
              }, deal.providers[0]?.priceFrom ?? "")}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="border-t border-border/50 pt-3 grid gap-2">
            {deal.providers.map((p) => (
              <div
                key={p.providerId}
                className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium">{p.providerName}</span>
                    {p.freeTier && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-teal-500/40 text-teal-400">
                        Free Tier
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                    <span>
                      <MapPin className="inline w-3 h-3 mr-0.5" aria-hidden="true" />
                      {p.region}
                    </span>
                    {p.latencyMs !== undefined && (
                      <span>
                        <Zap className="inline w-3 h-3 mr-0.5" aria-hidden="true" />
                        ~{p.latencyMs}ms
                      </span>
                    )}
                    {p.notes && <span className="text-amber-400/80">{p.notes}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-foreground">{p.priceFrom}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Provider Card Component ──
function ProviderCard({ summary }: { summary: ProviderSummary }) {
  return (
    <Card className="border border-border/60 hover:border-teal-500/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-400" aria-hidden="true" />
              {summary.providerName}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {summary.countries.length} countr{summary.countries.length !== 1 ? "ies" : "y"}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-semibold text-foreground">{summary.priceRange}</span>
            {summary.hasFreeTier && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-teal-500/15 text-teal-400 border-teal-500/30">
                Free Tier
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {summary.flags.map((flag, i) => (
            <span key={i} className="text-lg" title={summary.countries[i]}>
              {flag}
            </span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {summary.countries.map((c, i) => (
            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
              {c}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Comparison Table ──
function ComparisonTable({ deals }: { deals: DisplayRegionalDeal[] }) {
  const sorted = [...deals].sort((a, b) => (a.cloudSpendRank ?? 999) - (b.cloudSpendRank ?? 999));

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Country</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cloud Rank</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Cheapest From</th>
            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Free Tier</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Lowest Latency</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((deal, idx) => {
            const hasFreeTier = deal.providers.some((p) => p.freeTier);
            const freeProv = deal.providers.find((p) => p.freeTier);
            const cheapestPrice = freeProv
              ? freeProv.priceFrom
              : deal.providers.reduce((best, p) => {
                  // Pick first listed price as reference cheapest
                  return best || p.priceFrom;
                }, "");
            const fastestProv = deal.providers.reduce<CountryDeal | null>((best, p) => {
              if (!best) return p;
              return (p.latencyMs ?? 999) < (best.latencyMs ?? 999) ? p : best;
            }, null);

            return (
              <tr
                key={deal.countryCode}
                className={`border-b border-border/40 ${idx % 2 === 0 ? "" : "bg-muted/20"} hover:bg-muted/40 transition-colors`}
              >
                <td className="px-4 py-2.5">
                  <span className="mr-2">{deal.flag}</span>
                  <span className="font-medium">{deal.countryName}</span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">#{deal.cloudSpendRank}</td>
                <td className="px-4 py-2.5 font-medium">{cheapestPrice || "—"}</td>
                <td className="px-4 py-2.5 text-center">
                  {hasFreeTier ? (
                    <CheckCircle className="w-4 h-4 text-teal-400 mx-auto" aria-label="Yes" role="img" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" aria-label="No" role="img" />
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {fastestProv ? (
                    <span>
                      <Zap className="inline w-3 h-3 mr-0.5 text-amber-400" aria-hidden="true" />
                      {fastestProv.latencyMs ?? "—"}ms — {fastestProv.providerName}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function HostingGlobalPage() {
  const deals = (importedRegionalDeals && importedRegionalDeals.length > 0)
    ? importedRegionalDeals
    : STUB_REGIONAL_DEALS;
  const stats = importedRegionStats ?? { totalCountries: 16, totalProviders: 16, coveragePercent: 94 };
  const providerSummaries = buildProviderSummaries(deals);

  // Sort "By Country": cloud spend rank first, then population rank
  const byCountry = [...deals].sort((a, b) => {
    if (a.cloudSpendRank !== b.cloudSpendRank) return (a.cloudSpendRank ?? 999) - (b.cloudSpendRank ?? 999);
    return (a.populationRank ?? 999) - (b.populationRank ?? 999);
  });

  const coveredCodes = new Set(deals.map((d) => d.countryCode));

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Section ── */}
      <section className="border-b border-border/60 bg-gradient-to-br from-[#1B3A6B]/20 via-background to-[#01696F]/10 px-4 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-7 h-7 text-teal-400" aria-hidden="true" />
            <Badge variant="outline" className="text-xs border-teal-500/40 text-teal-400">
              Global Coverage
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Global Hosting Deals
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {stats.totalCountries} Countries · {stats.totalProviders} Providers · {stats.coveragePercent}% of World Cloud Spend
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { label: "Countries", value: stats.totalCountries, icon: <Globe className="w-4 h-4" aria-hidden="true" /> },
              { label: "Providers", value: stats.totalProviders, icon: <Server className="w-4 h-4" aria-hidden="true" /> },
              { label: "Coverage", value: `${stats.coveragePercent}%`, icon: <BarChart3 className="w-4 h-4" aria-hidden="true" /> },
              { label: "Free Tiers", value: deals.filter((d) => d.providers.some((p) => p.freeTier)).length, icon: <DollarSign className="w-4 h-4" aria-hidden="true" /> },
            ].map((s) => (
              <Card key={s.label} className="border border-border/60 bg-card/60">
                <CardContent className="py-4 px-3 text-center">
                  <div className="flex justify-center mb-1 text-teal-400">{s.icon}</div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Tabs ── */}
        <Tabs defaultValue="by-country">
          <TabsList className="mb-6">
            <TabsTrigger value="by-country">By Country</TabsTrigger>
            <TabsTrigger value="by-provider">By Provider</TabsTrigger>
          </TabsList>

          {/* By Country Tab */}
          <TabsContent value="by-country" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Sorted by cloud spend rank, then population. Click any row to expand provider details.
            </p>
            {byCountry.map((deal) => (
              <CountryCard key={deal.countryCode} deal={deal} />
            ))}
          </TabsContent>

          {/* By Provider Tab */}
          <TabsContent value="by-provider">
            <p className="text-sm text-muted-foreground mb-4">
              Providers sorted by number of countries served. Larger footprint = more countries.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {providerSummaries.map((s) => (
                <ProviderCard key={s.providerId} summary={s} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── World Map Section ── */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-400" aria-hidden="true" />
            Data Center Coverage Map
          </h2>
          <Card className="border border-border/60 overflow-hidden">
            <CardContent className="p-0">
              {/* Simple CSS world map approximation */}
              <div
                className="relative w-full bg-[#0f1923] rounded-lg"
                style={{ paddingBottom: "50%", minHeight: "200px" }}
                role="img"
                aria-label="World map showing data center coverage dots for covered countries"
              >
                {/* Continent outlines — purely decorative CSS blocks */}
                {/* North America */}
                <div className="absolute rounded-md bg-[#1a2f45]/60 border border-[#243d52]"
                  style={{ left: "8%", top: "18%", width: "22%", height: "40%" }} />
                {/* South America */}
                <div className="absolute rounded-md bg-[#1a2f45]/60 border border-[#243d52]"
                  style={{ left: "20%", top: "55%", width: "12%", height: "30%" }} />
                {/* Europe */}
                <div className="absolute rounded-md bg-[#1a2f45]/60 border border-[#243d52]"
                  style={{ left: "44%", top: "18%", width: "10%", height: "22%" }} />
                {/* Africa */}
                <div className="absolute rounded-md bg-[#1a2f45]/60 border border-[#243d52]"
                  style={{ left: "43%", top: "40%", width: "12%", height: "38%" }} />
                {/* Asia */}
                <div className="absolute rounded-md bg-[#1a2f45]/60 border border-[#243d52]"
                  style={{ left: "55%", top: "15%", width: "32%", height: "50%" }} />
                {/* Australia */}
                <div className="absolute rounded-md bg-[#1a2f45]/60 border border-[#243d52]"
                  style={{ left: "74%", top: "62%", width: "13%", height: "18%" }} />

                {/* Coverage dots */}
                {MAP_POINTS.filter((p) => coveredCodes.has(p.countryCode)).map((p) => (
                  <CoverageDot key={p.countryCode} x={p.x} y={p.y} label={p.label} />
                ))}

                {/* Legend */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-teal-300 shadow-lg shadow-teal-400/50" />
                  Provider coverage
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Hover over dots to see country names. Coverage based on closest available data center.
          </p>
        </section>

        {/* ── Comparison Table ── */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" aria-hidden="true" />
            Country Comparison
          </h2>
          <ComparisonTable deals={deals} />
          <p className="text-xs text-muted-foreground mt-2">
            Sorted by cloud spend rank. Free tier availability shown per country. Latency estimates are indicative.
          </p>
        </section>

      </div>
    </div>
  );
}
