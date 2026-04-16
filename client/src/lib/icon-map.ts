/**
 * Centralized Icon Map — single source of truth for string-to-icon resolution
 * Used by Patterns, Marketplace, and any future catalog-style pages
 */
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  Bird,
  BookOpen,
  Brain,
  Brush,
  Calendar,
  CircleDot,
  Clock,
  Cloud,
  Clover,
  Compass,
  Container,
  Cpu,
  CreditCard,
  Database,
  Dog,
  Drum,
  Feather,
  FileText,
  Fish,
  Flame,
  Flower,
  Footprints,
  Gamepad2,
  Gem,
  GitBranch,
  Globe,
  GraduationCap,
  Hammer,
  HandHeart,
  Handshake,
  HardDrive,
  Heart,
  Layers,
  Mail,
  Map,
  MessageSquare,
  Mountain,
  Music,
  Network,
  Palette,
  PartyPopper,
  Pen,
  Phone,
  Plug,
  Ribbon,
  Scale,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sprout,
  Store,
  Sunrise,
  Target,
  TicketCheck,
  Users,
  Wheat,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Anchor, Bird, BookOpen, Brain, Brush, Calendar, CircleDot, Clock, Cloud,
  Clover, Compass, Container, Cpu, CreditCard, Database, Dog, Drum, Feather,
  FileText, Fish, Flame, Flower, Footprints, Gamepad2, Gem, GitBranch, Globe,
  GraduationCap, Hammer, HandHeart, Handshake, HardDrive, Heart, Layers, Mail,
  Map, MessageSquare, Mountain, Music, Network, Palette, PartyPopper, Pen, Phone,
  Plug, Ribbon, Scale, Search, Server, Shield, ShieldCheck, Snowflake, Sparkles,
  Sprout, Store, Sunrise, Target, TicketCheck, Users, Wheat, Wind, Wrench, Zap,
};

/** Resolve an icon name to a component. Falls back to HandHeart. Warns in dev mode. */
export function resolveIcon(name: string): LucideIcon {
  const icon = iconMap[name];
  if (!icon && import.meta.env.DEV) {
    console.warn(`[icon-map] Unknown icon: "${name}" — falling back to HandHeart`);
  }
  return icon || HandHeart;
}
