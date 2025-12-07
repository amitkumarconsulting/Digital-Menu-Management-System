"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "~/components/admin/admin-layout";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
import { Trash2, Edit, Plus, QrCode } from "lucide-react";

export default function RestaurantsPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<{ id: string; name: string; location: string } | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const { data: restaurants, refetch } = api.restaurant.getAll.useQuery();
  const createMutation = api.restaurant.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setName("");
      setLocation("");
    },
  });

  const updateMutation = api.restaurant.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingRestaurant(null);
      setName("");
      setLocation("");
    },
  });

  const deleteMutation = api.restaurant.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreate = () => {
    if (!name || !location) {
      alert("Please fill in all fields");
      return;
    }
    createMutation.mutate({ name, location });
  };

  const handleUpdate = () => {
    if (!editingRestaurant || !name || !location) {
      alert("Please fill in all fields");
      return;
    }
    updateMutation.mutate({ id: editingRestaurant.id, name, location });
  };

  const handleEdit = (restaurant: { id: string; name: string; location: string }) => {
    setEditingRestaurant(restaurant);
    setName(restaurant.name);
    setLocation(restaurant.location);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this restaurant?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreateNew = () => {
    setEditingRestaurant(null);
    setName("");
    setLocation("");
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Restaurants</h2>
            <p className="text-muted-foreground">Manage your restaurants</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRestaurant ? "Edit Restaurant" : "Add Restaurant"}
                </DialogTitle>
                <DialogDescription>
                  {editingRestaurant
                    ? "Update restaurant details"
                    : "Add a new restaurant to manage"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Restaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="123 Main St, City"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingRestaurant(null);
                      setName("");
                      setLocation("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingRestaurant ? handleUpdate : handleCreate}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingRestaurant ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {restaurants && restaurants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No restaurants yet</p>
              <Button className="mt-4" onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Restaurant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants?.map((restaurant) => (
              <Card key={restaurant.id}>
                <CardHeader>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardDescription>{restaurant.location}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/admin/restaurants/${restaurant.id}/menu`)}
                  >
                    Manage Menu
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push(`/admin/restaurants/${restaurant.id}/qr`)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(restaurant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(restaurant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

