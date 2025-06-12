import eslintPluginReactNative from 'eslint-plugin-react-native';
import { fixupPluginRules } from '@eslint/compat';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['app.plugin.js'],
  },
  {
    name: 'eslint-plugin-react-native',
    plugins: {
      'react-native': fixupPluginRules({
        rules: eslintPluginReactNative.rules,
      }),
    },
    rules: {
      ...eslintPluginReactNative.configs.all.rules,
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
    },
  },
];
