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

  const activeCategoryData = menuData.categories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      {/* Restaurant Header */}
      <header className="sticky top-0 z-40 bg-[#8B4513] text-white shadow-md">
        <div className="px-4 py-4 text-center">
          <h1 className="text-2xl font-bold">{menuData.restaurant.name}</h1>
        </div>
      </header>

      {/* Fixed Category Header */}
      {activeCategoryData && (
        <div className="sticky top-[73px] z-30 bg-[#f5f3f0] px-4 py-3 shadow-sm">
          <h2 className="text-xl font-bold text-red-600">{activeCategoryData.name}</h2>
        </div>
      )}

      {/* Menu Items */}
      <div className="pb-24">
        {menuData.categories.map((category) => (
          <div
            key={category.id}
            ref={(el) => {
              categoryRefs.current[category.id] = el;
            }}
            className="category-section"
          >
            {category.dishes.length > 0 && (
              <>
                <div className="px-4 pt-6">
                  <h2 className="text-xl font-bold text-red-600">{category.name}</h2>
                </div>
                <div className="px-4 py-4">
                  {category.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="mb-6 flex gap-4 rounded-lg bg-white p-4 shadow-sm"
                    >
                      {dish.image && (
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={dish.image}
                            alt={dish.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{dish.name}</h3>
                          {dish.price !== null && (
                            <span className="text-lg font-bold">₹ {dish.price}</span>
                          )}
                        </div>
                        {dish.spiceLevel !== null && (
                          <p className="text-xs text-muted-foreground">
                            Spice Level: {dish.spiceLevel}/5
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                          {dish.description}
                        </p>
                        {dish.description.length > 100 && (
                          <button className="mt-1 text-sm text-blue-600 hover:underline">
                            ...read more
                          </button>
                        )}
                      </div>
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
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-6 py-3 text-white shadow-lg hover:bg-red-700"
            size="lg"
          >
            <Menu className="mr-2 h-5 w-5" />
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Menu Categories</SheetTitle>
            <SheetDescription>
              Select a category to navigate to it
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {menuData.categories.map((category) => (
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

