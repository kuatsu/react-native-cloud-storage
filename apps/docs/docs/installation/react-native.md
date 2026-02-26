---
sidebar_position: 2
---

# Install in bare React Native project

:::info

Newer versions of this library are only compatible with the New Architecture. If you're still using the Legacy Architecture, [consider migrating to the New Architecture](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here). If you can't migrate yet, you can continue using version 2 of this library, which is compatible with both the New and Legacy Architectures. You can install it using `npm install react-native-cloud-storage@^2` or `yarn add react-native-cloud-storage@^2`.

:::

First, install the library using your favorite package manager:

```sh
npm install react-native-cloud-storage
# or
yarn add react-native-cloud-storage
```

After installing the library itself, you will need to install the native iOS module (linking is done by React Native's autolinking) and configure iCloud within the native iOS files. First, install the pods:

```sh
cd ios && pod install && cd ..
```

Then, open your Xcode workspace. From there, find the main project target and open the section "Signing & Capabilities". Click on the "+ Capability" button to add a new capability. From there, add the "iCloud" capability. Once added, scroll down to the newly created capability and enable "iCloud Documents" from the "Services" section. Finally, add a new container called `iCloud.{bundle_identifier}` where `{bundle_identifier}` should be replaced with your project's bundle identifier.

Once complete, it should look like this:

![Example of correct iOS configuration](/img/ios_installation.jpg)

Finally, proceed with [the Google Drive configuration](./configure-google-drive).
