import { CloudStorageProvider } from '../types/main';
import { Platform } from 'react-native';

export const isProviderSupported = (provider: CloudStorageProvider): boolean => {
  if (Platform.OS !== 'ios' && provider === CloudStorageProvider.ICloud) {
    return false;
  }

  return true;
};
