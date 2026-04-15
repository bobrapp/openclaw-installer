import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Heart,
  Star,
  Server,
  Cpu,
  HardDrive,
  Zap,
  Gift,
  Tag,
  DollarSign,
  Shield,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

interface HostingDeal {
  name: string;
  tagline: string;
  recommended?: boolean;
  kudos?: { name: string; role: string; note: string };
  price: string;
  priceNote?: string;
  specs: string[];
  couponCode?: string;
  couponNote?: string;
  url: string;
  highlight?: string;
  badge?: string;
}

const deals: HostingDeal[] = [
  {
    name: "Hostinger VPS",
    tagline: "AI-friendly VPS with beginner tools — Matt Wolfe's pick",
    recommended: true,
    kudos: {
      name: "Matt Wolfe",
      role: "Creator of FutureTools.io",
      note: "Huge thanks to Matt and his team for championing accessible AI tools and making hosting approachable for the community. His FutureTools newsletter and YouTube channel are essential resources for anyone building with AI.",
    },
    price: "$4.49/mo",
    priceNote: "24-month plan (renews at $9.99/mo)",
    specs: [
      "1 vCPU, 4 GB RAM, 50 GB NVMe",
      "4 TB bandwidth",
      "30-day money-back guarantee",
      "AI website builder included",
      "Global data centers",
    ],
    couponCode: "MATTWOLFE",
    couponNote: "Extra 10% off at checkout — stacks with current sale",
    url: "https://hostinger.com/mattwolfe",
    highlight: "Best for beginners deploying OpenClaw for the first time",
    badge: "Community Pick",
  },
  {
    name: "Contabo Cloud VPS",
    tagline: "Maximum specs per dollar — unbeatable RAM for the price",
    price: "$3.96/mo",
    priceNote: "VPS 10 plan (12-month term)",
    specs: [
      "4 vCPU, 8 GB RAM, 75 GB NVMe",
      "Unlimited incoming traffic",
      "200 Mbit/s port",
      "25% off currently active",
      "US, EU, Asia locations",
    ],
    url: "https://contabo.com/en/vps/",
    highlight: "Best raw specs per dollar — 8 GB RAM at under $4/mo is unmatched",
    badge: "Best Value",
  },
  {
    name: "Hetzner Cloud",
    tagline: "German engineering, transparent pricing, dev-favorite",
    price: "€3.99/mo",
    priceNote: "CX23 plan (~$4.99/mo USD, post April 2026 pricing)",
    specs: [
      "2 vCPU (shared), 4 GB RAM, 40 GB NVMe",
      "20 TB traffic included",
      "Hourly billing (pay only for what you use)",
      "Free DDoS protection & firewalls",
      "ARM option (CAX) from €4.49/mo",
    ],
    url: "https://www.hetzner.com/cloud/",
    highlight: "Best for developers who want hourly billing and EU data residency",
    badge: "Dev Favorite",
  },
  {
    name: "Vultr Cloud Compute",
    tagline: "Free $300 credit for new accounts — great for testing",
    price: "$6/mo",
    priceNote: "Regular Cloud Compute (or free with $300 new-user credit)",
    specs: [
      "1 vCPU, 1 GB RAM, 25 GB NVMe",
      "$300 free credit for new accounts (30 days)",
      "20% off with annual billing",
      "GPU instances available for AI workloads",
      "17 global locations",
    ],
    url: "https://www.vultr.com/",
    highlight: "Best for testing — deploy OpenClaw free with the $300 trial credit",
    badge: "$300 Free",
  },
  {
    name: "DigitalOcean Droplets",
    tagline: "Already in OpenClaw's installer — one-click deploy ready",
    price: "$4/mo",
    priceNote: "Basic shared CPU Droplet",
    specs: [
      "1 vCPU, 512 MB RAM, 10 GB SSD",
      "500 GB transfer",
      "$200 free credit for new accounts (60 days)",
      "Managed databases & App Platform available",
      "Built-in monitoring & alerts",
    ],
    url: "https://www.digitalocean.com/",
    highlight: "Already a first-class deployment target in OpenClaw's wizard",
    badge: "Native Support",
  },
  {
    name: "IONOS VPS",
    tagline: "The $2/mo dark horse — cheapest entry point available",
    price: "$2/mo",
    priceNote: "VPS XS plan",
    specs: [
      "1 vCPU, 1 GB RAM, 10 GB NVMe SSD",
      "Unlimited traffic",
      "Daily backups included",
      "US and EU data centers",
      "No setup fees",
    ],
    url: "https://www.ionos.com/servers/vps",
    highlight: "Cheapest way to host anything — $2/mo with no traffic limits",
    badge: "Cheapest",
  },
];

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      data-testid="button-copy-coupon"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function HostingDeals() {
  return (
    <div className="space-y-6 max-w-5xl p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-hosting-title">
          <Server className="h-5 w-5 text-primary" />
          Hosting Deals for OpenClaw
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Budget-friendly VPS providers vetted for running OpenClaw, Moltbot, and AI governance workloads
        </p>
      </div>

      {/* Matt Wolfe Kudos Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold">Kudos to Matt Wolfe &amp; the FutureTools Team</h2>
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                  Community Champion
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Matt and his team at{" "}
                <a href="https://futuretools.io" target="_blank" rel="noopener" className="text-primary hover:underline font-medium">
                  FutureTools.io
                </a>{" "}
                have done more to democratize AI tools than almost anyone in the space. His YouTube channel, newsletter, and curated
                tool directory help thousands of builders discover the right tools — including hosting that won't break the bank. The
                OpenClaw project and the AiGovOps Foundation are grateful for creators like Matt who make the ecosystem stronger for
                everyone.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://youtube.com/@maboroshi"
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  YouTube
                </a>
                <a
                  href="https://futuretools.io/newsletter"
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Newsletter
                </a>
                <a
                  href="https://x.com/mreflow"
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  @mreflow
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Quick Comparison
          </CardTitle>
          <CardDescription>Minimum specs to run OpenClaw: 1 vCPU, 1 GB RAM, 10 GB storage, Node.js 20+</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-comparison">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Provider</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">From</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">RAM</th>
                  <th className="py-2 pr-4 font-medium text-muted-foreground">Storage</th>
                  <th className="py-2 font-medium text-muted-foreground">Free Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">IONOS</td>
                  <td className="py-2 pr-4 font-mono text-emerald-600 dark:text-emerald-400">$2/mo</td>
                  <td className="py-2 pr-4">1 GB</td>
                  <td className="py-2 pr-4">10 GB NVMe</td>
                  <td className="py-2">—</td>
                </tr>
                <tr className="border-b border-border/50 bg-primary/5">
                  <td className="py-2 pr-4 font-medium">Contabo</td>
                  <td className="py-2 pr-4 font-mono text-emerald-600 dark:text-emerald-400">$3.96/mo</td>
                  <td className="py-2 pr-4 font-semibold">8 GB</td>
                  <td className="py-2 pr-4">75 GB NVMe</td>
                  <td className="py-2">—</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">Hetzner</td>
                  <td className="py-2 pr-4 font-mono text-emerald-600 dark:text-emerald-400">~$5/mo</td>
                  <td className="py-2 pr-4">4 GB</td>
                  <td className="py-2 pr-4">40 GB NVMe</td>
                  <td className="py-2">—</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">DigitalOcean</td>
                  <td className="py-2 pr-4 font-mono text-emerald-600 dark:text-emerald-400">$4/mo</td>
                  <td className="py-2 pr-4">512 MB</td>
                  <td className="py-2 pr-4">10 GB SSD</td>
                  <td className="py-2">$200 (60 days)</td>
                </tr>
                <tr className="border-b border-border/50 bg-primary/5">
                  <td className="py-2 pr-4 font-medium flex items-center gap-1">
                    Hostinger
                    <Badge variant="outline" className="text-[10px] py-0 leading-tight">MATTWOLFE</Badge>
                  </td>
                  <td className="py-2 pr-4 font-mono text-emerald-600 dark:text-emerald-400">$4.49/mo</td>
                  <td className="py-2 pr-4">4 GB</td>
                  <td className="py-2 pr-4">50 GB NVMe</td>
                  <td className="py-2">—</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Vultr</td>
                  <td className="py-2 pr-4 font-mono text-emerald-600 dark:text-emerald-400">$6/mo</td>
                  <td className="py-2 pr-4">1 GB</td>
                  <td className="py-2 pr-4">25 GB NVMe</td>
                  <td className="py-2 font-semibold">$300 (30 days)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deal Cards */}
      <div className="space-y-4" data-testid="hosting-deals-list">
        {deals.map((deal) => (
          <Card
            key={deal.name}
            className={deal.recommended ? "border-primary/40 shadow-sm" : ""}
            data-testid={`deal-card-${deal.name.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Left — info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold">{deal.name}</h3>
                        {deal.badge && (
                          <Badge
                            variant={deal.recommended ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {deal.recommended && <Star className="h-3 w-3 mr-0.5 fill-current" />}
                            {deal.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{deal.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{deal.price}</p>
                      {deal.priceNote && (
                        <p className="text-[11px] text-muted-foreground leading-tight">{deal.priceNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-1.5">
                    {deal.specs.map((spec, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted/60 text-muted-foreground"
                      >
                        {i === 0 && <Cpu className="h-3 w-3" />}
                        {i === 1 && <HardDrive className="h-3 w-3" />}
                        {i >= 2 && <Zap className="h-3 w-3" />}
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Highlight */}
                  {deal.highlight && (
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <Shield className="h-3 w-3 flex-shrink-0" />
                      {deal.highlight}
                    </p>
                  )}

                  {/* Coupon */}
                  {deal.couponCode && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md border border-dashed border-primary/40 bg-primary/5">
                      <Gift className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary tracking-wide">
                            {deal.couponCode}
                          </span>
                          <CopyButton code={deal.couponCode} />
                        </div>
                        {deal.couponNote && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{deal.couponNote}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kudos callout */}
                  {deal.kudos && (
                    <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-2.5 flex items-start gap-2">
                      <Heart className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-foreground">{deal.kudos.name}</span>
                        <span className="text-muted-foreground"> — {deal.kudos.role}</span>
                        <p className="mt-0.5">{deal.kudos.note}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-2 md:w-36 flex-shrink-0">
                  <Button asChild size="sm" variant={deal.recommended ? "default" : "outline"}>
                    <a href={deal.url} target="_blank" rel="noopener" data-testid={`link-${deal.name.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Globe className="h-3.5 w-3.5 mr-1.5" />
                      Visit Site
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kimi AI Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Bonus: Kimi AI for AI Coding
          </CardTitle>
          <CardDescription>
            Pair cheap hosting with a cheap AI coding assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <a href="https://kimi-k2.com" target="_blank" rel="noopener" className="text-primary hover:underline font-medium">
              Kimi Code
            </a>{" "}
            by Moonshot AI offers an AI coding assistant powered by K2.5 at <span className="font-semibold text-foreground">$0.60/M input tokens</span> and{" "}
            <span className="font-semibold text-foreground">$2.50/M output tokens</span> — that's 4-17x cheaper than GPT-5.4 and 5-6x cheaper than Claude
            Sonnet 4.6 for equivalent coding tasks. Membership starts at <span className="font-semibold text-foreground">$19/mo</span> with a 75% cache
            discount on repeated prompts.
          </p>
          <p className="text-xs text-muted-foreground">
            Ideal for contributors working on OpenClaw who want an affordable AI pair-programmer alongside a $4/mo VPS.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/70 text-center">
        Prices shown are as of April 2026 and may change. Some links may include affiliate codes that support open-source
        creators in the AI community. The AiGovOps Foundation is not affiliated with any hosting provider.
      </p>
    </div>
  );
}
