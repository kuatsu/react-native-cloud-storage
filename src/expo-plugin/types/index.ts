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
    }
  | undefined;
