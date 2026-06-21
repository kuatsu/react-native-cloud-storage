import type { Application, CommentDisplayPart, DeclarationReflection, PageEvent } from 'typedoc';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

type PageEventWithFrontmatter = PageEvent & {
  frontmatter?: Record<string, unknown>;
};

function hasPageFrontmatter(page: PageEvent): page is PageEventWithFrontmatter {
  return 'frontmatter' in page;
}

function isIndexPage(url: string | undefined): boolean {
  return url?.replaceAll('\\', '/').endsWith('index.md') ?? false;
}

function getFirstSentence(parts: readonly CommentDisplayPart[] | undefined): string | null {
  if (parts == null || parts.length === 0) {
    return null;
  }

  const text = parts
    .map((part) => part.text)
    .join('')
    .trim();
  if (text.length === 0) {
    return null;
  }

  return text.match(/^.+?[.!?](?:\s|$)/s)?.[0]?.trim() ?? text;
}

function getDescription(model: DeclarationReflection): string | null {
  const summary = model.comment?.summary ?? model.signatures?.[0]?.comment?.summary;
  return getFirstSentence(summary);
}

/**
 * Populates Fumadocs-compatible frontmatter (`title`, `description`) for every TypeDoc-generated
 * page. The project index becomes "API Reference"; symbol pages take their reflection name and the
 * first sentence of their summary.
 */
export function load(app: Application): void {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page: PageEvent) => {
    if (!hasPageFrontmatter(page)) {
      return;
    }

    const model = page.model;
    const name = model != null && typeof model === 'object' && 'name' in model ? (model.name as string) : undefined;

    if (isIndexPage(page.url)) {
      page.frontmatter = {
        ...page.frontmatter,
        title: 'API Reference',
        description: 'Auto-generated API reference for react-native-cloud-storage.',
      };
      return;
    }

    const description = getDescription(model as DeclarationReflection);

    page.frontmatter = {
      ...page.frontmatter,
      title: name ?? 'API Reference',
      ...(description != null ? { description } : {}),
    };
  });
}
