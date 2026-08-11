import { NativeCloudStorageErrorCode } from '../types/native';
import CloudStorageError from './cloud-storage-error';
import { KV_LIMITS } from './constants';

export const getUTF8ByteLength = (value: string): number => new TextEncoder().encode(value).byteLength;

export const assertValidKVKey = (key: string): void => {
  if (!key || getUTF8ByteLength(key) > KV_LIMITS.maxKeyBytes) {
    throw new CloudStorageError(`Invalid key: ${key}`, NativeCloudStorageErrorCode.KV_INVALID_KEY);
  }
};

export const getKVItemsByteLength = (items: Record<string, string>): number =>
  Object.entries(items).reduce((total, [key, value]) => total + getUTF8ByteLength(key) + getUTF8ByteLength(value), 0);
