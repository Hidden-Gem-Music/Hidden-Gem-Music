declare const process: {
  env: { EXPO_PUBLIC_ACCESS_CODE?: string };
};

export const ACCESS_CODE = process.env.EXPO_PUBLIC_ACCESS_CODE?.trim().toUpperCase() ?? "";

const ACCESS_STORAGE_KEY = "hidden-gem-access-granted-v1";

export function isAccessCodeConfigured() {
  return ACCESS_CODE.length > 0;
}

export function readAccessGranted() {
  if (typeof window === "undefined" || !isAccessCodeConfigured()) {
    return false;
  }

  try {
    return window.localStorage.getItem(ACCESS_STORAGE_KEY) === ACCESS_CODE;
  } catch {
    return false;
  }
}

export function writeAccessGranted() {
  if (typeof window === "undefined" || !isAccessCodeConfigured()) {
    return;
  }

  try {
    window.localStorage.setItem(ACCESS_STORAGE_KEY, ACCESS_CODE);
  } catch {
    // Ignore localStorage failures; access still works for the current session state.
  }
}
