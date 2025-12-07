"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Menu } from "lucide-react";

export default function MenuPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  
  const { data: menuData, isLoading } = api.public.getMenuByRestaurantId.useQuery({
    restaurantId,
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (menuData?.categories && menuData.categories.length > 0) {
      setActiveCategory(menuData.categories[0]?.id ?? null);
    }
  }, [menuData]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; 

      // Find which category section is currently in view
      for (const category of menuData?.categories ?? []) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveCategory(category.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuData]);

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveCategory(categoryId);
      setIsSheetOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Restaurant not found</p>
      </div>
    );
  }

  const activeCategoryData = menuData.categories.find((c: { id: string }) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      {/* Restaurant Header */}
      <header className="sticky top-0 z-40 bg-[#8B4513] text-white shadow-md">
        <div className="px-4 py-3 text-left sm:px-6 sm:py-4">
          <h1 className="text-lg font-bold sm:text-2xl">{menuData.restaurant.name}</h1>
          {menuData.restaurant.location && (
            <p className="text-sm text-white/90 sm:text-base">{menuData.restaurant.location}</p>
          )}
        </div>
      </header>

      {/* Fixed Category Header */}
      {activeCategoryData && (
        <div className="sticky top-[73px] z-30 bg-[#f5f3f0] px-4 py-2 shadow-sm sm:top-[89px] sm:py-3">
          <h2 className="text-lg font-bold text-red-600 sm:text-xl">{activeCategoryData.name}</h2>
        </div>
      )}

      {/* Menu Items */}
      <div className="pb-24">
        {menuData.categories.map((category: { 
          id: string; 
          name: string; 
          dishes: Array<{ 
            id: string; 
            name: string; 
            description: string; 
            image: string | null; 
            isVegetarian: boolean; 
            spiceLevel: number | null; 
            price: number | null 
          }> 
        }) => (
          <div
            key={category.id}
            ref={(el) => {
              categoryRefs.current[category.id] = el;
            }}
            className="category-section"
          >
            {category.dishes.length > 0 && (
              <>
                <div className="px-4 pt-4 sm:pt-6">
                  <h2 className="text-lg font-bold text-red-600 sm:text-xl">{category.name}</h2>
                </div>
                <div className="px-4 py-3 sm:py-4">
                  {category.dishes.map((dish: { id: string; name: string; description: string; image: string | null; isVegetarian: boolean; spiceLevel: number | null; price: number | null }) => (
                    <div
                      key={dish.id}
                      className="mb-4 flex gap-3 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:gap-4 sm:p-4"
                    >
                      <div className="flex-1 min-w-0 relative">
                        {/* Indicators - Top Left: Veg/Non-Veg circle + Spice level chilis */}
                        <div className="absolute top-0 left-0 z-10 flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 flex-shrink-0 rounded-full sm:w-3 sm:h-3 ${
                              dish.isVegetarian ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={dish.isVegetarian ? "Vegetarian" : "Non-Vegetarian"}
                          ></span>
                          {dish.spiceLevel !== null && dish.spiceLevel > 0 && (
                            <>
                              {Array.from({ length: dish.spiceLevel }).map((_, i) => (
                                <span key={i} className="text-red-500 text-xs sm:text-sm">🌶️</span>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Content with top padding to avoid overlap with indicators */}
                        <div className="pt-6 sm:pt-7">
                          {/* Dish Name */}
                          <h3 className="text-sm font-semibold sm:text-base mb-1">{dish.name}</h3>
                          
                          {/* Price */}
                          {dish.price !== null && (
                            <p className="text-base font-bold mb-2 sm:text-lg">₹ {dish.price}</p>
                          )}
                          
                          {/* Description */}
                          <p className="text-xs text-gray-700 line-clamp-3 sm:text-sm">
                            {dish.description}
                          </p>
                          {dish.description.length > 100 && (
                            <button className="mt-1 text-xs text-blue-600 hover:underline sm:text-sm">
                              ...read more
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Image on Right with Curved Border */}
                      {dish.image && (
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
                          <Image
                            src={dish.image}
                            alt={dish.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Floating Menu Button */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg hover:bg-red-700 sm:bottom-6 sm:px-6 sm:py-3 sm:text-base"
            size="lg"
          >
            <Menu className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Menu Categories</SheetTitle>
            <SheetDescription>
              Select a category to navigate to it
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {menuData.categories.map((category: { 
          id: string; 
          name: string; 
          dishes: Array<{ 
            id: string; 
            name: string; 
            description: string; 
            image: string | null; 
            isVegetarian: boolean; 
            spiceLevel: number | null; 
            price: number | null 
          }> 
        }) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  activeCategory === category.id
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-red-600">{category.name}</h3>
                    <p className="text-sm text-gray-600">
                      {category.dishes.length} item{category.dishes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

