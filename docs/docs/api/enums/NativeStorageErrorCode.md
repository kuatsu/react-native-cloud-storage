---
sidebar_position: 2
---

# NativeStorageErrorCode

`NativeStorageErrorCode` is a TypeScript enum containing the possible error codes of a [`NativeStorageError`](../NativeStorageError).

```ts
import { NativeStorageErrorCode } from 'react-native-cloud-storage';
```

## Definition

```ts
enum NativeStorageErrorCode {
  FILE_NOT_FOUND = 'ERR_FILE_NOT_FOUND',
  DIRECTORY_NOT_FOUND = 'ERR_NO_DIRECTORY_FOUND',
  FILE_ALREADY_EXISTS = 'ERR_FILE_EXISTS',
  WRITE_ERROR = 'ERR_WRITE_ERROR',
  READ_ERROR = 'ERR_READ_ERROR',
  DELETE_ERROR = 'ERR_DELETE_ERROR',
  STAT_ERROR = 'ERR_STAT_ERROR',
  UNKNOWN = 'ERR_UNKNOWN',
}
```

When using pure JavaScript, simply use the appropriate values:

```js
if (e.instanceof NativeStorageError && e.code === 'FILE_NOT_FOUND') {
  /* do something */
}
```
