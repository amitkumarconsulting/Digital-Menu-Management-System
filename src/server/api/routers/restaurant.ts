import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const restaurantRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.restaurant.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      return restaurant;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        location: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.restaurant.create({
        data: {
          name: input.name,
          location: input.location,
          userId: ctx.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        location: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const restaurant = await ctx.db.restaurant.findFirst({
        where: { id, userId: ctx.user.id },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      return await ctx.db.restaurant.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const restaurant = await ctx.db.restaurant.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      await ctx.db.restaurant.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

