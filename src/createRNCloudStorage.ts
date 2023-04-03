import { NativeModules, Platform } from 'react-native';
import type NativeRNCloudStorage from './types/native';

const LINKING_ERROR =
  `The package 'react-native-cloud-storage' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export default function createRNCloudStorage(): NativeRNCloudStorage {
  const CloudStorage =
    (NativeModules.CloudStorage as NativeRNCloudStorage) ??
    new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

  if (Platform.OS !== 'ios') {
    return new Proxy(
      {},
      {
        get() {
          throw new Error("'react-native-cloud-storage' only supports iOS at the moment.");
        },
      }
    ) as NativeRNCloudStorage;
  }

  return CloudStorage;
}
