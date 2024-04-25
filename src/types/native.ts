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
  PATH_IS_FILE = 'ERR_PATH_IS_FILE',
  PATH_IS_DIRECTORY = 'ERR_PATH_IS_DIRECTORY',
  DIRECTORY_NOT_FOUND = 'ERR_DIRECTORY_NOT_FOUND',
  DIRECTORY_NOT_EMPTY = 'ERR_DIRECTORY_NOT_EMPTY',
  FILE_ALREADY_EXISTS = 'ERR_FILE_EXISTS',
  MULTIPLE_FILES_SAME_NAME = 'ERR_MULTIPLE_FILES_SAME_NAME',
  AUTHENTICATION_FAILED = 'ERR_AUTHENTICATION_FAILED',
  WRITE_ERROR = 'ERR_WRITE_ERROR',
  READ_ERROR = 'ERR_READ_ERROR',
  DELETE_ERROR = 'ERR_DELETE_ERROR',
  STAT_ERROR = 'ERR_STAT_ERROR',
  UNKNOWN = 'ERR_UNKNOWN',
  FILE_NOT_DOWNLOADABLE = 'ERR_FILE_NOT_DOWNLOADABLE',
  ACCESS_TOKEN_MISSING = 'ERR_ACCESS_TOKEN_MISSING',
}

export default interface NativeRNCloudStorage {
  fileExists: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<boolean>;
  appendToFile: (path: string, data: string, scope: NativeRNCloudCloudStorageScope) => Promise<void>;
  createFile: (path: string, data: string, scope: NativeRNCloudCloudStorageScope, overwrite: boolean) => Promise<void>;
  createDirectory: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<void>;
  listFiles: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<string[]>;
  readFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<string>;
  downloadFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<void>;
  deleteFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<void>;
  deleteDirectory: (path: string, recursively: boolean, scope: NativeRNCloudCloudStorageScope) => Promise<void>;
  statFile: (path: string, scope: NativeRNCloudCloudStorageScope) => Promise<NativeRNCloudCloudStorageFileStat>;
  isCloudAvailable: () => Promise<boolean>;
}
