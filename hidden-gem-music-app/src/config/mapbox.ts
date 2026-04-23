const rawMapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

export const mapboxConfig = {
  accessToken: rawMapboxToken,
  hasAccessToken: rawMapboxToken.length > 0,
};
