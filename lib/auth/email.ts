import { OTP_EXPIRES_MINUTES } from "@/lib/auth/config";
import nodemailer from "nodemailer";

type SendOtpEmailInput = {
  to: string;
  code: string;
  purpose: "register" | "password_reset";
};

type EmailConfig =
  | {
      provider: "smtp";
      from: string;
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
    }
  | {
      provider: "resend";
      from: string;
      apiKey: string;
    }
  | null;

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER ?? "smtp").trim().toLowerCase();
  const from = process.env.EMAIL_FROM?.trim();

  if (!from) return null;

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) return null;

    return {
      provider: "resend",
      from,
      apiKey,
    };
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const rawPort = process.env.SMTP_PORT?.trim();

  if (!host || !user || !pass) return null;

  const port =
    rawPort && Number.isFinite(Number(rawPort))
      ? Number(rawPort)
      : parseBoolean(process.env.SMTP_SECURE, false)
        ? 465
        : 587;

  return {
    provider: "smtp",
    from,
    host,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE, port === 465),
    user,
    pass,
  };
}

export function assertEmailDeliveryConfigured() {
  const config = getEmailConfig();
  if (config) return;

  if (process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_CONFIG_MISSING");
  }
}

function buildOtpTemplate(code: string, purpose: SendOtpEmailInput["purpose"]) {
  const isPasswordReset = purpose === "password_reset";
  const subject = isPasswordReset
    ? "Kode OTP Reset Password Microdata Store"
    : "Kode OTP Verifikasi Microdata Store";
  const intro = isPasswordReset
    ? "Gunakan kode OTP berikut untuk reset password akun Anda:"
    : "Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun Anda:";

  const text = [
    "Halo,",
    "",
    `${isPasswordReset ? "Kode OTP reset password" : "Kode OTP verifikasi"} Anda: ${code}`,
    `Kode ini berlaku selama ${OTP_EXPIRES_MINUTES} menit.`,
    "",
    "Jika Anda tidak meminta kode ini, abaikan email ini.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">${
        isPasswordReset ? "Reset Password" : "Verifikasi Email"
      }</h2>
      <p style="margin-top: 0;">${intro}</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; margin: 20px 0; color: #ea580c;">
        ${code}
      </div>
      <p style="margin-bottom: 0;">Kode berlaku selama <strong>${OTP_EXPIRES_MINUTES} menit</strong>.</p>
      <p style="color: #6b7280; font-size: 12px;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendViaSmtp(input: {
  config: Extract<EmailConfig, { provider: "smtp" }>;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    host: input.config.host,
    port: input.config.port,
    secure: input.config.secure,
    auth: {
      user: input.config.user,
      pass: input.config.pass,
    },
  });

  try {
    await transporter.sendMail({
      from: input.config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch {
    throw new Error("EMAIL_SEND_FAILED");
  }
}

async function sendViaResend(input: {
  config: Extract<EmailConfig, { provider: "resend" }>;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.config.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      throw new Error("RESEND_SEND_FAILED");
    }
  } catch {
    throw new Error("EMAIL_SEND_FAILED");
  }
}

export async function sendOtpEmail({ to, code, purpose }: SendOtpEmailInput) {
  const config = getEmailConfig();
  const template = buildOtpTemplate(code, purpose);

  if (config?.provider === "smtp") {
    await sendViaSmtp({
      config,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    return;
  }

  if (config?.provider === "resend") {
    await sendViaResend({
      config,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_CONFIG_MISSING");
  }

  console.info(
    `[DEV OTP] purpose=${purpose} to=${to} code=${code} expiresIn=${OTP_EXPIRES_MINUTES}m`,
  );
}
