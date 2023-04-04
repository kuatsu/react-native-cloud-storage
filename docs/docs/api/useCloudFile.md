---
sidebar_position: 2
---

# useCloudFile

The `useCloudFile` hook is a helper hook designed to improve the developer experience when working with a single file in the cloud. This is especially useful when, for example, working with a single file containing the app's state as backup.

```ts
import { useCloudFile } from { react-native-cloud-storage };
```

## API

**Parameters**:

- `path` (`string`): Required. The full pathname of the file to use.
- `scope` ([`StorageScope`](./StorageScope)): Required. The storage scope (documents/app data) to use.

**Returns**: An object containing the following properties:

- `content`: The content of the file (`string`).
- `read()`: Function to re-read the file (automatically called on every `update` call and change of `path` or `scope`).
- `update(newContent)`: Function to update the contents of the file with the first parameter (`string`).
- `remove()`: Function to delete the file.

## Example

```tsx
import React, { useState, useEffect } from 'react';
import { useCloudFile, StorageScope } from { react-native-cloud-storage };

const App: React.FC = () => {
  const { content, read, update, remove } = useCloudFile('test.txt', StorageScope.Documents);

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    update(counter);
  }, [counter]);

  const increase = () => {
    setCounter(counter => counter + 1);
  };

  return (
    <View>
      <Text>{content ?? 'File not found'}</Text>
      <Button title="Increase" onPress={increase} />
      <Button title="Delete" onPress={remove} />
      <Button title="Re-read" onPress={read} />
    </View>
  )
}
```
