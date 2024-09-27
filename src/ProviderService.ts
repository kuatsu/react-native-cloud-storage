import { Platform } from 'react-native';
import {
  type DeepRequired,
  CloudStorageProvider,
  type CloudStorageProviderOptions,
  CloudStorageScope,
} from './types/main';
import { isProviderSupported } from './utils/helpers';
import { cloudStorageEventEmitter } from './utils/CloudStorageEventEmitter';
import createNativeCloudStorage from './createRNCloudStorage';

let currentProvider = Platform.select({
  ios: CloudStorageProvider.ICloud,
  default: CloudStorageProvider.GoogleDrive,
});
let currentProviderOptions: DeepRequired<CloudStorageProviderOptions> = {
  [CloudStorageProvider.ICloud]: {
    scope: CloudStorageScope.AppData,
  },
  [CloudStorageProvider.GoogleDrive]: {
    scope: CloudStorageScope.AppData,
    accessToken: null,
    strictFilenames: false,
    timeout: 3000,
  },
};

export const providerService = {
  getSupportedProviders: () => Object.values(CloudStorageProvider).filter(isProviderSupported),
  getProvider: () => currentProvider,
  setProvider: (newProvider: CloudStorageProvider) => {
    if (!isProviderSupported(newProvider)) {
      throw new Error(`CloudStorage Provider ${newProvider} is not supported on this platform`);
    }

    // Emit an event to notify useIsCloudAvailable() hook consumers of the new cloud availability status
    if (newProvider === CloudStorageProvider.ICloud) {
      const nativeInstance = createNativeCloudStorage(newProvider);
      cloudStorageEventEmitter.emit('RNCloudStorage.cloud.availability-changed', {
        available: nativeInstance.isCloudAvailable(),
      });
    } else if (newProvider === CloudStorageProvider.GoogleDrive) {
      cloudStorageEventEmitter.emit('RNCloudStorage.cloud.availability-changed', {
        available: (
          currentProviderOptions[CloudStorageProvider.GoogleDrive] as Required<
            CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]
          >
        ).accessToken?.length,
      });
    }

    currentProvider = newProvider;
  },
  getProviderOptions: <T extends CloudStorageProvider>(provider: T): DeepRequired<CloudStorageProviderOptions>[T] => {
    return currentProviderOptions[provider];
  },
  setProviderOptions: <T extends CloudStorageProvider>(provider: T, options: CloudStorageProviderOptions[T]) => {
    const newOptions = Object.fromEntries(Object.entries(options).filter(([_, v]) => v !== undefined));
    currentProviderOptions[provider] = {
      ...currentProviderOptions[provider],
      ...newOptions,
    };

    if (provider === CloudStorageProvider.GoogleDrive && 'accessToken' in newOptions) {
      // Emit an event to notify useIsCloudAvailable() hook consumers of the new cloud availability status
      cloudStorageEventEmitter.emit('RNCloudStorage.cloud.availability-changed', {
        available: (newOptions as Required<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]>).accessToken
          ?.length,
      });
    }
  },
};
