import { Directory, File, Paths } from 'expo-file-system';
import { expect, it } from 'react-native-harness';
import {
  CloudStorage,
  CloudStorageError,
  CloudStorageErrorCode,
  CloudStorageProvider,
  CloudStorageScope,
} from 'react-native-cloud-storage';

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
