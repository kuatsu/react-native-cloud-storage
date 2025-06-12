---
sidebar_position: 1
---

# Using multiple Cloud Storage Providers

By default, the [`CloudStorage`](../api/CloudStorage) API will use a default storage provider based on the platform (CloudKit for iOS, Google Drive for all other platforms).

If you want to use _one specific provider_ in your app for all platforms, you can override the default provider used by the static default instance by calling [`CloudStorage.setProvider()`](../api/CloudStorage#setproviderprovider) statically.

If you want to use _multiple providers_ in your app, you can get a new instance of the `CloudStorage` API and specify a provider in the constructor. This can be useful if you want to provide multiple cloud backup options to the user at the same time, allowing him to backup his files to iCloud and Google Drive simultaneously.

## Example

```ts
import { CloudStorageProvider, CloudStorageScope, CloudStorage } from 'react-native-cloud-storage';

// WARNING: This will throw an error if the iCloud provider is not available on the platform (i.e. not on iOS)
const iCloudStorage = new CloudStorage(CloudStorageProvider.ICloud);

// You can pass provider options directly in the constructor, or use `googleDriveStorage.setProviderOptions()`
const googleDriveStorage = new CloudStorage(CloudStorageProvider.GoogleDrive, { accessToken: 'some_access_token' });

// Then, use the provider-specific instances
const handleSaveFileToICloud = async () => {
  await iCloudStorage.writeFile('/test.txt', 'Hello, iCloud!');
};

const handleSaveFileToGoogleDrive = async () => {
  await googleDriveStorage.writeFile('/test.txt', 'Hello, Google Drive!');
};
```
