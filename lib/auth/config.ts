const MINUTES_IN_MS = 60_000;
const DAYS_IN_MS = 86_400_000;

function readNumberEnv(
  envName: string,
  fallback: number,
  min: number,
  max: number,
) {
  const rawValue = process.env[envName];
  if (!rawValue) return fallback;

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export const SESSION_COOKIE_NAME = "mds_session";
export type SessionKind = "user" | "admin";

export function getSessionCookieName(kind: SessionKind = "user") {
  if (kind === "admin") {
    const fromEnv = process.env.ADMIN_SESSION_COOKIE_NAME?.trim();
    if (fromEnv) return fromEnv;
    return "mds_admin_session";
  }

  const fromEnv = process.env.USER_SESSION_COOKIE_NAME?.trim();
  if (fromEnv) return fromEnv;
  return SESSION_COOKIE_NAME;
}

export const SESSION_TTL_DAYS = readNumberEnv("SESSION_TTL_DAYS", 30, 1, 90);
export const SESSION_TTL_MS = SESSION_TTL_DAYS * DAYS_IN_MS;

export const OTP_LENGTH = 6;
export const OTP_EXPIRES_MINUTES = readNumberEnv(
  "OTP_EXPIRES_MINUTES",
  10,
  3,
  30,
);
export const OTP_EXPIRES_MS = OTP_EXPIRES_MINUTES * MINUTES_IN_MS;
export const OTP_MAX_ATTEMPTS = readNumberEnv("OTP_MAX_ATTEMPTS", 5, 3, 10);
export const OTP_REQUEST_WINDOW_MINUTES = readNumberEnv(
  "OTP_REQUEST_WINDOW_MINUTES",
  10,
  1,
  30,
);
export const OTP_MAX_REQUESTS_PER_WINDOW = readNumberEnv(
  "OTP_MAX_REQUESTS_PER_WINDOW",
  5,
  1,
  20,
);

export const PASSWORD_RESET_SESSION_MINUTES = readNumberEnv(
  "PASSWORD_RESET_SESSION_MINUTES",
  15,
  5,
  60,
);
export const PASSWORD_RESET_SESSION_MS =
  PASSWORD_RESET_SESSION_MINUTES * MINUTES_IN_MS;

export const OAUTH_STATE_COOKIE_NAME = "mds_google_oauth_state";
export const OAUTH_STATE_TTL_MINUTES = 10;
export const OAUTH_STATE_TTL_MS = OAUTH_STATE_TTL_MINUTES * MINUTES_IN_MS;

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.trim().length >= 16) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET harus diisi dan minimal 16 karakter.");
  }

  return "dev-auth-secret-change-me";
}

export function getAuthBaseUrl() {
  const value = process.env.AUTH_URL?.trim();
  if (value) {
    return value.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ??
    `${getAuthBaseUrl()}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET wajib diisi di file .env",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}
