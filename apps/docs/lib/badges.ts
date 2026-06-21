import type { ReactNode } from 'react';
import { orderBadges } from '@/config/badges';

export type BadgesByHeading = Record<string, string[]>;

export type PageDataWithBadges = {
  badges?: readonly string[];
};

export type PageDataWithTocBadges = {
  tocBadges?: Record<string, readonly string[]>;
};

function normalizeBadgeList(values: readonly string[] | undefined): string[] {
  if (values == null || values.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      seen.add(value);
    }
  }

  return orderBadges(seen);
}

export function readBadgesFromPageData(data: PageDataWithBadges | null | undefined): string[] {
  return normalizeBadgeList(data?.badges);
}

export function readSingleBadgeFromPageData(data: PageDataWithBadges | null | undefined): string | null {
  const badges = readBadgesFromPageData(data);
  return badges.length === 1 ? (badges[0] ?? null) : null;
}

/** Strips the call suffix (`()`, `(...)`) and optional marker (`?`) so heading text matches a member name. */
export function normalizeHeadingKey(value: string): string | null {
  const stripped = value
    .replaceAll(/\(\.\.\.\)|\(\)|\?/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
  return stripped.length > 0 ? stripped : null;
}

export function readTocBadgesFromPageData(data: PageDataWithTocBadges | null | undefined): BadgesByHeading {
  const tocBadges = data?.tocBadges;
  if (tocBadges == null) {
    return {};
  }

  const result: BadgesByHeading = {};
  for (const [heading, values] of Object.entries(tocBadges)) {
    const key = normalizeHeadingKey(heading);
    if (key == null) {
      continue;
    }

    const badges = normalizeBadgeList(values);
    if (badges.length === 0) {
      continue;
    }

    result[key] = badges;
  }

  return result;
}

export function extractTextFromNode(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextFromNode(child)).join('');
  }

  if (typeof node === 'object' && 'props' in node && node.props != null) {
    return extractTextFromNode((node.props as { children?: ReactNode }).children);
  }

  return '';
}
