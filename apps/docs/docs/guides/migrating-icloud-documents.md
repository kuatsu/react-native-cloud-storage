---
sidebar_position: 3
---

# Migrating iCloud `Documents` from legacy sandbox storage

Before version 3, the `CloudStorageScope.Documents` incorrectly pointed to a local app sandbox `Documents` directory on iCloud. In version 3, this was fixed and the scope now points to the user-facing Documents folder on iCloud Drive instead.

If you shipped that behavior and now want to move users to real iCloud Documents, use the iCloud provider option `documentsMode` to read legacy files and copy them over once.

## Step 1: Create two iCloud instances

```ts
import { CloudStorage, CloudStorageProvider, CloudStorageScope } from 'react-native-cloud-storage';

const legacyICloudStorage = new CloudStorage(CloudStorageProvider.ICloud, {
  scope: CloudStorageScope.Documents,
  documentsMode: 'legacy_sandbox',
});

const iCloudStorage = new CloudStorage(CloudStorageProvider.ICloud, {
  scope: CloudStorageScope.Documents,
  // `documentsMode` defaults to `icloud`, so we can omit it here
});
```

## Step 2: Copy files recursively

```ts
const toChildPath = (parentPath: string, name: string): string => {
  return parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
};

const migrateDirectory = async (directoryPath = '/'): Promise<void> => {
  const entries = await legacyICloudStorage.readdir(directoryPath, CloudStorageScope.Documents);

  for (const entry of entries) {
    const sourcePath = toChildPath(directoryPath, entry);
    const sourceStat = await legacyICloudStorage.stat(sourcePath, CloudStorageScope.Documents);

    if (sourceStat.isDirectory()) {
      const targetDirectoryExists = await iCloudStorage.exists(sourcePath, CloudStorageScope.Documents);
      if (!targetDirectoryExists) {
        await iCloudStorage.mkdir(sourcePath, CloudStorageScope.Documents);
      }

      await migrateDirectory(sourcePath);
      continue;
    }

    const fileContent = await legacyICloudStorage.readFile(sourcePath, CloudStorageScope.Documents);
    await iCloudStorage.writeFile(sourcePath, fileContent, CloudStorageScope.Documents);
  }
};
```

## Step 3: Run once

Run this migration once per user (for example, guarded by your own persisted "migration complete" flag).

After migration, use only `documentsMode: 'icloud'` (or omit `documentsMode`, since `icloud` is the default).
