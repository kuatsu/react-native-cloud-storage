import RNCloudStorage from './RNCloudStorage';
import { CloudStorageErrorCode } from './types/native';
export * from './types/main';
export * from './hooks/useCloudFile';
export * from './hooks/useIsCloudAvailable';
import CloudStorageError from './utils/CloudStorageError';

export { RNCloudStorage as CloudStorage, CloudStorageError, CloudStorageErrorCode };
