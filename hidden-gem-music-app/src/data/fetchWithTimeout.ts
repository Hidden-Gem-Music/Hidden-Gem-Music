const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

function createAbortError() {
  try {
    return new DOMException("The request was aborted.", "AbortError");
  } catch {
    const error = new Error("The request was aborted.");
    error.name = "AbortError";
    return error;
  }
}

function createTimeoutError(endpoint: string) {
  const error = new Error(`Request timed out after 60 seconds for ${endpoint}.`);
  error.name = "TimeoutError";
  return error;
}

function mergeAbortSignals(signal: AbortSignal | undefined, timeoutMs: number, endpoint: string) {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const abortFromParent = () => {
    controller.abort(signal?.reason ?? createAbortError());
  };

  if (signal?.aborted) {
    abortFromParent();
  } else {
    signal?.addEventListener("abort", abortFromParent, { once: true });
    timeoutId = setTimeout(() => {
      controller.abort(createTimeoutError(endpoint));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      signal?.removeEventListener("abort", abortFromParent);
    },
  };
}

async function fetchOnce(endpoint: string, init: RequestInit, parentSignal?: AbortSignal, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const mergedSignal = mergeAbortSignals(parentSignal, timeoutMs, endpoint);
  try {
    return await fetch(endpoint, {
      ...init,
      signal: mergedSignal.signal,
    });
  } finally {
    mergedSignal.cleanup();
  }
}

export async function fetchWithTimeoutAndRetry(
  endpoint: string,
  init: RequestInit = {},
  parentSignal?: AbortSignal,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
) {
  const { signal: _ignoredSignal, ...initWithoutSignal } = init;

  try {
    return await fetchOnce(endpoint, initWithoutSignal, parentSignal, timeoutMs);
  } catch (error) {
    if (parentSignal?.aborted) {
      throw error;
    }
    return fetchOnce(endpoint, initWithoutSignal, parentSignal, timeoutMs);
  }
}
