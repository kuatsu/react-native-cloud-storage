---
sidebar_position: 1
---

# CloudStorageFileStat

A `CloudStorageFileStat` is returned by the [`CloudStorage.stat()`](../CloudStorage#statpath-scope) method and contains several statistics about the file.

## API

The `CloudStorageFileStat` object has the following properties:

- `size` (`number`): The filesize in bytes. If no size could be determined, this is `0`.
- `birthtimeMs` (`number`): The timestamp in milliseconds indicating the creation time of the file.
- `mtimeMs` (`number`): The timestamp in milliseconds indicating the time of the last modification of the file.
- `birthtime` (`Date`): A date object created from `birthtimeMs`.
- `mtime` (`Date`): A date object created from `mtimeMs`.
- `isDirectory()` (`() => boolean`): A function that returns a `boolean` determining whether or not this is a directory.
- `isFile()` (`() => boolean`): A function that returns a `boolean` determining whether or not this is a file.
