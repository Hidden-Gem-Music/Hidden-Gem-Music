declare const process: {
  env: { EXPO_PUBLIC_API_BASE_URL?: string };
};

const DEFAULT_API_BASE_URL = "http://localhost:5140";

export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : DEFAULT_API_BASE_URL;
}
