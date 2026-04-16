import { Home, Wand2, Shield, ScrollText, FileCode2, GitCompareArrows, Play, Lock, Heart, BookOpen, Activity, Server, Sparkles, Store, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BreathingLogo } from "@/components/breathing-logo";
import { SoundToggle } from "@/components/sound-toggle";
import { useI18n } from "@/lib/i18n";
import type { Translations } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

/* ─── Grouped navigation ─── */
function getNavGroups(t: Translations) {
  return {
    setup: {
      label: t.navSetup || "Setup",
      items: [
        { title: t.navHostSelection, url: "/", icon: Home },
        { title: t.navCompareFrameworks, url: "/compare", icon: GitCompareArrows },
        { title: t.navPreflightRunner, url: "/preflight", icon: Play },
      ],
    },
    monitor: {
      label: t.navMonitor || "Monitor",
      items: [
        { title: t.navInstallLogs, url: "/logs", icon: ScrollText },
        { title: t.navAuditLog, url: "/audit", icon: Lock },
      ],
    },
    community: {
      label: t.navCommunity || "Community",
      items: [
        { title: t.navAgentPatterns, url: "/patterns", icon: Sparkles },
        { title: t.navMarketplace, url: "/marketplace", icon: Store },
      ],
    },
    resources: {
      label: t.navResources || "Resources",
      items: [
        { title: t.navFoundation, url: "/foundation", icon: Heart },
        { title: t.navReleaseDashboard, url: "/releases", icon: Activity },
        { title: t.navHostingDeals, url: "/hosting", icon: Server },
        { title: t.navHowIBuiltThis, url: "/how-i-built-this", icon: BookOpen },
      ],
    },
  };
}

function getHostItems(t: Translations) {
  return [
    { title: t.hostMacOS, hostId: "macos" },
    { title: t.hostDigitalOcean, hostId: "digitalocean" },
    { title: t.hostAzureVM, hostId: "azure" },
    { title: t.hostGenericVPS, hostId: "generic-vps" },
  ];
}

/* ─── Nav group with collapsible support ─── */
function NavGroup({
  label,
  items,
  location,
  defaultOpen = true,
}: {
  label: string;
  items: NavItem[];
  location: string;
  defaultOpen?: boolean;
}) {
  const hasActive = items.some((item) => location === item.url);

  return (
    <Collapsible defaultOpen={defaultOpen || hasActive} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:text-foreground transition-colors flex items-center justify-between">
            {label}
            <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useI18n();
  const groups = getNavGroups(t);
  const hostItems = getHostItems(t);

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
            <BreathingLogo size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">OpenClaw</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">{t.installerVersion}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Setup — always open (primary flow) */}
        <NavGroup label={groups.setup.label} items={groups.setup.items} location={location} defaultOpen={true} />

        {/* Hosts */}
        <SidebarGroup>
          <SidebarGroupLabel>{t.navHosts}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hostItems.map((item) => {
                const wizardUrl = `/wizard/${item.hostId}`;
                const hardenUrl = `/hardening/${item.hostId}`;
                const scriptsUrl = `/scripts/${item.hostId}`;
                const isActive = location.includes(item.hostId);
                return (
                  <SidebarMenuItem key={item.hostId}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={wizardUrl}>
                        <Wand2 className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {isActive && (
                      <div className="ml-7 mt-1 space-y-0.5">
                        <SidebarMenuButton asChild size="sm" isActive={location === hardenUrl}>
                          <Link href={hardenUrl} className="text-xs">
                            <Shield className="h-3 w-3" />
                            <span>{t.hostHardening}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild size="sm" isActive={location === scriptsUrl}>
                          <Link href={scriptsUrl} className="text-xs">
                            <FileCode2 className="h-3 w-3" />
                            <span>{t.hostScripts}</span>
                          </Link>
                        </SidebarMenuButton>
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Monitor */}
        <NavGroup label={groups.monitor.label} items={groups.monitor.items} location={location} defaultOpen={true} />

        {/* Community — Patterns + Marketplace */}
        <NavGroup label={groups.community.label} items={groups.community.items} location={location} defaultOpen={true} />

        {/* Resources — collapsed by default */}
        <NavGroup label={groups.resources.label} items={groups.resources.items} location={location} defaultOpen={false} />
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t.footerSubtitle}
            </p>
            <SoundToggle />
          </div>
          <Link href="/humans" className="group">
            <p className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
              {t.footerHumans}
            </p>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
