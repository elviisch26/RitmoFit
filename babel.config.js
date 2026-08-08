module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // The preset auto-registers the worklets plugin when the package is
          // installed. It is listed explicitly below (last, as required by
          // Reanimated v4), so the automatic registration is disabled here to
          // avoid applying the plugin twice.
          worklets: false,
          reanimated: false,
        },
      ],
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};