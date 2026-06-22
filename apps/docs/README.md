# React Native Cloud Storage Documentation

The documentation site for [`react-native-cloud-storage`](https://github.com/kuatsu/react-native-cloud-storage),
built with [Fumadocs](https://fumadocs.dev) on Next.js. Deployed to
[react-native-cloud-storage.oss.kuatsu.de](https://react-native-cloud-storage.oss.kuatsu.de).

## Structure

- `content/docs/**` — authored MDX (installation, guides, example).
- `content/docs/api/**` — **generated** API reference (TypeDoc → Markdown). Git-ignored; do not edit by
  hand. Regenerate with `pnpm docs:api`.
- `app/(home)` — landing page. `app/docs` — docs renderer. `lib/`, `config/`, `scripts/` — the
  TypeDoc-to-Fumadocs pipeline and provider/platform badge machinery.

## Development

From the repo root (preferred, so workspace dependencies resolve):

```sh
pnpm --filter react-native-cloud-storage-docs dev
```

Or from this directory:

```sh
pnpm dev          # generate API reference, then start the dev server
pnpm docs:api     # (re)generate content/docs/api from the library's TSDoc
pnpm build        # production build
pnpm typecheck    # generate API + types, then tsc --noEmit
```

`dev`, `build`, and `typecheck` run `pnpm docs:api` first, so the generated API reference is always in
sync with `packages/react-native-cloud-storage/src`.

## API reference & badges

The API reference is generated from the library's TypeScript and TSDoc by TypeDoc
(`typedoc.config.mts` + `scripts/typedoc-frontmatter.mts`). Provider/platform badges come from
additive `@platform` / `@provider` TSDoc tags in the library source; never edit the generated MDX.

## Deployment

Deployed on Vercel.
