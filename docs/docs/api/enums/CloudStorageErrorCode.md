---
sidebar_position: 2
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
  DIRECTORY_NOT_FOUND = 'ERR_NO_DIRECTORY_FOUND',
  FILE_ALREADY_EXISTS = 'ERR_FILE_EXISTS',
  MULTIPLE_FILES_SAME_NAME = 'ERR_MULTIPLE_FILES_SAME_NAME', // google drive only, see /docs/guides/google-drive-files-same-name
  AUTHENTICATION_FAILED = 'ERR_AUTHENTICATION_FAILED', // google drive only
  WRITE_ERROR = 'ERR_WRITE_ERROR',
  READ_ERROR = 'ERR_READ_ERROR',
  DELETE_ERROR = 'ERR_DELETE_ERROR',
  STAT_ERROR = 'ERR_STAT_ERROR',
  UNKNOWN = 'ERR_UNKNOWN',
}
```

When using pure JavaScript, simply use the appropriate values:

```js
if (e.instanceof CloudStorageError && e.code === 'FILE_NOT_FOUND') {
  /* do something */
}
```
