import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import RNCloudStorage from '../RNCloudStorage';

// TODO: there must be a better way to do this without a timeout?
export const useIsCloudAvailable = (timeout = 10) => {
  const [isCloudAvailable, setIsCloudAvailable] = useState(Platform.OS !== 'ios');
  const [firstCheck] = useState(new Date());

  useEffect(() => {
    const checkCloudAvailability = async () => {
      const isAvailable = await RNCloudStorage.isCloudAvailable();
      if (isAvailable) {
        setIsCloudAvailable(true);
      } else if (new Date().getTime() - firstCheck.getTime() < timeout * 1000) {
        setTimeout(checkCloudAvailability, 500);
      } else {
        console.log('Cloud storage is not available.');
      }
    };
    checkCloudAvailability();
  }, [firstCheck, timeout]);

  return isCloudAvailable;
};
