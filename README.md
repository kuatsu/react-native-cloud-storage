# ☁️ react-native-cloud-storage

Save & read from iCloud and Google Drive using React Native

![npm bundle size](https://img.shields.io/bundlephobia/min/react-native-cloud-storage?style=flat-square) ![GitHub](https://img.shields.io/github/license/kuatsu/react-native-cloud-storage?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/kuatsu/react-native-cloud-storage?style=flat-square)

**⚠️ WARNING**: This project is still considered unstable. The API might change drastically in new versions. Please proceed with caution and report any issues you're encountering.

## Installation

```sh
npm install react-native-cloud-storage
# or
yarn add react-native-cloud-storage
```

## Documentation

The documentation is located [here](https://react-native-cloud-storage.vercel.app/docs/intro).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## Example Project

There's a demo application available within the `example` directory. To use it under Android, you'll need to provide a valid access token for the Google Drive API. You can create one using the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground). If you're using an Android emulator, you can make your life easier by feeding the token into the emulator using `adb shell input text '{some_token}'`.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
