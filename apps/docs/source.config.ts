import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

const docsFrontmatterSchema = frontmatterSchema.extend({
  // Page-level badges, e.g. a symbol restricted to a single provider/platform.
  badges: z.array(z.string().min(1)).optional(),
  // Per-heading badges for API member pills, keyed by the rendered member heading text.
  tocBadges: z.record(z.string(), z.array(z.string().min(1))).optional(),
});

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: docsFrontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {},
});
