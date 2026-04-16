import { prisma } from "@/lib/prisma";

const MINUTE_IN_MS = 60_000;

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

const SESSION_CLEANUP_INTERVAL_MINUTES = readNumberEnv(
  "SESSION_CLEANUP_INTERVAL_MINUTES",
  30,
  5,
  180,
);
const SESSION_CLEANUP_INTERVAL_MS =
  SESSION_CLEANUP_INTERVAL_MINUTES * MINUTE_IN_MS;

type CleanupState = {
  lastRunAt: number;
  running: boolean;
};

declare global {
  var __mdsSessionCleanupState: CleanupState | undefined;
}

function getCleanupState() {
  if (!globalThis.__mdsSessionCleanupState) {
    globalThis.__mdsSessionCleanupState = {
      lastRunAt: 0,
      running: false,
    };
  }

  return globalThis.__mdsSessionCleanupState;
}

export async function maybeCleanupExpiredSessions() {
  const state = getCleanupState();
  const now = Date.now();

  if (state.running) return;
  if (state.lastRunAt > 0 && now - state.lastRunAt < SESSION_CLEANUP_INTERVAL_MS) {
    return;
  }

  state.running = true;
  state.lastRunAt = now;

  try {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  } catch {
    // Best-effort background maintenance.
  } finally {
    state.running = false;
  }
}
