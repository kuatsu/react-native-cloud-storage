import withRNCloudStorageIos from './withRNCloudStorageIos';
import type { ConfigPlugin } from '@expo/config-plugins';

interface RNCloudStorageConfigPluginOptions {
  /**
   * The iCloud container environment to use. Defaults to 'Production'.
   */
  iCloudContainerEnvironment?: 'Production' | 'Development';
}
const withRNCloudStorage: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) => {
  return withRNCloudStorageIos(config, options?.iCloudContainerEnvironment ?? 'Production');
  // TODO: Add Android support
};

export default withRNCloudStorage;
