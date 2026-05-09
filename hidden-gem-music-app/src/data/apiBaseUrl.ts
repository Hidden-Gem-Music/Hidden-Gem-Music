import * as ExpoLinking from "expo-linking";
import { NativeModules, Platform } from "react-native";

declare const process: {
  env: { EXPO_PUBLIC_API_BASE_URL?: string };
};
declare const require: ((module: string) => any) | undefined;

const DEFAULT_API_BASE_URL = "http://localhost:5140";
const DEFAULT_API_PORT = "5140";
const MOBILE_LAN_FALLBACK_BASE_URL = "http://192.168.111.17:5140";

function getHostFromExpoRuntime() {
  const sanitizeHost = (value: string) => {
    const next = value.trim().toLowerCase();
    if (!next || next === "localhost" || next === "127.0.0.1") {
      return "";
    }
    return next;
  };

  try {
    const ExpoConstants = require ? (require("expo-constants")?.default as any) : null;
    const hostUri = ExpoConstants?.expoConfig?.hostUri ?? ExpoConstants?.manifest?.debuggerHost ?? "";
    if (typeof hostUri === "string" && hostUri.length > 0) {
      const host = sanitizeHost(hostUri.split(":")[0] ?? "");
      if (host) {
        return host;
      }
    }
  } catch {
    // Ignore missing constants module.
  }

  const sourceUrl = (NativeModules as any)?.SourceCode?.scriptURL;
  if (typeof sourceUrl === "string" && sourceUrl.length > 0) {
    try {
      const host = sanitizeHost(new URL(sourceUrl).hostname ?? "");
      if (host) {
        return host;
      }
    } catch {
      // Fall through to Expo Linking resolver.
    }
  }

  try {
    const runtimeUrl = ExpoLinking.createURL("/");
    const host = sanitizeHost(new URL(runtimeUrl).hostname ?? "");
    return host || "";
  } catch {
    return "";
  }
}

export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl && configuredBaseUrl.length > 0) {
    return configuredBaseUrl;
  }

  if (Platform.OS !== "web") {
    const runtimeHost = getHostFromExpoRuntime();
    if (runtimeHost.length > 0) {
      return `http://${runtimeHost}:${DEFAULT_API_PORT}`;
    }
    return MOBILE_LAN_FALLBACK_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
}
