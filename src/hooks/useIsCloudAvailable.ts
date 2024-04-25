import { useEffect, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform, DeviceEventEmitter } from 'react-native';

/**
 * A hook that tests whether or not the cloud storage is available.
 * @returns A boolean indicating whether or not the cloud storage is available.
 */
export const useIsCloudAvailable = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
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

  return isAvailable;
};
