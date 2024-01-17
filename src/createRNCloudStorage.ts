import { NativeModules, Platform } from 'react-native';
import type NativeRNCloudStorage from './types/native';
import GoogleDrive from './google-drive';
import { CloudStorageErrorCode } from './types/native';
import CloudStorageError from './utils/CloudStorageError';

const LINKING_ERROR =
  `The package 'react-native-cloud-storage' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// proxy NativeModules.CloudStorage to catch any errors thrown by the native module and wrap them in a CloudStorageError
const nativeIosInstance = NativeModules.CloudStorage
  ? new Proxy(NativeModules.CloudStorage, {
      get(target: NativeRNCloudStorage, prop: keyof NativeRNCloudStorage) {
        const originalFunction = target[prop];
        if (typeof originalFunction === 'function') {
          return async (...args: any[]) => {
            try {
              // @ts-expect-error - we can't know the types of the functions and their arguments
              return await originalFunction(...args);
            } catch (error: any) {
              if (error?.code && Object.values(CloudStorageErrorCode).includes(error.code)) {
                throw new CloudStorageError(error?.message || '', error.code as CloudStorageErrorCode);
              } else {
                throw new CloudStorageError('Unknown error', CloudStorageErrorCode.UNKNOWN, error);
              }
            }
          };
        }
        return originalFunction;
      },
    })
  : null;

export default function createRNCloudStorage(): NativeRNCloudStorage {
  if (Platform.OS === 'ios') {
    return (
      nativeIosInstance ??
      new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        }
      )
    );
  }

  return new GoogleDrive();
}
