import {
  CloudStorageProvider,
  CloudStorageScope,
  type CloudStorageFileStat,
  type CloudStorageProviderOptions,
  type DeepRequired,
} from './types/main';
import type { NativeStorage } from './types/native';
import { isProviderSupported } from './utils/helpers';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import GoogleDrive from './storages/google-drive';
import { NativeCloudKit } from './storages/cloudkit';
import { DEFAULT_PROVIDER_OPTIONS, LINKING_ERROR } from './utils/constants';

export default class RNCloudStorage {
  private static defaultInstance: RNCloudStorage;
  private provider: {
    provider: CloudStorageProvider;
    options: (typeof DEFAULT_PROVIDER_OPTIONS)[keyof typeof DEFAULT_PROVIDER_OPTIONS];
  };
  private cloudAvailabilityListeners: ((available: boolean) => void)[] = [];

  //#region Constructor and configuration
  /**
   * Creates a new RNCloudStorage instance for the given provider.
   * @param provider The provider to create the instance for. Defaults to the default provider for the current platform.
   */
  constructor(
    provider?: CloudStorageProvider,
    options?: CloudStorageProviderOptions[keyof CloudStorageProviderOptions]
  ) {
    if (provider && !isProviderSupported(provider)) {
      throw new Error(`Provider ${provider} is not supported on the current platform.`);
    }

    this.provider = {
      provider: provider ?? RNCloudStorage.getDefaultProvider(),
      options: DEFAULT_PROVIDER_OPTIONS[provider ?? RNCloudStorage.getDefaultProvider()],
    };

    this.setProvider(provider ?? RNCloudStorage.getDefaultProvider());
    if (options) {
      this.setProviderOptions(options);
    }
  }

  private get nativeStorage(): NativeStorage {
    switch (this.provider.provider) {
      case CloudStorageProvider.ICloud: {
        return (
          NativeCloudKit ??
          (new Proxy(
            {},
            {
              get() {
                throw new Error(LINKING_ERROR);
              },
            }
          ) as NativeStorage)
        );
      }
      default: {
        return new GoogleDrive(this.provider.options as DeepRequired<CloudStorageProviderOptions['googledrive']>);
      }
    }
  }

  /**
   * Gets the default CloudStorageProvider for the current platform.
   * @returns The default CloudStorageProvider.
   */
  static getDefaultProvider(): CloudStorageProvider {
    switch (Platform.OS) {
      case 'ios': {
        return CloudStorageProvider.ICloud;
      }
      default: {
        return CloudStorageProvider.GoogleDrive;
      }
    }
  }

  /**
   * Gets the list of supported CloudStorageProviders on the current platform.
   * @returns An array of supported CloudStorageProviders.
   */
  static getSupportedProviders(): CloudStorageProvider[] {
    return Object.values(CloudStorageProvider).filter((provider) => isProviderSupported(provider));
  }

  /**
   * Gets the current CloudStorageProvider.
   * @returns The current CloudStorageProvider.
   */
  getProvider(): CloudStorageProvider {
    return this.provider.provider;
  }

  /**
   * Sets the current CloudStorageProvider.
   * @param provider The provider to set.
   */
  setProvider(provider: CloudStorageProvider): void {
    if (!isProviderSupported(provider)) {
      throw new Error(`Provider ${provider} is not supported on the current platform.`);
    }

    this.provider = {
      provider,
      options: DEFAULT_PROVIDER_OPTIONS[provider],
    };

    // Emit an event to notify useIsCloudAvailable() hook consumers of the new cloud availability status
    this.nativeStorage.isCloudAvailable().then((available) => {
      for (const listener of this.cloudAvailabilityListeners) {
        listener(available);
      }
    });

    if (provider === CloudStorageProvider.ICloud) {
      // Listen to native cloud availability change events
      const eventEmitter = new NativeEventEmitter(NativeModules.CloudStorageEventEmitter);
      eventEmitter.addListener('RNCloudStorage.cloud.availability-changed', (event: { available: boolean }) => {
        for (const listener of this.cloudAvailabilityListeners) {
          listener(event.available);
        }
      });
    }
  }

  /**
   * Gets the current options for the current provider.
   * @returns The current options for the current provider.
   */
  getProviderOptions(): CloudStorageProviderOptions[keyof CloudStorageProviderOptions] {
    return this.provider.options;
  }

