/**
 * Checks if the path starts with a leading slash and adds one if it doesn't to maintain backwards compatibility.
 * Will log a warning to the console if it had to add a leading slash. Will throw an error in the future.
 *
 * @param path The path to check.
 * @returns The path with a leading slash, if it didn't have one already.
 * @private
 */
export const verifyLeadingSlash = (path: string) => {
  if (!path.startsWith('/')) {
    console.warn(
      `[react-native-cloud-storage] Path "${path}" did not start with a leading slash. This is deprecated and will be an error in the future.`
    );
    return `/${path}`;
  }
  return path;
};
