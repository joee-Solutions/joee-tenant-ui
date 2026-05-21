const UNREACHABLE_CODES = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "ERR_NETWORK",
]);

function messageLooksTechnical(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("enotfound") ||
    m.includes("getaddrinfo") ||
    m.includes("econnrefused") ||
    m.includes("etimedout") ||
    m.includes("network error") ||
    m.includes("axios") ||
    m.includes("errno") ||
    m.includes("ondigitalocean.app")
  );
}

/** True when the API proxy cannot reach the backend (DNS, connection, timeout). */
export function isBackendUnreachableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const e = error as Record<string, unknown>;
  const code = String(e.code ?? "");
  if (UNREACHABLE_CODES.has(code)) return true;

  const msg = String(e.message ?? e.error ?? "");
  if (messageLooksTechnical(msg)) return true;

  const resp = e.response as
    | { status?: number; data?: Record<string, unknown> }
    | undefined;
  if (resp?.data?.code === "BACKEND_UNREACHABLE") return true;

  const bodyMsg = String(resp?.data?.message ?? resp?.data?.error ?? "");
  if (bodyMsg && messageLooksTechnical(bodyMsg)) return true;

  if (resp?.status === 503) return true;

  return false;
}

export const BACKEND_UNREACHABLE_MESSAGE =
  "Unable to reach the server. Check your connection, or sign in with saved credentials if you have logged in on this device before.";

export function formatApiRouteNetworkError(error: unknown): {
  success: false;
  message: string;
  code: "BACKEND_UNREACHABLE";
} {
  if (process.env.NODE_ENV === "development") {
    console.error("[API proxy] Backend unreachable:", error);
  }
  return {
    success: false,
    message: BACKEND_UNREACHABLE_MESSAGE,
    code: "BACKEND_UNREACHABLE",
  };
}

/** User-safe message for toasts; never exposes DNS / getaddrinfo strings. */
export function getClientErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (isBackendUnreachableError(error)) {
    return BACKEND_UNREACHABLE_MESSAGE;
  }

  const e = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  const fromApi = e?.response?.data?.message || e?.response?.data?.error;
  if (fromApi && !messageLooksTechnical(fromApi)) {
    return fromApi;
  }
  if (e?.message && !messageLooksTechnical(e.message)) {
    return e.message;
  }
  return fallback;
}
