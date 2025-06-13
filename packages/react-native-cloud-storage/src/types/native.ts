export type NativeStorageScope = 'documents' | 'app_data';

export interface NativeStorageFileStat {
  size: number;
  birthtimeMs: number;
  mtimeMs: number;
  isDirectory: boolean;
  isFile: boolean;
}

export enum NativeCloudStorageErrorCode {
  INVALID_SCOPE = 'ERR_INVALID_SCOPE',
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
  INVALID_URL = 'ERR_INVALID_URL',
  NETWORK_ERROR = 'ERR_NETWORK_ERROR',
}

export interface NativeLocalFileSystem {
  getConstants: () => {
    temporaryDirectory: string;
  };
  createFile: (path: string, data: string) => Promise<string>;
  readFile: (path: string) => Promise<string>;
  downloadFile: (remoteUri: string, localPath: string, options?: { headers?: Record<string, string> }) => Promise<void>;
  uploadFile: (
    localPath: string,
    remoteUri: string,
    options?: { headers?: Record<string, string>; httpMethod?: 'PUT' | 'POST' }
  ) => Promise<void>;
}

export interface NativeStorage {
  fileExists: (path: string, scope: NativeStorageScope) => Promise<boolean>;
  appendToFile: (path: string, data: string, scope: NativeStorageScope) => Promise<void>;
  createFile: (path: string, data: string, scope: NativeStorageScope, overwrite: boolean) => Promise<void>;
  createDirectory: (path: string, scope: NativeStorageScope) => Promise<void>;
  listFiles: (path: string, scope: NativeStorageScope) => Promise<string[]>;
  readFile: (path: string, scope: NativeStorageScope) => Promise<string>;
  deleteFile: (path: string, scope: NativeStorageScope) => Promise<void>;
  deleteDirectory: (path: string, recursively: boolean, scope: NativeStorageScope) => Promise<void>;
  statFile: (path: string, scope: NativeStorageScope) => Promise<NativeStorageFileStat>;
  downloadFile: (remotePath: string, localPath: string, scope: NativeStorageScope) => Promise<void>;
  uploadFile: (remotePath: string, localPath: string, scope: NativeStorageScope) => Promise<void>;
  isCloudAvailable: () => Promise<boolean>;
  triggerSync: (path: string, scope: NativeStorageScope) => Promise<void>;
}
