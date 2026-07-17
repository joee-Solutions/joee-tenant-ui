import { processRequestAuth } from "@/framework/https";

type MutationMethod = "post" | "put" | "patch" | "delete";

export type AuthMutationResult = {
  response: unknown;
  error: unknown | null;
};

/** Run a mutation and always capture axios errors (processRequestAuth often returns null on 5xx). */
export async function runAuthMutation(
  method: MutationMethod,
  path: string,
  data?: unknown
): Promise<AuthMutationResult> {
  let capturedError: unknown = null;
  const response = await processRequestAuth(
    method,
    path,
    data,
    (_path, _data, err) => {
      if (err) capturedError = err;
    }
  );
  return { response, error: capturedError };
}

function responseIndicatesFailure(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  if (r.success === false || r.status === false) return true;
  if (typeof r.statusCode === "number" && r.statusCode >= 400) return true;
  if (typeof r.error === "string" && r.error.trim().length > 0) return true;
  return false;
}

export function isMutationSuccess(
  response: unknown,
  error: unknown | null
): boolean {
  if (error) return false;
  if (response == null) return false;
  return !responseIndicatesFailure(response);
}

export function isDeleteMutationSuccess(
  response: unknown,
  error: unknown | null
): boolean {
  if (!error) {
    if (response == null) return false;
    return !responseIndicatesFailure(response);
  }
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === 404 || status === 410;
}
