# ☁️ react-native-cloud-storage

![npm bundle size](https://img.shields.io/bundlephobia/min/react-native-cloud-storage?style=flat-square) ![GitHub](https://img.shields.io/github/license/kuatsu/react-native-cloud-storage?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/kuatsu/react-native-cloud-storage?style=flat-square)

This library provides a unified and streamlined API for accessing cloud storage services on iOS, Android and Web. It supports iCloud on iOS and Google Drive on all other platforms.

- 💾 Read and write files to the cloud
- 🧪 Fully compatible with Expo
- 📱 iOS, Android & Web support
- 🏎️ Lightning fast iCloud performance using native iOS APIs
- 🌐 Google Drive REST API implementation for other platforms
- 🧬 Easy to use React Hooks API, or use the imperative `fs`-style API
- 👌 Zero dependencies, small bundle size

## Installation

### React Native

```sh
npm install react-native-cloud-storage
cd ios && pod install
```

Afterwards, follow the [configuration instructions](https://react-native-cloud-storage.oss.kuatsu.de/docs/installation/react-native).

### Expo

```sh
npx expo install react-native-cloud-storage
```

Afterwards, [add the provided config plugin](https://react-native-cloud-storage.oss.kuatsu.de/docs/installation/expo) and `expo prebuild` or rebuild your development client.

## Quick Start

```jsx
import React from 'react';
import { Platform, View, Text, Button } from 'react-native';
import { CloudStorage, useCloudAvailable } from 'react-native-cloud-storage';

const App = () => {
  const cloudAvailable = useCloudAvailable();

  React.useEffect(() => {
    if (Platform.OS !== 'ios') {
      CloudStorage.setGoogleDriveAccessToken('some-access-token'); // get via @react-native-google-signin/google-signin or similar
    }
  }, []);

  const writeToCloud = async () => {
    await CloudStorage.writeFile('/file.txt', 'Hello, world!');
    console.log('Successfully wrote file to cloud');
  };

  const readFromCloud = async () => {
    const value = await CloudStorage.readFile('/file.txt');
    console.log('Successfully read file from cloud:', value);
  };

  return (
    <View>
      {cloudAvailable ? (
        <>
          <Button onPress={writeToCloud} title="Write to Cloud" />
          <Button onPress={readFromCloud} title="Read from Cloud" />
        </>
      ) : (
        <Text>The cloud storage is not available. Are you logged in?</Text>
      )}
    </View>
  );
};
```

## Documentation

A detailed documentation is located [here](https://react-native-cloud-storage.oss.kuatsu.de/docs/intro).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## Example Project

There's an example app available in the `example` directory. To use the Google Drive implementation (for any platforms other than iOS), you'll need to provide a valid access token for the Google Drive API. For testing purposes, you can create one using the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).

## License

MIT
