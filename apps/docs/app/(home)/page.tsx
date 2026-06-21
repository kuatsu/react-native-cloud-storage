import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">React Native Cloud Storage</h1>
      <p className="text-fd-muted-foreground">iCloud and Google Drive for React Native, simplified.</p>
      <Link
        href="/docs"
        className="inline-flex items-center rounded-xl bg-fd-primary px-5 py-2.5 text-base font-medium text-fd-primary-foreground transition-colors hover:opacity-90">
        Read docs
      </Link>
    </main>
  );
}
