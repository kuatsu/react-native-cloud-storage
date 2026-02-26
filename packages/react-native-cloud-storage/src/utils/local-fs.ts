import NativeCloudStorageLocalFileSystem from '../specs/NativeCloudStorageLocalFileSystem';
import { NativeLocalFileSystem as TNativeLocalFileSystem } from '../types/native';
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
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  ) as TNativeLocalFileSystem);
