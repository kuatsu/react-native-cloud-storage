import type {
  CloudStorageFileStat,
  Spec as NativeCloudStorageCloudKitSpec,
} from '../specs/NativeCloudStorageCloudKitIOS';
import type { Spec as NativeCloudStorageLocalFileSystemSpec } from '../specs/NativeCloudStorageLocalFileSystem';

export type NativeStorageScope = 'documents' | 'documents_legacy' | 'app_data';

export type NativeStorageFileStat = CloudStorageFileStat;

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

export type NativeLocalFileSystem = NativeCloudStorageLocalFileSystemSpec;

export type NativeStorage = Omit<NativeCloudStorageCloudKitSpec, 'onCloudAvailabilityChanged'>;
