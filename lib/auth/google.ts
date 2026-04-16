import { AuthProvider, UserStatus } from "@prisma/client";

import { getGoogleOAuthConfig } from "@/lib/auth/config";
import { normalizeEmail } from "@/lib/auth/normalize";
import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type VerifiedGoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: true;
  name?: string;
  picture?: string;
};

type ExchangeGoogleCodeResult = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  tokenType: string | null;
  scope: string | null;
  expiresAt: Date | null;
};

type GoogleAuthUserResult = {
  id: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: UserStatus;
};

export function createGoogleAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "offline",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) {
    const errorCode = payload.error ?? "TOKEN_EXCHANGE_FAILED";
    throw new Error(`GOOGLE_OAUTH:${errorCode}`);
  }

  const expiresAt =
    typeof payload.expires_in === "number" && Number.isFinite(payload.expires_in)
      ? new Date(Date.now() + payload.expires_in * 1000)
      : null;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    idToken: payload.id_token ?? null,
    tokenType: payload.token_type ?? null,
    scope: payload.scope ?? null,
    expiresAt,
  } satisfies ExchangeGoogleCodeResult;
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as GoogleUserInfo;
  if (!response.ok || !payload.sub || !payload.email || !payload.email_verified) {
    throw new Error("GOOGLE_OAUTH:INVALID_GOOGLE_PROFILE");
  }

  return payload as VerifiedGoogleUserInfo;
}

function getFallbackFullName(email: string, name: string | undefined) {
  const candidate = name?.trim();
  if (candidate) return candidate.slice(0, 120);
  const usernamePart = email.split("@")[0] ?? "Pengguna";
  return usernamePart.slice(0, 120) || "Pengguna";
}

export async function upsertGoogleAuthUser(input: {
  profile: VerifiedGoogleUserInfo;
  token: ExchangeGoogleCodeResult;
}) {
  const googleEmail = input.profile.email;
  if (!googleEmail) {
    throw new Error("GOOGLE_OAUTH:INVALID_GOOGLE_PROFILE");
  }

  const emailNormalized = normalizeEmail(googleEmail);
  const providerAccountId = input.profile.sub;
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existingAccount = await tx.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.GOOGLE,
          providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      if (
        existingAccount.user.status === UserStatus.SUSPENDED ||
        existingAccount.user.status === UserStatus.DELETED
      ) {
        throw new Error("GOOGLE_OAUTH:ACCOUNT_BLOCKED");
      }

      const updatedUser = await tx.user.update({
        where: { id: existingAccount.userId },
        data: {
          email: googleEmail,
          emailNormalized,
          fullName: getFallbackFullName(
            googleEmail,
            input.profile.name ?? existingAccount.user.fullName,
          ),
          avatarUrl: input.profile.picture ?? existingAccount.user.avatarUrl,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: existingAccount.user.emailVerifiedAt ?? now,
          lastLoginAt: now,
          deletedAt: null,
        },
        select: {
          id: true,
          role: true,
          status: true,
        },
      });

      await tx.authAccount.update({
        where: { id: existingAccount.id },
        data: {
          providerEmail: googleEmail,
          accessToken: input.token.accessToken,
          refreshToken: input.token.refreshToken,
          idToken: input.token.idToken,
          tokenType: input.token.tokenType,
          scope: input.token.scope,
          expiresAt: input.token.expiresAt,
        },
      });

      return updatedUser satisfies GoogleAuthUserResult;
    }

    const existingUser = await tx.user.findUnique({
      where: { emailNormalized },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (
      existingUser?.status === UserStatus.SUSPENDED ||
      existingUser?.status === UserStatus.DELETED
    ) {
      throw new Error("GOOGLE_OAUTH:ACCOUNT_BLOCKED");
    }

    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            email: googleEmail,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: now,
            lastLoginAt: now,
            deletedAt: null,
            avatarUrl: input.profile.picture ?? undefined,
          },
          select: {
            id: true,
            role: true,
            status: true,
          },
        })
      : await tx.user.create({
          data: {
            email: googleEmail,
            emailNormalized,
            fullName: getFallbackFullName(googleEmail, input.profile.name),
            avatarUrl: input.profile.picture ?? null,
            role: "USER",
            status: UserStatus.ACTIVE,
            emailVerifiedAt: now,
            lastLoginAt: now,
          },
          select: {
            id: true,
            role: true,
            status: true,
          },
        });

    await tx.authAccount.create({
      data: {
        userId: user.id,
        provider: AuthProvider.GOOGLE,
        providerAccountId,
        providerEmail: googleEmail,
        accessToken: input.token.accessToken,
        refreshToken: input.token.refreshToken,
        idToken: input.token.idToken,
        tokenType: input.token.tokenType,
        scope: input.token.scope,
        expiresAt: input.token.expiresAt,
      },
    });

    return user satisfies GoogleAuthUserResult;
  });
}
