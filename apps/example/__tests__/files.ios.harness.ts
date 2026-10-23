import { Directory, File, Paths } from 'expo-file-system';
import { expect, it } from 'react-native-harness';
import {
  CloudStorage,
  CloudStorageError,
  CloudStorageErrorCode,
  CloudStorageProvider,
  CloudStorageScope,
} from 'react-native-cloud-storage';
import { NativeICloudDriveModule } from '../../../packages/react-native-cloud-storage/src/storages/icloud-drive';

it('writes UTF-8 files and returns native metadata and missing-file errors', async () => {
  const storage = new CloudStorage(CloudStorageProvider.ICloud, {
    scope: CloudStorageScope.Documents,
    documentsMode: 'legacy_sandbox',
  });
  const name = `cloud-storage-harness-${Date.now()}`;
  const directory = new Directory(Paths.document, name);
  const path = `/${name}/backup é.txt`;

  try {
    await storage.mkdir(`/${name}`);
    await storage.writeFile(path, 'café');
    await storage.appendFile(path, '\n');

    expect(await new File(directory, 'backup é.txt').text()).toBe('café\n');
    expect(await storage.readFile(path)).toBe('café\n');
    const stat = await storage.stat(path);
    expect(stat.size).toBe(6);
    expect(stat.isFile()).toBe(true);

    const missing = storage.readFile(`/${name}/missing.txt`);
    await expect(missing).rejects.toBeInstanceOf(CloudStorageError);
    await expect(missing).rejects.toMatchObject({ code: CloudStorageErrorCode.FILE_NOT_FOUND });
  } finally {
    if (directory.exists) directory.delete();
  }
});

it('preserves binary slices and snapshots writes before JavaScript can change them', async () => {
  const storage = new CloudStorage(CloudStorageProvider.ICloud, {
    scope: CloudStorageScope.Documents,
    documentsMode: 'legacy_sandbox',
  });
  const name = `cloud-storage-bytes-${Date.now()}`;
  const directory = new Directory(Paths.document, name);
  const path = `/${name}/data.bin`;

  try {
    await storage.mkdir(`/${name}`);
    for (const length of [0, 256, 1_048_576]) {
      const bytes = Uint8Array.from({ length: length + 2 }, (_, index) => index % 256).subarray(1, length + 1);
      const write = storage.writeFile(path, bytes, { mimeType: 'application/octet-stream' });
      bytes.fill(99);
      await write;

      const restored = await storage.readFile(path, { format: 'bytes' });
      expect(restored.byteLength).toBe(length);
      expect(restored.every((byte, index) => byte === (index + 1) % 256)).toBe(true);
      const concurrent = await Promise.all([
        storage.readFile(path, { format: 'bytes' }),
        storage.readFile(path, { format: 'bytes' }),
      ]);
      expect(concurrent[0].buffer === concurrent[1].buffer).toBe(false);
      expect(restored.every((byte, index) => byte === (index + 1) % 256)).toBe(true);
    }

    const buffer = new ArrayBuffer(4);
    for (const [offset, length] of [
      [-1, 1],
      [0, 5],
      [5, 0],
      [0.5, 1],
      [0, NaN],
    ]) {
      expect(() =>
        NativeICloudDriveModule!.writeBytes(path, buffer, offset!, length!, 'documents_legacy', true)
      ).toThrow();
    }
    expect((await storage.stat(path)).size).toBe(1_048_576);

    const missing = storage.readFile(`/${name}/missing.bin`, { format: 'bytes' });
    await expect(missing).rejects.toBeInstanceOf(CloudStorageError);
    await expect(missing).rejects.toMatchObject({ code: CloudStorageErrorCode.FILE_NOT_FOUND });
  } finally {
    if (directory.exists) directory.delete();
  }
});
