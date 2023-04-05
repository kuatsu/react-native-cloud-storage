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
