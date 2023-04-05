export type NativeRNCloudStorageScope = 'documents' | 'app_data';

export interface NativeRNCloudStorageFileStat {
  size: number;
  birthtimeMs: number;
  mtimeMs: number;
  isDirectory: boolean;
  isFile: boolean;
}

export enum NativeStorageErrorCode {
  FILE_NOT_FOUND = 'ERR_FILE_NOT_FOUND',
  DIRECTORY_NOT_FOUND = 'ERR_NO_DIRECTORY_FOUND',
  FILE_ALREADY_EXISTS = 'ERR_FILE_EXISTS',
  WRITE_ERROR = 'ERR_WRITE_ERROR',
  READ_ERROR = 'ERR_READ_ERROR',
  DELETE_ERROR = 'ERR_DELETE_ERROR',
  STAT_ERROR = 'ERR_STAT_ERROR',
  UNKNOWN = 'ERR_UNKNOWN',
  GOOGLE_DRIVE_ACCESS_TOKEN_MISSING = 'ERR_GOOGLE_DRIVE_ACCESS_TOKEN_MISSING',
}

export default interface NativeRNCloudStorage {
  fileExists: (path: string, scope: NativeRNCloudStorageScope) => Promise<boolean>;
  createFile: (path: string, data: string, scope: NativeRNCloudStorageScope, overwrite: boolean) => Promise<void>;
  readFile: (path: string, scope: NativeRNCloudStorageScope) => Promise<string>;
  deleteFile: (path: string, scope: NativeRNCloudStorageScope) => Promise<void>;
  statFile: (path: string, scope: NativeRNCloudStorageScope) => Promise<NativeRNCloudStorageFileStat>;
}
