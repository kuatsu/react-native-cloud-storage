import { Platform, DeviceEventEmitter } from 'react-native';
import {
  type DeepRequired,
  CloudStorageProvider,
  type CloudStorageProviderOptions,
  CloudStorageScope,
} from './types/main';
import { isProviderSupported } from './utils/helpers';

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
      DeviceEventEmitter.emit('RNCloudStorage.cloud.availability-changed', {
        available: (newOptions as Required<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]>).accessToken
          ?.length,
      });
    }
  },
};
