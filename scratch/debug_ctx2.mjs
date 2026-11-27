import { createContext } from "../server/_core/context.ts";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "../server/_core/sdk.ts";
import * as db from "../server/db.ts";
import { ENV } from "../server/_core/env.ts";

async function run() {
  const user = db.usersRepo.getByEmail("admin@trinayaa.in");
  const token = await sdk.signSession({
    openId: user.id,
    appId: ENV.appId,
    name: user.name,
  });

  const req = {
    headers: {
      cookie: `${COOKIE_NAME}=${token}`,
    },
    path: "/api/trpc/auth.me",
  };

  try {
    const authed = await sdk.authenticateRequest(req);
    console.log("authed:", authed);
    console.log("db.usersRepo:", typeof db.usersRepo);
    const dbUser = db.usersRepo.getById(String(authed.id || authed.openId));
    console.log("dbUser:", dbUser);
  } catch (e) {
    console.log("error:", e);
  }

  // Now check createContext
  try {
    const ctx = await createContext({ req, res: {} });
    console.log("ctx.user:", ctx.user);
  } catch (e) {
    console.log("ctx error:", e);
  }
}

run();

