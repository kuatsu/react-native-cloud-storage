export enum StorageScope {
  Documents = 'documents',
  Hidden = 'hidden',
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
