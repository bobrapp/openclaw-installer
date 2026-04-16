import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, Shield, Code2, Users, Coffee } from "lucide-react";

export default function Foundation() {
  const openFoundation = () => {
    window.open("https://www.aigovopsfoundation.org/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2" data-testid="text-foundation-title">
          AiGovOps Foundation
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Creating a future where AI products contribute positively to humanity.
          Through rigorous audit, oversight, and ethical frameworks as automated code.
        </p>
      </div>

      {/* Co-founders */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Co-Founders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold text-sm">Bob Rapp</p>
              <p className="text-xs text-muted-foreground mt-1">
                Co-Founder, AiGovOps Foundation. Former Vodafone, IBM Watson, GE Healthcare, Microsoft.
                Advocacy for ethical AI governance at enterprise scale.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold text-sm">Ken Johnston</p>
              <p className="text-xs text-muted-foreground mt-1">
                Co-Founder, AiGovOps Foundation. Former Microsoft, Ford Motor Company.
                Pioneer in AI governance and operational compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Pillars */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Core Pillars</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Governance as Code", desc: "Automated policy enforcement and compliance checks" },
              { title: "AI Technical Debt", desc: "Systematic elimination of AI system technical debt" },
              { title: "Operational Compliance", desc: "Runtime monitoring and regulatory adherence" },
              { title: "Community Standards", desc: "Open-source, community-driven governance standards" },
            ].map((pillar) => (
              <div key={pillar.title} className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium mb-1">{pillar.title}</p>
                <p className="text-xs text-muted-foreground">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Immutable Logging Credit */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Immutable Logging Standard</h2>
            <Badge variant="secondary" className="text-xs">SHA-256</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            This application implements the AiGovOps Foundation immutable logging standard.
            Every action is recorded in a tamper-evident, cryptographic hash chain:
          </p>
          <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs space-y-1">
            <p><span className="text-primary">prompt</span> - Action or command executed</p>
            <p><span className="text-primary">user</span> - Anonymized operator identifier</p>
            <p><span className="text-primary">timestamp</span> - ISO 8601 date/time</p>
            <p><span className="text-primary">results</span> - Outcome of the action</p>
            <p><span className="text-primary">previousHash</span> - SHA-256 of prior entry</p>
            <p><span className="text-primary">currentHash</span> - SHA-256(timestamp|user|prompt|results|previousHash)</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Log integrity can be verified at any time. Any tampering breaks the hash chain
            and is immediately detectable.
          </p>
        </CardContent>
      </Card>

      {/* Donation CTA */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
              <Coffee className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-sm font-semibold mb-2">Support the Foundation</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              If this tool has been useful, consider buying the co-founders a cup of coffee.
              Every contribution helps advance responsible AI governance.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={openFoundation} data-testid="button-donate">
                <Heart className="h-4 w-4 mr-2" />
                Buy Us a Coffee
              </Button>
              <Button variant="outline" onClick={openFoundation} data-testid="button-visit-foundation">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Foundation
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <a
                href="https://www.aigovopsfoundation.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.aigovopsfoundation.org
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* License */}
      <div className="text-center mt-6 text-xs text-muted-foreground">
        <p>OpenClaw Guided Install by AiGovOps \u2014 A work of Bob Rapp and Ken Johnston</p>
        <p className="mt-0.5">AiGovOps Foundation \u00a9 {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
