import { sdk } from "../server/_core/sdk.ts";
import * as db from "../server/db.ts";
import { ENV } from "../server/_core/env.ts";
import { COOKIE_NAME } from "@shared/const";

async function testAuth() {
  console.log("ENV.appId:", ENV.appId);
  const user = db.usersRepo.getByEmail("admin@trinayaa.in");
  console.log("User:", user.id, user.email, user.name, user.role);

  // Mint token exactly like adminLogin does
  const token = await sdk.signSession({
    openId: user.id,
    appId: ENV.appId,
    name: user.name,
  });
  console.log("Minted token:", token);

  // Simulate request with Cookie
  const reqWithCookie = {
    headers: {
      cookie: `${COOKIE_NAME}=${token}`,
    },
    path: "/api/trpc/auth.me",
  };

  try {
    const authed1 = await sdk.authenticateRequest(reqWithCookie);
    console.log("1. authed from Cookie:", authed1);
  } catch (err) {
    console.error("1. Error authed from Cookie:", err);
  }

  // Simulate request with Authorization header
  const reqWithAuthHeader = {
    headers: {
      authorization: `Bearer ${token}`,
    },
    path: "/api/trpc/auth.me",
  };

  try {
    const authed2 = await sdk.authenticateRequest(reqWithAuthHeader);
    console.log("2. authed from Auth Header:", authed2);
  } catch (err) {
    console.error("2. Error authed from Auth Header:", err);
  }

  // Now test createContext with opts
  const { createContext } = await import("../server/_core/context.ts");
  const ctx = await createContext({ req: reqWithCookie, res: {} });
  console.log("3. Context user:", ctx.user ? { id: ctx.user.id, email: ctx.user.email, role: ctx.user.role } : null);
}

testAuth().catch(console.error);

