/**
 * Maps TypeDoc's kind-based output folders (`classes`, `functions`, …) onto the API Reference
 * sidebar: which folders get flattened into the section root, their canonical labels, and the
 * order in which pages and folders appear.
 */

export function normalizeApiSectionKey(name: string): string {
  return name.trim().toLowerCase().replaceAll(/\s+/g, '-');
}

/** TypeDoc kind folders whose pages are lifted directly into the API Reference root. */
export const FLATTENED_FOLDERS = new Set(['classes']);

/** TypeDoc kind folder key -> canonical sidebar label. */
export const FOLDER_LABELS: Record<string, string> = {
  'functions': 'Hooks',
  'interfaces': 'Interfaces',
  'enumerations': 'Enums',
  'type-aliases': 'Type Aliases',
};

/** All TypeDoc kind folders the tree plugin recognizes (used to detect the API Reference folder). */
export const API_SECTION_KEYS = new Set([...FLATTENED_FOLDERS, ...Object.keys(FOLDER_LABELS)]);

/** Sidebar order for flattened pages (by title). Lower sorts first. */
export const PAGE_ORDER: Record<string, number> = {
  CloudStorage: 0,
  CloudStorageError: 1,
};

/** Sidebar order for section folders (by canonical label). Lower sorts first. */
export const FOLDER_ORDER: Record<string, number> = {
  'Hooks': 2,
  'Interfaces': 3,
  'Enums': 4,
  'Type Aliases': 5,
};