  /**
   * Sets the options for the current provider.
   * @param options The options to set for the provider.
   */
  setProviderOptions(options: CloudStorageProviderOptions[keyof CloudStorageProviderOptions]): void {
    const newOptions = Object.fromEntries(Object.entries(options).filter(([_, v]) => v !== undefined));
    this.provider.options = {
      ...this.provider.options,
      ...newOptions,
    };

    if (this.provider.provider === CloudStorageProvider.GoogleDrive && 'accessToken' in newOptions) {
      // Emit an event to notify useIsCloudAvailable() hook consumers of the new cloud availability status
      for (const listener of this.cloudAvailabilityListeners) {
        listener(
          !!(newOptions as Required<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]>).accessToken?.length
        );
      }
    }
  }

  subscribeToCloudAvailability(listener: (available: boolean) => void): void {
    this.cloudAvailabilityListeners.push(listener);
  }

  unsubscribeFromCloudAvailability(listener: (available: boolean) => void): void {
    this.cloudAvailabilityListeners = this.cloudAvailabilityListeners.filter((l) => l !== listener);
  }
  //#endregion

  //#region File system operations
  /**
   * Tests whether or not the cloud storage is available. Always returns true for Google Drive. iCloud may be
   * unavailable right after app launch or if the user is not logged in.
   * @returns A promise that resolves to true if the cloud storage is available, false otherwise.
   */
  isCloudAvailable(): Promise<boolean> {
    return this.nativeStorage.isCloudAvailable();
  }

  /**
   * Appends the data to the file at the given path, creating the file if it doesn't exist.
   * @param path The file to append to.
   * @param data The data to append.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the current provider.
   * @returns A promise that resolves when the data has been appended.
   */
  appendFile(path: string, data: string, scope?: CloudStorageScope): Promise<void> {
    return this.nativeStorage.appendToFile(path, data, scope ?? this.provider.options.scope);
  }

  /**
   * Tests whether or not the file at the given path exists.
   * @param path The path to test.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to true if the path exists, false otherwise.
   */
  exists(path: string, scope?: CloudStorageScope): Promise<boolean> {
    return this.nativeStorage.fileExists(path, scope ?? this.provider.options.scope);
  }

  /**
   * Writes to the file at the given path, creating it if it doesn't exist or overwriting it if it does.
   * @param path The file to write to.
   * @param data The data to write.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the file has been written.
   */
  writeFile(path: string, data: string, scope?: CloudStorageScope): Promise<void> {
    return this.nativeStorage.createFile(path, data, scope ?? this.provider.options.scope, true);
  }

  /**
   * Creates a new directory at the given path.
   * @param path The directory to create.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the directory has been created.
   */
  mkdir(path: string, scope?: CloudStorageScope): Promise<void> {
    return this.nativeStorage.createDirectory(path, scope ?? this.provider.options.scope);
  }

  /**
   * Lists the contents of the directory at the given path.
   * @param path The directory to list.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to an array of file names, excluding '.' and '..'.
   */
  readdir(path: string, scope?: CloudStorageScope): Promise<string[]> {
    return this.nativeStorage.listFiles(path, scope ?? this.provider.options.scope);
  }

  /**
   * Reads the contents of the file at the given path.
   * @param path The file to read.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to the contents of the file.
   */
  readFile(path: string, scope?: CloudStorageScope): Promise<string> {
    return this.nativeStorage.readFile(path, scope ?? this.provider.options.scope);
  }

  /**
   * Downloads the file at the given path. Does not have any effect on Google Drive.
   * @param path The file to trigger the download for.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves once the download has been triggered.
   */
  downloadFile(path: string, scope?: CloudStorageScope): Promise<void> {
    return this.nativeStorage.downloadFile(path, scope ?? this.provider.options.scope);
  }

  /**
   * Deletes the file at the given path.
   * @param path The file to delete.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the file has been deleted.
   */
  unlink(path: string, scope?: CloudStorageScope): Promise<void> {
    return this.nativeStorage.deleteFile(path, scope ?? this.provider.options.scope);
  }

  /**
   * Deletes the directory at the given path.
   * @param path The directory to delete.
   * @param options Options for the delete operation. Defaults to { recursive: false }.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves when the directory has been deleted.
   */
  rmdir(path: string, options?: { recursive?: boolean }, scope?: CloudStorageScope): Promise<void> {
    return this.nativeStorage.deleteDirectory(path, options?.recursive ?? false, scope ?? this.provider.options.scope);
  }

  /**
   * Gets the size, creation time, and modification time of the file at the given path.
   * @param path The file to stat.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to the CloudStorageFileStat object.
   */
  async stat(path: string, scope?: CloudStorageScope): Promise<CloudStorageFileStat> {
    const native = await this.nativeStorage.statFile(path, scope ?? this.provider.options.scope);

    return {
      ...native,
      birthtime: new Date(native.birthtimeMs),
      mtime: new Date(native.mtimeMs),
      isDirectory: () => native.isDirectory,
      isFile: () => native.isFile,
    };
  }
  //#endregion

  //#region Static methods for default static instance
  static getDefaultInstance(): RNCloudStorage {
    if (!RNCloudStorage.defaultInstance) {
      RNCloudStorage.defaultInstance = new RNCloudStorage();
    }
    return RNCloudStorage.defaultInstance;
  }

  /**
   * Gets the current provider of the default static instance.
   * @returns The current provider of the default static instance.
   */
  static getProvider(): CloudStorageProvider {
    return RNCloudStorage.getDefaultInstance().getProvider();
  }

  /**
   * Sets the provider of the default static instance.
   * @param provider The provider to set.
   */
  static setProvider(provider: CloudStorageProvider): void {
    RNCloudStorage.getDefaultInstance().setProvider(provider);
  }

  /**
   * Gets the current options for the provider of the default static instance.
   * @returns The current options for the provider of the default static instance.
   */
  static getProviderOptions(): CloudStorageProviderOptions[keyof CloudStorageProviderOptions] {
    return RNCloudStorage.getDefaultInstance().getProviderOptions();
  }

  /**
   * Sets the options for the provider of the default static instance.
   * @param options The options to set for the provider of the default static instance.
   */
  static setProviderOptions(options: CloudStorageProviderOptions[keyof CloudStorageProviderOptions]): void {
    RNCloudStorage.getDefaultInstance().setProviderOptions(options);
  }

  /**
   * Tests whether or not the file at the given path exists in the provider of the default static instance.
   * @param path The path to test.
   * @param scope The directory scope the path is in. Defaults to set default scope set for the current provider.
   * @returns A promise that resolves to true if the path exists, false otherwise.
   */
  static exists(path: string, scope?: CloudStorageScope): Promise<boolean> {
    return RNCloudStorage.getDefaultInstance().exists(path, scope);
  }

  /**
   * Tests whether or not the cloud storage is available for the provider of the default static instance. Always returns true for Google Drive. iCloud may be
   * unavailable right after app launch or if the user is not logged in.
   * @returns A promise that resolves to true if the cloud storage is available, false otherwise.
   */
  static isCloudAvailable(): Promise<boolean> {
    return RNCloudStorage.getDefaultInstance().isCloudAvailable();
  }

  /**
   * Appends the data to the file at the given path in the provider of the default static instance, creating the file if it doesn't exist.
   * @param path The file to append to.
   * @param data The data to append.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves when the data has been appended.
   */
  static appendFile(path: string, data: string, scope?: CloudStorageScope): Promise<void> {
    return RNCloudStorage.getDefaultInstance().appendFile(path, data, scope);
  }

  /**
   * Writes to the file at the given path in the provider of the default static instance, creating it if it doesn't exist or overwriting it if it does.
   * @param path The file to write to.
   * @param data The data to write.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves when the file has been written.
   */
  static writeFile(path: string, data: string, scope?: CloudStorageScope): Promise<void> {
    return RNCloudStorage.getDefaultInstance().writeFile(path, data, scope);
  }

  /**
   * Creates a new directory at the given path in the provider of the default static instance.
   * @param path The directory to create.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves when the directory has been created.
   */
  static mkdir(path: string, scope?: CloudStorageScope): Promise<void> {
    return RNCloudStorage.getDefaultInstance().mkdir(path, scope);
  }

  /**
   * Lists the contents of the directory at the given path in the provider of the default static instance.
   * @param path The directory to list.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves to an array of file names, excluding '.' and '..'.
   */
  static readdir(path: string, scope?: CloudStorageScope): Promise<string[]> {
    return RNCloudStorage.getDefaultInstance().readdir(path, scope);
  }

  /**
   * Reads the contents of the file at the given path in the provider of the default static instance.
   * @param path The file to read.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves to the contents of the file.
   */
  static readFile(path: string, scope?: CloudStorageScope): Promise<string> {
    return RNCloudStorage.getDefaultInstance().readFile(path, scope);
  }

  /**
   * Downloads the file at the given path in the provider of the default static instance. Does not have any effect on Google Drive.
   * @param path The file to trigger the download for.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves once the download has been triggered.
   */
  static downloadFile(path: string, scope?: CloudStorageScope): Promise<void> {
    return RNCloudStorage.getDefaultInstance().downloadFile(path, scope);
  }

  /**
   * Deletes the file at the given path in the provider of the default static instance.
   * @param path The file to delete.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves when the file has been deleted.
   */
  static unlink(path: string, scope?: CloudStorageScope): Promise<void> {
    return RNCloudStorage.getDefaultInstance().unlink(path, scope);
  }

  /**
   * Deletes the directory at the given path in the provider of the default static instance.
   * @param path The directory to delete.
   * @param options Options for the delete operation. Defaults to { recursive: false }.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves when the directory has been deleted.
   */
  static rmdir(path: string, options?: { recursive?: boolean }, scope?: CloudStorageScope): Promise<void> {
    return RNCloudStorage.getDefaultInstance().rmdir(path, options, scope);
  }

  /**
   * Gets the size, creation time, and modification time of the file at the given path in the provider of the default static instance.
   * @param path The file to stat.
   * @param scope The directory scope the path is in. Defaults to the default scope set for the default static instance.
   * @returns A promise that resolves to the CloudStorageFileStat object.
   */
  static stat(path: string, scope?: CloudStorageScope): Promise<CloudStorageFileStat> {
    return RNCloudStorage.getDefaultInstance().stat(path, scope);
  }
  //#endregion
}
