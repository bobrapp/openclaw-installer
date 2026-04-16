import { Wand2, Shield, FileCode2, ChevronRight, Coffee } from "lucide-react";
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
import { resolveIcon } from "@/lib/icon-map";
import { getRoutesByGroup, type RouteEntry } from "@/lib/routes";

/* ─── NavItem built from RouteEntry ─── */
interface NavItem {
  title: string;
  url: string;
  icon: string;
}

function routesToNavItems(routes: RouteEntry[], t: Translations): NavItem[] {
  return routes.map((r) => ({
    title: r.label(t as unknown as Record<string, string>),
    url: r.path,
    icon: r.icon,
  }));
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
          <SidebarGroupLabel
            className="cursor-pointer hover:text-foreground transition-colors flex items-center justify-between"
            aria-label={`${label} navigation group`}
          >
            {label}
            <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden="true" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = resolveIcon(item.icon);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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

  const setupItems = routesToNavItems(getRoutesByGroup("setup"), t);
  const monitorItems = routesToNavItems(getRoutesByGroup("monitor"), t);
  const communityItems = routesToNavItems(getRoutesByGroup("community"), t);
  const resourceItems = routesToNavItems(getRoutesByGroup("resources"), t);
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
        <NavGroup
          label={t.navSetup || "Setup"}
          items={setupItems}
          location={location}
          defaultOpen={true}
        />

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
                        <Wand2 className="h-4 w-4" aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {isActive && (
                      <div className="ms-7 mt-1 space-y-0.5">
                        <SidebarMenuButton asChild size="sm" isActive={location === hardenUrl}>
                          <Link href={hardenUrl} className="text-xs">
                            <Shield className="h-3 w-3" aria-hidden="true" />
                            <span>{t.hostHardening}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild size="sm" isActive={location === scriptsUrl}>
                          <Link href={scriptsUrl} className="text-xs">
                            <FileCode2 className="h-3 w-3" aria-hidden="true" />
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
        <NavGroup
          label={t.navMonitor || "Monitor"}
          items={monitorItems}
          location={location}
          defaultOpen={true}
        />

        {/* Community — Patterns + Marketplace */}
        <NavGroup
          label={t.navCommunity || "Community"}
          items={communityItems}
          location={location}
          defaultOpen={true}
        />

        {/* Resources — collapsed by default */}
        <NavGroup
          label={t.navResources || "Resources"}
          items={resourceItems}
          location={location}
          defaultOpen={false}
        />
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <div className="space-y-3">
          {/* Buy Us a Coffee CTA */}
          <a
            href="https://www.aigovopsfoundation.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/20 transition-all group cursor-pointer"
          >
            <Coffee className="h-4 w-4 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{t.sidebarCoffee}</p>
              <p className="text-[10px] text-muted-foreground truncate">{t.sidebarCoffeeDesc}</p>
            </div>
          </a>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t.footerSubtitle}
            </p>
            <SoundToggle />
          </div>
          <Link href="/humans" className="group">
            <p className="text-[10px] leading-relaxed text-muted-foreground/60 group-hover:text-primary transition-colors">
              {t.footerHumans}
            </p>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
