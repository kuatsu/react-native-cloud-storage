import type { CloudStorageScope } from '../types/main';
import RNCloudStorage from '../cloud-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A utility hook for reading and writing to a single file in the cloud.
 * @param path The path to the file.
 * @param scope The directory scope the path is in. Defaults to the default scope set for the current provider.
 * @param cloudStorageInstance An optional instance of RNCloudStorage to use instead of the default instance.
 * @returns An object containing the file's contents and functions for downloading, reading, writing, and removing the file.
 */
export const useCloudFile = (path: string, scope?: CloudStorageScope, cloudStorageInstance?: RNCloudStorage) => {
  const [content, setContent] = useState<string | null>(null);
  const readSequence = useRef(0);
  const instance = cloudStorageInstance ?? RNCloudStorage;

  const read = useCallback(async () => {
    const sequence = ++readSequence.current;
    const exists = await instance.exists(path, scope);
    const nextContent = exists ? await instance.readFile(path, scope) : null;
    if (sequence === readSequence.current) setContent(nextContent);
  }, [path, scope, instance]);

  useEffect(() => {
    void read();
    return () => {
      readSequence.current += 1;
    };
  }, [read]);

  const write = useCallback(
    async (newContent: string) => {
      const sequence = ++readSequence.current;
      await instance.writeFile(path, newContent, scope);
      if (sequence === readSequence.current) await read();
    },
    [path, scope, read, instance]
  );

  const remove = useCallback(async () => {
    const sequence = ++readSequence.current;
    await instance.unlink(path, scope);
    if (sequence === readSequence.current) setContent(null);
  }, [path, scope, instance]);

  const sync = useCallback(async () => {
    await instance.triggerSync(path, scope);
  }, [path, scope, instance]);

  return {
    /**
     * The content of the file.
     */
    content,
    /**
     * Reads the file from the cloud.
     */
    read,
    /**
     * Writes new content to the file.
     */
    write,
    /**
     * Deletes the file.
     */
    remove,
    /**
     * Triggers synchronization for the file. Needed if the file hasn't been synced yet from iCloud.
     * Has no effect on Google Drive.
     */
    sync,
    /**
     * Triggers synchronization for the file. Needed if the file hasn't been synced yet from iCloud.
     * Has no effect on Google Drive.
     * @deprecated Use `sync` instead.
     */
    download: sync,
  };
};
