import { Platform } from 'react-native';
import NativeCloudStorageLocalFileSystem from '../specs/NativeCloudStorageLocalFileSystem';
import CloudStorageError from './cloud-storage-error';
import { NativeCloudStorageErrorCode, NativeLocalFileSystem as TNativeLocalFileSystem } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';
import { LINKING_ERROR } from './constants';

const NativeLocalFileSystem = createProxiedNativeModule<TNativeLocalFileSystem>(
  NativeCloudStorageLocalFileSystem as unknown as TNativeLocalFileSystem | null
);

export const localFileSystem =
  NativeLocalFileSystem ??
  (new Proxy(
    {},
    {
      get(_target, property) {
        if (Platform.OS === 'web') {
          throw new CloudStorageError(
            `'${String(property)}' is not supported on the web. Binary file transfer requires a native platform.`,
            NativeCloudStorageErrorCode.UNSUPPORTED_PLATFORM
          );
        }
        throw new Error(LINKING_ERROR);
      },
    }
  ) as TNativeLocalFileSystem);
