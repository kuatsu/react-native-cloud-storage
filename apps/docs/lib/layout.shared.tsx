import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'kuatsu',
  repo: 'react-native-cloud-storage',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'React Native Cloud Storage',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'Latest Release',
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}/releases/latest`,
        external: true,
      },
    ],
  };
}
