import { Platform, type EventSubscription } from 'react-native';
import RNCloudStorage from './cloud-storage';
import GoogleDriveKV from './storages/google-drive/kv';
import { NativeKVStoreModule, NativeUbiquitousKV, type NativeKVStoreTurboModule } from './storages/ubiquitous-kv';
import {
  CloudKVChangeReason,
  CloudKVSupportLevel,
  CloudStorageProvider,
  type CloudKVExternalChangeEvent,
  type CloudStorageProviderOptions,
  type CloudStorageProviderOptionsValue,
  type DeepRequired,
} from './types/main';
import { NativeCloudStorageErrorCode, type NativeKVStorage } from './types/native';
import CloudStorageError from './utils/cloud-storage-error';
import { DEFAULT_PROVIDER_OPTIONS, KV_LIMITS, LINKING_ERROR } from './utils/constants';
import { assertValidKVKey, getKVItemsByteLength } from './utils/kv';

type ExternalChangeListener = (event: CloudKVExternalChangeEvent) => void;
type KVItems = Record<string, string>;
type DriveEntries = Awaited<ReturnType<GoogleDriveKV['fetchEntries']>>;

/**
 * Stores small string values in iCloud or an emulated Google Drive key-value store.
 *
 * The default CloudStorage and CloudKVStorage instances share provider configuration. Configure
 * either static API to update both defaults. Construct an instance to use independent options.
 *
 * iCloud synchronization requires the key-value store entitlement. Google Drive stores one hidden
 * JSON document in the app data folder.
 */
export default class RNCloudKVStorage {
  private static defaultInstance: RNCloudKVStorage;
  private provider: {
    provider: CloudStorageProvider;
    options: (typeof DEFAULT_PROVIDER_OPTIONS)[keyof typeof DEFAULT_PROVIDER_OPTIONS];
  };
  private followsDefaultCloudStorage = false;
  private externalChangeListeners: ExternalChangeListener[] = [];
  private nativeSubscription: EventSubscription | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollSnapshot: DriveEntries | undefined;
  private driveBackend: GoogleDriveKV | null = null;
  private driveBackendOptions: CloudStorageProviderOptionsValue | null = null;
  private iCloudItems: KVItems | null = null;
  private iCloudMutationQueue: Promise<unknown> = Promise.resolve();

  //#region Constructor and configuration
  /**
   * Creates a standalone key-value storage instance.
   * @param provider The provider to use. Defaults to iCloud on iOS and Google Drive elsewhere.
   * @param options Options for the selected provider.
   * @throws CloudStorageError with `ERR_KV_NOT_SUPPORTED` when the provider is unavailable.
   */
  constructor(provider?: CloudStorageProvider, options?: CloudStorageProviderOptionsValue) {
    const resolvedProvider = provider ?? RNCloudStorage.getDefaultProvider();
    this.assertProviderSupport(resolvedProvider);
    this.provider = {
      provider: resolvedProvider,
      options: DEFAULT_PROVIDER_OPTIONS[resolvedProvider],
    };
    if (options) this.setProviderOptions(options);
  }

  /**
   * Gets the key-value storage support level for a provider on the current platform.
   * @param provider The provider to check.
   * @returns Whether support is native, emulated, or unavailable.
   */
  static getSupportLevel(provider: CloudStorageProvider): CloudKVSupportLevel {
    if (provider === CloudStorageProvider.ICloud) {
      return Platform.OS === 'ios' ? CloudKVSupportLevel.Native : CloudKVSupportLevel.None;
    }
    return CloudKVSupportLevel.Emulated;
  }

  private assertProviderSupport(provider: CloudStorageProvider): void {
    if (RNCloudKVStorage.getSupportLevel(provider) === CloudKVSupportLevel.None) {
      throw new CloudStorageError(
        `Key-value storage is not supported for ${provider} on this platform`,
        NativeCloudStorageErrorCode.KV_NOT_SUPPORTED
      );
    }
  }

