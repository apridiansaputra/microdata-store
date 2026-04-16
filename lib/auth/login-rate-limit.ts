const MINUTE_IN_MS = 60_000;

type RateLimitEntry = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number | null;
  touchedAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

type LoginScope = "user_login" | "admin_login";

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

const LOGIN_WINDOW_MINUTES = readNumberEnv("LOGIN_WINDOW_MINUTES", 10, 1, 60);
const LOGIN_MAX_FAILURES = readNumberEnv("LOGIN_MAX_FAILURES", 5, 3, 20);
const LOGIN_BLOCK_MINUTES = readNumberEnv("LOGIN_BLOCK_MINUTES", 15, 1, 120);

const LOGIN_WINDOW_MS = LOGIN_WINDOW_MINUTES * MINUTE_IN_MS;
const LOGIN_BLOCK_MS = LOGIN_BLOCK_MINUTES * MINUTE_IN_MS;
const ENTRY_STALE_MS = Math.max(LOGIN_WINDOW_MS, LOGIN_BLOCK_MS) * 2;

declare global {
  var __mdsLoginRateLimitStore: RateLimitStore | undefined;
}

function getStore() {
  if (!globalThis.__mdsLoginRateLimitStore) {
    globalThis.__mdsLoginRateLimitStore = new Map<string, RateLimitEntry>();
  }

  return globalThis.__mdsLoginRateLimitStore;
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase().slice(0, 320);
}

function normalizeIpAddress(ipAddress: string | null) {
  if (!ipAddress) return "unknown";
  return ipAddress.trim().toLowerCase().slice(0, 45) || "unknown";
}

function getNow() {
  return Date.now();
}

function maybeCleanupStore(store: RateLimitStore, now: number) {
  if (store.size < 1000) return;
  if (Math.random() >= 0.05) return;

  for (const [key, entry] of store.entries()) {
    if (now - entry.touchedAt > ENTRY_STALE_MS) {
      store.delete(key);
    }
  }
}

export function getClientIpAddress(request: Request) {
  const fromForwarded = request.headers.get("x-forwarded-for");
  if (fromForwarded) {
    const firstIp = fromForwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp.slice(0, 45);
  }

  const fromRealIp = request.headers.get("x-real-ip");
  if (fromRealIp) return fromRealIp.trim().slice(0, 45);

  return null;
}

export function createLoginRateLimitKey(input: {
  scope: LoginScope;
  identifier: string;
  ipAddress: string | null;
}) {
  const identifier = normalizeIdentifier(input.identifier);
  const ipAddress = normalizeIpAddress(input.ipAddress);
  return `${input.scope}:${ipAddress}:${identifier}`;
}

export function getLoginRateLimitStatus(key: string) {
  const store = getStore();
  const now = getNow();
  maybeCleanupStore(store, now);

  const entry = store.get(key);
  if (!entry) {
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  entry.touchedAt = now;

  if (entry.blockedUntil && entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return { isBlocked: true, retryAfterSeconds };
  }

  if (entry.windowStartedAt + LOGIN_WINDOW_MS <= now) {
    entry.failures = 0;
    entry.windowStartedAt = now;
    entry.blockedUntil = null;
  }

  return { isBlocked: false, retryAfterSeconds: 0 };
}

export function registerLoginFailure(key: string) {
  const store = getStore();
  const now = getNow();
  maybeCleanupStore(store, now);

  const existing = store.get(key);
  if (!existing) {
    store.set(key, {
      failures: 1,
      windowStartedAt: now,
      blockedUntil: null,
      touchedAt: now,
    });
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  if (existing.windowStartedAt + LOGIN_WINDOW_MS <= now) {
    existing.failures = 1;
    existing.windowStartedAt = now;
    existing.blockedUntil = null;
    existing.touchedAt = now;
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  existing.failures += 1;
  existing.touchedAt = now;

  if (existing.failures >= LOGIN_MAX_FAILURES) {
    existing.blockedUntil = now + LOGIN_BLOCK_MS;
    existing.failures = 0;
    return {
      isBlocked: true,
      retryAfterSeconds: Math.ceil(LOGIN_BLOCK_MS / 1000),
    };
  }

  return { isBlocked: false, retryAfterSeconds: 0 };
}

export function clearLoginRateLimit(key: string) {
  const store = getStore();
  store.delete(key);
}
