import { afterEach, expect, it, vi } from 'vitest';
import CloudStorage from '../cloud-storage';
import GoogleDrive from '../storages/google-drive';
import { CloudStorageProvider, CloudStorageScope } from '../types/main';

afterEach(() => vi.restoreAllMocks());

it('preserves text calls and routes byte reads and writes on both APIs', async () => {
  const bytes = new Uint8Array([0, 128, 255]);
  const read = vi
    .spyOn(GoogleDrive.prototype, 'readFile')
    .mockImplementation(async (_path, _scope, format) => (format === 'bytes' ? bytes : 'text'));
  const write = vi.spyOn(GoogleDrive.prototype, 'createFile').mockResolvedValue();
  CloudStorage.setProvider(CloudStorageProvider.GoogleDrive);

  for (const storage of [CloudStorage, new CloudStorage(CloudStorageProvider.GoogleDrive)]) {
    storage.setProviderOptions({ scope: CloudStorageScope.Documents });
    const text = await storage.readFile('/file');
    expect(text).toBe('text');
    expect(read).toHaveBeenLastCalledWith('/file', 'documents', undefined);

    await storage.readFile('/file', CloudStorageScope.AppData);
    expect(read).toHaveBeenLastCalledWith('/file', 'app_data', undefined);
    await storage.readFile('/file', { format: 'text', scope: CloudStorageScope.AppData });
    expect(read).toHaveBeenLastCalledWith('/file', 'app_data', 'text');

    const content = await storage.readFile('/file', { format: 'bytes', scope: CloudStorageScope.AppData });
    expect(content).toEqual(bytes);
    expect(read).toHaveBeenLastCalledWith('/file', 'app_data', 'bytes');

    await storage.writeFile('/file', 'text');
    expect(write).toHaveBeenLastCalledWith('/file', 'text', 'documents', true, undefined);
    await storage.writeFile('/file', 'text', CloudStorageScope.AppData);
    expect(write).toHaveBeenLastCalledWith('/file', 'text', 'app_data', true, undefined);
    await storage.writeFile('/file', 'text', { mimeType: 'application/json' });
    expect(write).toHaveBeenLastCalledWith('/file', 'text', 'documents', true, 'application/json');
    await storage.writeFile('/file', bytes, { mimeType: 'image/png', scope: CloudStorageScope.AppData });
    expect(write).toHaveBeenLastCalledWith('/file', bytes, 'app_data', true, 'image/png');

    write.mockClear();
    // @ts-expect-error Binary writes require a MIME type.
    await expect(storage.writeFile('/file', bytes)).rejects.toThrow(TypeError);
    // @ts-expect-error ArrayBuffer must be converted to Uint8Array before writing.
    await expect(storage.writeFile('/file', bytes.buffer, { mimeType: 'image/png' })).rejects.toThrow(TypeError);
    expect(write).not.toHaveBeenCalled();
  }
});

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
