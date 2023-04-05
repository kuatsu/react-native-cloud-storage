import RNCloudStorage from './RNCloudStorage';
import { NativeStorageErrorCode } from './types/native';
export * from './types/main';
export * from './hooks/useCloudFile';
export * from './hooks/useIsCloudAvailable';
import NativeStorageError from './utils/NativeStorageError';

export { NativeStorageError };
export { NativeStorageErrorCode };
export default RNCloudStorage;
