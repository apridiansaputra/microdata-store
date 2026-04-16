import { NextRequest, NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/auth/config";

const USER_SESSION_COOKIE = getSessionCookieName("user");
const ADMIN_SESSION_COOKIE = getSessionCookieName("admin");

const ADMIN_PREFIXES = [
  "/dashboard",
  "/orders",
  "/products-admin",
  "/product-admin",
  "/negotiations",
  "/settings",
];

const USER_PREFIXES = ["/account", "/checkout"];

function hasPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => {
    if (pathname === prefix) return true;
    return pathname.startsWith(`${prefix}/`);
  });
}

function createRedirectUrl(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.searchParams.set("next", nextPath);
  return url;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userSessionToken = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (hasPrefix(pathname, ADMIN_PREFIXES)) {
    if (!adminSessionToken) {
      return NextResponse.redirect(createRedirectUrl(request, "/admin/login"));
    }
    return NextResponse.next();
  }

  if (hasPrefix(pathname, USER_PREFIXES)) {
    if (!userSessionToken) {
      return NextResponse.redirect(createRedirectUrl(request, "/login"));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/products-admin/:path*",
    "/product-admin/:path*",
    "/negotiations/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/checkout/:path*",
  ],
};
