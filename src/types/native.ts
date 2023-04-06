export type NativeRNCloudCloudStorageScope = 'documents' | 'app_data';

export interface NativeRNCloudCloudStorageFileStat {
  size: number;
  birthtimeMs: number;
  mtimeMs: number;
  isDirectory: boolean;
  isFile: boolean;
}

export enum CloudStorageErrorCode {
  FILE_NOT_FOUND = 'ERR_FILE_NOT_FOUND',
  DIRECTORY_NOT_FOUND = 'ERR_NO_DIRECTORY_FOUND',
  FILE_ALREADY_EXISTS = 'ERR_FILE_EXISTS',
  MULTIPLE_FILES_SAME_NAME = 'ERR_MULTIPLE_FILES_SAME_NAME',
  WRITE_ERROR = 'ERR_WRITE_ERROR',
  READ_ERROR = 'ERR_READ_ERROR',
  DELETE_ERROR = 'ERR_DELETE_ERROR',
  STAT_ERROR = 'ERR_STAT_ERROR',
  UNKNOWN = 'ERR_UNKNOWN',
  GOOGLE_DRIVE_ACCESS_TOKEN_MISSING = 'ERR_GOOGLE_DRIVE_ACCESS_TOKEN_MISSING',
}

export default interface NativeRNCloudStorage {
  fileExists: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<boolean>;
  createFile: (path: string, data: string, scope: NativeRNCloudCloudStorageScope, overwrite: boolean) => Promise<void>;
  readFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<string>;
  deleteFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<void>;
  statFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<NativeRNCloudCloudStorageFileStat>;
  isCloudAvailable: () => Promise<boolean>;
}
