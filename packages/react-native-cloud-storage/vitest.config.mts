import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { 'react-native': 'react-native-web' },
    // make Vite prefer the .web.ts siblings, like Metro's web platform resolution
    extensions: ['.web.ts', '.web.tsx', '.web.js', '.ts', '.tsx', '.js', '.mjs', '.json'],
  },
  test: { environment: 'jsdom', include: ['src/__tests__/**/*.test.ts'] },
});
