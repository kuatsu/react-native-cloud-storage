import createRNCloudStorage from './createRNCloudStorage';
import type { StorageScope } from './types/main';

const nativeInstance = createRNCloudStorage();
const RNCloudStorage = {
  /**
   * Tests whether or not the given path exists.
   * @param path The path to test.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves to true if the path exists, false otherwise.
   */
  exists: (path: string, scope: StorageScope): Promise<boolean> => {
    return nativeInstance.fileExists(path, scope);
  },

  /**
   * Writes to the file at the given path, creating it if it doesn't exist or overwriting it if it does.
   * @param path The file to write to.
   * @param data The data to write.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves when the file has been written.
   */
  writeFile: (path: string, data: string, scope: StorageScope): Promise<void> => {
    return nativeInstance.createFile(path, data, scope, true);
  },

  /**
   * Reads the contents of the file at the given path.
   * @param path The file to read.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves to the contents of the file.
   */
  readFile: (path: string, scope: StorageScope): Promise<string> => {
    return nativeInstance.readFile(path, scope);
  },

  /**
   * Deletes the file at the given path.
   * @param path The file to delete.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves when the file has been deleted.
   */
  unlink: (path: string, scope: StorageScope): Promise<void> => {
    return nativeInstance.deleteFile(path, scope);
  },
};

export default RNCloudStorage;
