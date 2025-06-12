import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'React Native Cloud Storage',
  tagline: 'iCloud and Google Drive for React Native, simplified.',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://react-native-cloud-storage.oss.kuatsu.de',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/kuatsu/react-native-cloud-storage/tree/main/apps/docs',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    // image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'React Native Cloud Storage',
      logo: {
        alt: 'React Native Cloud Storage',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'right',
          label: 'Docs',
        },
        {
          href: 'https://github.com/kuatsu/react-native-cloud-storage/releases/latest',
          label: 'Latest Release',
          position: 'right',
        },
        {
          href: 'https://github.com/kuatsu/react-native-cloud-storage',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'kuatsu.de',
              href: 'https://kuatsu.de',
            },
          ],
        },
      ],
      copyright: `Copyright © ${
        new Date().getFullYear() === 2023 ? '' : '2023-'
      }${new Date().getFullYear()} Kuatsu App Agency.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    algolia: {
      appId: 'OFUZ8EY1AT',
      apiKey: 'df6a6580f66eefffb1dbb3342492bace',
      indexName: 'react-native-cloud-storage-oss-kuatsu',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
