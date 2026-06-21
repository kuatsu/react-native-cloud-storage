import type { Folder, Node, Root } from 'fumadocs-core/page-tree';
import type { LoaderPlugin } from 'fumadocs-core/source';
import {
  API_SECTION_KEYS,
  FLATTENED_FOLDERS,
  FOLDER_LABELS,
  FOLDER_ORDER,
  normalizeApiSectionKey,
  PAGE_ORDER,
} from '@/config/api-reference';

function getNodeName(name: Node['name']): string {
  return typeof name === 'string' ? name : '';
}

function isApiReferenceFolder(folder: Folder): boolean {
  return folder.children.some(
    (child) => child.type === 'folder' && API_SECTION_KEYS.has(normalizeApiSectionKey(getNodeName(child.name)))
  );
}

function sortPriority(node: Node): number {
  if (node.type === 'folder') {
    return FOLDER_ORDER[getNodeName(node.name)] ?? 100;
  }
  if (node.type === 'page') {
    return PAGE_ORDER[getNodeName(node.name)] ?? 50;
  }
  return 200;
}

function transformApiReferenceFolder(folder: Folder): Folder {
  const children: Node[] = [];

  for (const child of folder.children) {
    if (child.type === 'folder') {
      const key = normalizeApiSectionKey(getNodeName(child.name));

      if (FLATTENED_FOLDERS.has(key)) {
        children.push(...child.children);
        continue;
      }

      const label = FOLDER_LABELS[key];
      if (label != null) {
        children.push({ ...child, name: label });
        continue;
      }
    }

    children.push(child);
  }

  children.sort((left, right) => sortPriority(left) - sortPriority(right));

  return { ...folder, children };
}

function transformNode(node: Node): Node {
  if (node.type !== 'folder') {
    return node;
  }

  const folder: Folder = { ...node, children: node.children.map(transformNode) };
  return isApiReferenceFolder(folder) ? transformApiReferenceFolder(folder) : folder;
}

/**
 * Reshapes the TypeDoc-generated `api/` subtree: lifts the two classes (`CloudStorage`,
 * `CloudStorageError`) to the section root, renames the remaining kind folders to friendly labels
 * (Hooks, Interfaces, Enums, Type Aliases), and orders everything for the sidebar.
 */
export function createApiReferenceTreePlugin(): LoaderPlugin {
  return {
    name: 'api-reference-tree',
    transformPageTree: {
      root(node: Root) {
        return {
          ...node,
          children: node.children.map(transformNode),
        };
      },
    },
  };
}
