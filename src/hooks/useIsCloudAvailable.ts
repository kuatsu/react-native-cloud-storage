import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform, DeviceEventEmitter } from 'react-native';
import RNCloudStorage from '../RNCloudStorage';

/**
 * A hook that tests whether or not the cloud storage is available.
 * @param _iCloudTimeout DEPRECATED: This parameter is deprecated and has no effect. It will be removed in a future version.
 * @returns A boolean indicating whether or not the cloud storage is available.
 */
export const useIsCloudAvailable = (_iCloudTimeout?: number) => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Set the initial availability state
    RNCloudStorage.isCloudAvailable().then(setIsAvailable);

    // Listen for changes to the cloud availability using the native event emitter
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
