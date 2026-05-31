import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type DiscoveryMode = "desktop" | "mobile";

const DISCOVERY_MODE_STORAGE_KEY = "hidden-gem-discovery-mode-v1";
const DISCOVERY_MODE_CHANGE_EVENT = "hidden-gem-discovery-mode-change";

export function readDiscoveryMode(): DiscoveryMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(DISCOVERY_MODE_STORAGE_KEY);
    return value === "desktop" || value === "mobile" ? value : null;
  } catch {
    return null;
  }
}

export function writeDiscoveryMode(mode: DiscoveryMode) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DISCOVERY_MODE_STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent(DISCOVERY_MODE_CHANGE_EVENT, { detail: mode }));
  } catch {
    // Ignore localStorage failures; the selected mode still works for this session.
  }
}

export function useDiscoveryMode(): DiscoveryMode | null {
  const [mode, setMode] = useState<DiscoveryMode | null>(readDiscoveryMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncMode = () => setMode(readDiscoveryMode());

    window.addEventListener(DISCOVERY_MODE_CHANGE_EVENT, syncMode);
    window.addEventListener("storage", syncMode);
    return () => {
      window.removeEventListener(DISCOVERY_MODE_CHANGE_EVENT, syncMode);
      window.removeEventListener("storage", syncMode);
    };
  }, []);

  return mode;
}

export function useMobileExperience() {
  const discoveryMode = useDiscoveryMode();
  return Platform.OS !== "web" || discoveryMode === "mobile";
}
