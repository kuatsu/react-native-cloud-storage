import type { CloudStorageScope } from '../types/main';
import RNCloudStorage from '../RNCloudStorage';
import { useCallback, useEffect, useState } from 'react';

/**
 * A utility hook for reading and writing to a single file in the cloud.
 * @param path The path to the file.
 * @param scope The directory scope the path is in. If not provided, defaults to the default scope set in the library.
 * @returns An object containing the file's contents and functions for downloading, reading, writing, and removing the file.
 */
export const useCloudFile = (path: string, scope?: CloudStorageScope) => {
  const [content, setContent] = useState<string | null>(null);

  const read = useCallback(async () => {
    const exists = await RNCloudStorage.exists(path, scope);
    if (!exists) {
      setContent(null);
      return;
    }
    RNCloudStorage.readFile(path, scope).then(setContent);
  }, [path, scope]);

  useEffect(() => {
    read();
  }, [read]);

  const write = useCallback(
    async (newContent: string) => {
      await RNCloudStorage.writeFile(path, newContent, scope);
      read();
    },
    [path, scope, read]
  );

  const remove = useCallback(async () => {
    await RNCloudStorage.unlink(path, scope);
    setContent(null);
  }, [path, scope]);

  const download = useCallback(async () => {
    await RNCloudStorage.downloadFile(path, scope);
  }, [path, scope]);

  return {
    content,
    read,
    write,
    remove,
    /**
     * Downloads the file from iCloud to the device. Needed if the file hasn't been synced yet. Has no effect on
     * Google Drive.
     */
    download,
  };
};
