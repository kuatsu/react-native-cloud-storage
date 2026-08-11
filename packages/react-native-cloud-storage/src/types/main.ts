/**
 * Custom utility type to make properties required, but still allow null if defined.
 * @internal
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export enum CloudStorageScope {
  Documents = 'documents',
  AppData = 'app_data',
}

/** Describes why a cloud key-value store changed externally. */
export enum CloudKVChangeReason {
  /** The provider received values that changed on another device. */
  ServerChange = 'server_change',
  /**
   * The initial iCloud synchronization completed.
   * @provider icloud
   */
  InitialSync = 'initial_sync',
  /**
   * A write exceeded an iCloud key-value store limit.
   * @provider icloud
   */
  QuotaViolation = 'quota_violation',
  /**
   * The active iCloud account changed.
   * @provider icloud
   */
  AccountChange = 'account_change',
}

/** Describes an external cloud key-value store change. */
export interface CloudKVExternalChangeEvent {
  /** The reason for the external change. */
  reason: CloudKVChangeReason;
  /** The affected keys. An empty array means consumers should refresh all relevant keys. */
  changedKeys: string[];
}

/** Describes how a provider implements cloud key-value storage on the current platform. */
export enum CloudKVSupportLevel {
  /**
   * The provider uses a platform-native key-value store.
   * @provider icloud
   */
  Native = 'native',
  /**
   * The provider emulates key-value storage with a cloud file.
   * @provider googledrive
   */
  Emulated = 'emulated',
  /** The provider does not support key-value storage on the current platform. */
  None = 'none',
}

/**
 * Controls which on-device directory `CloudStorageScope.Documents` maps to on iCloud.
 * @provider icloud
 */
export type ICloudDocumentsMode = 'icloud' | 'legacy_sandbox';

export interface CloudStorageFileStat {
  size: number;
  birthtimeMs: number;
  mtimeMs: number;
  birthtime: Date;
  mtime: Date;
  isDirectory: () => boolean;
  isFile: () => boolean;
}

export enum CloudStorageProvider {
  /**
   * Apple iCloud, backed by CloudKit.
   * @platform ios
   */
  ICloud = 'icloud',
  GoogleDrive = 'googledrive',
}

export interface CloudStorageProviderOptions {
  [CloudStorageProvider.ICloud]: {
    /**
     * The directory scope to use for iCloud operations. Defaults to 'app_data'.
     */
    scope?: CloudStorageScope;
    /**
     * The directory mode to use for CloudStorageScope.Documents.
     * `icloud` uses the user-facing iCloud Documents directory, while
     * `legacy_sandbox` uses the local app sandbox Documents directory.
     * Defaults to `icloud`.
     */
    documentsMode?: ICloudDocumentsMode;
  };

  [CloudStorageProvider.GoogleDrive]: {
    /**
     * The directory scope to use for Google Drive operations. Defaults to 'app_data'.
     */
    scope?: CloudStorageScope;
    /**
     * The access token to use for Google Drive operations.
     */
    accessToken?: string | null;
    /**
     * Whether or not to throw an error if multiple files with the same filename are found. Defaults to false.
     */
    strictFilenames?: boolean;
    /**
     * The timeout in milliseconds after which to cancel an API request. Defaults to 3000.
     */
    timeout?: number;
    /**
     * The polling interval in milliseconds for key-value external-change detection.
     * Polling requires a finite value of at least 1 ms. It is off for null, undefined, non-finite,
     * or non-positive values.
     */
    kvPollInterval?: number | null;
    /**
     * Whether to enforce iCloud-equivalent limits for Google Drive key-value storage.
     * Defaults to true.
     */
    kvStrictLimits?: boolean;
  };
}

/**
 * Options for a single cloud storage provider: the iCloud options when the iCloud provider is used,
 * or the Google Drive options when the Google Drive provider is used. This is the value type of
 * {@link CloudStorageProviderOptions} and the shape accepted by `setProviderOptions` and the
 * `CloudStorage` constructor.
 */
export type CloudStorageProviderOptionsValue = CloudStorageProviderOptions[keyof CloudStorageProviderOptions];
