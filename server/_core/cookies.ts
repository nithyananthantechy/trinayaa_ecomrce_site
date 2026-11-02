import type { CookieOptions, Request } from "express";

export function getSessionCookieOptions(req?: Request): CookieOptions {
  // If explicitly on local HTTP (not forwarded, not secure, and host is localhost)
  const isLocalHttp = Boolean(
    req &&
    (req.hostname === "localhost" || req.headers?.host?.includes("localhost") || req.headers?.host?.includes("127.0.0.1")) &&
    req.protocol === "http" &&
    !req.headers?.["x-forwarded-proto"]
  );

  if (isLocalHttp) {
    return { httpOnly: true, path: "/", sameSite: "lax", secure: false };
  }

  // Preview is public HTTPS in a cross-site frame even when the upstream request is HTTP.
  return { httpOnly: true, path: "/", sameSite: "none", secure: true };
}
