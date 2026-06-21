import { getPageImage, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions';
import { BadgePills } from '@/components/badges/pills';
import { readBadgesFromPageData, readTocBadgesFromPageData } from '@/lib/badges';
import { gitConfig } from '@/lib/layout.shared';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const badges = readBadgesFromPageData(page.data);
  const tocBadges = readTocBadgesFromPageData(page.data);
  const isApiPage = page.path.startsWith('api/');

  // API pages are generated from the library source, so link "Open in GitHub" to the package source
  // rather than the (gitignored) generated MDX file.
  const githubUrl = isApiPage
    ? `https://github.com/${gitConfig.user}/${gitConfig.repo}/tree/${gitConfig.branch}/packages/react-native-cloud-storage/src`
    : `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <BadgePills badges={badges} />
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions markdownUrl={`${page.url}.mdx`} githubUrl={githubUrl} />
      </div>
      <DocsBody className={isApiPage ? 'api-reference-body' : undefined}>
        <MDX
          components={getMDXComponents(
            {
              a: createRelativeLink(source, page),
            },
            { tocBadges }
          )}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
