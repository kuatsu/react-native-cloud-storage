import {
  type Application,
  Comment,
  type CommentDisplayPart,
  type DeclarationReflection,
  type PageEvent,
  type SignatureReflection,
} from 'typedoc';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';
import { normalizeBadgeLabel, orderBadges } from '../config/badges.ts';

type PageEventWithFrontmatter = PageEvent & {
  frontmatter?: Record<string, unknown>;
};

const BADGE_TAGS = ['@platform', '@provider'] as const;

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

function collectSignatures(reflection: DeclarationReflection): SignatureReflection[] {
  const signatures: SignatureReflection[] = [...(reflection.signatures ?? [])];
  if (reflection.getSignature != null) {
    signatures.push(reflection.getSignature);
  }
  if (reflection.setSignature != null) {
    signatures.push(reflection.setSignature);
  }
  return signatures;
}

/**
 * Reads `@platform`/`@provider` tags from a comment, maps them to canonical badge labels, and
 * removes the tags so they do not render in the page body.
 */
function extractBadgesFromComment(comment: Comment | null | undefined): string[] {
  if (comment == null) {
    return [];
  }

  const labels: string[] = [];
  for (const tagName of BADGE_TAGS) {
    const tags = comment.getTags(tagName);
    for (const tag of tags) {
      const text = Comment.combineDisplayParts(tag.content);
      for (const part of text.split(/[\n,/&]|\band\b|\bor\b/gi)) {
        const label = normalizeBadgeLabel(part);
        if (label != null) {
          labels.push(label);
        }
      }
    }
    if (tags.length > 0) {
      comment.removeTags(tagName);
    }
  }

  return orderBadges(labels);
}

function collectReflectionBadges(reflection: DeclarationReflection): string[] {
  const labels = new Set<string>(extractBadgesFromComment(reflection.comment));
  for (const signature of collectSignatures(reflection)) {
    for (const label of extractBadgesFromComment(signature.comment)) {
      labels.add(label);
    }
  }
  return orderBadges(labels);
}

function collectMemberBadges(reflection: DeclarationReflection): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const child of reflection.children ?? []) {
    if (typeof child.name !== 'string' || child.name.length === 0) {
      continue;
    }

    const badges = collectReflectionBadges(child);
    if (badges.length === 0) {
      continue;
    }

    result[child.name] = orderBadges([...(result[child.name] ?? []), ...badges]);
  }
  return result;
}

/**
 * Populates Fumadocs-compatible frontmatter for every TypeDoc-generated page: `title`/`description`,
 * plus `badges` (page-level provider/platform) and `tocBadges` (per-member, keyed by member name).
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

    const declaration = model as DeclarationReflection;
    const description = getDescription(declaration);
    const badges = collectReflectionBadges(declaration);
    const tocBadges = collectMemberBadges(declaration);

    page.frontmatter = {
      ...page.frontmatter,
      title: name ?? 'API Reference',
      ...(description != null ? { description } : {}),
      ...(badges.length > 0 ? { badges } : {}),
      ...(Object.keys(tocBadges).length > 0 ? { tocBadges } : {}),
    };
  });
}
