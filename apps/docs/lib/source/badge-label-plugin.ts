import type { Item as PageTreeItem, Node as PageTreeNode, Root as PageTreeRoot } from 'fumadocs-core/page-tree';
import type { LoaderPlugin, PageData, PageTreeBuilderContext } from 'fumadocs-core/source';
import { createElement } from 'react';
import { type PageDataWithBadges, readSingleBadgeFromPageData } from '@/lib/badges';
import { type PageDataStorage, readPageData } from '@/lib/source/page-tree';

type BadgePageData = PageData & PageDataWithBadges;
type BadgeStorage = PageDataStorage<BadgePageData>;

function withSidebarBadge(name: PageTreeItem['name'], badge: string): PageTreeItem['name'] {
  return createElement(
    'span',
    { className: 'api-sidebar-item-content' },
    createElement('span', { className: 'api-sidebar-item-label' }, name),
    createElement('span', { className: 'api-sidebar-badge' }, badge)
  );
}

function withBadgeOnItem<Storage extends BadgeStorage>(
  context: PageTreeBuilderContext<Storage>,
  item: PageTreeItem
): PageTreeItem {
  const badge = readSingleBadgeFromPageData(readPageData(context, item));
  if (badge == null) {
    return item;
  }

  return { ...item, name: withSidebarBadge(item.name, badge) };
}

function withBadgeLabels<Storage extends BadgeStorage>(
  context: PageTreeBuilderContext<Storage>,
  node: PageTreeNode
): PageTreeNode {
  if (node.type === 'page') {
    return withBadgeOnItem(context, node);
  }

  if (node.type === 'folder') {
    return {
      ...node,
      index: node.index ? withBadgeOnItem(context, node.index) : undefined,
      children: node.children.map((child) => withBadgeLabels(context, child)),
    };
  }

  return node;
}

/**
 * Renders a small provider/platform pill next to a sidebar entry whose page carries exactly one
 * page-level badge (e.g. an iCloud-only type alias).
 */
export function createBadgeLabelPlugin<Storage extends BadgeStorage = BadgeStorage>(): LoaderPlugin<Storage> {
  return {
    name: 'badge-sidebar-labels',
    transformPageTree: {
      root(this: PageTreeBuilderContext<Storage>, node: PageTreeRoot) {
        return {
          ...node,
          children: node.children.map((child) => withBadgeLabels(this, child)),
        };
      },
    },
  };
}
