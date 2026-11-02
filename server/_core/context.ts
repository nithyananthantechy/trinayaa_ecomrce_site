import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authed = await sdk.authenticateRequest(opts.req);
    if (authed) {
      const dbUser = db.usersRepo.getById(String(authed.id || (authed as any).openId)) ||
                     db.usersRepo.getByEmail((authed as any).email || "");
      if (dbUser) {
        user = dbUser;
      } else {
        user = authed as any;
      }
    }
  } catch (error) {
    // If not authed via sdk, check if custom token or fallback
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
