import createRNCloudStorage from './createRNCloudStorage';
import { CloudStorageProvider, CloudStorageScope, type CloudStorageFileStat } from './types/main';
import { providerService } from './ProviderService';

let nativeInstance = createRNCloudStorage(providerService.getProvider());

const RNCloudStorage = {
  //#region Provider Options
  /**
   * Gets the list of supported CloudStorageProviders on the current platform.
   * @returns An array of supported CloudStorageProviders.
   */
  getSupportedProviders: providerService.getSupportedProviders,

  /**
   * Gets the current CloudStorageProvider.
   * @returns The current CloudStorageProvider.
   */
  getProvider: providerService.getProvider,

  /**
   * Sets the current CloudStorageProvider.
   * @param newProvider The provider to set as the current provider.
   * @throws An error if the provider is not supported on the current platform.
   */
  setProvider: (newProvider: CloudStorageProvider) => {
    providerService.setProvider(newProvider);
    nativeInstance = createRNCloudStorage(newProvider);
  },

  /**
   * Gets the options for the given provider.
   * @param provider The provider to get the options for. To get the options for the current provider, use `CloudStorage.getProvider()`.
   * @returns The options for the given provider.
   */
  getProviderOptions: providerService.getProviderOptions,

  /**
   * Sets the options for the given provider.
   * @param provider The provider to set the options for. To set the options for the current provider, use `CloudStorage.getProvider()`.
   * @param options The options to set for the provider.
   */
  setProviderOptions: providerService.setProviderOptions,
  //#endregion

  //#region Native Methods
  /**
   * Tests whether or not the cloud storage is available. Always returns true for Google Drive. iCloud may be
   * unavailable right after app launch or if the user is not logged in.
   * @returns A promise that resolves to true if the cloud storage is available, false otherwise.
   */
  isCloudAvailable: async (): Promise<boolean> => {
    return nativeInstance.isCloudAvailable();
  },

  /**
   * Appends the data to the file at the given path, creating the file if it doesn't exist.
   * @param path The file to append to.
   * @param data The data to append.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the current provider.
   * @returns A promise that resolves when the data has been appended.
   */
  appendFile: (path: string, data: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.appendToFile(
      path,
      data,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Tests whether or not the file at the given path exists.
   * @param path The path to test.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to true if the path exists, false otherwise.
   */
  exists: (path: string, scope?: CloudStorageScope): Promise<boolean> => {
    return nativeInstance.fileExists(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Writes to the file at the given path, creating it if it doesn't exist or overwriting it if it does.
   * @param path The file to write to.
   * @param data The data to write.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the file has been written.
   */
  writeFile: (path: string, data: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.createFile(
      path,
      data,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope,
      true
    );
  },

  /**
   * Creates a new directory at the given path.
   * @param path The directory to create.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the directory has been created.
   */
  mkdir: (path: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.createDirectory(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Lists the contents of the directory at the given path.
   * @param path The directory to list.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to an array of file names, excluding '.' and '..'.
   */
  readdir: (path: string, scope?: CloudStorageScope): Promise<string[]> => {
    return nativeInstance.listFiles(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Reads the contents of the file at the given path.
   * @param path The file to read.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to the contents of the file.
   */
  readFile: (path: string, scope?: CloudStorageScope): Promise<string> => {
    return nativeInstance.readFile(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Downloads the file at the given path. Does not have any effect on Google Drive.
   * @param path The file to trigger the download for.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves once the download has been triggered.
   */
  downloadFile: (path: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.downloadFile(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Deletes the file at the given path.
   * @param path The file to delete.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the file has been deleted.
   */
  unlink: (path: string, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.deleteFile(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Deletes the directory at the given path.
   * @param path The directory to delete.
   * @param options Options for the delete operation. Defaults to { recursive: false }.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the directory has been deleted.
   */
  rmdir: (path: string, options?: { recursive?: boolean }, scope?: CloudStorageScope): Promise<void> => {
    return nativeInstance.deleteDirectory(
      path,
      options?.recursive ?? false,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );
  },

  /**
   * Gets the size, creation time, and modification time of the file at the given path.
   * @param path The file to stat.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to the CloudStorageFileStat object.
   */
  stat: async (path: string, scope?: CloudStorageScope): Promise<CloudStorageFileStat> => {
    const native = await nativeInstance.statFile(
      path,
      scope ?? providerService.getProviderOptions(providerService.getProvider()).scope
    );

    return {
      ...native,
      birthtime: new Date(native.birthtimeMs),
      mtime: new Date(native.mtimeMs),
      isDirectory: () => native.isDirectory,
      isFile: () => native.isFile,
    };
  },
  //#endregion

  //#region Deprecated v1 Methods
  /**
   * Deprecated. Use `CloudStorage.getProviderOptions(CloudStorage.getProvider()).scope instead.
   * @deprecated
   */
  getDefaultScope: () => {
    console.warn(
      'CloudStorage.getDefaultScope is deprecated. Use CloudStorage.getProviderOptions(CloudStorage.getProvider()).scope instead.'
    );
    return providerService.getProviderOptions(providerService.getProvider()).scope;
  },

  /**
   * Deprecated. Use `CloudStorage.setProviderOptions(CloudStorage.getProvider(), { scope })` instead.
   * @deprecated
   */
  setDefaultScope: (scope: CloudStorageScope) => {
    console.warn(
      'CloudStorage.setDefaultScope is deprecated. Use CloudStorage.setProviderOptions(CloudStorage.getProvider(), { scope }) instead.'
    );
    providerService.getProviderOptions(providerService.getProvider()).scope = scope;
  },

  /**
   * Deprecated. Use `CloudStorage.getProviderOptions(CloudStorageProvider.GoogleDrive).accessToken` instead.
   * @deprecated
   */
  getGoogleDriveAccessToken: () => {
    console.warn(
      'CloudStorage.getGoogleDriveAccessToken is deprecated. Use CloudStorage.getProviderOptions(CloudStorageProvider.GoogleDrive).accessToken instead.'
    );
    return providerService.getProviderOptions(CloudStorageProvider.GoogleDrive).accessToken;
  },

  /**
   * Deprecated. Use `CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { accessToken })` instead.
   * @deprecated
   */
  setGoogleDriveAccessToken: (accessToken: string | null) => {
    console.warn(
      'CloudStorage.setGoogleDriveAccessToken is deprecated. Use CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { accessToken }) instead.'
    );
    providerService.setProviderOptions(CloudStorageProvider.GoogleDrive, { accessToken });
  },

  /**
   * Deprecated. Use `CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { strictFilenames: enable })` instead.
   * @deprecated
   */
  setThrowOnFilesWithSameName: (enable: boolean) => {
    console.warn(
      'CloudStorage.setThrowOnFilesWithSameName is deprecated. Use CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { strictFilenames: enable }) instead.'
    );
    providerService.setProviderOptions(CloudStorageProvider.GoogleDrive, { strictFilenames: enable });
  },
  //#endregion
};

export default RNCloudStorage;
