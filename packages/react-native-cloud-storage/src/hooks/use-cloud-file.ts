import type { CloudStorageScope } from '../types/main';
import RNCloudStorage from '../cloud-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * A utility hook for reading and writing to a single file in the cloud.
 * @param path The path to the file.
 * @param scope The directory scope the path is in. Defaults to the default scope set for the current provider.
 * @param cloudStorageInstance An optional instance of RNCloudStorage to use instead of the default instance.
 * @returns An object containing the file's contents and functions for downloading, reading, writing, and removing the file.
 */
export const useCloudFile = (path: string, scope?: CloudStorageScope, cloudStorageInstance?: RNCloudStorage) => {
  const [content, setContent] = useState<string | null>(null);
  const instance = cloudStorageInstance ?? RNCloudStorage;

  const read = useCallback(async () => {
    const exists = await instance.exists(path, scope);
    if (!exists) {
      setContent(null);
      return;
    }
    instance.readFile(path, scope).then(setContent);
  }, [path, scope, instance]);

  useEffect(() => {
    read();
  }, [read]);

  const write = useCallback(
    async (newContent: string) => {
      await instance.writeFile(path, newContent, scope);
      read();
    },
    [path, scope, read, instance]
  );

  const remove = useCallback(async () => {
    await instance.unlink(path, scope);
    setContent(null);
  }, [path, scope, instance]);

  const download = useCallback(async () => {
    await instance.downloadFile(path, scope);
  }, [path, scope, instance]);

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
