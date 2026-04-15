import { Home, Wand2, Shield, ScrollText, FileCode2 } from "lucide-react";
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

const navItems = [
  { title: "Host Selection", url: "/", icon: Home },
  { title: "Install Logs", url: "/logs", icon: ScrollText },
];

const hostItems = [
  { title: "macOS", hostId: "macos" },
  { title: "DigitalOcean", hostId: "digitalocean" },
  { title: "Azure VM", hostId: "azure" },
  { title: "Generic VPS", hostId: "generic-vps" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">OpenClaw</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Installer v1.0</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Hosts</SidebarGroupLabel>
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
                            <span>Hardening</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild size="sm" isActive={location === scriptsUrl}>
                          <Link href={scriptsUrl} className="text-xs">
                            <FileCode2 className="h-3 w-3" />
                            <span>Scripts</span>
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
        <p className="text-xs text-muted-foreground">
          OpenClaw/Moltbot Guided Setup
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
