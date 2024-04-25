---
sidebar_position: 1
---

# useCloudFile

The `useCloudFile` hook is a helper hook designed to improve the developer experience when working with a single file in the cloud. This is especially useful when, for example, working with a single file containing the app's state as backup.

```ts
import { useCloudFile } from 'react-native-cloud-storage';
```

## API

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to use. See [the definition of this parameter in `CloudStorage`](../CloudStorage#path).
- `scope` ([`CloudStorageScope`](../enums/CloudStorageScope)): Optional. The storage scope (documents/app data) to use. Defaults to [`CloudStorageScope.AppData`](../enums/CloudStorageScope), unless the default scope of the provider has been changed via [`setProviderOptions()`](../CloudStorage#setprovideroptionsprovider-options).

**Returns**: An object containing the following properties:

- `content`: The content of the file (`string`, or `null` if the file does not exist).
- `download()`: Function to download the file's content from iCloud. Refer to [`downloadFile()`](../CloudStorage#downloadfilepath-scope) for more information.
- `read()`: Function to re-read the file (automatically called on every `write` call and change of `path` or `scope`).
- `write(newContent)`: Function to write the content of the first parameter (`string`) to the file. **Note**: This will overwrite the file's current content. Automatically calls `read()` afterwards.
- `remove()`: Function to delete the file.

## Example

```tsx
import React, { useState, useEffect } from 'react';
import { useCloudFile } from 'react-native-cloud-storage';

const App: React.FC = () => {
  const { content, read, write, remove } = useCloudFile('/test.txt');

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    write(counter);
  }, [counter]);

  const increase = () => {
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <View>
      <Text>{content ?? 'File not found'}</Text>
      <Button title="Increase" onPress={increase} />
      <Button title="Delete" onPress={remove} />
      <Button title="Re-read" onPress={read} />
    </View>
  );
};
```
