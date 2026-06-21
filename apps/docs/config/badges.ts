/**
 * Canonical provider/platform badge labels and ordering. Shared between the TypeDoc frontmatter
 * script (which reads `@platform`/`@provider` tags off the library source) and the runtime renderers
 * (sidebar pills, heading pills). Keep this dependency-free so both contexts can import it.
 */

export const CANONICAL_BADGE_LABELS: Record<string, string> = {
  ios: 'iOS only',
  android: 'Android',
  icloud: 'iCloud',
  googledrive: 'Google Drive',
};

export const BADGE_ORDER: readonly string[] = ['iCloud', 'Google Drive', 'iOS only', 'Android'];

const BADGE_ALIASES: Record<string, string> = {
  ios: 'ios',
  iphone: 'ios',
  ipados: 'ios',
  android: 'android',
  icloud: 'icloud',
  googledrive: 'googledrive',
  gdrive: 'googledrive',
  drive: 'googledrive',
};

/** Maps a raw tag value (e.g. "icloud", "Google Drive") to its canonical label, or null. */
export function normalizeBadgeLabel(value: string): string | null {
  const key = value
    .trim()
    .toLowerCase()
    .replaceAll(/[\s._-]+/g, '');
  if (key.length === 0) {
    return null;
  }

  const canonical = BADGE_ALIASES[key];
  if (canonical == null) {
    return null;
  }

  return CANONICAL_BADGE_LABELS[canonical] ?? null;
}

/** De-duplicates and orders badge labels per BADGE_ORDER, with unknown labels appended alphabetically. */
export function orderBadges(labels: Iterable<string>): string[] {
  const unique = new Set<string>();
  for (const label of labels) {
    if (label.length > 0) {
      unique.add(label);
    }
  }

  const prioritized = BADGE_ORDER.filter((label) => unique.has(label));
  const extras = [...unique].filter((label) => !BADGE_ORDER.includes(label)).sort((a, b) => a.localeCompare(b));

  return [...prioritized, ...extras];
}
