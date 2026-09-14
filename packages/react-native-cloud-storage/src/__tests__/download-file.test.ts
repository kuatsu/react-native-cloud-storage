import { afterEach, expect, it, vi } from 'vitest';
import CloudStorage from '../cloud-storage';
import GoogleDrive from '../storages/google-drive';
import { CloudStorageProvider, CloudStorageScope } from '../types/main';

afterEach(() => vi.restoreAllMocks());

it('forwards binary downloads with and without an explicit scope', async () => {
  const download = vi.spyOn(GoogleDrive.prototype, 'downloadFile').mockResolvedValue();
  const sync = vi.spyOn(GoogleDrive.prototype, 'triggerSync').mockResolvedValue();
  CloudStorage.setProvider(CloudStorageProvider.GoogleDrive);

  for (const storage of [CloudStorage, new CloudStorage(CloudStorageProvider.GoogleDrive)]) {
    storage.setProviderOptions({ accessToken: 'test-token' });
    await storage.downloadFile('/backup.zip', '/tmp/backup.zip');
    expect(download).toHaveBeenLastCalledWith('/backup.zip', '/tmp/backup.zip', CloudStorageScope.AppData);
    await storage.downloadFile('/backup.zip', '/tmp/backup.zip', CloudStorageScope.Documents);
    expect(download).toHaveBeenLastCalledWith('/backup.zip', '/tmp/backup.zip', CloudStorageScope.Documents);
  }
  expect(sync).not.toHaveBeenCalled();
});

it('preserves the scope of deprecated download requests', async () => {
  const sync = vi.spyOn(GoogleDrive.prototype, 'triggerSync').mockResolvedValue();
  CloudStorage.setProvider(CloudStorageProvider.GoogleDrive);

  for (const storage of [CloudStorage, new CloudStorage(CloudStorageProvider.GoogleDrive)]) {
    storage.setProviderOptions({ accessToken: 'test-token' });
    await storage.downloadFile('/backup.zip', CloudStorageScope.Documents);
    expect(sync).toHaveBeenLastCalledWith('/backup.zip', CloudStorageScope.Documents);
    await storage.downloadFile('/backup.zip');
    expect(sync).toHaveBeenLastCalledWith('/backup.zip', CloudStorageScope.AppData);
  }
});
