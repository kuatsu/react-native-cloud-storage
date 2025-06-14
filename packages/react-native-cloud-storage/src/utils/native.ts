import { NativeCloudStorageErrorCode } from '../types/native';
import CloudStorageError from './cloud-storage-error';

/**
 * Creates a proxied native module that wraps thrown errors in a CloudStorageError.
 * @param nativeModule The native module to proxy.
 * @returns The proxied native module.
 */
export const createProxiedNativeModule = <T extends object>(nativeModule: T | undefined): T | null => {
  if (!nativeModule) return null;

  return new Proxy(nativeModule, {
    get(target: T, property: string | symbol, receiver: unknown) {
      const originalValue = Reflect.get(target, property, receiver);

      if (typeof originalValue === 'function') {
        return async (...arguments_: unknown[]) => {
          try {
            return await Reflect.apply(originalValue, target, arguments_);
          } catch (error: unknown) {
            const error_ =
              typeof error === 'object' &&
              error !== null &&
              'code' in error &&
              typeof error.code === 'string' &&
              Object.values(NativeCloudStorageErrorCode).includes(error.code as NativeCloudStorageErrorCode)
                ? new CloudStorageError(
                    'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error',
                    error.code as NativeCloudStorageErrorCode
                  )
                : new CloudStorageError('Unknown error', NativeCloudStorageErrorCode.UNKNOWN, error);
            throw error_;
          }
        };
      }

      return originalValue;
    },
  });
};
