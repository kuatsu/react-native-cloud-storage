import { withEntitlementsPlist, withInfoPlist, withPlugins, type ConfigPlugin } from '@expo/config-plugins';
import { type ExpoConfig } from '@expo/config-types';
import type { RNCloudStorageConfigPluginOptions } from './types';

const getICloudContainerIdentifier = (config: ExpoConfig, options: RNCloudStorageConfigPluginOptions) => {
  if (options?.iCloudContainerIdentifier) return options.iCloudContainerIdentifier;

  if (!config?.ios?.bundleIdentifier) throw new Error('Missing iOS bundle identifier');
  return `iCloud.${config.ios.bundleIdentifier}`;
};

const withRNCloudStorageInfoPlist: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) =>
  withInfoPlist(config, async (newConfig) => {
    const infoPlist = newConfig.modResults;
    infoPlist.NSUbiquitousContainers = {
      [getICloudContainerIdentifier(config, options)]: {
        NSUbiquitousContainerIsDocumentScopePublic: true,
        NSUbiquitousContainerSupportedFolderLevels: 'Any',
        NSUbiquitousContainerName: config.slug,
      },
    };

    return newConfig;
  });

const withRNCloudStorageEntitlementsPlist: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) =>
  withEntitlementsPlist(config, async (newConfig) => {
    if (!config.ios?.bundleIdentifier) {
      throw new Error('Missing iOS bundle identifier');
    }
    const entitlementsPlist = newConfig.modResults;
    entitlementsPlist['com.apple.developer.icloud-container-identifiers'] = [
      getICloudContainerIdentifier(config, options),
    ];
    entitlementsPlist['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    entitlementsPlist['com.apple.developer.icloud-container-environment'] =
      options?.iCloudContainerEnvironment ?? 'Production';
    entitlementsPlist['com.apple.developer.ubiquity-container-identifiers'] = [
      getICloudContainerIdentifier(config, options),
    ];

    return newConfig;
  });

const withRNCloudStorageIos: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) =>
  withPlugins(config, [
    [withRNCloudStorageInfoPlist, options],
    [withRNCloudStorageEntitlementsPlist, options],
  ]);

export default withRNCloudStorageIos;
