import type { ComponentProps, ElementType, ReactNode } from 'react';
import { type BadgesByHeading, extractTextFromNode, normalizeHeadingKey } from '@/lib/badges';

/**
 * Wraps a heading component so that, when its text matches a member name in `badgesByHeading`, a row
 * of provider/platform pills is rendered directly beneath it. Returns the heading untouched when
 * there are no badges to attach.
 */
export function withHeadingBadgePills(Heading: ElementType, badgesByHeading: BadgesByHeading): ElementType {
  if (Object.keys(badgesByHeading).length === 0) {
    return Heading;
  }

  return function HeadingWithBadgePills(props: ComponentProps<'h3'>): ReactNode {
    const key = normalizeHeadingKey(extractTextFromNode(props.children));
    const badges = key == null ? [] : (badgesByHeading[key] ?? []);

    if (badges.length === 0) {
      return <Heading {...props} />;
    }

    return (
      <>
        <Heading {...props} />
        <div className="api-member-badge-row">
          {badges.map((badge) => (
            <span key={badge} className="api-member-badge">
              {badge}
            </span>
          ))}
        </div>
      </>
    );
  };
}