  private refreshFollowedConfiguration(): void {
    if (!this.followsDefaultCloudStorage) return;

    const cloudStorage = RNCloudStorage.getDefaultInstance();
    const provider = cloudStorage.getProvider();
    const options = cloudStorage.getProviderOptions();
    this.assertProviderSupport(provider);
    if (provider === this.provider.provider && options === this.provider.options) return;

    this.removeExternalChangeSource();
    this.provider = {
      provider,
      options: options as (typeof DEFAULT_PROVIDER_OPTIONS)[keyof typeof DEFAULT_PROVIDER_OPTIONS],
    };
    this.driveBackend = null;
    this.driveBackendOptions = null;
    this.iCloudItems = null;
    this.configureExternalChangeSource();
  }

  private get nativeStorage(): NativeKVStorage {
    this.refreshFollowedConfiguration();
    if (this.provider.provider === CloudStorageProvider.ICloud) {
      return (
        NativeUbiquitousKV ??
        (new Proxy(
          {},
          {
            get() {
              throw new Error(LINKING_ERROR);
            },
          }
        ) as NativeKVStorage)
      );
    }

    if (!this.driveBackend || this.driveBackendOptions !== this.provider.options) {
      this.driveBackend = new GoogleDriveKV(
        this.provider.options as DeepRequired<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]>
      );
      this.driveBackendOptions = this.provider.options;
    }
    return this.driveBackend;
  }

  /** @returns The current provider. */
  getProvider(): CloudStorageProvider {
    this.refreshFollowedConfiguration();
    return this.provider.provider;
  }

  /**
   * Sets the provider and resets its options. Calling this on the default instance updates the
   * shared CloudStorage configuration.
   * @param provider The provider to use.
   * @throws CloudStorageError with `ERR_KV_NOT_SUPPORTED` when the provider is unavailable.
   */
  setProvider(provider: CloudStorageProvider): void {
    this.assertProviderSupport(provider);
    if (this.followsDefaultCloudStorage) {
      RNCloudStorage.setProvider(provider);
      this.refreshFollowedConfiguration();
      return;
    }
    this.removeExternalChangeSource();
    this.provider = { provider, options: DEFAULT_PROVIDER_OPTIONS[provider] };
    this.driveBackend = null;
    this.driveBackendOptions = null;
    this.iCloudItems = null;
    this.configureExternalChangeSource();
  }

  /** @returns The current provider options. */
  getProviderOptions(): CloudStorageProviderOptionsValue {
    this.refreshFollowedConfiguration();
    return this.provider.options;
  }

  /**
   * Merges options into the current options. Calling this on the default instance updates the
   * shared CloudStorage configuration.
   * @param options The provider options to merge.
   */
  setProviderOptions(options: CloudStorageProviderOptionsValue): void {
    if (this.followsDefaultCloudStorage) {
      RNCloudStorage.setProviderOptions(options);
      this.refreshFollowedConfiguration();
      return;
    }
    const definedOptions = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
    this.removeExternalChangeSource();
    this.provider.options = { ...this.provider.options, ...definedOptions };
    this.driveBackend = null;
    this.driveBackendOptions = null;
    this.iCloudItems = null;
    this.configureExternalChangeSource();
  }
  //#endregion

  //#region External changes
  private notifyExternalChangeListeners(event: CloudKVExternalChangeEvent): void {
    this.iCloudItems = null;
    for (const listener of this.externalChangeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('CloudKVStorage external-change listener failed', error);
      }
    }
  }

  private getNativeModule(): NativeKVStoreTurboModule | null {
    return this.provider.provider === CloudStorageProvider.ICloud ? NativeKVStoreModule : null;
  }

  private removeExternalChangeSource(): void {
    this.nativeSubscription?.remove();
    this.nativeSubscription = null;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.pollSnapshot = undefined;
  }

  private mapChangeReason(reason: string): CloudKVChangeReason {
    return Object.values(CloudKVChangeReason).includes(reason as CloudKVChangeReason)
      ? (reason as CloudKVChangeReason)
      : CloudKVChangeReason.ServerChange;
  }

  private async pollDrive(): Promise<void> {
    this.refreshFollowedConfiguration();
    if (this.provider.provider !== CloudStorageProvider.GoogleDrive) return;

    const backend = this.nativeStorage as GoogleDriveKV;
    const entries = await backend.fetchEntries();
    if (!this.pollSnapshot) {
      this.pollSnapshot = entries;
      return;
    }

    const changedKeys = [...new Set([...Object.keys(this.pollSnapshot), ...Object.keys(entries)])].filter((key) => {
      const previous = this.pollSnapshot?.[key];
      const current = entries[key];
      return previous?.v !== current?.v || previous?.t !== current?.t;
    });
    this.pollSnapshot = entries;
    if (changedKeys.length > 0) {
      this.notifyExternalChangeListeners({ reason: CloudKVChangeReason.ServerChange, changedKeys });
    }
  }

  private configureExternalChangeSource(): void {
    this.removeExternalChangeSource();
    if (this.externalChangeListeners.length === 0) return;

    if (this.provider.provider === CloudStorageProvider.ICloud) {
      const module = this.getNativeModule();
      if (module) {
        this.nativeSubscription = module.onKVStoreChangedExternally((event) => {
          this.notifyExternalChangeListeners({
            reason: this.mapChangeReason(event.reason),
            changedKeys: event.changedKeys,
          });
        });
      }
      return;
    }

    const interval = (
      this.provider.options as DeepRequired<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]>
    ).kvPollInterval;
    if (interval == null || !Number.isFinite(interval) || interval < 1) return;
    void this.pollDrive().catch(() => {});
    this.pollTimer = setInterval(() => void this.pollDrive().catch(() => {}), interval);
  }

  /**
   * Subscribes to external key-value changes. Google Drive requires `kvPollInterval`.
   * @param listener The function to call after an external change.
   */
  subscribeToExternalChanges(listener: (event: CloudKVExternalChangeEvent) => void): void {
    this.refreshFollowedConfiguration();
    this.externalChangeListeners.push(listener);
    if (this.externalChangeListeners.length === 1) this.configureExternalChangeSource();
  }

  /**
   * Removes an external-change listener.
   * @param listener The same function passed to subscribeToExternalChanges.
   */
  unsubscribeFromExternalChanges(listener: (event: CloudKVExternalChangeEvent) => void): void {
    this.externalChangeListeners = this.externalChangeListeners.filter((candidate) => candidate !== listener);
    if (this.externalChangeListeners.length === 0) this.removeExternalChangeSource();
  }
  //#endregion

  //#region Key-value operations
  private assertICloudQuota(items: KVItems): void {
    if (Object.keys(items).length > KV_LIMITS.maxKeys || getKVItemsByteLength(items) > KV_LIMITS.maxTotalBytes) {
      throw new CloudStorageError('Key-value store quota exceeded', NativeCloudStorageErrorCode.KV_QUOTA_EXCEEDED);
    }
  }

  private async getICloudItems(storage: NativeKVStorage): Promise<KVItems> {
    if (this.iCloudItems === null) {
      const items = await storage.kvGetAllItems();
      this.iCloudItems = Object.fromEntries(items.map(({ key, value }) => [key, value]));
    }
    return { ...this.iCloudItems };
  }

  private enqueueICloudMutation<T>(mutation: () => Promise<T>): Promise<T> {
    const result = this.iCloudMutationQueue.then(mutation, mutation);
    this.iCloudMutationQueue = result.catch(() => {});
    return result;
  }

  /**
   * Gets a value.
   * @param key The key to read.
   * @returns The stored string, or null when the key does not exist.
   * @throws CloudStorageError with `ERR_KV_INVALID_KEY` when the key is invalid.
   */
  getItem(key: string): Promise<string | null> {
    assertValidKVKey(key);
    return this.nativeStorage.kvGetItem(key);
  }

  /**
   * Sets a string value.
   * @param key The key to write.
   * @param value The string to store.
   * @throws CloudStorageError when the key is invalid or a store limit is exceeded.
   */
  async setItem(key: string, value: string): Promise<void> {
    assertValidKVKey(key);
    const provider = this.getProvider();
    const storage = this.nativeStorage;
    if (provider !== CloudStorageProvider.ICloud) {
      await storage.kvSetItem(key, value);
      return;
    }

    await this.enqueueICloudMutation(async () => {
      const items = await this.getICloudItems(storage);
      items[key] = value;
      this.assertICloudQuota(items);
      await storage.kvSetItem(key, value);
      this.iCloudItems = items;
    });
  }

  /**
   * Removes a value.
   * @param key The key to remove.
   * @throws CloudStorageError with `ERR_KV_INVALID_KEY` when the key is invalid.
   */
  async removeItem(key: string): Promise<void> {
    assertValidKVKey(key);
    const provider = this.getProvider();
    const storage = this.nativeStorage;
    if (provider !== CloudStorageProvider.ICloud) {
      await storage.kvRemoveItem(key);
      return;
    }

    await this.enqueueICloudMutation(async () => {
      await storage.kvRemoveItem(key);
      if (this.iCloudItems !== null) delete this.iCloudItems[key];
    });
  }

  /** @returns All keys in the store. */
  getAllKeys(): Promise<string[]> {
    return this.nativeStorage.kvGetAllKeys();
  }

  /** @returns All key-value pairs as an object. */
  async getAllItems(): Promise<Record<string, string>> {
    const provider = this.getProvider();
    const items = await this.nativeStorage.kvGetAllItems();
    const result = Object.fromEntries(items.map(({ key, value }) => [key, value]));
    if (provider === CloudStorageProvider.ICloud) this.iCloudItems = { ...result };
    return result;
  }

  /**
   * Removes all values from the store. On iCloud this clears the app's complete ubiquitous
   * key-value store, including values written outside this library.
   */
  async clear(): Promise<void> {
    const provider = this.getProvider();
    const storage = this.nativeStorage;
    if (provider !== CloudStorageProvider.ICloud) {
      await storage.kvClear();
      return;
    }

    await this.enqueueICloudMutation(async () => {
      await storage.kvClear();
      this.iCloudItems = {};
    });
  }

  /**
   * Gets multiple values in input order.
   * @param keys The keys to read.
   * @returns A tuple for each key and its string value or null.
   */
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    for (const key of keys) assertValidKVKey(key);
    if (this.getProvider() === CloudStorageProvider.GoogleDrive) {
      const items = await this.getAllItems();
      return keys.map((key) => [key, items[key] ?? null]);
    }
    return Promise.all(
      keys.map(async (key) => [key, await this.nativeStorage.kvGetItem(key)] as [string, string | null])
    );
  }

  /**
   * Sets multiple values in order.
   * @param entries Key-value tuples to write.
   */
  async multiSet(entries: Array<[string, string]>): Promise<void> {
    for (const [key] of entries) assertValidKVKey(key);
    if (entries.length === 0) return;

    const provider = this.getProvider();
    const storage = this.nativeStorage;
    if (provider !== CloudStorageProvider.ICloud) {
      for (const [key, value] of entries) await storage.kvSetItem(key, value);
      return;
    }

    await this.enqueueICloudMutation(async () => {
      const currentItems = await this.getICloudItems(storage);
      const prospectiveItems = { ...currentItems, ...Object.fromEntries(entries) };
      this.assertICloudQuota(prospectiveItems);
      for (const [key, value] of entries) {
        await storage.kvSetItem(key, value);
        currentItems[key] = value;
        this.iCloudItems = { ...currentItems };
      }
    });
  }

  /**
   * Removes multiple values in order.
   * @param keys The keys to remove.
   */
  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) assertValidKVKey(key);
    const provider = this.getProvider();
    const storage = this.nativeStorage;
    if (provider !== CloudStorageProvider.ICloud) {
      for (const key of keys) await storage.kvRemoveItem(key);
      return;
    }

    await this.enqueueICloudMutation(async () => {
      for (const key of keys) {
        await storage.kvRemoveItem(key);
        if (this.iCloudItems !== null) delete this.iCloudItems[key];
      }
    });
  }

  /**
   * Flushes or refreshes the provider store. iCloud schedules an upload but does not force a
   * server round-trip. Google Drive fetches the remote document again.
   * @returns Whether the synchronization request completed.
   */
  sync(): Promise<boolean> {
    const provider = this.getProvider();
    const storage = this.nativeStorage;
    if (provider !== CloudStorageProvider.ICloud) return storage.kvSync();

    return this.enqueueICloudMutation(async () => {
      this.iCloudItems = null;
      return storage.kvSync();
    });
  }
  //#endregion

  //#region Static methods for default static instance
  /** @returns The default instance that shares CloudStorage configuration. */
  static getDefaultInstance(): RNCloudKVStorage {
    if (!RNCloudKVStorage.defaultInstance) {
      RNCloudKVStorage.defaultInstance = new RNCloudKVStorage();
      RNCloudKVStorage.defaultInstance.followsDefaultCloudStorage = true;
      RNCloudKVStorage.defaultInstance.refreshFollowedConfiguration();
    }
    return RNCloudKVStorage.defaultInstance;
  }

  /** @returns The shared default provider. */
  static getProvider(): CloudStorageProvider {
    return RNCloudKVStorage.getDefaultInstance().getProvider();
  }

  /**
   * Sets the shared default provider for CloudStorage and CloudKVStorage and resets its options.
   * @param provider The provider to use.
   */
  static setProvider(provider: CloudStorageProvider): void {
    RNCloudKVStorage.getDefaultInstance().setProvider(provider);
  }

  /** @returns The shared default provider options. */
  static getProviderOptions(): CloudStorageProviderOptionsValue {
    return RNCloudKVStorage.getDefaultInstance().getProviderOptions();
  }

  /**
   * Merges options into the shared default provider options used by CloudStorage and CloudKVStorage.
   * @param options The provider options to merge.
   */
  static setProviderOptions(options: CloudStorageProviderOptionsValue): void {
    RNCloudKVStorage.getDefaultInstance().setProviderOptions(options);
  }

  /**
   * Subscribes to external changes on the default instance.
   * @param listener The function to call after an external change.
   */
  static subscribeToExternalChanges(listener: (event: CloudKVExternalChangeEvent) => void): void {
    RNCloudKVStorage.getDefaultInstance().subscribeToExternalChanges(listener);
  }

  /**
   * Removes an external-change listener from the default instance.
   * @param listener The same function passed to subscribeToExternalChanges.
   */
  static unsubscribeFromExternalChanges(listener: (event: CloudKVExternalChangeEvent) => void): void {
    RNCloudKVStorage.getDefaultInstance().unsubscribeFromExternalChanges(listener);
  }

  /**
   * Gets a value from the default instance.
   * @param key The key to read.
   * @returns The stored string, or null when the key does not exist.
   */
  static getItem(key: string): Promise<string | null> {
    return RNCloudKVStorage.getDefaultInstance().getItem(key);
  }

  /**
   * Sets a value on the default instance.
   * @param key The key to write.
   * @param value The string to store.
   */
  static setItem(key: string, value: string): Promise<void> {
    return RNCloudKVStorage.getDefaultInstance().setItem(key, value);
  }

  /**
   * Removes a value from the default instance.
   * @param key The key to remove.
   */
  static removeItem(key: string): Promise<void> {
    return RNCloudKVStorage.getDefaultInstance().removeItem(key);
  }

  /** @returns All keys from the default instance. */
  static getAllKeys(): Promise<string[]> {
    return RNCloudKVStorage.getDefaultInstance().getAllKeys();
  }

  /** @returns All key-value pairs from the default instance. */
  static getAllItems(): Promise<Record<string, string>> {
    return RNCloudKVStorage.getDefaultInstance().getAllItems();
  }

  /**
   * Removes all values from the default instance. On iCloud this clears the app's complete
   * ubiquitous key-value store, including values written outside this library.
   */
  static clear(): Promise<void> {
    return RNCloudKVStorage.getDefaultInstance().clear();
  }

  /**
   * Gets multiple values from the default instance.
   * @param keys The keys to read.
   * @returns A tuple for each key and its string value or null.
   */
  static multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    return RNCloudKVStorage.getDefaultInstance().multiGet(keys);
  }

  /**
   * Sets multiple values on the default instance.
   * @param entries Key-value tuples to write.
   */
  static multiSet(entries: Array<[string, string]>): Promise<void> {
    return RNCloudKVStorage.getDefaultInstance().multiSet(entries);
  }

  /**
   * Removes multiple values from the default instance.
   * @param keys The keys to remove.
   */
  static multiRemove(keys: string[]): Promise<void> {
    return RNCloudKVStorage.getDefaultInstance().multiRemove(keys);
  }

  /** @returns Whether synchronization of the default instance completed. */
  static sync(): Promise<boolean> {
    return RNCloudKVStorage.getDefaultInstance().sync();
  }
  //#endregion
}
