import createRNCloudStorage from './createRNCloudStorage';
import type { StorageScope } from './types/main';

const nativeInstance = createRNCloudStorage();
const RNCloudStorage = {
  fileExists: (path: string, scope: StorageScope): Promise<boolean> => {
    return nativeInstance.fileExists(path, scope);
  },

  createFile: (path: string, data: string, scope: StorageScope, overwrite?: boolean): Promise<void> => {
    return nativeInstance.createFile(path, data, scope, overwrite || false);
  },

  readFile: (path: string, scope: StorageScope): Promise<string> => {
    return nativeInstance.readFile(path, scope);
  },

  deleteFile: (path: string, scope: StorageScope): Promise<void> => {
    return nativeInstance.deleteFile(path, scope);
  },
};

export default RNCloudStorage;
