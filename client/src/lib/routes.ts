/**
 * routes.ts — Single source of truth for all application routes.
 * Consumed by App.tsx (router) and app-sidebar.tsx (navigation).
 */
import type React from "react";

export interface RouteEntry {
  path: string;
  label: (t: Record<string, string>) => string;
  icon: string; // lucide icon name
  group: "setup" | "monitor" | "community" | "resources" | "hosts" | "hidden";
  lazy: () => Promise<{ default: React.ComponentType<any> }>;
}

export const allRoutes: RouteEntry[] = [
  // ── Setup ──
  {
    path: "/",
    label: (t) => t.navHostSelection || "Host Selection",
    icon: "Home",
    group: "setup",
    lazy: () => import("@/pages/home"),
  },
  {
    path: "/compare",
    label: (t) => t.navCompareFrameworks || "Compare Frameworks",
    icon: "GitCompareArrows",
    group: "setup",
    lazy: () => import("@/pages/compare"),
  },
  {
    path: "/preflight",
    label: (t) => t.navPreflightRunner || "Preflight Runner",
    icon: "Play",
    group: "setup",
    lazy: () => import("@/pages/preflight-runner"),
  },

  // ── Hosts (parametric) ──
  {
    path: "/deploy",
    label: (t) => t.navDeployWizard || "1-Click Deploy",
    icon: "Rocket",
    group: "setup",
    lazy: () => import("@/pages/deploy-wizard"),
  },
  {
    path: "/wizard/:hostTarget",
    label: (t) => t.navWizard || "Wizard",
    icon: "Wand2",
    group: "hosts",
    lazy: () => import("@/pages/wizard"),
  },
  {
    path: "/hardening/:hostTarget",
    label: (t) => t.hostHardening || "Hardening",
    icon: "Shield",
    group: "hosts",
    lazy: () => import("@/pages/hardening"),
  },
  {
    path: "/scripts/:hostTarget",
    label: (t) => t.hostScripts || "Scripts",
    icon: "FileCode2",
    group: "hosts",
    lazy: () => import("@/pages/scripts"),
  },

  // ── Monitor ──
  {
    path: "/logs",
    label: (t) => t.navInstallLogs || "Install Logs",
    icon: "ScrollText",
    group: "monitor",
    lazy: () => import("@/pages/logs"),
  },
  {
    path: "/audit",
    label: (t) => t.navAuditLog || "Audit Log",
    icon: "Lock",
    group: "monitor",
    lazy: () => import("@/pages/audit-log"),
  },

  // ── Community ──
  {
    path: "/builds",
    label: (t) => t.navBuilds || "Build Catalog",
    icon: "Boxes",
    group: "community",
    lazy: () => import("@/pages/builds"),
  },
  {
    path: "/hosting-global",
    label: (t) => t.navHostingGlobal || "Global Hosting",
    icon: "Globe",
    group: "community",
    lazy: () => import("@/pages/hosting-global"),
  },
  {
    path: "/marketplace",
    label: (t) => t.unifiedMarketplaceTitle || "Marketplace",
    icon: "Store",
    group: "community",
    lazy: () => import("@/pages/marketplace-unified"),
  },
  {
    path: "/marketplace/manage",
    label: (t) => t.navMarketplaceManage || "Manage Entries",
    icon: "Settings",
    group: "community",
    lazy: () => import("@/pages/marketplace-manage"),
  },

  // ── Resources ──
  {
    path: "/foundation",
    label: (t) => t.navFoundation || "AiGovOps Foundation",
    icon: "Heart",
    group: "resources",
    lazy: () => import("@/pages/foundation"),
  },
  {
    path: "/releases",
    label: (t) => t.navReleaseDashboard || "Release Dashboard",
    icon: "Activity",
    group: "resources",
    lazy: () => import("@/pages/releases"),
  },

  {
    path: "/hosting",
    label: (t) => t.navHostingDeals || "Hosting Deals",
    icon: "Server",
    group: "resources",
    lazy: () => import("@/pages/hosting-deals"),
  },
  {
    path: "/how-i-built-this",
    label: (t) => t.navHowIBuiltThis || "How I Built This",
    icon: "BookOpen",
    group: "resources",
    lazy: () => import("@/pages/how-i-built-this"),
  },

  // ── Hidden (not in sidebar) ──
  {
    path: "/humans",
    label: () => "Humans",
    icon: "Users",
    group: "hidden",
    lazy: () => import("@/pages/humans"),
  },
];

/** Returns routes for a given group (for sidebar rendering) */
export function getRoutesByGroup(
  group: RouteEntry["group"]
): RouteEntry[] {
  return allRoutes.filter((r) => r.group === group);
}
