---
sidebar_position: 1
---

# CloudStorage

The `CloudStorage` provides the core functionality of the library. File operations loosely follow the conventions of Node's `fs`.

```ts
import { CloudStorage } from 'react-native-cloud-storage';
```

## Definitions

### `path`

When a method takes a `path` parameter, you should provide a full path with a leading slash, but no trailing slashes:

- ❌ `some/file.txt`
- ❌ `file:///some/file.txt`
- ❌ `/some/directory/`
- ✅ `/some/file.txt`
- ✅ `/some/directory`

:::caution

When creating files or directories, always make sure that all directories in the tree already exist. Otherwise the library will throw a [`CloudStorageErrorCode.DIRECTORY_NOT_FOUND`](./enums/CloudStorageErrorCode).

:::

## Configuration methods

### `getProvider()`

Gets the cloud storage provider currently in use.

**Returns**: The currently used [`CloudStorageProvider`](./enums/CloudStorageProvider).

### `getProviderOptions(provider)`

Gets the currently set options of the given provider.

**Parameters**:

- `provider` ([`CloudStorageProvider`](./enums/CloudStorageProvider)): Required. The provider to get the options of.

**Returns**: The options of the given provider.

### `setProvider(provider)`

Sets the cloud storage provider to use.

:::tip

Use `Platform.select` to set the provider based on the platform:

```ts
import { Platform } from 'react-native';
import { CloudStorage, CloudStorageProvider } from 'react-native-cloud-storage';

CloudStorage.setProvider(
  Platform.select({
    ios: CloudStorageProvider.ICloud,
    default: CloudStorageProvider.GoogleDrive,
  })
);
```

:::

**Parameters**:

- `provider` ([`CloudStorageProvider`](./enums/CloudStorageProvider)): Required. The provider to set.

**Returns**: `void`.

### `setProviderOptions(provider, options)`

Sets the options of the given provider. For a list of available options per provider, [see here](./enums/CloudStorageProvider#provider-options).

**Parameters**:

- `provider` ([`CloudStorageProvider`](./enums/CloudStorageProvider)): Required. The provider to set the options of.
- `options` (`object`): Required. The options to set.

**Returns**: `void`.

## Cloud operations

### `appendFile(path, data, scope)`

Appends the data to the file at the given path. Creates the file if it doesn't exist yet.

**Parameters**:

- `path` (`string`): Required. The path including the filename to append data to.
- `content` (`string`): Required. The content to append.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to `void` once the data has been appended.

### `downloadFile(path, scope)`

When a file has been uploaded to iCloud, it is not immediately synced across devices. In this case, those files will have an `.icloud` extension, so trying to read them will fail. This method will download the file from iCloud so you can safely process it afterwards. If it has already been downloaded, this will not do anything and immediately return. Does not have any effect on Google Drive.

**Parameters**:

- `path` (`string`): Required. The path including the filename to download.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to `void` once the download has been triggered.

### `exists(path, scope)`

Tests whether or not the file or directory at the given path exists.

**Parameters**:

- `path` (`string`): Required. The path to test.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to a `boolean`. `true` if a file or directory exists at the given path, `false` otherwise.

### `isCloudAvailable()`

Tests whether or not the cloud storage is available.
When using iCloud, this actually verifies with the system whether or not iCloud is available. This might not be the case right at app launch or when the user is not logged into iCloud.
For Google Drive, this simply checks whether or not an access token has been set using [setGoogleDriveAccessToken](#setgoogledriveaccesstokenaccesstoken).

**Returns**: A `Promise` that resolves to a `boolean`. `true` if the cloud storage is available, `false` otherwise.

### `mkdir(path, scope)`

Creates a new directory at the given path.

**Parameters**:

- `path` (`string`): Required. The path of the new directory to create. All parent directories must already exist.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves once the directory has been created.

### `readdir(path, scope)`

Reads the files and directories contained in the directory at the given path. Does not include `.` and `..` entries.

**Parameters**:

- `path` (`string`): Required. The full pathname of the directory to read.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to an array of `string`s containing the names of the files and directories in the given directory.

### `readFile(path, scope)`

Reads the file at the given path into a `string`.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to read.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to a `string` containing the file's content.

### `rmdir(path, options, scope)`

Deletes the directory at the given path. Can optionally delete the directory including all its contents (recursively).

**Parameters**:

- `path` (`string`): Required. The full pathname of the directory to delete.
- `options` (`{ recursive?: boolean }`): Optional. An object containing the `recursive` property which, if set to `true`, will delete the directory including all its contents (recursively). If set to `false` (or omitted), the library will throw a [`CloudStorageErrorCode.DIRECTORY_NOT_EMPTY`](./enums/CloudStorageErrorCode) if the directory is not empty. Defaults to `{ recursive: false }`.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves once the directory has been deleted.

### `stat(path, scope)`

Gets several file statistics of the file at the given path.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to stat.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to [`CloudStorageFileStat`](./interfaces/CloudStorageFileStat) object containing the statistics.

### `unlink(path, scope)`

Deletes the file at the given path.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to delete.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to `void` once the file has been deleted.

### `writeFile(path, data, scope)`

Writes the data to the given path. Creates the file if it doesn't exist yet and overwrites it otherwise.

**Parameters**:

- `path` (`string`): Required. The path including the filename to write to.
- `content` (`string`): Required. The content to write.
- `scope` ([`CloudStorageScope`](./enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](./enums/CloudStorageScope), unless the default scope has been changed via [`setProviderOptions()`](#setprovideroptionsprovider-options).

**Returns**: A `Promise` that resolves to `void` once the file has been written.
