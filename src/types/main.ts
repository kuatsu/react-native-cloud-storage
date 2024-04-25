/* Custom utility type to make properties required, but still allow null if defined */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export enum CloudStorageScope {
  Documents = 'documents',
  AppData = 'app_data',
}

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
  ICloud = 'icloud',
  GoogleDrive = 'googledrive',
}

export interface CloudStorageProviderOptions {
  [CloudStorageProvider.ICloud]: {
    /**
     * The directory scope to use for iCloud operations. Defaults to 'app_data'.
     */
    scope?: CloudStorageScope;
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
  };
}
