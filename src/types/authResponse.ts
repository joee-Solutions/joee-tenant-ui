/**
 * Auth API envelopes: full login vs MFA challenge vs post-OTP session.
 */

export type AuthTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export type AuthUser = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

export type AuthDataPayload = {
  status?: boolean;
  message?: string;
  mfa_required?: boolean;
  mfa_type?: string;
  token?: string;
  tokens?: AuthTokens;
  user?: AuthUser;
};

export type AuthEnvelope = {
  success?: boolean;
  message?: string;
  data?: AuthDataPayload;
};

/** First-time login: OTP required before access tokens are issued. */
export function isMfaRequiredResponse(rt: unknown): rt is AuthEnvelope & {
  data: AuthDataPayload & { token: string };
} {
  if (!rt || typeof rt !== "object") return false;
  const d = (rt as AuthEnvelope).data;
  if (!d || typeof d !== "object") return false;
  return (
    d.mfa_required === true &&
    typeof d.token === "string" &&
    d.token.length > 20
  );
}

export function extractMfaChallenge(rt: unknown): {
  token: string;
  mfaType?: string;
  message?: string;
} | null {
  if (!isMfaRequiredResponse(rt)) return null;
  return {
    token: rt.data.token,
    mfaType: rt.data.mfa_type,
    message: rt.data.message,
  };
}

/** Full session after login or after OTP verify (same shape). */
export function extractLoginSession(rt: unknown): {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
  toastMessage?: string;
} | null {
  if (!rt || typeof rt !== "object") return null;
  const env = rt as AuthEnvelope;
  const data = env.data;
  const tokens = data?.tokens;

  // Prefer data.tokens; single data.token only when not an MFA challenge
  const accessToken =
    tokens?.accessToken ||
    (rt as { tokens?: AuthTokens }).tokens?.accessToken ||
    (data?.mfa_required !== true && typeof data?.token === "string"
      ? data.token
      : undefined);

  if (
    !accessToken ||
    typeof accessToken !== "string" ||
    accessToken.length < 10
  ) {
    return null;
  }

  const refreshToken = tokens?.refreshToken;
  return {
    accessToken,
    refreshToken:
      typeof refreshToken === "string" ? refreshToken : undefined,
    expiresIn:
      typeof tokens?.expiresIn === "number" ? tokens.expiresIn : undefined,
    user: data?.user || (rt as { user?: AuthUser }).user,
    toastMessage: data?.message || env.message,
  };
}

export function isAuthExplicitFailure(rt: unknown): boolean {
  if (!rt || typeof rt !== "object") return false;
  const env = rt as AuthEnvelope;
  if (env.success === false) return true;
  if (env.data?.status === false && env.data?.mfa_required !== true)
    return true;
  return false;
}
