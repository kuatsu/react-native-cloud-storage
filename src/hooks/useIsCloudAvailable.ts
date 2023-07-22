import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import RNCloudStorage from '../RNCloudStorage';

// TODO: there must be a better way to do this without a timeout?
export const useIsCloudAvailable = (iCloudTimeout = 10) => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      const newIsAvailable = await RNCloudStorage.isCloudAvailable();
      setIsAvailable(newIsAvailable);
      if (Platform.OS === 'ios' && newIsAvailable) {
        clearInterval(interval);
      }
    }, 500);

    if (Platform.OS === 'ios') {
      setTimeout(() => {
        clearInterval(interval);
      }, iCloudTimeout * 1000);
    }

    return () => clearInterval(interval);
  }, [iCloudTimeout]);

  return isAvailable;
};
