---
sidebar_position: 1
---

# CloudStorageProvider

The `CloudStorageProvider` defines which cloud storage is used. Currently, only iCloud and Google Drive are supported.

By default, the provider is set based on the device's platform. On iOS, iCloud is used, while on all other platforms, Google Drive is used. This can be overriden by calling [`setProvider()`](../CloudStorage#setproviderprovider). You can therefore optionally use Google Drive on iOS, too, instead of iCloud.

```ts
import { CloudStorageScope } from 'react-native-cloud-storage';
```

## Definition

```ts
enum CloudStorageProvider {
  ICloud = 'icloud',
  GoogleDrive = 'googledrive',
}
```

When using pure JavaScript, simply use the corresponding values:

```js
CloudStorage.setProvider('googledrive');
```

## Provider options

The provider options can be set via [`setProviderOptions()`](../CloudStorage#setprovideroptionsoptions). The following options are available:

### `CloudStorageProvider.ICloud`

- `scope` (`CloudStorageScope`): The directory scope to use. Default: `CloudStorageScope.AppData`.

### `CloudStorageProvider.GoogleDrive`

- `accessToken` (`string`): The access token to use. Required.
- `scope` (`CloudStorageScope`): The directory scope to use. Default: `CloudStorageScope.AppData`.
- `strictFilenames` (`boolean`): If set to `true`, the library will check for files with duplicate filenames and throw an error if found. File operations will not be carried out in that case. For more information, [see here](../../guides/google-drive-files-same-name). Default: `false`.
- `timeout` (`number`): The timeout in milliseconds for requests. Default: 3000.
