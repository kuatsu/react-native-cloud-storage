import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OptionDefaults } from 'typedoc';

const docsRoot = process.cwd();
const repoRoot = path.resolve(docsRoot, '..', '..');
const packageRoot = path.join(repoRoot, 'packages', 'react-native-cloud-storage');

const config = {
  entryPoints: [path.join(packageRoot, 'src', 'index.ts')],
  tsconfig: path.join(packageRoot, 'tsconfig.json'),
  out: path.join(docsRoot, 'content', 'docs', 'api'),
  plugin: [
    'typedoc-plugin-markdown',
    'typedoc-plugin-frontmatter',
    fileURLToPath(new URL('scripts/typedoc-frontmatter.mts', import.meta.url)),
  ],
  blockTags: [...OptionDefaults.blockTags, '@platform', '@provider'],
  // "Type Literal" is opaque jargon for an anonymous object shape; relabel it.
  locales: {
    en: {
      kind_type_literal: 'Object',
    },
  },
  readme: 'none',
  fileExtension: '.md',
  entryFileName: 'index',
  hidePageHeader: true,
  hidePageTitle: true,
  hideBreadcrumbs: true,
  useCodeBlocks: true,
  // Render members as tables and keep complex object types compact instead of exploding them into
  // nested "Type Literal" heading soup (the readable full signature already lives in the code block).
  parametersFormat: 'table',
  typeDeclarationFormat: 'table',
  interfacePropertiesFormat: 'table',
  propertyMembersFormat: 'table',
  classPropertiesFormat: 'table',
  enumMembersFormat: 'table',
  typeDeclarationVisibility: 'compact',
  expandObjects: false,
  expandParameters: true,
  disableSources: true,
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  excludeExternals: true,
  skipErrorChecking: true,
  validation: {
    invalidLink: true,
    notExported: false,
    rewrittenLink: true,
  },
};

export default config;
