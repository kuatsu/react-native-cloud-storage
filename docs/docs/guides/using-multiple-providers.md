---
sidebar_position: 1
---

# Using multiple Cloud Storage Providers

By default, the [`CloudStorage`](../api/CloudStorage) API will use the provider set via [`setProvider()`](../api/CloudStorage#setproviderprovider) (or the default provider based on the platform).

If you want to use multiple providers in your app, you can however get a new instance of the `CloudStorage` API which uses a specific provider. For example, this can be useful if you want to provide multiple cloud backup options to the user at the same time, allowing him to backup his files to iCloud and Google Drive simultaneously.

Those new instances only contain the [cloud operation methods](../api/CloudStorage#cloud-operations) and do not contain the configuration methods such as [`setProviderOptions()`](../api/CloudStorage#setprovideroptionsprovider-options). The provider-specific configuration must be done via the main `CloudStorage` instance.

## Example

```ts
import { CloudStorageProvider, CloudStorageScope, CloudStorage } from 'react-native-cloud-storage';

const iCloudStorage = CloudStorage.getProviderInstance(CloudStorageProvider.ICloud);
const googleDriveStorage = CloudStorage.getProviderInstance(CloudStorageProvider.GoogleDrive);

// Configuration methods are still only available on the main CloudStorage instance – set provider-specific options there, they are shared across all instances
CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { accessToken: 'some_access_token' });

// Then, use the provider-specific instances
const handleSaveFileToICloud = async () => {
  await iCloudStorage.writeFile('/test.txt', 'Hello, iCloud!');
};

const handleSaveFileToGoogleDrive = async () => {
  await googleDriveStorage.writeFile('/test.txt', 'Hello, Google Drive!');
};
```
