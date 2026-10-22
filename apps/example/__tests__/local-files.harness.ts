import { Directory, File, Paths } from 'expo-file-system';
import { expect, it } from 'react-native-harness';
import { CloudStorageError, CloudStorageErrorCode } from 'react-native-cloud-storage';
import { localFileSystem } from '../../../packages/react-native-cloud-storage/src/utils/local-fs';

it('writes UTF-8 files and normalizes native missing-file errors', async () => {
  const directory = new Directory(Paths.cache, `cloud-storage-harness-${Date.now()}`);
  directory.create();

  try {
    const file = new File(directory, 'backup.txt');
    await localFileSystem.createFile(file.uri, 'café\n');

    expect(await file.text()).toBe('café\n');
    expect(await localFileSystem.readFile(file.uri)).toBe('café\n');

    const missing = localFileSystem.readFile(new File(directory, 'missing.txt').uri);
    await expect(missing).rejects.toBeInstanceOf(CloudStorageError);
    await expect(missing).rejects.toMatchObject({ code: CloudStorageErrorCode.FILE_NOT_FOUND });
  } finally {
    directory.delete();
  }
});
