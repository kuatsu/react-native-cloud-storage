import type { Item as PageTreeItem, Node as PageTreeNode } from 'fumadocs-core/page-tree';
import type {
  ContentStorage,
  ContentStorageMetaFile,
  ContentStoragePageFile,
  PageData,
  PageTreeBuilderContext,
} from 'fumadocs-core/source';

export type PageDataStorage<Data extends PageData = PageData> = ContentStorage<
  ContentStoragePageFile<string | undefined, Data>,
  ContentStorageMetaFile
>;

export function getNodeNameAsString(name: PageTreeNode['name']): string {
  return typeof name === 'string' ? name : '';
}

export function readPageData<Storage extends PageDataStorage>(
  context: PageTreeBuilderContext<Storage>,
  item: PageTreeItem
): Storage['$inferPage']['data'] | null {
  const filePath = item.$ref;
  if (typeof filePath !== 'string' || filePath.length === 0) {
    return null;
  }

  const file = context.storage.read(filePath);
  if (file == null || file.format !== 'page') {
    return null;
  }

  return file.data;
}
