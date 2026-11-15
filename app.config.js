// Android uses native autolinking without Firebase. The provider's plugin only
// needs a real iOS URL scheme; never fabricate a Google project or client ID.
module.exports = ({ config }) => {
  const iosClientId = process.env.GOOGLE_IOS_CLIENT_ID?.trim();
  if (iosClientId && !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(iosClientId))
    throw Error("GOOGLE_IOS_CLIENT_ID inválido.");
  return {
    ...config,
    extra: { ...config.extra, ...(iosClientId ? { googleIosClientId: iosClientId } : {}) },
    plugins: [
      ...(config.plugins || []),
      ...(iosClientId ? [["@react-native-google-signin/google-signin", {
        iosUrlScheme: "com.googleusercontent.apps." + iosClientId.replace(/\.apps\.googleusercontent\.com$/, ""),
      }]] : []),
    ],
  };
};
