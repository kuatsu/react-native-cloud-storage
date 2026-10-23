const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (process.env.RN_HARNESS === 'true') {
  config.maxWorkers = 1;
  config.server.unstable_serverRoot = __dirname;
  config.server.rewriteRequestUrl = (url) => url;
  // Harness is hoisted beside the docs app, which uses another React version.
  config.resolver.resolveRequest = (context, moduleName, platform) =>
    context.resolveRequest(
      context,
      moduleName === 'react' || moduleName.startsWith('react/') ? require.resolve(moduleName) : moduleName,
      platform
    );
}

module.exports = config;
