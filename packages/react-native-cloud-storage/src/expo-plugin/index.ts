import type { RNCloudStorageConfigPluginOptions } from './types';
import withRNCloudStorageIos from './ios';
import type { ConfigPlugin } from '@expo/config-plugins';

// Android config plugin not needed as there's no native code to configure.

const withRNCloudStorage: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) =>
  withRNCloudStorageIos(config, options);

export default withRNCloudStorage;
