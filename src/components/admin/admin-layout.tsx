"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = api.auth.getSession.useQuery();
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess: () => {
      document.cookie = "session_token=; Path=/; Max-Age=0";
      router.push("/auth/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Digital Menu Management</h1>
          <div className="flex items-center gap-4">
            {session?.user && (
              <span className="text-sm text-gray-600">
                {session.user.name} ({session.user.email})
              </span>
            )}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}

