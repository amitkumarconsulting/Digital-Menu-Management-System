import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "~/server/db";
import { getServerSession } from "~/server/auth";

export function createContext(opts: { headers: Headers }) {
  return {
    db,
    headers: opts.headers,
  };
}

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const session = await getServerSession();

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
      user: session.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

