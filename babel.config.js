module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin MUST be the last item in the plugins list.
      'react-native-reanimated/plugin',
    ],
  };
};
