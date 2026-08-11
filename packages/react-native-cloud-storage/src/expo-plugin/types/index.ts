export type RNCloudStorageConfigPluginOptions =
  | {
      /**
       * The iCloud container environment to use. Defaults to 'Production'.
       */
      iCloudContainerEnvironment?: 'Production' | 'Development';
      /**
       * The iCloud container identifier to use. Defaults to `iCloud.{appBundleIdentifier}`
       */
      iCloudContainerIdentifier?: string;
      /**
       * Adds the iCloud key-value store entitlement required by CloudKVStorage.
       * Defaults to false.
       */
      enableKeyValueStorage?: boolean;
    }
  | undefined;
