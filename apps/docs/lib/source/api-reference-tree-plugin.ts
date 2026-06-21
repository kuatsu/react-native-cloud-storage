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
 * Lifts the TypeDoc `api/` folder's contents up to the sidebar root (under the `---API Reference---`
 * separator) instead of nesting them in a collapsible index-folder. An index-folder renders its
 * chevron inside its link, so on mobile it navigates instead of expanding — flattening avoids that
 * and matches the layout of the other sections. The folder's own index page becomes an "Overview"
 * entry.
 */
function liftApiReferenceFolder(folder: Folder): Node[] {
  const transformed = transformApiReferenceFolder(folder);
  const overview = transformed.index == null ? [] : [{ ...transformed.index, name: 'Overview' }];
  return [...overview, ...transformed.children];
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
        const children: Node[] = [];
        for (const child of node.children) {
          if (child.type === 'folder' && isApiReferenceFolder(child)) {
            children.push(...liftApiReferenceFolder(child));
          } else {
            children.push(transformNode(child));
          }
        }
        return { ...node, children };
      },
    },
  };
}
