import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
  // Redirects from the legacy Docusaurus URL structure. The authored slugs (installation/guides/
  // example) are unchanged; only the introduction and the TypeDoc-generated API slugs moved.
  async redirects() {
    return [
      { source: '/docs/intro', destination: '/docs', permanent: true },
      { source: '/docs/api/CloudStorage', destination: '/docs/api/classes/CloudStorage', permanent: true },
      { source: '/docs/api/CloudStorageError', destination: '/docs/api/classes/CloudStorageError', permanent: true },
      { source: '/docs/api/hooks/:slug*', destination: '/docs/api/functions/:slug*', permanent: true },
      { source: '/docs/api/enums/:slug*', destination: '/docs/api/enumerations/:slug*', permanent: true },
    ];
  },
};

export default withMDX(config);
