import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const dishRouter = createTRPCRouter({
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

      return await ctx.db.dish.findMany({
        where: { restaurantId: input.restaurantId },
        include: {
          dishCategories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        restaurantId: z.string(),
        name: z.string().min(1),
        description: z.string().min(1),
        image: z.string().url().optional(),
        isVegetarian: z.boolean().default(true),
        spiceLevel: z.number().int().min(0).max(3).optional(),
        price: z.number().positive().optional(),
        categoryIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...dishData } = input;

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

      // Verify categories belong to restaurant
      if (categoryIds && categoryIds.length > 0) {
        const categories = await ctx.db.category.findMany({
          where: {
            id: { in: categoryIds },
            restaurantId: input.restaurantId,
          },
        });

        if (categories.length !== categoryIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some categories not found or don't belong to this restaurant",
          });
        }
      }

      const dish = await ctx.db.dish.create({
        data: {
          ...dishData,
          ...(categoryIds && categoryIds.length > 0
            ? {
                dishCategories: {
                  create: categoryIds.map((categoryId) => ({
                    categoryId,
                  })),
                },
              }
            : {}),
        },
        include: {
          dishCategories: {
            include: {
              category: true,
            },
          },
        },
      });

      return dish;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        image: z.string().url().optional().nullable(),
        isVegetarian: z.boolean().optional(),
        spiceLevel: z.number().int().min(0).max(3).optional().nullable(),
        price: z.number().positive().optional().nullable(),
        categoryIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...updateData } = input;

      // Verify ownership through restaurant
      const dish = await ctx.db.dish.findFirst({
        where: { id },
        include: { restaurant: true },
      });

      if (!dish || dish.restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      // Update categories if provided
      if (categoryIds !== undefined) {
        // Verify categories belong to restaurant
        if (categoryIds.length > 0) {
          const categories = await ctx.db.category.findMany({
            where: {
              id: { in: categoryIds },
              restaurantId: dish.restaurantId,
            },
          });

          if (categories.length !== categoryIds.length) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Some categories not found or don't belong to this restaurant",
            });
          }
        }

        // Delete old category associations
        await ctx.db.dishCategory.deleteMany({
          where: { dishId: id },
        });

        // Create new category associations
        if (categoryIds.length > 0) {
          await ctx.db.dishCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              dishId: id,
              categoryId,
            })),
          });
        }
      }

      return await ctx.db.dish.update({
        where: { id },
        data: updateData,
        include: {
          dishCategories: {
            include: {
              category: true,
            },
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through restaurant
      const dish = await ctx.db.dish.findFirst({
        where: { id: input.id },
        include: { restaurant: true },
      });

      if (!dish || dish.restaurant.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dish not found",
        });
      }

      await ctx.db.dish.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

