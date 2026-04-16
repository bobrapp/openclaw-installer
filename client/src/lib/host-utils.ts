import type { LucideIcon } from "lucide-react";
import { Laptop, Cloud, Server, Terminal } from "lucide-react";

export interface HostConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  steps: string[];
}

export interface ScriptResponse {
  script: string;
  hostTarget: string;
}

export const HOST_LABELS: Record<string, string> = {
  macos: "macOS",
  digitalocean: "DigitalOcean",
  azure: "Azure VM",
  "generic-vps": "Generic VPS",
};

export function hostLabel(h: string): string {
  return HOST_LABELS[h] || h;
}

export const HOST_ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  cloud: Cloud,
  server: Server,
  terminal: Terminal,
  Laptop,
  Cloud,
  Server,
  Terminal,
};

export function resolveHostIcon(name: string): LucideIcon {
  return HOST_ICONS[name] || Terminal;
}
