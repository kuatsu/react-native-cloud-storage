---
sidebar_position: 2
---

# Install in pure React Native project (CRNA)

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
