import { NativeModules } from 'react-native';
import { NativeLocalFileSystem as TNativeLocalFileSystem } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';
import { LINKING_ERROR } from './constants';

const NativeLocalFileSystem = createProxiedNativeModule<TNativeLocalFileSystem>(
  NativeModules.CloudStorageLocalFileSystem
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
