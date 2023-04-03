import { withEntitlementsPlist, withInfoPlist, withPlugins } from '@expo/config-plugins';
import type { ExpoConfig } from 'expo/config';

const withRNCloudStorageInfoPlist = (config: ExpoConfig) =>
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

const withRNCloudStorageEntitlementsPlist = (
  config: ExpoConfig,
  iCloudContainerEnvironment: 'Production' | 'Development'
) =>
  withEntitlementsPlist(config, async (newConfig) => {
    if (!config.ios?.bundleIdentifier) {
      throw new Error('Missing iOS bundle identifier');
    }
    const entitlementsPlist = newConfig.modResults;
    entitlementsPlist['com.apple.developer.icloud-container-identifiers'] = [`iCloud.${config.ios.bundleIdentifier}`];
    entitlementsPlist['com.apple.developer.icloud-services'] = ['CloudDocuments'];
    entitlementsPlist['com.apple.developer.icloud-container-environment'] = iCloudContainerEnvironment;
    entitlementsPlist['com.apple.developer.ubiquity-container-identifiers'] = [`iCloud.${config.ios.bundleIdentifier}`];
    entitlementsPlist[
      'com.apple.developer.ubiquity-kvstore-identifier'
    ] = `$(TeamIdentifierPrefix)${config.ios.bundleIdentifier}`;

    return newConfig;
  });

const withRNCloudStorageIos = (config: ExpoConfig, iCloudContainerEnvironment: 'Production' | 'Development') =>
  withPlugins(config, [withRNCloudStorageInfoPlist, [withRNCloudStorageEntitlementsPlist, iCloudContainerEnvironment]]);

export default withRNCloudStorageIos;
