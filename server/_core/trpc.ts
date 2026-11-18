import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const role = (ctx.user?.role || "").toLowerCase();
    if (!ctx.user || (role !== 'admin' && role !== 'super_admin')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const role = (ctx.user?.role || "").toLowerCase();
    if (!ctx.user || role !== 'super_admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Super Administrator privileges required." });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const retailProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const role = (ctx.user?.role || "").toLowerCase();
    if (!ctx.user || (role !== 'retail_shop_handler' && role !== 'super_admin')) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Retail staff privileges required." });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

