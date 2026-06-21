import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'kuatsu',
  repo: 'react-native-cloud-storage',
  branch: 'master',
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
        // Show only in the top navbar, not in the docs sidebar.
        on: 'nav',
      },
    ],
  };
}
