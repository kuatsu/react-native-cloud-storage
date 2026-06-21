import defaultMdxComponents from 'fumadocs-ui/mdx';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import type { MDXComponents } from 'mdx/types';
import type { ElementType } from 'react';
import type { BadgesByHeading } from '@/lib/badges';
import { withHeadingBadgePills } from '@/lib/mdx/headings';

type MDXOptions = {
  tocBadges?: BadgesByHeading;
};

export function getMDXComponents(components?: MDXComponents, options?: MDXOptions): MDXComponents {
  const base: MDXComponents = {
    ...defaultMdxComponents,
    ...TabsComponents,
    Callout,
  };

  if (options?.tocBadges != null && Object.keys(options.tocBadges).length > 0) {
    base.h3 = withHeadingBadgePills((base.h3 as ElementType) ?? 'h3', options.tocBadges) as MDXComponents['h3'];
  }

  return {
    ...base,
    ...components,
  };
}
