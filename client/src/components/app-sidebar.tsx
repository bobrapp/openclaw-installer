import { Home, Wand2, Shield, ScrollText, FileCode2, GitCompareArrows, Play, Lock, Heart, BookOpen, FileDown, Activity, Server, Sparkles } from "lucide-react";
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
import { BreathingLogo } from "@/components/breathing-logo";
import { SoundToggle } from "@/components/sound-toggle";
import { playSound } from "@/lib/sound-engine";
import { useI18n } from "@/lib/i18n";
import type { Translations } from "@/lib/i18n";

function getNavItems(t: Translations) {
  return [
    { title: t.navHostSelection, url: "/", icon: Home },
    { title: t.navCompareFrameworks, url: "/compare", icon: GitCompareArrows },
    { title: t.navPreflightRunner, url: "/preflight", icon: Play },
    { title: t.navInstallLogs, url: "/logs", icon: ScrollText },
    { title: t.navAuditLog, url: "/audit", icon: Lock },
    { title: t.navFoundation, url: "/foundation", icon: Heart },
    { title: t.navHowIBuiltThis, url: "/how-i-built-this", icon: BookOpen },
    { title: t.navReleaseDashboard, url: "/releases", icon: Activity },
    { title: t.navHostingDeals, url: "/hosting", icon: Server },
    { title: t.navAgentPatterns, url: "/patterns", icon: Sparkles },
  ];
}

function getHostItems(t: Translations) {
  return [
    { title: t.hostMacOS, hostId: "macos" },
    { title: t.hostDigitalOcean, hostId: "digitalocean" },
    { title: t.hostAzureVM, hostId: "azure" },
    { title: t.hostGenericVPS, hostId: "generic-vps" },
  ];
}

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useI18n();
  const navItems = getNavItems(t);
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
        <SidebarGroup>
          <SidebarGroupLabel>{t.navNavigation}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} onClick={() => playSound("navigate")}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
