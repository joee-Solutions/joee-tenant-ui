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
    response?: {
      data?: {
        message?: string;
        error?: string;
        validationErrors?: string | string[];
      };
    };
    message?: string;
    error?: string;
    validationErrors?: string | string[];
  };
  const validation =
    e?.response?.data?.validationErrors ?? e?.validationErrors;
  const validationMsg = Array.isArray(validation)
    ? validation.map(String).join(", ")
    : typeof validation === "string"
      ? validation
      : undefined;
  const fromApi =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    validationMsg ||
    (typeof e?.error === "string" ? e.error : undefined);
  if (fromApi && !messageLooksTechnical(fromApi)) {
    return fromApi;
  }
  if (e?.message && !messageLooksTechnical(e.message)) {
    return e.message;
  }
  return fallback;
}

export const ORG_DELETE_BLOCKED_MESSAGE =
  "This organization cannot be deleted because it still has stored data (patients, employees, departments, appointments, or other records). Remove or reassign that data first, then try again.";

export const SUPER_ADMIN_DELETE_MESSAGE =
  "Super Admin accounts cannot be deleted. Only Admin accounts can be deleted.";

export const ADMIN_CREATE_ACCESS_DENIED_SUCCESS_HINT =
  "Admin was created, but a follow-up permission step returned Access Denied. The account may still exist — check the admin list.";

/** Backend may create the user then fail a side-effect with 500 Access Denied. */
export function isAccessDeniedAfterPartialCreate(error: unknown): boolean {
  const fromClient = getClientErrorMessage(error, "").toLowerCase();
  if (fromClient.includes("access denied")) return true;

  if (error && typeof error === "object") {
    const r = error as Record<string, unknown>;
    const nested =
      String(r.error ?? "") +
      " " +
      String(r.message ?? "") +
      " " +
      String((r.response as { data?: { error?: string; message?: string } })?.data?.error ?? "") +
      " " +
      String((r.response as { data?: { error?: string; message?: string } })?.data?.message ?? "");
    if (nested.toLowerCase().includes("access denied")) return true;
  }
  return false;
}

export function isOrgDeleteBlockedError(error: unknown): boolean {
  const msg = getClientErrorMessage(error, "").toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("cannot delete") ||
    msg.includes("foreign key") ||
    msg.includes("constraint") ||
    msg.includes("associated") ||
    msg.includes("depend") ||
    msg.includes("still has") ||
    msg.includes("has data") ||
    msg.includes("has records") ||
    msg.includes("patients") ||
    msg.includes("employees") ||
    msg.includes("departments") ||
    msg.includes("appointments") ||
    msg.includes("in use") ||
    msg.includes("referenced")
  );
}

export function resolveOrgDeleteErrorMessage(error: unknown): string {
  if (isOrgDeleteBlockedError(error)) {
    return ORG_DELETE_BLOCKED_MESSAGE;
  }
  return getClientErrorMessage(error, "Failed to delete organization.");
}

export function resolveSuperAdminDeleteErrorMessage(error: unknown): string {
  const msg = getClientErrorMessage(error, "").toLowerCase();
  if (
    msg.includes("super") ||
    msg.includes("access denied") ||
    msg.includes("forbidden") ||
    msg.includes("cannot delete")
  ) {
    return SUPER_ADMIN_DELETE_MESSAGE;
  }
  return getClientErrorMessage(error, "Failed to delete admin.");
}

export const RESOURCE_IN_USE_DELETE_MESSAGE =
  "This item cannot be deleted because it is still linked to other records. Remove or reassign those records first, then try again.";

export function isResourceInUseDeleteError(error: unknown): boolean {
  const status = (error as { response?: { status?: number }; statusCode?: number })
    ?.response?.status;
  const statusCode =
    status ??
    (error as { statusCode?: number })?.statusCode ??
    (error as { response?: { data?: { statusCode?: number } } })?.response?.data
      ?.statusCode;

  if (statusCode === 409) return true;

  const msg = getClientErrorMessage(error, "").toLowerCase();
  if (!msg) return false;
  return (
    msg.includes("still in use") ||
    msg.includes("cannot delete resource") ||
    msg.includes("in use") ||
    msg.includes("foreign key") ||
    msg.includes("constraint") ||
    msg.includes("referenced") ||
    msg.includes("associated") ||
    msg.includes("depend")
  );
}

/** User-facing message for employee/department/etc. delete blocked by linked data. */
export function resolveResourceDeleteErrorMessage(
  error: unknown,
  resourceLabel: string
): string {
  if (isResourceInUseDeleteError(error)) {
    return `This ${resourceLabel} cannot be deleted because it is still linked to other records. Remove or reassign those records first, then try again.`;
  }
  return getClientErrorMessage(error, `Failed to delete ${resourceLabel}.`);
}
