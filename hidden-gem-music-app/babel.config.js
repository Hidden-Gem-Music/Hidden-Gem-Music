module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require("expo/config/babel")],
  };
};
