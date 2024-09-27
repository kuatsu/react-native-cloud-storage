import { useEffect, useState } from 'react';
import RNCloudStorage from '../RNCloudStorage';
import { cloudStorageEventEmitter } from '../utils/CloudStorageEventEmitter';

/**
 * A hook that tests whether or not the cloud storage is available.
 * @param cloudStorageInstance - An optional instance of RNCloudStorage to use instead of the default instance.
 * @returns A boolean indicating whether or not the cloud storage is available.
 */
export const useIsCloudAvailable = (cloudStorageInstance?: RNCloudStorage) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const instance = cloudStorageInstance ?? RNCloudStorage;

  useEffect(() => {
    // Set the initial availability state
    instance.isCloudAvailable().then(setIsAvailable);

    // Listen for changes to the cloud availability using the native event emitter
    cloudStorageEventEmitter.addListener(
      'RNCloudStorage.cloud.availability-changed',
      (event: { available: boolean }) => {
        setIsAvailable(event.available);
      }
    );

    return () => {
      cloudStorageEventEmitter.removeAllListeners('RNCloudStorage.cloud.availability-changed');
    };
  }, [instance]);

  return isAvailable;
};
