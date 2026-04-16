/**
 * PageHero — Shared hero section used by Patterns and Marketplace pages.
 * Renders a centered icon-title-subtitle header with optional stat badges
 * and an optional count badge. Children are rendered below the hero content
 * (e.g., a search/filter bar).
 */
import type React from "react";

export interface PageHeroBadge {
  icon: React.ReactNode;
  label: string;
}

export interface PageHeroProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badges?: PageHeroBadge[];
  count?: { value: number; label: string };
  testId?: string;
  children?: React.ReactNode; // for search/filter bar below hero
}

export function PageHero({
  icon,
  title,
  subtitle,
  badges,
  count,
  testId,
  children,
}: PageHeroProps) {
  return (
    <div className="text-center space-y-3 py-4">
      {/* Title row */}
      <div className="flex items-center justify-center gap-2">
        <span aria-hidden="true">{icon}</span>
        <h1
          className="text-xl font-bold tracking-tight"
          {...(testId ? { "data-testid": testId } : {})}
        >
          {title}
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>

      {/* Stat badges */}
      {(badges && badges.length > 0) || count ? (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
          {badges?.map((badge, i) => (
            <span key={i} className="flex items-center gap-1">
              {badge.icon}
              {badge.label}
            </span>
          ))}
          {count && (
            <span className="flex items-center gap-1">
              {count.value} {count.label}
            </span>
          )}
        </div>
      ) : null}

      {/* Optional search/filter children */}
      {children}
    </div>
  );
}
