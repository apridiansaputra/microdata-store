import { sendOtpEmail } from "@/lib/auth/email";

type OtpEmailPurpose = "register";

type OtpEmailJob = {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
  attempt: number;
  nextRunAt: number;
};

type QueueState = {
  jobs: OtpEmailJob[];
  running: boolean;
  timer: NodeJS.Timeout | null;
};

const MAX_RETRIES = readNumberEnv("OTP_EMAIL_MAX_RETRIES", 3, 1, 8);
const BASE_RETRY_SECONDS = readNumberEnv("OTP_EMAIL_RETRY_BASE_SECONDS", 15, 5, 120);
const MAX_QUEUE_SIZE = readNumberEnv("OTP_EMAIL_QUEUE_MAX_SIZE", 2000, 100, 50000);

declare global {
  var __mdsOtpEmailQueue: QueueState | undefined;
}

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

function getQueueState() {
  if (!globalThis.__mdsOtpEmailQueue) {
    globalThis.__mdsOtpEmailQueue = {
      jobs: [],
      running: false,
      timer: null,
    };
  }

  return globalThis.__mdsOtpEmailQueue;
}

function scheduleWorker(delayMs = 0) {
  const state = getQueueState();
  if (state.timer) return;

  state.timer = setTimeout(() => {
    state.timer = null;
    void processQueue();
  }, Math.max(0, delayMs));
}

function getRetryDelayMs(attempt: number) {
  const exponent = Math.max(0, attempt - 1);
  return BASE_RETRY_SECONDS * 1000 * 2 ** exponent;
}

async function processQueue() {
  const state = getQueueState();
  if (state.running) return;
  state.running = true;

  try {
    while (state.jobs.length > 0) {
      const now = Date.now();
      state.jobs.sort((a, b) => a.nextRunAt - b.nextRunAt);
      const nextJob = state.jobs[0];
      if (!nextJob) break;

      if (nextJob.nextRunAt > now) {
        scheduleWorker(nextJob.nextRunAt - now);
        break;
      }

      state.jobs.shift();

      try {
        await sendOtpEmail({
          to: nextJob.to,
          code: nextJob.code,
          purpose: nextJob.purpose,
        });
      } catch (error) {
        if (nextJob.attempt < MAX_RETRIES) {
          const nextAttempt = nextJob.attempt + 1;
          state.jobs.push({
            ...nextJob,
            attempt: nextAttempt,
            nextRunAt: Date.now() + getRetryDelayMs(nextAttempt),
          });
          continue;
        }

        console.error("OTP email queue drop job after max retries:", {
          to: nextJob.to,
          purpose: nextJob.purpose,
          error,
        });
      }
    }
  } finally {
    state.running = false;

    if (state.jobs.length > 0) {
      const nextJob = state.jobs.reduce((earliest, current) =>
        current.nextRunAt < earliest.nextRunAt ? current : earliest,
      );
      scheduleWorker(Math.max(0, nextJob.nextRunAt - Date.now()));
    }
  }
}

export function enqueueOtpEmailJob(input: {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
}) {
  const state = getQueueState();

  if (state.jobs.length >= MAX_QUEUE_SIZE) {
    throw new Error("OTP_EMAIL_QUEUE_FULL");
  }

  state.jobs.push({
    to: input.to.trim().toLowerCase(),
    code: input.code,
    purpose: input.purpose,
    attempt: 1,
    nextRunAt: Date.now(),
  });

  scheduleWorker();
}
