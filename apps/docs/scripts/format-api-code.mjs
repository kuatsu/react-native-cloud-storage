// Reformats the TypeScript code blocks in the TypeDoc-generated API Markdown.
//
// typedoc-plugin-markdown emits method/constructor signatures as bare fragments (e.g.
// `appendFile(...): Promise<void>;`) with inconsistent line wrapping. Those fragments aren't valid
// standalone TypeScript, so we wrap each into a `declare function` Prettier can parse, format it, and
// unwrap — leaving anything unrecognizable untouched.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const apiDir = fileURLToPath(new URL('../content/docs/api', import.meta.url));
const TS_FENCE = /(```(?:ts|tsx|typescript)\n)([\s\S]*?)(\n```)/g;

function scaffoldSignature(code) {
  const body = code.trim();

  const constructorMatch = body.match(/^new\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (constructorMatch != null) {
    return {
      kind: 'ctor',
      constructorName: constructorMatch[1],
      wrapped: body.replace(/^new\s+[A-Za-z_$][\w$]*/, 'declare function __signature__'),
    };
  }

  if (/^static\s+[A-Za-z_$][\w$]*\s*(<[^>]*>)?\s*\(/.test(body)) {
    return {
      kind: 'static',
      wrapped: `declare function ${body.replace(/^static\s+/, '')}`,
    };
  }

  if (/^[A-Za-z_$][\w$]*\s*(<[^>]*>)?\s*\([\s\S]*\)\s*:/.test(body)) {
    return { kind: 'method', wrapped: `declare function ${body}` };
  }

  return { kind: 'skip', wrapped: body };
}

function unwrapSignature(formatted, scaffold) {
  const trimmed = formatted.trim();
  switch (scaffold.kind) {
    case 'ctor':
      return trimmed.replace(/^declare function __signature__/, `new ${scaffold.constructorName}`);
    case 'static':
      return `static ${trimmed.replace(/^declare function /, '')}`;
    case 'method':
      return trimmed.replace(/^declare function /, '');
    default:
      return trimmed;
  }
}

async function formatCodeBlock(code) {
  const scaffold = scaffoldSignature(code);
  if (scaffold.kind === 'skip') {
    return code;
  }

  try {
    const formatted = await format(scaffold.wrapped, {
      parser: 'typescript',
      printWidth: 80,
      semi: true,
    });
    return unwrapSignature(formatted, scaffold);
  } catch {
    return code;
  }
}

async function processFile(filePath) {
  const source = await readFile(filePath, 'utf8');
  const matches = [...source.matchAll(TS_FENCE)];
  if (matches.length === 0) {
    return;
  }

  let result = '';
  let cursor = 0;
  for (const match of matches) {
    const [full, open, code, close] = match;
    result += source.slice(cursor, match.index) + open + (await formatCodeBlock(code)) + close;
    cursor = match.index + full.length;
  }
  result += source.slice(cursor);

  if (result !== source) {
    await writeFile(filePath, result);
  }
}

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(entryPath)));
    } else if (entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }
  return files;
}

const files = await collectMarkdownFiles(apiDir);
await Promise.all(files.map(processFile));
console.log(`Formatted code blocks in ${files.length} API reference files.`);
