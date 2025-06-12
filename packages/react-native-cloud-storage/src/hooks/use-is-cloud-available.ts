import { useCallback, useEffect, useState } from 'react';
import RNCloudStorage from '../cloud-storage';

/**
 * A hook that tests whether or not the cloud storage is available.
 * @param cloudStorageInstance - An optional instance of RNCloudStorage to use instead of the default instance.
 * @returns A boolean indicating whether or not the cloud storage is available.
 */
export const useIsCloudAvailable = (cloudStorageInstance?: RNCloudStorage) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const instance = cloudStorageInstance ?? RNCloudStorage.getDefaultInstance();

  const handleAvailabilityChange = useCallback((available: boolean) => {
    setIsAvailable(available);
  }, []);

  useEffect(() => {
    // Set the initial availability state
    instance.isCloudAvailable().then(setIsAvailable);

    // Listen for changes to the cloud availability using the native event emitter
    instance.subscribeToCloudAvailability(handleAvailabilityChange);

    return () => {
      instance.unsubscribeFromCloudAvailability(handleAvailabilityChange);
    };
  }, [instance, handleAvailabilityChange]);

  return isAvailable;
};
