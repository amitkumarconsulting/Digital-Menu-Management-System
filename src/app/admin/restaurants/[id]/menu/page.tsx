"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "~/components/admin/admin-layout";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editingDish, setEditingDish] = useState<{
    id: string;
    name: string;
    description: string;
    image?: string | null;
    spiceLevel?: number | null;
    price?: number | null;
    categoryIds: string[];
  } | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishImage, setDishImage] = useState("");
  const [dishSpiceLevel, setDishSpiceLevel] = useState<number | undefined>();
  const [dishPrice, setDishPrice] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const { data: restaurant } = api.restaurant.getById.useQuery({ id: restaurantId });
  const { data: categories, refetch: refetchCategories } = api.category.getAllByRestaurant.useQuery({
    restaurantId,
  });
  const { data: dishes, refetch: refetchDishes } = api.dish.getAllByRestaurant.useQuery({
    restaurantId,
  });

  const createCategoryMutation = api.category.create.useMutation({
    onSuccess: () => {
      refetchCategories();
      setCategoryDialogOpen(false);
      setCategoryName("");
    },
  });

  const updateCategoryMutation = api.category.update.useMutation({
    onSuccess: () => {
      refetchCategories();
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryName("");
    },
  });

  const deleteCategoryMutation = api.category.delete.useMutation({
    onSuccess: () => {
      refetchCategories();
      refetchDishes();
    },
  });

  const createDishMutation = api.dish.create.useMutation({
    onSuccess: () => {
      refetchDishes();
      setDishDialogOpen(false);
      resetDishForm();
    },
  });

  const updateDishMutation = api.dish.update.useMutation({
    onSuccess: () => {
      refetchDishes();
      setDishDialogOpen(false);
      setEditingDish(null);
      resetDishForm();
    },
  });

  const deleteDishMutation = api.dish.delete.useMutation({
    onSuccess: () => {
      refetchDishes();
    },
  });

  const resetDishForm = () => {
    setDishName("");
    setDishDescription("");
    setDishImage("");
    setDishSpiceLevel(undefined);
    setDishPrice("");
    setSelectedCategoryIds([]);
  };

  const handleCreateCategory = () => {
    if (!categoryName) {
      alert("Please enter a category name");
      return;
    }
    createCategoryMutation.mutate({ restaurantId, name: categoryName });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !categoryName) {
      alert("Please enter a category name");
      return;
    }
    updateCategoryMutation.mutate({ id: editingCategory.id, name: categoryName });
  };

  const handleEditCategory = (category: { id: string; name: string }) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDialogOpen(true);
  };

  const handleCreateDish = () => {
    if (!dishName || !dishDescription) {
      alert("Please fill in name and description");
      return;
    }
    createDishMutation.mutate({
      restaurantId,
      name: dishName,
      description: dishDescription,
      image: dishImage || undefined,
      spiceLevel: dishSpiceLevel,
      price: dishPrice ? parseFloat(dishPrice) : undefined,
      categoryIds: selectedCategoryIds,
    });
  };

  const handleUpdateDish = () => {
    if (!editingDish || !dishName || !dishDescription) {
      alert("Please fill in name and description");
      return;
    }
    updateDishMutation.mutate({
      id: editingDish.id,
      name: dishName,
      description: dishDescription,
      image: dishImage || null,
      spiceLevel: dishSpiceLevel ?? null,
      price: dishPrice ? parseFloat(dishPrice) : null,
      categoryIds: selectedCategoryIds,
    });
  };

  const handleEditDish = (dish: NonNullable<typeof dishes>[0]) => {
    setEditingDish({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      image: dish.image,
      spiceLevel: dish.spiceLevel,
      price: dish.price,
      categoryIds: dish.dishCategories.map((dc) => dc.categoryId),
    });
    setDishName(dish.name);
    setDishDescription(dish.description);
    setDishImage(dish.image || "");
    setDishSpiceLevel(dish.spiceLevel ?? undefined);
    setDishPrice(dish.price?.toString() || "");
    setSelectedCategoryIds(dish.dishCategories.map((dc) => dc.categoryId));
    setDishDialogOpen(true);
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/admin/restaurants")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold">{restaurant?.name}</h2>
            <p className="text-muted-foreground">Manage menu categories and dishes</p>
          </div>
        </div>

        {/* Categories Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? "Update category name"
                      : "Create a new category for dishes"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g., Starters, Main Course"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCategoryDialogOpen(false);
                        setEditingCategory(null);
                        setCategoryName("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {editingCategory ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {categories && categories.length === 0 ? (
              <p className="text-muted-foreground">No categories yet. Add one to get started.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories?.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <span>{category.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        if (confirm(`Delete category "${category.name}"?`)) {
                          deleteCategoryMutation.mutate({ id: category.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dishes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dishes</CardTitle>
            <Dialog open={dishDialogOpen} onOpenChange={setDishDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingDish(null);
                    resetDishForm();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDish ? "Edit Dish" : "Add Dish"}</DialogTitle>
                  <DialogDescription>
                    {editingDish ? "Update dish details" : "Add a new dish to the menu"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dishName">Dish Name *</Label>
                    <Input
                      id="dishName"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="e.g., Apple Pie"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dishDescription">Description *</Label>
                    <Textarea
                      id="dishDescription"
                      value={dishDescription}
                      onChange={(e) => setDishDescription(e.target.value)}
                      placeholder="Describe the dish..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dishImage">Image URL</Label>
                    <Input
                      id="dishImage"
                      value={dishImage}
                      onChange={(e) => setDishImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dishPrice">Price (₹)</Label>
                      <Input
                        id="dishPrice"
                        value={dishPrice}
                        onChange={(e) => setDishPrice(e.target.value.replace(/\D/g, ""))}
                        placeholder="140"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dishSpiceLevel">Spice Level (0-5)</Label>
                      <Select
                        value={dishSpiceLevel?.toString() ?? ""}
                        onValueChange={(value) =>
                          setDishSpiceLevel(value ? parseInt(value) : undefined)
                        }
                      >
                        <SelectTrigger id="dishSpiceLevel">
                          <SelectValue placeholder="Select spice level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - No Spice</SelectItem>
                          <SelectItem value="1">1 - Mild</SelectItem>
                          <SelectItem value="2">2 - Medium</SelectItem>
                          <SelectItem value="3">3 - Hot</SelectItem>
                          <SelectItem value="4">4 - Very Hot</SelectItem>
                          <SelectItem value="5">5 - Extremely Hot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <div className="space-y-2 rounded-md border p-3">
                      {categories && categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No categories available. Create a category first.
                        </p>
                      ) : (
                        categories?.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(category.id)}
                              onChange={() => toggleCategorySelection(category.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{category.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDishDialogOpen(false);
                        setEditingDish(null);
                        resetDishForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingDish ? handleUpdateDish : handleCreateDish}
                      disabled={createDishMutation.isPending || updateDishMutation.isPending}
                    >
                      {editingDish ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {dishes && dishes.length === 0 ? (
              <p className="text-muted-foreground">No dishes yet. Add one to get started.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dishes?.map((dish) => (
                  <Card key={dish.id}>
                    {dish.image && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={dish.image}
                          alt={dish.name}
                          fill
                          className="rounded-t-lg object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{dish.name}</CardTitle>
                      {dish.price !== null && (
                        <p className="text-lg font-semibold">₹ {dish.price}</p>
                      )}
                      {dish.spiceLevel !== null && (
                        <p className="text-sm text-muted-foreground">
                          Spice Level: {dish.spiceLevel}/5
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dish.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {dish.dishCategories.map((dc) => (
                          <span
                            key={dc.id}
                            className="rounded-full bg-secondary px-2 py-1 text-xs"
                          >
                            {dc.category.name}
                          </span>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditDish(dish)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete dish "${dish.name}"?`)) {
                            deleteDishMutation.mutate({ id: dish.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

