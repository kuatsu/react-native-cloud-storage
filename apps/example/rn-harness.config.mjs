import { androidEmulator, androidPlatform } from '@react-native-harness/platform-android';
import { applePlatform, appleSimulator } from '@react-native-harness/platform-apple';

export default {
  entryPoint: './index.ts',
  appRegistryComponentName: 'main',
  testTimeout: 30_000,
  runners: [
    androidPlatform({
      name: 'android',
      device: androidEmulator('CloudStorage_API_35', {
        apiLevel: 35,
        profile: 'pixel_8',
        diskSize: '6G',
        heapSize: '1G',
      }),
      bundleId: 'de.kuatsu.reactnativecloudstorageexample',
    }),
    applePlatform({
      name: 'ios',
      device: appleSimulator('iPhone 17 Pro', process.env.HARNESS_IOS_VERSION ?? '26.2'),
      bundleId: 'de.kuatsu.react-native-cloud-storage-example',
    }),
  ],
};
