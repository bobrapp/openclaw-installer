/**
 * ConfigCard — Shared card component used by Patterns and Marketplace pages.
 * Renders an item with icon, title, description, badges, YAML config preview,
 * copy/download actions, and optional extra content via children.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp, Copy, Download } from "lucide-react";
import { resolveIcon } from "@/lib/icon-map";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useI18n } from "@/lib/i18n";
import { celebrate } from "@/lib/celebrations";
import { playSound } from "@/lib/sound-engine";

export interface ConfigCardProps {
  id: string;
  name: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  description: string;
  config: string;
  featured?: boolean;
  /** Extra badges rendered below description */
  badges?: React.ReactNode;
  /** Extra content rendered before the config toggle */
  children?: React.ReactNode;
  /** Test ID prefix (defaults to "card") */
  testIdPrefix?: string;
}

export function ConfigCard({
  id,
  name,
  subtitle,
  icon,
  iconColor,
  description,
  config,
  featured,
  badges,
  children,
  testIdPrefix = "card",
}: ConfigCardProps) {
  const [showConfig, setShowConfig] = useState(false);
  const Icon = resolveIcon(icon);
  const { t } = useI18n();
  const { copy, copied } = useCopyToClipboard({ fallbackFilename: `claw-${id}` });

  const handleCopy = () => {
    copy(config, `claw-${id}`);
    playSound("click");
    celebrate("Config copied", "subtle");
  };

  return (
    <Card
      className={`group hover:border-primary/30 transition-all duration-300 hover:shadow-md ${
        featured ? "ring-1 ring-primary/20" : ""
      }`}
      data-testid={`${testIdPrefix}-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center ${
              iconColor || "text-primary"
            } group-hover:scale-110 transition-transform`}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">{name}</CardTitle>
              {featured && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                  {t.mktFeatured || "Featured"}
                </Badge>
              )}
            </div>
            {subtitle && (
              <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/80 leading-relaxed">{description}</p>

        {badges}

        {children}

        {/* Config toggle */}
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs w-full justify-between"
            onClick={() => setShowConfig(!showConfig)}
            aria-expanded={showConfig}
            aria-controls={`config-preview-${id}`}
          >
            <span>{t.mktViewConfig || t.patternsViewConfig || "View YAML Config"}</span>
            {showConfig ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
          {showConfig && (
            <div id={`config-preview-${id}`} className="mt-2 relative">
              <pre className="p-3 bg-card border border-border rounded-md text-xs font-mono overflow-auto max-h-56 text-muted-foreground">
                {config}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 end-2 h-7 text-[10px] focus-visible:ring-2 focus-visible:ring-ring"
                onClick={handleCopy}
                aria-label={copied ? `Copied config for ${name}` : `Copy config for ${name}`}
                data-testid={`button-copy-config-${id}`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 me-1 text-emerald-500" aria-hidden="true" />
                    {t.mktCopied || t.patternsCopied || "Copied"}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 me-1" aria-hidden="true" />
                    {t.mktCopy || t.patternsCopy || "Copy"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              copy(config, `claw-${id}`);
              playSound("click");
              celebrate("Ready to install", "subtle");
            }}
            aria-label={`Install ${name}`}
            data-testid={`button-install-${id}`}
          >
            <Download className="h-3 w-3 me-1.5" aria-hidden="true" />
            {t.mktInstall || t.patternsDownloadYaml || "Install"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleCopy}
            aria-label={copied ? `Copied config for ${name}` : `Copy config for ${name}`}
            data-testid={`button-download-config-${id}`}
          >
            {copied ? (
              <Check className="h-3 w-3 me-1.5 text-emerald-500" aria-hidden="true" />
            ) : (
              <Copy className="h-3 w-3 me-1.5" aria-hidden="true" />
            )}
            {t.mktConfig || "Config"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
