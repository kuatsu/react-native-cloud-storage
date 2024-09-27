import { useEffect, useState } from 'react';
import RNCloudStorage from '../RNCloudStorage';
import { cloudStorageEventEmitter } from '../utils/CloudStorageEventEmitter';

/**
 * A hook that tests whether or not the cloud storage is available.
 * @returns A boolean indicating whether or not the cloud storage is available.
 */
export const useIsCloudAvailable = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Set the initial availability state
    RNCloudStorage.isCloudAvailable().then(setIsAvailable);

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
  }, []);

  return isAvailable;
};
