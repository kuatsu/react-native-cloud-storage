import { expect, it } from 'vitest';

it('imports the public API on web and defaults to Google Drive', async () => {
  const { CloudStorage, CloudStorageProvider } = await import('../index');
  expect(CloudStorage.getDefaultProvider()).toBe(CloudStorageProvider.GoogleDrive);
});
