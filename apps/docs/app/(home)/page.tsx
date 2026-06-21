import Link from 'next/link';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { ArrowRight, Cloud, FolderTree, Github, Layers, Puzzle, Webhook } from 'lucide-react';
import { gitConfig } from '@/lib/layout.shared';

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const codeSample = `import { CloudStorage, CloudStorageScope } from 'react-native-cloud-storage';

// Write a file to the cloud — iCloud on iOS, Google Drive elsewhere.
await CloudStorage.writeFile('/data.json', JSON.stringify(state), CloudStorageScope.AppData);

// Read it back — the API mirrors Node's \`fs\`.
const json = await CloudStorage.readFile('/data.json', CloudStorageScope.AppData);
const exists = await CloudStorage.exists('/data.json', CloudStorageScope.AppData);`;

const features = [
  {
    icon: FolderTree,
    title: 'fs-like API',
    description: "Read, write, stat, and list files with an API that follows Node's `fs` conventions.",
  },
  {
    icon: Cloud,
    title: 'iCloud & Google Drive',
    description: 'One API, two providers. Default to the right backend per platform, or pick your own.',
  },
  {
    icon: Webhook,
    title: 'React hooks',
    description: 'useCloudFile and useIsCloudAvailable keep your UI in sync with cloud state.',
  },
  {
    icon: Puzzle,
    title: 'Expo config plugin',
    description: 'Configure the native iCloud capability automatically — no manual Xcode steps, no eject.',
  },
];

const providers = [
  {
    name: 'iCloud',
    scope: 'iOS — backed by CloudKit, available out of the box.',
  },
  {
    name: 'Google Drive',
    scope: 'iOS & Android — backed by the Drive REST API with your access token.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 md:py-16">
      <section className="grid items-center gap-8 rounded-3xl border border-fd-border bg-linear-to-br from-fd-primary/15 via-fd-background to-fd-background p-6 md:grid-cols-2 md:p-10">
        <div className="flex flex-col items-start gap-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-fd-primary/12 px-3 py-1 text-sm font-medium text-fd-primary">
            <Cloud className="size-4" />
            React Native Cloud Storage
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            iCloud and Google Drive,
            <span className="text-fd-primary"> simplified.</span>
          </h1>
          <p className="max-w-xl text-fd-muted-foreground md:text-lg">
            Use iCloud and Google Drive as file storage in your React Native app, with a single fs-like API, React
            hooks, and an Expo config plugin.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-5 py-2.5 text-base font-medium text-fd-primary-foreground transition-opacity hover:opacity-90">
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={githubUrl}
              rel="noreferrer noopener"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-fd-border bg-fd-card px-5 py-2.5 text-base font-medium transition-colors hover:bg-fd-accent">
              <Github className="size-4" />
              GitHub
            </a>
          </div>
        </div>
        <div className="min-w-0 text-sm">
          <DynamicCodeBlock lang="ts" code={codeSample} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-fd-border bg-fd-card p-5">
            <p className="mb-2 inline-flex items-center gap-2 text-base font-medium">
              <feature.icon className="size-5 text-fd-primary" />
              {feature.title}
            </p>
            <p className="text-sm text-fd-muted-foreground">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <article
            key={provider.name}
            className="flex items-start gap-4 rounded-2xl border border-fd-border bg-fd-card p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fd-primary/10 text-fd-primary">
              <Layers className="size-5" />
            </span>
            <div>
              <p className="text-base font-medium">{provider.name}</p>
              <p className="text-sm text-fd-muted-foreground">{provider.scope}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-fd-border bg-fd-card p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Ready to back up your app's files?</h2>
        <p className="max-w-xl text-fd-muted-foreground">
          Install the library, follow the platform setup, and start reading and writing cloud files in minutes.
        </p>
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-5 py-2.5 text-base font-medium text-fd-primary-foreground transition-opacity hover:opacity-90">
          Read the docs
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}
