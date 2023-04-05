---
sidebar_position: 1
---

# RNCloudStorage

The `RNCloudStorage` is the default export of the library and provides the core functionality. File operations loosely follow the conventions of Node's `fs`.

```ts
import RNCloudStorage from { react-native-cloud-storage };
```

## Methods

### `exists(path, scope)`

Tests whether or not the file at the given path exists.

**Parameters**:

- `path` (`string`): Required. The path to test.
- `scope` ([`StorageScope`](./enums/StorageScope)): Required. The storage scope (documents/app data) to use.

**Returns**: A `Promise` that resolves to a `boolean`. `true` if the file exists, `false` otherwise.

### `googleDriveAccessToken`

A `string` value corresponding to the currently set Google Drive access token (see [`setGoogleDriveAccessToken()`](#setgoogledriveaccesstokenaccesstoken)).

### `isCloudAvailable()`

Tests whether or not the cloud storage is available.
On iOS, this actually verifies with the system whether or not iCloud is available. This might not be the case right at app launch or when the user is not logged into iCloud.
On Android, this simply checks whether or not a Google Drive API access token has been set using [setGoogleDriveAccessToken](#setgoogledriveaccesstokenaccesstoken).

**Returns**: A `Promise` that resolves to a `boolean`. `true` if the cloud storage is available, `false` otherwise.

### `readFile(path, scope)`

Reads the file at the given path into a `string`.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to read.
- `scope` ([`StorageScope`](./enums/StorageScope)): Required. The storage scope (documents/app data) to use.

**Returns**: A `Promise` that resolves to a `string` containing the file's content.

### `setGoogleDriveAccessToken(accessToken)`

Provide a valid Google Drive access token to the library which in order to make calls to the Google Drive API.

The access token is stored statically and therefore only needs to be provided once (until the token expires!) but is available throughout the whole project.

**Parameters**:

- `accessToken` (`string`): Required. The access token to use.

**Returns**: `void`

### `stat(path, scope)`

Gets several file statistics of the file at the given path.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to stat.
- `scope` ([`StorageScope`](./enums/StorageScope)): Required. The storage scope (documents/app data) to use.

**Returns**: A `Promise` that resolves to [`StorageFileStat`](./interfaces/StorageFileStat) object containing the statistics.

### `unlink(path, scope)`

Deletes the file at the given path.

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to delete.
- `scope` ([`StorageScope`](./enums/StorageScope)): Required. The storage scope (documents/app data) to use.

**Returns**: A `Promise` that resolves to `void` once the file has been deleted.

### `writeFile(path, data, scope)`

Writes the data to the given path. Creates the file if it doesn't exist yet and overwrites it otherwise.

**Parameters**:

- `path` (`string`): Required. The path including the filename to write to.
- `content` (`string`): Required. The content to write.
- `scope` ([`StorageScope`](./enums/StorageScope)): Required. The storage scope (documents/app data) to use.

**Returns**: A `Promise` that resolves to `void` once the file has been written.
