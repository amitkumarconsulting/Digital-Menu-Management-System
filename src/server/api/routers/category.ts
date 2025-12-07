import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getAllByRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify restaurant ownership
      const restaurant = await ctx.db.restaurant.findFirst({
        where: {
          id: input.restaurantId,
          userId: ctx.user.id,
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      return await ctx.db.category.findMany({
        where: { restaurantId: input.restaurantId },
        orderBy: { name: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        restaurantId: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify restaurant ownership
      const restaurant = await ctx.db.restaurant.findFirst({
        where: {
          id: input.restaurantId,
          userId: ctx.user.id,
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      return await ctx.db.category.create({
        data: {
          name: input.name,
          restaurantId: input.restaurantId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through restaurant
      const category = await ctx.db.category.findFirst({
        where: { id: input.id },
        include: { restaurant: true },
      });

      if (!category || category.restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return await ctx.db.category.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through restaurant
      const category = await ctx.db.category.findFirst({
        where: { id: input.id },
        include: { restaurant: true },
      });

      if (!category || category.restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      await ctx.db.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

