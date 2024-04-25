---
sidebar_position: 3
---

# CloudStorageErrorCode

`CloudStorageErrorCode` is a TypeScript enum containing the possible error codes of a [`CloudStorageError`](../CloudStorageError).

```ts
import { CloudStorageErrorCode } from 'react-native-cloud-storage';
```

## Definition

```ts
enum CloudStorageErrorCode {
  FILE_NOT_FOUND = 'ERR_FILE_NOT_FOUND',
  PATH_IS_DIRECTORY = 'ERR_PATH_IS_DIRECTORY',
  PATH_IS_FILE = 'ERR_PATH_IS_FILE',
  DIRECTORY_NOT_FOUND = 'ERR_DIRECTORY_NOT_FOUND',
  DIRECTORY_NOT_EMPTY = 'ERR_DIRECTORY_NOT_EMPTY',
  FILE_ALREADY_EXISTS = 'ERR_FILE_EXISTS', // also used when a directory already exists
  MULTIPLE_FILES_SAME_NAME = 'ERR_MULTIPLE_FILES_SAME_NAME',
  AUTHENTICATION_FAILED = 'ERR_AUTHENTICATION_FAILED',
  WRITE_ERROR = 'ERR_WRITE_ERROR',
  READ_ERROR = 'ERR_READ_ERROR',
  DELETE_ERROR = 'ERR_DELETE_ERROR',
  STAT_ERROR = 'ERR_STAT_ERROR',
  UNKNOWN = 'ERR_UNKNOWN',
  FILE_NOT_DOWNLOADABLE = 'ERR_FILE_NOT_DOWNLOADABLE',
  ACCESS_TOKEN_MISSING = 'ERR_ACCESS_TOKEN_MISSING',
}
```

When using pure JavaScript, simply use the appropriate values:

```js
if (e instanceof CloudStorageError && e.code === 'FILE_NOT_FOUND') {
  /* do something */
}
```
