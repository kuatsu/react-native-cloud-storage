# ☁️ react-native-cloud-storage

Save & read from iCloud and Google Drive using React Native

**⚠️ WARNING**: This project is still under construction and not yet published to the NPM registry. Please proceed with caution.

## Installation

```sh
npm install react-native-cloud-storage
# or
yarn add react-native-cloud-storage
```

### Using Expo Managed Workflow

This module contains native code. To make it work with Expo Managed Workflow, we provide an Expo config plugin. To install it, simply add it to the appropriate `plugins` section of your `app.json`:

```json
{
  "expo": {
    "plugins": ["react-native-cloud-storage"]
  }
}
```

Optionally, you can also configure the `iCloudContainerEnvironment` option using the config plugin (defaults to `Production`):

```json
{
  "expo": {
    "plugins": [["react-native-cloud-storage", { "iCloudContainerEnvironment": "Development" }]]
  }
}
```

**Note**: To use a config plugin, you need to use a [development client](https://docs.expo.dev/development/create-development-builds/). This module does **not** work with Expo Go.

### Not using Expo Managed Workflow

If you're either using pure React Native or Expo's "bare" workflow, you will need to manually configure your iOS project. First, install the pods:

```sh
  cd ios && pod install && cd ..
```

Then, you will first need to add the iCloud entitlement to your project. Open your Xcode workspace/project and select your project target. Open the section "Signing & Capabilities" and add the iCloud capability. From the capability settings, enable "iCloud Documents". Finally, add a new container using the plus symbol using the name `iCloud.{your.bundle}` where `{your.bundle}` should be replaced with your bundle identifier.

Google Drive support for Android does not use native code and is implemented in pure JavaScript using the Google Drive REST API. No further installation steps are needed.

## Usage

**NOTE**: A full documentation will be provided once the module has been published.

At its core, `react-native-cloud-storage` strives to implement the conventions of `fs`. Please check the file `src/RNCloudStorage.ts` to find all currently available methods on the default export.

The only additional method is `setGoogleDriveAccessToken` which sets the global Google Drive access token for Android files. This library does not provide any way of acquiring such an access token. Instead, you need to get it elsewhere, i.e. with the [`react-native-google-signin`](https://github.com/react-native-google-signin/google-signin) or [`expo-auth-session`](https://docs.expo.dev/guides/google-authentication/) libraries.

In addition, this module offers a React hook `useCloudFile` which can be used to make working with a single file in the cloud much easier. This is especially helpful when working with a backup file, for example. Like `readFile`, it takes two parameters `path` and `scope` and returns an object containing the following properties:

- `content`: The content of the file.
- `read`: Function to re-read the file (automatically called on every `update` call and change of `path` or `scope`).
- `update`: Function to update the contents of the file with the first parameter.
- `remove`: Deletes the file.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## Example Project

There's a demo application available within the `example` directory. To use it under Android, you'll need to provide a valid access token for the Google Drive API. You can create one using the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground). If you're using an Android emulator, you can make your life easier by feeding the token into the emulator using `adb shell input text '{some_token}'`.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
