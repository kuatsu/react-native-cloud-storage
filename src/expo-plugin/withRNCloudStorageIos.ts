import { withEntitlementsPlist, withInfoPlist, withPlugins, type ConfigPlugin } from '@expo/config-plugins';
import type { RNCloudStorageConfigPluginOptions } from './types';

const withRNCloudStorageInfoPlist: ConfigPlugin = (config) =>
  withInfoPlist(config, async (newConfig) => {
    if (!config.ios?.bundleIdentifier) {
      throw new Error('Missing iOS bundle identifier');
    }
    const infoPlist = newConfig.modResults;
    infoPlist.NSUbiquitousContainers = {
      [`iCloud.${config.ios.bundleIdentifier}`]: {
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
    entitlementsPlist['com.apple.developer.icloud-container-identifiers'] = [`iCloud.${config.ios.bundleIdentifier}`];
    entitlementsPlist['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    entitlementsPlist['com.apple.developer.icloud-container-environment'] =
      options?.iCloudContainerEnvironment ?? 'Production';
    entitlementsPlist['com.apple.developer.ubiquity-container-identifiers'] = [`iCloud.${config.ios.bundleIdentifier}`];
    entitlementsPlist[
      'com.apple.developer.ubiquity-kvstore-identifier'
    ] = `$(TeamIdentifierPrefix)${config.ios.bundleIdentifier}`;

    return newConfig;
  });

const withRNCloudStorageIos: ConfigPlugin<RNCloudStorageConfigPluginOptions> = (config, options) =>
  withPlugins(config, [withRNCloudStorageInfoPlist, [withRNCloudStorageEntitlementsPlist, options]]);

export default withRNCloudStorageIos;
