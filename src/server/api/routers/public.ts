import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const publicRouter = createTRPCRouter({
  getMenuByRestaurantId: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
        include: {
          categories: {
            include: {
              dishCategories: {
                include: {
                  dish: {
                    include: {
                      dishCategories: {
                        include: {
                          category: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { name: "asc" },
          },
          dishes: {
            include: {
              dishCategories: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      // Organize dishes by category
      const categoriesWithDishes = restaurant.categories.map((category) => ({
        id: category.id,
        name: category.name,
        dishes: category.dishCategories.map((dc) => dc.dish),
      }));

      return {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          location: restaurant.location,
        },
        categories: categoriesWithDishes,
        allDishes: restaurant.dishes,
      };
    }),
});

