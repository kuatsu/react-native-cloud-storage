import createRNCloudStorage from './createRNCloudStorage';
import GoogleDriveApiClient from './google-drive';
import type { CloudStorageFileStat, CloudStorageScope } from './types/main';
import { Platform } from 'react-native';

const nativeInstance = createRNCloudStorage();

const RNCloudStorage = {
  getGoogleDriveAccessToken: () => GoogleDriveApiClient.accessToken,
  setGoogleDriveAccessToken: (accessToken: string) => (GoogleDriveApiClient.accessToken = accessToken),
  setThrowOnFilesWithSameName: (enable: boolean) => (GoogleDriveApiClient.throwOnFilesWithSameName = enable),
  /* eslint-disable @typescript-eslint/no-unused-vars */
  subscribeToFilesWithSameName:
    Platform.OS === 'ios'
      ? // @ts-expect-error - subscriber is undefined; just a mock
        (subscriber: ({ path, fileIds }: { path: string; fileIds: string[] }) => void) => ({ remove: () => {} })
      : (nativeInstance as GoogleDriveApiClient).subscribeToFilesWithSameName.bind(nativeInstance),
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Tests whether or not the cloud storage is available. Always returns true for Google Drive. iCloud may be
   * unavailable right after app launch or if the user is not logged in.
   * @returns A promise that resolves to true if the cloud storage is available, false otherwise.
   */
  isCloudAvailable: async (): Promise<boolean> => {
    return nativeInstance.isCloudAvailable();
  },

  /**
   * Tests whether or not the file at the given path exists.
   * @param path The path to test.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves to true if the path exists, false otherwise.
   */
  exists: (path: string, scope: CloudStorageScope): Promise<boolean> => {
    return nativeInstance.fileExists(path, scope);
  },

  /**
   * Writes to the file at the given path, creating it if it doesn't exist or overwriting it if it does.
   * @param path The file to write to.
   * @param data The data to write.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves when the file has been written.
   */
  writeFile: (path: string, data: string, scope: CloudStorageScope): Promise<void> => {
    return nativeInstance.createFile(path, data, scope, true);
  },

  /**
   * Creates a new directory at the given path.
   * @param path The directory to create.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves when the directory has been created.
   */
  mkdir: (path: string, scope: CloudStorageScope): Promise<void> => {
    return nativeInstance.createDirectory(path, scope);
  },

  /**
   * Lists the contents of the directory at the given path.
   * @param path The directory to list.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves to an array of file names, excluding '.' and '..'.
   */
  readdir: (path: string, scope: CloudStorageScope): Promise<string[]> => {
    return nativeInstance.listFiles(path, scope);
  },

  /**
   * Reads the contents of the file at the given path.
   * @param path The file to read.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves to the contents of the file.
   */
  readFile: (path: string, scope: CloudStorageScope): Promise<string> => {
    return nativeInstance.readFile(path, scope);
  },

  /**
   * Deletes the file at the given path.
   * @param path The file to delete.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves when the file has been deleted.
   */
  unlink: (path: string, scope: CloudStorageScope): Promise<void> => {
    return nativeInstance.deleteFile(path, scope);
  },

  /**
   * Gets the size, creation time, and modification time of the file at the given path.
   * @param path The file to stat.
   * @param scope The directory scope the path is in.
   * @returns A promise that resolves to the CloudStorageFileStat object.
   */
  stat: async (path: string, scope: CloudStorageScope): Promise<CloudStorageFileStat> => {
    const native = await nativeInstance.statFile(path, scope);

    return {
      ...native,
      birthtime: new Date(native.birthtimeMs),
      mtime: new Date(native.mtimeMs),
      isDirectory: () => native.isDirectory,
      isFile: () => native.isFile,
    };
  },
};

export default RNCloudStorage;
