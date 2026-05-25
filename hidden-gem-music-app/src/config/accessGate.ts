export const ACCESS_CODE = "COMMENCEMENT";

const ACCESS_STORAGE_KEY = "hidden-gem-access-granted-v1";

export function readAccessGranted() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ACCESS_STORAGE_KEY) === ACCESS_CODE;
  } catch {
    return false;
  }
}

export function writeAccessGranted() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ACCESS_STORAGE_KEY, ACCESS_CODE);
  } catch {
    // Ignore localStorage failures; access still works for the current session state.
  }
}
