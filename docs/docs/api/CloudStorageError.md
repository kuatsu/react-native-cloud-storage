---
sidebar_position: 2
---

# CloudStorageError

`CloudStorageError` is a custom error class which wraps most of the errors produced by the library.

```ts
import { CloudStorageError } from 'react-native-cloud-storage';
```

## API

The class provides three properties:

- `message` (`string`): The error message.
- `code` ([`CloudStorageErrorCode`](./enums/CloudStorageErrorCode)): The error code which can be used to determine the type of the error.
- `details` (`any`): Optionally, any details like raw errors.

## Example

```ts
import RNCloudStorage, { CloudStorageError, CloudStorageErrorCode } from 'react-native-cloud-storage';

try {
  await RNCloudStorage.stat('test.txt');
} catch (e: unknown) {
  if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
    console.log('File not found');
  } else {
    console.warn(e);
  }
}
```
