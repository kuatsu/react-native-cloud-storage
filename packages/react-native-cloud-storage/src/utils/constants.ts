import { Platform } from 'react-native';
import { CloudStorageProvider, CloudStorageProviderOptions, CloudStorageScope, DeepRequired } from '../types/main';

export const LINKING_ERROR =
  `The package 'react-native-cloud-storage' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export const DEFAULT_PROVIDER_OPTIONS: DeepRequired<CloudStorageProviderOptions> = {
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
