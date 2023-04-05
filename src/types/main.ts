export enum StorageScope {
  Documents = 'documents',
  AppData = 'app_data',
}

export interface StorageFileStat {
  size: number;
  birthtimeMs: number;
  mtimeMs: number;
  birthtime: Date;
  mtime: Date;
  isDirectory: () => boolean;
  isFile: () => boolean;
}
