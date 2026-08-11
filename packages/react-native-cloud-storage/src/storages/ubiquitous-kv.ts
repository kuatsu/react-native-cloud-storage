import NativeCloudStorageKVStoreIOS, { type Spec } from '../specs/NativeCloudStorageKVStoreIOS';
import type { NativeKVStorage } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';

export const NativeKVStoreModule = NativeCloudStorageKVStoreIOS;
export const NativeUbiquitousKV = createProxiedNativeModule<NativeKVStorage>(
  NativeCloudStorageKVStoreIOS as unknown as NativeKVStorage | null
);
export type { Spec as NativeKVStoreTurboModule };
