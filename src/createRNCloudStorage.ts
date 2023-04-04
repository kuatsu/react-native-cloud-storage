import { NativeModules, Platform } from 'react-native';
import type NativeRNCloudStorage from './types/native';
import GoogleDriveApiClient from './google-drive';

const LINKING_ERROR =
  `The package 'react-native-cloud-storage' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export default function createRNCloudStorage(): NativeRNCloudStorage {
  if (Platform.OS === 'ios') {
    return (
      (NativeModules.CloudStorage as NativeRNCloudStorage) ??
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

  if (Platform.OS === 'android') {
    return new GoogleDriveApiClient();
  }

  throw new Error('Unsupported platform');
}
