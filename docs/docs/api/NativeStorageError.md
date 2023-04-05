---
sidebar_position: 4
---

# NativeStorageError

`NativeStorageError` is a custom error class which wraps most of the errors produced by the library.

```ts
import { NativeStorageError } from 'react-native-cloud-storage';
```

## API

The class provides three properties:

- `message` (`string`): The error message.
- `code` ([`NativeStorageErrorCode`](./enums/NativeStorageErrorCode)): The error code which can be used to determine the type of the error.
- `details` (`any`): Optionally, any details like raw errors.

## Example

```ts
import RNCloudStorage, { NativeStorageError, NativeStorageErrorCode } from 'react-native-cloud-storage';

try {
  await RNCloudStorage.stat('test.txt');
} catch (e: unknown) {
  if (e instanceof NativeStorageError && e.code === NativeStorageErrorCode.FILE_NOT_FOUND) {
    console.log('File not found');
  } else {
    console.warn(e);
  }
}
```
