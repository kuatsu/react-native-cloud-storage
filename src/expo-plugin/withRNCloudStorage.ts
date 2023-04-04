import withRNCloudStorageIos from './withRNCloudStorageIos';
import type { ConfigPlugin } from '@expo/config-plugins';

// Android config plugin not needed as there's no native code to configure.

interface RNCloudStorageConfigPluginOptions {
  /**
   * The iCloud container environment to use. Defaults to 'Production'.
   */
  iCloudContainerEnvironment?: 'Production' | 'Development';
}
const withRNCloudStorage: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) =>
  withRNCloudStorageIos(config, options?.iCloudContainerEnvironment ?? 'Production');

export default withRNCloudStorage;
