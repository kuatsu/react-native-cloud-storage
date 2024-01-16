import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform, DeviceEventEmitter } from 'react-native';

/**
 * A hook that tests whether or not the cloud storage is available.
 * @param _iCloudTimeout DEPRECATED: This parameter is deprecated and has no effect. It will be removed in a future version.
 * @returns A boolean indicating whether or not the cloud storage is available.
 */
export const useIsCloudAvailable = (_iCloudTimeout?: number) => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // On iOS, a native event is emitted when the iCloud availability changes. On Android, we just assume it's always
    // available, since it's just using the Google Drive API.
    let eventEmitter: NativeEventEmitter | typeof DeviceEventEmitter;
    if (Platform.OS === 'ios') {
      eventEmitter = new NativeEventEmitter(NativeModules.CloudStorageEventEmitter);
    } else {
      eventEmitter = DeviceEventEmitter;
    }

    eventEmitter.addListener('RNCloudStorage.cloud.availability-changed', (event: { available: boolean }) => {
      setIsAvailable(event.available);
    });

    return () => {
      eventEmitter.removeAllListeners('RNCloudStorage.cloud.availability-changed');
    };
  }, []);

  useEffect(() => {
    if (_iCloudTimeout !== undefined) {
      console.warn(
        'The iCloudTimeout parameter for useIsCloudFile is deprecated and has no effect. It will be removed in a future version. Please remove it from your code.'
      );
    }
  }, [_iCloudTimeout]);

  return isAvailable;
};
