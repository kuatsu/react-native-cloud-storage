import type { CloudStorageScope } from '../types/main';
import RNCloudStorage from '../RNCloudStorage';
import { useCallback, useEffect, useState } from 'react';

export const useCloudFile = (path: string, scope: CloudStorageScope) => {
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

  const update = useCallback(
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

  return {
    content,
    read,
    update,
    remove,
  };
};
